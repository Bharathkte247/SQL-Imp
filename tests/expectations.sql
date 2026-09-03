-- ============================================================================
-- Assertions over the fixture scenario in tests/fixtures.sql.
--
-- `expected` is hand-computed from the fixture event stream. `original` is the
-- value produced by queries/assist_chatsession__original_typefix_only.sql and
-- `fixed` by queries/assist_chatsession__fixed.sql, so each row shows both the
-- defect and its correction. A NULL result is rendered as the text 'NULL'.
--
-- Run via tests/report.sh, which materialises mock.orig and mock.fixed first.
-- ============================================================================
WITH checks AS (
    SELECT * FROM values(
        'finding String, check String, expected String, original String, fixed String',

        -- F2: interactions whose InteractionId column is blank
        ('F2', 'I6 and I7 kept as separate rows', '2',
         ifNull(toString((SELECT count() FROM mock.orig  WHERE interaction_id IN ('I6','I7'))), 'NULL'),
         ifNull(toString((SELECT count() FROM mock.fixed WHERE interaction_id IN ('I6','I7'))), 'NULL')),

        ('F2', 'rows keyed by an empty interaction_id', '0',
         ifNull(toString((SELECT count() FROM mock.orig  WHERE interaction_id = '')), 'NULL'),
         ifNull(toString((SELECT count() FROM mock.fixed WHERE interaction_id = '')), 'NULL')),

        -- F3: chat_log fan-out duplicates interactions
        ('F3', 'rows for I5', '1',
         ifNull(toString((SELECT count() FROM mock.orig  WHERE interaction_id = 'I5')), 'NULL'),
         ifNull(toString((SELECT count() FROM mock.fixed WHERE interaction_id = 'I5')), 'NULL')),

        ('F3', 'total output rows', '10',
         ifNull(toString((SELECT count() FROM mock.orig)), 'NULL'),
         ifNull(toString((SELECT count() FROM mock.fixed)), 'NULL')),

        -- F4: interactions with no CONVERSATION_CREATED are dropped
        ('F4', 'I4 (messages only) present', '1',
         ifNull(toString((SELECT count() FROM mock.orig  WHERE interaction_id = 'I4')), 'NULL'),
         ifNull(toString((SELECT count() FROM mock.fixed WHERE interaction_id = 'I4')), 'NULL')),

        -- F5: transfer counters
        ('F5', 'I1 num_agent_transfers_initiated', '1',
         ifNull(toString((SELECT any(num_agent_transfers_initiated) FROM mock.orig  WHERE interaction_id = 'I1')), 'NULL'),
         ifNull(toString((SELECT any(num_agent_transfers_initiated) FROM mock.fixed WHERE interaction_id = 'I1')), 'NULL')),

        ('F5', 'I1 num_agent_transfers_completed', '1',
         ifNull(toString((SELECT any(num_agent_transfers_completed) FROM mock.orig  WHERE interaction_id = 'I1')), 'NULL'),
         ifNull(toString((SELECT any(num_agent_transfers_completed) FROM mock.fixed WHERE interaction_id = 'I1')), 'NULL')),

        ('F5', 'I1 num_account_transfers_initiated', '1',
         ifNull(toString((SELECT any(num_account_transfers_initiated) FROM mock.orig  WHERE interaction_id = 'I1')), 'NULL'),
         ifNull(toString((SELECT any(num_account_transfers_initiated) FROM mock.fixed WHERE interaction_id = 'I1')), 'NULL')),

        ('F5', 'I1 num_account_transfers_completed', '1',
         ifNull(toString((SELECT any(num_account_transfers_completed) FROM mock.orig  WHERE interaction_id = 'I1')), 'NULL'),
         ifNull(toString((SELECT any(num_account_transfers_completed) FROM mock.fixed WHERE interaction_id = 'I1')), 'NULL')),

        -- F6: terminated time duplicated the end time
        ('F6', 'I1 agent_interaction_terminated_time', '2026-08-20 12:05:00.000',
         ifNull(toString((SELECT any(agent_interaction_terminated_time) FROM mock.orig  WHERE interaction_id = 'I1')), 'NULL'),
         ifNull(toString((SELECT any(agent_interaction_terminated_time) FROM mock.fixed WHERE interaction_id = 'I1')), 'NULL')),

        ('F6', 'I2 previous_interaction_end_state', 'terminated',
         ifNull(toString((SELECT any(previous_interaction_end_state) FROM mock.orig  WHERE interaction_id = 'I2')), 'NULL'),
         ifNull(toString((SELECT any(previous_interaction_end_state) FROM mock.fixed WHERE interaction_id = 'I2')), 'NULL')),

        -- F7: EventValue4 reused for both queue name and enterprise id
        ('F7', 'I1 first_connected_agent_enterprise_id', 'bob@ex.com',
         ifNull(toString((SELECT any(first_connected_agent_enterprise_id) FROM mock.orig  WHERE interaction_id = 'I1')), 'NULL'),
         ifNull(toString((SELECT any(first_connected_agent_enterprise_id) FROM mock.fixed WHERE interaction_id = 'I1')), 'NULL')),

        -- F8: RESERVATION_ACCEPTED field mapping
        ('F8', 'I8 last_connected_agent_id', 'AGT-55',
         ifNull(toString((SELECT any(last_connected_agent_id) FROM mock.orig  WHERE interaction_id = 'I8')), 'NULL'),
         ifNull(toString((SELECT any(last_connected_agent_id) FROM mock.fixed WHERE interaction_id = 'I8')), 'NULL')),

        ('F8', 'I8 last_connected_queue_id', 'Q-700',
         ifNull(toString((SELECT any(last_connected_queue_id) FROM mock.orig  WHERE interaction_id = 'I8')), 'NULL'),
         ifNull(toString((SELECT any(last_connected_queue_id) FROM mock.fixed WHERE interaction_id = 'I8')), 'NULL')),

        ('F8', 'I8 is_connected', '1',
         ifNull(toString((SELECT any(is_connected) FROM mock.orig  WHERE interaction_id = 'I8')), 'NULL'),
         ifNull(toString((SELECT any(is_connected) FROM mock.fixed WHERE interaction_id = 'I8')), 'NULL')),

        ('F8', 'I8 first_connected_agent_name', 'Mia Agent',
         ifNull(toString((SELECT any(first_connected_agent_name) FROM mock.orig  WHERE interaction_id = 'I8')), 'NULL'),
         ifNull(toString((SELECT any(first_connected_agent_name) FROM mock.fixed WHERE interaction_id = 'I8')), 'NULL')),

        -- F9: the visitor's first message
        ('F9', 'I1 agent_interaction_interactive_time', '2026-08-20 12:00:13.000',
         ifNull(toString((SELECT any(agent_interaction_interactive_time) FROM mock.orig  WHERE interaction_id = 'I1')), 'NULL'),
         ifNull(toString((SELECT any(agent_interaction_interactive_time) FROM mock.fixed WHERE interaction_id = 'I1')), 'NULL')),

        -- F10: ifNull() default on an empty EventValue16
        ('F10', 'I5 agent_interaction_canceled_reason', 'visitor_leave',
         ifNull(toString((SELECT any(agent_interaction_canceled_reason) FROM mock.orig  WHERE interaction_id = 'I5')), 'NULL'),
         ifNull(toString((SELECT any(agent_interaction_canceled_reason) FROM mock.fixed WHERE interaction_id = 'I5')), 'NULL')),

        -- F11: requested queue sourced from cancellation events
        ('F11', 'I1 first_requested_queue_id', 'Q-100',
         ifNull(toString((SELECT any(first_requested_queue_id) FROM mock.orig  WHERE interaction_id = 'I1')), 'NULL'),
         ifNull(toString((SELECT any(first_requested_queue_id) FROM mock.fixed WHERE interaction_id = 'I1')), 'NULL')),

        -- F12: agent mailbox landing in the consumer email column
        ('F12', 'I1 email', 'NULL',
         ifNull(toString((SELECT any(email) FROM mock.orig  WHERE interaction_id = 'I1')), 'NULL'),
         ifNull(toString((SELECT any(email) FROM mock.fixed WHERE interaction_id = 'I1')), 'NULL')),

        -- F13: epoch 0 emitted as a real value
        ('F13', 'I3 start_time (never connected)', 'NULL',
         ifNull(toString((SELECT any(start_time) FROM mock.orig  WHERE interaction_id = 'I3')), 'NULL'),
         ifNull(toString((SELECT any(start_time) FROM mock.fixed WHERE interaction_id = 'I3')), 'NULL')),

        ('F13', 'I1 interaction_ended_time (never resolved)', 'NULL',
         ifNull(toString((SELECT any(interaction_ended_time) FROM mock.orig  WHERE interaction_id = 'I1')), 'NULL'),
         ifNull(toString((SELECT any(interaction_ended_time) FROM mock.fixed WHERE interaction_id = 'I1')), 'NULL')),

        -- F14: SLA flag for an interaction that never connected
        ('F14', 'I3 is_connected_sla_met', 'NULL',
         ifNull(toString((SELECT any(is_connected_sla_met) FROM mock.orig  WHERE interaction_id = 'I3')), 'NULL'),
         ifNull(toString((SELECT any(is_connected_sla_met) FROM mock.fixed WHERE interaction_id = 'I3')), 'NULL')),

        -- F15: previous_* chain when the ordering key is NULL. The original
        -- happens to agree here; the ordering is unspecified rather than wrong,
        -- so see the F15 anti-pattern reproduction for the inverted case.
        ('F15', 'I10 previous_interaction_id (order-dependent)', 'I9',
         ifNull(toString((SELECT any(previous_interaction_id) FROM mock.orig  WHERE interaction_id = 'I10')), 'NULL'),
         ifNull(toString((SELECT any(previous_interaction_id) FROM mock.fixed WHERE interaction_id = 'I10')), 'NULL')),

        -- Regression guards: behaviour that was already correct
        ('OK', 'I1 agent_handle_time', '289000',
         ifNull(toString((SELECT any(agent_handle_time) FROM mock.orig  WHERE interaction_id = 'I1')), 'NULL'),
         ifNull(toString((SELECT any(agent_handle_time) FROM mock.fixed WHERE interaction_id = 'I1')), 'NULL')),

        ('OK', 'I1 total_queue_wait_time (replay deduplicated)', '12000',
         ifNull(toString((SELECT any(total_queue_wait_time) FROM mock.orig  WHERE interaction_id = 'I1')), 'NULL'),
         ifNull(toString((SELECT any(total_queue_wait_time) FROM mock.fixed WHERE interaction_id = 'I1')), 'NULL')),

        ('OK', 'I1 is_premium_visitor', '1',
         ifNull(toString((SELECT any(is_premium_visitor) FROM mock.orig  WHERE interaction_id = 'I1')), 'NULL'),
         ifNull(toString((SELECT any(is_premium_visitor) FROM mock.fixed WHERE interaction_id = 'I1')), 'NULL')),

        ('OK', 'I1 url prefers the visitorInfo blob', 'https://ex.com/from-visitorinfo',
         ifNull(toString((SELECT any(url) FROM mock.orig  WHERE interaction_id = 'I1')), 'NULL'),
         ifNull(toString((SELECT any(url) FROM mock.fixed WHERE interaction_id = 'I1')), 'NULL')),

        ('OK', 'I1 chat_log lines (bot + agent turns)', '4',
         ifNull(toString((SELECT length(splitByChar('\n', ifNull(any(chat_log), ''))) FROM mock.orig  WHERE interaction_id = 'I1')), 'NULL'),
         ifNull(toString((SELECT length(splitByChar('\n', ifNull(any(chat_log), ''))) FROM mock.fixed WHERE interaction_id = 'I1')), 'NULL'))
    )
)
SELECT
    finding,
    check,
    expected,
    original,
    fixed,
    if(original = expected, 'pass', 'FAIL') AS as_supplied,
    if(fixed    = expected, 'pass', 'FAIL') AS corrected
FROM checks
ORDER BY finding, check;
