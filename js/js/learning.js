/* LDF Learning: catalogue, programme, lesson player, quiz, mission, reflection. */
(function (L) {
  var tab = 'mine';
  function subtabs() {
    return '<div class="subtabs"><button class="subtab" data-act="learn-tab" data-t="mine" ' + (tab === 'mine' ? 'aria-current="page"' : '') + '>My learning</button><button class="subtab" data-act="learn-tab" data-t="all" ' + (tab === 'all' ? 'aria-current="page"' : '') + '>All courses</button></div>';
  }
  async function learn() {
    L.loading();
    var h = '<div class="hello"><h1>Learn</h1><p class="muted">Learn it. Practise it. Use it in real life.</p></div>' + subtabs();
    if (tab === 'mine') {
      var mine = (await L.api('learning.mine')).items;
      h += mine.length ? '<div class="card"><ul class="list">' + mine.map(function (m) {
        return '<li><div class="grow"><b>' + L.esc(m.title) + '</b><div class="small muted">' + (m.status === 'completed' ? 'Completed' : L.esc(m.percent) + '% done') + '</div>' + L.bar(m.percent) + '</div>' +
          (m.next_lesson ? '<a class="btn small" href="#/lesson/' + L.esc(m.next_lesson) + '">Continue</a>' : '<a class="btn ghost small" href="#/learn/' + L.esc(m.programme_id) + '">View</a>') + '</li>';
      }).join('') + '</ul></div>' : '<div class="card"><h3>You have not started a course yet</h3><p class="muted">Pick one that fits your goal.</p><button class="btn" data-act="learn-tab" data-t="all">Browse courses</button></div>';
    } else {
      var q = (document.getElementById('cq') || {}).value || '';
      var cat = (await L.api('learning.catalogue', { q: q })).programmes;
      h += '<form data-form="learn-search" class="row"><div class="grow">' + L.field('cq', 'Search courses', { value: q, placeholder: 'For example: communication' }) + '</div><button class="btn ghost" type="submit">Search</button></form>';
      h += cat.length ? cat.map(function (p) {
        return '<div class="card"><div class="row"><div class="grow"><h3>' + L.esc(p.title) + '</h3><p class="muted small">' + L.esc(p.level) + ' · ' + L.esc(p.language) + (p.duration_hours ? ' · ' + L.esc(p.duration_hours) + ' h' : '') + '</p></div>' + L.accessBadge(p.access_type) + '</div>' +
          '<p>' + L.esc(p.description) + '</p>' + (p.enrolled ? L.bar(p.percent) : '') + '<a class="btn' + (p.enrolled ? ' ghost' : '') + '" href="#/learn/' + L.esc(p.programme_id) + '">' + (p.enrolled ? 'Open' : 'See details') + '</a></div>';
      }).join('') : '<div class="card"><p>No courses match yet. New courses are added regularly.</p></div>';
    }
    L.render(h);
  }
  L.route(/^#\/learn$/, learn);
  L.on('learn-tab', function (t) { tab = t.dataset.t; learn(); });
  L.onForm('learn-search', function () { learn(); });

  async function programme(m) {
    L.loading();
    var id = m[1];
    var d = await L.api('learning.programme', { programme_id: id });
    var p = d.programme;
    var h = '<a class="small" href="#/learn">&larr; All courses</a><div class="card hero"><span class="eyebrow">' + L.esc(p.category || 'Programme') + '</span><h1>' + L.esc(p.title) + '</h1><p>' + L.esc(p.description) + '</p>' +
      '<div class="chips"><span class="badge">' + L.esc(p.level) + '</span><span class="badge">' + L.esc(p.language) + '</span>' + (p.duration_hours ? '<span class="badge">' + L.esc(p.duration_hours) + ' hours</span>' : '') + L.accessBadge(p.access_type) + '</div>' +
      (d.enrolled ? L.bar(d.percent) + '<p class="small">' + L.esc(d.percent) + '% complete</p>' : '<button class="btn light" data-act="enrol" data-id="' + L.esc(p.programme_id) + '">' + (p.access_type === 'FREE' ? 'Join this course' : p.access_type === 'PAID' ? 'Get access' : 'Ask for access') + '</button>') + '</div>';
    if (d.instructor) h += '<p class="small muted">Led by ' + L.esc(d.instructor.display_name) + '</p>';
    h += '<div class="card">' + d.modules.map(function (mod, i) {
      return '<div class="module"><div><span class="eyebrow">Module ' + (i + 1) + '</span><h3>' + L.esc(mod.title) + '</h3></div><ul class="list">' + mod.lessons.map(function (l) {
        return '<li><div class="grow" style="display:flex;gap:10px;align-items:center"><span class="dot ' + (l.completed ? 'done' : '') + '" aria-label="' + (l.completed ? 'Completed' : 'Not completed') + '">' + (l.completed ? '&#10003;' : '') + '</span><span>' + L.esc(l.title) + '<span class="small muted"> · ' + L.esc(l.est_minutes) + ' min</span></span></div>' +
          (d.enrolled ? '<a class="btn ghost small" href="#/lesson/' + L.esc(l.lesson_id) + '">' + (l.completed ? 'Review' : 'Open') + '</a>' : '') + '</li>';
      }).join('') + '</ul></div>';
    }).join('') + '</div>';
    L.render(h);
  }
  L.route(/^#\/learn\/([\w-]+)$/, programme);
  L.on('enrol', async function (t) {
    var r = await L.safe(t, function () { return L.api('learning.enrol', { programme_id: t.dataset.id }); });
    if (!r) return;
    if (r.enrolled) { L.toast('You are in. Enjoy the course.'); programme([0, t.dataset.id]); } else L.toast(r.message, false);
  });

  var current;
  async function lesson(m) {
    L.loading();
    current = (await L.api('learning.lesson', { lesson_id: m[1] })).lesson;
    var l = current;
    var h = '<a class="small" href="#/learn/' + '" data-act="back-programme">&larr; Back to course</a>' +
      '<div class="card hero"><span class="eyebrow">Lesson</span><h1>' + L.esc(l.title) + '</h1><p>' + L.esc(l.description) + '</p><span class="small">About ' + L.esc(l.est_minutes) + ' minutes</span></div>';
    if (l.objectives) h += '<div class="card"><h3>What you will learn</h3><p class="pre">' + L.esc(l.objectives) + '</p></div>';
    if (l.video_url) h += '<div class="card"><h3>Watch</h3><a class="btn" href="' + L.esc(l.video_url) + '" target="_blank" rel="noopener">Open the video</a></div>';
    if (l.reading_text) h += '<div class="card"><h3>Read</h3><p class="pre">' + L.esc(l.reading_text) + '</p></div>';
    if (l.resources && l.resources.length) h += '<div class="card"><h3>Resources</h3><ul class="list">' + l.resources.map(function (r) { return '<li><a href="' + L.esc(r.url) + '" target="_blank" rel="noopener">' + L.esc(r.title) + '</a></li>'; }).join('') + '</ul></div>';
    if (l.quiz) h += '<div class="card" id="quizBox"><h3>Check your understanding</h3><p class="muted small">' + L.esc(l.quiz.question_count) + ' questions · pass mark ' + L.esc(l.quiz.pass_mark_pct) + '%</p><button class="btn ghost" data-act="quiz-open" data-id="' + L.esc(l.quiz.quiz_id) + '">Start the quiz</button></div>';
    if (l.mission) h += '<div class="card soft"><span class="eyebrow">Real-world mission</span><h3>' + L.esc(l.mission.title) + '</h3><p class="pre">' + L.esc(l.mission.instructions) + '</p><form data-form="mission">' + L.field('notes', 'What did you do?', { type: 'textarea', required: true }) + '<input type="hidden" name="mission_id" value="' + L.esc(l.mission.mission_id) + '"><button class="btn" type="submit">Submit mission</button></form></div>';
    h += '<div class="card"><span class="eyebrow">Reflect</span><h3>' + L.esc(l.reflection_prompt || 'What did you learn, and what will you try next?') + '</h3><form data-form="reflect">' + L.field('text', 'Your thoughts', { type: 'textarea', required: true }) + '<button class="btn ghost" type="submit">Save reflection</button></form></div>';
    if (l.ai_activity) h += '<div class="card"><span class="eyebrow">AI activity</span><p>' + L.esc(l.ai_activity) + '</p><a class="btn ghost" href="#/companion/' + L.esc(l.lesson_id) + '">Try it with the AI Companion</a></div>';
    h += '<div class="card"><button class="btn wide" data-act="lesson-done">Mark this lesson complete</button><div id="lessonResult"></div></div>';
    L.render(h);
  }
  L.route(/^#\/lesson\/([\w-]+)$/, lesson);
  L.on('back-programme', function () { history.back(); });

  L.on('quiz-open', async function (t) {
    var d = await L.safe(t, function () { return L.api('learning.quiz', { quiz_id: t.dataset.id }); });
    if (!d) return;
    var box = document.getElementById('quizBox');
    box.innerHTML = '<h3>' + L.esc(d.quiz.title) + '</h3><form data-form="quiz"><input type="hidden" name="quiz_id" value="' + L.esc(d.quiz.quiz_id) + '">' +
      d.questions.map(function (q, i) {
        return '<div class="quizq"><b>' + (i + 1) + '. ' + L.esc(q.question_text) + '</b>' + ['A', 'B', 'C', 'D'].filter(function (k) { return q.options[k]; }).map(function (k) {
          return '<label class="opt"><input type="radio" name="q_' + L.esc(q.question_id) + '" value="' + k + '" required><span>' + L.esc(q.options[k]) + '</span></label>';
        }).join('') + '</div>';
      }).join('') + '<button class="btn" type="submit">Check my answers</button><div id="quizOut"></div></form>';
  });
  L.onForm('quiz', async function (f) {
    var v = L.formData(f), answers = {};
    Object.keys(v).forEach(function (k) { if (k.indexOf('q_') === 0) answers[k.slice(2)] = v[k]; });
    var r = await L.safe(f.querySelector('button[type=submit]'), function () { return L.api('learning.submitQuiz', { quiz_id: v.quiz_id, answers: answers }); });
    if (!r) return;
    f.querySelector('#quizOut').innerHTML = '<div class="callout ' + (r.passed ? '' : 'warn') + '">' + L.icon.goal + '<div class="stack"><b>' + L.esc(r.score_pct) + '% · ' + (r.passed ? 'Passed' : 'Not yet. Read the lesson again and try once more.') + '</b>' +
      r.review.filter(function (x) { return x.explanation; }).map(function (x) { return '<span class="small">' + (x.correct ? 'Correct. ' : 'Answer ' + L.esc(x.correct_option) + '. ') + L.esc(x.explanation) + '</span>'; }).join('') + '</div></div>';
  });
  L.onForm('mission', async function (f) {
    await L.safe(f.querySelector('button'), async function () { await L.api('learning.submitMission', L.formData(f)); L.toast('Mission saved. Well done for trying it in real life.'); });
  });
  L.onForm('reflect', async function (f) {
    var v = L.formData(f);
    await L.safe(f.querySelector('button'), async function () { await L.api('learning.saveReflection', { source_type: 'lesson', source_id: current.lesson_id, text: v.text }); L.toast('Reflection saved to your journey.'); f.reset(); });
  });
  L.on('lesson-done', async function (t) {
    var r = await L.safe(t, function () { return L.api('learning.completeLesson', { lesson_id: current.lesson_id, minutes: current.est_minutes }); });
    if (!r) return;
    var out = document.getElementById('lessonResult');
    var h = '<div class="callout">' + L.icon.goal + '<div class="stack"><b>Lesson complete. ' + L.esc(r.percent) + '% of the course done.</b>';
    if (r.programme_completed) h += '<span>You finished the course.' + (r.certificate ? ' Your LDF certificate (' + L.esc(r.certificate.verification_code) + ') is in your profile.' : '') + '</span><a class="btn small" href="#/profile">View certificates</a><a class="btn ghost small" href="#/home">Set your next goal</a>';
    else if (r.next_lesson) h += '<a class="btn small" href="#/lesson/' + L.esc(r.next_lesson) + '">Next lesson</a>';
    h += '</div></div>';
    out.innerHTML = h;
  });
})(window.LDF);
