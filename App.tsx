
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
const SYNC_API_BASE = 'https://jsonblob.com/api/jsonBlob';

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

  // Primary Sync Function
  const syncWithCloud = useCallback(async (direction: 'push' | 'pull', stateToPush?: AppState) => {
    if (!syncId) {
      setIsConnected(false);
      return;
    }
    
    setIsSyncing(true);
    const url = `${SYNC_API_BASE}/${syncId}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      if (direction === 'push' && stateToPush) {
        const currentHash = JSON.stringify(stateToPush);
        if (currentHash === lastCloudHashRef.current) {
          setIsSyncing(false);
          clearTimeout(timeoutId);
          return;
        }

        const res = await fetch(url, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: currentHash,
          signal: controller.signal
        });
        
        if (res.ok) {
          lastCloudHashRef.current = currentHash;
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      } else {
        const response = await fetch(url, { 
          headers: { 'Accept': 'application/json' },
          signal: controller.signal 
        });
        
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
      clearTimeout(timeoutId);
    } catch (error) {
      console.error("Cloud Sync Error:", error);
      setIsConnected(false);
    } finally {
      setIsSyncing(false);
    }
  }, [syncId, data]);

  // Periodic Pulling
  useEffect(() => {
    if (syncId) {
      syncWithCloud('pull');
      const interval = setInterval(() => syncWithCloud('pull'), 20000);
      return () => clearInterval(interval);
    }
  }, [syncId, syncWithCloud]);

  // Save Local & Push Changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    
    if (syncId && !isUpdatingRef.current) {
      const timer = setTimeout(() => {
        syncWithCloud('push', data);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [data, syncId, syncWithCloud]);

  // Masters Tab Connection Management
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
        // Step 1: Create fresh blob on server
        const createRes = await fetch(SYNC_API_BASE, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(data)
        });

        if (createRes.ok) {
          const location = createRes.headers.get('Location');
          const newId = location ? location.split('/').pop() : null;
          
          if (newId) {
            setSyncId(newId);
            localStorage.setItem(SYNC_KEY_STORAGE, newId);
            setIsConnected(true);
            alert(`SUCCESS: New Team Database Created!\n\nYour Team Key is: ${newId}\n\nShare this key with your team members.`);
          } else {
            throw new Error("Could not parse ID from server.");
          }
        } else {
          throw new Error(`Server returned ${createRes.status}`);
        }
      } else {
        // Step 2: Join existing
        const trimmedId = id.trim();
        const res = await fetch(`${SYNC_API_BASE}/${trimmedId}`, {
          headers: { 'Accept': 'application/json' }
        });
        
        if (res.ok) {
          const cloudData = await res.json();
          setData(cloudData);
          setSyncId(trimmedId);
          localStorage.setItem(SYNC_KEY_STORAGE, trimmedId);
          setIsConnected(true);
          alert('SUCCESS: Connected to Team Database!');
        } else {
          alert(`ERROR: Could not find a team database with ID: ${trimmedId}\n\nPlease check the key and try again.`);
        }
      }
    } catch (e: any) {
      console.error(e);
      alert(`NETWORK ERROR: Could not reach sync servers.\n\nPossible reasons:\n1. Corporate firewall is blocking jsonblob.com\n2. No internet connection\n3. The sync service is temporarily down.\n\nError details: ${e.message}`);
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
      {/* Critical Sync Alert */}
      {!syncId && (
        <div className="bg-[#FDB913] text-black text-[11px] font-extrabold py-2 px-8 flex justify-between items-center shadow-lg border-b border-black/10 z-50">
           <div className="flex items-center space-x-2">
             <ShieldAlert size={14} className="animate-pulse" />
             <span>ACTION REQUIRED: TEAM DATA SHARING IS DISABLED. GO TO 'MASTERS' TO CONNECT YOUR TEAM.</span>
           </div>
           <button onClick={() => setActiveTab('masters')} className="bg-black text-white px-3 py-1 rounded-sm text-[9px] hover:bg-zinc-800 transition">SETUP NOW →</button>
        </div>
      )}

      {/* Header */}
      <header className="bg-black text-white h-24 flex items-center px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-[#FDB913] skew-x-[-20deg] translate-x-20 z-0"></div>
        <div className="flex items-center z-10 space-x-6">
          <div className="bg-[#FDB913] w-14 h-14 flex items-center justify-center font-bold text-3xl text-black rounded-sm shadow-lg border-2 border-black/20">
            E
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">Epiroc Rockdrill</h1>
            <div className="flex items-center space-x-2 text-[10px] opacity-80 uppercase tracking-widest font-bold">
              <span>Management System</span>
              <span className="text-[#FDB913]">•</span>
              {isConnected ? (
                <span className="flex items-center text-green-400">
                  <Wifi size={10} className="mr-1" /> CLOUD: CONNECTED
                </span>
              ) : syncId ? (
                <span className="flex items-center text-red-500">
                  <WifiOff size={10} className="mr-1 animate-pulse" /> CLOUD: DISCONNECTED
                </span>
              ) : (
                <span className="flex items-center text-gray-400">
                   MODE: LOCAL ONLY
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex-1"></div>

        <div className="flex items-center space-x-4 z-10">
           {isSyncing && (
             <div className="flex items-center space-x-2 text-[#FDB913] text-[9px] font-black mr-4 uppercase">
               <RefreshCw size={12} className="animate-spin" />
               <span>Syncing...</span>
             </div>
           )}
           <div className="flex flex-col items-end pr-4 border-r border-white/10 mr-4">
             <span className="text-[9px] text-gray-500 uppercase font-black">Active Session</span>
             <span className="text-[#FDB913] text-xs font-mono font-bold tracking-widest">
               {syncId ? syncId : 'NONE'}
             </span>
           </div>
           <div className="p-2 bg-white/10 rounded-full border border-white/5">
             <Bell size={18} className={notifications.length > 0 ? "text-[#FDB913]" : "text-gray-500"} />
           </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-4 transition-all border-b-2 ${
                activeTab === tab.id 
                ? 'border-[#FDB913] text-black font-black bg-gray-50' 
                : 'border-transparent text-gray-400 hover:text-black hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              <span className="text-xs uppercase tracking-widest font-bold">{tab.name}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 p-6 max-w-[1600px] mx-auto w-full">
        {activeTab === 'calendar' && (
          <CalendarView 
            tasks={data.tasks} 
            safetyStatus={data.safetyStatus} 
            updateSafetyStatus={(newStatus) => updateData({ safetyStatus: newStatus })} 
          />
        )}
        {activeTab === 'tasks' && (
          <TaskBoard 
            tasks={data.tasks} 
            users={data.users} 
            categories={data.categories} 
            projects={data.projects}
            updateTasks={(tasks) => updateData({ tasks })} 
          />
        )}
        {activeTab === 'dashboard' && <Dashboard state={data} />}
        {activeTab === 'projects' && (
          <ProjectBoard 
            projects={data.projects} 
            users={data.users} 
            updateProjects={(projects) => updateData({ projects })} 
          />
        )}
        {activeTab === 'activities' && (
          <ActivityTracker 
            activities={data.activities} 
            users={data.users} 
            updateActivities={(activities) => updateData({ activities })} 
          />
        )}
        {activeTab === 'kpis' && (
          <KPITracker 
            kpis={data.kpis} 
            updateKpis={(kpis) => updateData({ kpis })} 
          />
        )}
        {activeTab === 'masters' && (
          <Masters 
            users={data.users} 
            categories={data.categories} 
            syncId={syncId}
            updateSyncId={updateSyncId}
            updateUsers={(users) => updateData({ users })} 
            updateCategories={(categories) => updateData({ categories })} 
          />
        )}
      </main>

      {/* Status Bar */}
      <footer className="bg-white border-t border-gray-200 py-2 px-8 flex justify-between items-center text-[9px] text-gray-400 font-bold uppercase tracking-widest">
        <div className="flex items-center space-x-6">
          <span>© {new Date().getFullYear()} EPIROC ROCKDRILL AB</span>
          <div className="flex items-center space-x-1">
             <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
             <span>SYSTEM STATUS: {isConnected ? 'OPERATIONAL' : 'OFFLINE'}</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
           {lastSyncTime && <span>LAST SYNC: {lastSyncTime.toLocaleTimeString()}</span>}
           <span className="text-black/20">|</span>
           <span>VERSION 2.1.4</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
