"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Calendar from 'react-calendar'
import { Trash2, PlusCircle, Clock, Users, Download, AlertCircle, LayoutDashboard, ChevronLeft, ChevronRight } from 'lucide-react'
import * as XLSX from 'xlsx'
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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newStaff, setNewStaff] = useState('');
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
    if (!staffName) return alert('スタッフを選んでください');
    const d = selectedDate;
    if ((holiday_jp.isHoliday(d) || d.getDay() === 0 || d.getDay() === 6) && !confirm('休日ですが登録しますか？')) return;
    const YMD = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    await supabase.from('shifts').insert([{ staff_name: staffName, start_time: `${YMD}T${start}:00`, end_time: `${YMD}T${end}:00` }]);
    fetchAll(); alert('登録完了');
  }

  // ★Excel出力関数（終了時間を追加し、日付順に並べ替え）
  const exportToExcel = () => {
    const sortedData = [...shifts].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    const data = sortedData.map(s => ({
      '日付': new Date(s.start_time).toLocaleDateString('ja-JP'),
      'スタッフ': s.staff_name,
      '開始': s.start_time.split('T')[1].slice(0, 5),
      '終了': s.end_time.split('T')[1].slice(0, 5) // 復活！
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "シフト表");
    XLSX.writeFile(wb, "hikari_shift_report.xlsx");
  }

  const getTileClassName = ({ date, view }: any) => {
    if (view !== 'month') return '';
    if (viewMode === 'week') {
      const s = new Date(selectedDate); s.setDate(selectedDate.getDate() - selectedDate.getDay());
      const e = new Date(s); e.setDate(s.getDate() + 6);
      const cur = new Date(date);
      if (cur < new Date(s.setHours(0,0,0,0)) || cur > new Date(e.setHours(23,59,59,999))) return 'hidden-tile';
    }
    const d = date.getDay();
    if (holiday_jp.isHoliday(date) || d === 0) return 'text-red-500 font-bold';
    if (d === 6) return 'text-blue-500 font-bold';
    return '';
  }

  const tileContent = ({ date }: any) => {
    const ds = shifts.filter(s => new Date(s.start_time).toDateString() === date.toDateString());
    return (
      <div className={`mt-1 flex flex-col gap-0.5 ${viewMode === 'week' ? 'min-h-[120px]' : 'min-h-[35px]'}`}>
        {ds.map(s => (
          <div key={s.id} className={`text-[7px] md:text-[9px] ${getStaffColor(s.staff_name)} text-white px-1 rounded-sm truncate`}>
            {s.staff_name} {viewMode === 'week' && <span className="opacity-80 ml-1">{s.start_time.split('T')[1].slice(0,5)}</span>}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-10">
      <style>{`
        .hidden-tile { display: none !important; }
        .react-calendar__month-view__days { display: flex !important; flex-wrap: wrap !important; }
        ${viewMode === 'week' ? `
          .react-calendar__month-view__days { flex-wrap: nowrap !important; }
          .react-calendar__month-view__days__day { flex-basis: 14.28% !important; max-width: 14.28% !important; min-height: 150px !important; }
          .react-calendar__month-view__weekdays__weekday { flex-basis: 14.28% !important; max-width: 14.28% !important; }
          .react-calendar__month-view__weekdays { display: flex !important; }
          .react-calendar__navigation { display: none !important; }
        ` : ''}
        .react-calendar__tile--active { background: #dbeafe !important; color: #1e40af !important; border-radius: 8px; }
      `}</style>

      <header className="bg-white border-b p-4 sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <h1 className="font-black text-blue-600 italic flex items-center gap-2"><LayoutDashboard size={20}/> HIKARI SHIFT PRO</h1>
        <button onClick={exportToExcel} className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-md flex items-center gap-1">
          <Download size={14}/> Excel出力
        </button>
      </header>

      <main className="max-w-7xl mx-auto p-4 grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-4 rounded-3xl shadow-xl border overflow-hidden">
            <div className="flex justify-between items-center mb-4 px-2">
              <div className="flex items-center gap-2">
                {viewMode === 'week' && (
                  <div className="flex gap-1 mr-2">
                    <button onClick={()=>moveWeek(-1)} className="p-1 hover:bg-slate-100 rounded-full border"><ChevronLeft size={16}/></button>
                    <button onClick={()=>moveWeek(1)} className="p-1 hover:bg-slate-100 rounded-full border"><ChevronRight size={16}/></button>
                  </div>
                )}
                <span className="font-bold text-slate-700">{selectedDate.toLocaleDateString('ja-JP', {year:'numeric', month:'long'})}</span>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-bold">
                <button onClick={()=>setViewMode('month')} className={`px-4 py-1.5 rounded-md ${viewMode==='month'?'bg-white shadow-sm text-blue-600':'text-slate-400'}`}>月</button>
                <button onClick={()=>setViewMode('week')} className={`px-4 py-1.5 rounded-md ${viewMode==='week'?'bg-white shadow-sm text-blue-600':'text-slate-400'}`}>週</button>
              </div>
            </div>
            <Calendar onChange={(v:any)=>setSelectedDate(v)} value={selectedDate} tileContent={tileContent} tileClassName={getTileClassName} locale="ja-JP" className="border-none w-full" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border shadow-lg text-sm">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-700"><Users size={18}/> スタッフ名簿</h3>
              <form onSubmit={async(e)=>{e.preventDefault(); if(!newStaff)return; await supabase.from('staff_members').insert([{name:newStaff}]); setNewStaff(''); fetchAll();}} className="flex gap-2 mb-4">
                <input value={newStaff} onChange={e=>setNewStaff(e.target.value)} className="flex-1 border p-2 rounded-xl outline-none focus:border-blue-400" placeholder="名前を入力" />
                <button className="bg-slate-800 text-white px-4 rounded-xl font-bold">追加</button>
              </form>
              <div className="flex flex-wrap gap-2">{staffList.map(s => (
                <div key={s.id} className="bg-slate-50 border p-2 px-3 rounded-lg flex items-center gap-2 font-bold text-[10px]">
                  <span className={`w-2 h-2 rounded-full ${getStaffColor(s.name)}`}></span>{s.name}
                  <button onClick={async()=>{if(confirm('削除しますか？')){await supabase.from('staff_members').delete().eq('id',s.id);fetchAll()}}} className="text-slate-300 hover:text-red-500 ml-1">×</button>
                </div>))}
              </div>
            </div>
            <div className="bg-red-50 p-6 rounded-3xl border border-red-100 shadow-inner text-sm">
              <h3 className="font-bold text-red-600 mb-4 flex items-center gap-2"><AlertCircle size={18}/> 期間一括削除</h3>
              <div className="flex gap-2 mb-3">
                <input type="date" value={range.s} onChange={e=>setRange({...range, s:e.target.value})} className="flex-1 p-2 rounded-xl border outline-none text-xs" />
                <input type="date" value={range.e} onChange={e=>setRange({...range, e:e.target.value})} className="flex-1 p-2 rounded-xl border outline-none text-xs" />
              </div>
              <button onClick={async()=>{if(!range.s||!range.e||!confirm('指定した期間の全シフトを削除します。よろしいですか？'))return; await supabase.from('shifts').delete().gte('start_time',`${range.s}T00:00:00`).lte('start_time',`${range.e}T23:59:59`); fetchAll(); setRange({s:'',e:''});}} className="w-full bg-red-500 text-white py-2.5 rounded-xl font-bold text-xs hover:bg-red-600">削除を実行する</button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <form onSubmit={onAddShift} className="bg-white p-6 rounded-3xl shadow-xl border-t-4 border-blue-600 space-y-4">
            <h3 className="font-bold text-blue-600 flex items-center gap-2">シフト作成</h3>
            <div className="bg-blue-50 p-4 rounded-2xl text-center font-black text-blue-800 tracking-tight">{selectedDate.toLocaleDateString('ja-JP', {year:'numeric', month:'short', day:'numeric', weekday:'short'})}</div>
            <select name="staff" className="w-full border p-3 rounded-2xl bg-white text-sm outline-none focus:border-blue-400" required>
              <option value="">スタッフを選択</option>
              {staffList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input type="time" value={start} onChange={e=>setStart(e.target.value)} className="border p-3 rounded-2xl text-sm" />
              <input type="time" value={end} onChange={e=>setEnd(e.target.value)} className="border p-3 rounded-2xl text-sm" />
            </div>
            <button className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all">この内容で登録</button>
          </form>

          <div className="bg-white p-5 rounded-3xl border shadow-sm h-72 overflow-y-auto">
            <h3 className="text-xs font-bold text-slate-400 mb-3 border-b pb-2 flex justify-between"><span>SELECTED DATE</span><span>{shifts.filter(s => new Date(s.start_time).toDateString() === selectedDate.toDateString()).length}人</span></h3>
            {shifts.filter(s => new Date(s.start_time).toDateString() === selectedDate.toDateString()).map(s => (
              <div key={s.id} className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-2xl mb-2 border border-slate-100">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStaffColor(s.staff_name)}`}></div>
                  <span className="font-bold text-xs">{s.staff_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono">{s.start_time.split('T')[1].slice(0,5)}</span>
                  <button onClick={async()=>{if(confirm('削除しますか？')){await supabase.from('shifts').delete().eq('id',s.id);fetchAll()}}} className="text-slate-200 hover:text-red-500"><Trash2 size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}