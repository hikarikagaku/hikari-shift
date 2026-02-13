"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Calendar from 'react-calendar'
import { Trash2, Settings, LayoutDashboard, ChevronLeft, ChevronRight, PlusCircle, Download, List, UserPlus, X } from 'lucide-react'
import * as XLSX from 'xlsx'
import HolidayJp from '@holiday-jp/holiday_jp'
import 'react-calendar/dist/Calendar.css'

// --- Supabase Client ---
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function Home() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [roleMaster, setRoleMaster] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeStartDate, setActiveStartDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  
  // Forms
  const [newStaffNameInput, setNewStaffNameInput] = useState(''); 
  const [newStaffName, setNewStaffName] = useState(''); 
  const [startTime, setStartTime] = useState('08:30');
  const [endTime, setEndTime] = useState('17:30');
  const [newRoleItem, setNewRoleItem] = useState('');
  const [assigningShiftId, setAssigningShiftId] = useState<string | null>(null);
  const [selectedRoleForShift, setSelectedRoleForShift] = useState("");

  const fetchAll = async () => {
    const { data: s } = await supabase.from('shifts').select('*').order('start_time', { ascending: false });
    const { data: m } = await supabase.from('staff_members').select('*').order('name');
    const { data: r } = await supabase.from('role_master').select('*').order('name');
    if (s) setShifts(s); 
    if (m) setStaffList(m); 
    if (r) setRoleMaster(r);
  }

  useEffect(() => { fetchAll() }, []);

  const getJstDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const isHoliday = (date: Date) => HolidayJp.isHoliday(date);

  const getDayClass = (date: Date) => {
    if (isHoliday(date)) return 'text-red-400 holiday-bg';
    const day = date.getDay();
    if (day === 0) return 'text-red-400 sun-bg';
    if (day === 6) return 'text-blue-400 sat-bg';
    return '';
  };

  const handleMove = (direction: number) => {
    const nextDate = new Date(selectedDate);
    if (viewMode === 'month') {
      nextDate.setMonth(selectedDate.getMonth() + direction);
      setActiveStartDate(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
    } else {
      nextDate.setDate(selectedDate.getDate() + (direction * 7));
      setActiveStartDate(nextDate);
    }
    setSelectedDate(nextDate);
  };

  const onAddShift = async (e: any) => {
    e.preventDefault();
    if (!newStaffName) return alert('スタッフを選択してください');
    const dateStr = getJstDateString(selectedDate);
    await supabase.from('shifts').insert([{ 
      staff_name: newStaffName, 
      start_time: `${dateStr}T${startTime}:00`, 
      end_time: `${dateStr}T${endTime}:00`,
      role: "" 
    }]);
    fetchAll();
  }

  const handleAssignRole = async (shiftId: string) => {
    if (!selectedRoleForShift) return alert("作業を選択してください");
    await supabase.from('shifts').update({ role: selectedRoleForShift }).match({ id: shiftId });
    setAssigningShiftId(null);
    setSelectedRoleForShift("");
    fetchAll();
  }

  const deleteShift = async (id: string) => {
    if(!confirm('このシフトを削除しますか？')) return;
    await supabase.from('shifts').delete().eq('id', id);
    fetchAll();
  }

  const exportToExcel = () => {
    const data = shifts.map(s => ({
      日付: s.start_time.split('T')[0],
      スタッフ: s.staff_name,
      開始: s.start_time.split('T')[1].slice(0, 5),
      終了: s.end_time.split('T')[1].slice(0, 5),
      作業内容: s.role || '（未割当）'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "シフト");
    XLSX.writeFile(wb, `shift_export.xlsx`);
  };

  const renderShiftBadges = (date: Date) => {
    const dateStr = getJstDateString(date);
    const ds = shifts.filter(s => s.start_time.startsWith(dateStr));
    return (
      <div className="w-full flex flex-col gap-1 mt-1 overflow-hidden">
        {ds.slice(0, 3).map(s => (
          <div key={s.id} className="flex items-center gap-1 bg-[#1c2030] text-[10px] px-1.5 py-0.5 rounded border border-[#252a38] truncate text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
            {s.staff_name.split(' ')[0]}
          </div>
        ))}
        {ds.length > 3 && <div className="text-[9px] text-slate-500 pl-1">+{ds.length - 3} more</div>}
      </div>
    );
  }

  const selectedDayShifts = shifts.filter(s => s.start_time.startsWith(getJstDateString(selectedDate)));

  return (
    <div className="min-h-screen bg-[#0d0f14] text-[#e8eaf0] font-sans selection:bg-blue-500/30">
      {/* --- HEADER --- */}
      <header className="flex items-center justify-between px-8 h-[60px] border-b border-[#252a38] bg-[#0d0f14]/90 backdrop-blur-xl sticky top-0 z-[100]">
        <div className="font-bold text-xl tracking-[0.12em] bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent italic">
          SHIFT
        </div>
        <div className="flex bg-[#151820] border border-[#252a38] rounded-lg p-0.5">
          <button onClick={() => setViewMode('month')} className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'month' ? 'bg-[#1c2030] text-blue-400' : 'text-slate-500'}`}>月表示</button>
          <button onClick={() => setViewMode('week')} className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'week' ? 'bg-[#1c2030] text-blue-400' : 'text-slate-500'}`}>週表示</button>
        </div>
        <button onClick={exportToExcel} className="bg-gradient-to-br from-blue-500 to-purple-500 hover:opacity-90 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2">
          <Download size={14}/> CSV出力
        </button>
      </header>

      <main className="grid lg:grid-cols-[1fr_320px] min-h-[calc(100vh-60px)]">
        {/* --- LEFT AREA --- */}
        <div className="p-8 border-r border-[#252a38]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <button onClick={() => handleMove(-1)} className="w-8 h-8 flex items-center justify-center bg-[#151820] border border-[#252a38] rounded-lg hover:bg-[#1c2030] transition-all text-slate-400">‹</button>
                <button onClick={() => handleMove(1)} className="w-8 h-8 flex items-center justify-center bg-[#151820] border border-[#252a38] rounded-lg hover:bg-[#1c2030] transition-all text-slate-400">›</button>
              </div>
              <h2 className="text-xl font-bold tracking-tight">
                {viewMode === 'month' ? `${activeStartDate.getFullYear()}年${activeStartDate.getMonth() + 1}月` : `${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日の週`}
              </h2>
            </div>
          </div>

          <div className="calendar-container">
            {viewMode === 'month' ? (
              <Calendar 
                onChange={(v: any) => setSelectedDate(v)} 
                activeStartDate={activeStartDate}
                onActiveStartDateChange={({ activeStartDate: nextDate }) => nextDate && setActiveStartDate(nextDate)}
                value={selectedDate} 
                tileContent={({ date }) => renderShiftBadges(date)} 
                tileClassName={({ date }) => getDayClass(date)}
                locale="ja-JP" 
                className="w-full !bg-transparent !border-none custom-dark-calendar" 
              />
            ) : (
              /* --- WEEK VIEW --- */
              <div className="grid grid-cols-7 gap-[3px]">
                {['月','火','水','木','金','土','日'].map((w,i)=>(<div key={i} className={`text-center text-[10px] text-slate-500 py-2 font-mono tracking-widest ${i===5?'text-blue-400':i===6?'text-red-400':''}`}>{w}</div>))}
                {[0,1,2,3,4,5,6].map(i => {
                  const d = new Date(selectedDate);
                  const day = d.getDay();
                  const diff = i - (day === 0 ? 6 : day - 1);
                  d.setDate(selectedDate.getDate() + diff);
                  const dateStr = getJstDateString(d);
                  return (
                    <div key={i} onClick={() => setSelectedDate(d)} className={`bg-[#151820] border border-[#252a38] rounded-lg min-h-[400px] p-2 cursor-pointer hover:bg-[#1c2030] transition-all ${getDayClass(d)} ${dateStr === getJstDateString(selectedDate) ? 'ring-1 ring-blue-500/50 bg-blue-500/5' : ''}`}>
                       <span className={`font-mono text-xs ${d.toDateString() === new Date().toDateString() ? 'text-blue-400 font-bold underline underline-offset-4' : 'text-slate-500'}`}>{d.getDate()}</span>
                       {renderShiftBadges(d)}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* --- HISTORY TABLE --- */}
          <div className="mt-12 border border-[#252a38] rounded-xl overflow-hidden bg-[#151820]">
            <div className="flex items-center justify-between p-4 border-b border-[#252a38] bg-[#151820]">
              <h3 className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">入力履歴</h3>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#151820] text-slate-500 font-mono text-[10px] sticky top-0">
                  <tr>
                    <th className="p-3">日付</th>
                    <th className="p-3">スタッフ</th>
                    <th className="p-3">作業内容</th>
                    <th className="p-3">時間</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#252a38]">
                  {shifts.map(s => (
                    <tr key={s.id} className="hover:bg-[#1c2030] transition-colors">
                      <td className="p-3 font-mono text-slate-400">{s.start_time.split('T')[0]}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-2 bg-[#1c2030] px-2 py-1 rounded-full border border-[#252a38]">
                          <span className="w-2 h-2 rounded-full bg-blue-400"></span>{s.staff_name}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-blue-400 font-medium">{s.role || '---'}</span>
                      </td>
                      <td className="p-3 text-slate-500 font-mono">{s.start_time.split('T')[1].slice(0,5)}–{s.end_time.split('T')[1].slice(0,5)}</td>
                      <td className="p-3">
                        <button onClick={() => deleteShift(s.id)} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={14}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* --- RIGHT SIDEBAR --- */}
        <aside className="bg-[#0d0f14] flex flex-col divide-y divide-[#252a38]">
          {/* Work Master */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">作業内容マスター</h3>
              <button onClick={() => {const n=prompt('作業名'); if(n) supabase.from('role_master').insert([{name:n}]).then(fetchAll)}} className="w-6 h-6 flex items-center justify-center bg-[#1c2030] border border-[#252a38] text-blue-400 rounded-md hover:bg-blue-500 hover:text-white transition-all">+</button>
            </div>
            <div className="space-y-2 max-h-[150px] overflow-y-auto">
              {roleMaster.map(r => (
                <div key={r.id} className="flex items-center gap-3 p-2 bg-[#151820] border border-[#252a38] rounded-lg text-xs">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span className="flex-1">{r.name}</span>
                  <button onClick={() => supabase.from('role_master').delete().eq('id',r.id).then(fetchAll)} className="text-slate-600 hover:text-red-400 transition-colors"><X size={12}/></button>
                </div>
              ))}
            </div>
          </div>

          {/* Staff Master */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">スタッフ</h3>
              <button onClick={() => {const n=prompt('スタッフ名'); if(n) supabase.from('staff_members').insert([{name:n}]).then(fetchAll)}} className="w-6 h-6 flex items-center justify-center bg-[#1c2030] border border-[#252a38] text-blue-400 rounded-md hover:bg-blue-500 hover:text-white transition-all">+</button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto">
              {staffList.map(s => (
                <div key={s.id} className="flex items-center gap-2 bg-[#151820] border border-[#252a38] px-3 py-1.5 rounded-full text-xs">
                   <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold">{s.name[0]}</div>
                   <span>{s.name}</span>
                   <button onClick={() => supabase.from('staff_members').delete().eq('id',s.id).then(fetchAll)} className="text-slate-600 hover:text-red-400 transition-colors">×</button>
                </div>
              ))}
            </div>
          </div>

          {/* Shift Register */}
          <div className="p-6 bg-[#151820]/30">
            <h3 className="text-[11px] font-bold tracking-widest text-slate-500 uppercase mb-4">シフト登録</h3>
            <div className="text-[10px] font-mono text-blue-400 bg-blue-400/10 px-2 py-1.5 rounded inline-block mb-4">
              {getJstDateString(selectedDate)}
            </div>
            <form onSubmit={onAddShift} className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">スタッフ</label>
                <select value={newStaffName} onChange={e=>setNewStaffName(e.target.value)} className="w-full bg-[#151820] border border-[#252a38] text-xs p-2 rounded-lg outline-none focus:border-blue-500">
                  <option value="">選択してください</option>
                  {staffList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">開始</label>
                  <input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} className="w-full bg-[#151820] border border-[#252a38] text-xs p-2 rounded-lg outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">終了</label>
                  <input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)} className="w-full bg-[#151820] border border-[#252a38] text-xs p-2 rounded-lg outline-none focus:border-blue-500" />
                </div>
              </div>
              <button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 py-2.5 rounded-lg text-xs font-bold shadow-lg shadow-blue-500/10">保存する</button>
            </form>
          </div>

          {/* Assignment (Daily List) */}
          <div className="p-6 flex-1">
             <h3 className="text-[11px] font-bold tracking-widest text-slate-500 uppercase mb-4">担当割当</h3>
             <div className="space-y-2 overflow-y-auto">
               {selectedDayShifts.length === 0 ? <p className="text-xs text-slate-600 text-center py-8">シフトなし</p> : 
                selectedDayShifts.map(s => (
                 <div key={s.id} className="p-3 bg-[#151820] border border-[#252a38] rounded-lg space-y-3 shadow-sm">
                   <div className="flex justify-between items-center text-xs">
                     <span className="font-bold">{s.staff_name}</span>
                     <span className="font-mono text-[10px] text-slate-500">{s.start_time.split('T')[1].slice(0,5)}–{s.end_time.split('T')[1].slice(0,5)}</span>
                   </div>
                   <div className="flex gap-2">
                     <select className="flex-1 bg-[#1c2030] border border-[#252a38] text-[10px] p-1.5 rounded outline-none" value={assigningShiftId === s.id ? selectedRoleForShift : (s.role || "")} onChange={(e) => { setAssigningShiftId(s.id); setSelectedRoleForShift(e.target.value); }}>
                        <option value="">作業を選択</option>
                        {roleMaster.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                     </select>
                     <button onClick={() => handleAssignRole(s.id)} className={`px-3 py-1 rounded text-[10px] font-bold ${assigningShiftId === s.id ? 'bg-blue-500 text-white' : 'bg-[#1c2030] text-slate-400 border border-[#252a38]'}`}>確定</button>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </aside>
      </main>

      <style jsx global>{`
        /* Calendar UI Customization */
        .custom-dark-calendar .react-calendar__month-view__days__day {
          min-height: 100px !important;
          background: #151820 !important;
          border: 1px solid #252a38 !important;
          border-radius: 6px !important;
          padding: 6px !important;
          color: #9ca3af !important;
          margin: 1.5px !important;
          max-width: calc(14.28% - 3px) !important;
        }
        .custom-dark-calendar .react-calendar__month-view__days__day:hover {
          background: #1c2030 !important;
          border-color: #3b82f6 !important;
        }
        .custom-dark-calendar .react-calendar__tile--now {
          background: #1c2030 !important;
          border-color: #3b82f6 !important;
        }
        .custom-dark-calendar .react-calendar__tile--now abbr { color: #3b82f6 !important; font-weight: bold; }
        .custom-dark-calendar .react-calendar__tile--active {
          background: rgba(59, 130, 246, 0.1) !important;
          border-color: #3b82f6 !important;
        }
        .custom-dark-calendar .react-calendar__month-view__days__day--neighboringMonth { opacity: 0.2; }
        .custom-dark-calendar .react-calendar__month-view__weekdays { display: none !important; }
        .custom-dark-calendar .react-calendar__navigation { display: none !important; }
        .custom-dark-calendar abbr { text-decoration: none !important; font-family: 'DM Mono', monospace; font-size: 12px; }
        
        /* Weekday colors */
        .sat-bg abbr { color: #60a5fa !important; }
        .sun-bg abbr, .holiday-bg abbr { color: #f87171 !important; }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #252a38; border-radius: 10px; }
      `}</style>
    </div>
  )
}