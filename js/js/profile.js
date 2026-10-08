/* My LDF Journey and My LDF Profile. Everything attached to the person. */
(function (L) {
  async function journey() {
    L.loading();
    var r = await Promise.all([L.api('journey.get'), L.api('goals.list')]);
    var j = r[0], goals = r[1].goals;
    var active = goals.filter(function (g) { return g.status === 'active'; })[0];
    var first = L.session.user && L.session.user.created_at;
    var h = '<div class="hello"><h1>My LDF Journey</h1><p class="muted">Where you started, where you are, where you are going.</p></div>' +
      '<div class="card hero"><div class="grid3"><div><span class="eyebrow">Started</span><p><b>' + L.esc(first ? L.fmtMonth(first) : 'Joined LDF') + '</b></p></div><div><span class="eyebrow">Now</span><p><b>' + L.esc(active ? active.title : 'Set a goal') + '</b></p></div><div><span class="eyebrow">Going</span><p><b>' + L.esc(goals.length > 1 ? 'Your next goal' : 'Your next step') + '</b></p></div></div></div>' +
      '<div class="card"><h3>Goals</h3>' + (goals.length ? '<ul class="list">' + goals.map(function (g) { return '<li><div class="grow"><b>' + L.esc(g.title) + '</b><div class="small muted">' + L.esc(g.category) + '</div></div>' + (g.status === 'achieved' ? L.badge('Achieved', 'good') : L.badge(g.progress_pct + '%', '')) + '</li>'; }).join('') + '</ul>' : '<p class="muted">No goals yet.</p>') +
      '<form data-form="goal-add" class="row"><div class="grow">' + L.field('gtitle', 'New goal', { required: true, placeholder: 'What would you like to achieve?' }).replace('name="gtitle"', 'name="title"') + '</div><button class="btn" type="submit">Add</button></form></div>' +
      '<div class="card"><h3>Timeline</h3>' + (j.timeline.length ? '<ul class="timeline">' + j.timeline.map(function (t) { return '<li><span class="small muted">' + L.esc(L.fmtMonth(t.at)) + '</span><b>' + L.esc(t.title) + '</b><span class="badge ' + (t.kind === 'Contribution' ? 'warn' : t.kind === 'LDF Certificate' ? 'good' : 'plain') + '">' + L.esc(t.kind) + '</span></li>'; }).join('') + '<li class="next"><span class="small muted">Next</span><b>' + L.esc(active ? 'Keep going with: ' + active.title : 'Choose your next goal') + '</b></li></ul>' : '<p class="muted">Your journey starts here.</p>') + '</div>' +
      '<div class="card"><h3>Skills</h3><div class="chips">' + (j.skills.map(function (s) { return '<span class="chip">' + L.esc(s.skill_name) + ' <button class="linkbtn small" data-act="skill-del" data-id="' + L.esc(s.skill_id) + '" aria-label="Remove ' + L.esc(s.skill_name) + '">&times;</button></span>'; }).join('') || '<span class="muted">No skills added yet.</span>') + '</div>' +
      '<form data-form="skill-add" class="row"><div class="grow">' + L.field('sname', 'Add a skill', { required: true, placeholder: 'Public speaking' }).replace('name="sname"', 'name="skill_name"') + '</div><button class="btn ghost" type="submit">Add</button></form></div>' +
      '<div class="card"><h3>Education</h3>' + (j.education.length ? '<ul class="list">' + j.education.map(function (e) { return '<li><div class="grow"><b>' + L.esc(e.institution) + '</b><div class="small muted">' + L.esc(e.level) + ' ' + L.esc(e.field) + ' ' + L.esc(e.end_year) + '</div></div><button class="linkbtn small" data-act="edu-del" data-id="' + L.esc(e.education_id) + '">Remove</button></li>'; }).join('') + '</ul>' : '') +
      '<form data-form="edu-add"><div class="grid2">' + L.field('einst', 'School or institution', { required: true }).replace('name="einst"', 'name="institution"') + L.field('elevel', 'Level', { placeholder: 'O/L, A/L, Diploma' }).replace('name="elevel"', 'name="level"') + L.field('efield', 'Subject or field').replace('name="efield"', 'name="field"') + L.field('eyear', 'Year finished', { type: 'number' }).replace('name="eyear"', 'name="end_year"') + '</div><button class="btn ghost" type="submit">Add education</button></form></div>';
    L.render(h);
  }
  L.route(/^#\/journey$/, journey);
  L.onForm('goal-add', async function (f) { var r = await L.safe(f.querySelector('button'), function () { return L.api('goals.save', L.formData(f)); }); if (r) { L.toast('Goal added.'); journey(); } });
  L.onForm('skill-add', async function (f) { var r = await L.safe(f.querySelector('button'), function () { return L.api('skills.add', L.formData(f)); }); if (r) journey(); });
  L.on('skill-del', async function (t) { var r = await L.safe(t, function () { return L.api('skills.remove', { skill_id: t.dataset.id }); }); if (r) journey(); });
  L.onForm('edu-add', async function (f) { var r = await L.safe(f.querySelector('button'), function () { return L.api('education.add', L.formData(f)); }); if (r) journey(); });
  L.on('edu-del', async function (t) { var r = await L.safe(t, function () { return L.api('education.remove', { education_id: t.dataset.id }); }); if (r) journey(); });

  async function profile() {
    L.loading();
    var d = await L.api('profile.get');
    var p = d.profile, cats = ['LDF Certificate', 'External Qualification', 'Achievement', 'Experience', 'Contribution'];
    var h = '<div class="hello"><h1>My LDF Profile</h1><p class="muted">' + L.esc(d.user.email) + '</p></div>' +
      '<div class="chips">' + d.roles.map(function (r) { return L.badge(r.replace('_', ' '), r === 'contributor' ? 'good' : ''); }).join('') + '</div>' +
      '<div class="card"><h3>About me</h3><form data-form="profile-save">' + L.field('full_name', 'Full name', { value: d.user.full_name }) + L.field('display_name', 'Name shown to others', { value: p.display_name }) + L.field('phone', 'Phone', { type: 'tel', value: d.user.phone }) +
      L.field('bio', 'About me', { type: 'textarea', value: p.bio }) + '<div class="grid2">' + L.field('district', 'District', { value: p.district }) + L.field('languages', 'Languages', { value: p.languages }) + '</div>' + L.field('career_interests', 'Career interests', { value: p.career_interests }) +
      L.field('privacy_level', 'Who can see my profile', { type: 'select', value: p.privacy_level, options: [['private', 'Only me'], ['ldf_only', 'LDF and people I learn or teach with'], ['public', 'Anyone in the LDF community']] }) +
      '<button class="btn" type="submit">Save profile</button></form></div>' +
      '<div class="card"><h3>Certificates and recognition</h3><p class="small muted">Each kind is kept separate so your profile is always accurate.</p>' +
      cats.map(function (c) {
        var items = d.certificates.filter(function (x) { return x.category === c; });
        return '<div><h4>' + L.esc(c) + '</h4>' + (items.length ? '<ul class="list">' + items.map(function (x) { return '<li><div class="grow"><b>' + L.esc(x.title) + '</b><div class="small muted">' + L.esc(x.issuer) + ' · ' + L.esc(L.fmtMonth(x.issued_at)) + (x.verification_code ? ' · ' + L.esc(x.verification_code) : '') + '</div></div></li>'; }).join('') + '</ul>' : '<p class="small muted">None yet.</p>') + '</div>';
      }).join('') +
      '<div><h4>Achievements</h4>' + (d.achievements.length ? '<div class="chips">' + d.achievements.map(function (a) { return '<span class="badge good">' + L.esc(a.title) + '</span>'; }).join('') + '</div>' : '<p class="small muted">Achievements appear as you make real progress.</p>') + '</div></div>' +
      '<div class="card"><h3>Password</h3><form data-form="pw">' + L.field('old_password', 'Current password', { type: 'password', required: true, autocomplete: 'current-password' }) + L.field('new_password', 'New password', { type: 'password', required: true, autocomplete: 'new-password' }) + '<button class="btn ghost" type="submit">Change password</button></form></div>' +
      '<button class="btn danger" data-act="logout">Sign out</button>';
    L.render(h);
  }
  L.route(/^#\/profile$/, profile);
  L.onForm('profile-save', async function (f) {
    var r = await L.safe(f.querySelector('button'), function () { return L.api('profile.save', L.formData(f)); });
    if (r) { L.session.user = r.user; L.session.profile = r.profile; L.saveSession(); L.toast('Profile saved.'); }
  });
  L.onForm('pw', async function (f) {
    var r = await L.safe(f.querySelector('button'), function () { return L.api('auth.changePassword', L.formData(f)); });
    if (r) { L.session.token = r.token; L.saveSession(); L.toast('Password changed.'); f.reset(); }
  });
})(window.LDF);
