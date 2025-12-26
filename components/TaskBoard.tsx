
import React, { useState, useMemo } from 'react';
import { Task, Status, Priority, OKR, Booking } from '../types';
import { Plus, Trash2, Search, Target, Clock, AlertTriangle, ListChecks, History } from 'lucide-react';
import { format } from 'date-fns';

interface TaskBoardProps {
  tasks: Task[];
  users: string[];
  categories: string[];
  projects: any[];
  okrs: OKR[];
  bookings: Booking[];
  readOnly?: boolean;
  updateTasks: (tasks: Task[]) => void;
}

const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, users, categories, projects, okrs, bookings, readOnly, updateTasks }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOwner, setFilterOwner] = useState('All');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'details' | 'history'>('details');
  const [tempProgress, setTempProgress] = useState(0);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchSearch = t.task.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.owner.toLowerCase().includes(searchTerm.toLowerCase());
      const matchOwner = filterOwner === 'All' || t.owner === filterOwner;
      return matchSearch && matchOwner;
    });
  }, [tasks, searchTerm, filterOwner]);

  const handleSaveTask = (e: React.FormEvent<HTMLFormElement>) => {
    if (readOnly) return;
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const taskData: Partial<Task> = {
      task: formData.get('task') as string,
      owner: formData.get('owner') as string,
      category: formData.get('category') as string,
      project: formData.get('project') as string,
      status: formData.get('status') as Status,
      priority: formData.get('priority') as Priority,
      progress: tempProgress,
      hours: parseFloat(formData.get('hours') as string) || 0,
      startDate: formData.get('startDate') as string,
      dueDate: formData.get('dueDate') as string,
      okrLink: formData.get('okrLink') as string,
      notes: formData.get('notes') as string,
    };

    if (editingTask) {
      const history = [...(editingTask.history || [])];
      if (editingTask.status !== taskData.status) {
        history.push({ timestamp: new Date().toISOString(), change: `Status transitioned to ${taskData.status}` });
      }
      updateTasks(tasks.map(t => t.id === editingTask.id ? { ...t, ...taskData, history } : t));
    } else {
      const newTask: Task = {
        id: Math.random().toString(36).substr(2, 9),
        history: [{ timestamp: new Date().toISOString(), change: 'Operation initialized' }],
        comments: [],
        ...taskData as any
      };
      updateTasks([...tasks, newTask]);
    }
    setShowModal(false);
    setEditingTask(null);
  };

  const getActualHours = (taskId: string) => {
    return bookings.filter(b => b.targetId === taskId).reduce((acc, b) => acc + b.hours, 0);
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Blocked': return 'bg-red-100 text-red-800';
      case 'On Hold': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const openEdit = (task: Task | null) => {
    setEditingTask(task);
    setTempProgress(task ? task.progress : 0);
    setActiveSubTab('details');
    setShowModal(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-5 rounded shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input type="text" placeholder="Search operations..." className="w-full pl-10 pr-4 py-3 border border-zinc-100 bg-zinc-50 rounded font-bold text-sm outline-none focus:bg-white focus:ring-1 focus:ring-black transition" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <select className="border border-zinc-100 bg-zinc-50 rounded px-4 py-3 text-xs font-black uppercase tracking-widest outline-none" value={filterOwner} onChange={(e) => setFilterOwner(e.target.value)}>
            <option value="All">All Stakeholders</option>
            {users.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        {!readOnly && (
          <button onClick={() => openEdit(null)} className="bg-black text-[#FDB913] px-8 py-3 rounded font-black text-xs uppercase tracking-widest shadow-xl transition hover:brightness-110">Initiate New Operation</button>
        )}
      </div>

      <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Operation Detail</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Stakeholder</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Duration (Est)</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Burn Efficiency</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredTasks.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-300 font-black uppercase text-xs tracking-widest">No matching operations found</td></tr>
            ) : filteredTasks.map(t => {
              const actual = getActualHours(t.id);
              const est = t.hours || 0;
              const burnPct = est > 0 ? Math.min(100, (actual / est) * 100) : 0;
              
              return (
                <tr key={t.id} className="hover:bg-zinc-50 transition group cursor-pointer" onClick={() => openEdit(t)}>
                  <td className="px-6 py-5">
                    <p className="font-black text-zinc-900 text-sm leading-tight mb-1">{t.task}</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-[8px] font-black uppercase bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded tracking-tighter">{t.category}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${getStatusColor(t.status)}`}>{t.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-xs font-black text-zinc-700 uppercase">{t.owner}</td>
                  <td className="px-6 py-5 text-xs font-black text-zinc-900">{est} Hrs</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center space-x-3">
                       <div className="w-24 bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                          <div className={`h-full ${actual > est && est > 0 ? 'bg-red-500' : 'bg-[#FDB913]'}`} style={{ width: `${burnPct}%` }}></div>
                       </div>
                       <span className="text-[10px] font-black uppercase text-gray-400">{actual}h Actual</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-black text-zinc-900">{t.progress}%</span>
                      <div className="w-24 bg-zinc-100 h-1.5 rounded-full mt-1.5">
                        <div className="bg-black h-1.5 rounded-full transition-all duration-1000" style={{ width: `${t.progress}%` }}></div>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-8 bg-[#FDB913] text-black flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">{editingTask ? 'Edit Operation' : 'Initiate Operation'}</h2>
                <p className="text-[10px] font-black uppercase opacity-60">Epiroc Management Console</p>
              </div>
              <button onClick={() => setShowModal(false)} className="font-black text-3xl hover:rotate-90 transition-all duration-300">×</button>
            </div>
            
            <div className="flex bg-zinc-50 border-b shrink-0 px-8">
              <button onClick={() => setActiveSubTab('details')} className={`px-8 py-4 text-[11px] font-black uppercase tracking-widest flex items-center space-x-2 ${activeSubTab === 'details' ? 'border-b-4 border-black text-black bg-white' : 'text-gray-400 hover:text-black'}`}>
                <ListChecks size={14} />
                <span>Operational Parameters</span>
              </button>
              {editingTask && (
                <button onClick={() => setActiveSubTab('history')} className={`px-8 py-4 text-[11px] font-black uppercase tracking-widest flex items-center space-x-2 ${activeSubTab === 'history' ? 'border-b-4 border-black text-black bg-white' : 'text-gray-400 hover:text-black'}`}>
                  <History size={14} />
                  <span>Audit Trail</span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-white">
              {activeSubTab === 'details' ? (
                <form id="taskForm" onSubmit={handleSaveTask} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Operational Description *</label>
                      <input name="task" required defaultValue={editingTask?.task} className="w-full border-b-2 border-zinc-100 p-3 bg-zinc-50 text-lg font-black outline-none focus:border-[#FDB913] focus:bg-white transition" readOnly={readOnly} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Stakeholder Owner *</label>
                      <select name="owner" required defaultValue={editingTask?.owner} className="w-full border p-3 rounded font-bold outline-none" disabled={readOnly}>
                        {users.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Estimated Duration (Total Hrs)</label>
                      <input type="number" step="0.5" name="hours" defaultValue={editingTask?.hours || 0} className="w-full border p-3 rounded font-black text-zinc-900 outline-none" readOnly={readOnly} placeholder="e.g. 40" />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Operational Status</label>
                       <select name="status" defaultValue={editingTask?.status || 'Not Started'} className="w-full border p-3 rounded font-black outline-none" disabled={readOnly}>
                          {['Not Started', 'In Progress', 'Completed', 'Blocked', 'On Hold'].map(s => <option key={s} value={s}>{s}</option>)}
                       </select>
                    </div>
                    <div>
                       <div className="flex justify-between items-center mb-2">
                          <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest">Target Progress (%)</label>
                          <span className="text-[11px] font-black text-white bg-black px-3 py-1 rounded-full">{tempProgress}%</span>
                       </div>
                       <input type="range" name="progress" min="0" max="100" value={tempProgress} onChange={(e) => setTempProgress(parseInt(e.target.value))} className="w-full h-2 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-[#FDB913] mt-2" disabled={readOnly} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Start Date</label>
                      <input type="date" name="startDate" defaultValue={editingTask?.startDate} className="w-full border p-3 rounded font-bold outline-none" readOnly={readOnly} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Delivery Date</label>
                      <input type="date" name="dueDate" defaultValue={editingTask?.dueDate} className="w-full border p-3 rounded font-bold outline-none" readOnly={readOnly} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Taxonomy Category</label>
                      <select name="category" defaultValue={editingTask?.category} className="w-full border p-3 rounded font-bold outline-none" disabled={readOnly}>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  {editingTask?.history?.map((entry, idx) => (
                    <div key={idx} className="flex space-x-6">
                      <div className="w-28 shrink-0 text-[10px] font-black text-gray-400 mt-1 uppercase tracking-tighter">
                        {/* Fix: Replaced parseISO with native Date constructor */}
                        {format(new Date(entry.timestamp), 'MMM d, HH:mm')}
                      </div>
                      <div className="flex-1 pb-6 border-l-2 border-zinc-100 pl-8 relative">
                         <div className="absolute w-3 h-3 rounded-full bg-black -left-[7px] top-0 border-4 border-white"></div>
                         <p className="text-xs font-black text-zinc-800 uppercase tracking-tight">{entry.change}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!readOnly && (
              <div className="p-8 border-t bg-zinc-50 flex justify-end items-center shrink-0 space-x-4">
                  <button type="button" onClick={() => setShowModal(false)} className="px-8 py-3 text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition">Cancel</button>
                  <button type="submit" form="taskForm" className="px-12 py-4 bg-black text-[#FDB913] rounded-full font-black uppercase text-xs tracking-widest shadow-2xl transition hover:brightness-110">Commit Operation</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskBoard;
