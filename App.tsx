
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Calendar, 
  CheckSquare, 
  LayoutDashboard, 
  Target, 
  Clock, 
  TrendingUp, 
  Settings, 
  RefreshCw, 
  Bell, 
  Wifi,
  WifiOff,
  ShieldAlert,
  Save,
  HardDrive,
  FileCode
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

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('calendar');
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

  // Shared Folder State
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastFileHash, setLastFileHash] = useState<string>('');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const isUpdatingRef = useRef(false);
  const dataRef = useRef(data);

  // Sync ref with state
  useEffect(() => {
    dataRef.current = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  // SMART MERGE LOGIC: Combines local and remote data
  const mergeData = (local: AppState, remote: AppState): AppState => {
    const mergeById = (a: any[], b: any[]) => {
      const map = new Map();
      [...a, ...b].forEach(item => map.set(item.id, { ...(map.get(item.id) || {}), ...item }));
      return Array.from(map.values());
    };

    return {
      ...remote,
      tasks: mergeById(local.tasks, remote.tasks),
      projects: mergeById(local.projects, remote.projects),
      activities: mergeById(local.activities, remote.activities),
      kpis: mergeById(local.kpis, remote.kpis),
      safetyStatus: { ...local.safetyStatus, ...remote.safetyStatus }
    };
  };

  // 1. LINK FILE: Initial connection to the shared folder
  const linkSharedFile = async () => {
    try {
      // @ts-ignore - File System Access API
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: 'Epiroc Database', accept: { 'application/json': ['.json'] } }],
        excludeAcceptAllOption: true,
        multiple: false
      });
      
      setFileHandle(handle);
      
      // Initial Load
      const file = await handle.getFile();
      const content = await file.text();
      if (content) {
        const remoteData = JSON.parse(content);
        setData(prev => mergeData(prev, remoteData));
        setLastFileHash(content);
      }
      setLastSyncTime(new Date());
    } catch (err) {
      console.error("Failed to link file", err);
    }
  };

  // 2. AUTO-SAVE & AUTO-LOAD Loop (Every 5 seconds)
  useEffect(() => {
    if (!fileHandle) return;

    const interval = setInterval(async () => {
      try {
        setIsAutoSaving(true);
        
        // A. Read current state of the file to see if anyone else changed it
        const file = await fileHandle.getFile();
        const content = await file.text();
        
        // B. If file content changed externally, merge it
        if (content !== lastFileHash) {
          const remoteData = JSON.parse(content);
          isUpdatingRef.current = true;
          const merged = mergeData(dataRef.current, remoteData);
          setData(merged);
          setLastFileHash(JSON.stringify(merged));
          setLastSyncTime(new Date());
          setTimeout(() => { isUpdatingRef.current = false; }, 500);
        } 
        // C. If local data changed, save it to the file
        else {
          const localContent = JSON.stringify(dataRef.current, null, 2);
          if (localContent !== lastFileHash) {
            // @ts-ignore
            const writable = await fileHandle.createWritable();
            await writable.write(localContent);
            await writable.close();
            setLastFileHash(localContent);
            setLastSyncTime(new Date());
          }
        }
      } catch (err) {
        console.error("Auto-sync failed", err);
      } finally {
        setTimeout(() => setIsAutoSaving(false), 500);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [fileHandle, lastFileHash]);

  const updateData = (newData: Partial<AppState>) => {
    setData(prev => ({ ...prev, ...newData }));
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
      {/* Header with Automatic Sync Controls */}
      <header className={`transition-colors duration-500 h-24 flex items-center px-8 relative overflow-hidden ${fileHandle ? 'bg-black text-white' : 'bg-[#FDB913] text-black'}`}>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-white/5 skew-x-[-20deg] translate-x-20 z-0"></div>
        <div className="flex items-center z-10 space-x-6">
          <div className={`w-14 h-14 flex items-center justify-center font-black text-3xl rounded-sm border-2 ${fileHandle ? 'bg-[#FDB913] text-black border-black/10' : 'bg-black text-[#FDB913] border-white/10'}`}>
            E
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">Epiroc Rockdrill</h1>
            <div className="flex items-center space-x-3 text-[10px] uppercase tracking-widest font-black opacity-80">
              <span className="flex items-center">
                {fileHandle ? <Wifi size={10} className="mr-1 text-green-400" /> : <WifiOff size={10} className="mr-1" />}
                {fileHandle ? 'LIVE SHARED SYNC ACTIVE' : 'LOCAL MODE (NOT CONNECTED)'}
              </span>
              <span>•</span>
              <span className="flex items-center">
                <HardDrive size={10} className="mr-1" />
                FILE: {fileHandle ? fileHandle.name : 'NONE'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex-1"></div>

        <div className="flex items-center space-x-4 z-10">
           {fileHandle ? (
             <div className="flex items-center bg-white/10 px-6 py-3 rounded border border-white/5 space-x-6">
                <div className="flex flex-col items-end border-r border-white/10 pr-6">
                  <span className="text-[8px] opacity-50 font-black tracking-widest uppercase">Sync Status</span>
                  <div className="flex items-center space-x-2">
                    {isAutoSaving ? <RefreshCw size={12} className="text-[#FDB913] animate-spin" /> : <Save size={12} className="text-green-400" />}
                    <span className="text-[10px] font-black">{isAutoSaving ? 'WRITING...' : 'IDLE'}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[8px] opacity-50 font-black tracking-widest uppercase">Last Update</span>
                   <span className="text-[10px] font-black text-[#FDB913]">{lastSyncTime ? lastSyncTime.toLocaleTimeString() : '--:--'}</span>
                </div>
             </div>
           ) : (
             <button 
               onClick={linkSharedFile}
               className="bg-black text-[#FDB913] hover:bg-zinc-800 px-6 py-3 rounded font-black text-xs uppercase tracking-widest shadow-2xl flex items-center space-x-2 border-2 border-[#FDB913]/20"
             >
               <FileCode size={18} />
               <span>Link Shared Database File (Z:\)</span>
             </button>
           )}
        </div>
      </header>

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
        {activeTab === 'masters' && (
           <div className="space-y-6">
             <div className="bg-zinc-900 p-8 rounded-xl border-t-4 border-[#FDB913] text-white">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-4">
                    <HardDrive className="text-[#FDB913]" size={32} />
                    <div>
                      <h2 className="text-2xl font-black uppercase">Shared Drive Management</h2>
                      <p className="text-gray-400 text-xs font-bold uppercase">Configure automatic background sync for the team</p>
                    </div>
                  </div>
                  {fileHandle && (
                    <button 
                      onClick={() => { setFileHandle(null); }} 
                      className="bg-red-600/20 text-red-500 border border-red-500/30 px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition"
                    >
                      UNLINK FILE
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                    <h3 className="text-[#FDB913] text-sm font-black uppercase mb-4 tracking-widest">Connection Status</h3>
                    {fileHandle ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400 uppercase font-bold">Linked Filename:</span>
                          <span className="font-mono text-[#FDB913]">{fileHandle.name}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400 uppercase font-bold">Auto-Save Interval:</span>
                          <span className="text-green-400 font-bold tracking-widest">EVERY 5 SECONDS</span>
                        </div>
                        <div className="p-3 bg-green-500/10 rounded border border-green-500/20 text-[10px] text-green-400 font-bold uppercase leading-relaxed">
                          The application is automatically writing your changes and checking for team updates in the background.
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-6 text-center">
                        <ShieldAlert className="text-gray-600 mb-4" size={48} />
                        <p className="text-xs text-gray-500 mb-6 font-bold uppercase leading-relaxed px-12">
                          Your changes are currently only saved to this computer's cache. Link a file on your shared drive to enable team collaboration.
                        </p>
                        <button onClick={linkSharedFile} className="w-full bg-[#FDB913] text-black py-3 rounded font-black uppercase tracking-widest shadow-lg">Connect Shared Drive File</button>
                      </div>
                    )}
                  </div>

                  <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                    <h3 className="text-gray-400 text-sm font-black uppercase mb-4 tracking-widest">How it works</h3>
                    <ul className="text-[10px] text-gray-500 space-y-3 font-bold uppercase list-disc pl-4">
                      <li>One person creates an empty <code className="text-[#FDB913]">db.json</code> on the shared drive.</li>
                      <li>Everyone "Links" that same file.</li>
                      <li>The app silently merges everyone's work every 5 seconds.</li>
                      <li>No more manual exporting or importing required!</li>
                    </ul>
                  </div>
                </div>
             </div>

             <Masters 
               users={data.users} 
               categories={data.categories} 
               syncId={fileHandle ? 'SHARED_FILE_ACTIVE' : ''}
               updateSyncId={() => {}} 
               updateUsers={(users) => updateData({ users })} 
               updateCategories={(categories) => updateData({ categories })} 
             />
           </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 py-3 px-8 flex justify-between items-center text-[9px] text-gray-400 font-bold uppercase tracking-widest">
        <div className="flex items-center space-x-6">
          <span>© {new Date().getFullYear()} EPIROC ROCKDRILL AB</span>
          <span className={fileHandle ? "text-green-500" : "text-gray-300"}>● AUTO-SYNC: {fileHandle ? 'ACTIVE' : 'DISABLED'}</span>
        </div>
        <div className="flex items-center space-x-4">
           {lastSyncTime && <span>LAST BACKGROUND SYNC: {lastSyncTime.toLocaleTimeString()}</span>}
           <span className="text-black/10">|</span>
           <span>ENTERPRISE AUTO-DRIVE v4.0.0</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
