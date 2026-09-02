# SQL-Imp
All required SQLs

## ClickHouse queries

- `customer_chatlog_extraction.sql` — Human-readable user + bot transcript per `ConversationId` from `{{ params.client_schema }}.eg_agentic_runtime_distributed`.
  - **User** = `MESSAGE_RECEIVED` + `EventValue2 = 'customer'` (menu picks / visitor text)
  - **Bot** = `MESSAGE_SENT` + `EventValue2 = 'customer'` (HAL-E / concierge HTML replies)
  - Strips HTML (`<div class="hxelement">`, `<p>`, …), drops empty/noise lines, orders by time
  - Output: newline transcript like `[YYYY-MM-DD HH:MM:SS] User: …` / `[YYYY-MM-DD HH:MM:SS] Bot: …`, plus separate `user_chat_log` and `bot_chat_log`
