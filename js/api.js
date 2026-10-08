/* The only file that talks to the backend. The app never touches Google Sheets. */
(function (L) {
  var S = L.session = { token: null, user: null, roles: [], profile: {} };
  try { var saved = JSON.parse(localStorage.getItem('ldf_session') || 'null'); if (saved) Object.assign(S, saved); } catch (e) {}
  L.saveSession = function () { try { localStorage.setItem('ldf_session', JSON.stringify(S)); } catch (e) {} };
  L.clearSession = function () { S.token = null; S.user = null; S.roles = []; S.profile = {}; try { localStorage.removeItem('ldf_session'); } catch (e) {} };
  L.hasRole = function (r) { return S.roles.indexOf(r) > -1 || (r !== 'admin' && S.roles.indexOf('admin') > -1); };
  L.apiUrl = function () { var u = ''; try { u = localStorage.getItem('ldf_api_url') || ''; } catch (e) {} return (window.LDF_CONFIG && window.LDF_CONFIG.API_URL) || u; };
  L.setApiUrl = function (u) { try { localStorage.setItem('ldf_api_url', u); } catch (e) {} };

  L.api = async function (action, payload) {
    var url = L.apiUrl();
    if (!url) { var n = new Error('The app is not connected to LDF yet.'); n.code = 'NOT_CONNECTED'; throw n; }
    var res;
    try {
      res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: action, payload: payload || {}, token: S.token }) });
    } catch (e) { var ne = new Error('Cannot reach LDF. Check your internet connection and try again.'); ne.code = 'NETWORK'; throw ne; }
    var j;
    try { j = await res.json(); } catch (e) { var pe = new Error('LDF sent an unexpected reply. Check the Web App URL.'); pe.code = 'BAD_REPLY'; throw pe; }
    if (!j.ok) {
      var err = new Error(j.error.message); err.code = j.error.code;
      if (j.error.code === 'AUTH_REQUIRED' && S.token) { L.clearSession(); L.toast('Please sign in again.', true); location.hash = '#/login'; }
      throw err;
    }
    return j.data;
  };
})(window.LDF);
