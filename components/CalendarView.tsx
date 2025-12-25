
import React, { useState } from 'react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, 
  isSameDay, addDays, parseISO 
} from 'date-fns';
import { Task, SafetyStatus } from '../types';
import { ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Info } from 'lucide-react';
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
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const renderHeader = () => (
    <div className="flex justify-between items-center bg-white p-4 rounded-t-lg border-b border-gray-100">
      <h2 className="text-xl font-bold flex items-center space-x-2">
        <span>{format(currentMonth, 'MMMM yyyy')}</span>
      </h2>
      <div className="flex items-center space-x-2">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full transition"><ChevronLeft size={20} /></button>
        <button onClick={() => setCurrentMonth(new Date())} className="px-4 py-1 text-xs font-bold uppercase border border-gray-200 rounded hover:bg-gray-50">Today</button>
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
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
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

      days.push(
        <div
          key={dateStr}
          className={`min-h-[100px] border-r border-b border-gray-100 p-2 cursor-pointer transition-colors relative
            ${!isCurrentMonth ? 'bg-gray-50 text-gray-300' : 'bg-white'}
            ${isSelected ? 'bg-yellow-50/50 ring-1 ring-inset ring-[#FDB913]' : ''}
            hover:bg-gray-50
          `}
          onClick={() => onDateClick(day)}
        >
          <div className="flex justify-between items-start">
            <span className={`text-sm font-bold ${isSelected ? 'text-[#FDB913]' : ''}`}>
              {format(day, 'd')}
            </span>
            {status && (
              <div className={`w-2 h-2 rounded-full ${status === 'green' ? 'bg-green-500' : status === 'yellow' ? 'bg-orange-500' : 'bg-red-500'}`}></div>
            )}
          </div>
          <div className="mt-2 space-y-1">
            {dayTasks.slice(0, 3).map(t => (
              <div key={t.id} className="text-[9px] px-1 bg-gray-100 rounded text-gray-600 truncate font-medium">
                {t.task}
              </div>
            ))}
            {dayTasks.length > 3 && (
              <div className="text-[8px] text-gray-400 pl-1 font-bold">+{dayTasks.length - 3} more</div>
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

  const setDayStatus = (status: 'green' | 'yellow' | 'red') => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const newSafety = { ...safetyStatus };
    newSafety[dateStr] = { ...newSafety[dateStr], status };
    updateSafetyStatus(newSafety);
  };

  const setDayNotes = (notes: string) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const newSafety = { ...safetyStatus };
    newSafety[dateStr] = { ...newSafety[dateStr], notes };
    updateSafetyStatus(newSafety);
  };

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedTasks = tasks.filter(t => t.dueDate === selectedDateStr);
  const currentSafety = safetyStatus[selectedDateStr];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3 bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {renderHeader()}
        {renderDays()}
        {renderCells()}
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Date Details</h3>
          <p className="text-xl font-bold mb-6">{format(selectedDate, 'EEEE, MMM do')}</p>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Safety & Health Status</label>
              <div className="flex space-x-2">
                {[
                  { val: 'green', color: 'bg-green-500', label: 'Good' },
                  { val: 'yellow', color: 'bg-orange-500', label: 'Mod.' },
                  { val: 'red', color: 'bg-red-500', label: 'Poor' }
                ].map(s => (
                  <button
                    key={s.val}
                    onClick={() => setDayStatus(s.val as any)}
                    className={`flex-1 py-2 px-1 rounded flex flex-col items-center justify-center transition-all border-2 
                      ${currentSafety?.status === s.val ? 'border-black' : 'border-transparent opacity-40 hover:opacity-100'}
                    `}
                  >
                    <div className={`w-3 h-3 rounded-full ${s.color} mb-1`}></div>
                    <span className="text-[10px] font-bold">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Daily Notes</label>
              <textarea
                className="w-full border border-gray-200 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FDB913]"
                rows={4}
                placeholder="Shift notes, safety reports..."
                value={currentSafety?.notes || ''}
                onChange={(e) => setDayNotes(e.target.value)}
              ></textarea>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Tasks Due ({selectedTasks.length})</h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {selectedTasks.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No tasks due this day</p>
            ) : (
              selectedTasks.map(t => (
                <div key={t.id} className="p-3 bg-gray-50 rounded border-l-4 border-[#FDB913]">
                  <p className="text-sm font-bold text-gray-800 line-clamp-2">{t.task}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] font-bold uppercase text-gray-500">{t.owner}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${t.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-gray-200'}`}>
                      {t.status}
                    </span>
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
