import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD7KC25tZgC6BBVr5HnfqNsoVVgNIlxeCg",
  authDomain: "mis-pendientes-dd10d.firebaseapp.com",
  projectId: "mis-pendientes-dd10d",
  storageBucket: "mis-pendientes-dd10d.firebasestorage.app",
  messagingSenderId: "477687346591",
  appId: "1:477687346591:web:37af544515c65a8ee479aa"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

/* ─── CONSTANTS ─── */
const CAT      = {granja:'🐔 Granja',personal:'👤 Personal',equipos:'🔧 Equipos',escuelas:'🏫 Escuelas',familia:'🏠 Familia',curso:'📚 Curso',otro:'📌 Otro'};
const PRI      = {alta:'Alta',media:'Media',baja:'Baja'};
const TITLES   = {inicio:'Inicio',granja:'Granja',personal:'Personal',equipos:'Equipos',escuelas:'Escuelas',familia:'Familia',curso:'Curso',otro:'Otro',prioridades:'Todas por prioridad',super:'Lista del súper',micalendario:'Mi Calendario',calendario:'Google Calendar',menu:'Menú de la Semana'};
const ALL_AREAS= ['granja','curso','equipos','escuelas','familia','personal','otro'];
const SUPER_CATS={frutas:'🍎 Frutas',verduras:'🥦 Verduras',lacteos:'🥛 Lácteos',carnes:'🥩 Carnes',abarrotes:'🥫 Abarrotes',limpieza:'🧹 Limpieza',otro:'📦 Otro'};

/* ─── STATE ─── */
let tasks      = [];
let superItems = [];
let menuSemanal= {};
let nextId     = 1;
let nextSId    = 1;
let area       = 'granja';
let filter     = 'todas';
let superFilter= 'todas';
let editId     = null;
let sbOpen     = window.innerWidth > 620;
let calView    = 'month';
let calDate    = new Date();

/* ─── FIRESTORE SAVE/LOAD ─── */
async function saveToCloud() {
  try {
    await setDoc(doc(db, 'data', 'main'), { tasks, superItems, menuSemanal, nextId, nextSId });
  } catch(e) {
    console.warn('Error guardando en la nube:', e);
    // fallback a localStorage
    localStorage.setItem('tasks_v4', JSON.stringify(tasks));
    localStorage.setItem('superItems_v1', JSON.stringify(superItems));
    localStorage.setItem('nid4', nextId);
    localStorage.setItem('nsid1', nextSId);
  }
}

function save() { saveToCloud(); }

async function loadFromCloud() {
  try {
    const snap = await getDoc(doc(db, 'data', 'main'));
    if (snap.exists()) {
      const d = snap.data();
      tasks       = d.tasks       || [];
      superItems  = d.superItems  || [];
      menuSemanal = d.menuSemanal || {};
      nextId      = d.nextId      || 1;
      nextSId     = d.nextSId     || 1;
    } else {
      // primera vez — migrar datos de localStorage si existen
      const localTasks = JSON.parse(localStorage.getItem('tasks_v4') || '[]');
      const localSuper = JSON.parse(localStorage.getItem('superItems_v1') || '[]');
      if (localTasks.length || localSuper.length) {
        tasks      = localTasks;
        superItems = localSuper;
        nextId     = parseInt(localStorage.getItem('nid4') || '1');
        nextSId    = parseInt(localStorage.getItem('nsid1') || '1');
        await saveToCloud();
      } else {
        tasks = [
          {id:nextId++,name:'Revisar bebederos sección A',cat:'granja',pri:'alta',done:false,date:'',loc:'',assignee:''},
          {id:nextId++,name:'Registrar postura del lote 3',cat:'granja',pri:'media',done:false,date:'',loc:'',assignee:''},
          {id:nextId++,name:'Preparar material clase semana 3',cat:'curso',pri:'media',done:false,date:'',loc:'',assignee:''},
          {id:nextId++,name:'Mantenimiento comederos',cat:'equipos',pri:'alta',done:false,date:'',loc:'',assignee:''},
          {id:nextId++,name:'Visita escuela técnica',cat:'escuelas',pri:'media',done:false,date:'',loc:'',assignee:''},
          {id:nextId++,name:'Reunión familiar domingo',cat:'familia',pri:'baja',done:false,date:'',loc:'',assignee:''},
        ];
        await saveToCloud();
      }
    }
  } catch(e) {
    console.warn('Error cargando de la nube, usando localStorage:', e);
    tasks      = JSON.parse(localStorage.getItem('tasks_v4') || '[]');
    superItems = JSON.parse(localStorage.getItem('superItems_v1') || '[]');
    nextId     = parseInt(localStorage.getItem('nid4') || '1');
    nextSId    = parseInt(localStorage.getItem('nsid1') || '1');
  }
}

/* ─── SPLASH ─── */
(function buildSplash(){
  const petals=['🌸','🌺','✨','🌷','💐','🌹'];
  const wrap=document.getElementById('petals');
  for(let i=0;i<18;i++){
    const p=document.createElement('div');
    p.className='petal';
    p.textContent=petals[Math.floor(Math.random()*petals.length)];
    p.style.left=Math.random()*100+'%';
    p.style.fontSize=(14+Math.random()*14)+'px';
    p.style.animationDuration=(4+Math.random()*5)+'s';
    p.style.animationDelay=(-Math.random()*6)+'s';
    wrap.appendChild(p);
  }
  const h=new Date().getHours();
  const g=h<12?'¡Buenos días! ☀️':h<18?'¡Buenas tardes! 🌤':'¡Buenas noches! 🌙';
  document.getElementById('splash-greeting').innerHTML=g+'<br>¿Lista para organizar tu día?';
})();

function enterApp(){
  document.getElementById('splash').classList.add('fade-out');
  setTimeout(()=>document.getElementById('splash').style.display='none',500);
}
window.enterApp = enterApp;

/* ─── TOAST ─── */
function toast(msg){
  const el=document.getElementById('toast');
  el.textContent=msg;el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'),2800);
}

/* ─── CALENDAR ─── */
function toggleCalRow(){
  const open=document.getElementById('chk-cal').checked;
  document.getElementById('cal-row').classList.toggle('open',open);
  if(open){const now=new Date();now.setMinutes(0,0,0);now.setHours(now.getHours()+1);document.getElementById('inp-date').value=now.toISOString().slice(0,16);}
}
window.toggleCalRow = toggleCalRow;

function buildCalUrl(name,dateStr,loc){
  if(!dateStr)return null;
  const start=new Date(dateStr),end=new Date(start.getTime()+3600000);
  const fmt=d=>d.toISOString().replace(/[-:]/g,'').slice(0,15)+'Z';
  let url=`https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(name)}&dates=${fmt(start)}/${fmt(end)}`;
  if(loc)url+=`&location=${encodeURIComponent(loc)}`;
  return url;
}

/* ─── ASSIGNEE SUGGESTIONS ─── */
function updateAssigneeSuggestions(){
  const names=[...new Set(tasks.map(t=>t.assignee).filter(Boolean))];
  document.getElementById('assignee-datalist').innerHTML=names.map(n=>`<option value="${esc(n)}">`).join('');
}

/* ─── AREA SWITCHING ─── */
function setArea(a){
  area=a;filter='todas';superFilter='todas';
  document.querySelectorAll('.sidebar-item[data-area]').forEach(el=>el.classList.toggle('active',el.dataset.area===a));
  const isCal=a==='calendario',isPri=a==='prioridades',isSuper=a==='super',isMiCal=a==='micalendario',isInicio=a==='inicio',isMenu=a==='menu';
  const isTask=!isCal&&!isPri&&!isSuper&&!isMiCal&&!isInicio&&!isMenu;
  document.getElementById('view-inicio').style.display=isInicio?'block':'none';
  document.getElementById('view-tasks').style.display=isTask?'block':'none';
  document.getElementById('view-pri').style.display=isPri?'block':'none';
  document.getElementById('view-micalendario').style.display=isMiCal?'block':'none';
  document.getElementById('view-super').style.display=isSuper?'block':'none';
  document.getElementById('view-menu').style.display=isMenu?'block':'none';
  document.getElementById('view-cal').style.display=isCal?'flex':'none';
  document.getElementById('bottom-bar').style.display=(isCal||isMiCal||isInicio||isMenu)?'none':'flex';
  document.getElementById('btn-clear-bought').style.display=isSuper?'inline-flex':'none';
  document.getElementById('btn-clear-done').style.display=isSuper?'none':'inline-flex';
  document.getElementById('topbar-title').textContent=TITLES[a];
  if(isTask){
    document.querySelectorAll('.chip').forEach(c=>c.classList.toggle('active',c.dataset.f==='todas'));
    render();
  }else if(isPri){renderPri();}
  else if(isSuper){renderSuper();}
  else if(isMiCal){renderMiCalendario();}
  else if(isInicio){renderInicio();}
  else if(isMenu){renderMenu();}
  else{document.getElementById('topbar-count').textContent='Google Calendar';}
  if(window.innerWidth<=620)closeMobileSidebar();
}
window.setArea = setArea;

function toggleSidebar(){
  if(window.innerWidth<=620){
    document.getElementById('sidebar').classList.toggle('mob-open');
    document.getElementById('backdrop').classList.toggle('open',document.getElementById('sidebar').classList.contains('mob-open'));
  }else{
    sbOpen=!sbOpen;
    document.getElementById('sidebar').classList.toggle('hidden',!sbOpen);
    document.getElementById('main').classList.toggle('expanded',!sbOpen);
    document.getElementById('bottom-bar').style.left=sbOpen?'var(--sidebar-w)':'0';
  }
}
window.toggleSidebar = toggleSidebar;

function closeMobileSidebar(){document.getElementById('sidebar').classList.remove('mob-open');document.getElementById('backdrop').classList.remove('open');}
window.closeMobileSidebar = closeMobileSidebar;

/* ─── TASKS ─── */
function addTask(){
  const name=document.getElementById('inp-name').value.trim();
  if(!name){document.getElementById('inp-name').focus();return;}
  const pri=document.getElementById('inp-pri').value;
  const assignee=document.getElementById('inp-assignee').value.trim();
  const addCal=document.getElementById('chk-cal').checked;
  const date=addCal?document.getElementById('inp-date').value:'';
  const loc=addCal?document.getElementById('inp-location').value.trim():'';
  tasks.unshift({id:nextId++,name,cat:ALL_AREAS.includes(area)?area:'otro',pri,assignee,done:false,date,loc});
  document.getElementById('inp-name').value='';
  document.getElementById('inp-assignee').value='';
  document.getElementById('chk-cal').checked=false;
  document.getElementById('cal-row').classList.remove('open');
  updateAssigneeSuggestions();save();
  if(addCal&&date){const url=buildCalUrl(name,date,loc);if(url){window.open(url,'_blank');toast('✅ Tarea agregada — abriendo Google Calendar...');}}
  else toast('✅ Tarea agregada');
  if(area==='prioridades')renderPri();else render();
}
window.addTask = addTask;

function toggle(id){const t=tasks.find(t=>t.id===id);if(t){t.done=!t.done;save();if(area==='prioridades')renderPri();else render();}}
window.toggle = toggle;

function del(id){tasks=tasks.filter(t=>t.id!==id);save();if(area==='prioridades')renderPri();else render();}
window.del = del;

function clearDone(){
  const scope=area==='prioridades'?tasks.filter(t=>t.done):tasks.filter(t=>t.done&&t.cat===area);
  if(!scope.length)return;
  if(confirm('¿Eliminar las completadas?')){
    if(area==='prioridades')tasks=tasks.filter(t=>!t.done);
    else tasks=tasks.filter(t=>!(t.done&&t.cat===area));
    save();if(area==='prioridades')renderPri();else render();
  }
}
window.clearDone = clearDone;

function openEdit(id){
  const t=tasks.find(t=>t.id===id);if(!t)return;
  editId=id;
  document.getElementById('edit-name').value=t.name;
  document.getElementById('edit-cat').value=t.cat;
  document.getElementById('edit-pri').value=t.pri;
  document.getElementById('edit-assignee').value=t.assignee||'';
  document.getElementById('edit-overlay').classList.add('open');
}
window.openEdit = openEdit;

function closeEdit(){editId=null;document.getElementById('edit-overlay').classList.remove('open');}
window.closeEdit = closeEdit;

function saveEdit(){
  const t=tasks.find(t=>t.id===editId);if(!t)return;
  const n=document.getElementById('edit-name').value.trim();
  if(n)t.name=n;
  t.cat=document.getElementById('edit-cat').value;
  t.pri=document.getElementById('edit-pri').value;
  t.assignee=document.getElementById('edit-assignee').value.trim();
  save();closeEdit();if(area==='prioridades')renderPri();else render();
}
window.saveEdit = saveEdit;

function setFilter(f){
  filter=f;
  document.querySelectorAll('.chip').forEach(c=>c.classList.toggle('active',c.dataset.f===f));
  render();
}
window.setFilter = setFilter;

/* ─── SUPER ─── */
function addSuperItem(){
  const name=document.getElementById('si-name').value.trim();
  if(!name){document.getElementById('si-name').focus();return;}
  const qty=parseInt(document.getElementById('si-qty').value)||1;
  const cat=document.getElementById('si-cat').value;
  superItems.unshift({id:nextSId++,name,qty,cat,bought:false});
  document.getElementById('si-name').value='';
  document.getElementById('si-qty').value='1';
  save();toast('🛒 Producto agregado');renderSuper();
}
window.addSuperItem = addSuperItem;

function toggleSuper(id){const s=superItems.find(s=>s.id===id);if(s){s.bought=!s.bought;save();renderSuper();}}
window.toggleSuper = toggleSuper;

function delSuper(id){superItems=superItems.filter(s=>s.id!==id);save();renderSuper();}
window.delSuper = delSuper;

function clearBought(){
  if(!superItems.some(s=>s.bought))return;
  if(confirm('¿Eliminar los productos ya comprados?')){superItems=superItems.filter(s=>!s.bought);save();renderSuper();}
}
window.clearBought = clearBought;

function setSuperFilter(f){
  superFilter=f;
  document.querySelectorAll('#super-tabs .chip').forEach(c=>c.classList.toggle('active',c.dataset.sf===f));
  renderSuperList();
}
window.setSuperFilter = setSuperFilter;

/* ─── BADGES ─── */
function updateBadges(){
  ALL_AREAS.forEach(a=>{
    const el=document.getElementById('bc-'+a);if(!el)return;
    const n=tasks.filter(t=>t.cat===a&&!t.done).length;
    el.textContent=n;el.className='badge-count'+(n===0?' zero':'');
  });
}

/* ─── SVG ICON HELPERS ─── */
const SVG = {
  egg:     `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c6.23-.05 7.87-5.57 7.5-10-.36-4.34-3.95-9.96-7.5-10-3.55.04-7.14 5.66-7.5 10-.37 4.43 1.27 9.95 7.5 10z"/></svg>`,
  cap:     `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>`,
  wrench:  `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
  school:  `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 22v-4a2 2 0 1 0-4 0v4"/><path d="m18 10 3.447 1.724a1 1 0 0 1 .553.894V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7.382a1 1 0 0 1 .553-.894L6 10"/><path d="m4 6 8-4 8 4"/><circle cx="12" cy="9" r="2"/></svg>`,
  users:   `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  user:    `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>`,
  bookmark:`<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>`,
  pencil:  `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>`,
  trash:   `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`,
  clock:   `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  check:   `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
  flame:   `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
  zap:     `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>`,
  drop:    `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>`,
};

const AREA_SVG = {
  granja:   {svg:SVG.egg,     color:'#4ade80', bg:'rgba(74,222,128,.15)'},
  curso:    {svg:SVG.cap,     color:'#60a5fa', bg:'rgba(96,165,250,.15)'},
  equipos:  {svg:SVG.wrench,  color:'#fb923c', bg:'rgba(251,146,60,.15)'},
  escuelas: {svg:SVG.school,  color:'#facc15', bg:'rgba(250,204,21,.15)'},
  familia:  {svg:SVG.users,   color:'#f472b6', bg:'rgba(244,114,182,.15)'},
  personal: {svg:SVG.user,    color:'#a78bfa', bg:'rgba(167,139,250,.15)'},
  otro:     {svg:SVG.bookmark,color:'#94a3b8', bg:'rgba(148,163,184,.15)'},
};

function areaIcon(a, size=20){
  const info=AREA_SVG[a]||AREA_SVG.otro;
  return `<span class="area-svg-icon" style="background:${info.bg};color:${info.color};width:${size+16}px;height:${size+16}px;">${info.svg.replace('<svg ','<svg width="'+size+'" height="'+size+'" style="stroke:'+info.color+'" ')}</span>`;
}

/* ─── TASK HTML ─── */
function tHTML(t,showArea){
  const dateStr=t.date?`<span class="task-date">${SVG.clock.replace('<svg ','<svg width="11" height="11" style="stroke:currentColor;vertical-align:middle;margin-right:3px;" ')} ${new Date(t.date).toLocaleString('es-MX',{dateStyle:'short',timeStyle:'short'})}</span>`:'';
  const areaTag=showArea?`<span class="area-tag">${AREA_SVG[t.cat]?AREA_SVG[t.cat].svg.replace('<svg ','<svg width="10" height="10" style="stroke:'+AREA_SVG[t.cat].color+';vertical-align:middle;margin-right:3px;" '):''} ${CAT[t.cat].replace(/^.\s/,'')}</span>`:'';
  const assigneeTag=t.assignee?`<span class="assignee-tag">${SVG.user.replace('<svg ','<svg width="11" height="11" style="stroke:currentColor;vertical-align:middle;margin-right:3px;" ')} ${esc(t.assignee)}</span>`:'';
  return `<div class="task-item ${t.done?'done':''}">
    <input type="checkbox" ${t.done?'checked':''} onchange="toggle(${t.id})"/>
    <div class="task-body">
      <div class="task-name">${esc(t.name)}</div>
      <div class="task-meta">${areaTag}<span class="pri pri-${t.pri}">${PRI[t.pri]}</span>${assigneeTag}${dateStr}</div>
    </div>
    <div class="task-actions">
      <button class="icon-btn" onclick="openEdit(${t.id})" title="Editar">${SVG.pencil.replace('<svg ','<svg width="14" height="14" style="stroke:currentColor" ')}</button>
      <button class="icon-btn del" onclick="del(${t.id})" title="Eliminar">${SVG.trash.replace('<svg ','<svg width="14" height="14" style="stroke:currentColor" ')}</button>
    </div>
  </div>`;
}

/* ─── RENDER INICIO ─── */
function renderInicio(){
  const AREA_NAME={granja:'Granja',curso:'Curso',equipos:'Equipos',escuelas:'Escuelas',familia:'Familia',personal:'Personal',otro:'Otro'};
  const h=new Date().getHours();
  const greeting=h<12?'¡Buenos días! ☀️':h<18?'¡Buenas tardes! 🌤':'¡Buenas noches! 🌙';
  const totalPend=tasks.filter(t=>!t.done).length;
  document.getElementById('topbar-count').textContent=totalPend+(totalPend===1?' pendiente':' pendientes');
  updateBadges();

  const priIcon=(type)=>{
    const cfg={alta:{svg:SVG.flame,c:'#f06080'},media:{svg:SVG.zap,c:'#e8a040'},baja:{svg:SVG.drop,c:'#6080d8'}};
    const {svg,c}=cfg[type];
    return svg.replace('<svg ','<svg width="11" height="11" style="stroke:'+c+';vertical-align:middle;margin-right:3px;" ');
  };

  let html=`<div class="inicio-greeting">${greeting} Mari Fer</div>
  <div class="inicio-sub">Tienes <strong>${totalPend}</strong> tarea${totalPend===1?'':'s'} pendiente${totalPend===1?'':'s'} en total</div>
  <div class="inicio-grid">`;

  ALL_AREAS.forEach(a=>{
    const pend=tasks.filter(t=>t.cat===a&&!t.done);
    const alta=pend.filter(t=>t.pri==='alta').length;
    const media=pend.filter(t=>t.pri==='media').length;
    const baja=pend.filter(t=>t.pri==='baja').length;
    const total=pend.length;
    const max=Math.max(alta,media,baja,1);
    const info=AREA_SVG[a];

    html+=`<div class="area-card" onclick="setArea('${a}')">
      <div class="area-card-header">
        ${areaIcon(a,18)}
        <span class="area-card-name">${AREA_NAME[a]}</span>
        <span class="area-card-total ${total===0?'zero':''}">${total}</span>
      </div>`;

    if(total===0){
      html+=`<div class="area-card-empty">${SVG.check.replace('<svg ','<svg width="13" height="13" style="stroke:#4ade80;vertical-align:middle;margin-right:4px;" ')} Sin pendientes</div>`;
    } else {
      html+=`<div class="area-pri-bars">
        <div class="pri-bar-row">
          <span class="pri-bar-label">${priIcon('alta')} Alta</span>
          <div class="pri-bar-track"><div class="pri-bar-fill fill-alta" style="width:${Math.round(alta/max*100)}%"></div></div>
          <span class="pri-bar-count count-alta">${alta}</span>
        </div>
        <div class="pri-bar-row">
          <span class="pri-bar-label">${priIcon('media')} Media</span>
          <div class="pri-bar-track"><div class="pri-bar-fill fill-media" style="width:${Math.round(media/max*100)}%"></div></div>
          <span class="pri-bar-count count-media">${media}</span>
        </div>
        <div class="pri-bar-row">
          <span class="pri-bar-label">${priIcon('baja')} Baja</span>
          <div class="pri-bar-track"><div class="pri-bar-fill fill-baja" style="width:${Math.round(baja/max*100)}%"></div></div>
          <span class="pri-bar-count count-baja">${baja}</span>
        </div>
      </div>`;
    }
    html+=`</div>`;
  });

  html+=`</div>`;
  document.getElementById('inicio-grid').innerHTML=html;
}

/* ─── RENDER TASKS ─── */
function render(){
  let vis=tasks.filter(t=>t.cat===area);
  if(filter==='pendientes')vis=vis.filter(t=>!t.done);
  else if(filter==='completadas')vis=vis.filter(t=>t.done);
  else if(filter==='alta')vis=vis.filter(t=>t.pri==='alta');
  const areaAll=tasks.filter(t=>t.cat===area);
  const pend=areaAll.filter(t=>!t.done).length;
  document.getElementById('s-pend').textContent=pend;
  document.getElementById('s-done').textContent=areaAll.filter(t=>t.done).length;
  document.getElementById('s-total').textContent=areaAll.length;
  document.getElementById('topbar-count').textContent=pend+(pend===1?' pendiente':' pendientes');
  updateBadges();
  const list=document.getElementById('task-list');
  if(!vis.length){list.innerHTML=`<div class="empty-state"><div class="e-icon">🌸</div><p>${filter==='todas'?'Sin tareas — ¡agrega una arriba!':'Sin resultados.'}</p></div>`;return;}
  const p=vis.filter(t=>!t.done),d=vis.filter(t=>t.done);
  let html='';
  if(p.length)html+=`<div class="section-label">Pendientes (${p.length})</div><div class="task-list">${p.map(t=>tHTML(t,false)).join('')}</div>`;
  if(d.length)html+=`<div class="section-label" style="margin-top:1.1rem">Completadas (${d.length})</div><div class="task-list">${d.map(t=>tHTML(t,false)).join('')}</div>`;
  list.innerHTML=html;
}

/* ─── RENDER PRIORIDADES ─── */
function renderPri(){
  const pending=tasks.filter(t=>!t.done);
  const total=pending.length;
  document.getElementById('topbar-count').textContent=total+(total===1?' pendiente':' pendientes');
  updateBadges();
  const list=document.getElementById('pri-list');
  if(!total){list.innerHTML=`<div class="empty-state"><div class="e-icon">🎉</div><p>¡Sin tareas pendientes! Todo al día.</p></div>`;return;}
  const PRI_CFG={
    alta:{svg:SVG.flame,color:'#f06080',label:'Alta prioridad'},
    media:{svg:SVG.zap,color:'#e8a040',label:'Media prioridad'},
    baja:{svg:SVG.drop,color:'#6080d8',label:'Baja prioridad'},
  };
  function group(items,priKey){
    if(!items.length)return'';
    const {svg,color,label}=PRI_CFG[priKey];
    const ic=svg.replace('<svg ','<svg width="15" height="15" style="stroke:'+color+'" ');
    return`<div class="pri-group"><div class="pri-group-header"><span class="pri-group-ic" style="background:${color}22;border:1px solid ${color}44;">${ic}</span><span style="color:${color}">${label}</span><span class="count-lbl">(${items.length})</span></div><div class="task-list">${items.map(t=>tHTML(t,true)).join('')}</div></div>`;
  }
  list.innerHTML=group(pending.filter(t=>t.pri==='alta'),'alta')+group(pending.filter(t=>t.pri==='media'),'media')+group(pending.filter(t=>t.pri==='baja'),'baja');
}

/* ─── RENDER SUPER ─── */
function renderSuper(){
  const pend=superItems.filter(s=>!s.bought).length;
  const done=superItems.filter(s=>s.bought).length;
  const total=superItems.length;
  document.getElementById('ss-pend').textContent=pend;
  document.getElementById('ss-done').textContent=done;
  document.getElementById('ss-bar').style.width=total?Math.round(done/total*100)+'%':'0%';
  document.getElementById('topbar-count').textContent=pend+(pend===1?' producto':' productos');
  const cats=['todas',...new Set(superItems.map(s=>s.cat))];
  document.getElementById('super-tabs').innerHTML=cats.map(c=>{
    const label=c==='todas'?'Todas':SUPER_CATS[c]||c;
    return`<div class="chip ${superFilter===c?'active':''}" data-sf="${c}" onclick="setSuperFilter('${c}')">${label}</div>`;
  }).join('');
  renderSuperList();
}

function renderSuperList(){
  let vis=superFilter==='todas'?[...superItems]:superItems.filter(s=>s.cat===superFilter);
  const list=document.getElementById('super-list');
  if(!vis.length){list.innerHTML=`<div class="super-empty"><div class="e-icon">🛒</div><p>La lista está vacía — agrega productos arriba</p></div>`;return;}
  const pend=vis.filter(s=>!s.bought),bought=vis.filter(s=>s.bought);
  function sHTML(s){
    return`<div class="super-item ${s.bought?'bought':''}">
      <input type="checkbox" ${s.bought?'checked':''} onchange="toggleSuper(${s.id})"/>
      <div class="si-body">
        <div class="si-name">${esc(s.name)}</div>
        <div class="si-meta">
          <span class="si-qty">x${s.qty}</span>
          <span class="si-cat si-cat-${s.cat}">${SUPER_CATS[s.cat]||s.cat}</span>
        </div>
      </div>
      <button class="icon-btn del" onclick="delSuper(${s.id})" title="Quitar">${SVG.trash.replace('<svg ','<svg width="14" height="14" style="stroke:currentColor" ')}</button>
    </div>`;
  }
  let html='';
  if(pend.length)html+=`<div class="section-label">Por comprar (${pend.length})</div>${pend.map(sHTML).join('')}`;
  if(bought.length)html+=`<div class="section-label" style="margin-top:1rem">Ya en el carrito (${bought.length})</div>${bought.map(sHTML).join('')}`;
  list.innerHTML=html;
}

/* ─── BUILT-IN CALENDAR ─── */
function setCalView(v){
  calView=v;
  document.getElementById('btn-month').classList.toggle('active',v==='month');
  document.getElementById('btn-week').classList.toggle('active',v==='week');
  renderMiCalendario();
}
window.setCalView = setCalView;

function calNav(dir){
  if(calView==='month'){calDate.setMonth(calDate.getMonth()+dir);}
  else{calDate.setDate(calDate.getDate()+(dir*7));}
  renderMiCalendario();
}
window.calNav = calNav;

function calGoToday(){calDate=new Date();renderMiCalendario();}
window.calGoToday = calGoToday;

function tasksForDate(dateObj){
  const d=dateObj.toDateString();
  return tasks.filter(t=>t.date&&new Date(t.date).toDateString()===d);
}

function eventHTML(t,mode){
  const doneClass=t.done?'done-event':'';
  const timeStr=t.date?new Date(t.date).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit',hour12:true}):'';
  if(mode==='month'){
    return`<div class="day-event pri-${t.pri} ${doneClass}" title="${t.name}">${t.done?'✓ ':''}${t.name}</div>`;
  }
  return`<div class="week-event pri-${t.pri} ${doneClass}" onclick="openEdit(${t.id})">
    ${timeStr?`<div class="week-event-time">${timeStr}</div>`:''}
    <div>${t.done?'✓ ':''}${t.name}</div>
  </div>`;
}

function renderMiCalendario(){
  const today=new Date();
  const MONTHS=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const DAYS_S=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  if(calView==='month'){
    const y=calDate.getFullYear(),m=calDate.getMonth();
    document.getElementById('cal-title').textContent=MONTHS[m]+' '+y;
    const first=new Date(y,m,1),last=new Date(y,m+1,0),startDow=first.getDay();
    let html=`<div class="month-grid"><div class="month-dow-row">${DAYS_S.map(d=>`<div class="month-dow">${d}</div>`).join('')}</div><div class="month-days">`;
    const prevLast=new Date(y,m,0);
    for(let i=startDow-1;i>=0;i--){html+=`<div class="month-day other-month"><div class="day-num">${prevLast.getDate()-i}</div></div>`;}
    for(let d=1;d<=last.getDate();d++){
      const dateObj=new Date(y,m,d),isToday=dateObj.toDateString()===today.toDateString();
      const evts=tasksForDate(dateObj),show=evts.slice(0,2),more=evts.length-show.length;
      html+=`<div class="month-day${isToday?' today':''}"><div class="day-num">${d}</div><div class="day-events">${show.map(t=>eventHTML(t,'month')).join('')}${more>0?`<div class="day-more">+${more} más</div>`:''}</div></div>`;
    }
    const trailing=(7-((startDow+last.getDate())%7))%7;
    for(let d=1;d<=trailing;d++){html+=`<div class="month-day other-month"><div class="day-num">${d}</div></div>`;}
    html+='</div></div>';
    document.getElementById('cal-grid').innerHTML=html;
  } else {
    const dow=calDate.getDay(),monday=new Date(calDate);
    monday.setDate(calDate.getDate()-(dow===0?6:dow-1));
    const days=[];
    for(let i=0;i<7;i++){const d=new Date(monday);d.setDate(monday.getDate()+i);days.push(d);}
    const fmt=d=>MONTHS[d.getMonth()].slice(0,3)+' '+d.getDate();
    document.getElementById('cal-title').textContent=fmt(days[0])+' – '+fmt(days[6])+', '+days[0].getFullYear();
    let header='<div class="week-grid"><div class="week-header">';
    days.forEach(d=>{
      const isToday=d.toDateString()===today.toDateString();
      header+=`<div class="week-col-header${isToday?' today':''}"><div class="wch-dow">${DAYS_S[d.getDay()]}</div><div class="wch-num">${d.getDate()}</div>${isToday?'<div class="wch-day-dot"></div>':''}</div>`;
    });
    header+='</div><div class="week-days">';
    let cols='';
    days.forEach(d=>{
      const isToday=d.toDateString()===today.toDateString(),evts=tasksForDate(d);
      cols+=`<div class="week-day-col${isToday?' today':''}">${evts.length?evts.map(t=>eventHTML(t,'week')).join(''):'<div class="week-no-tasks">—</div>'}</div>`;
    });
    document.getElementById('cal-grid').innerHTML=header+cols+'</div></div>';
  }
  document.getElementById('topbar-count').textContent=tasks.filter(t=>t.date&&!t.done).length+' con fecha';
}

/* ─── MENU SEMANAL ─── */
const DIAS = [
  {key:'lun',label:'Lunes'},
  {key:'mar',label:'Martes'},
  {key:'mie',label:'Miércoles'},
  {key:'jue',label:'Jueves'},
  {key:'vie',label:'Viernes'},
  {key:'sab',label:'Sábado'},
  {key:'dom',label:'Domingo'},
];
const COMIDAS = [
  {key:'desayuno', label:'Desayuno', icon:'🌅'},
  {key:'comida',   label:'Comida',   icon:'☀️'},
  {key:'cena',     label:'Cena',     icon:'🌙'},
];

function getMeal(dia,comida){
  return (menuSemanal[dia]&&menuSemanal[dia][comida])||'';
}

function updateMeal(dia,comida,val){
  if(!menuSemanal[dia])menuSemanal[dia]={};
  menuSemanal[dia][comida]=val;
  save();
}
window.updateMeal=updateMeal;

function addMenuToSuper(){
  const nuevos=[];
  DIAS.forEach(d=>COMIDAS.forEach(c=>{
    const v=getMeal(d.key,c.key).trim();
    if(v)nuevos.push({id:nextSId++,name:v+' ('+c.label+' '+d.label+')',qty:1,cat:'otro',bought:false});
  }));
  if(!nuevos.length){toast('No hay platillos anotados');return;}
  superItems.unshift(...nuevos);
  save();
  toast('✅ '+nuevos.length+' platillos agregados al súper');
  setArea('super');
}
window.addMenuToSuper=addMenuToSuper;

function clearMenu(){
  if(!confirm('¿Borrar todo el menú de la semana?'))return;
  menuSemanal={};
  save();
  renderMenu();
  toast('Menú limpiado');
}
window.clearMenu=clearMenu;

function renderMenu(){
  document.getElementById('topbar-count').textContent='7 días';
  const today=new Date().getDay(); // 0=dom,1=lun...
  const todayKey=['dom','lun','mar','mie','jue','vie','sab'][today];

  let html=`
  <div class="menu-header">
    <div>
      <div class="menu-title">Menú de la Semana</div>
      <div class="menu-sub">Planifica tus comidas y agréga los ingredientes al súper</div>
    </div>
    <div class="menu-actions">
      <button class="btn" onclick="clearMenu()">Limpiar</button>
      <button class="btn primary" onclick="addMenuToSuper()">
        ${SVG.bookmark.replace('<svg ','<svg width="14" height="14" style="stroke:currentColor;vertical-align:middle;margin-right:5px;" ')}
        Agregar al súper
      </button>
    </div>
  </div>
  <div class="menu-grid">`;

  DIAS.forEach(d=>{
    const isToday=d.key===todayKey;
    html+=`<div class="menu-day-col${isToday?' menu-today':''}">
      <div class="menu-day-header">
        <span class="menu-day-label">${d.label}</span>
        ${isToday?'<span class="menu-today-dot">Hoy</span>':''}
      </div>`;
    COMIDAS.forEach(c=>{
      const val=esc(getMeal(d.key,c.key));
      html+=`<div class="menu-meal-block">
        <div class="menu-meal-label">${c.icon} ${c.label}</div>
        <textarea class="menu-input" rows="2"
          onchange="updateMeal('${d.key}','${c.key}',this.value)"
          placeholder="¿Qué vas a comer?">${val}</textarea>
      </div>`;
    });
    html+=`</div>`;
  });

  html+=`</div>`;
  document.getElementById('menu-container').innerHTML=html;
}

function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

/* ─── INIT ─── */
async function init() {
  await loadFromCloud();
  updateAssigneeSuggestions();
  setArea('inicio');

  document.getElementById('inp-name').addEventListener('keydown',e=>{if(e.key==='Enter')addTask();});
  document.getElementById('edit-overlay').addEventListener('click',e=>{if(e.target===e.currentTarget)closeEdit();});
  document.getElementById('edit-name').addEventListener('keydown',e=>{if(e.key==='Enter')saveEdit();});
  document.getElementById('si-name').addEventListener('keydown',e=>{if(e.key==='Enter')addSuperItem();});
}

init();
