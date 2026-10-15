import {e,b,art,qty,ready,facts,portion,recipeRows,recipePicker,gear,step,cookControls,prepNotes,status} from '../ui.js';
import './forest-elden.css';

const attr = (key, value) => `data-${key}="${e(value)}"`;
const paneButton = (pane, label, cls = 'btn', extra = '') => b('pane', label, `data-pane="${pane}" ${extra}`, cls);
const selected = (yes) => `aria-pressed="${Boolean(yes)}"`;
const titleOf = (r) => e(r.titleZh);
const countReady = (c) => c.r.ingredients.filter(i => ready(i,c)).length;
const favourites = (c) => c.s.favourites || [];
const done = (c, s) => (c.p.steps || []).includes(s.id);
const itemName = (r) => r.ingredients?.[0]?.nameZh || r.titleZh;
const favour = (c, cls = 'btn') => b('favourite',favourites(c).includes(c.r.id)?'◆ 已收藏':'◇ 收藏食谱',selected(favourites(c).includes(c.r.id)),cls);
const procurement = (cls='btn') => b('add-plan','加入采购清单','',cls);

function forestTabs(c){
  return `<nav class="forest-book-tabs" aria-label="野外手册页签">${[['catalog','配方'],['prep','物品'],['gear','工具'],['cook','做法']].map(([p,label])=>paneButton(p,label,'forest-book-tab',`aria-current="${c.pane===p?'page':'false'}"`)).join('')}</nav>`;
}

function forestTop(c,label){
  return `<div class="forest-topline"><div><span class="forest-kicker">野外手册 / 晋菜</span><h1>${e(label)}</h1></div>${b('back','收起手册','','forest-text-button')}</div>`;
}

function forestActions(c){
  return `<div class="forest-page-actions">${favour(c,'forest-text-button')}${b('read','完整配方','','forest-text-button')}${b('shopping','采购清单','','forest-text-button')}</div>`;
}

function forestIngredients(c, compact=false){
  return `<ul class="forest-checklist ${compact?'forest-checklist-compact':''}">${c.r.ingredients.map(i=>`<li class="${ready(i,c)?'is-ready':''}">${b('ingredient',`<span class="forest-checkbox" aria-hidden="true">${ready(i,c)?'✓':''}</span><span class="forest-check-name"><strong>${e(i.nameZh)}</strong>${compact?'':`<small>${e(i.prep||i.group||'')}${i.optional?' · 可选':''}</small>`}</span><span class="forest-check-qty">${qty(i,c)}</span>`,`${attr('id',i.id)} ${selected(ready(i,c))}`,'forest-check-button')}</li>`).join('')}</ul>`;
}

function forestEquipment(c){
  return `<div class="forest-tools">${c.r.equipment.map((t,n)=>`<section class="forest-tool ${c.p.gear.includes(String(n))?'is-ready':''}">${b('gear',`<span class="forest-tool-art">${art(t.name)}</span><span><span class="forest-tool-number">工具 ${String(n+1).padStart(2,'0')}</span><strong>${e(t.name)}</strong><small>${e(t.capacityOrSize||t.size||'')}</small></span><span class="forest-checkbox" aria-hidden="true">${c.p.gear.includes(String(n))?'✓':''}</span>`,`data-index="${n}" ${selected(c.p.gear.includes(String(n)))}`,'forest-tool-toggle')}${(t.alternative||t.effectOnMethod)?`<details><summary>替代与使用</summary>${t.alternative?`<p>${e(t.alternative)}</p>`:''}${t.effectOnMethod?`<p>${e(t.effectOnMethod)}</p>`:''}</details>`:''}</section>`).join('')}</div>`;
}

function forestHome(c){
  const progress=c.p.started;
  return `<div class="forest-home"><div class="forest-home-menu"><span class="forest-kicker">10.15 · 生日快乐</span><h1><span>SONS OF</span>THE FOREST</h1><p class="forest-home-subtitle">森林之子 <span>晋菜 · 50 道</span></p><nav aria-label="营地主菜单">${paneButton('catalog','<span>01</span> 打开野外手册','forest-menu-choice')}${paneButton('prep','<span>02</span> 展开备料铺垫','forest-menu-choice')}${b('shopping','<span>03</span> 采购清单','','forest-menu-choice')}${progress?paneButton('cook','<span>↳</span> 继续做菜','forest-menu-choice forest-resume'):''}</nav></div><button class="forest-gps" data-action="pane" data-pane="prep" aria-label="打开当前配方的备料铺垫"><span class="forest-gps-antenna" aria-hidden="true"></span><span class="forest-gps-screen"><span class="forest-gps-grid" aria-hidden="true"></span><span class="forest-gps-label">当前配方</span><strong>${titleOf(c.r)}</strong><span class="forest-gps-pin" aria-hidden="true">⌖</span><span class="forest-gps-detail">${countReady(c)} / ${c.r.ingredients.length} 项已准备</span><span class="forest-gps-open">打开备料 →</span></span><span class="forest-gps-hardware" aria-hidden="true"><i></i><i></i><i></i></span></button></div>`;
}

function forestCatalog(c){
  return `${forestTop(c,'料理配方')}${forestTabs(c)}<div class="forest-notebook forest-catalog-book"><section class="forest-paper forest-catalog-index"><header class="forest-page-heading"><h2>配方目录</h2><span>${c.rows.length} 道</span></header><div class="forest-catalog-list">${recipeRows(c)}</div></section><section class="forest-paper forest-recipe-page"><span class="forest-paper-kicker">当前配方</span><h2>${titleOf(c.r)}</h2><div class="forest-recipe-drawing" aria-hidden="true">${art(itemName(c.r))}<span>＋</span>${art(c.r.equipment.find(x=>/锅|碗/.test(x.name))?.name||'搅拌碗与量具')}<span>→</span><span class="forest-line-bowl">♨</span></div><p>${e(c.r.summary)}</p>${facts(c)}${portion(c)}<div class="forest-recipe-groups">${[...new Set(c.r.ingredients.map(i=>i.group||'材料'))].map(g=>`<span>${e(g)}</span>`).join('')}</div><p class="forest-paper-count">${c.r.ingredients.length} 项材料 · ${c.r.equipment.length} 件器具 · ${c.r.steps.length} 个步骤</p>${paneButton('prep','展开铺垫 →','forest-orange-button')}${forestActions(c)}</section></div>`;
}

function forestPrep(c){
  const focus=c.r.ingredients.find(i=>i.id===c.ws.focus)||c.r.ingredients.find(i=>!ready(i,c))||c.r.ingredients[0];
  const prepared=c.r.ingredients.filter(i=>ready(i,c));
  return `${forestTop(c,'备料铺垫')}${forestTabs(c)}<div class="forest-prep-layout"><section class="forest-tarp" aria-label="食材库存铺垫"><div class="forest-tarp-edge" aria-hidden="true"></div><div class="forest-supply-heading"><h2>${titleOf(c.r)}</h2><span>${countReady(c)} / ${c.r.ingredients.length} 已准备</span></div><div class="forest-supply-rack">${c.r.ingredients.map((i,n)=>b('focus-ingredient',`${art(i.nameZh)}<strong>${e(i.nameZh)}</strong><span>${qty(i,c)}</span>${ready(i,c)?'<i class="forest-item-check" aria-label="已准备">✓</i>':''}`,`${attr('id',i.id)} data-drag-ingredient="${e(i.id)}" draggable="true" ${selected(focus.id===i.id)}`,`forest-supply ${ready(i,c)?'is-packed':''} ${focus.id===i.id?'is-focused':''} ${/面粉|米|肉|排骨/.test(i.nameZh)?'forest-supply-wide':/油|水|醋|酒|抽/.test(i.nameZh)?'forest-supply-tall':''} forest-item-${n%3}`)).join('')}</div><div class="forest-combine-mat" data-drop="ingredients"><div class="forest-mat-title"><span>备料组合</span><b>${prepared.length}<small> / ${c.r.ingredients.length}</small></b></div><div class="forest-inspect-item"><div class="forest-inspect-art">${art(focus.nameZh)}</div><div><span class="forest-mat-eyebrow">${ready(focus,c)?'已放入组合区':'选中的食材'}</span><h3>${e(focus.nameZh)}</h3><p>${e(focus.prep||'称量后放入备料区')}</p><strong>${qty(focus,c)}</strong></div></div><div class="forest-mat-actions">${b(ready(focus,c)?'clear-ingredient':'fill-ingredient',ready(focus,c)?'移回物品区':'已备好，放入组合区',attr('id',focus.id),'forest-orange-button')}${b('add-plan','添加配方至采购','','forest-mat-button')}</div><div class="forest-packed-tray" aria-label="已备好的食材">${prepared.map(i=>b('clear-ingredient',`${art(i.nameZh)}<span>${e(i.nameZh)}</span><i aria-hidden="true">×</i>`,`${attr('id',i.id)} aria-label="移回${e(i.nameZh)}"`,'forest-packed-item')).join('')||'<p class="forest-mat-empty">确认备好后，食材会放到这里。</p>'}</div></div></section><aside class="forest-paper forest-prep-manual"><span class="forest-paper-kicker">材料页</span><h2>${titleOf(c.r)}</h2>${portion(c)}${forestIngredients(c)}${prepNotes(c)}${paneButton('gear','翻到工具页 →','forest-orange-button')}${forestActions(c)}</aside></div>`;
}

function forestGear(c){
  return `${forestTop(c,'工具页')}${forestTabs(c)}<div class="forest-notebook forest-gear-book"><section class="forest-paper"><header class="forest-page-heading"><h2>所需工具</h2><span>${c.p.gear.length} / ${c.r.equipment.length} 已确认</span></header>${forestEquipment(c)}</section><section class="forest-paper forest-camp-page"><span class="forest-paper-kicker">开始之前</span><h2>${titleOf(c.r)}</h2>${facts(c)}${portion(c)}<div class="forest-camp-sketch" aria-hidden="true"><span>△</span><i></i><b>♨</b></div>${status(c)}${prepNotes(c)}<p class="forest-tool-note">确认器具容量和食材份量，再按手册步骤操作。</p>${b('start',c.p.started?'继续手册步骤 →':'打开做法第一页 →','','forest-orange-button')}${paneButton('prep','← 回到备料铺垫','forest-text-button')}${forestActions(c)}</section></div>`;
}

function forestCook(c){
  return `${forestTop(c,'料理手册')}${forestTabs(c)}<div class="forest-notebook forest-cook-book"><aside class="forest-paper forest-step-index"><span class="forest-paper-kicker">${titleOf(c.r)}</span><h2>做法目录</h2><ol class="forest-step-list">${c.r.steps.map((s,n)=>`<li>${b('step',`<span class="forest-step-mark">${done(c,s)?'✓':String(n+1).padStart(2,'0')}</span><span><strong>${e(s.title)}</strong><small>${done(c,s)?'已完成':n===c.stepIndex?'正在查看':e(s.phase||s.heat||'未完成')}</small></span>`,`data-index="${n}" aria-current="${n===c.stepIndex?'step':'false'}"`,'forest-step-link')}</li>`).join('')}</ol><details class="forest-book-materials"><summary>查看备料记录 · ${countReady(c)} / ${c.r.ingredients.length}</summary>${forestIngredients(c,true)}</details>${forestActions(c)}</aside><section class="forest-paper forest-active-page"><div class="forest-page-heading"><span class="forest-paper-kicker">做法</span><span>第 ${c.stepIndex+1} / ${c.r.steps.length} 页</span></div>${step(c)}<div class="forest-page-turn">${cookControls(c)}</div></section></div>`;
}

export function renderForest(c){
  const views={home:forestHome,catalog:forestCatalog,prep:forestPrep,gear:forestGear,cook:forestCook};
  return `<div class="forest-shell forest-pane-${e(c.pane)}">${(views[c.pane]||forestHome)(c)}</div>`;
}

function eldenEmblem(){return '<span class="elden-sigil" aria-hidden="true"><i></i><i></i><i></i><b></b></span>';}
function eldenTop(c){
  return `<header class="elden-topline"><div class="elden-top-title">${eldenEmblem()}<span>赐福食谱</span></div><nav aria-label="赐福菜单">${[['catalog','物品制作'],['map','地图'],['prep','材料'],['gear','器具'],['cook','赐福']].map(([p,label])=>paneButton(p,label,'elden-tab',`aria-current="${c.pane===p?'page':'false'}"`)).join('')}</nav>${b('back','返回','','elden-back')}</header>`;
}

function eldenRecipeStats(c){
  return `<dl class="elden-stats"><div><dt>总计</dt><dd>${e(c.r.totalMinutes??c.r.timing?.totalMinutes??'—')} 分钟</dd></div><div><dt>份量</dt><dd>${c.servings} 人份</dd></div><div><dt>材料</dt><dd>${countReady(c)} / ${c.r.ingredients.length} 已准备</dd></div><div><dt>器具</dt><dd>${c.p.gear.length} / ${c.r.equipment.length} 已确认</dd></div><div><dt>做法</dt><dd>${c.p.steps.length} / ${c.r.steps.length} 已完成</dd></div></dl>`;
}

function eldenMaterials(c,interactive=false){
  return `<ul class="elden-material-list">${c.r.ingredients.map(i=>`<li class="${ready(i,c)?'is-ready':''}">${interactive?b('ingredient',`${art(i.nameZh)}<span><strong>${e(i.nameZh)}</strong><small>${e(i.prep||i.group||'')}${i.optional?' · 可选':''}</small></span><span class="elden-material-quantity">${qty(i,c)}<small>${ready(i,c)?'✓ 已准备':'未准备'}</small></span>`,`${attr('id',i.id)} ${selected(ready(i,c))}`,'elden-material-button'):`<div class="elden-material-preview">${art(i.nameZh)}<strong>${e(i.nameZh)}</strong><span>${qty(i,c)}</span></div>`}</li>`).join('')}</ul>`;
}

function eldenHome(c){
  return `<div class="elden-home"><div class="elden-home-heading">${eldenEmblem()}<span>10.15 · 生日快乐</span><h1>ELDEN RING</h1><p>赐福之间</p></div><nav class="elden-main-menu" aria-label="赐福主菜单">${paneButton('catalog','物品制作','elden-menu-choice')}${paneButton('map','展开地图','elden-menu-choice')}${paneButton('prep','查看制作材料','elden-menu-choice')}${b('shopping','采购清单','','elden-menu-choice')}${c.p.started?paneButton('cook',`继续制作 <small>${titleOf(c.r)}</small>`,'elden-menu-choice elden-resume'):''}</nav><div class="elden-home-current"><span>当前食谱</span><strong>${titleOf(c.r)}</strong><span>江浙菜 · 40 道完整配方</span></div></div>`;
}

function eldenCatalogue(c){
  return `${eldenTop(c)}<div class="elden-inventory-layout"><section class="elden-items-panel"><div class="elden-section-title"><h1>物品制作</h1><span>${c.rows.length} 道</span></div><div class="elden-item-grid">${c.rows.map((r,n)=>b('select',`${art(itemName(r))}<strong>${titleOf(r)}</strong><span class="elden-item-no">${String(n+1).padStart(2,'0')}</span>${favourites(c).includes(r.id)?'<i class="elden-item-fav" aria-label="已收藏">◆</i>':''}`,`${attr('id',r.id)} ${selected(r.id===c.r.id)}`,`elden-item ${r.id===c.r.id?'is-selected':''}`)).join('')}</div></section><section class="elden-inspection"><h2>${titleOf(c.r)}</h2><div class="elden-relic" aria-hidden="true"><span class="elden-relic-halo"></span>${art(c.r.equipment.find(t=>/锅|蒸|煎/.test(t.name))?.name||itemName(c.r))}</div><p class="elden-description">${e(c.r.summary)}</p>${facts(c)}${portion(c)}<div class="elden-inspection-actions">${paneButton('prep','准备制作材料','elden-gold-button')}${favour(c,'elden-text-button')}${b('read','查看完整配方','','elden-text-button')}</div></section><aside class="elden-requirements"><h2>制作所需</h2>${eldenRecipeStats(c)}${eldenMaterials(c)}${procurement('elden-text-button')}</aside></div>`;
}

const mapPoints=[[16,20],[45,14],[73,27],[30,40],[64,51],[17,67],[44,78],[78,78]];
function mapTerrain(){
  return `<svg class="elden-terrain" viewBox="0 0 900 650" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><pattern id="elden-map-contours" width="84" height="64" patternUnits="userSpaceOnUse"><path d="M-20 48Q20 2 104 28M-20 55Q25 12 104 36M-20 62Q28 20 104 44" fill="none" stroke="currentColor" stroke-width=".8"/></pattern><pattern id="elden-map-forest" width="25" height="31" patternUnits="userSpaceOnUse"><path d="m12 4-6 12h4l-6 8h16l-6-8h4Z" fill="none" stroke="currentColor" stroke-width="1"/></pattern></defs><path class="elden-map-ocean" d="M-10 0H240Q265 88 166 145T117 270Q15 300 62 425T48 660H-10ZM820-10H920V660H650Q702 555 803 543T789 416Q738 309 826 237T820-10"/><path class="elden-map-land" d="M240-10Q270 89 171 146T117 270Q23 296 62 425T48 660H650Q703 557 803 543T790 415Q740 309 826 237T820-10Z"/><path fill="url(#elden-map-contours)" d="M245-10H818Q856 120 826 237T790 415Q863 526 803 543T650 660H48Q114 532 62 425T117 270Q77 204 171 146T240-10Z"/><path class="elden-map-wood" d="m375 180 105-45 118 80-21 118-151 15-72-64Zm90 280 67-43 106 15 23 91-79 55-143-40Z"/><path fill="url(#elden-map-forest)" d="m375 180 105-45 118 80-21 118-151 15-72-64Zm90 280 67-43 106 15 23 91-79 55-143-40Z"/><path class="elden-map-river" d="M692-5Q603 101 657 173T679 303Q579 352 636 447T623 663"/><path class="elden-map-road" d="M145 128Q275 126 405 91T657 176L576 331 702 507 396 507 153 435 270 260 405 91M270 260 576 331"/><g class="elden-map-mountains"><path d="m237 83 32-49 36 53-18-20-16 11-12-18Zm28 14 37-49 31 46-12-17-17 9-11-13Zm-47 9 23-36 27 35-15-15-10 4-4-11ZM346 395l31-49 36 53-18-20-16 11-12-18Zm31 17 37-49 31 46-12-17-17 9-11-13Z"/></g><g class="elden-map-castle"><path d="M460 59v-22h8v8h8v-8h8v8h8v-8h8v22h-5v31h-30V59Zm-12 31h64v8h-64Z"/><path d="M304 555v-22h8v8h8v-8h8v8h8v-8h8v22h-5v31h-30v-31Zm-12 31h64v8h-64Z"/></g></svg>`;
}

function eldenMap(c){
  const allRows=c.all.filter(r=>r.categoryId===c.r.categoryId);
  const pages=Math.ceil(allRows.length/8),page=Math.max(0,Math.min(pages-1,Number(c.ws.mapPage)||0));
  const rows=allRows.slice(page*8,page*8+8);
  return `${eldenTop(c)}<div class="elden-map-layout"><section class="elden-map-main"><div class="elden-section-title"><h1>赐福地图</h1><span>食谱 ${String(page*8+1).padStart(2,'0')}–${String(Math.min((page+1)*8,allRows.length)).padStart(2,'0')} / ${allRows.length}</span></div><div class="elden-realm-map">${mapTerrain()}<span class="elden-compass" aria-hidden="true">N<span>✧</span></span>${rows.map((r,n)=>b('map-select',`<span class="elden-map-rune" aria-hidden="true">${favourites(c).includes(r.id)?'◆':'◉'}</span><span>${page*8+n+1}</span>`,`${attr('id',r.id)} style="--map-left:${mapPoints[n][0]}%;--map-top:${mapPoints[n][1]}%" aria-label="${page*8+n+1}，${titleOf(r)}${favourites(c).includes(r.id)?'，已收藏':''}" ${selected(r.id===c.r.id)}`,`elden-map-node ${r.id===c.r.id?'is-selected':''}`)).join('')}<span class="elden-map-ornament" aria-hidden="true">✥</span></div><div class="elden-map-pages">${b('map-page','← 上一页','data-value="-1"'+(page===0?' disabled':''),'elden-text-button')}<span>${page+1} / ${pages}</span>${b('map-page','下一页 →','data-value="1"'+(page===pages-1?' disabled':''),'elden-text-button')}</div><ol class="elden-map-legend" start="${page*8+1}">${rows.map((r,n)=>`<li>${b('map-select',`<span>${String(page*8+n+1).padStart(2,'0')}</span><strong>${titleOf(r)}</strong>`,`${attr('id',r.id)} ${selected(r.id===c.r.id)}`,'elden-map-legend-button')}</li>`).join('')}</ol></section><aside class="elden-map-inspection"><span class="elden-overline">选中的食谱</span><h2>${titleOf(c.r)}</h2><div class="elden-map-item-art" aria-hidden="true">${art(itemName(c.r))}</div><p>${e(c.r.summary)}</p>${facts(c)}${portion(c)}${eldenRecipeStats(c)}${paneButton('prep','前往制作材料 →','elden-gold-button')}${favour(c,'elden-text-button')}${b('read','查看完整配方','','elden-text-button')}</aside></div>`;
}

function eldenPrep(c){
  return `${eldenTop(c)}<div class="elden-prep-layout"><aside class="elden-prep-overview"><span class="elden-overline">物品制作</span><h1>${titleOf(c.r)}</h1>${recipePicker(c)}<p>${e(c.r.summary)}</p>${portion(c)}${eldenRecipeStats(c)}${procurement('elden-gold-button')}${b('shopping','打开采购清单','','elden-text-button')}${b('read','查看完整配方','','elden-text-button')}</aside><section class="elden-prep-materials"><div class="elden-section-title"><h2>制作材料</h2><span>${countReady(c)} / ${c.r.ingredients.length} 已准备</span></div>${eldenMaterials(c,true)}${prepNotes(c)}<div class="elden-bottom-actions">${paneButton('catalog','返回物品目录','elden-text-button')}${paneButton('gear','确认所需器具 →','elden-gold-button')}</div></section></div>`;
}

function eldenGear(c){
  return `${eldenTop(c)}<div class="elden-gear-layout"><section class="elden-equipment-panel"><div class="elden-section-title"><h1>器具配置</h1><span>${c.p.gear.length} / ${c.r.equipment.length} 已确认</span></div><div class="elden-equipment-list">${c.r.equipment.map((t,n)=>`<section class="elden-equipment-entry ${c.p.gear.includes(String(n))?'is-ready':''}">${b('gear',`<span class="elden-equipment-art">${art(t.name)}</span><span><strong>${e(t.name)}</strong><small>${e(t.capacityOrSize||t.size||'')}</small></span><span class="elden-equipment-state">${c.p.gear.includes(String(n))?'✓ 已确认':'未确认'}</span>`,`data-index="${n}" ${selected(c.p.gear.includes(String(n)))}`,'elden-equipment-button')}${t.alternative?`<p><span>替代</span>${e(t.alternative)}</p>`:''}${t.effectOnMethod?`<p><span>使用</span>${e(t.effectOnMethod)}</p>`:''}</section>`).join('')}</div></section><aside class="elden-grace-ready">${eldenEmblem()}<span class="elden-overline">在赐福处制作</span><h2>${titleOf(c.r)}</h2>${eldenRecipeStats(c)}${facts(c)}<p>${e(c.r.steps[0]?.title||'')}开始前，按材料页检查用量。</p>${b('start',c.p.started?'继续赐福旅途':'开始制作','','elden-gold-button')}${paneButton('prep','返回材料页','elden-text-button')}${b('read','查看完整配方','','elden-text-button')}</aside></div>`;
}

function eldenCook(c){
  return `${eldenTop(c)}<div class="elden-cook-layout"><aside class="elden-grace-path"><span class="elden-overline">赐福引导</span><h1>${titleOf(c.r)}</h1><p class="elden-path-count">${c.p.steps.length} / ${c.r.steps.length} 步已完成</p><ol>${c.r.steps.map((s,n)=>`<li class="${done(c,s)?'is-complete':''} ${n===c.stepIndex?'is-current':''}">${b('step',`<span class="elden-path-node"><i>${done(c,s)?'✓':n+1}</i></span><span><strong>${e(s.title)}</strong><small>${done(c,s)?'赐福已点亮':n===c.stepIndex?'正在查看':e(s.heat||s.phase||'未完成')}</small></span>`,`data-index="${n}" aria-current="${n===c.stepIndex?'step':'false'}"`,'elden-path-step')}</li>`).join('')}</ol>${paneButton('prep','检查材料','elden-text-button')}${paneButton('gear','检查器具','elden-text-button')}</aside><section class="elden-current-step"><div class="elden-section-title"><span>制作 ${String(c.stepIndex+1).padStart(2,'0')}</span><span>${done(c,c.r.steps[c.stepIndex])?'已完成':'未完成'}</span></div>${step(c)}<div class="elden-step-controls">${cookControls(c)}</div></section><aside class="elden-cook-supplies"><h2>制作所需</h2>${eldenRecipeStats(c)}<details><summary>材料与用量</summary>${eldenMaterials(c)}</details><details><summary>所需器具</summary>${gear(c)}</details>${b('read','查看完整配方','','elden-text-button')}${favour(c,'elden-text-button')}</aside></div>`;
}

export function renderElden(c){
  const views={home:eldenHome,catalog:eldenCatalogue,map:eldenMap,prep:eldenPrep,gear:eldenGear,cook:eldenCook};
  return `<div class="elden-shell elden-pane-${e(c.pane)}">${(views[c.pane]||eldenHome)(c)}</div>`;
}
