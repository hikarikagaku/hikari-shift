"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Calendar from 'react-calendar'
import { Trash2, PlusCircle, Users, Download, AlertCircle, LayoutDashboard, ChevronLeft, ChevronRight } from 'lucide-react'
import * as XLSX from 'xlsx'
import * as holiday_jp from '@holiday-jp/holiday_jp'
import 'react-calendar/dist/Calendar.css'
import './calendar-custom.css'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

// ★ あなたが使いたい担当のリスト（ここを自由に書き換えてください）
const ROLE_OPTIONS = ['レジ', 'キッチン', 'ホール', '清掃', '品出し', 'マネージャー'];

const getStaffColor = (n: string) => {
  const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];
  let h = 0; for (let i = 0; i < n.length; i++) h = n.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

export default function Home() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newStaff, setNewStaff] = useState('');
  const [newRole, setNewRole] = useState(ROLE_OPTIONS[0]); // 初期値をリストの1番目に
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('18:00');
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [range, setRange] = useState({ s: '', e: '' });

  const fetchAll = async () => {
    const { data: s } = await supabase.from('shifts').select('*').order('start_time');
    const { data: m } = await supabase.from('staff_members').select('*').order('name');
    if (s) setShifts(s); if (m) setStaffList(m);
  }
  useEffect(() => { fetchAll() }, []);

  const moveWeek = (num: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (num * 7));
    setSelectedDate(newDate);
  }

  const onAddShift = async (e: any) => {
    e.preventDefault();
    const staffName = e.target.staff.value;
    if (!staffName) return alert('スタッフを選択してください');
    
    const targetStaff = staffList.find(s => s.name === staffName);
    const YMD = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`;
    
    await supabase.from('shifts').insert([{ 
      staff_name: staffName, 
      start_time: `${YMD}T${start}:00`, 
      end_time: `${YMD}T${end}:00`,
      role: targetStaff?.default_role || '' 
    }]);
    
    fetchAll();
    alert('登録完了');
  }

  const renderShiftBadges = (date: Date, isLarge: boolean) => {
    const ds = shifts.filter(s => new Date(s.start_time).toDateString() === date.toDateString());
    return (
      <div className={`mt-1 flex flex-col gap-0.5 ${isLarge ? 'min-h-[160px]' : 'min-h-[35px]'}`}>
        {ds.map(s => (
          <div key={s.id} className={`text-[8px] md:text-[10px] ${getStaffColor(s.staff_name)} text-white px-1.5 py-0.5 rounded-md truncate shadow-sm`}>
            {s.staff_name}
            {s.role && <span className="ml-1 opacity-90 font-normal border-l border-white/30 pl-1">{s.role}</span>}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-10">
      <header className="bg-white border-b p-4 sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <h1 className="font-black text-blue-600 italic flex items-center gap-2"><LayoutDashboard size={20}/> HIKARI SHIFT PRO</h1>
      </header>

      <main className="max-w-7xl mx-auto p-4 grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {/* カレンダーエリア */}
          <div className="bg-white p-6 rounded-3xl shadow-xl border overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <div className="flex gap-1">
                  <button onClick={()=>moveWeek(-1)} className="p-2 hover:bg-slate-100 rounded-full border shadow-sm transition-colors"><ChevronLeft size={20}/></button>
                  <button onClick={()=>moveWeek(1)} className="p-2 hover:bg-slate-100 rounded-full border shadow-sm transition-colors"><ChevronRight size={20}/></button>
                </div>
                <span className="font-bold text-xl text-slate-700">{selectedDate.toLocaleDateString('ja-JP', {year:'numeric', month:'long', day:'numeric'})}</span>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold shadow-inner">
                <button onClick={()=>setViewMode('month')} className={`px-5 py-2 rounded-lg transition-all ${viewMode==='month'?'bg-white shadow-md text-blue-600':'text-slate-400'}`}>月</button>
                <button onClick={()=>setViewMode('week')} className={`px-5 py-2 rounded-lg transition-all ${viewMode==='week'?'bg-white shadow-md text-blue-600':'text-slate-400'}`}>週</button>
              </div>
            </div>

            {viewMode === 'month' ? (
              <Calendar 
                onChange={(v:any)=>setSelectedDate(v)} 
                value={selectedDate} 
                tileContent={({date}) => renderShiftBadges(date, false)} 
                locale="ja-JP" 
                className="border-none w-full" 
              />
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
                    <div key={i} onClick={()=>setSelectedDate(d)} className={`bg-white p-2 cursor-pointer transition-colors hover:bg-blue-50 min-h-[220px] ${isSelected ? 'ring-2 ring-inset ring-blue-400 bg-blue-50/50' : ''}`}>
                      <div className="text-center font-bold text-sm mb-1">{d.getDate()}</div>
                      {renderShiftBadges(d, true)}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* スタッフ管理：選択式に変更 */}
          <div className="bg-white p-6 rounded-3xl border shadow-lg text-sm">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-700"><Users size={18}/> スタッフ登録（担当を選択）</h3>
            <form onSubmit={async(e:any)=>{
              e.preventDefault(); if(!newStaff)return; 
              await supabase.from('staff_members').insert([{name:newStaff, default_role: newRole}]); 
              setNewStaff(''); fetchAll();
            }} className="flex flex-col md:flex-row gap-2 mb-4">
              <input value={newStaff} onChange={e=>setNewStaff(e.target.value)} className="flex-1 border p-2 rounded-xl outline-none focus:ring-2 ring-blue-100" placeholder="スタッフ名" />
              <select value={newRole} onChange={e=>setNewRole(e.target.value)} className="flex-1 border p-2 rounded-xl bg-white outline-none focus:ring-2 ring-blue-100">
                {ROLE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <button className="bg-slate-800 text-white px-8 rounded-xl font-bold hover:bg-slate-700 transition-colors">登録</button>
            </form>
            <div className="flex flex-wrap gap-2">{staffList.map(s => (
              <div key={s.id} className="bg-slate-50 border p-2 px-3 rounded-lg flex flex-col gap-1 shadow-sm min-w-[120px]">
                <div className="flex justify-between items-center border-b pb-1 mb-1">
                  <span className="font-bold text-[11px]">{s.name}</span>
                  <button onClick={async()=>{if(confirm('削除しますか？')){await supabase.from('staff_members').delete().eq('id',s.id);fetchAll()}}} className="text-slate-300 hover:text-red-500 text-xs">×</button>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">{s.default_role}</span>
                </div>
              </div>))}
            </div>
          </div>
        </div>

        {/* 右サイド：シフト登録 */}
        <div className="lg:col-span-4 space-y-6">
          <form onSubmit={onAddShift} className="bg-white p-6 rounded-3xl shadow-xl border-t-4 border-blue-600 space-y-4">
            <h3 className="font-bold text-blue-600 text-lg">シフト登録</h3>
            <div className="bg-blue-50 p-4 rounded-2xl text-center font-black text-blue-800 shadow-inner">
              {selectedDate.toLocaleDateString('ja-JP',{month:'short',day:'numeric',weekday:'short'})}
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 ml-2">スタッフ選択</label>
              <select name="staff" className="w-full border p-3 rounded-2xl bg-white text-sm outline-none focus:ring-2 ring-blue-100" required>
                <option value="">選択してください</option>
                {staffList.map(s => <option key={s.id} value={s.name}>{s.name} ({s.default_role})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 ml-2">開始</label>
                <input type="time" value={start} onChange={e=>setStart(e.target.value)} className="w-full border p-3 rounded-2xl text-sm outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 ml-2">終了</label>
                <input type="time" value={end} onChange={e=>setEnd(e.target.value)} className="w-full border p-3 rounded-2xl text-sm outline-none" />
              </div>
            </div>
            <button className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform mt-2">
              このスタッフを登録
            </button>
          </form>

          <div className="bg-white p-5 rounded-3xl border shadow-sm h-80 overflow-y-auto">
            <h3 className="text-xs font-bold text-slate-400 mb-3 border-b pb-2">本日のシフト詳細</h3>
            {shifts.filter(s => new Date(s.start_time).toDateString() === selectedDate.toDateString()).map(s => (
              <div key={s.id} className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-2xl mb-2 border hover:bg-white transition-colors shadow-sm">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStaffColor(s.staff_name)}`}></div>
                    <span className="font-bold text-xs">{s.staff_name}</span>
                  </div>
                  <span className="text-[9px] text-blue-600 font-bold ml-4">{s.role}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400 text-[10px] font-mono">
                  {s.start_time.split('T')[1].slice(0,5)}
                  <button onClick={async()=>{if(confirm('削除しますか？')){await supabase.from('shifts').delete().eq('id',s.id);fetchAll()}}} className="hover:text-red-500 transition-colors ml-1"><Trash2 size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}