
import React, { useState, useMemo } from 'react';
import { Task, Status, Priority, OKR, Booking } from '../types';
import { BRAND } from '../constants';
import { Plus, Edit2, Trash2, Search, Filter, History, MessageSquare, Target, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';

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
      progress: parseInt(formData.get('progress') as string),
      hours: parseFloat(formData.get('hours') as string),
      startDate: formData.get('startDate') as string,
      dueDate: formData.get('dueDate') as string,
      okrLink: formData.get('okrLink') as string,
      notes: formData.get('notes') as string,
    };

    if (editingTask) {
      const history = [...(editingTask.history || [])];
      if (editingTask.status !== taskData.status) {
        history.push({ timestamp: new Date().toISOString(), change: `Status changed to ${taskData.status}` });
      }
      updateTasks(tasks.map(t => t.id === editingTask.id ? { ...t, ...taskData, history } : t));
    } else {
      const newTask: Task = {
        id: Math.random().toString(36).substr(2, 9),
        history: [{ timestamp: new Date().toISOString(), change: 'Task created' }],
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Filter tasks..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded text-sm outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="border border-gray-200 rounded px-3 py-2 text-xs font-black uppercase"
            value={filterOwner}
            onChange={(e) => setFilterOwner(e.target.value)}
          >
            <option value="All">All People</option>
            {users.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        {!readOnly && (
          <button
            onClick={() => { setEditingTask(null); setShowModal(true); setActiveSubTab('details'); }}
            className="bg-black text-[#FDB913] px-6 py-2 rounded font-black text-xs uppercase tracking-widest shadow-lg"
          >
            Add Operation
          </button>
        )}
      </div>

      <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Operation Detail</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Stakeholder</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Burn Rate (Act/Est)</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Target Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredTasks.map(t => {
              const actual = getActualHours(t.id);
              const est = t.hours || 1;
              const burnPct = Math.min(100, (actual / est) * 100);
              
              return (
                <tr key={t.id} className="hover:bg-gray-50/50 transition group cursor-pointer" onClick={() => { setEditingTask(t); setShowModal(true); }}>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-800 text-sm">{t.task}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-[9px] font-black uppercase bg-gray-100 px-2 py-0.5 rounded">{t.category}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${getStatusColor(t.status)}`}>{t.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-gray-700">{t.owner}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                       <div className="w-20 bg-gray-100 h-1 rounded-full overflow-hidden">
                          <div className={`h-full ${actual > est ? 'bg-red-500' : 'bg-[#FDB913]'}`} style={{ width: `${burnPct}%` }}></div>
                       </div>
                       <span className="text-[10px] font-black uppercase">{actual}h / {est}h</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-black text-gray-900">{t.progress}%</span>
                      <div className="w-24 bg-gray-100 h-1 rounded-full mt-1">
                        <div className="bg-black h-1 rounded-full" style={{ width: `${t.progress}%` }}></div>
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
            <div className="p-6 bg-[#FDB913] text-black flex justify-between items-center shrink-0">
              <h2 className="text-xl font-black uppercase tracking-tight">{editingTask ? 'Manage Operation' : 'Initiate Operation'}</h2>
              <button onClick={() => setShowModal(false)} className="font-black text-2xl">×</button>
            </div>
            
            <div className="flex bg-gray-50 border-b shrink-0">
              <button onClick={() => setActiveSubTab('details')} className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest ${activeSubTab === 'details' ? 'border-b-2 border-black bg-white' : 'text-gray-400'}`}>Details</button>
              {editingTask && (
                <button onClick={() => setActiveSubTab('history')} className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest ${activeSubTab === 'history' ? 'border-b-2 border-black bg-white' : 'text-gray-400'}`}>History Log</button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {activeSubTab === 'details' ? (
                <form id="taskForm" onSubmit={handleSaveTask} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black uppercase text-gray-500 mb-1 tracking-widest">Task Description *</label>
                      <input name="task" required defaultValue={editingTask?.task} className="w-full border p-3 rounded font-bold" readOnly={readOnly} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-500 mb-1 tracking-widest">Stakeholder *</label>
                      <select name="owner" required defaultValue={editingTask?.owner} className="w-full border p-2 rounded" disabled={readOnly}>
                        {users.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-500 mb-1 tracking-widest">Estimated Duration (Hrs)</label>
                      <input type="number" step="0.5" name="hours" defaultValue={editingTask?.hours || 0} className="w-full border p-2 rounded" readOnly={readOnly} />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black uppercase text-gray-500 mb-1 tracking-widest">Operation Status</label>
                       <select name="status" defaultValue={editingTask?.status || 'Not Started'} className="w-full border p-2 rounded" disabled={readOnly}>
                          {['Not Started', 'In Progress', 'Completed', 'Blocked', 'On Hold'].map(s => <option key={s} value={s}>{s}</option>)}
                       </select>
                    </div>
                    <div>
                       <label className="block text-[10px] font-black uppercase text-gray-500 mb-1 tracking-widest">Target Progress (%)</label>
                       <input type="range" name="progress" min="0" max="100" defaultValue={editingTask?.progress || 0} className="w-full mt-2" disabled={readOnly} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-500 mb-1 tracking-widest">Deployment Date</label>
                      <input type="date" name="startDate" defaultValue={editingTask?.startDate} className="w-full border p-2 rounded" readOnly={readOnly} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-500 mb-1 tracking-widest">Target Delivery Date</label>
                      <input type="date" name="dueDate" defaultValue={editingTask?.dueDate} className="w-full border p-2 rounded" readOnly={readOnly} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-500 mb-1 tracking-widest">Strategic OKR Link</label>
                      <select name="okrLink" defaultValue={editingTask?.okrLink} className="w-full border p-2 rounded" disabled={readOnly}>
                        <option value="">No Link</option>
                        {okrs.map(o => <option key={o.id} value={o.id}>{o.objective}</option>)}
                      </select>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  {editingTask?.history?.map((entry, idx) => (
                    <div key={idx} className="flex space-x-4">
                      <div className="w-24 shrink-0 text-[9px] font-black text-gray-400 mt-1 uppercase leading-none">
                        {format(parseISO(entry.timestamp), 'MMM d, HH:mm')}
                      </div>
                      <div className="flex-1 pb-4 border-l-2 border-gray-100 pl-6 relative">
                         <div className="absolute w-2 h-2 rounded-full bg-black -left-1.5 top-0.5"></div>
                         <p className="text-xs font-black text-gray-800 uppercase tracking-tight">{entry.change}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!readOnly && (
              <div className="p-6 border-t bg-gray-50 flex justify-end items-center shrink-0 space-x-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 text-[10px] font-black uppercase">Cancel</button>
                  <button type="submit" form="taskForm" className="px-8 py-3 bg-black text-[#FDB913] rounded font-black uppercase tracking-widest shadow-xl">Update Operation</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskBoard;
