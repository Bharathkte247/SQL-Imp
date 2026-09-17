# SQL-Imp
All required SQLs

## ClickHouse queries

- `sql/chat_and_aiva_interactions.sql` — Chat interactions ∪ standalone AIVA interactions from `ftbank.digital_interaction_view` for a date window (default Aug 2026).
  - **Chat set:** `chat_interaction_id IS NOT NULL`
  - **AIVA-only set:** `aiva_interaction_id` not already present on any chat row in the same window (`LEFT ANTI JOIN`)
  - Single period scan + `bounds` CTE; original `NOT IN` form kept in `sql/chat_and_aiva_interactions__original.sql`
