
import React, { useState } from 'react';
import { OKR, Task } from '../types';
import { Target, Plus, Trash2, ChevronDown, ListChecks, Edit2 } from 'lucide-react';

interface OKRBoardProps {
  okrs: OKR[];
  tasks: Task[];
  updateOkrs: (okrs: OKR[]) => void;
}

const OKRBoard: React.FC<OKRBoardProps> = ({ okrs, tasks, updateOkrs }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingOkr, setEditingOkr] = useState<OKR | null>(null);

  const handleSaveOKR = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const krsText = formData.get('keyResults') as string;
    const keyResults = krsText.split('\n').filter(k => k.trim()).map(k => ({
      id: Math.random().toString(36).substr(2, 5),
      kr: k.trim()
    }));

    if (editingOkr) {
        // Keep IDs of existing KRs if text matches to preserve potential links, or just simple replace for now.
        // For simplicity in this version, we replace KRs. Ideally we'd reconcile.
        const updatedOkr = {
            ...editingOkr,
            objective: formData.get('objective') as string,
            keyResults: keyResults
        };
        updateOkrs(okrs.map(o => o.id === editingOkr.id ? updatedOkr : o));
    } else {
        const newOKR: OKR = {
          id: Math.random().toString(36).substr(2, 9),
          objective: formData.get('objective') as string,
          keyResults
        };
        updateOkrs([...okrs, newOKR]);
    }
    setShowModal(false);
    setEditingOkr(null);
  };

  const openEdit = (okr: OKR) => {
      setEditingOkr(okr);
      setShowModal(true);
  }

  const deleteOKR = (id: string) => {
    if (confirm('Delete this strategic objective?')) {
      updateOkrs(okrs.filter(o => o.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="bg-black p-3 rounded-lg text-[#FDB913]">
            <Target size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-black">Objectives & Key Results (OKR)</h2>
            <p className="text-sm text-gray-500 font-medium">Link daily tasks to high-level strategic goals</p>
          </div>
        </div>
        <button
          onClick={() => { setEditingOkr(null); setShowModal(true); }}
          className="bg-[#FDB913] text-black px-6 py-2 rounded font-black text-xs uppercase tracking-widest shadow-lg hover:brightness-110"
        >
          Define New Objective
        </button>
      </div>

      <div className="space-y-4">
        {okrs.map(okr => {
          const linkedTasks = tasks.filter(t => t.okrLink === okr.id);
          const progress = linkedTasks.length > 0 
            ? Math.round(linkedTasks.reduce((acc, t) => acc + t.progress, 0) / linkedTasks.length)
            : 0;

          return (
            <div key={okr.id} className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm">
              <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <span className="text-[10px] font-black uppercase bg-black text-[#FDB913] px-2 rounded tracking-widest">OBJ-{okr.id.slice(0,4)}</span>
                    <h3 className="text-lg font-black uppercase tracking-tight">{okr.objective}</h3>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full max-w-xs">
                       <div className="h-full bg-[#FDB913] rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                    <span className="text-xs font-black">{progress}% Completed</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                    <button onClick={() => openEdit(okr)} className="p-2 text-gray-300 hover:text-blue-500 transition"><Edit2 size={18} /></button>
                    <button onClick={() => deleteOKR(okr.id)} className="p-2 text-gray-300 hover:text-red-500 transition"><Trash2 size={18} /></button>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                   <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center">
                     <ListChecks size={12} className="mr-2" />
                     Key Results
                   </h4>
                   {okr.keyResults.map(kr => (
                     <div key={kr.id} className="p-3 bg-white border border-gray-100 rounded text-sm font-medium text-gray-700 flex items-start space-x-3">
                       <span className="w-2 h-2 rounded-full bg-[#FDB913] mt-1.5 shrink-0"></span>
                       <span>{kr.kr}</span>
                     </div>
                   ))}
                 </div>
                 <div className="space-y-4">
                   <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center">
                     <Target size={12} className="mr-2" />
                     Linked Tasks ({linkedTasks.length})
                   </h4>
                   {linkedTasks.map(t => (
                     <div key={t.id} className="p-3 bg-white border border-gray-100 rounded text-xs flex justify-between items-center">
                        <span className="font-bold truncate max-w-[200px]">{t.task}</span>
                        <span className="text-[10px] font-black uppercase text-gray-400">{t.progress}%</span>
                     </div>
                   ))}
                 </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="p-6 bg-black text-[#FDB913] flex justify-between items-center">
              <h2 className="text-xl font-black uppercase tracking-tight">{editingOkr ? 'Edit Strategy' : 'Define Strategy'}</h2>
              <button onClick={() => setShowModal(false)} className="font-black text-2xl">×</button>
            </div>
            <form onSubmit={handleSaveOKR} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">High-Level Objective *</label>
                <input name="objective" required defaultValue={editingOkr?.objective} className="w-full border p-3 rounded outline-none font-bold" placeholder="e.g. Increase Drill Rig Efficiency by 20%" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Key Results (One per line) *</label>
                <textarea 
                    name="keyResults" 
                    required 
                    defaultValue={editingOkr?.keyResults.map(k => k.kr).join('\n')}
                    className="w-full border p-3 rounded outline-none text-sm" 
                    rows={5} 
                    placeholder="e.g. Reduce setup time to 15 mins&#10;Zero hydraulic leaks recorded&#10;Team certification at 100%"
                ></textarea>
              </div>
              <div className="pt-4 flex justify-end">
                <button type="submit" className="bg-[#FDB913] text-black px-8 py-3 rounded font-black uppercase tracking-widest shadow-xl">Activate Strategic Goal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OKRBoard;
