// ============ 【首页：今日命例】 ============
// 「今日命例」板块由构建脚本 _daily_run.js 静态写入 index.html（爬虫可见，
// 不依赖 JS 拉取），此处只负责首页的显示/隐藏与滚动。

function showHomePage() {
    document.querySelectorAll('.service-nav a').forEach(a => a.classList.remove('active'));
    const navHome = document.getElementById('nav-home');
    if (navHome) navHome.classList.add('active');

    const seamless = document.querySelector('.seamless-container');
    if (seamless) seamless.style.display = 'none';
    const result = document.getElementById('analysis-result-section');
    if (result) result.style.display = 'none';

    const home = document.getElementById('home-section');
    if (home) home.style.display = 'block';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.showHomePage = showHomePage;
