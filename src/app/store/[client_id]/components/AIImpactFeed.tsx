// src/app/store/[client_id]/components/AIImpactFeed.tsx - UPDATED
'use client';

import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Shield, Mail, Clock, Brain, Zap, CheckCircle } from 'lucide-react';
import { DashboardData } from '@/types/dashboard';

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  'DollarSign': DollarSign,
  'Shield': Shield,
  'Mail': Mail,
  'Clock': Clock,
  'Brain': Brain,
  'Zap': Zap
};

export default function AIImpactFeed({ data }: { data: DashboardData }) {
  // AI Impact Feed events with financial focus
  const aiEvents = data.aiImpactFeed || [];

  const getEventColor = (type: string) => {
    switch (type) {
      case 'revenue': return 'financial-badge-positive';
      case 'churn': return 'financial-badge-risk';
      case 'message': return 'bg-blue-500/20 text-blue-400';
      case 'followup': return 'bg-amber-500/20 text-amber-400';
      case 'pattern': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getDefaultIcon = (type: string) => {
    switch (type) {
      case 'revenue': return DollarSign;
      case 'churn': return Shield;
      case 'message': return Mail;
      case 'followup': return Clock;
      case 'pattern': return Brain;
      default: return Zap;
    }
  };

  return (
    <div className="enterprise-card">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Zap size={20} className="text-purple-400" />
          Real-Time AI Financial Impact
        </CardTitle>
        <CardDescription className="text-slate-400">
          Live tracking of AI-driven revenue generation and cost savings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {aiEvents.map((event) => {
            const IconComponent = iconMap[event.icon] || getDefaultIcon(event.type);
            return (
              <div 
                key={event.id} 
                className="flex flex-col p-4 hover:bg-slate-700/30 rounded-lg border border-slate-600/50 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${getEventColor(event.type)}`}>
                    <IconComponent size={16} />
                  </div>
                  <Badge className={getEventColor(event.type)}>
                    {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                  </Badge>
                </div>
                
                <div className="flex-1">
                  <p className="text-sm text-white mb-2 group-hover:text-emerald-100 transition-colors">
                    {event.description}
                  </p>
                  <div className="mt-2 p-2 bg-slate-700/50 rounded">
                    <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle size={12} />
                      {event.financialImpact}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-slate-700/50">
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock size={12} />
                    {event.timestamp}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Summary Footer */}
        <div className="mt-6 pt-6 border-t border-slate-700/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h4 className="font-medium text-white mb-1">AI Financial Impact Summary</h4>
              <p className="text-sm text-slate-400">
                Total AI-driven value this month: <span className="text-emerald-400 font-semibold">
                  ${data.roi?.recoveredLast30Days ? data.roi.recoveredLast30Days.toLocaleString() : '0'}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="financial-badge-positive border-0">
                <DollarSign size={12} className="mr-1" />
                Revenue Generated
              </Badge>
              <Badge variant="outline" className="financial-badge-risk border-0">
                <Shield size={12} className="mr-1" />
                Losses Prevented
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </div>
  );
}