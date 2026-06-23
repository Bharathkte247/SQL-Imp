SELECT
    name,
    type
FROM system.columns
WHERE database = 'columbia'
    AND table = 'bq_digital_interaction'
    AND (
        positionCaseInsensitive(name, 'handle') > 0
        OR positionCaseInsensitive(name, 'response') > 0
        OR positionCaseInsensitive(name, 'time') > 0
    )
ORDER BY name;
