'use client'

// ============================================================
//  app/page.tsx  —  シフト管理アプリ
//  Next.js App Router 用
// ============================================================

import { useEffect, useRef } from 'react'

const APP_HTML = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SHIFT</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&family=DM+Mono:wght@400;500&family=Syne:wght@600;700;800&display=swap" rel="stylesheet">
<style>
:root{--bg:#0d0f14;--surface:#151820;--surface2:#1c2030;--border:#252a38;--accent:#5b8fff;--accent2:#a78bfa;--green:#34d399;--amber:#fbbf24;--red:#f87171;--text:#e8eaf0;--text-muted:#6b7280;--text-dim:#9ca3af}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Noto Sans JP',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;overflow-x:hidden}
header{display:flex;align-items:center;justify-content:space-between;padding:0 2rem;height:60px;border-bottom:1px solid var(--border);background:rgba(13,15,20,.9);backdrop-filter:blur(12px);position:sticky;top:0;z-index:100}
.logo{font-family:'Syne',sans-serif;font-weight:800;font-size:1.3rem;letter-spacing:.12em;background:linear-gradient(135deg,var(--accent),var(--accent2));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.header-nav{display:flex;gap:.25rem}
.nav-btn{background:none;border:1px solid transparent;color:var(--text-dim);padding:.4rem 1rem;border-radius:6px;font-family:'Noto Sans JP',sans-serif;font-size:.82rem;cursor:pointer;transition:all .2s}
.nav-btn:hover{background:var(--surface2);color:var(--text)}
.nav-btn.active{background:var(--surface2);color:var(--accent);border-color:var(--border)}
.export-btn{background:linear-gradient(135deg,var(--accent),var(--accent2));color:white;border:none;padding:.45rem 1.1rem;border-radius:6px;font-family:'Noto Sans JP',sans-serif;font-size:.82rem;font-weight:500;cursor:pointer;transition:opacity .2s}
.export-btn:hover{opacity:.85}
.main{display:grid;grid-template-columns:1fr 320px;gap:0;min-height:calc(100vh - 60px)}
.calendar-area{padding:1.5rem 2rem;border-right:1px solid var(--border)}
.cal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem}
.cal-title{font-family:'Syne',sans-serif;font-size:1.4rem;font-weight:700;color:var(--text)}
.cal-nav{display:flex;align-items:center;gap:.5rem}
.cal-nav button{background:var(--surface);border:1px solid var(--border);color:var(--text-dim);width:32px;height:32px;border-radius:6px;cursor:pointer;font-size:.9rem;transition:all .15s;display:flex;align-items:center;justify-content:center}
.cal-nav button:hover{background:var(--surface2);color:var(--text)}
.view-toggle{display:flex;background:var(--surface);border:1px solid var(--border);border-radius:6px;overflow:hidden}
.view-toggle button{background:none;border:none;color:var(--text-dim);padding:.35rem .8rem;font-family:'Noto Sans JP',sans-serif;font-size:.78rem;cursor:pointer;transition:all .15s}
.view-toggle button.active{background:var(--surface2);color:var(--accent)}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px}
.cal-weekday{text-align:center;font-family:'DM Mono',monospace;font-size:.72rem;color:var(--text-muted);padding:.5rem 0;letter-spacing:.05em}
.cal-weekday.sat{color:var(--accent)}.cal-weekday.sun{color:var(--red)}
.cal-cell{background:var(--surface);border:1px solid var(--border);border-radius:6px;min-height:88px;padding:6px;cursor:pointer;transition:all .15s;position:relative;overflow:hidden}
.cal-cell:hover{background:var(--surface2);border-color:var(--accent)}
.cal-cell.other-month{opacity:.3}
.cal-cell.today{border-color:var(--accent)}
.cal-cell.today .cal-date{color:var(--accent)}
.cal-cell.selected{background:rgba(91,143,255,.1);border-color:var(--accent)}
.cal-date{font-family:'DM Mono',monospace;font-size:.78rem;color:var(--text-dim);display:block;margin-bottom:4px}
.cal-cell.sat .cal-date{color:var(--accent)}.cal-cell.sun .cal-date{color:var(--red)}
.shift-chip{display:flex;align-items:center;gap:3px;font-size:.65rem;padding:2px 5px;border-radius:3px;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.shift-chip .dot{width:5px;height:5px;border-radius:50%;flex-shrink:0}
.sidebar{display:flex;flex-direction:column;gap:0}
.sidebar-section{padding:1.5rem;border-bottom:1px solid var(--border)}
.section-title{font-family:'Syne',sans-serif;font-size:.78rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);margin-bottom:1rem;display:flex;align-items:center;justify-content:space-between}
.add-btn{background:var(--surface2);border:1px solid var(--border);color:var(--accent);width:22px;height:22px;border-radius:4px;cursor:pointer;font-size:.9rem;display:flex;align-items:center;justify-content:center;transition:all .15s}
.add-btn:hover{background:var(--accent);color:white}
.work-type-list{display:flex;flex-direction:column;gap:.4rem;margin-bottom:.8rem}
.work-type-item{display:flex;align-items:center;gap:.6rem;padding:.45rem .6rem;background:var(--surface);border:1px solid var(--border);border-radius:6px;font-size:.82rem}
.work-color{width:10px;height:10px;border-radius:50%;flex-shrink:0}
.work-name{flex:1;color:var(--text)}
.work-time{font-family:'DM Mono',monospace;font-size:.72rem;color:var(--text-muted)}
.del-btn{background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:.75rem;padding:2px 4px;border-radius:3px;transition:all .15s}
.del-btn:hover{background:rgba(248,113,113,.15);color:var(--red)}
.form-row{display:flex;flex-direction:column;gap:.4rem;margin-bottom:.6rem}
label{font-size:.72rem;color:var(--text-muted);letter-spacing:.03em}
input,select{background:var(--surface);border:1px solid var(--border);color:var(--text);padding:.5rem .7rem;border-radius:6px;font-family:'Noto Sans JP',sans-serif;font-size:.82rem;width:100%;transition:border-color .15s;outline:none}
input:focus,select:focus{border-color:var(--accent)}
input[type=color]{padding:.2rem;height:36px;cursor:pointer}
.input-row{display:grid;grid-template-columns:1fr 1fr;gap:.5rem}
.form-btn{width:100%;background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;color:white;padding:.55rem;border-radius:6px;font-family:'Noto Sans JP',sans-serif;font-size:.82rem;font-weight:500;cursor:pointer;transition:opacity .2s;margin-top:.4rem}
.form-btn:hover{opacity:.85}
.selected-date-label{font-family:'DM Mono',monospace;font-size:.78rem;color:var(--accent);background:rgba(91,143,255,.1);padding:.3rem .6rem;border-radius:4px;display:inline-block;margin-bottom:.8rem}
.staff-grid{display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:.8rem}
.staff-badge{display:flex;align-items:center;gap:.4rem;background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:.3rem .7rem .3rem .4rem;font-size:.78rem;color:var(--text)}
.staff-avatar{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.6rem;font-weight:700;color:white;flex-shrink:0}
.assignment-list{display:flex;flex-direction:column;gap:.4rem;max-height:280px;overflow-y:auto}
.assignment-item{background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:.6rem .7rem;display:flex;align-items:center;gap:.6rem;font-size:.8rem;animation:fadeIn .2s ease}
.assignment-type{font-size:.7rem;padding:2px 7px;border-radius:3px;font-weight:500}
.empty-state{text-align:center;color:var(--text-muted);font-size:.8rem;padding:2rem 0}
@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
.week-grid{display:grid;grid-template-columns:56px repeat(7,1fr);gap:0;border:1px solid var(--border);border-radius:8px;overflow:hidden}
.week-header-cell{background:var(--surface);border-bottom:1px solid var(--border);border-right:1px solid var(--border);padding:.6rem .4rem;text-align:center}
.week-header-cell:last-child{border-right:none}
.week-header-cell.time-gutter{background:var(--bg)}
.week-day-name{font-family:'DM Mono',monospace;font-size:.68rem;color:var(--text-muted);letter-spacing:.05em}
.week-day-name.sat{color:var(--accent)}.week-day-name.sun{color:var(--red)}
.week-day-num{font-family:'Syne',sans-serif;font-size:1.1rem;font-weight:700;color:var(--text);display:block;margin-top:2px}
.week-day-num.today-num{color:white;background:var(--accent);width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:2px auto 0;font-size:.9rem}
.week-day-num.sat{color:var(--accent)}.week-day-num.sun{color:var(--red)}
.week-time-slot{background:var(--bg);border-right:1px solid var(--border);border-bottom:1px solid var(--border);padding:0 6px;height:48px;display:flex;align-items:flex-start;padding-top:4px;font-family:'DM Mono',monospace;font-size:.62rem;color:var(--text-muted);user-select:none}
.week-day-col{border-right:1px solid var(--border);border-bottom:1px solid var(--border);height:48px;position:relative;cursor:pointer;transition:background .1s}
.week-day-col:last-child{border-right:none}
.week-day-col:hover{background:rgba(91,143,255,.05)}
.week-day-col.selected-col{background:rgba(91,143,255,.08)}
.week-shift-block{position:absolute;left:2px;right:2px;border-radius:4px;padding:2px 5px;font-size:.62rem;font-weight:500;overflow:hidden;cursor:pointer;z-index:2;transition:opacity .15s;line-height:1.3}
.week-shift-block:hover{opacity:.8}
.week-scroll-wrap{max-height:calc(100vh - 180px);overflow-y:auto;border-radius:0 0 8px 8px}
.history-area{margin-top:1.5rem;border:1px solid var(--border);border-radius:10px;overflow:hidden}
.history-header{display:flex;align-items:center;justify-content:space-between;padding:.8rem 1rem;background:var(--surface);border-bottom:1px solid var(--border);gap:1rem}
.history-title{font-family:'Syne',sans-serif;font-size:.78rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);white-space:nowrap}
.history-search{background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:.35rem .7rem;border-radius:6px;font-family:'Noto Sans JP',sans-serif;font-size:.78rem;width:220px;outline:none;transition:border-color .15s}
.history-search:focus{border-color:var(--accent)}
.history-clear-btn{background:none;border:1px solid var(--border);color:var(--text-muted);padding:.35rem .7rem;border-radius:6px;font-family:'Noto Sans JP',sans-serif;font-size:.75rem;cursor:pointer;white-space:nowrap;transition:all .15s}
.history-clear-btn:hover{border-color:var(--red);color:var(--red);background:rgba(248,113,113,.08)}
.history-table-wrap{overflow-x:auto;max-height:260px;overflow-y:auto}
.history-table{width:100%;border-collapse:collapse;font-size:.8rem}
.history-table thead th{position:sticky;top:0;background:var(--surface);color:var(--text-muted);font-family:'DM Mono',monospace;font-size:.68rem;font-weight:500;letter-spacing:.05em;text-align:left;padding:.5rem .8rem;border-bottom:1px solid var(--border);white-space:nowrap}
.history-table tbody tr{border-bottom:1px solid var(--border);transition:background .1s;animation:fadeIn .2s ease}
.history-table tbody tr:last-child{border-bottom:none}
.history-table tbody tr:hover{background:var(--surface)}
@keyframes highlightRow{0%{background:rgba(91,143,255,.15)}100%{background:transparent}}
.history-table tbody tr.new-row{animation:highlightRow 1.2s ease}
.history-table td{padding:.55rem .8rem;color:var(--text);white-space:nowrap}
.td-date{font-family:'DM Mono',monospace;font-size:.75rem;color:var(--text-dim)}
.td-dow{font-family:'DM Mono',monospace;font-size:.72rem;font-weight:600}
.td-time{font-family:'DM Mono',monospace;font-size:.75rem;color:var(--text-dim)}
.td-duration{font-family:'DM Mono',monospace;font-size:.75rem;color:var(--green)}
.history-staff-badge{display:inline-flex;align-items:center;gap:5px;background:var(--surface2);border-radius:20px;padding:2px 8px 2px 4px;font-size:.75rem}
.history-staff-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.history-work-badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:.72rem;font-weight:500}
.history-empty{text-align:center;color:var(--text-muted);font-size:.8rem;padding:2rem 0;display:none}
.history-empty.show{display:block}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
.mobile-bottom-nav{display:none;position:fixed;bottom:0;left:0;right:0;height:56px;background:rgba(13,15,20,.97);backdrop-filter:blur(16px);border-top:1px solid var(--border);z-index:200}
.mobile-bottom-nav-inner{display:flex;height:100%;align-items:stretch}
.mb-nav-btn{flex:1;background:none;border:none;color:var(--text-muted);font-family:'Noto Sans JP',sans-serif;font-size:.65rem;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;transition:color .15s;padding:0;position:relative}
.mb-nav-btn .mb-icon{font-size:1.2rem;line-height:1}
.mb-nav-btn.active{color:var(--accent)}
.mb-nav-btn.active::before{content:'';position:absolute;top:0;left:20%;right:20%;height:2px;background:var(--accent);border-radius:0 0 2px 2px}
.mobile-panel{display:none;position:fixed;bottom:56px;left:0;right:0;max-height:82vh;background:var(--surface);border-top:1px solid var(--border);border-radius:18px 18px 0 0;z-index:190;overflow-y:auto;-webkit-overflow-scrolling:touch}
.mobile-panel.open{display:block;animation:panelUp .25s cubic-bezier(.32,.72,0,1)}
@keyframes panelUp{from{transform:translateY(60%);opacity:0}to{transform:translateY(0);opacity:1}}
.mobile-panel-handle{display:flex;justify-content:center;padding:.8rem 0 .4rem;position:sticky;top:0;background:var(--surface);z-index:1}
.mobile-panel-handle::before{content:'';width:36px;height:4px;background:var(--border);border-radius:2px}
.mobile-panel-body{padding:0 1rem 2rem}
.mobile-backdrop{display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:180}
.mobile-backdrop.open{display:block}
.modal-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(4px);z-index:200;align-items:center;justify-content:center}
.modal-overlay.open{display:flex}
.modal{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.5rem;width:340px;animation:slideUp .2s ease}
@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.modal-title{font-family:'Syne',sans-serif;font-size:1rem;font-weight:700;margin-bottom:1rem;display:flex;justify-content:space-between;align-items:center}
.modal-close{background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:1.1rem;line-height:1}
.toast{position:fixed;bottom:1.5rem;right:1.5rem;background:var(--surface2);border:1px solid var(--border);border-left:3px solid var(--green);color:var(--text);padding:.7rem 1rem;border-radius:8px;font-size:.82rem;z-index:300;animation:toastIn .2s ease;display:none}
.toast.show{display:block}
@keyframes toastIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@media(max-width:768px){
  header{padding:0 1rem;height:52px}
  .header-nav{display:none}
  .export-btn{font-size:.75rem;padding:.38rem .75rem}
  .main{grid-template-columns:1fr;min-height:auto;padding-bottom:64px}
  .calendar-area{padding:.9rem .9rem 1rem;border-right:none}
  .cal-title{font-size:1.05rem}
  .cal-cell{min-height:62px;padding:4px}
  .cal-date{font-size:.7rem}
  .shift-chip{font-size:.58rem;padding:1px 4px}
  .sidebar{display:none}
  .mobile-bottom-nav{display:block}
  .history-header{flex-direction:column;align-items:flex-start;gap:.5rem}
  .history-search{width:100%;box-sizing:border-box}
  .history-area{margin-top:1rem;border-radius:8px}
  .history-table-wrap{max-height:240px}
  .week-scroll-wrap{max-height:calc(100vh - 200px)}
}
@media(max-width:420px){
  .cal-cell{min-height:50px;padding:3px}
  .shift-chip:not(:first-of-type){display:none}
}
</style>
</head>
<body>
<header>
  <div class="logo">SHIFT</div>
  <div class="header-nav">
    <button class="nav-btn active" onclick="switchView('month')">月表示</button>
    <button class="nav-btn" onclick="switchView('week')">週表示</button>
  </div>
  <button class="export-btn" onclick="exportCSV()">📥 CSV出力</button>
</header>
<div class="main">
  <div class="calendar-area">
    <div class="cal-header">
      <div class="cal-nav">
        <button onclick="prevPeriod()">‹</button>
        <span class="cal-title" id="calTitle"></span>
        <button onclick="nextPeriod()">›</button>
      </div>
      <div class="view-toggle">
        <button id="vt-month" class="active" onclick="switchView('month')">月</button>
        <button id="vt-week" onclick="switchView('week')">週</button>
      </div>
    </div>
    <div class="cal-grid" id="calGrid"></div>
    <div class="history-area">
      <div class="history-header">
        <span class="history-title">入力履歴</span>
        <div style="display:flex;gap:.5rem;align-items:center">
          <input class="history-search" id="historySearch" placeholder="🔍 スタッフ・作業で絞り込み" oninput="renderHistory()">
          <button class="history-clear-btn" onclick="clearAllShifts()">全削除</button>
        </div>
      </div>
      <div class="history-table-wrap">
        <table class="history-table">
          <thead><tr><th>日付</th><th>曜日</th><th>スタッフ</th><th>作業内容</th><th>開始</th><th>終了</th><th>時間</th><th></th></tr></thead>
          <tbody id="historyBody"></tbody>
        </table>
        <div class="history-empty" id="historyEmpty">まだシフトが登録されていません</div>
      </div>
    </div>
  </div>
  <div class="sidebar">
    <div class="sidebar-section">
      <div class="section-title">作業内容マスター <button class="add-btn" onclick="openModal('work')">+</button></div>
      <div class="work-type-list" id="workTypeList"></div>
    </div>
    <div class="sidebar-section">
      <div class="section-title">スタッフ <button class="add-btn" onclick="openModal('staff')">+</button></div>
      <div class="staff-grid" id="staffGrid"></div>
    </div>
    <div class="sidebar-section">
      <div class="section-title">シフト登録</div>
      <div class="selected-date-label" id="selectedDateLabel">日付を選択してください</div>
      <div class="form-row"><label>スタッフ</label><select id="shiftStaff"><option value="">選択してください</option></select></div>
      <div class="form-row"><label>作業内容</label><select id="shiftWork"><option value="">選択してください</option></select></div>
      <div class="input-row">
        <div class="form-row"><label>開始</label><input type="time" id="shiftStart" value="08:30"></div>
        <div class="form-row"><label>終了</label><input type="time" id="shiftEnd" value="17:30"></div>
      </div>
      <button class="form-btn" onclick="saveShift()">保存する</button>
    </div>
    <div class="sidebar-section" style="flex:1">
      <div class="section-title">担当割当</div>
      <div class="assignment-list" id="assignmentList"><div class="empty-state">シフトが登録されていません</div></div>
    </div>
  </div>
</div>
<div class="mobile-backdrop" id="mobileBackdrop" onclick="closeMobilePanel()"></div>
<div class="mobile-panel" id="mobilePanel">
  <div class="mobile-panel-handle"></div>
  <div class="mobile-panel-body" id="mobilePanelBody"></div>
</div>
<nav class="mobile-bottom-nav">
  <div class="mobile-bottom-nav-inner">
    <button class="mb-nav-btn active" id="mb-cal" onclick="switchMobileTab('cal')"><span class="mb-icon">📅</span>カレンダー</button>
    <button class="mb-nav-btn" id="mb-reg" onclick="switchMobileTab('reg')"><span class="mb-icon">✏️</span>シフト登録</button>
    <button class="mb-nav-btn" id="mb-staff" onclick="switchMobileTab('staff')"><span class="mb-icon">👥</span>スタッフ</button>
    <button class="mb-nav-btn" id="mb-work" onclick="switchMobileTab('work')"><span class="mb-icon">🔧</span>作業</button>
    <button class="mb-nav-btn" id="mb-csv" onclick="exportCSV()"><span class="mb-icon">📥</span>CSV</button>
  </div>
</nav>
<div class="modal-overlay" id="workModal">
  <div class="modal">
    <div class="modal-title">作業内容を追加 <button class="modal-close" onclick="closeModal('work')">×</button></div>
    <div class="form-row"><label>作業名</label><input id="workName" placeholder="例：2号機削り"></div>
    <div class="input-row">
      <div class="form-row"><label>開始時刻</label><input type="time" id="workStart" value="08:30"></div>
      <div class="form-row"><label>終了時刻</label><input type="time" id="workEnd" value="17:30"></div>
    </div>
    <div class="form-row"><label>カラー</label><input type="color" id="workColor" value="#5b8fff"></div>
    <button class="form-btn" onclick="addWorkType()">追加する</button>
  </div>
</div>
<div class="modal-overlay" id="staffModal">
  <div class="modal">
    <div class="modal-title">スタッフを追加 <button class="modal-close" onclick="closeModal('staff')">×</button></div>
    <div class="form-row"><label>氏名</label><input id="staffName" placeholder="山田 太郎"></div>
    <div class="form-row"><label>カラー</label><input type="color" id="staffColor" value="#34d399"></div>
    <button class="form-btn" onclick="addStaff()">登録する</button>
  </div>
</div>
<div class="toast" id="toast"></div>
<script>
let workTypes=[{id:1,name:'2号機削り',start:'08:30',end:'17:30',color:'#5b8fff'},{id:2,name:'２階宮藤先生',start:'08:30',end:'17:30',color:'#a78bfa'},{id:3,name:'平板取込',start:'08:30',end:'17:30',color:'#34d399'},{id:4,name:'2階割り機',start:'08:30',end:'17:30',color:'#fbbf24'}];
let staffList=[{id:1,name:'山本',color:'#5b8fff'},{id:2,name:'壽',color:'#34d399'},{id:3,name:'げんさん',color:'#f87171'}];
let shifts=[{id:1,date:'2026-02-20',staffId:1,workTypeId:1,start:'08:30',end:'17:30'},{id:2,date:'2026-02-20',staffId:2,workTypeId:1,start:'08:30',end:'17:30'},{id:3,date:'2026-02-19',staffId:2,workTypeId:1,start:'08:30',end:'17:30'},{id:4,date:'2026-02-19',staffId:1,workTypeId:1,start:'08:30',end:'17:30'},{id:5,date:'2026-02-17',staffId:1,workTypeId:1,start:'08:30',end:'17:30'},{id:6,date:'2026-02-17',staffId:2,workTypeId:1,start:'08:30',end:'17:30'},{id:7,date:'2026-02-13',staffId:1,workTypeId:2,start:'08:30',end:'17:30'},{id:8,date:'2026-02-13',staffId:3,workTypeId:3,start:'08:30',end:'17:30'},{id:9,date:'2026-02-13',staffId:2,workTypeId:1,start:'08:30',end:'17:30'},{id:10,date:'2026-02-12',staffId:3,workTypeId:1,start:'08:30',end:'17:30'},{id:11,date:'2026-02-12',staffId:2,workTypeId:1,start:'08:30',end:'17:30'},{id:12,date:'2026-02-12',staffId:1,workTypeId:2,start:'08:30',end:'17:30'},{id:13,date:'2026-02-10',staffId:2,workTypeId:1,start:'08:30',end:'17:30'},{id:14,date:'2026-02-10',staffId:3,workTypeId:1,start:'08:30',end:'17:30'},{id:15,date:'2026-02-10',staffId:1,workTypeId:2,start:'08:30',end:'17:30'},{id:16,date:'2026-02-09',staffId:1,workTypeId:2,start:'08:30',end:'17:30'},{id:17,date:'2026-02-09',staffId:3,workTypeId:1,start:'08:30',end:'17:30'},{id:18,date:'2026-02-09',staffId:2,workTypeId:1,start:'08:30',end:'17:30'},{id:19,date:'2026-02-06',staffId:2,workTypeId:1,start:'08:30',end:'17:30'},{id:20,date:'2026-02-06',staffId:1,workTypeId:1,start:'08:30',end:'17:30'},{id:21,date:'2026-02-05',staffId:3,workTypeId:1,start:'08:30',end:'17:30'},{id:22,date:'2026-02-05',staffId:1,workTypeId:4,start:'08:30',end:'17:30'},{id:23,date:'2026-02-05',staffId:2,workTypeId:1,start:'08:30',end:'17:30'},{id:24,date:'2026-02-02',staffId:2,workTypeId:1,start:'08:30',end:'17:30'},{id:25,date:'2026-02-02',staffId:1,workTypeId:1,start:'08:30',end:'17:30'},{id:26,date:'2026-01-30',staffId:1,workTypeId:1,start:'09:00',end:'18:00'},{id:27,date:'2026-01-30',staffId:2,workTypeId:1,start:'09:00',end:'18:00'}];
let currentDate=new Date(2026,1,1),selectedDate=null,currentView='month',nextId=200;
const WEEK_DAYS=['月','火','水','木','金','土','日'],WEEK_DAYS_CLASS=['','','','','','sat','sun'];
function formatDate(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function formatDateJP(s){if(!s)return'---';const[y,m,d]=s.split('-');return y+'年'+parseInt(m)+'月'+parseInt(d)+'日'}
function calcDuration(start,end){const[sh,sm]=start.split(':').map(Number);const[eh,em]=end.split(':').map(Number);const sM=sh*60+sm,eM=eh*60+em;let w=eM-sM;if(w<=0)return'-';const os=Math.max(sM,720),oe=Math.min(eM,780);if(oe>os)w-=(oe-os);if(w<=0)return'-';const h=Math.floor(w/60),mn=w%60;return mn===0?h+'h':h+'h'+mn+'m'}
function getWeekStart(d){const s=new Date(d);s.setDate(d.getDate()-(d.getDay()+6)%7);s.setHours(0,0,0,0);return s}
function init(){renderWorkTypes();renderStaff();renderCalendar();renderAssignments();renderHistory();updateDateLabel()}
function renderCalendar(){if(currentView==='week'){renderWeekView();return}const grid=document.getElementById('calGrid');grid.style.display='grid';grid.innerHTML='';const title=document.getElementById('calTitle');const y=currentDate.getFullYear(),mo=currentDate.getMonth();title.textContent=y+'年'+(mo+1)+'月';WEEK_DAYS.forEach((d,i)=>{const el=document.createElement('div');el.className='cal-weekday '+WEEK_DAYS_CLASS[i];el.textContent=d;grid.appendChild(el)});const firstDay=new Date(y,mo,1);let startDow=(firstDay.getDay()+6)%7;const dim=new Date(y,mo+1,0).getDate(),prevDays=new Date(y,mo,0).getDate(),today=formatDate(new Date());const makeCell=(ds,day,other,dow,isToday)=>{const cell=document.createElement('div');cell.className='cal-cell'+(other?' other-month':'')+(isToday?' today':'')+(ds===selectedDate?' selected':'')+(dow===5?' sat':'')+(dow===6?' sun':'');const dateEl=document.createElement('span');dateEl.className='cal-date';dateEl.textContent=day;cell.appendChild(dateEl);shifts.filter(s=>s.date===ds).slice(0,3).forEach(s=>{const wt=workTypes.find(w=>w.id===s.workTypeId),st=staffList.find(x=>x.id===s.staffId);if(!wt||!st)return;const chip=document.createElement('div');chip.className='shift-chip';chip.style.background=wt.color+'22';chip.style.color=wt.color;chip.innerHTML='<span class="dot" style="background:'+st.color+'"></span>'+st.name.split(' ')[0];cell.appendChild(chip)});cell.onclick=()=>selectDate(ds);return cell};for(let i=startDow-1;i>=0;i--)grid.appendChild(makeCell(formatDate(new Date(y,mo-1,prevDays-i)),prevDays-i,true));for(let d=1;d<=dim;d++){const ds=formatDate(new Date(y,mo,d));const dow=(new Date(y,mo,d).getDay()+6)%7;grid.appendChild(makeCell(ds,d,false,dow,ds===today))}const total=startDow+dim,rem=Math.ceil(total/7)*7-total;for(let d=1;d<=rem;d++)grid.appendChild(makeCell(formatDate(new Date(y,mo+1,d)),d,true))}
function selectDate(ds){selectedDate=ds;renderCalendar();updateDateLabel();renderAssignments();const lbl=document.getElementById('mobileDateLabel');if(lbl)lbl.textContent=formatDateJP(ds)}
function updateDateLabel(){document.getElementById('selectedDateLabel').textContent=selectedDate?formatDateJP(selectedDate):'日付を選択してください'}
function prevPeriod(){if(currentView==='month')currentDate=new Date(currentDate.getFullYear(),currentDate.getMonth()-1,1);else currentDate=new Date(currentDate.getTime()-7*86400000);renderCalendar()}
function nextPeriod(){if(currentView==='month')currentDate=new Date(currentDate.getFullYear(),currentDate.getMonth()+1,1);else currentDate=new Date(currentDate.getTime()+7*86400000);renderCalendar()}
function switchView(v){currentView=v;document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));document.querySelectorAll('.nav-btn').forEach(b=>{if(b.textContent.trim()===(v==='month'?'月表示':'週表示'))b.classList.add('active')});document.querySelectorAll('.view-toggle button').forEach(b=>b.classList.remove('active'));document.getElementById('vt-'+v).classList.add('active');renderCalendar()}
function renderWeekView(){const grid=document.getElementById('calGrid');grid.innerHTML='';grid.style.display='block';const title=document.getElementById('calTitle');const ws=getWeekStart(currentDate),we=new Date(ws.getTime()+6*86400000);const sy=ws.getFullYear(),sm=ws.getMonth()+1,sd=ws.getDate(),ey=we.getFullYear(),em=we.getMonth()+1,ed=we.getDate();title.textContent=(sy===ey&&sm===em)?sy+'年'+sm+'月 '+sd+'日–'+ed+'日':sy+'/'+sm+'/'+sd+' – '+ey+'/'+em+'/'+ed;const today=formatDate(new Date());const weekDates=Array.from({length:7},(_,i)=>formatDate(new Date(ws.getTime()+i*86400000)));const container=document.createElement('div');const headerGrid=document.createElement('div');headerGrid.className='week-grid';headerGrid.style.borderRadius='8px 8px 0 0';const corner=document.createElement('div');corner.className='week-header-cell time-gutter';headerGrid.appendChild(corner);weekDates.forEach((ds,i)=>{const d=new Date(ws.getTime()+i*86400000),dayNum=d.getDate(),isToday=ds===today,cls=WEEK_DAYS_CLASS[i];const cell=document.createElement('div');cell.className='week-header-cell';cell.innerHTML='<div class="week-day-name '+cls+'">'+WEEK_DAYS[i]+'</div>'+(isToday?'<div class="week-day-num today-num">'+dayNum+'</div>':'<div class="week-day-num '+cls+'" style="display:block;text-align:center">'+dayNum+'</div>');headerGrid.appendChild(cell)});container.appendChild(headerGrid);const scrollWrap=document.createElement('div');scrollWrap.className='week-scroll-wrap';const bodyGrid=document.createElement('div');bodyGrid.className='week-grid';bodyGrid.style.borderRadius='0 0 8px 8px';bodyGrid.style.borderTop='none';const colCells=Array.from({length:7},()=>Array(24).fill(null));Array.from({length:24},(_,h)=>h).forEach(h=>{const tg=document.createElement('div');tg.className='week-time-slot';tg.textContent=h===0?'':String(h).padStart(2,'0')+':00';bodyGrid.appendChild(tg);weekDates.forEach((ds,di)=>{const cell=document.createElement('div');cell.className='week-day-col'+(ds===selectedDate?' selected-col':'');if(di===6)cell.style.borderRight='none';cell.onclick=()=>{selectDate(ds);document.getElementById('shiftStart').value=String(h).padStart(2,'0')+':00';document.getElementById('shiftEnd').value=String(Math.min(h+1,23)).padStart(2,'0')+':00'};colCells[di][h]=cell;bodyGrid.appendChild(cell)})});weekDates.forEach((ds,di)=>{const lanes=[];shifts.filter(s=>s.date===ds).sort((a,b)=>a.start.localeCompare(b.start)).forEach(s=>{const wt=workTypes.find(w=>w.id===s.workTypeId),st=staffList.find(x=>x.id===s.staffId);if(!wt||!st)return;const[sh2,sm2]=s.start.split(':').map(Number);const[eh,em]=s.end.split(':').map(Number);const startMin=sh2*60+sm2,endMin=Math.max(eh*60+em,startMin+30);const top=(startMin/60)*48,height=Math.max(((endMin-startMin)/60)*48,20);let lane=lanes.findIndex(e=>e<=startMin);if(lane===-1)lane=lanes.length;lanes[lane]=endMin;const tl=Math.max(lanes.length,1),anchor=colCells[di][0];if(!anchor)return;anchor.style.position='relative';anchor.style.overflow='visible';anchor.style.zIndex='1';const block=document.createElement('div');block.className='week-shift-block';const lw=1/tl;block.style.cssText='top:'+top+'px;height:'+height+'px;left:'+(lane*lw*100+1)+'%;right:'+((tl-lane-1)*lw*100+1)+'%;background:'+wt.color+'33;color:'+wt.color+';border-left:2px solid '+wt.color+';position:absolute;';block.innerHTML='<span style="font-weight:700">'+st.name.split(' ')[0]+'</span><br>'+wt.name+'<br><span style="opacity:.7">'+s.start+'–'+s.end+'</span>';block.onclick=(e)=>{e.stopPropagation();selectDate(ds)};anchor.appendChild(block)})});scrollWrap.appendChild(bodyGrid);container.appendChild(scrollWrap);grid.appendChild(container);setTimeout(()=>{scrollWrap.scrollTop=8*48},50)}
function renderWorkTypes(){const list=document.getElementById('workTypeList');list.innerHTML='';workTypes.forEach(w=>{const item=document.createElement('div');item.className='work-type-item';item.innerHTML='<span class="work-color" style="background:'+w.color+'"></span><span class="work-name">'+w.name+'</span><span class="work-time">'+w.start+'–'+w.end+'</span><button class="del-btn" onclick="deleteWorkType('+w.id+')">✕</button>';list.appendChild(item)});const sel=document.getElementById('shiftWork'),prev=sel.value;sel.innerHTML='<option value="">選択してください</option>';workTypes.forEach(w=>{const o=document.createElement('option');o.value=w.id;o.textContent=w.name;if(String(w.id)===prev)o.selected=true;sel.appendChild(o)})}
function addWorkType(){const name=document.getElementById('workName').value.trim();if(!name)return;workTypes.push({id:nextId++,name,start:document.getElementById('workStart').value,end:document.getElementById('workEnd').value,color:document.getElementById('workColor').value});document.getElementById('workName').value='';closeModal('work');renderWorkTypes();renderCalendar();toast('作業内容を追加しました')}
function deleteWorkType(id){workTypes=workTypes.filter(w=>w.id!==id);renderWorkTypes();renderCalendar()}
function renderStaff(){const grid=document.getElementById('staffGrid');grid.innerHTML='';staffList.forEach(s=>{const badge=document.createElement('div');badge.className='staff-badge';badge.innerHTML='<span class="staff-avatar" style="background:'+s.color+'">'+s.name[0]+'</span>'+s.name+'<button class="del-btn" onclick="deleteStaff('+s.id+')" style="margin-left:2px">✕</button>';grid.appendChild(badge)});const sel=document.getElementById('shiftStaff'),prev=sel.value;sel.innerHTML='<option value="">選択してください</option>';staffList.forEach(s=>{const o=document.createElement('option');o.value=s.id;o.textContent=s.name;if(String(s.id)===prev)o.selected=true;sel.appendChild(o)})}
function addStaff(){const name=document.getElementById('staffName').value.trim();if(!name)return;staffList.push({id:nextId++,name,color:document.getElementById('staffColor').value});document.getElementById('staffName').value='';closeModal('staff');renderStaff();toast('スタッフを登録しました')}
function deleteStaff(id){staffList=staffList.filter(s=>s.id!==id);renderStaff();renderCalendar()}
function saveShift(){if(!selectedDate){toast('⚠ 日付を選択してください',true);return}const staffId=parseInt(document.getElementById('shiftStaff').value),workTypeId=parseInt(document.getElementById('shiftWork').value);if(!staffId||!workTypeId){toast('⚠ スタッフと作業内容を選択してください',true);return}shifts.push({id:nextId++,date:selectedDate,staffId,workTypeId,start:document.getElementById('shiftStart').value,end:document.getElementById('shiftEnd').value,_new:true});renderCalendar();renderAssignments();renderHistory();toast('シフトを保存しました')}
function renderAssignments(){const list=document.getElementById('assignmentList');list.innerHTML='';const filtered=selectedDate?shifts.filter(s=>s.date===selectedDate):shifts;if(!filtered.length){list.innerHTML='<div class="empty-state">シフトが登録されていません</div>';return}filtered.sort((a,b)=>a.start.localeCompare(b.start)).forEach(s=>{const st=staffList.find(x=>x.id===s.staffId),wt=workTypes.find(w=>w.id===s.workTypeId);if(!st||!wt)return;const item=document.createElement('div');item.className='assignment-item';item.innerHTML='<div style="width:24px;height:24px;border-radius:50%;background:'+st.color+';display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:700;color:white;flex-shrink:0">'+st.name[0]+'</div><span style="flex:1">'+st.name+'</span><span class="assignment-type" style="background:'+wt.color+'22;color:'+wt.color+'">'+wt.name+'</span><span style="font-family:\'DM Mono\',monospace;font-size:.68rem;color:var(--text-muted)">'+s.start+'–'+s.end+'</span><button class="del-btn" onclick="deleteShift('+s.id+')">✕</button>';list.appendChild(item)})}
function deleteShift(id){shifts=shifts.filter(s=>s.id!==id);renderCalendar();renderAssignments();renderHistory();toast('シフトを削除しました')}
const DOW_NAMES=['日','月','火','水','木','金','土'],DOW_COLORS=['var(--red)','','','','','var(--accent)','var(--accent)'];
function renderHistory(){const query=(document.getElementById('historySearch')?.value||'').toLowerCase();const tbody=document.getElementById('historyBody'),empty=document.getElementById('historyEmpty');if(!tbody)return;tbody.innerHTML='';let list=[...shifts].sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);if(query)list=list.filter(s=>{const st=staffList.find(x=>x.id===s.staffId),wt=workTypes.find(w=>w.id===s.workTypeId);return(st?.name.toLowerCase().includes(query))||(wt?.name.toLowerCase().includes(query))});if(!list.length){empty.classList.add('show');return}empty.classList.remove('show');list.forEach((s,idx)=>{const st=staffList.find(x=>x.id===s.staffId),wt=workTypes.find(w=>w.id===s.workTypeId);if(!st||!wt)return;const d=new Date(s.date+'T00:00:00'),dow=d.getDay(),dowColor=DOW_COLORS[dow]||'var(--text-dim)',dur=calcDuration(s.start,s.end);const tr=document.createElement('tr');if(idx===0&&s._new){tr.classList.add('new-row');delete s._new}tr.innerHTML='<td class="td-date">'+s.date+'</td><td class="td-dow" style="color:'+dowColor+'">'+DOW_NAMES[dow]+'</td><td><span class="history-staff-badge"><span class="history-staff-dot" style="background:'+st.color+'"></span>'+st.name+'</span></td><td><span class="history-work-badge" style="background:'+wt.color+'22;color:'+wt.color+'">'+wt.name+'</span></td><td class="td-time">'+s.start+'</td><td class="td-time">'+s.end+'</td><td class="td-duration">'+dur+'</td><td><button class="del-btn" onclick="deleteShift('+s.id+')">✕</button></td>';tbody.appendChild(tr)})}
function clearAllShifts(){if(!shifts.length)return;if(!confirm('すべてのシフトを削除しますか？'))return;shifts=[];renderCalendar();renderAssignments();renderHistory();toast('すべてのシフトを削除しました')}
function exportCSV(){if(!shifts.length){toast('⚠ エクスポートするシフトがありません',true);return}const header='日付,スタッフ,作業内容,開始,終了,実働時間\n';const rows=shifts.map(s=>{const st=staffList.find(x=>x.id===s.staffId),wt=workTypes.find(w=>w.id===s.workTypeId),dur=calcDuration(s.start,s.end);return s.date+','+(st?.name||'')+ ','+(wt?.name||'')+','+s.start+','+s.end+','+dur}).join('\n');const blob=new Blob(['\uFEFF'+header+rows],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='shift.csv';a.style.display='none';document.body.appendChild(a);a.click();setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url)},200);toast('CSVを出力しました')}
function openModal(type){document.getElementById(type+'Modal').classList.add('open')}
function closeModal(type){document.getElementById(type+'Modal').classList.remove('open')}
document.querySelectorAll('.modal-overlay').forEach(el=>el.addEventListener('click',e=>{if(e.target===el)el.classList.remove('open')}));
let toastTimer;
function toast(msg,warn){const el=document.getElementById('toast');el.textContent=msg;el.style.borderLeftColor=warn?'var(--amber)':'var(--green)';el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2200)}
let activeMobileTab='cal';
function switchMobileTab(tab){activeMobileTab=tab;document.querySelectorAll('.mb-nav-btn').forEach(b=>b.classList.remove('active'));const btn=document.getElementById('mb-'+tab);if(btn)btn.classList.add('active');if(tab==='cal'){closeMobilePanel();return}openMobilePanel(tab)}
function openMobilePanel(tab){const panel=document.getElementById('mobilePanel'),body=document.getElementById('mobilePanelBody'),backdrop=document.getElementById('mobileBackdrop');body.innerHTML='';const inp='background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:.5rem .7rem;border-radius:6px;width:100%;font-size:.85rem;outline:none';const lbl='font-size:.72rem;color:var(--text-muted);display:block;margin-bottom:.3rem';const sec="font-family:'Syne',sans-serif;font-size:.9rem;font-weight:700;color:var(--text-muted);letter-spacing:.1em;text-transform:uppercase;margin-bottom:1rem";if(tab==='reg'){body.innerHTML='<h3 style="'+sec+'">シフト登録</h3><div style="font-family:\'DM Mono\',monospace;font-size:.78rem;color:var(--accent);background:rgba(91,143,255,.1);padding:.3rem .6rem;border-radius:4px;display:inline-block;margin-bottom:.8rem" id="mobileDateLabel">'+(selectedDate?formatDateJP(selectedDate):'日付を選択してください')+'</div><div style="margin-bottom:.6rem"><label style="'+lbl+'">スタッフ</label><select id="mobileShiftStaff" style="'+inp+'"><option value="">選択してください</option>'+staffList.map(s=>'<option value="'+s.id+'">'+s.name+'</option>').join('')+'</select></div><div style="margin-bottom:.6rem"><label style="'+lbl+'">作業内容</label><select id="mobileShiftWork" style="'+inp+'"><option value="">選択してください</option>'+workTypes.map(w=>'<option value="'+w.id+'">'+w.name+'</option>').join('')+'</select></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:.6rem"><div><label style="'+lbl+'">開始</label><input type="time" id="mobileShiftStart" value="'+document.getElementById('shiftStart').value+'" style="'+inp+'"></div><div><label style="'+lbl+'">終了</label><input type="time" id="mobileShiftEnd" value="'+document.getElementById('shiftEnd').value+'" style="'+inp+'"></div></div><button onclick="saveMobileShift()" style="width:100%;background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;color:white;padding:.65rem;border-radius:8px;font-family:\'Noto Sans JP\',sans-serif;font-size:.9rem;font-weight:500;cursor:pointer">保存する</button>'}
if(tab==='staff'){const badges=staffList.map(s=>'<div style="display:flex;align-items:center;gap:.6rem;padding:.5rem .6rem;background:var(--surface2);border:1px solid var(--border);border-radius:8px;margin-bottom:.4rem"><span style="width:28px;height:28px;border-radius:50%;background:'+s.color+';display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;color:white">'+s.name[0]+'</span><span style="flex:1;font-size:.88rem">'+s.name+'</span><button class="del-btn" onclick="deleteStaff('+s.id+');openMobilePanel(\'staff\')">✕</button></div>').join('');body.innerHTML='<h3 style="'+sec+'">スタッフ</h3>'+badges+'<div style="margin-top:.8rem"><div style="margin-bottom:.6rem"><label style="'+lbl+'">氏名</label><input id="mobileStaffName" placeholder="名前を入力" style="'+inp+'"></div><div style="display:grid;grid-template-columns:1fr auto;gap:.5rem;align-items:flex-end"><div><label style="'+lbl+'">カラー</label><input type="color" id="mobileStaffColor" value="#34d399" style="background:var(--surface2);border:1px solid var(--border);padding:.2rem;border-radius:6px;width:100%;height:38px;cursor:pointer"></div><button onclick="addMobileStaff()" style="background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;color:white;padding:.5rem 1rem;border-radius:8px;font-family:\'Noto Sans JP\',sans-serif;font-size:.85rem;cursor:pointer;height:38px">追加</button></div></div>'}
if(tab==='work'){const items=workTypes.map(w=>'<div style="display:flex;align-items:center;gap:.6rem;padding:.5rem .6rem;background:var(--surface2);border:1px solid var(--border);border-radius:8px;margin-bottom:.4rem"><span style="width:10px;height:10px;border-radius:50%;background:'+w.color+'"></span><span style="flex:1;font-size:.85rem">'+w.name+'</span><span style="font-family:\'DM Mono\',monospace;font-size:.72rem;color:var(--text-muted)">'+w.start+'–'+w.end+'</span><button class="del-btn" onclick="deleteWorkType('+w.id+');openMobilePanel(\'work\')">✕</button></div>').join('');body.innerHTML='<h3 style="'+sec+'">作業内容マスター</h3>'+items+'<div style="margin-top:.8rem"><div style="margin-bottom:.6rem"><label style="'+lbl+'">作業名</label><input id="mobileWorkName" placeholder="例：2号機削り" style="'+inp+'"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:.6rem"><div><label style="'+lbl+'">開始</label><input type="time" id="mobileWorkStart" value="08:30" style="'+inp+'"></div><div><label style="'+lbl+'">終了</label><input type="time" id="mobileWorkEnd" value="17:30" style="'+inp+'"></div></div><div style="display:grid;grid-template-columns:1fr auto;gap:.5rem;align-items:flex-end"><div><label style="'+lbl+'">カラー</label><input type="color" id="mobileWorkColor" value="#5b8fff" style="background:var(--surface2);border:1px solid var(--border);padding:.2rem;border-radius:6px;width:100%;height:38px;cursor:pointer"></div><button onclick="addMobileWork()" style="background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;color:white;padding:.5rem 1rem;border-radius:8px;font-family:\'Noto Sans JP\',sans-serif;font-size:.85rem;cursor:pointer;height:38px">追加</button></div></div>'}
panel.classList.add('open');backdrop.classList.add('open')}
function closeMobilePanel(){document.getElementById('mobilePanel').classList.remove('open');document.getElementById('mobileBackdrop').classList.remove('open')}
function saveMobileShift(){if(!selectedDate){toast('⚠ カレンダーの日付を選んでください',true);return}const staffId=parseInt(document.getElementById('mobileShiftStaff').value),workTypeId=parseInt(document.getElementById('mobileShiftWork').value);const start=document.getElementById('mobileShiftStart').value,end=document.getElementById('mobileShiftEnd').value;if(!staffId||!workTypeId){toast('⚠ スタッフと作業内容を選択してください',true);return}shifts.push({id:nextId++,date:selectedDate,staffId,workTypeId,start,end,_new:true});document.getElementById('shiftStart').value=start;document.getElementById('shiftEnd').value=end;renderCalendar();renderAssignments();renderHistory();closeMobilePanel();switchMobileTab('cal');toast('シフトを保存しました')}
function addMobileStaff(){const name=document.getElementById('mobileStaffName').value.trim();if(!name)return;staffList.push({id:nextId++,name,color:document.getElementById('mobileStaffColor').value});renderStaff();openMobilePanel('staff');toast('スタッフを登録しました')}
function addMobileWork(){const name=document.getElementById('mobileWorkName').value.trim();if(!name)return;workTypes.push({id:nextId++,name,start:document.getElementById('mobileWorkStart').value,end:document.getElementById('mobileWorkEnd').value,color:document.getElementById('mobileWorkColor').value});renderWorkTypes();renderCalendar();openMobilePanel('work');toast('作業内容を追加しました')}
init();
</script>
</body>
</html>`

// ── Next.js コンポーネント ──
// iframe の srcDoc に注入することで Next.js の CSS と完全分離して動作します
export default function Page() {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) return
    doc.open()
    doc.write(APP_HTML)
    doc.close()
  }, [])

  return (
    <iframe
      ref={iframeRef}
      style={{
        width: '100%',
        height: '100vh',
        border: 'none',
        display: 'block',
      }}
      title="シフト管理"
    />
  )
}