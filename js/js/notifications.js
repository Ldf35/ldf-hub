/* Notifications, the AI Companion, opportunities and the menu. */
(function (L) {
  async function notifications() {
    L.loading();
    var d = await L.api('notifications.list');
    L.render('<div class="row"><h1>Notifications</h1>' + (d.unread ? '<button class="btn ghost small" data-act="read-all">Mark all as read</button>' : '') + '</div>' +
      '<div class="card">' + (d.items.length ? '<ul class="list">' + d.items.map(function (n) {
        return '<li><div class="grow">' + (n.is_read ? '' : '<span class="badge">New</span> ') + '<b>' + L.esc(n.title) + '</b><p class="small muted">' + L.esc(n.body) + '</p></div>' + (n.link ? '<a class="btn ghost small" href="' + L.esc(n.link) + '" data-act="open-note" data-id="' + L.esc(n.notification_id) + '">Open</a>' : '') + '</li>';
      }).join('') + '</ul>' : '<p class="muted">Nothing yet. We will let you know when something needs you.</p>') + '</div>');
    var b = document.getElementById('bellCount'); b.textContent = d.unread; b.hidden = !d.unread;
  }
  L.route(/^#\/notifications$/, notifications);
  L.on('read-all', async function (t) { var r = await L.safe(t, function () { return L.api('notifications.read'); }); if (r) notifications(); });
  L.on('open-note', function (t) { L.api('notifications.read', { notification_id: t.dataset.id }).catch(function () {}); location.hash = t.getAttribute('href'); });

  var modes = [['coach', 'Coach'], ['tutor', 'Tutor'], ['reflection', 'Reflect'], ['confidence', 'Confidence'], ['interview', 'Interview'], ['career', 'Career'], ['opportunity', 'Opportunities']];
  var chat = { mode: 'coach', id: '', msgs: [], ref: '' };
  function companion(m) {
    if (m && m[1]) { chat.ref = m[1]; chat.mode = 'tutor'; }
    var h = '<div class="hello"><h1>LDF AI Companion</h1><p class="muted">Practise, get unstuck and think things through. Never share passwords or private details here.</p></div>' +
      '<div class="chips" role="group" aria-label="Mode">' + modes.map(function (x) { return '<button class="chip" data-act="ai-mode" data-m="' + x[0] + '" aria-pressed="' + (chat.mode === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      '<div class="card"><div class="chat" id="chat">' + (chat.msgs.length ? chat.msgs.map(function (x) { return '<div class="msg ' + (x.role === 'user' ? 'user' : 'bot') + '">' + L.esc(x.text) + '</div>'; }).join('') : '<p class="muted">Say hello, or tell me what you are working on.</p>') + '</div>' +
      '<form data-form="ai-send" class="row" style="flex-wrap:nowrap"><div class="grow">' + L.field('message', 'Message', { required: true }).replace('<label for="message">Message</label>', '<label for="message" class="small muted">Your message</label>') + '</div><button class="btn" type="submit">Send</button></form></div>';
    L.render(h);
    var c = document.getElementById('chat'); c.scrollTop = c.scrollHeight;
  }
  L.route(/^#\/companion(?:\/([\w-]+))?$/, companion);
  L.on('ai-mode', function (t) { chat.mode = t.dataset.m; chat.id = ''; chat.msgs = []; companion(); });
  L.onForm('ai-send', async function (f) {
    var v = L.formData(f).message;
    chat.msgs.push({ role: 'user', text: v });
    companion();
    var r = await L.safe(null, function () { return L.api('ai.chat', { mode: chat.mode, message: v, ai_session_id: chat.id, context_ref: chat.ref }); });
    chat.msgs.push({ role: 'bot', text: r ? r.reply : 'Sorry, I could not answer just now.' });
    if (r) chat.id = r.ai_session_id;
    companion();
  });

  async function opportunities() {
    L.loading();
    var d = await L.api('opportunities.list');
    var h = '<div class="hello"><h1>LDF Opportunities</h1><p class="muted">Jobs, training, internships, work experience, projects and volunteering.</p></div>';
    if (!d.enabled) h += '<div class="card"><h3>Coming soon</h3><p class="muted">LDF is building partnerships with companies. Keep learning and sharing: it all becomes part of your journey and helps us match you later.</p></div>';
    else h += (d.items.length ? d.items.map(function (o) { return '<div class="card"><div class="row"><div class="grow"><h3>' + L.esc(o.title) + '</h3><p class="small muted">' + L.esc(o.company) + ' · ' + L.esc(o.type) + ' · ' + L.esc(o.location) + '</p></div>' + (o.matched_skills ? L.badge(o.matched_skills + ' skills match', 'good') : '') + '</div><p>' + L.esc(o.description) + '</p>' + (o.applied ? L.badge('Applied', 'good') : '<button class="btn" data-act="opp-apply" data-id="' + L.esc(o.opportunity_id) + '">Apply</button>') + '</div>'; }).join('') : '<div class="card"><p>No open opportunities right now.</p></div>') + '<p class="small muted">' + L.esc(d.note) + '</p>';
    L.render(h);
  }
  L.route(/^#\/opportunities$/, opportunities);
  L.on('opp-apply', async function (t) { var r = await L.safe(t, function () { return L.api('opportunities.apply', { opportunity_id: t.dataset.id }); }); if (r) { L.toast('Application sent.'); opportunities(); } });

  function menu() {
    var link = function (href, label, sub) { return '<li><a href="' + href + '" class="grow" style="text-decoration:none;color:inherit"><b>' + label + '</b><div class="small muted">' + sub + '</div></a></li>'; };
    var h = '<div class="hello"><h1>' + L.t('menu') + '</h1><p class="muted">' + L.esc(L.session.user ? L.session.user.full_name : '') + '</p></div><div class="card"><ul class="list">' +
      link('#/profile', 'My LDF Profile', 'Details, certificates, achievements') + link('#/opportunities', 'LDF Opportunities', 'Jobs, training and projects') +
      (L.hasRole('contributor') ? link('#/studio', 'My Knowledge Studio', 'Classes, requests and sessions') : link('#/share/apply', 'Share your knowledge', 'Become an LDF Verified contributor')) +
      (L.hasRole('course_creator') ? link('#/create', 'LDF Learning Studio', 'Create and publish programmes') : '') +
      (L.hasRole('admin') ? link('#/admin', 'LDF Command Centre', 'Members, verification, safety, settings') : '') +
      '</ul></div><div class="card"><h3>' + L.t('language') + '</h3>' + L.langPicker() + '</div><div class="row"><button class="btn ghost" data-act="theme">Switch light or dark</button><button class="btn danger" data-act="logout">' + L.t('signout') + '</button></div>';
    L.render(h);
  }
  L.route(/^#\/menu$/, menu);
  L.on('theme', function () {
    var r = document.documentElement, dark = r.dataset.theme === 'dark' || (!r.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
    r.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('ldf_theme', r.dataset.theme); } catch (e) {}
  });
})(window.LDF);
