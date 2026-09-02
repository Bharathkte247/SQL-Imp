# SQL-Imp
All required SQLs

## ClickHouse queries

- `customer_chatlog_extraction.sql` — `bot_info` CTE: one row per `ConversationId` with user + bot chat logs from `{{ params.client_schema }}.eg_agentic_runtime_distributed`. On the customer channel (`EventValue2 = 'customer'`): `MESSAGE_RECEIVED` → user, `MESSAGE_SENT` → bot. Returns `combined_chat_log` (labeled `user:` / `bot:` transcript), plus separate `user_chat_log` and `bot_chat_log`. HTML tags stripped from `EventValue1`; ordered by `EventTimeStampEpoch`.
