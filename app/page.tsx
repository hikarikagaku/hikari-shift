"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Calendar from 'react-calendar'
import { Trash2, Users, Settings, LayoutDashboard, ChevronLeft, ChevronRight, PlusCircle, Download, List, UserPlus } from 'lucide-react'
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
  const [activeStartDate, setActiveStartDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  
  const [newStaffNameInput, setNewStaffNameInput] = useState(''); // スタッフ登録用
  const [newStaffName, setNewStaffName] = useState(''); // シフト入力用選択値
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [newRoleItem, setNewRoleItem] = useState('');

  const [assigningShiftId, setAssigningShiftId] = useState<string | null>(null);
  const [selectedRoleForShift, setSelectedRoleForShift] = useState("");

  const fetchAll = async () => {
    const { data: s } = await supabase.from('shifts').select('*').order('start_time');
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

  const renderShiftBadges = (date: Date) => {
    const dateStr = getJstDateString(date);
    const ds = shifts.filter(s => s.start_time.startsWith(dateStr));
    return (
      <div className="w-full flex flex-col gap-1 mt-1 overflow-y-auto max-h-[80px]">
        {ds.map(s => (
          <div key={s.id} className={`${getStaffColor(s.staff_name)} text-white p-1 rounded shadow-sm text-[8px] leading-tight w-full`}>
            <div className="truncate font-bold border-b border-white/20 mb-0.5">{s.staff_name}</div>
            <div className="text-center font-bold text-[7px] truncate bg-white/10 rounded">{s.role || '割当'}</div>
          </div>
        ))}
      </div>
    );
  }

  const selectedDayShifts = shifts.filter(s => s.start_time.startsWith(getJstDateString(selectedDate)));

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

      <main className="max-w-[1600px] mx-auto p-4 grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  <button onClick={()=>handleMove(-1)} className="p-2 border-2 rounded-full hover:bg-slate-50 transition-all"><ChevronLeft size={20}/></button>
                  <button onClick={()=>handleMove(1)} className="p-2 border-2 rounded-full hover:bg-slate-50 transition-all"><ChevronRight size={20}/></button>
                </div>
                <span className="font-black text-2xl text-slate-800">
                  {viewMode === 'month' ? `${activeStartDate.getFullYear()}年${activeStartDate.getMonth()+1}月` : `${selectedDate.getMonth()+1}月${selectedDate.getDate()}日の週`}
                </span>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-black">
                <button onClick={()=>setViewMode('month')} className={`px-6 py-2 rounded-lg transition-all ${viewMode==='month'?'bg-white shadow text-blue-600':'text-slate-400'}`}>月表示</button>
                <button onClick={()=>setViewMode('week')} className={`px-6 py-2 rounded-lg transition-all ${viewMode==='week'?'bg-white shadow text-blue-600':'text-slate-400'}`}>週表示</button>
              </div>
            </div>

            <div className="calendar-wrapper">
              {viewMode === 'month' ? (
                <Calendar 
                  onChange={(v:any)=>setSelectedDate(v)} 
                  activeStartDate={activeStartDate}
                  onActiveStartDateChange={({activeStartDate: nextDate}) => nextDate && setActiveStartDate(nextDate)}
                  value={selectedDate} 
                  tileContent={({date})=>renderShiftBadges(date)} 
                  locale="ja-JP" 
                  className="w-full border-none custom-huge-calendar" 
                />
              ) : (
                <div className="grid grid-cols-7 gap-px bg-slate-200 border rounded-2xl overflow-hidden shadow-inner font-bold text-xs">
                  {['月','火','水','木','金','土','日'].map((w,i)=>(<div key={i} className="bg-slate-50 p-2 text-center text-slate-500 uppercase">{w}</div>))}
                  {[0,1,2,3,4,5,6].map(i => {
                    const d = new Date(selectedDate);
                    const day = d.getDay();
                    const diff = i - (day === 0 ? 6 : day - 1);
                    d.setDate(selectedDate.getDate() + diff);
                    return (
                      <div key={i} onClick={()=>setSelectedDate(d)} className={`bg-white p-1 min-h-[300px] cursor-pointer ${d.toDateString()===selectedDate.toDateString()?'bg-blue-50 ring-2 ring-inset ring-blue-400':''}`}>
                        <div className={`text-center font-bold mb-1 ${d.toDateString()===new Date().toDateString()?'bg-blue-600 text-white w-6 h-6 rounded-full mx-auto flex items-center justify-center':''}`}>{d.getDate()}</div>
                        {renderShiftBadges(d)}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* マスター管理エリア（スタッフと作業内容） */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* スタッフ登録 */}
            <div className="bg-white p-6 rounded-[1.5rem] shadow-xl border border-slate-100">
              <h3 className="font-black mb-4 flex items-center gap-2 text-slate-700 text-lg"><UserPlus size={22}/> スタッフマスター</h3>
              <div className="flex gap-2 mb-4">
                <input value={newStaffNameInput} onChange={e=>setNewStaffNameInput(e.target.value)} className="flex-1 border p-3 rounded-xl text-sm font-bold" placeholder="氏名を入力" />
                <button onClick={async()=>{
                  if(!newStaffNameInput) return;
                  await supabase.from('staff_members').insert([{name:newStaffNameInput}]);
                  setNewStaffNameInput(''); fetchAll();
                }} className="bg-blue-600 text-white px-6 rounded-xl font-bold text-sm">追加</button>
              </div>
              <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto p-1">
                {staffList.map(s => (
                  <div key={s.id} className="bg-blue-50 border border-blue-100 p-1.5 px-3 rounded-lg flex items-center gap-2 text-[10px] font-bold text-blue-700">
                    {s.name} <button onClick={async()=>{if(confirm('削除しますか？')){await supabase.from('staff_members').delete().eq('id',s.id); fetchAll()}}} className="text-blue-300">×</button>
                  </div>
                ))}
              </div>
            </div>

            {/* 作業内容登録 */}
            <div className="bg-white p-6 rounded-[1.5rem] shadow-xl border border-slate-100">
              <h3 className="font-black mb-4 flex items-center gap-2 text-slate-700 text-lg"><Settings size={22}/> 作業内容マスター</h3>
              <div className="flex gap-2 mb-4">
                <input value={newRoleItem} onChange={e=>setNewRoleItem(e.target.value)} className="flex-1 border p-3 rounded-xl text-sm font-bold" placeholder="作業名を入力" />
                <button onClick={async()=>{
                  if(!newRoleItem) return;
                  await supabase.from('role_master').insert([{name:newRoleItem}]);
                  setNewRoleItem(''); fetchAll();
                }} className="bg-slate-800 text-white px-6 rounded-xl font-bold text-sm">追加</button>
              </div>
              <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto p-1">
                {roleMaster.map(r => (
                  <div key={r.id} className="bg-slate-50 border p-1.5 px-3 rounded-lg flex items-center gap-2 text-[10px] font-bold text-slate-600">
                    {r.name} <button onClick={async()=>{if(confirm('削除？')){await supabase.from('role_master').delete().eq('id',r.id); fetchAll()}}} className="text-slate-300">×</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 右側：入力フォーム & 詳細リスト */}
        <div className="lg:col-span-4 space-y-6">
          <form onSubmit={onAddShift} className="bg-white p-6 rounded-[1.5rem] shadow-xl border-t-4 border-blue-600 space-y-4 sticky top-24">
            <h3 className="font-black text-blue-600 flex items-center gap-2 text-lg"><PlusCircle size={22}/> シフト登録</h3>
            <div className="bg-blue-50 p-3 rounded-xl text-center font-black text-blue-800 text-sm">{getJstDateString(selectedDate)}</div>
            <select value={newStaffName} onChange={e=>setNewStaffName(e.target.value)} className="w-full border p-3 rounded-xl bg-white text-sm font-bold" required>
              <option value="">スタッフを選択</option>
              {staffList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div><label className="text-[10px] font-bold text-slate-400">開始</label><input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} className="w-full border p-3 rounded-xl text-sm font-bold" /></div>
              <div><label className="text-[10px] font-bold text-slate-400">終了</label><input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)} className="w-full border p-3 rounded-xl text-sm font-bold" /></div>
            </div>
            <button className="w-full bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-all text-sm tracking-widest">登録する</button>
          </form>

          <div className="bg-white p-6 rounded-[1.5rem] shadow-xl border border-slate-100 flex flex-col gap-4">
            <h3 className="font-black text-slate-700 flex items-center gap-2 text-lg"><List size={22}/> 本日のシフト詳細</h3>
            <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-1">
              {selectedDayShifts.map(s => (
                <div key={s.id} className={`p-4 rounded-2xl border-2 flex flex-col gap-2 ${getStaffColor(s.staff_name).replace('bg-', 'border-')}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-black text-sm">{s.staff_name}</span>
                    <button onClick={async()=>{if(confirm('削除？')){await supabase.from('shifts').delete().eq('id',s.id);fetchAll()}}} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                  </div>
                  <div className="flex gap-2">
                    <select className="flex-1 border p-2 rounded-xl text-[10px] font-bold bg-white" value={assigningShiftId === s.id ? selectedRoleForShift : (s.role || "")} onChange={(e) => { setAssigningShiftId(s.id); setSelectedRoleForShift(e.target.value); }}>
                      <option value="">作業内容を選択</option>
                      {roleMaster.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                    </select>
                    <button onClick={() => handle