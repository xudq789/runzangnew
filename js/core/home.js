// ============ 【首页：往期案例展示】 ============
import { API_CONFIG } from './config.js?v=19';
import { renderPublicBaziPan, renderPublicDayunPan } from './ui.js?v=19';

const CASE_PAGE_SIZE = 10;

let state = {
    page: 0,
    total: 0,
    loaded: false,
    loading: false
};

function $(id) {
    return document.getElementById(id);
}

function fmtTime(t) {
    if (!t) return '';
    const s = String(t).replace('T', ' ');
    return s.length >= 16 ? s.slice(0, 16) : s;
}

function genderText(g) {
    return g === '女' ? '坤造' : '乾造';
}

function buildCaseCard(c) {
    const card = document.createElement('div');
    card.className = 'case-card';

    // 卡头：八字 + 服务/性别/预测时间（隐藏姓名与出生信息）
    const head = document.createElement('div');
    head.className = 'case-head';

    const title = document.createElement('h3');
    title.className = 'case-title';
    const seal = document.createElement('span');
    seal.className = 'case-seal';
    seal.textContent = genderText(c.gender);
    const baziTxt = document.createElement('span');
    baziTxt.className = 'case-bazi';
    baziTxt.textContent = c.bazi_text || '八字未知';
    title.appendChild(seal);
    title.appendChild(baziTxt);
    head.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'case-meta';
    const g = c.gender === '女' ? '女命' : '男命';
    meta.textContent = (c.service_type || '') + ' · ' + g + ' · 预测时间 ' + fmtTime(c.created_at);
    head.appendChild(meta);
    card.appendChild(head);

    // 卡身：八字排盘 / 大运排盘 / 八字喜用分析
    const body = document.createElement('div');
    body.className = 'case-body';

    if (c.bazi_pan && c.bazi_pan.year) {
        const panCard = document.createElement('div');
        panCard.className = 'bazi-pan-card case-pan-card';
        const ph = document.createElement('h4');
        ph.textContent = '八字排盘';
        const grid = document.createElement('div');
        grid.className = 'bazi-grid';
        panCard.appendChild(ph);
        panCard.appendChild(grid);
        body.appendChild(panCard);
        renderPublicBaziPan(grid, c.bazi_pan, seal.textContent);
    }

    if (c.dayun_pan && c.dayun_pan.length) {
        const dyCard = document.createElement('div');
        dyCard.className = 'dayun-pan-card case-dayun-card';
        const dh = document.createElement('h4');
        dh.textContent = '大运排盘';
        const grid = document.createElement('div');
        grid.className = 'dayun-grid';
        dyCard.appendChild(dh);
        dyCard.appendChild(grid);
        body.appendChild(dyCard);
        renderPublicDayunPan(grid, c.dayun_pan);
    }

    if (c.xiyong_text) {
        const xb = document.createElement('div');
        xb.className = 'case-xiyong';
        const xh = document.createElement('h4');
        xh.textContent = '八字喜用分析';
        xb.appendChild(xh);
        const content = document.createElement('div');
        content.className = 'case-xiyong-text';
        String(c.xiyong_text).split(/\n+/).forEach(line => {
            const t = line.trim();
            if (!t) return;
            const p = document.createElement('p');
            p.textContent = t;
            content.appendChild(p);
        });
        xb.appendChild(content);
        body.appendChild(xb);
    }

    card.appendChild(body);
    return card;
}

async function fetchCases(page) {
    const url = API_CONFIG.BACKEND_URL + '/api/public/cases?page=' + page + '&size=' + CASE_PAGE_SIZE;
    const resp = await fetch(url);
    const j = await resp.json();
    if (!j.success) throw new Error(j.error || '案例加载失败');
    return j.data;
}

function showStatus(text) {
    const st = $('home-status');
    if (st) st.textContent = text || '';
}

async function loadCases(reset) {
    if (state.loading) return;
    state.loading = true;
    if (reset) {
        state.page = 1;
        state.total = 0;
        state.loaded = false;
        const list = $('home-case-list');
        if (list) list.innerHTML = '';
    }
    try {
        const data = await fetchCases(state.page);
        const list = $('home-case-list');
        if (list) {
            (data.items || []).forEach(c => list.appendChild(buildCaseCard(c)));
        }
        state.total = data.total || 0;
        state.page += 1;
        state.loaded = true;
        const moreWrap = $('home-load-more-wrap');
        if (moreWrap) {
            const shownCount = list ? list.childElementCount : 0;
            moreWrap.style.display = shownCount < state.total ? '' : 'none';
        }
        if (!list || list.childElementCount === 0) {
            showStatus('暂无案例，快去测算生成第一条吧');
        } else {
            showStatus('');
        }
    } catch (err) {
        console.error('首页案例加载失败:', err);
        showStatus('案例加载失败，请稍后重试');
    } finally {
        state.loading = false;
    }
}

function showHomePage() {
    document.querySelectorAll('.service-nav a').forEach(a => a.classList.remove('active'));
    const navHome = $('nav-home');
    if (navHome) navHome.classList.add('active');

    const seamless = document.querySelector('.seamless-container');
    if (seamless) seamless.style.display = 'none';
    const result = $('analysis-result-section');
    if (result) result.style.display = 'none';

    const home = $('home-section');
    if (home) home.style.display = 'block';

    if (!state.loaded && !state.loading) {
        loadCases(true);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.showHomePage = showHomePage;

// 首页"加载更多"
document.addEventListener('DOMContentLoaded', () => {
    const btn = $('home-load-more');
    if (btn) {
        btn.addEventListener('click', () => loadCases(false));
    }
});
