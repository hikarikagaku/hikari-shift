"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Calendar from 'react-calendar'
import { Trash2, Users, Settings, LayoutDashboard, ChevronLeft, ChevronRight } from 'lucide-react'
import * as holiday_jp from '@holiday-jp/holiday_jp'
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
  const [start, setStart] = useState('08:00');
  const [end, setEnd] = useState('17:00');
  const [viewMode, setViewMode] = useState<'month' | 'week'>('week');

  const fetchAll = async () => {
    const { data: s } = await supabase.from('shifts').select('*').order('start_time');
    const { data: m } = await supabase.from('staff_members').select('*').order('name');
    const { data: r = [] } = await supabase.from('role_master').select('*').order('name');
    if (s) setShifts(s); if (m) setStaffList(m); if (r) setRoleMaster(r);
  }
  useEffect(() => { fetchAll() }, []);

  const moveWeek = (num: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + (num * 7));
    setSelectedDate(d);
  }

  const onAddShift = async (e: any) => {
    e.preventDefault();
    const staff = e.target.staff.value;
    const role = e.target.role.value;
    if (!staff) return alert('スタッフを選択してください');
    const YMD = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`;
    await supabase.from('shifts').insert([{ 
      staff_name: staff, role, start_time: `${YMD}T${start}:00`, end_time: `${YMD}T${end}:00` 
    }]);
    fetchAll();
  }

  const renderShiftBadges = (date: Date, isLarge: boolean) => {
    const ds = shifts.filter(s => new Date(s.start_time).toDateString() === date.toDateString());
    return (
      <div className={`mt-1 flex flex-col gap-1 ${isLarge ? 'min-h-[160px]' : 'min-h-[35px]'}`}>
        {ds.map(s => (
          <div key={s.id} className={`${getStaffColor(s.staff_name)} text-white p-1 rounded shadow-sm leading-tight text-[9px] md:text-[11px]`}>
            <div className="font-bold border-b border-white/20 mb-0.5 pb-0.5 flex justify-between">
              <span>{s.staff_name}</span>
              {isLarge && <span className="text-[8px] opacity-70">{s.start_time.split('T')[1].slice(0,5)}</span>}
            </div>
            <div className="bg-white/20 rounded px-1 py-0.5 font-medium truncate">
              {s.role || '担当未設定'}
            </div>
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

      <main className="max-w-7xl mx-auto p-4 grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {/* メインカレンダー */}
          <div className="bg-white p-6 rounded-3xl shadow-xl border">
            <div className="flex justify-between items-center mb-6">
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

            {viewMode === 'month' ? (
              <Calendar onChange={(v:any)=>setSelectedDate(v)} value={selectedDate} tileContent={({date}) => renderShiftBadges(date, false)} locale="ja-JP" className="border-none w-full" />
            ) : (
              <div className="grid grid-cols-7 gap-px bg-slate-200 border rounded-2xl overflow-hidden shadow-inner">
                {['日','月','火','水','木','金','土'].map((w, i) => (
                  <div key={i} className={`bg-slate-50 p-2 text-center text-xs font-bold ${i===0?'text-red-500':i===6?'text-blue-500':'text-slate-500'}`}>{w}</div>
                ))}
                {[0,1,2,3,4,5,6].map(i => {
                  const d = new Date(selectedDate);
                  d.setDate(selectedDate.getDate() - selectedDate.getDay() + i);
                  const isSelected = d.toDateString() === selectedDate.toDateString();
                  return (
                    <div key={i} onClick={()=>setSelectedDate(d)} className={`bg-white p-2 cursor-pointer min-h-[250px] ${isSelected ? 'ring-2 ring-inset ring-blue-400 bg-blue-50/30' : ''}`}>
                      <div className={`text-center font-bold text-sm mb-2 ${d.toDateString()===new Date().toDateString()?'text-blue-600 underline':''}`}>{d.getDate()}</div>
                      {renderShiftBadges(d, true)}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* スタッフ名簿 */}
            <div className="bg-white p-6 rounded-3xl border shadow-lg">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-700 text-sm"><Users size={18}/> スタッフ登録</h3>
              <form onSubmit={async(e:any)=>{
                e.preventDefault(); if(!newStaff)return; 
                await supabase.from('staff_members').insert([{name:newStaff}]); 
                setNewStaff(''); fetchAll();
              }} className="flex gap-2 mb-4">
                <input value={newStaff} onChange={e=>setNewStaff(e.target.value)} className="flex-1 border p-2 rounded-xl text-xs" placeholder="スタッフ名" />
                <button className="bg-slate-800 text-white px-4 rounded-xl font-bold text-xs">追加</button>
              </form>
              <div className="flex flex-wrap gap-2">{staffList.map(s => (
                <div key={s.id} className="bg-slate-50 border p-2 px-3 rounded-lg flex items-center gap-2 text-[10px] font-bold">
                  {s.name} <button onClick={async()=>{if(confirm('削除？')){await supabase.from('staff_members').delete().eq('id',s.id);fetchAll()}}} className="text-slate-300 hover:text-red-500">×</button>
                </div>))}
              </div>
            </div>

            {/* 担当マスター（ここをブラウザで入力） */}
            <div className="bg-white p-6 rounded-3xl border shadow-lg border-blue-100">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-blue-700 text-sm"><Settings size={18}/> 担当内容マスター</h3>
              <form onSubmit={async(e:any)=>{
                e.preventDefault(); if(!newRoleItem)return; 
                await supabase.from('role_master').insert([{name:newRoleItem}]); 
                setNewRoleItem(''); fetchAll();
              }} className="flex gap-2 mb-4">
                <input value={newRoleItem} onChange={e=>setNewRoleItem(e.target.value)} className="flex-1 border p-2 rounded-xl border-blue-200 text-xs" placeholder="1号機削り作業 など" />
                <button className="bg-blue-600 text-white px-4 rounded-xl font-bold text-xs">登録</button>
              </form>
              <div className="flex flex-wrap gap-2">{roleMaster.map(r => (
                <div key={r.id} className="bg-blue-50 border border-blue-100 p-2 px-3 rounded-lg flex items-center gap-2 text-[10px] font-bold text-blue-700">
                  {r.name} <button onClick={async()=>{if(confirm('削除？')){await supabase.from('role_master').delete().eq('id',r.id);fetchAll()}}} className="text-blue-300 hover:text-red-500">×</button>
                </div>))}
              </div>
            </div>
          </div>
        </div>

        {/* 右サイド：シフト登録 */}
        <div className="lg:col-span-4 space-y-6">
          <form onSubmit={onAddShift} className="bg-white p-6 rounded-3xl shadow-xl border-t-4 border-blue-600 space-y-4">
            <h3 className="font-bold text-blue-600">本日の作業割り当て</h3>
            <div className="bg-blue-50 p-4 rounded-2xl text-center font-black text-blue-800">
              {selectedDate.toLocaleDateString('ja-JP',{month:'short',day:'numeric',weekday:'short'})}
            </div>
            
            <div>
              <label className="text-[10px] font-bold text-slate-400 ml-1">スタッフ</label>
              <select name="staff" className="w-full border p-3 rounded-2xl bg-white text-sm" required>
                <option value="">選択してください</option>
                {staffList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 ml-1">担当作業（マスターから選択）</label>
              <select name="role" className="w-full border p-3 rounded-2xl bg-white text-sm" required>
                <option value="">作業内容を選択</option>
                {roleMaster.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input type="time" value={start} onChange={e=>setStart(e.target.value)} className="border p-3 rounded-2xl text-sm" />
              <input type="time" value={end} onChange={e=>setEnd(e.target.value)} className="border p-3 rounded-2xl text-sm" />
            </div>
            
            <button className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all">
              登録する
            </button>
          </form>

          {/* 今日のリスト */}
          <div className="bg-white p-5 rounded-3xl border shadow-sm h-72 overflow-y-auto">
            <h3 className="text-xs font-bold text-slate-400 mb-3 border-b pb-2">今日の配置</h3>
            {shifts.filter(s => new Date(s.start_time).toDateString() === selectedDate.toDateString()).map(s => (
              <div key={s.id} className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-2xl mb-2 border shadow-sm">
                <div>
                  <div className="font-bold text-xs">{s.staff_name}</div>
                  <div className="text-[10px] text-blue-600 font-bold">{s.role}</div>
                </div>
                <button onClick={async()=>{if(confirm('削除？')){await supabase.from('shifts').delete().eq('id',s.id);fetchAll()}}} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}