import {recipes,recipeById} from '../data.js';
import sources from '../data/sources.json';
import {worlds} from '../themes.js';
import {indexRecipes,searchRecipes,escapeHTML as e,buildShoppingList,shoppingText,addToPlan,clampServings,formatQuantity,formatTime,timerRemaining,pauseTimer,resumeTimer} from '../domain.js';
import {recipeView} from '../recipe-view.js';
import {icon,b,need,ready,recipeRows} from './ui.js';
import {STORAGE_KEY,loadState,recipeProgress,themeState,completeStep,toggleMaterial,startStepTimer} from './state.js';
import './base.css';
import '../recipe.css';
import './reading.css';
import {renderForest,renderElden} from './views/forest-elden.js';
import {renderCsgo,renderDelta,renderPubg} from './views/tactical.js';
import {renderApex,renderPalworld} from './views/apex-palworld.js';
import {installCursor} from './pointer.js';

const views={forest:renderForest,csgo:renderCsgo,delta:renderDelta,pubg:renderPubg,apex:renderApex,elden:renderElden,palworld:renderPalworld};
const index=indexRecipes(recipes),app=document.querySelector('#app'),panel=document.querySelector('#panel');
let s=loadState(localStorage),active=worlds[0],query='',panelKind='',searchPosition=-1,searchMatches=[],toastTimeout;
const params=new URLSearchParams(location.search),routeRecipe=recipeById.get(params.get('recipe'));
active=worlds.find(w=>w.theme===params.get('world'))||worlds.find(w=>w.id===routeRecipe?.categoryId)||worlds[0];
if(routeRecipe){const ws=themeState(s,active,recipes.filter(r=>r.categoryId===active.id));ws.selected=routeRecipe.id;ws.pane=params.get('pane')||'prep';}else if(params.get('pane'))themeState(s,active,recipes.filter(r=>r.categoryId===active.id)).pane=params.get('pane');

function ctx(){const rows=recipes.filter(r=>r.categoryId===active.id),ws=themeState(s,active,rows),r=recipeById.get(ws.selected),p=recipeProgress(s,r);return {w:active,r,rows,all:recipes,byId:recipeById,s,ws,p,servings:p.servings,pane:ws.pane,stepIndex:p.step};}
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(s));}catch{toast('浏览器无法保存；本次操作仍可继续。');}}
function toast(message){const el=document.querySelector('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.classList.remove('show'),3300);}
function route(){const c=ctx();const url=new URL(location.href);url.search='';url.searchParams.set('world',active.theme);if(c.pane!=='home'){url.searchParams.set('recipe',c.r.id);url.searchParams.set('pane',c.pane);}history.replaceState(null,'',url);}
function shell(){app.innerHTML=`<header class="global-header"><a class="brand" href="?world=forest" aria-label="七界厨房首页"><span>VII</span><b>七界厨房</b></a><div class="global-search"><label class="search-box">${icon('search')}<input id="search" type="search" placeholder="搜菜名 / 食材" aria-label="搜索全部菜谱和食材" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="search-results"><kbd>/</kbd></label><div id="search-results" class="search-results" role="listbox" hidden></div></div><div class="global-actions">${b('favourites',icon('heart'), 'aria-label="我的收藏"','utility')}${b('shopping',icon('bag')+'<span id="plan-count">0</span>','aria-label="采购清单"','utility')}${b('timers',icon('clock')+'<span id="timer-count">0</span>','aria-label="计时器"','utility')}${b('settings',icon('settings'),'aria-label="显示设置"','utility')}</div><nav class="world-nav" aria-label="切换游戏主题">${worlds.map(w=>b('world',`<span>${w.theme==='forest'?'森林':w.theme==='elden'?'法环':w.theme==='palworld'?'帕鲁':w.game}</span><small>${w.cuisine}</small>`,`data-world="${w.theme}"`,'world-link')).join('')}</nav></header><main id="main" tabindex="-1"><div id="stage"></div></main><footer class="global-footer"><span>10.15 · 生日快乐</span><span>七个世界，认真做一餐。</span>${b('about','配方与使用说明','','text-button')}</footer>`;document.querySelector('#search').addEventListener('input',ev=>{query=ev.target.value;searchPosition=-1;renderSearch();});document.querySelector('#search').addEventListener('keydown',searchKey);}
function render({focus=false}={}){const c=ctx();document.body.dataset.theme=active.theme;document.body.dataset.systemCursor=String(s.systemCursor);document.body.dataset.motion=String(s.motion);document.querySelectorAll('.world-link').forEach(el=>{el.setAttribute('aria-current',el.dataset.world===active.theme?'page':'false');});const stage=document.querySelector('#stage');stage.className=`world ${active.theme}`;stage.dataset.pane=c.pane;stage.style.setProperty('--scene',`url("${new URL(`${import.meta.env.BASE_URL}art/${active.theme}-game.webp`,document.baseURI).href}")`);stage.innerHTML=`<div class="world-backdrop" aria-hidden="true"></div><div class="world-ui">${views[active.theme](c)}</div>`;document.title=`${active.game} · ${c.pane==='home'?'七界厨房':c.r.titleZh}`;document.querySelector('#plan-count').textContent=s.plan.length;updateTimers();route();save();if(focus){const target=stage.querySelector('h1,h2');if(target){target.tabIndex=-1;target.focus({preventScroll:true});}}}
function renderSearch(){const out=document.querySelector('#search-results'),input=document.querySelector('#search');if(!query.trim()){out.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');return;}searchMatches=searchRecipes(index,query);out.hidden=false;input.setAttribute('aria-expanded','true');out.innerHTML=`<div class="search-count">${searchMatches.length} 道匹配 · 全部菜系</div>${searchMatches.slice(0,30).map((r,n)=>b('search-select',`<strong>${e(r.titleZh)}</strong><span>${worlds.find(w=>w.id===r.categoryId).game} · ${r.totalMinutes} 分钟</span>`,`id="result-${n}" role="option" aria-selected="${searchPosition===n}" data-id="${r.id}"`,'search-result')).join('')||'<p class="empty">没有找到，试试食材名或英文名称。</p>'}`;if(searchPosition>=0){input.setAttribute('aria-activedescendant','result-'+searchPosition);document.querySelector('#result-'+searchPosition)?.scrollIntoView({block:'nearest'});}}
function searchKey(ev){if(ev.key==='Escape'){query='';ev.currentTarget.value='';renderSearch();ev.stopPropagation();}else if(['ArrowDown','ArrowUp'].includes(ev.key)){ev.preventDefault();searchPosition=Math.max(0,Math.min(Math.min(searchMatches.length,30)-1,searchPosition+(ev.key==='ArrowDown'?1:-1)));renderSearch();}else if(ev.key==='Enter'&&searchMatches.length){ev.preventDefault();selectRecipe(searchMatches[Math.max(searchPosition,0)].id,'prep');}}
function selectRecipe(id,pane){const r=recipeById.get(id);if(!r)return;active=worlds.find(w=>w.id===r.categoryId);const c=ctx();c.ws.selected=id;c.ws.focus='';if(pane)c.ws.pane=pane;query='';const search=document.querySelector('#search');if(search)search.value='';renderSearch();render({focus:true});if(panel.open)panel.close();window.scrollTo({top:0,behavior:'instant'});}
function closePanel(){panel.close();panelKind='';}
function openPanel(kind){panelKind=kind;renderPanel();if(!panel.open)panel.showModal();panel.scrollTop=0;}
function documentState(c){return {favourites:s.favourites,progress:{[c.r.id]:{steps:c.p.steps,ingredients:c.r.ingredients.filter(i=>ready(i,c)).map(i=>i.id)}}};}
function renderPanel(){const c=ctx();if(panelKind==='read'){panel.innerHTML=recipeView(c.r,c.servings,documentState(c),sources);return;}let title='',html='';
if(panelKind==='shopping'){title='采购清单';const rows=buildShoppingList(s.plan,recipes);html=`<p class="panel-intro">${s.plan.length} 道菜 · ${rows.length} 项食材。勾选只代表你已采购。</p><div class="shopping-recipes">${s.plan.map(item=>{const r=recipeById.get(item.recipeId);return r?`<div><button class="text-button" data-action="search-select" data-id="${r.id}">${e(r.titleZh)}</button><label>人数<input type="number" min="1" max="12" value="${item.servings}" data-field="plan-servings" data-id="${r.id}"></label>${b('remove-plan','移除',`data-id="${r.id}"`)}</div>`:'';}).join('')}</div>${rows.length?`<div class="actions">${b('copy-list',icon('bag')+'复制清单')}${b('export-list',icon('download')+'导出清单')}</div><div class="shopping-rows">${rows.map(row=>`<label><input type="checkbox" data-field="shopping-check" data-id="${e(row.key)}" ${s.checked.includes(row.key)?'checked':''}><span><strong>${e(row.nameZh)}${row.optional?'（可选）':''}</strong><small>${e(row.nameUk)}</small>${row.labelChecks.map(x=>`<small>${e(x)}</small>`).join('')}</span><b>${formatQuantity(row.quantity)} ${e(row.unit)}</b></label>`).join('')}</div>`:'<div class="empty"><h3>还没有采购项目</h3><p>在游戏界面选择食谱，点击加入采购。</p>'+b('add-plan','加入当前菜：'+e(c.r.titleZh),'','btn primary')+'</div>'}`;}
else if(panelKind==='favourites'){title='我的收藏';const list=recipes.filter(r=>s.favourites.includes(r.id));html=list.length?`<div class="favourite-list">${list.map(r=>b('search-select',`<strong>${e(r.titleZh)}</strong><small>${worlds.find(w=>w.id===r.categoryId).game} · ${r.totalMinutes} 分钟</small>`,`data-id="${r.id}"`,'recipe-row')).join('')}</div>`:'<div class="empty">收藏喜欢的配方，下次从这里继续。</div>';}
else if(panelKind==='timers'){title='料理计时';html=`<p class="panel-intro">计时结束请检查食物状态。关闭页面后不会主动通知。</p><div id="timer-panel-list"></div>`;}
else if(panelKind==='settings'){title='显示设置';html=`<label class="setting-row"><span><b>系统鼠标</b><small>使用原生指针；输入框始终使用文字光标。</small></span><input type="checkbox" data-field="system-cursor" ${s.systemCursor?'checked':''}></label><label class="setting-row"><span><b>界面动态</b><small>系统减少动态设置始终优先。</small></span><input type="checkbox" data-field="motion" ${s.motion?'checked':''}></label>`;}
else {title='七界厨房';html=`<div class="about-copy"><h3>七个世界，300 道完整配方。</h3><p>食材、器具和完成状态都由你操作确认。所有记录保存在当前浏览器，无账户或云同步。</p><p>材料可按人数换算；器具、时间、温度和单个成形尺寸请按原方与熟度判断。配方不主动加入乳制品，包装食品和替代品请核对过敏原标签。</p><p>配方经过资料编审，未逐道实地试做。完整配方含备料、步骤、失误处理、保存和资料来源。</p><p>游戏场景为原创生成插画，主题界面为料理用途的原创改编，非游戏官方产品。角色只作场景展示。</p><h3>键盘操作</h3><p>/ 搜索 · Tab 选择控件 · Enter / 空格 操作 · Esc 返回。所有拖动都有点按等价操作。</p></div>`;}
panel.innerHTML=`<div class="panel-toolbar"><h1 id="panel-title">${title}</h1>${b('close-panel',icon('close'),'aria-label="关闭面板"','icon-button')}</div><div class="utility-panel">${html}</div>`;updateTimers();}

function addCurrentPlan(c){s.plan=addToPlan(s.plan,c.r.id,c.servings);s.checked=[];toast('已加入采购：'+c.r.titleZh);}
function progressChange(c){if(s.plan.some(x=>x.recipeId===c.r.id))s.plan=addToPlan(s.plan,c.r.id,c.p.servings);}
function handle(action,el){let c=ctx();const id=el.dataset.id;
if(action==='world'){active=worlds.find(w=>w.theme===el.dataset.world)||active;ctx().ws.pane='home';render({focus:true});window.scrollTo({top:0,behavior:'instant'});return;}
if(action==='search-select'){selectRecipe(id,'prep');return;}
if(['shopping','favourites','timers','settings','about','read'].includes(action)){openPanel(action);return;}
if(['close-panel','back-to-recipe'].includes(action)){closePanel();return;}
if(action==='pane'){c.ws.pane=el.dataset.pane;if(c.ws.pane==='cook')c.p.started=true;}
else if(action==='back'){c.ws.pane='home';}
else if(['select','map-select'].includes(action)){if(c.rows.some(r=>r.id===id)){c.ws.selected=id;c.ws.focus='';if(el.dataset.pane)c.ws.pane=el.dataset.pane;}}
else if(action==='filter'){c.ws.filter=el.dataset.value;}
else if(action==='favourite'){s.favourites=s.favourites.includes(c.r.id)?s.favourites.filter(x=>x!==c.r.id):[...s.favourites,c.r.id];toast(s.favourites.includes(c.r.id)?'已收藏 '+c.r.titleZh:'已取消收藏');}
else if(['portion','portion-minus','portion-plus'].includes(action)){c.p.servings=clampServings(c.servings+(action==='portion-minus'?-1:action==='portion-plus'?1:Number(el.dataset.value)));progressChange(c);s.checked=[];}
else if(['ingredient','fill-ingredient','clear-ingredient'].includes(action)){const i=c.r.ingredients.find(i=>i.id===id);if(i){if(action==='ingredient')toggleMaterial(c.p,i,need(i,c));else c.p.amounts[id]=action==='fill-ingredient'?need(i,c):0;}}
else if(action==='focus-ingredient'){c.ws.focus=id;}
else if(action==='gear'){const n=el.dataset.index;c.p.gear=c.p.gear.includes(n)?c.p.gear.filter(x=>x!==n):[...c.p.gear,n];}
else if(['start','start-cooking'].includes(action)){c.p.started=true;c.ws.pane='cook';if(panel.open)closePanel();}
else if(['step','goto-step'].includes(action)){c.p.step=Math.min(c.r.steps.length-1,Math.max(0,Number(el.dataset.index)));c.p.started=true;c.ws.pane=el.dataset.pane||'cook';}
else if(['prev-step','next-step'].includes(action)){c.p.step=Math.max(0,Math.min(c.r.steps.length-1,c.p.step+(action==='next-step'?1:-1)));}
else if(['complete','complete-step'].includes(action)){const stepId=el.dataset.step||c.r.steps[c.p.step].id;completeStep(c.p,stepId);if(active.theme==='apex')c.ws.pings[c.r.id+':'+stepId]=c.p.steps.includes(stepId)?'done':'none';}
else if(action==='reset-progress'){c.p.steps=[];c.p.step=0;}
else if(['timer','start-step-timer'].includes(action)){const step=c.r.steps.find(x=>x.id===el.dataset.step)||c.r.steps[c.p.step];toast(startStepTimer(s,c.r,step)?'计时已开始；结束后请检查状态。':'这一步的计时正在保留，可在顶部计时器查看。');}
else if(action==='timer-pause'){const t=s.timers[id];if(t)s.timers[id]=t.status==='paused'?resumeTimer(t):pauseTimer(t);}
else if(action==='timer-remove'){delete s.timers[id];}
else if(action==='add-plan'){addCurrentPlan(c);}
else if(action==='remove-plan'){s.plan=s.plan.filter(x=>x.recipeId!==id);s.checked=[];}
else if(action==='menu-toggle'){const item=id||c.r.id;c.ws.menu=c.ws.menu.includes(item)?c.ws.menu.filter(x=>x!==item):[...c.ws.menu,item];}
else if(action==='menu-select'){c.ws.selected=id;c.ws.pane='prep';}
else if(action==='menu-plan'){for(const recipeId of c.ws.menu){const r=recipeById.get(recipeId);if(r)s.plan=addToPlan(s.plan,recipeId,recipeProgress(s,r).servings);}s.checked=[];toast(`已更新 ${c.ws.menu.length} 道菜的采购`);}
else if(action==='refresh'){c.ws.offset=(c.ws.offset+5)%c.rows.length;toast('候选菜谱顺序已轮换');}
else if(action==='queue-add'){if(!c.ws.queue.includes(c.r.id))c.ws.queue.push(c.r.id);toast('已加入制作队列');}
else if(action==='queue-select'){c.ws.selected=id;c.ws.pane='prep';}
else if(action==='queue-remove'){c.ws.queue=c.ws.queue.filter(x=>x!==id);}
else if(action==='queue-move'){const n=c.ws.queue.indexOf(id),next=n+Number(el.dataset.value);if(n>=0&&next>=0&&next<c.ws.queue.length)[c.ws.queue[n],c.ws.queue[next]]=[c.ws.queue[next],c.ws.queue[n]];}
else if(action==='station'){c.ws.station=el.dataset.value;c.ws.pane='catalog';}
else if(action==='ping'){const key=c.r.id+':'+el.dataset.step;c.ws.pings[key]=el.dataset.value;if(el.dataset.value==='done'&&!c.p.steps.includes(el.dataset.step))c.p.steps.push(el.dataset.step);toast(el.dataset.value==='none'?'已撤下工位标记':'本机工位标记已更新');}
else if(action==='assign'){c.ws.assignments[c.r.id+':'+el.dataset.step]=el.dataset.value;}
else if(action==='map-page'){const pages=Math.ceil(c.rows.length/8);c.ws.mapPage=(c.ws.mapPage+Number(el.dataset.value)+pages)%pages;}
else if(action==='copy-list'){navigator.clipboard.writeText(shoppingText(buildShoppingList(s.plan,recipes),s.checked)).then(()=>toast('采购清单已复制')).catch(()=>toast('无法访问剪贴板，请使用导出清单。'));return;}
else if(action==='export-list'){const url=URL.createObjectURL(new Blob([shoppingText(buildShoppingList(s.plan,recipes),s.checked)],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='七界厨房-采购清单.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;}
else return;
const oldFocus={action:el.dataset.action,id:el.dataset.id,index:el.dataset.index,step:el.dataset.step,pane:el.dataset.pane};const navigation=['pane','back','start','start-cooking','step','goto-step','prev-step','next-step','menu-select','queue-select','station'].includes(action);const scrollY=navigation?0:window.scrollY;render();if(panel.open)renderPanel();window.scrollTo({top:scrollY,behavior:'instant'});const candidates=[...(panel.open?panel:document).querySelectorAll(`[data-action="${oldFocus.action}"]`)];const replacement=candidates.find(x=>['id','index','step','pane'].every(k=>x.dataset[k]===oldFocus[k]));if(navigation){const heading=document.querySelector('.world-ui h1,.world-ui h2');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}}else replacement?.focus({preventScroll:true});}

document.addEventListener('click',ev=>{const target=ev.target.closest('[data-action]');if(target&&!target.disabled)handle(target.dataset.action,target);if(!ev.target.closest('.global-search')){const results=document.querySelector('#search-results');if(results)results.hidden=true;document.querySelector('#search')?.setAttribute('aria-expanded','false');}});
document.addEventListener('change',ev=>{const el=ev.target,c=ctx(),field=el.dataset.field;if(el.dataset.ingredient){const i=c.r.ingredients.find(i=>i.id===el.dataset.ingredient);if(i)c.p.amounts[i.id]=el.checked?need(i,c):0;}else if(field==='recipe'){c.ws.selected=el.value;c.ws.focus='';}else if(field==='amount'){const n=Number(el.value);c.p.amounts[el.dataset.id]=Number.isFinite(n)?Math.max(0,Math.min(n,10000000)):0;}else if(field==='servings'){c.p.servings=clampServings(el.value,c.servings);progressChange(c);s.checked=[];}else if(field==='plan-servings'){const item=s.plan.find(x=>x.recipeId===el.dataset.id);if(item){item.servings=clampServings(el.value);recipeProgress(s,recipeById.get(item.recipeId)).servings=item.servings;s.checked=[];}}else if(field==='shopping-check'){s.checked=el.checked?[...new Set([...s.checked,el.dataset.id])]:s.checked.filter(x=>x!==el.dataset.id);}else if(field==='system-cursor'){s.systemCursor=el.checked;}else if(field==='motion'){s.motion=el.checked;}else if(field==='station-assignment'){c.ws.assignments[c.r.id+':'+el.dataset.step]=el.value;}else return;render();if(panel.open)renderPanel();});
document.addEventListener('keydown',ev=>{if(ev.key==='Escape'){if(panel.open)return;const out=document.querySelector('#search-results');if(!out.hidden){out.hidden=true;return;}ctx().ws.pane='home';render({focus:true});}if(ev.key==='/'&&!ev.ctrlKey&&!ev.metaKey&&!/INPUT|TEXTAREA|SELECT/.test(ev.target.tagName)&&!panel.open){ev.preventDefault();document.querySelector('#search').focus();}if(/INPUT|TEXTAREA|SELECT/.test(ev.target.tagName)||panel.open)return;const shortcuts={forest:{i:'prep'},csgo:{b:'catalog'},elden:{m:'map'}};const pane=shortcuts[active.theme]?.[ev.key.toLowerCase()];if(pane){ev.preventDefault();ctx().ws.pane=ctx().pane===pane?'home':pane;render({focus:true});}});
panel.addEventListener('close',()=>{panelKind='';});
document.addEventListener('dragstart',ev=>{const el=ev.target.closest('[data-drag-ingredient]');if(el)ev.dataTransfer.setData('text/plain',el.dataset.dragIngredient);});
document.addEventListener('dragover',ev=>{if(ev.target.closest('[data-drop="ingredients"]'))ev.preventDefault();});
document.addEventListener('drop',ev=>{if(!ev.target.closest('[data-drop="ingredients"]'))return;ev.preventDefault();const c=ctx(),id=ev.dataTransfer.getData('text/plain'),i=c.r.ingredients.find(x=>x.id===id);if(i){c.p.amounts[id]=need(i,c);render();toast('已记录备好：'+i.nameZh);}});
function timerRow(id,t){const remaining=timerRemaining(t),done=remaining===0;return `<div class="timer-row"><span><b>${e(t.label)}</b><strong data-timer-clock="${e(id)}">${formatTime(remaining)}</strong><small>${done?'计时结束，请检查食物状态':t.status==='paused'?'已暂停':'计时中'}</small></span><div>${!done?b('timer-pause',t.status==='paused'?'继续':'暂停',`data-id="${e(id)}"`):''}${b('timer-remove','移除',`data-id="${e(id)}"`)}</div></div>`;}
function updateTimers(){
  let changed=false;
  for(const t of Object.values(s.timers)){if(t.status==='running'&&timerRemaining(t)===0){t.status='done';t.remainingMs=0;t.deadline=null;changed=true;toast(t.label+'：计时结束，请检查状态。');}}
  if(changed)save();
  const entries=Object.entries(s.timers),count=document.querySelector('#timer-count');if(count)count.textContent=entries.length;
  const sync=(el,rows)=>{const signature=rows.map(([id,t])=>id+':'+t.status).join('|');if(el.dataset.timerSignature!==signature){el.innerHTML=rows.map(([id,t])=>timerRow(id,t)).join('')||(el.id==='timer-panel-list'?'<p class="empty">计时尚未启动。每一步都可按实际开始时间启动。</p>':'');el.dataset.timerSignature=signature;}};
  document.querySelectorAll('[data-inline-timer]').forEach(el=>{const id=el.dataset.inlineTimer;sync(el,s.timers[id]?[[id,s.timers[id]]]:[]);});
  const list=document.querySelector('#timer-panel-list');if(list)sync(list,entries);
  document.querySelectorAll('[data-timer-clock]').forEach(el=>{const t=s.timers[el.dataset.timerClock];if(t)el.textContent=formatTime(timerRemaining(t));});
}
shell();render();installCursor();setInterval(updateTimers,1000);
