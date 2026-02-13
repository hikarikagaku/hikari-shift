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
    XLSX.utils.book_append_sheet(wb, ws, "SHIFTS");
    XLSX.writeFile(wb, `shift_export.xlsx`);
  };

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
        <button className="export-btn" onClick={exportToExcel}>📥 CSV出力</button>
      </header>

      <main className="main-layout">
        <div className="calendar-area">
          <div className="cal-header">
            <div className="cal-nav">
              <button onClick={() => handleMove(-1)}><ChevronLeft size={16}/></button>
              <span className="cal-title">
                {viewMode === 'month' ? `${activeStartDate.getFullYear()}年${activeStartDate.getMonth() + 1}月` : `${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日の週`}
              </span>
              <button onClick={() => handleMove(1)}><ChevronRight size={16}/></button>
            </div>
            <div className="view-toggle">
              <button className={viewMode === 'month' ? 'active' : ''} onClick={() => setViewMode('month')}>月</button>
              <button className={viewMode === 'week' ? 'active' : ''} onClick={() => setViewMode('week')}>週</button>
            </div>
          </div>

          <div className="grid-container">
            {viewMode === 'month' ? (
              <Calendar 
                onChange={(v: any) => setSelectedDate(v)} 
                activeStartDate={activeStartDate}
                onActiveStartDateChange={({ activeStartDate: nextDate }) => nextDate && setActiveStartDate(nextDate)}
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

          <div className="history-area">
            <div className="history-header"><span className="history-title">入力履歴</span></div>
            <div className="history-table-wrap">
              <table className="history-table">
                <thead><tr><th>日付</th><th>スタッフ</th><th>作業内容</th><th>時間</th><th></th></tr></thead>
                <tbody>
                  {shifts.map(s => (
                    <tr key={s.id}>
                      <td className="td-date">{s.start_time.split('T')[0]}</td>
                      <td>
                        <span className="staff-badge-small">
                          <span className="dot" style={{ background: getStaffColor(s.staff_name) }}></span>
                          {s.staff_name}
                        </span>
                      </td>
                      <td><span className="work-badge-small" style={{ color: '#5b8fff' }}>{s.role || '---'}</span></td>
                      <td className="td-time">{s.start_time.split('T')[1].slice(0,5)}–{s.end_time.split('T')[1].slice(0,5)}</td>
                      <td><button onClick={() => deleteShift(s.id)} className="del-btn">✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="sidebar">
          <div className="sidebar-section">
            <div className="section-title">作業内容マスター <button className="add-btn" onClick={()=>{const n=prompt('作業名'); if(n) supabase.from('role_master').insert([{name:n}]).then(fetchAll)}}>+</button></div>
            <div className="item-list">
              {roleMaster.map(r => (
                <div key={r.id} className="item-row"><span className="dot"></span>{r.name}
                  <button className="del-btn" onClick={()=>supabase.from('role_master').delete().eq('id',r.id).then(fetchAll)}>✕</button>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <div className="section-title">スタッフ <button className="add-btn" onClick={()=>{const n=prompt('名前'); if(n) supabase.from('staff_members').insert([{name:n}]).then(fetchAll)}}>+</button></div>
            <div className="staff-grid">
              {staffList.map(s => (
                <div key={s.id} className="staff-pill">
                  <div className="avatar" style={{ background: getStaffColor(s.name) }}>{s.name[0]}</div>
                  {s.name}
                  <button onClick={()=>supabase.from('staff_members').delete().eq('id',s.id).then(fetchAll)}>×</button>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-section bg-form">
            <div className="section-title">シフト登録</div>
            <div className="date-label">{getJstDateString(selectedDate)}</div>
            <form onSubmit={onAddShift} className="form">
              <label>スタッフ</label>
              <select value={newStaffName} onChange={e=>setNewStaffName(e.target.value)}>
                <option value="">選択してください</option>
                {staffList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
              <div className="input-row">
                <div><label>開始</label><input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} /></div>
                <div><label>終了</label><input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)} /></div>
              </div>
              <button className="form-btn">保存する</button>
            </form>
          </div>

          <div className="sidebar-section">
            <div className="section-title">担当割当</div>
            <div className="assignment-list">
              {selectedDayShifts.map(s => (
                <div key={s.id} className="assign-item">
                  <div className="assign-info">
                    <strong style={{ color: getStaffColor(s.staff_name) }}>{s.staff_name}</strong>
                    <span>{s.start_time.split('T')[1].slice(0,5)}–{s.end_time.split('T')[1].slice(0,5)}</span>
                  </div>
                  <div className="assign-action">
                    <select value={assigningShiftId === s.id ? selectedRoleForShift : (s.role || "")} onChange={(e) => { setAssigningShiftId(s.id); setSelectedRoleForShift(e.target.value); }}>
                      <option value="">作業を選択</option>
                      {roleMaster.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                    </select>
                    <button onClick={() => handleAssignRole(s.id)} className={assigningShiftId === s.id ? 'active' : ''}>確定</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>

      <style jsx global>{`
        :root {
          --bg: #0d0f14; --surface: #151820; --surface2: #1c2030;
          --border: #252a38; --accent: #5b8fff; --accent2: #a78bfa;
          --text: #e8eaf0; --text-muted: #6b7280; --text-dim: #9ca3af;
        }
        body { background: var(--bg); color: var(--text); margin: 0; font-family: 'Noto Sans JP', sans-serif; }
        header { display: flex; align-items: center; justify-content: space-between; padding: 0 2rem; height: 60px; border-bottom: 1px solid var(--border); background: rgba(13,15,20,0.9); backdrop-filter: blur(12px); position: sticky; top: 0; z-index: 100; }
        .logo { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.3rem; letter-spacing: 0.12em; background: linear-gradient(135deg, var(--accent), var(--accent2)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .nav-btn { background: none; border: 1px solid transparent; color: var(--text-dim); padding: 0.4rem 1rem; border-radius: 6px; font-size: 0.82rem; cursor: pointer; }
        .nav-btn.active { background: var(--surface2); color: var(--accent); border-color: var(--border); }
        .export-btn { background: linear-gradient(135deg, var(--accent), var(--accent2)); color: white; border: none; padding: 0.45rem 1.1rem; border-radius: 6px; font-size: 0.82rem; font-weight: 500; cursor: pointer; }
        .main-layout { display: grid; grid-template-columns: 1fr 320px; min-height: calc(100vh - 60px); }
        .calendar-area { padding: 1.5rem 2rem; border-right: 1px solid var(--border); }
        .cal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
        .cal-title { font-family: 'Syne', sans-serif; font-size: 1.4rem; font-weight: 700; }
        .cal-nav { display: flex; align-items: center; gap: 0.5rem; }
        .cal-nav button { background: var(--surface); border: 1px solid var(--border); color: var(--text-dim); width: 32px; height: 32px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .view-toggle { display: flex; background: var(--surface); border: 1px solid var(--border); border-radius: 6px; overflow: hidden; }
        .view-toggle button { background: none; border: none; color: var(--text-dim); padding: 0.35rem 0.8rem; font-size: 0.78rem; cursor: pointer; }
        .view-toggle button.active { background: var(--surface2); color: var(--accent); }
        .react-calendar { width: 100% !important; background: transparent !important; border: none !important; }
        .react-calendar__month-view__weekdays { display: grid !important; grid-template-columns: repeat(7, 1fr) !important; text-align: center; font-family: 'DM Mono', monospace; font-size: 0.72rem; color: var(--text-muted); margin-bottom: 10px; }
        .react-calendar__month-view__days { display: grid !important; grid-template-columns: repeat(7, 1fr) !important; gap: 4px !important; }
        .react-calendar__tile { background: var(--surface) !important; border: 1px solid var(--border) !important; border-radius: 6px !important; min-height: 100px !important; padding: 6px !important; text-align: left !important; display: flex !important; flex-direction: column !important; align-items: flex-start !important; }
        .react-calendar__tile abbr { text-decoration: none !important; font-family: 'DM Mono', monospace; font-size: 0.8rem; color: var(--text-dim); }
        .week-grid-custom { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
        .weekday-label { text-align: center; font-family: 'DM Mono', monospace; font-size: 0.72rem; color: var(--text-muted); padding: 0.5rem 0; }
        .cal-cell { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; min-height: 450px; padding: 10px; cursor: pointer; }
        .cal-cell.selected { border-color: var(--accent); background: rgba(91,143,255,0.05); }
        .cal-date { font-family: 'DM Mono', monospace; font-size: 0.8rem; color: var(--text-dim); margin-bottom: 8px; display: block; }
        .today-num { background: var(--accent); color: white !important; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .sat abbr, .sat { color: var(--accent) !important; }
        .sun abbr, .sun { color: #f87171 !important; }
        .shift-chips-container { display: flex; flex-direction: column; gap: 3px; width: 100%; margin-top: 4px; }
        .shift-chip { display: flex; align-items: center; gap: 4px; font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; white-space: nowrap; overflow: hidden; }
        .shift-chip .dot { width: 5px; height: 5px; border-radius: 50%; }
        .history-area { border: 1px solid var(--border); border-radius: 10px; background: var(--surface); overflow: hidden; margin-top: 2rem; }
        .history-header { padding: 1rem; border-bottom: 1px solid var(--border); }
        .history-title { font-family: 'Syne', sans-serif; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; }
        .history-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
        .history-table th { text-align: left; padding: 0.75rem 1rem; color: var(--text-muted); font-family: 'DM Mono', monospace; font-size: 0.65rem; border-bottom: 1px solid var(--border); }
        .history-table td { padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); }
        .staff-badge-small { display: inline-flex; align-items: center; gap: 6px; background: var(--surface2); padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; }
        .staff-badge-small .dot { width: 6px; height: 6px; border-radius: 50%; }
        .sidebar-section { padding: 1.5rem; border-bottom: 1px solid var(--border); }
        .section-title { font-family: 'Syne', sans-serif; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 1.2rem; display: flex; justify-content: space-between; align-items: center; }
        .add-btn { background: var(--surface2); border: 1px solid var(--border); color: var(--accent); width: 20px; height: 20px; border-radius: 4px; cursor: pointer; }
        .item-row { display: flex; align-items: center; gap: 0.8rem; padding: 0.5rem; background: var(--surface); border: 1px solid var(--border); border-radius: 6px; font-size: 0.8rem; margin-bottom: 0.4rem; }
        .staff-pill { display: flex; align-items: center; gap: 0.5rem; background: var(--surface); border: 1px solid var(--border); padding: 0.3rem 0.7rem; border-radius: 20px; font-size: 0.75rem; }
        .avatar { width: 18px; height: 18px; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.6rem; font-weight: bold; }
        .bg-form { background: rgba(91,143,255,0.03); }
        .form label { display: block; font-size: 0.7rem; color: var(--text-muted); margin-bottom: 0.4rem; }
        .form select, .form input { width: 100%; background: var(--surface); border: 1px solid var(--border); color: var(--text); padding: 0.6rem; border-radius: 6px; font-size: 0.8rem; margin-bottom: 0.8rem; outline: none; }
        .form-btn { width: 100%; background: linear-gradient(135deg, var(--accent), var(--accent2)); border: none; color: white; padding: 0.7rem; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 0.85rem; }
        .assign-item { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 0.8rem; margin-bottom: 0.6rem; }
        .assign-info { display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 0.6rem; }
        .assign-action { display: flex; gap: 0.5rem; }
        .assign-action select { flex: 1; background: var(--surface2); border: 1px solid var(--border); color: var(--text); font-size: 0.75rem; padding: 0.3rem; border-radius: 4px; }
        .assign-action button { background: var(--surface2); border: 1px solid var(--border); color: var(--text-muted); font-size: 0.7rem; padding: 0 0.8rem; border-radius: 4px; cursor: pointer; }
        .assign-action button.active { background: var(--accent); color: white; border-color: var(--accent); }
        .del-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; }
      `}</style>
    </div>
  )
}