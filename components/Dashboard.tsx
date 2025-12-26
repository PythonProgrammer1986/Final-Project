
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
  isSameMonth, startOfWeek, endOfWeek, eachDayOfInterval, eachWeekOfInterval, addWeeks, subWeeks
} from 'date-fns';

const Dashboard: React.FC<{ state: AppState }> = ({ state }) => {
  const [timelineZoom, setTimelineZoom] = useState<'week' | 'month' | 'year'>('month');
  const [utilizationFilter, setUtilizationFilter] = useState<'week' | 'month' | 'year'>('month');

  // Safety logic
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
      { name: 'Safe Ops', value: statusCounts.green || 1 },
      { name: 'Risk Noted', value: statusCounts.yellow },
      { name: 'Incidents', value: statusCounts.red }
    ];
  }, [state.safetyStatus]);

  // Team Resource Utilization with filtering
  const workloadData = useMemo(() => {
    const now = new Date();
    let intervals: Date[] = [];
    
    if (utilizationFilter === 'week') {
      intervals = eachWeekOfInterval({ start: subWeeks(now, 3), end: addWeeks(now, 4) });
    } else if (utilizationFilter === 'month') {
      intervals = eachMonthOfInterval({ start: startOfYear(now), end: addMonths(startOfYear(now), 11) });
    } else {
      intervals = [startOfYear(now)]; // Just show current year vs next
    }

    return intervals.map(start => {
      const label = utilizationFilter === 'week' ? `W${format(start, 'w')}` : format(start, 'MMM yy');
      let assigned = 0;
      let capacity = state.users.reduce((acc, u) => acc + (u.capacity || 160), 0);

      // Projects contributing to this interval
      state.projects.forEach(p => {
        if (p.status !== 'Completed' && p.status !== 'Cancelled') {
          const pStart = parseISO(p.startDate);
          const pEnd = parseISO(p.endDate);
          if (pStart <= start && pEnd >= start) assigned += (p.hours || 0) / 4; // Estimate 4 weeks per project spread
        }
      });

      // Tasks contributing to this interval
      state.tasks.forEach(t => {
        if (t.status !== 'Completed') {
          const tDate = parseISO(t.dueDate);
          if (utilizationFilter === 'month' && isSameMonth(tDate, start)) assigned += (t.hours || 0);
          else if (utilizationFilter === 'week' && tDate >= start && tDate < addWeeks(start, 1)) assigned += (t.hours || 0);
        }
      });

      return { name: label, assigned, capacity };
    });
  }, [state.tasks, state.projects, state.users, utilizationFilter]);

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
      return { id: item.id, name: 'task' in item ? item.task : item.name, startPct, widthPct, progress: item.progress || 0, type: 'task' in item ? 'Task' : 'Project' };
    }).filter(i => i.widthPct > 0 || i.startPct < 100);
  }, [state.tasks, state.projects, timelineRange]);

  // Ruler ticks for waterfall visibility
  const rulerTicks = useMemo(() => {
    if (timelineZoom === 'month') {
      return eachDayOfInterval({ start: timelineRange.start, end: timelineRange.end })
        .filter((_, i) => i % 5 === 0)
        .map(d => ({ label: format(d, 'd MMM'), pos: (differenceInDays(d, timelineRange.start) / timelineRange.total) * 100 }));
    } else if (timelineZoom === 'year') {
      return eachMonthOfInterval({ start: timelineRange.start, end: timelineRange.end })
        .map(m => ({ label: format(m, 'MMM'), pos: (differenceInDays(m, timelineRange.start) / timelineRange.total) * 100 }));
    } else {
      return eachDayOfInterval({ start: timelineRange.start, end: timelineRange.end })
        .map(d => ({ label: format(d, 'EEE'), pos: (differenceInDays(d, timelineRange.start) / timelineRange.total) * 100 }));
    }
  }, [timelineZoom, timelineRange]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Tasks', value: state.tasks.filter(t => t.status !== 'Completed').length, icon: <Briefcase size={20} />, color: 'bg-black' },
          { label: 'Strategic OKRs', value: state.okrs.length, icon: <Target size={20} />, color: 'bg-[#FDB913] text-black' },
          { label: 'Utilization', value: `${utilizationFilter.toUpperCase()}`, icon: <Clock size={20} />, color: 'bg-green-600' },
          { label: 'Safety Index', value: format(new Date(), 'MMM'), icon: <CheckCircle2 size={20} />, color: 'bg-zinc-800' },
        ].map((card, i) => (
          <div key={i} className={`${card.color} ${card.color.includes('text-black') ? '' : 'text-white'} p-6 rounded shadow-sm flex justify-between items-center`}>
            <div><p className="text-[10px] font-black uppercase opacity-60 mb-1">{card.label}</p><p className="text-2xl font-black">{card.value}</p></div>
            <div className="opacity-30">{card.icon}</div>
          </div>
        ))}
      </div>

      {/* Waterfall with Ruler */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-8">
           <div className="flex items-center space-x-3"><Layers className="text-[#FDB913]" size={20} /><h3 className="text-lg font-black uppercase tracking-tight">Waterfall Operational View</h3></div>
           <div className="flex bg-gray-100 p-1 rounded-sm">
              {(['week', 'month', 'year'] as const).map(z => (
                <button key={z} onClick={() => setTimelineZoom(z)} className={`px-4 py-1.5 text-[9px] font-black uppercase rounded-sm transition ${timelineZoom === z ? 'bg-black text-[#FDB913]' : 'text-gray-400 hover:text-black'}`}>{z}</button>
              ))}
           </div>
        </div>

        <div className="relative border-l border-gray-100 ml-4 pb-4">
          {/* Ruler */}
          <div className="h-8 w-full border-b border-gray-100 relative mb-6">
             {rulerTicks.map((tick, i) => (
               <div key={i} className="absolute border-l border-gray-300 h-2 top-6" style={{ left: `${tick.pos}%` }}>
                 <span className="absolute -top-6 -left-2 text-[8px] font-black text-gray-400 whitespace-nowrap">{tick.label}</span>
               </div>
             ))}
          </div>

          <div className="space-y-4">
             {waterfallItems.map((item) => (
               <div key={item.id} className="relative group">
                 <div className="flex items-center mb-1 ml-4">
                    <span className={`text-[7px] font-black uppercase px-1 py-0.5 rounded-full mr-2 ${item.type === 'Project' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{item.type}</span>
                    <span className="text-[10px] font-bold text-gray-700 truncate max-w-[400px]">{item.name}</span>
                 </div>
                 <div className="h-5 w-full bg-gray-50 rounded-r-full relative overflow-hidden">
                    {/* Vertical markers helper */}
                    {rulerTicks.map((t, i) => <div key={i} className="absolute h-full border-l border-gray-100 z-0" style={{ left: `${t.pos}%` }}></div>)}
                    <div className="absolute top-0 h-full bg-[#FDB913] rounded-sm shadow-sm transition-all duration-700 opacity-80 group-hover:opacity-100 z-10" style={{ left: `${item.startPct}%`, width: `${item.widthPct}%` }}>
                      <div className="h-full bg-black/20" style={{ width: `${item.progress}%` }}></div>
                    </div>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2"><Users className="text-[#FDB913]" size={20} /><h3 className="text-lg font-black uppercase tracking-tight">Resource Utilization</h3></div>
            <div className="flex bg-gray-50 p-1 rounded">
               {(['week', 'month', 'year'] as const).map(f => (
                 <button key={f} onClick={() => setUtilizationFilter(f)} className={`px-2 py-1 text-[8px] font-black uppercase rounded ${utilizationFilter === f ? 'bg-black text-[#FDB913]' : 'text-gray-400'}`}>{f}</button>
               ))}
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 9, fontWeight: 'bold'}} />
                <YAxis tick={{fontSize: 9}} />
                <Tooltip cursor={{fill: '#f8f9fa'}} contentStyle={{backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '10px'}} />
                <Bar name="Est. Assigned" dataKey="assigned" fill="#000" radius={[2, 2, 0, 0]} />
                <Bar name="Team Capacity" dataKey="capacity" fill="#FDB913" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2"><CheckCircle2 className="text-[#FDB913]" size={20} /><h3 className="text-lg font-black uppercase tracking-tight">Safety Culture Snapshot</h3></div>
            <span className="text-[10px] font-black uppercase text-gray-400">{format(new Date(), 'MMMM yyyy')}</span>
          </div>
          <div className="h-[300px] flex items-center">
            <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={safetyStats} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value"><Cell fill="#2ECC71"/><Cell fill="#F39C12"/><Cell fill="#E74C3C"/></Pie><Tooltip/></PieChart></ResponsiveContainer>
            <div className="w-1/2 space-y-2 pl-4">
               {safetyStats.map((s, i) => (
                 <div key={i} className="flex justify-between border-b border-gray-50 pb-1 text-[10px] font-black uppercase text-gray-500"><span>{s.name}</span><span className="text-gray-900">{s.value}</span></div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
