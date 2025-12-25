
import React, { useState } from 'react';
import { Users, Tag, Plus, Trash2, Share2, Info, HardDrive } from 'lucide-react';

interface MastersProps {
  users: string[];
  categories: string[];
  updateUsers: (users: string[]) => void;
  updateCategories: (categories: string[]) => void;
}

const Masters: React.FC<MastersProps> = ({ users, categories, updateUsers, updateCategories }) => {
  const [newUser, setNewUser] = useState('');
  const [newCat, setNewCat] = useState('');

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

  return (
    <div className="space-y-8">
      {/* Collaboration Hub Info */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-xl shadow-sm">
        <div className="flex items-start space-x-4">
          <div className="bg-blue-500 p-2 rounded-lg text-white">
            <Share2 size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-blue-900">Collaboration Hub</h2>
            <p className="text-sm text-blue-700 mb-4">
              Since this app runs locally in your browser, follow these steps to work with your team on a <strong>shared folder</strong>:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/50 p-3 rounded border border-blue-200">
                <p className="text-xs font-bold text-blue-800 uppercase mb-1">Step 1: Export</p>
                <p className="text-[11px] text-blue-900">Click the <strong>Export</strong> button in the top header to save your changes to a JSON file.</p>
              </div>
              <div className="bg-white/50 p-3 rounded border border-blue-200">
                <p className="text-xs font-bold text-blue-800 uppercase mb-1">Step 2: Save to Share</p>
                <p className="text-[11px] text-blue-900">Save that file into your <strong>Shared Network Folder</strong> so others can access it.</p>
              </div>
              <div className="bg-white/50 p-3 rounded border border-blue-200">
                <p className="text-xs font-bold text-blue-800 uppercase mb-1">Step 3: Import</p>
                <p className="text-[11px] text-blue-900">Teammates can click <strong>Import</strong> and select that file to see the updated project status.</p>
              </div>
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

      {/* Deployment Info */}
      <div className="bg-gray-800 text-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center space-x-3 mb-4">
          <HardDrive className="text-[#FDB913]" size={20} />
          <h3 className="font-bold uppercase tracking-wider text-sm">Deployment & Hosting Guide</h3>
        </div>
        <div className="text-xs text-gray-400 grid grid-cols-1 md:grid-cols-2 gap-6">
          <p>
            To deploy this app <strong>freely for life</strong>, upload this folder to <strong>GitHub Pages</strong> or <strong>Netlify</strong>. 
            The app is "Static", meaning it doesn't need a backend server to run.
          </p>
          <p>
            Current Data Storage: <span className="text-[#FDB913]">Browser Local Storage</span>. 
            Data remains on this device until you export it or clear your browser cache.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Masters;
