/* Single-child dictation history: automatic IndexedDB persistence, no sign-in. */
(() => {
  const $ = id => document.getElementById(id);
  let db, events = [], bridge, ready = false, memoryOnly = false;
  const queued = [];
  const status = text => { $('cloud-status').textContent = text; };
  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('word-practice-learning', 1);
      request.onupgradeneeded = () => {
        const store = request.result.createObjectStore('events', {keyPath: 'key'});
        store.createIndex('scope', 'scope');
        request.result.createObjectStore('meta');
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  function readScope(owner) {
    return new Promise((resolve, reject) => {
      const request = db.transaction('events').objectStore('events').index('scope').getAll(owner);
      request.onsuccess = () => resolve(request.result.map(row => row.event));
      request.onerror = () => reject(request.error);
    });
  }
  function writeEvents(owner, rows) {
    if (!db) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('events', 'readwrite');
      rows.forEach(event => tx.objectStore('events').put({key: owner + ':' + event.id, scope: owner, event}));
      tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
    });
  }
  function newEvent(kind, payload, time = Date.now()) {
    return {id: crypto.randomUUID(), occurred_at: new Date(time).toISOString(), kind, payload};
  }
  function validEvent(e) {
    if (!e || !/^[\da-f-]{36}$/i.test(e.id) || !Number.isFinite(Date.parse(e.occurred_at))) return false;
    const p = e.payload;
    if (!p) return false;
    if (e.kind === 'session') return typeof p.session_id === 'string' && ['start','finish'].includes(p.action);
    if (typeof p.item_id !== 'string') return false;
    if (e.kind === 'mistake') return typeof p.active === 'boolean';
    return e.kind === 'answer' && ['en','zh'].includes(p.direction) && typeof p.correct === 'boolean' &&
      p.review && Number.isInteger(p.review.stage) && p.review.stage >= 0 && p.review.stage < 9 &&
      Number.isFinite(p.review.due) && Number.isFinite(p.review.last) && Number.isInteger(p.review.attempts);
  }
  function derive(rows) {
    const reviews = {}, mistakes = {};
    [...rows].filter(validEvent).sort((a,b) => a.occurred_at.localeCompare(b.occurred_at) || a.id.localeCompare(b.id)).forEach(e => {
      const p = e.payload;
      if (e.kind === 'answer') {
        reviews[p.direction + ':' + p.item_id] = p.review;
        if (!p.correct) mistakes[p.item_id] = true;
      } else if (e.kind === 'mistake' && p.active) mistakes[p.item_id] = true;
      else if(e.kind === 'mistake') delete mistakes[p.item_id];
    });
    return {reviews, mistakes};
  }
  function render() {
    $('account-label').textContent = '默写记录';
    $('account-email').textContent = '自动记录每轮默写，无需登录';
    const answers = events.filter(e => e.kind === 'answer' && validEvent(e) && !e.payload.imported);
    const correct = answers.filter(e => e.payload.correct).length;
    const days = new Set(answers.map(e => new Date(e.occurred_at).toLocaleDateString('en-CA')));
    const sessions = new Set(events.filter(e=>validEvent(e)&&!e.payload.imported).map(e=>e.payload.session_id).filter(Boolean));
    const seconds = answers.reduce((sum,e) => sum + Math.max(0, Number(e.payload.seconds) || 0), 0);
    $('history-total').textContent = answers.length;
    $('history-accuracy').textContent = (answers.length ? Math.round(correct / answers.length * 100) : 0) + '%';
    $('history-days').textContent = days.size;
    $('history-time').textContent = Math.round(seconds / 60) + ' 分钟';
    $('history-sessions').textContent = sessions.size + ' 轮练习 · 正确 ' + correct + ' · 错误 ' + (answers.length - correct);
    const root = $('history-units'); root.replaceChildren();
    ['u1','u2','u3'].forEach(unit => {
      const rows = answers.filter(e => e.payload.unit === unit);
      const row = document.createElement('p');
      row.textContent = unit.toUpperCase() + '：' + rows.length + ' 题 · 正确率 ' + (rows.length ? Math.round(rows.filter(e=>e.payload.correct).length / rows.length * 100) : 0) + '%';
      root.append(row);
    });
    renderSessions();
  }
  function renderSessions() {
    const sessions = new Map();
    for (const event of [...events].filter(validEvent).sort((a,b)=>Date.parse(a.occurred_at)-Date.parse(b.occurred_at))) {
      const p=event.payload;
      if(p.imported || !p.session_id) continue;
      let session=sessions.get(p.session_id);
      if(!session){session={start:event.occurred_at,answers:[],complete:false};sessions.set(p.session_id,session);}
      if(event.kind==='session' && p.action==='start'){session.start=event.occurred_at;session.unit=p.unit;session.total=p.total;session.direction=p.direction;}
      if(event.kind==='session' && p.action==='finish'){session.complete=true;session.end=event.occurred_at;}
      if(event.kind==='answer') session.answers.push(event);
    }
    const root=$('session-history');root.replaceChildren();
    $('history-empty').hidden=!!sessions.size;
    [...sessions.values()].sort((a,b)=>Date.parse(b.start)-Date.parse(a.start)).forEach(session=>{
      const card=document.createElement('details'),title=document.createElement('summary');
      const correct=session.answers.filter(e=>e.payload.correct).length,count=session.answers.length;
      title.textContent=new Date(session.start).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})+' · '+(session.unit==='all'?'全部单元':(session.unit||'').toUpperCase())+' · '+(session.complete?'已完成':'未完成');
      const score=document.createElement('p');score.className='hint';
      const seconds=session.answers.reduce((sum,e)=>sum+(e.payload.seconds||0),0);
      score.textContent='已判分 '+count+' / '+(session.total||count)+' 题 · 正确 '+correct+' · 错误/跳过 '+(count-correct)+' · 正确率 '+(count?Math.round(correct/count*100):0)+'% · 用时 '+Math.floor(seconds/60)+' 分 '+seconds%60+' 秒';
      card.append(title,score);
      session.answers.forEach(e=>{const p=e.payload,row=document.createElement('div');row.className='history-answer';
        const word=document.createElement('strong');word.textContent=(p.correct?'✓ ':'✕ ')+(p.en||p.item_id)+' · '+(p.zh||'');
        const detail=document.createElement('p');detail.textContent=p.skipped?'不会 / 跳过':('首次填写：'+(p.typed||'（未填写）')+(p.correct?'':'；正确答案：'+(p.direction==='zh'?p.zh:p.en)));
        row.append(word,detail);card.append(row);});
      root.append(card);
    });
  }
  function apply() { bridge?.restore(derive(events)); render(); }
  async function record(kind, payload) {
    if (!ready) { queued.push([kind, payload]); return; }
    const owner = 'guest', event = newEvent(kind, payload);
    events.push(event);
    render();
    try { await writeEvents(owner, [event]); }
    catch { memoryOnly = true; status('本机保存失败，本次记录仅在页面中保留，请勿关闭页面。'); }
    if (!memoryOnly) status('默写记录已自动保存在当前设备。');
  }
  window.learningCloud = {
    attach(api) { bridge = api; if (ready) apply(); },
    record,
    derive,
    getEvents: () => structuredClone(events)
  };
  $('open-account').onclick = () => { bridge?.pause(); render(); $('account-dialog').showModal(); };
  $('close-account').onclick = () => $('account-dialog').close();
  (async () => {
    try { db = await openDB(); events = await readScope('guest'); }
    catch { memoryOnly = true; status('浏览器无法保存学习记录，本次记录仅在页面中保留。'); }
    ready = true;
    // Migrate pre-database review state once; historical scores cannot be reconstructed.
    {
      let migrated = false;
      if (db) {const r = db.transaction('meta').objectStore('meta').get('legacy-migrated');
        await new Promise(resolve => {r.onsuccess=resolve;r.onerror=resolve;}); migrated = Boolean(r.result);}
      if (!migrated) {
        const old = bridge?.snapshot() || {reviews:{},mistakes:{}};
        const imported = [];
        Object.entries(old.reviews).forEach(([key,review])=>{const split=key.indexOf(':'); imported.push(newEvent('answer',{item_id:key.slice(split+1),direction:key.slice(0,split),correct:true,review,imported:true},review.last));});
        Object.keys(old.mistakes).forEach(item_id=>imported.push(newEvent('mistake',{item_id,active:true})));
        await writeEvents('guest',imported); events.push(...imported);
        if(db){const mark=db.transaction('meta','readwrite');mark.objectStore('meta').put(true,'legacy-migrated');}
      }
    }
    apply(); queued.splice(0).forEach(args=>record(...args));
    render();
    if(!memoryOnly) status('默写记录已自动保存在当前设备。');
  })().catch(()=>status('学习数据库初始化失败，请刷新重试。'));
})();
