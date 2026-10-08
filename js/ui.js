/* Shared helpers. Everything shown from data goes through esc(). */
window.LDF = window.LDF || { routes: [], actions: {}, forms: {} };
(function (L) {
  L.esc = function (s) {
    return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };
  L.fmtDate = function (iso, withTime) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    var o = { weekday: 'short', day: 'numeric', month: 'short' };
    if (withTime) { o.hour = '2-digit'; o.minute = '2-digit'; }
    return d.toLocaleString('en-GB', o);
  };
  L.fmtMonth = function (iso) {
    var d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleString('en-GB', { month: 'short', year: 'numeric' });
  };
  L.toast = function (msg, isErr) {
    var t = document.getElementById('toast');
    t.textContent = msg; t.className = 'toast' + (isErr ? ' err' : ''); t.hidden = false;
    clearTimeout(L._tt); L._tt = setTimeout(function () { t.hidden = true; }, isErr ? 5000 : 2800);
  };
  L.bar = function (pct) { return '<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + L.esc(pct) + '"><i style="width:' + Math.max(0, Math.min(100, Number(pct) || 0)) + '%"></i></div>'; };
  L.badge = function (text, kind) { return '<span class="badge ' + (kind || '') + '">' + L.esc(text) + '</span>'; };
  L.accessBadge = function (t) { return L.badge(t === 'FREE' ? 'Free' : t === 'PAID' ? 'Paid' : t === 'SPONSORED' ? 'Sponsored' : 'Scholarship', t === 'FREE' ? 'good' : ''); };
  L.statusBadge = function (s) {
    var map = { submitted: ['Application submitted', 'warn'], under_review: ['Under review', ''], verified: ['LDF Verified', 'good'], more_info: ['More information needed', 'warn'], rejected: ['Not approved', 'bad'], suspended: ['Paused', 'bad'],
      pending: ['Waiting', 'warn'], accepted: ['Confirmed', 'good'], declined: ['Declined', 'bad'], completed: ['Completed', 'good'], cancelled: ['Cancelled', 'plain'], scheduled: ['Scheduled', ''],
      draft: ['Draft', 'plain'], published: ['Published', 'good'], open: ['Open', 'warn'], reviewing: ['Reviewing', ''], actioned: ['Actioned', 'good'], dismissed: ['Dismissed', 'plain'], paused: ['Paused', 'plain'] };
    var m = map[s] || [s, 'plain'];
    return L.badge(m[0], m[1]);
  };
  L.icon = {
    help: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.500 9a2.500 2.500 0 1 1 3.500 2.300c-.7.400-1 .9-1 1.700"/><path d="M12 16.500h.01"/></svg>',
    well: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 14c1 1.500 2.500 2.200 4 2.200s3-.7 4-2.200"/><path d="M9 9.500h.01M15 9.500h.01"/></svg>',
    goal: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>',
    shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 3v6c0 4.500-3.200 8-8 9-4.800-1-8-4.500-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>'
  };
  L.loading = function () { document.getElementById('app').innerHTML = '<div class="spinner" aria-label="Loading"></div>'; };
  L.render = function (html) { document.getElementById('app').innerHTML = '<div class="view">' + html + '</div>'; window.scrollTo(0, 0); };
  L.field = function (id, label, opts) {
    opts = opts || {};
    var t = opts.type || 'text';
    var input;
    if (t === 'textarea') input = '<textarea id="' + id + '" name="' + id + '" ' + (opts.required ? 'required' : '') + ' placeholder="' + L.esc(opts.placeholder || '') + '">' + L.esc(opts.value || '') + '</textarea>';
    else if (t === 'select') input = '<select id="' + id + '" name="' + id + '">' + opts.options.map(function (o) { var v = Array.isArray(o) ? o[0] : o, lab = Array.isArray(o) ? o[1] : o; return '<option value="' + L.esc(v) + '"' + (String(v) === String(opts.value) ? ' selected' : '') + '>' + L.esc(lab) + '</option>'; }).join('') + '</select>';
    else input = '<input id="' + id + '" name="' + id + '" type="' + t + '" value="' + L.esc(opts.value || '') + '" ' + (opts.required ? 'required' : '') + ' ' + (opts.min !== undefined ? 'min="' + opts.min + '"' : '') + ' ' + (opts.max !== undefined ? 'max="' + opts.max + '"' : '') + ' placeholder="' + L.esc(opts.placeholder || '') + '" autocomplete="' + (opts.autocomplete || 'off') + '">';
    return '<div class="field"><label for="' + id + '">' + L.esc(label) + '</label>' + input + (opts.hint ? '<span class="hint">' + L.esc(opts.hint) + '</span>' : '') + '</div>';
  };
  L.formData = function (form) {
    var o = {};
    new FormData(form).forEach(function (v, k) { o[k] = v; });
    return o;
  };
  /* Run an async action, show errors as toasts, and keep the button from double-sending. */
  L.safe = async function (btn, fn) {
    if (btn) btn.disabled = true;
    try { return await fn(); }
    catch (e) { if (e.code !== 'AUTH_REQUIRED') L.toast(e.message || 'Something went wrong.', true); return undefined; }
    finally { if (btn) btn.disabled = false; }
  };
  L.on = function (name, fn) { L.actions[name] = fn; };
  L.onForm = function (name, fn) { L.forms[name] = fn; };
  L.route = function (re, fn) { L.routes.push([re, fn]); };
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]');
    if (!t) return;
    var fn = L.actions[t.dataset.act];
    if (fn) { e.preventDefault(); fn(t, e); }
  });
  document.addEventListener('submit', function (e) {
    var f = e.target.closest('[data-form]');
    if (!f) return;
    e.preventDefault();
    var fn = L.forms[f.dataset.form];
    if (fn) fn(f, e);
  });
})(window.LDF);
