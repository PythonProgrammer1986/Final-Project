
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Calendar, CheckSquare, LayoutDashboard, Target, Clock, 
  Settings, Save, HardDrive, FileCode, Wifi, WifiOff,
  Lightbulb, Award, BarChart3, ListChecks, RefreshCw
} from 'lucide-react';
import { AppState, Task, Project, User, Idea, Kudos, OKR } from './types';
import { DEFAULT_USERS, DEFAULT_CATEGORIES, DEFAULT_AGENDA } from './constants';
import Dashboard from './components/Dashboard';
import TaskBoard from './components/TaskBoard';
import ProjectBoard from './components/ProjectBoard';
import CalendarView from './components/CalendarView';
import IdeaMatrix from './components/IdeaMatrix';
import KudosBoard from './components/KudosBoard';
import OKRBoard from './components/OKRBoard';
import Masters from './components/Masters';

const STORAGE_KEY = 'epiroc_management_data_v2';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    return {
      tasks: [],
      projects: [],
      ideas: [],
      kudos: [],
      okrs: [],
      users: DEFAULT_USERS.map(name => ({ name, capacity: 40 })),
      categories: DEFAULT_CATEGORIES,
      safetyStatus: {},
      dailyAgenda: DEFAULT_AGENDA
    };
  });

  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastFileHash, setLastFileHash] = useState<string>('');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const isUpdatingRef = useRef(false);
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const mergeData = (local: AppState, remote: AppState): AppState => {
    const mergeById = (a: any[], b: any[]) => {
      const map = new Map();
      [...a, ...b].forEach(item => {
        const existing = map.get(item.id);
        if (!existing || (item.updatedAt && item.updatedAt > existing.updatedAt)) {
          map.set(item.id, item);
        }
      });
      return Array.from(map.values());
    };

    return {
      ...remote,
      tasks: mergeById(local.tasks, remote.tasks),
      projects: mergeById(local.projects, remote.projects),
      ideas: mergeById(local.ideas, remote.ideas),
      kudos: mergeById(local.kudos, remote.kudos),
      okrs: mergeById(local.okrs, remote.okrs),
      safetyStatus: { ...local.safetyStatus, ...remote.safetyStatus }
    };
  };

  const linkSharedFile = async () => {
    try {
      // @ts-ignore
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: 'Epiroc Database', accept: { 'application/json': ['.json'] } }],
        excludeAcceptAllOption: true,
        multiple: false
      });
      setFileHandle(handle);
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

  useEffect(() => {
    if (!fileHandle) return;
    const interval = setInterval(async () => {
      try {
        setIsAutoSaving(true);
        const file = await fileHandle.getFile();
        const content = await file.text();
        if (content !== lastFileHash) {
          const remoteData = JSON.parse(content);
          isUpdatingRef.current = true;
          const merged = mergeData(dataRef.current, remoteData);
          setData(merged);
          setLastFileHash(JSON.stringify(merged));
          setLastSyncTime(new Date());
          setTimeout(() => { isUpdatingRef.current = false; }, 500);
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
      } catch (err) { console.error(err); } finally { setTimeout(() => setIsAutoSaving(false), 500); }
    }, 5000);
    return () => clearInterval(interval);
  }, [fileHandle, lastFileHash]);

  const updateData = (newData: Partial<AppState>) => {
    setData(prev => ({ ...prev, ...newData }));
  };

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'calendar', name: 'Calendar', icon: <Calendar size={18} /> },
    { id: 'tasks', name: 'Tasks', icon: <CheckSquare size={18} /> },
    { id: 'projects', name: 'Projects', icon: <Target size={18} /> },
    { id: 'okrs', name: 'OKRs', icon: <ListChecks size={18} /> },
    { id: 'ideas', name: 'Ideas', icon: <Lightbulb size={18} /> },
    { id: 'kudos', name: 'Kudos', icon: <Award size={18} /> },
    { id: 'masters', name: 'Masters', icon: <Settings size={18} /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
      <header className={`transition-all duration-500 h-24 flex items-center px-8 relative overflow-hidden ${fileHandle ? 'bg-black text-white' : 'bg-[#FDB913] text-black'}`}>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-white/5 skew-x-[-20deg] translate-x-20 z-0"></div>
        <div className="flex items-center z-10 space-x-6">
          <div className={`w-14 h-14 flex items-center justify-center font-black text-3xl rounded-sm border-2 ${fileHandle ? 'bg-[#FDB913] text-black border-black/10' : 'bg-black text-[#FDB913] border-white/10'}`}>E</div>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">Epiroc Pulse</h1>
            <div className="flex items-center space-x-3 text-[10px] uppercase tracking-widest font-black opacity-80">
              <span className="flex items-center">
                {fileHandle ? <Wifi size={10} className="text-green-400 mr-1" /> : <WifiOff size={10} className="mr-1" />}
                {fileHandle ? 'TEAM SYNC ACTIVE' : 'LOCAL MODE'}
              </span>
              <span>•</span>
              <span className="flex items-center">
                <HardDrive size={10} className="mr-1" />
                {fileHandle ? fileHandle.name : 'Z:\\ NO LINK'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex-1"></div>

        <div className="flex items-center space-x-4 z-10">
           {fileHandle ? (
             <div className="flex items-center bg-white/10 px-6 py-3 rounded border border-white/5 space-x-6">
                <div className="flex flex-col items-end border-r border-white/10 pr-6">
                  <span className="text-[8px] opacity-50 font-black tracking-widest uppercase">Auto-Save</span>
                  <div className="flex items-center space-x-2">
                    {isAutoSaving ? <RefreshCw size={12} className="text-[#FDB913] animate-spin" /> : <Save size={12} className="text-green-400" />}
                    <span className="text-[10px] font-black">{isAutoSaving ? 'WRITING...' : 'IDLE'}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[8px] opacity-50 font-black tracking-widest uppercase">Last Sync</span>
                   <span className="text-[10px] font-black text-[#FDB913]">{lastSyncTime ? lastSyncTime.toLocaleTimeString() : '--:--'}</span>
                </div>
             </div>
           ) : (
             <button onClick={linkSharedFile} className="bg-black text-[#FDB913] hover:brightness-110 px-6 py-3 rounded font-black text-xs uppercase tracking-widest shadow-2xl flex items-center space-x-2 border-2 border-[#FDB913]/20 transition-all">
               <FileCode size={18} />
               <span>Connect Shared Drive (Z:\)</span>
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
        {activeTab === 'tasks' && <TaskBoard tasks={data.tasks} users={data.users.map(u => u.name)} categories={data.categories} projects={data.projects} okrs={data.okrs} updateTasks={(tasks) => updateData({ tasks })} />}
        {activeTab === 'projects' && <ProjectBoard projects={data.projects} users={data.users.map(u => u.name)} updateProjects={(projects) => updateData({ projects })} />}
        {activeTab === 'okrs' && <OKRBoard okrs={data.okrs} tasks={data.tasks} updateOkrs={(okrs) => updateData({ okrs })} />}
        {activeTab === 'ideas' && <IdeaMatrix ideas={data.ideas} users={data.users.map(u => u.name)} updateIdeas={(ideas) => updateData({ ideas })} />}
        {activeTab === 'kudos' && <KudosBoard kudos={data.kudos} users={data.users.map(u => u.name)} updateKudos={(kudos) => updateData({ kudos })} />}
        {activeTab === 'masters' && <Masters users={data.users} categories={data.categories} updateUsers={(users) => updateData({ users })} updateCategories={(categories) => updateData({ categories })} />}
      </main>

      <footer className="bg-white border-t border-gray-200 py-3 px-8 flex justify-between items-center text-[9px] text-gray-400 font-bold uppercase tracking-widest">
        <div className="flex items-center space-x-6">
          <span>© {new Date().getFullYear()} EPIROC ROCKDRILL AB</span>
          <span className={fileHandle ? "text-green-500" : "text-gray-300"}>● SYNC: {fileHandle ? 'SHARED DRIVE' : 'LOCAL CACHE'}</span>
        </div>
        <div className="flex items-center space-x-4">
           <span>BUILD v4.1.2 - ENTERPRISE PULSE</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
