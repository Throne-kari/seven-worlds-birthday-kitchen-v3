import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const schema=JSON.parse(fs.readFileSync(path.join(root,'src/data/recipe-schema.json'),'utf8'));
const sources=JSON.parse(fs.readFileSync(path.join(root,'src/data/sources.json'),'utf8'));
const sourceIds=new Set(sources.map(s=>s.id));
const target={jin:50,chuan:50,xiang:40,lu:40,yue:40,jiangzhe:40,'western-dessert':40};
const dir=path.join(root,'src/data/recipes');
const recipes=fs.existsSync(dir)?fs.readdirSync(dir).filter(f=>f.endsWith('.json')).flatMap(f=>{const d=JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'));return Array.isArray(d)?d:d.recipes||[];}):[];
const errors=[],warnings=[];
function validate(v,s,p){
  const type=t=>t==='null'?v===null:t==='array'?Array.isArray(v):t==='object'?v!==null&&typeof v==='object'&&!Array.isArray(v):t==='integer'?Number.isInteger(v):typeof v===t;
  if(s.type && ![].concat(s.type).some(type)){errors.push(`${p}: expected ${s.type}`);return;}
  if(s.enum&&!s.enum.includes(v)) errors.push(`${p}: invalid enum ${v}`);
  if('const'in s && v!==s.const) errors.push(`${p}: expected ${s.const}`);
  if(typeof v==='number') for(const [k,fail] of [['minimum',v<s.minimum],['maximum',v>s.maximum],['exclusiveMinimum',v<=s.exclusiveMinimum]]) if(k in s&&fail)errors.push(`${p}: ${k} ${s[k]}`);
  if(typeof v==='string'){
    if(s.minLength&&[...v].length<s.minLength)errors.push(`${p}: too short`);
    if(s.pattern&&!new RegExp(s.pattern).test(v))errors.push(`${p}: invalid pattern`);
    if(s.format==='uri')try{const u=new URL(v);if(!['https:','http:'].includes(u.protocol))throw 0;}catch{errors.push(`${p}: invalid source URL`);}
    if(v.includes('\ufffd'))errors.push(`${p}: damaged encoding`);
  }
  if(Array.isArray(v)){
    if(v.length<(s.minItems||0))errors.push(`${p}: too few items`);
    if(s.uniqueItems&&new Set(v.map(x=>JSON.stringify(x))).size!==v.length)errors.push(`${p}: duplicated items`);
    if(s.items)v.forEach((x,i)=>validate(x,s.items,`${p}[${i}]`));
  } else if(v!==null&&typeof v==='object'){
    for(const k of s.required||[])if(!(k in v))errors.push(`${p}.${k}: missing`);
    for(const [k,x]of Object.entries(v))if(s.properties?.[k])validate(x,s.properties[k],`${p}.${k}`);
  }
}
const ids=new Set(),titles=new Set(),counts={};
for(const r of recipes){
  validate(r,schema,r.id||'unknown');
  if(ids.has(r.id))errors.push(`${r.id}: duplicate ID`);ids.add(r.id);
  if(titles.has(r.titleZh))errors.push(`${r.id}: duplicate title`);titles.add(r.titleZh);
  counts[r.categoryId]=(counts[r.categoryId]||0)+1;
  if(!r.id.startsWith(r.categoryId+'-'))errors.push(`${r.id}: mismatching category`);
  const ingredients=new Map((r.ingredients||[]).map(i=>[i.id,i]));
  if(ingredients.size!==r.ingredients?.length)errors.push(`${r.id}: duplicate ingredient IDs`);
  const stepIds=new Set();
  for(const s of r.steps||[]){
    if(stepIds.has(s.id))errors.push(`${r.id}: duplicate step ID ${s.id}`);stepIds.add(s.id);
    if(s.durationMin>s.durationMax)errors.push(`${r.id}/${s.id}: inverted duration range`);
    for(const id of s.ingredientIds||[])if(!ingredients.has(id))errors.push(`${r.id}/${s.id}: unknown ingredient ${id}`);
    if(!s.heat?.trim()||!s.visualCue?.trim()||!s.doneness?.trim())errors.push(`${r.id}/${s.id}: missing heat / visual / doneness guidance`);
  }
  for(const s of r.substitutions||[])if(!ingredients.has(s.ingredientId))errors.push(`${r.id}: unknown substitution ingredient ${s.ingredientId}`);
  for(const i of r.ingredients||[]){
    for(const a of i.allergens||[])if(!r.allergens?.includes(a))errors.push(`${r.id}: ingredient allergen ${a} omitted from recipe`);
    if(!i.nameUk?.trim()||!i.unit?.trim())errors.push(`${r.id}/${i.id}: missing UK name or unit`);
    const name=(i.nameZh+' '+i.nameUk).toLowerCase().replace(/\bno milk(?:-derived)? ingredients\b|\bmilk-ingredient-free\b|\bbutter beans\b|\bpeanut butter\b/g,'');
    if(/\b(milk|butter|cream|cheese|yog[hu]urt|whey|casein|ghee)\b|牛奶|黄油|乳清|奶酪|乳酪|奶油|炼乳|奶粉|酪蛋白|酸奶/.test(name) && !/coconut|oat|soya|soy|plant|dairy.free|乳制品替代|椰|燕麦|植物|豆奶|豆乳/.test(name)) errors.push(`${r.id}/${i.id}: dairy ingredient requires review: ${i.nameUk}`);
  }
  for(const id of r.safetySourceIds||[])if(!sourceIds.has(id))errors.push(`${r.id}: unknown safety source ${id}`);
  if(!r.recipeSources?.length)errors.push(`${r.id}: no recipe source`);
  if(r.totalMinutes<r.activeMinutes)errors.push(`${r.id}: total shorter than active time`);
  if(r.totalMinutes<r.prepMinutes+r.cookMinutes+r.restMinutes+(r.chillMinutes||0)&&!r.timingNote)warnings.push(`${r.id}: overlapping timings need editorial review`);
}
for(const [cat,count]of Object.entries(target))if((counts[cat]||0)!==count)errors.push(`${cat}: ${counts[cat]||0} complete records; ${count} required`);
const signatures=new Map();
for(const r of recipes){const s=(r.steps||[]).map(x=>x.action).join('|');if(signatures.has(s))errors.push(`${r.id}: identical full method to ${signatures.get(s)}`);signatures.set(s,r.id);}
const report={checkedAt:new Date().toISOString(),total:recipes.length,counts,errors,warnings};
fs.mkdirSync(path.join(root,'qa'),{recursive:true});fs.writeFileSync(path.join(root,'qa/data-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(`Complete recipes: ${recipes.length} / 300. Counts: ${JSON.stringify(counts)}`);
for(const error of errors)console.error(`ERROR ${error}`);
for(const warning of warnings)console.warn(`REVIEW ${warning}`);
if(errors.length)process.exitCode=1;else console.log('Recipe structure, count, references and semantic checks passed. Editorial and cooking claims remain separate.');
