
import React, { useState } from 'react';
import { Project, ProjectStatus } from '../types';
import { Plus, Edit2, Trash2 } from 'lucide-react';

interface ProjectBoardProps {
  projects: Project[];
  users: string[];
  updateProjects: (projects: Project[]) => void;
}

const ProjectBoard: React.FC<ProjectBoardProps> = ({ projects, users, updateProjects }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const handleSaveProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const projData: Partial<Project> = {
      name: formData.get('name') as string,
      manager: formData.get('manager') as string,
      status: formData.get('status') as ProjectStatus,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      hours: parseFloat(formData.get('hours') as string),
      description: formData.get('description') as string,
    };

    if (editingProject) {
      updateProjects(projects.map(p => p.id === editingProject.id ? { ...p, ...projData } : p));
    } else {
      const newProj: Project = {
        id: Math.random().toString(36).substr(2, 9),
        ...projData as any
      };
      updateProjects([...projects, newProj]);
    }
    setShowModal(false);
    setEditingProject(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this project?')) {
      updateProjects(projects.filter(p => p.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Projects Management</h2>
        <button
          onClick={() => { setEditingProject(null); setShowModal(true); }}
          className="bg-black text-[#FDB913] px-6 py-2 rounded-md font-bold flex items-center space-x-2 hover:bg-[#222] transition shadow-md"
        >
          <Plus size={20} />
          <span>NEW PROJECT</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {projects.map(project => (
          <div key={project.id} className="bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{project.name}</h3>
                <p className="text-xs font-bold text-gray-400 uppercase">Manager: {project.manager}</p>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => { setEditingProject(project); setShowModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(project.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Status</p>
                <span className="text-sm font-bold text-gray-700">{project.status}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Hours</p>
                <span className="text-sm font-bold text-gray-700">{project.hours} hrs</span>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Timeline</p>
                <span className="text-xs font-bold text-gray-700">{project.startDate} to {project.endDate}</span>
              </div>
            </div>

            <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#FDB913]">
              <h2 className="text-xl font-bold">{editingProject ? 'Edit Project' : 'New Project'}</h2>
              <button onClick={() => setShowModal(false)} className="text-black font-bold text-xl">×</button>
            </div>
            <form onSubmit={handleSaveProject} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Project Name *</label>
                <input name="name" required defaultValue={editingProject?.name} className="w-full border border-gray-200 rounded px-3 py-2 focus:ring-1 focus:ring-black outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Manager *</label>
                  <select name="manager" required defaultValue={editingProject?.manager} className="w-full border border-gray-200 rounded px-3 py-2">
                    {users.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                  <select name="status" defaultValue={editingProject?.status || 'Planning'} className="w-full border border-gray-200 rounded px-3 py-2">
                    <option value="Planning">Planning</option>
                    <option value="In Progress">In Progress</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start Date</label>
                  <input type="date" name="startDate" defaultValue={editingProject?.startDate} className="w-full border border-gray-200 rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">End Date</label>
                  <input type="date" name="endDate" defaultValue={editingProject?.endDate} className="w-full border border-gray-200 rounded px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Estimated Hours</label>
                <input type="number" step="0.5" name="hours" defaultValue={editingProject?.hours || 0} className="w-full border border-gray-200 rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                <textarea name="description" rows={3} defaultValue={editingProject?.description} className="w-full border border-gray-200 rounded px-3 py-2"></textarea>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 border border-gray-200 rounded font-bold">CANCEL</button>
                <button type="submit" className="px-6 py-2 bg-black text-[#FDB913] rounded font-bold uppercase">Save Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectBoard;
