/* config-pc 独立站：登录 / 试用 / 付款 / 中英文 — 不依赖 hub */
(function () {
  'use strict';
  var LANG_KEY = 'cpsite_lang';
  var lang = localStorage.getItem(LANG_KEY) || 'zh';
  var state = null;
  var user = null;

  var I18N = {
    en: {
      goHub: 'ZSH Game Hub →', upgradeMember: 'Upgrade', langZh: '中文', langEn: 'EN',
      alertLoginForUpgrade: 'Please log in first to upgrade.',
      login: 'Log in', register: 'Sign up', logout: 'Log out', username: 'Username', password: 'Password',
      statusLoading: 'Checking…', statusGuest: 'Log in or sign up to generate builds.',
      statusTrial: 'Trial <strong>{left}</strong> / {max} left · ¥{price} to unlock unlimited.',
      statusPaid: 'Unlocked · unlimited builds.',
      statusNeedPay: 'Trials used · pay <strong>¥{price}</strong> via WeChat to unlock.',
      payTitle: 'Unlock PC Builder', payAmount: '¥5 one-time', payHint: 'Scan WeChat QR · admin approves',
      payBtn: 'I HAVE PAID', payClose: 'Close', payOk: 'Submitted', payFail: 'Failed',
      alertNeedPay: 'Please pay ¥5 to continue.', alertFail: 'Could not run.', alertNet: 'Network error.',
      alertAuthFail: 'Sign-in failed. Try again.', alertAuthInvalid: 'Username ≥3 chars, password ≥4 chars.',
      alertUserTaken: 'Username already taken.', alertBadCreds: 'Wrong username or password. This site uses a separate account from ZSH Hub — please sign up here.',
      authHint: 'Separate account from ZSH Hub (not shared).',
      lblBudget: 'Budget (CNY)', lblForm: 'Form Factor', lblArch: 'CPU Platform', lblUsage: 'Use Case', lblStyle: 'Style', lblCool: 'Cooling',
      optDesktop: 'Desktop / Server (full parts)', optLaptop: 'Laptop (top + 2 alternates)',
      optIntel: 'Intel Core / Xeon', optAmd: 'AMD Ryzen / EPYC', optApple: 'Apple Silicon (M-series)',
      usage_game: 'Gaming', usage_ai: 'AI / LLM', usage_dev: 'Development', usage_edit: 'Video editing',
      usage_server: 'Server / DC', usage_office: 'Mobile office', usage_student: 'Student all-round',
      style_stealth: 'Stealth black', style_rgb: 'RGB gaming', style_white: 'White aesthetic',
      cool_air: 'Air / passive', cool_liquid: 'AIO liquid', cool_custom: 'Custom loop',
      btnGenerate: 'Generate unique build ➔'
    },
    zh: {
      goHub: '前往 ZSH 游戏大厅 →', upgradeMember: '升级会员', langZh: '中文', langEn: 'EN',
      alertLoginForUpgrade: '请先登录后再升级会员。',
      login: '登录', register: '注册', logout: '退出', username: '用户名', password: '密码',
      statusLoading: '正在检查额度…', statusGuest: '请登录或注册后生成配机方案。',
      statusTrial: '免费试用剩余 <strong>{left}</strong> / {max} 次 · 付 ¥{price} 永久解锁。',
      statusPaid: '已解锁 · 可无限次生成。',
      statusNeedPay: '试用已用完 · 微信付 <strong>¥{price}</strong> 解锁无限使用。',
      payTitle: '解锁配置电脑', payAmount: '¥5 一次性解锁', payHint: '微信扫码付款 · 管理员审核后生效',
      payBtn: '我已付款', payClose: '关闭', payOk: '已提交，等待审核', payFail: '提交失败',
      alertNeedPay: '请付 ¥5 后继续。', alertFail: '无法生成。', alertNet: '网络错误。',
      alertAuthFail: '登录/注册失败，请重试。', alertAuthInvalid: '用户名至少 3 字，密码至少 4 字。',
      alertUserTaken: '用户名已被占用，请换一个。', alertBadCreds: '用户名或密码错误。本站账号与游戏大厅独立，请在此注册新账号。',
      authHint: '独立账号，与 ZSH 游戏大厅不互通',
      lblBudget: '采购预算 (CNY)', lblForm: '硬件形态', lblArch: '核心架构', lblUsage: '应用场景', lblStyle: '配件风格', lblCool: '散热体系',
      optDesktop: '台式机/服务器 (全库解算)', optLaptop: '笔记本 (主推+双备选)',
      optIntel: 'Intel Core / Xeon', optAmd: 'AMD Ryzen / EPYC', optApple: 'Apple Silicon (M系列)',
      usage_game: '游戏竞技', usage_ai: 'AI 算力大模型', usage_dev: '编程开发', usage_edit: '创作剪辑',
      usage_server: '服务器/数据中心', usage_office: '出差办公', usage_student: '学生全能',
      style_stealth: '纯黑无光 (工业风)', style_rgb: '极致灯效 (电竞风)', style_white: '冰雪纯白 (海景房)',
      cool_air: '风冷/被动散热', cool_liquid: '一体式水冷', cool_custom: '极限分体水冷',
      btnGenerate: '生成唯一硬件基因 ➔'
    }
  };

  function t(k) { return (I18N[lang] || I18N.zh)[k] || k; }
  function fmt(s, o) { return String(s).replace(/\{(\w+)\}/g, function (_, k) { return o[k] != null ? o[k] : ''; }); }

  function trialFmt() {
    return fmt(t('statusTrial'), {
      left: state.trials_left != null ? state.trials_left : 0,
      max: state.trials_max != null ? state.trials_max : 2,
      price: state.price != null ? state.price : 5
    });
  }

  function authErrorMsg(data) {
    var e = data && data.error;
    if (e === 'invalid_credentials') return t('alertAuthInvalid');
    if (e === 'username_taken') return t('alertUserTaken');
    if (e === 'bad_credentials') return t('alertBadCreds');
    return t('alertAuthFail');
  }

  function validateAuthInput(u, p) {
    if (u.length < 3 || p.length < 4) {
      alert(t('alertAuthInvalid'));
      return false;
    }
    return true;
  }

  function setLang(l) {
    lang = l === 'en' ? 'en' : 'zh';
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
    applyI18n();
    updateUi();
  }

  function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (!t(k)) return;
      if (el.tagName === 'INPUT') el.placeholder = t(k);
      else el.textContent = t(k);
    });
    var labels = { budget: 'lblBudget', form: 'lblForm', arch: 'lblArch', usage: 'lblUsage', style: 'lblStyle', cool: 'lblCool' };
    document.querySelectorAll('.field').forEach(function (field) {
      var inp = field.querySelector('input,select');
      var lab = field.querySelector('label');
      if (!inp || !lab) return;
      var key = labels[inp.id];
      if (key) lab.textContent = t(key);
    });
    var opts = {
      form: { desktop: 'optDesktop', laptop: 'optLaptop' },
      arch: { intel: 'optIntel', amd: 'optAmd', apple: 'optApple' },
      usage: { game: 'usage_game', ai: 'usage_ai', dev: 'usage_dev', edit: 'usage_edit', server: 'usage_server', office: 'usage_office', student: 'usage_student' },
      style: { stealth: 'style_stealth', rgb: 'style_rgb', white: 'style_white' },
      cool: { air: 'cool_air', liquid: 'cool_liquid', custom: 'cool_custom' }
    };
    Object.keys(opts).forEach(function (id) {
      var sel = document.getElementById(id);
      if (!sel) return;
      Array.prototype.forEach.call(sel.options, function (o) {
        var key = opts[id][o.value];
        if (key) o.textContent = t(key);
      });
    });
    var btn = document.getElementById('pcGenerateBtn');
    if (btn) btn.textContent = t('btnGenerate');
    var zh = document.getElementById('pcLangZh');
    var en = document.getElementById('pcLangEn');
    if (zh) zh.classList.toggle('active', lang === 'zh');
    if (en) en.classList.toggle('active', lang === 'en');
    var pt = document.getElementById('pcPayTitle');
    var pa = document.getElementById('pcPayAmount');
    var ph = document.getElementById('pcPayHint');
    if (pt) pt.textContent = t('payTitle');
    if (pa) pa.textContent = t('payAmount');
    if (ph) ph.textContent = t('payHint');
  }

  function updateUpgradeBtn() {
    var btn = document.getElementById('cpsiteUpgradeBtn');
    if (!btn) return;
    var isMember = state && state.paid;
    btn.style.display = isMember ? 'none' : 'inline-block';
  }

  function updateAuthUi() {
    var box = document.getElementById('cpsiteAuthBox');
    var who = document.getElementById('cpsiteAuthUser');
    if (!user) {
      if (box) box.style.display = 'flex';
      if (who) { who.textContent = ''; who.style.display = 'none'; }
      updateUpgradeBtn();
      return;
    }
    if (box) box.style.display = 'none';
    if (who) { who.style.display = 'inline-block'; who.textContent = user + ' · ' + t('logout'); }
    updateUpgradeBtn();
  }

  function updateUi() {
    var bar = document.getElementById('pcTierBar');
    var btn = document.getElementById('pcGenerateBtn');
    if (!bar || !btn) return;
    if (!state) {
      bar.innerHTML = t('statusGuest');
      bar.className = 'pc-tier-bar warn';
      btn.disabled = true;
      updateUpgradeBtn();
      return;
    }
    if (state.paid) {
      bar.innerHTML = t('statusPaid');
      bar.className = 'pc-tier-bar';
      btn.disabled = false;
      updateUpgradeBtn();
      return;
    }
    if (state.available) {
      bar.innerHTML = trialFmt();
      bar.className = 'pc-tier-bar';
      btn.disabled = false;
      updateUpgradeBtn();
      return;
    }
    bar.innerHTML = fmt(t('statusNeedPay'), state);
    bar.className = 'pc-tier-bar warn';
    btn.disabled = true;
    updateUpgradeBtn();
  }

  async function api(path, opts) {
    try {
      var r = await fetch(path, Object.assign({ credentials: 'same-origin', headers: { 'Content-Type': 'application/json' } }, opts || {}));
      var d = null;
      try { d = await r.json(); } catch (e) {}
      return { ok: r.ok, status: r.status, data: d };
    } catch (e) {
      return { ok: false, status: 0, data: null, net: true };
    }
  }

  async function refreshMe() {
    var res = await api('/api/cpsite/me');
    if (res.data && res.data.logged_in) {
      user = res.data.username;
      state = res.data;
    } else {
      user = null;
      state = null;
    }
    updateAuthUi();
    updateUi();
  }

  function openPay() {
    var m = document.getElementById('pcPayModal');
    var q = document.getElementById('pcPayQr');
    if (q) {
      q.src = '/config-pc/assets/wechat-pay.jpg';
      q.onerror = function () { this.onerror = null; this.src = '/config-pc/assets/wechat-pay.png'; };
    }
    if (m) m.classList.add('open');
  }

  function closePay() {
    var m = document.getElementById('pcPayModal');
    if (m) m.classList.remove('open');
  }

  async function confirmPay() {
    var msg = document.getElementById('pcPayMsg');
    var r1 = await api('/api/cpsite/payment/order', { method: 'POST', body: '{}' });
    if (!r1.ok) { if (msg) msg.textContent = t('payFail'); return; }
    var r2 = await api('/api/cpsite/payment/confirm', { method: 'POST', body: JSON.stringify({ order_id: r1.data.order_id }) });
    if (msg) msg.textContent = r2.ok ? t('payOk') : t('payFail');
    if (r2.ok) setTimeout(refreshMe, 1200);
  }

  function init() {
    updateUi();
    applyI18n();
    var hint = document.getElementById('cpsiteAuthHint');
    if (hint) hint.textContent = t('authHint');
    document.getElementById('pcLangZh').addEventListener('click', function () { setLang('zh'); });
    document.getElementById('pcLangEn').addEventListener('click', function () { setLang('en'); });
    document.getElementById('cpsiteUpgradeBtn').addEventListener('click', function () {
      if (!user) { alert(t('alertLoginForUpgrade')); return; }
      openPay();
    });
    document.getElementById('authLoginBtn').addEventListener('click', async function () {
      var u = document.getElementById('authUserIn').value.trim();
      var p = document.getElementById('authPassIn').value;
      if (!validateAuthInput(u, p)) return;
      var res = await api('/api/cpsite/login', { method: 'POST', body: JSON.stringify({ username: u, password: p }) });
      if (!res.ok) { alert(res.net ? t('alertNet') : authErrorMsg(res.data)); return; }
      await refreshMe();
    });
    document.getElementById('authRegBtn').addEventListener('click', async function () {
      var u = document.getElementById('authUserIn').value.trim();
      var p = document.getElementById('authPassIn').value;
      if (!validateAuthInput(u, p)) return;
      var res = await api('/api/cpsite/register', { method: 'POST', body: JSON.stringify({ username: u, password: p }) });
      if (!res.ok) { alert(res.net ? t('alertNet') : authErrorMsg(res.data)); return; }
      await refreshMe();
    });
    document.getElementById('cpsiteAuthUser').addEventListener('click', async function () {
      await api('/api/cpsite/logout', { method: 'POST', body: '{}' });
      user = null;
      state = null;
      updateAuthUi();
      updateUi();
    });
    document.getElementById('pcPayConfirmBtn').addEventListener('click', confirmPay);
    document.getElementById('pcPayCloseBtn').addEventListener('click', closePay);

    var core = window.runNexusAlgorithmCore;
    var btn = document.getElementById('pcGenerateBtn');
    btn.addEventListener('click', async function () {
      if (btn.disabled) return;
      if (!state) return;
      if (state.needs_pay || !state.available) { openPay(); return; }
      btn.disabled = true;
      var res = await api('/api/cpsite/use', { method: 'POST', body: '{}' });
      if (!res.ok) {
        if (res.data && res.data.error === 'needs_pay') openPay();
        else alert(res.net ? t('alertNet') : t('alertFail'));
        await refreshMe();
        return;
      }
      state = res.data;
      updateUi();
      core();
      btn.disabled = false;
    });

    refreshMe();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
