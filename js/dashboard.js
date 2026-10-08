/* Member dashboard. Goal first, then what to do next. */
(function (L) {
  var d;
  function goalForm(title) {
    return '<form data-form="goal-new">' + L.field('title', title || 'What would you like to achieve?', { required: true, placeholder: 'For example: improve my English communication' }) +
      L.field('category', 'Type of goal', { type: 'select', options: ['Learning', 'Career', 'Language', 'Confidence', 'Skills', 'Other'] }) +
      '<button class="btn" type="submit">Set my goal</button></form>';
  }
  async function home() {
    L.loading();
    d = await L.api('me.dashboard');
    var goal = d.goal;
    var h = '<div class="hello"><h1>Welcome back, ' + L.esc(d.name) + '</h1><p class="muted">Learn something. Share something. Help someone.</p></div>';

    h += goal
      ? '<div class="card hero"><span class="eyebrow">Your current goal</span><h2>' + L.esc(goal.title) + '</h2>' + L.bar(goal.progress_pct) +
        '<div class="row small"><span>' + L.esc(goal.progress_pct) + '% there</span><span><button class="btn light small" data-act="goal-edit">Update progress</button></span></div>' +
        '<form data-form="goal-progress" id="goalProgress" hidden><label class="small" for="pct">How far along are you?</label><input id="pct" name="progress_pct" type="range" min="0" max="100" step="5" value="' + L.esc(goal.progress_pct) + '"><input type="hidden" name="goal_id" value="' + L.esc(goal.goal_id) + '"><div class="row"><button class="btn light small" type="submit">Save</button><button class="btn light small" type="button" data-act="goal-done" data-id="' + L.esc(goal.goal_id) + '">I achieved this</button></div></form></div>'
      : '<div class="card"><span class="eyebrow">Your goal</span><h2>Start with one goal</h2><p class="muted">LDF will check in on how it is going and help with the next step.</p>' + goalForm() + '</div>';

    if (d.checkin) {
      h += '<div class="card" id="checkin"><span class="eyebrow">LDF is checking in</span><h3>How are you getting on with your goal?</h3><p class="small muted">' + L.esc(d.checkin.goal_title) + '</p>' +
        '<div class="choices"><button class="choice" data-act="checkin" data-r="well" data-id="' + L.esc(d.checkin.followup_id) + '">' + L.icon.well + 'Doing well</button>' +
        '<button class="choice" data-act="checkin" data-r="help" data-id="' + L.esc(d.checkin.followup_id) + '">' + L.icon.help + 'Need help</button>' +
        '<button class="choice" data-act="checkin" data-r="achieved" data-id="' + L.esc(d.checkin.followup_id) + '">' + L.icon.goal + 'Goal achieved</button></div><div id="checkinReply"></div></div>';
    }
    if (d.continue) {
      h += '<div class="card"><span class="eyebrow">Continue learning</span><div class="row"><div class="grow"><h3>' + L.esc(d.continue.programme_title) + '</h3><p class="muted">' + L.esc(d.continue.module_title) + ' · ' + L.esc(d.continue.lesson_title) + '</p></div><a class="btn" href="#/lesson/' + L.esc(d.continue.lesson_id) + '">Continue</a></div></div>';
    }
    h += '<div class="card"><div class="row"><div><span class="eyebrow">My Knowledge Share</span><h3>' + (d.upcoming_sessions.length ? d.upcoming_sessions.length + ' upcoming session' + (d.upcoming_sessions.length > 1 ? 's' : '') : 'No sessions booked yet') + '</h3></div><a class="btn ghost" href="#/share">' + (d.upcoming_sessions.length ? 'View' : 'Find help') + '</a></div>';
    if (d.upcoming_sessions.length) h += '<ul class="list">' + d.upcoming_sessions.map(function (s) { return '<li><div class="grow"><b>' + L.esc(s.title) + '</b><div class="small muted">' + L.esc(L.fmtDate(s.start_at, true)) + ' · Online · ' + (s.role === 'contributor' ? 'Helping' : 'Learning') + '</div></div></li>'; }).join('') + '</ul>';
    h += '</div>';

    h += '<div class="card"><span class="eyebrow">Your progress</span><div class="grid2">' +
      '<div class="stat"><b>' + L.esc(d.stats.learning_hours) + '</b><span>learning hours</span></div><div class="stat"><b>' + L.esc(d.stats.skills) + '</b><span>skills developed</span></div>' +
      '<div class="stat"><b>' + L.esc(d.stats.goals_completed) + '</b><span>goals completed</span></div><div class="stat"><b>' + L.esc(d.stats.people_helped) + '</b><span>people helped</span></div></div></div>';

    var rp = d.recommended.programmes, rc = d.recommended.contributors;
    if (rp.length || rc.length) {
      h += '<div class="card"><span class="eyebrow">Recommended for you</span><ul class="list">' +
        rp.map(function (p) { return '<li><div class="grow"><b>' + L.esc(p.title) + '</b><div class="small muted">Course · ' + L.esc(p.level) + (p.duration_hours ? ' · ' + L.esc(p.duration_hours) + ' h' : '') + '</div></div><a class="btn ghost small" href="#/learn/' + L.esc(p.programme_id) + '">Open</a></li>'; }).join('') +
        rc.map(function (c) { return '<li><div class="grow"><b>' + L.esc(c.name) + '</b><div class="small muted">LDF Verified · ' + L.esc(c.headline) + '</div></div><a class="btn ghost small" href="#/share">See</a></li>'; }).join('') + '</ul></div>';
    }
    L.render(h);
    var b = document.getElementById('bellCount'); b.textContent = d.unread; b.hidden = !d.unread;
  }
  L.route(/^#\/(home)?$/, home);

  L.on('goal-edit', function () { var f = document.getElementById('goalProgress'); f.hidden = !f.hidden; });
  L.onForm('goal-progress', async function (f) {
    var v = L.formData(f);
    await L.safe(f.querySelector('button'), async function () { await L.api('goals.save', { goal_id: v.goal_id, progress_pct: Number(v.progress_pct) }); L.toast('Progress saved.'); home(); });
  });
  L.onForm('goal-new', async function (f) {
    await L.safe(f.querySelector('button'), async function () { await L.api('goals.save', L.formData(f)); L.toast('Goal set. LDF will check in on how it is going.'); home(); });
  });
  L.on('goal-done', async function (t) {
    await L.safe(t, async function () { await L.api('goals.complete', { goal_id: t.dataset.id }); L.toast('Well done. What would you like to achieve next?'); home(); });
  });
  L.on('checkin', async function (t) {
    var box = document.getElementById('checkinReply');
    var r = await L.safe(t, function () { return L.api('followups.answer', { followup_id: t.dataset.id, response: t.dataset.r }); });
    if (!r) return;
    var h = '<div class="callout">' + L.icon.shield + '<div class="stack"><p>' + L.esc(r.message) + '</p>';
    if (r.offers && r.offers.length) h += '<div class="chips">' + r.offers.map(function (o) { return '<a class="chip" href="' + L.esc(o.link) + '">' + L.esc(o.label) + '</a>'; }).join('') + '</div>';
    if (r.ask_next_goal) h += goalForm('What is your next goal?');
    h += '</div></div>';
    box.innerHTML = h;
  });
})(window.LDF);
