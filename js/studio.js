/* LDF Learning Studio (course creators and admins) and Knowledge Studio (verified contributors). */
(function (L) {
  /* ================= LEARNING STUDIO ================= */
  async function createList() {
    L.loading();
    var list = (await L.api('studio.list')).programmes;
    L.render('<div class="hello"><h1>LDF Learning Studio</h1><p class="muted">Create programmes, modules and lessons. Publish when ready and they appear in the catalogue.</p></div>' +
      '<div class="card"><h3>+ Create programme</h3><form data-form="prog-new">' + L.field('title', 'Programme name', { required: true, placeholder: 'Build Your Independence' }) + '<button class="btn" type="submit">Create</button></form></div>' +
      '<div class="card"><h3>Your programmes</h3>' + (list.length ? '<ul class="list">' + list.map(function (p) {
        return '<li><div class="grow"><b>' + L.esc(p.title) + '</b><div class="small muted">' + L.esc(p.modules) + ' modules · ' + L.esc(p.lessons) + ' lessons · ' + L.esc(p.learners) + ' learners</div></div>' + L.statusBadge(p.status) + '<a class="btn ghost small" href="#/create/' + L.esc(p.programme_id) + '">Edit</a></li>';
      }).join('') + '</ul>' : '<p class="muted">Nothing yet. Create your first programme above.</p>') + '</div>');
  }
  L.route(/^#\/create$/, createList);
  L.onForm('prog-new', async function (f) {
    var r = await L.safe(f.querySelector('button'), function () { return L.api('studio.saveProgramme', L.formData(f)); });
    if (r) location.hash = '#/create/' + r.programme.programme_id;
  });

  var qCount = 0;
  function qBlock(q, i) {
    q = q || {};
    var n = qCount++;
    return '<fieldset class="card soft" data-q="1"><legend class="small muted">Question ' + (i + 1) + '</legend>' +
      L.field('qt' + n, 'Question', { value: q.question_text }) +
      '<div class="grid2">' + ['a', 'b', 'c', 'd'].map(function (k) { return L.field('qo' + k + n, 'Option ' + k.toUpperCase(), { value: q['option_' + k] }); }).join('') + '</div>' +
      L.field('qk' + n, 'Correct answer', { type: 'select', value: q.correct_option || 'A', options: ['A', 'B', 'C', 'D'] }) + L.field('qe' + n, 'Why (shown after answering)', { value: q.explanation }) + '</fieldset>';
  }
  function lessonForm(prog, mod, l) {
    l = l || {};
    var idp = (l.lesson_id || 'new_' + mod.module_id);
    var qs = (l.questions || []);
    var qhtml = qs.map(function (q, i) { var h = qBlock(q, i); return h; }).join('');
    return '<details class="card soft"><summary><b>' + (l.lesson_id ? L.esc(l.title) : '+ Add lesson') + '</b>' + (l.status ? ' ' + L.statusBadge(l.status) : '') + '</summary>' +
      '<form data-form="lesson-save" class="stack" style="margin-top:12px"><input type="hidden" name="programme_id" value="' + L.esc(prog.programme_id) + '"><input type="hidden" name="module_id" value="' + L.esc(mod.module_id) + '"><input type="hidden" name="lesson_id" value="' + L.esc(l.lesson_id || '') + '">' +
      L.field('title_' + idp, 'Lesson title', { value: l.title, required: true }).replace('name="title_' + idp + '"', 'name="title"') +
      L.field('description_' + idp, 'Short description', { value: l.description }).replace('name="description_' + idp + '"', 'name="description"') +
      L.field('video_' + idp, 'Video link', { type: 'url', value: l.video_url }).replace('name="video_' + idp + '"', 'name="video_url"') +
      L.field('reading_' + idp, 'Reading', { type: 'textarea', value: l.reading_text }).replace('name="reading_' + idp + '"', 'name="reading_text"') +
      L.field('obj_' + idp, 'Learning objectives', { type: 'textarea', value: l.objectives }).replace('name="obj_' + idp + '"', 'name="objectives"') +
      L.field('min_' + idp, 'Estimated minutes', { type: 'number', value: l.est_minutes || 10, min: 1 }).replace('name="min_' + idp + '"', 'name="est_minutes"') +
      L.field('mt_' + idp, 'Mission title', { value: l.mission ? l.mission.title : '' }).replace('name="mt_' + idp + '"', 'name="mission_title"') +
      L.field('mi_' + idp, 'Mission: something to do in real life', { type: 'textarea', value: l.mission ? l.mission.instructions : '' }).replace('name="mi_' + idp + '"', 'name="mission_instructions"') +
      L.field('rp_' + idp, 'Reflection question', { value: l.reflection_prompt }).replace('name="rp_' + idp + '"', 'name="reflection_prompt"') +
      L.field('ai_' + idp, 'AI activity (optional)', { value: l.ai_activity }).replace('name="ai_' + idp + '"', 'name="ai_activity"') +
      '<h4>Quiz (optional)</h4>' + L.field('pm_' + idp, 'Pass mark %', { type: 'number', value: l.quiz ? l.quiz.pass_mark_pct : 60, min: 1, max: 100 }).replace('name="pm_' + idp + '"', 'name="pass_mark"') +
      '<div class="qlist">' + qhtml + '</div><button type="button" class="btn ghost small" data-act="q-add">+ Add question</button>' +
      '<div class="row"><button class="btn" type="submit">Save lesson</button>' + (l.lesson_id ? '<button type="button" class="btn danger small" data-act="lesson-del" data-id="' + L.esc(l.lesson_id) + '" data-pid="' + L.esc(prog.programme_id) + '">Delete</button>' : '') + '</div></form></details>';
  }
  L.on('q-add', function (t) {
    var list = t.parentNode.querySelector('.qlist');
    list.insertAdjacentHTML('beforeend', qBlock({}, list.querySelectorAll('[data-q]').length));
  });
  async function editor(m) {
    L.loading();
    var d = await L.api('studio.get', { programme_id: m[1] });
    var p = d.programme;
    var h = '<a class="small" href="#/create">&larr; All programmes</a><div class="row"><h1>' + L.esc(p.title) + '</h1>' + L.statusBadge(p.status) + '</div>' +
      '<div class="row"><button class="btn ghost" data-act="prog-preview" data-id="' + L.esc(p.programme_id) + '">Preview as student</button>' +
      (p.status === 'published' ? '<button class="btn line" data-act="prog-publish" data-id="' + L.esc(p.programme_id) + '" data-un="1">Unpublish</button>' : '<button class="btn" data-act="prog-publish" data-id="' + L.esc(p.programme_id) + '">Publish</button>') + '</div><div id="preview"></div>' +
      '<div class="card"><h3>Basic information</h3><form data-form="prog-save"><input type="hidden" name="programme_id" value="' + L.esc(p.programme_id) + '">' +
      L.field('title', 'Programme name', { value: p.title, required: true }) + L.field('description', 'Description', { type: 'textarea', value: p.description }) + L.field('cover_image_url', 'Cover image link', { type: 'url', value: p.cover_image_url }) +
      '<div class="grid2">' + L.field('category', 'Category', { value: p.category }) + L.field('level', 'Level', { type: 'select', value: p.level, options: ['Beginner', 'Intermediate', 'Advanced'] }) +
      L.field('language', 'Language', { value: p.language }) + L.field('duration_hours', 'Estimated hours', { type: 'number', value: p.duration_hours, min: 0 }) +
      L.field('access_type', 'Access', { type: 'select', value: p.access_type, options: [['FREE', 'Free'], ['PAID', 'Paid (when payments are on)'], ['SPONSORED', 'Sponsored'], ['SCHOLARSHIP', 'Scholarship']] }) + L.field('price', 'Price', { type: 'number', value: p.price, min: 0 }) + '</div>' +
      '<button class="btn" type="submit">Save details</button></form></div>';
    h += '<div class="card"><h3>Modules and lessons</h3>' + d.modules.map(function (mod, i) {
      return '<div class="module"><div><span class="eyebrow">Module ' + (i + 1) + '</span><h3>' + L.esc(mod.title) + '</h3></div>' + mod.lessons.map(function (l) { return lessonForm(p, mod, l); }).join('') + lessonForm(p, mod) + '</div>';
    }).join('') + '<form data-form="mod-new" class="row"><input type="hidden" name="programme_id" value="' + L.esc(p.programme_id) + '"><div class="grow">' + L.field('mtitle', 'New module name', { required: true, placeholder: 'Module ' + (d.modules.length + 1) + ': Understand Yourself' }).replace('name="mtitle"', 'name="title"') + '</div><button class="btn" type="submit">Add module</button></form></div>';
    L.render(h);
    window._studioData = d;
  }
  L.route(/^#\/create\/([\w-]+)$/, editor);
  L.onForm('prog-save', async function (f) {
    var r = await L.safe(f.querySelector('button'), function () { return L.api('studio.saveProgramme', L.formData(f)); });
    if (r) L.toast('Saved.');
  });
  L.onForm('mod-new', async function (f) {
    var v = L.formData(f);
    var r = await L.safe(f.querySelector('button'), function () { return L.api('studio.saveModule', v); });
    if (r) editor([0, v.programme_id]);
  });
  L.onForm('lesson-save', async function (f) {
    var v = L.formData(f);
    var payload = { programme_id: v.programme_id, module_id: v.module_id, lesson_id: v.lesson_id || undefined, title: v.title, description: v.description, video_url: v.video_url, reading_text: v.reading_text, objectives: v.objectives, est_minutes: v.est_minutes, reflection_prompt: v.reflection_prompt, ai_activity: v.ai_activity };
    if (v.mission_instructions) payload.mission = { title: v.mission_title, instructions: v.mission_instructions };
    var blocks = f.querySelectorAll('[data-q]'), qs = [];
    blocks.forEach(function (b) {
      var val = function (sel) { var el = b.querySelector(sel); return el ? el.value : ''; };
      var text = val('input[name^="qt"]');
      if (text) qs.push({ question_text: text, option_a: val('input[name^="qoa"]'), option_b: val('input[name^="qob"]'), option_c: val('input[name^="qoc"]'), option_d: val('input[name^="qod"]'), correct_option: val('select[name^="qk"]'), explanation: val('input[name^="qe"]') });
    });
    if (qs.length) payload.quiz = { pass_mark_pct: v.pass_mark, questions: qs };
    var r = await L.safe(f.querySelector('button[type=submit]'), function () { return L.api('studio.saveLesson', payload); });
    if (r) { L.toast('Lesson saved.'); editor([0, v.programme_id]); }
  });
  L.on('lesson-del', async function (t) {
    var r = await L.safe(t, function () { return L.api('studio.delete', { lesson_id: t.dataset.id }); });
    if (r) { L.toast('Lesson deleted.'); editor([0, t.dataset.pid]); }
  });
  L.on('prog-publish', async function (t) {
    var r = await L.safe(t, function () { return L.api('studio.publish', { programme_id: t.dataset.id, unpublish: !!t.dataset.un }); });
    if (r) { L.toast(r.status === 'published' ? 'Published. It is now in the student catalogue.' : 'Back to draft.'); editor([0, t.dataset.id]); }
  });
  L.on('prog-preview', async function (t) {
    var d = await L.safe(t, function () { return L.api('studio.get', { programme_id: t.dataset.id }); });
    if (!d) return;
    document.getElementById('preview').innerHTML = '<div class="card soft"><span class="eyebrow">Student preview</span><h2>' + L.esc(d.programme.title) + '</h2><p>' + L.esc(d.programme.description) + '</p>' +
      d.modules.map(function (m) { return '<div class="module"><h3>' + L.esc(m.title) + '</h3>' + m.lessons.map(function (l) { return '<div><b>' + L.esc(l.title) + '</b> <span class="small muted">' + L.esc(l.est_minutes) + ' min · ' + L.esc(l.status) + '</span><p class="small pre">' + L.esc(l.reading_text || l.description) + '</p></div>'; }).join('') + '</div>'; }).join('') + '</div>';
  });

  /* ================= KNOWLEDGE STUDIO ================= */
  function knav(cur) {
    return '<div class="subtabs">' + [['dash', 'Dashboard'], ['classes', 'Classes'], ['requests', 'Requests'], ['sessions', 'Sessions'], ['learners', 'Learners']].map(function (x) {
      return '<a class="subtab" href="#/studio/' + (x[0] === 'dash' ? '' : x[0]) + '" ' + (cur === x[0] ? 'aria-current="page"' : '') + '>' + x[1] + '</a>';
    }).join('') + '</div>';
  }
  async function kstudio(m) {
    var tab = m[1] || 'dash';
    if (!L.hasRole('contributor')) {
      L.render('<div class="card"><h2>My Knowledge Studio</h2><p class="muted">This opens once LDF verifies you as a Knowledge Contributor.</p><a class="btn" href="#/share/apply">Apply to share your knowledge</a></div>');
      return;
    }
    L.loading();
    var h = '<div class="hello"><h1>My Knowledge Studio</h1></div>' + knav(tab);
    if (tab === 'dash') {
      var d = await L.api('kstudio.dashboard');
      h += '<div class="card"><span class="badge good">LDF Verified</span><div class="grid3">' +
        [['pending_requests', 'new requests'], ['upcoming', 'upcoming sessions'], ['completed', 'sessions completed'], ['learners', 'learners helped'], ['hours', 'hours contributed'], ['rating_avg', 'learner feedback']].map(function (s) { return '<div class="stat"><b>' + L.esc(d[s[0]] || 0) + '</b><span>' + s[1] + '</span></div>'; }).join('') + '</div>' +
        '<div class="row"><a class="btn" href="#/studio/classes">+ Create class</a><a class="btn ghost" href="#/studio/requests">See requests</a></div></div>';
    } else if (tab === 'classes') {
      var cl = (await L.api('kstudio.classes')).classes;
      h += '<div class="card"><h3>+ Create class</h3><form data-form="class-save">' + classFields({}) + '<button class="btn" type="submit">Save class</button></form></div>' +
        cl.map(function (k) {
          return '<div class="card"><div class="row"><div class="grow"><h3>' + L.esc(k.title) + '</h3><p class="small muted">' + L.esc(k.subject) + ' · ' + L.esc(k.level) + ' · ' + L.esc(k.session_minutes) + ' min · Free · Online</p></div>' + L.statusBadge(k.status) + '</div>' +
            '<div class="row"><button class="btn small" data-act="class-pub" data-id="' + L.esc(k.class_id) + '"' + (k.status === 'published' ? ' data-un="1"' : '') + '>' + (k.status === 'published' ? 'Pause class' : 'Publish') + '</button></div>' +
            '<details><summary>Edit details</summary><form data-form="class-save" style="margin-top:12px"><input type="hidden" name="class_id" value="' + L.esc(k.class_id) + '">' + classFields(k) + '<button class="btn" type="submit">Save changes</button></form></details>' +
            '<details><summary>Resources (' + k.content.length + ')</summary><ul class="list">' + k.content.map(function (c) { return '<li><a href="' + L.esc(c.url) + '" target="_blank" rel="noopener">' + L.esc(c.title || c.url) + '</a><button class="linkbtn small" data-act="content-del" data-id="' + L.esc(c.content_id) + '">Remove</button></li>'; }).join('') + '</ul>' +
            '<form data-form="content-add"><input type="hidden" name="class_id" value="' + L.esc(k.class_id) + '">' + L.field('ct' + k.class_id, 'Title', {}).replace('name="ct' + k.class_id + '"', 'name="title"') + L.field('cu' + k.class_id, 'Link (video, document, quiz)', { type: 'url', required: true }).replace('name="cu' + k.class_id + '"', 'name="url"') + '<button class="btn ghost small" type="submit">Add resource</button></form></details></div>';
        }).join('');
    } else if (tab === 'requests') {
      var rq = (await L.api('kstudio.requests')).requests;
      h += '<div class="card"><h3>Session requests</h3>' + (rq.length ? '<ul class="list">' + rq.map(function (r) {
        return '<li><div class="grow"><b>' + L.esc(r.learner_name) + (r.learner_is_minor ? ' (under 18)' : '') + '</b><div class="small muted">' + L.esc(r.subject) + ' · ' + L.esc(r.preferred_time) + '</div><p class="small">' + L.esc(r.message) + '</p></div>' + L.statusBadge(r.status) +
          (r.status === 'pending' ? '<div style="flex-basis:100%"><details><summary class="btn small">Reply</summary><form data-form="req-accept" style="margin-top:10px"><input type="hidden" name="request_id" value="' + L.esc(r.request_id) + '">' +
            L.field('st' + r.request_id, 'Date and time', { type: 'datetime-local', required: true }).replace('name="st' + r.request_id + '"', 'name="start_local"') + L.field('ml' + r.request_id, 'Meeting link', { type: 'url', required: true, placeholder: 'https://meet.google.com/...', hint: 'Use Google Meet, Zoom or any approved link.' }).replace('name="ml' + r.request_id + '"', 'name="meeting_link"') +
            L.field('mn' + r.request_id, 'Length in minutes', { type: 'number', value: 45, min: 15, max: 180 }).replace('name="mn' + r.request_id + '"', 'name="minutes"') + '<div class="row"><button class="btn" type="submit">Confirm session</button><button type="button" class="btn danger small" data-act="req-decline" data-id="' + L.esc(r.request_id) + '">Decline</button></div></form></details></div>' : '') + '</li>';
      }).join('') + '</ul>' : '<p class="muted">No requests yet. Publish a class so learners can find you.</p>') + '</div>';
    } else if (tab === 'sessions') {
      var ss = (await L.api('ks.mySessions')).sessions.filter(function (s) { return s.role === 'contributor'; });
      h += '<div class="card"><h3>Sessions</h3>' + (ss.length ? '<ul class="list">' + ss.map(function (s) {
        return '<li><div class="grow"><b>' + L.esc(s.title) + '</b><div class="small muted">' + L.esc(L.fmtDate(s.start_at, true)) + ' · with ' + L.esc(s.with) + '</div></div>' + L.statusBadge(s.status) +
          (s.status === 'scheduled' ? '<a class="btn small" href="' + L.esc(s.meeting_link) + '" target="_blank" rel="noopener">Join session</a><details style="flex-basis:100%"><summary class="small">Record outcome</summary><form data-form="sess-done" style="margin-top:10px"><input type="hidden" name="session_id" value="' + L.esc(s.session_id) + '">' +
            L.field('dm' + s.session_id, 'How long did it last (minutes)?', { type: 'number', value: 45, min: 5, max: 240 }).replace('name="dm' + s.session_id + '"', 'name="duration_minutes"') + L.field('on' + s.session_id, 'What did you cover?', { type: 'textarea' }).replace('name="on' + s.session_id + '"', 'name="outcome_notes"') + '<button class="btn" type="submit">Complete session</button></form></details>' : '') + '</li>';
      }).join('') + '</ul>' : '<p class="muted">No sessions yet.</p>') + '</div>';
    } else {
      var ls = (await L.api('kstudio.learners')).learners;
      h += '<div class="card"><h3>Learners</h3>' + (ls.length ? '<ul class="list">' + ls.map(function (x) { return '<li><b>' + L.esc(x.display_name) + '</b><span class="muted small">' + L.esc(x.sessions) + ' session' + (x.sessions > 1 ? 's' : '') + '</span></li>'; }).join('') + '</ul>' : '<p class="muted">Learners appear here after your first session.</p>') + '</div>';
    }
    L.render(h);
  }
  function classFields(k) {
    var id = k.class_id || 'new';
    var f = function (name, label, o) { o = o || {}; o.value = k[name] !== undefined ? k[name] : o.value; return L.field(name + '_' + id, label, o).replace('name="' + name + '_' + id + '"', 'name="' + name + '"'); };
    return f('title', 'Class title', { required: true, placeholder: 'Grade 8 Mathematics: Algebra Basics' }) + f('description', 'Description', { type: 'textarea' }) + f('outcomes', 'What learners will achieve', { type: 'textarea' }) +
      '<div class="grid2">' + f('subject', 'Subject', { required: true }) + f('level', 'Level') + f('language', 'Language', { value: 'English' }) + f('session_minutes', 'Session length (minutes)', { type: 'number', value: 45, min: 15, max: 180 }) + f('max_group_size', 'Group size', { type: 'number', value: 1, min: 1, max: 30 }) + f('availability_text', 'Availability', { placeholder: 'Saturdays' }) + '</div>' +
      '<p class="small muted">Delivery is online and access is free in this first version.</p>';
  }
  L.route(/^#\/studio(?:\/(\w+))?$/, kstudio);
  L.onForm('class-save', async function (f) {
    var r = await L.safe(f.querySelector('button[type=submit]'), function () { return L.api('kstudio.saveClass', L.formData(f)); });
    if (r) { L.toast('Class saved.'); kstudio([0, 'classes']); }
  });
  L.on('class-pub', async function (t) {
    var r = await L.safe(t, function () { return L.api('kstudio.publishClass', { class_id: t.dataset.id, unpublish: !!t.dataset.un }); });
    if (r) { L.toast(r.status === 'published' ? 'Published. Learners can now find this class.' : 'Class paused.'); kstudio([0, 'classes']); }
  });
  L.onForm('content-add', async function (f) {
    var r = await L.safe(f.querySelector('button'), function () { return L.api('kstudio.addContent', L.formData(f)); });
    if (r) { L.toast('Resource added.'); kstudio([0, 'classes']); }
  });
  L.on('content-del', async function (t) {
    var r = await L.safe(t, function () { return L.api('kstudio.removeContent', { content_id: t.dataset.id }); });
    if (r) kstudio([0, 'classes']);
  });
  L.onForm('req-accept', async function (f) {
    var v = L.formData(f);
    var r = await L.safe(f.querySelector('button[type=submit]'), function () { return L.api('kstudio.respond', { request_id: v.request_id, decision: 'accept', start_at: new Date(v.start_local).toISOString(), meeting_link: v.meeting_link, minutes: v.minutes }); });
    if (r) { L.toast('Session confirmed. The learner has been notified.'); kstudio([0, 'requests']); }
  });
  L.on('req-decline', async function (t) {
    var r = await L.safe(t, function () { return L.api('kstudio.respond', { request_id: t.dataset.id, decision: 'decline' }); });
    if (r) { L.toast('Request declined.'); kstudio([0, 'requests']); }
  });
  L.onForm('sess-done', async function (f) {
    var r = await L.safe(f.querySelector('button'), function () { return L.api('kstudio.completeSession', L.formData(f)); });
    if (r) { L.toast('Recorded. This is now part of your LDF journey.'); kstudio([0, 'sessions']); }
  });
})(window.LDF);
