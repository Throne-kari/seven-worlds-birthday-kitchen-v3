import {chromium} from '@playwright/test';
import fs from 'node:fs';
const url=process.env.REVIEW_URL||'http://127.0.0.1:4189/';
const output='qa/equipment-fix';fs.mkdirSync(output,{recursive:true});
const report={date:new Date().toISOString(),url,checks:[],errors:[],assets:[]};
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),page=await context.newPage();
page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
const samples=new Map();
try{
for(const width of [1440,390,320]){await page.setViewportSize({width,height:width>1000?900:844});for(const world of ['forest','csgo','delta','pubg','apex','elden','palworld']){
await page.goto(url+'?world='+world+'&pane=gear');await page.locator('[data-action="gear"]').first().waitFor();
const result=await page.evaluate(()=>{const objects=[...document.querySelectorAll('[data-atlas-cell]')].filter(x=>Number(x.dataset.atlasCell)>=12);const ids=[...document.querySelectorAll('clipPath')].map(x=>x.id);return {count:objects.length,cells:[...new Set(objects.map(x=>Number(x.dataset.atlasCell)))],allClipped:objects.every(x=>x.querySelector('clipPath polygon')&&x.querySelector('image[clip-path]')),uniqueIds:new Set(ids).size===ids.length,overflow:document.documentElement.scrollWidth-innerWidth};});
if(!result.count||!result.allClipped||!result.uniqueIds||result.overflow>1)throw new Error(world+' '+width+' invalid asset structure '+JSON.stringify(result));
for(const cell of result.cells)if(!samples.has(cell))samples.set(cell,await page.locator(`[data-atlas-cell="${cell}"]`).first().evaluate(el=>el.outerHTML));
const button=page.locator('[data-action="gear"]').first();const before=await button.getAttribute('aria-pressed');await button.click();if(await page.locator('[data-action="gear"]').first().getAttribute('aria-pressed')===before)throw new Error('Equipment toggle broken');
await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:`${output}/${world}-${width}-gear-fixed.png`,fullPage:true,animations:'disabled'});report.checks.push({world,width,...result});}
}
await page.setViewportSize({width:1440,height:900});await page.goto(url+'?world=delta&pane=prep&recipe=xiang-002');await page.locator('[data-action="focus-ingredient"]').first().click();await page.locator('[data-action="fill-ingredient"]').first().click();await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:`${output}/delta-1440-prep-fixed.png`,animations:'disabled'});
await page.setViewportSize({width:1000,height:420});await page.setContent(`<base href="${url}"><style>body{margin:0;padding:24px;background:#102323;color:#fff;font:18px sans-serif}.samples{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.sample{border:1px solid #6c8d8d;padding:10px}.item-art{display:block;width:200px;height:240px}svg{width:100%;height:100%}</style><h2>器具图块隔离 · 实际页面SVG</h2><div class="samples">${[...samples].sort((a,b)=>a[0]-b[0]).map(([n,html])=>`<div class="sample">${['平底锅','带柄锅','刀具','碗'][n-12]}${html}</div>`).join('')}</div>`);await page.screenshot({path:`${output}/equipment-isolation-detail.png`,fullPage:true});report.assets=[...samples.keys()].sort();
if(report.assets.length!==4)throw new Error('Missing equipment group');
}catch(e){report.errors.push(e.message);throw e;}finally{fs.writeFileSync(output+'/verification.json',JSON.stringify(report,null,2));await browser.close();}
console.log(JSON.stringify({checks:report.checks.length,assets:report.assets,errors:report.errors},null,2));
