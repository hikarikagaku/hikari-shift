"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Calendar from 'react-calendar'
import { Trash2, LayoutDashboard, ChevronLeft, ChevronRight, Download, PlusCircle, Users, Settings, History, Calendar as CalIcon } from 'lucide-react'
import * as XLSX from 'xlsx'
import HolidayJp from '@holiday-jp/holiday_jp'
import 'react-calendar/dist/Calendar.css'

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

  const fetchAll = async () => {
    const { data: s } = await supabase.from('shifts').select('*').order('start_time', { ascending: false });
    const { data: m } = await supabase.from('staff_members').select('*').order('name');
    const { data: r } = await supabase.from('role_master').select('*').order('name');
    if (s) setShifts(s); if (m) setStaffList(m); if (r) setRoleMaster(r);
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

  const exportCSV = () => {
    const header = '日付,スタッフ,作業内容,開始,終了\n';
    const rows = shifts.map(s => `${s.start_time.split('T')[0]},${s.staff_name},${s.role || ''},${s.start_time.split('T')[1].slice(0,5)},${s.end_time.split('T')[1].slice(0,5)}`).join('\n');
    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'shift.csv'; a.click();
  };

  const renderShiftBadges = (date: Date) => {
    const dateStr = getJstDateString(date);
    const ds = shifts.filter(s => s.start_time.startsWith(dateStr));
    return (
      <div className="shift-chips-container">
        {ds.slice(0, 3).map(s => (
          <div key={s.id} className="shift-chip" style={{ color: getStaffColor(s.staff_name), background: `${getStaffColor(s.staff_name)}22` }}>
            <span className="dot" style={{ background: getStaffColor(s.staff_name) }}></span>
            {s.staff_name.split(' ')[0]}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="app-shell">
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      
      {/* ── HEADER ── */}
      <header className="site-header">
        <div className="logo">SHIFT</div>
        <button className="export-btn" onClick={exportCSV}>📥 CSV出力</button>
      </header>

      <main className="main-content">
        {/* LEFT AREA */}
        <div className={`content-section ${mobileTab === 'cal' || mobileTab === 'history' ? 'active' : 'hidden md:block'}`}>
          {mobileTab === 'cal' && (
            <div className="view-container">
              <div className="cal-navigation">
                <button onClick={() => handleMove(-1)}><ChevronLeft size={18}/></button>
                <span className="cal-month-title">{viewMode === 'month' ? `${activeStartDate.getFullYear()}年${activeStartDate.getMonth() + 1}月` : `${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日の週`}</span>
                <button onClick={() => handleMove(1)}><ChevronRight size={18}/></button>
              </div>

              <div className="calendar-box">
                {viewMode === 'month' ? (
                  <Calendar 
                    onChange={(v: any) => setSelectedDate(v)} 
                    activeStartDate={activeStartDate}
                    value={selectedDate} 
                    tileContent={({ date }) => renderShiftBadges(date)} 
                    tileClassName={({ date }) => {
                        const dateStr = getJstDateString(date);
                        const isSelected = dateStr === getJstDateString(selectedDate);
                        const holidayClass = HolidayJp.isHoliday(date) || date.getDay() === 0 ? 'sun' : date.getDay() === 6 ? 'sat' : '';
                        return `cal-tile ${holidayClass} ${isSelected ? 'selected' : ''}`;
                    }}
                    locale="ja-JP" 
                    className="custom-calendar-root" 
                  />
                ) : (
                  <div className="week-view-grid">
                    {[0,1,2,3,4,5,6].map(i => {
                      const d = new Date(selectedDate);
                      const day = d.getDay();
                      const diff = i - (day === 0 ? 6 : day - 1);
                      d.setDate(selectedDate.getDate() + diff);
                      return (
                        <div key={i} onClick={() => setSelectedDate(d)} className={`cal-tile week-tile ${HolidayJp.isHoliday(d) || d.getDay() === 0 ? 'sun' : d.getDay() === 6 ? 'sat' : ''} ${getJstDateString(d) === getJstDateString(selectedDate) ? 'selected' : ''}`}>
                           <span className={`date-num ${d.toDateString() === new Date().toDateString() ? 'today' : ''}`}>{d.getDate()}</span>
                           {renderShiftBadges(d)}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {mobileTab === 'history' && (
            <div className="history-pane">
              <div className="pane-header"><span className="pane-label">入力履歴</span></div>
              <div className="table-wrapper">
                <table className="modern-table">
                  <thead>
                    <tr><th>Date</th><th>Staff</th><th>Work</th><th>Time</th><th></th></tr>
                  </thead>
                  <tbody>
                    {shifts.map(s => (
                      <tr key={s.id}>
                        <td className="font-mono text-xs opacity-50">{s.start_time.split('T')[0]}</td>
                        <td>
                          <div className="staff-cell">
                            <span className="avatar-small" style={{ background: getStaffColor(s.staff_name) }}>{s.staff_name[0]}</span>
                            {s.staff_name}
                          </div>
                        </td>
                        <td><span className="role-tag" style={{ color: getStaffColor(s.staff_name) }}>{s.role || '---'}</span></td>
                        <td className="font-mono text-[10px] opacity-60">{s.start_time.split('T')[1].slice(0,5)}–{s.end_time.split('T')[1].slice(0,5)}</td>
                        <td><button onClick={async () => { if(confirm('削除？')) { await supabase.from('shifts').delete().eq('id', s.id); fetchAll(); }}} className="opacity-30 hover:opacity-100 transition-opacity">✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR TABS */}
        <aside className={`sidebar-section ${mobileTab !== 'cal' && mobileTab !== 'history' ? 'active' : 'hidden md:block'}`}>
          {mobileTab === 'reg' && (
            <div className="pane-card">
              <div className="pane-header"><span className="pane-label">シフト登録</span></div>
              <div className="selected-date-badge">{getJstDateString(selectedDate)}</div>
              <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newStaffName) return;
                  const dateStr = getJstDateString(selectedDate);
                  await supabase.from('shifts').insert([{ staff_name: newStaffName, start_time: `${dateStr}T${startTime}:00`, end_time: `${dateStr}T${endTime}:00`, role: "" }]);
                  fetchAll();
                  setMobileTab('cal');
              }} className="pane-form">
                <div className="field-group">
                  <label>スタッフ</label>
                  <select value={newStaffName} onChange={e=>setNewStaffName(e.target.value)}>
                    <option value="">選択してください</option>
                    {staffList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div className="field-row">
                  <div className="field-group"><label>開始</label><input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} /></div>
                  <div className="field-group"><label>終了</label><input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)} /></div>
                </div>
                <button className="action-btn-main">保存する</button>
              </form>

              <div className="daily-assign mt-10">
                <div className="pane-label mb-4 opacity-50">本日の担当割当</div>
                {selectedDayShifts.map(s => (
                  <div key={s.id} className="assign-row">
                    <div className="assign-staff">
                      <span className="avatar-small" style={{ background: getStaffColor(s.staff_name) }}>{s.staff_name[0]}</span>
                      {s.staff_name}
                    </div>
                    <select value={s.role || ""} onChange={async (e) => { await supabase.from('shifts').update({role: e.target.value}).eq('id', s.id); fetchAll(); }}>
                      <option value="">作業を選択</option>
                      {roleMaster.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mobileTab === 'staff' && (
            <div className="pane-card">
              <div className="pane-header flex justify-between">
                <span className="pane-label">スタッフ管理</span>
                <button className="add-icon-btn" onClick={async () => { const n = prompt('名前'); if(n) { await supabase.from('staff_members').insert([{name: n}]); fetchAll(); }}}>+</button>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {staffList.map(s => (
                  <div key={s.id} className="staff-badge">
                    <span className="avatar-small" style={{ background: getStaffColor(s.name) }}>{s.name[0]}</span>
                    {s.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {mobileTab === 'work' && (
            <div className="pane-card">
              <div className="pane-header flex justify-between">
                <span className="pane-label">作業マスター</span>
                <button className="add-icon-btn" onClick={async () => { const n = prompt('作業名'); if(n) { await supabase.from('role_master').insert([{name: n}]); fetchAll(); }}}>+</button>
              </div>
              <div className="space-y-2 mt-4">
                {roleMaster.map(r => (
                  <div key={r.id} className="role-item">
                    <span className="role-dot"></span>
                    {r.name}
                    <button onClick={async () => { if(confirm('削除？')) { await supabase.from('role_master').delete().eq('id', r.id); fetchAll(); }}} className="ml-auto opacity-20">✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </main>

      {/* BOTTOM NAV */}
      <nav className="bottom-bar">
        <button onClick={() => setMobileTab('cal')} className={mobileTab === 'cal' ? 'active' : ''}><CalIcon size={20}/><span>カレンダー</span></button>
        <button onClick={() => setMobileTab('reg')} className={mobileTab === 'reg' ? 'active' : ''}><PlusCircle size={20}/><span>登録</span></button>
        <button onClick={() => setMobileTab('staff')} className={mobileTab === 'staff' ? 'active' : ''}><Users size={20}/><span>スタッフ</span></button>
        <button onClick={() => setMobileTab('work')} className={mobileTab === 'work' ? 'active' : ''}><Settings size={20}/><span>作業</span></button>
        <button onClick={() => setMobileTab('history')} className={mobileTab === 'history' ? 'active' : ''}><History size={20}/><span>履歴</span></button>
        <button onClick={exportCSV} className="accent-btn"><Download size={20}/><span>CSV</span></button>
      </nav>

      <style jsx global>{`
        :root {
          --bg: #0d0f14; --surface: #151820; --surface2: #1c2030;
          --border: #252a38; --accent: #5b8fff; --accent2: #a78bfa;
          --text: #e8eaf0; --text-muted: #6b7280;
        }
        body { background: var(--bg); color: var(--text); margin: 0; font-family: 'Noto Sans JP', sans-serif; overflow-x: hidden; }
        
        .site-header { display: flex; align-items: center; justify-content: space-between; padding: 0 1.5rem; height: 60px; border-bottom: 1px solid var(--border); background: var(--bg); position: sticky; top: 0; z-index: 100; }
        .logo { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.2rem; letter-spacing: 0.1em; background: linear-gradient(135deg, var(--accent), var(--accent2)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .export-btn { background: linear-gradient(135deg, var(--accent), var(--accent2)); color: white; border: none; padding: 0.45rem 1rem; border-radius: 8px; font-weight: 700; font-size: 0.75rem; cursor: pointer; }

        .main-content { display: block; padding-bottom: 80px; }
        @media (min-width: 768px) { .main-content { display: grid; grid-template-columns: 1fr 340px; padding-bottom: 0; } }

        .cal-navigation { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; }
        .cal-navigation button { background: var(--surface); border: 1px solid var(--border); color: white; width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .cal-month-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1.1rem; }

        .calendar-box { padding: 0 1rem; }
        .react-calendar { width: 100% !important; border: none !important; background: transparent !important; }
        .react-calendar__month-view__weekdays { display: grid !important; grid-template-columns: repeat(7, 1fr) !important; text-align: center; font-size: 0.65rem; color: var(--text-muted); padding-bottom: 10px; }
        .react-calendar__month-view__days { display: grid !important; grid-template-columns: repeat(7, 1fr) !important; gap: 4px !important; }
        .cal-tile { background: var(--surface) !important; border: 1px solid var(--border) !important; border-radius: 8px !important; min-height: 90px !important; padding: 6px !important; display: flex !important; flex-direction: column !important; align-items: flex-start !important; cursor: pointer; position: relative; }
        .cal-tile.selected { border-color: var(--accent) !important; background: rgba(91,143,255,0.08) !important; }
        .cal-tile abbr { font-family: 'DM Mono', monospace; font-size: 0.75rem; color: var(--text-muted); text-decoration: none !important; }
        .sun abbr { color: #f87171 !important; }
        .sat abbr { color: var(--accent) !important; }

        .date-num.today { background: var(--accent); color: white !important; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold; }

        .shift-chips-container { display: flex; flex-direction: column; gap: 2px; width: 100%; margin-top: 5px; }
        .shift-chip { font-size: 0.58rem; padding: 2px 5px; border-radius: 4px; display: flex; align-items: center; gap: 4px; font-weight: 700; }
        .dot { width: 5px; height: 5px; border-radius: 50%; }

        .bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; height: 70px; background: #151820; border-top: 1px solid var(--border); display: grid; grid-template-columns: repeat(6, 1fr); z-index: 1000; padding-bottom: env(safe-area-inset-bottom); }
        .bottom-bar button { background: none; border: none; color: var(--text-muted); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; font-size: 9px; cursor: pointer; }
        .bottom-bar button.active { color: var(--accent); }
        .accent-btn { color: #34d399 !important; }

        .pane-card { padding: 1.5rem; }
        .pane-label { font-family: 'Syne', sans-serif; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.12em; }
        .selected-date-badge { font-family: 'DM Mono', monospace; font-size: 0.8rem; color: var(--accent); background: rgba(91,143,255,0.1); padding: 0.4rem 0.8rem; border-radius: 6px; display: inline-block; margin: 1rem 0; }
        
        .pane-form label { display: block; font-size: 0.7rem; color: var(--text-muted); margin-bottom: 0.4rem; }
        .pane-form input, .pane-form select { width: 100%; background: var(--surface); border: 1px solid var(--border); color: white; padding: 0.7rem; border-radius: 8px; font-size: 0.85rem; margin-bottom: 1rem; outline: none; }
        .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .action-btn-main { width: 100%; background: linear-gradient(135deg, var(--accent), var(--accent2)); border: none; color: white; padding: 0.8rem; border-radius: 10px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.3); }

        .staff-badge { display: flex; align-items: center; gap: 0.5rem; background: var(--surface); border: 1px solid var(--border); padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.8rem; }
        .avatar-small { width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; color: white; font-weight: 800; flex-shrink: 0; margin-right: 4px; }

        .modern-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
        .modern-table th { text-align: left; padding: 0.8rem; color: var(--text-muted); font-size: 0.65rem; text-transform: uppercase; border-bottom: 1px solid var(--border); }
        .modern-table td { padding: 0.8rem; border-bottom: 1px solid var(--border); }
        .role-tag { font-weight: 700; font-size: 0.7rem; }

        .assign-row { display: flex; justify-content: space-between; align-items: center; background: var(--surface); border: 1px solid var(--border); padding: 0.8rem; border-radius: 10px; margin-bottom: 0.6rem; }
        .assign-row select { background: var(--surface2); border: none; color: white; font-size: 0.75rem; padding: 0.3rem 0.6rem; border-radius: 6px; }

        .role-item { display: flex; align-items: center; gap: 0.8rem; padding: 0.7rem; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; font-size: 0.85rem; }
        .role-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }
      `}</style>
    </div>
  )
}