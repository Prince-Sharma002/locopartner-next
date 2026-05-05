'use client';

import React from 'react';
import { motion } from 'framer-motion';

const moods = [
  { label: 'Busy', icon: '🧠', value: 'Busy', color: 'bg-amber-500/20 text-amber-500' },
  { label: 'Free', icon: '😊', value: 'Free', color: 'bg-emerald-500/20 text-emerald-500' },
  { label: 'Not good', icon: '😞', value: 'Not feeling good', color: 'bg-rose-500/20 text-rose-500' },
];

interface MoodSelectorProps {
  currentMood: string;
  onMoodSelect: (mood: string) => void;
}

export default function MoodSelector({ currentMood, onMoodSelect }: MoodSelectorProps) {
  return (
    <div className="flex gap-3 p-4 glass-card">
      {moods.map((mood) => (
        <motion.button
          key={mood.value}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onMoodSelect(mood.value)}
          className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${
            currentMood === mood.value 
              ? `${mood.color.split(' ')[1]} ring-2 ring-offset-2 ring-offset-slate-900 ring-current` 
              : 'hover:bg-slate-800 text-slate-400'
          }`}
        >
          <span className="text-2xl">{mood.icon}</span>
          <span className="text-xs font-medium">{mood.label}</span>
        </motion.button>
      ))}
    </div>
  );
}
