"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Calendar from 'react-calendar'
import { Trash2, Users, Settings, LayoutDashboard, ChevronLeft, ChevronRight, PlusCircle, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
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
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  
  const [newStaffName, setNewStaffName] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
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

  const onAddShift = async (e: any) => {
    e.preventDefault();
    if (!newStaffName) return alert('スタッフを選択してください');
    const dateStr = getJstDateString(selectedDate);
    await supabase.from('shifts').insert([{ 
      staff_name: newStaffName, 
      start_time: `${dateStr}T${startTime}:00`, 
      end_time: `${dateStr}T${endTime}:00` 
    }]);
    fetchAll();
  }

  const handleAssignRole = async (shiftId: string) => {
    await supabase.from('shifts').update({ role: selectedRoleForShift }).eq('id', shiftId);
    setAssigningShiftId(null);
    fetchAll();
  }

  const exportToExcel = () => {
    const data = shifts.map(s => ({
      日付: s.start_time.split('T')[0],
      スタッフ: s.staff_name,
      開始: s.start_time.split('T')[1].slice(0, 5),
      終了: s.end_time.split('T')[1].slice(0, 5),
      作業内容: s.role || '未設定'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ShiftList");
    XLSX.writeFile(wb, `hikari_shift_${getJstDateString(new Date())}.xlsx`);
  };

  const renderShiftBadges = (date: Date, isLarge: boolean) => {
    const dateStr = getJstDateString(date);
    const ds = shifts.filter(s => s.start_time.startsWith(dateStr));
    return (
      <div className={`mt-1 flex flex-col gap-1 overflow-y-auto max-h-[80px] md:max-h-none`}>
        {ds.map(s => (
          <div key={s.id} className={`${getStaffColor(s.staff_name)} text-white p-1 rounded shadow-sm text-[8px] md:text-[10px]`}>
            <div className="flex justify-between font-bold border-b border-white/10 mb-1 px-0.5">
              <span className="truncate">{s.staff_name}</span>
              <span className="opacity-80 font-mono hidden md:inline">{s.start_time.split('T')[1].slice(0,5)}</span>
            </div>
            {assigningShiftId === s.id ? (
              <div className="flex flex-col gap-1 p-0.5 bg-white/10 rounded">
                <select className="text-black w-full text-[8px] rounded p-0.5" value={selectedRoleForShift} onChange={e=>setSelectedRoleForShift(e.target.value)}>
                  <option value="">作業選択</option>
                  {roleMaster.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                </select>
                <button onClick={()=>handleAssignRole(s.id)} className="bg-white text-blue-600 rounded text-[8px] font-bold py-0.5 shadow-sm">決定</button>
              </div>
            ) : (
              <div className="cursor-pointer bg-white/20 hover:bg-white/30 rounded px-1 truncate font-bold text-center py-0.5" 
                   onClick={()=>{setAssigningShiftId(s.id); setSelectedRoleForShift(s.role||"")}}>
                {s.role || '未設定'}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <header className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <h1 className="font-black text-blue-600 italic flex items-center gap-2 text-xl tracking-tighter">
          <LayoutDashboard size={24}/> HIKARI SHIFT MASTER
        </h1>
        <button onClick={exportToExcel} className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-colors shadow-lg">
          <Download size={18}/> Excel出力
        </button>
      </header>

      <main className="max-w-[1600px] mx-auto p-4 flex flex-col gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl border border-slate-200">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <button onClick={()=>setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth()-1)))} className="p-3 border-2 border-slate-100 rounded-full hover:bg-slate-50 transition-all"><ChevronLeft size={24}/></button>
                <button onClick={()=>setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth()+1)))} className="p-3 border-2 border-slate-100 rounded-full hover:bg-slate-50 transition-all"><ChevronRight size={24}/></button>
              </div>
              <span className="font-black text-3xl text-slate-800 tracking-tight">{selectedDate.getFullYear()}年{selectedDate.getMonth()+1}月</span>
            </div>
            <div className="flex bg-slate-100 p-1.5 rounded-2xl text-sm font-black shadow-inner">
              <button onClick={()=>setViewMode('month')} className={`px-8 py-3 rounded-xl transition-all ${viewMode==='month'?'bg-white shadow-md text-blue-600':'text-slate-400'}`}>月表示</button>
              <button onClick={()=>setViewMode('week')} className={`px-8 py-3 rounded-xl transition-all ${viewMode==='week'?'bg-white shadow-md text-blue-600':'text-slate-400'}`}>週表示</button>
            </div>
          </div>

          <div className="calendar-container overflow-x-auto">
            {viewMode === 'month' ? (
              <div className="min-w-[800px]">
                <Calendar 
                  onChange={(v:any)=>setSelectedDate(v)} 
                  value={selectedDate} 
                  tileContent={({date})=>renderShiftBadges(date, false)} 
                  locale="ja-JP" 
                  className="w-full border-none custom-huge-calendar" 
                />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1 bg-slate-200 border rounded-3xl overflow-hidden shadow-2xl">
                {['月','火','水','木','金','土','日'].map((w,i)=>(<div key={i} className="bg-slate-50 p-4 text-center text-xs font-black text-slate-500 uppercase tracking-widest">{w}</div>))}
                {[0,1,2,3,4,5,6].map(i => {
                  const d = new Date(selectedDate);
                  const day = d.getDay();
                  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1) + i);
                  return (
                    <div key={i} onClick={()=>setSelectedDate(d)} className={`bg-white p-3 min-h-[400px] cursor-pointer transition-all hover:bg-blue-50/30 ${d.toDateString()===selectedDate.toDateString()?'bg-blue-50 ring-4 ring-inset ring-blue-400/20':''}`}>
                      <div className={`text-center font-black text-lg mb-4 ${d.toDateString()===new Date().toDateString()?'bg-blue-600 text-white w-10 h-10 rounded-full mx-auto flex items-center justify-center shadow-lg':''}`}>{d.getDate()}</div>
                      {renderShiftBadges(d, true)}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* シフト入力 */}
          <form onSubmit={onAddShift} className="bg-white p-8 rounded-[2rem] shadow-xl border-t-8 border-blue-600 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-blue-600 flex items-center gap-2 text-2xl"><PlusCircle size={28}/> シフト入力</h3>
              <div className="bg-blue-50 px-6 py-2 rounded-full font-black text-blue-700 border border-blue-100 shadow-sm text-lg">
                {getJstDateString(selectedDate)}
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-slate-400 ml-2">スタッフ</label>
                <select value={newStaffName} onChange={e=>setNewStaffName(e.target.value)} className="w-full border-2 border-slate-100 p-4 rounded-2xl bg-white text-sm font-bold outline-none focus:border-blue-400 transition-all shadow-sm" required>
                  <option value="">選択</option>
                  {staffList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-slate-400 ml-2 text-center">開始</label>
                <input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} className="w-full border-2 border-slate-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-blue-400 transition-all shadow-sm" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-slate-400 ml-2 text-center">終了</label>
                <input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)} className="w-full border-2 border-slate-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-blue-400 transition-all shadow-sm" />
              </div>
            </div>
            <button className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-blue-700 active:scale-95 transition-all text-lg tracking-widest">
              この内容で登録
            </button>
          </form>

          {/* マスター設定 */}
          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
            <h3 className="font-black mb-6 flex items-center gap-2 text-slate-700 text-xl"><Settings size={24}/> 作業内容の登録</h3>
            <div className="flex gap-2 mb-6">
              <input value={newRoleItem} onChange={e=>setNewRoleItem(e.target.value)} className="flex-1 border-2 border-slate-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-blue-400 shadow-sm" placeholder="1号機削り、2号機削り など" />
              <button onClick={async()=>{
                if(!newRoleItem) return;
                await supabase.from('role_master').insert([{name:newRoleItem}]);
                setNewRoleItem(''); fetchAll();
              }} className="bg-slate-800 text-white px-8 rounded-2xl font-black shadow-lg hover:bg-slate-900 transition-all">追加</button>
            </div>
            <div className="flex flex-wrap gap-2 overflow-y-auto max-h-[150px] p-2 bg-slate-50 rounded-2xl shadow-inner">
              {roleMaster.map(r => (
                <div key={r.id} className="bg-white border-2 border-slate-100 p-2 px-4 rounded-xl flex items-center gap-2 text-xs font-black text-slate-600 shadow-sm">
                  {r.name} <button onClick={async()=>{if(confirm('削除？')){await supabase.from('role_master').delete().eq('id',r.id); fetchAll()}}} className="text-slate-300 hover:text-red-500 text-lg">×</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* 巨大化用スタイル */}
      <style jsx global>{`
        .custom-huge-calendar {
          width: 100% !important;
          background: transparent !important;
        }
        .custom-huge-calendar .react-calendar__month-view__days__day {
          height: 140px !important; /* マスの高さを大きく */
          display: flex;
          flex-direction: column;
          align-items: stretch !important;
          justify-content: flex-start !important;
          padding: 8px !important;
          border: 1px solid #f1f5f9 !important;
          font-weight: 800;
        }
        .custom-huge-calendar .react-calendar__tile--active {
          background: #eff6ff !important;
          color: #2563eb !important;
        }
        .custom-huge-calendar .react-calendar__tile--now {
          background: #f8fafc !important;
          color: #2563eb !important;
        }
        .react-calendar__navigation button {
          display: none; /* カレンダー側のナビを消して自作に統一 */
        }
      `}</style>
    </div>
  )
}