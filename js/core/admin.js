// 后台管理页逻辑（admin.html）
(function () {
    const API = (window.API_CONFIG && API_CONFIG.BACKEND_URL) || 'https://api.runzang.top';
    const TOKEN_KEY = 'admin_token';

    const $ = (id) => document.getElementById(id);
    let page = 1;
    const SIZE = 20;

    function token() { return localStorage.getItem(TOKEN_KEY) || ''; }
    function saveToken(t) { localStorage.setItem(TOKEN_KEY, t); }
    function logout() { localStorage.removeItem(TOKEN_KEY); showLogin(); }

    function showLogin() {
        $('login-view').style.display = 'block';
        $('panel-view').style.display = 'none';
    }
    function showPanel() {
        $('login-view').style.display = 'none';
        $('panel-view').style.display = 'block';
    }

    async function api(path, opts = {}) {
        const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
        const t = token();
        if (t) headers['Authorization'] = 'Bearer ' + t;
        const res = await fetch(API + path, Object.assign({}, opts, { headers }));
        let data;
        try { data = await res.json(); } catch (e) { data = { success: false, message: '响应解析失败' }; }
        if (res.status === 401) { logout(); throw new Error('登录已过期，请重新登录'); }
        if (!data.success) throw new Error(data.message || '请求失败');
        return data;
    }

    async function doLogin() {
        const username = $('admin-user').value.trim();
        const password = $('admin-pass').value;
        $('login-err').textContent = '';
        if (!username || !password) { $('login-err').textContent = '请输入用户名和密码'; return; }
        try {
            const d = await fetch(API + '/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            }).then(r => r.json());
            if (!d.success) throw new Error(d.message || '登录失败');
            saveToken(d.token);
            showPanel();
            loadList();
            loadStats();
        } catch (e) {
            $('login-err').textContent = e.message;
        }
    }

    function fmtTime(s) { return s || '—'; }
    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    // ===== 站点统计 =====
    function unpaid(b) { return Math.max(0, (b.order_new || 0) - (b.order_paid || 0)); }

    function tile(k, v, sub) {
        return `<div class="tile"><div class="k">${k}</div><div class="v">${v}</div><div class="sub">${sub || ''}</div></div>`;
    }

    function renderTiles(d) {
        const t = d.totals.today, s = d.totals.d30 || {};
        const win = d.days === 1 ? '今天' : `近${d.days}天`;
        $('stats-tiles').innerHTML = [
            tile('今日访问量', t.pv, `${win} ${s.pv || 0}`),
            tile('今日访客数', t.uv, `${win} ${s.uv || 0}`),
            tile('今日测算量', t.analyse, `${win} ${s.analyse || 0}`),
            tile('今日已支付', t.order_paid, `${win} ${s.order_paid || 0}`),
            tile('今日待支付', unpaid(t), `${win} ${unpaid(s)}`),
            tile('今日收入', '¥' + (t.amount || 0).toFixed(2), `${win} ¥${(s.amount || 0).toFixed(2)}`),
        ].join('');
    }

    function renderSiteTable(d) {
        const rows = d.by_site.map(b => {
            const w = b.d30;
            return `<tr>
                <td>${esc(b.label)}</td>
                <td>${w.pv}</td>
                <td>${w.uv}</td>
                <td>${w.analyse}</td>
                <td>${w.order_new}</td>
                <td>${w.order_paid}</td>
                <td>${unpaid(w)}</td>
                <td>¥${(w.amount || 0).toFixed(2)}</td>
            </tr>`;
        });
        const sum = d.totals.d30 || {};
        rows.push(`<tr><td><strong>合计</strong></td><td>${sum.pv || 0}</td><td>${sum.uv || 0}</td><td>${sum.analyse || 0}</td>
            <td>${sum.order_new || 0}</td><td>${sum.order_paid || 0}</td><td>${unpaid(sum)}</td><td>¥${(sum.amount || 0).toFixed(2)}</td></tr>`);
        if (!d.by_site.length) rows.push('<tr><td colspan="8" class="empty">区间内暂无数据</td></tr>');
        $('stats-tbody').innerHTML = rows.join('');
    }

    function renderChart(d) {
        const W = 720, H = 170, PAD = 8;
        const series = d.series || [];
        if (series.length < 2) { $('stats-chart').innerHTML = '<text x="360" y="90" fill="#999" font-size="13" text-anchor="middle">趋势图需两天以上，「今天」请看上方数字</text>'; return; }
        let max = 0;
        series.forEach(p => { max = Math.max(max, p.total.pv, p.total.analyse, p.total.order_paid); });
        max = Math.max(max, 1);
        const dx = (W - PAD * 2) / (series.length - 1);
        const y = v => H - PAD - (v / max) * (H - PAD * 2);
        const line = (key, color) => {
            const pts = series.map((p, i) => `${(PAD + i * dx).toFixed(1)},${y(p.total[key] || 0).toFixed(1)}`).join(' ');
            return `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.6" />`;
        };
        const grid = [0.25, 0.5, 0.75].map(f =>
            `<line x1="${PAD}" y1="${(H - PAD - f * (H - PAD * 2)).toFixed(1)}" x2="${W - PAD}" y2="${(H - PAD - f * (H - PAD * 2)).toFixed(1)}" stroke="#f0e9dc" stroke-width="1" />`).join('');
        const labels = series.map((p, i) =>
            (i % Math.ceil(series.length / 6) === 0)
                ? `<text x="${(PAD + i * dx).toFixed(1)}" y="14" fill="#999" font-size="10">${p.date.slice(5)}</text>`
                : '').join('');
        $('stats-chart').innerHTML =
            grid + labels + line('pv', '#8b4513') + line('analyse', '#d4af37') + line('order_paid', '#1e7a34') +
            `<text x="${W - PAD}" y="${12}" fill="#666" font-size="10" text-anchor="end">峰值 ${max}</text>`;
    }

    async function loadStats() {
        const days = $('stats-days').value;
        $('stats-note').textContent = '加载中…';
        try {
            const d = (await api('/api/stats/overview?days=' + days)).data;
            renderTiles(d);
            renderSiteTable(d);
            renderChart(d);
            $('stats-note').textContent = `统计起点 ${d.start || '—'} ｜ 埋点上线后开始计数`;
        } catch (e) {
            $('stats-note').textContent = e.message;
        }
    }

    async function loadList() {
        const tbody = $('report-tbody');
        const paid = $('filter-paid').value;
        const service = $('filter-service').value;
        tbody.innerHTML = '<tr><td colspan="11" class="empty">加载中…</td></tr>';
        try {
            const q = new URLSearchParams({ page, size: SIZE });
            if (paid !== '') q.set('paid', paid);
            if (service) q.set('service', service);
            const d = await api('/api/admin/reports?' + q.toString());
            const items = d.data.items;
            $('page-info').textContent = `第 ${d.data.page} 页 / 共 ${d.data.total} 条`;
            if (!items.length) {
                tbody.innerHTML = '<tr><td colspan="11" class="empty">暂无报告</td></tr>';
                return;
            }
            tbody.innerHTML = items.map(r => `
                <tr>
                    <td>${r.id}</td>
                    <td>${fmtTime(r.created_at)}</td>
                    <td>${r.site_label ? '<span class="site-tag">' + esc(r.site_label) + '</span>' : '—'}</td>
                    <td>${esc(r.service_type)}</td>
                    <td>${esc(r.user_name) || '—'}</td>
                    <td>${esc(r.gender)}</td>
                    <td>${esc(r.bazi_text)}</td>
                    <td>${r.amount != null ? '¥' + r.amount : '—'}</td>
                    <td class="order-no" title="${esc(r.out_trade_no || '')}">${esc(r.out_trade_no) || '—'}</td>
                    <td><span class="paid-tag ${r.paid ? 'yes' : 'no'}">${r.paid ? '已支付' : '未支付'}</span></td>
                    <td><button class="btn btn-outline" data-id="${r.id}" style="padding:4px 10px;">查看</button></td>
                </tr>`).join('');
            tbody.querySelectorAll('button[data-id]').forEach(b => b.onclick = () => openDetail(+b.dataset.id));
        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="11" class="empty">${esc(e.message)}</td></tr>`;
        }
    }

    async function openDetail(id) {
        const mask = $('detail-mask');
        $('detail-body').textContent = '加载中…';
        mask.style.display = 'flex';
        try {
            const d = await api('/api/admin/reports/' + id);
            const r = d.data;
            $('detail-meta').innerHTML = `
                服务：${esc(r.service_type)} ｜ 姓名：${esc(r.user_name) || '—'}（${esc(r.gender)}） ｜ 出生：${esc(r.birth_text) || '—'}
                <br>八字：${esc(r.bazi_text)} ｜ 金额：${r.amount != null ? '¥' + r.amount : '—'} ｜ 支付：${r.paid ? '已支付' : '未支付'} ｜ 时间：${fmtTime(r.created_at)}
                ${r.order_id ? '<br>订单号：' + esc(r.order_id) + ' ｜ 商户单号：' + esc(r.out_trade_no) : ''}`;
            $('detail-body').textContent = r.polished_report || '(无完整报告)';
        } catch (e) {
            $('detail-body').textContent = e.message;
        }
    }

    $('login-btn').onclick = doLogin;
    $('admin-pass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
    $('logout-btn').onclick = logout;
    $('refresh-btn').onclick = () => { page = 1; loadList(); loadStats(); };
    $('stats-refresh').onclick = loadStats;
    $('stats-days').onchange = loadStats;
    $('filter-paid').onchange = () => { page = 1; loadList(); };
    $('filter-service').onchange = () => { page = 1; loadList(); };
    $('prev-btn').onclick = () => { if (page > 1) { page--; loadList(); } };
    $('next-btn').onclick = () => { page++; loadList(); };
    $('close-btn').onclick = () => { $('detail-mask').style.display = 'none'; };
    $('detail-mask').onclick = (e) => { if (e.target === $('detail-mask')) $('detail-mask').style.display = 'none'; };
    $('copy-btn').onclick = () => {
        const text = $('detail-body').textContent;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => { $('copy-btn').textContent = '已复制'; setTimeout(() => { $('copy-btn').textContent = '复制全文'; }, 1200); });
        }
    };

    if (token()) {
        // 先尝试列表，失败则回登录
        api('/api/admin/reports?page=1&size=1').then(() => { showPanel(); loadList(); loadStats(); }).catch(() => showLogin());
    } else {
        showLogin();
    }
})();
