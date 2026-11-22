// @ts-check
/* Diddler’s Forge — scripts injected into apps for testing/preview (used by the server).
 * Everything is joined onto ONE line so injected code never shifts the app's line numbers:
 * an error on line 42 of the page is line 42 of your file. */
(function (root) {
  'use strict';
  const oneLine = (/** @type {string} */ s) => s.replace(/\r?\n\s*/g, ' ');
  const HARNESS = oneLine(String.raw`(function(){
var RID=__RID__,TYPE=__TYPE__,R={errors:[],checks:[]};
function loc(u,l,c){var m=String(u||'').match(/\/play\/[a-z0-9-]+\/[^\/]+\/([^?#:\s)]*)/);return{f:m?(m[1]||'index.html'):'',l:l||0,c:c||0}} function stackLoc(s){var m=String(s||'').match(/(https?:\/\/[^\s)]+?):(\d+):(\d+)/);return m?loc(m[1],+m[2],+m[3]):{f:'',l:0,c:0}} function pe(msg,L){msg=String(msg||'Error').slice(0,300);L=L||{};for(var i=0;i<R.errors.length;i++)if(R.errors[i].msg===msg)return;if(R.errors.length<15)R.errors.push({msg:msg,file:L.f||'',line:L.l||0,col:L.c||0})}
addEventListener('error',function(e){if(e.target&&e.target!==window&&e.target.tagName){var src=e.target.src||e.target.href||'';pe('Failed to load <'+e.target.tagName.toLowerCase()+'> '+String(src).replace(/^.*\/play\/[a-z0-9-]+\/[^\/]+\//,'')+(/^https?:/.test(src)&&src.indexOf(location.host)<0?' (external file — bundle it in Files → Libraries)':' (file missing?)'));return}pe(e.message||'Error',e.lineno?loc(e.filename,e.lineno,e.colno):stackLoc(e.error&&e.error.stack))},true);
addEventListener('unhandledrejection',function(e){var r=e.reason;pe('Unhandled promise rejection: '+(r&&r.message||r),stackLoc(r&&r.stack))});
var ce=console.error;console.error=function(){var a=[].slice.call(arguments),st='';a.forEach(function(x){if(x&&x.stack)st=x.stack});pe(a.map(function(x){return x&&x.message?x.message:String(x)}).join(' ').split('\n')[0],stackLoc(st));try{ce.apply(console,arguments)}catch(_){}};
window.alert=function(){};window.confirm=function(){return true};window.prompt=function(){return 'test'};
addEventListener('submit',function(e){e.preventDefault()});
document.addEventListener('click',function(e){var a=e.target&&e.target.closest&&e.target.closest('a[href]');if(a&&!/^#/.test(a.getAttribute('href')||''))e.preventDefault()},true);
function wait(ms){return new Promise(function(r){setTimeout(r,ms)})}
function add(id,name,status,detail){R.checks.push({id:id,name:name,status:status,detail:detail||''})}
function snap(){var s='',c=document.querySelector('canvas');
 if(c&&c.width){try{var t=document.createElement('canvas');t.width=16;t.height=16;var x=t.getContext('2d');x.drawImage(c,0,0,16,16);var d=x.getImageData(0,0,16,16).data;for(var i=0;i<d.length;i+=4)s+=(d[i]>>3)+'.'+(d[i+1]>>3)+'.'+(d[i+2]>>3)+',' }catch(e){}}
 var b=document.body;if(b){s+='#'+b.getElementsByTagName('*').length+':'+(b.innerText||'').slice(0,400);var act=document.activeElement;s+=':'+(act&&act.tagName)}
 return s}
function colors(){var c=document.querySelector('canvas');if(!c||!c.width)return 0;try{var t=document.createElement('canvas');t.width=64;t.height=64;var x=t.getContext('2d');x.imageSmoothingEnabled=false;x.drawImage(c,0,0,64,64);var d=x.getImageData(0,0,64,64).data,set={};for(var i=0;i<d.length;i+=4)set[(d[i]>>3)+'.'+(d[i+1]>>3)+'.'+(d[i+2]>>3)]=1;return Object.keys(set).length}catch(e){return -1}}
function P(type,el,x,y,extra){var o={bubbles:true,cancelable:true,clientX:x,clientY:y,pointerId:1,pointerType:'touch',isPrimary:true,button:0,buttons:type==='pointerup'?0:1};for(var k in extra)o[k]=extra[k];try{el.dispatchEvent(new PointerEvent(type,o))}catch(e){el.dispatchEvent(new MouseEvent(type,o))}}
function tapAt(x,y){var el=document.elementFromPoint(x,y)||document.body;P('pointerdown',el,x,y);el.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,clientX:x,clientY:y}));P('pointerup',el,x,y);el.dispatchEvent(new MouseEvent('mouseup',{bubbles:true,clientX:x,clientY:y}));el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,clientX:x,clientY:y}));}
function swipe(x,y,dx,dy){var el=document.elementFromPoint(x,y)||document.body;P('pointerdown',el,x,y);for(var i=1;i<=4;i++)P('pointermove',el,x+dx*i/4,y+dy*i/4);P('pointerup',el,x+dx,y+dy)}
function key(k){var o={key:k,code:k===' '?'Space':k,bubbles:true,cancelable:true};window.dispatchEvent(new KeyboardEvent('keydown',o));document.dispatchEvent(new KeyboardEvent('keydown',o));setTimeout(function(){window.dispatchEvent(new KeyboardEvent('keyup',o));document.dispatchEvent(new KeyboardEvent('keyup',o))},60)}
function visible(el){var r=el.getBoundingClientRect();if(r.width<2||r.height<2)return false;var s=getComputedStyle(el);return s.visibility!=='hidden'&&s.display!=='none'&&+s.opacity>0.05&&r.bottom>0&&r.right>0&&r.top<innerHeight&&r.left<innerWidth}
var frames=0,wasHidden=document.hidden;document.addEventListener('visibilitychange',function(){if(document.hidden)wasHidden=true});(function f(){frames++;requestAnimationFrame(f)})();
async function run(){
 try{
 await wait(900);
 var W=innerWidth,H=innerHeight,isGame=TYPE==='game'||!!(window.Kit&&Kit.current);
 add('load','Loads without errors',R.errors.length?'fail':'pass',R.errors.length?R.errors.length+' error(s) on load':'');
 var e0=R.errors.length,a=snap();
 tapAt(W/2,H/2);key(' ');key('Enter');
 await wait(700);
 var b=snap(),kc=window.Kit&&Kit.current;
 if(kc){add('start','Starts when tapped',kc.state==='play'||kc.state==='over'||kc.state==='win'?'pass':'fail',kc.state==='menu'?'Still on the menu after a tap':'state: '+kc.state)}
 else{var changed=a!==b;if(!changed&&!isGame){var cand=[].slice.call(document.querySelectorAll('[data-tab]:not(.active),.tabbar button:not(.active),button,.chip,[role=button]')).filter(visible).filter(function(el){return !/delete|remove|clear|reset/i.test(el.textContent||'')}).slice(0,4);for(var ci=0;ci<cand.length&&!changed;ci++){var cr=cand[ci].getBoundingClientRect();tapAt(cr.left+cr.width/2,cr.top+cr.height/2);await wait(350);changed=snap()!==b}}
 add('input','Responds to taps & keys',changed?'pass':'warn',changed?'':'Nothing visibly changed after taps on the screen and buttons')}
 var f0=frames,t0=performance.now();
 var btnSel='button,[role=button],[data-tab],.chip,.item,input[type=checkbox],select';
 for(var i=0;i<22;i++){
  var r=Math.random(),x=W*(.15+.7*Math.random()),y=H*(.25+.6*Math.random());
  if(r<.3)tapAt(x,y);else if(r<.5)swipe(x,y,(Math.random()-.5)*160,(Math.random()-.5)*160);
  else if(r<.75)key(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '][Math.floor(Math.random()*5)]);
  else if(!isGame){var bs=[].slice.call(document.querySelectorAll(btnSel)).filter(visible).filter(function(el){return !/delete|remove|clear|reset/i.test(el.textContent||'')});if(bs.length){var el=bs[Math.floor(Math.random()*bs.length)],rr=el.getBoundingClientRect();tapAt(rr.left+rr.width/2,rr.top+rr.height/2)}}
  else tapAt(x,y);
  if(kc&&(kc.state==='over'||kc.state==='win')&&i%6===5){await wait(750);tapAt(W/2,H/2)}
  if(i===10){var inp=[].slice.call(document.querySelectorAll('input[type=text],input[type=number],input:not([type]),textarea')).filter(visible)[0];if(inp){inp.focus();inp.value=inp.type==='number'?'42':'Test item';inp.dispatchEvent(new Event('input',{bubbles:true}));inp.dispatchEvent(new Event('change',{bubbles:true}))}}
  await wait(115);
 }
 var secs=(performance.now()-t0)/1000,fps=Math.round((frames-f0)/secs);
 var newErr=R.errors.length-e0;
 add('stable','Survives random play',newErr?'fail':'pass',newErr?newErr+' new error(s) while playing':'');
 var cc=colors();for(var si=0;si<3&&cc<3&&cc>=0;si++){await wait(150);cc=Math.max(cc,colors())}
 if(document.querySelector('canvas'))add('render','Draws on screen',cc>=3?'pass':cc===2||cc<0?'warn':'fail',cc>=3?cc+' colors':cc<0?'Canvas unreadable':cc===2?'Very little visible on screen':'Canvas is one flat color (nothing drawn)');
 else{var txt=(document.body&&document.body.innerText||'').trim().length,vis=[].slice.call(document.body?document.body.querySelectorAll('*'):[]).filter(visible).length;add('render','Shows content',txt>0&&vis>2?'pass':'fail',txt>0?vis+' visible elements':'Page looks empty')}
 var sw=document.documentElement.scrollWidth,bw=document.body?document.body.scrollWidth:0,ow=Math.max(sw,bw);
 add('fit','Fits phone width (no sideways scroll)',ow>W+2?'fail':'pass',ow>W+2?'Content is '+ow+'px wide on a '+W+'px screen':'');
 if(isGame){var sh=Math.max(document.documentElement.scrollHeight,document.body?document.body.scrollHeight:0);add('vfit','No page scrolling',sh>H+2?'warn':'pass',sh>H+2?'Page is '+sh+'px tall on a '+H+'px screen':'')}
 if(isGame||document.querySelector('canvas'))if(wasHidden)add('fps','Runs smoothly','warn','not measured — the studio was in the background');else add('fps','Runs smoothly',fps>=45?'pass':fps>=20?'warn':'fail',fps+' fps');
 if(!isGame){var small=[].slice.call(document.querySelectorAll('button,a,[role=button],input,select,[data-tab]')).filter(visible).filter(function(el){var r=el.getBoundingClientRect();return r.height<34&&r.width<34||r.height<28});add('taps','Buttons big enough to tap',small.length?'warn':'pass',small.length?small.length+' control(s) under 34px':'')}
 var tiny=0,els=document.body?document.body.querySelectorAll('*'):[];for(var k=0;k<els.length&&k<1500;k++){var e=els[k];if(e.childNodes.length&&[].some.call(e.childNodes,function(n){return n.nodeType===3&&n.textContent.trim()})&&visible(e)&&parseFloat(getComputedStyle(e).fontSize)<11)tiny++}
 add('text','Text readable (≥11px)',tiny?'warn':'pass',tiny?tiny+' element(s) with tiny text':'');
 if(typeof window.__selfTest==='function'){try{var st=window.__selfTest()||{},bad=Object.keys(st).filter(function(k){return !st[k]});add('self','Self-test',bad.length?'warn':'pass',bad.length?'false: '+bad.join(', '):Object.keys(st).length+' assertions')}catch(e){add('self','Self-test','warn','threw: '+e.message)}}
 parent.postMessage({type:'acs-test',rid:RID,checks:R.checks,errors:R.errors,fps:fps},'*');
 }catch(err){pe('Test harness: '+err.message,{});parent.postMessage({type:'acs-test',rid:RID,checks:R.checks,errors:R.errors,fps:0},'*')}
}
if(document.readyState==='complete')run();else addEventListener('load',run);
})();`);
  const PLAYTEST = oneLine(String.raw`(function(){
var RID=__RID__,TYPE=__TYPE__,SECS=__SECS__,KEY='acs_pt:';
var saved=null;try{if(String(window.name).indexOf(KEY)===0)saved=JSON.parse(String(window.name).slice(KEY.length))}catch(e){}
var LS=(saved&&saved.ls)||{};
(function(){var ok=true;try{window.localStorage.getItem('x')}catch(e){ok=false}if(ok)return;function mk(d){return{getItem:function(k){return Object.prototype.hasOwnProperty.call(d,k)?d[k]:null},setItem:function(k,v){d[k]=String(v)},removeItem:function(k){delete d[k]},clear:function(){for(var k in d)delete d[k]},key:function(i){return Object.keys(d)[i]||null},get length(){return Object.keys(d).length}}}try{Object.defineProperty(window,'localStorage',{value:mk(LS),configurable:true})}catch(e){}try{Object.defineProperty(window,'sessionStorage',{value:mk({}),configurable:true})}catch(e){}})();
var M=(saved&&saved.M)||{errors:[],fps:[],longFrames:0,sounds:0,juice:0,shots:[],runs:[],hashes:[],notes:{},heap0:0,heap1:0};
function loc(u,l,c){var m=String(u||'').match(/\/play\/[a-z0-9-]+\/[^\/]+\/([^?#:\s)]*)/);return{f:m?(m[1]||'index.html'):'',l:l||0,c:c||0}}
function stackLoc(s){var m=String(s||'').match(/(https?:\/\/[^\s)]+?):(\d+):(\d+)/);return m?loc(m[1],+m[2],+m[3]):{f:'',l:0,c:0}}
function pe(msg,L){msg=String(msg||'Error').slice(0,300);L=L||{};for(var i=0;i<M.errors.length;i++)if(M.errors[i].msg===msg)return;if(M.errors.length<12)M.errors.push({msg:msg,file:L.f||'',line:L.l||0,col:L.c||0})}
addEventListener('error',function(e){if(e.target&&e.target!==window&&e.target.tagName)return;pe(e.message||'Error',e.lineno?loc(e.filename,e.lineno,e.colno):stackLoc(e.error&&e.error.stack))},true);
addEventListener('unhandledrejection',function(e){var r=e.reason;pe('Unhandled promise rejection: '+(r&&r.message||r),stackLoc(r&&r.stack))});
var ce=console.error;console.error=function(){var a=[].slice.call(arguments),st='';a.forEach(function(x){if(x&&x.stack)st=x.stack});pe(a.map(function(x){return x&&x.message?x.message:String(x)}).join(' ').split('\n')[0],stackLoc(st));try{ce.apply(console,arguments)}catch(_){}};
window.alert=function(){};window.confirm=function(){return true};window.prompt=function(){return 'Test item'};
addEventListener('submit',function(e){e.preventDefault()});
document.addEventListener('click',function(e){var a=e.target&&e.target.closest&&e.target.closest('a[href]');if(a&&!/^#/.test(a.getAttribute('href')||''))e.preventDefault()},true);
try{var AC=window.AudioContext||window.webkitAudioContext;if(AC)['createOscillator','createBufferSource'].forEach(function(k){var o=AC.prototype[k];if(o)AC.prototype[k]=function(){M.sounds++;return o.apply(this,arguments)}})}catch(e){}
try{var HP=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){M.sounds++;try{return HP.apply(this,arguments)}catch(e){return Promise.resolve()}}}catch(e){}
if(document.hidden)M.hidden=true;document.addEventListener('visibilitychange',function(){if(document.hidden)M.hidden=true});var lastT=0,secF=0,secT=0;function fr(t){if(lastT&&t-lastT>50)M.longFrames++;lastT=t;secF++;if(!secT)secT=t;if(t-secT>=1000){M.fps.push(secF);secF=0;secT=t}requestAnimationFrame(fr)}requestAnimationFrame(fr);
function wait(ms){return new Promise(function(r){setTimeout(r,ms)})}
function P(type,el,x,y){var o={bubbles:true,cancelable:true,clientX:x,clientY:y,pointerId:1,pointerType:'touch',isPrimary:true,button:0,buttons:type==='pointerup'?0:1};try{el.dispatchEvent(new PointerEvent(type,o))}catch(e){el.dispatchEvent(new MouseEvent(type,o))}}
function tapAt(x,y){var el=document.elementFromPoint(x,y)||document.body;P('pointerdown',el,x,y);el.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,clientX:x,clientY:y}));P('pointerup',el,x,y);el.dispatchEvent(new MouseEvent('mouseup',{bubbles:true,clientX:x,clientY:y}));el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,clientX:x,clientY:y}))}
function swipe(x,y,dx,dy){var el=document.elementFromPoint(x,y)||document.body;P('pointerdown',el,x,y);for(var i=1;i<=4;i++)P('pointermove',el,x+dx*i/4,y+dy*i/4);P('pointerup',el,x+dx,y+dy)}
function kd(k){var o={key:k,code:k===' '?'Space':k,bubbles:true,cancelable:true};window.dispatchEvent(new KeyboardEvent('keydown',o));document.dispatchEvent(new KeyboardEvent('keydown',o))}
function ku(k){var o={key:k,code:k===' '?'Space':k,bubbles:true,cancelable:true};window.dispatchEvent(new KeyboardEvent('keyup',o));document.dispatchEvent(new KeyboardEvent('keyup',o))}
function key(k){kd(k);setTimeout(function(){ku(k)},60)}
function visible(el){var r=el.getBoundingClientRect();if(r.width<2||r.height<2)return false;var s=getComputedStyle(el);return s.visibility!=='hidden'&&s.display!=='none'&&+s.opacity>0.05&&r.bottom>0&&r.right>0&&r.top<innerHeight&&r.left<innerWidth}
function canvasHash(){var c=document.querySelector('canvas');if(!c||!c.width)return '';try{var t=document.createElement('canvas');t.width=12;t.height=12;var x=t.getContext('2d');x.drawImage(c,0,0,12,12);var d=x.getImageData(0,0,12,12).data,s='';for(var i=0;i<d.length;i+=8)s+=(d[i]>>4).toString(16)+(d[i+1]>>4).toString(16)+(d[i+2]>>4).toString(16);return s}catch(e){return ''}}
function shot(label){var c=document.querySelector('canvas');if(!c||!c.width||M.shots.length>=5)return;try{var w=120,h=Math.round(120*c.height/c.width);var t=document.createElement('canvas');t.width=w;t.height=h;var x=t.getContext('2d');x.drawImage(c,0,0,w,h);M.shots.push({label:label,src:t.toDataURL('image/jpeg',0.62)})}catch(e){}}
function heap(){try{return performance.memory?performance.memory.usedJSHeapSize:0}catch(e){return 0}}
async function gamePlay(){
 var kc=window.Kit&&Kit.current,W=innerWidth,H=innerHeight,total=SECS*1000,t0=performance.now();M.kit=!!kc;M.heap0=heap();
 if(kc)['shake','particles','floatText','flash'].forEach(function(k){var o=kc[k];if(typeof o==='function')kc[k]=function(){M.juice++;return o.apply(this,arguments)}});
 var run=null,last=kc?kc.state:'',firstEnd=false,hashT=setInterval(function(){M.hashes.push(canvasHash())},1000);
 function begin(mode){run={mode:mode,t0:performance.now(),max:0}}
 function end(died){if(!run)return;M.runs.push({mode:run.mode,dur:Math.round(performance.now()-run.t0),died:died,score:kc?Math.max(run.max,Math.floor(kc.score)):0});run=null}
 var poll=setInterval(function(){if(!kc)return;var s=kc.state;if(run&&s==='play')run.max=Math.max(run.max,Math.floor(kc.score||0));if(last==='play'&&(s==='over'||s==='win')){if(run)run.max=Math.max(run.max,Math.floor(kc.score||0));end(true);if(!firstEnd){firstEnd=true;shot('first end')}}last=s},40);
 async function ensure(mode){
  if(!kc){if(!run)begin(mode);return}
  if(kc.state==='play'){if(!run)begin(mode);return}
  if(kc.state==='pause'){kc.pause();await wait(80);if(kc.state==='play'){if(!run)begin(mode);return}}
  var wasEnded=kc.state==='over'||kc.state==='win';if(wasEnded)await wait(780);
  tapAt(W/2,H/2);await wait(220);if(kc.state!=='play'){key(' ');await wait(220)}
  if(kc.state==='play'){if(wasEnded&&M.notes.restartOk===undefined)M.notes.restartOk=Math.floor(kc.score||0)===0;begin(mode)}else if(wasEnded&&M.notes.restartOk===undefined)M.notes.restartOk=false;
 }
 var tIdle=total*0.25,tRand=total*0.35,ph=performance.now();
 await ensure('idle');setTimeout(function(){shot('start')},1200);
 while(performance.now()-ph<tIdle){await ensure('idle');await wait(100)}
 end(false);ph=performance.now();var paused=false;
 while(performance.now()-ph<tRand){
  await ensure('random');var r=Math.random(),x=W*(.15+.7*Math.random()),y=H*(.3+.6*Math.random());
  if(r<.35)tapAt(x,y);else if(r<.6)swipe(x,y,(Math.random()-.5)*180,(Math.random()-.5)*180);else key(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '][Math.floor(Math.random()*5)]);
  if(kc&&!paused&&performance.now()-ph>tRand/2&&kc.state==='play'){paused=true;kc.pause();await wait(150);var a=kc.state==='pause';kc.pause();await wait(150);M.notes.pauseOk=a&&kc.state==='play'}
  await wait(120);
 }
 end(false);shot('mid');ph=performance.now();var tSweep=total-(performance.now()-t0),held=null,side=0,lastTap=0;
 var tgt=function(){return document.elementFromPoint(W/2,H*.75)||document.body};
 await ensure('sweep');var el=tgt();P('pointerdown',el,W/2,H*.75);
 while(performance.now()-ph<tSweep){
  if(kc&&kc.state!=='play'){P('pointerup',el,W/2,H*.75);if(held){ku(held);held=null}await ensure('sweep');el=tgt();P('pointerdown',el,W/2,H*.75)}
  var tt=(performance.now()-ph)/1000,sx=W/2+Math.sin(tt*2.3)*W*.36,sy=H*.75+Math.sin(tt*1.1)*H*.08;P('pointermove',el,sx,sy);
  var want=Math.sin(tt*2.3+1.57)>0?'ArrowRight':'ArrowLeft';if(want!==held){if(held)ku(held);kd(want);held=want}
  if(performance.now()-lastTap>650){lastTap=performance.now();P('pointerup',el,sx,sy);tapAt(sx,sy);key(' ');P('pointerdown',el,sx,sy)}
  await wait(50);
 }
 P('pointerup',el,W/2,H*.75);if(held)ku(held);end(false);shot('end');clearInterval(poll);clearInterval(hashT);M.heap1=heap();
}
async function appFlow(){
 M.app=true;M.heap0=heap();var mut=0,lastMut=0,mo=new MutationObserver(function(){mut++;if(!lastMut)lastMut=performance.now()});mo.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true});
 var lat=[];function viewHash(){var t=(document.body.innerText||'').replace(/\s+/g,' ').slice(0,400);return t.length+':'+t}
 async function cw(el){var r=el.getBoundingClientRect(),m0=mut,a0=viewHash(),t1=performance.now();lastMut=0;tapAt(r.left+r.width/2,r.top+r.height/2);await wait(380);var ch=mut>m0||viewHash()!==a0;if(lastMut)lat.push(Math.round(lastMut-t1));return ch}
 function label(el){return((el.getAttribute('aria-label')||el.textContent||el.title||el.value||'').replace(/\s+/g,' ').trim()).slice(0,30)||el.tagName.toLowerCase()}
 function uniq(a){return a.filter(function(x,i){return a.indexOf(x)===i})}
 var allTabs=uniq([].slice.call(document.querySelectorAll('[data-tab],.tabbar button,[role=tab]'))).filter(visible),tabs=allTabs.filter(function(t){return !t.classList.contains('active')&&t.getAttribute('aria-selected')!=='true'}),views={},navOk=0;views[viewHash()]=1;
 for(var i=0;i<tabs.length&&i<8;i++){if(await cw(tabs[i]))navOk++;views[viewHash()]=1}
 M.nav={total:Math.min(tabs.length,8),ok:navOk};M.views=Object.keys(views).length;var first=allTabs.filter(function(t){return tabs.indexOf(t)<0})[0];if(first){await cw(first)}
 function items(){return [].slice.call(document.querySelectorAll('.item,li,.card,tr,[data-id]')).filter(visible).length}
 M.add={tried:false,ok:false};var used=[];
 for(var a=0;a<2;a++){
  var inputs=[].slice.call(document.querySelectorAll('input,textarea,select')).filter(visible).filter(function(x){return !/^(checkbox|radio|range|file|submit|button|color|hidden)$/i.test(x.type||'')});
  if(!inputs.length)break;M.add.tried=true;var before=items(),val='Test item '+(a+1);
  inputs.forEach(function(inp,k){if(inp.tagName==='SELECT'){if(inp.options.length>1)inp.selectedIndex=1}else if(inp.type==='number')inp.value=String(12+k);else if(inp.type==='date')inp.value=new Date().toISOString().slice(0,10);else if(inp.type==='time')inp.value='09:30';else if(inp.type==='email')inp.value='test@example.com';else if(inp.type==='tel')inp.value='5551234567';else inp.value=k===0?val:'Test';inp.dispatchEvent(new Event('input',{bubbles:true}));inp.dispatchEvent(new Event('change',{bubbles:true}))});
  var f=inputs[0].form,btn=f?f.querySelector('button:not([type=button]),input[type=submit]'):null;
  if(!btn){var r0=inputs[0].getBoundingClientRect(),best=null,bd=1e9;[].slice.call(document.querySelectorAll('button,[role=button],.btn')).filter(visible).forEach(function(b){if(!/add|save|create|\+|submit|log|start|calc|go\b|ok\b|done|new|plus|enter/i.test(label(b)))return;var r=b.getBoundingClientRect(),d=Math.hypot(r.left-r0.left,r.top-r0.top);if(d<bd){bd=d;best=b}});btn=best}
  if(btn){used.push(btn);await cw(btn)}else if(f){try{f.requestSubmit()}catch(e){f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))}await wait(380)}else{inputs[0].dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));await wait(380)}
  if(items()>before||(document.body.innerText||'').indexOf(val)>=0){M.add.ok=true;M.add.value=val}
 }
 var btns=uniq([].slice.call(document.querySelectorAll('button,[role=button],.btn'))).filter(visible).filter(function(b){return allTabs.indexOf(b)<0&&used.indexOf(b)<0&&!/delete|remove|clear|reset|trash|🗑/i.test(label(b))}).slice(0,14),dead=[];
 for(var j=0;j<btns.length;j++){if(!document.contains(btns[j])||!visible(btns[j]))continue;var ch=await cw(btns[j]);if(!ch)dead.push(label(btns[j]));var mb=document.querySelector('.modal-bg,dialog[open]');if(mb){tapAt(4,4);key('Escape');await wait(200)}}
 M.buttons=btns.length;M.dead=dead.slice(0,8);M.latency={avg:lat.length?Math.round(lat.reduce(function(s,x){return s+x},0)/lat.length):0,max:lat.length?Math.max.apply(null,lat):0};
 M.contrast=contrast();mo.disconnect();M.heap1=heap();
 if(M.add.ok){window.name=KEY+JSON.stringify({phase:2,ls:LS,M:M,marker:M.add.value});await wait(450);location.reload();return 'reload'}
}
function lum(c){var m=String(c).match(/rgba?\(([^)]+)\)/);if(!m)return null;var p=m[1].split(',').map(parseFloat);if(p.length>3&&p[3]<0.6)return null;var a=p.slice(0,3).map(function(v){v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)});return 0.2126*a[0]+0.7152*a[1]+0.0722*a[2]}
function bgOf(el){while(el&&el.nodeType===1){var s=getComputedStyle(el);if(s.backgroundImage&&s.backgroundImage!=='none')return null;var m=String(s.backgroundColor).match(/rgba?\(([^)]+)\)/);if(m){var p=m[1].split(',').map(parseFloat);if(p.length<4||p[3]>0.9)return s.backgroundColor}el=el.parentElement}return 'rgb(255,255,255)'}
function contrast(){var low=0,samples=[],els=[].slice.call(document.body.querySelectorAll('*')).slice(0,800);els.forEach(function(e){if(!visible(e))return;var tx=[].some.call(e.childNodes,function(n){return n.nodeType===3&&n.textContent.trim().length>1});if(!tx)return;var s=getComputedStyle(e),f=lum(s.color),bg=bgOf(e);if(f==null||!bg)return;var b=lum(bg);if(b==null)return;var r=(Math.max(f,b)+0.05)/(Math.min(f,b)+0.05),big=parseFloat(s.fontSize)>=18;if(r<(big?3:4.5)){low++;if(samples.length<3)samples.push(e.textContent.trim().slice(0,24))}});return{low:low,samples:samples}}
async function finish(){try{window.name=''}catch(e){}parent.postMessage({type:'acs-playtest',rid:RID,m:M},'*')}
async function main(){
 try{
  if(saved&&saved.phase===2){await wait(900);M.persist=(document.body.innerText||'').indexOf(saved.marker)>=0;return finish()}
  await wait(900);var isGame=TYPE==='game'||!!(window.Kit&&Kit.current)||(TYPE!=='app'&&!!document.querySelector('canvas'));
  M.mode=isGame?'game':'app';
  if(isGame)await gamePlay();else{if(await appFlow()==='reload')return}
  finish();
 }catch(err){pe('Playtester: '+err.message,{});finish()}
}
if(document.readyState==='complete')main();else addEventListener('load',main);
})();`);
  const LAYOUT = oneLine(String.raw`(function(){var RID=__RID__;
function vis(el){var r=el.getBoundingClientRect();if(r.width<4||r.height<4)return false;var s=getComputedStyle(el);return s.visibility!=='hidden'&&s.display!=='none'&&+s.opacity>0.05}
function run(){var W=innerWidth,H=innerHeight,de=document.documentElement,b=document.body||de;
var ow=Math.max(de.scrollWidth,b.scrollWidth),oh=Math.max(de.scrollHeight,b.scrollHeight),off=0,offs=[];
[].slice.call(b.querySelectorAll('*')).slice(0,2500).forEach(function(el){if(!vis(el))return;var r=el.getBoundingClientRect();if(r.right<=W+2&&r.left>=-2)return;var p=el.parentElement,sc=false;while(p&&p!==b){if(/(auto|scroll|hidden)/.test(getComputedStyle(p).overflowX)){sc=true;break}p=p.parentElement}if(sc)return;off++;if(offs.length<3)offs.push(el.tagName.toLowerCase()+(typeof el.className==='string'&&el.className?'.'+el.className.split(' ')[0]:''))});
var c=document.querySelector('canvas'),cover=1;if(c){var r=c.getBoundingClientRect();cover=Math.min(1,(r.width*r.height)/(W*H))}
var tiny=0;[].slice.call(b.querySelectorAll('*')).slice(0,1500).forEach(function(e){if([].some.call(e.childNodes,function(n){return n.nodeType===3&&n.textContent.trim()})&&vis(e)&&parseFloat(getComputedStyle(e).fontSize)<11)tiny++});
parent.postMessage({type:'acs-layout',rid:RID,w:W,h:H,overX:ow>W+2,overY:oh>H+2,off:off,offs:offs,cover:Math.round(cover*100)/100,canvas:!!c,tiny:tiny},'*')}
if(document.readyState==='complete')setTimeout(run,900);else addEventListener('load',function(){setTimeout(run,900)})})();`);
  const WATCH = oneLine(String.raw`(function(){var sent={};function loc(u,l,c){var m=String(u||'').match(/\/play\/[a-z0-9-]+\/[^\/]+\/([^?#:\s)]*)/);return{f:m?(m[1]||'index.html'):'',l:l||0,c:c||0}} function stackLoc(s){var m=String(s||'').match(/(https?:\/\/[^\s)]+?):(\d+):(\d+)/);return m?loc(m[1],+m[2],+m[3]):{f:'',l:0,c:0}} function pe(m,L){m=String(m||'Error').slice(0,300);if(sent[m])return;sent[m]=1;L=L||{};parent.postMessage({type:'acs-err',rid:__RID__,msg:m,file:L.f||'',line:L.l||0,col:L.c||0},'*')}
addEventListener('error',function(e){if(e.target&&e.target!==window&&e.target.tagName){pe('Failed to load '+(e.target.src||e.target.href||'a file'),{});return}pe(e.message,e.lineno?loc(e.filename,e.lineno,e.colno):stackLoc(e.error&&e.error.stack))},true);
addEventListener('unhandledrejection',function(e){var r=e.reason;pe('Unhandled promise rejection: '+(r&&r.message||r),stackLoc(r&&r.stack))});
var ce=console.error;console.error=function(){var a=[].slice.call(arguments),st='';a.forEach(function(x){if(x&&x.stack)st=x.stack});pe(a.map(function(x){return x&&x.message?x.message:String(x)}).join(' ').split('\n')[0],stackLoc(st));try{ce.apply(console,arguments)}catch(_){}};
addEventListener('submit',function(e){e.preventDefault()});})();`);

  /** Sandboxed iframes block localStorage; give the app a working one (optionally synced to the studio). */
  function lsShim(/** @type {Record<string,string>} */ seed, /** @type {boolean} */ persist) {
    return '(function(){var ok=true;try{window.localStorage.getItem("x")}catch(e){ok=false}if(ok)return;var d=' + JSON.stringify(seed || {}).replace(/</g, '\\u003c') + ';var t=0;' +
      'function sync(){' + (persist ? 'clearTimeout(t);t=setTimeout(function(){try{parent.postMessage({type:"acs-ls",d:d},"*")}catch(e){}},250)' : '') + '}' +
      'function mk(){return{getItem:function(k){return Object.prototype.hasOwnProperty.call(d,k)?d[k]:null},setItem:function(k,v){d[k]=String(v);sync()},removeItem:function(k){delete d[k];sync()},clear:function(){for(var k in d)delete d[k];sync()},key:function(i){return Object.keys(d)[i]||null},get length(){return Object.keys(d).length}}}' +
      'var s=mk();try{Object.defineProperty(window,"localStorage",{value:s,configurable:true})}catch(e){}try{Object.defineProperty(window,"sessionStorage",{value:mk(),configurable:true})}catch(e){}})();';
  }
  const testScript = (/** @type {number} */ rid, /** @type {string} */ type) => lsShim({}, false) + HARNESS.replace('__RID__', String(rid | 0)).replace('__TYPE__', JSON.stringify(type === 'app' ? 'app' : type === 'game' ? 'game' : ''));
  const previewScript = (/** @type {number} */ rid, /** @type {Record<string,string>} */ seed) => lsShim(seed, true) + WATCH.replace('__RID__', String(rid | 0));

  const playtestScript = (/** @type {number} */ rid, /** @type {string} */ type, /** @type {number} */ secs) => PLAYTEST.replace('__RID__', String(rid | 0)).replace('__TYPE__', JSON.stringify(type === 'app' ? 'app' : type === 'game' ? 'game' : '')).replace('__SECS__', String(Math.max(6, Math.min(90, secs | 0 || 20))));
  const layoutScript = (/** @type {number} */ rid) => lsShim({}, false) + LAYOUT.replace('__RID__', String(rid | 0));

  const api = { testScript, previewScript, playtestScript, layoutScript, lsShim };
  // @ts-ignore
  root.Harness = api;
  // @ts-ignore
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
