
(() => {
  'use strict';

  const DB = window.HMQ_DATABASE;
  if (!DB || !Array.isArray(DB.questions)) {
    document.body.innerHTML = '<p>問題データを読み込めませんでした。</p>';
    return;
  }



  const ADMOB = {
    bannerId: 'ca-app-pub-8174756915786797/3736807205',
    interstitialId: 'ca-app-pub-8174756915786797/9626418978',
    testMode: false
  };

  const nativeAds = (() => {
    const cap = window.Capacitor;
    const isNative = !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
    let AdMob = null;
    let ready = false;
    let interstitialReady = false;
    let interstitialShowing = false;
    let initialized = false;

    function plugin() {
      if (AdMob) return AdMob;
      try {
        if (cap?.registerPlugin) AdMob = cap.registerPlugin('AdMob');
        if (!AdMob && cap?.Plugins?.AdMob) AdMob = cap.Plugins.AdMob;
      } catch {}
      return AdMob;
    }

    async function prepareInterstitial() {
      const ads = plugin();
      if (!isNative || !ready || !ads) return;
      interstitialReady = false;
      try {
        await ads.prepareInterstitial({ adId: ADMOB.interstitialId, isTesting: ADMOB.testMode });
        interstitialReady = true;
      } catch (e) {
        console.warn('AdMob interstitial prepare failed', e);
      }
    }

    async function init() {
      if (!isNative || initialized) return;
      initialized = true;
      const ads = plugin();
      if (!ads) { console.warn('AdMob plugin unavailable'); return; }
      try {
        await ads.addListener('interstitialAdLoaded', () => { interstitialReady = true; });
        await ads.addListener('interstitialAdFailedToLoad', () => { interstitialReady = false; });
        await ads.addListener('interstitialAdDismissed', () => { interstitialShowing = false; prepareInterstitial(); });
        await ads.addListener('interstitialAdFailedToShow', () => { interstitialShowing = false; interstitialReady = false; prepareInterstitial(); });
        await ads.initialize({ initializeForTesting: ADMOB.testMode });
        let consent = await ads.requestConsentInfo();
        if (consent?.isConsentFormAvailable && consent?.status === 'REQUIRED') {
          consent = await ads.showConsentForm();
        }
        ready = !!consent?.canRequestAds;
        if (!ready && consent?.status === 'NOT_REQUIRED') ready = true;
        if (ready) {
          await prepareInterstitial();
          await syncBanner(state.screen);
        }
      } catch (e) {
        console.warn('AdMob initialization failed', e);
      }
    }

    async function syncBanner(screen) {
      const ads = plugin();
      if (!isNative || !ready || !ads) return;
      const shouldShow = screen !== 'settings';
      try {
        if (shouldShow) {
          await ads.showBanner({
            adId: ADMOB.bannerId,
            adSize: 'ADAPTIVE_BANNER',
            position: 'BOTTOM_CENTER',
            margin: 0,
            isTesting: ADMOB.testMode
          });
        } else {
          await ads.hideBanner();
        }
      } catch (e) {
        console.warn('AdMob banner update failed', e);
      }
    }

    async function showInterstitial(onDone) {
      const ads = plugin();
      if (!isNative || !ready || !ads || !interstitialReady || interstitialShowing) return false;
      interstitialReady = false;
      interstitialShowing = true;
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        interstitialShowing = false;
        onDone?.();
      };
      let dismissedHandle = null;
      let failedHandle = null;
      try {
        dismissedHandle = await ads.addListener('interstitialAdDismissed', async () => {
          try { await dismissedHandle?.remove?.(); await failedHandle?.remove?.(); } catch {}
          finish();
        });
        failedHandle = await ads.addListener('interstitialAdFailedToShow', async () => {
          try { await dismissedHandle?.remove?.(); await failedHandle?.remove?.(); } catch {}
          finish();
        });
        await ads.showInterstitial();
        return true;
      } catch (e) {
        console.warn('AdMob interstitial show failed', e);
        try { await dismissedHandle?.remove?.(); await failedHandle?.remove?.(); } catch {}
        finish();
        await prepareInterstitial();
        return true;
      }
    }

    async function showPrivacyOptions() {
      const ads = plugin();
      if (!isNative || !ads) return false;
      try { await ads.showPrivacyOptionsForm(); return true; }
      catch (e) { console.warn('Privacy options unavailable', e); return false; }
    }

    return { isNative, init, syncBanner, showInterstitial, showPrivacyOptions };
  })();

  const CATEGORIES = {
    human:   { label: '人間・からだ', icon: '●' },
    animal:  { label: '動物', icon: '◆' },
    life:    { label: '暮らし', icon: '⌂' },
    food:    { label: '食べ物', icon: '●' },
    earth:   { label: '地球', icon: '◎' },
    science: { label: '科学', icon: '△' },
    space:   { label: '宇宙', icon: '★' },
    japan:   { label: '日本', icon: '▲' },
    world:   { label: '世界', icon: '○' },
    transport:{ label: '乗り物', icon: '▰' },
    sports:  { label: 'スポーツ', icon: '●' },
    history: { label: '歴史', icon: '◷' }
  };

  const LS = {
    favorites: 'hmq_favorites_v1', recent: 'hmq_recent_v1',
    bgm: 'hmq_bgm_v1', sound: 'hmq_sound_v1',
    vibration: 'hmq_vibration_v1', firstHint: 'hmq_first_hint_v1'
  };
  const SS = { seen: 'hmq_session_seen_v1', adCount: 'hmq_ad_count_v1', adTarget: 'hmq_ad_target_v1' };

  const state = {
    screen: 'home',
    quizMode: 'all',
    quizCategory: null,
    current: null,
    answerShown: false,
    favorites: new Set(readJSON(localStorage, LS.favorites, [])),
    recent: readJSON(localStorage, LS.recent, []),
    sessionSeen: new Set(readJSON(sessionStorage, SS.seen, [])),
    bgm: readBool(LS.bgm, true),
    sound: readBool(LS.sound, true),
    vibration: readBool(LS.vibration, true),
    showFirstHint: localStorage.getItem(LS.firstHint) !== 'done',
    adCount: Number(sessionStorage.getItem(SS.adCount) || 0),
    adTarget: Number(sessionStorage.getItem(SS.adTarget) || randomInt(18, 22)),
    lastCategories: []
  };
  persistAdState();

  const audioFX = (() => {
    const bgm = new Audio('audio/bgm_main.mp3');
    bgm.loop = true;
    bgm.preload = 'auto';
    bgm.volume = 0.20;

    const tap = new Audio('audio/se_tap.mp3');
    tap.preload = 'auto';
    tap.volume = 0.42;

    const answer = new Audio('audio/se_answer.mp3');
    answer.preload = 'auto';
    answer.volume = 0.58;

    let unlocked = false;

    function safePlay(audio, restart = false) {
      try {
        if (restart) audio.currentTime = 0;
        const p = audio.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
        return true;
      } catch {
        return false;
      }
    }

    function startBgm() {
      if (!unlocked || !state.bgm || document.hidden) return;
      safePlay(bgm, false);
    }

    function pauseBgm() {
      try { bgm.pause(); } catch {}
    }

    function unlockAndStartBgm() {
      unlocked = true;
      startBgm();
    }

    function setBgmEnabled(enabled) {
      if (enabled) startBgm();
      else pauseBgm();
    }

    function playTap() {
      if (!state.sound) return;
      safePlay(tap, true);
    }

    function playAnswer() {
      if (!state.sound) return;
      safePlay(answer, true);
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) pauseBgm();
      else startBgm();
    });
    window.addEventListener('pagehide', pauseBgm);
    window.addEventListener('pageshow', startBgm);

    return { unlockAndStartBgm, setBgmEnabled, startBgm, pauseBgm, playTap, playAnswer };
  })();

  const el = document.getElementById('screen');
  const modalRoot = document.getElementById('modalRoot');

  function readJSON(storage, key, fallback) {
    try { const v = storage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  }
  function readBool(key, fallback) {
    const v = localStorage.getItem(key); return v === null ? fallback : v === 'true';
  }
  function saveFavorites() { localStorage.setItem(LS.favorites, JSON.stringify([...state.favorites])); }
  function saveRecent() { localStorage.setItem(LS.recent, JSON.stringify(state.recent.slice(0,100))); }
  function saveSeen() { sessionStorage.setItem(SS.seen, JSON.stringify([...state.sessionSeen])); }
  function persistAdState() {
    sessionStorage.setItem(SS.adCount, String(state.adCount));
    sessionStorage.setItem(SS.adTarget, String(state.adTarget));
  }
  function randomInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
  function escapeHTML(v='') { return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

  function header(title, right='') {
    return `<div class="header">
      <button class="icon-btn" data-action="back" aria-label="戻る">‹</button>
      <div class="header-title">${escapeHTML(title)}</div>
      <div>${right}</div>
    </div>`;
  }

  function render() {
    el.classList.toggle('scrollable', state.screen === 'favorites');
    if (state.screen === 'home') renderHome();
    else if (state.screen === 'category') renderCategory();
    else if (state.screen === 'quiz') renderQuiz();
    else if (state.screen === 'favorites') renderFavorites();
    else if (state.screen === 'settings') renderSettings();
    bindActions();
    nativeAds.syncBanner(state.screen);
  }

  function renderHome() {
    el.innerHTML = `
      <div class="header"><div></div><div></div><button class="icon-btn" data-action="settings" aria-label="設定">⚙</button></div>
      <div class="logo-wrap"><h1 class="logo">どのくらい？</h1><p class="subtitle">予想！数字クイズ</p></div>
      <div class="stack">
        <button class="btn btn-primary" data-action="play-all">おまかせで遊ぶ</button>
        <button class="btn btn-secondary" data-action="category">カテゴリから選ぶ</button>
        <button class="btn btn-favorite" data-action="favorites">♡ お気に入り</button>
      </div>`;
  }

  function renderCategory() {
    const cards = Object.entries(CATEGORIES).map(([id,c]) => `
      <button class="category-card" data-action="play-category" data-category="${id}">
        <span class="category-icon">${c.icon}</span><span>${escapeHTML(c.label)}</span>
      </button>`).join('');
    el.innerHTML = `${header('カテゴリ')}
      <button class="omakase-card" data-action="play-all">おまかせ</button>
      <div class="category-grid">${cards}</div>`;
  }

  function renderQuiz() {
    if (!state.current) { chooseNextQuestion(); if (!state.current) return; }
    const q = state.current;
    const catLabel = state.quizMode === 'all' ? 'おまかせ' : state.quizMode === 'favorites' ? 'お気に入り' : (CATEGORIES[q.category]?.label || q.category);
    const fav = state.favorites.has(q.id);
    const favButton = `<button class="icon-btn ${fav?'favorite-active':''}" data-action="toggle-favorite" aria-label="お気に入り">${fav?'♥':'♡'}</button>`;
    let body;
    if (!state.answerShown) {
      body = `<div class="quiz-content">
        <div class="q-label">Q</div>
        <p class="question">${escapeHTML(q.question)}</p>
        <div class="quiz-actions"><button class="btn btn-primary" style="width:100%" data-action="show-answer">答えを見る</button></div>
        ${state.showFirstHint?'<div class="first-hint">数字を予想したら「答えを見る」をタップ！</div>':''}
      </div>`;
    } else {
      body = `<div class="quiz-content">
        <p class="question" style="font-size:clamp(21px,6vw,29px)">${escapeHTML(q.question)}</p>
        <div class="answer-block">
          <div class="answer-label">答え</div>
          <div class="answer-value bounce">${escapeHTML(q.answerDisplay)}</div>
          <div class="explanation">${escapeHTML(q.explanation)}</div>
        </div>
        <div class="quiz-actions"><button class="btn btn-primary" style="width:100%" data-action="next-question">次の問題</button></div>
      </div>`;
    }
    el.innerHTML = `<div class="quiz-wrap">${header(catLabel, favButton)}${body}</div>`;
  }

  function renderFavorites() {
    const qs = DB.questions.filter(q => state.favorites.has(q.id));
    if (!qs.length) {
      el.innerHTML = `${header('お気に入り')}<div class="empty"><div class="empty-heart">♡</div><div class="empty-text">気になった問題を<br>♡で保存できます</div><button class="btn btn-primary" data-action="play-all">おまかせで遊ぶ</button></div>`;
      return;
    }
    const cards = [...qs].reverse().map(q => `<div class="favorite-card" data-action="open-favorite" data-id="${q.id}">
      <div class="favorite-cat">${escapeHTML(CATEGORIES[q.category]?.label || q.category)}</div>
      <div class="favorite-q">${escapeHTML(q.question)}</div>
      <button class="favorite-heart" data-action="remove-favorite" data-id="${q.id}" aria-label="お気に入り解除">♥</button>
    </div>`).join('');
    el.innerHTML = `${header('お気に入り')}<button class="btn btn-primary" style="width:100%;margin-bottom:18px" data-action="play-favorites">お気に入りから遊ぶ</button><div class="favorite-list">${cards}</div>`;
  }

  function renderSettings() {
    el.innerHTML = `${header('設定')}
      <div class="settings-group"><div class="settings-label">サウンド</div>
        <div class="setting-row"><strong>BGM</strong><button class="switch ${state.bgm?'on':''}" data-action="toggle-bgm" aria-label="BGM"></button></div>
        <div class="setting-row"><strong>効果音</strong><button class="switch ${state.sound?'on':''}" data-action="toggle-sound" aria-label="効果音"></button></div>
        <div class="setting-row"><strong>振動</strong><button class="switch ${state.vibration?'on':''}" data-action="toggle-vibration" aria-label="振動"></button></div>
      </div>
      <div class="settings-group"><div class="settings-label">このアプリについて</div>
        <div class="info-card"><strong>どのくらい？ - 予想！数字クイズ</strong><br>数字を予想して、答えを見て楽しむクイズアプリです。回答入力やスコアはありません。</div>
        <div class="info-card">1500問のクイズデータを端末内に収録しています。</div>
        <button class="btn btn-secondary privacy-btn" data-action="privacy-options">広告のプライバシー設定</button>
      </div>
      <div class="version">HowMuchQuiz v1.0 / 1500問</div>`;
  }

  function bindActions() {
    el.querySelectorAll('[data-action]').forEach(node => node.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = node.dataset.action;
      audioFX.unlockAndStartBgm();
      if (action !== 'show-answer') audioFX.playTap();
      if (action === 'back') goBack();
      else if (action === 'settings') { state.screen='settings'; render(); }
      else if (action === 'category') { state.screen='category'; render(); }
      else if (action === 'favorites') { state.screen='favorites'; render(); }
      else if (action === 'play-all') startQuiz('all');
      else if (action === 'play-category') startQuiz('category', node.dataset.category);
      else if (action === 'play-favorites') startQuiz('favorites');
      else if (action === 'show-answer') showAnswer();
      else if (action === 'next-question') nextQuestion();
      else if (action === 'toggle-favorite') toggleFavorite(state.current.id);
      else if (action === 'remove-favorite') { toggleFavorite(node.dataset.id, false); render(); }
      else if (action === 'open-favorite') openFavorite(node.dataset.id);
      else if (action === 'toggle-bgm') {
        state.bgm=!state.bgm;
        localStorage.setItem(LS.bgm,String(state.bgm));
        audioFX.setBgmEnabled(state.bgm);
        render();
      }
      else if (action === 'toggle-sound') { state.sound=!state.sound; localStorage.setItem(LS.sound,String(state.sound)); render(); }
      else if (action === 'toggle-vibration') { state.vibration=!state.vibration; localStorage.setItem(LS.vibration,String(state.vibration)); render(); }
      else if (action === 'privacy-options') { nativeAds.showPrivacyOptions().then(ok => { if (!ok) showToast('現在、変更できる広告設定はありません'); }); }
    }));
  }

  function goBack() {
    if (state.screen === 'quiz') state.screen = state.quizMode === 'category' ? 'category' : (state.quizMode === 'favorites' ? 'favorites' : 'home');
    else state.screen = 'home';
    render();
  }

  function startQuiz(mode, category=null) {
    if (mode === 'favorites' && state.favorites.size === 0) { showToast('お気に入りがありません'); return; }
    state.quizMode = mode; state.quizCategory = category; state.answerShown=false; state.current=null; state.screen='quiz';
    chooseNextQuestion(); render();
  }

  function poolForMode() {
    let p = DB.questions.filter(q => q.enabled !== false && q.releaseStatus !== 'reserve');
    if (state.quizMode === 'category') p = p.filter(q => q.category === state.quizCategory);
    if (state.quizMode === 'favorites') p = p.filter(q => state.favorites.has(q.id));
    return p;
  }

  function chooseNextQuestion() {
    const pool = poolForMode();
    if (!pool.length) { state.current=null; state.screen='home'; showToast('出題できる問題がありません'); return; }
    let available = pool.filter(q => !state.sessionSeen.has(q.id));
    if (!available.length) {
      const recent20 = new Set(state.recent.slice(0,20));
      for (const q of pool) state.sessionSeen.delete(q.id);
      available = pool.filter(q => !recent20.has(q.id));
      if (!available.length) available = [...pool];
      saveSeen();
    }
    const recentSet = new Set(state.recent.slice(0,100));
    let filtered = available.filter(q => !recentSet.has(q.id));
    if (filtered.length < Math.min(5, available.length)) filtered = available;

    const lastCat = state.lastCategories[0];
    const prevCat = state.lastCategories[1];
    const scored = filtered.map(q => {
      let score = 1 + (q.revealPower || 1)*1.8 + (q.guessability || 1)*1.4 + (q.surprise || 1)*1.2;
      if (q.category === lastCat) score *= 0.15;
      else if (q.category === prevCat) score *= 0.55;
      score *= (0.86 + Math.random()*0.30);
      return {q,score};
    }).sort((a,b)=>b.score-a.score);
    const top = scored.slice(0, Math.min(8,scored.length));
    const chosen = top[Math.floor(Math.random()*top.length)]?.q || filtered[0];
    state.current=chosen; state.answerShown=false;
    state.sessionSeen.add(chosen.id); saveSeen();
    state.recent = [chosen.id, ...state.recent.filter(id=>id!==chosen.id)].slice(0,100); saveRecent();
    state.lastCategories = [chosen.category, ...state.lastCategories].slice(0,2);
  }

  function showAnswer() {
    state.answerShown=true;
    state.adCount += 1; persistAdState();
    if (state.showFirstHint) { state.showFirstHint=false; localStorage.setItem(LS.firstHint,'done'); }
    playRevealEffects(); render();
  }

  async function nextQuestion() {
    if (state.adCount >= state.adTarget) {
      const proceed = () => {
        state.adCount=0; state.adTarget=randomInt(18,22); persistAdState(); chooseNextQuestion(); render();
      };
      const shown = await nativeAds.showInterstitial(proceed);
      if (!shown) proceed();
    } else { chooseNextQuestion(); render(); }
  }

  function toggleFavorite(id, explicit) {
    const add = explicit === undefined ? !state.favorites.has(id) : explicit;
    if (add) state.favorites.add(id); else state.favorites.delete(id);
    saveFavorites();
    if (state.screen === 'quiz') render();
    showToast(add ? 'お気に入りに追加しました' : 'お気に入りから外しました');
  }

  function openFavorite(id) {
    const q = DB.questions.find(x=>x.id===id); if(!q) return;
    state.quizMode='favorites'; state.current=q; state.answerShown=false; state.screen='quiz'; render();
  }

  function playRevealEffects() {
    audioFX.playAnswer();
    if (state.vibration && navigator.vibrate) navigator.vibrate(28);
  }

  function showToast(text) {
    document.querySelectorAll('.toast').forEach(x=>x.remove());
    const t=document.createElement('div'); t.className='toast'; t.textContent=text; document.body.appendChild(t); setTimeout(()=>t.remove(),1350);
  }

  // Native interstitials are handled by AdMob.

  nativeAds.init();
  render();
})();
