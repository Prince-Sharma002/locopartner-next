'use client';

import React from 'react';
import { Eye, EyeOff, MapPin, Navigation, Power } from 'lucide-react';
import { motion } from 'framer-motion';

interface PartnerData {
  _id: string;
  name: string;
  distance: number | null;
}

interface ControlPanelProps {
  partners: PartnerData[];
  settings: {
    isSharingPaused: boolean;
    isInvisible: boolean;
    visibilityType: string;
  };
  onUpdateSettings: (newSettings: any) => void;
}

export default function ControlPanel({ partners, settings, onUpdateSettings }: ControlPanelProps) {
  return (
    <div className="flex flex-col gap-4 p-6 glass-card">
      <div className="flex flex-col gap-3 mb-2">
        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Nearby Partners</span>
        {partners.length === 0 ? (
          <div className="text-slate-600 text-sm italic py-2">No partners linked yet.</div>
        ) : (
          partners.map(partner => (
            <div key={partner._id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center text-sm font-bold text-violet-400">
                  {partner.name[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium text-white">{partner.name}</span>
              </div>
              <span className="text-xs font-bold text-violet-400">
                {partner.distance !== null ? `${partner.distance.toFixed(1)} km` : '---'}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onUpdateSettings({ ...settings, isSharingPaused: !settings.isSharingPaused })}
          className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${
            settings.isSharingPaused ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'
          }`}
        >
          <Power className="w-5 h-5" />
          <div className="flex flex-col items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider">Sharing</span>
            <span className="text-xs">{settings.isSharingPaused ? 'Paused' : 'Active'}</span>
          </div>
        </button>

        <button
          onClick={() => onUpdateSettings({ ...settings, isInvisible: !settings.isInvisible })}
          className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${
            settings.isInvisible ? 'bg-violet-500/20 text-violet-500' : 'hover:bg-slate-800 text-slate-400'
          }`}
        >
          {settings.isInvisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          <div className="flex flex-col items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider">Stealth</span>
            <span className="text-xs">{settings.isInvisible ? 'Invisible' : 'Visible'}</span>
          </div>
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Visibility Accuracy</span>
        <div className="flex gap-2 p-1 bg-slate-900/50 rounded-xl">
          {['Exact', 'Approximate', 'Off'].map((type) => (
            <button
              key={type}
              onClick={() => onUpdateSettings({ ...settings, visibilityType: type })}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                settings.visibilityType === type 
                  ? 'bg-slate-800 text-white shadow-lg' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
