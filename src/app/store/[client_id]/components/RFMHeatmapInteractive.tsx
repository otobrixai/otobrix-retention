// src/app/store/[client_id]/components/RFMHeatmapInteractive.tsx
'use client';

import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { Cell, ResponsiveContainer, Scatter, ScatterChart, XAxis, YAxis, ZAxis, Tooltip } from 'recharts';
import { DollarSign } from 'lucide-react';
import { DashboardData, RFMSegment } from '@/types/dashboard';
import { TooltipProvider } from '@/components/ui/tooltip'; // ADD THIS
import { HelpIcon } from '@/components/ui/help-icon'; // ADD THIS

export default function RFMHeatmapInteractive({ data }: { data: DashboardData }) {
  const [selectedSegment, setSelectedSegment] = useState<RFMSegment | null>(null);
  
  // Use real data from props
  const points: RFMSegment[] = data.rfmSegments || [];

  const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];

  const handleCellClick = (segment: RFMSegment) => {
    setSelectedSegment(segment);
  };

  const getSegmentFinancialImpact = (label: string) => {
    switch (label) {
      case 'Hibernating': return 'High recovery potential - these customers haven\'t purchased recently but have high value';
      case 'Champions': return 'Maximum value generation - your best customers who buy frequently and spend more';
      case 'At Risk': return 'Critical protection needed - valuable customers showing signs of leaving';
      case 'Loyal': return 'Optimization opportunity - regular customers who could spend more';
      default: return 'AI monitoring active - being tracked for opportunities';
    }
  };

  const getSegmentDescription = (label: string) => {
    switch (label) {
      case 'Hibernating': return 'Haven\'t purchased in a while, but have high lifetime value. Great opportunity for re-engagement.';
      case 'Champions': return 'Your most valuable customers - buy often, spend more, and are very loyal. Focus on keeping them happy.';
      case 'At Risk': return 'Showing signs of leaving despite their value. AI is actively working to retain them.';
      case 'Loyal': return 'Regular customers who consistently purchase. Opportunity to increase their spending.';
      default: return 'Customers being monitored by AI for retention opportunities.';
    }
  };

  const getTooltipFormatter = (value: number | undefined, name: string | undefined): (string | number)[] => {
    if (value === undefined) return ['N/A', name || 'Unknown'];
    
    switch (name) {
      case 'Recency':
        return [`${value.toFixed(1)} days`, 'Recency'];
      case 'Frequency':
        return [`${value.toFixed(1)} purchases`, 'Frequency'];
      case 'Monetary':
        return [`$${value.toFixed(2)}`, 'Monetary Value'];
      default:
        return [value.toFixed(2), name || 'Value'];
    }
  };

  return (
    // WRAP ENTIRE COMPONENT IN TooltipProvider
    <TooltipProvider>
      <div className="enterprise-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-start gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-white">Customer Value Map</CardTitle>
                  <span className="relative z-50">
                    <HelpIcon 
                      content="This map groups your customers by their shopping behavior. Top-right circles = your best customers (buy often & recently). Bottom-left circles = need attention. Bigger circles = more customers in that group."
                    />
                  </span>
                </div>
                <CardDescription className="text-slate-400">
                  Click any circle to view AI-driven financial impact by customer group
                </CardDescription>
              </div>
            </div>
            <div className="financial-badge-positive px-3 py-1 rounded-full flex items-center gap-2">
              <DollarSign size={14} />
              <span>Revenue-focused grouping</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] min-h-[320px] w-full relative">
            <ResponsiveContainer width="100%" height="100%" minHeight={320}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
                <XAxis 
                  type="number" 
                  dataKey="frequency" 
                  domain={[1, 5]}
                  tick={{ fill: '#9CA3AF' }}
                  axisLine={{ stroke: '#4B5563' }}
                  label={{ 
                    value: 'Purchase Frequency', 
                    position: 'insideBottom', 
                    offset: -10, 
                    fill: '#9CA3AF',
                    fontSize: 12 
                  }}
                />
                <YAxis 
                  type="number" 
                  dataKey="recency" 
                  domain={[1, 5]}
                  tick={{ fill: '#9CA3AF' }}
                  axisLine={{ stroke: '#4B5563' }}
                  label={{ 
                    value: '(Recent Purchases)', 
                    angle: -90, 
                    position: 'insideLeft', 
                    fill: '#9CA3AF',
                    fontSize: 12 
                  }}
                />
                <ZAxis type="number" dataKey="count" range={[200, 2000]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB',
                    fontSize: '12px'
                  }}
                  formatter={getTooltipFormatter}
                  labelFormatter={(label) => {
                    const segment = points.find(p => p.label === label);
                    return segment ? `Customer Group: ${segment.label}` : 'Customer Group';
                  }}
                />
                <Scatter data={points} name="Customer Groups">
                  {points.map((entry: RFMSegment, i: number) => (
                    <Cell 
                      key={i} 
                      fill={colors[entry.recency - 1]} 
                      opacity={0.8}
                      onClick={() => handleCellClick(entry)}
                      style={{ cursor: 'pointer' }}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          
          {/* Chart Legend with Tooltips */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="enterprise-card p-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-white text-sm flex items-center gap-2">
                  <DollarSign size={14} className="text-emerald-400" />
                  What the Colors Mean
                </h4>
                <span className="relative z-50">
                  <HelpIcon 
                    content="Color shows how recently customers purchased. Red = haven't bought in a while. Green = recent buyers. This helps identify who needs re-engagement vs who's actively shopping."
                  />
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#EF4444]"></div>
                  <span className="text-slate-400">Haven't bought recently</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#10B981]"></div>
                  <span className="text-slate-400">Recent buyers</span>
                </div>
              </div>
            </div>
            
            <div className="enterprise-card p-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-white text-sm flex items-center gap-2">
                  <DollarSign size={14} className="text-blue-400" />
                  What the Positions Mean
                </h4>
                <span className="relative z-50">
                  <HelpIcon 
                    content="Position shows customer value. Top-right = best customers (buy often & recently). Bottom-left = need attention. Middle = regular customers with potential."
                  />
                </span>
              </div>
              <div className="text-xs text-slate-400">
                <p>Top-Right: Your best customers 💎</p>
                <p>Bottom-Left: Needs attention 🎯</p>
              </div>
            </div>
          </div>
          
          {/* Segment Financial Analysis */}
          <div className="mt-6 p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-emerald-400" />
                <h4 className="font-semibold text-white">Financial Summary</h4>
              </div>
              <span className="relative z-50">
                <HelpIcon 
                  content="Shows the total business value from all customer groups and how much AI has helped increase that value through better targeting and engagement."
                />
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-400">Total Customer Value:</span>
                  <span className="relative z-50">
                    <HelpIcon 
                      content="Combined revenue from all customer groups shown on the map. This is the total value of your customer base."
                    />
                  </span>
                </div>
                <span className="text-white ml-2 font-bold text-lg">
                  ${points.reduce((sum: number, p: RFMSegment) => sum + (p.revenue || 0), 0).toLocaleString()}
                </span>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-400">AI-Driven Improvement:</span>
                  <span className="relative z-50">
                    <HelpIcon 
                      content="Additional revenue generated by AI through better customer targeting, personalized offers, and timely engagement."
                    />
                  </span>
                </div>
                <span className="text-emerald-400 ml-2 font-bold text-lg">
                  +${data.roi?.recoveredLast30Days ? Math.round(data.roi.recoveredLast30Days).toLocaleString() : '0'}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3">
              AI personalization and targeting increased customer value by focusing on the right groups at the right time
            </p>
          </div>
          
          {/* Selected Segment Details */}
          {selectedSegment && (
            <div className="mt-6 p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-white">Selected Customer Group: {selectedSegment.label}</h4>
                <span className="relative z-50">
                  <HelpIcon 
                    content={`About This Customer Group: ${getSegmentDescription(selectedSegment.label)} RFM Scores: 1=Lowest, 5=Highest for each category`}
                  />
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-400">Customers:</span>
                    <span className="relative z-50">
                      <HelpIcon 
                        content="Number of customers in this group. More customers = bigger opportunity or more value to protect."
                      />
                    </span>
                  </div>
                  <span className="text-white ml-2 font-medium">{selectedSegment.count}</span>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-400">Revenue:</span>
                    <span className="relative z-50">
                      <HelpIcon 
                        content="Total revenue generated by this customer group. Shows their financial importance to your business."
                      />
                    </span>
                  </div>
                  <span className="text-white ml-2 font-medium">${selectedSegment.revenue?.toLocaleString()}</span>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-400">Purchase Score:</span>
                    <span className="relative z-50">
                      <HelpIcon 
                        content="Combined score showing Recency/Frequency/Spending. Higher scores = more valuable customers."
                      />
                    </span>
                  </div>
                  <span className="text-white ml-2 font-medium">{selectedSegment.recency}/{selectedSegment.frequency}/{selectedSegment.monetary}</span>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-400">AI Focus:</span>
                    <span className="relative z-50">
                      <HelpIcon 
                        content="What AI is doing for this customer group - whether protecting value, increasing engagement, or recovering lost customers."
                      />
                    </span>
                  </div>
                  <span className="text-emerald-400 ml-2 font-medium">{getSegmentFinancialImpact(selectedSegment.label)}</span>
                </div>
              </div>
              
              {selectedSegment.aiImpact && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <DollarSign size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-emerald-400 font-medium">AI Impact for This Group</p>
                      <p className="text-sm text-emerald-300">{selectedSegment.aiImpact}</p>
                      <span className="text-xs text-slate-400 mt-1 inline-block">
                        <span className="relative z-50">
                          <HelpIcon 
                            content="Shows the concrete financial result AI has achieved by focusing on this specific customer group with targeted strategies."
                          />
                        </span>
                        What this means for your business
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </div>
    </TooltipProvider>
  );
}