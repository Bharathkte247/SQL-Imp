-- BigQuery SELECT: day-level unique calls + opt-out intents
-- Nested subquery form (no CTE) for SQL Lab / parsers that reject WITH.
-- Replace `your_project.your_dataset.node_level_interactions` as needed.

SELECT
  call_date,
  campaign,
  language,
  dnis,
  caller_phonenumber,
  project_name,
  application_id,
  call_type,
  COUNT(DISTINCT call_interaction_id) AS total_calls,
  COUNT(DISTINCT IF(is_opted_out, call_interaction_id, NULL)) AS opted_out_calls
FROM (
  SELECT
    call_interaction_id,
    DATE(call_interaction_starttime) AS call_date,
    ANY_VALUE(dnis) AS dnis,
    ANY_VALUE(caller_phonenumber) AS caller_phonenumber,
    ANY_VALUE(project_name) AS project_name,
    ANY_VALUE(application_id) AS application_id,
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
    ) AS is_opted_out
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
  application_id,
  call_type
ORDER BY
  call_date,
  campaign,
  language,
  dnis
;


-- -----------------------------------------------------------------------------
-- Optional rollup: day + campaign + language only (no caller/DNIS grain)
-- -----------------------------------------------------------------------------
/*
SELECT
  call_date,
  campaign,
  language,
  project_name,
  application_id,
  call_type,
  COUNT(DISTINCT call_interaction_id) AS total_calls,
  COUNT(DISTINCT IF(is_opted_out, call_interaction_id, NULL)) AS opted_out_calls
FROM (
  SELECT
    call_interaction_id,
    DATE(call_interaction_starttime) AS call_date,
    ANY_VALUE(project_name) AS project_name,
    ANY_VALUE(application_id) AS application_id,
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
    ) AS is_opted_out
  FROM `your_project.your_dataset.node_level_interactions`
  GROUP BY call_interaction_id, call_date
) AS call_dims
GROUP BY call_date, campaign, language, project_name, application_id, call_type
ORDER BY call_date, campaign, language;
*/
