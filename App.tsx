
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
  BrainCircuit,
  Cloud,
  CloudOff,
  Users as UsersIcon
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

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('calendar');
  const [syncId, setSyncId] = useState<string>(localStorage.getItem(SYNC_KEY_STORAGE) || '');
  const [isSyncing, setIsSyncing] = useState(false);
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

  // Cloud Sync Logic
  const syncWithCloud = useCallback(async (direction: 'push' | 'pull', stateToPush?: AppState) => {
    if (!syncId) return;
    setIsSyncing(true);
    
    // Using a public anonymous storage API for the demo sync
    // In a real production environment, use Supabase or Firebase
    const url = `https://jsonblob.com/api/jsonBlob/${syncId}`;

    try {
      if (direction === 'push' && stateToPush) {
        await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(stateToPush)
        });
      } else {
        const response = await fetch(url);
        if (response.ok) {
          const cloudData = await response.json();
          // Simple check: Only update if cloud data is different
          if (JSON.stringify(cloudData) !== JSON.stringify(data)) {
            isUpdatingRef.current = true;
            setData(cloudData);
            setTimeout(() => { isUpdatingRef.current = false; }, 500);
          }
        }
      }
      setLastSyncTime(new Date());
    } catch (error) {
      console.error("Sync Error:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [syncId, data]);

  // Handle Local Data Changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    
    // Auto-push to cloud if sync is enabled and change was local
    if (syncId && !isUpdatingRef.current) {
      const timer = setTimeout(() => {
        syncWithCloud('push', data);
      }, 1000); // Debounce push
      return () => clearTimeout(timer);
    }
  }, [data, syncId, syncWithCloud]);

  // Background Pull
  useEffect(() => {
    if (!syncId) return;
    
    // Pull every 30 seconds
    const interval = setInterval(() => {
      syncWithCloud('pull');
    }, 30000);
    
    return () => clearInterval(interval);
  }, [syncId, syncWithCloud]);

  // Setup Sync ID
  const updateSyncId = async (id: string) => {
    if (!id) {
      setSyncId('');
      localStorage.removeItem(SYNC_KEY_STORAGE);
      return;
    }

    // If it's a new ID, try to fetch or create
    setIsSyncing(true);
    try {
      // Check if blob exists
      const res = await fetch(`https://jsonblob.com/api/jsonBlob/${id}`);
      if (res.ok) {
        const cloudData = await res.json();
        setData(cloudData);
      } else {
        // Create it with current data
        await fetch('https://jsonblob.com/api/jsonBlob', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Location': id },
          body: JSON.stringify(data)
        });
      }
      setSyncId(id);
      localStorage.setItem(SYNC_KEY_STORAGE, id);
      alert('Joined Shared Session Successfully!');
    } catch (e) {
      alert('Could not connect to sync service.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Automated checks
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const overdue = data.tasks.filter(t => t.dueDate < today && t.status !== 'Completed').length;
    const dueToday = data.tasks.filter(t => t.dueDate === today && t.status !== 'Completed').length;
    
    const newNotifications = [];
    if (overdue > 0) newNotifications.push(`⚠️ ${overdue} Overdue tasks.`);
    if (dueToday > 0) newNotifications.push(`📅 ${dueToday} due today.`);
    setNotifications(newNotifications);
  }, [data.tasks]);

  const updateData = (newData: Partial<AppState>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `epiroc_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        setData(imported);
        alert('Data imported successfully!');
      } catch (err) {
        alert('Invalid data file');
      }
    };
    reader.readAsText(file);
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
              <span>Complete Management System</span>
              <span className="text-[#FDB913]">•</span>
              {syncId ? (
                <span className="flex items-center text-green-400">
                  <Cloud size={10} className="mr-1" /> Multi-User Shared Session Active
                </span>
              ) : (
                <span className="flex items-center text-gray-400">
                  <CloudOff size={10} className="mr-1" /> Standalone Local Mode
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex-1"></div>

        <div className="flex items-center space-x-4 z-10 text-black font-semibold">
           {isSyncing && (
             <div className="flex items-center space-x-2 text-white text-[10px] mr-4 animate-pulse">
               <RefreshCw size={12} className="animate-spin text-[#FDB913]" />
               <span>SYNCING CLOUD...</span>
             </div>
           )}
           <button onClick={handleExport} className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded hover:bg-gray-100 transition shadow-sm text-xs">
             <Download size={14} /> <span>Export</span>
           </button>
           <label className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded hover:bg-gray-100 cursor-pointer transition shadow-sm text-xs">
             <Upload size={14} /> <span>Import</span>
             <input type="file" className="hidden" onChange={handleImport} />
           </label>
           <div className="relative group">
              <button className="p-2 bg-white rounded shadow-sm hover:bg-gray-100 transition">
                <Bell size={20} className={notifications.length > 0 ? "text-red-500 animate-pulse" : ""} />
                {notifications.length > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{notifications.length}</span>}
              </button>
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-50 p-3">
                <h3 className="font-bold border-bottom pb-2 mb-2 text-xs uppercase text-gray-400">Notifications</h3>
                {notifications.length === 0 ? <p className="text-gray-500 text-xs">No alerts today</p> : 
                  notifications.map((n, i) => <p key={i} className="text-xs mb-2 text-gray-800 border-l-2 border-[#FDB913] pl-2">{n}</p>)}
              </div>
           </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-4 transition-all border-b-2 ${
                activeTab === tab.id 
                ? 'border-[#FDB913] text-black font-bold bg-gray-50' 
                : 'border-transparent text-gray-500 hover:text-black hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              <span className="text-sm uppercase tracking-wide">{tab.name}</span>
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
          <span className="text-[#FDB913]">● {syncId ? 'CLOUD SYNC ACTIVE' : 'LOCAL CACHE ACTIVE'}</span>
          {lastSyncTime && <span className="text-gray-300">Last Sync: {lastSyncTime.toLocaleTimeString()}</span>}
        </div>
        <div className="flex items-center space-x-2">
           <span className={syncId ? "text-green-500" : "text-gray-400"}>NETWORK: {syncId ? 'CONNECTED' : 'DISCONNECTED'}</span>
           <span className={`w-1.5 h-1.5 rounded-full ${syncId ? 'bg-green-500' : 'bg-gray-300'}`}></span>
        </div>
      </footer>
    </div>
  );
};

export default App;
