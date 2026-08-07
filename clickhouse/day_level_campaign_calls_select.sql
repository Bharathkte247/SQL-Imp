-- ClickHouse SELECT: day-level unique calls + opt-out intents
-- Source columns expected from the node-level CSV / table.
-- Replace table name as needed.

WITH call_dims AS
(
    SELECT
        call_interaction_id,
        toDate(strptime(substring(call_interaction_starttime, 1, 10), '%d-%m-%Y')) AS call_date,
        any(dnis) AS dnis,
        any(caller_phonenumber) AS caller_phonenumber,
        any(project_name) AS project_name,
        any(call_type) AS call_type,

        -- Campaign: latest Physical/Flu campaign start by node_sequence_number
        argMaxIf(
            multiIf(
                node_name = 'Physical_CampaignStart', 'PH Campaign',
                node_name = 'Flu_CampaignStart', 'FLU Campaign',
                CAST(NULL AS Nullable(String))
            ),
            node_sequence_number,
            node_name IN ('Physical_CampaignStart', 'Flu_CampaignStart')
        ) AS campaign,

        -- Language: if both English & Spanish exits exist, take latest sequence
        argMaxIf(
            multiIf(
                node_name = 'Exit_EnglishSelected', 'English',
                node_name = 'Exit_SpanishSelected', 'Spanish',
                CAST(NULL AS Nullable(String))
            ),
            node_sequence_number,
            node_name IN ('Exit_EnglishSelected', 'Exit_SpanishSelected')
        ) AS language,

        max(
            node_name IN (
                'PH_IBOptOutNoDisconnect',
                'PH_InOptOutDisconnect',
                'PH_OptOutNoDisconnect',
                'PH_OBOptOutNoDisconnect',
                'PH_OptOutDisconnect',
                'PH_InOptOutNoDisconnect'
            )
        ) AS is_opted_out
    FROM default.node_level_interactions
    GROUP BY
        call_interaction_id,
        call_date
)
SELECT
    call_date,
    campaign,
    language,
    dnis,
    caller_phonenumber,
    project_name,
    call_type,
    uniqExact(call_interaction_id) AS total_calls,
    uniqExactIf(call_interaction_id, is_opted_out = 1) AS opted_out_calls
FROM call_dims
GROUP BY
    call_date,
    campaign,
    language,
    dnis,
    caller_phonenumber,
    project_name,
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
WITH call_dims AS
(
    SELECT
        call_interaction_id,
        toDate(strptime(substring(call_interaction_starttime, 1, 10), '%d-%m-%Y')) AS call_date,
        any(project_name) AS project_name,
        any(call_type) AS call_type,
        argMaxIf(
            multiIf(
                node_name = 'Physical_CampaignStart', 'PH Campaign',
                node_name = 'Flu_CampaignStart', 'FLU Campaign',
                CAST(NULL AS Nullable(String))
            ),
            node_sequence_number,
            node_name IN ('Physical_CampaignStart', 'Flu_CampaignStart')
        ) AS campaign,
        argMaxIf(
            multiIf(
                node_name = 'Exit_EnglishSelected', 'English',
                node_name = 'Exit_SpanishSelected', 'Spanish',
                CAST(NULL AS Nullable(String))
            ),
            node_sequence_number,
            node_name IN ('Exit_EnglishSelected', 'Exit_SpanishSelected')
        ) AS language,
        max(
            node_name IN (
                'PH_IBOptOutNoDisconnect',
                'PH_InOptOutDisconnect',
                'PH_OptOutNoDisconnect',
                'PH_OBOptOutNoDisconnect',
                'PH_OptOutDisconnect',
                'PH_InOptOutNoDisconnect'
            )
        ) AS is_opted_out
    FROM default.node_level_interactions
    GROUP BY call_interaction_id, call_date
)
SELECT
    call_date,
    campaign,
    language,
    project_name,
    call_type,
    uniqExact(call_interaction_id) AS total_calls,
    uniqExactIf(call_interaction_id, is_opted_out = 1) AS opted_out_calls
FROM call_dims
GROUP BY call_date, campaign, language, project_name, call_type
ORDER BY call_date, campaign, language;
*/
