-- OTP Offer volume + accept/reject/agent/no-match (ClickHouse)
-- Grain: date + primary_node_name
-- Note: if schema ua fails, swap to united.voice_node_report

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
)

SELECT
    report_date AS date,
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
ORDER BY
    date,
    primary_node_name;
