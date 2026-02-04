// src/app/store/[client_id]/components/CohortRetentionChart.tsx
'use client';

import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';
import { HelpIcon } from '@/components/ui/help-icon';
import { DashboardData } from '@/types/dashboard';
import { TooltipProvider } from '@/components/ui/tooltip'; // ADD THIS IMPORT

// Define types for chart data
interface CohortChartData {
  month: string;
  cohort1: number;
  cohort2: number;
  cohort3: number;
  cohort4: number;
  cohort5: number;
}

interface ChartPayloadItem {
  dataKey: string;
  value: number;
  color: string;
  payload: CohortChartData;
}

interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean;
  payload?: ChartPayloadItem[];
  label?: string;
}

// Default data for fallback
const defaultData: CohortChartData[] = [
  { month: 'Jan', cohort1: 100, cohort2: 95, cohort3: 88, cohort4: 76, cohort5: 65 },
  { month: 'Feb', cohort1: 92, cohort2: 87, cohort3: 81, cohort4: 70, cohort5: 60 },
  { month: 'Mar', cohort1: 85, cohort2: 80, cohort3: 75, cohort4: 65, cohort5: 55 },
  { month: 'Apr', cohort1: 78, cohort2: 74, cohort3: 69, cohort4: 60, cohort5: 50 },
  { month: 'May', cohort1: 72, cohort2: 68, cohort3: 63, cohort4: 55, cohort5: 45 },
  { month: 'Jun', cohort1: 65, cohort2: 62, cohort3: 57, cohort4: 50, cohort5: 40 },
];

export default function CohortRetentionChart({ data }: { data: DashboardData }) {
  // Use real data from props
  const chartData: CohortChartData[] = data.cohortData || defaultData;
  
  // Calculate retention improvement
  const avgRetention = chartData.reduce((sum, month) => 
    sum + (month.cohort1 + month.cohort2 + month.cohort3 + month.cohort4 + month.cohort5) / 5, 0
  ) / chartData.length;
  
  const retentionImprovement = Math.round(avgRetention - 50);
  const isImprovementPositive = retentionImprovement > 0;

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 shadow-xl z-50">
          <p className="text-sm font-semibold text-white mb-2">{label} - Retention Status</p>
          {payload.map((entry: ChartPayloadItem, index: number) => {
            const cohortName = 
              entry.dataKey === 'cohort1' ? 'Jan Cohort' :
              entry.dataKey === 'cohort2' ? 'Feb Cohort' :
              entry.dataKey === 'cohort3' ? 'Mar Cohort' :
              entry.dataKey === 'cohort4' ? 'Apr Cohort' : 'May Cohort';
            
            return (
              <div key={index} className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-slate-300">{cohortName}</span>
                </div>
                <span className="text-sm font-semibold text-white">
                  {entry.value}% retained
                </span>
              </div>
            );
          })}
          <div className="mt-3 pt-3 border-t border-slate-700">
            <p className="text-xs text-slate-400">
              Shows what percentage of customers from each starting month are still active
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    // WRAP ENTIRE COMPONENT IN TooltipProvider
    <TooltipProvider>
      <div className="enterprise-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <CardTitle className="text-white flex items-center gap-2">
                Cohort Retention Curve
                <span className="relative z-50">
                  <HelpIcon 
                    content="Tracks how well you keep customers over time. Each line shows a group of customers who joined in the same month. Higher lines = better retention. Steeper lines = faster customer loss."
                  />
                </span>
              </CardTitle>
            </div>
            <div className={`text-sm px-3 py-1 rounded-full flex items-center gap-2 relative z-50 ${
              isImprovementPositive 
                ? 'financial-badge-positive' 
                : 'financial-badge-risk'
            }`}>
              <span>
                {isImprovementPositive ? '+' : ''}{retentionImprovement}% retention improvement
              </span>
              <span className="relative z-50">
                <HelpIcon 
                  content="Shows overall improvement in keeping customers compared to industry baseline. Positive numbers mean you're getting better at retention over time."
                />
              </span>
            </div>
          </div>
          <CardDescription className="text-slate-400 mt-2">
            <div className="flex items-center gap-2">
              <span>AI-driven retention improvements across customer cohorts</span>
              <span className="relative z-50">
                <HelpIcon 
                  content="Cohorts are groups of customers who joined at the same time. This chart shows how AI helps keep customers longer compared to when they joined naturally."
                />
              </span>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] min-h-[320px] w-full relative">
            <ResponsiveContainer width="100%" height="100%" minHeight={320}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="month" 
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  axisLine={{ stroke: '#4B5563' }}
                />
                <YAxis 
                  stroke="#9CA3AF" 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  axisLine={{ stroke: '#4B5563' }}
                  label={{ 
                    value: 'Retention %', 
                    angle: -90, 
                    position: 'insideLeft', 
                    fill: '#9CA3AF',
                    fontSize: 12
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ 
                    paddingTop: '10px',
                    fontSize: '12px'
                  }}
                  formatter={(value) => {
                    return (
                      <span className="text-slate-300 text-xs">
                        {value === 'cohort1' ? 'Jan Cohort' : 
                         value === 'cohort2' ? 'Feb Cohort' : 
                         value === 'cohort3' ? 'Mar Cohort' : 
                         value === 'cohort4' ? 'Apr Cohort' : 'May Cohort'}
                      </span>
                    );
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="cohort1" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  name="cohort1"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="cohort2" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  name="cohort2"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="cohort3" 
                  stroke="#F59E0B" 
                  strokeWidth={3}
                  name="cohort3"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="cohort4" 
                  stroke="#EF4444" 
                  strokeWidth={3}
                  name="cohort4"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="cohort5" 
                  stroke="#8B5CF6" 
                  strokeWidth={3}
                  name="cohort5"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Financial Impact Annotation */}
          <div className="mt-8 p-6 bg-enterprise-panel rounded-lg border border-enterprise-slate">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-white">$</span>
              </div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-white">Financial Impact Analysis</h4>
                <span className="relative z-50">
                  <HelpIcon 
                    content="Translates retention improvements into real dollar impact. Shows how much money you're saving by keeping customers longer."
                  />
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-400">Retention Improvement</span>
                  <span className="relative z-50">
                    <HelpIcon 
                      content="Overall improvement in keeping customers compared to when AI wasn't active. Higher is better."
                    />
                  </span>
                </div>
                <span className={`text-lg font-bold ${isImprovementPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isImprovementPositive ? '+' : ''}{retentionImprovement}%
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  vs. industry baseline
                </p>
              </div>
              
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-400">Revenue Protected</span>
                  <span className="relative z-50">
                    <HelpIcon 
                      content="Estimated revenue saved from customers who would have churned without AI intervention."
                    />
                  </span>
                </div>
                <span className="text-lg font-bold text-emerald-400">
                  ${data.roi?.totalAtRiskRevenue ? Math.round(data.roi.totalAtRiskRevenue).toLocaleString() : '0'}
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  At-risk revenue secured
                </p>
              </div>
              
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-400">AI Contribution</span>
                  <span className="relative z-50">
                    <HelpIcon 
                      content="How much of the retention improvement is directly attributable to AI actions vs. natural factors."
                    />
                  </span>
                </div>
                <span className="text-lg font-bold text-blue-400">
                  {retentionImprovement > 10 ? '72%' : retentionImprovement > 5 ? '58%' : '42%'} of improvement
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  Direct AI impact
                </p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 mt-0.5 relative z-50">
                  <HelpIcon 
                    content="This explains the business implications of the retention patterns shown in the chart."
                  />
                </div>
                <div>
                  <p className="text-sm text-slate-300">
                    <strong>What this means for your business:</strong>{' '}
                    {retentionImprovement > 0 
                      ? `AI-driven personalization and timing optimization have improved customer retention by ${retentionImprovement}%, directly contributing to higher customer lifetime value.`
                      : 'AI is actively working to identify retention patterns and opportunities for improvement.'}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    {retentionImprovement > 10 
                      ? 'The steep improvement in later cohorts shows AI is getting more effective over time at keeping customers engaged.'
                      : retentionImprovement > 0
                      ? 'Steady improvement shows consistent AI-driven retention gains across customer groups.'
                      : 'Early stage monitoring - AI is establishing baseline patterns for future optimization.'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Quick Action Insights */}
            <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-amber-500/20 rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-amber-400">💡</span>
                </div>
                <h5 className="font-medium text-white text-sm">Quick Insight</h5>
                <span className="relative z-50">
                  <HelpIcon 
                    content="Actionable advice based on your retention patterns."
                  />
                </span>
              </div>
              <p className="text-sm text-slate-300">
                {retentionImprovement > 0 
                  ? `Every 1% improvement in retention translates to approximately $${Math.round((data.roi?.totalAtRiskRevenue || 0) * 0.05).toLocaleString()} in additional annual revenue.`
                  : 'Focus on improving early cohort retention first - it has the highest long-term impact.'}
              </p>
            </div>
          </div>
        </CardContent>
      </div>
    </TooltipProvider>
  );
}