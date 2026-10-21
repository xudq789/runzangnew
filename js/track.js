/* 润藏三站访问量埋点：一次页面加载上报一条 PV。
 * 只发路径，不发查询串（避免把手机号/八字写进 URL 参数外带）；拿不到存储时只丢本次统计，不影响页面。 */
(function () {
  try {
    var host = location.hostname.replace(/^www\./, '');
    var site = host === 'runzang.top' ? 'apex' : host === 'bazi.runzang.top' ? 'bazi' : host === 'new.runzang.top' ? 'new' : '';
    if (!site) return;
    if (/admin/i.test(location.pathname)) return;

    var v = '';
    try { v = localStorage.getItem('rz_vid') || ''; } catch (e) {}
    if (!/^[A-Za-z0-9_-]{8,64}$/.test(v)) {
      v = (Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)).slice(0, 48);
      try { localStorage.setItem('rz_vid', v); } catch (e) {}
    }

    new Image().src = 'https://api.runzang.top/api/stats/hit'
      + '?p=' + encodeURIComponent(location.pathname)
      + '&v=' + v + '&s=' + site;
  } catch (e) {}
})();
