/* Sign in, join LDF, and first-time connection to the LDF API. */
(function (L) {
  function connectView() {
    document.body.classList.add('hide-when-auth');
    L.render('<div class="auth"><div class="logo">LDF <span>Hub</span></div>' +
      '<div class="card"><h2>Connect the app</h2><p class="muted">Paste the Web App URL from your LDF Apps Script deployment. You only do this once on this device.</p>' +
      '<form data-form="connect">' + L.field('url', 'Web App URL', { type: 'url', required: true, placeholder: 'https://script.google.com/macros/s/.../exec' }) +
      '<button class="btn" type="submit">Connect</button></form></div></div>');
  }
  L.onForm('connect', async function (f) {
    var url = L.formData(f).url.trim();
    var btn = f.querySelector('button');
    await L.safe(btn, async function () {
      L.setApiUrl(url);
      try { await L.api('app.config'); }
      catch (e) { try { localStorage.removeItem('ldf_api_url'); } catch (x) {} throw e; }
      location.hash = '#/login'; L.router();
    });
  });

  var mode = 'login';
  async function loginView() {
    document.body.classList.add('hide-when-auth');
    if (!L.apiUrl()) return connectView();
    var cfg = { app_name: 'LDF Learning & Opportunity Hub', tagline: 'Learn. Practise. Share. Grow.', allow_registration: true };
    try { cfg = await L.api('app.config'); } catch (e) { if (e.code === 'NETWORK' || e.code === 'BAD_REPLY') L.toast(e.message, true); }
    var isLogin = mode === 'login';
    L.render('<div class="auth"><div class="logo">LDF <span>Hub</span></div><p>' + L.esc(cfg.tagline) + '</p>' +
      '<div class="card"><div class="subtabs" role="tablist"><button class="subtab" role="tab" data-act="auth-mode" data-mode="login" ' + (isLogin ? 'aria-current="page"' : '') + '>Sign in</button>' +
      (cfg.allow_registration ? '<button class="subtab" role="tab" data-act="auth-mode" data-mode="join" ' + (!isLogin ? 'aria-current="page"' : '') + '>Join LDF</button>' : '') + '</div>' +
      (isLogin
        ? '<form data-form="login">' + L.field('email', 'Email', { type: 'email', required: true, autocomplete: 'username' }) + L.field('password', 'Password', { type: 'password', required: true, autocomplete: 'current-password' }) + '<button class="btn wide" type="submit">Sign in</button></form>'
        : '<form data-form="register">' + L.field('full_name', 'Your name', { required: true, autocomplete: 'name' }) + L.field('email', 'Email', { type: 'email', required: true, autocomplete: 'username' }) +
          L.field('date_of_birth', 'Date of birth', { type: 'date', required: true, hint: 'Members under 18 need a parent or guardian to agree before joining Knowledge Share.' }) +
          '<div id="guardianBox" hidden>' + L.field('guardian_email', 'Parent or guardian email', { type: 'email' }) + '</div>' +
          L.field('phone', 'Phone (optional)', { type: 'tel', autocomplete: 'tel' }) +
          L.field('password', 'Password', { type: 'password', required: true, autocomplete: 'new-password', hint: 'At least 8 characters.' }) +
          '<button class="btn wide" type="submit">Join LDF</button></form>') +
      '</div><p class="small muted">Learn something. Share something. Help someone. Grow together.</p>' +
      '<button class="linkbtn small" data-act="change-api">Change connection</button></div>');
    var dob = document.getElementById('date_of_birth');
    if (dob) dob.addEventListener('change', function () {
      var age = (Date.now() - new Date(dob.value).getTime()) / (365.25 * 86400000);
      document.getElementById('guardianBox').hidden = !(age < 18);
    });
  }
  L.on('auth-mode', function (t) { mode = t.dataset.mode; loginView(); });
  L.on('change-api', function () { try { localStorage.removeItem('ldf_api_url'); } catch (e) {} connectView(); });
  function afterAuth(d) {
    Object.assign(L.session, { token: d.token || L.session.token, user: d.user, roles: d.roles, profile: d.profile });
    L.saveSession();
    document.body.classList.remove('hide-when-auth');
    location.hash = '#/home';
  }
  L.onForm('login', async function (f) {
    var d = await L.safe(f.querySelector('button'), function () { return L.api('auth.login', L.formData(f)); });
    if (d) afterAuth(d);
  });
  L.onForm('register', async function (f) {
    var d = await L.safe(f.querySelector('button'), function () { return L.api('auth.register', L.formData(f)); });
    if (d) afterAuth(d);
  });
  L.logout = async function () {
    try { await L.api('auth.logout'); } catch (e) {}
    L.clearSession(); mode = 'login'; location.hash = '#/login';
  };
  L.on('logout', function () { L.logout(); });
  L.route(/^#\/login$/, loginView);
})(window.LDF);
