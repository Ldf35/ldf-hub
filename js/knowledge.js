/* Knowledge Share (learner side): find a contributor, request a session, join, review, apply to share. */
(function (L) {
  function nav(cur) {
    return '<div class="subtabs">' + [['find', 'Find help', '#/share'], ['mine', 'My sessions', '#/share/sessions'], ['apply', 'Share your knowledge', '#/share/apply']].map(function (x) {
      return '<a class="subtab" href="' + x[2] + '" ' + (cur === x[0] ? 'aria-current="page"' : '') + '>' + x[1] + '</a>';
    }).join('') + '</div>';
  }
  var safe = '<div class="callout">' + L.icon.shield + '<p>Sessions are online. Every contributor is reviewed by LDF before they are listed. Learners under 18 need a parent or guardian to confirm first. If anything feels wrong, use Report a concern.</p></div>';

  var last = { q: '', subject: '', level: '', language: '' };
  async function find() {
    L.loading();
    var res = (await L.api('ks.search', last)).contributors;
    var h = '<div class="hello"><h1>What would you like to learn?</h1><p class="muted">Find an LDF Verified contributor and ask for an online session.</p></div>' + nav('find') +
      '<div class="card"><form data-form="ks-search"><div class="grid2">' + L.field('subject', 'Subject', { value: last.subject, placeholder: 'Mathematics' }) + L.field('level', 'Level', { value: last.level, placeholder: 'Grade 8' }) +
      L.field('language', 'Language', { value: last.language, placeholder: 'Sinhala' }) + L.field('q', 'Anything else', { value: last.q, placeholder: 'Algebra' }) + '</div><button class="btn" type="submit">Search</button></form></div>' +
      (res.length ? res.map(card).join('') : '<div class="card"><h3>No contributors match yet</h3><p class="muted">Try fewer words, or ask LDF by sharing what you need from the Journey tab. New contributors join every week.</p></div>') + safe;
    L.render(h);
  }
  function card(c) {
    return '<div class="card"><span class="badge good">LDF Verified Knowledge Contributor</span><div><h3>' + L.esc(c.subjects) + ' · ' + L.esc(c.levels) + '</h3><p class="muted">' + L.esc(c.display_name) + ' · ' + L.esc(c.headline) + '</p></div>' +
      '<div class="grid2 small"><div><div class="muted">Feedback</div><b>' + (c.rating_count ? L.esc(c.rating_avg) + ' from ' + L.esc(c.rating_count) + ' learner' + (c.rating_count > 1 ? 's' : '') : 'New contributor') + '</b></div><div><div class="muted">Experience</div><b>' + L.esc(c.experience_years) + ' years</b></div>' +
      '<div><div class="muted">Languages</div><b>' + L.esc(c.languages) + '</b></div><div><div class="muted">Availability</div><b>' + L.esc(c.availability_text) + '</b></div>' +
      '<div><div class="muted">Format</div><b>Online</b></div><div><div class="muted">Contribution</div><b>' + L.esc(c.contribution_type) + '</b></div></div>' +
      (c.classes.length ? '<ul class="list">' + c.classes.map(function (k) { return '<li><div class="grow"><b>' + L.esc(k.title) + '</b><div class="small muted">' + L.esc(k.session_minutes) + ' min · up to ' + L.esc(k.max_group_size) + ' learner' + (k.max_group_size > 1 ? 's' : '') + '</div></div><button class="btn small" data-act="req-open" data-cid="' + L.esc(c.contributor_id) + '" data-kid="' + L.esc(k.class_id) + '">Request session</button></li>'; }).join('') + '</ul>'
        : '<button class="btn" data-act="req-open" data-cid="' + L.esc(c.contributor_id) + '" data-kid="">Request session</button>') +
      '<div id="req-' + L.esc(c.contributor_id) + '"></div><button class="linkbtn small" data-act="report-open" data-cid="' + L.esc(c.contributor_id) + '">Report a concern</button></div>';
  }
  L.route(/^#\/share$/, find);
  L.onForm('ks-search', function (f) { last = L.formData(f); find(); });
  L.on('req-open', function (t) {
    var box = document.getElementById('req-' + t.dataset.cid);
    box.innerHTML = '<form data-form="req-send"><input type="hidden" name="contributor_id" value="' + L.esc(t.dataset.cid) + '"><input type="hidden" name="class_id" value="' + L.esc(t.dataset.kid) + '">' +
      L.field('message', 'What would you like help with?', { type: 'textarea', required: true }) + L.field('preferred_time', 'When suits you?', { placeholder: 'Saturday morning' }) + '<button class="btn" type="submit">Send request</button></form>';
    box.querySelector('textarea').focus();
  });
  L.onForm('req-send', async function (f) {
    var r = await L.safe(f.querySelector('button'), function () { return L.api('ks.requestSession', L.formData(f)); });
    if (r) { L.toast('Request sent. You will be notified when it is confirmed.'); f.parentNode.innerHTML = '<p class="badge good">Request sent</p>'; }
  });
  L.on('report-open', function (t) {
    var box = document.getElementById('req-' + t.dataset.cid);
    box.innerHTML = '<form data-form="report-send"><input type="hidden" name="subject_id" value="' + L.esc(t.dataset.cid) + '">' + L.field('reason', 'What happened?', { type: 'textarea', required: true, hint: 'LDF reviews every report. If someone is in danger, contact a trusted adult or the emergency services first.' }) + '<button class="btn danger" type="submit">Send report to LDF</button></form>';
  });
  L.onForm('report-send', async function (f) {
    var v = L.formData(f);
    var r = await L.safe(f.querySelector('button'), function () { return L.api('ks.report', { subject_type: 'contributor', subject_id: v.subject_id, reason: v.reason }); });
    if (r) { L.toast('Thank you. LDF will look into this.'); f.parentNode.innerHTML = '<p class="badge good">Report sent</p>'; }
  });

  async function sessions() {
    L.loading();
    var r = await Promise.all([L.api('ks.mySessions'), L.api('ks.myRequests')]);
    var ss = r[0].sessions, rq = r[1].requests;
    var h = '<div class="hello"><h1>My sessions</h1></div>' + nav('mine') +
      '<div class="card"><h3>Sessions</h3>' + (ss.length ? '<ul class="list">' + ss.map(function (s) {
        return '<li><div class="grow"><b>' + L.esc(s.title) + '</b><div class="small muted">' + L.esc(L.fmtDate(s.start_at, true)) + ' · with ' + L.esc(s.with) + ' · ' + (s.role === 'contributor' ? 'You are helping' : 'You are learning') + '</div></div>' +
          '<div class="chips">' + L.statusBadge(s.status) +
          (s.status === 'scheduled' && s.meeting_link ? '<a class="btn small" href="' + L.esc(s.meeting_link) + '" target="_blank" rel="noopener">Join session</a><button class="btn ghost small" data-act="cancel-session" data-id="' + L.esc(s.session_id) + '">Cancel</button>' : '') +
          (s.status === 'completed' && s.role === 'learner' && !s.reviewed ? '<button class="btn ghost small" data-act="review-open" data-id="' + L.esc(s.session_id) + '">Leave a review</button>' : '') + '</div>' +
          '<div id="rv-' + L.esc(s.session_id) + '" style="flex-basis:100%"></div></li>';
      }).join('') + '</ul>' : '<p class="muted">No sessions yet. Find a contributor to get started.</p>') + '</div>' +
      '<div class="card"><h3>My requests</h3>' + (rq.length ? '<ul class="list">' + rq.map(function (q) {
        return '<li><div class="grow"><b>' + L.esc(q.subject || 'Session request') + '</b><div class="small muted">With ' + L.esc(q.contributor_name) + ' · ' + L.esc(L.fmtDate(q.created_at)) + '</div></div>' + L.statusBadge(q.status) + '</li>';
      }).join('') + '</ul>' : '<p class="muted">No requests yet.</p>') + '</div>';
    L.render(h);
  }
  L.route(/^#\/share\/sessions$/, sessions);
  L.on('cancel-session', async function (t) {
    var r = await L.safe(t, function () { return L.api('ks.cancelSession', { session_id: t.dataset.id }); });
    if (r) { L.toast('Session cancelled.'); sessions(); }
  });
  L.on('review-open', function (t) {
    document.getElementById('rv-' + t.dataset.id).innerHTML = '<form data-form="review-send"><input type="hidden" name="session_id" value="' + L.esc(t.dataset.id) + '">' +
      L.field('rating', 'How was it?', { type: 'select', options: [['5', '5 · Excellent'], ['4', '4 · Good'], ['3', '3 · Okay'], ['2', '2 · Poor'], ['1', '1 · Not good']] }) + L.field('comment', 'Anything to add?', { type: 'textarea' }) + '<button class="btn" type="submit">Send review</button></form>';
  });
  L.onForm('review-send', async function (f) {
    var r = await L.safe(f.querySelector('button'), function () { return L.api('ks.review', L.formData(f)); });
    if (r) { L.toast('Thank you for your review.'); sessions(); }
  });

  async function apply() {
    L.loading();
    var s = await L.api('contrib.status');
    var h = '<div class="hello"><h1>Share your knowledge</h1><p class="muted">Everyone has something to share. Teach what you know, as a volunteer for now.</p></div>' + nav('apply');
    if (!s.applied && s.is_adult === false) h += '<div class="card"><p>Becoming a contributor is for members aged 18 and over. You can still learn, and you can help others when you are older.</p></div>';
    else if (s.applied && s.status !== 'more_info' && s.status !== 'rejected') {
      h += '<div class="card"><h3>Your application</h3>' + L.statusBadge(s.status) + '<p class="muted">' + (s.status === 'verified' ? 'You are LDF Verified. Open your Knowledge Studio to create classes.' : 'LDF is reviewing your application. We will notify you.') + '</p>' + (s.status === 'verified' ? '<a class="btn" href="#/studio">Open Knowledge Studio</a>' : '') + '</div>';
    } else {
      var c = s.contributor || {};
      if (s.applied) h += '<div class="callout warn"><p><b>LDF says:</b> ' + L.esc(s.notes || '') + '</p></div>';
      h += '<div class="card"><h3>' + (s.applied ? 'Update your application' : 'Apply to become a contributor') + '</h3><form data-form="apply">' +
        L.field('headline', 'In one line, what can you help with?', { value: c.headline, required: true, placeholder: 'Maths tutor for school students' }) +
        L.field('subjects', 'Subjects or skills', { value: c.subjects, required: true, placeholder: 'Mathematics, Science' }) + L.field('levels', 'Levels', { value: c.levels, placeholder: 'Grade 6 to 9' }) +
        L.field('languages', 'Languages you can teach in', { value: c.languages, placeholder: 'Sinhala, English' }) + L.field('experience_years', 'Years of experience', { type: 'number', min: 0, max: 60, value: c.experience_years }) +
        L.field('qualifications', 'Qualifications', { type: 'textarea', value: c.qualifications }) + L.field('availability_text', 'When are you available?', { value: c.availability_text, placeholder: 'Saturdays' }) +
        L.field('volunteer_offer', 'How much time can you give?', { type: 'select', value: c.volunteer_offer, options: ['1 hour a week', '2 hours a month', 'One-off session', 'Group class', 'Mentoring', 'Subject support'] }) +
        L.field('evidence_url', 'Link to supporting evidence (optional)', { type: 'url', hint: 'A certificate, CV or profile. Only LDF reviewers see this.' }) +
        '<button class="btn" type="submit">Send to LDF</button></form></div>';
    }
    h += '<div class="card soft"><h3>"I do not want money. I want to help."</h3><p class="muted">Tell LDF what you can offer and we will connect you with someone who needs it.</p><button class="btn ghost" data-act="volunteer">I want to volunteer</button></div>';
    L.render(h);
  }
  L.route(/^#\/share\/apply$/, apply);
  L.onForm('apply', async function (f) {
    var r = await L.safe(f.querySelector('button'), function () { return L.api('contrib.apply', L.formData(f)); });
    if (r) { L.toast('Application sent. LDF will review it.'); apply(); }
  });
  L.on('volunteer', async function (t) {
    var r = await L.safe(t, function () { return L.api('ks.volunteerOffer', { offer_type: '1 hour a week', subjects: '' }); });
    if (r) L.toast('Thank you. LDF will be in touch about how you can help.');
  });
})(window.LDF);
