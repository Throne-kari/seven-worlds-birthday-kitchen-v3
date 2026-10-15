export const CATEGORY_ORDER = ['jin', 'chuan', 'xiang', 'lu', 'yue', 'jiangzhe', 'western-dessert'];
export const CATEGORY_LABELS = {jin:'晋菜',chuan:'川菜',xiang:'湘菜',lu:'鲁菜',yue:'粤菜',jiangzhe:'江浙菜','western-dessert':'西餐与甜点'};
export const DIFFICULTIES = {beginner:'入门',intermediate:'进阶',project:'慢慢做'};

export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
export const safeURL = value => { try {const u = new URL(value); return ['https:','http:'].includes(u.protocol) ? u.href : '#';} catch {return '#';} };
export const normalise = text => String(text ?? '').normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]+/gu,' ').trim();
export const compact = text => normalise(text).replace(/\s/g,'');
export function clampServings(value, fallback = 2) {const n = Number(value); return Number.isFinite(n) ? Math.min(12, Math.max(1, Math.round(n))) : fallback;}
export function scaleQuantity(quantity, baseServings, targetServings) {
  if (![quantity,baseServings,targetServings].every(Number.isFinite) || baseServings <= 0 || targetServings <= 0) throw new TypeError('Invalid portion quantity');
  return Math.round(quantity * targetServings / baseServings * 1000) / 1000;
}
export const formatQuantity = value => new Intl.NumberFormat('zh-CN',{maximumFractionDigits:2}).format(value);
export function indexRecipes(recipes) {
  return recipes.map(recipe => ({recipe, title:compact(recipe.titleZh+' '+recipe.titleEn), haystack:compact([recipe.titleZh,recipe.titleEn,CATEGORY_LABELS[recipe.categoryId],...(recipe.tags||[]),...recipe.ingredients.flatMap(i=>[i.nameZh,i.nameUk])].join(' '))}));
}
export function searchRecipes(index, query = '', {category, difficulty, maxMinutes, favourites, favouritesOnly = false} = {}) {
  const tokens = normalise(query).split(' ').filter(Boolean).map(compact);
  return index.filter(({recipe:r,haystack}) => (!category || r.categoryId===category) && (!difficulty || r.difficulty===difficulty) && (!maxMinutes || r.totalMinutes<=maxMinutes) && (!favouritesOnly || favourites?.includes(r.id)) && tokens.every(t=>haystack.includes(t)))
    .map(entry=>({...entry,score: tokens.reduce((s,t)=>s+(entry.title.startsWith(t)?4:entry.title.includes(t)?2:0),0)}))
    .sort((a,b)=>b.score-a.score).map(entry=>entry.recipe);
}

// A named ingredient with a different unit stays separate. No density assumptions.
export function shoppingKey(i) {return `${normalise(i.nameUk || i.nameZh)}::${normalise(i.unit)}`;}
export function buildShoppingList(plan, recipes) {
  const byId = new Map(recipes.map(r=>[r.id,r])); const merged = new Map();
  for (const selection of plan) {
    const r=byId.get(selection.recipeId); if(!r) continue;
    const servings=clampServings(selection.servings,r.servings);
    for(const i of r.ingredients) {
      const key=shoppingKey(i), amount=scaleQuantity(i.quantity,r.servings,servings);
      const row=merged.get(key) || {key,nameZh:i.nameZh,nameUk:i.nameUk,unit:i.unit,quantity:0,group:i.group,optional:true,recipes:[],allergens:[],labelChecks:[]};
      row.quantity=Math.round((row.quantity+amount)*1000)/1000;
      row.optional=row.optional && Boolean(i.optional);
      if(!row.recipes.some(x=>x.id===r.id)) row.recipes.push({id:r.id,title:r.titleZh});
      row.allergens=[...new Set([...row.allergens,...(i.allergens||[])])];
      if(i.packLabelCheck && !row.labelChecks.includes(i.packLabelCheck)) row.labelChecks.push(i.packLabelCheck);
      merged.set(key,row);
    }
  }
  return [...merged.values()].sort((a,b)=>a.group.localeCompare(b.group,'zh-CN') || a.nameZh.localeCompare(b.nameZh,'zh-CN'));
}
export function addToPlan(plan, recipeId, servings) {
  const next=plan.filter(item=>item.recipeId!==recipeId);
  return [...next,{recipeId,servings:clampServings(servings)}];
}
export function shoppingText(rows, checked=[]) {
  return ['采购清单',...rows.map(r=>`${checked.includes(r.key)?'☑':'☐'} ${r.nameZh} / ${r.nameUk} · ${formatQuantity(r.quantity)} ${r.unit}${r.optional?'（可选）':''}`),'','包装食品请核对 milk 等过敏原及交叉接触提示；替代品也需核对标签。'].join('\n');
}

export const EMPTY_STATE = {version:1,favourites:[],plan:[],checked:[],progress:{},timers:{},systemCursor:false,motion:true};
export function sanitiseState(candidate) {
  const s=structuredClone(EMPTY_STATE); if(!candidate || candidate.version!==1) return s;
  const ids=v=>Array.isArray(v)?[...new Set(v.filter(x=>typeof x==='string' && x.length<200))]:[];
  s.favourites=ids(candidate.favourites); s.checked=ids(candidate.checked);
  if(Array.isArray(candidate.plan)) for(const item of candidate.plan.slice(0,100)) if(item && typeof item.recipeId==='string') s.plan=addToPlan(s.plan,item.recipeId,item.servings);
  if(candidate.progress && typeof candidate.progress==='object') for(const [id,p] of Object.entries(candidate.progress)) if(p && typeof p==='object' && !['__proto__','constructor','prototype'].includes(id)) s.progress[id]={steps:ids(p.steps),ingredients:ids(p.ingredients)};
  if(candidate.timers && typeof candidate.timers==='object') for(const [id,t] of Object.entries(candidate.timers)) if(t && !['__proto__','constructor','prototype'].includes(id) && typeof t.label==='string' && Number.isFinite(t.durationMs) && t.durationMs>0 && ['running','paused','done'].includes(t.status)) s.timers[id]={label:t.label.slice(0,200),durationMs:Math.min(t.durationMs,604800000),deadline:Number.isFinite(t.deadline)?t.deadline:null,remainingMs:Number.isFinite(t.remainingMs)?Math.max(0,t.remainingMs):0,status:t.status};
  s.systemCursor=Boolean(candidate.systemCursor); s.motion=candidate.motion!==false; return s;
}
export function createStore(storage, key='seven-kitchens.v1') {
  let state; let persistent=true; const listeners=new Set();
  try{state=sanitiseState(JSON.parse(storage.getItem(key)));}catch{state=structuredClone(EMPTY_STATE);}
  return {
    get:()=>structuredClone(state),
    update(change){const next=typeof change==='function'?change(structuredClone(state)):{...state,...change}; state=sanitiseState(next); try{storage.setItem(key,JSON.stringify(state));}catch{persistent=false;} for(const listener of listeners) listener(this.get()); return this.get();},
    subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},
    get persistent(){return persistent;}
  };
}
export function createTimer(label, seconds, now=Date.now()) {return {label,durationMs:seconds*1000,remainingMs:seconds*1000,deadline:now+seconds*1000,status:'running'};}
export function timerRemaining(timer,now=Date.now()) {return Math.max(0,timer.status==='running' ? (timer.deadline ?? now)-now : timer.remainingMs);}
export function pauseTimer(timer,now=Date.now()) {return {...timer,remainingMs:timerRemaining(timer,now),deadline:null,status:'paused'};}
export function resumeTimer(timer,now=Date.now()) {return {...timer,deadline:now+timer.remainingMs,status:'running'};}
export function formatTime(ms) {const s=Math.max(0,Math.ceil(ms/1000));return `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;}
