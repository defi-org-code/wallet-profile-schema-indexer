--price weth
SELECT
  timestamp AS time,
  avg(priceToken) AS price
  FROM price
  WHERE block % ${blockSample} = 0
  AND cast(symbol AS string) = '${token}'
  AND $__timeFilter(timestamp)
SAMPLE BY $__interval;
-- score
SELECT time, avg(avg_score) avg_score FROM (
    SELECT DISTINCT
        timestamp AS time,
        block,
        avg(score.score) AS avg_score
    FROM holders
        JOIN score ON address
        WHERE block % ${blockSample} = 0
        AND score <= 2
        AND cast(symbol AS string) = '${token}'
        AND $__timeFilter(timestamp)
    GROUP BY time, block
    )timestamp(time)
SAMPLE BY $__interval;
-- count
SELECT time, avg(count) AS holder_count FROM (
    SELECT DISTINCT
        timestamp AS time,
        block,
        count()
    FROM holders
    WHERE
        block % ${blockSample} = 0
        AND cast(symbol AS string) = '${token}'
    GROUP BY time, block
    )timestamp(time)
SAMPLE BY $__interval;