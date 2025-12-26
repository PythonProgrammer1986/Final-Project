
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { AppState, Task, Project } from '../types';
import { BRAND } from '../constants';
import { 
  Briefcase, CheckCircle2, Clock, AlertTriangle, 
  Users, Target, Calendar, Download
} from 'lucide-react';
import { format, parseISO, differenceInDays, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

const COLORS = [BRAND.INFO, BRAND.SUCCESS, BRAND.WARNING, BRAND.DANGER, '#9b59b6', '#1abc9c', '#34495e'];

const Dashboard: React.FC<{ state: AppState }> = ({ state }) => {
  const [timelineFilter, setTimelineFilter] = useState<'week' | 'month' | 'all'>('month');

  const stats = useMemo(() => {
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.status === 'Completed').length;
    const inProgress = state.tasks.filter(t => t.status === 'In Progress').length;
    const today = new Date().toISOString().split('T')[0];
    const overdue = state.tasks.filter(t => t.dueDate < today && t.status !== 'Completed').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, overdue, completionRate };
  }, [state.tasks]);

  // Workload Logic: Merges Tasks and Projects
  const workloadData = useMemo(() => {
    const workload: Record<string, { assigned: number; capacity: number }> = {};
    state.users.forEach(u => {
      workload[u.name] = { assigned: 0, capacity: u.capacity };
    });

    state.tasks.forEach(t => {
      if (t.status !== 'Completed' && workload[t.owner]) {
        workload[t.owner].assigned += t.hours;
      }
    });

    state.projects.forEach(p => {
      if (p.status !== 'Completed' && p.status !== 'Cancelled' && workload[p.manager]) {
        workload[p.manager].assigned += p.hours;
      }
    });

    return Object.entries(workload).map(([name, val]) => ({
      name,
      assigned: Math.round(val.assigned),
      capacity: val.capacity,
      percentage: val.capacity > 0 ? Math.round((val.assigned / val.capacity) * 100) : 0
    }));
  }, [state.tasks, state.projects, state.users]);

  // Gantt Chart Data: Filtering out closed items
  const ganttData = useMemo(() => {
    const activeItems: (Task | Project)[] = [
      ...state.tasks.filter(t => t.status !== 'Completed' && t.status !== 'On Hold'),
      ...state.projects.filter(p => p.status !== 'Completed' && p.status !== 'Cancelled')
    ].sort((a, b) => a.startDate.localeCompare(b.startDate));

    return activeItems.slice(0, 15); // Show top 15 active items for clarity
  }, [state.tasks, state.projects]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks', value: stats.total, icon: <Briefcase size={24} />, color: 'bg-zinc-900' },
          { label: 'Completion', value: `${stats.completionRate}%`, icon: <CheckCircle2 size={24} />, color: 'bg-green-600' },
          { label: 'In Progress', value: stats.inProgress, icon: <Clock size={24} />, color: 'bg-[#FDB913] text-black' },
          { label: 'Overdue', value: stats.overdue, icon: <AlertTriangle size={24} />, color: 'bg-red-600' },
        ].map((card, i) => (
          <div key={i} className={`${card.color} ${card.color.includes('text-black') ? '' : 'text-white'} p-6 rounded shadow-sm relative overflow-hidden group`}>
            <div className="flex justify-between items-start z-10 relative">
              <div>
                <p className="text-[10px] uppercase font-black opacity-60 mb-1 tracking-widest">{card.label}</p>
                <p className="text-3xl font-black">{card.value}</p>
              </div>
              <div className="opacity-40 group-hover:opacity-100 transition-opacity">{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gantt Timeline */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2">
              <Calendar className="text-[#FDB913]" size={20} />
              <h3 className="text-lg font-black uppercase tracking-tight">Active Operation Timeline</h3>
            </div>
            <div className="flex bg-gray-100 p-1 rounded">
              {['week', 'month', 'all'].map(f => (
                <button 
                  key={f}
                  onClick={() => setTimelineFilter(f as any)}
                  className={`px-3 py-1 text-[9px] font-black uppercase rounded ${timelineFilter === f ? 'bg-black text-[#FDB913]' : 'text-gray-400'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {ganttData.map((item, idx) => {
              const start = parseISO(item.startDate);
              const end = parseISO('dueDate' in item ? item.dueDate : item.endDate);
              const duration = differenceInDays(end, start) + 1;
              const progress = 'progress' in item ? item.progress : 50;
              
              return (
                <div key={idx} className="group">
                  <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400 mb-1">
                    <span className="truncate max-w-[200px] text-gray-900">{'task' in item ? item.task : item.name}</span>
                    <span>{duration} Days • {format(start, 'MMM d')} - {format(end, 'MMM d')}</span>
                  </div>
                  <div className="w-full bg-gray-100 h-6 rounded relative overflow-hidden">
                    <div 
                      className="h-full bg-black/10 absolute left-0 top-0 border-r border-black/5" 
                      style={{ width: `${progress}%` }}
                    ></div>
                    <div className={`h-full opacity-80`} style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white mix-blend-difference">
                      {progress}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Workload / Capacity */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center space-x-2 mb-6">
            <Users className="text-[#FDB913]" size={20} />
            <h3 className="text-lg font-black uppercase tracking-tight">Team Workload vs Capacity</h3>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10, fontWeight: 'bold'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', color: '#fff', borderRadius: '4px', border: 'none' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Bar dataKey="assigned" name="Assigned Hours" fill="#000" radius={[0, 4, 4, 0]} />
                <Bar dataKey="capacity" name="Weekly Capacity" fill="#FDB913" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OKR Progress Summary */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
           <div className="flex items-center space-x-2 mb-6">
            <Target className="text-[#FDB913]" size={20} />
            <h3 className="text-lg font-black uppercase tracking-tight">Strategic Objective Progress</h3>
          </div>
          <div className="space-y-6">
            {state.okrs.map(okr => {
              const linkedTasks = state.tasks.filter(t => t.okrLink === okr.id);
              const avgProgress = linkedTasks.length > 0 
                ? Math.round(linkedTasks.reduce((acc, t) => acc + t.progress, 0) / linkedTasks.length) 
                : 0;
              
              return (
                <div key={okr.id}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-black uppercase truncate mr-4">{okr.objective}</span>
                    <span className="text-xs font-black text-[#FDB913] bg-black px-2 py-0.5 rounded">{avgProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full">
                    <div className="bg-black h-full rounded-full transition-all" style={{ width: `${avgProgress}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Safety Trend (Simple placeholder for Python's calendar notes) */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center space-x-2 mb-6">
            <CheckCircle2 className="text-[#FDB913]" size={20} />
            <h3 className="text-lg font-black uppercase tracking-tight">Operational Safety Trends</h3>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Safe Ops', value: 75 },
                    { name: 'Risk Noted', value: 15 },
                    { name: 'Incidents', value: 10 }
                  ]}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#2ECC71" />
                  <Cell fill="#F39C12" />
                  <Cell fill="#E74C3C" />
                </Pie>
                <Tooltip />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
