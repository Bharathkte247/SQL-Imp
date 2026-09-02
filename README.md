# SQL-Imp
All required SQLs

## ClickHouse queries

- `customer_chatlog_extraction.sql` — One row per `ConversationId` with a combined customer chat log from `ftbank.eg_agentic_runtime_distributed`. Uses customer `MESSAGE_RECEIVED` / `MESSAGE_SENT` events (`EventValue2 = 'customer'`, `InteractionId IS NULL`), extracts text between `&gt;…&lt;` in `EventValue1`, and prefixes the result with `info: `.
