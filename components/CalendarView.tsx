
import React, { useState } from 'react';
import { 
  format, addMonths, endOfMonth, 
  endOfWeek, eachDayOfInterval, isSameMonth, 
  isSameDay, addDays, isToday
} from 'date-fns';
import { Task, SafetyStatus } from '../types';
import { ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Info, ListTodo, Target, ShieldAlert, Lightbulb, Users, ExternalLink } from 'lucide-react';
import { BRAND } from '../constants';

interface CalendarViewProps {
  tasks: Task[];
  safetyStatus: SafetyStatus;
  updateSafetyStatus: (status: SafetyStatus) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, safetyStatus, updateSafetyStatus }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const onDateClick = (day: Date) => {
    setSelectedDate(day);
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(addMonths(currentMonth, -1));

  const jumpToToday = () => {
    const now = new Date();
    setCurrentMonth(now);
    setSelectedDate(now);
  };

  const updateSelectedDateData = (field: string, value: any) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const newSafety = { ...safetyStatus };
    newSafety[dateStr] = { 
      ...(newSafety[dateStr] || { status: 'green', notes: '' }), 
      [field]: value 
    };
    updateSafetyStatus(newSafety);
  };

  const renderHeader = () => (
    <div className="flex justify-between items-center bg-white p-4 rounded-t-lg border-b border-gray-100">
      <h2 className="text-xl font-bold flex items-center space-x-2">
        <span>{format(currentMonth, 'MMMM yyyy')}</span>
      </h2>
      <div className="flex items-center space-x-2">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full transition"><ChevronLeft size={20} /></button>
        <button onClick={jumpToToday} className="px-4 py-1 text-xs font-bold uppercase border border-gray-200 rounded hover:bg-gray-50">Today</button>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full transition"><ChevronRight size={20} /></button>
      </div>
    </div>
  );

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
        {days.map(d => (
          <div key={d} className="py-2 text-center text-[10px] font-bold uppercase text-gray-400 tracking-widest">{d}</div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = endOfMonth(monthStart);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    const endDate = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const rows = [];
    let days = [];

    calendarDays.forEach((day, i) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const status = safetyStatus[dateStr]?.status || null;
      const dayTasks = tasks.filter(t => t.dueDate === dateStr);
      
      const isSelected = isSameDay(day, selectedDate);
      const isCurrentMonth = isSameMonth(day, monthStart);
      const isTodayDate = isToday(day);

      days.push(
        <div
          key={dateStr}
          className={`min-h-[85px] border-r border-b border-gray-100 p-2 cursor-pointer transition-colors relative
            ${!isCurrentMonth ? 'bg-gray-50 text-gray-300' : 'bg-white'}
            ${isSelected ? 'bg-yellow-50/50 ring-1 ring-inset ring-[#FDB913]' : ''}
            ${isTodayDate && !isSelected ? 'bg-gray-50 ring-2 ring-inset ring-black' : ''}
            hover:bg-gray-50
          `}
          onClick={() => onDateClick(day)}
        >
          {isTodayDate && (
              <div className="absolute top-1 right-1">
                 <span className="flex h-1.5 w-1.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                 </span>
              </div>
          )}
          <div className="flex justify-between items-start">
            <span className={`text-xs font-bold ${isSelected ? 'text-[#FDB913]' : isTodayDate ? 'text-black font-black' : ''}`}>
              {format(day, 'd')}
            </span>
            {status && (
              <div className={`w-1.5 h-1.5 rounded-full ${status === 'green' ? 'bg-green-500' : status === 'yellow' ? 'bg-orange-500' : 'bg-red-500'}`}></div>
            )}
          </div>
          <div className="mt-1.5 space-y-0.5">
            {dayTasks.slice(0, 2).map(t => (
              <div key={t.id} className="text-[8px] px-1 bg-zinc-100 rounded text-zinc-500 truncate font-black uppercase">
                {t.task}
              </div>
            ))}
            {dayTasks.length > 2 && (
              <div className="text-[7px] text-zinc-400 pl-1 font-black">+{dayTasks.length - 2} MORE</div>
            )}
          </div>
        </div>
      );

      if ((i + 1) % 7 === 0) {
        rows.push(<div key={i} className="grid grid-cols-7">{days}</div>);
        days = [];
      }
    });

    return <div className="bg-white border-l border-t border-gray-100">{rows}</div>;
  };

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedTasks = tasks.filter(t => t.dueDate === selectedDateStr);
  const currentSafety = safetyStatus[selectedDateStr] || { status: 'green', notes: '' };

  const LogItem = ({ icon: Icon, label, value, field, placeholder }: any) => (
    <div className="space-y-1.5">
      <div className="flex items-center space-x-2 text-zinc-400">
        <Icon size={12} />
        <label className="text-[10px] font-black uppercase tracking-widest">{label}</label>
      </div>
      <textarea
        className="w-full border border-zinc-100 rounded-lg p-3 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-black bg-zinc-50/50 hover:bg-white transition-all"
        rows={2}
        placeholder={placeholder}
        value={value || ''}
        onChange={(e) => updateSelectedDateData(field, e.target.value)}
      ></textarea>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
        {renderHeader()}
        {renderDays()}
        {renderCells()}
      </div>

      <div className="space-y-6">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] mb-1">Shift Detail</p>
              <h3 className="text-2xl font-black text-black leading-none">{format(selectedDate, 'EEEE, MMM do')}</h3>
            </div>
            
            <div className="flex bg-zinc-100 p-1 rounded-full">
              {[
                { val: 'green', color: 'bg-green-500' },
                { val: 'yellow', color: 'bg-orange-500' },
                { val: 'red', color: 'bg-red-500' }
              ].map(s => (
                <button
                  key={s.val}
                  onClick={() => updateSelectedDateData('status', s.val)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all 
                    ${currentSafety?.status === s.val ? 'bg-white shadow-sm ring-2 ring-black/5' : 'opacity-30 hover:opacity-100'}
                  `}
                >
                  <div className={`w-3 h-3 rounded-full ${s.color}`}></div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <LogItem 
              icon={ShieldAlert} 
              label="Safety Daily Report" 
              field="safetyDaily"
              value={currentSafety.safetyDaily} 
              placeholder="Incident reports, inspections, toolbox talks..." 
            />
            <LogItem 
              icon={Target} 
              label="Results Achieved" 
              field="resultsAchieved"
              value={currentSafety.resultsAchieved} 
              placeholder="Key performance milestones hit today..." 
            />
            <LogItem 
              icon={Lightbulb} 
              label="Team Suggestions" 
              field="teamSuggestions"
              value={currentSafety.teamSuggestions} 
              placeholder="Continuous improvement ideas from the floor..." 
            />
            <LogItem 
              icon={Users} 
              label="Support Required" 
              field="supportRequired"
              value={currentSafety.supportRequired} 
              placeholder="Escalations, cross-team help needed..." 
            />
            <LogItem 
              icon={ExternalLink} 
              label="External Dependencies" 
              field="externalDependencies"
              value={currentSafety.externalDependencies} 
              placeholder="Vendor delays, shipping status..." 
            />

            <div className="pt-4 border-t border-zinc-100">
              <LogItem 
                icon={Info} 
                label="General Shift Notes" 
                field="notes"
                value={currentSafety.notes} 
                placeholder="Misc updates..." 
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-2 mb-6 text-zinc-400">
            <ListTodo size={16} />
            <h3 className="text-sm font-black uppercase tracking-widest">Tasks Due ({selectedTasks.length})</h3>
          </div>
          <div className="space-y-3">
            {selectedTasks.length === 0 ? (
              <div className="py-6 text-center border-2 border-dashed border-zinc-50 rounded-xl">
                 <p className="text-xs font-black text-zinc-300 uppercase tracking-widest">No target milestones</p>
              </div>
            ) : (
              selectedTasks.map(t => (
                <div key={t.id} className="p-4 bg-zinc-50 rounded-xl border-l-4 border-black group hover:bg-zinc-100 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-black text-black leading-tight group-hover:underline">{t.task}</p>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${t.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-white text-zinc-500 border border-zinc-100'}`}>
                      {t.status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[9px] font-black uppercase text-zinc-400 tracking-tighter">{t.owner}</span>
                    <span className="text-zinc-200">•</span>
                    <span className="text-[9px] font-black uppercase text-zinc-400 tracking-tighter">{t.category}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
