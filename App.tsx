
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
  Wifi,
  WifiOff,
  ShieldAlert,
  FileJson,
  Share2
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
// Npoint is often more reliable in corporate environments
const SYNC_API_BASE = 'https://api.npoint.io';

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

  const isUpdatingRef = useRef(false);

  // SMART MERGE LOGIC: Combines local and remote data without deleting unique items
  const mergeData = (local: AppState, remote: AppState): AppState => {
    const mergeById = (a: any[], b: any[]) => {
      const map = new Map();
      [...a, ...b].forEach(item => map.set(item.id, { ...(map.get(item.id) || {}), ...item }));
      return Array.from(map.values());
    };

    return {
      ...remote, // Take global settings from remote
      tasks: mergeById(local.tasks, remote.tasks),
      projects: mergeById(local.projects, remote.projects),
      activities: mergeById(local.activities, remote.activities),
      kpis: mergeById(local.kpis, remote.kpis),
      safetyStatus: { ...local.safetyStatus, ...remote.safetyStatus }
    };
  };

  const syncWithCloud = useCallback(async (direction: 'push' | 'pull', stateToPush?: AppState) => {
    if (!syncId) return;
    setIsSyncing(true);
    const url = `${SYNC_API_BASE}/${syncId}`;

    try {
      if (direction === 'push' && stateToPush) {
        const res = await fetch(url, {
          method: 'POST', // Npoint uses POST to update
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(stateToPush)
        });
        if (res.ok) setIsConnected(true);
      } else {
        const response = await fetch(url);
        if (response.ok) {
          const cloudData = await response.json();
          // Only update if data is actually different
          if (JSON.stringify(cloudData) !== JSON.stringify(data)) {
            isUpdatingRef.current = true;
            const merged = mergeData(data, cloudData);
            setData(merged);
            setTimeout(() => { isUpdatingRef.current = false; }, 500);
          }
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      }
      setLastSyncTime(new Date());
    } catch (error) {
      setIsConnected(false);
    } finally {
      setIsSyncing(false);
    }
  }, [syncId, data]);

  // Periodic Refresh (2 minutes to reduce network load)
  useEffect(() => {
    if (syncId) {
      syncWithCloud('pull');
      const interval = setInterval(() => syncWithCloud('pull'), 120000);
      return () => clearInterval(interval);
    }
  }, [syncId, syncWithCloud]);

  // Save to LocalStorage immediately
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

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
        const res = await fetch(SYNC_API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (res.ok) {
          const result = await res.json();
          const newId = result.id;
          setSyncId(newId);
          localStorage.setItem(SYNC_KEY_STORAGE, newId);
          setIsConnected(true);
          alert(`DATABASE CREATED!\nKey: ${newId}\nShare this with your team.`);
        }
      } else {
        const res = await fetch(`${SYNC_API_BASE}/${id}`);
        if (res.ok) {
          const cloudData = await res.json();
          setData(mergeData(data, cloudData));
          setSyncId(id);
          localStorage.setItem(SYNC_KEY_STORAGE, id);
          setIsConnected(true);
          alert('TEAM CONNECTED!');
        } else {
          alert('INVALID KEY: Check the ID and try again.');
        }
      }
    } catch (e) {
      alert('NETWORK BLOCKED: Your corporate firewall is preventing cloud sync.\n\nPlease use the "SHARED FOLDER SYNC" method in the Masters tab.');
      setIsConnected(false);
    } finally {
      setIsSyncing(false);
    }
  };

  const updateData = (newData: Partial<AppState>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  // Shared Drive Helper Functions
  const exportToSharedDrive = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `epiroc_team_sync_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    alert("FILE EXPORTED.\n\nPlease save this file to your Shared Network Folder (e.g., Z:\\ProjectData\\).");
  };

  const importFromSharedDrive = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        const merged = mergeData(data, importedData);
        setData(merged);
        alert("SYNC COMPLETE: Team data merged from shared file.");
      } catch (err) {
        alert("ERROR: Invalid file format.");
      }
    };
    reader.readAsText(file);
  };

  const tabs = [
    { id: 'calendar', name: 'Calendar', icon: <Calendar size={18} /> },
    { id: 'tasks', name: 'Tasks', icon: <CheckSquare size={18} /> },
    { id: 'dashboard', name: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'projects', name: 'Projects', icon: <Target size={18} /> },
    { id: 'activities', name: 'Activities', icon: <Clock size={18} /> },
    { id: 'kpis', name: 'KPI Tracker', icon: <TrendingUp size={18} /> },
    { id: 'masters', name: 'Masters', icon: <Settings size={18} /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
      {/* Dynamic Status Header */}
      <div className={`${isConnected ? 'bg-black' : 'bg-[#FDB913]'} text-white transition-colors h-24 flex items-center px-8 relative overflow-hidden border-b-2 border-white/10`}>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-white/5 skew-x-[-20deg] translate-x-20 z-0"></div>
        <div className="flex items-center z-10 space-x-6">
          <div className="bg-[#FDB913] w-14 h-14 flex items-center justify-center font-black text-3xl text-black rounded-sm border-2 border-black/10">E</div>
          <div>
            <h1 className={`text-2xl font-black tracking-tight uppercase ${isConnected ? 'text-white' : 'text-black'}`}>Epiroc Rockdrill</h1>
            <div className={`flex items-center space-x-3 text-[10px] uppercase tracking-widest font-bold ${isConnected ? 'text-gray-400' : 'text-black/60'}`}>
              <span className="flex items-center">
                {isConnected ? <Wifi size={10} className="mr-1 text-green-400" /> : <WifiOff size={10} className="mr-1" />}
                {isConnected ? 'TEAM CLOUD ACTIVE' : 'LOCAL MODE / SHARED DRIVE'}
              </span>
              <span>•</span>
              <span className="flex items-center">
                <FileJson size={10} className="mr-1" />
                ID: {syncId || 'UNLINKED'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex-1"></div>

        <div className="flex items-center space-x-4 z-10">
           <button 
             onClick={exportToSharedDrive}
             className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded text-[10px] font-black uppercase transition border border-white/5"
           >
             <Share2 size={14} className="text-[#FDB913]" />
             <span>Export to Shared Drive</span>
           </button>
           <label className="flex items-center space-x-2 bg-[#FDB913] hover:brightness-110 px-4 py-2 rounded text-[10px] font-black uppercase text-black cursor-pointer transition shadow-lg">
             <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
             <span>Sync from Shared File</span>
             <input type="file" className="hidden" accept=".json" onChange={importFromSharedDrive} />
           </label>
        </div>
      </div>

      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm overflow-x-auto">
        <div className="max-w-7xl mx-auto flex min-w-max">
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
              <span className="text-[11px] uppercase tracking-[0.15em] font-black">{tab.name}</span>
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
          <span className={isConnected ? "text-green-500" : "text-gray-300"}>● SYSTEM: {isConnected ? 'CONNECTED' : 'STANDALONE (SHARED FOLDER SYNC)'}</span>
        </div>
        <div className="flex items-center space-x-4">
           {lastSyncTime && <span>LAST SYNC: {lastSyncTime.toLocaleTimeString()}</span>}
           <span className="text-black/10">|</span>
           <span>ENTERPRISE RELEASE v3.0.0</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
