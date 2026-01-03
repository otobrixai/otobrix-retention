-- Drop existing view if it exists
DROP MATERIALIZED VIEW IF EXISTS rfm_scores_mv;

-- Create materialized view
CREATE MATERIALIZED VIEW rfm_scores_mv AS
SELECT 
    rl.client_id,
    rl.customer_id,
    MAX(rl.timestamp) as last_purchase_date,
    COUNT(DISTINCT rl.id) as purchase_count,
    COALESCE(CAST(SUM(rl.recovered_revenue) AS NUMERIC), 0) as total_spent,
    AVG(rl.rfm_recency) as avg_recency_score,
    AVG(rl.rfm_frequency) as avg_frequency_score,
    AVG(rl.rfm_monetary) as avg_monetary_score,
    AVG(rl.churn_score) as avg_churn_score,
    -- Calculate simple scores
    CASE 
        WHEN DATE_PART('day', CURRENT_DATE - MAX(rl.timestamp)) <= 30 THEN 5
        WHEN DATE_PART('day', CURRENT_DATE - MAX(rl.timestamp)) <= 60 THEN 4
        WHEN DATE_PART('day', CURRENT_DATE - MAX(rl.timestamp)) <= 90 THEN 3
        WHEN DATE_PART('day', CURRENT_DATE - MAX(rl.timestamp)) <= 180 THEN 2
        ELSE 1
    END as recency_score,
    CASE 
        WHEN COUNT(DISTINCT rl.id) >= 20 THEN 5
        WHEN COUNT(DISTINCT rl.id) >= 10 THEN 4
        WHEN COUNT(DISTINCT rl.id) >= 5 THEN 3
        WHEN COUNT(DISTINCT rl.id) >= 2 THEN 2
        ELSE 1
    END as frequency_score,
    CASE 
        WHEN COALESCE(CAST(SUM(rl.recovered_revenue) AS NUMERIC), 0) >= 1000 THEN 5
        WHEN COALESCE(CAST(SUM(rl.recovered_revenue) AS NUMERIC), 0) >= 500 THEN 4
        WHEN COALESCE(CAST(SUM(rl.recovered_revenue) AS NUMERIC), 0) >= 100 THEN 3
        WHEN COALESCE(CAST(SUM(rl.recovered_revenue) AS NUMERIC), 0) >= 50 THEN 2
        ELSE 1
    END as monetary_score,
    -- Combined RFM score
    ROUND(
        (CASE 
            WHEN DATE_PART('day', CURRENT_DATE - MAX(rl.timestamp)) <= 30 THEN 5
            WHEN DATE_PART('day', CURRENT_DATE - MAX(rl.timestamp)) <= 60 THEN 4
            WHEN DATE_PART('day', CURRENT_DATE - MAX(rl.timestamp)) <= 90 THEN 3
            WHEN DATE_PART('day', CURRENT_DATE - MAX(rl.timestamp)) <= 180 THEN 2
            ELSE 1
        END * 0.4) +
        (CASE 
            WHEN COUNT(DISTINCT rl.id) >= 20 THEN 5
            WHEN COUNT(DISTINCT rl.id) >= 10 THEN 4
            WHEN COUNT(DISTINCT rl.id) >= 5 THEN 3
            WHEN COUNT(DISTINCT rl.id) >= 2 THEN 2
            ELSE 1
        END * 0.3) +
        (CASE 
            WHEN COALESCE(CAST(SUM(rl.recovered_revenue) AS NUMERIC), 0) >= 1000 THEN 5
            WHEN COALESCE(CAST(SUM(rl.recovered_revenue) AS NUMERIC), 0) >= 500 THEN 4
            WHEN COALESCE(CAST(SUM(rl.recovered_revenue) AS NUMERIC), 0) >= 100 THEN 3
            WHEN COALESCE(CAST(SUM(rl.recovered_revenue) AS NUMERIC), 0) >= 50 THEN 2
            ELSE 1
        END * 0.3),
        2
    ) as rfm_score,
    -- Customer segment
    CASE 
        WHEN DATE_PART('day', CURRENT_DATE - MAX(rl.timestamp)) <= 30 
             AND COUNT(DISTINCT rl.id) >= 10 
             AND COALESCE(CAST(SUM(rl.recovered_revenue) AS NUMERIC), 0) >= 500 THEN 'Champions'
        WHEN DATE_PART('day', CURRENT_DATE - MAX(rl.timestamp)) <= 60 
             AND COUNT(DISTINCT rl.id) >= 5 THEN 'Loyal Customers'
        WHEN DATE_PART('day', CURRENT_DATE - MAX(rl.timestamp)) <= 30 THEN 'Recent Customers'
        WHEN COUNT(DISTINCT rl.id) >= 10 THEN 'Frequent Customers'
        WHEN COALESCE(CAST(SUM(rl.recovered_revenue) AS NUMERIC), 0) >= 1000 THEN 'High Value'
        WHEN DATE_PART('day', CURRENT_DATE - MAX(rl.timestamp)) > 180 
             AND COUNT(DISTINCT rl.id) <= 2 
             AND COALESCE(CAST(SUM(rl.recovered_revenue) AS NUMERIC), 0) < 50 THEN 'At Risk'
        ELSE 'Regular'
    END as customer_segment,
    CURRENT_TIMESTAMP as calculated_at
FROM retention_logs rl
WHERE rl.status = 'completed'
    AND rl.action IN ('purchase', 'revenue', 'upsell')
    AND rl.timestamp > CURRENT_DATE - INTERVAL '365 days'
GROUP BY rl.client_id, rl.customer_id;

-- Create indexes
CREATE UNIQUE INDEX idx_rfm_scores_mv_client_customer 
ON rfm_scores_mv (client_id, customer_id);

CREATE INDEX idx_rfm_scores_mv_rfm_score 
ON rfm_scores_mv (rfm_score DESC);

CREATE INDEX idx_rfm_scores_mv_segment 
ON rfm_scores_mv (customer_segment);

-- Create refresh function
CREATE OR REPLACE FUNCTION refresh_rfm_scores_mv()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY rfm_scores_mv;
END;
$$ LANGUAGE plpgsql;