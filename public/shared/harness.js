// @ts-check
/* App Creator Studio — scripts injected into apps for testing/preview (used by the server).
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
var frames=0;(function f(){frames++;requestAnimationFrame(f)})();
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
 if(isGame||document.querySelector('canvas'))add('fps','Runs smoothly',fps>=50?'pass':fps>=28?'warn':'fail',fps+' fps');
 if(!isGame){var small=[].slice.call(document.querySelectorAll('button,a,[role=button],input,select,[data-tab]')).filter(visible).filter(function(el){var r=el.getBoundingClientRect();return r.height<34&&r.width<34||r.height<28});add('taps','Buttons big enough to tap',small.length?'warn':'pass',small.length?small.length+' control(s) under 34px':'')}
 var tiny=0,els=document.body?document.body.querySelectorAll('*'):[];for(var k=0;k<els.length&&k<1500;k++){var e=els[k];if(e.childNodes.length&&[].some.call(e.childNodes,function(n){return n.nodeType===3&&n.textContent.trim()})&&visible(e)&&parseFloat(getComputedStyle(e).fontSize)<11)tiny++}
 add('text','Text readable (≥11px)',tiny?'warn':'pass',tiny?tiny+' element(s) with tiny text':'');
 if(typeof window.__selfTest==='function'){try{var st=window.__selfTest()||{},bad=Object.keys(st).filter(function(k){return !st[k]});add('self','Self-test',bad.length?'warn':'pass',bad.length?'false: '+bad.join(', '):Object.keys(st).length+' assertions')}catch(e){add('self','Self-test','warn','threw: '+e.message)}}
 parent.postMessage({type:'acs-test',rid:RID,checks:R.checks,errors:R.errors,fps:fps},'*');
 }catch(err){pe('Test harness: '+err.message,{});parent.postMessage({type:'acs-test',rid:RID,checks:R.checks,errors:R.errors,fps:0},'*')}
}
if(document.readyState==='complete')run();else addEventListener('load',run);
})();`);
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

  const api = { testScript, previewScript, lsShim };
  // @ts-ignore
  root.Harness = api;
  // @ts-ignore
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
