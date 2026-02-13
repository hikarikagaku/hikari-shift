"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Calendar from 'react-calendar'
import { Trash2, LayoutDashboard, ChevronLeft, ChevronRight, Download, X } from 'lucide-react'
import * as XLSX from 'xlsx'
import HolidayJp from '@holiday-jp/holiday_jp'
import 'react-calendar/dist/Calendar.css'

// --- Supabase Client ---
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

// スタッフ名から固定の色を生成する関数
const getStaffColor = (name: string) => {
  const colors = ['#5b8fff', '#34d399', '#f87171', '#fbbf24', '#a78bfa', '#fb923c', '#38bdf8', '#e879f9'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function Home() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [roleMaster, setRoleMaster] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeStartDate, setActiveStartDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  
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
    if (isHoliday(date)) return 'sun';
    const day = date.getDay();
    if (day === 0) return 'sun';
    if (day === 6) return 'sat';
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
    if (!newStaffName) return;
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
    if (!selectedRoleForShift) return;
    await supabase.from('shifts').update({ role: selectedRoleForShift }).match({ id: shiftId });
    setAssigningShiftId(null);
    setSelectedRoleForShift("");
    fetchAll();
  }

  const deleteShift = async (id: string) => {
    if(!confirm('削除しますか？')) return;
    await supabase.from('shifts').delete().eq('id', id);
    fetchAll();
  }

  const renderShiftBadges = (date: Date) => {
    const dateStr = getJstDateString(date);
    const ds = shifts.filter(s => s.start_time.startsWith(dateStr));
    return (
      <div className="shift-chips-container">
        {ds.slice(0, 3).map(s => {
          const color = getStaffColor(s.staff_name);
          return (
            <div key={s.id} className="shift-chip" style={{ color: color, background: `${color}15` }}>
              <span className="dot" style={{ background: color }}></span>
              {s.staff_name.split(' ')[0]}
            </div>
          );
        })}
        {ds.length > 3 && <div className="more-count">+{ds.length - 3}</div>}
      </div>
    );
  }

  const selectedDayShifts = shifts.filter(s => s.start_time.startsWith(getJstDateString(selectedDate)));

  return (
    <div className="app-container">
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      
      <header>
        <div className="logo">SHIFT</div>
        <div className="header-nav">
          <button className={`nav-btn ${viewMode === 'month' ? 'active' : ''}`} onClick={() => setViewMode('month')}>月表示</button>
          <button className={`nav-btn ${viewMode === 'week' ? 'active' : ''}`} onClick={() => setViewMode('week')}>週表示</button>
        </div>
        <button className="export-btn" onClick={() => {}}>📥 CSV出力</button>
      </header>

      <main className="main-layout">
        <div className="calendar-area">
          <div className="cal-header">
            <div className="cal-nav">
              <button onClick={() => handleMove(-1)}><ChevronLeft size={16}/></button>
              <span className="cal-title">{viewMode === 'month' ? `${activeStartDate.getFullYear()}年${activeStartDate.getMonth() + 1}月` : `${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日の週`}</span>
              <button onClick={() => handleMove(1)}><ChevronRight size={16}/></button>
            </div>
          </div>

          <div className="grid-container">
            {viewMode === 'month' ? (
              <Calendar 
                onChange={(v: any) => setSelectedDate(v)} 
                activeStartDate={activeStartDate}
                value={selectedDate} 
                tileContent={({ date }) => renderShiftBadges(date)} 
                tileClassName={({ date }) => getDayClass(date)}
                locale="ja-JP" 
                className="cal-grid-override" 
              />
            ) : (
              <div className="week-grid-custom">
                {['月','火','水','木','金','土','日'].map((w,i)=>(<div key={i} className={`weekday-label ${i===5?'sat':i===6?'sun':''}`}>{w}</div>))}
                {[0,1,2,3,4,5,6].map(i => {
                  const d = new Date(selectedDate);
                  const day = d.getDay();
                  const diff = i - (day === 0 ? 6 : day - 1);
                  d.setDate(selectedDate.getDate() + diff);
                  return (
                    <div key={i} onClick={() => setSelectedDate(d)} className={`cal-cell ${getDayClass(d)} ${getJstDateString(d) === getJstDateString(selectedDate) ? 'selected' : ''}`}>
                       <span className={`cal-date ${d.toDateString() === new Date().toDateString() ? 'today-num' : ''}`}>{d.getDate()}</span>
                       {renderShiftBadges(d)}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* HISTORY WITH AVATARS */}
          <div className="history-area mt-8 border border-[#252a38] rounded-xl overflow-hidden bg-[#151820]">
            <div className="history-header p-4 border-b border-[#252a38]">
              <span className="history-title text-xs font-bold tracking-widest text-[#6b7280]">入力履歴</span>
            </div>
            <div className="history-table-wrap max-h-[300px] overflow-y-auto">
              <table className="history-table w-full">
                <thead className="bg-[#151820] text-[#6b7280] text-[10px] font-mono sticky top-0">
                  <tr><th className="p-3 text-left">日付</th><th className="p-3 text-left">スタッフ</th><th className="p-3 text-left">作業内容</th><th className="p-3 text-left">時間</th><th className="p-3 text-left"></th></tr>
                </thead>
                <tbody className="divide-y divide-[#252a38]">
                  {shifts.map(s => (
                    <tr key={s.id} className="hover:bg-[#1c2030]">
                      <td className="p-3 font-mono text-xs text-[#9ca3af]">{s.start_time.split('T')[0]}</td>
                      <td className="p-3">
                        <span className="staff-badge-small inline-flex items-center gap-2 bg-[#1c2030] px-2 py-1 rounded-full border border-[#252a38] text-[11px]">
                          <span className="avatar-mini w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: getStaffColor(s.staff_name) }}>{s.staff_name[0]}</span>
                          {s.staff_name}
                        </span>
                      </td>
                      <td className="p-3"><span className="work-badge-small text-blue-400 font-bold text-xs">{s.role || '---'}</span></td>
                      <td className="p-3 text-[#9ca3af] font-mono text-[11px]">{s.start_time.split('T')[1].slice(0,5)}–{s.end_time.split('T')[1].slice(0,5)}</td>
                      <td className="p-3 text-right"><button onClick={() => deleteShift(s.id)} className="text-[#6b7280] hover:text-red-400">✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="sidebar divide-y divide-[#252a38]">
          <div className="sidebar-section p-6">
            <div className="section-title text-[10px] font-bold text-[#6b7280] uppercase mb-4 flex justify-between">作業マスター <button onClick={()=>{const n=prompt('名'); n && supabase.from('role_master').insert([{name:n}]).then(fetchAll)}}>+</button></div>
            <div className="space-y-2">
              {roleMaster.map(r => (
                <div key={r.id} className="item-row flex items-center gap-3 p-2 bg-[#151820] border border-[#252a38] rounded-lg text-xs">
                  <span className="dot w-1.5 h-1.5 rounded-full bg-blue-500"></span>{r.name}
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-section p-6">
            <div className="section-title text-[10px] font-bold text-[#6b7280] uppercase mb-4 flex justify-between">スタッフ <button onClick={()=>{const n=prompt('名'); n && supabase.from('staff_members').insert([{name:n}]).then(fetchAll)}}>+</button></div>
            <div className="flex flex-wrap gap-2">
              {staffList.map(s => (
                <div key={s.id} className="staff-pill flex items-center gap-2 bg-[#151820] border border-[#252a38] px-3 py-1.5 rounded-full text-xs">
                  <div className="avatar w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: getStaffColor(s.name) }}>{s.name[0]}</div>
                  {s.name}
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-section p-6">
            <div className="section-title text-[10px] font-bold text-[#6b7280] uppercase mb-4">シフト登録</div>
            <form onSubmit={onAddShift} className="space-y-4">
              <select value={newStaffName} onChange={e=>setNewStaffName(e.target.value)} className="w-full bg-[#151820] border border-[#252a38] text-xs p-2 rounded-lg text-white">
                <option value="">選択してください</option>
                {staffList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
              <button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-2 rounded-lg text-xs">保存する</button>
            </form>
          </div>

          <div className="sidebar-section p-6">
            <div className="section-title text-[10px] font-bold text-[#6b7280] uppercase mb-4">担当割当</div>
            <div className="space-y-3">
              {selectedDayShifts.map(s => (
                <div key={s.id} className="assign-item p-3 bg-[#151820] border border-[#252a38] rounded-xl space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white" style={{ background: getStaffColor(s.staff_name) }}>{s.staff_name[0]}</span>
                      {s.staff_name}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <select value={assigningShiftId === s.id ? selectedRoleForShift : (s.role || "")} onChange={(e) => { setAssigningShiftId(s.id); setSelectedRoleForShift(e.target.value); }} className="flex-1 bg-[#1c2030] border border-[#252a38] text-[10px] p-1.5 rounded text-white">
                      <option value="">作業を選択</option>
                      {roleMaster.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                    </select>
                    <button onClick={() => handleAssignRole(s.id)} className={`px-4 py-1 rounded text-[10px] font-bold ${assigningShiftId === s.id ? 'bg-blue-500 text-white' : 'bg-[#1c2030] text-[#6b7280]'}`}>確定</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>

      <style jsx global>{`
        :root { --bg: #0d0f14; --surface: #151820; --surface2: #1c2030; --border: #252a38; --accent: #5b8fff; --text: #e8eaf0; }
        body { background: var(--bg); color: var(--text); margin: 0; font-family: 'Noto Sans JP', sans-serif; }
        header { display: flex; align-items: center; justify-content: space-between; padding: 0 2rem; height: 60px; border-bottom: 1px solid var(--border); }
        .logo { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.3rem; background: linear-gradient(135deg, var(--accent), #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .nav-btn { background: none; border: none; color: #6b7280; padding: 0.4rem 1rem; cursor: pointer; font-size: 0.82rem; }
        .nav-btn.active { color: var(--accent); }
        .main-layout { display: grid; grid-template-columns: 1fr 320px; min-height: calc(100vh - 60px); }
        .calendar-area { padding: 1.5rem 2rem; border-right: 1px solid var(--border); }
        .react-calendar { width: 100% !important; background: transparent !important; border: none !important; }
        .react-calendar__tile { background: var(--surface) !important; border: 1px solid var(--border) !important; border-radius: 8px !important; min-height: 110px !important; padding: 10px !important; display: flex !important; flex-direction: column !important; align-items: flex-start !important; color: #9ca3af !important; }
        .react-calendar__tile abbr { font-family: 'DM Mono', monospace; text-decoration: none !important; }
        .shift-chips-container { display: flex; flex-direction: column; gap: 4px; width: 100%; margin-top: 6px; }
        .shift-chip { display: flex; align-items: center; gap: 5px; font-size: 0.75rem; padding: 3px 8px; border-radius: 5px; font-weight: 600; }
        .shift-chip .dot { width: 6px; height: 6px; border-radius: 50%; }
        .week-grid-custom { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
        .cal-cell { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; min-height: 500px; padding: 12px; cursor: pointer; }
        .cal-date { font-family: 'DM Mono', monospace; color: #9ca3af; }
        .today-num { background: var(--accent); color: white !important; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .sat abbr, .sat { color: var(--accent) !important; }
        .sun abbr, .sun { color: #f87171 !important; }
      `}</style>
    </div>
  )
}