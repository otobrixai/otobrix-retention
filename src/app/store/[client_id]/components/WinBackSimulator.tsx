// src/app/store/[client_id]/components/WinBackSimulator.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Zap } from 'lucide-react';

interface ROIData {
  roi?: {
    totalAtRiskRevenue?: number;
  };
}

interface WinBackSimulatorProps {
  data: unknown;
  onLaunch: (action: string) => void;
}

export default function WinBackSimulator({ data, onLaunch }: WinBackSimulatorProps) {
  const [recoveryRate, setRecoveryRate] = useState([35]);
  
  const safeData = data as ROIData;
  const atRiskRevenue = safeData.roi?.totalAtRiskRevenue || 100000;
  const projectedRevenue = atRiskRevenue * (recoveryRate[0] / 100);

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Zap size={20} />
          Win-Back Revenue Simulator
        </CardTitle>
        <CardDescription className="text-slate-400">
          Adjust recovery rate to see potential revenue impact
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-slate-300 mb-2">
                <span>Recovery Rate</span>
                <span className="text-2xl font-bold text-emerald-400">{recoveryRate[0]}%</span>
              </div>
              <Slider
                value={recoveryRate}
                onValueChange={setRecoveryRate}
                max={80}
                min={10}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>10%</span>
                <span>80%</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-slate-700/30 rounded-lg">
                <span className="text-slate-300">At-Risk Revenue</span>
                <span className="text-xl font-bold text-red-400">${(atRiskRevenue / 1000).toFixed(0)}K</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-700/30 rounded-lg">
                <span className="text-slate-300">Projected Recovery</span>
                <span className="text-xl font-bold text-emerald-400">${(projectedRevenue / 1000).toFixed(0)}K</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center">
            <div className="text-center p-8 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl border border-blue-500/20">
              <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-4">
                +${(projectedRevenue / 1000).toFixed(0)}K
              </div>
              <p className="text-xl text-slate-300 mb-6">Additional Revenue Potential</p>
              <Button
                onClick={() => onLaunch('winback_campaign')}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white px-8 py-4 text-lg font-semibold"
                size="lg"
              >
                <Zap size={20} className="mr-2" />
                Launch Win-Back Campaign Now
              </Button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <div className="text-2xl font-bold text-blue-400">2.4x</div>
            <div className="text-sm text-slate-400">Average ROI</div>
          </div>
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <div className="text-2xl font-bold text-green-400">68%</div>
            <div className="text-sm text-slate-400">Open Rate</div>
          </div>
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <div className="text-2xl font-bold text-purple-400">24h</div>
            <div className="text-sm text-slate-400">Avg. Response Time</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}