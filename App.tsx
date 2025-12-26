
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
const APP_VERSION = '5.2.0';

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

      const fileName = `epiroc_pulse_backup_${today}.json`;
      const newFileHandle = await backupDirHandle.getFileHandle(fileName, { create: true });
      // @ts-ignore
      const writable = await newFileHandle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
      
      setData(prev => ({ ...prev, lastBackupDate: today }));
      setNeedsBackupAuth(false);
      console.log(`✓ Auto-backup success: ${fileName}`);
    } catch (err) {
      console.error("Backup failed", err);
      setNeedsBackupAuth(true);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (backupDirHandle) performAutoBackup();
    }, 2000);
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
      alert("Auto-backup location confirmed. Daily snapshots enabled.");
    } catch (e) { console.error(e); }
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
    a.download = `epiroc_pulse_export_${new Date().toISOString().split('T')[0]}.json`;
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
             <span>Daily Backup requires manual re-authorization to access folder</span>
          </div>
          <button onClick={reAuthBackup} className="bg-white text-[#E74C3C] px-4 py-1 rounded-full flex items-center space-x-2 hover:bg-zinc-100 transition shadow-sm">
            <Play size={10} fill="currentColor" />
            <span>Authorize Now</span>
          </button>
        </div>
      )}

      <header className={`h-24 flex items-center px-8 relative overflow-hidden transition-colors duration-500 ${isReadOnly ? 'bg-zinc-800 text-white' : fileHandle ? 'bg-black text-white' : 'bg-[#FDB913] text-black'}`}>
        <div className="flex items-center z-10 space-x-6">
          <div className="bg-white p-2 rounded shadow-sm flex items-center justify-center w-14 h-14 border border-zinc-100">
            <svg viewBox="0 0 100 100" className="w-10 h-10">
              <rect width="100" height="100" fill="#FDB913" rx="8" />
              <path d="M25 25 H75 V35 H25 V45 H65 V55 H25 V65 H75 V75 H25 Z" fill="black" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">Operations Development Pulse</h1>
            <div className="flex items-center space-x-3 text-[10px] uppercase tracking-widest font-black opacity-80">
              <span className="flex items-center">
                {fileHandle ? <Wifi size={10} className="text-green-400 mr-1" /> : <WifiOff size={10} className="mr-1" />}
                {fileHandle ? 'SHARED SYNC' : 'OFFLINE MODE'}
              </span>
              <span>•</span>
              <span className="flex items-center">
                <ShieldCheck size={10} className={`mr-1 ${backupDirHandle ? 'text-green-400' : 'text-gray-400'}`} />
                BACKUP: {backupDirHandle ? 'LINKED' : 'UNLINKED'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex-1"></div>

        <div className="flex items-center space-x-4 z-10">
           {!isReadOnly && (
              <button onClick={exportData} title="Export Database" className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition">
                <Download size={20} />
              </button>
           )}
           
           {fileHandle ? (
             <div className="flex items-center bg-white/10 px-6 py-3 rounded-full border border-white/5 space-x-6 shadow-inner">
                <div className="flex flex-col items-end border-r border-white/10 pr-6">
                  <span className="text-[8px] opacity-50 font-black uppercase">Database Status</span>
                  <div className="flex items-center space-x-2">
                    {isAutoSaving ? <RefreshCw size={12} className="text-[#FDB913] animate-spin" /> : <Save size={12} className="text-green-400" />}
                    <span className="text-[10px] font-black">{isAutoSaving ? 'SYNCING' : 'ACTIVE'}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[8px] opacity-50 font-black uppercase">Last Update</span>
                   <span className="text-[10px] font-black text-[#FDB913]">{lastSyncTime ? lastSyncTime.toLocaleTimeString() : '--:--'}</span>
                </div>
             </div>
           ) : !isReadOnly && (
             <button onClick={linkSharedFile} className="bg-black text-[#FDB913] hover:brightness-110 px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl flex items-center space-x-3 transition-all border border-[#FDB913]/30">
               <FileCode size={18} />
               <span>Connect Network Drive</span>
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
                    <h3 className="text-xl font-black uppercase tracking-tight">Auto-Backup Engine</h3>
                    <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">
                      {backupDirHandle ? `Syncing Daily to: ${backupDirHandle.name}` : 'Select a local or network folder for daily database snapshots'}
                    </p>
                  </div>
               </div>
               <button onClick={linkBackupDir} className="bg-black text-[#FDB913] px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl transition hover:brightness-110">
                 {backupDirHandle ? 'Modify Backup Target' : 'Enable Daily Snapshots'}
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
