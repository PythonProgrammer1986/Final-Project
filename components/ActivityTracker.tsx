
import React, { useState } from 'react';
import { Activity } from '../types';
import { Plus, Trash2, Clock } from 'lucide-react';

interface ActivityTrackerProps {
  activities: Activity[];
  users: string[];
  updateActivities: (activities: Activity[]) => void;
}

const ActivityTracker: React.FC<ActivityTrackerProps> = ({ activities, users, updateActivities }) => {
  const [showModal, setShowModal] = useState(false);

  const handleSaveActivity = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newActivity: Activity = {
      id: Math.random().toString(36).substr(2, 9),
      date: formData.get('date') as string,
      person: formData.get('person') as string,
      activity: formData.get('activity') as string,
      hours: parseFloat(formData.get('hours') as string),
      status: formData.get('status') as any,
      remarks: formData.get('remarks') as string,
    };

    updateActivities([newActivity, ...activities]);
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this entry?')) {
      updateActivities(activities.filter(a => a.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="bg-[#FDB913] p-3 rounded-lg text-black">
            <Clock size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Daily Activity Tracker</h2>
            <p className="text-sm text-gray-500">Log time and effort spent on daily operations</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-black text-[#FDB913] px-6 py-2 rounded-md font-bold flex items-center space-x-2 hover:bg-[#222] transition"
        >
          <Plus size={20} />
          <span>LOG ACTIVITY</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">Date</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">Person</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">Activity</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">Hours</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {activities.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-400 italic">No activity logs recorded yet.</td>
              </tr>
            ) : activities.map(a => (
              <tr key={a.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-sm font-bold">{a.date}</td>
                <td className="px-6 py-4 text-sm font-medium">{a.person}</td>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-gray-800 line-clamp-1">{a.activity}</p>
                  <p className="text-[10px] text-gray-400">{a.remarks}</p>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-[#FDB913]">{a.hours}h</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(a.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#FDB913]">
              <h2 className="text-xl font-bold">New Activity Log</h2>
              <button onClick={() => setShowModal(false)} className="text-black font-bold text-xl">×</button>
            </div>
            <form onSubmit={handleSaveActivity} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date *</label>
                  <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full border border-gray-200 rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Person *</label>
                  <select name="person" required className="w-full border border-gray-200 rounded px-3 py-2">
                    {users.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Activity *</label>
                <input name="activity" required className="w-full border border-gray-200 rounded px-3 py-2" placeholder="What was done?" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hours Spent *</label>
                  <input type="number" step="0.5" name="hours" required className="w-full border border-gray-200 rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                  <select name="status" className="w-full border border-gray-200 rounded px-3 py-2">
                    <option value="Completed">Completed</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Blocked">Blocked</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Remarks</label>
                <textarea name="remarks" rows={2} className="w-full border border-gray-200 rounded px-3 py-2" placeholder="Additional details..."></textarea>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 border border-gray-200 rounded font-bold">CANCEL</button>
                <button type="submit" className="px-6 py-2 bg-black text-[#FDB913] rounded font-bold uppercase">Save Log</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityTracker;
