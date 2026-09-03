# Review: `assist_chatsession` ClickHouse query

The query under review is in `queries/assist_chatsession__original.sql`. A
corrected build is in `queries/assist_chatsession__fixed.sql`, and everything
below is reproducible with `tests/report.sh`.

## Headline

The query does not compile against a schema where `EventTimeStampEpoch` is
unsigned, and once that single line is patched so it can run, **23 of 29
assertions over a hand-built fixture come back wrong**. Two of the failures lose
or invent output rows; the rest are wrong values in columns that look populated,
which is the more dangerous category because nothing downstream can detect them.

The defects are not 24 independent mistakes. They come from five recurring
misunderstandings of ClickHouse semantics:

| Root cause | What breaks |
| --- | --- |
| `JSONExtractString` returns `''`, never `NULL` | every `coalesce()` / `ifNull()` fallback over a JSON read is dead code |
| A missed `LEFT JOIN` fills defaults, not `NULL` | `coalesce(a.x, b.x)` across CTEs never reaches `b` |
| A non-`Nullable` `String` column is never `NULL` | `InteractionId IS NOT NULL` is always true; blank ids are kept as `''` |
| `minIf()` over zero matching rows returns `0` | epoch 0 is emitted as a real timestamp |
| Window functions ignore the query's `WHERE` | the `row_number()` transfer gates are effectively always false |

## How this was verified

`tests/fixtures.sql` builds the two source tables and a 10-interaction event
stream: a conversation handed off between two agents after an agent timeout, an
abandoned queue attempt, a chat with messages but no lifecycle events, two
interactions whose `InteractionId` column is blank, one connected through
`RESERVATION_ACCEPTED` instead of `AGENT_ASSIGNED`, two queue attempts in one
conversation that never connect, and a replayed duplicate event. Expected values
for each are hand-computed in `tests/expectations.sql`.

```
$ tests/report.sh
== the query as supplied ==
   FAILED to run:
   Code: 43. DB::Exception: Illegal type Variant(Int64, UInt64) of argument of
   aggregate function min ... (ILLEGAL_TYPE_OF_ARGUMENT)

== summary ==
   ┌─interactions_in_fixture─┬─original_rows─┬─fixed_rows─┐
1. │                      10 │             9 │         10 │
   └─────────────────────────┴───────────────┴────────────┘
```

Nine rows for ten interactions is not one row missing — it is two interactions
merged into one, one interaction duplicated into two, and one dropped entirely.

---

## Findings

### F1 — Does not compile: signed/unsigned mix (blocker)

In `additional_timestamps.start_time`:

```sql
coalesce(
  toInt64OrNull(...'queuedTime'),     -- Int64
  toInt64OrNull(...'TaskDateCreated'),-- Int64
  event_time_epoch                    -- UInt64
)
```

`Int64` and `UInt64` have no common supertype, so the result is
`Variant(Int64, UInt64)` and `minIf` refuses it. Fails identically under both
the new and legacy analyzer. Fix: `toInt64(event_time_epoch)`.

This only bites when `EventTimeStampEpoch` is unsigned. It is a latent trap
either way, because the same column is treated as signed here and unsigned
everywhere else.

### F2 — Interactions with a blank `InteractionId` are merged together (data loss)

```sql
coalesce(InteractionId, JSONExtractString(data, 'TaskAttributes', 'interactionId'), ...)
WHERE InteractionId IS NOT NULL
```

`InteractionId` is a non-`Nullable` `String`, so the `WHERE` filters nothing and
`coalesce` returns `''` rather than trying the payload. Every event with a blank
id lands in one `''` group, and `GROUP BY interaction_id` collapses them into a
single output row.

In the fixture, I6 (`ACCT-5` / `CONV-7`) and I7 (`ACCT-6` / `CONV-8`) are
unrelated conversations. The original emits one row stitched from both:

```
interaction_id:                   (blank)
account_id:                       ACCT-5      <- from I6
chat_conversation_id:             CONV-7      <- from I6
first_connected_agent_name:       Kyle Agent  <- from I7
total_queue_wait_time:            101000      <- I6 created -> I7 assigned
```

That last value is a queue wait measured across two different conversations.
Fix: `nullIf(InteractionId, '')` before the `coalesce`, and drop events whose id
is still unresolvable rather than bucketing them under `''`.

### F3 — `chat_log` splits one interaction across several rows (row duplication)

```sql
GROUP BY t1.interaction_id, combined_chat_log
...
LEFT JOIN combined_chat AS t2 ON t1.event_value_2 = t2.interaction_id
```

The join key is per-event `EventValue2`. When an interaction's message events do
not all carry the same conversation id, the interaction gets one group per
distinct bot transcript, and the `LEFT JOIN chat_log` in `combined` multiplies
the output. Fixture interaction I5 comes out twice, with its transcript split:

```
Row 1: I5 | visitor: bot leg for CONV-5 \n Gina(...): Are you there?
Row 2: I5 | visitor: bot leg for CONV-6 \n Helen Agent(...): One moment
```

Neither row holds the full conversation. Fix: aggregate the agent-side log per
`interaction_id` only, and join the bot-side log on the interaction's single
resolved conversation id.

### F4 — The final `WHERE` silently drops interactions

```sql
WHERE toDate(agent_interaction_requested_time) >= toDate('{{ params.cutoff_date }}')
```

`agent_interaction_requested_time` is `NULL` whenever no
`CONVERSATION_CREATED`/`CONVERSATION_STATUS_CHANGED` event was captured, and
`toDate(NULL) >= ...` is `NULL`, which the `WHERE` treats as false. Fixture
interaction I4 (messages only, in range) disappears. Fix: date the row from the
first available timestamp instead.

### F5 — All six transfer counters are structurally 0

Two independent problems.

The `row_number()` gate is computed over the whole unfiltered event partition,
so `is_conversation_end_event` is only ever 1 if the interaction's very first
event happens to be a terminal one:

```
CONVERSATION_CREATED    rn=1  is_conversation_end_event=0
AGENT_ASSIGNED          rn=2  is_conversation_end_event=0
CONVERSATION_TERMINATED rn=3  is_conversation_end_event=0
CONVERSATION_ENDED      rn=4  is_conversation_end_event=0
```

And the "completed" counters ask for one event to be two things at once:

```sql
uniqIf(event_value_2,
  event_name = 'CONVERSATION_TERMINATED' ...
  AND is_second_interaction_created_event = 1)   -- only set on CONVERSATION_CREATED
```

Those predicates are mutually exclusive, so the result is unconditionally 0.

Separately, the account-transfer counters test
`coalesce(event_value_2, ...'TransferType') = 'account'`. `EventValue2` is the
conversation id and is never `NULL`, so the payload fallback is unreachable and
the comparison is never true. The fixture contains an account transfer with
`TransferStatus=completed` and an agent-timeout handoff that is picked up by a
second interaction; the original reports 0 for all four.

`uniqIf` over a conversation id is also the wrong aggregate for a count — it
saturates at 1 no matter how many transfers occurred.

### F6 — `agent_interaction_terminated_time` duplicates `agent_interaction_end_time`

Both are `minIf(..., event_name IN ('CONVERSATION_ENDED'))`, so they are always
equal and the real `CONVERSATION_TERMINATED` time is never reported (fixture I1:
`12:05:01` instead of `12:05:00`).

This also makes one branch of `previous_interaction_end_state` unreachable:

```sql
multiIf(is_canceled, 'canceled',
        agent_interaction_end_time IS NOT NULL, 'resolved',
        agent_interaction_terminated_time IS NOT NULL, 'terminated',  -- dead
        'unknown')
```

Because the two columns are identical, `'resolved'` always wins. I1 was
terminated on an agent timeout, yet I2 reports its predecessor as `resolved`.

### F7 — `EventValue4` is read as two different fields

In `first_agent`/`last_agent`, element 3 is the queue name and element 6 the
agent's enterprise id, but both read `event_value_4`:

```sql
coalesce(event_value_4, ...'TaskAttributes','queueId'),      -- queue name
coalesce(event_value_4, ...'WorkerAttributes','email'),      -- enterprise id
```

So `first_connected_agent_enterprise_id` echoes the queue name — `Sales Queue`
where `bob@ex.com` is expected. Element 2 reads `event_value_3` for the queue id
while element 3 reads `event_value_4` as the queue *name*, and element 7/8 both
fall back to `TaskAttributes.TeamId`, so team name falls back to team id.

### F8 — `RESERVATION_ACCEPTED` is decoded with the `AGENT_ASSIGNED` layout

`last_agent` and `last_agent_started` read the same event set with different
positional mappings, then are stitched with
`coalesce(la.last_agent_info.N, las.last_agent_started_info.N)`. That fallback
can never fire: `la` matches the same rows as `las`, and even when it does not,
a missed `LEFT JOIN` yields `''` rather than `NULL` (F17). `last_agent` always
wins, including for events its mapping does not fit.

Fixture interaction I8 connects via `RESERVATION_ACCEPTED`:

```
last_connected_queue_id:   Mia Agent     (expected Q-700)
last_connected_queue_name: mia@ex.com    (expected Onboarding Queue)
last_connected_agent_id:   Q-700         (expected AGT-55)
last_connected_agent_name: (empty)       (expected Mia Agent)
is_connected:              0             (expected 1)
first_connected_agent_id:  (empty)       (expected AGT-55)
```

Every identity column holds another column's value. `is_connected` and
`first_agent` only count `AGENT_ASSIGNED`, while `last_agent`, `lists`,
`agent_sessions` and `time_metrics.last_queue_wait_time` also count
`RESERVATION_ACCEPTED` — so a chat can be reported as never connected while
still carrying a last-connected agent.

The argMax tie-break in `last_agent` is dead code too: it ranks
`CONVERSATION_ENDED` first, but the `WHERE` excludes that event.

### F9 — `agent_interaction_interactive_time` looks for an impossible event

```sql
minIf(..., event_name = 'MESSAGE_SENT' AND lower(event_value_18) = 'user')
```

The visitor's traffic arrives as `MESSAGE_RECEIVED`; `MESSAGE_SENT` is the agent
side, as the query's own `chat_log` CTE assumes when it labels `MESSAGE_SENT` as
`'Agent'`. The two conditions never co-occur, so the column is always `NULL`
(fixture I1 has a visitor message at `12:00:13`). The comment also says "last"
while the code takes `min`.

### F10 — `ifNull` cannot supply the `visitor_leave` default

```sql
anyIf(ifNull(event_value_16, 'visitor_leave'), ...)
```

`EventValue16` is a non-`Nullable` `String`, so an absent reason arrives as `''`
and `ifNull` passes it through. Fixture I5 is canceled with no reason and
reports `''` rather than `visitor_leave`.

### F11 — `first_requested_*` is read from cancellation events

`queue_request_info` is filtered to
`event_name='CONVERSATION_ENDED' AND lower(event_value_5)='canceled'`, so:

- `first_requested_queue_id` / `_name` read `TaskAttributes.queueId` off a
  *cancel* event and come out empty for every row, including canceled ones.
- `last_requested_*` is populated only for abandoned chats and `NULL` for every
  chat that connected.

The commented-out version directly above reads the request events and looks like
the intended logic.

### F12 — The consumer `email` column reads the agent-side JSON path

```sql
any(JSONExtractString(..., 'WorkerAttributes', 'email')) AS email
```

`WorkerAttributes` describes the agent, and the CTE is restricted to
`CONVERSATION_CREATED` events, where no agent is assigned yet. So the column
returns either the agent's mailbox or nothing — never the consumer's address.
The fixture carries `TaskAttributes.email = alice@customer.example` on I1's
`CONVERSATION_CREATED`; the original reports `''`. In an earlier fixture
revision that put the agent block on every event, it reported `bob@ex.com` for
every row, so both failure modes are reachable depending on the producer.

### F13 — Epoch 0 is emitted as a real timestamp

`timestamps` guards every aggregate with `nullIf(..., toDateTime64(0,3))`;
`additional_timestamps` guards none of them. `minIf()` over zero matching rows
returns `0`, so `interaction_initiated_time`, `interaction_ended_time` and
`start_time` publish `0` (1970-01-01) instead of "unknown". In the fixture, I3
never connected yet reports `start_time = 0`, and I1 never resolved yet reports
`interaction_ended_time = 0`.

### F14 — SLA flags report "not met" for chats that never connected

```sql
if(tm.first_queue_wait_time < 30000, 1, 0)
```

With a `NULL` wait time the comparison is `NULL` and `if` takes the else branch,
so `0` means both "waited too long" and "never connected". Any SLA rate computed
from this column is understated by the volume of abandoned chats.

### F15 — The `previous_*` chain is decided by physical row order

The window is `ORDER BY agent_interaction_start_time`, which is `NULL` for every
interaction that never connected — precisely the abandoned and transferred
attempts these columns exist to describe. With a tied/`NULL` key the ordering is
unspecified, and `lagInFrame` returns whatever row the executor happened to
place before the current one:

```
interaction_id | requested | previous_interaction_id
I9             | 12:20     | I10     <- the *later* interaction
I10            | 12:21     | (empty) <- the earlier one has no predecessor
```

Same data, different physical order, inverted answer. On the fixture the
original happens to agree with the expected value, which is exactly the problem:
the result is unspecified rather than reliably wrong, so it will drift with part
layout, thread count or a merge. Fix: order by a column that is always present
(the request time), with `interaction_id` as tie-break.

### F16 — `coalesce` over a JSON read is dead code (systemic)

`JSONExtractString` returns `''` for a missing key or non-JSON input, so:

```sql
coalesce(JSONExtractString('{"a":1}','missing'), 'FALLBACK')  -> ''  (not FALLBACK)
```

Every `coalesce(JSONExtractString(...), ...)` and
`coalesce(event_value_N, JSONExtractString(...))` in the query is therefore a
no-op that silently yields `''`. This is what neutralises the fallbacks in
`core_attributes`, `first_agent`, `last_agent`, `lists`, `invitation_info`,
`interaction_attributes.transfer_initiator_async` and the account-transfer
counters. Fix: `nullIf(..., '')` at every read site.

### F17 — `coalesce` across a `LEFT JOIN` is dead code (systemic)

With the default `join_use_nulls = 0`, a non-matching `LEFT JOIN` fills type
defaults:

```
right_side_value | right_side_is_null | coalesce_across_join
                 |                  0 |
```

So `coalesce(la.x, las.x)` never reaches `las`, and `IS NULL` checks on joined
non-`Nullable` columns never fire. Either enable `join_use_nulls`, or (as in the
corrected build) do not rely on cross-CTE `coalesce` at all.

### F18 — `any()` over every event picks an arbitrary row (systemic)

`is_premium_visitor`, `chat_conversation_id`, `account_name`, `uuid_session_id`
and the `visitor_extended_info` / `interaction_context` columns aggregate with
`any()` over *all* events of an interaction, while the attribute exists on only
one event type. The answer depends on scan order:

```
any_created_first | any_created_last | order_independent
true              |                  | true
```

`is_premium_visitor` returned `true` on the fixture and `''` on the same data
read in reverse. `chat_conversation_id` is the worst case, because it partitions
the `previous_*` window functions and `EventValue2` does not mean the same thing
on every event type. Fix: `anyIf(..., event_name = <the event that carries it>)`
or an order-independent aggregate such as `maxIf`.

### F19 — Two incompatible payload access shapes

Seven extractions read the payload directly, e.g.
`JSONExtractString(data, 'TaskAttributes', 'interactionId')`, while 122 read it
through a wrapper, `JSONExtractString(JSONExtractString(data, 'string'), ...)`.
Only one shape can match the real payload:

```
unwrapped_path | wrapped_path
               | I1
```

Whichever shape `data` has, one whole family of extractions returns `''`. The
corrected build unwraps once into a `payload` alias that tolerates both. The
`transfers` CTE contains the same split *and* misspells the key
(`interaction_Id` vs `interactionId`).

### Lower severity

- **`agent_handle_time` and `agent_chat_time` are byte-identical expressions.**
  If they are meant to differ (handle time usually includes wrap-up), one is
  wrong. Same for `chat_abandoned_time` / `interaction_cancelled_time` and
  `agent_interaction_end_time` / `chat_end_date_time`.
- **`MESSAGE_CREATED` is not a name this source emits.** It appears in
  `timestamps.agent_interaction_start_time`, `outbound_info` and
  `interaction_attributes`, while `chat_log` and `status_flags` use
  `MESSAGE_SENT` / `MESSAGE_RECEIVED`. The `MESSAGE_CREATED` branches never
  match, so `consumer_channel`, `topic`, `customer_state`,
  `transfer_initiator_async` and the eight `outbound_*` columns only ever see
  `CONVERSATION_CREATED`/`CONVERSATION_UPDATED` payloads.
- **`agent_interaction_start_time` mixes two meanings.** It takes the `min` of
  the assignment event and any `MESSAGE_CREATED`, so a message that precedes
  assignment would silently become the "agent start" time. Prefer the connect
  event and fall back only when it is absent.
- **`list_of_queues_involved` contains queue names**, not ids: it reads
  `event_value_4` while `first_connected_queue_id` reads `event_value_3`. Empty
  strings are not filtered out either, so the list can be `",,"`.
- **`ORDER BY` inside the derived table.** `SELECT * FROM (... ORDER BY ...)` is
  not an ordering guarantee once the outer query parallelises or feeds an
  `INSERT`; it does guarantee a full sort. It held on the fixture, but the sort
  key is `NULL` for every unconnected interaction anyway. Move it to the outer
  query, or drop it.
- **The date filter defeats index pruning.**
  `toDate(fromUnixTimestamp64Milli(event_time_epoch)) >= toDate(...)` wraps the
  column in functions; comparing the raw epoch against
  `toUnixTimestamp64Milli(...)` lets the primary key/partition be used. Same for
  the second source table, which currently has no time filter at all and is
  scanned in full.
- **Dead columns.** `conversation_created_time`, `first_agent_assigned_time`,
  `first_queued_time`, `visitor_info_str`, `last_connected_account_id_temp` and
  `last_agent_info.9` are computed and never read.
- **`visitor_info_parsed` is not aggregated**, so joining it multiplies rows
  inside `visitor_info` and `interaction_context`. `GROUP BY` hides the
  duplication but makes the surrounding `any()` calls even more arbitrary.
- **`chat_log` timestamps are `US/Eastern`** while every other timestamp column
  is server-time/UTC, so a row's `chat_log` disagrees with its own
  `agent_interaction_start_time`.
- **`SELECT *, coalesce(interaction_id, ...) AS interaction_id`** in `transfers`
  shadows a column coming from `*`. It resolves to the redefinition on both the
  new and legacy analyzer, so it is not a live bug, but it is worth renaming.
- **The dedup tie-break is not deterministic.**
  `row_number() OVER (PARTITION BY event_unique_id ORDER BY event_time_epoch DESC)`
  leaves ties (identical replays) to chance. Harmless for exact duplicates, not
  for replays whose payloads differ.
- **`agent_exit_type` yields `''`, not `NULL`**, when the condition never
  matches, because `anyIf` over an empty set returns the type default.

---

## What the corrected build changes

`queries/assist_chatsession__fixed.sql` keeps the output contract identical —
**177 columns, same names, same order** — and passes all 29 assertions.

Structural changes:

1. The payload is unwrapped once into `payload`, tolerating both
   `{"string":"{...}"}` and a plain object.
2. Every read that can be absent is turned into a real `NULL` with
   `nullIf(x, '')` at the read site, so `coalesce` works.
3. `base_events` derives normalised `agent_id`, `agent_name`,
   `agent_enterprise_id`, `queue_id`, `queue_name`, `agent_team_id`,
   `agent_team_name` per event type, replacing `first_agent`, `last_agent` and
   `last_agent_started` with a single `agent_info` CTE. No cross-CTE `coalesce`
   remains.
4. Transfer counters are counted directly from termination reasons; "completed"
   is derived from whether a later interaction picks the conversation up
   (`leadInFrame` over the conversation window).
5. `any()` is replaced with `anyIf(..., event_name = ...)` or `countIf` wherever
   the attribute belongs to one event type.
6. The chat log is aggregated per interaction, with the bot transcript joined on
   the interaction's single resolved conversation id.
7. Window ordering uses
   `coalesce(requested_time, start_time, first_event_time)` with `interaction_id`
   as tie-break.
8. The output date falls back through the available timestamps, and `ORDER BY`
   moved to the outer query.

**Deployment note.** Honest `NULL`s change 115 of the 177 column types: 109
`String` → `Nullable(String)`, `interaction_initiated_time` /
`interaction_ended_time` `UInt64` → `Nullable(UInt64)`, `start_time`
`Int64` → `Nullable(Int64)`, and the three SLA flags
`UInt8` → `Nullable(UInt8)`. If the destination table cannot be altered, wrap
the final projection in `ifNull(col, '')` / `ifNull(col, 0)` — but note that
restoring `0` for `start_time` and the SLA flags re-introduces F13 and F14.

**Needs confirmation.** The positional `EventValue` → field mapping is the one
thing the query cannot be used to derive, because it contained two contradictory
mappings for the same events (F7, F8). The corrected build picks one per event
type; it should be checked against the producer's event contract before this
ships.
