import { e, b, art, qty, need, ready, facts, portion, summary, recipeRows, ingredients, gear, step, stepNav, cookControls, prepNotes } from '../ui.js';
import './tactical.css';

const navButton = (c, pane, label, cls) => b('pane', label, `data-pane="${pane}" aria-pressed="${c.pane === pane}"`, `${cls} ${c.pane === pane ? 'selected' : ''}`);
const number = n => Number(Number(n || 0).toFixed(2)).toLocaleString('zh-CN', { maximumFractionDigits: 2 });
const actual = (i, c) => Number(c.p.amounts?.[i.id] || 0);
const missing = (i, c) => Math.max(0, need(i, c) - actual(i, c));
const counts = c => ({ ingredients: c.r.ingredients.filter(i => ready(i, c)).length, gear: c.r.equipment.filter((_, n) => (c.p.gear || []).includes(String(n))).length, steps: c.r.steps.filter(s => (c.p.steps || []).includes(s.id)).length });
const chosen = c => (c.ws.menu || []).map(id => c.byId.get(id)).filter(Boolean);
const focused = c => c.r.ingredients.find(i => i.id === c.ws.focus) || c.r.ingredients[0];
const stage = c => c.r.steps[c.stepIndex] || c.r.steps[0];
const currentName = c => `<h2>${e(c.r.titleZh)}</h2>${facts(c)}`;
const mark = flag => `<span class="tactical-mark" aria-hidden="true">${flag ? '✓' : '＋'}</span>`;

function readiness(c, prefix) {
  const n = counts(c);
  return `<div class="${prefix}-readiness"><span>食材 <b>${n.ingredients} / ${c.r.ingredients.length}</b></span><span>器具 <b>${n.gear} / ${c.r.equipment.length}</b></span><span>步骤 <b>${n.steps} / ${c.r.steps.length}</b></span></div>`;
}

function menu(c, prefix) {
  const rows = chosen(c);
  return `<aside class="${prefix}-menu"><header><span>${prefix === 'pubg' ? 'BACKPACK' : 'LOADOUT'}</span><h2>${prefix === 'pubg' ? '晚餐背包' : '本局菜单'} <b>${rows.length}</b></h2></header><div class="${prefix}-menu-items">${rows.length ? rows.map((r, index) => `<div class="${prefix}-menu-item ${r.id === c.r.id ? 'selected' : ''}">${b('menu-select', `<span class="${prefix}-slot-number">${String(index + 1).padStart(2, '0')}</span><span><strong>${e(r.titleZh)}</strong><small>${r.totalMinutes} 分钟</small></span>`, `data-id="${e(r.id)}" aria-label="准备${e(r.titleZh)}"`, `${prefix}-menu-select`)}${b('menu-toggle', '×', `data-id="${e(r.id)}" aria-label="移出${e(r.titleZh)}"`, `${prefix}-remove`)}</div>`).join('') : `<div class="${prefix}-empty"><span aria-hidden="true">＋</span><p>${prefix === 'pubg' ? '从附近物资装入今晚的菜。' : '选择菜品，加入本局菜单。'}</p></div>`}</div>${rows.length ? `<div class="${prefix}-menu-actions">${b('menu-plan', '整份菜单加入采购', '', `btn ${prefix === 'cs' ? 'cs-gold' : 'pubg-yellow'}`)}${b('shopping', '打开采购清单', '', 'btn')}</div>` : ''}</aside>`;
}

function amountInspector(c, prefix, i = focused(c)) {
  if (!i) return '';
  return `<section class="${prefix}-item-inspect"><div class="${prefix}-inspect-top"><span>${e(i.group || '食材')}</span><strong>${ready(i, c) ? '已备齐' : '待准备'}</strong></div><div class="${prefix}-object">${art(i.nameZh)}</div><h3>${e(i.nameZh)}</h3><p class="${prefix}-item-prep">${e(i.prep || '')}</p><dl class="${prefix}-quantities"><div><dt>所需</dt><dd>${qty(i, c)}</dd></div><div><dt>还差</dt><dd>${number(missing(i, c))} ${e(i.unit)}</dd></div></dl><label class="${prefix}-amount-label">已量好 <span><input type="number" min="0" step="any" inputmode="decimal" data-field="amount" data-id="${e(i.id)}" value="${actual(i, c)}" aria-label="${e(i.nameZh)}已量好数量">${e(i.unit)}</span></label><div class="${prefix}-inspect-actions">${b('fill-ingredient', '按所需量备齐', `data-id="${e(i.id)}"`, `btn ${prefix === 'delta' ? 'delta-green' : 'cs-gold'}`)}${actual(i, c) > 0 ? b('clear-ingredient', '撤回备料', `data-id="${e(i.id)}"`, 'btn') : ''}</div>${i.packLabelCheck ? `<details class="${prefix}-label-check"><summary>配料标签核对</summary><p>${e(i.packLabelCheck)}</p></details>` : ''}</section>`;
}

const csSectors = [
  ['all', '全部', '◈'], ['mala', '麻辣', '♨'], ['fish', '鱼香', '◇'],
  ['sweet', '酸甜', '◌'], ['staple', '主食', '▱'], ['light', '清爽', '✧'],
];
function csMatches(r, key) {
  if (key === 'all') return true;
  if (key === 'mala') return /麻|辣|椒|水煮|红油/.test(r.titleZh);
  if (key === 'fish') return /鱼香/.test(r.titleZh);
  if (key === 'sweet') return /糖|甜|醋|酸|冰粉|汤圆|糍/.test(r.titleZh);
  if (key === 'staple') return /面|粉|饭|抄手|饺|粑|汤圆|糍/.test(r.titleZh);
  return !r.ingredients.some(i => /辣椒|花椒|豆瓣酱|红油/.test(i.nameZh));
}
function csWheel(c) {
  const selected = csSectors.some(([key]) => key === c.ws.filter) ? c.ws.filter : 'all';
  return `<div class="cs-wheel" role="group" aria-label="按味型选择菜品"><svg viewBox="0 0 400 400" aria-hidden="true">${csSectors.map(([key], index) => {
    const a = (index * 60 - 120) * Math.PI / 180, z = ((index + 1) * 60 - 120) * Math.PI / 180;
    return `<path class="${key === selected ? 'active' : ''}" d="M200 200L${200 + 195 * Math.cos(a)} ${200 + 195 * Math.sin(a)}A195 195 0 0 1 ${200 + 195 * Math.cos(z)} ${200 + 195 * Math.sin(z)}Z"/>`;
  }).join('')}<circle cx="200" cy="200" r="49"/></svg><span class="cs-wheel-core">川<span>BUY</span></span>${csSectors.map(([key, label, glyph], index) => {
    const a = (index * 60 - 90) * Math.PI / 180;
    return b('filter', `<span aria-hidden="true">${glyph}</span><strong>${label}</strong>`, `data-value="${key}" aria-pressed="${key === selected}" style="--x:${50 + 32 * Math.cos(a)}%;--y:${50 + 32 * Math.sin(a)}%"`, 'cs-sector');
  }).join('')}</div>`;
}
function csRail(c) {
  return `<nav class="cs-rail" aria-label="CS行动导航">${[['home', '▶', '大厅'], ['catalog', '◈', '选择菜品'], ['prep', '▦', '食材检视'], ['gear', '⚒', '器具配置'], ['cook', '▷', '烹饪步骤']].map(([pane, symbol, label]) => b('pane', `<span aria-hidden="true">${symbol}</span><small>${label}</small>`, `data-pane="${pane}" aria-label="${label}" aria-pressed="${c.pane === pane}"`, `cs-rail-button ${c.pane === pane ? 'selected' : ''}`)).join('')}${b('shopping', '<span aria-hidden="true">▱</span><small>采购</small>', 'aria-label="采购清单"', 'cs-rail-button')}</nav>`;
}
function csHeader(c) {
  return `<header class="cs-header"><div><span>CS:GO</span><h1>川味行动</h1></div><nav aria-label="备餐阶段">${navButton(c, 'catalog', '购买选择', 'cs-tab')}${navButton(c, 'prep', '食材', 'cs-tab')}${navButton(c, 'gear', '装备', 'cs-tab')}${navButton(c, 'cook', '回合', 'cs-tab')}</nav></header>`;
}
function csHome(c) {
  return `<div class="cs-home"><div class="cs-wordmark">COUNTER-STRIKE<span>GLOBAL OFFENSIVE</span></div><p class="cs-overline">生日备餐 · 川菜</p><h1>准备下一局</h1><div class="cs-home-current"><span>当前菜品</span>${currentName(c)}</div><nav class="cs-main-menu" aria-label="川味行动主菜单">${b('pane', '<strong>选择菜品</strong><span>购买选择　›</span>', 'data-pane="catalog"', 'cs-main-choice cs-selected-choice')}${b('pane', '<strong>检视食材</strong><span>称量与准备　›</span>', 'data-pane="prep"', 'cs-main-choice')}${b('pane', '<strong>配置器具</strong><span>装备槽　›</span>', 'data-pane="gear"', 'cs-main-choice')}${b('start', `<strong>${c.p.started ? '继续本局' : '开始本局'}</strong><span>${e(stage(c).title)}　›</span>`, '', 'cs-main-choice')}</nav>${readiness(c, 'cs')}</div>`;
}
function csCatalog(c) {
  const key = csSectors.some(([k]) => k === c.ws.filter) ? c.ws.filter : 'all';
  const rows = c.rows.filter(r => csMatches(r, key));
  return `<section class="cs-buy"><div class="cs-buy-upper">${csWheel(c)}<section class="cs-recipe-inspect"><span class="cs-overline">菜品检视</span>${summary(c)}${b('menu-toggle', (c.ws.menu || []).includes(c.r.id) ? '✓ 已在菜单 · 移出' : '＋ 加入本局菜单', '', 'btn cs-gold')}${b('pane', '检视食材　›', 'data-pane="prep"', 'btn')}</section></div><header class="cs-list-heading"><h2>${e(csSectors.find(([k]) => k === key)?.[1] || '全部')}菜品</h2><span>${rows.length} 道</span></header><div class="cs-recipe-list">${recipeRows(c, rows)}</div></section>`;
}
function csPrep(c) {
  return `<section class="cs-preparation"><div class="cs-section-title"><div><span>购买阶段 / 食材检视</span><h2>${e(c.r.titleZh)}</h2></div>${portion(c)}</div><div class="cs-prep-grid"><div class="cs-supply-list">${c.r.ingredients.map(i => b('focus-ingredient', `${art(i.nameZh)}<span><strong>${e(i.nameZh)}</strong><small>${qty(i, c)}</small></span>${mark(ready(i, c))}`, `data-id="${e(i.id)}" aria-pressed="${focused(c)?.id === i.id}"`, `cs-supply ${focused(c)?.id === i.id ? 'selected' : ''} ${ready(i, c) ? 'prepared' : ''}`)).join('')}</div>${amountInspector(c, 'cs')}</div>${prepNotes(c)}<footer class="cs-action-footer">${b('add-plan', '本菜加入采购', '', 'btn')}${b('read','完整配方','','btn')}${b('pane', '下一步 · 装备器具　›', 'data-pane="gear"', 'btn cs-gold')}</footer></section>`;
}
function csGear(c) {
  return `<section class="cs-equipment"><div class="cs-section-title"><div><span>购买阶段 / 装备配置</span><h2>${e(c.r.titleZh)}</h2></div>${facts(c)}</div><div class="cs-equipment-grid">${gear(c)}</div><div class="cs-loadout-summary">${readiness(c, 'cs')}<p>份量变化时，核对器具容量与分批要求。</p></div><footer class="cs-action-footer">${b('pane', '返回食材', 'data-pane="prep"', 'btn')}${b('read','完整配方','','btn')}${b('favourite',c.s.favourites.includes(c.r.id)?'已收藏':'收藏',`aria-pressed="${c.s.favourites.includes(c.r.id)}"`,'btn')}${b('start', '开始本局　▶', '', 'btn cs-gold')}</footer></section>`;
}
function csCook(c) {
  const n = counts(c);
  return `<section class="cs-round"><header class="cs-round-score"><div><span>当前回合</span><b>${String(c.stepIndex + 1).padStart(2, '0')}</b></div><div><h2>${e(c.r.titleZh)}</h2><span>${n.steps} / ${c.r.steps.length} 步已完成</span></div><div><span>本步火候</span><strong>${e(stage(c).heat)}</strong></div></header><div class="cs-round-track">${stepNav(c)}</div><div class="cs-round-content">${step(c)}</div>${cookControls(c)}<footer class="cs-round-footer">${b('pane', '返回购买阶段', 'data-pane="prep"', 'btn')}${b('read', '完整配方', '', 'btn')}</footer></section>`;
}

export function renderCsgo(c) {
  const render = { home: csHome, catalog: csCatalog, prep: csPrep, gear: csGear, cook: csCook }[c.pane] || csHome;
  return `<div class="cs-shell cs-mode-${e(c.pane)}">${csRail(c)}<div class="cs-workspace">${c.pane === 'home' ? '' : csHeader(c)}${render(c)}</div>${menu(c, 'cs')}</div>`;
}

function deltaHeader(c) {
  return `<header class="delta-header"><div class="delta-brand"><span aria-hidden="true">△</span><div>DELTA FORCE<small>三角洲 · 湘菜</small></div></div><nav aria-label="三角洲行动导航">${navButton(c, 'home', '行动', 'delta-tab')}${navButton(c, 'catalog', '配方', 'delta-tab')}${navButton(c, 'prep', '仓库', 'delta-tab')}${navButton(c, 'gear', '配装', 'delta-tab')}${navButton(c, 'cook', '任务', 'delta-tab')}</nav>${b('shopping', '采购清单', '', 'btn')}</header>`;
}
function deltaHome(c) {
  const n = counts(c);
  return `<div class="delta-home"><div class="delta-operation"><span class="delta-kicker">当前行动</span><h1>行动前整备</h1><div class="delta-rule"></div>${currentName(c)}<div class="delta-ready-count"><span>所需材料</span><strong>${n.ingredients}<small> / ${c.r.ingredients.length}</small></strong><div style="--progress:${n.ingredients / c.r.ingredients.length * 100}%" role="progressbar" aria-label="材料备齐比例" aria-valuemin="0" aria-valuemax="${c.r.ingredients.length}" aria-valuenow="${n.ingredients}"><i></i></div></div><div class="delta-home-actions">${b('pane', '进入整备仓库　›', 'data-pane="prep"', 'btn delta-green')}${b('pane', '更换行动配方', 'data-pane="catalog"', 'btn')}${b('start', c.p.started ? '继续行动' : '打开行动步骤', '', 'btn')}</div></div><aside class="delta-operation-strip"><div><span>材料待备齐</span><b>${c.r.ingredients.length - n.ingredients}<small> 项</small></b></div><div><span>器具已配置</span><b>${n.gear}<small> / ${c.r.equipment.length}</small></b></div><div><span>步骤已完成</span><b>${n.steps}<small> / ${c.r.steps.length}</small></b></div></aside></div>`;
}
function deltaCatalog(c) {
  return `<div class="delta-catalog"><section class="delta-orders"><header><h2>行动配方</h2><span>${c.rows.length} 道湘菜</span></header><div class="delta-recipe-list">${recipeRows(c)}</div></section><aside class="delta-order-brief"><span class="delta-kicker">当前配方简报</span>${summary(c)}<div class="delta-brief-stats"><span>材料 <b>${c.r.ingredients.length}</b></span><span>器具 <b>${c.r.equipment.length}</b></span><span>步骤 <b>${c.r.steps.length}</b></span></div><h3>主料</h3><div class="delta-brief-items">${c.r.ingredients.slice(0, 4).map(i => `<div>${art(i.nameZh)}<span>${e(i.nameZh)}<b>${qty(i, c)}</b></span></div>`).join('')}</div>${b('pane', '装载配方 · 进入仓库　›', 'data-pane="prep"', 'btn delta-green')}${b('add-plan', '加入采购清单', '', 'btn')}</aside></div>`;
}
function deltaSizes(i, index) {
  if (/油|醋|酒|酱油|生抽|老抽/.test(i.nameZh)) return 'tall';
  if (/肉|鱼|鸡|鸭|排骨|菜|茄|豆腐|瓜/.test(i.nameZh) && index < 5) return 'wide';
  return '';
}
function deltaPrep(c) {
  const n = counts(c);
  return `<div class="delta-loadout"><section class="delta-config"><header><div><span class="delta-kicker">CURRENT LOADOUT</span><h2>当前配置</h2></div>${b('pane', '换配方', 'data-pane="catalog"', 'btn')}</header><div class="delta-current">${currentName(c)}${portion(c)}</div><div class="delta-gear-peek"><div><h3>器具槽</h3>${b('pane', `配置 ${n.gear}/${c.r.equipment.length}　›`, 'data-pane="gear"', 'btn')}</div><div>${c.r.equipment.map((g, index) => b('gear', `${art(g.name)}<span>${e(g.name)}</span>${mark((c.p.gear || []).includes(String(index)))}`, `data-index="${index}" aria-pressed="${(c.p.gear || []).includes(String(index))}"`, `delta-gear-slot ${index === 0 ? 'large' : ''} ${(c.p.gear || []).includes(String(index)) ? 'equipped' : ''}`)).join('')}</div></div><div class="delta-requirements"><h3>所需食材 <span>${n.ingredients} / ${c.r.ingredients.length} 已备齐</span></h3>${c.r.ingredients.map(i => b('focus-ingredient', `${mark(ready(i, c))}<span>${e(i.nameZh)}</span><strong>${number(actual(i, c))} / ${qty(i, c)}</strong>`, `data-id="${e(i.id)}" aria-pressed="${focused(c)?.id === i.id}"`, `delta-required ${ready(i, c) ? 'prepared' : ''} ${focused(c)?.id === i.id ? 'selected' : ''}`)).join('')}</div><div class="delta-config-actions">${b('add-plan', '本菜加入采购', '', 'btn')}${b('read', '完整配方', '', 'btn')}${b('start', '进入行动　›', '', 'btn delta-green')}</div></section><section class="delta-stash"><header><div><span class="delta-kicker">STASH</span><h2>物资仓库</h2></div><span>${c.r.ingredients.length} 项所需</span></header><div class="delta-stash-grid">${c.r.ingredients.map((i, index) => b('focus-ingredient', `<span class="delta-cell-name">${e(i.nameZh)}</span>${art(i.nameZh)}<span class="delta-cell-qty">已量 ${number(actual(i, c))} ${e(i.unit)}</span><span class="delta-cell-status">${ready(i, c) ? '✓ 已备齐' : `差 ${number(missing(i, c))} ${e(i.unit)}`}</span>`, `data-id="${e(i.id)}" aria-pressed="${focused(c)?.id === i.id}"`, `delta-stash-item ${deltaSizes(i, index)} ${focused(c)?.id === i.id ? 'selected' : ''} ${ready(i, c) ? 'prepared' : ''}`)).join('')}</div>${amountInspector(c, 'delta')}${prepNotes(c)}</section></div>`;
}
function deltaGear(c) {
  return `<div class="delta-gear-view"><section class="delta-gear-panel"><header><div><span class="delta-kicker">EQUIPMENT</span><h2>器具配装</h2></div>${b('pane', '返回仓库', 'data-pane="prep"', 'btn')}</header><div class="delta-current">${currentName(c)}</div><div class="delta-full-gear">${gear(c)}</div></section><aside class="delta-deploy"><span class="delta-kicker">行动确认</span><h2>${e(c.r.titleZh)}</h2>${readiness(c, 'delta')}<p>核对容量和分批要求，再开始行动。</p>${b('start', '开始行动　›', '', 'btn delta-green')}${b('read', '查看完整配方', '', 'btn')}</aside></div>`;
}
function deltaCook(c) {
  return `<div class="delta-mission"><aside class="delta-timeline"><span class="delta-kicker">行动路线</span><h2>${e(c.r.titleZh)}</h2><div>${c.r.steps.map((s, index) => b('step', `<span class="delta-node">${(c.p.steps || []).includes(s.id) ? '✓' : String(index + 1).padStart(2, '0')}</span><span><strong>${e(s.title)}</strong><small>${e(s.phase)} · ${e(s.heat)}</small></span>`, `data-index="${index}" aria-pressed="${index === c.stepIndex}"`, `delta-mission-step ${index === c.stepIndex ? 'selected' : ''} ${(c.p.steps || []).includes(s.id) ? 'completed' : ''}`)).join('')}</div>${b('pane', '返回整备', 'data-pane="prep"', 'btn')}</aside><section class="delta-active-task"><header><span>任务 ${String(c.stepIndex + 1).padStart(2, '0')} / ${String(c.r.steps.length).padStart(2, '0')}</span><b>${(c.p.steps || []).includes(stage(c).id) ? '已完成' : '待执行'}</b></header>${step(c)}${cookControls(c)}</section></div>`;
}

export function renderDelta(c) {
  const render = { home: deltaHome, catalog: deltaCatalog, prep: deltaPrep, gear: deltaGear, cook: deltaCook }[c.pane] || deltaHome;
  return `<div class="delta-shell delta-mode-${e(c.pane)}">${deltaHeader(c)}${render(c)}</div>`;
}

function pubgHeader(c) {
  return `<header class="pubg-header"><div class="pubg-brand">PUBG<span>鲁菜</span></div><nav aria-label="PUBG准备导航">${navButton(c, 'home', '大厅', 'pubg-tab')}${navButton(c, 'catalog', '物资', 'pubg-tab')}${navButton(c, 'prep', '准备', 'pubg-tab')}${navButton(c, 'gear', '装备', 'pubg-tab')}${navButton(c, 'cook', '烹饪', 'pubg-tab')}</nav></header>`;
}
function pubgPortions(c) {
  return `<div class="pubg-portions"><h3>今晚几人份</h3><div role="group" aria-label="选择份量">${[1, 2, 4].map(n => b('portion', `${n} 人份`, `data-value="${n - c.servings}" aria-pressed="${c.servings === n}"`, `pubg-portion ${c.servings === n ? 'selected' : ''}`)).join('')}</div><label>其他份量 <input type="number" min="1" max="12" inputmode="numeric" data-field="servings" value="${c.servings}" aria-label="其他份量"> 人份</label></div>`;
}
function pubgReady(c) {
  const n = counts(c);
  return `<aside class="pubg-ready-panel"><h2>当前准备状态</h2><div class="pubg-checklist"><div>${mark(n.ingredients === c.r.ingredients.length)}<span>食材备齐</span><b>${n.ingredients}/${c.r.ingredients.length}</b></div><div>${mark(n.gear === c.r.equipment.length)}<span>器具确认</span><b>${n.gear}/${c.r.equipment.length}</b></div><div>${mark(c.p.started)}<span>${c.p.started ? '烹饪已开始' : '尚未开始烹饪'}</span></div></div>${b('pane', '调整食材', 'data-pane="prep"', 'btn')}${b('pane', '检查器具', 'data-pane="gear"', 'btn')}${b('start', `<strong>${c.p.started ? 'RESUME' : 'READY'}</strong><span>${c.p.started ? '继续做菜' : '开始做菜'}</span>`, '', 'pubg-ready-button')}</aside>`;
}
function pubgHome(c) {
  return `<div class="pubg-lobby"><section class="pubg-lobby-plan"><span class="pubg-kicker">晚餐准备</span><h1>今晚吃好</h1>${pubgPortions(c)}<div class="pubg-current-dish"><span>当前菜品</span>${currentName(c)}<p>${e(c.r.summary)}</p></div><div class="pubg-lobby-actions">${b('pane', '搜寻物资　›', 'data-pane="catalog"', 'btn pubg-yellow')}${b('pane', '准备这道菜', 'data-pane="prep"', 'btn')}${b('menu-toggle', (c.ws.menu || []).includes(c.r.id) ? '从背包移出' : '装入晚餐背包', '', 'btn')}</div></section><div class="pubg-lobby-scene" aria-hidden="true"></div>${pubgReady(c)}</div><div class="pubg-lobby-bottom">${menu(c, 'pubg')}<div class="pubg-stage-label"><span>当前进度</span><strong>${c.p.started ? '进行中' : '待开始'} · ${e(stage(c).title)}</strong></div></div>`;
}
function pubgCatalogueRows(c) {
  const rows = [...c.rows];
  const offset = Number(c.ws.offset || c.ws.catalogOffset || 0) % Math.max(rows.length, 1);
  return [...rows.slice(offset), ...rows.slice(0, offset)];
}
function pubgCatalog(c) {
  const rows = pubgCatalogueRows(c);
  return `<div class="pubg-inventory"><section class="pubg-vicinity"><header><div><span class="pubg-kicker">VICINITY</span><h2>附近物资</h2></div><span>${c.rows.length} 道</span></header><div class="pubg-refresh-row">${b('refresh', '↻ 换一组排序', '', 'btn')}<span>全部配方均在列表中</span></div><div class="pubg-loot-list">${rows.map((r, index) => b('select', `<span class="pubg-loot-number">${String(index + 1).padStart(2, '0')}</span><span><strong>${e(r.titleZh)}</strong><small>${r.totalMinutes} 分钟 · ${r.ingredients.length} 项食材</small></span><span class="pubg-loot-state">${(c.ws.menu || []).includes(r.id) ? '已装入' : '检视 ›'}</span>`, `data-id="${e(r.id)}" aria-pressed="${r.id === c.r.id}"`, `pubg-loot ${r.id === c.r.id ? 'selected' : ''}`)).join('')}</div></section><section class="pubg-loot-inspect"><span class="pubg-kicker">物资检视</span>${summary(c)}<div class="pubg-feature-supply">${c.r.ingredients.slice(0, 3).map(i => `<div>${art(i.nameZh)}<span>${e(i.nameZh)}<b>${qty(i, c)}</b></span></div>`).join('')}</div>${b('menu-toggle', (c.ws.menu || []).includes(c.r.id) ? '✓ 已在背包 · 移出' : '＋ 装入晚餐背包', '', 'btn pubg-yellow')}${b('pane', '准备这道菜　›', 'data-pane="prep"', 'btn')}${b('add-plan', '本菜加入采购', '', 'btn')}</section>${menu(c, 'pubg')}</div>`;
}
function pubgPrep(c) {
  return `<div class="pubg-preparation"><section class="pubg-supply-sheet"><header><div><span class="pubg-kicker">补给检查</span><h2>${e(c.r.titleZh)}</h2></div>${b('pane', '更换菜品', 'data-pane="catalog"', 'btn')}</header>${pubgPortions(c)}<div class="pubg-supply-heading"><h3>所需物资</h3><span>点按标记已备齐</span></div><div class="pubg-ingredients">${ingredients(c)}</div>${prepNotes(c)}<footer class="pubg-supply-actions">${b('add-plan', '本菜加入采购', '', 'btn')}${b('read', '完整配方', '', 'btn')}${b('pane', '下一步 · 装备　›', 'data-pane="gear"', 'btn pubg-yellow')}</footer></section><aside class="pubg-prep-side">${pubgReady(c)}${menu(c, 'pubg')}</aside></div>`;
}
function pubgGear(c) {
  return `<div class="pubg-equipment"><section class="pubg-equipment-panel"><header><span class="pubg-kicker">EQUIPMENT</span><h2>装备检查</h2></header><div class="pubg-current-dish">${currentName(c)}</div>${gear(c)}<footer class="pubg-supply-actions">${b('pane', '返回补给', 'data-pane="prep"', 'btn')}${b('read', '完整配方', '', 'btn')}</footer></section>${pubgReady(c)}</div>`;
}
function pubgCook(c) {
  const n = counts(c);
  return `<div class="pubg-cook"><header class="pubg-hud"><div class="pubg-hud-dish"><span>当前料理</span><h2>${e(c.r.titleZh)}</h2></div><div class="pubg-hud-count"><b>${n.steps}</b><span>/ ${c.r.steps.length}<small>步骤已完成</small></span></div><div class="pubg-hud-servings"><b>${c.servings}</b><span>人份</span></div>${b('pane', '打开补给', 'data-pane="prep"', 'btn')}</header><div class="pubg-cook-layout"><section class="pubg-objective"><div class="pubg-objective-bar"><span>当前目标</span><strong>${String(c.stepIndex + 1).padStart(2, '0')} / ${String(c.r.steps.length).padStart(2, '0')}</strong></div>${step(c)}${cookControls(c)}</section><aside class="pubg-mission-list"><h3>烹饪路线</h3>${c.r.steps.map((s, index) => b('step', `<span>${(c.p.steps || []).includes(s.id) ? '✓' : String(index + 1).padStart(2, '0')}</span><strong>${e(s.title)}</strong>`, `data-index="${index}" aria-pressed="${index === c.stepIndex}"`, `pubg-objective-link ${index === c.stepIndex ? 'selected' : ''}`)).join('')}${b('read', '完整配方', '', 'btn')}${b('pane', '回到大厅', 'data-pane="home"', 'btn')}</aside></div></div>`;
}

export function renderPubg(c) {
  const render = { home: pubgHome, catalog: pubgCatalog, prep: pubgPrep, gear: pubgGear, cook: pubgCook }[c.pane] || pubgHome;
  return `<div class="pubg-shell pubg-mode-${e(c.pane)}">${pubgHeader(c)}${render(c)}</div>`;
}
