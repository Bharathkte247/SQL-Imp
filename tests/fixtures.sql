-- ============================================================================
-- Test fixtures for reviewing queries/assist_chatsession__original.sql
--
-- Builds two mock source tables plus a small, hand-checkable event stream so
-- the query can actually be executed and its output compared against the
-- values a human would expect.
--
-- Schemas mirror the shape the query assumes: flat EventValue1..20 / EventKey16
-- columns plus a `data` column holding the raw payload.
--
-- `data` is stored in the shape the query mostly assumes, i.e. the payload is a
-- JSON *string* under the key "string":
--     {"string": "{\"TaskAttributes\":{...},\"WorkerAttributes\":{...}}"}
-- ============================================================================

DROP DATABASE IF EXISTS mock;
CREATE DATABASE mock;

CREATE TABLE mock.eg_assist_cw_distributed
(
    InteractionId        String,
    ConversationId       String,
    EventName            String,
    EventUniqueId        String,
    EventTimeStampEpoch  UInt64,
    ChannelUserId        String,
    EventValue1          String,
    EventValue2          String,
    EventValue3          String,
    EventValue4          String,
    EventValue5          String,
    EventValue6          String,
    EventValue7          String,
    EventValue8          String,
    EventValue9          String,
    EventValue10         String,
    EventValue11         String,
    EventValue12         String,
    EventValue13         String,
    EventValue14         String,
    EventValue15         String,
    EventValue16         String,
    EventValue17         String,
    EventValue18         String,
    EventValue19         String,
    EventValue20         String,
    EventKey16           String,
    data                 String,
    ClientOrg            String
)
ENGINE = MergeTree
ORDER BY (EventTimeStampEpoch, EventUniqueId);

CREATE TABLE mock.eg_agentic_runtime_distributed
(
    ConversationId       String,
    InteractionId        String,
    EventName            String,
    EventTimeStampEpoch  UInt64,
    EventValue1          String,
    EventValue2          String
)
ENGINE = MergeTree
ORDER BY (EventTimeStampEpoch);

-- ---------------------------------------------------------------------------
-- Staging table: `ev` is EventValue1..20, `ta` / `wa_ta` are raw JSON object
-- bodies, `vi` is the visitorInfo payload (embedded as a JSON *string*).
-- ---------------------------------------------------------------------------
CREATE TABLE mock.raw
(
    off      Int64,          -- ms offset from the base timestamp
    iid      String,
    euid     String,
    name     String,
    cuid     String,
    ev       Array(String),
    key16    String,
    ta       String,
    wa_ta    String,
    vi       String
)
ENGINE = MergeTree ORDER BY off;

-- ============================================================================
-- Scenario
--   CONV-1 : two interactions, I1 handed off to I2 after an agent timeout.
--   CONV-2 : I3, visitor cancels while still queued (never connected).
--   I1 also receives a replayed duplicate of its AGENT_ASSIGNED event.
-- ============================================================================
INSERT INTO mock.raw (off, iid, euid, name, cuid, ev, key16, ta, wa_ta, vi) VALUES
-- ---- I1 -------------------------------------------------------------------
(0,      'I1', 'E-I1-001', 'CONVERSATION_CREATED',        'visitor-alice',
 ['ACCT-1','CONV-1','Q-100','Sales Queue','','','','TEAM-1','Team One','','','Alice','','','','','','','',''],
 '',
 '{"accountId":"ACCT-1","chatConversationId":"CONV-1","queueId":"Q-100","queueName":"Sales Queue","interactionSourceType":"web","isPremiumVisitor":"true","url":"https://ex.com/pricing","country":"US","city":"Boston","customField01":"CF-ONE","accountName":"Acme","interactionId":"I1","buttonName":"chat-now","ruleId":"RULE-TA"}',
 '{"chatInteractionType":"SYNC","conversationId":"CONV-1","repeatVisitorCount":"2","isVisitorVerified":"true","sourceServiceChannel":"web-chat"}',
 '{"url":"https://ex.com/from-visitorinfo","geoCountry":"US","geoCity":"New York","geoWorldRegion":"NA","geoPostalCode":"10001","ipAddress":"1.2.3.4","operatingSystem":"macOS","browser":"Chrome","deviceId":"DEV-9","ruleId":"RULE-VI","tpId":"TP-3"}'),

(1000,   'I1', 'E-I1-002', 'CONVERSATION_STATUS_CHANGED', 'visitor-alice',
 ['ACCT-1','CONV-1','','','','','','','','','','','','','','','','','',''],
 '', '{"queueId":"Q-100"}', '{}', ''),

-- agent connects 12s after the request
(12000,  'I1', 'E-I1-003', 'AGENT_ASSIGNED',              'visitor-alice',
 ['ACCT-1','CONV-1','Q-100','Sales Queue','','AGT-77','Bob Agent','TEAM-1','Team One','','','Alice','','','assigned','','','','',''],
 '', '{"queueId":"Q-100","queueName":"Sales Queue"}', '{"WorkerName":"AGT-77","full_name":"Bob Agent","email":"bob@ex.com"}', ''),

-- upstream replay: identical EventUniqueId, must be deduplicated
(12000,  'I1', 'E-I1-003', 'AGENT_ASSIGNED',              'visitor-alice',
 ['ACCT-1','CONV-1','Q-100','Sales Queue','','AGT-77','Bob Agent','TEAM-1','Team One','','','Alice','','','assigned','','','','',''],
 '', '{"queueId":"Q-100","queueName":"Sales Queue"}', '{"WorkerName":"AGT-77","full_name":"Bob Agent","email":"bob@ex.com"}', ''),

(13000,  'I1', 'E-I1-004', 'MESSAGE_RECEIVED',            'visitor-alice',
 ['ACCT-1','CONV-1','','MSG-1','','','','','','','','Alice','','','','','Hi, I need help with billing','user','',''],
 '', '{}', '{}', ''),

(20000,  'I1', 'E-I1-005', 'MESSAGE_SENT',                'visitor-alice',
 ['ACCT-1','CONV-1','','MSG-2','','','','','','','','Bob Agent','','','','','<p>Happy to help!</p>','agent','',''],
 '', '{}', '{}', ''),

-- agent times out -> conversation is handed off
(300000, 'I1', 'E-I1-006', 'CONVERSATION_TERMINATED',     'visitor-alice',
 ['ACCT-1','CONV-1','','','','','','','','','','','','','','agent_timeout','','','',''],
 'TerminationReason', '{"chatConversationId":"CONV-1"}', '{}', ''),

(301000, 'I1', 'E-I1-007', 'CONVERSATION_ENDED',          'visitor-alice',
 ['ACCT-1','CONV-1','Q-100','Sales Queue','resolved','','','','','','','','','','','','','','',''],
 '', '{"chatConversationId":"CONV-1"}', '{}', ''),

-- ---- I2 (second leg of CONV-1) -------------------------------------------
(310000, 'I2', 'E-I2-001', 'CONVERSATION_CREATED',        'visitor-alice',
 ['ACCT-1','CONV-1','Q-200','Support Queue','','','','TEAM-2','Team Two','','','Alice','','','','','','','',''],
 '',
 '{"accountId":"ACCT-1","chatConversationId":"CONV-1","queueId":"Q-200","queueName":"Support Queue","interactionId":"I2"}',
 '{"chatInteractionType":"SYNC","conversationId":"CONV-1"}', ''),

(315000, 'I2', 'E-I2-002', 'AGENT_ASSIGNED',              'visitor-alice',
 ['ACCT-1','CONV-1','Q-200','Support Queue','','AGT-88','Carol Agent','TEAM-2','Team Two','','','Alice','','','assigned','','','','',''],
 '', '{"queueId":"Q-200","queueName":"Support Queue"}', '{"WorkerName":"AGT-88","full_name":"Carol Agent","email":"carol@ex.com"}', ''),

(600000, 'I2', 'E-I2-003', 'CONVERSATION_ENDED',          'visitor-alice',
 ['ACCT-1','CONV-1','Q-200','Support Queue','resolved','','','','','','','','','','','','','','',''],
 '', '{"chatConversationId":"CONV-1"}', '{}', ''),

-- ---- I3 (CONV-2, abandoned in queue) -------------------------------------
(400000, 'I3', 'E-I3-001', 'CONVERSATION_CREATED',        'visitor-dave',
 ['ACCT-2','CONV-2','Q-300','Billing Queue','','','','','','','','Dave','','','','','','','',''],
 '',
 '{"accountId":"ACCT-2","chatConversationId":"CONV-2","queueId":"Q-300","queueName":"Billing Queue","interactionId":"I3"}',
 '{"chatInteractionType":"ASYNC","conversationId":"CONV-2"}', ''),

(460000, 'I3', 'E-I3-002', 'CONVERSATION_ENDED',          'visitor-dave',
 ['ACCT-2','CONV-2','Q-300','Billing Queue','canceled','','','','','','','','','','','visitor_leave','','','',''],
 '', '{"chatConversationId":"CONV-2"}', '{}', ''),

-- ---- I4: messages only, no CONVERSATION_CREATED / STATUS_CHANGED ---------
(500000, 'I4', 'E-I4-001', 'MESSAGE_RECEIVED',            'visitor-erin',
 ['ACCT-3','CONV-3','','MSG-9','','','','','','','','Erin','','','','','Anyone there?','user','',''],
 '', '{}', '{}', ''),

(505000, 'I4', 'E-I4-002', 'MESSAGE_SENT',                'visitor-erin',
 ['ACCT-3','CONV-3','','MSG-10','','','','','','','','Frank Agent','','','','','On it','agent','',''],
 '', '{}', '{}', ''),

-- ---- account transfer on I1 (TransferType lives in the payload) ----------
(200000, 'I1', 'E-I1-008', 'CONVERSATION_UPDATED',        'visitor-alice',
 ['ACCT-1','CONV-1','Q-100','Sales Queue','','','','','','','','','','','','','','','',''],
 '', '{"TransferType":"account","TransferStatus":"completed","chatConversationId":"CONV-1"}', '{}', ''),

-- ---- I5: EventValue2 drifts between message events, empty cancel reason --
(700000, 'I5', 'E-I5-001', 'CONVERSATION_CREATED',        'visitor-gina',
 ['ACCT-4','CONV-5','Q-400','Retention Queue','','','','','','','','Gina','','','','','','','',''],
 '',
 '{"accountId":"ACCT-4","chatConversationId":"CONV-5","queueId":"Q-400","interactionId":"I5"}',
 '{"chatInteractionType":"SYNC","conversationId":"CONV-5"}', ''),

(701000, 'I5', 'E-I5-002', 'MESSAGE_RECEIVED',            'visitor-gina',
 ['ACCT-4','CONV-5','','MSG-11','','','','','','','','Gina','','','','','Are you there?','user','',''],
 '', '{}', '{}', ''),

(702000, 'I5', 'E-I5-003', 'MESSAGE_SENT',                'visitor-gina',
 ['ACCT-4','CONV-6','','MSG-12','','','','','','','','Helen Agent','','','','','One moment','agent','',''],
 '', '{}', '{}', ''),

(703000, 'I5', 'E-I5-004', 'CONVERSATION_ENDED',          'visitor-gina',
 ['ACCT-4','CONV-5','Q-400','Retention Queue','canceled','','','','','','','','','','','','','','',''],
 '', '{"chatConversationId":"CONV-5"}', '{}', ''),

-- ---- I6: InteractionId column is blank; id only exists in the payload ----
(800000, '',   'E-I6-001', 'CONVERSATION_CREATED',        'visitor-ivan',
 ['ACCT-5','CONV-7','Q-500','Winback Queue','','','','','','','','Ivan','','','','','','','',''],
 '',
 '{"accountId":"ACCT-5","chatConversationId":"CONV-7","queueId":"Q-500","interactionId":"I6"}',
 '{"chatInteractionType":"SYNC","conversationId":"CONV-7"}', ''),

(801000, '',   'E-I6-002', 'CONVERSATION_ENDED',          'visitor-ivan',
 ['ACCT-5','CONV-7','Q-500','Winback Queue','resolved','','','','','','','','','','','','','','',''],
 '', '{"chatConversationId":"CONV-7"}', '{}', ''),

-- ---- I7: a second, unrelated interaction whose InteractionId is also blank
(900000, '',   'E-I7-001', 'CONVERSATION_CREATED',        'visitor-judy',
 ['ACCT-6','CONV-8','Q-600','Loyalty Queue','','','','','','','','Judy','','','','','','','',''],
 '',
 '{"accountId":"ACCT-6","chatConversationId":"CONV-8","queueId":"Q-600","interactionId":"I7"}',
 '{"chatInteractionType":"ASYNC","conversationId":"CONV-8"}', ''),

(901000, '',   'E-I7-002', 'AGENT_ASSIGNED',              'visitor-judy',
 ['ACCT-6','CONV-8','Q-600','Loyalty Queue','','AGT-99','Kyle Agent','TEAM-6','Team Six','','','Judy','','','assigned','','','','',''],
 '', '{"queueId":"Q-600"}', '{"WorkerName":"AGT-99","full_name":"Kyle Agent","email":"kyle@ex.com"}', ''),

(902000, '',   'E-I7-003', 'CONVERSATION_ENDED',          'visitor-judy',
 ['ACCT-6','CONV-8','Q-600','Loyalty Queue','resolved','','','','','','','','','','','','','','',''],
 '', '{"chatConversationId":"CONV-8"}', '{}', ''),

-- ---- I8: connected via RESERVATION_ACCEPTED only. That event carries the
--          agent in the layout last_agent_started expects (ev2=agent id,
--          ev3=full name, ev4=email, ev6=queue id), not the AGENT_ASSIGNED one.
(1000000, 'I8', 'E-I8-001', 'CONVERSATION_CREATED',       'visitor-liam',
 ['ACCT-7','CONV-9','Q-700','Onboarding Queue','','','','','','','','Liam','','','','','','','',''],
 '',
 '{"accountId":"ACCT-7","chatConversationId":"CONV-9","queueId":"Q-700","interactionId":"I8"}',
 '{"chatInteractionType":"SYNC","conversationId":"CONV-9"}', ''),

(1005000, 'I8', 'E-I8-002', 'RESERVATION_ACCEPTED',       'visitor-liam',
 ['ACCT-7','AGT-55','Mia Agent','mia@ex.com','','Q-700','','TEAM-7','','','','Liam','','','','','','','',''],
 '', '{"queueId":"Q-700","queueName":"Onboarding Queue","TeamName":"Team Seven"}', '{"WorkerName":"AGT-55","full_name":"Mia Agent","email":"mia@ex.com"}', ''),

(1100000, 'I8', 'E-I8-003', 'CONVERSATION_ENDED',         'visitor-liam',
 ['ACCT-7','CONV-9','Q-700','Onboarding Queue','resolved','','','','','','','','','','','','','','',''],
 '', '{"chatConversationId":"CONV-9"}', '{}', ''),

-- ---- CONV-10: two queue attempts, neither ever connected, so both rows end
--      up with a NULL agent_interaction_start_time (the window ORDER BY key).
(1200000, 'I9',  'E-I9-001',  'CONVERSATION_CREATED',     'visitor-nina',
 ['ACCT-8','CONV-10','Q-800','Escalation Queue','','','','','','','','Nina','','','','','','','',''],
 '',
 '{"accountId":"ACCT-8","chatConversationId":"CONV-10","queueId":"Q-800","interactionId":"I9"}',
 '{"chatInteractionType":"SYNC","conversationId":"CONV-10"}', ''),

(1230000, 'I9',  'E-I9-002',  'CONVERSATION_ENDED',       'visitor-nina',
 ['ACCT-8','CONV-10','Q-800','Escalation Queue','canceled','','','','','','','','','','','visitor_leave','','','',''],
 '', '{"chatConversationId":"CONV-10"}', '{}', ''),

(1260000, 'I10', 'E-I10-001', 'CONVERSATION_CREATED',     'visitor-nina',
 ['ACCT-8','CONV-10','Q-800','Escalation Queue','','','','','','','','Nina','','','','','','','',''],
 '',
 '{"accountId":"ACCT-8","chatConversationId":"CONV-10","queueId":"Q-800","interactionId":"I10"}',
 '{"chatInteractionType":"SYNC","conversationId":"CONV-10"}', ''),

(1290000, 'I10', 'E-I10-002', 'CONVERSATION_ENDED',       'visitor-nina',
 ['ACCT-8','CONV-10','Q-800','Escalation Queue','canceled','','','','','','','','','','','visitor_leave','','','',''],
 '', '{"chatConversationId":"CONV-10"}', '{}', '');

INSERT INTO mock.eg_assist_cw_distributed
SELECT
    iid                                                    AS InteractionId,
    ''                                                     AS ConversationId,
    name                                                   AS EventName,
    euid                                                   AS EventUniqueId,
    toUnixTimestamp64Milli(toDateTime64('2026-08-20 12:00:00.000', 3, 'UTC')) + off AS EventTimeStampEpoch,
    cuid                                                   AS ChannelUserId,
    ev[1], ev[2], ev[3], ev[4], ev[5], ev[6], ev[7], ev[8], ev[9], ev[10],
    ev[11], ev[12], ev[13], ev[14], ev[15], ev[16], ev[17], ev[18], ev[19], ev[20],
    key16                                                  AS EventKey16,
    concat(
        '{"string":',
        toJSONString(concat(
            '{"TaskAttributes":', ta,
            ',"WorkerAttributes":{"TaskAttributes":',
            if(vi = '', wa_ta, concat(substring(wa_ta, 1, length(wa_ta) - 1), ',"visitorInfo":', toJSONString(vi), '}')),
            ',"WorkerName":"AGT-77","full_name":"Bob Agent","email":"bob@ex.com"}',
            ',"WorkerSid":"WS-', euid, '"',
            ',"participantRole":"OWNER"',
            ',"status":"queued"}'
        )),
        '}'
    )                                                      AS data,
    'client-org-1'                                         AS ClientOrg
FROM mock.raw;

-- Bot-side transcript, keyed by conversation id (matches EventValue2 above).
INSERT INTO mock.eg_agentic_runtime_distributed VALUES
('CONV-1', '', 'MESSAGE_RECEIVED', toUnixTimestamp64Milli(toDateTime64('2026-08-20 11:59:00.000', 3, 'UTC')), '{"text":"I want to check my bill"}', 'customer'),
('CONV-1', '', 'MESSAGE_SENT',     toUnixTimestamp64Milli(toDateTime64('2026-08-20 11:59:10.000', 3, 'UTC')), '{"text":"Sure, let me get an agent"}', 'customer'),
('CONV-2', '', 'MESSAGE_RECEIVED', toUnixTimestamp64Milli(toDateTime64('2026-08-20 12:06:30.000', 3, 'UTC')), '{"text":"Hello?"}', 'customer'),
('CONV-5', '', 'MESSAGE_RECEIVED', toUnixTimestamp64Milli(toDateTime64('2026-08-20 12:11:00.000', 3, 'UTC')), '{"text":"bot leg for CONV-5"}', 'customer'),
('CONV-6', '', 'MESSAGE_RECEIVED', toUnixTimestamp64Milli(toDateTime64('2026-08-20 12:11:05.000', 3, 'UTC')), '{"text":"bot leg for CONV-6"}', 'customer');
