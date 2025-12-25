
import React, { useState } from 'react';
import { Users, Tag, Plus, Trash2, Share2, Info, HardDrive, Globe, Key, AlertCircle } from 'lucide-react';

interface MastersProps {
  users: string[];
  categories: string[];
  syncId: string;
  updateSyncId: (id: string) => void;
  updateUsers: (users: string[]) => void;
  updateCategories: (categories: string[]) => void;
}

const Masters: React.FC<MastersProps> = ({ users, categories, syncId, updateSyncId, updateUsers, updateCategories }) => {
  const [newUser, setNewUser] = useState('');
  const [newCat, setNewCat] = useState('');
  const [tempSyncId, setTempSyncId] = useState(syncId);

  const addUser = () => {
    if (newUser.trim() && !users.includes(newUser.trim())) {
      updateUsers([...users, newUser.trim()]);
      setNewUser('');
    }
  };

  const addCat = () => {
    if (newCat.trim() && !categories.includes(newCat.trim())) {
      updateCategories([...categories, newCat.trim()]);
      setNewCat('');
    }
  };

  const generateKey = () => {
    const newId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setTempSyncId(newId);
  };

  return (
    <div className="space-y-8">
      {/* GLOBAL SYNC HUB - MULTI USER FEATURE */}
      <div className="bg-black text-white p-8 rounded-xl shadow-xl border-t-4 border-[#FDB913]">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4 mb-6">
            <div className="bg-[#FDB913] p-3 rounded-lg text-black">
              <Globe size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Multi-User Cloud Sync</h2>
              <p className="text-gray-400 text-sm">Enable real-time data sharing across all team members globally.</p>
            </div>
          </div>
          {syncId && (
            <div className="bg-green-500/20 text-green-400 px-4 py-1 rounded-full text-xs font-bold border border-green-500/30 animate-pulse">
              LIVE SYNC ACTIVE
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
          <div className="space-y-4">
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <label className="block text-[10px] font-bold text-[#FDB913] uppercase mb-2 tracking-widest">Shared Session Key</label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input 
                    type="text" 
                    placeholder="Enter team sync ID..."
                    className="w-full bg-black border border-white/20 rounded pl-10 pr-4 py-2 text-sm focus:border-[#FDB913] outline-none"
                    value={tempSyncId}
                    onChange={(e) => setTempSyncId(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => updateSyncId(tempSyncId)}
                  className="bg-[#FDB913] text-black px-6 py-2 rounded font-bold text-sm hover:brightness-110 transition"
                >
                  JOIN SESSION
                </button>
              </div>
              <p className="mt-3 text-[10px] text-gray-500 leading-relaxed italic">
                * To share data: One user generates a key, others paste it here and click "Join". 
                All users will then see the exact same dashboard.
              </p>
            </div>
            
            <div className="flex space-x-2">
               <button onClick={generateKey} className="text-[10px] font-bold text-[#FDB913] border border-[#FDB913]/30 px-3 py-1 rounded hover:bg-[#FDB913]/10 transition">GENERATE NEW KEY</button>
               {syncId && <button onClick={() => updateSyncId('')} className="text-[10px] font-bold text-red-400 border border-red-400/30 px-3 py-1 rounded hover:bg-red-400/10 transition">DISCONNECT CLOUD</button>}
            </div>
          </div>

          <div className="bg-white/5 p-6 rounded-lg border border-white/10 flex flex-col justify-center">
             <div className="flex items-start space-x-3 mb-4">
                <AlertCircle className="text-[#FDB913] shrink-0" size={18} />
                <p className="text-xs text-gray-300 leading-relaxed">
                  <strong>Important:</strong> This sync uses a public, anonymous relay. For sensitive corporate data, do not use public keys. 
                  The synchronization happens every 30 seconds automatically.
                </p>
             </div>
             <div className="flex items-center space-x-4">
                <div className="flex -space-x-2">
                   {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-gray-800 flex items-center justify-center text-[10px] font-bold">U{i}</div>)}
                   <div className="w-8 h-8 rounded-full border-2 border-black bg-[#FDB913] text-black flex items-center justify-center text-[10px] font-bold">+</div>
                </div>
                <span className="text-xs font-bold text-gray-500 uppercase">Multi-User Ready</span>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Users Management */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-3 bg-gray-100 rounded-lg text-black"><Users size={24} /></div>
            <div>
              <h2 className="text-xl font-bold">User Management</h2>
              <p className="text-sm text-gray-500">Add or remove system users/people</p>
            </div>
          </div>

          <div className="flex space-x-2 mb-6">
            <input
              type="text"
              className="flex-1 border border-gray-200 rounded px-4 py-2"
              placeholder="Enter new user name..."
              value={newUser}
              onChange={(e) => setNewUser(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addUser()}
            />
            <button onClick={addUser} className="bg-black text-[#FDB913] px-4 py-2 rounded font-bold flex items-center"><Plus size={18} /></button>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 text-sm">
            {users.map(u => (
              <div key={u} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg group">
                <span className="font-medium text-gray-700">{u}</span>
                <button onClick={() => updateUsers(users.filter(x => x !== u))} className="text-red-500 p-1 opacity-0 group-hover:opacity-100 transition"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Categories Management */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-3 bg-gray-100 rounded-lg text-black"><Tag size={24} /></div>
            <div>
              <h2 className="text-xl font-bold">Category Master</h2>
              <p className="text-sm text-gray-500">Manage task and project categories</p>
            </div>
          </div>

          <div className="flex space-x-2 mb-6">
            <input
              type="text"
              className="flex-1 border border-gray-200 rounded px-4 py-2"
              placeholder="Enter new category..."
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCat()}
            />
            <button onClick={addCat} className="bg-black text-[#FDB913] px-4 py-2 rounded font-bold flex items-center"><Plus size={18} /></button>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 text-sm">
            {categories.map(c => (
              <div key={c} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg group">
                <span className="font-medium text-gray-700">{c}</span>
                <button onClick={() => updateCategories(categories.filter(x => x !== c))} className="text-red-500 p-1 opacity-0 group-hover:opacity-100 transition"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Masters;
