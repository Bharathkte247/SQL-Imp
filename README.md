# SQL-Imp
All required SQLs

## ClickHouse queries

- `customer_chatlog_extraction.sql` — One row per `ConversationId` with a **single text blob** `combined_chat_log` from `{{ params.client_schema }}.eg_agentic_runtime_distributed`.
  - **User** = `MESSAGE_RECEIVED` + `EventValue2 = 'customer'`
  - **Bot** = `MESSAGE_SENT` + `EventValue2 = 'customer'`
  - Strips HTML / noise from `EventValue1`, orders by time
  - Blob format (newlines inside one String column):

```text
[YYYY-MM-DD HH:MM:SS] User: Main Menu
[YYYY-MM-DD HH:MM:SS] Bot: I'm happy to help with your online banking needs.
```
