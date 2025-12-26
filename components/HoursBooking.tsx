
import React, { useState, useMemo } from 'react';
import { Booking, Task, Project } from '../types';
import { Clock, Plus, Trash2, Calendar, User, Search } from 'lucide-react';
import { format } from 'date-fns';

interface HoursBookingProps {
  bookings: Booking[];
  tasks: Task[];
  projects: Project[];
  users: string[];
  readOnly?: boolean;
  updateBookings: (bookings: Booking[]) => void;
}

const HoursBooking: React.FC<HoursBookingProps> = ({ bookings, tasks, projects, users, readOnly, updateBookings }) => {
  const [showModal, setShowModal] = useState(false);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    if (readOnly) return;
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const targetInfo = (formData.get('target') as string).split('|');

    const newBooking: Booking = {
      id: Math.random().toString(36).substr(2, 9),
      date: formData.get('date') as string,
      userId: formData.get('user') as string,
      targetId: targetInfo[0],
      targetType: targetInfo[1] as any,
      hours: parseFloat(formData.get('hours') as string),
      description: formData.get('description') as string,
    };

    updateBookings([newBooking, ...bookings]);
    setShowModal(false);
  };

  const getTargetName = (id: string, type: string) => {
    if (type === 'task') return tasks.find(t => t.id === id)?.task || 'Unknown Task';
    return projects.find(p => p.id === id)?.name || 'Unknown Project';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="bg-black p-3 rounded-lg text-[#FDB913]">
            <Clock size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-black">Resource Time Logs</h2>
            <p className="text-sm text-gray-500 font-medium">Book actual working hours against estimated operation targets</p>
          </div>
        </div>
        {!readOnly && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-black text-[#FDB913] px-6 py-2 rounded font-black text-xs uppercase tracking-widest shadow-lg hover:brightness-110"
          >
            Log Active Hours
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Date</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Stakeholder</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Operation Target</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Type</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Hours</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400 uppercase font-black text-[10px]">No historical time logs found.</td></tr>
            ) : bookings.map(b => (
              <tr key={b.id} className="hover:bg-gray-50 transition group">
                <td className="px-6 py-4 text-xs font-black text-gray-900">{b.date}</td>
                <td className="px-6 py-4 text-xs font-bold text-gray-700">{b.userId}</td>
                <td className="px-6 py-4">
                   <p className="text-xs font-black text-gray-800 line-clamp-1">{getTargetName(b.targetId, b.targetType)}</p>
                   <p className="text-[10px] font-medium text-gray-400 italic">{b.description}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${b.targetType === 'task' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                    {b.targetType}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-black text-[#FDB913]">{b.hours}h</td>
                <td className="px-6 py-4 text-right">
                  {!readOnly && <button onClick={() => updateBookings(bookings.filter(x => x.id !== b.id))} className="text-gray-300 hover:text-red-500 transition"><Trash2 size={14} /></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded shadow-2xl w-full max-w-lg overflow-hidden">
             <div className="p-6 bg-black text-[#FDB913] flex justify-between items-center">
              <h2 className="text-xl font-black uppercase tracking-tight">Book Operation Hours</h2>
              <button onClick={() => setShowModal(false)} className="font-black text-2xl">×</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Date</label>
                  <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full border p-2 rounded text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Stakeholder</label>
                  <select name="user" required className="w-full border p-2 rounded text-sm">
                    {users.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Operation Target (Task/Project)</label>
                <select name="target" required className="w-full border p-2 rounded text-sm font-bold">
                  <optgroup label="Active Projects">
                    {projects.map(p => <option key={p.id} value={`${p.id}|project`}>PRJ: {p.name}</option>)}
                  </optgroup>
                  <optgroup label="Active Tasks">
                    {tasks.map(t => <option key={t.id} value={`${t.id}|task`}>TSK: {t.task}</option>)}
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Actual Hours Booked</label>
                <input type="number" step="0.5" name="hours" required placeholder="e.g. 4.5" className="w-full border p-2 rounded text-sm font-black" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Work Description</label>
                <textarea name="description" rows={3} className="w-full border p-2 rounded text-sm" placeholder="Summarize activity performed..."></textarea>
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-[#FDB913] text-black py-3 rounded font-black uppercase tracking-widest shadow-xl">Commit Hours to Ledger</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HoursBooking;
