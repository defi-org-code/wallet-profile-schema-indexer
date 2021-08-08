-- WORKING COUNT
SELECT time, avg(count) AS holder_count FROM (
    SELECT DISTINCT
        timestamp AS time,
        block,
        count()
    FROM holders
    WHERE
        block % 40 = 0
        AND cast(symbol AS string) = '${token}'
    GROUP BY time, block
    )timestamp(time)
SAMPLE BY $__interval;

-- CUR PRICE
SELECT
  timestamp AS time,
  avg(priceToken) AS avg_price
  FROM price
  WHERE cast(symbol AS string) = '${token}'
  AND $__timeFilter(timestamp)
SAMPLE BY $__interval;

-- NEW SCORE
SELECT time, avg(avg_score) avg_score FROM (
    SELECT DISTINCT
        timestamp AS time,
        block,
        avg(score.score) AS avg_score
    FROM holders
        JOIN score ON address
        WHERE block % 40 = 0
        AND score <= 2
        AND cast(symbol AS string) = '${token}'
        AND $__timeFilter(timestamp)
    GROUP BY time, block
    )timestamp(time)
SAMPLE BY $__interval;
--SAMPLE BY 1h;

-- OLD SCORE
SELECT
  timestamp AS time,
  avg(hs.score) AS score,
  count() AS num
  FROM holders
  INNER JOIN (SELECT address, coalesce(score, 0) as score from holderscore where score < 2) as hs
    ON hs.address = holders.address
  WHERE cast(symbol AS string) = 'yfi'
  AND $__timeFilter(timestamp)
  SAMPLE BY $__interval;


-- OLD PRICE
SELECT
  timestamp AS time,
  avg(hs.score) AS score,
  count() AS num
  FROM holders
  INNER JOIN (SELECT address, coalesce(score, 0) as score from holderscore where score < 2) as hs
    ON hs.address = holders.address
  WHERE cast(symbol AS string) = 'yfi'
  AND $__timeFilter(timestamp)
  SAMPLE BY $__interval;