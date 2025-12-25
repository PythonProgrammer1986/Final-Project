
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
  WifiOff
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

  // Robust Sync Engine
  const syncWithCloud = useCallback(async (direction: 'push' | 'pull', stateToPush?: AppState) => {
    if (!syncId) {
      setIsConnected(false);
      return;
    }
    
    setIsSyncing(true);
    const url = `${SYNC_API_BASE}/${syncId}`;

    try {
      if (direction === 'push' && stateToPush) {
        const currentHash = JSON.stringify(stateToPush);
        // Don't push if data hasn't changed since last pull/push
        if (currentHash === lastCloudHashRef.current) {
          setIsSyncing(false);
          return;
        }

        await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: currentHash
        });
        lastCloudHashRef.current = currentHash;
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
        } else if (response.status === 404) {
          setIsConnected(false); // ID no longer exists
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

  // Initial Sync & Periodical Pull
  useEffect(() => {
    if (syncId) {
      syncWithCloud('pull');
      const interval = setInterval(() => syncWithCloud('pull'), 15000); // Poll every 15s
      return () => clearInterval(interval);
    }
  }, [syncId, syncWithCloud]);

  // Handle Local Data Changes (Push)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    
    if (syncId && !isUpdatingRef.current) {
      const timer = setTimeout(() => {
        syncWithCloud('push', data);
      }, 1500); // Debounce push to avoid too many requests
      return () => clearTimeout(timer);
    }
  }, [data, syncId, syncWithCloud]);

  // Connection Handler (Masters Tab)
  const updateSyncId = async (id: string) => {
    if (!id || id.trim() === '') {
      setSyncId('');
      setIsConnected(false);
      localStorage.removeItem(SYNC_KEY_STORAGE);
      return;
    }

    const trimmedId = id.trim();
    setIsSyncing(true);
    try {
      // 1. Try to fetch existing
      const res = await fetch(`${SYNC_API_BASE}/${trimmedId}`);
      if (res.ok) {
        const cloudData = await res.json();
        setData(cloudData);
        setSyncId(trimmedId);
        localStorage.setItem(SYNC_KEY_STORAGE, trimmedId);
        setIsConnected(true);
        alert('Connected to Shared Team Database!');
      } else {
        // 2. If not found, create new
        const createRes = await fetch(SYNC_API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (createRes.ok) {
          // Extract ID from Location header: https://jsonblob.com/api/jsonBlob/ID
          const location = createRes.headers.get('Location');
          const newId = location ? location.split('/').pop() : trimmedId;
          if (newId) {
            setSyncId(newId);
            localStorage.setItem(SYNC_KEY_STORAGE, newId);
            setIsConnected(true);
            alert(`New Team Database Created! Key: ${newId}`);
          }
        }
      }
    } catch (e) {
      alert('Network Error: Could not reach sync servers.');
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
      {/* Dynamic Sync Banner for Unsynced Users */}
      {!syncId && (
        <div className="bg-[#FDB913] text-black text-[11px] font-extrabold py-2 px-8 flex justify-between items-center animate-in slide-in-from-top duration-500">
           <div className="flex items-center space-x-2">
             <CloudOff size={14} />
             <span>TEAM SYNC DISABLED: YOU ARE CURRENTLY IN LOCAL MODE. CHANGES ARE NOT SHARED.</span>
           </div>
           <button onClick={() => setActiveTab('masters')} className="underline hover:no-underline">OPEN SYNC SETTINGS →</button>
        </div>
      )}

      {/* Header */}
      <header className="bg-black text-white h-24 flex items-center px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-[#FDB913] skew-x-[-20deg] translate-x-20 z-0"></div>
        <div className="flex items-center z-10 space-x-6">
          <div className="bg-[#FDB913] w-14 h-14 flex items-center justify-center font-bold text-3xl text-black rounded-sm shadow-lg">
            E
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">EPIROC ROCKDRILL AB</h1>
            <div className="flex items-center space-x-2 text-[10px] opacity-80 uppercase tracking-widest font-medium">
              <span>Enterprise Management System</span>
              <span className="text-[#FDB913]">•</span>
              {isConnected ? (
                <span className="flex items-center text-green-400 font-bold">
                  <Wifi size={10} className="mr-1 animate-pulse" /> CLOUD DATABASE CONNECTED
                </span>
              ) : syncId ? (
                <span className="flex items-center text-red-400 font-bold">
                  <WifiOff size={10} className="mr-1" /> CONNECTION LOST - RECONNECTING...
                </span>
              ) : (
                <span className="flex items-center text-gray-500">
                   STANDALONE MODE
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex-1"></div>

        <div className="flex items-center space-x-4 z-10 text-black font-semibold">
           {isSyncing && (
             <div className="flex items-center space-x-2 text-white text-[10px] mr-4">
               <RefreshCw size={12} className="animate-spin text-[#FDB913]" />
               <span className="tracking-tighter">DATA SYNC...</span>
             </div>
           )}
           <div className="relative group">
              <button className="p-2 bg-white rounded shadow-sm hover:bg-gray-100 transition">
                <Bell size={20} className={notifications.length > 0 ? "text-red-500 animate-bounce" : ""} />
                {notifications.length > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{notifications.length}</span>}
              </button>
           </div>
           <div className="flex flex-col items-end">
             <span className="text-white text-[10px] opacity-60 uppercase tracking-tighter">Current Session</span>
             <span className="text-[#FDB913] text-xs font-mono">{syncId ? `ID: ${syncId.substring(0,8)}...` : 'OFFLINE'}</span>
           </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-4 transition-all border-b-2 ${
                activeTab === tab.id 
                ? 'border-[#FDB913] text-black font-extrabold bg-gray-50' 
                : 'border-transparent text-gray-500 hover:text-black hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              <span className="text-sm uppercase tracking-wider">{tab.name}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content Area */}
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

      {/* Footer / Status Bar */}
      <footer className="bg-white border-t border-gray-200 py-3 px-8 flex justify-between items-center text-[10px] text-gray-400 font-medium uppercase tracking-widest">
        <div className="flex items-center space-x-4">
          <span>© {new Date().getFullYear()} EPIROC ROCKDRILL AB</span>
          <span className={isConnected ? "text-green-500 font-bold" : "text-gray-300"}>
            ● {isConnected ? 'TEAM CLOUD SYNC: ONLINE' : 'LOCAL CACHE: ACTIVE'}
          </span>
          {lastSyncTime && <span className="text-gray-300">Last Sync Check: {lastSyncTime.toLocaleTimeString()}</span>}
        </div>
        <div className="flex items-center space-x-2">
           <span className={isConnected ? "text-green-500" : "text-gray-400"}>NETWORK: {isConnected ? 'LIVE' : 'DISCONNECTED'}</span>
           <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
        </div>
      </footer>
    </div>
  );
};

export default App;
