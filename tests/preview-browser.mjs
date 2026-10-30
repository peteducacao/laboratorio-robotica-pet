import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync, mkdirSync} from 'node:fs';
import {join, resolve, extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'};
const server=createServer((req,res)=>{
 let local;try{local=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname)}catch{return res.writeHead(400).end()}
 const path=resolve(root,'.'+local);
 if(!(path===root||path.startsWith(root+'/')))return res.writeHead(403).end();
 try{
  const bytes=readFileSync(path);
  res.setHeader('Content-Type',(mime[extname(path)]||'application/octet-stream')+'; charset=utf-8');
  res.end(bytes);
 }catch{res.writeHead(404).end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url='http://127.0.0.1:'+server.address().port+'/studio-preview.html';
let browser;
try{
 browser=await chromium.launch({headless:true});
 const dir=join(root,'test-results');mkdirSync(dir,{recursive:true});
 for(const width of [360,390,430,768,1366]){
  const height=width<600?844:900;
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,
   isMobile:width<600,hasTouch:width<600});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.locator('#catalog .catalog-card').first().waitFor({state:'attached',timeout:15000});
  await page.waitForTimeout(240);
  const layout=await page.evaluate(()=>{
   const bb=id=>{const r=document.getElementById(id).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
   return {
    viewportWidth:document.documentElement.clientWidth,
    scrollWidth:document.documentElement.scrollWidth,
    screen:bb('viewport'),header:document.querySelector('.app-header').getBoundingClientRect().height,
    bar:document.querySelector('.studio-topbar').getBoundingClientRect().height,
    zoom:bb('zoomIn'),simulation:bb('checkBtn'),
    progress:bb('progressBar'),
    detailHidden:getComputedStyle(document.getElementById('previewInspector')).display==='none',
    libraryClosed:!document.getElementById('library').classList.contains('open')
   };
  });
  assert(layout.scrollWidth<=width+3,'Horizontal overflow at '+width+': '+JSON.stringify(layout));
  assert(layout.screen.width>=width-42,'Canvas should fill mobile/desktop width '+width);
  assert(layout.screen.height>=380,'Canvas should stay tall enough '+width);
  assert(layout.zoom.bottom<layout.screen.y,'Zoom above canvas '+width);
  assert(layout.simulation.bottom<layout.screen.y,'Simulation button above canvas '+width);
  assert(layout.progress.width>0,'Progress meter visible '+width);
  assert(layout.detailHidden,'Inspector initially closed '+width);
  assert(layout.libraryClosed,'Catalog initially closed '+width);
  await page.locator('#previewInspectorOpen').click();
  assert.equal(await page.locator('#previewInspector').evaluate(e=>getComputedStyle(e).display),'flex','Inspector opens '+width);
  await page.locator('#previewInspectorClose').click();
  assert.equal(await page.locator('#previewInspector').evaluate(e=>getComputedStyle(e).display),'none','Inspector closes '+width);
  await page.locator('#drawerHandle').click();
  assert(await page.locator('#library').evaluate(e=>e.classList.contains('open')),'Drawer opens '+width);
  await page.locator('#closeLibrary').click();
  const oldZoom=await page.locator('#zoomLabel').textContent();
  await page.locator('#zoomIn').click();
  assert.notEqual(await page.locator('#zoomLabel').textContent(),oldZoom,'Zoom button works '+width);
  await page.screenshot({path:join(dir,'studio-preview-'+width+'.png'),fullPage:false});
  assert.equal(errors.length,0,'JS page errors at '+width+': '+errors.join('; '));
  console.log('✓ Browser '+width+'px: layout, drawer, zoom, details (canvas '+Math.round(layout.screen.width)+' × '+Math.round(layout.screen.height)+')');
  await page.close();
 }
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
