"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Calendar from 'react-calendar'
import { Trash2, LayoutDashboard, ChevronLeft, ChevronRight, Download, X, PlusCircle, Users, Settings, History, Calendar as CalIcon } from 'lucide-react'
import * as XLSX from 'xlsx'
import HolidayJp from '@holiday-jp/holiday_jp'
import 'react-calendar/dist/Calendar.css'

// --- Supabase Client ---
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

const getStaffColor = (name: string) => {
  const colors = ['#5b8fff', '#34d399', '#f87171', '#fbbf24', '#a78bfa', '#fb923c', '#38bdf8', '#e879f9'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function Home() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [roleMaster, setRoleMaster] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeStartDate, setActiveStartDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [mobileTab, setMobileTab] = useState<'cal' | 'reg' | 'staff' | 'work' | 'history'>('cal');
  
  const [newStaffName, setNewStaffName] = useState(''); 
  const [startTime, setStartTime] = useState('08:30');
  const [endTime, setEndTime] = useState('17:30');
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
    if(window.innerWidth < 768) setMobileTab('cal');
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
        {ds.slice(0, 3).map(s => (
          <div key={s.id} className="shift-chip" style={{ color: getStaffColor(s.staff_name), background: `${getStaffColor(s.staff_name)}15` }}>
            <span className="dot" style={{ background: getStaffColor(s.staff_name) }}></span>
            {s.staff_name.split(' ')[0]}
          </div>
        ))}
      </div>
    );
  }

  const selectedDayShifts = shifts.filter(s => s.start_time.startsWith(getJstDateString(selectedDate)));

  return (
    <div className="app-container">
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      
      <header className="desktop-header">
        <div className="logo">SHIFT</div>
        <div className="header-nav">
          <button className={`nav-btn ${viewMode === 'month' ? 'active' : ''}`} onClick={() => setViewMode('month')}>月表示</button>
          <button className={`nav-btn ${viewMode === 'week' ? 'active' : ''}`} onClick={() => setViewMode('week')}>週表示</button>
        </div>
        <button className="export-btn" onClick={() => {}}>📥 CSV出力</button>
      </header>

      <main className="main-layout">
        {/* LEFT AREA / MAIN CONTENT */}
        <div className={`calendar-area ${(mobileTab === 'cal' || mobileTab === 'history') ? 'block' : 'hidden md:block'}`}>
          
          {mobileTab === 'cal' && (
            <>
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
                    tileClassName={({ date }) => HolidayJp.isHoliday(date) || date.getDay() === 0 ? 'sun' : date.getDay() === 6 ? 'sat' : ''}
                    locale="ja-JP" 
                    className="cal-grid-override" 
                  />
                ) : (
                  <div className="week-grid-custom">
                    {[0,1,2,3,4,5,6].map(i => {
                      const d = new Date(selectedDate);
                      const day = d.getDay();
                      const diff = i - (day === 0 ? 6 : day - 1);
                      d.setDate(selectedDate.getDate() + diff);
                      return (
                        <div key={i} onClick={() => setSelectedDate(d)} className={`cal-cell ${getJstDateString(d) === getJstDateString(selectedDate) ? 'selected' : ''}`}>
                           <span className={`cal-date ${d.toDateString() === new Date().toDateString() ? 'today-num' : ''}`}>{d.getDate()}</span>
                           {renderShiftBadges(d)}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {(mobileTab === 'history' || window.innerWidth >= 768) && (
            <div className="history-area mt-8 border border-[#252a38] rounded-xl overflow-hidden bg-[#151820]">
              <div className="history-header p-4 border-b border-[#252a38]"><span className="history-title">入力履歴</span></div>
              <table className="history-table w-full">
                <tbody className="divide-y divide-[#252a38]">
                  {shifts.map(s => (
                    <tr key={s.id}>
                      <td className="p-3 font-mono text-[10px] text-[#9ca3af]">{s.start_time.split('T')[0]}</td>
                      <td className="p-3">
                        <span className="flex items-center gap-2 text-[11px]">
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] text-white" style={{ background: getStaffColor(s.staff_name) }}>{s.staff_name[0]}</span>
                          {s.staff_name}
                        </span>
                      </td>
                      <td className="p-3 text-blue-400 font-bold text-[10px]">{s.role || '---'}</td>
                      <td className="p-3 text-right"><button onClick={() => deleteShift(s.id)} className="text-[#6b7280]">✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SIDEBAR / MOBILE TABS */}
        <aside className={`sidebar ${(mobileTab !== 'cal' && mobileTab !== 'history') ? 'block' : 'hidden md:block'}`}>
          {(mobileTab === 'work' || window.innerWidth >= 768) && (
            <div className="sidebar-section p-6">
              <div className="section-title">作業マスター <button onClick={()=>{const n=prompt('作業名'); n && supabase.from('role_master').insert([{name:n}]).then(fetchAll)}}>+</button></div>
              <div className="space-y-2">
                {roleMaster.map(r => (
                  <div key={r.id} className="item-row p-2 bg-[#151820] border border-[#252a38] rounded-lg text-xs flex justify-between">
                    <span>{r.name}</span>
                    <button onClick={()=>supabase.from('role_master').delete().eq('id',r.id).then(fetchAll)}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(mobileTab === 'staff' || window.innerWidth >= 768) && (
            <div className="sidebar-section p-6">
              <div className="section-title">スタッフ <button onClick={()=>{const n=prompt('名前'); n && supabase.from('staff_members').insert([{name:n}]).then(fetchAll)}}>+</button></div>
              <div className="flex flex-wrap gap-2">
                {staffList.map(s => (
                  <div key={s.id} className="staff-pill flex items-center gap-2 bg-[#151820] border border-[#252a38] px-3 py-1.5 rounded-full text-xs">
                    <div className="avatar w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ background: getStaffColor(s.name) }}>{s.name[0]}</div>
                    {s.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(mobileTab === 'reg' || window.innerWidth >= 768) && (
            <div className="sidebar-section p-6">
              <div className="section-title text-blue-400">シフト登録 - {getJstDateString(selectedDate)}</div>
              <form onSubmit={onAddShift} className="space-y-4">
                <select value={newStaffName} onChange={e=>setNewStaffName(e.target.value)} className="w-full bg-[#151820] border border-[#252a38] p-3 rounded-lg text-white">
                  <option value="">スタッフを選択</option>
                  {staffList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} className="bg-[#151820] border border-[#252a38] p-3 rounded-lg text-white" />
                  <input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)} className="bg-[#151820] border border-[#252a38] p-3 rounded-lg text-white" />
                </div>
                <button className="w-full bg-blue-600 py-3 rounded-lg font-bold">保存する</button>
              </form>
              
              <div className="mt-8 space-y-3">
                <div className="text-[10px] font-bold text-slate-500 uppercase">今日の担当割当</div>
                {selectedDayShifts.map(s => (
                  <div key={s.id} className="p-3 bg-[#151820] border border-[#252a38] rounded-xl flex items-center justify-between">
                    <span className="text-xs font-bold">{s.staff_name}</span>
                    <select value={s.role || ""} onChange={(e) => supabase.from('shifts').update({role:e.target.value}).eq('id',s.id).then(fetchAll)} className="bg-[#1c2030] text-[10px] p-1 rounded">
                      <option value="">作業割当</option>
                      {roleMaster.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav className="mobile-nav md:hidden">
        <button onClick={() => setMobileTab('cal')} className={mobileTab === 'cal' ? 'active' : ''}><CalIcon size={20}/><span>カレンダー</span></button>
        <button onClick={() => setMobileTab('reg')} className={mobileTab === 'reg' ? 'active' : ''}><PlusCircle size={20}/><span>登録</span></button>
        <button onClick={() => setMobileTab('staff')} className={mobileTab === 'staff' ? 'active' : ''}><Users size={20}/><span>スタッフ</span></button>
        <button onClick={() => setMobileTab('work')} className={mobileTab === 'work' ? 'active' : ''}><Settings size={20}/><span>作業</span></button>
        <button onClick={() => setMobileTab('history')} className={mobileTab === 'history' ? 'active' : ''}><History size={20}/><span>履歴</span></button>
        <button onClick={() => {}} className="csv-btn"><Download size={20}/><span>CSV</span></button>
      </nav>

      <style jsx global>{`
        :root { --bg: #0d0f14; --surface: #151820; --border: #252a38; --accent: #5b8fff; }
        body { background: var(--bg); color: #e8eaf0; margin: 0; font-family: 'Noto Sans JP', sans-serif; padding-bottom: 70px; }
        .desktop-header { display: none; }
        @media (min-width: 768px) {
          .desktop-header { display: flex; align-items: center; justify-content: space-between; padding: 0 2rem; height: 60px; border-bottom: 1px solid var(--border); }
          body { padding-bottom: 0; }
        }
        .logo { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.3rem; color: var(--accent); }
        .main-layout { display: block; }
        @media (min-width: 768px) { .main-layout { display: grid; grid-template-columns: 1fr 320px; } }
        
        .calendar-area { padding: 1rem; }
        .react-calendar { width: 100% !important; background: transparent !important; border: none !important; }
        .react-calendar__tile { background: var(--surface) !important; border: 1px solid var(--border) !important; border-radius: 8px !important; min-height: 80px !important; display: flex !important; flex-direction: column !important; align-items: center !important; }
        .shift-chips-container { display: flex; flex-direction: column; gap: 2px; width: 100%; }
        .shift-chip { font-size: 0.6rem; padding: 1px 4px; border-radius: 3px; display: flex; align-items: center; gap: 3px; }
        .shift-chip .dot { width: 4px; height: 4px; border-radius: 50%; }

        .mobile-nav { position: fixed; bottom: 0; left: 0; right: 0; background: #151820; border-top: 1px solid #252a38; display: grid; grid-template-columns: repeat(6, 1fr); height: 65px; z-index: 1000; }
        .mobile-nav button { background: none; border: none; color: #6b7280; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 9px; gap: 4px; }
        .mobile-nav button.active { color: var(--accent); }
        .mobile-nav .csv-btn { color: #34d399; }

        .section-title { font-family: 'Syne', sans-serif; font-size: 0.7rem; font-weight: 800; color: #6b7280; text-transform: uppercase; margin-bottom: 1rem; display: flex; justify-content: space-between; }
        .sun { color: #f87171 !important; }
        .sat { color: #60a5fa !important; }
      `}</style>
    </div>
  )
}