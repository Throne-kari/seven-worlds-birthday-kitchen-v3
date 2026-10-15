import {e,b,art,qty,ready,facts,portion,recipeRows,ingredients,gear,step,cookControls,prepNotes} from '../ui.js';
import './apex-palworld.css';

const ROLES=[['prep','切配','PREP'],['heat','热厨','HEAT'],['serve','上桌','SERVE']];
const STATIONS=[['stove','炉灶','STOVE'],['oven','烤箱','OVEN'],['prep','备料台','WORKBENCH']];
const SIGNALS=[['need','需要材料','＋'],['doing','正在处理','↗'],['wait','等待','◷'],['done','完成此步','✓'],['none','清除标记','−']];
const roleName=id=>ROLES.find(r=>r[0]===id)?.[1]||'切配';
const stationName=id=>STATIONS.find(s=>s[0]===id)?.[1]||'备料台';
const n2=n=>String(n).padStart(2,'0');
const complete=(c,s)=>c.p.steps.includes(s.id);
const progressFor=(c,r)=>r.id===c.r.id?c.p:(c.s.progress[r.id]||{});
const isQueued=c=>(c.ws.queue||[]).includes(c.r.id);
const attrs=(action,extra='')=>`data-pane="${action}" ${extra}`;

function glyph(name){
 const paths={
  prep:'<path d="m13 25 16-16 6 6-16 16zM11 27l-5 5 6 6 5-5M28 10l3-3 6 6-3 3M7 40h34"/>',
  heat:'<path d="M10 25h28v9a8 8 0 0 1-8 8H18a8 8 0 0 1-8-8zM6 25h36M15 18c-5-5 4-7 0-12M24 18c-5-5 4-7 0-12M33 18c-5-5 4-7 0-12"/>',
  serve:'<path d="M7 34h34M10 31a14 14 0 0 1 28 0M5 39h38M24 17v-5M21 12h6"/>',
  stove:'<path d="M9 28h30v13H9zM7 25h34M13 25V14h22v11M24 34c-5 6 6 8 4 2-1-3-4-5-3-8-3 2-5 4-1 6zM16 8c-3-3 3-3 0-6M24 8c-3-3 3-3 0-6M32 8c-3-3 3-3 0-6"/>',
  oven:'<path d="M8 41V22a16 16 0 0 1 32 0v19zM15 41V25a9 9 0 0 1 18 0v16M6 41h36M22 7v8M8 22h8M32 22h8M8 32h7M33 32h7"/>'
 };
 return `<svg class="${name==='stove'||name==='oven'?'pal-station-icon':'apex-role-icon'}" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${paths[name]||paths.prep}</svg>`;
}

// The initial assignment follows the actual operation, never its list position.
function initialRole(s){
 const title=String(s.title||''), phase=String(s.phase||''), heat=String(s.heat||''), action=String(s.action||'');
 const activeFire=/(?:大|中|小|文|旺|猛|低|高)火|微沸|煮沸|滚沸|蒸汽|烤箱|预热/.test(heat);
 const activeTemperature=(heat.match(/\d+(?:\.\d+)?(?=\s*(?:°C|℃))/g)||[]).some(n=>Number(n)>=60);
 const unheated=/无|离火|关火|不加热|不需加热|不用火|室温|冷藏|冷冻/.test(heat);
 // A step that still cooks its sauce stays at the hot station, even if its title says "finish".
 if(activeFire||activeTemperature||(!unheated&&/煮|煎|炒|蒸|烤|炖|焖|汆|焯|炸|熬|加热|预热|收汁|热透/.test(title)))return 'heat';
 if(/腌|泡|裹|调(?:馅|浆|蛋|粉)|填槽|排盘|铺盘|风干|揉|醒|浸/.test(title))return 'prep';
 const finishing=phase+' '+title+' '+action;
 if(/淋(?:汁|上|回|下)|浇(?:汁|鱼|菜|肉|上|到|在)|盛盘|装盘|摆盘|上桌|即食(?!食品)|食用|蘸食|分(?:碗|盘|饭|份|食)|切件|倒扣|合盘|出菜|冷却定型/.test(finishing))return 'serve';
 return 'prep';
}

function roleFor(c,s){
 const v=c.ws.assignments?.[`${c.r.id}:${s.id}`]??c.ws.assignments?.[s.id];
 return ROLES.some(r=>r[0]===v)?v:initialRole(s);
}

function signalFor(c,s){
 if(complete(c,s))return 'done';
 const v=c.ws.pings?.[`${c.r.id}:${s.id}`]??c.ws.pings?.[s.id]??'none';
 return v==='done'?'none':v;
}

function apexNav(c){
 const entries=[['home','集结'],['catalog','选菜'],['prep','材料'],['gear','配置'],['cook','烹饪']];
 return `<header class="apex-topline"><div class="apex-wordmark">APEX<span>LEGENDS</span></div><nav class="apex-navigation" aria-label="Apex 料理操作">${entries.map(([id,label])=>b('pane',label,attrs(id,`aria-pressed="${c.pane===id}"`),'apex-tab')).join('')}</nav>${b('shopping','采购清单','','apex-procurement')}</header>`;
}

function apexBrief(c){
 return `<section class="apex-brief"><span class="apex-kicker">粤菜 · 料理集结</span><h1>${e(c.r.titleZh)}</h1><p>${e(c.r.summary)}</p>${facts(c)}${portion(c)}<div class="apex-brief-tools">${b('favourite',c.s.favourites.includes(c.r.id)?'♥ 已收藏':'♡ 收藏',`aria-pressed="${c.s.favourites.includes(c.r.id)}"`,'apex-text-button')}${b('read','完整食谱 ↗','','apex-text-button')}</div>${b('pane','更换配方 →',attrs('catalog'),'apex-brief-change')}</section>`;
}

function apexFlags(c,compact=false){
 return `<div class="apex-flags ${compact?'apex-flags-compact':''}" aria-label="本机料理分工">${ROLES.map(([id,name,en],index)=>{
  const items=c.r.steps.map((s,i)=>({s,i})).filter(({s})=>roleFor(c,s)===id);
  const done=items.filter(({s})=>complete(c,s)).length;
  return `<section class="apex-flag apex-flag-${id}"><header><span class="apex-flag-number">0${index+1}</span><span class="apex-flag-count">${done} / ${items.length}</span></header><div class="apex-flag-role">${glyph(id)}<strong>${name}</strong><span>${en}</span></div><div class="apex-flag-tasks">${items.map(({s,i})=>{
   const signal=signalFor(c,s), active=c.pane==='cook'&&i===c.stepIndex;
   const label=signal==='done'?'已完成':SIGNALS.find(x=>x[0]===signal)?.[1]||'未标记';
   return b('step',`<span class="apex-task-number">${complete(c,s)?'✓':n2(i+1)}</span><span><strong>${e(s.title)}</strong><small class="apex-signal-${signal}">${signal==='none'?`${s.durationMin}–${s.durationMax} 分钟`:label}</small></span>`,`data-index="${i}" data-pane="cook" ${active?'aria-current="step"':''}`,'apex-flag-task');
  }).join('')||`<p class="apex-flag-empty">此配方未分配${name}步骤</p>`}</div><footer>${items.length?`${done} 项已确认完成`:b('pane','查看备料',attrs('prep'),'apex-text-button')}</footer></section>`;
 }).join('')}</div>`;
}

function apexCounts(c){
 const materials=c.r.ingredients.filter(i=>ready(i,c)).length;
 return `<div class="apex-loadout-counts">${b('pane',`<span>材料</span><b>${materials}<small> / ${c.r.ingredients.length}</small></b>`,attrs('prep'),'apex-count')}${b('pane',`<span>器具</span><b>${c.p.gear.length}<small> / ${c.r.equipment.length}</small></b>`,attrs('gear'),'apex-count')}<div class="apex-count"><span>完成步骤</span><b>${c.p.steps.length}<small> / ${c.r.steps.length}</small></b></div></div>`;
}

function apexAssignment(c,s){
 const role=roleFor(c,s);
 return `<label class="apex-assignment"><span>当前步骤归属</span><select data-field="station-assignment" data-step="${e(s.id)}" aria-label="${e(s.title)}的工位">${ROLES.map(([id,name])=>`<option value="${id}" ${role===id?'selected':''}>${name}工位</option>`).join('')}</select></label>`;
}

function apexPings(c,s){
 const current=signalFor(c,s);
 return `<section class="apex-ping-console" aria-label="当前步骤的本机标记"><header><span class="apex-diamond" aria-hidden="true"></span><h3>标记这一步</h3><span>本机记录</span></header><div class="apex-pings">${SIGNALS.map(([id,label,sign])=>b('ping',`<span aria-hidden="true">${sign}</span><strong>${label}</strong>`,`data-step="${e(s.id)}" data-value="${id}" aria-pressed="${id===current}"`,'apex-ping apex-ping-'+id)).join('')}</div></section>`;
}

function apexOperation(c){
 const s=c.r.steps[c.stepIndex]||c.r.steps[0];
 return `<div class="apex-operation"><div class="apex-op-heading"><span>${roleName(roleFor(c,s))}工位</span><b>${e(c.r.titleZh)}</b>${apexAssignment(c,s)}</div>${step(c)}${apexPings(c,s)}${cookControls(c)}</div>`;
}

export function renderApex(c){
 let body;
 if(c.pane==='catalog'){
  body=`<div class="apex-catalog"><section class="apex-panel apex-catalog-list"><header class="apex-panel-heading"><h1>选择本局配方</h1><span>${c.rows.length} 道粤菜</span></header>${recipeRows(c)}</section><aside class="apex-inspect">${apexBrief(c)}${apexCounts(c)}${b('pane','确认配方 · 分配工位 →',attrs('home'),'apex-launch')}${b('add-plan','加入采购','','apex-secondary')}</aside></div>`;
 }else if(c.pane==='prep'){
  body=`<div class="apex-loadout"><aside class="apex-loadout-brief">${apexBrief(c)}${apexCounts(c)}${b('add-plan','把此菜加入采购','','apex-secondary')}</aside><section class="apex-panel apex-materials"><header class="apex-panel-heading"><div><span>LOADOUT / MATERIALS</span><h2>材料整备</h2></div>${b('pane','配置器具 →',attrs('gear'),'apex-secondary')}</header>${ingredients(c)}${prepNotes(c)}</section></div>`;
 }else if(c.pane==='gear'){
  body=`<div class="apex-loadout"><aside class="apex-loadout-brief">${apexBrief(c)}${apexCounts(c)}${b('start',c.p.started?'继续烹饪 →':'开始烹饪 →','','apex-launch')}</aside><section class="apex-panel apex-equipment"><header class="apex-panel-heading"><div><span>LOADOUT / EQUIPMENT</span><h2>器具配置</h2></div>${b('pane','查看材料',attrs('prep'),'apex-secondary')}</header>${gear(c)}</section></div>`;
 }else if(c.pane==='cook'){
  body=`<div class="apex-cooking"><aside class="apex-cooking-roles"><div class="apex-cooking-title"><h1>工位调度</h1><span>步骤按内容分配，可自行调整</span></div>${apexFlags(c,true)}${b('pane','材料与份量',attrs('prep'),'apex-secondary')}</aside>${apexOperation(c)}</div>`;
 }else{
  body=`<div class="apex-lobby">${apexBrief(c)}${apexFlags(c)}<aside class="apex-mission"><div class="apex-mission-header"><span class="apex-diamond" aria-hidden="true"></span><h2>当前整备</h2></div>${apexCounts(c)}<p>选择具体步骤，再记录需要材料、处理中或等待。</p>${b('pane','材料整备 →',attrs('prep'),'apex-secondary')}${b('pane','器具配置 →',attrs('gear'),'apex-secondary')}</aside></div><footer class="apex-lobby-footer"><div><strong>${c.p.steps.length} / ${c.r.steps.length} 步</strong><span>本机进度 · 手动确认完成</span></div>${b('start',`<span>${c.p.started?'CONTINUE':'READY'}</span><strong>${c.p.started?'继续烹饪':'开始烹饪'}</strong><i aria-hidden="true">›</i>`,'','apex-launch apex-launch-large')}</footer>`;
 }
 return `<div class="apex-shell apex-pane-${e(c.pane)}">${apexNav(c)}${body}</div>`;
}

// Workstation filters inspect required equipment, including mixed stove/oven recipes.
function stationsFor(r){
 const equipment=(r.equipment||[]).map(g=>`${g.id||''} ${g.name||''}`).join(' ');
 const stations=[];
 if(/烤箱|\boven\b/i.test(equipment))stations.push('oven');
 if(/锅|炉灶|电磁炉|\b(?:stove|pot|pan|wok|steamer)\b/i.test(equipment))stations.push('stove');
 if(!stations.length)stations.push('prep');
 return stations;
}

function palNav(c){
 return `<header class="pal-topline"><div class="pal-wordmark">PALWORLD<span>基地制作</span></div><nav class="pal-navigation" aria-label="帕鲁料理操作">${[['home','基地'],['catalog','配方'],['prep','材料'],['gear','器具'],['cook','制作']].map(([id,label])=>b('pane',label,attrs(id,`aria-pressed="${c.pane===id}"`),'pal-tab')).join('')}</nav>${b('shopping','采购清单','','pal-shopping')}</header>`;
}

function palStationSelector(c){
 const current=STATIONS.some(x=>x[0]===c.ws.station)?c.ws.station:'prep';
 return `<div class="pal-station-select" aria-label="选择制作工位">${STATIONS.map(([id,name])=>{
  const count=c.rows.filter(r=>stationsFor(r).includes(id)).length;
  return b('station',`${glyph(id)}<strong>${name}</strong><small>${count} 道配方</small>`,`data-value="${id}" aria-pressed="${current===id}"`,'pal-station-choice');
 }).join('')}</div>`;
}

function palStationTags(r){return `<span class="pal-station-tags">${stationsFor(r).map(id=>`<span>${stationName(id)}</span>`).join('')}</span>`;}

function palCurrent(c,full=false){
 const queued=isQueued(c);
 return `<section class="pal-current"><header><span>当前制作项目</span>${palStationTags(c.r)}</header><h1>${e(c.r.titleZh)}</h1><p>${e(c.r.summary)}</p>${facts(c)}${portion(c)}<div class="pal-current-tools">${b('favourite',c.s.favourites.includes(c.r.id)?'♥ 已收藏':'♡ 收藏',`aria-pressed="${c.s.favourites.includes(c.r.id)}"`,'pal-text-button')}${b('read','完整食谱 ↗','','pal-text-button')}</div>${full?'':`<div class="pal-material-preview">${c.r.ingredients.slice(0,4).map(i=>`<div>${art(i.nameZh)}<span>${e(i.nameZh)}</span><b>${qty(i,c)}</b><i aria-label="${ready(i,c)?'已备好':'未确认'}">${ready(i,c)?'✓':'—'}</i></div>`).join('')}</div>${b('pane',`查看全部 ${c.r.ingredients.length} 项材料 →`,attrs('prep'),'pal-text-button')}`}<div class="pal-current-actions">${queued?b('queue-select','查看队列项目 →',`data-id="${c.r.id}"`,'pal-primary'):b('queue-add','＋ 加入制作队列','','pal-primary')}${b('add-plan','加入采购','','pal-secondary')}</div></section>`;
}

function palQueue(c){
 const queue=(c.ws.queue||[]).map(id=>c.byId.get(id)).filter(Boolean);
 return `<aside class="pal-queue"><header><h2>制作队列</h2><span>${queue.length} 项</span></header><div class="pal-queue-items">${queue.map((r,n)=>{
  const p=progressFor(c,r), done=r.steps.filter(s=>(p.steps||[]).includes(s.id)).length, total=r.steps.length;
  const status=done===total?'已完成':p.started?'制作中':'待准备';
  const serving=Number(p.servings)||r.servings;
  return `<article class="pal-queue-item ${r.id===c.r.id?'is-current':''}">${b('queue-select',`<span class="pal-queue-order">${n2(n+1)}</span><span><strong>${e(r.titleZh)}</strong><small>${serving} 人份 · ${status}</small></span>`,`data-id="${r.id}" aria-pressed="${r.id===c.r.id}"`,'pal-queue-select')}<div class="pal-queue-progress"><progress value="${done}" max="${total}" aria-label="${e(r.titleZh)}已完成步骤">${done}/${total}</progress><span>${done} / ${total} 步</span></div><div class="pal-queue-item-actions">${b('queue-move','↑',`data-id="${r.id}" data-value="-1" aria-label="上移${e(r.titleZh)}" ${n===0?'disabled':''}`,'pal-queue-tool')}${b('queue-move','↓',`data-id="${r.id}" data-value="1" aria-label="下移${e(r.titleZh)}" ${n===queue.length-1?'disabled':''}`,'pal-queue-tool')}${b('queue-remove','撤下',`data-id="${r.id}" aria-label="从制作队列撤下${e(r.titleZh)}"`,'pal-queue-remove')}</div></article>`;
 }).join('')||`<div class="pal-queue-empty"><span aria-hidden="true">＋</span><p>选好配方，加入第一个制作项目。</p>${b('pane','选择配方',attrs('catalog'),'pal-secondary')}</div>`}</div><footer><span>完成步骤后，进度才会增加。</span>${b('start',c.p.started?'继续当前制作 →':'开始当前制作 →','','pal-primary')}</footer></aside>`;
}

function palWorksite(c){
 const selected=STATIONS.some(x=>x[0]===c.ws.station)?c.ws.station:'prep';
 const rows=c.rows.filter(r=>stationsFor(r).includes(selected));
 return `<section class="pal-worksite" aria-label="基地工位"><div class="pal-site-heading"><span>制作工位</span><h2>${stationName(selected)}</h2><span>${rows.length} 道可选配方</span></div><div class="pal-site-pins">${STATIONS.map(([id,name])=>b('station',`${glyph(id)}<span>${name}</span>`,`data-value="${id}" aria-pressed="${selected===id}"`,'pal-site-pin pal-site-pin-'+id)).join('')}</div><div class="pal-site-actions">${b('pane',`在${stationName(selected)}选择配方 →`,attrs('catalog'),'pal-primary')}<span>${stationsFor(c.r).includes(selected)?'当前配方可在此工位制作':`当前配方需要${stationsFor(c.r).map(stationName).join('、')}`}</span></div></section>`;
}

function palCatalog(c){
 const station=STATIONS.some(x=>x[0]===c.ws.station)?c.ws.station:'prep';
 const matching=c.rows.filter(r=>stationsFor(r).includes(station));
 const filtered=c.ws.filter==='western'?matching.filter(r=>Number(r.id.split('-').at(-1))<=20):c.ws.filter==='dessert'?matching.filter(r=>Number(r.id.split('-').at(-1))>20):matching;
 return `<div class="pal-catalog-layout"><aside class="pal-panel pal-catalog-filters"><h2>选择工位</h2>${palStationSelector(c)}<div class="pal-recipe-filter" aria-label="配方类型">${[['all','全部'],['western','西餐'],['dessert','甜点']].map(([id,label])=>b('filter',label,`data-value="${id}" aria-pressed="${(c.ws.filter||'all')===id}"`,'pal-filter')).join('')}</div>${palCurrent(c,true)}</aside><section class="pal-panel pal-blueprints"><header><h1>${stationName(station)}配方</h1><span>${filtered.length} 道</span></header><div class="pal-blueprint-grid">${filtered.map(r=>b('select',`<span class="pal-blueprint-art">${art(r.ingredients[0]?.nameZh||r.titleZh)}</span><strong>${e(r.titleZh)}</strong>${palStationTags(r)}<small>${r.totalMinutes} 分钟 · ${r.ingredients.length} 项材料</small><span class="pal-blueprint-selected">${r.id===c.r.id?'✓ 当前配方':'选择配方 →'}</span>`,`data-id="${r.id}" aria-pressed="${r.id===c.r.id}"`,'pal-blueprint')).join('')||'<p class="pal-empty-filter">此工位暂无此类配方，请切换工位或选择全部。</p>'}</div></section>${palQueue(c)}</div>`;
}

function palReadiness(c){
 return `<div class="pal-readiness">${b('pane',`<span>材料</span><b>${c.r.ingredients.filter(i=>ready(i,c)).length} / ${c.r.ingredients.length}</b>`,attrs('prep',`aria-pressed="${c.pane==='prep'}"`),'pal-readiness-item')}${b('pane',`<span>器具</span><b>${c.p.gear.length} / ${c.r.equipment.length}</b>`,attrs('gear',`aria-pressed="${c.pane==='gear'}"`),'pal-readiness-item')}${b('pane',`<span>步骤</span><b>${c.p.steps.length} / ${c.r.steps.length}</b>`,attrs('cook',`aria-pressed="${c.pane==='cook'}"`),'pal-readiness-item')}</div>`;
}

function palTimeline(c){
 return `<nav class="pal-production-timeline" aria-label="制作步骤">${c.r.steps.map((s,n)=>b('step',`<span>${complete(c,s)?'✓':n2(n+1)}</span><strong>${e(s.title)}</strong><small>${s.durationMin}–${s.durationMax} 分钟</small>`,`data-index="${n}" ${n===c.stepIndex?'aria-current="step"':''}`,'pal-production-step '+(complete(c,s)?'is-complete':''))).join('')}</nav>`;
}

export function renderPalworld(c){
 let body;
 if(c.pane==='catalog')body=palCatalog(c);
 else if(c.pane==='prep'||c.pane==='gear'){
  body=`<div class="pal-preparation-layout"><aside class="pal-panel pal-project">${palCurrent(c,true)}${palReadiness(c)}</aside><section class="pal-panel pal-supply"><header><div><span>${stationName(stationsFor(c.r)[0])} · ${e(c.r.titleZh)}</span><h2>${c.pane==='prep'?'备齐制作材料':'配置制作器具'}</h2></div>${b('pane',c.pane==='prep'?'下一步 · 器具 →':'查看制作步骤 →',attrs(c.pane==='prep'?'gear':'cook'),'pal-primary')}</header>${c.pane==='prep'?ingredients(c)+prepNotes(c):gear(c)}</section>${palQueue(c)}</div>`;
 }else if(c.pane==='cook'){
  body=`<div class="pal-production-layout"><aside class="pal-panel pal-production-order"><header><span>当前制作</span><h1>${e(c.r.titleZh)}</h1>${palStationTags(c.r)}</header>${palReadiness(c)}${palTimeline(c)}${b('pane','调整材料与份量',attrs('prep'),'pal-secondary')}</aside><section class="pal-panel pal-active-production"><header class="pal-active-heading"><span class="pal-production-symbol">${glyph(stationsFor(c.r)[0])}</span><div><span>${stationName(stationsFor(c.r)[0])}</span><h2>手动制作</h2></div><span>${c.p.steps.length} / ${c.r.steps.length} 步完成</span></header>${step(c)}${cookControls(c)}</section>${palQueue(c)}</div>`;
 }else{
  body=`<div class="pal-base"><aside class="pal-panel pal-workbench"><header><h2>选择工位</h2></header>${palStationSelector(c)}${palCurrent(c)}</aside>${palWorksite(c)}${palQueue(c)}</div>`;
 }
 return `<div class="pal-shell pal-pane-${e(c.pane)}">${palNav(c)}${body}</div>`;
}
