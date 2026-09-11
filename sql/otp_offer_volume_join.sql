-- OTP Offer volume + accept/reject/agent (ClickHouse)
-- Joins total_volume and otp_offer at date + primary_node_name
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

/* Map each funnel node to its L1 primary offer node */
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
),

/* Total volume = distinct calls that hit the L1 offer prompt */
total_volume AS (
    SELECT
        report_date,
        primary_node_name,
        uniqExact(call_interaction_id) AS total_calls
    FROM mapped
    WHERE node_name IN (
        'ESP1_U1PremierReservations',
        'ESP1_U1PremierReservations2'
    )
    GROUP BY
        report_date,
        primary_node_name
),

/* Offer decision comes from Logic nodes' return_event */
otp_offer AS (
    SELECT
        report_date,
        primary_node_name,
        uniqExactIf(
            call_interaction_id,
            lowerUTF8(trimBoth(ifNull(return_event, ''))) = 'yes'
        ) AS otp_offer_accept,
        uniqExactIf(
            call_interaction_id,
            lowerUTF8(trimBoth(ifNull(return_event, ''))) = 'no'
        ) AS otp_offer_reject,
        uniqExactIf(
            call_interaction_id,
            lowerUTF8(trimBoth(ifNull(return_event, ''))) = 'agent'
        ) AS otp_offer_agent
    FROM mapped
    WHERE node_name IN (
        'ESP1_U1PremierReservationsLogic',
        'ESP1_U1PremierMPLogic'
    )
    GROUP BY
        report_date,
        primary_node_name
)

SELECT
    coalesce(t.report_date, o.report_date) AS date,
    coalesce(t.primary_node_name, o.primary_node_name) AS primary_node_name,
    coalesce(t.total_calls, 0) AS total_calls,
    coalesce(o.otp_offer_accept, 0) AS otp_offer_accept,
    coalesce(o.otp_offer_reject, 0) AS otp_offer_reject,
    coalesce(o.otp_offer_agent, 0) AS otp_offer_agent
FROM total_volume AS t
FULL OUTER JOIN otp_offer AS o
    ON t.report_date = o.report_date
   AND t.primary_node_name = o.primary_node_name
ORDER BY
    date,
    primary_node_name;
