/* Router and start-up. */
(function (L) {
  var tabMap = [[/^#\/(home)?$/, 'home'], [/^#\/(learn|lesson)/, 'learn'], [/^#\/share/, 'share'], [/^#\/journey/, 'journey'], [/^#\/companion/, 'companion']];
  var publicHash = /^#\/login$/;
  var lastMe = 0;
  /* Roles can change while someone is signed in (for example after LDF verifies them). Refresh them quietly. */
  L.refreshMe = async function (force) {
    if (!L.session.token || (!force && Date.now() - lastMe < 45000)) return;
    lastMe = Date.now();
    try {
      var d = await L.api('auth.me');
      L.session.user = d.user; L.session.roles = d.roles; L.session.profile = d.profile; L.saveSession();
    } catch (e) {}
  };
  L.router = async function () {
    var hash = location.hash || '#/home';
    if (L.session.token && /^#\/(menu|studio|share|create|admin|profile)/.test(hash)) await L.refreshMe(/^#\/(menu|studio)/.test(hash));
    if (!L.apiUrl() || (!L.session.token && !publicHash.test(hash))) { if (!publicHash.test(hash)) { location.hash = '#/login'; return; } }
    if (L.session.token && publicHash.test(hash)) { location.hash = '#/home'; return; }
    document.body.classList.toggle('hide-when-auth', publicHash.test(hash));
    document.querySelectorAll('.tab').forEach(function (t) { t.removeAttribute('aria-current'); });
    tabMap.forEach(function (m) { if (m[0].test(hash)) { var t = document.querySelector('[data-tab="' + m[1] + '"]'); if (t) t.setAttribute('aria-current', 'page'); } });
    for (var i = 0; i < L.routes.length; i++) {
      var m = hash.match(L.routes[i][0]);
      if (m) {
        try { await L.routes[i][1](m); }
        catch (e) {
          if (e.code === 'AUTH_REQUIRED') return;
          L.render('<div class="card"><h3>We could not load this</h3><p class="muted">' + L.esc(e.message || 'Something went wrong.') + '</p><button class="btn" data-act="retry">Try again</button></div>');
        }
        return;
      }
    }
    location.hash = '#/home';
  };
  L.on('retry', function () { L.router(); });
  window.addEventListener('hashchange', L.router);
  try { var th = localStorage.getItem('ldf_theme'); if (th) document.documentElement.dataset.theme = th; } catch (e) {}
  L.router();
})(window.LDF);
