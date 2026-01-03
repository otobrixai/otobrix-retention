// src/config/dashboard-tooltips.ts
export const dashboardTooltips = {
  // Hero Outcome Bar
  heroOutcome: {
    revenueSaved: 'Actual money recovered by AI from at-risk customers. This is revenue that would have been lost without our automated retention system.',
    projectedEarnings: 'Forecasted revenue based on current AI performance patterns. Shows the potential value AI can generate in the next 30 days.',
    atRiskRevenue: 'Total revenue from customers identified as high-risk. Our AI is actively monitoring and working to protect this from churn.',
    repeatPurchaseRate: 'Percentage of customers making repeat purchases. Higher rates indicate stronger customer loyalty and engagement.',
    clvTrend: 'Customer Lifetime Value trend. Measures how much more each customer is worth over time due to retention efforts.'
  },

  // Action Summary
  actionSummary: {
    customersSaved: 'Customers who were about to churn but were retained through AI interventions. Each represents preserved future revenue.',
    customersAtRisk: 'Customers currently being monitored by AI as having high churn risk. These are being actively targeted with retention strategies.',
    predictedToChurn: 'Customers with high probability of leaving in the next 30 days. AI is proactively engaging these customers.'
  },

  // AI Impact Feed
  aiImpactFeed: {
    title: 'Real-time tracking of AI-driven financial results',
    description: 'Shows concrete examples of how AI is generating value through automated actions and interventions.'
  },

  // Retention Drivers
  retentionDrivers: {
    cohortChart: 'Shows how customer retention improves over time across different customer groups (cohorts). Steeper lines mean better retention.',
    rfmHeatmap: 'Visualizes customer segments based on Recency, Frequency, and Monetary value. Helps identify which groups need attention.'
  },

  // At-Risk Leaderboard
  atRiskLeaderboard: {
    title: 'Customers most likely to churn',
    description: 'Prioritized list of high-risk customers with AI intervention history. Shows exactly what actions were taken to retain them.'
  },

  // Recovery ROI Tracker
  recoveryROI: {
    title: 'Performance of retention campaigns',
    description: 'Shows return on investment for different retention strategies. Higher ROI means more efficient use of resources.'
  },

  // System Health
  systemHealth: {
    title: 'Technical status of AI retention system',
    description: 'Shows that the AI system is actively running and monitoring your customers in real-time.'
  }
}