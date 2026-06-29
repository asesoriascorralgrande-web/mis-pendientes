/* ─── CONSTANTS ─── */
const CAT    = {granja:'🐔 Granja',personal:'👤 Personal',equipos:'🔧 Equipos',escuelas:'🏫 Escuelas',familia:'🏠 Familia',curso:'📚 Curso',otro:'📌 Otro'};
const PRI    = {alta:'Alta',media:'Media',baja:'Baja'};
const TITLES = {granja:'🐔 Granja',personal:'👤 Personal',equipos:'🔧 Equipos',escuelas:'🏫 Escuelas',familia:'🏠 Familia',curso:'📚 Curso',otro:'📌 Otro',prioridades:'🔥 Todas por prioridad',super:'🛒 Lista del súper',micalendario:'📅 Mi Calendario',calendario:'📅 Google Calendar'};
const ALL_AREAS = ['granja','curso','equipos','escuelas','familia','personal','otro'];
const SUPER_CATS = {frutas:'🍎 Frutas',verduras:'🥦 Verduras',lacteos:'🥛 Lácteos',carnes:'🥩 Carnes',abarrotes:'🥫 Abarrotes',limpieza:'🧹 Limpieza',otro:'📦 Otro'};

/* ─── STATE ─── */
let tasks    = JSON.parse(localStorage.getItem('tasks_v4') || '[]');
let superItems = JSON.parse(localStorage.getItem('superItems_v1') || '[]');
let nextId   = parseInt(localStorage.getItem('nid4') || '1');
let nextSId  = parseInt(localStorage.getItem('nsid1') || '1');
let area     = 'granja';
let filter   = 'todas';
let superFilter = 'todas';
let editId   = null;
let sbOpen   = window.innerWidth > 620;

if (!tasks.length) {
  tasks = [
    {id:nextId++,name:'Revisar bebederos sección A',cat:'granja',pri:'alta',done:false,date:'',loc:'',assignee:''},
    {id:nextId++,name:'Registrar postura del lote 3',cat:'granja',pri:'media',done:false,date:'',loc:'',assignee:''},
    {id:nextId++,name:'Preparar material clase semana 3',cat:'curso',pri:'media',done:false,date:'',loc:'',assignee:''},
    {id:nextId++,name:'Mantenimiento comederos',cat:'equipos',pri:'alta',done:false,date:'',loc:'',assignee:''},
    {id:nextId++,name:'Visita escuela técnica',cat:'escuelas',pri:'media',done:false,date:'',loc:'',assignee:''},
    {id:nextId++,name:'Reunión familiar domingo',cat:'familia',pri:'baja',done:false,date:'',loc:'',assignee:''},
  ];
  save();
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

/* ─── SAVE ─── */
function save(){
  localStorage.setItem('tasks_v4',JSON.stringify(tasks));
  localStorage.setItem('nid4',nextId);
  localStorage.setItem('superItems_v1',JSON.stringify(superItems));
  localStorage.setItem('nsid1',nextSId);
}

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
  const isCal=a==='calendario',isPri=a==='prioridades',isSuper=a==='super',isMiCal=a==='micalendario';
  document.getElementById('view-tasks').style.display=(!isCal&&!isPri&&!isSuper&&!isMiCal)?'block':'none';
  document.getElementById('view-pri').style.display=isPri?'block':'none';
  document.getElementById('view-micalendario').style.display=isMiCal?'block':'none';
  document.getElementById('view-super').style.display=isSuper?'block':'none';
  document.getElementById('view-cal').style.display=isCal?'flex':'none';
  document.getElementById('bottom-bar').style.display=(isCal||isMiCal)?'none':'flex';
  document.getElementById('btn-clear-bought').style.display=isSuper?'inline-flex':'none';
  document.getElementById('btn-clear-done').style.display=(!isSuper&&!isCal&&!isMiCal)?'inline-flex':'none';
  document.getElementById('btn-clear-done').style.display=isSuper?'none':'inline-flex';
  document.getElementById('topbar-title').textContent=TITLES[a];
  if(!isCal&&!isPri&&!isSuper&&!isMiCal){
    document.querySelectorAll('.chip').forEach(c=>c.classList.toggle('active',c.dataset.f==='todas'));
    render();
  }else if(isPri){renderPri();}
  else if(isSuper){renderSuper();}
  else if(isMiCal){renderMiCalendario();}
  else{document.getElementById('topbar-count').textContent='Google Calendar';}
  if(window.innerWidth<=620)closeMobileSidebar();
}

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
function closeMobileSidebar(){document.getElementById('sidebar').classList.remove('mob-open');document.getElementById('backdrop').classList.remove('open');}

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
function toggle(id){const t=tasks.find(t=>t.id===id);if(t){t.done=!t.done;save();if(area==='prioridades')renderPri();else render();}}
function del(id){tasks=tasks.filter(t=>t.id!==id);save();if(area==='prioridades')renderPri();else render();}
function clearDone(){
  const scope=area==='prioridades'?tasks.filter(t=>t.done):tasks.filter(t=>t.done&&t.cat===area);
  if(!scope.length)return;
  if(confirm('¿Eliminar las completadas?')){
    if(area==='prioridades')tasks=tasks.filter(t=>!t.done);
    else tasks=tasks.filter(t=>!(t.done&&t.cat===area));
    save();if(area==='prioridades')renderPri();else render();
  }
}
function openEdit(id){
  const t=tasks.find(t=>t.id===id);if(!t)return;
  editId=id;
  document.getElementById('edit-name').value=t.name;
  document.getElementById('edit-cat').value=t.cat;
  document.getElementById('edit-pri').value=t.pri;
  document.getElementById('edit-assignee').value=t.assignee||'';
  document.getElementById('edit-overlay').classList.add('open');
}
function closeEdit(){editId=null;document.getElementById('edit-overlay').classList.remove('open');}
function saveEdit(){
  const t=tasks.find(t=>t.id===editId);if(!t)return;
  const n=document.getElementById('edit-name').value.trim();
  if(n)t.name=n;
  t.pri=document.getElementById('edit-pri').value;
  t.assignee=document.getElementById('edit-assignee').value.trim();
  save();closeEdit();if(area==='prioridades')renderPri();else render();
}
function setFilter(f){
  filter=f;
  document.querySelectorAll('.chip').forEach(c=>c.classList.toggle('active',c.dataset.f===f));
  render();
}

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
function toggleSuper(id){
  const s=superItems.find(s=>s.id===id);if(s){s.bought=!s.bought;save();renderSuper();}
}
function delSuper(id){superItems=superItems.filter(s=>s.id!==id);save();renderSuper();}
function clearBought(){
  if(!superItems.some(s=>s.bought))return;
  if(confirm('¿Eliminar los productos ya comprados?')){superItems=superItems.filter(s=>!s.bought);save();renderSuper();}
}
function setSuperFilter(f){
  superFilter=f;
  document.querySelectorAll('#super-tabs .chip').forEach(c=>c.classList.toggle('active',c.dataset.sf===f));
  renderSuperList();
}

/* ─── BADGES ─── */
function updateBadges(){
  ALL_AREAS.forEach(a=>{
    const el=document.getElementById('bc-'+a);if(!el)return;
    const n=tasks.filter(t=>t.cat===a&&!t.done).length;
    el.textContent=n;el.className='badge-count'+(n===0?' zero':'');
  });
}

/* ─── TASK HTML ─── */
function tHTML(t,showArea){
  const dateStr=t.date?`<span class="task-date">📅 ${new Date(t.date).toLocaleString('es-MX',{dateStyle:'short',timeStyle:'short'})}</span>`:'';
  const areaTag=showArea?`<span class="area-tag">${CAT[t.cat]}</span>`:'';
  const assigneeTag=t.assignee?`<span class="assignee-tag">👤 ${esc(t.assignee)}</span>`:'';
  return `<div class="task-item ${t.done?'done':''}">
    <input type="checkbox" ${t.done?'checked':''} onchange="toggle(${t.id})"/>
    <div class="task-body">
      <div class="task-name">${esc(t.name)}</div>
      <div class="task-meta">${areaTag}<span class="pri pri-${t.pri}">${PRI[t.pri]}</span>${assigneeTag}${dateStr}</div>
    </div>
    <div class="task-actions">
      <button class="icon-btn" onclick="openEdit(${t.id})" title="Editar">✏️</button>
      <button class="icon-btn del" onclick="del(${t.id})" title="Eliminar">✕</button>
    </div>
  </div>`;
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
  function group(items,label,dotClass){
    if(!items.length)return'';
    return`<div class="pri-group"><div class="pri-group-header"><div class="pri-dot ${dotClass}"></div><span>${label}</span><span class="count-lbl">(${items.length})</span></div><div class="task-list">${items.map(t=>tHTML(t,true)).join('')}</div></div>`;
  }
  list.innerHTML=group(pending.filter(t=>t.pri==='alta'),'Alta prioridad','dot-alta')+group(pending.filter(t=>t.pri==='media'),'Media prioridad','dot-media')+group(pending.filter(t=>t.pri==='baja'),'Baja prioridad','dot-baja');
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
      <button class="icon-btn del" onclick="delSuper(${s.id})" title="Quitar">✕</button>
    </div>`;
  }
  let html='';
  if(pend.length)html+=`<div class="section-label">Por comprar (${pend.length})</div>${pend.map(sHTML).join('')}`;
  if(bought.length)html+=`<div class="section-label" style="margin-top:1rem">Ya en el carrito (${bought.length})</div>${bought.map(sHTML).join('')}`;
  list.innerHTML=html;
}

/* ─── BUILT-IN CALENDAR ─── */
let calView = 'month';
let calDate = new Date();

function setCalView(v){
  calView=v;
  document.getElementById('btn-month').classList.toggle('active',v==='month');
  document.getElementById('btn-week').classList.toggle('active',v==='week');
  renderMiCalendario();
}

function calNav(dir){
  if(calView==='month'){calDate.setMonth(calDate.getMonth()+dir);}
  else{calDate.setDate(calDate.getDate()+(dir*7));}
  renderMiCalendario();
}

function calGoToday(){calDate=new Date();renderMiCalendario();}

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
    const first=new Date(y,m,1);
    const last=new Date(y,m+1,0);
    const startDow=first.getDay();

    let html=`<div class="month-grid">
      <div class="month-dow-row">${DAYS_S.map(d=>`<div class="month-dow">${d}</div>`).join('')}</div>
      <div class="month-days">`;

    const prevLast=new Date(y,m,0);
    for(let i=startDow-1;i>=0;i--){
      const d=prevLast.getDate()-i;
      html+=`<div class="month-day other-month"><div class="day-num">${d}</div></div>`;
    }
    for(let d=1;d<=last.getDate();d++){
      const dateObj=new Date(y,m,d);
      const isToday=dateObj.toDateString()===today.toDateString();
      const evts=tasksForDate(dateObj);
      const show=evts.slice(0,2);
      const more=evts.length-show.length;
      html+=`<div class="month-day${isToday?' today':''}">
        <div class="day-num">${d}</div>
        <div class="day-events">${show.map(t=>eventHTML(t,'month')).join('')}${more>0?`<div class="day-more">+${more} más</div>`:''}</div>
      </div>`;
    }
    const trailing=(7-((startDow+last.getDate())%7))%7;
    for(let d=1;d<=trailing;d++){
      html+=`<div class="month-day other-month"><div class="day-num">${d}</div></div>`;
    }
    html+='</div></div>';
    document.getElementById('cal-grid').innerHTML=html;

  } else {
    const dow=calDate.getDay();
    const monday=new Date(calDate);
    monday.setDate(calDate.getDate()-(dow===0?6:dow-1));

    const days=[];
    for(let i=0;i<7;i++){const d=new Date(monday);d.setDate(monday.getDate()+i);days.push(d);}

    const fmt=d=>MONTHS[d.getMonth()].slice(0,3)+' '+d.getDate();
    document.getElementById('cal-title').textContent=fmt(days[0])+' – '+fmt(days[6])+', '+days[0].getFullYear();

    let header='<div class="week-grid"><div class="week-header">';
    days.forEach(d=>{
      const isToday=d.toDateString()===today.toDateString();
      header+=`<div class="week-col-header${isToday?' today':''}">
        <div class="wch-dow">${DAYS_S[d.getDay()]}</div>
        <div class="wch-num">${d.getDate()}</div>
        ${isToday?'<div class="wch-day-dot"></div>':''}
      </div>`;
    });
    header+='</div><div class="week-days">';

    let cols='';
    days.forEach(d=>{
      const isToday=d.toDateString()===today.toDateString();
      const evts=tasksForDate(d);
      cols+=`<div class="week-day-col${isToday?' today':''}">
        ${evts.length?evts.map(t=>eventHTML(t,'week')).join(''):'<div class="week-no-tasks">—</div>'}
      </div>`;
    });

    document.getElementById('cal-grid').innerHTML=header+cols+'</div></div>';
  }

  document.getElementById('topbar-count').textContent=tasks.filter(t=>t.date&&!t.done).length+' con fecha';
}

function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

document.getElementById('inp-name').addEventListener('keydown',e=>{if(e.key==='Enter')addTask();});
document.getElementById('edit-overlay').addEventListener('click',e=>{if(e.target===e.currentTarget)closeEdit();});
document.getElementById('edit-name').addEventListener('keydown',e=>{if(e.key==='Enter')saveEdit();});
document.getElementById('si-name').addEventListener('keydown',e=>{if(e.key==='Enter')addSuperItem();});

updateAssigneeSuggestions();
setArea('granja');
