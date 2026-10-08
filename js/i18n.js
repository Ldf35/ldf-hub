/* Language support. English is the reference. Sinhala and Tamil need a native-speaker review before launch. */
(function (L) {
  var D = {
    en: {
      tab_home: 'Home', tab_learn: 'Learn', tab_share: 'Share', tab_journey: 'Journey', tab_companion: 'Companion',
      signin: 'Sign in', join: 'Join LDF', email: 'Email', password: 'Password', name: 'Your name', dob: 'Date of birth',
      welcome: 'Welcome back', goal: 'Your current goal', continue_learning: 'Continue learning', ks: 'My Knowledge Share',
      progress: 'Your progress', recommended: 'Recommended for you', hours: 'learning hours', skills: 'skills developed',
      goals_done: 'goals completed', helped: 'people helped', menu: 'Menu', notifications: 'Notifications',
      signout: 'Sign out', language: 'Language', find_help: 'Find help'
    },
    si: {
      tab_home: 'මුල් පිටුව', tab_learn: 'ඉගෙනුම', tab_share: 'බෙදාගන්න', tab_journey: 'ගමන', tab_companion: 'සහායක',
      signin: 'ඇතුල් වන්න', join: 'LDF එකට එක්වන්න', email: 'ඊමේල්', password: 'මුරපදය', name: 'ඔබේ නම', dob: 'උපන් දිනය',
      welcome: 'නැවත සාදරයෙන් පිළිගනිමු', goal: 'ඔබේ වත්මන් අරමුණ', continue_learning: 'ඉගෙනීම දිගටම කරගෙන යන්න', ks: 'මගේ දැනුම් බෙදාගැනීම',
      progress: 'ඔබේ ප්‍රගතිය', recommended: 'ඔබට නිර්දේශිත', hours: 'ඉගෙනුම් පැය', skills: 'වර්ධනය කළ කුසලතා',
      goals_done: 'සම්පූර්ණ කළ අරමුණු', helped: 'උදව් කළ පුද්ගලයින්', menu: 'මෙනුව', notifications: 'දැනුම්දීම්',
      signout: 'ඉවත් වන්න', language: 'භාෂාව', find_help: 'උදව් සොයන්න'
    },
    ta: {
      tab_home: 'முகப்பு', tab_learn: 'கற்க', tab_share: 'பகிர்', tab_journey: 'பயணம்', tab_companion: 'துணை',
      signin: 'உள்நுழை', join: 'LDF இல் சேருங்கள்', email: 'மின்னஞ்சல்', password: 'கடவுச்சொல்', name: 'உங்கள் பெயர்', dob: 'பிறந்த தேதி',
      welcome: 'மீண்டும் வருக', goal: 'உங்கள் தற்போதைய இலக்கு', continue_learning: 'கற்றலைத் தொடருங்கள்', ks: 'என் அறிவுப் பகிர்வு',
      progress: 'உங்கள் முன்னேற்றம்', recommended: 'உங்களுக்கான பரிந்துரைகள்', hours: 'கற்றல் மணிநேரங்கள்', skills: 'வளர்த்த திறன்கள்',
      goals_done: 'நிறைவு செய்த இலக்குகள்', helped: 'உதவிய நபர்கள்', menu: 'பட்டியல்', notifications: 'அறிவிப்புகள்',
      signout: 'வெளியேறு', language: 'மொழி', find_help: 'உதவி தேடு'
    }
  };
  var lang = 'en';
  try { lang = localStorage.getItem('ldf_lang') || 'en'; } catch (e) {}
  if (!D[lang]) lang = 'en';
  L.LANGS = [['en', 'English'], ['si', 'සිංහල'], ['ta', 'தமிழ்']];
  L.lang = function () { return lang; };
  L.t = function (k) {
    var d = D[lang] || {};
    if (d[k] !== undefined) return d[k];
    return D.en[k] !== undefined ? D.en[k] : k;
  };
  L.applyI18n = function () {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = L.t(el.dataset.i18n); });
  };
  L.setLang = function (l) {
    if (!D[l]) return;
    lang = l;
    try { localStorage.setItem('ldf_lang', l); } catch (e) {}
    L.applyI18n();
    L.router();
  };
  L.langPicker = function () {
    return '<div class="subtabs" role="group" aria-label="Language">' + L.LANGS.map(function (x) {
      return '<button class="subtab" data-act="lang" data-l="' + x[0] + '" ' + (lang === x[0] ? 'aria-current="page"' : '') + '>' + x[1] + '</button>';
    }).join('') + '</div>';
  };
  L.on('lang', function (t) { L.setLang(t.dataset.l); });
  L.applyI18n();
})(window.LDF);
