
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Calendar, 
  CheckSquare, 
  LayoutDashboard, 
  Target, 
  Clock, 
  TrendingUp, 
  Settings, 
  Download, 
  Upload, 
  RefreshCw, 
  Bell, 
  Cloud,
  CloudOff,
  Wifi,
  WifiOff,
  ShieldAlert
} from 'lucide-react';
import { AppState, Task, Project, Activity, KPI, SafetyStatus } from './types';
import { BRAND, DEFAULT_USERS, DEFAULT_CATEGORIES, DEFAULT_AGENDA } from './constants';
import Dashboard from './components/Dashboard';
import TaskBoard from './components/TaskBoard';
import ProjectBoard from './components/ProjectBoard';
import CalendarView from './components/CalendarView';
import ActivityTracker from './components/ActivityTracker';
import KPITracker from './components/KPITracker';
import Masters from './components/Masters';

const STORAGE_KEY = 'epiroc_management_data';
const SYNC_KEY_STORAGE = 'epiroc_sync_id';
// Switched to a more robust provider that returns ID in JSON body
const SYNC_API_BASE = 'https://api.jsonstorage.net/v1/json';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('calendar');
  const [syncId, setSyncId] = useState<string>(localStorage.getItem(SYNC_KEY_STORAGE) || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [data, setData] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    return {
      tasks: [],
      projects: [],
      activities: [],
      kpis: [],
      users: DEFAULT_USERS,
      categories: DEFAULT_CATEGORIES,
      safetyStatus: {},
      dailyAgenda: DEFAULT_AGENDA
    };
  });

  const [notifications, setNotifications] = useState<string[]>([]);
  const isUpdatingRef = useRef(false);
  const lastCloudHashRef = useRef<string>('');

  // Primary Sync Function (Optimized for Corporate Firewalls)
  const syncWithCloud = useCallback(async (direction: 'push' | 'pull', stateToPush?: AppState) => {
    if (!syncId) {
      setIsConnected(false);
      return;
    }
    
    setIsSyncing(true);
    // JSONStorage URL format: BASE/ID
    const url = `${SYNC_API_BASE}/${syncId}`;

    try {
      if (direction === 'push' && stateToPush) {
        const currentHash = JSON.stringify(stateToPush);
        if (currentHash === lastCloudHashRef.current) {
          setIsSyncing(false);
          return;
        }

        const res = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: currentHash
        });
        
        if (res.ok) {
          lastCloudHashRef.current = currentHash;
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      } else {
        const response = await fetch(url);
        if (response.ok) {
          const cloudData = await response.json();
          const cloudHash = JSON.stringify(cloudData);
          
          if (cloudHash !== JSON.stringify(data)) {
            isUpdatingRef.current = true;
            setData(cloudData);
            lastCloudHashRef.current = cloudHash;
            setTimeout(() => { isUpdatingRef.current = false; }, 500);
          }
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      }
      setLastSyncTime(new Date());
    } catch (error) {
      console.error("Cloud Sync Error:", error);
      setIsConnected(false);
    } finally {
      setIsSyncing(false);
    }
  }, [syncId, data]);

  // Sync Logic Setup
  useEffect(() => {
    if (syncId) {
      syncWithCloud('pull');
      const interval = setInterval(() => syncWithCloud('pull'), 25000); // 25s polling
      return () => clearInterval(interval);
    }
  }, [syncId, syncWithCloud]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (syncId && !isUpdatingRef.current) {
      const timer = setTimeout(() => syncWithCloud('push', data), 3000);
      return () => clearTimeout(timer);
    }
  }, [data, syncId, syncWithCloud]);

  // Master Connection Logic (Fixed for reliability)
  const updateSyncId = async (id: string, isNew: boolean = false) => {
    if (!id && !isNew) {
      setSyncId('');
      setIsConnected(false);
      localStorage.removeItem(SYNC_KEY_STORAGE);
      return;
    }

    setIsSyncing(true);
    try {
      if (isNew) {
        // Create new storage item
        const createRes = await fetch(SYNC_API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (createRes.ok) {
          const result = await createRes.json();
          // JSONStorage returns a URI: "https://.../ID"
          const parts = result.uri.split('/');
          const newId = parts[parts.length - 1];
          
          if (newId) {
            setSyncId(newId);
            localStorage.setItem(SYNC_KEY_STORAGE, newId);
            setIsConnected(true);
            alert(`TEAM SYNC ACTIVATED\n\nYour Team Key: ${newId}\n\nShare this key with your team members.`);
          }
        } else {
          throw new Error(`Server returned error ${createRes.status}`);
        }
      } else {
        // Join existing
        const trimmedId = id.trim();
        const res = await fetch(`${SYNC_API_BASE}/${trimmedId}`);
        if (res.ok) {
          const cloudData = await res.json();
          setData(cloudData);
          setSyncId(trimmedId);
          localStorage.setItem(SYNC_KEY_STORAGE, trimmedId);
          setIsConnected(true);
          alert('CONNECTED: Team database loaded.');
        } else {
          alert('ID NOT FOUND: Please check the Team Key and try again.');
        }
      }
    } catch (e: any) {
      console.error(e);
      alert(`SYNC ERROR: Connection Failed.\n\nNote: If you are on a corporate network, IT may be blocking 'api.jsonstorage.net'.\n\nDetails: ${e.message}`);
      setIsConnected(false);
    } finally {
      setIsSyncing(false);
    }
  };

  const updateData = (newData: Partial<AppState>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  const tabs = [
    { id: 'calendar', name: 'Calendar', icon: <Calendar size={20} /> },
    { id: 'tasks', name: 'Tasks', icon: <CheckSquare size={20} /> },
    { id: 'dashboard', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'projects', name: 'Projects', icon: <Target size={20} /> },
    { id: 'activities', name: 'Activities', icon: <Clock size={20} /> },
    { id: 'kpis', name: 'KPI Tracker', icon: <TrendingUp size={20} /> },
    { id: 'masters', name: 'Masters', icon: <Settings size={20} /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
      {!syncId && (
        <div className="bg-[#FDB913] text-black text-[11px] font-black py-2.5 px-8 flex justify-between items-center z-50 shadow-md">
           <div className="flex items-center space-x-2">
             <ShieldAlert size={14} />
             <span>TEAM COLLABORATION IS CURRENTLY DISABLED. DATA IS ONLY LOCAL.</span>
           </div>
           <button onClick={() => setActiveTab('masters')} className="bg-black text-white px-4 py-1 rounded text-[9px] hover:bg-zinc-800 transition">SETUP TEAM CLOUD SYNC →</button>
        </div>
      )}

      <header className="bg-black text-white h-24 flex items-center px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-[#FDB913] skew-x-[-20deg] translate-x-20 z-0 opacity-90"></div>
        <div className="flex items-center z-10 space-x-6">
          <div className="bg-[#FDB913] w-14 h-14 flex items-center justify-center font-black text-3xl text-black rounded-sm border-2 border-black/10">E</div>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase leading-none mb-1">Epiroc Rockdrill</h1>
            <div className="flex items-center space-x-2 text-[10px] opacity-70 uppercase tracking-widest font-bold">
              <span>Management v2.5</span>
              <span className="text-[#FDB913]">•</span>
              {isConnected ? (
                <span className="flex items-center text-green-400"><Wifi size={10} className="mr-1" /> CLOUD ONLINE</span>
              ) : (
                <span className="flex items-center text-red-500"><WifiOff size={10} className="mr-1" /> OFFLINE</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex-1"></div>

        <div className="flex items-center space-x-6 z-10">
           {isSyncing && (
             <div className="flex items-center space-x-2 text-[#FDB913] text-[9px] font-black uppercase tracking-tighter">
               <RefreshCw size={12} className="animate-spin" />
               <span>Syncing...</span>
             </div>
           )}
           <div className="flex flex-col items-end">
             <span className="text-[9px] text-gray-500 uppercase font-black">Session ID</span>
             <span className="text-[#FDB913] text-xs font-mono font-bold tracking-widest">{syncId || 'NONE'}</span>
           </div>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-3 px-8 py-5 transition-all border-b-4 ${
                activeTab === tab.id 
                ? 'border-[#FDB913] text-black font-black bg-gray-50' 
                : 'border-transparent text-gray-400 hover:text-black hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              <span className="text-xs uppercase tracking-[0.15em] font-black">{tab.name}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1 p-6 max-w-[1600px] mx-auto w-full">
        {activeTab === 'calendar' && <CalendarView tasks={data.tasks} safetyStatus={data.safetyStatus} updateSafetyStatus={(newStatus) => updateData({ safetyStatus: newStatus })} />}
        {activeTab === 'tasks' && <TaskBoard tasks={data.tasks} users={data.users} categories={data.categories} projects={data.projects} updateTasks={(tasks) => updateData({ tasks })} />}
        {activeTab === 'dashboard' && <Dashboard state={data} />}
        {activeTab === 'projects' && <ProjectBoard projects={data.projects} users={data.users} updateProjects={(projects) => updateData({ projects })} />}
        {activeTab === 'activities' && <ActivityTracker activities={data.activities} users={data.users} updateActivities={(activities) => updateData({ activities })} />}
        {activeTab === 'kpis' && <KPITracker kpis={data.kpis} updateKpis={(kpis) => updateData({ kpis })} />}
        {activeTab === 'masters' && <Masters users={data.users} categories={data.categories} syncId={syncId} updateSyncId={updateSyncId} updateUsers={(users) => updateData({ users })} updateCategories={(categories) => updateData({ categories })} />}
      </main>

      <footer className="bg-white border-t border-gray-200 py-3 px-8 flex justify-between items-center text-[9px] text-gray-400 font-bold uppercase tracking-widest">
        <div className="flex items-center space-x-6">
          <span>© {new Date().getFullYear()} EPIROC ROCKDRILL AB</span>
          <span className={isConnected ? "text-green-500" : "text-gray-300"}>● STATUS: {isConnected ? 'SYNC ACTIVE' : 'LOCAL MODE'}</span>
        </div>
        <div className="flex items-center space-x-4">
           {lastSyncTime && <span>LAST SUCCESSFUL SYNC: {lastSyncTime.toLocaleTimeString()}</span>}
           <span className="text-black/10">|</span>
           <span>MULTI-USER CLOUD v2.5.1</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
