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
        } catch (e) {
            $('login-err').textContent = e.message;
        }
    }

    function fmtTime(s) { return s || '—'; }
    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    async function loadList() {
        const tbody = $('report-tbody');
        const paid = $('filter-paid').value;
        const service = $('filter-service').value;
        tbody.innerHTML = '<tr><td colspan="9" class="empty">加载中…</td></tr>';
        try {
            const q = new URLSearchParams({ page, size: SIZE });
            if (paid !== '') q.set('paid', paid);
            if (service) q.set('service', service);
            const d = await api('/api/admin/reports?' + q.toString());
            const items = d.data.items;
            $('page-info').textContent = `第 ${d.data.page} 页 / 共 ${d.data.total} 条`;
            if (!items.length) {
                tbody.innerHTML = '<tr><td colspan="9" class="empty">暂无报告</td></tr>';
                return;
            }
            tbody.innerHTML = items.map(r => `
                <tr>
                    <td>${r.id}</td>
                    <td>${fmtTime(r.created_at)}</td>
                    <td>${esc(r.service_type)}</td>
                    <td>${esc(r.user_name) || '—'}</td>
                    <td>${esc(r.gender)}</td>
                    <td>${esc(r.bazi_text)}</td>
                    <td>${r.amount != null ? '¥' + r.amount : '—'}</td>
                    <td><span class="paid-tag ${r.paid ? 'yes' : 'no'}">${r.paid ? '已支付' : '未支付'}</span></td>
                    <td><button class="btn btn-outline" data-id="${r.id}" style="padding:4px 10px;">查看</button></td>
                </tr>`).join('');
            tbody.querySelectorAll('button[data-id]').forEach(b => b.onclick = () => openDetail(+b.dataset.id));
        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="9" class="empty">${esc(e.message)}</td></tr>`;
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
    $('refresh-btn').onclick = () => { page = 1; loadList(); };
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
        api('/api/admin/reports?page=1&size=1').then(() => { showPanel(); loadList(); }).catch(() => showLogin());
    } else {
        showLogin();
    }
})();
