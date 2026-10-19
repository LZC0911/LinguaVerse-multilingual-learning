/* =====================================================================
 * LinguaVerse - 应用主逻辑
 * 状态管理 / 认证 / 路由 / 互动学习 / 进度 / 社区 / 成就
 * ===================================================================== */
(function () {
  'use strict';

  const DATA = window.APP_DATA;
  const STORE_KEY = 'linguaverse_state_v1';
  const USERS_KEY = 'linguaverse_users_v1';

  /* ---------------- 状态管理 ---------------- */
  const State = {
    user: null,          // 当前登录用户名
    view: 'home',
    nav: { lang: 'english', level: 'A1', lessonId: null, moduleIdx: 0 },
    data: {}             // 用户学习数据（按用户名隔离）
  };

  function loadState() {
    try {
      const saved = localStorage.getItem(STORE_KEY);
      if (saved) {
        const obj = JSON.parse(saved);
        State.user = obj.user || null;
        State.view = obj.view || 'home';
        State.nav = Object.assign({ lang: 'english', level: 'A1', lessonId: null, moduleIdx: 0 }, obj.nav);
      }
    } catch (e) { /* ignore */ }
  }
  function saveState() {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      user: State.user, view: State.view, nav: State.nav
    }));
  }

  /* 用户库：{ username: { password, profile:{avatar,targetLang,level}, data:{...} } } */
  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveUsers(u) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }

  /* 当前用户的数据（进度、成就等） */
  function userData() {
    if (!State.user) return null;
    const users = getUsers();
    if (!users[State.user]) return null;
    if (!users[State.user].data) {
      users[State.user].data = freshData();
      saveUsers(users);
    }
    return users[State.user].data;
  }
  function saveUserData(data) {
    const users = getUsers();
    if (users[State.user]) {
      users[State.user].data = data;
      saveUsers(users);
    }
  }
  function freshData() {
    return {
      xp: 0,
      streak: 0,
      lastActiveDate: null,
      completedLessons: [],   // [lessonId,...]
      lessonProgress: {},     // { lessonId: {idx, correct, total } }
      wordsLearned: 0,
      grammarDone: 0,
      listenDone: 0,
      speakCount: 0,
      perfectQuizzes: 0,
      postsCount: 0,
      langsStudied: [],       // ['english',...]
      achievements: [],       // [achievementId,...]
      dailyDone: [],          // 今日挑战完成的 type
      dailyDate: null,
      weekActivity: {},       // { 'YYYY-MM-DD': xp }
      quizHistory: [],
      joinDate: new Date().toISOString().slice(0, 10)
    };
  }

  /* ---------------- 工具函数 ---------------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };

  function toast(msg, type = '') {
    const t = el('div', 'toast ' + type, `<span>${msg}</span>`);
    $('#toast-container').appendChild(t);
    setTimeout(() => {
      t.classList.add('out');
      setTimeout(() => t.remove(), 300);
    }, 2600);
  }

  function modal(html) {
    const root = $('#modal-root');
    root.innerHTML = `
      <div class="modal-backdrop" data-close></div>
      <div class="modal-box">${html}</div>`;
    root.classList.add('show');
    $$('[data-close]', root).forEach(b => b.onclick = () => closeModal());
  }
  function closeModal() {
    const root = $('#modal-root');
    root.classList.remove('show');
    setTimeout(() => root.innerHTML = '', 200);
  }

  function confetti() {
    const root = $('#confetti-root');
    const colors = ['#6366f1', '#22d3ee', '#fbbf24', '#34d399', '#ec4899', '#8b5cf6'];
    for (let i = 0; i < 60; i++) {
      const p = el('div', 'confetti-piece');
      p.style.left = Math.random() * 100 + 'vw';
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = Math.random() * 0.4 + 's';
      p.style.animationDuration = (1.8 + Math.random() * 1.2) + 's';
      p.style.transform = `rotate(${Math.random() * 360}deg)`;
      root.appendChild(p);
      setTimeout(() => p.remove(), 3200);
    }
  }

  /* TTS 语音合成 */
  let voicesCache = [];
  function loadVoices() {
    if ('speechSynthesis' in window) {
      voicesCache = speechSynthesis.getVoices();
    }
  }
  if ('speechSynthesis' in window) {
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  }
  function speak(text, lang) {
    if (!('speechSynthesis' in window)) { toast('当前浏览器不支持语音播放', 'warning'); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const langMap = { english: 'en-US', japanese: 'ja-JP', korean: 'ko-KR' };
    u.lang = langMap[lang] || 'en-US';
    u.rate = 0.85;
    u.pitch = 1;
    const match = voicesCache.find(v => v.lang === u.lang) || voicesCache.find(v => v.lang.startsWith(u.lang.slice(0, 2)));
    if (match) u.voice = match;
    speechSynthesis.speak(u);
  }

  /* 语音识别 */
  let recognition = null;
  function getRecognition() {
    if (recognition) return recognition;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    return recognition;
  }

  /* ---------------- 等级 / XP ---------------- */
  function currentLevel(xp) {
    let cur = DATA.levels[0];
    for (const lv of DATA.levels) if (xp >= lv.xp) cur = lv;
    return cur;
  }
  function nextLevel(xp) {
    for (const lv of DATA.levels) if (xp < lv.xp) return lv;
    return null;
  }
  function levelProgress(xp) {
    const cur = currentLevel(xp);
    const nxt = nextLevel(xp);
    if (!nxt) return { pct: 100, cur, nxt: null, remain: 0 };
    const span = nxt.xp - cur.xp;
    const got = xp - cur.xp;
    return { pct: Math.round(got / span * 100), cur, nxt, remain: nxt.xp - xp };
  }

  /* ---------------- 成就检查 ---------------- */
  function checkAchievements(d) {
    const earned = new Set(d.achievements);
    const newOnes = [];
    const tryAward = (id, cond) => {
      if (cond && !earned.has(id)) {
        earned.add(id);
        const a = DATA.achievements.find(x => x.id === id);
        if (a) { d.xp += a.xp; newOnes.push(a); }
      }
    };
    tryAward('first-word', d.wordsLearned >= 1);
    tryAward('streak-3', d.streak >= 3);
    tryAward('streak-7', d.streak >= 7);
    tryAward('streak-30', d.streak >= 30);
    tryAward('perfect-quiz', d.perfectQuizzes >= 1);
    tryAward('speak-10', d.speakCount >= 10);
    tryAward('level-up', d.completedLessons.length >= 4);
    tryAward('social-5', d.postsCount >= 5);
    tryAward('polyglot', d.langsStudied.length >= 2);
    tryAward('xp-1000', d.xp >= 1000);
    d.achievements = Array.from(earned);
    return newOnes;
  }
  function awardAchievements() {
    const d = userData();
    if (!d) return;
    const news = checkAchievements(d);
    saveUserData(d);
    news.forEach((a, i) => {
      setTimeout(() => {
        toast(`${a.icon} 解锁成就「${a.name}」 +${a.xp} XP`, 'success');
      }, i * 600);
    });
    if (news.length) confetti();
    refreshTopbar();
  }

  /* ---------------- 连续学习 ---------------- */
  function todayStr() { return new Date().toISOString().slice(0, 10); }
  function daysBetween(a, b) {
    const d1 = new Date(a + 'T00:00:00'), d2 = new Date(b + 'T00:00:00');
    return Math.round((d2 - d1) / 86400000);
  }
  function touchStreak() {
    const d = userData(); if (!d) return;
    const today = todayStr();
    if (d.lastActiveDate === today) return;
    if (d.lastActiveDate && daysBetween(d.lastActiveDate, today) === 1) d.streak += 1;
    else if (d.lastActiveDate && daysBetween(d.lastActiveDate, today) > 1) d.streak = 1;
    else if (!d.lastActiveDate) d.streak = 1;
    d.lastActiveDate = today;
    if (!d.weekActivity) d.weekActivity = {};
    d.weekActivity[today] = (d.weekActivity[today] || 0);
    saveUserData(d);
  }
  function addXp(amount) {
    const d = userData(); if (!d) return;
    const before = currentLevel(d.xp).code;
    d.xp += amount;
    const after = currentLevel(d.xp).code;
    const today = todayStr();
    if (!d.weekActivity) d.weekActivity = {};
    d.weekActivity[today] = (d.weekActivity[today] || 0) + amount;
    saveUserData(d);
    if (before !== after) {
      toast(`🎉 升级！你已达到 ${after} 等级`, 'success');
      confetti();
    }
  }

  /* ---------------- 顶栏刷新 ---------------- */
  function refreshTopbar() {
    const d = userData();
    if (!d) return;
    $('#streak-count').textContent = d.streak || 0;
    $('#xp-count').textContent = d.xp;
    $('#xp-level').textContent = 'Lv.' + currentLevel(d.xp).code;
    const profile = getUsers()[State.user].profile;
    $('#user-avatar').textContent = profile.avatar;
    $('#user-name').textContent = State.user;
  }

  /* =================================================================
   * 认证模块
   * ================================================================= */
  const Auth = {
    init() {
      $$('.auth-tab').forEach(t => t.onclick = () => this.switchTab(t.dataset.authTab));
      $('#login-form').onsubmit = e => { e.preventDefault(); this.login(e.target); };
      $('#register-form').onsubmit = e => { e.preventDefault(); this.register(e.target); };
    },
    switchTab(tab) {
      $$('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.authTab === tab));
      $('#login-form').classList.toggle('hidden', tab !== 'login');
      $('#register-form').classList.toggle('hidden', tab !== 'register');
    },
    login(form) {
      const fd = new FormData(form);
      const username = fd.get('username').trim();
      const password = fd.get('password');
      const users = getUsers();
      if (!users[username]) { toast('用户不存在，请先注册', 'error'); return; }
      if (users[username].password !== password) { toast('密码错误', 'error'); return; }
      State.user = username;
      saveState();
      toast(`欢迎回来，${username}！`, 'success');
      enterApp();
    },
    register(form) {
      const fd = new FormData(form);
      const username = fd.get('username').trim();
      const password = fd.get('password');
      const targetLang = fd.get('targetLang');
      const level = fd.get('level');
      const users = getUsers();
      if (users[username]) { toast('用户名已存在，请直接登录', 'error'); return; }
      const avatars = ['🦊', '🐰', '🐯', '🦉', '🐼', '🐨', '🦁', '🐧', '🌸', '⭐'];
      users[username] = {
        password,
        profile: { avatar: avatars[Math.floor(Math.random() * avatars.length)], targetLang, level },
        data: freshData()
      };
      users[username].data.langsStudied = [targetLang];
      saveUsers(users);
      State.user = username;
      saveState();
      toast(`注册成功！开启你的语言之旅 🌍`, 'success');
      enterApp();
    },
    logout() {
      State.user = null;
      saveState();
      $('#app').classList.add('hidden');
      $('#auth-view').classList.remove('hidden');
      $('#login-form').reset();
      $('#register-form').reset();
    }
  };

  /* =================================================================
   * 路由 & 视图分发
   * ================================================================= */
  const Router = {
    go(view) {
      State.view = view;
      saveState();
      $$('.nav-item[data-nav]').forEach(n => n.classList.toggle('active', n.dataset.nav === view));
      $$('.bn-item').forEach(n => n.classList.toggle('active', n.dataset.nav === view));
      closeSidenav();
      this.render();
    },
    render() {
      const map = { home: Views.home, courses: Views.courses, learn: Views.learn,
        progress: Views.progress, path: Views.path, community: Views.community, profile: Views.profile };
      const fn = map[State.view] || Views.home;
      $('#main-view').innerHTML = '';
      fn();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  /* =================================================================
   * 视图集合
   * ================================================================= */
  const Views = {};

  /* ---------- 学习中心 / 首页 ---------- */
  Views.home = function () {
    const d = userData();
    const profile = getUsers()[State.user].profile;
    const lang = DATA.languages[profile.targetLang];
    const lvl = currentLevel(d.xp);
    const lp = levelProgress(d.xp);
    const today = todayStr();
    const dailyReset = d.dailyDate !== today;
    if (dailyReset) { d.dailyDate = today; d.dailyDone = []; saveUserData(d); }

    const main = $('#main-view');
    main.appendChild(el('div', 'view', `
      <div class="hero">
        <div class="hero-content">
          <div class="hero-greet">${greeting()}，${State.user} 👋</div>
          <div class="hero-title">今天也要让世界听见你</div>
          <p class="hero-desc">继续你的 <b>${lang.flag} ${lang.name}</b> 之旅，距离下一等级还需 ${lp.remain} XP。</p>
          <button class="btn btn-soft" id="hero-continue" style="background:rgba(255,255,255,0.2);color:#fff;border-color:rgba(255,255,255,0.3)">
            ▶ 继续学习
          </button>
          <div class="hero-stats">
            <div><div class="hero-stat-num">${d.streak}🔥</div><div class="hero-stat-label">连续天数</div></div>
            <div><div class="hero-stat-num">${d.xp}</div><div class="hero-stat-label">总经验</div></div>
            <div><div class="hero-stat-num">${d.completedLessons.length}</div><div class="hero-stat-label">完成课程</div></div>
            <div><div class="hero-stat-num">${lvl.code}</div><div class="hero-stat-label">当前等级</div></div>
          </div>
        </div>
      </div>

      <div class="quick-row">
        <div class="quick-card" data-jump="courses"><div class="quick-ico">📚</div><div class="quick-title">分级课程</div><div class="quick-desc">系统化分级学习</div></div>
        <div class="quick-card" data-jump="learn"><div class="quick-ico">🎓</div><div class="quick-title">互动练习</div><div class="quick-desc">单词·语法·口语·听力</div></div>
        <div class="quick-card" data-jump="progress"><div class="quick-ico">📊</div><div class="quick-title">进度追踪</div><div class="quick-desc">可视化你的成长</div></div>
        <div class="quick-card" data-jump="community"><div class="quick-ico">💬</div><div class="quick-title">学习社区</div><div class="quick-desc">与伙伴一起进步</div></div>
      </div>

      <div class="grid" style="grid-template-columns:1.4fr 1fr">
        <div class="panel">
          <div class="panel-head"><div class="panel-title">🎯 今日挑战</div><span class="badge">${d.dailyDone.length}/${DATA.dailyChallenges.length}</span></div>
          <div id="daily-list"></div>
        </div>
        <div class="panel">
          <div class="panel-head"><div class="panel-title">🧭 推荐路径</div></div>
          <div id="home-reco"></div>
        </div>
      </div>
    `));

    $('#hero-continue').onclick = () => { State.nav.lang = profile.targetLang; State.nav.level = profile.level; Router.go('learn'); };
    $$('[data-jump]', main).forEach(c => c.onclick = () => Router.go(c.dataset.jump));

    // 今日挑战
    const dl = $('#daily-list');
    DATA.dailyChallenges.forEach(ch => {
      const done = d.dailyDone.includes(ch.type);
      dl.appendChild(el('div', 'challenge-item', `
        <div class="challenge-ico">${typeIcon(ch.type)}</div>
        <div class="challenge-info"><div class="challenge-name">${ch.name}</div><div class="challenge-xp">+${ch.xp} XP</div></div>
        <div class="challenge-check ${done ? 'done' : ''}">${done ? '✓' : ''}</div>`));
    });

    // 推荐路径
    renderRecommendations('#home-reco', 3);
  };

  function greeting() {
    const h = new Date().getHours();
    if (h < 6) return '深夜好'; if (h < 11) return '早上好';
    if (h < 14) return '中午好'; if (h < 18) return '下午好';
    return '晚上好';
  }
  function typeIcon(type) {
    return { vocabulary: '📖', grammar: '✏️', listening: '🎧', speaking: '🎤' }[type] || '📚';
  }

  /* ---------- 分级课程 ---------- */
  Views.courses = function () {
    const d = userData();
    const profile = getUsers()[State.user].profile;
    const main = $('#main-view');
    const lang = State.nav.lang || profile.targetLang;
    State.nav.lang = lang;

    main.appendChild(el('div', 'view', `
      <div class="section-head">
        <div><div class="section-title">📚 分级课程体系</div><div class="section-sub">CEFR 国际标准分级，从入门到精通</div></div>
      </div>
      <div class="lang-grid" id="lang-grid"></div>
      <div class="panel">
        <div class="panel-head">
          <div class="panel-title">${DATA.languages[lang].flag} ${DATA.languages[lang].name} · 选择等级</div>
          <span class="badge primary" id="cur-level-badge">当前 Lv.${currentLevel(d.xp).code}</span>
        </div>
        <div class="level-tabs" id="level-tabs"></div>
        <div id="course-info" style="margin-bottom:18px;color:var(--text-soft);font-size:14px"></div>
        <div class="lesson-list" id="lesson-list"></div>
      </div>
    `));

    const grid = $('#lang-grid');
    Object.values(DATA.languages).forEach(l => {
      const card = el('div', 'lang-card' + (l.key === lang ? ' selected' : ''), `
        <span class="lang-learners">${l.learners} 在学</span>
        <div class="lang-flag">${l.flag}</div>
        <div class="lang-name">${l.name}</div>
        <div class="lang-native">${l.nativeName}</div>
        <div class="lang-tagline">${l.tagline}</div>`);
      card.style.background = `linear-gradient(135deg, ${l.color}, ${shade(l.color, -30)})`;
      card.onclick = () => { State.nav.lang = l.key; if (!d.langsStudied.includes(l.key)) { d.langsStudied.push(l.key); saveUserData(d); awardAchievements(); } Views.courses(); };
      grid.appendChild(card);
    });

    // 等级 tabs
    const levels = Object.keys(DATA.courses[lang] || {});
    const available = DATA.levels.filter(lv => levels.includes(lv.code));
    const tabs = $('#level-tabs');
    available.forEach(lv => {
      const t = el('button', 'level-tab' + (lv.code === State.nav.level ? ' active' : ''), `${lv.code} · ${lv.name}`);
      t.onclick = () => { State.nav.level = lv.code; Views.courses(); };
      tabs.appendChild(t);
    });

    const course = (DATA.courses[lang] || {})[State.nav.level];
    if (!course) {
      $('#lesson-list').appendChild(el('div', '', '<p style="color:var(--text-muted);padding:20px">该等级课程即将上线，敬请期待 ✨</p>'));
      return;
    }
    $('#course-info').innerHTML = `<b>${course.title}</b><br/>学习目标：${course.goal}`;

    const list = $('#lesson-list');
    course.lessons.forEach((ls, i) => {
      const done = d.completedLessons.includes(ls.id);
      const prevDone = i === 0 || d.completedLessons.includes(course.lessons[i - 1].id);
      const state = done ? 'done' : (prevDone ? 'open' : 'locked');
      const stateText = done ? '已完成 ✓' : (prevDone ? '开始学习' : '🔒 未解锁');
      const item = el('div', 'lesson-item', `
        <div class="lesson-num">${i + 1}</div>
        <div class="lesson-info">
          <div class="lesson-title">${ls.title}</div>
          <div class="lesson-meta"><span>${typeIcon(ls.type)} ${typeLabel(ls.type)}</span><span>· ${(ls.words || ls.exercises || ls.audio || ls.sentences || []).length} 项内容</span></div>
        </div>
        <div class="lesson-state ${state}">${stateText}</div>`);
      if (prevDone) item.onclick = () => { State.nav.lessonId = ls.id; Router.go('learn'); };
      else item.style.opacity = '0.55';
      list.appendChild(item);
    });
  };

  function typeLabel(t) { return { vocabulary: '词汇', grammar: '语法', listening: '听力', speaking: '口语' }[t] || '课程'; }
  function shade(hex, percent) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) + percent, g = ((n >> 8) & 255) + percent, b = (n & 255) + percent;
    r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /* ---------- 互动学习 ---------- */
  Views.learn = function () {
    const d = userData();
    const profile = getUsers()[State.user].profile;
    const lang = State.nav.lang || profile.targetLang;
    State.nav.lang = lang;
    const main = $('#main-view');

    // 若已选具体课程，进入学习界面
    if (State.nav.lessonId) {
      return Views.learnModule();
    }

    // 否则展示学习模块选择
    main.appendChild(el('div', 'view', `
      <div class="section-head">
        <div><div class="section-title">🎓 互动式学习</div><div class="section-sub">四种沉浸式练习，全方位提升语言能力</div></div>
      </div>
      <div class="grid grid-2">
        <div class="card card-hover learn-mod" data-mod="vocabulary">
          <div class="quick-ico" style="font-size:34px">📖</div>
          <div style="font-size:18px;font-weight:700;margin-top:10px">单词记忆</div>
          <div style="color:var(--text-muted);font-size:13px;margin-top:6px">翻转卡片，听音记词，强化词汇量</div>
        </div>
        <div class="card card-hover learn-mod" data-mod="grammar">
          <div class="quick-ico" style="font-size:34px">✏️</div>
          <div style="font-size:18px;font-weight:700;margin-top:10px">语法练习</div>
          <div style="color:var(--text-muted);font-size:13px;margin-top:6px">即时反馈，吃透语法规则</div>
        </div>
        <div class="card card-hover learn-mod" data-mod="listening">
          <div class="quick-ico" style="font-size:34px">🎧</div>
          <div style="font-size:18px;font-weight:700;margin-top:10px">听力训练</div>
          <div style="color:var(--text-muted);font-size:13px;margin-top:6px">真人发音，逐句精听</div>
        </div>
        <div class="card card-hover learn-mod" data-mod="speaking">
          <div class="quick-ico" style="font-size:34px">🎤</div>
          <div style="font-size:18px;font-weight:700;margin-top:10px">口语跟读</div>
          <div style="color:var(--text-muted);font-size:13px;margin-top:6px">语音识别，开口即练</div>
        </div>
      </div>
      <div class="panel" style="margin-top:24px">
        <div class="panel-head"><div class="panel-title">📋 从课程进入</div></div>
        <p style="color:var(--text-muted);font-size:14px;margin-bottom:12px">前往「分级课程」选择具体课程，可获得结构化练习。或直接从下方快捷开始：</p>
        <button class="btn btn-primary" id="quick-start">▶ 快速开始一节练习</button>
      </div>
    `));

    $$('.learn-mod', main).forEach(c => c.onclick = () => startQuickModule(c.dataset.mod));
    $('#quick-start').onclick = () => startQuickModule('vocabulary');
  };

  function startQuickModule(modType) {
    // 找到第一个匹配类型且未完成/可学的课程
    const lang = State.nav.lang;
    const levels = Object.keys(DATA.courses[lang] || {});
    for (const lv of levels) {
      const lessons = DATA.courses[lang][lv].lessons;
      for (const ls of lessons) {
        if (ls.type === modType) { State.nav.lessonId = ls.id; Router.render(); return; }
      }
    }
    toast('暂无可用的该类型课程', 'warning');
  }

  /* 找到当前 lessonId 对应课程对象 */
  function findLesson() {
    const lang = State.nav.lang;
    const levels = DATA.courses[lang] || {};
    for (const lv in levels) {
      const ls = levels[lv].lessons.find(l => l.id === State.nav.lessonId);
      if (ls) return { lesson: ls, level: lv };
    }
    return null;
  }

  Views.learnModule = function () {
    const found = findLesson();
    if (!found) { toast('课程未找到', 'error'); Router.go('learn'); return; }
    const { lesson, level } = found;
    const main = $('#main-view');
    const d = userData();
    const progress = d.lessonProgress[lesson.id] || { idx: 0 };
    const idx = Math.min(progress.idx || 0, contentCount(lesson) - 1);
    State.nav.moduleIdx = idx;

    main.appendChild(el('div', 'view', `
      <div class="learn-shell">
        <div class="learn-header">
          <button class="learn-back" id="learn-back">← 返回</button>
          <div class="learn-progress">
            <div class="progress-bar"><div class="progress-fill" id="module-progress" style="width:0%"></div></div>
          </div>
          <div class="learn-hearts">🔥 <span id="hearts">${d.streak}</span></div>
        </div>
        <div id="module-body"></div>
      </div>`));

    $('#learn-back').onclick = () => { State.nav.lessonId = null; Router.go('learn'); };
    renderModuleStep(lesson, idx);
  };

  function contentCount(lesson) {
    if (lesson.type === 'vocabulary') return lesson.words.length;
    if (lesson.type === 'grammar') return lesson.exercises.length;
    if (lesson.type === 'listening') return lesson.questions.length;
    if (lesson.type === 'speaking') return lesson.sentences.length;
    return 0;
  }

  function renderModuleStep(lesson, idx) {
    const total = contentCount(lesson);
    const pct = Math.round((idx / total) * 100);
    $('#module-progress').style.width = pct + '%';
    const body = $('#module-body');
    body.innerHTML = '';

    if (lesson.type === 'vocabulary') renderFlashcard(body, lesson, idx);
    else if (lesson.type === 'grammar') renderGrammar(body, lesson, idx);
    else if (lesson.type === 'listening') renderListening(body, lesson, idx);
    else if (lesson.type === 'speaking') renderSpeaking(body, lesson, idx);
  }

  /* 单词卡片 */
  function renderFlashcard(body, lesson, idx) {
    const w = lesson.words[idx];
    const card = el('div', 'flashcard', `
      <div class="flashcard-inner">
        <div class="flashcard-face flashcard-front">
          <div class="flashcard-word">${w.word}</div>
          <div class="flashcard-phonetic">${w.phonetic || ''}</div>
          <div class="flashcard-hint">点击翻面查看释义 · 🔊 点击发音</div>
        </div>
        <div class="flashcard-face flashcard-back">
          <div class="flashcard-trans">${w.trans}</div>
          <div class="flashcard-example">${w.example || ''}</div>
          <div class="flashcard-hint">点击翻回</div>
        </div>
      </div>`);
    let flipped = false;
    card.onclick = () => { flipped = !flipped; card.classList.toggle('flipped', flipped); };
    body.appendChild(card);

    const controls = el('div', '', `
      <div style="text-align:center;margin-bottom:20px">
        <button class="btn btn-ghost" id="speak-word">🔊 听发音</button>
      </div>
      <div style="display:flex;gap:12px;justify-content:center">
        <button class="btn btn-ghost" id="prev-word">← 上一词</button>
        <button class="btn btn-primary" id="next-word">${idx === lesson.words.length - 1 ? '完成 ✅' : '下一个 →'}</button>
      </div>`);
    body.appendChild(controls);

    $('#speak-word').onclick = (e) => { e.stopPropagation(); speak(w.word, State.nav.lang); };
    $('#prev-word').onclick = () => { if (idx > 0) { updateProgress(lesson.id, idx - 1); renderModuleStep(lesson, idx - 1); } };
    $('#next-word').onclick = () => {
      const d = userData();
      if (!d.wordsLearned) d.wordsLearned = 0;
      d.wordsLearned += 1;
      if (idx === lesson.words.length - 1) {
        completeLesson(lesson, () => { markDaily('vocabulary'); });
      } else {
        saveUserData(d);
        updateProgress(lesson.id, idx + 1);
        renderModuleStep(lesson, idx + 1);
      }
    };
  }

  /* 语法练习 */
  function renderGrammar(body, lesson, idx) {
    // 第一题前展示语法点说明
    if (idx === 0 && lesson.grammar) {
      const g = lesson.grammar;
      const intro = el('div', 'card', `
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">📖 语法点</div>
        <div style="font-size:20px;font-weight:800;margin-bottom:10px">${g.point}</div>
        <div style="color:var(--text-soft);margin-bottom:14px">${g.rule}</div>
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:6px">例句：</div>
        ${g.examples.map(e => `<div style="padding:6px 0;font-size:14px">• ${e}</div>`).join('')}`);
      intro.style.cssText = 'background:var(--grad-card);margin-bottom:20px';
      body.appendChild(intro);
    }
    const block = el('div', 'quiz-block', renderGrammarQuestion(lesson, idx));
    body.appendChild(block);
    bindGrammarQuestion(lesson, idx);
  }

  function renderGrammarQuestion(lesson, idx) {
    const ex = lesson.exercises[idx];
    return `
      <div style="text-align:center;color:var(--text-muted);font-size:13px;margin-bottom:8px">第 ${idx + 1} / ${lesson.exercises.length} 题</div>
      <div class="quiz-question">${ex.q}</div>
      <div class="quiz-options">
        ${ex.options.map((o, i) => `<button class="quiz-option" data-opt="${i}">${o}</button>`).join('')}
      </div>
      <div class="quiz-feedback" id="quiz-feedback"></div>`;
  }

  function bindGrammarQuestion(lesson, idx) {
    const ex = lesson.exercises[idx];
    let answered = false;
    $$('.quiz-option').forEach(btn => {
      btn.onclick = () => {
        if (answered) return;
        answered = true;
        const choice = +btn.dataset.opt;
        const correct = choice === ex.answer;
        $$('.quiz-option').forEach((b, i) => {
          b.disabled = true;
          if (i === ex.answer) b.classList.add('correct');
          else if (i === choice) b.classList.add('wrong');
        });
        const fb = $('#quiz-feedback');
        fb.classList.add('show', correct ? 'correct' : 'wrong');
        fb.innerHTML = `${correct ? '✓ 正确' : '✗ 再接再厉'} — ${ex.explain}`;

        const d = userData();
        if (!d.grammarDone) d.grammarDone = 0;
        if (correct) d.grammarDone += 1;
        d.quizHistory = d.quizHistory || [];
        d.quizHistory.push({ lesson: lesson.id, correct, time: Date.now() });
        saveUserData(d);

        setTimeout(() => {
          if (idx === lesson.exercises.length - 1) {
            const allCorrect = d.quizHistory.filter(q => q.lesson === lesson.id).slice(-lesson.exercises.length).every(q => q.correct);
            if (allCorrect) { d.perfectQuizzes = (d.perfectQuizzes || 0) + 1; saveUserData(d); }
            completeLesson(lesson, () => markDaily('grammar'));
          } else {
            updateProgress(lesson.id, idx + 1);
            renderModuleStep(lesson, idx + 1);
          }
        }, 1400);
      };
    });
  }

  /* 听力训练 */
  function renderListening(body, lesson, idx) {
    const q = lesson.questions[idx];
    // 在每题前先播放对应音频片段
    const audioIdx = Math.min(idx, lesson.audio.length - 1);
    body.appendChild(el('div', 'listen-box', `
      <div style="color:var(--text-muted);font-size:13px;margin-bottom:14px">第 ${idx + 1} / ${lesson.questions.length} 题</div>
      <button class="play-audio" id="play-audio">🔊</button>
      <div style="color:var(--text-muted);font-size:13px;margin-bottom:16px">点击播放，可重复收听</div>
      <div class="listen-trans-toggle" id="show-trans">📌 显示原文</div>
      <div id="trans-box" class="hidden" style="padding:14px;background:var(--bg-soft);border-radius:var(--radius-sm);margin-bottom:18px;font-size:14px"></div>
      <div class="quiz-question">${q.q}</div>
      <div class="quiz-options">
        ${q.options.map((o, i) => `<button class="quiz-option" data-opt="${i}">${o}</button>`).join('')}
      </div>
      <div class="quiz-feedback" id="quiz-feedback"></div>`));

    const playBtn = $('#play-audio');
    playBtn.onclick = () => {
      playBtn.classList.add('playing');
      speak(lesson.audio[audioIdx].text, State.nav.lang);
      setTimeout(() => playBtn.classList.remove('playing'), 2500);
    };
    $('#show-trans').onclick = () => {
      const box = $('#trans-box');
      box.classList.toggle('hidden');
      if (!box.classList.contains('hidden')) {
        box.innerHTML = `<b>${lesson.audio[audioIdx].text}</b><br/><span style="color:var(--text-muted)">${lesson.audio[audioIdx].trans}</span>`;
      }
    };
    // 自动播放一次
    setTimeout(() => playBtn.click(), 300);

    let answered = false;
    $$('.quiz-option').forEach(btn => {
      btn.onclick = () => {
        if (answered) return;
        answered = true;
        const choice = +btn.dataset.opt;
        const correct = choice === q.answer;
        $$('.quiz-option').forEach((b, i) => {
          b.disabled = true;
          if (i === q.answer) b.classList.add('correct');
          else if (i === choice) b.classList.add('wrong');
        });
        const fb = $('#quiz-feedback');
        fb.classList.add('show', correct ? 'correct' : 'wrong');
        fb.innerHTML = correct ? '✓ 回答正确' : '✗ 正确答案见高亮项';

        const d = userData();
        if (correct) d.listenDone = (d.listenDone || 0) + 1;
        saveUserData(d);

        setTimeout(() => {
          if (idx === lesson.questions.length - 1) completeLesson(lesson, () => markDaily('listening'));
          else { updateProgress(lesson.id, idx + 1); renderModuleStep(lesson, idx + 1); }
        }, 1400);
      };
    });
  }

  /* 口语跟读 */
  function renderSpeaking(body, lesson, idx) {
    const s = lesson.sentences[idx];
    body.appendChild(el('div', 'speak-box', `
      <div style="color:var(--text-muted);font-size:13px;margin-bottom:10px">第 ${idx + 1} / ${lesson.sentences.length} 句</div>
      <button class="play-audio" id="play-sentence">🔊</button>
      <div class="speak-sentence">${s.en}</div>
      <div class="speak-trans">${s.zh}</div>
      <div class="speak-controls">
        <button class="speak-btn" id="replay-btn" title="重播">🔁</button>
        <button class="speak-btn mic" id="mic-btn" title="跟读">🎤</button>
      </div>
      <div class="speak-result" id="speak-result"></div>
      <div style="margin-top:24px;display:flex;gap:12px;justify-content:center">
        <button class="btn btn-ghost" id="prev-speak">← 上一句</button>
        <button class="btn btn-primary" id="next-speak">${idx === lesson.sentences.length - 1 ? '完成 ✅' : '下一句 →'}</button>
      </div>`));

    const play = () => speak(s.en, State.nav.lang);
    $('#play-sentence').onclick = play;
    $('#replay-btn').onclick = play;

    const mic = $('#mic-btn');
    const rec = getRecognition();
    if (!rec) {
      mic.onclick = () => { toast('当前浏览器不支持语音识别，请用 Chrome', 'warning'); };
    } else {
      const langMap = { english: 'en-US', japanese: 'ja-JP', korean: 'ko-KR' };
      rec.lang = langMap[State.nav.lang] || 'en-US';
      let listening = false;
      mic.onclick = () => {
        if (listening) { rec.stop(); return; }
        try {
          rec.onresult = (e) => {
            const heard = e.results[0][0].transcript.trim();
            const target = s.en.replace(/[.,!?。、！？]/g, '').toLowerCase();
            const heardClean = heard.replace(/[.,!?。、！？]/g, '').toLowerCase();
            const sim = similarity(heardClean, target);
            const res = $('#speak-result');
            res.className = 'speak-result ' + (sim > 0.6 ? 'match' : 'mismatch');
            res.innerHTML = sim > 0.6
              ? `✓ 太棒了！相似度 ${Math.round(sim * 100)}%`
              : `再试一次，相似度 ${Math.round(sim * 100)}%<br/>你说：${heard}`;
            if (sim > 0.6) {
              const d = userData();
              d.speakCount = (d.speakCount || 0) + 1;
              saveUserData(d);
            }
          };
          rec.onerror = () => { toast('语音识别出错，请重试', 'error'); };
          rec.onend = () => { listening = false; mic.classList.remove('listening'); };
          rec.start();
          listening = true;
          mic.classList.add('listening');
        } catch (e) { toast('请允许麦克风权限', 'warning'); }
      };
    }

    $('#prev-speak').onclick = () => { if (idx > 0) { updateProgress(lesson.id, idx - 1); renderModuleStep(lesson, idx - 1); } };
    $('#next-speak').onclick = () => {
      if (idx === lesson.sentences.length - 1) completeLesson(lesson, () => markDaily('speaking'));
      else { updateProgress(lesson.id, idx + 1); renderModuleStep(lesson, idx + 1); }
    };
  }

  function similarity(a, b) {
    if (!a || !b) return 0;
    if (a === b) return 1;
    const setA = new Set(a.split(''));
    let common = 0;
    for (const ch of setA) if (b.includes(ch)) common++;
    return common / Math.max(setA.size, new Set(b.split('')).size);
  }

  function updateProgress(lessonId, idx) {
    const d = userData();
    d.lessonProgress = d.lessonProgress || {};
    d.lessonProgress[lessonId] = Object.assign(d.lessonProgress[lessonId] || {}, { idx });
    saveUserData(d);
  }

  function completeLesson(lesson, cb) {
    const d = userData();
    if (!d.completedLessons.includes(lesson.id)) {
      d.completedLessons.push(lesson.id);
      addXp(60);
      touchStreak();
    }
    saveUserData(d);
    showComplete(lesson, cb);
  }

  function showComplete(lesson, cb) {
    const d = userData();
    const body = $('#module-body');
    body.innerHTML = `
      <div class="complete-screen">
        <div class="complete-emoji">🎉</div>
        <div class="complete-title">课程完成！</div>
        <div class="complete-xp">+60 XP</div>
        <div class="complete-stats">
          <div><div class="complete-stat-num">${d.xp}</div><div class="complete-stat-label">总经验</div></div>
          <div><div class="complete-stat-num">${d.streak}🔥</div><div class="complete-stat-label">连续天数</div></div>
          <div><div class="complete-stat-num">${d.completedLessons.length}</div><div class="complete-stat-label">已完成课</div></div>
        </div>
        <div style="display:flex;gap:12px;justify-content:center">
          <button class="btn btn-ghost" id="back-to-lessons">返回课程列表</button>
          <button class="btn btn-primary" id="next-lesson">继续下一课 →</button>
        </div>
      </div>`;
    confetti();
    markDaily(lesson.type);
    if (cb) cb();
    awardAchievements();
    refreshTopbar();
    $('#back-to-lessons').onclick = () => { State.nav.lessonId = null; Router.go('courses'); };
    $('#next-lesson').onclick = () => { State.nav.lessonId = null; Router.go('courses'); };
  }

  function markDaily(type) {
    const d = userData();
    if (!d.dailyDone.includes(type)) {
      d.dailyDone.push(type);
      addXp(20);
    }
    saveUserData(d);
    awardAchievements();
  }

  /* ---------- 进度追踪 ---------- */
  Views.progress = function () {
    const d = userData();
    const lp = levelProgress(d.xp);
    const main = $('#main-view');
    main.appendChild(el('div', 'view', `
      <div class="section-head">
        <div><div class="section-title">📊 学习进度追踪</div><div class="section-sub">每一份坚持，都在这里被看见</div></div>
      </div>
      <div class="stat-grid">
        <div class="stat-card"><div class="stat-ico">🔥</div><div class="stat-val">${d.streak}</div><div class="stat-lbl">连续学习天数</div><div class="stat-trend">坚持就是胜利</div></div>
        <div class="stat-card"><div class="stat-ico">⭐</div><div class="stat-val">${d.xp}</div><div class="stat-lbl">累计经验值</div><div class="stat-trend">距下一级 ${lp.remain}</div></div>
        <div class="stat-card"><div class="stat-ico">📚</div><div class="stat-val">${d.completedLessons.length}</div><div class="stat-lbl">完成课程数</div><div class="stat-trend">稳步前进</div></div>
        <div class="stat-card"><div class="stat-ico">🏆</div><div class="stat-val">${d.achievements.length}</div><div class="stat-lbl">解锁成就</div><div class="stat-trend">/${DATA.achievements.length} 枚</div></div>
      </div>
      <div class="grid grid-2">
        <div class="chart-card">
          <div class="panel-head"><div class="panel-title">📈 近 7 天学习活跃度</div></div>
          <div class="bar-chart" id="week-chart"></div>
        </div>
        <div class="chart-card" style="text-align:center">
          <div class="panel-head"><div class="panel-title">🎯 当前等级</div></div>
          <div class="ring-progress">
            <svg width="140" height="140">
              <circle class="ring-bg" cx="70" cy="70" r="58"></circle>
              <circle class="ring-fg" id="level-ring" cx="70" cy="70" r="58" stroke-dasharray="364" stroke-dashoffset="364"></circle>
            </svg>
            <div class="ring-text"><div class="ring-num">${currentLevel(d.xp).code}</div><div class="ring-lbl">${lp.pct}% → ${lp.nxt ? lp.nxt.code : 'MAX'}</div></div>
          </div>
          <div style="margin-top:14px;color:var(--text-muted);font-size:13px">${currentLevel(d.xp).name} · ${currentLevel(d.xp).desc}</div>
        </div>
      </div>
      <div class="chart-card" style="margin-top:16px">
        <div class="panel-head"><div class="panel-title">🔥 连续学习日历</div><span class="badge">${d.streak} 天连击</span></div>
        <div class="streak-grid" id="streak-grid"></div>
      </div>
      <div class="chart-card" style="margin-top:16px">
        <div class="panel-head"><div class="panel-title">📚 各语言学习概览</div></div>
        <div id="lang-overview"></div>
      </div>
    `));

    // 周活跃度
    const wc = $('#week-chart');
    const today = new Date();
    let max = 1;
    const weekData = [];
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(today); dt.setDate(today.getDate() - i);
      const key = dt.toISOString().slice(0, 10);
      const xp = (d.weekActivity && d.weekActivity[key]) || 0;
      weekData.push({ xp, label: ['日', '一', '二', '三', '四', '五', '六'][dt.getDay()] });
      if (xp > max) max = xp;
    }
    weekData.forEach(w => {
      const h = Math.max(6, (w.xp / max) * 140);
      wc.appendChild(el('div', 'bar-col', `<div class="bar-fill" data-val="${w.xp} XP" style="height:${h}px"></div><div class="bar-label">${w.label}</div>`));
    });

    // 等级环
    setTimeout(() => {
      const circ = 2 * Math.PI * 58;
      $('#level-ring').setAttribute('stroke-dashoffset', circ - (lp.pct / 100) * circ);
    }, 200);

    // 日历
    const sg = $('#streak-grid');
    for (let i = 13; i >= 0; i--) {
      const dt = new Date(today); dt.setDate(today.getDate() - i);
      const key = dt.toISOString().slice(0, 10);
      const active = d.weekActivity && d.weekActivity[key];
      const c = el('div', 'streak-cell ' + (active ? 'active' : (i === 0 ? '' : 'future')), active ? '✓' : dt.getDate());
      sg.appendChild(c);
    }

    // 语言概览
    const lo = $('#lang-overview');
    if (!d.langsStudied || !d.langsStudied.length) {
      lo.innerHTML = '<p style="color:var(--text-muted)">还没有开始学习任何语言，快去课程页开启吧~</p>';
    } else {
      d.langsStudied.forEach(k => {
        const lang = DATA.languages[k];
        const lessons = DATA.courses[k] || {};
        let total = 0, done = 0;
        Object.values(lessons).forEach(c => { c.lessons.forEach(l => { total++; if (d.completedLessons.includes(l.id)) done++; }); });
        const pct = total ? Math.round(done / total * 100) : 0;
        lo.appendChild(el('div', '', `
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
            <span style="font-size:28px">${lang.flag}</span>
            <div style="flex:1">
              <div style="display:flex;justify-content:space-between;margin-bottom:6px"><b>${lang.name}</b><span style="color:var(--text-muted);font-size:13px">${done}/${total} 课 · ${pct}%</span></div>
              <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
            </div>
          </div>`));
      });
    }
  };

  /* ---------- 个性化学习路径 ---------- */
  Views.path = function () {
    const d = userData();
    const profile = getUsers()[State.user].profile;
    const main = $('#main-view');
    const lp = levelProgress(d.xp);

    main.appendChild(el('div', 'view', `
      <div class="section-head">
        <div><div class="section-title">🧭 个性化学习路径</div><div class="section-sub">根据你的进度与目标，智能规划下一步</div></div>
      </div>
      <div class="reco-card" style="margin-bottom:24px">
        <div class="reco-title">✨ 为你推荐</div>
        <div style="color:var(--text-soft);font-size:14px;margin-top:6px">
          你正在学习 <b>${DATA.languages[profile.targetLang].flag} ${DATA.languages[profile.targetLang].name}</b>，
          当前等级 <b>${currentLevel(d.xp).code}</b>，已完成 ${d.completedLessons.length} 节课。
          ${lp.nxt ? `距离 <b>${lp.nxt.code}</b> 还需 <b>${lp.remain}</b> XP。` : '你已达到最高等级，真厉害！'}
        </div>
        <div class="reco-list" id="reco-list"></div>
      </div>
      <div class="panel">
        <div class="panel-head"><div class="panel-title">🗺️ 学习里程碑</div></div>
        <div class="path-track" id="path-track"></div>
      </div>
    `));

    renderRecommendations('#reco-list', 4);
    renderMilestones();
  };

  function renderRecommendations(selector, limit) {
    const d = userData();
    const profile = getUsers()[State.user].profile;
    const lang = profile.targetLang;
    const container = $(selector);
    if (!container) return;
    container.innerHTML = '';

    const recos = [];
    const courses = DATA.courses[lang] || {};
    // 找下一节未完成课
    let foundNext = false;
    for (const lv in courses) {
      for (const ls of courses[lv].lessons) {
        if (!d.completedLessons.includes(ls.id)) {
          recos.push({
            ico: typeIcon(ls.type),
            name: ls.title,
            reason: `基于你正在学的${DATA.languages[lang].name} · ${typeLabel(ls.type)}模块`,
            lessonId: ls.id, level: lv
          });
          foundNext = true;
          break;
        }
      }
      if (foundNext) break;
    }
    // 每日挑战
    DATA.dailyChallenges.filter(c => !d.dailyDone.includes(c.type)).slice(0, 2).forEach(c => {
      recos.push({ ico: typeIcon(c.type), name: c.name, reason: `每日挑战 · +${c.xp} XP`, challenge: c.type });
    });
    // 弱项补强
    if (d.speakCount < 5) recos.push({ ico: '🎤', name: '多开口练习', reason: '你的口语练习偏少，建议加强' });
    if (d.achievements.length < 3) recos.push({ ico: '🏆', name: '解锁更多成就', reason: `还有 ${DATA.achievements.length - d.achievements.length} 枚徽章等你` });

    recos.slice(0, limit).forEach(r => {
      const item = el('div', 'reco-item', `<div class="reco-ico">${r.ico}</div><div class="reco-text"><div class="reco-name">${r.name}</div><div class="reco-reason">${r.reason}</div></div><div style="color:var(--text-muted)">→</div>`);
      item.onclick = () => {
        if (r.lessonId) { State.nav.lessonId = r.lessonId; State.nav.level = r.level; Router.go('learn'); }
        else if (r.challenge) startQuickModule(r.challenge);
        else Router.go('profile');
      };
      container.appendChild(item);
    });
    if (!recos.length) container.innerHTML = '<p style="color:var(--text-muted);font-size:14px">今日推荐已完成，明天再来~</p>';
  }

  function renderMilestones() {
    const d = userData();
    const profile = getUsers()[State.user].profile;
    const lang = profile.targetLang;
    const courses = DATA.courses[lang] || {};
    const track = $('#path-track');
    const milestones = [
      { ico: '🌱', title: '注册开启学习', desc: '欢迎加入 LinguaVerse', done: true },
      { ico: '📖', title: '完成首节词汇课', desc: '迈出第一步', done: d.wordsLearned >= 1 },
      { ico: '🔥', title: '连续学习 3 天', desc: '养成习惯', done: d.streak >= 3 },
      { ico: '📈', title: '突破 500 XP', desc: '抵达 A2 等级', done: d.xp >= 500 },
      { ico: '🎯', title: '完成 5 节课程', desc: '小有所成', done: d.completedLessons.length >= 5 },
      { ico: '⭐', title: '累计 1000 XP', desc: '迈向 B1', done: d.xp >= 1000 },
      { ico: '🌍', title: '学习第二种语言', desc: '成为多语通才', done: d.langsStudied.length >= 2 },
      { ico: '🏆', title: '连续学习 30 天', desc: '月度王者', done: d.streak >= 30 }
    ];
    let currentFound = false;
    milestones.forEach((m, i) => {
      const cls = m.done ? 'done' : (!currentFound ? 'current' : 'locked');
      if (!m.done && !currentFound) currentFound = true;
      track.appendChild(el('div', 'path-node ' + cls, `
        <div class="path-dot">${m.done ? '✓' : m.ico}</div>
        <div class="path-body"><div class="path-title">${m.title}</div><div class="path-desc">${m.desc}</div></div>`));
    });
  }

  /* ---------- 社区 ---------- */
  Views.community = function () {
    const d = userData();
    const main = $('#main-view');
    main.appendChild(el('div', 'view', `
      <div class="section-head">
        <div><div class="section-title">💬 学习社区</div><div class="section-sub">与全球语言学习者一起交流进步</div></div>
      </div>
      <div class="grid" style="grid-template-columns:1.6fr 1fr">
        <div>
          <div class="composer">
            <textarea id="post-input" placeholder="分享你的学习心得、提问或有趣发现..."></textarea>
            <div class="composer-row">
              <div class="composer-tags" id="post-tags">
                ${Object.values(DATA.languages).map(l => `<span class="tag-chip" data-lang="${l.key}">${l.flag} ${l.name}</span>`).join('')}
              </div>
              <button class="btn btn-primary" id="post-btn">发布</button>
            </div>
          </div>
          <div id="post-list"></div>
        </div>
        <div>
          <div class="lb-card">
            <div class="panel-head"><div class="panel-title">🏆 本周排行榜</div></div>
            <div id="leaderboard"></div>
          </div>
        </div>
      </div>
    `));

    let selectedTag = DATA.languages[Object.keys(DATA.languages)[0]].key;
    $$('.tag-chip', main).forEach(c => {
      c.onclick = () => {
        $$('.tag-chip', main).forEach(x => x.classList.remove('active'));
        c.classList.add('active');
        selectedTag = c.dataset.lang;
      };
    });
    $$('.tag-chip', main)[0].classList.add('active');

    $('#post-btn').onclick = () => {
      const text = $('#post-input').value.trim();
      if (!text) { toast('请输入内容', 'warning'); return; }
      const users = getUsers();
      const profile = users[State.user].profile;
      const post = {
        id: 'u' + Date.now(),
        author: State.user, avatar: profile.avatar, lang: selectedTag,
        time: '刚刚', title: text.slice(0, 20) + (text.length > 20 ? '...' : ''),
        content: text, likes: 0, comments: 0
      };
      const posts = getPosts();
      posts.unshift(post);
      savePosts(posts);
      $('#post-input').value = '';
      d.postsCount = (d.postsCount || 0) + 1;
      saveUserData(d);
      toast('发布成功！+10 XP', 'success');
      addXp(10);
      awardAchievements();
      renderPosts();
    };

    renderPosts();
    renderLeaderboard();
  };

  function getPosts() {
    try { return JSON.parse(localStorage.getItem('linguaverse_posts_v1')) || DATA.community.posts.slice(); }
    catch (e) { return DATA.community.posts.slice(); }
  }
  function savePosts(p) { localStorage.setItem('linguaverse_posts_v1', JSON.stringify(p)); }

  function renderPosts() {
    const list = $('#post-list');
    if (!list) return;
    list.innerHTML = '';
    const posts = getPosts();
    posts.forEach(p => {
      const lang = DATA.languages[p.lang] || { flag: '🌐', name: '通用' };
      const card = el('div', 'post-card', `
        <div class="post-head">
          <div class="post-avatar">${p.avatar}</div>
          <div style="flex:1"><div class="post-author">${p.author}</div><div class="post-meta">${p.time} · ${lang.flag} ${lang.name}</div></div>
        </div>
        <div class="post-title">${p.title}</div>
        <div class="post-content">${p.content}</div>
        <div class="post-actions">
          <span class="post-action" data-act="like" data-id="${p.id}">❤️ ${p.likes}</span>
          <span class="post-action" data-act="comment" data-id="${p.id}">💬 ${p.comments}</span>
          <span class="post-action" data-act="share" data-id="${p.id}">🔗 分享</span>
        </div>`);
      list.appendChild(card);
    });
    $$('.post-action[data-act="like"]', list).forEach(b => b.onclick = () => {
      const posts = getPosts();
      const p = posts.find(x => x.id === b.dataset.id);
      if (p) { p.likes += 1; savePosts(posts); b.classList.add('liked'); b.innerHTML = `❤️ ${p.likes}`; }
    });
    $$('.post-action[data-act="comment"]', list).forEach(b => b.onclick = () => toast('评论功能开发中...', 'warning'));
    $$('.post-action[data-act="share"]', list).forEach(b => b.onclick = () => toast('链接已复制到剪贴板（演示）', 'success'));
  }

  function renderLeaderboard() {
    const lb = $('#leaderboard');
    if (!lb) return;
    const d = userData();
    let board = DATA.community.leaderboard.slice();
    board.push({ rank: 0, name: State.user + '(我)', avatar: getUsers()[State.user].profile.avatar, xp: d.xp, streak: d.streak, langs: d.langsStudied.length, me: true });
    board.sort((a, b) => b.xp - a.xp);
    board.forEach((u, i) => {
      u.rank = i + 1;
      const rankCls = i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : '';
      lb.appendChild(el('div', 'lb-row' + (u.me ? ' me' : ''), `
        <div class="lb-rank ${rankCls}">${i < 3 ? ['🥇', '🥈', '🥉'][i] : u.rank}</div>
        <div class="lb-avatar">${u.avatar}</div>
        <div class="lb-name">${u.name}</div>
        <div style="text-align:right"><div class="lb-xp">${u.xp} XP</div><div style="font-size:11px;color:var(--text-muted)">🔥${u.streak}</div></div>`));
    });
  }

  /* ---------- 我的 / 成就 ---------- */
  Views.profile = function () {
    const d = userData();
    const profile = getUsers()[State.user].profile;
    const main = $('#main-view');
    main.appendChild(el('div', 'view', `
      <div class="profile-hero">
        <div class="profile-row">
          <div class="profile-avatar">${profile.avatar}</div>
          <div style="flex:1">
            <div class="profile-name">${State.user}</div>
            <div class="profile-meta">当前等级 ${currentLevel(d.xp).code} · ${currentLevel(d.xp).name} · 加入于 ${d.joinDate}</div>
            <div class="profile-meta">目标语言：${DATA.languages[profile.targetLang].flag} ${DATA.languages[profile.targetLang].name}（可改）</div>
          </div>
        </div>
        <div class="hero-stats" style="margin-top:20px">
          <div><div class="hero-stat-num">${d.xp}</div><div class="hero-stat-label">总经验</div></div>
          <div><div class="hero-stat-num">${d.streak}🔥</div><div class="hero-stat-label">连续天数</div></div>
          <div><div class="hero-stat-num">${d.completedLessons.length}</div><div class="hero-stat-label">完成课程</div></div>
          <div><div class="hero-stat-num">${d.achievements.length}</div><div class="hero-stat-label">成就徽章</div></div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-head"><div class="panel-title">🏅 成就徽章墙</div><span class="badge">${d.achievements.length}/${DATA.achievements.length}</span></div>
        <div class="ach-grid" id="ach-grid"></div>
      </div>
      <div class="panel">
        <div class="panel-head"><div class="panel-title">⚙️ 账号设置</div></div>
        <div style="display:flex;flex-direction:column;gap:16px">
          <div>
            <div style="font-size:13px;color:var(--text-soft);margin-bottom:8px">目标语言</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap" id="lang-pick">
              ${Object.values(DATA.languages).map(l => `<button class="btn ${l.key === profile.targetLang ? 'btn-primary' : 'btn-ghost'}" data-pick="${l.key}">${l.flag} ${l.name}</button>`).join('')}
            </div>
          </div>
          <div>
            <div style="font-size:13px;color:var(--text-soft);margin-bottom:8px">头像</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap" id="avatar-pick">
              ${['🦊', '🐰', '🐯', '🦉', '🐼', '🐨', '🦁', '🐧', '🌸', '⭐', '👑', '🚀'].map(a => `<button class="btn ${a === profile.avatar ? 'btn-primary' : 'btn-ghost'}" data-ava="${a}" style="font-size:20px;padding:8px 12px">${a}</button>`).join('')}
            </div>
          </div>
        </div>
      </div>
    `));

    const grid = $('#ach-grid');
    DATA.achievements.forEach(a => {
      const earned = d.achievements.includes(a.id);
      grid.appendChild(el('div', 'ach-card ' + (earned ? 'earned' : 'locked'), `
        <div class="ach-ico">${a.icon}</div>
        <div class="ach-name">${a.name}</div>
        <div class="ach-desc">${a.desc}</div>
        <div class="ach-tier ${a.tier}">${a.tier === 'gold' ? '金' : a.tier === 'silver' ? '银' : '铜'}</div>`));
    });

    $$('[data-pick]', main).forEach(b => b.onclick = () => {
      const users = getUsers();
      users[State.user].profile.targetLang = b.dataset.pick;
      saveUsers(users);
      if (!d.langsStudied.includes(b.dataset.pick)) { d.langsStudied.push(b.dataset.pick); saveUserData(d); }
      toast('目标语言已更新', 'success');
      Views.profile();
    });
    $$('[data-ava]', main).forEach(b => b.onclick = () => {
      const users = getUsers();
      users[State.user].profile.avatar = b.dataset.ava;
      saveUsers(users);
      refreshTopbar();
      Views.profile();
    });
  };

  /* =================================================================
   * 应用入口
   * ================================================================= */
  function enterApp() {
    $('#auth-view').classList.add('hidden');
    $('#app').classList.remove('hidden');
    const d = userData();
    touchStreak();
    refreshTopbar();
    awardAchievements();
    Router.go(State.view || 'home');
  }

  function closeSidenav() {
    $('#sidenav').classList.remove('open');
    $('#sidenav-overlay').classList.remove('show');
  }

  function bindNav() {
    $$('[data-nav]').forEach(n => {
      if (n.id === 'logout-btn') return;
      n.onclick = () => Router.go(n.dataset.nav);
    });
    $('#logout-btn').onclick = () => {
      modal(`
        <h3 style="font-size:18px;margin-bottom:12px">确认退出登录？</h3>
        <p style="color:var(--text-soft);font-size:14px;margin-bottom:20px">你的学习数据已保存在本地，下次登录可继续。</p>
        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button class="btn btn-ghost" id="cancel-logout">取消</button>
          <button class="btn btn-primary" id="confirm-logout" style="background:var(--danger)">退出</button>
        </div>`);
      $('#cancel-logout').onclick = closeModal;
      $('#confirm-logout').onclick = () => { closeModal(); Auth.logout(); };
    };
    $('#menu-toggle').onclick = () => {
      $('#sidenav').classList.toggle('open');
      $('#sidenav-overlay').classList.toggle('show');
    };
    $('#sidenav-overlay').onclick = closeSidenav;
    $('#theme-toggle').onclick = toggleTheme;
  }

  function toggleTheme() {
    const html = document.documentElement;
    const cur = html.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('linguaverse_theme', next);
    $('#theme-toggle').textContent = next === 'dark' ? '🌙' : '☀️';
  }

  function init() {
    // 主题
    const savedTheme = localStorage.getItem('linguaverse_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    $('#theme-toggle').textContent = savedTheme === 'dark' ? '🌙' : '☀️';

    Auth.init();
    bindNav();
    loadState();

    // 启动动画
    setTimeout(() => $('#splash').classList.add('fade'), 1100);

    // 已登录直接进入
    if (State.user && getUsers()[State.user]) {
      setTimeout(() => { $('#splash').classList.add('fade'); enterApp(); }, 1100);
    } else {
      setTimeout(() => {
        $('#splash').classList.add('fade');
        $('#auth-view').classList.remove('hidden');
      }, 1100);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
