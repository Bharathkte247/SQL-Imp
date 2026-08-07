-- =============================================================================
-- BigQuery View: Day-level campaign call metrics (node-level source)
-- =============================================================================
-- Grain: day + campaign + language + dnis + caller_phonenumber + project_name + call_type
--
-- Campaign dimension (from node_name):
--   Physical_CampaignStart -> PH Campaign
--   Flu_CampaignStart      -> FLU Campaign
--   Latest campaign-start node wins when multiple exist on a call.
--
-- Language dimension (from node_name):
--   Exit_EnglishSelected -> English
--   Exit_SpanishSelected -> Spanish
--   If both exist on the same call_interaction_id, take the latest by
--   node_sequence_number (ascending sequence; latest = max sequence).
--
-- Measures:
--   total_calls      = unique call_interaction_id
--   opted_out_calls  = unique calls that hit any of the listed opt-out intent nodes
--
-- Nested subquery form (no CTE) for SQL Lab / parsers that reject WITH.
-- Replace `your_project.your_dataset.node_level_interactions` with your actual table.
-- =============================================================================

CREATE OR REPLACE VIEW `your_project.your_dataset.day_level_campaign_calls` AS
SELECT
  call_date,
  campaign,
  language,
  dnis,
  caller_phonenumber,
  project_name,
  call_type,
  COUNT(DISTINCT call_interaction_id) AS total_calls,
  COUNT(DISTINCT IF(is_opted_out, call_interaction_id, NULL)) AS opted_out_calls,
  COUNT(DISTINCT IF(is_ph_ib_optout_no_disconnect, call_interaction_id, NULL)) AS ph_ib_optout_no_disconnect_calls,
  COUNT(DISTINCT IF(is_ph_in_optout_disconnect, call_interaction_id, NULL)) AS ph_in_optout_disconnect_calls,
  COUNT(DISTINCT IF(is_ph_optout_no_disconnect, call_interaction_id, NULL)) AS ph_optout_no_disconnect_calls,
  COUNT(DISTINCT IF(is_ph_ob_optout_no_disconnect, call_interaction_id, NULL)) AS ph_ob_optout_no_disconnect_calls,
  COUNT(DISTINCT IF(is_ph_optout_disconnect, call_interaction_id, NULL)) AS ph_optout_disconnect_calls,
  COUNT(DISTINCT IF(is_ph_in_optout_no_disconnect, call_interaction_id, NULL)) AS ph_in_optout_no_disconnect_calls
FROM (
  SELECT
    call_interaction_id,
    DATE(call_interaction_starttime) AS call_date,
    ANY_VALUE(dnis) AS dnis,
    ANY_VALUE(caller_phonenumber) AS caller_phonenumber,
    ANY_VALUE(project_name) AS project_name,
    ANY_VALUE(call_type) AS call_type,
    ARRAY_AGG(
      CASE
        WHEN node_name = 'Physical_CampaignStart' THEN 'PH Campaign'
        WHEN node_name = 'Flu_CampaignStart' THEN 'FLU Campaign'
      END
      IGNORE NULLS
      ORDER BY node_sequence_number DESC
      LIMIT 1
    )[SAFE_OFFSET(0)] AS campaign,
    ARRAY_AGG(
      CASE
        WHEN node_name = 'Exit_EnglishSelected' THEN 'English'
        WHEN node_name = 'Exit_SpanishSelected' THEN 'Spanish'
      END
      IGNORE NULLS
      ORDER BY node_sequence_number DESC
      LIMIT 1
    )[SAFE_OFFSET(0)] AS language,
    LOGICAL_OR(
      node_name IN (
        'PH_IBOptOutNoDisconnect',
        'PH_InOptOutDisconnect',
        'PH_OptOutNoDisconnect',
        'PH_OBOptOutNoDisconnect',
        'PH_OptOutDisconnect',
        'PH_InOptOutNoDisconnect'
      )
    ) AS is_opted_out,
    LOGICAL_OR(node_name = 'PH_IBOptOutNoDisconnect') AS is_ph_ib_optout_no_disconnect,
    LOGICAL_OR(node_name = 'PH_InOptOutDisconnect') AS is_ph_in_optout_disconnect,
    LOGICAL_OR(node_name = 'PH_OptOutNoDisconnect') AS is_ph_optout_no_disconnect,
    LOGICAL_OR(node_name = 'PH_OBOptOutNoDisconnect') AS is_ph_ob_optout_no_disconnect,
    LOGICAL_OR(node_name = 'PH_OptOutDisconnect') AS is_ph_optout_disconnect,
    LOGICAL_OR(node_name = 'PH_InOptOutNoDisconnect') AS is_ph_in_optout_no_disconnect
  FROM `your_project.your_dataset.node_level_interactions`
  GROUP BY
    call_interaction_id,
    call_date
) AS call_dims
GROUP BY
  call_date,
  campaign,
  language,
  dnis,
  caller_phonenumber,
  project_name,
  call_type
;
