-- OTP Acceptance & Decline Details
-- Pattern aligned to SMSO deflection metrics reference query
-- Tables: ua.voice_node_report, ua.voice_interaction_view

WITH target_calls AS (
    SELECT DISTINCT call_interaction_id
    FROM ua.voice_node_report
    WHERE node_name IN (
        'ESP1_U1PremierReservations',
        'ESP1_U1PremierReservations2'
    )
),

nodes AS (
    SELECT
        v.date,
        v.call_interaction_id,
        v.node_sequence_number,
        v.node_name AS node_group,
        v.return_event,
        CASE
            /* L1 offer presented */
            WHEN v.node_name IN (
                    'ESP1_U1PremierReservations',
                    'ESP1_U1PremierReservations2'
                 )
                THEN 'OTP Offer Presented'

            /* L1.a — ESP1_U1PremierReservationsLogic */
            WHEN v.node_name = 'ESP1_U1PremierReservationsLogic'
                 AND LOWER(TRIM(v.return_event)) = 'yes'
                THEN 'OTP Offer Accept'
            WHEN v.node_name = 'ESP1_U1PremierReservationsLogic'
                 AND LOWER(TRIM(v.return_event)) = 'no'
                THEN 'OTP Offer Reject'
            WHEN v.node_name = 'ESP1_U1PremierReservationsLogic'
                 AND LOWER(TRIM(v.return_event)) = 'agent'
                THEN 'OTP Offer Agent'

            /* L1.b — ESP1_U1PremierMPLogic */
            WHEN v.node_name = 'ESP1_U1PremierMPLogic'
                 AND LOWER(TRIM(v.return_event)) = 'yes'
                THEN 'OTP Offer Accept'
            WHEN v.node_name = 'ESP1_U1PremierMPLogic'
                 AND LOWER(TRIM(v.return_event)) = 'no'
                THEN 'OTP Offer Reject'
            WHEN v.node_name = 'ESP1_U1PremierMPLogic'
                 AND LOWER(TRIM(v.return_event)) = 'agent'
                THEN 'OTP Offer Agent'

            /* No match after offer */
            WHEN v.node_name IN (
                    'ESP1_U1PremierResNM',
                    'ESP1_U1PremierMPNM'
                 )
                THEN 'OTP Offer No Match'

            /* Accept sub-journeys — Decline */
            WHEN v.node_name IN (
                    'ESP1_U1OTPDeclinePremierRes',
                    'ESP1_U1OTPDeclinePremierMP'
                 )
                THEN 'OTP Decline'

            /* Accept sub-journeys — Unauthorized */
            WHEN v.node_name IN (
                    'ESP1_U1OTPFailPremierRes',
                    'ESP1_U1OTPFailPremierMP'
                 )
                THEN 'OTP Unauthorized'

            /* Accept sub-journeys — OTP Res (PreJump) */
            WHEN v.node_name IN (
                    'ESP1_U1PreOTPFlowResPreJump',
                    'ESP1_U1PreOTPFlowMPPreJump'
                 )
                THEN 'OTP Res'

            /* Accept sub-journeys — OTP Transfer (PreTransfer) */
            WHEN v.node_name IN (
                    'ESP1_U1PreOTPFlowResPreTransfer',
                    'ESP1_U1PreOTPFlowMPPreTransfer'
                 )
                THEN 'OTP Transfer'

            ELSE 'Unknown'
        END AS outcome_identifier,

        /* Variant for optional splits */
        CASE
            WHEN v.node_name IN (
                    'ESP1_U1PremierReservations',
                    'ESP1_U1PremierReservationsLogic',
                    'ESP1_U1PremierResNM',
                    'ESP1_U1OTPDeclinePremierRes',
                    'ESP1_U1OTPFailPremierRes',
                    'ESP1_U1PreOTPFlowResPreTransfer',
                    'ESP1_U1PreOTPFlowResPreJump'
                 )
                THEN 'L1.a'
            WHEN v.node_name IN (
                    'ESP1_U1PremierReservations2',
                    'ESP1_U1PremierMPLogic',
                    'ESP1_U1PremierMPNM',
                    'ESP1_U1OTPDeclinePremierMP',
                    'ESP1_U1OTPFailPremierMP',
                    'ESP1_U1PreOTPFlowMPPreTransfer',
                    'ESP1_U1PreOTPFlowMPPreJump'
                 )
                THEN 'L1.b'
            ELSE 'Unknown'
        END AS offer_variant
    FROM ua.voice_node_report v
    INNER JOIN target_calls t
        ON v.call_interaction_id = t.call_interaction_id
    WHERE v.node_state = 'finalized'
      AND v.node_name IN (
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
),

with_prev AS (
    SELECT
        *,
        LAG(node_group) OVER (
            PARTITION BY call_interaction_id
            ORDER BY node_sequence_number
        ) AS prev_node_group
    FROM nodes
),

final_rows AS (
    SELECT
        n.date,
        n.call_interaction_id,
        n.outcome_identifier,
        n.offer_variant,
        i.last_identified_intent
    FROM with_prev n
    LEFT JOIN ua.voice_interaction_view i
        ON n.call_interaction_id = i.call_interaction_id
    WHERE n.prev_node_group IS NULL
       OR n.node_group <> n.prev_node_group
),

otp_metrics AS (
    SELECT
        date,
        last_identified_intent,

        COUNT(DISTINCT call_interaction_id) AS otp_offer_calls,

        COUNT(DISTINCT CASE WHEN outcome_identifier = 'OTP Offer Presented'
                            THEN call_interaction_id END) AS offer_presented_calls,

        COUNT(DISTINCT CASE WHEN outcome_identifier = 'OTP Offer Accept'
                            THEN call_interaction_id END) AS offer_accept_calls,
        COUNT(DISTINCT CASE WHEN outcome_identifier = 'OTP Offer Reject'
                            THEN call_interaction_id END) AS offer_reject_calls,
        COUNT(DISTINCT CASE WHEN outcome_identifier = 'OTP Offer Agent'
                            THEN call_interaction_id END) AS offer_agent_calls,
        COUNT(DISTINCT CASE WHEN outcome_identifier = 'OTP Offer No Match'
                            THEN call_interaction_id END) AS offer_no_match_calls,

        COUNT(DISTINCT CASE WHEN outcome_identifier = 'OTP Decline'
                            THEN call_interaction_id END) AS otp_decline_calls,
        COUNT(DISTINCT CASE WHEN outcome_identifier = 'OTP Unauthorized'
                            THEN call_interaction_id END) AS otp_unauthorized_calls,
        COUNT(DISTINCT CASE WHEN outcome_identifier = 'OTP Transfer'
                            THEN call_interaction_id END) AS otp_transfer_calls,
        COUNT(DISTINCT CASE WHEN outcome_identifier = 'OTP Res'
                            THEN call_interaction_id END) AS otp_res_calls,

        /* Variant volumes */
        COUNT(DISTINCT CASE WHEN offer_variant = 'L1.a'
                            THEN call_interaction_id END) AS l1a_reservations_calls,
        COUNT(DISTINCT CASE WHEN offer_variant = 'L1.b'
                            THEN call_interaction_id END) AS l1b_reservations2_calls
    FROM final_rows
    GROUP BY
        date,
        last_identified_intent
),

/* Overall call volume — no OTP / node filters */
overall_volume AS (
    SELECT
        date,
        last_identified_intent,
        COUNT(DISTINCT call_interaction_id) AS overall_call_volume
    FROM ua.voice_interaction_view
    GROUP BY
        date,
        last_identified_intent
)

SELECT
    COALESCE(o.date, m.date) AS date,
    COALESCE(o.last_identified_intent, m.last_identified_intent) AS last_identified_intent,
    COALESCE(o.overall_call_volume, 0) AS overall_call_volume,
    COALESCE(m.otp_offer_calls, 0) AS otp_offer_calls,
    COALESCE(m.offer_presented_calls, 0) AS offer_presented_calls,
    COALESCE(m.offer_accept_calls, 0) AS offer_accept_calls,
    COALESCE(m.offer_reject_calls, 0) AS offer_reject_calls,
    COALESCE(m.offer_agent_calls, 0) AS offer_agent_calls,
    COALESCE(m.offer_no_match_calls, 0) AS offer_no_match_calls,
    COALESCE(m.otp_decline_calls, 0) AS otp_decline_calls,
    COALESCE(m.otp_unauthorized_calls, 0) AS otp_unauthorized_calls,
    COALESCE(m.otp_transfer_calls, 0) AS otp_transfer_calls,
    COALESCE(m.otp_res_calls, 0) AS otp_res_calls,
    COALESCE(m.l1a_reservations_calls, 0) AS l1a_reservations_calls,
    COALESCE(m.l1b_reservations2_calls, 0) AS l1b_reservations2_calls
FROM overall_volume o
FULL OUTER JOIN otp_metrics m
    ON o.date = m.date
   AND (
        o.last_identified_intent = m.last_identified_intent
        OR (o.last_identified_intent IS NULL AND m.last_identified_intent IS NULL)
       )
ORDER BY
    date,
    last_identified_intent;
