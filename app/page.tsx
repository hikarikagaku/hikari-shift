"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Calendar from 'react-calendar'
import { Trash2, Users, Settings, LayoutDashboard, ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react'
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

  // ★ 日本時間で正しく yyyy-mm-dd を取得する超重要関数
  const getJstDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const onAddShift = async (e: any) => {
    e.preventDefault();
    if (!newStaffName) return alert('スタッフを選択してください');
    
    // 時差の影響を受けないように yyyy-mm-dd 文字列を生成
    const dateStr = getJstDateString(selectedDate);
    
    const { error } = await supabase.from('shifts').insert([{ 
      staff_name: newStaffName, 
      start_time: `${dateStr}T${startTime}:00`, 
      end_time: `${dateStr}T${endTime}:00` 
    }]);
    
    if(error) alert("保存失敗: " + error.message);
    else {
      alert(`${dateStr} に登録しました`);
      fetchAll();
    }
  }

  const handleAssignRole = async (shiftId: string) => {
    await supabase.from('shifts').update({ role: selectedRoleForShift }).eq('id', shiftId);
    setAssigningShiftId(null);
    fetchAll();
  }

  const renderShiftBadges = (date: Date, isLarge: boolean) => {
    const dateStr = getJstDateString(date);
    const ds = shifts.filter(s => s.start_time.startsWith(dateStr));
    
    return (
      <div className={`mt-1 flex flex-col gap-1 ${isLarge ? 'min-h-[150px]' : ''}`}>
        {ds.map(s => (
          <div key={s.id} className={`${getStaffColor(s.staff_name)} text-white p-1 rounded shadow-sm text-[9px] md:text-[10px]`}>
            <div className="flex justify-between font-bold border-b border-white/20 mb-1 px-0.5">
              <span>{s.staff_name}</span>
              <span className="opacity-80 font-mono">{s.start_time.split('T')[1].slice(0,5)}</span>
            </div>
            {assigningShiftId === s.id ? (
              <div className="flex flex-col gap-1 p-0.5 bg-white/10 rounded">
                <select className="text-black w-full text-[9px] rounded p-0.5" value={selectedRoleForShift} onChange={e=>setSelectedRoleForShift(e.target.value)}>
                  <option value="">作業選択</option>
                  {roleMaster.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                </select>
                <button onClick={()=>handleAssignRole(s.id)} className="bg-white text-blue-600 rounded text-[9px] font-bold py-0.5 shadow-sm">決定</button>
              </div>
            ) : (
              <div className="cursor-pointer bg-white/20 hover:bg-white/30 rounded px-1 truncate font-bold text-center py-0.5" 
                   onClick={()=>{setAssigningShiftId(s.id); setSelectedRoleForShift(s.role||"")}}>
                {s.role || '📝 担当割当'}
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
        <h1 className="font-black text-blue-600 italic flex items-center gap-2"><LayoutDashboard size={20}/> HIKARI SHIFT MASTER</h1>
      </header>

      <main className="max-w-7xl mx-auto p-4 grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-xl border">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2 md:gap-4">
                <button onClick={()=>setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth()-1)))} className="p-2 border rounded-full hover:bg-slate-50"><ChevronLeft size={18}/></button>
                <span className="font-black text-blue-700 text-lg">{selectedDate.getFullYear()}年{selectedDate.getMonth()+1}月</span>
                <button onClick={()=>setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth()+1)))} className="p-2 border rounded-full hover:bg-slate-50"><ChevronRight size={18}/></button>
              </div>
              <div className="flex bg-slate-200 p-1 rounded-xl text-xs font-bold">
                <button onClick={()=>setViewMode('month')} className={`px-4 py-2 rounded-lg transition-all ${viewMode==='month'?'bg-white shadow text-blue-600':'text-slate-500'}`}>月</button>
                <button onClick={()=>setViewMode('week')} className={`px-4 py-2 rounded-lg transition-all ${viewMode==='week'?'bg-white shadow text-blue-600':'text-slate-500'}`}>週</button>
              </div>
            </div>

            {viewMode === 'month' ? (
              <Calendar onChange={(v:any)=>setSelectedDate(v)} value={selectedDate} tileContent={({date})=>renderShiftBadges(date, false)} locale="ja-JP" className="w-full border-none" />
            ) : (
              <div className="grid grid-cols-7 gap-px bg-slate-200 border rounded-xl overflow-hidden shadow-inner">
                {['月','火','水','木','金','土','日'].map((w,i)=>(<div key={i} className="bg-slate-100 p-2 text-center text-[10px] font-black text-slate-500 uppercase">{w}</div>))}
                {[0,1,2,3,4,5,6].map(i => {
                  const d = new Date(selectedDate);
                  const day = d.getDay();
                  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1) + i);
                  return (
                    <div key={i} onClick={()=>setSelectedDate(d)} className={`bg-white p-1 min-h-[200px] cursor-pointer transition-colors ${d.toDateString()===selectedDate.toDateString()?'bg-blue-50 ring-2 ring-inset ring-blue-400':''}`}>
                      <div className={`text-center font-bold text-xs mb-1 ${d.toDateString()===new Date().toDateString()?'bg-blue-600 text-white w-6 h-6 rounded-full mx-auto flex items-center justify-center':''}`}>{d.getDate()}</div>
                      {renderShiftBadges(d, true)}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl border shadow-lg border-blue-100">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-blue-600"><Settings size={18}/> 担当作業マスター登録</h3>
            <div className="flex gap-2 mb-4">
              <input value={newRoleItem} onChange={e=>setNewRoleItem(e.target.value)} className="flex-1 border p-2 rounded-xl text-sm outline-none focus:ring-2 ring-blue-200" placeholder="1号機削り、2号機削り など" />
              <button onClick={async()=>{
                if(!newRoleItem) return;
                await supabase.from('role_master').insert([{name:newRoleItem}]);
                setNewRoleItem(''); fetchAll();
              }} className="bg-blue-600 text-white px-6 rounded-xl font-bold shadow-md hover:bg-blue-700">追加</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {roleMaster.map(r => (
                <div key={r.id} className="bg-blue-50 border border-blue-100 p-2 px-3 rounded-lg flex items-center gap-2 text-[10px] font-bold text-blue-700 shadow-sm">
                  {r.name} <button onClick={async()=>{if(confirm('削除？')){await supabase.from('role_master').delete().eq('id',r.id); fetchAll()}}} className="text-blue-300 hover:text-red-500 ml-1 text-xs">×</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <form onSubmit={onAddShift} className="bg-white p-6 rounded-3xl shadow-xl border-t-4 border-blue-600 space-y-4 sticky top-24">
            <h3 className="font-black text-blue-600 flex items-center gap-2 text-lg"><PlusCircle size={20}/> シフト入力</h3>
            <div className="bg-blue-50 p-4 rounded-2xl text-center font-black text-blue-800 border border-blue-100 shadow-inner text-sm">
              {getJstDateString(selectedDate)} ({['日','月','火','水','木','金','土'][selectedDate.getDay()]})
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 ml-1">スタッフを選択</label>
              <select value={newStaffName} onChange={e=>setNewStaffName(e.target.value)} className="w-full border p-3 rounded-2xl bg-white text-sm outline-none shadow-sm focus:ring-2 ring-blue-100" required>
                <option value="">-- 未選択 --</option>
                {staffList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 ml-1 text-xs text-center block">開始</label>
                <input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} className="w-full border p-3 rounded-2xl text-sm outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 ml-1 text-xs text-center block">終了</label>
                <input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)} className="w-full border p-3 rounded-2xl text-sm outline-none" />
              </div>
            </div>
            <button className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all text-sm tracking-widest">
              シフト登録
            </button>
          </form>
        </div>
      </main>
    </div>
    
  )
}