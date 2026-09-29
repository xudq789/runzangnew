// UI控制模块
import { DOM, formatDate, hideElement, showElement } from './utils.js?v=20';
import { SERVICES, STATE, API_CONFIG } from './config.js?v=21';
import { reverseBaziFromPillars } from './api.js?v=22';

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
    userModeSwitch: () => DOM.id('user-mode-switch'),
    userBirthCityGroup: () => DOM.id('user-birth-city-group'),
    userBirthTimeGroup: () => DOM.id('user-birth-time-group'),
    userLunarFields: () => DOM.id('user-lunar-fields'),
    userBaziFields: () => DOM.id('user-bazi-fields'),
    lunarYear: () => DOM.id('lunar-year'),
    lunarMonth: () => DOM.id('lunar-month'),
    lunarDay: () => DOM.id('lunar-day'),
    lunarLeap: () => DOM.id('lunar-leap'),
    lunarHour: () => DOM.id('lunar-hour'),
    reverseBtn: () => DOM.id('reverse-btn'),
    reverseResult: () => DOM.id('reverse-result'),
    reverseError: () => DOM.id('reverse-error'),
    solarFillNote: () => DOM.id('solar-fill-note'),
    
    partnerName: () => DOM.id('partner-name'),
    partnerGender: () => DOM.id('partner-gender'),
    partnerBirthCity: () => DOM.id('partner-birth-city'),
    partnerBirthYear: () => DOM.id('partner-birth-year'),
    partnerBirthMonth: () => DOM.id('partner-birth-month'),
    partnerBirthDay: () => DOM.id('partner-birth-day'),
    partnerBirthHour: () => DOM.id('partner-birth-hour'),
    partnerBirthMinute: () => DOM.id('partner-birth-minute'),
    partnerModeSwitch: () => DOM.id('partner-mode-switch'),
    partnerBirthCityGroup: () => DOM.id('partner-birth-city-group'),
    partnerBirthTimeGroup: () => DOM.id('partner-birth-time-group'),
    partnerLunarFields: () => DOM.id('partner-lunar-fields'),
    partnerBaziFields: () => DOM.id('partner-bazi-fields'),
    partnerLunarYear: () => DOM.id('partner-lunar-year'),
    partnerLunarMonth: () => DOM.id('partner-lunar-month'),
    partnerLunarDay: () => DOM.id('partner-lunar-day'),
    partnerLunarLeap: () => DOM.id('partner-lunar-leap'),
    partnerLunarHour: () => DOM.id('partner-lunar-hour'),
    partnerReverseBtn: () => DOM.id('partner-reverse-btn'),
    partnerReverseResult: () => DOM.id('partner-reverse-result'),
    partnerReverseError: () => DOM.id('partner-reverse-error'),
    partnerSolarFillNote: () => DOM.id('partner-solar-fill-note'),
    
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

    initDirectFormOptions();
}

const _GAN_A = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const _ZHI_A = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const _GAN_YANG = new Set(['甲', '丙', '戊', '庚', '壬']);
const _YANG_ZHI = ['子', '寅', '辰', '午', '申', '戌'];
const _YIN_ZHI = ['丑', '卯', '巳', '未', '酉', '亥'];

function _fillGanSelect(selectId, label) {
    const select = DOM.id(selectId);
    if (!select) return;
    select.innerHTML = `<option value="">${label}</option>`;
    _GAN_A.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g;
        opt.textContent = g;
        select.appendChild(opt);
    });
}

function _fillZhiSelect(selectId, label, ganValue) {
    const select = DOM.id(selectId);
    if (!select) return;
    const isYang = _GAN_YANG.has(ganValue);
    const zhiList = ganValue ? (isYang ? _YANG_ZHI : _YIN_ZHI) : _ZHI_A;
    const placeholder = ganValue ? label : '请先选天干';
    select.innerHTML = `<option value="">${placeholder}</option>`;
    zhiList.forEach(z => {
        const opt = document.createElement('option');
        opt.value = z;
        opt.textContent = z;
        select.appendChild(opt);
    });
}

function _onGanChange(scope) {
    const prefix = _scopePrefix(scope);
    ['year', 'month', 'day', 'hour'].forEach(pillar => {
        const ganEl = DOM.id(prefix + 'direct-' + pillar + '-gan');
        const zhiEl = DOM.id(prefix + 'direct-' + pillar + '-zhi');
        if (!ganEl || !zhiEl) return;
        const ganVal = ganEl.value;
        const prevZhi = zhiEl.value;
        const isYang = _GAN_YANG.has(ganVal);
        const zhiList = ganVal ? (isYang ? _YANG_ZHI : _YIN_ZHI) : _ZHI_A;
        const placeholder = ganVal ? '地支' : '请先选天干';
        zhiEl.innerHTML = `<option value="">${placeholder}</option>`;
        zhiList.forEach(z => {
            const opt = document.createElement('option');
            opt.value = z;
            opt.textContent = z;
            zhiEl.appendChild(opt);
        });
        if (ganVal && zhiList.includes(prevZhi)) {
            zhiEl.value = prevZhi;
        }
    });
}

function _fillYearSelect(selectId, label, start, end, defValue) {
    const select = DOM.id(selectId);
    if (!select) return;
    select.innerHTML = `<option value="">${label}</option>`;
    for (let y = start; y <= end; y++) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y + '年';
        select.appendChild(opt);
    }
    if (defValue) select.value = String(defValue);
}

function _fillNumberSelect(selectId, label, start, end, suffix) {
    const select = DOM.id(selectId);
    if (!select) return;
    select.innerHTML = `<option value="">${label}</option>`;
    for (let i = start; i <= end; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = i + suffix;
        select.appendChild(opt);
    }
}

const _SHICHEN_OPTIONS = [
    ['子', '子时(23-01)'], ['丑', '丑时(01-03)'], ['寅', '寅时(03-05)'], ['卯', '卯时(05-07)'],
    ['辰', '辰时(07-09)'], ['巳', '巳时(09-11)'], ['午', '午时(11-13)'], ['未', '未时(13-15)'],
    ['申', '申时(15-17)'], ['酉', '酉时(17-19)'], ['戌', '戌时(19-21)'], ['亥', '亥时(21-23)']
];

export function initDirectFormOptions() {
    const curYear = new Date().getFullYear();

    ['', 'partner-'].forEach(prefix => {
        ['year', 'month', 'day', 'hour'].forEach(pillar => {
            _fillGanSelect(prefix + 'direct-' + pillar + '-gan', '天干');
            _fillZhiSelect(prefix + 'direct-' + pillar + '-zhi', '地支', '');
        });
        const scope = prefix ? 'partner' : 'user';
        ['year', 'month', 'day', 'hour'].forEach(pillar => {
            const ganEl = DOM.id(prefix + 'direct-' + pillar + '-gan');
            if (ganEl) ganEl.addEventListener('change', () => _onGanChange(scope));
        });
    });

    ['', 'partner-'].forEach(prefix => {
        _fillYearSelect(prefix + 'lunar-year', '农历年份', 1900, 2050, curYear);
        _fillNumberSelect(prefix + 'lunar-month', '农历月份', 1, 12, '月');
        _fillNumberSelect(prefix + 'lunar-day', '农历日期', 1, 30, '日');
        const hourSel = DOM.id(prefix + 'lunar-hour');
        if (hourSel) {
            hourSel.innerHTML = '<option value="">选择时辰</option>';
            _SHICHEN_OPTIONS.forEach(([v, label]) => {
                const opt = document.createElement('option');
                opt.value = v;
                opt.textContent = label;
                hourSel.appendChild(opt);
            });
        }
    });

    bindModeSwitch('user');
    bindModeSwitch('partner');
    bindReverseButton('user');
    bindReverseButton('partner');
    applyFormMode('user', 'solar');
    applyFormMode('partner', 'solar');
}

export function getFormMode(scope) {
    const sw = scope === 'partner' ? UI.partnerModeSwitch() : UI.userModeSwitch();
    if (!sw) return 'solar';
    const active = sw.querySelector('.mode-btn.active');
    return active ? active.dataset.mode : 'solar';
}

export function bindModeSwitch(scope) {
    const sw = scope === 'partner' ? UI.partnerModeSwitch() : UI.userModeSwitch();
    if (!sw) return;
    sw.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            sw.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (btn.dataset.mode === 'reverse') markReverseUnfilled(scope);
            applyFormMode(scope, btn.dataset.mode);
        });
    });
}

export function applyFormMode(scope, mode) {
    if (scope === 'partner') {
        const city = UI.partnerBirthCityGroup();
        const time = UI.partnerBirthTimeGroup();
        const lunar = UI.partnerLunarFields();
        const bazi = UI.partnerBaziFields();
        if (mode === 'lunar') {
            if (city) showElement(city);
            if (time) hideElement(time);
            if (lunar) showElement(lunar);
            if (bazi) hideElement(bazi);
        } else if (mode === 'reverse') {
            if (city) hideElement(city);
            if (time) hideElement(time);
            if (lunar) hideElement(lunar);
            if (bazi) showElement(bazi);
        } else {
            if (city) showElement(city);
            if (time) showElement(time);
            if (lunar) hideElement(lunar);
            if (bazi) hideElement(bazi);
        }
    } else {
        const city = UI.userBirthCityGroup();
        const time = UI.userBirthTimeGroup();
        const lunar = UI.userLunarFields();
        const bazi = UI.userBaziFields();
        if (mode === 'lunar') {
            if (city) showElement(city);
            if (time) hideElement(time);
            if (lunar) showElement(lunar);
            if (bazi) hideElement(bazi);
        } else if (mode === 'reverse') {
            if (city) hideElement(city);
            if (time) hideElement(time);
            if (lunar) hideElement(lunar);
            if (bazi) showElement(bazi);
        } else {
            if (city) showElement(city);
            if (time) showElement(time);
            if (lunar) hideElement(lunar);
            if (bazi) hideElement(bazi);
        }
    }
}

export function resetToDefaultModes() {
    [UI.solarFillNote(), UI.partnerSolarFillNote()].forEach(el => { if (el) el.style.display = 'none'; });
    [UI.reverseResult(), UI.reverseError(), UI.partnerReverseResult(), UI.partnerReverseError()].forEach(el => {
        if (el) el.style.display = 'none';
    });
    _reverseFilled.user = false;
    _reverseFilled.partner = false;
    const userSw = UI.userModeSwitch();
    if (userSw) {
        userSw.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        const def = userSw.querySelector('.mode-btn[data-mode="solar"]');
        if (def) def.classList.add('active');
        applyFormMode('user', 'solar');
    }
    const partnerSw = UI.partnerModeSwitch();
    if (partnerSw) {
        partnerSw.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        const def = partnerSw.querySelector('.mode-btn[data-mode="solar"]');
        if (def) def.classList.add('active');
        applyFormMode('partner', 'solar');
    }
}

function _scopePrefix(scope) {
    return scope === 'partner' ? 'partner-' : '';
}

export function bindReverseButton(scope) {
    const btn = scope === 'partner' ? UI.partnerReverseBtn() : UI.reverseBtn();
    if (!btn) return;
    btn.addEventListener('click', () => doReverse(scope));
}

export async function doReverse(scope) {
    const prefix = _scopePrefix(scope);
    const resultBox = scope === 'partner' ? UI.partnerReverseResult() : UI.reverseResult();
    const errBox = scope === 'partner' ? UI.partnerReverseError() : UI.reverseError();
    const gz = ['year', 'month', 'day', 'hour'].map(pillar => {
        const ganEl = DOM.id(prefix + 'direct-' + pillar + '-gan');
        const zhiEl = DOM.id(prefix + 'direct-' + pillar + '-zhi');
        const g = ganEl ? ganEl.value : '';
        const z = zhiEl ? zhiEl.value : '';
        return g && z ? g + z : '';
    });
    if (errBox) errBox.style.display = 'none';
    if (!gz.every(v => v)) {
        if (errBox) { errBox.textContent = '请先选择完整的四柱干支（年/月/日/时柱）'; errBox.style.display = 'block'; }
        if (resultBox) resultBox.style.display = 'none';
        return;
    }
    if (resultBox) resultBox.style.display = 'none';
    try {
        const res = await reverseBaziFromPillars({ direct_year: gz[0], direct_month: gz[1], direct_day: gz[2], direct_hour: gz[3] });
        if (!res.success) {
            if (errBox) { errBox.textContent = res.error || '反推失败，请稍后再试'; errBox.style.display = 'block'; }
            return;
        }
        const cands = res.candidates || [];
        if (!cands.length) {
            if (errBox) { errBox.textContent = '未找到匹配的公历日期：请核对四柱是否自洽（月柱需符合年柱五虎遁、时柱需符合日柱五鼠遁）。'; errBox.style.display = 'block'; }
            return;
        }
        if (resultBox) {
            resultBox.innerHTML = '<div class="reverse-result-title">反推出以下可能的公历出生时间，请点选一项：</div>';
            cands.forEach(c => {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'reverse-cand-btn';
                const ageTxt = (c.age !== null && c.age !== undefined && c.age >= 0) ? `（约${c.age}岁）` : '（未来年份）';
                b.textContent = c.label + ageTxt;
                b.addEventListener('click', () => fillSolarFromCandidate(scope, c));
                resultBox.appendChild(b);
            });
            resultBox.style.display = 'block';
        }
    } catch (e) {
        if (errBox) { errBox.textContent = '反推请求失败：' + String(e && e.message || e); errBox.style.display = 'block'; }
    }
}

export function fillSolarFromCandidate(scope, c) {
    const prefix = _scopePrefix(scope);
    const ids = { year: 'birth-year', month: 'birth-month', day: 'birth-day', hour: 'birth-hour', minute: 'birth-minute' };
    if (scope === 'partner') {
        Object.keys(ids).forEach(k => { ids[k] = 'partner-' + ids[k]; });
    }
    const setSel = (id, val) => {
        const el = DOM.id(id);
        if (el) { el.value = String(val); el.dispatchEvent(new Event('change', { bubbles: true })); }
    };
    setSel(ids.year, c.year);
    setSel(ids.month, c.month);
    setSel(ids.day, c.day);
    setSel(ids.hour, c.hour);
    setSel(ids.minute, (c.minute !== null && c.minute !== undefined) ? c.minute : 0);

    const sw = scope === 'partner' ? UI.partnerModeSwitch() : UI.userModeSwitch();
    if (sw) {
        sw.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === 'solar'));
    }
    applyFormMode(scope, 'solar');
    _reverseFilled[scope] = true;
    const note = scope === 'partner' ? UI.partnerSolarFillNote() : UI.solarFillNote();
    if (note) {
        note.style.display = 'block';
        note.textContent = `已由四柱反推得到公历 ${c.label}，请核对；如需调整可直接修改公历时间。`;
    }
}

// 英雄区/明细区大图：CSS 里 opacity:0，须由 JS 加 .loaded 才可见。
// load 事件可能早于监听器挂载就已触发（图片命中缓存 + initApp 先 await 支付检查），
// 因此挂载后必须用 complete 补判一次，否则永久停在"正在加载图片..."。
function _imagePlaceholder(img) {
    return img ? img.previousElementSibling : null;
}

export function bindServiceImage(img) {
    if (!img || img.dataset.imgBound === '1') return;
    img.dataset.imgBound = '1';
    const placeholder = _imagePlaceholder(img);
    const show = function () {
        img.classList.add('loaded');
        if (placeholder) placeholder.style.display = 'none';
    };
    const fail = function () {
        img.classList.remove('loaded');
        if (placeholder) {
            placeholder.textContent = '图片加载失败';
            placeholder.style.display = '';
        }
    };
    img.addEventListener('load', show);
    img.addEventListener('error', fail);
    if (img.complete) {
        if (img.naturalWidth > 0) show();
        else fail();
    }
}

export function setServiceImage(img, src) {
    if (!img || !src) return;
    bindServiceImage(img);
    if (img.getAttribute('src') === src) return;
    const placeholder = _imagePlaceholder(img);
    img.classList.remove('loaded');
    if (placeholder) {
        placeholder.textContent = '正在加载图片...';
        placeholder.style.display = '';
    }
    img.src = src;
    // 同源图片被浏览器瞬时命中时 complete 已为 true，load 事件不会再补发
    if (img.complete && img.naturalWidth > 0) {
        img.classList.add('loaded');
        if (placeholder) placeholder.style.display = 'none';
    }
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
        setServiceImage(UI.heroImage(), serviceConfig.heroImage);
        setServiceImage(UI.detailImage(), serviceConfig.detailImage);
    }
    
    updateUnlockInfo();
}

function _unlockBtnHtml() {
    return '<span class="unlock-btn-text">解锁完整报告</span>';
}

export function updateUnlockInfo() {
    const serviceConfig = SERVICES[STATE.currentService];
    if (!serviceConfig) return;
    
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

    const ud = STATE.userData || {};
    const solarText = (u) => (u && u.birthYear ? `${u.birthYear}年${u.birthMonth}月${u.birthDay}日 ${u.birthHour}时${u.birthMinute ? u.birthMinute + '分' : ''}` : '');
    const lunarText = (u) => {
        if (!u) return '';
        const leap = u.lunarLeap ? '闰' : '';
        return `农历${u.lunarYear}年${leap}${u.lunarMonth}月${u.lunarDay}日${u.lunarHour}时`;
    };
    const isLunar = ud.input_mode === 'lunar';
    const infoItems = [
        { label: '姓名', value: ud.name },
        { label: '性别', value: ud.gender },
        { label: '出生时间', value: isLunar ? lunarText(ud) : solarText(ud) },
        { label: '出生城市', value: ud.birthCity }
    ];
    infoItems.push(
        { label: '测算服务', value: STATE.currentService },
        { label: '测算时间', value: formatDate() }
    );

    if (STATE.currentService === '八字合婚' && STATE.partnerData) {
        const pd = STATE.partnerData;
        const pLunar = pd.partnerInputMode === 'lunar';
        const pLeap = pd.partnerLunarLeap ? '闰' : '';
        const pBirth = pLunar
            ? `农历${pd.partnerLunarYear}年${pLeap}${pd.partnerLunarMonth}月${pd.partnerLunarDay}日${pd.partnerLunarHour}时`
            : `${pd.partnerBirthYear}年${pd.partnerBirthMonth}月${pd.partnerBirthDay}日 ${pd.partnerBirthHour}时${pd.partnerBirthMinute ? pd.partnerBirthMinute + '分' : ''}`;
        infoItems.push(
            { label: '伴侣姓名', value: pd.partnerName },
            { label: '伴侣性别', value: pd.partnerGender },
            { label: '伴侣出生时间', value: pBirth },
            { label: '伴侣出生城市', value: pd.partnerBirthCity }
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

// ============ 八字排盘（四柱竖排干支） ============
function _wxClass(wx) {
    return { '木': 'wx-mu', '火': 'wx-huo', '土': 'wx-tu', '金': 'wx-jin', '水': 'wx-shui' }[wx] || '';
}

const _GAN_WX = { '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水' };
const _ZHI_WX = { '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水' };

function _gzIndex(gz) {
    if (!gz || gz.length !== 2) return -1;
    const g = _GAN_A.indexOf(gz[0]);
    const z = _ZHI_A.indexOf(gz[1]);
    if (g < 0 || z < 0) return -1;
    for (let i = 0; i < 60; i++) {
        if (i % 10 === g && i % 12 === z) return i;
    }
    return -1;
}

// 旬空（空亡）：本柱干支所在旬里缺的两个地支
function _kongWang(gz) {
    const i = _gzIndex(gz);
    if (i < 0) return '';
    const head = (i % 12 - i % 10 + 12) % 12;
    return _ZHI_A[(head + 10) % 12] + _ZHI_A[(head + 11) % 12];
}

// 星运（十二长生）：日主天干对各地支，阳干顺行、阴干逆行
const _CS_ORDER = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];
const _CS_START = { '甲': '亥', '乙': '午', '丙': '寅', '丁': '酉', '戊': '寅', '己': '酉', '庚': '巳', '辛': '子', '壬': '申', '癸': '卯' };
const _CS_YANG = { '甲': 1, '丙': 1, '戊': 1, '庚': 1, '壬': 1 };

function _changSheng(dayGan, zhi) {
    const s = _ZHI_A.indexOf(_CS_START[dayGan]);
    const z = _ZHI_A.indexOf(zhi);
    if (s < 0 || z < 0) return '';
    const step = _CS_YANG[dayGan] ? (z - s + 12) % 12 : (s - z + 12) % 12;
    return _CS_ORDER[step];
}

function _renderBaziColumns(grid, bazi) {
    if (!grid) return;
    grid.classList.add('bazi-grid');
    grid.innerHTML = '';
    if (!bazi || !bazi.year || !bazi.month || !bazi.day || !bazi.hour) {
        grid.innerHTML = '<div class="pan-empty">暂无排盘数据</div>';
        return;
    }
    const keys = ['year', 'month', 'day', 'hour'];
    const labels = { year: '年柱', month: '月柱', day: '日柱', hour: '时柱' };
    const pillars = keys.map(k => bazi[k]);
    const dayGan = ((bazi.day.ganzhi || bazi.day.gan || '')[0]) || '';
    // 早期入库的排盘缺这些补充字段，整行缺位时不渲染，避免留一排空框
    const anyOf = get => pillars.some(p => {
        const v = get(p);
        return Array.isArray(v) ? v.length > 0 : !!v;
    });
    const show = {
        zhuxing: anyOf(p => p.gan_shishen),
        canggan: anyOf(p => p.zhi_canggan),
        fuxing: anyOf(p => p.zhi_canggan_shishen),
        kongwang: anyOf(p => _kongWang(p.ganzhi)),
        xingyun: anyOf(p => _changSheng(dayGan, p.zhi || (p.ganzhi || '')[1]))
    };

    let html = '<div class="pz-corner">柱位</div>';
    keys.forEach(k => { html += '<div class="pz-hd">' + labels[k] + '</div>'; });

    const row = (label, cellFn, cls, on) => {
        if (!on) return;
        html += '<div class="pz-lb">' + label + '</div>';
        pillars.forEach(p => { html += '<div class="pz-cell ' + cls + '">' + (cellFn(p) || '—') + '</div>'; });
    };

    row('主星', p => p.gan_shishen || '', 'pz-ss', show.zhuxing);
    row('天干', p => { const gz = p.ganzhi || ''; return '<b class="pz-big ' + _wxClass(p.gan_wuxing || _GAN_WX[p.gan || gz[0]]) + '">' + (p.gan || gz[0] || '') + '</b>'; }, 'pz-gzrow', true);
    row('地支', p => { const gz = p.ganzhi || ''; return '<b class="pz-big ' + _wxClass(p.zhi_wuxing || _ZHI_WX[p.zhi || gz[1]]) + '">' + (p.zhi || gz[1] || '') + '</b>'; }, 'pz-gzrow', true);
    row('藏干', p => (p.zhi_canggan || []).map(c => '<b class="pz-cg ' + _wxClass(_GAN_WX[c]) + '">' + c + '</b>').join(''), 'pz-cgrow', show.canggan);
    row('副星', p => (p.zhi_canggan_shishen || []).map(s => '<i class="pz-fx">' + s + '</i>').join(''), 'pz-fxrow', show.fuxing);
    row('纳音', p => p.nayin || '', 'pz-ny', true);
    row('空亡', p => _kongWang(p.ganzhi), 'pz-kw', show.kongwang);
    row('星运', p => _changSheng(dayGan, p.zhi || (p.ganzhi || '')[1]), 'pz-cs', show.xingyun);

    grid.innerHTML = html;
}

export function displayBaziPan() {
    _renderBaziColumns(document.getElementById('bazi-grid'), STATE.baziData);
    const partnerGrid = document.getElementById('partner-bazi-grid');
    if (partnerGrid) {
        partnerGrid.innerHTML = '';
        const bazi = STATE.partnerBaziData;
        if (bazi && bazi.year && bazi.month && bazi.day && bazi.hour) {
            _renderBaziColumns(partnerGrid, bazi);
        } else if (STATE.currentService === '八字合婚') {
            partnerGrid.innerHTML = '<div style="padding:15px;text-align:center;color:#999;background:#f9f5f0;border-radius:8px;">请先进行八字合婚测算</div>';
        }
    }
}

// ============ 大运 · 流年（一行一块，行首竖排标签；点大运切该步十年） ============
// 起讫年拆成三段：手机端把连接符隐掉、两年上下排，才压得进一行
function _dyYearHtml(dy) {
    const ys = (dy && dy.years) || [];
    if (ys.length === 0) return '<span class="dy-yr">　</span>';
    return '<span class="dy-yr"><span>' + ys[0].year + '</span>'
        + '<span class="dy-dash">—</span><span>' + ys[ys.length - 1].year + '</span></span>';
}

// activeIndex 为 null 时输出纯展示条（首页公开案例用，其数据无 years）
function _buildDayunStrip(displayList, startAge, activeIndex) {
    const clickable = activeIndex != null;
    let html = '';
    displayList.forEach((dy, index) => {
        const gz = dy.ganzhi || '--';
        const age = (dy.age_start != null) ? dy.age_start : (startAge + index * 10);
        const cls = 'dy-cell' + (index === activeIndex ? ' is-active' : '');
        const inner = '<span class="dy-age">' + age + '—' + (age + 9) + '<i>岁</i></span>'
            + '<span class="dy-gz">' + _gzPair(gz, _GAN_WX, _ZHI_WX) + '</span>'
            + _dyYearHtml(dy);
        html += clickable
            ? '<button type="button" class="' + cls + '" data-pan-idx="' + index + '">' + inner + '</button>'
            : '<div class="' + cls + '">' + inner + '</div>';
    });
    return html;
}

function _gzPair(gz, wxGanMap, wxZhiMap) {
    const gan = gz[0] || '';
    const zhi = gz[1] || '';
    return '<b class="' + _wxClass(wxGanMap[gan]) + '">' + gan + '</b>'
         + '<b class="' + _wxClass(wxZhiMap[zhi]) + '">' + zhi + '</b>';
}

function _buildLiunianStrip(dayunList, activeIndex) {
    const dy = dayunList[activeIndex];
    const years = (dy && Array.isArray(dy.years)) ? dy.years : [];
    if (years.length === 0) return '';
    const thisYear = new Date().getFullYear();
    let html = '<div class="ln-strip">';
    years.forEach(y => {
        html += '<div class="ln-cell' + (y.year === thisYear ? ' is-now' : '') + '">'
            + '<span class="ln-yr">' + (y.year || '') + '</span>'
            + '<span class="ln-gz">' + _gzPair(y.ganzhi || '--', _GAN_WX, _ZHI_WX) + '</span>'
            + '<span class="ln-age">' + (y.age != null ? y.age : '') + '<i>岁</i></span>'
            + '</div>';
    });
    return html + '</div>';
}

function _defaultDayunIndex(dayunList) {
    const thisYear = new Date().getFullYear();
    for (let i = 0; i < dayunList.length; i++) {
        const years = dayunList[i].years || [];
        if (years.length && thisYear >= years[0].year && thisYear <= years[years.length - 1].year) return i;
    }
    return 0;
}

function _normalizeDayunData(dayunData) {
    let dayunList = [];
    let startAge = 8;
    if (dayunData && dayunData.dayuns && Array.isArray(dayunData.dayuns) && dayunData.dayuns.length > 0) {
        const ages = dayunData.ages || [];
        const dayuns = dayunData.dayuns || [];
        dayunList = ages.map((age, i) => ({
            age_start: age,
            age_end: age + 10,
            ganzhi: dayuns[i] || '',
            years: (dayunData.list || [])[i] ? (dayunData.list[i].years || []) : []
        }));
        startAge = ages[0] || 8;
    } else if (dayunData && dayunData.list && Array.isArray(dayunData.list) && dayunData.list.length > 0) {
        dayunList = dayunData.list;
        startAge = dayunData.start_age || 8;
    } else if (Array.isArray(dayunData) && dayunData.length > 0) {
        dayunList = dayunData;
    }
    return { dayunList, startAge };
}

const _PAN_EMPTY_HTML = '<div class="pan-empty">__MSG__</div>';

const _PAN_CFG = {
    self: {
        cardId: 'dayun-pan-card', gridId: 'dayun-grid', liunianGridId: 'liunian-grid',
        anchorId: 'bazi-pan', dyLabel: '大运', lnLabel: '流年',
        empty: '大运排盘数据暂不可用', lnEmpty: '流年排盘数据暂不可用'
    },
    partner: {
        cardId: 'partner-dayun-pan-card', gridId: 'partner-dayun-grid', liunianGridId: 'partner-liunian-grid',
        anchorId: 'partner-bazi-pan', dyLabel: '大运', lnLabel: '流年',
        empty: '伴侣大运排盘数据暂不可用', lnEmpty: '伴侣流年排盘数据暂不可用'
    }
};

function _vLabel(text) {
    return '<span class="yun-lb">' + text.split('').map(c => '<i>' + c + '</i>').join('') + '</span>';
}

// 大运·流年行块并入八字卡（同一个框）；每次重建，监听器不会累积
function _ensurePanCard(cfg) {
    let card = document.getElementById(cfg.cardId);
    if (card && card.parentNode) card.parentNode.removeChild(card);
    const anchor = document.getElementById(cfg.anchorId);
    if (!anchor || (anchor.style && anchor.style.display === 'none')) return null;
    card = document.createElement('div');
    card.id = cfg.cardId;
    card.className = 'pan-yun';
    card.innerHTML = '<div class="yun-row">' + _vLabel(cfg.dyLabel)
        + '<div class="dy-strip" id="' + cfg.gridId + '"></div></div>'
        + '<div class="yun-row">' + _vLabel(cfg.lnLabel)
        + '<div class="ln-box" id="' + cfg.liunianGridId + '"></div></div>';
    anchor.appendChild(card);
    return card;
}

// 合并卡的大运/流年共用一份选中状态（点大运 → 换该步十年流年）
const _panLinks = {};

function _showDayunPan(key, dayunData, liunianOnly) {
    const cfg = _PAN_CFG[key];
    const link = _panLinks[key];
    if (liunianOnly && link) { link.draw(); return; }

    const card = _ensurePanCard(cfg);
    if (!card) return;
    const { dayunList, startAge } = _normalizeDayunData(dayunData);
    const strip = document.getElementById(cfg.gridId);
    const lnBox = document.getElementById(cfg.liunianGridId);
    if (dayunList.length === 0) {
        strip.innerHTML = _PAN_EMPTY_HTML.replace('__MSG__', cfg.empty);
        lnBox.innerHTML = '';
        card.style.display = 'block';
        return;
    }
    const displayList = dayunList.slice(0, 8);
    const state = { active: _defaultDayunIndex(displayList) };
    const draw = () => {
        strip.innerHTML = _buildDayunStrip(displayList, startAge, state.active);
        lnBox.innerHTML = _buildLiunianStrip(displayList, state.active)
            || _PAN_EMPTY_HTML.replace('__MSG__', cfg.lnEmpty);
    };
    strip.addEventListener('click', e => {
        const cell = e.target.closest ? e.target.closest('button[data-pan-idx]') : null;
        if (!cell) return;
        const idx = parseInt(cell.getAttribute('data-pan-idx'), 10);
        if (isNaN(idx) || idx === state.active) return;
        state.active = idx;
        draw();
    });
    draw();
    _panLinks[key] = { displayList, state, draw };
    card.style.display = 'block';
}

export function displayDayunPan(dayunData) {
    _showDayunPan('self', dayunData, false);
}

export function displayPartnerDayunPan(dayunData) {
    _showDayunPan('partner', dayunData, false);
}

export function displayLiunianPan(dayunData) {
    _showDayunPan('self', dayunData, true);
}

export function displayPartnerLiunianPan(dayunData) {
    _showDayunPan('partner', dayunData, true);
}

// ============ 首页公开案例渲染 ============
export function renderPublicBaziPan(grid, bazi, genderText) {
    _renderBaziColumns(grid, bazi);
}

export function renderPublicDayunPan(grid, rawDayunData) {
    if (!grid) return;
    const { dayunList } = _normalizeDayunData(rawDayunData);
    grid.classList.add('dy-strip');
    if (dayunList.length === 0) {
        grid.innerHTML = _PAN_EMPTY_HTML.replace('__MSG__', '大运排盘数据暂不可用');
        return;
    }
    grid.innerHTML = _buildDayunStrip(dayunList.slice(0, 8), dayunList[0].age_start || 8, null);
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
            const alipayIcon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="#1677FF" aria-hidden="true" style="display: block;"><path d="M19.695 15.07c3.426 1.158 4.203 1.22 4.203 1.22V3.846c0-2.124-1.705-3.845-3.81-3.845H3.914C1.808.001.102 1.722.102 3.846v16.31c0 2.123 1.706 3.845 3.813 3.845h16.173c2.105 0 3.81-1.722 3.81-3.845v-.157s-6.19-2.602-9.315-4.119c-2.096 2.602-4.8 4.181-7.607 4.181-4.75 0-6.361-4.19-4.112-6.949.49-.602 1.324-1.175 2.617-1.497 2.025-.502 5.247.313 8.266 1.317a16.796 16.796 0 0 0 1.341-3.302H5.781v-.952h4.799V6.975H4.77v-.953h5.81V3.591s0-.409.411-.409h2.347v2.84h5.744v.951h-5.744v1.704h4.69a19.453 19.453 0 0 1-1.986 5.06c1.424.52 2.702 1.011 3.654 1.333m-13.81-2.032c-.596.06-1.71.325-2.321.869-1.83 1.608-.735 4.55 2.968 4.55 2.151 0 4.301-1.388 5.99-3.61-2.403-1.182-4.438-2.028-6.637-1.809"/></svg>`;
            const buttonHtml = `
                <div style="margin: 20px 0;">
                    <button id="alipay-redirect-btn" class="dynamic-pulse-btn" style="
                        margin: 10px auto; display: block; max-width: ${isMobile ? '280px' : '250px'};
                        background: linear-gradient(135deg, #1677FF, #4096ff); color: white; border: none;
                        padding: ${isMobile ? '16px 35px' : '15px 30px'}; border-radius: 25px;
                        font-size: ${isMobile ? '18px' : '16px'}; font-weight: bold; cursor: pointer; transition: all 0.3s; width: 100%;
                    ">
                        <span style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                            <span style="display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; background: #fff; border-radius: 8px; flex: 0 0 auto;">${alipayIcon}</span>
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
            unlockBtn.innerHTML = _unlockBtnHtml();
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

const _reverseFilled = { user: false, partner: false };

export function markReverseUnfilled(scope) {
    _reverseFilled[scope] = false;
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

    const validatePillars = (prefix) => {
        let ok = true;
        ['year', 'month', 'day', 'hour'].forEach(pillar => {
            const ganId = prefix + 'direct-' + pillar + '-gan';
            const zhiId = prefix + 'direct-' + pillar + '-zhi';
            const errId = prefix + 'direct-' + pillar + '-error';
            const ganEl = DOM.id(ganId);
            const zhiEl = DOM.id(zhiId);
            const errEl = DOM.id(errId);
            if (!ganEl || !ganEl.value || !zhiEl || !zhiEl.value) {
                if (errEl) { errEl.style.display = 'block'; }
                ok = false;
            } else {
                if (errEl) { errEl.style.display = 'none'; }
            }
        });
        return ok;
    };

    if (!validateField('name', 'name-error')) isValid = false;
    if (!validateField('gender', 'gender-error')) isValid = false;

    const userMode = getFormMode('user');
    if (userMode === 'lunar') {
        if (!validateField('lunar-year', 'lunar-year-error')) isValid = false;
        if (!validateField('lunar-month', 'lunar-month-error')) isValid = false;
        if (!validateField('lunar-day', 'lunar-day-error')) isValid = false;
        if (!validateField('lunar-hour', 'lunar-hour-error')) isValid = false;
        if (!validateField('birth-city', 'birth-city-error')) isValid = false;
    } else if (userMode === 'reverse') {
        if (!validatePillars('')) isValid = false;
        if (!_reverseFilled.user) {
            const errBox = UI.reverseError();
            if (errBox) { errBox.textContent = '请先点击"反推公历出生时间"并在结果中选一项公历日期后再测算。'; errBox.style.display = 'block'; }
            isValid = false;
        }
    } else {
        if (!validateField('birth-year', 'birth-year-error')) isValid = false;
        if (!validateField('birth-month', 'birth-month-error')) isValid = false;
        if (!validateField('birth-day', 'birth-day-error')) isValid = false;
        if (!validateField('birth-hour', 'birth-hour-error')) isValid = false;
        if (!validateField('birth-minute', 'birth-minute-error')) isValid = false;
        if (!validateField('birth-city', 'birth-city-error')) isValid = false;
    }

    if (STATE.currentService === '八字合婚') {
        if (!validateField('partner-name', 'partner-name-error')) isValid = false;
        if (!validateField('partner-gender', 'partner-gender-error')) isValid = false;
        const partnerMode = getFormMode('partner');
        if (partnerMode === 'lunar') {
            if (!validateField('partner-lunar-year', 'partner-lunar-year-error')) isValid = false;
            if (!validateField('partner-lunar-month', 'partner-lunar-month-error')) isValid = false;
            if (!validateField('partner-lunar-day', 'partner-lunar-day-error')) isValid = false;
            if (!validateField('partner-lunar-hour', 'partner-lunar-hour-error')) isValid = false;
            if (!validateField('partner-birth-city', 'partner-birth-city-error')) isValid = false;
        } else if (partnerMode === 'reverse') {
            if (!validatePillars('partner-')) isValid = false;
            if (!_reverseFilled.partner) {
                const errBox = UI.partnerReverseError();
                if (errBox) { errBox.textContent = '请先为伴侣点击"反推公历出生时间"并在结果中选一项公历日期后再测算。'; errBox.style.display = 'block'; }
                isValid = false;
            }
        } else {
            if (!validateField('partner-birth-year', 'partner-birth-year-error')) isValid = false;
            if (!validateField('partner-birth-month', 'partner-birth-month-error')) isValid = false;
            if (!validateField('partner-birth-day', 'partner-birth-day-error')) isValid = false;
            if (!validateField('partner-birth-hour', 'partner-birth-hour-error')) isValid = false;
            if (!validateField('partner-birth-minute', 'partner-birth-minute-error')) isValid = false;
            if (!validateField('partner-birth-city', 'partner-birth-city-error')) isValid = false;
        }
    }
    
    return isValid;
}

export function collectUserData() {
    const userMode = getFormMode('user');
    const genderText = () => UI.gender().value === 'male' ? '男' : '女';
    const partnerGenderText = () => UI.partnerGender().value === 'male' ? '男' : '女';

    if (userMode === 'lunar') {
        STATE.userData = {
            name: UI.name().value,
            gender: genderText(),
            birthCity: UI.birthCity().value,
            input_mode: 'lunar',
            lunarYear: UI.lunarYear().value,
            lunarMonth: UI.lunarMonth().value,
            lunarDay: UI.lunarDay().value,
            lunarLeap: !!(UI.lunarLeap() && UI.lunarLeap().checked),
            lunarHour: UI.lunarHour().value
        };
    } else {
        STATE.userData = {
            name: UI.name().value,
            gender: genderText(),
            birthYear: UI.birthYear().value,
            birthMonth: UI.birthMonth().value,
            birthDay: UI.birthDay().value,
            birthHour: UI.birthHour().value,
            birthMinute: UI.birthMinute().value,
            birthCity: UI.birthCity().value
        };
    }
    if (STATE.currentService === '八字合婚') {
        const partnerMode = getFormMode('partner');
        if (partnerMode === 'lunar') {
            STATE.partnerData = {
                partnerName: UI.partnerName().value,
                partnerGender: partnerGenderText(),
                partnerBirthCity: UI.partnerBirthCity().value,
                partnerInputMode: 'lunar',
                partnerLunarYear: UI.partnerLunarYear().value,
                partnerLunarMonth: UI.partnerLunarMonth().value,
                partnerLunarDay: UI.partnerLunarDay().value,
                partnerLunarLeap: !!(UI.partnerLunarLeap() && UI.partnerLunarLeap().checked),
                partnerLunarHour: UI.partnerLunarHour().value
            };
        } else {
            STATE.partnerData = {
                partnerName: UI.partnerName().value,
                partnerGender: partnerGenderText(),
                partnerBirthYear: UI.partnerBirthYear().value,
                partnerBirthMonth: UI.partnerBirthMonth().value,
                partnerBirthDay: UI.partnerBirthDay().value,
                partnerBirthHour: UI.partnerBirthHour().value,
                partnerBirthMinute: UI.partnerBirthMinute().value,
                partnerBirthCity: UI.partnerBirthCity().value
            };
        }
        STATE.userData.partner_data = STATE.partnerData;
    }
}
