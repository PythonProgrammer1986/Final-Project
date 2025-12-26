
import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, CheckSquare, LayoutDashboard, Target, Clock, 
  Settings, Save, HardDrive, FileCode, Wifi, WifiOff,
  Lightbulb, Award, BarChart3, ListChecks, RefreshCw,
  Download, Upload, ShieldCheck, Database, History, Eye, Play,
  AlertTriangle
} from 'lucide-react';
import { AppState, Task, Project, User, Idea, Kudos, OKR, Booking } from './types';
import { DEFAULT_USERS, DEFAULT_CATEGORIES, DEFAULT_AGENDA } from './constants';
import Dashboard from './components/Dashboard';
import TaskBoard from './components/TaskBoard';
import ProjectBoard from './components/ProjectBoard';
import CalendarView from './components/CalendarView';
import IdeaMatrix from './components/IdeaMatrix';
import KudosBoard from './components/KudosBoard';
import OKRBoard from './components/OKRBoard';
import Masters from './components/Masters';
import HoursBooking from './components/HoursBooking';

const STORAGE_KEY = 'epiroc_pulse_v5_final';
const APP_VERSION = '5.4.0';

const tabs = [
  { id: 'dashboard', name: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'calendar', name: 'Safety Calendar', icon: <Calendar size={18} /> },
  { id: 'tasks', name: 'Operations', icon: <CheckSquare size={18} /> },
  { id: 'projects', name: 'Projects', icon: <BarChart3 size={18} /> },
  { id: 'bookings', name: 'Time Logs', icon: <Clock size={18} /> },
  { id: 'okrs', name: 'Strategy', icon: <Target size={18} /> },
  { id: 'ideas', name: 'Improvements', icon: <Lightbulb size={18} /> },
  { id: 'kudos', name: 'Recognition', icon: <Award size={18} /> },
  { id: 'masters', name: 'Admin', icon: <Settings size={18} /> },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [data, setData] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    return {
      version: APP_VERSION,
      tasks: [],
      projects: [],
      ideas: [],
      kudos: [],
      okrs: [],
      users: DEFAULT_USERS.map(name => ({ name, capacity: 160 })),
      bookings: [],
      categories: DEFAULT_CATEGORIES,
      safetyStatus: {},
      dailyAgenda: DEFAULT_AGENDA
    };
  });

  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [backupDirHandle, setBackupDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastFileHash, setLastFileHash] = useState<string>('');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [needsBackupAuth, setNeedsBackupAuth] = useState(false);

  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);

  useEffect(() => {
    if (!isReadOnly) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data, isReadOnly]);

  const performAutoBackup = async () => {
    if (!backupDirHandle || isReadOnly) return;
    
    const today = new Date().toISOString().split('T')[0];
    if (data.lastBackupDate === today) return;

    try {
      // @ts-ignore
      const permission = await backupDirHandle.queryPermission({ mode: 'readwrite' });
      if (permission !== 'granted') {
        setNeedsBackupAuth(true);
        return;
      }

      const fileName = `epiroc_daily_snapshot_${today}.json`;
      const newFileHandle = await backupDirHandle.getFileHandle(fileName, { create: true });
      // @ts-ignore
      const writable = await newFileHandle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
      
      setData(prev => ({ ...prev, lastBackupDate: today }));
      setNeedsBackupAuth(false);
      console.log(`✓ Auto-backup snapshot created: ${fileName}`);
    } catch (err) {
      console.error("Auto-backup failed", err);
      setNeedsBackupAuth(true);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (backupDirHandle) performAutoBackup();
    }, 3000);
    return () => clearTimeout(timer);
  }, [backupDirHandle, data.lastBackupDate]);

  const mergeData = (local: AppState, remote: AppState): AppState => {
    const mergeById = (a: any[], b: any[]) => {
      const map = new Map();
      [...(a || []), ...(b || [])].forEach(item => {
        if (item && item.id) map.set(item.id, item);
      });
      return Array.from(map.values());
    };

    return {
      ...remote,
      version: APP_VERSION,
      tasks: mergeById(local.tasks, remote.tasks),
      projects: mergeById(local.projects, remote.projects),
      ideas: mergeById(local.ideas, remote.ideas),
      kudos: mergeById(local.kudos, remote.kudos),
      okrs: mergeById(local.okrs, remote.okrs),
      bookings: mergeById(local.bookings, remote.bookings),
      safetyStatus: { ...(local.safetyStatus || {}), ...(remote.safetyStatus || {}) }
    };
  };

  const linkSharedFile = async () => {
    try {
      // @ts-ignore
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: 'Epiroc Database', accept: { 'application/json': ['.json'] } }],
        multiple: false
      });
      setFileHandle(handle);
      setIsReadOnly(false);
      const file = await handle.getFile();
      const content = await file.text();
      if (content) {
        const remoteData = JSON.parse(content);
        setData(prev => mergeData(prev, remoteData));
        setLastFileHash(content);
      }
      setLastSyncTime(new Date());
    } catch (err) { console.error(err); }
  };

  const linkBackupDir = async () => {
    try {
      // @ts-ignore
      const handle = await window.showDirectoryPicker();
      setBackupDirHandle(handle);
      setNeedsBackupAuth(false);
      performAutoBackup();
    } catch (e) { console.error("Folder selection cancelled"); }
  };

  const reAuthBackup = async () => {
    if (!backupDirHandle) return;
    try {
      // @ts-ignore
      const permission = await backupDirHandle.requestPermission({ mode: 'readwrite' });
      if (permission === 'granted') {
        setNeedsBackupAuth(false);
        performAutoBackup();
      }
    } catch (e) { linkBackupDir(); }
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `epiroc_manual_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  useEffect(() => {
    if (!fileHandle || isReadOnly) return;
    const interval = setInterval(async () => {
      try {
        setIsAutoSaving(true);
        const file = await fileHandle.getFile();
        const content = await file.text();
        if (content !== lastFileHash) {
          const remoteData = JSON.parse(content);
          const merged = mergeData(dataRef.current, remoteData);
          setData(merged);
          setLastFileHash(JSON.stringify(merged));
          setLastSyncTime(new Date());
        } else {
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
      } catch (err) { console.error(err); } finally { setIsAutoSaving(false); }
    }, 10000);
    return () => clearInterval(interval);
  }, [fileHandle, lastFileHash, isReadOnly]);

  const updateData = (newData: Partial<AppState>) => {
    if (isReadOnly) return;
    setData(prev => ({ ...prev, ...newData }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
      {needsBackupAuth && !isReadOnly && (
        <div className="bg-[#E74C3C] text-white py-2 px-8 flex items-center justify-between text-[11px] font-black uppercase tracking-widest z-[100] shadow-lg">
          <div className="flex items-center space-x-3">
             <AlertTriangle size={14} />
             <span>Security Alert: Daily Backup Engine requires authorization</span>
          </div>
          <button onClick={reAuthBackup} className="bg-white text-[#E74C3C] px-4 py-1 rounded-full flex items-center space-x-2 hover:bg-zinc-100 transition shadow-sm font-black">
            <Play size={10} fill="currentColor" />
            <span>AUTHORIZE SNAPSHOTS</span>
          </button>
        </div>
      )}

      {/* Brand Header - epiroc yellow background as requested */}
      <header className={`h-28 flex items-center px-8 relative overflow-hidden transition-colors duration-500 bg-[#FDB913] text-[#3d4d5b]`}>
        <div className="flex flex-col z-10 space-y-2">
          {/* Epiroc Precise Brand Logo Reconstruction */}
          <div className="flex items-center space-x-4">
            <svg viewBox="0 0 350 100" className="h-16 w-auto" fill="currentColor">
              {/* Hexagon Shape */}
              <path d="M78 25L52.5 10.5L27 25v29L52.5 68.5L78 54V25z" />
              {/* Inner stylized 'e' mark (matching brand geometry) */}
              <path fill="#FDB913" d="M52.5 16.5L34 27.2v21l18.5 10.7l18.5-10.7v-21L52.5 16.5zm8.7 28.2l-8.7 5l-8.7-5V30.6l8.7 5v8.6l8.7-5v-5.5l-8.7-5l-8.7 5l17.4 10v20.6l-17.4 10l-17.4-10v-20.6l17.4-10l8.7 5v5.5l-8.7-5v-8.6l-8.7 5v14.1l8.7 5l8.7-5v-5.5h0z" />
              {/* Epiroc Wordmark */}
              <text x="95" y="60" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="48" letterSpacing="-1">Epiroc</text>
            </svg>
          </div>

          {/* Status Bar (functional text only) */}
          <div className="flex items-center space-x-4 ml-2 text-[9px] uppercase tracking-[0.2em] font-black opacity-70">
            <span className="flex items-center">
              {fileHandle ? <Wifi size={10} className="mr-1.5" /> : <WifiOff size={10} className="mr-1.5" />}
              {fileHandle ? 'NETWORK LEDGER ACTIVE' : 'LOCAL CACHE MODE'}
            </span>
            <span>•</span>
            <span className="flex items-center">
              <ShieldCheck size={10} className={`mr-1.5 ${backupDirHandle ? 'text-green-700' : ''}`} />
              BACKUP: {backupDirHandle ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>
        </div>
        
        <div className="flex-1"></div>

        <div className="flex items-center space-x-4 z-10">
           {!isReadOnly && (
              <button onClick={exportData} title="Manual Data Export" className="p-3 bg-[#3d4d5b]/10 rounded-full hover:bg-[#3d4d5b]/20 transition group">
                <Download size={20} className="group-hover:scale-110 transition" />
              </button>
           )}
           
           {fileHandle ? (
             <div className="flex items-center bg-[#3d4d5b]/5 px-6 py-3 rounded-full border border-[#3d4d5b]/10 space-x-6">
                <div className="flex flex-col items-end border-r border-[#3d4d5b]/10 pr-6">
                  <span className="text-[8px] font-black uppercase opacity-60">Sync Status</span>
                  <div className="flex items-center space-x-2">
                    {isAutoSaving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
                    <span className="text-[10px] font-black tracking-tighter">{isAutoSaving ? 'SYNCING' : 'SYNCHRONIZED'}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[8px] font-black uppercase opacity-60">Last Updated</span>
                   <span className="text-[10px] font-black">{lastSyncTime ? lastSyncTime.toLocaleTimeString() : '--:--'}</span>
                </div>
             </div>
           ) : !isReadOnly && (
             <button onClick={linkSharedFile} className="bg-[#3d4d5b] text-[#FDB913] hover:brightness-110 px-8 py-4 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-xl flex items-center space-x-3 transition-all">
               <FileCode size={18} />
               <span>CONNECT TEAM LEDGER</span>
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
                activeTab === tab.id ? 'border-[#FDB913] text-black font-black bg-gray-50' : 'border-transparent text-gray-400 hover:text-black hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              <span className="text-[11px] uppercase tracking-[0.15em] font-black">{tab.name}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1 p-6 max-w-[1600px] mx-auto w-full">
        {activeTab === 'dashboard' && <Dashboard state={data} />}
        {activeTab === 'calendar' && <CalendarView tasks={data.tasks} safetyStatus={data.safetyStatus} updateSafetyStatus={(newStatus) => updateData({ safetyStatus: newStatus })} />}
        {activeTab === 'tasks' && <TaskBoard readOnly={isReadOnly} tasks={data.tasks} users={data.users.map(u => u.name)} categories={data.categories} projects={data.projects} okrs={data.okrs} bookings={data.bookings} updateTasks={(tasks) => updateData({ tasks })} />}
        {activeTab === 'projects' && <ProjectBoard projects={data.projects} users={data.users.map(u => u.name)} updateProjects={(projects) => updateData({ projects })} />}
        {activeTab === 'bookings' && <HoursBooking readOnly={isReadOnly} bookings={data.bookings} tasks={data.tasks} projects={data.projects} users={data.users.map(u => u.name)} updateBookings={(bookings) => updateData({ bookings })} />}
        {activeTab === 'okrs' && <OKRBoard okrs={data.okrs} tasks={data.tasks} updateOkrs={(okrs) => updateData({ okrs })} />}
        {activeTab === 'ideas' && <IdeaMatrix ideas={data.ideas} users={data.users.map(u => u.name)} updateIdeas={(ideas) => updateData({ ideas })} />}
        {activeTab === 'kudos' && <KudosBoard kudos={data.kudos} users={data.users.map(u => u.name)} updateKudos={(kudos) => updateData({ kudos })} />}
        {activeTab === 'masters' && (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
               <div className="flex items-center space-x-5">
                  <div className={`p-4 rounded-xl ${backupDirHandle ? 'bg-green-50 text-green-600' : 'bg-zinc-50 text-zinc-400'}`}>
                    <Database size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight">Epiroc Daily Backup Engine</h3>
                    <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">
                      {backupDirHandle ? `Current Snapshot Target: ${backupDirHandle.name}` : 'Select a destination folder for daily database snapshots (Network Drive recommended)'}
                    </p>
                  </div>
               </div>
               <button onClick={linkBackupDir} className="bg-black text-[#FDB913] px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl transition hover:brightness-110">
                 {backupDirHandle ? 'Change Target Folder' : 'Enable Daily Snapshot'}
               </button>
            </div>
            <Masters users={data.users} categories={data.categories} updateUsers={(users) => updateData({ users })} updateCategories={(categories) => updateData({ categories })} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
