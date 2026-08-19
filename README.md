# SQL-Imp
All required SQLs

## ClickHouse queries

- `canceled_conversation_status.sql`: Day-level `ConversationId` × `InteractionId` canceled flag from `ftbank.all_events` (`CONVERSATION_STATUS_CHANGED` → status `canceled` / `cancelled` via `event_value_2` or `event_data` JSON).
