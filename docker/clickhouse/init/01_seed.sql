CREATE TABLE IF NOT EXISTS default.events
(
    event_time DateTime,
    event_name String,
    user_id UInt64
)
ENGINE = MergeTree
ORDER BY event_time;

INSERT INTO default.events (event_time, event_name, user_id) VALUES
(now() - INTERVAL 60 MINUTE, 'page_view', 101),
(now() - INTERVAL 45 MINUTE, 'button_click', 102),
(now() - INTERVAL 25 MINUTE, 'signup', 103),
(now() - INTERVAL 10 MINUTE, 'purchase', 101);
