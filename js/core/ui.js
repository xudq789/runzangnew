// UI控制模块
import { DOM, formatDate, hideElement, showElement } from './utils.js?v=17';
import { SERVICES, STATE, API_CONFIG } from './config.js?v=17';

// UI元素集合
export const UI = {
    name: () => DOM.id('name'),
    gender: () => DOM.id('gender'),
    birthCity: () => DOM.id('birth-city'),
    birthYear: () => DOM.id('birth-year'),
    birthMonth: () => DOM.id('birth-month'),
    birthDay: () => DOM.id('birth-day'),
    birthHour: () => DOM.id('birth-hour'),
    birthMinute: () => DOM.id('birth-minute'),
    
    partnerName: () => DOM.id('partner-name'),
    partnerGender: () => DOM.id('partner-gender'),
    partnerBirthCity: () => DOM.id('partner-birth-city'),
    partnerBirthYear: () => DOM.id('partner-birth-year'),
    partnerBirthMonth: () => DOM.id('partner-birth-month'),
    partnerBirthDay: () => DOM.id('partner-birth-day'),
    partnerBirthHour: () => DOM.id('partner-birth-hour'),
    partnerBirthMinute: () => DOM.id('partner-birth-minute'),
    
    analyzeBtn: () => DOM.id('analyze-btn'),
    unlockBtn: () => DOM.id('unlock-btn'),
    downloadReportBtn: () => DOM.id('download-report-btn'),
    recalculateBtn: () => DOM.id('recalculate-btn'),
    confirmPaymentBtn: () => DOM.id('confirm-payment-btn'),
    cancelPaymentBtn: () => DOM.id('cancel-payment-btn'),
    closePaymentBtn: () => DOM.id('close-payment'),
    
    heroImage: () => DOM.id('hero-image'),
    detailImage: () => DOM.id('detail-image'),
    
    paymentModal: () => DOM.id('payment-modal'),
    loadingModal: () => DOM.id('loading-modal'),
    
    analysisResultSection: () => DOM.id('analysis-result-section'),
    predictorInfoGrid: () => DOM.id('predictor-info-grid'),
    baziGrid: () => DOM.id('bazi-grid'),
    freeAnalysisText: () => DOM.id('free-analysis-text'),
    lockedAnalysisText: () => DOM.id('locked-analysis-text'),
    unlockItemsList: () => DOM.id('unlock-items-list'),
    unlockPrice: () => DOM.id('unlock-price'),
    unlockCount: () => DOM.id('unlock-count'),
    resultServiceName: () => DOM.id('result-service-name'),
    analysisTime: () => DOM.id('analysis-time'),
    
    paymentServiceType: () => DOM.id('payment-service-type'),
    paymentAmount: () => DOM.id('payment-amount'),
    paymentOrderId: () => DOM.id('payment-order-id')
};

export function initFormOptions() {
    const years = [];
    for (let i = 1900; i <= 2050; i++) years.push(i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 60 }, (_, i) => i);
    
    const fillSelect = (selectId, options, suffix) => {
        const select = DOM.id(selectId);
        if (!select) return;
        select.innerHTML = `<option value="">${suffix}</option>`;
        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.textContent = option + suffix;
            select.appendChild(opt);
        });
    };
    
    fillSelect('birth-year', years, '年');
    fillSelect('birth-month', months, '月');
    fillSelect('birth-day', days, '日');
    fillSelect('birth-hour', hours, '时');
    fillSelect('birth-minute', minutes, '分');
    fillSelect('partner-birth-year', years, '年');
    fillSelect('partner-birth-month', months, '月');
    fillSelect('partner-birth-day', days, '日');
    fillSelect('partner-birth-hour', hours, '时');
    fillSelect('partner-birth-minute', minutes, '分');

    const birthYearEl = DOM.id('birth-year');
    if (birthYearEl) birthYearEl.value = '1990';
    const partnerBirthYearEl = DOM.id('partner-birth-year');
    if (partnerBirthYearEl) partnerBirthYearEl.value = '1990';
    const birthCityEl = DOM.id('birth-city');
    if (birthCityEl) birthCityEl.value = '北京';
}

export function updateServiceDisplay(serviceName) {
    DOM.getAll('.service-nav a').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.service === serviceName) {
            link.classList.add('active');
        }
    });
    
    DOM.id('form-title').textContent = serviceName + '信息填写';
    STATE.currentService = serviceName;
    
    const resultServiceName = UI.resultServiceName();
    if (resultServiceName) {
        resultServiceName.textContent = serviceName + '分析报告';
    }
    
    const partnerInfoSection = DOM.id('partner-info-section');
    const partnerBaziPan = document.getElementById('partner-bazi-pan');
    if (serviceName === '八字合婚') {
        showElement(partnerInfoSection);
        if (partnerBaziPan) showElement(partnerBaziPan);
    } else {
        hideElement(partnerInfoSection);
        if (partnerBaziPan) hideElement(partnerBaziPan);
    }
    
    const serviceConfig = SERVICES[serviceName];
    if (serviceConfig) {
        const heroImage = UI.heroImage();
        const detailImage = UI.detailImage();
        const heroPlaceholder = heroImage?.previousElementSibling;
        const detailPlaceholder = detailImage?.previousElementSibling;
        if (heroPlaceholder) showElement(heroPlaceholder);
        if (detailPlaceholder) showElement(detailPlaceholder);
        if (heroImage) { heroImage.classList.remove('loaded'); heroImage.src = serviceConfig.heroImage; }
        if (detailImage) { detailImage.classList.remove('loaded'); detailImage.src = serviceConfig.detailImage; }
    }
    
    updateUnlockInfo();
}

function _unlockPriceHtml(cfg) {
    const orig = cfg.originalPrice;
    if (orig && orig > cfg.price) {
        return `<del class="orig-price">¥${orig}</del> <span class="sale-price">首次优惠 ¥${cfg.price}</span>`;
    }
    return `<span class="sale-price">¥${cfg.price}</span>`;
}

export function updateUnlockInfo() {
    const serviceConfig = SERVICES[STATE.currentService];
    if (!serviceConfig) return;
    
    const unlockPriceElement = UI.unlockPrice();
    if (unlockPriceElement) {
        unlockPriceElement.innerHTML = _unlockPriceHtml(serviceConfig);
    }
    
    const unlockItemsList = UI.unlockItemsList();
    const unlockCountElement = UI.unlockCount();
    if (unlockItemsList && unlockCountElement) {
        unlockItemsList.innerHTML = '';
        unlockCountElement.textContent = serviceConfig.lockedItems.length;
        serviceConfig.lockedItems.forEach(item => {
            const li = document.createElement('li');
            if (STATE.isPaymentUnlocked) {
                li.innerHTML = '<span>✅ ' + item + '</span>';
                li.classList.add('unlocked-item');
            } else {
                li.innerHTML = '<span>🔒 ' + item + '</span>';
            }
            unlockItemsList.appendChild(li);
        });
    }
}

export function displayPredictorInfo() {
    const predictorInfoGrid = UI.predictorInfoGrid();
    if (!predictorInfoGrid || !STATE.userData) return;
    predictorInfoGrid.innerHTML = '';
    const infoItems = [
        { label: '姓名', value: STATE.userData.name },
        { label: '性别', value: STATE.userData.gender },
        { label: '出生时间', value: `${STATE.userData.birthYear}年${STATE.userData.birthMonth}月${STATE.userData.birthDay}日 ${STATE.userData.birthHour}时${STATE.userData.birthMinute}分` },
        { label: '出生城市', value: STATE.userData.birthCity },
        { label: '测算服务', value: STATE.currentService },
        { label: '测算时间', value: formatDate() }
    ];
    if (STATE.currentService === '八字合婚' && STATE.partnerData) {
        infoItems.push(
            { label: '伴侣姓名', value: STATE.partnerData.partnerName },
            { label: '伴侣性别', value: STATE.partnerData.partnerGender },
            { label: '伴侣出生时间', value: `${STATE.partnerData.partnerBirthYear}年${STATE.partnerData.partnerBirthMonth}月${STATE.partnerData.partnerBirthDay}日 ${STATE.partnerData.partnerBirthHour}时${STATE.partnerData.partnerBirthMinute}分` },
            { label: '伴侣出生城市', value: STATE.partnerData.partnerBirthCity }
        );
    }
    infoItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'predictor-info-item';
        const labelSpan = document.createElement('span');
        labelSpan.className = 'predictor-info-label';
        labelSpan.textContent = item.label;
        const valueSpan = document.createElement('span');
        valueSpan.className = 'predictor-info-value';
        valueSpan.textContent = item.value;
        div.appendChild(labelSpan);
        div.appendChild(valueSpan);
        predictorInfoGrid.appendChild(div);
    });
}

// ============ 八字排盘（专业四柱表） ============
function _wxClass(wx) {
    return { '木': 'wx-mu', '火': 'wx-huo', '土': 'wx-tu', '金': 'wx-jin', '水': 'wx-shui' }[wx] || '';
}

const _GAN_WX = { '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水' };
const _ZHI_WX = { '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水' };

function _renderBaziPan(grid, bazi, genderText) {
    if (!grid) return;
    grid.innerHTML = '';
    if (!bazi || !bazi.year || !bazi.month || !bazi.day || !bazi.hour) {
        grid.innerHTML = '<div style="padding:15px;text-align:center;color:#999;">暂无排盘数据</div>';
        return;
    }
    const ud = STATE.userData || {};

    const wrap = document.createElement('div');
    wrap.className = 'pan-wrap';

    // 头部信息条：乾造印章 + 公历/生肖
    const head = document.createElement('div');
    head.className = 'pan-head';
    const seal = document.createElement('span');
    seal.className = 'pan-seal';
    seal.textContent = genderText || '';
    const info = document.createElement('span');
    info.className = 'pan-head-info';
    const zodiac = bazi.year.zodiac ? (' · ' + bazi.year.zodiac + '年') : '';
    info.textContent = (ud.birthYear ? ('公历 ' + ud.birthYear + '年' + ud.birthMonth + '月' + ud.birthDay + '日 ' + ud.birthHour + '时' + (ud.birthMinute ? ud.birthMinute + '分' : '')) : '') + zodiac;
    head.appendChild(seal);
    head.appendChild(info);
    wrap.appendChild(head);

    const cols = [
        { name: '年柱', p: bazi.year },
        { name: '月柱', p: bazi.month },
        { name: '日柱', p: bazi.day, day: true },
        { name: '时柱', p: bazi.hour }
    ];

    const table = document.createElement('div');
    table.className = 'pan-table';

    cols.forEach(col => {
        const p = col.p;
        const gz = p.ganzhi || '--';
        const gan = p.gan || gz[0] || '';
        const zhi = p.zhi || gz[1] || '';
        const canggan = (p.zhi_canggan || []);
        const cangSs = (p.zhi_canggan_shishen || []);
        const colWx = p.zhi_wuxing || '';

        const cell = document.createElement('div');
        cell.className = 'pan-col' + (col.day ? ' pan-col-day' : '');

        const label = document.createElement('div');
        label.className = 'pan-label';
        label.textContent = col.name;
        cell.appendChild(label);

        const ss = document.createElement('div');
        ss.className = 'pan-shishen' + (col.day ? ' pan-shishen-day' : '');
        ss.textContent = p.gan_shishen || (col.day ? '日主' : '');
        cell.appendChild(ss);

        const gzWrap = document.createElement('div');
        gzWrap.className = 'pan-ganzhi';
        const ganEl = document.createElement('div');
        ganEl.className = 'pan-gan ' + _wxClass(p.gan_wuxing || _GAN_WX[gan] || '');
        ganEl.textContent = gan;
        const zhiEl = document.createElement('div');
        zhiEl.className = 'pan-zhi ' + _wxClass(colWx);
        zhiEl.textContent = zhi;
        gzWrap.appendChild(ganEl);
        gzWrap.appendChild(zhiEl);
        cell.appendChild(gzWrap);

        const wxLine = document.createElement('div');
        wxLine.className = 'pan-wxline';
        const dot = document.createElement('span');
        dot.className = 'pan-wxdot ' + _wxClass(colWx);
        const wxTxt = document.createElement('span');
        wxTxt.className = 'pan-wxtxt ' + _wxClass(colWx);
        wxTxt.textContent = colWx;
        wxLine.appendChild(dot);
        wxLine.appendChild(wxTxt);
        cell.appendChild(wxLine);

        if (canggan.length) {
            const cang = document.createElement('div');
            cang.className = 'pan-canggan';
            canggan.forEach((cg, i) => {
                const item = document.createElement('div');
                item.className = 'pan-cang-item';
                const g = document.createElement('div');
                g.className = 'pan-cang-gan ' + _wxClass(_GAN_WX[cg] || '');
                g.textContent = cg;
                const s = document.createElement('div');
                s.className = 'pan-cang-ss';
                s.textContent = cangSs[i] || '';
                item.appendChild(g);
                item.appendChild(s);
                cang.appendChild(item);
            });
            cell.appendChild(cang);
        }

        const meta = document.createElement('div');
        meta.className = 'pan-meta';
        meta.textContent = p.nayin || '';
        cell.appendChild(meta);

        table.appendChild(cell);
    });

    wrap.appendChild(table);
    grid.appendChild(wrap);
}

export function displayBaziPan() {
    const genderText = (STATE.userData && STATE.userData.gender === '女') ? '坤造' : '乾造';
    _renderBaziPan(document.getElementById('bazi-grid'), STATE.baziData, genderText);
    _renderBaziPan(document.getElementById('partner-bazi-grid'), STATE.partnerBaziData,
        STATE.currentService === '八字合婚' && STATE.partnerData && STATE.partnerData.partnerGender === '女' ? '坤造' : '乾造');
}

// ============ 大运排盘（八步专业格） ============
function _normalizeDayunData(dayunData) {
    if (Array.isArray(dayunData)) return dayunData;
    if (dayunData && Array.isArray(dayunData.list)) return dayunData.list;
    if (dayunData && Array.isArray(dayunData.dayuns)) {
        const ages = dayunData.ages || [];
        return ages.map((age, i) => ({
            age_start: age,
            age_end: age + 9,
            ganzhi: dayunData.dayuns[i] || ''
        }));
    }
    return [];
}

function _ensureDayunCard(cardId, gridId, title, anchorId) {
    let card = document.getElementById(cardId);
    if (!card) {
        const anchor = document.getElementById(anchorId);
        if (!anchor || (anchor.style && anchor.style.display === 'none')) return null;
        card = document.createElement('div');
        card.id = cardId;
        card.className = 'dayun-pan-card';
        card.innerHTML = `<h4>${title}</h4><div id="${gridId}"></div>`;
        if (anchor.nextSibling) {
            anchor.parentNode.insertBefore(card, anchor.nextSibling);
        } else {
            anchor.parentNode.appendChild(card);
        }
    }
    return card;
}

function _renderDayunPan(grid, dayunList) {
    if (!grid) return;
    const list = (dayunList || []).slice(0, 8);
    if (list.length === 0) {
        grid.innerHTML = '<div style="padding:15px;text-align:center;color:#999;">⚠️ 大运排盘数据暂不可用</div>';
        return;
    }
    const wrap = document.createElement('div');
    wrap.className = 'dayun-wrap';

    list.forEach((dy, i) => {
        const gz = dy.ganzhi || '--';
        const gan = gz[0] || '';
        const zhi = gz[1] || '';
        const ageStart = dy.age_start != null ? dy.age_start : null;
        const cell = document.createElement('div');
        cell.className = 'dayun-col' + (i === 0 ? ' dayun-col-first' : '');

        const step = document.createElement('div');
        step.className = 'dayun-step';
        step.textContent = (i + 1) + '运';

        const gzDiv = document.createElement('div');
        gzDiv.className = 'dayun-ganzhi';
        const gEl = document.createElement('span');
        gEl.className = 'dayun-gan ' + _wxClass(_GAN_WX[gan] || '');
        gEl.textContent = gan;
        const zEl = document.createElement('span');
        zEl.className = 'dayun-zhi ' + _wxClass(_ZHI_WX[zhi] || '');
        zEl.textContent = zhi;
        gzDiv.appendChild(gEl);
        gzDiv.appendChild(zEl);

        const ss = document.createElement('div');
        ss.className = 'dayun-shishen';
        ss.textContent = dy.gan_shishen || '';

        const ageDiv = document.createElement('div');
        ageDiv.className = 'dayun-age';
        if (ageStart != null) {
            ageDiv.textContent = ageStart + '-' + (dy.age_end != null ? dy.age_end : ageStart + 9) + '岁';
        }

        cell.appendChild(step);
        cell.appendChild(gzDiv);
        cell.appendChild(ss);
        cell.appendChild(ageDiv);
        wrap.appendChild(cell);
    });

    grid.innerHTML = '';
    grid.appendChild(wrap);
}

export function displayDayunPan(dayunData) {
    const card = _ensureDayunCard('dayun-pan-card', 'dayun-grid', '大运排盘（八步）', 'bazi-pan');
    if (!card) return;
    const grid = document.getElementById('dayun-grid');
    if (!grid) return;
    card.style.display = 'block';
    _renderDayunPan(grid, _normalizeDayunData(dayunData));
}

export function displayPartnerDayunPan(dayunData) {
    const card = _ensureDayunCard('partner-dayun-pan-card', 'partner-dayun-grid', '伴侣大运排盘（八步）', 'partner-bazi-pan');
    if (!card) return;
    const grid = document.getElementById('partner-dayun-grid');
    if (!grid) return;
    card.style.display = 'block';
    _renderDayunPan(grid, _normalizeDayunData(dayunData));
}


// ============ 进度更新 ============
export function updateProgress(currentStep, totalSteps, stepName, percent, message) {
    console.log(`📊 进度: ${stepName} (${currentStep}/${totalSteps}) ${percent}%`);
    
    const progressBar = document.getElementById('progress-bar');
    const progressPercent = document.getElementById('progress-percent');
    const progressLabel = document.getElementById('progress-label');
    
    if (progressBar) {
        progressBar.style.width = Math.min(percent, 100) + '%';
    }
    if (progressPercent) {
        progressPercent.textContent = Math.min(percent, 100) + '%';
    }
    if (progressLabel) {
        progressLabel.textContent = message || '分析中...';
    }
    
    const serviceConfig = SERVICES[STATE.currentService];
    if (!serviceConfig) return;
    
    const steps = serviceConfig.analysisSteps || [];
    const container = document.getElementById('progress-items-container');
    if (!container) return;
    
    let html = '';
    steps.forEach((step, index) => {
        const stepNum = index + 1;
        let status = 'pending';
        let icon = '⏳';
        let color = '#ccc';
        let extraText = '';
        
        if (stepNum < currentStep) {
            status = 'done';
            icon = '✅';
            color = 'var(--success-color)';
            extraText = ' <span style="color:var(--success-color);font-size:12px;">完成</span>';
        } else if (stepNum === currentStep) {
            status = 'active';
            icon = '⏳';
            color = 'var(--secondary-color)';
            extraText = ' <span style="color:var(--secondary-color);font-size:12px;animation:pulseStep 1s ease-in-out infinite;">进行中...</span>';
        }
        
        const isActive = status === 'active';
        const isDone = status === 'done';
        
        html += `
            <div style="display:flex;align-items:center;gap:10px;padding:5px 0;border-bottom:1px solid #f5f5f5;
                ${isActive ? 'animation:pulseStep 1s ease-in-out infinite;' : ''}
                ${isDone ? 'opacity:1;' : 'opacity:0.6;'}">
                <span style="color:${color};font-size:16px;min-width:24px;">${icon}</span>
                <span style="flex:1;font-size:13px;${isDone ? 'color:#333;' : 'color:#999;'}">
                    ${step}${extraText}
                </span>
                ${isDone ? '<span style="color:var(--success-color);font-size:12px;">✓</span>' : ''}
                ${isActive ? `<span style="color:var(--secondary-color);font-size:12px;">⏳</span>` : ''}
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ============ 支付相关函数 ============
export async function showPaymentModal() {
    console.log('调用支付接口...');
    const serviceConfig = SERVICES[STATE.currentService];
    if (!serviceConfig) return;
    
    try {
        const paymentModal = UI.paymentModal();
        if (paymentModal) {
            showElement(paymentModal);
            document.body.style.overflow = 'hidden';
            UI.paymentServiceType().textContent = STATE.currentService;
            UI.paymentAmount().textContent = '¥' + serviceConfig.price;
            UI.paymentOrderId().textContent = '生成中...';
        }
        
        const isMobile = /mobile|android|iphone|ipad|ipod/i.test(navigator.userAgent);
        
        const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/payment/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                service_type: STATE.currentService,
                payment_method: 'alipay',
                client_type: isMobile ? 'h5' : 'pc',
                task_id: localStorage.getItem('current_task_id') || ''
            })
        });
        
        const result = await response.json();
        console.log('支付响应:', result);
        
        if (!result.success) {
            alert('创建订单失败：' + (result.message || '请稍后重试'));
            closePaymentModal();
            return;
        }
        
        const { orderId, outTradeNo, paymentUrl, paymentType, amount } = result.data;
        
        UI.paymentServiceType().textContent = STATE.currentService;
        UI.paymentAmount().textContent = '¥' + amount;
        UI.paymentOrderId().textContent = outTradeNo;
        STATE.currentOrderId = orderId;
        STATE.currentOutTradeNo = outTradeNo;
        
        const paymentMethods = document.querySelector('.payment-methods');
        if (paymentMethods) {
            const buttonHtml = `
                <div style="margin: 20px 0;">
                    <button id="alipay-redirect-btn" class="dynamic-pulse-btn" style="
                        margin: 10px auto; display: block; max-width: ${isMobile ? '280px' : '250px'};
                        background: linear-gradient(135deg, #1677FF, #4096ff); color: white; border: none;
                        padding: ${isMobile ? '16px 35px' : '15px 30px'}; border-radius: 25px;
                        font-size: ${isMobile ? '18px' : '16px'}; font-weight: bold; cursor: pointer; transition: all 0.3s; width: 100%;
                    ">
                        <span style="display: flex; align-items: center; justify-content: center;">
                            <span style="margin-right: 10px;">${isMobile ? '📱' : '💻'}</span>
                            ${isMobile ? '去支付宝支付' : '电脑支付'}
                        </span>
                    </button>
                    <div style="text-align: center; margin-top: 10px; font-size: 12px; color: #999;">
                        ${isMobile ? '将跳转到支付宝APP完成支付' : '使用支付宝扫码或登录完成支付'}
                    </div>
                </div>
            `;
            paymentMethods.innerHTML = buttonHtml;
            
            const payBtn = document.getElementById('alipay-redirect-btn');
            if (payBtn) {
                payBtn.onclick = () => {
                    console.log('跳转到支付宝支付:', paymentUrl);
                    // Save pending order before redirect (critical for mobile)
                    const existingPaymentData = PaymentManager.getPaymentData() || {};
                    existingPaymentData.orderId = orderId;
                    existingPaymentData.waiting = true;
                    existingPaymentData.pendingAt = new Date().toISOString();
                    localStorage.setItem('alipay_payment_data', JSON.stringify(existingPaymentData));
                    console.log('已保存待支付订单到 localStorage:', orderId);
                    window.location.href = paymentUrl;
                };
            }
        }
        
        startPollingPaymentStatus(orderId);
        updatePaymentStatusText(isMobile ? '正在跳转支付宝...' : '等待支付...');
        
    } catch (error) {
        console.error('支付请求失败:', error);
        alert('网络连接失败，请检查网络后重试');
        closePaymentModal();
    }
}

function startPollingPaymentStatus(orderId) {
    let pollCount = 0;
    const maxPolls = 60;
    const pollInterval = 5000;
    
    if (window._paymentPolling) {
        clearInterval(window._paymentPolling);
    }
    
    window._paymentPolling = setInterval(async () => {
        pollCount++;
        try {
            const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/payment/status/${orderId}`);
            const result = await response.json();
            console.log(`📊 轮询支付状态 (${pollCount}/${maxPolls}):`, result);
            
            if (result.success && result.data) {
                if (result.data.status === 'paid') {
                    clearInterval(window._paymentPolling);
                    updatePaymentStatusText('✅ 支付成功！正在解锁...');
                    handlePaymentSuccessDirect(orderId);
                    setTimeout(() => {
                        closePaymentModal();
                        const resultSection = document.getElementById('analysis-result-section');
                        if (resultSection) {
                            resultSection.scrollIntoView({ behavior: 'smooth' });
                        }
                    }, 1000);
                    return;
                }
                if (pollCount >= maxPolls) {
                    clearInterval(window._paymentPolling);
                    updatePaymentStatusText('⏰ 支付超时，请重新下单');
                    return;
                }
                const statusText = result.data.status === 'pending' ? '等待支付...' : '处理中...';
                updatePaymentStatusText(statusText);
            }
        } catch (error) {
            console.error('轮询支付状态失败:', error);
            if (pollCount >= maxPolls) {
                clearInterval(window._paymentPolling);
                updatePaymentStatusText('⏰ 查询超时，请点击"我已支付"手动确认');
            }
        }
    }, pollInterval);
}

function updatePaymentStatusText(text) {
    let statusElement = document.getElementById('payment-status-text');
    if (!statusElement) {
        const container = document.querySelector('.payment-methods');
        if (container) {
            const div = document.createElement('div');
            div.id = 'payment-status-text';
            div.style.cssText = 'text-align:center;margin:10px 0;padding:10px;background:#f8f9fa;border-radius:6px;font-size:14px;color:#666;';
            container.appendChild(div);
            statusElement = div;
        }
    }
    if (statusElement) statusElement.textContent = text;
}

function handlePaymentSuccessDirect(orderId) {
    STATE.isPaymentUnlocked = true;
    STATE.isDownloadLocked = false;

    localStorage.setItem('alipay_payment_data', JSON.stringify({
        orderId: orderId,
        verified: true,
        verifiedAt: new Date().toISOString(),
        waiting: false
    }));

    unlockDownloadButton();
    updateUnlockInterface();
    showFullAnalysisContent();

    const lockedOverlay = document.getElementById('locked-overlay');
    if (lockedOverlay) lockedOverlay.style.display = 'none';

    if (window.PaymentManager && typeof PaymentManager.showSuccessMessage === 'function') {
        PaymentManager.showSuccessMessage();
    }

    try { localStorage.removeItem('alipay_payment_data'); } catch(e) {}
}

export function closePaymentModal() {
    const paymentModal = UI.paymentModal();
    if (paymentModal) {
        hideElement(paymentModal);
        const loadingModal = document.getElementById('loading-modal');
        if (!loadingModal || loadingModal.style.display === 'none') {
            document.body.style.overflow = 'auto';
        }
    }
    if (window._paymentPolling) {
        clearInterval(window._paymentPolling);
        window._paymentPolling = null;
    }
}

export function updateUnlockInterface() {
    const lockedOverlay = DOM.id('locked-overlay');
    if (!lockedOverlay) return;
    
    const unlockHeader = lockedOverlay.querySelector('.unlock-header');
    if (unlockHeader) {
        const lockIcon = unlockHeader.querySelector('.lock-icon');
        const headerTitle = unlockHeader.querySelector('h4');
        const headerDesc = unlockHeader.querySelector('p');
        if (lockIcon) lockIcon.textContent = '✅';
        if (headerTitle) headerTitle.textContent = '完整报告已解锁';
        if (headerDesc) headerDesc.textContent = '您可以查看全部命理分析内容';
    }
    
    const unlockItems = lockedOverlay.querySelectorAll('.unlock-items li');
    unlockItems.forEach(item => {
        item.classList.add('unlocked-item');
        const text = item.textContent.replace('🔒 ', '');
        item.innerHTML = '<span>✅ ' + text + '</span>';
    });
    
    const unlockBtnContainer = lockedOverlay.querySelector('.unlock-btn-container');
    if (unlockBtnContainer) {
        const unlockBtn = unlockBtnContainer.querySelector('.unlock-btn');
        const unlockPrice = unlockBtnContainer.querySelector('.unlock-price');
        if (unlockBtn) {
            unlockBtn.innerHTML = '✅ 已解锁完整报告';
            unlockBtn.style.background = 'linear-gradient(135deg, var(--success-color), #28c76f)';
            unlockBtn.style.cursor = 'default';
            unlockBtn.disabled = true;
        }
        if (unlockPrice) {
            unlockPrice.innerHTML = '<span style="color: var(--success-color);">✅ 已解锁全部内容</span>';
        }
    }
}

export function showFullAnalysisContent() {
    const lockedAnalysisText = UI.lockedAnalysisText();
    const freeAnalysisText = UI.freeAnalysisText();
    if (lockedAnalysisText && freeAnalysisText) {
        const paidHtml = lockedAnalysisText.innerHTML;
        if (paidHtml && paidHtml.trim() && !freeAnalysisText.dataset.paidAppended) {
            const divider = '<div style="border-top: 2px dashed var(--primary-color); margin: 20px 0; padding-top: 15px; text-align: center; color: var(--primary-color); font-size: 14px; font-weight: bold;">— 以下为完整详细报告 —</div>';
            freeAnalysisText.innerHTML = freeAnalysisText.innerHTML + divider + paidHtml;
            freeAnalysisText.dataset.paidAppended = 'true';
        }
    }
}

export function lockDownloadButton() {
    const downloadBtn = UI.downloadReportBtn();
    const downloadBtnText = DOM.id('download-btn-text');
    if (downloadBtn && downloadBtnText) {
        downloadBtn.disabled = true;
        downloadBtn.classList.add('download-btn-locked');
        downloadBtnText.textContent = '下载报告';
        STATE.isDownloadLocked = true;
    }
}

export function unlockDownloadButton() {
    const downloadBtn = UI.downloadReportBtn();
    const downloadBtnText = DOM.id('download-btn-text');
    if (downloadBtn && downloadBtnText) {
        downloadBtn.disabled = false;
        downloadBtn.classList.remove('download-btn-locked');
        downloadBtnText.textContent = '下载报告';
        STATE.isDownloadLocked = false;
        downloadBtn.style.background = 'linear-gradient(135deg, var(--primary-color), #3a7bd5)';
        downloadBtn.style.boxShadow = '0 4px 15px rgba(58, 123, 213, 0.4)';
    }
}

export function resetUnlockInterface() {
    const lockedOverlay = DOM.id('locked-overlay');
    if (!lockedOverlay) return;
    
    lockedOverlay.style.display = '';
    
    const unlockHeader = lockedOverlay.querySelector('.unlock-header');
    if (unlockHeader) {
        const lockIcon = unlockHeader.querySelector('.lock-icon');
        const headerTitle = unlockHeader.querySelector('h4');
        const headerDesc = unlockHeader.querySelector('p');
        if (lockIcon) lockIcon.textContent = '🔒';
        if (headerTitle) headerTitle.textContent = '完整内容已锁定';
        if (headerDesc) headerDesc.textContent = '解锁完整分析报告，查看全部命理分析内容';
    }
    
    const unlockItemsList = UI.unlockItemsList();
    if (unlockItemsList) {
        unlockItemsList.innerHTML = '';
        const serviceConfig = SERVICES[STATE.currentService];
        if (serviceConfig) {
            serviceConfig.lockedItems.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = '<span>🔒 ' + item + '</span>';
                unlockItemsList.appendChild(li);
            });
        }
    }
    
    const unlockBtnContainer = lockedOverlay.querySelector('.unlock-btn-container');
    if (unlockBtnContainer) {
        const unlockBtn = unlockBtnContainer.querySelector('.unlock-btn');
        const unlockPrice = unlockBtnContainer.querySelector('.unlock-price');
        const serviceConfig = SERVICES[STATE.currentService];
        if (serviceConfig && unlockBtn && unlockPrice) {
            unlockBtn.innerHTML = `解锁完整报告 (<span id="unlock-price">${_unlockPriceHtml(serviceConfig)}</span>)`;
            unlockBtn.style.background = 'linear-gradient(135deg, var(--secondary-color), #e6b800)';
            unlockBtn.style.cursor = 'pointer';
            unlockBtn.disabled = false;
            unlockPrice.innerHTML = `共包含 <span id="unlock-count">${serviceConfig.lockedItems.length}</span> 项详细分析`;
        }
    }
}

export function animateButtonStretch() {
    const button = UI.analyzeBtn();
    if (!button) return;
    button.classList.add('stretching');
    setTimeout(() => {
        button.classList.remove('stretching');
        setTimeout(() => {
            button.style.width = '';
            button.style.maxWidth = '';
        }, 5000);
    }, 800);
}

export function showLoadingModal() {
    const loadingModal = UI.loadingModal();
    if (loadingModal) {
        showElement(loadingModal);
        document.body.style.overflow = 'hidden';
    }
}

export function hideLoadingModal() {
    const loadingModal = UI.loadingModal();
    if (loadingModal) {
        hideElement(loadingModal);
        document.body.style.overflow = 'auto';
    }
}

export function showAnalysisResult() {
    const analysisResultSection = UI.analysisResultSection();
    if (analysisResultSection) {
        showElement(analysisResultSection);
        UI.analysisTime().textContent = formatDate();
        analysisResultSection.scrollIntoView({ behavior: 'smooth' });
    }
}

export function hideAnalysisResult() {
    const analysisResultSection = UI.analysisResultSection();
    if (analysisResultSection) {
        hideElement(analysisResultSection);
    }
}

export function resetFormErrors() {
    DOM.getAll('.error').forEach(error => {
        error.style.display = 'none';
    });
}

export function validateForm() {
    let isValid = true;
    resetFormErrors();
    
    const validateField = (fieldId, errorId) => {
        const field = DOM.id(fieldId);
        const error = DOM.id(errorId);
        if (!field || !error) return true;
        if (!field.value || field.value.trim() === '') {
            error.style.display = 'block';
            return false;
        }
        return true;
    };
    
    if (!validateField('name', 'name-error')) isValid = false;
    if (!validateField('gender', 'gender-error')) isValid = false;
    if (!validateField('birth-year', 'birth-year-error')) isValid = false;
    if (!validateField('birth-month', 'birth-month-error')) isValid = false;
    if (!validateField('birth-day', 'birth-day-error')) isValid = false;
    if (!validateField('birth-hour', 'birth-hour-error')) isValid = false;
    if (!validateField('birth-minute', 'birth-minute-error')) isValid = false;
    if (!validateField('birth-city', 'birth-city-error')) isValid = false;
    
    if (STATE.currentService === '八字合婚') {
        if (!validateField('partner-name', 'partner-name-error')) isValid = false;
        if (!validateField('partner-gender', 'partner-gender-error')) isValid = false;
        if (!validateField('partner-birth-year', 'partner-birth-year-error')) isValid = false;
        if (!validateField('partner-birth-month', 'partner-birth-month-error')) isValid = false;
        if (!validateField('partner-birth-day', 'partner-birth-day-error')) isValid = false;
        if (!validateField('partner-birth-hour', 'partner-birth-hour-error')) isValid = false;
        if (!validateField('partner-birth-minute', 'partner-birth-minute-error')) isValid = false;
        if (!validateField('partner-birth-city', 'partner-birth-city-error')) isValid = false;
    }
    
    return isValid;
}

export function collectUserData() {
    STATE.userData = {
        name: UI.name().value,
        gender: UI.gender().value === 'male' ? '男' : '女',
        birthYear: UI.birthYear().value,
        birthMonth: UI.birthMonth().value,
        birthDay: UI.birthDay().value,
        birthHour: UI.birthHour().value,
        birthMinute: UI.birthMinute().value,
        birthCity: UI.birthCity().value
    };
    if (STATE.currentService === '八字合婚') {
        STATE.partnerData = {
            partnerName: UI.partnerName().value,
            partnerGender: UI.partnerGender().value === 'male' ? '男' : '女',
            partnerBirthYear: UI.partnerBirthYear().value,
            partnerBirthMonth: UI.partnerBirthMonth().value,
            partnerBirthDay: UI.partnerBirthDay().value,
            partnerBirthHour: UI.partnerBirthHour().value,
            partnerBirthMinute: UI.partnerBirthMinute().value,
            partnerBirthCity: UI.partnerBirthCity().value
        };
        STATE.userData.partner_data = STATE.partnerData;
    }
}
