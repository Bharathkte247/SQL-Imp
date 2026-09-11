-- OTP Acceptance & Decline Details — ClickHouse volume split
-- Schema inferred from SQL Lab export columns:
--   date, application_id, call_interaction_starttime, call_interaction_id,
--   node_time, node_sequence_number, node_type, node_name, node_state,
--   node_action, node_outcome, transition_type, transition_target, entity,
--   resource_name, return_event, newnodesequence
--
-- Replace `your_db.your_ivr_node_events` with the real table name.
-- Grain: 1 row per call_interaction_id that hit either L1 offer prompt.

WITH
params AS (
    SELECT
        toDate('2026-08-28') AS start_date,
        toDate('2026-08-28') AS end_date
),

-- Ordered node path per call
call_paths AS (
    SELECT
        call_interaction_id,
        any(application_id) AS application_id,
        any(call_interaction_starttime) AS call_interaction_starttime,
        arraySort(
            groupArray(
                tuple(
                    toUInt32OrZero(toString(newnodesequence)),
                    node_name,
                    ifNull(return_event, '')
                )
            )
        ) AS evts
    FROM your_db.your_ivr_node_events
    WHERE toDate(parseDateTimeBestEffortOrNull(toString(date))) BETWEEN (SELECT start_date FROM params) AND (SELECT end_date FROM params)
      -- optional: AND application_id = 'general'
    GROUP BY call_interaction_id
),

call_arrays AS (
    SELECT
        call_interaction_id,
        application_id,
        call_interaction_starttime,
        arrayMap(x -> x.2, evts) AS node_names,
        arrayMap(x -> x.3, evts) AS return_events
    FROM call_paths
),

classified AS (
    SELECT
        call_interaction_id,
        application_id,
        call_interaction_starttime,
        node_names,
        return_events,

        -- L1 presence
        has(node_names, 'ESP1_U1PremierReservations')  AS hit_l1a,
        has(node_names, 'ESP1_U1PremierReservations2') AS hit_l1b,

        indexOf(node_names, 'ESP1_U1PremierReservations')  AS idx_l1a,
        indexOf(node_names, 'ESP1_U1PremierReservations2') AS idx_l1b,

        -- Offer decision return_event (case-insensitive)
        -- L1.a uses ESP1_U1PremierReservationsLogic
        if(
            indexOf(node_names, 'ESP1_U1PremierReservationsLogic') > 0,
            lowerUTF8(trim(BOTH ' ' FROM return_events[indexOf(node_names, 'ESP1_U1PremierReservationsLogic')])),
            ''
        ) AS l1a_offer_return,

        -- L1.b uses ESP1_U1PremierMPLogic
        if(
            indexOf(node_names, 'ESP1_U1PremierMPLogic') > 0,
            lowerUTF8(trim(BOTH ' ' FROM return_events[indexOf(node_names, 'ESP1_U1PremierMPLogic')])),
            ''
        ) AS l1b_offer_return,

        -- No-match markers anywhere AFTER the L1 offer node
        if(
            idx_l1a > 0,
            has(arraySlice(node_names, idx_l1a), 'ESP1_U1PremierResNM'),
            0
        ) AS l1a_has_nm_after,

        if(
            idx_l1b > 0,
            has(arraySlice(node_names, idx_l1b), 'ESP1_U1PremierMPNM'),
            0
        ) AS l1b_has_nm_after,

        -- Accept sub-path markers (variant A / Res)
        has(node_names, 'ESP1_U1OTPDeclinePremierRes')      AS has_decline_res,
        has(node_names, 'ESP1_U1OTPFailPremierRes')         AS has_fail_res,
        has(node_names, 'ESP1_U1PreOTPFlowResPreTransfer')  AS has_transfer_res,
        has(node_names, 'ESP1_U1PreOTPFlowResPreJump')      AS has_jump_res,

        -- Accept sub-path markers (variant B / MP)
        has(node_names, 'ESP1_U1OTPDeclinePremierMP')       AS has_decline_mp,
        has(node_names, 'ESP1_U1OTPFailPremierMP')          AS has_fail_mp,
        has(node_names, 'ESP1_U1PreOTPFlowMPPreTransfer')   AS has_transfer_mp,
        has(node_names, 'ESP1_U1PreOTPFlowMPPreJump')       AS has_jump_mp
    FROM call_arrays
    WHERE hit_l1a OR hit_l1b
),

journey AS (
    SELECT
        *,
        -- Offer-level bucket (mutually exclusive within each variant)
        -- Priority: Yes/No/Agent from logic return_event, else No Match if NM after L1, else Unknown
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
            hit_l1b,                               'L1.b Unknown offer outcome',

            'Unclassified'
        ) AS offer_journey,

        -- Accept sub-journey (only populated when offer = Accept)
        -- Priority: Decline > Unauthorized > OTP Res (PreJump) > OTP Transfer (PreTransfer w/o Jump) > Other
        -- Note: taxonomy lists Res as PreTransfer -> PreJump; in practice successful Res path often
        -- hits PreJump without PreTransfer, so PreJump alone is treated as OTP Res.
        multiIf(
            -- Variant A
            hit_l1a AND l1a_offer_return = 'yes' AND has_decline_res  = 1, 'L1.a.1.i OTP Decline',
            hit_l1a AND l1a_offer_return = 'yes' AND has_fail_res     = 1, 'L1.a.1.ii OTP Unauthorized',
            hit_l1a AND l1a_offer_return = 'yes' AND has_jump_res     = 1, 'L1.a.1.iv OTP Res',
            hit_l1a AND l1a_offer_return = 'yes' AND has_transfer_res = 1, 'L1.a.1.iii OTP Transfer',
            hit_l1a AND l1a_offer_return = 'yes',                          'L1.a.1 Accept (incomplete/other)',

            -- Variant B
            hit_l1b AND l1b_offer_return = 'yes' AND has_decline_mp  = 1, 'L1.b.1.i OTP Decline',
            hit_l1b AND l1b_offer_return = 'yes' AND has_fail_mp     = 1, 'L1.b.1.ii OTP Unauthorized',
            hit_l1b AND l1b_offer_return = 'yes' AND has_jump_mp     = 1, 'L1.b.1.iv OTP Res',
            hit_l1b AND l1b_offer_return = 'yes' AND has_transfer_mp = 1, 'L1.b.1.iii OTP Transfer',
            hit_l1b AND l1b_offer_return = 'yes',                          'L1.b.1 Accept (incomplete/other)',

            NULL
        ) AS accept_sub_journey,

        multiIf(hit_l1a, 'L1.a ESP1_U1PremierReservations', hit_l1b, 'L1.b ESP1_U1PremierReservations2', 'none') AS offer_variant
    FROM classified
)

-- =========================
-- 1) Offer-level volume split
-- =========================
SELECT
    offer_variant,
    offer_journey,
    count() AS call_volume,
    round(100.0 * count() / sum(count()) OVER (), 2) AS pct_of_offer_calls
FROM journey
GROUP BY offer_variant, offer_journey
ORDER BY offer_variant, call_volume DESC

-- =========================
-- 2) Accept sub-journey volume split (uncomment to run)
-- =========================
-- SELECT
--     offer_variant,
--     offer_journey,
--     accept_sub_journey,
--     count() AS call_volume,
--     round(100.0 * count() / sum(count()) OVER (PARTITION BY offer_variant, offer_journey), 2) AS pct_of_accepts
-- FROM journey
-- WHERE accept_sub_journey IS NOT NULL
-- GROUP BY offer_variant, offer_journey, accept_sub_journey
-- ORDER BY offer_variant, call_volume DESC

-- =========================
-- 3) Combined detail (one row per call) — uncomment to run
-- =========================
-- SELECT
--     call_interaction_id,
--     application_id,
--     call_interaction_starttime,
--     offer_variant,
--     offer_journey,
--     accept_sub_journey,
--     l1a_offer_return,
--     l1b_offer_return,
--     l1a_has_nm_after,
--     l1b_has_nm_after
-- FROM journey
-- ORDER BY call_interaction_starttime, call_interaction_id
;
