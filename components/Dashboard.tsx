
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
  format, parseISO, differenceInDays, startOfMonth, 
  endOfMonth, startOfYear, endOfYear, addMonths, eachMonthOfInterval,
  isSameMonth, startOfWeek, endOfWeek, eachDayOfInterval, eachWeekOfInterval, 
  addWeeks, subWeeks, isWithinInterval
} from 'date-fns';

const Dashboard: React.FC<{ state: AppState }> = ({ state }) => {
  const [timelineZoom, setTimelineZoom] = useState<'week' | 'month' | 'year'>('month');
  const [utilizationFilter, setUtilizationFilter] = useState<'week' | 'month' | 'year'>('month');
  const [stakeholderFilter, setStakeholderFilter] = useState('All');

  // Safety Analytics
  const safetyStats = useMemo(() => {
    const today = new Date();
    const currentMonthData = Object.entries(state.safetyStatus || {})
      .filter(([date]) => isSameMonth(parseISO(date), today));
    
    const statusCounts = { green: 0, yellow: 0, red: 0 };
    currentMonthData.forEach(([_, val]) => {
      const entry = val as SafetyStatusEntry;
      if (entry && entry.status) statusCounts[entry.status]++;
    });

    return [
      { name: 'Safe Ops', value: statusCounts.green || 0 },
      { name: 'Risks Noted', value: statusCounts.yellow || 0 },
      { name: 'Incidents', value: statusCounts.red || 0 }
    ].filter(s => s.value > 0 || s.name === 'Safe Ops');
  }, [state.safetyStatus]);

  // Resource Load Aggregation
  const workloadData = useMemo(() => {
    const now = new Date();
    let intervals: Date[] = [];
    
    if (utilizationFilter === 'week') {
      intervals = eachWeekOfInterval({ start: subWeeks(now, 2), end: addWeeks(now, 5) });
    } else if (utilizationFilter === 'month') {
      intervals = eachMonthOfInterval({ start: startOfYear(now), end: addMonths(startOfYear(now), 11) });
    } else {
      intervals = [startOfYear(now), startOfYear(addMonths(now, 12))];
    }

    return intervals.map(start => {
      const label = utilizationFilter === 'week' ? `W${format(start, 'w')}` : format(start, 'MMM yy');
      let assigned = 0;
      
      const filteredUsers = stakeholderFilter === 'All' 
        ? state.users 
        : state.users.filter(u => u.name === stakeholderFilter);
        
      let totalCapacity = filteredUsers.reduce((acc, u) => acc + (u.capacity || 160), 0);

      // Projects calc
      state.projects.forEach(p => {
        if (p.status !== 'Completed' && p.status !== 'Cancelled') {
          if (stakeholderFilter !== 'All' && p.manager !== stakeholderFilter) return;
          
          const pStart = parseISO(p.startDate);
          const pEnd = parseISO(p.endDate);
          const intervalEnd = utilizationFilter === 'week' ? addWeeks(start, 1) : addMonths(start, 1);
          
          if (isWithinInterval(start, { start: pStart, end: pEnd }) || isWithinInterval(pStart, { start, end: intervalEnd })) {
             const durationDays = differenceInDays(pEnd, pStart) || 1;
             const hoursPerDay = (p.hours || 0) / durationDays;
             assigned += hoursPerDay * (utilizationFilter === 'week' ? 7 : 30);
          }
        }
      });

      // Tasks calc
      state.tasks.forEach(t => {
        if (t.status !== 'Completed') {
          if (stakeholderFilter !== 'All' && t.owner !== stakeholderFilter) return;
          
          const tDate = parseISO(t.dueDate);
          if (utilizationFilter === 'month' && isSameMonth(tDate, start)) assigned += (t.hours || 0);
          else if (utilizationFilter === 'week' && tDate >= start && tDate < addWeeks(start, 1)) assigned += (t.hours || 0);
          else if (utilizationFilter === 'year' && tDate.getFullYear() === start.getFullYear()) assigned += (t.hours || 0);
        }
      });

      return { 
        name: label, 
        assigned: Math.round(assigned), 
        capacity: utilizationFilter === 'week' ? Math.round(totalCapacity / 4) : totalCapacity 
      };
    });
  }, [state.tasks, state.projects, state.users, utilizationFilter, stakeholderFilter]);

  // Waterfall Range
  const timelineRange = useMemo(() => {
    const now = new Date();
    if (timelineZoom === 'week') return { start: startOfWeek(now), end: endOfWeek(now), total: 7 };
    if (timelineZoom === 'month') return { start: startOfMonth(now), end: endOfMonth(now), total: differenceInDays(endOfMonth(now), startOfMonth(now)) + 1 };
    return { start: startOfYear(now), end: endOfYear(now), total: 365 };
  }, [timelineZoom]);

  // Waterfall Items
  const waterfallItems = useMemo(() => {
    return [
      ...state.tasks.filter(t => t.status !== 'Completed').map(t => ({...t, type: 'Task', name: t.task, end: t.dueDate})),
      ...state.projects.filter(p => p.status !== 'Completed').map(p => ({...p, type: 'Project', name: p.name, end: p.endDate}))
    ].map(item => {
      const start = parseISO(item.startDate);
      const end = parseISO(item.end);
      const offset = differenceInDays(start, timelineRange.start);
      const duration = differenceInDays(end, start) + 1;
      
      const startPct = (offset / timelineRange.total) * 100;
      const widthPct = (duration / timelineRange.total) * 100;
      
      return { 
        ...item, 
        startPct: Math.max(0, Math.min(100, startPct)), 
        widthPct: Math.max(1, Math.min(100 - startPct, widthPct)) 
      };
    }).filter(i => i.startPct < 100 && (i.startPct + i.widthPct) > 0);
  }, [state.tasks, state.projects, timelineRange]);

  // Ruler Ticks
  const rulerTicks = useMemo(() => {
    if (timelineZoom === 'year') {
      return eachMonthOfInterval({ start: timelineRange.start, end: timelineRange.end }).map(m => ({
        label: format(m, 'MMM'),
        pos: (differenceInDays(m, timelineRange.start) / timelineRange.total) * 100
      }));
    }
    const days = eachDayOfInterval({ start: timelineRange.start, end: timelineRange.end });
    return days.filter((_, i) => timelineZoom === 'week' || i % 5 === 0).map(d => ({
      label: format(d, timelineZoom === 'week' ? 'EEE d' : 'd MMM'),
      pos: (differenceInDays(d, timelineRange.start) / timelineRange.total) * 100
    }));
  }, [timelineZoom, timelineRange]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Tasks', value: state.tasks.filter(t => t.status !== 'Completed').length, icon: <Briefcase size={20} />, color: 'bg-black' },
          { label: 'Strategic Goals', value: state.okrs.length, icon: <Target size={20} />, color: 'bg-[#FDB913] text-black' },
          { label: 'Resource Load', value: utilizationFilter.toUpperCase(), icon: <Clock size={20} />, color: 'bg-green-600' },
          { label: 'Safety Index', value: 'NOMINAL', icon: <CheckCircle2 size={20} />, color: 'bg-zinc-800' },
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

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-8">
           <div className="flex items-center space-x-3">
              <Layers className="text-[#FDB913]" size={22} />
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight">Operation Waterfall</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Roadmap Visibility</p>
              </div>
           </div>
           <div className="flex bg-zinc-100 p-1 rounded-md">
              {(['week', 'month', 'year'] as const).map(z => (
                <button key={z} onClick={() => setTimelineZoom(z)} className={`px-5 py-2 text-[9px] font-black uppercase rounded transition ${timelineZoom === z ? 'bg-black text-[#FDB913] shadow-sm' : 'text-gray-400 hover:text-black'}`}>{z}</button>
              ))}
           </div>
        </div>

        <div className="relative border-l border-zinc-100 ml-4 pb-8 overflow-x-auto">
          {/* Timeline Ruler */}
          <div className="h-10 w-full border-b border-zinc-200 relative mb-8 min-w-[800px]">
             {rulerTicks.map((tick, i) => (
               <div key={i} className="absolute border-l border-zinc-300 h-3 top-7" style={{ left: `${tick.pos}%` }}>
                 <span className="absolute -top-7 -left-4 text-[9px] font-black text-gray-400 uppercase whitespace-nowrap">{tick.label}</span>
               </div>
             ))}
          </div>

          <div className="space-y-6 min-w-[800px]">
             {waterfallItems.map((item) => (
               <div key={item.id} className="relative group">
                 <div className="flex items-center mb-1.5 ml-4">
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full mr-2 ${item.type === 'Project' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {item.type}
                    </span>
                    <span className="text-[11px] font-black text-gray-700 tracking-tight transition group-hover:text-black">{item.name}</span>
                 </div>
                 <div className="h-6 w-full bg-zinc-50 rounded-r-full relative overflow-hidden">
                    {rulerTicks.map((t, i) => <div key={i} className="absolute h-full border-l border-zinc-100 z-0" style={{ left: `${t.pos}%` }}></div>)}
                    <div className="absolute top-0 h-full bg-[#FDB913] rounded shadow-sm transition-all duration-700 z-10 hover:brightness-110" style={{ left: `${item.startPct}%`, width: `${item.widthPct}%` }}>
                      <div className="h-full bg-black/20" style={{ width: `${item.progress}%` }}></div>
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white mix-blend-difference">{item.progress}%</span>
                    </div>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-2">
              <Users className="text-[#FDB913]" size={20} />
              <h3 className="text-lg font-black uppercase tracking-tight">Team Utilization</h3>
            </div>
            <div className="flex space-x-2">
               <select 
                 className="bg-zinc-50 border border-zinc-100 rounded px-2 py-1 text-[9px] font-black uppercase outline-none"
                 value={stakeholderFilter}
                 onChange={(e) => setStakeholderFilter(e.target.value)}
               >
                 <option value="All">All Stakeholders</option>
                 {state.users.map(u => <option key={u.name} value={u.name}>{u.name}</option>)}
               </select>
               <div className="flex bg-zinc-100 p-1 rounded-md">
                  {(['week', 'month', 'year'] as const).map(f => (
                    <button key={f} onClick={() => setUtilizationFilter(f)} className={`px-3 py-1.5 text-[9px] font-black uppercase rounded ${utilizationFilter === f ? 'bg-black text-[#FDB913]' : 'text-gray-400 hover:text-black transition'}`}>{f}</button>
                  ))}
               </div>
            </div>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{fontSize: 10, fontWeight: 'bold', fill: '#999'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 10, fill: '#999'}} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8f9fa'}} contentStyle={{backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '10px'}} />
                <Legend wrapperStyle={{fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', paddingTop: '20px'}} />
                <Bar name="Est. Load" dataKey="assigned" fill="#000" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar name="Capacity" dataKey="capacity" fill="#FDB913" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="text-[#FDB913]" size={20} />
              <h3 className="text-lg font-black uppercase tracking-tight">Safety Culture Snapshot</h3>
            </div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{format(new Date(), 'MMMM yyyy')}</span>
          </div>
          <div className="h-[320px] flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={safetyStats} innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value" stroke="none">
                  {safetyStats.map((entry, index) => (
                    <Cell key={index} fill={entry.name === 'Safe Ops' ? '#2ECC71' : entry.name === 'Risks Noted' ? '#F39C12' : '#E74C3C'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-1/2 space-y-4 pl-8 border-l border-zinc-100">
               {safetyStats.map((s, i) => (
                 <div key={i} className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{s.name}</span>
                    <span className="text-2xl font-black text-zinc-900">{s.value} Logs</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
