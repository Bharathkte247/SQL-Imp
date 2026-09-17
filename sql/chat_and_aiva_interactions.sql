-- Chat + AIVA digital interactions (ClickHouse)
-- Source: ftbank.digital_interaction_view
--
-- Intent:
--   1) All rows that have a chat session (chat_interaction_id IS NOT NULL)
--   2) PLUS AIVA-only rows whose aiva_interaction_id does NOT already appear
--      on any chat row in the same date window
--
-- Result: chat interactions ∪ standalone AIVA interactions, with no double-count
-- of AIVA ids that are already linked to chat.
--
-- Date window: set start_date / end_date in the bounds CTE (default Aug 2026).

WITH
bounds AS (
    SELECT
        toDate('2026-08-01') AS start_date,
        toDate('2026-08-31') AS end_date
),

-- Single scan of the view for the reporting window
period AS (
    SELECT d.*
    FROM ftbank.digital_interaction_view AS d
    CROSS JOIN bounds AS b
    WHERE toDate(d.session_start_time) BETWEEN b.start_date AND b.end_date
),

chat AS (
    SELECT *
    FROM period
    WHERE chat_interaction_id IS NOT NULL
),

-- AIVA ids already represented on chat rows (exclude NULLs for safe anti-join)
chat_linked_aiva_ids AS (
    SELECT DISTINCT aiva_interaction_id
    FROM chat
    WHERE aiva_interaction_id IS NOT NULL
),

-- Standalone AIVA rows: have an aiva id that is not chat-linked
aiva_only AS (
    SELECT p.*
    FROM period AS p
    LEFT ANTI JOIN chat_linked_aiva_ids AS c
        ON p.aiva_interaction_id = c.aiva_interaction_id
    WHERE p.aiva_interaction_id IS NOT NULL
)

SELECT *
FROM chat

UNION ALL

SELECT *
FROM aiva_only
;
