'use client';

import React from 'react';
import { Settings, Ruler } from 'lucide-react';

interface SettingsPanelProps {
  radius: number;
  onRadiusChange: (value: number) => void;
}

export default function SettingsPanel({ radius, onRadiusChange }: SettingsPanelProps) {
  return (
    <div className="flex flex-col gap-4 p-6 glass-card mt-6">
      <div className="flex items-center gap-2 mb-2">
        <Settings className="w-5 h-5 text-violet-500" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Tracking Settings</h3>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-slate-400">Alert Radius</label>
          <span className="text-violet-500 font-bold">{radius} km</span>
        </div>
        <div className="flex items-center gap-4">
          <Ruler className="w-4 h-4 text-slate-600" />
          <input
            type="range"
            min="1"
            max="50"
            value={radius}
            onChange={(e) => onRadiusChange(parseInt(e.target.value))}
            className="flex-1 accent-violet-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        <p className="text-[10px] text-slate-500 italic">
          You'll be notified when partners enter or leave this zone.
        </p>
      </div>
    </div>
  );
}
