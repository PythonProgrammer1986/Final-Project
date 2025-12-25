
import React, { useState } from 'react';
import { Users, Tag, Plus, Trash2, Globe, Key, AlertCircle, RefreshCw, Copy, Check, PlusCircle, LogIn, ShieldCheck, Database } from 'lucide-react';

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
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'pass' | 'fail'>('idle');

  const testNetwork = async () => {
    setTestStatus('testing');
    try {
      const res = await fetch('https://api.npoint.io/test', { mode: 'no-cors' });
      setTestStatus('pass');
    } catch (e) {
      setTestStatus('fail');
    }
  };

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
              <Database size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">Epiroc Team Sync Hub</h2>
              <p className="text-gray-400 text-sm">Choose how your team shares data: Cloud or Shared Folder.</p>
            </div>
          </div>
          <button 
            onClick={testNetwork}
            className={`px-4 py-2 rounded-full text-[10px] font-black border flex items-center shadow-inner transition ${
              testStatus === 'pass' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
              testStatus === 'fail' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
              'bg-white/10 text-gray-400 border-white/10'
            }`}
          >
            {testStatus === 'testing' ? <RefreshCw size={12} className="mr-2 animate-spin" /> : <Globe size={12} className="mr-2" />}
            {testStatus === 'idle' && 'TEST CLOUD CONNECTION'}
            {testStatus === 'testing' && 'TESTING...'}
            {testStatus === 'pass' && 'CONNECTION SUCCESSFUL'}
            {testStatus === 'fail' && 'FIREWALL DETECTED: USE SHARED FOLDER'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
          <div className="space-y-6">
            <div className="bg-white/5 p-6 rounded-xl border border-white/10 shadow-xl">
              <div className="flex items-center space-x-2 mb-4">
                <ShieldCheck size={18} className="text-[#FDB913]" />
                <h3 className="text-sm font-black uppercase tracking-widest">Method A: Cloud Sync (Real-time)</h3>
              </div>
              
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input 
                    type="text" 
                    placeholder="Enter Shared Key..."
                    className="w-full bg-black/50 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-sm font-mono text-[#FDB913] outline-none"
                    value={tempSyncId}
                    onChange={(e) => setTempSyncId(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => updateSyncId(tempSyncId)}
                  className="bg-[#FDB913] text-black px-6 py-3 rounded-lg font-black text-xs hover:brightness-110"
                >
                  JOIN
                </button>
              </div>
              <button 
                onClick={() => updateSyncId("", true)} 
                className="w-full mt-4 border border-white/10 text-gray-400 py-2 rounded-lg font-bold text-[10px] hover:bg-white/5 transition uppercase tracking-widest"
              >
                Create New Cloud ID
              </button>
            </div>

            <div className="bg-[#FDB913]/10 p-6 rounded-xl border border-[#FDB913]/30">
              <div className="flex items-center space-x-2 mb-4">
                <AlertCircle size={18} className="text-[#FDB913]" />
                <h3 className="text-sm font-black uppercase tracking-widest text-[#FDB913]">Method B: Shared Folder (Proven)</h3>
              </div>
              <p className="text-[11px] text-gray-300 mb-6 leading-relaxed">
                If Cloud Sync is blocked by IT, use the <strong>Sync buttons in the Header</strong> to save/load a file from your team's Shared Network Folder (e.g., Z:\drive).
              </p>
              <div className="p-3 bg-black/40 rounded border border-[#FDB913]/20">
                <ol className="text-[10px] text-gray-400 list-decimal pl-4 space-y-1 font-bold">
                  <li>Team Leader clicks "EXPORT" and saves file to Z:\</li>
                  <li>Team Members click "SYNC" and select that file</li>
                  <li>The app merges everyone's changes automatically</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="flex flex-col h-full">
             <div className="bg-black/30 p-8 rounded-xl border border-white/5 flex-1 flex flex-col justify-center">
                {syncId ? (
                  <div className="space-y-6 text-center">
                    <div className="inline-block p-4 bg-white/5 rounded-2xl border border-white/10 mb-4">
                       <span className="block text-[10px] text-gray-500 uppercase font-black mb-2 tracking-widest">Active Team Key</span>
                       <div className="flex items-center justify-center space-x-4">
                         <span className="text-2xl font-black font-mono text-[#FDB913] tracking-tighter">{syncId}</span>
                         <button onClick={copyToClipboard} className="p-2 bg-white/10 rounded-lg">
                           {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} className="text-[#FDB913]" />}
                         </button>
                       </div>
                    </div>
                    <p className="text-xs text-gray-400 px-8 leading-relaxed font-medium">
                      Changes are merged automatically. If network is blocked, please use the Shared Folder method.
                    </p>
                    <button 
                      onClick={() => updateSyncId("")} 
                      className="text-[10px] font-black text-red-500 hover:text-red-400 uppercase tracking-[0.2em]"
                    >
                      [ Disconnect Cloud ]
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center py-8">
                    <AlertCircle className="text-gray-600 mb-4" size={48} />
                    <h3 className="text-gray-400 font-black uppercase tracking-widest mb-2">Sync: STANDALONE</h3>
                    <p className="text-[11px] text-gray-600 max-w-[250px] leading-relaxed">
                      You are in local mode. Use the header buttons to sync via your network shared drive.
                    </p>
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Stakeholders and Taxonomy sections remain largely the same, but with enhanced Epiroc styling */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-3 bg-gray-100 rounded-lg text-black shadow-sm"><Users size={24} /></div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tighter text-gray-900">Stakeholders</h2>
              <p className="text-xs text-gray-400 font-bold uppercase">Team Members List</p>
            </div>
          </div>

          <div className="flex space-x-2 mb-6">
            <input
              type="text"
              className="flex-1 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#FDB913] outline-none font-bold"
              placeholder="Full Name..."
              value={newUser}
              onChange={(e) => setNewUser(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addUser()}
            />
            <button onClick={addUser} className="bg-black text-[#FDB913] px-5 py-3 rounded-lg font-black transition hover:bg-zinc-800 shadow-lg">+</button>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {users.map(u => (
              <div key={u} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-transparent hover:border-[#FDB913]/20 group transition cursor-default">
                <span className="font-bold text-gray-700 text-sm uppercase tracking-tight">{u}</span>
                <button onClick={() => updateUsers(users.filter(x => x !== u))} className="text-red-500 p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-3 bg-gray-100 rounded-lg text-black shadow-sm"><Tag size={24} /></div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tighter text-gray-900">Taxonomy</h2>
              <p className="text-xs text-gray-400 font-bold uppercase">Operational Categories</p>
            </div>
          </div>

          <div className="flex space-x-2 mb-6">
            <input
              type="text"
              className="flex-1 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#FDB913] outline-none font-bold"
              placeholder="Category Name..."
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCat()}
            />
            <button onClick={addCat} className="bg-black text-[#FDB913] px-5 py-3 rounded-lg font-black transition hover:bg-zinc-800 shadow-lg">+</button>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {categories.map(c => (
              <div key={c} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-transparent hover:border-[#FDB913]/20 group transition cursor-default">
                <span className="font-bold text-gray-700 text-sm uppercase tracking-tight">{c}</span>
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
