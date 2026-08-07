-- =============================================================================
-- ClickHouse View: Day-level campaign call metrics (node-level source)
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
-- Replace `default.node_level_interactions` with your actual source table.
-- =============================================================================

CREATE OR REPLACE VIEW default.day_level_campaign_calls AS
WITH call_dims AS
(
    SELECT
        call_interaction_id,

        -- Day from interaction start (source format: DD-MM-YYYY HH:MM)
        toDate(strptime(substring(call_interaction_starttime, 1, 10), '%d-%m-%Y')) AS call_date,

        any(dnis) AS dnis,
        any(caller_phonenumber) AS caller_phonenumber,
        any(project_name) AS project_name,
        any(call_type) AS call_type,

        -- Latest campaign start node on the call
        nullIf(
            argMaxIf(
                multiIf(
                    node_name = 'Physical_CampaignStart', 'PH Campaign',
                    node_name = 'Flu_CampaignStart', 'FLU Campaign',
                    CAST(NULL AS Nullable(String))
                ),
                node_sequence_number,
                node_name IN ('Physical_CampaignStart', 'Flu_CampaignStart')
            ),
            ''
        ) AS campaign,

        -- Latest language exit node on the call (English vs Spanish)
        nullIf(
            argMaxIf(
                multiIf(
                    node_name = 'Exit_EnglishSelected', 'English',
                    node_name = 'Exit_SpanishSelected', 'Spanish',
                    CAST(NULL AS Nullable(String))
                ),
                node_sequence_number,
                node_name IN ('Exit_EnglishSelected', 'Exit_SpanishSelected')
            ),
            ''
        ) AS language,

        -- Opt-out intent flag (any of the listed intent nodes)
        max(
            node_name IN (
                'PH_IBOptOutNoDisconnect',
                'PH_InOptOutDisconnect',
                'PH_OptOutNoDisconnect',
                'PH_OBOptOutNoDisconnect',
                'PH_OptOutDisconnect',
                'PH_InOptOutNoDisconnect'
            )
        ) AS is_opted_out,

        -- Optional per-intent flags (useful for breakdowns)
        max(node_name = 'PH_IBOptOutNoDisconnect') AS is_ph_ib_optout_no_disconnect,
        max(node_name = 'PH_InOptOutDisconnect') AS is_ph_in_optout_disconnect,
        max(node_name = 'PH_OptOutNoDisconnect') AS is_ph_optout_no_disconnect,
        max(node_name = 'PH_OBOptOutNoDisconnect') AS is_ph_ob_optout_no_disconnect,
        max(node_name = 'PH_OptOutDisconnect') AS is_ph_optout_disconnect,
        max(node_name = 'PH_InOptOutNoDisconnect') AS is_ph_in_optout_no_disconnect
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
    uniqExactIf(call_interaction_id, is_opted_out = 1) AS opted_out_calls,

    uniqExactIf(call_interaction_id, is_ph_ib_optout_no_disconnect = 1) AS ph_ib_optout_no_disconnect_calls,
    uniqExactIf(call_interaction_id, is_ph_in_optout_disconnect = 1) AS ph_in_optout_disconnect_calls,
    uniqExactIf(call_interaction_id, is_ph_optout_no_disconnect = 1) AS ph_optout_no_disconnect_calls,
    uniqExactIf(call_interaction_id, is_ph_ob_optout_no_disconnect = 1) AS ph_ob_optout_no_disconnect_calls,
    uniqExactIf(call_interaction_id, is_ph_optout_disconnect = 1) AS ph_optout_disconnect_calls,
    uniqExactIf(call_interaction_id, is_ph_in_optout_no_disconnect = 1) AS ph_in_optout_no_disconnect_calls
FROM call_dims
GROUP BY
    call_date,
    campaign,
    language,
    dnis,
    caller_phonenumber,
    project_name,
    call_type
;


-- =============================================================================
-- Ad-hoc SELECT (same logic) if you prefer not to create a view yet
-- =============================================================================
/*
WITH call_dims AS
(
    SELECT
        call_interaction_id,
        toDate(strptime(substring(call_interaction_starttime, 1, 10), '%d-%m-%Y')) AS call_date,
        any(dnis) AS dnis,
        any(caller_phonenumber) AS caller_phonenumber,
        any(project_name) AS project_name,
        any(call_type) AS call_type,
        nullIf(
            argMaxIf(
                multiIf(
                    node_name = 'Physical_CampaignStart', 'PH Campaign',
                    node_name = 'Flu_CampaignStart', 'FLU Campaign',
                    CAST(NULL AS Nullable(String))
                ),
                node_sequence_number,
                node_name IN ('Physical_CampaignStart', 'Flu_CampaignStart')
            ),
            ''
        ) AS campaign,
        nullIf(
            argMaxIf(
                multiIf(
                    node_name = 'Exit_EnglishSelected', 'English',
                    node_name = 'Exit_SpanishSelected', 'Spanish',
                    CAST(NULL AS Nullable(String))
                ),
                node_sequence_number,
                node_name IN ('Exit_EnglishSelected', 'Exit_SpanishSelected')
            ),
            ''
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
    dnis,
    caller_phonenumber,
    project_name,
    call_type,
    uniqExact(call_interaction_id) AS total_calls,
    uniqExactIf(call_interaction_id, is_opted_out = 1) AS opted_out_calls
FROM call_dims
GROUP BY
    call_date, campaign, language, dnis, caller_phonenumber, project_name, call_type
ORDER BY call_date, campaign, language;
*/
