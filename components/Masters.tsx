
import React, { useState } from 'react';
import { Users, Tag, Plus, Trash2, Globe, Key, AlertCircle, RefreshCw, Copy, Check } from 'lucide-react';

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
  const [copied, setCopied] = useState(false);

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

  const copyToClipboard = () => {
    if (!syncId) return;
    navigator.clipboard.writeText(syncId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateNewKey = () => {
    const confirmGen = confirm("This will create a new blank team session. You can invite others to this key. Proceed?");
    if (confirmGen) {
      // Just clear and let the updateSyncId logic handle creation
      updateSyncId(Math.random().toString(36).substring(2, 12));
    }
  };

  return (
    <div className="space-y-8">
      {/* GLOBAL SYNC HUB - MULTI USER FEATURE */}
      <div className="bg-slate-900 text-white p-8 rounded-xl shadow-2xl border-t-4 border-[#FDB913]">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4 mb-6">
            <div className="bg-[#FDB913] p-3 rounded-lg text-black">
              <Globe size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Team Collaboration Setup</h2>
              <p className="text-gray-400 text-sm">Synchronize all data across your team's devices.</p>
            </div>
          </div>
          {syncId && (
            <div className="bg-green-500/20 text-green-400 px-4 py-1 rounded-full text-[10px] font-extrabold border border-green-500/30 flex items-center">
              <RefreshCw size={10} className="mr-2 animate-spin" /> LIVE TEAM SESSION
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
          <div className="space-y-4">
            <div className="bg-white/5 p-5 rounded-lg border border-white/10">
              <label className="block text-[10px] font-bold text-[#FDB913] uppercase mb-2 tracking-widest">Shared Team Key</label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input 
                    type="text" 
                    placeholder="Paste team key here..."
                    className="w-full bg-black border border-white/20 rounded pl-10 pr-4 py-3 text-sm font-mono focus:border-[#FDB913] outline-none transition-all"
                    value={tempSyncId}
                    onChange={(e) => setTempSyncId(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => updateSyncId(tempSyncId)}
                  className="bg-[#FDB913] text-black px-6 py-2 rounded font-black text-sm hover:brightness-110 transition active:scale-95 shadow-lg"
                >
                  JOIN SESSION
                </button>
              </div>
              
              {syncId && (
                <div className="mt-4 flex items-center justify-between bg-black/40 p-3 rounded border border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-500 uppercase font-bold">Active Key</span>
                    <span className="text-xs font-mono text-[#FDB913]">{syncId}</span>
                  </div>
                  <button 
                    onClick={copyToClipboard}
                    className="flex items-center space-x-1 text-[10px] bg-white/10 px-2 py-1 rounded hover:bg-white/20 transition"
                  >
                    {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                    <span>{copied ? 'COPIED' : 'COPY KEY'}</span>
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3">
               <button 
                onClick={generateNewKey} 
                className="text-[10px] font-bold text-[#FDB913] border border-[#FDB913]/30 px-4 py-2 rounded hover:bg-[#FDB913]/10 transition uppercase tracking-tighter"
               >
                 Create New Shared Database
               </button>
               {syncId && (
                 <button 
                  onClick={() => { if(confirm("Disconnect from team?")) updateSyncId(""); }} 
                  className="text-[10px] font-bold text-red-400 border border-red-400/30 px-4 py-2 rounded hover:bg-red-400/10 transition uppercase tracking-tighter"
                 >
                   Go Offline
                 </button>
               )}
            </div>
          </div>

          <div className="bg-black/20 p-6 rounded-lg border border-white/5 flex flex-col justify-center">
             <div className="flex items-start space-x-4 mb-6">
                <AlertCircle className="text-[#FDB913] shrink-0" size={24} />
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white uppercase tracking-tighter">How Sync Works</h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Changes you make are saved locally immediately and pushed to the cloud every few seconds. 
                    Other users will see your updates within 15 seconds. Ensure all team members use the <strong>exact same key</strong>.
                  </p>
                </div>
             </div>
             <div className="p-4 bg-white/5 rounded border-l-4 border-[#FDB913]">
                <p className="text-[10px] text-gray-300 italic">
                  "One user creates the key, others enter it. It's that simple."
                </p>
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
              <h2 className="text-xl font-bold">People & Teams</h2>
              <p className="text-sm text-gray-500">System users and stakeholders</p>
            </div>
          </div>

          <div className="flex space-x-2 mb-6">
            <input
              type="text"
              className="flex-1 border border-gray-200 rounded px-4 py-2"
              placeholder="Add user name..."
              value={newUser}
              onChange={(e) => setNewUser(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addUser()}
            />
            <button onClick={addUser} className="bg-black text-[#FDB913] px-4 py-2 rounded font-bold transition hover:bg-zinc-800"><Plus size={18} /></button>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 text-sm">
            {users.map(u => (
              <div key={u} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-transparent hover:border-gray-200 group transition">
                <span className="font-bold text-gray-700">{u}</span>
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
              <h2 className="text-xl font-bold">Operational Categories</h2>
              <p className="text-sm text-gray-500">Task and project classification</p>
            </div>
          </div>

          <div className="flex space-x-2 mb-6">
            <input
              type="text"
              className="flex-1 border border-gray-200 rounded px-4 py-2"
              placeholder="Add category..."
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCat()}
            />
            <button onClick={addCat} className="bg-black text-[#FDB913] px-4 py-2 rounded font-bold transition hover:bg-zinc-800"><Plus size={18} /></button>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 text-sm">
            {categories.map(c => (
              <div key={c} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-transparent hover:border-gray-200 group transition">
                <span className="font-bold text-gray-700">{c}</span>
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
