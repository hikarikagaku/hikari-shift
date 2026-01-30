"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Calendar from 'react-calendar'
import { Trash2, Users, Settings, LayoutDashboard, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import 'react-calendar/dist/Calendar.css'
import './calendar-custom.css'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

const getStaffColor = (n: string) => {
  const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];
  let h = 0; for (let i = 0; i < n.length; i++) h = n.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

export default function Home() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [roleMaster, setRoleMaster] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newStaff, setNewStaff] = useState('');
  const [newRoleItem, setNewRoleItem] = useState('');
  const [viewMode, setViewMode] = useState<'month' | 'week'>('week');
  
  // 作業割り当て用の一時状態
  const [assigningRoleId, setAssigningRoleId] = useState<string | null>(null);
  const [selectedRoleForShift, setSelectedRoleForShift] = useState("");

  const fetchAll = async () => {
    const { data: s } = await supabase.from('shifts').select('*').order('start_time');
    const { data: m } = await supabase.from('staff_members').select('*').order('name');
    const { data: r } = await supabase.from('role_master').select('*').order('name');
    if (s) setShifts(s); if (m) setStaffList(m); if (r) setRoleMaster(r);
  }
  useEffect(() => { fetchAll() }, []);

  const moveWeek = (num: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + (num * 7));
    setSelectedDate(d);
  }

  // 作業内容をシフトに割り当てる（上書き更新）
  const handleAssignRole = async (shiftId: string) => {
    if (!selectedRoleForShift) return;
    await supabase.from('shifts').update({ role: selectedRoleForShift }).eq('id', shiftId);
    setAssigningRoleId(null);
    fetchAll();
  }

  const renderShiftBadges = (date: Date, isLarge: boolean) => {
    const ds = shifts.filter(s => new Date(s.start_time).toDateString() === date.toDateString());
    return (
      <div className={`mt-1 flex flex-col gap-1 ${isLarge ? 'min-h-[160px]' : 'min-h-[35px]'}`}>
        {ds.map(s => (
          <div key={s.id} className={`${getStaffColor(s.staff_name)} text-white p-1 rounded shadow-sm leading-tight text-[10px] md:text-[11px] transition-all`}>
            <div className="font-bold border-b border-white/20 mb-0.5 pb-0.5 flex justify-between items-center">
              <span>{s.staff_name}</span>
              <span className="text-[8px] opacity-80">{s.start_time.split('T')[1].slice(0,5)}</span>
            </div>
            
            {assigningRoleId === s.id ? (
              <div className="flex flex-col gap-1 mt-1">
                <select 
                  className="text-slate-800 w-full rounded p-0.5 text-[9px]"
                  value={selectedRoleForShift}
                  onChange={(e) => setSelectedRoleForShift(e.target.value)}
                >
                  <option value="">作業選択</option>
                  {roleMaster.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                </select>
                <button onClick={() => handleAssignRole(s.id)} className="bg-white text-blue-600 rounded font-bold text-[8px] py-0.5">確定</button>
              </div>
            ) : (
              <div 
                className="bg-white/20 rounded px-1 py-0.5 font-medium truncate cursor-pointer hover:bg-white/40"
                onClick={() => {
                  setAssigningRoleId(s.id);
                  setSelectedRoleForShift(s.role || "");
                }}
              >
                {s.role || '⚠️未設定'}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-10 font-sans">
      <header className="bg-white border-b p-4 flex justify-between items-center shadow-sm sticky top-0 z-50">
        <h1 className="font-black text-blue-600 italic flex items-center gap-2"><LayoutDashboard size={20}/> HIKARI SHIFT MASTER</h1>
      </header>

      <main className="max-w-7xl mx-auto p-4 flex flex-col gap-6">
        {/* メインカレンダー */}
        <div className="bg-white p-6 rounded-3xl shadow-xl border">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                <button onClick={()=>moveWeek(-1)} className="p-2 hover:bg-slate-100 rounded-full border"><ChevronLeft size={20}/></button>
                <button onClick={()=>moveWeek(1)} className="p-2 hover:bg-slate-100 rounded-full border"><ChevronRight size={20}/></button>
              </div>
              <span className="font-bold text-xl text-slate-700">{selectedDate.toLocaleDateString('ja-JP', {year:'numeric', month:'long', day:'numeric'})}</span>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold shadow-inner">
              <button onClick={()=>setViewMode('month')} className={`px-5 py-2 rounded-lg ${viewMode==='month'?'bg-white shadow-md text-blue-600':'text-slate-400'}`}>月</button>
              <button onClick={()=>setViewMode('week')} className={`px-5 py-2 rounded-lg ${viewMode==='week'?'bg-white shadow-md text-blue-600':'text-slate-400'}`}>週</button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-slate-200 border rounded-2xl overflow-hidden shadow-inner">
            {['月','火','水','木','金','土','日'].map((w, i) => (
              <div key={i} className={`bg-slate-50 p-2 text-center text-xs font-bold ${i===5?'text-blue-500':i===6?'text-red-500':'text-slate-500'}`}>{w}</div>
            ))}
            {[0,1,2,3,4,5,6].map(i => {
              const d = new Date(selectedDate);
              const dayOfWeek = selectedDate.getDay();
              const diff = i - (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
              d.setDate(selectedDate.getDate() + diff);
              
              const isSelected = d.toDateString() === selectedDate.toDateString();
              return (
                <div key={i} onClick={()=>setSelectedDate(d)} className={`bg-white p-2 cursor-pointer min-h-[200px] ${isSelected ? 'ring-2 ring-inset ring-blue-400 bg-blue-50/30' : ''}`}>
                  <div className={`text-center font-bold text-sm mb-2 ${d.toDateString()===new Date().toDateString()?'text-blue-600 underline':''}`}>{d.getDate()}</div>
                  {renderShiftBadges(d, true)}
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[10px] text-slate-400">※名前の下の「未設定」をクリックして、作業内容を選んでください。</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 作業内容マスター（管理者用） */}
          <div className="bg-white p-6 rounded-3xl border shadow-lg border-blue-100">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-blue-700 text-sm"><Settings size={18}/> 担当作業マスター登録</h3>
            <form onSubmit={async(e:any)=>{
              e.preventDefault(); if(!newRoleItem)return; 
              await supabase.from('role_master').insert([{name:newRoleItem}]); 
              setNewRoleItem(''); fetchAll();
            }} className="flex gap-2 mb-4">
              <input value={newRoleItem} onChange={e=>setNewRoleItem(e.target.value)} className="flex-1 border p-2 rounded-xl border-blue-200 text-xs" placeholder="例：1号機削り作業" />
              <button className="bg-blue-600 text-white px-4 rounded-xl font-bold text-xs">登録</button>
            </form>
            <div className="flex flex-wrap gap-2">{roleMaster.map(r => (
              <div key={r.id} className="bg-blue-50 border border-blue-100 p-2 px-3 rounded-lg flex items-center gap-2 text-[10px] font-bold text-blue-700">
                {r.name} <button onClick={async()=>{if(confirm('削除？')){await supabase.from('role_master').delete().eq('id',r.id);fetchAll()}}} className="text-blue-300 hover:text-red-500">×</button>
              </div>))}
            </div>
          </div>

          {/* スタッフ名簿（サブ） */}
          <div className="bg-white p-6 rounded-3xl border shadow-lg">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-700 text-sm"><Users size={18}/> スタッフ名簿</h3>
            <div className="flex flex-wrap gap-2">{staffList.map(s => (
              <div key={s.id} className="bg-slate-50 border p-2 px-3 rounded-lg text-[10px] font-bold">{s.name}</div>
            ))}</div>
          </div>
        </div>
      </main>
    </div>
  )
}