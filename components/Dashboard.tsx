
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { AppState } from '../types';
import { BRAND } from '../constants';
import { 
  Briefcase, CheckCircle2, Clock, AlertTriangle, 
  BarChart3, Users, CalendarDays, Zap, Target
} from 'lucide-react';

const COLORS = [BRAND.INFO, BRAND.SUCCESS, BRAND.WARNING, BRAND.DANGER, '#9b59b6', '#1abc9c', '#34495e'];

const Dashboard: React.FC<{ state: AppState }> = ({ state }) => {
  const stats = useMemo(() => {
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.status === 'Completed').length;
    const inProgress = state.tasks.filter(t => t.status === 'In Progress').length;
    const today = new Date().toISOString().split('T')[0];
    const overdue = state.tasks.filter(t => t.dueDate < today && t.status !== 'Completed').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, overdue, completionRate };
  }, [state.tasks]);

  const workloadData = useMemo(() => {
    const counts: Record<string, number> = {};
    state.tasks.forEach(t => {
      if (t.status !== 'Completed') {
        counts[t.owner] = (counts[t.owner] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [state.tasks]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    state.tasks.forEach(t => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [state.tasks]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {
      'Not Started': 0, 'In Progress': 0, 'Completed': 0, 'Blocked': 0, 'On Hold': 0
    };
    state.tasks.forEach(t => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [state.tasks]);

  const kpiData = useMemo(() => {
    return state.kpis.map(k => ({
      name: k.name.substring(0, 20),
      completion: k.completion
    }));
  }, [state.kpis]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks', value: stats.total, icon: <Briefcase size={24} />, color: 'bg-blue-600' },
          { label: 'Completion', value: `${stats.completionRate}%`, icon: <CheckCircle2 size={24} />, color: 'bg-green-600' },
          { label: 'In Progress', value: stats.inProgress, icon: <Clock size={24} />, color: 'bg-orange-500' },
          { label: 'Overdue', value: stats.overdue, icon: <AlertTriangle size={24} />, color: 'bg-red-600' },
        ].map((card, i) => (
          <div key={i} className={`${card.color} text-white p-6 rounded-lg shadow-md relative overflow-hidden`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs uppercase font-bold opacity-80 mb-1">{card.label}</p>
                <p className="text-3xl font-extrabold">{card.value}</p>
              </div>
              <div className="bg-white/20 p-2 rounded">{card.icon}</div>
            </div>
            <div className="absolute -bottom-2 -right-2 opacity-10 rotate-12">{card.icon}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workload */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center space-x-2 mb-6">
            <Users className="text-[#FDB913]" size={20} />
            <h3 className="text-lg font-bold">Workload Distribution</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 12}} />
                <Tooltip />
                <Bar dataKey="value" fill={BRAND.INFO} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Categories */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center space-x-2 mb-6">
            <Zap className="text-[#FDB913]" size={20} />
            <h3 className="text-lg font-bold">Category Distribution</h3>
          </div>
          <div className="h-[300px] flex">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{fontSize: '11px'}} />
                </PieChart>
              </ResponsiveContainer>
          </div>
        </div>

        {/* Status Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center space-x-2 mb-6">
            <BarChart3 className="text-[#FDB913]" size={20} />
            <h3 className="text-lg font-bold">Task Progress Status</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill={BRAND.SUCCESS} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KPI Tracking */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center space-x-2 mb-6">
            {/* Added Target icon to imports */}
            <Target className="text-[#FDB913]" size={20} />
            <h3 className="text-lg font-bold">KPI Performance Overview</h3>
          </div>
          {kpiData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={kpiData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{fontSize: 10}} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="completion" stroke={BRAND.WARNING} strokeWidth={3} dot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400 italic">
              No KPI data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
