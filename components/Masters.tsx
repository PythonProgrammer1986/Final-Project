
import React, { useState } from 'react';
import { Users, Tag, Plus, Trash2, Globe, Key, AlertCircle, RefreshCw, Copy, Check, PlusCircle, LogIn } from 'lucide-react';

interface MastersProps {
  users: string[];
  categories: string[];
  syncId: string;
  updateSyncId: (id: string, isNew?: boolean) => void;
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

  return (
    <div className="space-y-8">
      {/* GLOBAL SYNC HUB */}
      <div className="bg-slate-900 text-white p-8 rounded-xl shadow-2xl border-t-4 border-[#FDB913] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FDB913]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none"></div>
        
        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center space-x-4 mb-8">
            <div className="bg-[#FDB913] p-3 rounded-lg text-black shadow-lg">
              <Globe size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">Team Sync Hub</h2>
              <p className="text-gray-400 text-sm">Connect your team members to the shared management cloud.</p>
            </div>
          </div>
          {syncId && (
            <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-[10px] font-black border border-green-500/30 flex items-center shadow-inner">
              <RefreshCw size={12} className="mr-2 animate-spin" /> LIVE TEAM SESSION
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
          <div className="space-y-6">
            <div className="bg-white/5 p-6 rounded-xl border border-white/10 hover:border-white/20 transition-all shadow-xl">
              <div className="flex items-center space-x-2 mb-4">
                <LogIn size={18} className="text-[#FDB913]" />
                <h3 className="text-sm font-black uppercase tracking-widest">Option 1: Join a Team</h3>
              </div>
              
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input 
                    type="text" 
                    placeholder="Enter Shared Key..."
                    className="w-full bg-black/50 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-sm font-mono text-[#FDB913] focus:border-[#FDB913] outline-none transition-all placeholder:text-gray-600"
                    value={tempSyncId}
                    onChange={(e) => setTempSyncId(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => updateSyncId(tempSyncId)}
                  className="bg-[#FDB913] text-black px-6 py-3 rounded-lg font-black text-xs hover:brightness-110 transition active:scale-95 shadow-lg flex items-center"
                >
                  CONNECT
                </button>
              </div>
              <p className="mt-3 text-[10px] text-gray-500 italic">Enter the key shared by your team leader to synchronize.</p>
            </div>

            <div className="bg-white/5 p-6 rounded-xl border border-dashed border-white/10 hover:border-white/30 transition-all group">
              <div className="flex items-center space-x-2 mb-4">
                <PlusCircle size={18} className="text-[#FDB913]" />
                <h3 className="text-sm font-black uppercase tracking-widest">Option 2: New Team</h3>
              </div>
              <p className="text-xs text-gray-400 mb-6 leading-relaxed">If you are the team leader, create a fresh database for your department. You will get a unique key to share.</p>
              <button 
                onClick={() => updateSyncId("", true)} 
                className="w-full border-2 border-[#FDB913] text-[#FDB913] py-3 rounded-lg font-black text-xs hover:bg-[#FDB913] hover:text-black transition uppercase tracking-widest shadow-lg"
              >
                CREATE NEW TEAM DATABASE
              </button>
            </div>
          </div>

          <div className="flex flex-col h-full">
             <div className="bg-black/30 p-8 rounded-xl border border-white/5 flex-1 flex flex-col justify-center">
                {syncId ? (
                  <div className="space-y-6 text-center">
                    <div className="inline-block p-4 bg-white/5 rounded-2xl border border-white/10 mb-4">
                       <span className="block text-[10px] text-gray-500 uppercase font-black mb-2 tracking-widest">Your Private Team Key</span>
                       <div className="flex items-center justify-center space-x-4">
                         <span className="text-2xl font-black font-mono text-[#FDB913] tracking-tighter">{syncId}</span>
                         <button 
                           onClick={copyToClipboard}
                           className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
                         >
                           {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} className="text-[#FDB913]" />}
                         </button>
                       </div>
                    </div>
                    <p className="text-xs text-gray-400 px-8 leading-relaxed">
                      All team members using this key will see and edit the same tasks, projects, and KPIs in real-time.
                    </p>
                    <button 
                      onClick={() => { if(confirm("Go Offline? Changes will not be shared until you reconnect.")) updateSyncId(""); }} 
                      className="text-[10px] font-black text-red-500 hover:text-red-400 uppercase tracking-[0.2em] transition"
                    >
                      [ Disconnect and Go Offline ]
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center py-8">
                    <AlertCircle className="text-gray-600 mb-4" size={48} />
                    <h3 className="text-gray-400 font-black uppercase tracking-widest mb-2">Sync Status: OFFLINE</h3>
                    <p className="text-[11px] text-gray-600 max-w-[250px] leading-relaxed">
                      You are currently in standalone mode. Data is only saved to your browser cache.
                    </p>
                  </div>
                )}
             </div>
             
             <div className="mt-4 p-4 bg-[#FDB913]/5 rounded-lg flex items-start space-x-3 border border-[#FDB913]/10">
                <AlertCircle className="text-[#FDB913] shrink-0" size={16} />
                <p className="text-[9px] text-gray-500 leading-tight uppercase font-bold">
                  Corporate Note: If connection fails, please ensure IT has whitelisted 'jsonblob.com' on the network.
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-3 bg-gray-100 rounded-lg text-black shadow-sm"><Users size={24} /></div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tighter">Stakeholders</h2>
              <p className="text-xs text-gray-400 font-bold uppercase">System Users and Team Members</p>
            </div>
          </div>

          <div className="flex space-x-2 mb-6">
            <input
              type="text"
              className="flex-1 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#FDB913] outline-none"
              placeholder="Full Name..."
              value={newUser}
              onChange={(e) => setNewUser(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addUser()}
            />
            <button onClick={addUser} className="bg-black text-[#FDB913] px-5 py-3 rounded-lg font-bold transition hover:bg-zinc-800 shadow-lg"><Plus size={20} /></button>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {users.map(u => (
              <div key={u} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-transparent hover:border-[#FDB913]/20 group transition cursor-default">
                <span className="font-bold text-gray-700 text-sm">{u}</span>
                <button onClick={() => updateUsers(users.filter(x => x !== u))} className="text-red-500 p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-3 bg-gray-100 rounded-lg text-black shadow-sm"><Tag size={24} /></div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tighter">Taxonomy</h2>
              <p className="text-xs text-gray-400 font-bold uppercase">Operational Categories</p>
            </div>
          </div>

          <div className="flex space-x-2 mb-6">
            <input
              type="text"
              className="flex-1 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#FDB913] outline-none"
              placeholder="Category Name..."
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCat()}
            />
            <button onClick={addCat} className="bg-black text-[#FDB913] px-5 py-3 rounded-lg font-bold transition hover:bg-zinc-800 shadow-lg"><Plus size={20} /></button>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {categories.map(c => (
              <div key={c} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-transparent hover:border-[#FDB913]/20 group transition cursor-default">
                <span className="font-bold text-gray-700 text-sm">{c}</span>
                <button onClick={() => updateCategories(categories.filter(x => x !== c))} className="text-red-500 p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Masters;
