// src/app/store/[client_id]/components/RecoveryROITracker.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DashboardData } from '@/types/dashboard';

export default function RecoveryROITracker({ data }: { data: DashboardData }) {
  // Use real data from props
  const campaigns = data.campaigns || [];

  // Calculate totals from real data
  const totalSent = campaigns.reduce((sum, c) => sum + c.sent, 0);
  const avgOpenRate = campaigns.length > 0 
    ? Math.round(campaigns.reduce((sum, c) => sum + (c.opened / c.sent * 100), 0) / campaigns.length)
    : 0;
  const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
  const avgROI = campaigns.length > 0 
    ? Math.round(campaigns.reduce((sum, c) => sum + c.roi, 0) / campaigns.length)
    : 0;

  const getROIColor = (roi: number) => {
    if (roi >= 400) return 'bg-emerald-500/20 text-emerald-400';
    if (roi >= 300) return 'bg-green-500/20 text-green-400';
    if (roi >= 200) return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-red-500/20 text-red-400';
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Recovery ROI Tracker</CardTitle>
        <CardDescription className="text-slate-400">
          Performance metrics for recent retention campaigns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-slate-700/50 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-700/30">
              <TableRow>
                <TableHead className="text-slate-300 font-semibold">Campaign Name</TableHead>
                <TableHead className="text-slate-300 font-semibold">Sent</TableHead>
                <TableHead className="text-slate-300 font-semibold">Opened</TableHead>
                <TableHead className="text-slate-300 font-semibold">Orders</TableHead>
                <TableHead className="text-slate-300 font-semibold">Revenue Recovered</TableHead>
                <TableHead className="text-slate-300 font-semibold text-right">ROI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign, index) => (
                <TableRow key={index} className="border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <TableCell className="font-medium text-white">{campaign.name}</TableCell>
                  <TableCell className="text-slate-300">{campaign.sent.toLocaleString()}</TableCell>
                  <TableCell className="text-slate-300">{campaign.opened.toLocaleString()}</TableCell>
                  <TableCell className="text-slate-300">{campaign.orders}</TableCell>
                  <TableCell className="text-white font-semibold">
                    ${campaign.revenue.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge className={getROIColor(campaign.roi)}>
                      {campaign.roi}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <div className="text-2xl font-bold text-blue-400">{totalSent.toLocaleString()}</div>
            <div className="text-sm text-slate-400">Total Sent</div>
          </div>
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <div className="text-2xl font-bold text-green-400">{avgOpenRate}%</div>
            <div className="text-sm text-slate-400">Avg. Open Rate</div>
          </div>
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <div className="text-2xl font-bold text-purple-400">${totalRevenue.toLocaleString()}</div>
            <div className="text-sm text-slate-400">Total Revenue</div>
          </div>
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <div className="text-2xl font-bold text-amber-400">{avgROI}%</div>
            <div className="text-sm text-slate-400">Avg. ROI</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}