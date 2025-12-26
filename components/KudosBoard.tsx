
import React, { useState } from 'react';
import { Kudos } from '../types';
import { Award, Plus, Trash2, Heart } from 'lucide-react';

interface KudosBoardProps {
  kudos: Kudos[];
  users: string[];
  updateKudos: (kudos: Kudos[]) => void;
}

const KudosBoard: React.FC<KudosBoardProps> = ({ kudos, users, updateKudos }) => {
  const [showModal, setShowModal] = useState(false);

  const handleSaveKudos = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newKudos: Kudos = {
      id: Math.random().toString(36).substr(2, 9),
      from: formData.get('from') as string,
      to: formData.get('to') as string,
      reason: formData.get('reason') as string,
      date: new Date().toISOString().split('T')[0]
    };
    updateKudos([newKudos, ...kudos]);
    setShowModal(false);
  };

  const deleteKudos = (id: string) => {
    if (confirm('Remove this kudos?')) {
      updateKudos(kudos.filter(k => k.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="bg-red-500 p-3 rounded-lg text-white">
            <Award size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-red-500">Kudos & Recognition</h2>
            <p className="text-sm text-gray-500 font-medium italic">Celebrate your teammate's wins and support</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-black text-[#FDB913] px-6 py-2 rounded font-black text-xs uppercase tracking-widest shadow-lg"
        >
          Give Kudos
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kudos.map(item => (
          <div key={item.id} className="bg-white border-2 border-red-50 p-6 rounded-xl shadow-sm hover:shadow-md transition relative group overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => deleteKudos(item.id)} className="text-red-200 hover:text-red-500"><Trash2 size={16} /></button>
            </div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-black text-sm">
                {item.to.charAt(0)}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">KUDOS TO</p>
                <p className="font-black text-gray-900 leading-none">{item.to}</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm italic mb-6 leading-relaxed">"{item.reason}"</p>
            <div className="flex justify-between items-end pt-4 border-t border-red-50">
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">FROM</p>
                <p className="text-xs font-black text-gray-700">{item.from}</p>
              </div>
              <p className="text-[10px] font-bold text-gray-300">{item.date}</p>
            </div>
            <div className="absolute -bottom-4 -right-4 text-red-500/5 rotate-12">
               <Heart size={80} fill="currentColor" />
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded shadow-2xl w-full max-w-md overflow-hidden">
             <div className="p-6 bg-red-500 text-white flex justify-between items-center">
              <h2 className="text-xl font-black uppercase tracking-tight">Send Appreciation</h2>
              <button onClick={() => setShowModal(false)} className="font-black text-2xl">×</button>
            </div>
            <form onSubmit={handleSaveKudos} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">To Teammate</label>
                  <select name="to" required className="w-full border p-2 rounded">
                    {users.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">From You</label>
                  <select name="from" required className="w-full border p-2 rounded">
                    {users.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Reason for Kudos *</label>
                <textarea name="reason" required className="w-full border p-3 rounded outline-none" rows={4} placeholder="What did they help with? What win did they achieve?"></textarea>
              </div>
              <div className="pt-4 flex justify-end">
                <button type="submit" className="bg-black text-white px-8 py-3 rounded font-black uppercase tracking-widest shadow-xl flex items-center space-x-2">
                  <Heart size={16} fill="white" />
                  <span>Send Kudos</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KudosBoard;
