(() => {
  const originalRAF = window.requestAnimationFrame.bind(window);
  const callbacks = [], frames = [], longTasks = [], paints = [], visibility = [];
  let previous;
  window.requestAnimationFrame = callback => originalRAF(time => {
    const begin = performance.now();
    try { callback(time); } finally { callbacks.push({t:begin, ms:performance.now()-begin}); }
  });
  const frame = time => {
    if (previous !== undefined) frames.push({t:time, ms:time-previous});
    previous = time;
    originalRAF(frame);
  };
  originalRAF(frame);
  const supported = PerformanceObserver.supportedEntryTypes || [];
  for (const type of ['longtask','paint','largest-contentful-paint']) {
    if (!supported.includes(type)) continue;
    new PerformanceObserver(list => {
      for (const e of list.getEntries()) {
        (type === 'longtask' ? longTasks : paints).push({name:e.name,type,t:e.startTime,ms:e.duration});
      }
    }).observe({type, buffered:true});
  }
  document.addEventListener('visibilitychange',()=>visibility.push({t:performance.now(),state:document.visibilityState}));
  const raw = {url:location.href,ua:navigator.userAgent,dpr:devicePixelRatio,viewport:[innerWidth,innerHeight],supported,visibility,phases:{},ready:{}};
  const round = n => Math.round(n*100)/100;
  const summary = (a,b) => {
    const f=frames.filter(x=>x.t>=a&&x.t<=b&&x.t-x.ms>=a).map(x=>x.ms).sort((x,y)=>x-y);
    const c=callbacks.filter(x=>x.t>=a&&x.t<=b), l=longTasks.filter(x=>x.t>=a&&x.t<=b);
    return {draws:(window.__perfDraws||[]).filter(t=>t>=a&&t<=b).length,captureCalls:(window.__perfCaptures||[]).filter(x=>x.t>=a&&x.t<=b).length,start:round(a),duration:round(b-a),frames:f.length,rafHz:f.length?round(1000/(f.reduce((x,y)=>x+y,0)/f.length)):null,frameP95:f.length?round(f[Math.floor((f.length-1)*.95)]):null,frameMax:f.length?round(f[f.length-1]):null,gapsOver33:f.filter(x=>x>33.4).length,gapsOver50:f.filter(x=>x>50).length,rafCallbackCount:c.length,rafCallbackMs:round(c.reduce((sum,x)=>sum+x.ms,0)),longTaskCount:supported.includes('longtask')?l.length:null,longTaskMs:supported.includes('longtask')?round(l.reduce((sum,x)=>sum+x.ms,0)):null};
  };
  const publish = () => {
    let output=document.getElementById('perf-results');
    if(!output){output=document.createElement('script');output.type='application/json';output.id='perf-results';output.setAttribute('data-liquid-ignore','');document.body.append(output);}
    raw.visibilityState=document.visibilityState;raw.captures=window.__perfCaptures||[];raw.draws=(window.__perfDraws||[]).length;
    raw.nav=performance.getEntriesByType('navigation').map(n=>({dcl:round(n.domContentLoadedEventEnd),load:round(n.loadEventEnd),response:round(n.responseEnd)}));
    raw.paints=paints;
    raw.resources=performance.getEntriesByType('resource').filter(r=>/liquidGL|nav-glass/.test(r.name)).map(r=>({name:r.name,transfer:r.transferSize,encoded:r.encodedBodySize,duration:round(r.duration)}));
    raw.canvases=[...document.querySelectorAll('canvas')].map(c=>({width:c.width,height:c.height}));
    const renderer=window.__liquidGLRenderer__;
    raw.renderer=renderer?{backend:renderer.backend?.constructor.name,resolution:renderer._snapshotResolution,texture:[renderer.textureWidth,renderer.textureHeight]}:null;
    output.textContent=JSON.stringify(raw); for(const [name,phase] of Object.entries(raw.phases)) output.dataset[name]=phase.pending?'pending':'ready';
  };
  const measure = (name,duration) => {
    if(raw.phases[name])return;
    const start=performance.now();raw.phases[name]={pending:true,start};publish();
    setTimeout(()=>{raw.phases[name]=summary(start,performance.now());publish();},duration);
  };
  document.addEventListener('keydown',e=>{if(e.key==='F8')publish();});
  document.addEventListener('DOMContentLoaded',()=>{
    new MutationObserver(records=>{
      for(const r of records){const n=r.target;
        if(n.dataset.glass==='ready'){
          const key=n.classList.contains('nav')?'nav':n.classList.contains('nav-links')?'mobile':'dropdown';
          raw.ready[key]=round(performance.now());
        }
      }
    }).observe(document.querySelector('.nav'),{subtree:true,attributes:true,attributeFilter:['data-glass']});
    document.addEventListener('click',event=>{
      if(event.target.closest('.menu-toggle')) measure(document.querySelector('.nav-links').classList.contains('active')?'close':'menu',4000);
      if(event.target.closest('.theme-toggle')) measure('theme',4000);
    },true);
    window.addEventListener('scroll',()=>measure('scroll',4000),{passive:true,once:true});
    setTimeout(()=>{raw.phases.startup=summary(0,3000);publish();},3100);
    setTimeout(()=>{raw.phases.idle=summary(3500,6500);publish();},6700);
  });
})();
