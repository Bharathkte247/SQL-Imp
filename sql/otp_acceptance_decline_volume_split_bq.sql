-- OTP Acceptance & Decline Details — BigQuery volume split
-- Project from error: prd-dp-120a
-- Replace YOUR_DATASET.voice_node_report with the real dataset.table

WITH
newbase AS (
  SELECT
    *,
    ROW_NUMBER() OVER (
      PARTITION BY call_interaction_id
      ORDER BY node_sequence_number
    ) AS newnodesequence
  FROM `prd-dp-120a.YOUR_DATASET.voice_node_report`
  WHERE node_state IN ('finalized')
    AND DATE(date) > DATE('2026-05-31')
),

call_paths AS (
  SELECT
    call_interaction_id,
    ARRAY_AGG(
      STRUCT(
        newnodesequence AS seq,
        node_name AS node_name,
        IFNULL(CAST(return_event AS STRING), '') AS return_event
      )
      ORDER BY newnodesequence
    ) AS evts
  FROM newbase
  GROUP BY call_interaction_id
),

call_arrays AS (
  SELECT
    call_interaction_id,
    evts
  FROM call_paths
  WHERE EXISTS (
    SELECT 1
    FROM UNNEST(evts) AS e
    WHERE e.node_name IN (
      'ESP1_U1PremierReservations',
      'ESP1_U1PremierReservations2'
    )
  )
),

classified AS (
  SELECT
    call_interaction_id,
    evts,

    EXISTS (SELECT 1 FROM UNNEST(evts) e WHERE e.node_name = 'ESP1_U1PremierReservations')  AS hit_l1a,
    EXISTS (SELECT 1 FROM UNNEST(evts) e WHERE e.node_name = 'ESP1_U1PremierReservations2') AS hit_l1b,

    (
      SELECT LOWER(TRIM(e.return_event))
      FROM UNNEST(evts) AS e
      WHERE e.node_name = 'ESP1_U1PremierReservationsLogic'
      ORDER BY e.seq
      LIMIT 1
    ) AS l1a_offer_return,

    (
      SELECT LOWER(TRIM(e.return_event))
      FROM UNNEST(evts) AS e
      WHERE e.node_name = 'ESP1_U1PremierMPLogic'
      ORDER BY e.seq
      LIMIT 1
    ) AS l1b_offer_return,

    EXISTS (
      SELECT 1
      FROM UNNEST(evts) AS e
      WHERE e.node_name = 'ESP1_U1PremierResNM'
        AND e.seq >= (
          SELECT MIN(e2.seq)
          FROM UNNEST(evts) AS e2
          WHERE e2.node_name = 'ESP1_U1PremierReservations'
        )
    ) AS l1a_has_nm_after,

    EXISTS (
      SELECT 1
      FROM UNNEST(evts) AS e
      WHERE e.node_name = 'ESP1_U1PremierMPNM'
        AND e.seq >= (
          SELECT MIN(e2.seq)
          FROM UNNEST(evts) AS e2
          WHERE e2.node_name = 'ESP1_U1PremierReservations2'
        )
    ) AS l1b_has_nm_after,

    EXISTS (SELECT 1 FROM UNNEST(evts) e WHERE e.node_name = 'ESP1_U1OTPDeclinePremierRes')     AS has_decline_res,
    EXISTS (SELECT 1 FROM UNNEST(evts) e WHERE e.node_name = 'ESP1_U1OTPFailPremierRes')        AS has_fail_res,
    EXISTS (SELECT 1 FROM UNNEST(evts) e WHERE e.node_name = 'ESP1_U1PreOTPFlowResPreTransfer') AS has_transfer_res,
    EXISTS (SELECT 1 FROM UNNEST(evts) e WHERE e.node_name = 'ESP1_U1PreOTPFlowResPreJump')     AS has_jump_res,

    EXISTS (SELECT 1 FROM UNNEST(evts) e WHERE e.node_name = 'ESP1_U1OTPDeclinePremierMP')      AS has_decline_mp,
    EXISTS (SELECT 1 FROM UNNEST(evts) e WHERE e.node_name = 'ESP1_U1OTPFailPremierMP')         AS has_fail_mp,
    EXISTS (SELECT 1 FROM UNNEST(evts) e WHERE e.node_name = 'ESP1_U1PreOTPFlowMPPreTransfer')  AS has_transfer_mp,
    EXISTS (SELECT 1 FROM UNNEST(evts) e WHERE e.node_name = 'ESP1_U1PreOTPFlowMPPreJump')      AS has_jump_mp
  FROM call_arrays
),

journey AS (
  SELECT
    call_interaction_id,

    CASE
      WHEN hit_l1a AND IFNULL(l1a_offer_return, '') = 'yes'   THEN 'L1.a.1 OTP Offer Accept'
      WHEN hit_l1a AND IFNULL(l1a_offer_return, '') = 'no'    THEN 'L1.a.2 OTP Offer Reject'
      WHEN hit_l1a AND IFNULL(l1a_offer_return, '') = 'agent' THEN 'L1.a.3 OTP Offer Agent'
      WHEN hit_l1a AND l1a_has_nm_after                       THEN 'L1.a.4 no match'
      WHEN hit_l1a                                            THEN 'L1.a Unknown offer outcome'

      WHEN hit_l1b AND IFNULL(l1b_offer_return, '') = 'yes'   THEN 'L1.b.1 OTP Offer Accept'
      WHEN hit_l1b AND IFNULL(l1b_offer_return, '') = 'no'    THEN 'L1.b.2 OTP Offer Reject'
      WHEN hit_l1b AND IFNULL(l1b_offer_return, '') = 'agent' THEN 'L1.b.3 OTP Offer Agent'
      WHEN hit_l1b AND l1b_has_nm_after                       THEN 'L1.b.4 no match'
      ELSE 'L1.b Unknown offer outcome'
    END AS offer_journey,

    CASE
      WHEN hit_l1a AND IFNULL(l1a_offer_return, '') = 'yes' AND has_decline_res  THEN 'L1.a.1.i OTP Decline'
      WHEN hit_l1a AND IFNULL(l1a_offer_return, '') = 'yes' AND has_fail_res     THEN 'L1.a.1.ii OTP Unauthorized'
      WHEN hit_l1a AND IFNULL(l1a_offer_return, '') = 'yes' AND has_jump_res     THEN 'L1.a.1.iv OTP Res'
      WHEN hit_l1a AND IFNULL(l1a_offer_return, '') = 'yes' AND has_transfer_res THEN 'L1.a.1.iii OTP Transfer'
      WHEN hit_l1a AND IFNULL(l1a_offer_return, '') = 'yes'                     THEN 'L1.a.1 Accept (incomplete/other)'

      WHEN hit_l1b AND IFNULL(l1b_offer_return, '') = 'yes' AND has_decline_mp  THEN 'L1.b.1.i OTP Decline'
      WHEN hit_l1b AND IFNULL(l1b_offer_return, '') = 'yes' AND has_fail_mp     THEN 'L1.b.1.ii OTP Unauthorized'
      WHEN hit_l1b AND IFNULL(l1b_offer_return, '') = 'yes' AND has_jump_mp     THEN 'L1.b.1.iv OTP Res'
      WHEN hit_l1b AND IFNULL(l1b_offer_return, '') = 'yes' AND has_transfer_mp THEN 'L1.b.1.iii OTP Transfer'
      WHEN hit_l1b AND IFNULL(l1b_offer_return, '') = 'yes'                     THEN 'L1.b.1 Accept (incomplete/other)'
      ELSE CAST(NULL AS STRING)
    END AS accept_sub_journey,

    CASE
      WHEN hit_l1a THEN 'L1.a'
      WHEN hit_l1b THEN 'L1.b'
      ELSE 'none'
    END AS offer_variant
  FROM classified
)

SELECT
  offer_variant,
  offer_journey,
  accept_sub_journey,
  COUNT(*) AS call_volume,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) AS pct_of_calls
FROM journey
GROUP BY offer_variant, offer_journey, accept_sub_journey
ORDER BY offer_variant, call_volume DESC;
