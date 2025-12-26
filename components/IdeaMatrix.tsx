
import React, { useState } from 'react';
import { Idea, Task } from '../types';
import { Lightbulb, Plus, Trash2, TrendingUp, DollarSign } from 'lucide-react';

interface IdeaMatrixProps {
  ideas: Idea[];
  tasks: Task[];
  users: string[];
  updateIdeas: (ideas: Idea[]) => void;
  updateTasks: (tasks: Task[]) => void;
}

const IdeaMatrix: React.FC<IdeaMatrixProps> = ({ ideas, tasks, users, updateIdeas, updateTasks }) => {
  const [showModal, setShowModal] = useState(false);

  const quadrants = [
    { impact: 'High', cost: 'Low', label: 'Quick Wins 🚀', color: 'bg-green-50' },
    { impact: 'High', cost: 'Medium', label: 'Growth Ops 📈', color: 'bg-blue-50' },
    { impact: 'High', cost: 'High', label: 'Major Projects ⛰️', color: 'bg-purple-50' },
    { impact: 'Medium', cost: 'Low', label: 'Steady Wins ✨', color: 'bg-green-50/50' },
    { impact: 'Medium', cost: 'Medium', label: 'Tactical Needs 🛠️', color: 'bg-gray-50' },
    { impact: 'Medium', cost: 'High', label: 'Review Carefully 🧐', color: 'bg-orange-50' },
    { impact: 'Low', cost: 'Low', label: 'Fill-ins 🧹', color: 'bg-gray-100' },
    { impact: 'Low', cost: 'Medium', label: 'Low Priority 📉', color: 'bg-orange-50/50' },
    { impact: 'Low', cost: 'High', label: 'Reconsider ❌', color: 'bg-red-50' },
  ];

  const handleSaveIdea = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const ideaText = formData.get('idea') as string;
    const proposer = formData.get('proposer') as string;
    
    const newIdea: Idea = {
      id: Math.random().toString(36).substr(2, 9),
      idea: ideaText,
      proposer: proposer,
      impact: formData.get('impact') as any,
      cost: formData.get('cost') as any,
      status: 'New',
      date: new Date().toISOString().split('T')[0]
    };
    
    // Auto-generate a Task from the Idea
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      category: 'Information & Team Suggestions',
      task: `Improvement: ${ideaText}`,
      owner: proposer,
      project: '',
      status: 'Not Started',
      priority: 'Medium',
      progress: 0,
      hours: 0,
      startDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      notes: `Auto-generated from Idea Matrix. Impact: ${newIdea.impact}, Cost: ${newIdea.cost}`,
      ideaLink: newIdea.id,
      history: [{ timestamp: new Date().toISOString(), change: 'Operation initialized from Idea Matrix' }],
      comments: []
    };

    updateIdeas([...ideas, newIdea]);
    updateTasks([...tasks, newTask]);
    setShowModal(false);
  };

  const deleteIdea = (id: string) => {
    if (confirm('Delete this idea?')) {
      updateIdeas(ideas.filter(i => i.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="bg-[#FDB913] p-3 rounded-lg text-black">
            <Lightbulb size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Idea & Improvement Matrix</h2>
            <p className="text-sm text-gray-500 font-medium">Strategic categorization of team innovations</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-black text-[#FDB913] px-6 py-2 rounded font-black text-xs uppercase tracking-widest shadow-lg hover:brightness-110"
        >
          Submit New Idea
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quadrants.map((q, idx) => {
          const matchingIdeas = ideas.filter(i => i.impact === q.impact && i.cost === q.cost);
          return (
            <div key={idx} className={`${q.color} border border-gray-200 rounded-lg p-4 min-h-[200px] flex flex-col`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-900">{q.label}</h3>
                <span className="text-[10px] font-black bg-white/50 px-2 rounded">{matchingIdeas.length}</span>
              </div>
              <div className="flex-1 space-y-2">
                {matchingIdeas.map(idea => (
                  <div key={idea.id} className="bg-white p-3 rounded shadow-sm border border-gray-100 group">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-xs font-bold text-gray-800 leading-tight">{idea.idea}</p>
                      <button onClick={() => deleteIdea(idea.id)} className="opacity-0 group-hover:opacity-100 text-red-500"><Trash2 size={12} /></button>
                    </div>
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-tighter">— {idea.proposer}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 bg-[#FDB913] text-black flex justify-between items-center">
              <h2 className="text-xl font-black uppercase tracking-tight">Propose Improvement</h2>
              <button onClick={() => setShowModal(false)} className="font-black text-2xl">×</button>
            </div>
            <form onSubmit={handleSaveIdea} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Your Idea *</label>
                <textarea name="idea" required className="w-full border p-3 rounded outline-none focus:ring-1 focus:ring-black" rows={3}></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Proposed By</label>
                  <select name="proposer" className="w-full border p-2 rounded">
                    {users.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Strategic Impact</label>
                  <select name="impact" className="w-full border p-2 rounded">
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Cost / Effort</label>
                  <select name="cost" className="w-full border p-2 rounded">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <button type="submit" className="bg-black text-[#FDB913] px-8 py-3 rounded font-black uppercase tracking-widest shadow-xl">Submit to Matrix</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdeaMatrix;
