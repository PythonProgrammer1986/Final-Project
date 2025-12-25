
import React, { useState, useMemo } from 'react';
import { Task, Status, Priority } from '../types';
import { BRAND } from '../constants';
import { Plus, Edit2, Trash2, Search, Filter, Download } from 'lucide-react';

interface TaskBoardProps {
  tasks: Task[];
  users: string[];
  categories: string[];
  projects: any[];
  updateTasks: (tasks: Task[]) => void;
}

const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, users, categories, projects, updateTasks }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOwner, setFilterOwner] = useState('All');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showModal, setShowModal] = useState(false);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchSearch = t.task.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.owner.toLowerCase().includes(searchTerm.toLowerCase());
      const matchOwner = filterOwner === 'All' || t.owner === filterOwner;
      return matchSearch && matchOwner;
    });
  }, [tasks, searchTerm, filterOwner]);

  const handleSaveTask = (e: React.FormEvent<HTMLFormElement>) => {
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
      notes: formData.get('notes') as string,
    };

    if (editingTask) {
      updateTasks(tasks.map(t => t.id === editingTask.id ? { ...t, ...taskData } : t));
    } else {
      const newTask: Task = {
        id: Math.random().toString(36).substr(2, 9),
        ...taskData as any
      };
      updateTasks([...tasks, newTask]);
    }
    setShowModal(false);
    setEditingTask(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this task?')) {
      updateTasks(tasks.filter(t => t.id !== id));
    }
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
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search tasks or owners..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FDB913]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter size={18} className="text-gray-400" />
            <select
              className="border border-gray-200 rounded-md px-3 py-2 text-sm"
              value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value)}
            >
              <option value="All">All Owners</option>
              {users.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
        <button
          onClick={() => { setEditingTask(null); setShowModal(true); }}
          className="bg-black text-[#FDB913] px-6 py-2 rounded-md font-bold flex items-center space-x-2 hover:bg-[#222] transition"
        >
          <Plus size={20} />
          <span>ADD TASK</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Task</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Owner</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Priority</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Progress</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Due Date</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-400 italic">No tasks found. Click "Add Task" to create one.</td>
                </tr>
              ) : filteredTasks.map(t => (
                <tr key={t.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-800 line-clamp-1">{t.task}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-tighter">{t.category} • {t.project}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{t.owner}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(t.status)}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold ${t.priority === 'High' ? 'text-red-500' : t.priority === 'Medium' ? 'text-orange-500' : 'text-blue-500'}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-full bg-gray-100 rounded-full h-1.5 max-w-[100px]">
                      <div className="bg-[#FDB913] h-1.5 rounded-full" style={{ width: `${t.progress}%` }}></div>
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold">{t.progress}%</span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{t.dueDate}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => { setEditingTask(t); setShowModal(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(t.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#FDB913]">
              <h2 className="text-xl font-bold">{editingTask ? 'Edit Task' : 'New Task'}</h2>
              <button onClick={() => setShowModal(false)} className="text-black font-bold text-xl hover:opacity-50">×</button>
            </div>
            <form onSubmit={handleSaveTask} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Task Title *</label>
                  <input name="task" required defaultValue={editingTask?.task} className="w-full border border-gray-200 rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                  <select name="category" defaultValue={editingTask?.category} className="w-full border border-gray-200 rounded px-3 py-2">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Project</label>
                  <select name="project" defaultValue={editingTask?.project} className="w-full border border-gray-200 rounded px-3 py-2">
                    <option value="">None</option>
                    {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Owner *</label>
                  <select name="owner" required defaultValue={editingTask?.owner} className="w-full border border-gray-200 rounded px-3 py-2">
                    {users.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                  <select name="status" defaultValue={editingTask?.status || 'Not Started'} className="w-full border border-gray-200 rounded px-3 py-2">
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Blocked">Blocked</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Priority</label>
                  <select name="priority" defaultValue={editingTask?.priority || 'Medium'} className="w-full border border-gray-200 rounded px-3 py-2">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Progress (%)</label>
                  <input type="number" name="progress" min="0" max="100" defaultValue={editingTask?.progress || 0} className="w-full border border-gray-200 rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start Date</label>
                  <input type="date" name="startDate" defaultValue={editingTask?.startDate} className="w-full border border-gray-200 rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Due Date</label>
                  <input type="date" name="dueDate" defaultValue={editingTask?.dueDate} className="w-full border border-gray-200 rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Est. Hours</label>
                  <input type="number" step="0.5" name="hours" defaultValue={editingTask?.hours || 0} className="w-full border border-gray-200 rounded px-3 py-2" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notes</label>
                  <textarea name="notes" rows={3} defaultValue={editingTask?.notes} className="w-full border border-gray-200 rounded px-3 py-2"></textarea>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 border border-gray-200 rounded font-bold">CANCEL</button>
                <button type="submit" className="px-6 py-2 bg-black text-[#FDB913] rounded font-bold">SAVE TASK</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskBoard;
