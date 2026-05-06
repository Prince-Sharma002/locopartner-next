'use client';

import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import MapComponent from '@/components/MapComponent';
import MoodSelector from '@/components/MoodSelector';
import ControlPanel from '@/components/ControlPanel';
import SettingsPanel from '@/components/SettingsPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ArrowRight, Bell, Users, Check } from 'lucide-react';

const API_URL = '/api';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [partners, setPartners] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<string[]>([]);
  
  const wasInRadiusMap = useRef<{ [key: string]: boolean }>({});
  const lastMoodMap = useRef<{ [key: string]: string }>({});
  const locationRef = useRef<{ latitude: number | null, longitude: number | null }>({ latitude: null, longitude: null });
  const moodRef = useRef<string | null>(null);

  const addNotification = (msg: string) => {
    setNotifications(prev => [msg, ...prev].slice(0, 10));
    setTimeout(() => {
      setNotifications(prev => prev.filter(m => m !== msg));
    }, 8000);
  };

  useEffect(() => {
    const savedUserId = localStorage.getItem('locometer_user_id');
    if (savedUserId) fetchUser(savedUserId);
    else setLoading(false);
  }, []);

  const fetchUser = async (userId: string) => {
    try {
      const res = await axios.get(`${API_URL}/users/${userId}`);
      if (res.data) initSession(res.data);
    } catch (err) {
      console.error('Session failed', err);
      localStorage.removeItem('locometer_user_id');
      setLoading(false);
    }
  };

  const initSession = (userData: any) => {
    setUser(userData);
    localStorage.setItem('locometer_user_id', userData._id);
    moodRef.current = userData.mood;

    if (userData.partners) {
      setPartners(userData.partners.map((p: any) => ({ ...p, distance: null })));
    }

    startTracking();
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/users/login`, { name: email.split('@')[0], email });
      initSession(res.data);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleLinkPartner = async () => {
    if (!user || !partnerEmail) return;
    try {
      await axios.post(`${API_URL}/users/link-partner`, { userId: user._id, partnerEmail });
      addNotification(`Request sent to ${partnerEmail}! 📡`);
      setPartnerEmail('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptPartner = async (partnerId: string) => {
    try {
      const res = await axios.post(`${API_URL}/users/accept-partner`, { userId: user._id, partnerId });
      const updatedUser = res.data.user;
      setUser(updatedUser);
      if (updatedUser.partners) {
        setPartners(updatedUser.partners.map((p: any) => ({ ...p, distance: null })));
      }
      addNotification('Partner request accepted! 💝');
    } catch (err) {
      console.error(err);
    }
  };

  const startTracking = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.watchPosition((position) => {
        const { latitude, longitude } = position.coords;
        locationRef.current = { latitude, longitude };
        setUser((prev: any) => prev ? { ...prev, location: { coordinates: [longitude, latitude] } } : prev);
      }, (err) => console.error(err), { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 });
    }
  };

  // Polling Loop
  useEffect(() => {
    if (!user) return;
    
    const syncData = async () => {
      try {
        const res = await axios.post(`${API_URL}/sync`, {
          userId: user._id,
          latitude: locationRef.current.latitude,
          longitude: locationRef.current.longitude,
          mood: moodRef.current
        });

        if (res.data.partners) {
          const updatedPartners = res.data.partners.map((p: any) => ({
             _id: p._id,
             name: p.name,
             distance: p.distance,
             location: { coordinates: [p.longitude, p.latitude] },
             mood: p.mood
          }));
          setPartners(updatedPartners);

          const radius = user.settings?.trackingRadius || 5;
          
          updatedPartners.forEach((p: any) => {
             if (p.distance !== null) {
               const inRadius = p.distance <= radius;
               const wasIn = wasInRadiusMap.current[p._id];
               if (wasIn !== undefined && inRadius !== wasIn) {
                 if (inRadius) addNotification(`${p.name} entered your ${radius}km area 👀`);
                 else addNotification(`${p.name} left your zone 🚶‍♀️`);
               }
               wasInRadiusMap.current[p._id] = inRadius;
             }

             const lastMood = lastMoodMap.current[p._id];
             if (p.mood && lastMood !== undefined && p.mood !== lastMood) {
               addNotification(`${p.name} is now feeling: ${p.mood}`);
             }
             lastMoodMap.current[p._id] = p.mood;
          });
        }
      } catch (err) {
        console.error('Sync failed', err);
      }
    };

    syncData();
    const intervalId = setInterval(syncData, 5000);
    return () => clearInterval(intervalId);
  }, [user?._id, user?.settings?.trackingRadius]);

  const updateMood = async (mood: string) => {
    if (!user) return;
    setUser({ ...user, mood });
    moodRef.current = mood;
  };

  const updateSettings = async (settings: any) => {
    if (!user) return;
    const oldRadius = user.settings.trackingRadius;
    setUser({ ...user, settings });
    try {
      const res = await axios.post(`${API_URL}/users/update-settings`, { userId: user._id, settings });
      setUser(res.data);
      if (oldRadius !== settings.trackingRadius) addNotification(`Radius updated to ${settings.trackingRadius}km`);
    } catch (err) {
      console.error(err);
    }
  };

  const logout = () => {
    localStorage.removeItem('locometer_user_id');
    window.location.reload();
  };

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#020617]">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-medium tracking-wide">Syncing Radar...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-[#020617] relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-600/20 blur-[120px] rounded-full" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md p-8 glass-card relative z-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-violet-600 rounded-3xl flex items-center justify-center mb-4 shadow-xl shadow-violet-600/20">
              <MapPin className="text-white w-8 h-8" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter">Locometer</h1>
            <p className="text-slate-400 text-center mt-2">Premium group location sharing for your circle.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your Email"
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
              required
            />
            <button className="w-full premium-gradient p-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-all">
               Join Circle <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-600/20">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Locometer <span className="text-violet-500">Circle</span></h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Live Radar Active</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800">
            <input 
              placeholder="Partner's Email" 
              className="bg-transparent px-4 py-1.5 text-sm focus:outline-none w-48"
              value={partnerEmail}
              onChange={(e) => setPartnerEmail(e.target.value)}
            />
            <button onClick={handleLinkPartner} className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
              <Users className="w-3.5 h-3.5" /> Request
            </button>
          </div>
          <button onClick={logout} className="text-slate-500 hover:text-white text-xs font-bold transition-all uppercase tracking-widest px-2">Logout</button>
        </div>
      </div>

      <AnimatePresence>
        {user.pendingPartners?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col gap-2">
            <span className="text-xs font-bold text-violet-400 uppercase tracking-widest ml-1">Consent Requests</span>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {user.pendingPartners.map((p: any) => (
                <div key={p._id} className="glass-card p-4 flex items-center justify-between border-violet-500/30">
                  <span className="text-sm font-medium text-white">{p.email} wants to link</span>
                  <button onClick={() => handleAcceptPartner(p._id)} className="bg-emerald-500/20 text-emerald-500 p-2 rounded-lg hover:bg-emerald-500 hover:text-white transition-all">
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-[600px]">
        <div className="lg:col-span-3 h-[500px] lg:h-auto">
          <MapComponent userLocation={user.location?.coordinates as [number, number] || [0, 0]} partners={partners} radius={user.settings.trackingRadius} />
        </div>

        <div className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          <MoodSelector currentMood={user.mood} onMoodSelect={updateMood} />
          <ControlPanel partners={partners} settings={user.settings} onUpdateSettings={updateSettings} />
          <SettingsPanel radius={user.settings.trackingRadius} onRadiusChange={(val) => updateSettings({ ...user.settings, trackingRadius: val })} />

          <div className="flex-1 glass-card p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between"><h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Radar Logs</h3><Bell className="w-4 h-4 text-slate-600" /></div>
            <div className="flex flex-col gap-3">
              <AnimatePresence>
                {notifications.map((note, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                    <div className="w-1.5 h-1.5 bg-violet-500 rounded-full shrink-0" /><span className="text-xs text-slate-300 leading-relaxed">{note}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {notifications.length === 0 && <div className="text-center py-12 text-slate-600 text-xs italic">Scanning circle...</div>}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
