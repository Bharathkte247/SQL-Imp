# SQL-Imp
All required SQLs

## ClickHouse queries

- `customer_chatlog_extraction.sql` — `bot_info` CTE: one row per `ConversationId` with a combined customer chat log from `{{ params.client_schema }}.eg_agentic_runtime_distributed`. Uses customer `MESSAGE_RECEIVED` / `MESSAGE_SENT` events (`EventValue2 = 'customer'`), sorts by `EventTimeStampEpoch`, strips HTML tags from `EventValue1`, and prefixes with `info: `. Includes a commented standalone SELECT for sample ConversationIds.
