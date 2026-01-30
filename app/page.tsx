"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Calendar from 'react-calendar'
import { Trash2, Users, Settings, LayoutDashboard, ChevronLeft, ChevronRight, Save, Check, PlusCircle } from 'lucide-react'
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
  
  // 入力フォーム用
  const [newStaffName, setNewStaffName] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [newRoleItem, setNewRoleItem] = useState('');

  // 作業割り当て用
  const [assigningShiftId, setAssigningShiftId] = useState<string | null>(null);
  const [selectedRoleForShift, setSelectedRoleForShift] = useState("");

  const fetchAll = async () => {
    const { data: s } = await supabase.from('shifts').select('*').order('start_time');
    const { data: m } = await supabase.from('staff_members').select('*').order('name');
    const { data: r } = await supabase.from('role_master').select('*').order('name');
    if (s) setShifts(s); if (m) setStaffList(m); if (r) setRoleMaster(r);
  }
  useEffect(() => { fetchAll() }, []);

  const onAddShift = async (e: any) => {
    e.preventDefault();
    if (!newStaffName) return alert('スタッフを選択してください');
    const YMD = selectedDate.toISOString().split('T')[0];
    await supabase.from('shifts').insert([{ 
      staff_name: newStaffName, 
      start_time: `${YMD}T${startTime}:00`, 
      end_time: `${YMD}T${endTime}:00` 
    }]);
    fetchAll();
    alert('シフトを登録しました');
  }

  const handleAssignRole = async (shiftId: string) => {
    await supabase.from('shifts').update({ role: selectedRoleForShift }).eq('id', shiftId);
    setAssigningShiftId(null);
    fetchAll();
  }

  const renderShiftBadges = (date: Date, isLarge: boolean) => {
    const ds = shifts.filter(s => new Date(s.start_time).toDateString() === date.toDateString());
    return (
      <div className={`mt-1 flex flex-col gap-1 ${isLarge ? 'min-h-[150px]' : ''}`}>
        {ds.map(s => (
          <div key={s.id} className={`${getStaffColor(s.staff_name)} text-white p-1 rounded shadow-sm text-[9px] md:text-[10px]`}>
            <div className="flex justify-between font-bold border-b border-white/20 mb-1">
              <span>{s.staff_name}</span>
              <span>{s.start_time.split('T')[1].slice(0,5)}</span>
            </div>
            {assigningShiftId === s.id ? (
              <div className="flex flex-col gap-1">
                <select className="text-black w-full text-[8px] rounded" value={selectedRoleForShift} onChange={e=>setSelectedRoleForShift(e.target.value)}>
                  <option value="">作業選択</option>
                  {roleMaster.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                </select>
                <button onClick={()=>handleAssignRole(s.id)} className="bg-white text-blue-600 rounded text-[8px] font-bold">決定</button>
              </div>
            ) : (
              <div className="cursor-pointer bg-white/20 rounded px-1 truncate font-bold text-center py-0.5" onClick={()=>{setAssigningShiftId(s.id); setSelectedRoleForShift(s.role||"")}}>
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
        <h1 className="font-black text-blue-600 italic flex items-center gap-2"><LayoutDashboard size={20}/> HIKARI SHIFT MASTER</h1>
      </header>

      <main className="max-w-7xl mx-auto p-4 grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {/* カレンダーエリア */}
          <div className="bg-white p-6 rounded-3xl shadow-xl border">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2 md:gap-4">
                <button onClick={()=>setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth()-1)))} className="p-2 border rounded-full"><ChevronLeft size={18}/></button>
                <span className="font-bold text-sm md:text-lg">{selectedDate.getFullYear()}年{selectedDate.getMonth()+1}月</span>
                <button onClick={()=>setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth()+1)))} className="p-2 border rounded-full"><ChevronRight size={18}/></button>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button onClick={()=>setViewMode('month')} className={`px-4 py-2 rounded-lg ${viewMode==='month'?'bg-white shadow text-blue-600':'text-slate-400'}`}>月</button>
                <button onClick={()=>setViewMode('week')} className={`px-4 py-2 rounded-lg ${viewMode==='week'?'bg-white shadow text-blue-600':'text-slate-400'}`}>週</button>
              </div>
            </div>

            {viewMode === 'month' ? (
              <Calendar onChange={(v:any)=>setSelectedDate(v)} value={selectedDate} tileContent={({date})=>renderShiftBadges(date, false)} locale="ja-JP" className="w-full border-none" />
            ) : (
              <div className="grid grid-cols-7 gap-px bg-slate-200 border rounded-xl overflow-hidden shadow-inner">
                {['月','火','水','木','金','土','日'].map((w,i)=>(<div key={i} className="bg-slate-50 p-2 text-center text-[10px] font-bold">{w}</div>))}
                {[0,1,2,3,4,5,6].map(i => {
                  const d = new Date(selectedDate);
                  const day = d.getDay();
                  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1) + i);
                  return (
                    <div key={i} onClick={()=>setSelectedDate(d)} className={`bg-white p-1 min-h-[200px] ${d.toDateString()===selectedDate.toDateString()?'ring-2 ring-blue-400':''}`}>
                      <div className="text-center font-bold text-xs mb-1">{d.getDate()}</div>
                      {renderShiftBadges(d, true)}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* マスター登録 */}
          <div className="bg-white p-6 rounded-3xl border shadow-lg">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-blue-600"><Settings size={18}/> 担当作業マスター登録</h3>
            <div className="flex gap-2 mb-4">
              <input value={newRoleItem} onChange={e=>setNewRoleItem(e.target.value)} className="flex-1 border p-2 rounded-xl text-sm" placeholder="1号機削り作業 など" />
              <button onClick={async()=>{
                if(!newRoleItem) return;
                await supabase.from('role_master').insert([{name:newRoleItem}]);
                setNewRoleItem(''); fetchAll();
              }} className="bg-blue-600 text-white px-4 rounded-xl font-bold text-sm">登録</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {roleMaster.map(r => (
                <div key={r.id} className="bg-blue-50 border border-blue-100 p-2 px-3 rounded-lg flex items-center gap-2 text-[10px] font-bold text-blue-700">
                  {r.name} <button onClick={async()=>{if(confirm('削除？')){await supabase.from('role_master').delete().eq('id',r.id);fetchAll()}}} className="text-blue-300 hover:text-red-500 font-normal">×</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右サイド：シフト入力フォーム */}
        <div className="lg:col-span-4 space-y-6">
          <form onSubmit={onAddShift} className="bg-white p-6 rounded-3xl shadow-xl border-t-4 border-blue-600 space-y-4 sticky top-24">
            <h3 className="font-bold text-blue-600 flex items-center gap-2"><PlusCircle size={18}/> シフト入力</h3>
            <div className="bg-blue-50 p-4 rounded-2xl text-center font-black text-blue-800">
              {selectedDate.toLocaleDateString('ja-JP',{month:'short',day:'numeric',weekday:'short'})}
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 ml-1 text-xs">スタッフを選択</label>
              <select value={newStaffName} onChange={e=>setNewStaffName(e.target.value)} className="w-full border p-3 rounded-2xl bg-white text-sm outline-none shadow-sm" required>
                <option value="">選択してください</option>
                {staffList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 ml-1">開始</label>
                <input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} className="w-full border p-3 rounded-2xl text-sm outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 ml-1">終了</label>
                <input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)} className="w-full border p-3 rounded-2xl text-sm outline-none" />
              </div>
            </div>
            <button className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all text-sm">
              シフトを登録する
            </button>
            <p className="text-[10px] text-slate-400 text-center">※スタッフの方はここで自分の出勤日を入力してください</p>
          </form>

          {/* 今日の削除用リスト */}
          <div className="bg-white p-5 rounded-3xl border shadow-sm h-60 overflow-y-auto">
            <h3 className="text-xs font-bold text-slate-400 mb-3 border-b pb-2">本日の登録解除</h3>
            {shifts.filter(s => new Date(s.start_time).toDateString() === selectedDate.toDateString()).map(s => (
              <div key={s.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-xl mb-2 border text-[11px]">
                <span className="font-bold">{s.staff_name}</span>
                <button onClick={async()=>{if(confirm('削除しますか？')){await supabase.from('shifts').delete().eq('id',s.id);fetchAll()}}} className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}