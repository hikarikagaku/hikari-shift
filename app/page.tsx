"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Calendar from 'react-calendar'
import { Trash2, Settings, LayoutDashboard, ChevronLeft, ChevronRight, PlusCircle, Download, List, UserPlus } from 'lucide-react'
import * as XLSX from 'xlsx'
import HolidayJp from '@holiday-jp/holiday_jp'
import 'react-calendar/dist/Calendar.css'
import './calendar-custom.css'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

const getStaffColor = (n: string) => {
  const colors = ['bg-blue-600', 'bg-emerald-600', 'bg-violet-600', 'bg-amber-600', 'bg-rose-600', 'bg-cyan-600'];
  let h = 0; for (let i = 0; i < n.length; i++) h = n.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
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
  // 標準時間を 08:30 と 17:30 に変更
  const [startTime, setStartTime] = useState('08:30');
  const [endTime, setEndTime] = useState('17:30');
  const [newRoleItem, setNewRoleItem] = useState('');
  const [assigningShiftId, setAssigningShiftId] = useState<string | null>(null);
  const [selectedRoleForShift, setSelectedRoleForShift] = useState("");

  const fetchAll = async () => {
    const { data: s } = await supabase.from('shifts').select('*').order('start_time');
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
    if (isHoliday(date)) return 'text-red-500 holiday-bg';
    const day = date.getDay();
    if (day === 0) return 'text-red-500 sun-bg';
    if (day === 6) return 'text-blue-500 sat-bg';
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

  const handleAssignRole = async (shiftId: string) => {
    if (!selectedRoleForShift) return alert("作業を選択してください");
    await supabase.from('shifts').update({ role: selectedRoleForShift }).match({ id: shiftId });
    setAssigningShiftId(null);
    setSelectedRoleForShift("");
    await fetchAll();
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
    XLSX.writeFile(wb, `shift_${getJstDateString(new Date())}.xlsx`);
  };

  const renderShiftBadges = (date: Date) => {
    const dateStr = getJstDateString(date);
    const ds = shifts.filter(s => s.start_time.startsWith(dateStr));
    return (
      <div className="w-full flex flex-col gap-2 mt-2 overflow-y-auto max-h-[130px]">
        {ds.map(s => (
          <div key={s.id} className={`${getStaffColor(s.staff_name)} text-white px-2 py-2 rounded-xl shadow-lg w-full border-b-4 border-black/20`}>
            {/* スタッフ名は見やすく大きいまま */}
            <div className="text-[14px] font-black leading-tight truncate mb-1 text-center uppercase tracking-tighter">
              {s.staff_name}
            </div>
            {/* 作業内容も大きいまま */}
            <div className="bg-white/90 text-slate-800 rounded-lg py-1 text-center text-[12px] font-black truncate shadow-inner">
              {s.role || '未設定'}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const selectedDayShifts = shifts.filter(s => s.start_time.startsWith(getJstDateString(selectedDate)));

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-20">
      <header className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <h1 className="font-black text-blue-600 italic flex items-center gap-2 text-2xl tracking-tighter uppercase">
          <LayoutDashboard size={28}/> HIKARI SHIFT
        </h1>
        <button onClick={exportToExcel} className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold text-lg hover:bg-emerald-700 shadow-lg active:scale-95 transition-all">
          <Download size={22}/> Excel保存
        </button>
      </header>

      <main className="max-w-[1700px] mx-auto p-4 grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-6">
                <div className="flex gap-3">
                  <button onClick={()=>handleMove(-1)} className="p-3 border-2 rounded-full hover:bg-slate-50 transition-all active:scale-90"><ChevronLeft size={28}/></button>
                  <button onClick={()=>handleMove(1)} className="p-3 border-2 rounded-full hover:bg-slate-50 transition-all active:scale-90"><ChevronRight size={28}/></button>
                </div>
                <span className="font-black text-3xl text-slate-800">
                  {viewMode === 'month' ? `${activeStartDate.getFullYear()}年${activeStartDate.getMonth()+1}月` : `${selectedDate.getMonth()+1}月${selectedDate.getDate()}日の週`}
                </span>
              </div>
              <div className="flex bg-slate-100 p-2 rounded-2xl text-sm font-black">
                <button onClick={()=>setViewMode('month')} className={`px-10 py-3 rounded-xl transition-all ${viewMode==='month'?'bg-white shadow-lg text-blue-600':'text-slate-400'}`}>月表示</button>
                <button onClick={()=>setViewMode('week')} className={`px-10 py-3 rounded-xl transition-all ${viewMode==='week'?'bg-white shadow-lg text-blue-600':'text-slate-400'}`}>週表示</button>
              </div>
            </div>

            <div className="calendar-wrapper overflow-x-auto">
              {viewMode === 'month' ? (
                <Calendar 
                  onChange={(v:any)=>setSelectedDate(v)} 
                  activeStartDate={activeStartDate}
                  onActiveStartDateChange={({activeStartDate: nextDate}) => nextDate && setActiveStartDate(nextDate)}
                  value={selectedDate} 
                  tileContent={({date})=>renderShiftBadges(date)} 
                  tileClassName={({date}) => getDayClass(date)}
                  locale="ja-JP" 
                  className="w-full border-none custom-huge-calendar" 
                />
              ) : (
                <div className="grid grid-cols-7 gap-px bg-slate-200 border-4 rounded-[2.5rem] overflow-hidden shadow-inner font-bold min-w-[900px]">
                  {['月','火','水','木','金','土','日'].map((w,i)=>(
                    <div key={i} className={`bg-slate-50 p-4 text-center text-sm font-black uppercase ${i===5?'text-blue-500':i===6?'text-red-500':''}`}>{w}</div>
                  ))}
                  {[0,1,2,3,4,5,6].map(i => {
                    const d = new Date(selectedDate);
                    const day = d.getDay();
                    const diff = i - (day === 0 ? 6 : day - 1);
                    d.setDate(selectedDate.getDate() + diff);
                    return (
                      <div key={i} onClick={()=>setSelectedDate(d)} className={`bg-white p-4 min-h-[500px] cursor-pointer hover:bg-slate-50 transition-colors ${getDayClass(d)} ${d.toDateString()===selectedDate.toDateString()?'ring-4 ring-inset ring-blue-500':''}`}>
                        {/* 週表示の日付も標準サイズ（text-lg）に */}
                        <div className={`text-center font-bold text-lg mb-4 ${d.toDateString()===new Date().toDateString()?'bg-blue-600 text-white w-9 h-9 rounded-full mx-auto flex items-center justify-center shadow-xl':''}`}>{d.getDate()}</div>
                        {renderShiftBadges(d)}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100">
            <h3 className="font-black mb-4 flex items-center gap-2 text-slate-700 text-xl tracking-tighter uppercase">作業内容マスター</h3>
            <div className="flex gap-2 mb-4">
              <input value={newRoleItem} onChange={e=>setNewRoleItem(e.target.value)} className="flex-1 border-4 p-4 rounded-2xl text-lg font-bold shadow-sm outline-none focus:border-blue-500" placeholder="新しい作業名を入力" />
              <button onClick={async()=>{if(!newRoleItem)return; await supabase.from('role_master').insert([{name:newRoleItem}]); setNewRoleItem(''); fetchAll();}} className="bg-slate-800 text-white px-8 rounded-2xl font-black text-lg shadow-lg active:scale-95">追加</button>
            </div>
            <div className="flex flex-wrap gap-3">
              {roleMaster.map(r => (
                <div key={r.id} className="bg-slate-100 border-2 border-slate-200 p-2 px-5 rounded-xl flex items-center gap-3 text-sm font-black text-slate-700 shadow-sm">
                  {r.name} <button onClick={async()=>{if(confirm('削除？')){await supabase.from('role_master').delete().eq('id',r.id); fetchAll()}}} className="text-slate-300 hover:text-red-500">×</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] shadow-xl border-t-8 border-emerald-500 space-y-4">
            <h3 className="font-black text-emerald-600 flex items-center gap-2 text-xl tracking-tighter uppercase">スタッフ登録</h3>
            <div className="flex gap-2">
              <input value={newStaffNameInput} onChange={e=>setNewStaffNameInput(e.target.value)} className="flex-1 border-4 p-4 rounded-2xl text-lg font-bold shadow-sm outline-none focus:border-emerald-500" placeholder="名前" />
              <button onClick={async()=>{if(!newStaffNameInput)return; await supabase.from('staff_members').insert([{name:newStaffNameInput}]); setNewStaffNameInput(''); fetchAll();}} className="bg-emerald-600 text-white px-6 rounded-2xl font-black text-lg shadow-lg active:scale-95">登録</button>
            </div>
          </div>

          <form onSubmit={async(e)=>{e.preventDefault(); if(!newStaffName)return; const dateStr=getJstDateString(selectedDate); await supabase.from('shifts').insert([{staff_name:newStaffName, start_time:`${dateStr}T${startTime}:00`, end_time:`${dateStr}T${endTime}:00`, role:""}]); fetchAll();}} className="bg-white p-6 rounded-[2rem] shadow-xl border-t-8 border-blue-600 space-y-5">
            <h3 className="font-black text-blue-600 flex items-center gap-2 text-xl tracking-tighter uppercase">シフト登録</h3>
            <div className="bg-blue-50 p-4 rounded-2xl text-center font-black text-blue-800 text-xl shadow-inner">{getJstDateString(selectedDate)}</div>
            <select value={newStaffName} onChange={e=>setNewStaffName(e.target.value)} className="w-full border-4 p-4 rounded-2xl bg-white text-xl font-black shadow-sm outline-none" required>
              <option value="">スタッフを選択</option>
              {staffList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} className="w-full border-4 p-4 rounded-2xl text-xl font-black" />
              <input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)} className="w-full border-4 p-4 rounded-2xl text-xl font-black" />
            </div>
            <button className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-blue-700 active:scale-95 text-xl">保存する</button>
          </form>

          <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 flex flex-col gap-6">
            <h3 className="font-black text-slate-700 flex items-center gap-2 text-xl border-b-2 pb-2">担当割当</h3>
            <div className="flex flex-col gap-5 max-h-[600px] overflow-y-auto pr-1">
              {selectedDayShifts.length === 0 ? <p className="text-center text-slate-400 py-10 text-lg font-black italic">予定なし</p> : 
                selectedDayShifts.map(s => (
                <div key={s.id} className={`p-5 rounded-[2rem] border-4 flex flex-col gap-4 shadow-xl ${getStaffColor(s.staff_name).replace('bg-', 'border-')}`}>
                  <div className="flex justify-between items-center font-black text-xl">{s.staff_name}
                    <button onClick={async()=>{if(confirm('削除？')){await supabase.from('shifts').delete().eq('id',s.id);fetchAll()}}} className="text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={28}/></button>
                  </div>
                  <div className="flex gap-3">
                    <select className="flex-1 border-2 p-3 rounded-xl text-sm font-black bg-white" value={assigningShiftId === s.id ? selectedRoleForShift : (s.role || "")} onChange={(e) => { setAssigningShiftId(s.id); setSelectedRoleForShift(e.target.value); }}>
                      <option value="">作業を選択...</option>
                      {roleMaster.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                    </select>
                    <button onClick={() => handleAssignRole(s.id)} className={`px-6 py-2 rounded-xl font-black text-sm text-white shadow-md active:scale-95 transition-all ${assigningShiftId === s.id ? 'bg-orange-500 shadow-orange-200' : 'bg-slate-300'}`} disabled={assigningShiftId !== s.id}>確定</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-huge-calendar { width: 100% !important; border: none !important; }
        .custom-huge-calendar .react-calendar__month-view__days__day {
          min-height: 180px !important; display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: flex-start !important; padding: 8px !important; border: 1px solid #f1f5f9 !important;
        }
        /* 月表示の日付を標準サイズ（1rem = 16px）に戻す */
        .custom-huge-calendar .react-calendar__month-view__days__day abbr { font-weight: 700 !important; font-size: 1rem !important; text-decoration: none !important; margin-bottom: 8px !important; }
        .custom-huge-calendar .react-calendar__navigation { display: none !important; }
        .sat-bg { background-color: #f8fbff !important; }
        .sun-bg { background-color: #fff9f9 !important; }
        .holiday-bg { background-color: #fff5f5 !important; }
        .react-calendar__tile--now { background: #ffffdc !important; border-radius: 16px; }
      `}</style>
    </div>
  )
}