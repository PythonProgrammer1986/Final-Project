
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { AppState, Task, Project, SafetyStatusEntry } from '../types';
import { BRAND } from '../constants';
import { 
  Briefcase, CheckCircle2, Clock, AlertTriangle, 
  Users, Target, Calendar, ZoomIn, ZoomOut, Layers
} from 'lucide-react';
import { 
  format, parseISO, differenceInDays, isWithinInterval, startOfMonth, 
  endOfMonth, startOfYear, endOfYear, addMonths, eachMonthOfInterval,
  isSameMonth, startOfWeek, endOfWeek, eachDayOfInterval
} from 'date-fns';

const COLORS = [BRAND.INFO, BRAND.SUCCESS, BRAND.WARNING, BRAND.DANGER, '#9b59b6', '#1abc9c', '#34495e'];

const Dashboard: React.FC<{ state: AppState }> = ({ state }) => {
  const [timelineZoom, setTimelineZoom] = useState<'week' | 'month' | 'year'>('month');

  // Month-specific Safety Trends
  const safetyStats = useMemo(() => {
    const today = new Date();
    const currentMonthData = Object.entries(state.safetyStatus || {})
      .filter(([date]) => isSameMonth(parseISO(date), today));
    
    const statusCounts = { green: 0, yellow: 0, red: 0 };
    currentMonthData.forEach(([_, val]) => {
      // Added type cast to fix "Property 'status' does not exist on type 'unknown'"
      const entry = val as SafetyStatusEntry;
      if (entry && entry.status) {
        statusCounts[entry.status]++;
      }
    });

    return [
      { name: 'Safe Ops', value: statusCounts.green || 1 }, // Default 1 for visual
      { name: 'Risk Noted', value: statusCounts.yellow },
      { name: 'Incidents', value: statusCounts.red }
    ];
  }, [state.safetyStatus]);

  // Monthly Workload Aggregation
  const workloadData = useMemo(() => {
    const months = eachMonthOfInterval({
      start: startOfYear(new Date()),
      end: addMonths(startOfYear(new Date()), 5) // Show 6 months
    });

    return months.map(m => {
      const mStr = format(m, 'MMM');
      let assigned = 0;
      let capacity = state.users.reduce((acc, u) => acc + (u.capacity || 160), 0);

      state.tasks.forEach(t => {
        if (t.status !== 'Completed' && isSameMonth(parseISO(t.dueDate), m)) {
          assigned += (t.hours || 0);
        }
      });

      state.projects.forEach(p => {
        if (p.status !== 'Completed' && isSameMonth(parseISO(p.endDate), m)) {
          assigned += (p.hours || 0);
        }
      });

      return { name: mStr, assigned, capacity };
    });
  }, [state.tasks, state.projects, state.users]);

  // Timeline Waterfall Logic
  const timelineRange = useMemo(() => {
    const now = new Date();
    if (timelineZoom === 'week') return { start: startOfWeek(now), end: endOfWeek(now), total: 7 };
    if (timelineZoom === 'month') return { start: startOfMonth(now), end: endOfMonth(now), total: differenceInDays(endOfMonth(now), startOfMonth(now)) + 1 };
    return { start: startOfYear(now), end: endOfYear(now), total: 365 };
  }, [timelineZoom]);

  const waterfallItems = useMemo(() => {
    const items = [
      ...state.tasks.filter(t => t.status !== 'Completed'),
      ...state.projects.filter(p => p.status !== 'Completed')
    ];

    return items.map(item => {
      const start = parseISO(item.startDate);
      const end = parseISO('dueDate' in item ? item.dueDate : item.endDate);
      
      const offset = differenceInDays(start, timelineRange.start);
      const duration = differenceInDays(end, start) + 1;
      
      const startPct = Math.max(0, (offset / timelineRange.total) * 100);
      const widthPct = Math.min(100 - startPct, (duration / timelineRange.total) * 100);

      const actualHours = state.bookings
        .filter(b => b.targetId === item.id)
        .reduce((sum, b) => sum + b.hours, 0);
      
      const estHours = item.hours || 1;
      const progress = Math.min(100, Math.round((actualHours / estHours) * 100));

      return {
        id: item.id,
        name: 'task' in item ? item.task : item.name,
        startPct,
        widthPct,
        progress,
        type: 'task' in item ? 'Task' : 'Project'
      };
    }).filter(i => i.widthPct > 0 || i.startPct < 100);
  }, [state.tasks, state.projects, state.bookings, timelineRange]);

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Tasks', value: state.tasks.filter(t => t.status !== 'Completed').length, icon: <Briefcase size={20} />, color: 'bg-black' },
          { label: 'Strategic OKRs', value: state.okrs.length, icon: <Target size={20} />, color: 'bg-[#FDB913] text-black' },
          { label: 'Monthly Utilization', value: '84%', icon: <Clock size={20} />, color: 'bg-green-600' },
          { label: 'Safety Index', value: 'Nominal', icon: <CheckCircle2 size={20} />, color: 'bg-zinc-800' },
        ].map((card, i) => (
          <div key={i} className={`${card.color} ${card.color.includes('text-black') ? '' : 'text-white'} p-6 rounded shadow-sm flex justify-between items-center`}>
            <div>
              <p className="text-[10px] font-black uppercase opacity-60 mb-1">{card.label}</p>
              <p className="text-2xl font-black">{card.value}</p>
            </div>
            <div className="opacity-30">{card.icon}</div>
          </div>
        ))}
      </div>

      {/* Waterfall Timeline */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-8">
           <div className="flex items-center space-x-3">
              <Layers className="text-[#FDB913]" size={20} />
              <h3 className="text-lg font-black uppercase tracking-tight">Active Operation Waterfall</h3>
           </div>
           <div className="flex bg-gray-100 p-1 rounded-sm">
              {(['week', 'month', 'year'] as const).map(z => (
                <button 
                  key={z} 
                  onClick={() => setTimelineZoom(z)}
                  className={`px-4 py-1.5 text-[9px] font-black uppercase rounded-sm transition ${timelineZoom === z ? 'bg-black text-[#FDB913]' : 'text-gray-400 hover:text-black'}`}
                >
                  {z}
                </button>
              ))}
           </div>
        </div>

        <div className="relative border-l border-gray-200 ml-4 pb-4">
          <div className="flex text-[8px] font-black uppercase text-gray-300 mb-4 ml-4">
             <div className="flex-1">Start: {format(timelineRange.start, 'MMM d, yyyy')}</div>
             <div className="text-right">End: {format(timelineRange.end, 'MMM d, yyyy')}</div>
          </div>

          <div className="space-y-4">
             {waterfallItems.length === 0 ? (
               <div className="text-center py-10 text-gray-400 font-bold uppercase text-xs">No active operations in this view range</div>
             ) : waterfallItems.map((item, idx) => (
               <div key={item.id} className="relative group">
                 <div className="flex items-center mb-1 ml-4">
                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full mr-2 ${item.type === 'Project' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {item.type}
                    </span>
                    <span className="text-[10px] font-bold text-gray-700 truncate max-w-[300px]">{item.name}</span>
                 </div>
                 <div className="h-6 w-full bg-gray-50 rounded-r-full relative overflow-hidden">
                    <div 
                      className="absolute top-0 h-full bg-[#FDB913] rounded-sm shadow-sm transition-all duration-700 opacity-80 group-hover:opacity-100"
                      style={{ left: `${item.startPct}%`, width: `${item.widthPct}%` }}
                    >
                      <div 
                        className="h-full bg-black/20" 
                        style={{ width: `${item.progress}%` }}
                      ></div>
                      <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white mix-blend-difference">
                        {item.progress}%
                      </span>
                    </div>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Workload Graph */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Users className="text-[#FDB913]" size={20} />
              <h3 className="text-lg font-black uppercase tracking-tight">Team Resource Utilization</h3>
            </div>
            <span className="text-[10px] font-black uppercase text-gray-400">Monthly Projection</span>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 10, fontWeight: 'bold'}} />
                <YAxis tick={{fontSize: 10}} />
                <Tooltip cursor={{fill: '#f8f9fa'}} contentStyle={{backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '10px'}} />
                <Legend iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase'}} />
                <Bar name="Assigned Load" dataKey="assigned" fill="#000" radius={[4, 4, 0, 0]} />
                <Bar name="Capacity Limit" dataKey="capacity" fill="#FDB913" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Current Month Safety Pie */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
           <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="text-[#FDB913]" size={20} />
              <h3 className="text-lg font-black uppercase tracking-tight">Safety Culture Snapshot</h3>
            </div>
            <span className="text-[10px] font-black uppercase text-gray-400">{format(new Date(), 'MMMM yyyy')}</span>
          </div>
          <div className="h-[300px] flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={safetyStats}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  <Cell fill="#2ECC71" stroke="none" />
                  <Cell fill="#F39C12" stroke="none" />
                  <Cell fill="#E74C3C" stroke="none" />
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" align="center" iconType="diamond" wrapperStyle={{fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold'}} />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-1/2 space-y-4 pl-4">
               {safetyStats.map((s, i) => (
                 <div key={i} className="flex justify-between items-center border-b border-gray-50 pb-2">
                    <span className="text-[10px] font-black uppercase text-gray-500">{s.name}</span>
                    <span className="text-sm font-black">{s.value}</span>
                 </div>
               ))}
               <p className="text-[9px] text-gray-400 italic leading-relaxed uppercase pt-2">Values aggregated from current month's safety logs.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;