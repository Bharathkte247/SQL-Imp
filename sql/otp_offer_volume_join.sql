-- OTP Offer volume + accept/reject/agent/no-match
-- + post-accept last-node outcomes (ClickHouse)
-- Grain: date + primary_node_name

WITH newbase AS (
    SELECT
        toDate(date) AS report_date,
        call_interaction_id,
        node_name,
        transition_target,
        return_event,
        row_number() OVER (
            PARTITION BY call_interaction_id
            ORDER BY node_sequence_number
        ) AS newnodesequence
    FROM ua.voice_node_report
    WHERE node_state IN ('finalized')
      AND toDate(date) = toDate('2026-08-28')
      AND node_name IN (
          'ESP1_U1PremierReservations',
          'ESP1_U1PremierReservations2',
          'ESP1_U1PremierReservationsLogic',
          'ESP1_U1PremierMPLogic',
          'ESP1_U1PremierResNM',
          'ESP1_U1PremierMPNM',
          'ESP1_U1OTPDeclinePremierRes',
          'ESP1_U1OTPDeclinePremierMP',
          'ESP1_U1OTPFailPremierRes',
          'ESP1_U1OTPFailPremierMP',
          'ESP1_U1PreOTPFlowResPreTransfer',
          'ESP1_U1PreOTPFlowMPPreTransfer',
          'ESP1_U1PreOTPFlowResPreJump',
          'ESP1_U1PreOTPFlowMPPreJump'
      )
      AND call_interaction_id GLOBAL IN (
          SELECT call_interaction_id
          FROM ua.voice_node_report
          WHERE node_name IN (
              'ESP1_U1PremierReservations',
              'ESP1_U1PremierReservations2'
          )
            AND toDate(date) = toDate('2026-08-28')
      )
),

mapped AS (
    SELECT
        report_date,
        call_interaction_id,
        node_name,
        return_event,
        newnodesequence,
        multiIf(
            node_name IN (
                'ESP1_U1PremierReservations',
                'ESP1_U1PremierReservationsLogic',
                'ESP1_U1PremierResNM',
                'ESP1_U1OTPDeclinePremierRes',
                'ESP1_U1OTPFailPremierRes',
                'ESP1_U1PreOTPFlowResPreTransfer',
                'ESP1_U1PreOTPFlowResPreJump'
            ), 'ESP1_U1PremierReservations',
            node_name IN (
                'ESP1_U1PremierReservations2',
                'ESP1_U1PremierMPLogic',
                'ESP1_U1PremierMPNM',
                'ESP1_U1OTPDeclinePremierMP',
                'ESP1_U1OTPFailPremierMP',
                'ESP1_U1PreOTPFlowMPPreTransfer',
                'ESP1_U1PreOTPFlowMPPreJump'
            ), 'ESP1_U1PremierReservations2',
            'Unknown'
        ) AS primary_node_name
    FROM newbase
),

/* Calls that accepted the OTP offer */
accepted_calls AS (
    SELECT DISTINCT
        report_date,
        primary_node_name,
        call_interaction_id
    FROM mapped
    WHERE node_name IN (
            'ESP1_U1PremierReservationsLogic',
            'ESP1_U1PremierMPLogic'
        )
      AND lowerUTF8(trimBoth(ifNull(return_event, ''))) = 'yes'
),

/* Last post-accept outcome node per accepted call */
accepted_last_node AS (
    SELECT
        a.report_date,
        a.primary_node_name,
        a.call_interaction_id,
        argMax(m.node_name, m.newnodesequence) AS last_post_accept_node
    FROM accepted_calls AS a
    INNER JOIN mapped AS m
        ON a.call_interaction_id = m.call_interaction_id
       AND a.report_date = m.report_date
       AND a.primary_node_name = m.primary_node_name
    WHERE m.node_name IN (
        'ESP1_U1OTPDeclinePremierRes',
        'ESP1_U1OTPFailPremierRes',
        'ESP1_U1PreOTPFlowResPreTransfer',
        'ESP1_U1PreOTPFlowResPreJump',
        'ESP1_U1OTPDeclinePremierMP',
        'ESP1_U1OTPFailPremierMP',
        'ESP1_U1PreOTPFlowMPPreTransfer',
        'ESP1_U1PreOTPFlowMPPreJump'
    )
    GROUP BY
        a.report_date,
        a.primary_node_name,
        a.call_interaction_id
),

offer_metrics AS (
    SELECT
        report_date,
        primary_node_name,

        uniqExactIf(
            call_interaction_id,
            node_name IN ('ESP1_U1PremierReservations', 'ESP1_U1PremierReservations2')
        ) AS total_calls,

        uniqExactIf(
            call_interaction_id,
            node_name IN ('ESP1_U1PremierReservationsLogic', 'ESP1_U1PremierMPLogic')
                AND lowerUTF8(trimBoth(ifNull(return_event, ''))) = 'yes'
        ) AS otp_offer_accept,

        uniqExactIf(
            call_interaction_id,
            node_name IN ('ESP1_U1PremierReservationsLogic', 'ESP1_U1PremierMPLogic')
                AND lowerUTF8(trimBoth(ifNull(return_event, ''))) = 'no'
        ) AS otp_offer_reject,

        uniqExactIf(
            call_interaction_id,
            node_name IN ('ESP1_U1PremierReservationsLogic', 'ESP1_U1PremierMPLogic')
                AND lowerUTF8(trimBoth(ifNull(return_event, ''))) = 'agent'
        ) AS otp_offer_agent,

        uniqExactIf(
            call_interaction_id,
            node_name IN ('ESP1_U1PremierResNM', 'ESP1_U1PremierMPNM')
        ) AS otp_offer_no_match
    FROM mapped
    GROUP BY
        report_date,
        primary_node_name
),

post_accept_metrics AS (
    SELECT
        report_date,
        primary_node_name,

        uniqExactIf(
            call_interaction_id,
            last_post_accept_node IN (
                'ESP1_U1OTPDeclinePremierRes',
                'ESP1_U1OTPDeclinePremierMP'
            )
        ) AS otp_decline,

        uniqExactIf(
            call_interaction_id,
            last_post_accept_node IN (
                'ESP1_U1OTPFailPremierRes',
                'ESP1_U1OTPFailPremierMP'
            )
        ) AS otp_unauthorized,

        uniqExactIf(
            call_interaction_id,
            last_post_accept_node IN (
                'ESP1_U1PreOTPFlowResPreTransfer',
                'ESP1_U1PreOTPFlowMPPreTransfer'
            )
        ) AS otp_transfer,

        uniqExactIf(
            call_interaction_id,
            last_post_accept_node IN (
                'ESP1_U1PreOTPFlowResPreJump',
                'ESP1_U1PreOTPFlowMPPreJump'
            )
        ) AS otp_res,

        /* Optional: raw last-node splits */
        uniqExactIf(call_interaction_id, last_post_accept_node = 'ESP1_U1OTPDeclinePremierRes')      AS last_decline_res,
        uniqExactIf(call_interaction_id, last_post_accept_node = 'ESP1_U1OTPFailPremierRes')         AS last_fail_res,
        uniqExactIf(call_interaction_id, last_post_accept_node = 'ESP1_U1PreOTPFlowResPreTransfer')  AS last_transfer_res,
        uniqExactIf(call_interaction_id, last_post_accept_node = 'ESP1_U1PreOTPFlowResPreJump')      AS last_jump_res,
        uniqExactIf(call_interaction_id, last_post_accept_node = 'ESP1_U1OTPDeclinePremierMP')       AS last_decline_mp,
        uniqExactIf(call_interaction_id, last_post_accept_node = 'ESP1_U1OTPFailPremierMP')          AS last_fail_mp,
        uniqExactIf(call_interaction_id, last_post_accept_node = 'ESP1_U1PreOTPFlowMPPreTransfer')   AS last_transfer_mp,
        uniqExactIf(call_interaction_id, last_post_accept_node = 'ESP1_U1PreOTPFlowMPPreJump')       AS last_jump_mp
    FROM accepted_last_node
    GROUP BY
        report_date,
        primary_node_name
)

SELECT
    coalesce(o.report_date, p.report_date) AS date,
    coalesce(o.primary_node_name, p.primary_node_name) AS primary_node_name,

    coalesce(o.total_calls, 0) AS total_calls,
    coalesce(o.otp_offer_accept, 0) AS otp_offer_accept,
    coalesce(o.otp_offer_reject, 0) AS otp_offer_reject,
    coalesce(o.otp_offer_agent, 0) AS otp_offer_agent,
    coalesce(o.otp_offer_no_match, 0) AS otp_offer_no_match,

    coalesce(p.otp_decline, 0) AS otp_decline,
    coalesce(p.otp_unauthorized, 0) AS otp_unauthorized,
    coalesce(p.otp_transfer, 0) AS otp_transfer,
    coalesce(p.otp_res, 0) AS otp_res,

    coalesce(p.last_decline_res, 0) AS last_decline_res,
    coalesce(p.last_fail_res, 0) AS last_fail_res,
    coalesce(p.last_transfer_res, 0) AS last_transfer_res,
    coalesce(p.last_jump_res, 0) AS last_jump_res,
    coalesce(p.last_decline_mp, 0) AS last_decline_mp,
    coalesce(p.last_fail_mp, 0) AS last_fail_mp,
    coalesce(p.last_transfer_mp, 0) AS last_transfer_mp,
    coalesce(p.last_jump_mp, 0) AS last_jump_mp
FROM offer_metrics AS o
FULL OUTER JOIN post_accept_metrics AS p
    ON o.report_date = p.report_date
   AND o.primary_node_name = p.primary_node_name
ORDER BY
    date,
    primary_node_name;
