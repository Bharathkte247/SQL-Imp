-- OTP Acceptance & Decline Details (ClickHouse)
-- Grain: calendar day (toDate)
-- Schema: united.voice_node_report, united.voice_interaction_view

WITH nodes AS (
    SELECT
        toDate(v.date) AS report_date,
        v.call_interaction_id,
        v.node_sequence_number,
        v.node_name AS node_group,
        v.return_event,
        multiIf(
            v.node_name IN ('ESP1_U1PremierReservations', 'ESP1_U1PremierReservations2'),
                'OTP Offer Presented',

            v.node_name = 'ESP1_U1PremierReservationsLogic'
                AND lowerUTF8(trimBoth(ifNull(v.return_event, ''))) = 'yes',
                'OTP Offer Accept',
            v.node_name = 'ESP1_U1PremierReservationsLogic'
                AND lowerUTF8(trimBoth(ifNull(v.return_event, ''))) = 'no',
                'OTP Offer Reject',
            v.node_name = 'ESP1_U1PremierReservationsLogic'
                AND lowerUTF8(trimBoth(ifNull(v.return_event, ''))) = 'agent',
                'OTP Offer Agent',

            v.node_name = 'ESP1_U1PremierMPLogic'
                AND lowerUTF8(trimBoth(ifNull(v.return_event, ''))) = 'yes',
                'OTP Offer Accept',
            v.node_name = 'ESP1_U1PremierMPLogic'
                AND lowerUTF8(trimBoth(ifNull(v.return_event, ''))) = 'no',
                'OTP Offer Reject',
            v.node_name = 'ESP1_U1PremierMPLogic'
                AND lowerUTF8(trimBoth(ifNull(v.return_event, ''))) = 'agent',
                'OTP Offer Agent',

            v.node_name IN ('ESP1_U1PremierResNM', 'ESP1_U1PremierMPNM'),
                'OTP Offer No Match',

            v.node_name IN ('ESP1_U1OTPDeclinePremierRes', 'ESP1_U1OTPDeclinePremierMP'),
                'OTP Decline',
            v.node_name IN ('ESP1_U1OTPFailPremierRes', 'ESP1_U1OTPFailPremierMP'),
                'OTP Unauthorized',
            v.node_name IN ('ESP1_U1PreOTPFlowResPreJump', 'ESP1_U1PreOTPFlowMPPreJump'),
                'OTP Res',
            v.node_name IN ('ESP1_U1PreOTPFlowResPreTransfer', 'ESP1_U1PreOTPFlowMPPreTransfer'),
                'OTP Transfer',

            'Unknown'
        ) AS outcome_identifier
    FROM united.voice_node_report AS v
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
        lag(node_group) OVER (
            PARTITION BY call_interaction_id
            ORDER BY node_sequence_number
        ) AS prev_node_group
    FROM nodes
),

final_rows AS (
    SELECT
        report_date,
        call_interaction_id,
        outcome_identifier
    FROM with_prev
    WHERE prev_node_group IS NULL
       OR node_group != prev_node_group
),

otp_metrics AS (
    SELECT
        report_date,

        uniqExact(call_interaction_id) AS otp_offer_calls,

        uniqExactIf(call_interaction_id, outcome_identifier = 'OTP Offer Presented') AS offer_presented_calls,
        uniqExactIf(call_interaction_id, outcome_identifier = 'OTP Offer Accept')    AS offer_accept_calls,
        uniqExactIf(call_interaction_id, outcome_identifier = 'OTP Offer Reject')    AS offer_reject_calls,
        uniqExactIf(call_interaction_id, outcome_identifier = 'OTP Offer Agent')     AS offer_agent_calls,
        uniqExactIf(call_interaction_id, outcome_identifier = 'OTP Offer No Match')  AS offer_no_match_calls,

        uniqExactIf(call_interaction_id, outcome_identifier = 'OTP Decline')         AS otp_decline_calls,
        uniqExactIf(call_interaction_id, outcome_identifier = 'OTP Unauthorized')    AS otp_unauthorized_calls,
        uniqExactIf(call_interaction_id, outcome_identifier = 'OTP Transfer')        AS otp_transfer_calls,
        uniqExactIf(call_interaction_id, outcome_identifier = 'OTP Res')             AS otp_res_calls
    FROM final_rows
    GROUP BY report_date
),

overall_volume AS (
    SELECT
        report_date,
        uniqExact(call_interaction_id) AS overall_call_volume
    FROM
    (
        SELECT
            toDate(date) AS report_date,
            call_interaction_id
        FROM united.voice_interaction_view
    )
    GROUP BY report_date
)

SELECT
    coalesce(o.report_date, m.report_date) AS date,
    coalesce(o.overall_call_volume, 0) AS overall_call_volume,
    coalesce(m.otp_offer_calls, 0) AS otp_offer_calls,
    coalesce(m.offer_presented_calls, 0) AS offer_presented_calls,
    coalesce(m.offer_accept_calls, 0) AS offer_accept_calls,
    coalesce(m.offer_reject_calls, 0) AS offer_reject_calls,
    coalesce(m.offer_agent_calls, 0) AS offer_agent_calls,
    coalesce(m.offer_no_match_calls, 0) AS offer_no_match_calls,
    coalesce(m.otp_decline_calls, 0) AS otp_decline_calls,
    coalesce(m.otp_unauthorized_calls, 0) AS otp_unauthorized_calls,
    coalesce(m.otp_transfer_calls, 0) AS otp_transfer_calls,
    coalesce(m.otp_res_calls, 0) AS otp_res_calls
FROM overall_volume AS o
FULL OUTER JOIN otp_metrics AS m
    ON o.report_date = m.report_date
ORDER BY date;
