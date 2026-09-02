# SQL-Imp
All required SQLs

## ClickHouse queries

- `customer_chatlog_extraction.sql` — One row per `ConversationId` with a **single text blob** `combined_chat_log` from `{{ params.client_schema }}.eg_agentic_runtime_distributed`.
  - **visitor** = `MESSAGE_RECEIVED` + `EventValue2 = 'customer'`
  - **Brand** = `MESSAGE_SENT` + `EventValue2 = 'customer'`
  - Removes HTML tags (including entity-encoded `&lt;…&gt;` and truncated tags) and JSON wrappers/`"key":` noise from `EventValue1`
  - Blob format:

```text
visitor: Main Menu
Brand: I'm happy to help with your online banking needs.
```
