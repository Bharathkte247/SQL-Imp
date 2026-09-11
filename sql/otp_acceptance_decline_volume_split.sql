-- OTP Acceptance & Decline Details — ClickHouse volume split
-- Source: ua.voice_node_report
-- Scope: calls that hit ESP1_U1PremierReservations or ESP1_U1PremierReservations2
--         with finalized nodes, date > 2026-05-31

WITH
newbase AS (
    SELECT
        *,
        row_number() OVER (
            PARTITION BY call_interaction_id
            ORDER BY node_sequence_number
        ) AS newnodesequence
    FROM ua.voice_node_report
    WHERE node_state IN ('finalized')
      AND call_interaction_id IN (
            SELECT call_interaction_id
            FROM ua.voice_node_report
            WHERE node_name IN (
                'ESP1_U1PremierReservations',
                'ESP1_U1PremierReservations2'
            )
        )
      AND toDate(date) > toDate('2026-05-31')
),

call_paths AS (
    SELECT
        call_interaction_id,
        arraySort(
            groupArray(
                tuple(
                    toUInt32(newnodesequence),
                    node_name,
                    coalesce(toString(return_event), '')
                )
            )
        ) AS evts
    FROM newbase
    GROUP BY call_interaction_id
),

call_arrays AS (
    SELECT
        call_interaction_id,
        arrayMap(x -> x.2, evts) AS node_names,
        arrayMap(x -> x.3, evts) AS return_events
    FROM call_paths
),

classified AS (
    SELECT
        call_interaction_id,
        node_names,

        has(node_names, 'ESP1_U1PremierReservations')  AS hit_l1a,
        has(node_names, 'ESP1_U1PremierReservations2') AS hit_l1b,
        indexOf(node_names, 'ESP1_U1PremierReservations')  AS idx_l1a,
        indexOf(node_names, 'ESP1_U1PremierReservations2') AS idx_l1b,

        -- IMPORTANT: use trimBoth(), not trim(BOTH ' ' FROM ...) — CH parse error
        if(
            indexOf(node_names, 'ESP1_U1PremierReservationsLogic') > 0,
            lowerUTF8(trimBoth(return_events[indexOf(node_names, 'ESP1_U1PremierReservationsLogic')])),
            ''
        ) AS l1a_offer_return,

        if(
            indexOf(node_names, 'ESP1_U1PremierMPLogic') > 0,
            lowerUTF8(trimBoth(return_events[indexOf(node_names, 'ESP1_U1PremierMPLogic')])),
            ''
        ) AS l1b_offer_return,

        if(idx_l1a > 0, has(arraySlice(node_names, idx_l1a), 'ESP1_U1PremierResNM'), 0) AS l1a_has_nm_after,
        if(idx_l1b > 0, has(arraySlice(node_names, idx_l1b), 'ESP1_U1PremierMPNM'), 0) AS l1b_has_nm_after,

        has(node_names, 'ESP1_U1OTPDeclinePremierRes')     AS has_decline_res,
        has(node_names, 'ESP1_U1OTPFailPremierRes')        AS has_fail_res,
        has(node_names, 'ESP1_U1PreOTPFlowResPreTransfer') AS has_transfer_res,
        has(node_names, 'ESP1_U1PreOTPFlowResPreJump')     AS has_jump_res,

        has(node_names, 'ESP1_U1OTPDeclinePremierMP')      AS has_decline_mp,
        has(node_names, 'ESP1_U1OTPFailPremierMP')         AS has_fail_mp,
        has(node_names, 'ESP1_U1PreOTPFlowMPPreTransfer')  AS has_transfer_mp,
        has(node_names, 'ESP1_U1PreOTPFlowMPPreJump')      AS has_jump_mp
    FROM call_arrays
    WHERE hit_l1a OR hit_l1b
),

journey AS (
    SELECT
        *,
        multiIf(
            hit_l1a AND l1a_offer_return = 'yes',   'L1.a.1 OTP Offer Accept',
            hit_l1a AND l1a_offer_return = 'no',    'L1.a.2 OTP Offer Reject',
            hit_l1a AND l1a_offer_return = 'agent', 'L1.a.3 OTP Offer Agent',
            hit_l1a AND l1a_has_nm_after = 1,       'L1.a.4 no match',
            hit_l1a,                               'L1.a Unknown offer outcome',

            hit_l1b AND l1b_offer_return = 'yes',   'L1.b.1 OTP Offer Accept',
            hit_l1b AND l1b_offer_return = 'no',    'L1.b.2 OTP Offer Reject',
            hit_l1b AND l1b_offer_return = 'agent', 'L1.b.3 OTP Offer Agent',
            hit_l1b AND l1b_has_nm_after = 1,       'L1.b.4 no match',
            'L1.b Unknown offer outcome'
        ) AS offer_journey,

        multiIf(
            hit_l1a AND l1a_offer_return = 'yes' AND has_decline_res  = 1, 'L1.a.1.i OTP Decline',
            hit_l1a AND l1a_offer_return = 'yes' AND has_fail_res     = 1, 'L1.a.1.ii OTP Unauthorized',
            hit_l1a AND l1a_offer_return = 'yes' AND has_jump_res     = 1, 'L1.a.1.iv OTP Res',
            hit_l1a AND l1a_offer_return = 'yes' AND has_transfer_res = 1, 'L1.a.1.iii OTP Transfer',
            hit_l1a AND l1a_offer_return = 'yes',                          'L1.a.1 Accept (incomplete/other)',

            hit_l1b AND l1b_offer_return = 'yes' AND has_decline_mp  = 1, 'L1.b.1.i OTP Decline',
            hit_l1b AND l1b_offer_return = 'yes' AND has_fail_mp     = 1, 'L1.b.1.ii OTP Unauthorized',
            hit_l1b AND l1b_offer_return = 'yes' AND has_jump_mp     = 1, 'L1.b.1.iv OTP Res',
            hit_l1b AND l1b_offer_return = 'yes' AND has_transfer_mp = 1, 'L1.b.1.iii OTP Transfer',
            hit_l1b AND l1b_offer_return = 'yes',                          'L1.b.1 Accept (incomplete/other)',
            CAST(NULL AS Nullable(String))
        ) AS accept_sub_journey,

        multiIf(hit_l1a, 'L1.a', hit_l1b, 'L1.b', 'none') AS offer_variant
    FROM classified
)

SELECT
    offer_variant,
    offer_journey,
    accept_sub_journey,
    count() AS call_volume,
    round(100.0 * count() / sum(count()) OVER (), 2) AS pct_of_calls
FROM journey
GROUP BY offer_variant, offer_journey, accept_sub_journey
ORDER BY offer_variant, call_volume DESC;
