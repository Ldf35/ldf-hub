/* LDF Command Centre. Everything an administrator does, without touching the spreadsheet. */
(function (L) {
  var tabs = [['overview', 'Overview'], ['verification', 'Verification'], ['members', 'Members'], ['safety', 'Safety'], ['learning', 'Learning'], ['followups', 'Follow-ups'], ['settings', 'Settings'], ['audit', 'Audit']];
  function nav(cur) { return '<div class="subtabs">' + tabs.map(function (t) { return '<a class="subtab" href="#/admin/' + t[0] + '" ' + (cur === t[0] ? 'aria-current="page"' : '') + '>' + t[1] + '</a>'; }).join('') + '</div>'; }
  var members = { q: '' };

  async function admin(m) {
    if (!L.hasRole('admin')) { L.render('<div class="card"><p>This area is for LDF administrators.</p></div>'); return; }
    var tab = m[1] || 'overview', sub = m[2];
    L.loading();
    var h = '<div class="hello"><h1>LDF Command Centre</h1></div>' + nav(tab);
    if (tab === 'overview') {
      var s = await L.api('admin.stats');
      var item = function (v, l, href) { return '<' + (href ? 'a href="' + href + '"' : 'div') + ' class="card" style="text-decoration:none;color:inherit"><div class="stat"><b>' + L.esc(v) + '</b><span>' + l + '</span></div></' + (href ? 'a' : 'div') + '>'; };
      h += '<div class="grid2">' + item(s.members, 'members (' + s.members_week + ' this week)', '#/admin/members') + item(s.verification_pending, 'applications to review', '#/admin/verification') + item(s.requests_open, 'open session requests') + item(s.sessions_completed, 'sessions completed') +
        item(s.programmes_published, 'published programmes (' + s.programmes_draft + ' drafts)', '#/admin/learning') + item(s.contributors_verified, 'verified contributors') + item(s.goals_active + ' / ' + s.goals_achieved, 'goals active / achieved') + item(s.volunteer_hours, 'volunteer hours') +
        item(s.reports_open, 'open safety reports', '#/admin/safety') + item(s.guardian_consent_waiting, 'young members waiting for guardian consent', '#/admin/members') + '</div>';
    } else if (tab === 'verification') {
      if (sub) {
        var d = await L.api('admin.verificationDetail', { verification_id: sub }), c = d.contributor, a = d.applicant;
        h += '<a class="small" href="#/admin/verification">&larr; Applications</a><div class="card"><div class="row"><h2>Application</h2>' + L.statusBadge(d.verification.status) + '</div>' +
          '<div class="grid2 small"><div><div class="muted">Name</div><b>' + L.esc(a.name) + '</b></div><div><div class="muted">Email</div><b>' + L.esc(a.email) + '</b></div><div><div class="muted">Phone</div><b>' + L.esc(a.phone) + '</b></div><div><div class="muted">Member since</div><b>' + L.esc(L.fmtMonth(a.member_since)) + '</b></div></div>' +
          '<h4>What they want to teach</h4><p>' + L.esc(c.headline) + '</p><div class="grid2 small"><div><div class="muted">Subjects</div><b>' + L.esc(c.subjects) + '</b></div><div><div class="muted">Levels</div><b>' + L.esc(c.levels) + '</b></div><div><div class="muted">Languages</div><b>' + L.esc(c.languages) + '</b></div><div><div class="muted">Experience</div><b>' + L.esc(c.experience_years) + ' years</b></div><div><div class="muted">Availability</div><b>' + L.esc(c.availability_text) + '</b></div><div><div class="muted">Offer</div><b>' + L.esc(c.volunteer_offer) + '</b></div></div>' +
          '<h4>Qualifications</h4><p class="pre">' + L.esc(c.qualifications) + '</p>' + (d.verification.evidence_url ? '<p><a href="' + L.esc(d.verification.evidence_url) + '" target="_blank" rel="noopener">Open supporting evidence</a></p>' : '<p class="muted small">No evidence link added.</p>') +
          '<p class="small muted">Previous contributions: ' + L.esc(d.previous_contribution) + ' · Reviews: ' + L.esc(d.reviews) + '</p></div>' +
          '<div class="card"><h3>Decision</h3><form data-form="decide"><input type="hidden" name="verification_id" value="' + L.esc(sub) + '">' + L.field('notes', 'Note (required unless approving)', { type: 'textarea', hint: 'The applicant sees this note when you ask for more information or decline.' }) +
          '<div class="row"><button class="btn" name="decision" value="approve" type="submit">Approve</button><button class="btn ghost" name="decision" value="more_info" type="submit">Request more information</button><button class="btn danger" name="decision" value="reject" type="submit">Reject</button><button class="btn line" name="decision" value="suspend" type="submit">Suspend</button><button class="btn ghost" name="decision" value="reverify" type="submit">Re-verify</button></div></form></div>';
      } else {
        var q = (await L.api('admin.verificationQueue', { status: 'open' })).items;
        h += '<div class="card"><h3>Pending</h3>' + (q.length ? '<ul class="list">' + q.map(function (v) { return '<li><div class="grow"><b>' + L.esc(v.name) + '</b><div class="small muted">' + L.esc(v.headline) + ' · ' + L.esc(v.subjects) + '</div></div>' + L.statusBadge(v.status) + '<a class="btn small" href="#/admin/verification/' + L.esc(v.verification_id) + '">Review</a></li>'; }).join('') + '</ul>' : '<p class="muted">Nothing waiting. Well done.</p>') + '</div>' +
          '<div class="card"><h3>Everything verified or decided</h3><button class="btn ghost" data-act="verif-all">Show all applications</button><div id="allv"></div></div>';
      }
    } else if (tab === 'members') {
      var ms = (await L.api('admin.members', { q: members.q })).members;
      h += '<div class="card"><form data-form="members-search" class="row"><div class="grow">' + L.field('mq', 'Search by name or email', { value: members.q }).replace('name="mq"', 'name="q"') + '</div><button class="btn ghost" type="submit">Search</button></form></div>' +
        '<div class="card"><ul class="list">' + ms.map(function (u) {
          return '<li><div class="grow"><b>' + L.esc(u.full_name) + '</b> ' + (u.status === 'suspended' ? L.badge('Paused', 'bad') : '') + (u.is_minor ? L.badge(u.guardian_consent ? 'Under 18 · guardian confirmed' : 'Under 18 · waiting for guardian', u.guardian_consent ? 'good' : 'warn') : '') + '<div class="small muted">' + L.esc(u.email) + (u.is_minor ? ' · guardian: ' + L.esc(u.guardian_email) : '') + '</div><div class="chips">' + u.roles.map(function (r) { return L.badge(r.replace('_', ' ')); }).join('') + '</div></div>' +
            '<div class="chips">' + (u.is_minor && !u.guardian_consent ? '<button class="btn small" data-act="consent" data-id="' + L.esc(u.user_id) + '">Guardian confirmed</button>' : '') +
            '<button class="btn ghost small" data-act="mk-creator" data-id="' + L.esc(u.user_id) + '" data-has="' + (u.roles.indexOf('course_creator') > -1) + '">' + (u.roles.indexOf('course_creator') > -1 ? 'Remove course creator' : 'Make course creator') + '</button>' +
            '<button class="btn ' + (u.status === 'suspended' ? '' : 'danger') + ' small" data-act="set-status" data-id="' + L.esc(u.user_id) + '" data-s="' + (u.status === 'suspended' ? 'active' : 'suspended') + '">' + (u.status === 'suspended' ? 'Restore' : 'Pause') + '</button></div></li>';
        }).join('') + '</ul></div>';
    } else if (tab === 'safety') {
      var rs = (await L.api('admin.reports')).reports;
      h += '<div class="card"><h3>Safety reports</h3>' + (rs.length ? '<ul class="list">' + rs.map(function (r) {
        return '<li><div class="grow"><b>' + L.esc(r.reporter_name) + '</b> reported a ' + L.esc(r.subject_type) + '<p class="small pre">' + L.esc(r.reason) + '</p><div class="small muted">' + L.esc(L.fmtDate(r.created_at, true)) + '</div></div>' + L.statusBadge(r.status) +
          (r.status === 'open' || r.status === 'reviewing' ? '<div class="chips"><button class="btn small" data-act="report-do" data-id="' + L.esc(r.report_id) + '" data-s="actioned">Actioned</button><button class="btn ghost small" data-act="report-do" data-id="' + L.esc(r.report_id) + '" data-s="reviewing">Reviewing</button><button class="btn ghost small" data-act="report-do" data-id="' + L.esc(r.report_id) + '" data-s="dismissed">Dismiss</button></div>' : '') + '</li>';
      }).join('') + '</ul>' : '<p class="muted">No reports.</p>') + '</div>';
    } else if (tab === 'learning') {
      var ps = (await L.api('admin.programmes')).programmes;
      h += '<div class="card"><div class="row"><h3>Programmes</h3><a class="btn small" href="#/create">Open Learning Studio</a></div><ul class="list">' + ps.map(function (p) { return '<li><div class="grow"><b>' + L.esc(p.title) + '</b><div class="small muted">' + L.esc(p.access_type) + ' · ' + L.esc(p.learners) + ' learners</div></div>' + L.statusBadge(p.status) + '<a class="btn ghost small" href="#/create/' + L.esc(p.programme_id) + '">Edit</a></li>'; }).join('') + '</ul></div>' +
        '<div class="card"><h3>Give someone access</h3><p class="small muted">For sponsored and scholarship programmes. Find the member in Members, then use their email here.</p><form data-form="grant"><div class="grid2">' +
        L.field('gp', 'Programme', { type: 'select', options: ps.map(function (p) { return [p.programme_id, p.title]; }) }).replace('name="gp"', 'name="programme_id"') + L.field('ge', 'Member email', { type: 'email', required: true }).replace('name="ge"', 'name="email"') + '</div><button class="btn" type="submit">Give access</button></form></div>';
    } else if (tab === 'followups') {
      var fu = await L.api('admin.followups');
      h += '<div class="card"><div class="grid3"><div class="stat"><b>' + L.esc(fu.scheduled) + '</b><span>scheduled</span></div><div class="stat"><b>' + L.esc(fu.sent) + '</b><span>waiting for an answer</span></div><div class="stat"><b>' + L.esc(fu.answered) + '</b><span>answered</span></div></div></div>' +
        '<div class="card"><h3>Members who said they need help</h3>' + (fu.need_help.length ? '<ul class="list">' + fu.need_help.map(function (n) { return '<li><div class="grow"><b>' + L.esc(n.member) + '</b><div class="small muted">' + L.esc(n.goal) + '</div></div><span class="small muted">' + L.esc(L.fmtDate(n.answered_at)) + '</span></li>'; }).join('') + '</ul><p class="small muted">Consider a personal message or a mentor match.</p>' : '<p class="muted">No one is waiting for help.</p>') + '</div>';
    } else if (tab === 'settings') {
      var st = (await L.api('admin.settings')).settings;
      h += '<div class="card"><h3>Settings</h3><ul class="list">' + st.map(function (x) {
        return '<li><form data-form="setting" class="row" style="flex-wrap:nowrap;width:100%"><input type="hidden" name="setting_key" value="' + L.esc(x.setting_key) + '"><div class="grow"><label class="small muted" for="s_' + L.esc(x.setting_key) + '">' + L.esc(x.setting_key) + '</label><input id="s_' + L.esc(x.setting_key) + '" name="setting_value" value="' + L.esc(x.setting_value) + '"><span class="hint">' + L.esc(x.notes) + '</span></div><button class="btn ghost small" type="submit">Save</button></form></li>';
      }).join('') + '</ul></div>';
    } else {
      var au = (await L.api('admin.audit')).items;
      h += '<div class="card"><h3>Audit log</h3><div class="tablewrap"><table><thead><tr><th>When</th><th>Action</th><th>On</th><th>Details</th></tr></thead><tbody>' + au.map(function (a) { return '<tr><td>' + L.esc(L.fmtDate(a.at, true)) + '</td><td>' + L.esc(a.action) + '</td><td>' + L.esc(a.entity) + '</td><td class="small muted">' + L.esc(a.details) + '</td></tr>'; }).join('') + '</tbody></table></div></div>';
    }
    L.render(h);
  }
  L.route(/^#\/admin(?:\/(\w+))?(?:\/([\w-]+))?$/, admin);

  L.onForm('decide', async function (f, e) {
    var btn = e.submitter, v = L.formData(f);
    var r = await L.safe(btn, function () { return L.api('admin.verificationDecide', { verification_id: v.verification_id, decision: btn.value, notes: v.notes }); });
    if (r) { L.toast('Decision saved and recorded.'); location.hash = '#/admin/verification'; }
  });
  L.on('verif-all', async function (t) {
    var items = (await L.safe(t, function () { return L.api('admin.verificationQueue', { status: 'all' }); }) || {}).items || [];
    document.getElementById('allv').innerHTML = '<ul class="list">' + items.map(function (v) { return '<li><div class="grow"><b>' + L.esc(v.name) + '</b></div>' + L.statusBadge(v.status) + '<a class="btn ghost small" href="#/admin/verification/' + L.esc(v.verification_id) + '">Open</a></li>'; }).join('') + '</ul>';
  });
  L.onForm('members-search', function (f) { members.q = L.formData(f).q; admin([0, 'members']); });
  L.on('consent', async function (t) { var r = await L.safe(t, function () { return L.api('admin.guardianConsent', { user_id: t.dataset.id, consent: true, note: 'Confirmed with parent or guardian' }); }); if (r) { L.toast('Guardian consent recorded.'); admin([0, 'members']); } });
  L.on('set-status', async function (t) { var r = await L.safe(t, function () { return L.api('admin.setStatus', { user_id: t.dataset.id, status: t.dataset.s }); }); if (r) admin([0, 'members']); });
  L.on('mk-creator', async function (t) { var r = await L.safe(t, function () { return L.api('admin.setRole', { user_id: t.dataset.id, role_key: 'course_creator', grant: t.dataset.has !== 'true' }); }); if (r) admin([0, 'members']); });
  L.on('report-do', async function (t) { var r = await L.safe(t, function () { return L.api('admin.handleReport', { report_id: t.dataset.id, status: t.dataset.s }); }); if (r) admin([0, 'safety']); });
  L.onForm('setting', async function (f) { var r = await L.safe(f.querySelector('button'), function () { return L.api('admin.saveSetting', L.formData(f)); }); if (r) L.toast('Setting saved.'); });
  L.onForm('grant', async function (f) {
    var v = L.formData(f);
    var ms = await L.safe(null, function () { return L.api('admin.members', { q: v.email }); });
    var u = ms && ms.members.filter(function (x) { return x.email === v.email.trim().toLowerCase(); })[0];
    if (!u) { L.toast('No member with that email.', true); return; }
    var r = await L.safe(f.querySelector('button'), function () { return L.api('admin.grantAccess', { user_id: u.user_id, programme_id: v.programme_id }); });
    if (r) { L.toast('Access given.'); f.reset(); }
  });
})(window.LDF);
