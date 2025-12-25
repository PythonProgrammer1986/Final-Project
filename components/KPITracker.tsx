
import React, { useState } from 'react';
import { KPI } from '../types';
import { Plus, Edit2, Trash2, Target } from 'lucide-react';

interface KPITrackerProps {
  kpis: KPI[];
  updateKpis: (kpis: KPI[]) => void;
}

const KPITracker: React.FC<KPITrackerProps> = ({ kpis, updateKpis }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingKpi, setEditingKpi] = useState<KPI | null>(null);

  const handleSaveKpi = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const kpiData: Partial<KPI> = {
      name: formData.get('name') as string,
      target: formData.get('target') as string,
      completion: parseInt(formData.get('completion') as string),
      remarks: formData.get('remarks') as string,
    };

    if (editingKpi) {
      updateKpis(kpis.map(k => k.id === editingKpi.id ? { ...k, ...kpiData } : k));
    } else {
      const newKpi: KPI = {
        id: Math.random().toString(36).substr(2, 9),
        ...kpiData as any
      };
      updateKpis([...kpis, newKpi]);
    }
    setShowModal(false);
    setEditingKpi(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this KPI?')) {
      updateKpis(kpis.filter(k => k.id !== id));
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">KPI Performance Tracker</h2>
        <button
          onClick={() => { setEditingKpi(null); setShowModal(true); }}
          className="bg-black text-[#FDB913] px-6 py-2 rounded-md font-bold flex items-center space-x-2 hover:bg-[#222] transition"
        >
          <Plus size={20} />
          <span>ADD KPI</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpis.map(kpi => (
          <div key={kpi.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition">
            <div className="flex justify-between items-start mb-6">
              <div className="bg-gray-50 p-3 rounded-lg text-[#FDB913]">
                <Target size={24} />
              </div>
              <div className="flex space-x-1">
                <button onClick={() => { setEditingKpi(kpi); setShowModal(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(kpi.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"><Trash2 size={16} /></button>
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">{kpi.name}</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Target: {kpi.target}</p>
              
              <div className="mb-6">
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-gray-400">Completion</span>
                  <span className="text-gray-900">{kpi.completion}%</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${kpi.completion >= 75 ? 'bg-green-500' : kpi.completion >= 50 ? 'bg-orange-500' : 'bg-red-500'}`}
                    style={{ width: `${kpi.completion}%` }}
                  ></div>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 italic">"{kpi.remarks || 'No remarks recorded'}"</p>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#FDB913]">
              <h2 className="text-xl font-bold">{editingKpi ? 'Edit KPI' : 'New KPI Target'}</h2>
              <button onClick={() => setShowModal(false)} className="text-black font-bold text-xl">×</button>
            </div>
            <form onSubmit={handleSaveKpi} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">KPI Name *</label>
                <input name="name" required defaultValue={editingKpi?.name} className="w-full border border-gray-200 rounded px-3 py-2" placeholder="e.g. Safety Reporting Frequency" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target Description *</label>
                <input name="target" required defaultValue={editingKpi?.target} className="w-full border border-gray-200 rounded px-3 py-2" placeholder="e.g. 10 reports per week" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Current Progress (%)</label>
                <div className="flex items-center space-x-4">
                  <input type="range" name="completion" min="0" max="100" defaultValue={editingKpi?.completion || 0} className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" />
                  <span className="text-sm font-bold w-12 text-center">{editingKpi?.completion || 0}%</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Remarks</label>
                <textarea name="remarks" rows={3} defaultValue={editingKpi?.remarks} className="w-full border border-gray-200 rounded px-3 py-2" placeholder="Obstacles or milestones..."></textarea>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 border border-gray-200 rounded font-bold">CANCEL</button>
                <button type="submit" className="px-6 py-2 bg-black text-[#FDB913] rounded font-bold uppercase">Save KPI</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KPITracker;
