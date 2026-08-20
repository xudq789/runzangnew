// UI控制模块
import { DOM, formatDate, hideElement, showElement, generateOrderId, calculateBazi } from './utils.js';
import { SERVICES, STATE, API_CONFIG } from './config.js';

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
    for (let i = 1900; i <= 2024; i++) years.push(i);
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
}

export function setDefaultValues() {
    UI.name().value = '张三';
    UI.gender().value = 'male';
    UI.birthCity().value = '北京';
    UI.birthYear().value = 1990;
    UI.birthMonth().value = 1;
    UI.birthDay().value = 1;
    UI.birthHour().value = 12;
    UI.birthMinute().value = 0;
    UI.partnerName().value = '李四';
    UI.partnerGender().value = 'female';
    UI.partnerBirthCity().value = '上海';
    UI.partnerBirthYear().value = 1992;
    UI.partnerBirthMonth().value = 6;
    UI.partnerBirthDay().value = 15;
    UI.partnerBirthHour().value = 15;
    UI.partnerBirthMinute().value = 30;
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

export function updateUnlockInfo() {
    const serviceConfig = SERVICES[STATE.currentService];
    if (!serviceConfig) return;
    
    const unlockPriceElement = UI.unlockPrice();
    if (unlockPriceElement) {
        unlockPriceElement.textContent = serviceConfig.price;
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

export function displayBaziPan() {
    // 显示用户八字
    const userGrid = document.getElementById('bazi-grid');
    if (userGrid) {
        userGrid.innerHTML = '';
        const bazi = STATE.baziData;
        if (bazi) {
            const columns = [
                { label: '年柱', value: bazi.year.ganzhi, element: bazi.year.nayin },
                { label: '月柱', value: bazi.month.ganzhi, element: bazi.month.nayin },
                { label: '日柱', value: bazi.day.ganzhi, element: bazi.day.nayin },
                { label: '时柱', value: bazi.hour.ganzhi, element: bazi.hour.nayin }
            ];
            columns.forEach(col => {
                const div = document.createElement('div');
                div.className = 'bazi-column';
                const labelDiv = document.createElement('div');
                labelDiv.className = 'bazi-label';
                labelDiv.textContent = col.label;
                const valueDiv = document.createElement('div');
                valueDiv.className = 'bazi-value';
                valueDiv.textContent = col.value;
                const elementDiv = document.createElement('div');
                elementDiv.className = 'bazi-element';
                elementDiv.textContent = col.element || '';
                div.appendChild(labelDiv);
                div.appendChild(valueDiv);
                div.appendChild(elementDiv);
                userGrid.appendChild(div);
            });
        }
    }
    
    // 显示伴侣八字（合婚时）
    const partnerGrid = document.getElementById('partner-bazi-grid');
    if (partnerGrid) {
        partnerGrid.innerHTML = '';
        const bazi = STATE.partnerBaziData;
        if (bazi) {
            const columns = [
                { label: '年柱', value: bazi.year.ganzhi, element: bazi.year.nayin },
                { label: '月柱', value: bazi.month.ganzhi, element: bazi.month.nayin },
                { label: '日柱', value: bazi.day.ganzhi, element: bazi.day.nayin },
                { label: '时柱', value: bazi.hour.ganzhi, element: bazi.hour.nayin }
            ];
            columns.forEach(col => {
                const div = document.createElement('div');
                div.className = 'bazi-column';
                const labelDiv = document.createElement('div');
                labelDiv.className = 'bazi-label';
                labelDiv.textContent = col.label;
                const valueDiv = document.createElement('div');
                valueDiv.className = 'bazi-value';
                valueDiv.textContent = col.value;
                const elementDiv = document.createElement('div');
                elementDiv.className = 'bazi-element';
                elementDiv.textContent = col.element || '';
                div.appendChild(labelDiv);
                div.appendChild(valueDiv);
                div.appendChild(elementDiv);
                partnerGrid.appendChild(div);
            });
        } else if (STATE.currentService === '八字合婚') {
            partnerGrid.innerHTML = `<div style="padding: 15px; text-align: center; color: #999; background: #f9f5f0; border-radius: 8px;">请先进行八字合婚测算</div>`;
        }
    }
}

// ============ 大运排盘显示（修复版） ============
export function displayDayunPan(dayunData) {
    console.log('📊 显示大运排盘...', dayunData);
    
    // 查找或创建大运卡片容器
    let dayunCard = document.getElementById('dayun-pan-card');
    if (!dayunCard) {
        const baziPan = document.getElementById('bazi-pan');
        if (baziPan) {
            const card = document.createElement('div');
            card.id = 'dayun-pan-card';
            card.className = 'dayun-pan-card';
            card.style.display = 'block';
            card.style.marginTop = '20px';
            card.style.padding = '15px';
            card.style.background = '#fff';
            card.style.borderRadius = '10px';
            card.style.boxShadow = '0 5px 15px rgba(0,0,0,0.05)';
            card.style.border = '1px solid #ddd';
            card.innerHTML = `
                <h4 style="color: var(--primary-color); font-size: 18px; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid var(--light-color);">大运排盘</h4>
                <div id="dayun-grid" style="width: 100%; overflow-x: auto;"></div>
            `;
            // 插入到 baziPan 之后，修复只能显示一步的问题
            if (baziPan.nextSibling) {
                baziPan.parentNode.insertBefore(card, baziPan.nextSibling);
            } else {
                baziPan.parentNode.appendChild(card);
            }
            dayunCard = card;
        }
    }
    
    if (!dayunCard) return;
    
    const dayunGrid = document.getElementById('dayun-grid');
    if (!dayunGrid) return;
    
    dayunGrid.innerHTML = '';
    
    let dayunList = [];
    let startAge = 8;
    
    // 数据解析逻辑
    if (dayunData && dayunData.dayuns && Array.isArray(dayunData.dayuns) && dayunData.dayuns.length > 0) {
        const ages = dayunData.ages || [];
        const dayuns = dayunData.dayuns || [];
        dayunList = ages.map((age, i) => ({
            age_start: age,
            age_end: age + 10,
            ganzhi: dayuns[i] || ''
        }));
        startAge = ages[0] || 8;
    } else if (dayunData && dayunData.list && Array.isArray(dayunData.list) && dayunData.list.length > 0) {
        dayunList = dayunData.list;
        startAge = dayunData.start_age || 8;
    } else if (Array.isArray(dayunData) && dayunData.length > 0) {
        dayunList = dayunData;
    }
    
    if (!dayunList || dayunList.length === 0) {
        dayunGrid.innerHTML = `<div style="padding: 15px; text-align: center; color: #999;">⚠️ 大运排盘数据暂不可用</div>`;
        dayunCard.style.display = 'block';
        return;
    }
    
    // 取前8步大运
    const displayList = dayunList.slice(0, 8);
    const numColumns = displayList.length;
    
    // 构建一个标准、干净的表格
    let tableHtml = `
        <table style="width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); font-size: 13px;">
            <thead>
                <tr>
                    <th style="padding: 8px 10px; background: var(--primary-color); color: white; text-align: center; font-weight: 600; width: 10%;">大运</th>
    `;
    
    displayList.forEach((dy, index) => {
        let ageLabel = '';
        if (dy.age_start !== undefined && dy.age_start !== null) {
            ageLabel = `${dy.age_start}岁`;
        } else {
            ageLabel = `${startAge + index * 10}岁`;
        }
        const bgColor = index % 2 === 0 ? 'var(--primary-color)' : '#a0522d';
        tableHtml += `
            <th style="padding: 8px 10px; background: ${bgColor}; color: white; text-align: center; font-weight: 600; width: ${Math.min(90 / numColumns, 15)}%;">${ageLabel}</th>
        `;
    });
    
    tableHtml += `
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="padding: 8px 10px; background: #f5f1e8; text-align: center; font-weight: 600; color: var(--dark-color);">干支</td>
    `;
    
    displayList.forEach((dy, index) => {
        const bgColor = index % 2 === 0 ? '#faf8f5' : '#fff';
        tableHtml += `
            <td style="padding: 8px 10px; text-align: center; font-weight: 500; color: var(--primary-color); background: ${bgColor};">${dy.ganzhi || '--'}</td>
        `;
    });
    
    tableHtml += `
                </tr>
            </tbody>
        </table>
    `;
    
    dayunGrid.innerHTML = tableHtml;
    dayunCard.style.display = 'block';
}

// 显示伴侣大运排盘
export function displayPartnerDayunPan(dayunData) {
    console.log('📊 显示伴侣大运排盘...', dayunData);
    
    let dayunCard = document.getElementById('partner-dayun-pan-card');
    if (!dayunCard) {
        const partnerBaziPan = document.getElementById('partner-bazi-pan');
        if (partnerBaziPan && partnerBaziPan.style.display !== 'none') {
            const card = document.createElement('div');
            card.id = 'partner-dayun-pan-card';
            card.className = 'dayun-pan-card';
            card.style.display = 'block';
            card.style.marginTop = '20px';
            card.style.padding = '15px';
            card.style.background = '#fff';
            card.style.borderRadius = '10px';
            card.style.boxShadow = '0 5px 15px rgba(0,0,0,0.05)';
            card.style.border = '1px solid #ddd';
            card.innerHTML = `
                <h4 style="color: var(--primary-color); font-size: 18px; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid var(--light-color);">伴侣大运排盘</h4>
                <div id="partner-dayun-grid" style="width: 100%; overflow-x: auto;"></div>
            `;
            // 插入到 partnerBaziPan 之后
            if (partnerBaziPan.nextSibling) {
                partnerBaziPan.parentNode.insertBefore(card, partnerBaziPan.nextSibling);
            } else {
                partnerBaziPan.parentNode.appendChild(card);
            }
            dayunCard = card;
        }
    }
    
    if (!dayunCard) return;
    
    const dayunGrid = document.getElementById('partner-dayun-grid');
    if (!dayunGrid) return;
    
    dayunGrid.innerHTML = '';
    
    let dayunList = [];
    let startAge = 8;
    
    if (dayunData && dayunData.list && Array.isArray(dayunData.list) && dayunData.list.length > 0) {
        dayunList = dayunData.list;
        startAge = dayunData.start_age || 8;
    } else if (Array.isArray(dayunData) && dayunData.length > 0) {
        dayunList = dayunData;
    }
    
    if (!dayunList || dayunList.length === 0) {
        dayunGrid.innerHTML = `<div style="padding: 15px; text-align: center; color: #999;">⚠️ 伴侣大运排盘数据暂不可用</div>`;
        dayunCard.style.display = 'block';
        return;
    }
    
    const displayList = dayunList.slice(0, 8);
    const numColumns = displayList.length;
    
    let tableHtml = `
        <table style="width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); font-size: 13px;">
            <thead>
                <tr>
                    <th style="padding: 8px 10px; background: var(--primary-color); color: white; text-align: center; font-weight: 600; width: 10%;">大运</th>
    `;
    
    displayList.forEach((dy, index) => {
        let ageLabel = '';
        if (dy.age_start !== undefined && dy.age_start !== null) {
            ageLabel = `${dy.age_start}岁`;
        } else {
            ageLabel = `${startAge + index * 10}岁`;
        }
        const bgColor = index % 2 === 0 ? 'var(--primary-color)' : '#a0522d';
        tableHtml += `
            <th style="padding: 8px 10px; background: ${bgColor}; color: white; text-align: center; font-weight: 600; width: ${Math.min(90 / numColumns, 15)}%;">${ageLabel}</th>
        `;
    });
    
    tableHtml += `
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="padding: 8px 10px; background: #f5f1e8; text-align: center; font-weight: 600; color: var(--dark-color);">干支</td>
    `;
    
    displayList.forEach((dy, index) => {
        const bgColor = index % 2 === 0 ? '#faf8f5' : '#fff';
        tableHtml += `
            <td style="padding: 8px 10px; text-align: center; font-weight: 500; color: var(--primary-color); background: ${bgColor};">${dy.ganzhi || '--'}</td>
        `;
    });
    
    tableHtml += `
                </tr>
            </tbody>
        </table>
    `;
    
    dayunGrid.innerHTML = tableHtml;
    dayunCard.style.display = 'block';
}

// ============ 解析大运数据（增强版） ============
export function parseDayunData(analysisResult) {
    console.log('🔍 解析大运数据...');
    
    const result = { ages: [], dayuns: [], elements: [] };
    
    // 方法1：匹配标准格式 "岁：[8 18 28 38 48 58 68 78]"
    const ageRegex = /岁[：:]\s*\[?([\d\s]+)\]?/;
    const dayunRegex = /大运[：:]\s*\[?([^\n\]]+)\]?/;
    
    const ageMatch = analysisResult.match(ageRegex);
    if (ageMatch) {
        result.ages = ageMatch[1].trim().split(/\s+/).map(Number).filter(a => !isNaN(a) && a > 0);
    }
    
    const dayunMatch = analysisResult.match(dayunRegex);
    if (dayunMatch) {
        result.dayuns = dayunMatch[1].trim().split(/\s+/).filter(d => d.length === 2);
    }
    
    // 方法2：如果方法1没匹配到，用逐行解析
    if (result.ages.length === 0 || result.dayuns.length === 0) {
        const lines = analysisResult.split('\n');
        let foundDayunSection = false;
        let tempAges = [], tempDayuns = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.includes('【大运排盘】')) {
                foundDayunSection = true;
                continue;
            }
            if (foundDayunSection && trimmed.match(/^【/)) break;
            if (!foundDayunSection) continue;
            
            const ageNumbers = trimmed.match(/\d+/g);
            if (ageNumbers && trimmed.includes('岁')) {
                tempAges = ageNumbers.map(Number);
            }
            const dayunMatches = trimmed.match(/[\u4e00-\u9fa5]{2}/g);
            if (dayunMatches && trimmed.includes('大运')) {
                tempDayuns = dayunMatches;
            }
        }
        
        if (tempAges.length > 0 && tempDayuns.length > 0) {
            result.ages = tempAges;
            result.dayuns = tempDayuns;
        }
    }
    
    const maxLen = Math.min(8, result.ages.length, result.dayuns.length);
    result.ages = result.ages.slice(0, maxLen);
    result.dayuns = result.dayuns.slice(0, maxLen);
    
    console.log('✅ 大运数据:', result);
    return result;
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

// ============ 处理分析结果（修复合婚免费内容缺失） ============
export function processAndDisplayAnalysis(result) {
    // 提取所有分析章节
    const sections = result.split('【');
    let freeContent = '';
    let lockedContent = '';
    
    // 判断是否是合婚服务，如果是，【用户八字排盘】和【伴侣八字排盘】应该放入免费内容
    const isHehun = STATE.currentService === '八字合婚';
    const freeSections = ['【八字排盘】', '【八字喜用分析】', '【性格特点】', '【适宜行业职业推荐】'];
    // 合婚服务下，把这些也加入免费列表
    if (isHehun) {
        freeSections.push('【用户八字排盘】', '【伴侣八字排盘】', '【用户大运排盘】', '【伴侣大运排盘】');
    }
    
    for (let i = 1; i < sections.length; i++) {
        const section = '【' + sections[i];
        const sectionTitle = section.split('】')[0] + '】';
        
        if (freeSections.includes(sectionTitle)) {
            freeContent += section + '\n\n';
        } else {
            lockedContent += section + '\n\n';
        }
    }
    
    // 如果免费内容太少，用备份逻辑
    if (freeContent.length < 100) {
        freeContent = '';
        for (const freeSection of freeSections) {
            const startIndex = result.indexOf(freeSection);
            if (startIndex !== -1) {
                let endIndex = result.indexOf('【', startIndex + 1);
                if (endIndex === -1) endIndex = result.length;
                freeContent += result.substring(startIndex, endIndex) + '\n\n';
            }
        }
        if (freeContent) lockedContent = result.replace(freeContent, '');
    }
    
    // 渲染免费内容
    const freeAnalysisText = UI.freeAnalysisText();
    if (freeAnalysisText) {
        let formattedContent = '';
        const freeSectionsArray = freeContent.split('\n\n');
        freeSectionsArray.forEach(section => {
            if (section.trim()) {
                const titleMatch = section.match(/【([^】]+)】/);
                if (titleMatch) {
                    const title = titleMatch[1];
                    const content = section.replace(titleMatch[0], '').trim();
                    formattedContent += `<div class="analysis-section"><h5>${title}</h5><div class="analysis-content">${content.replace(/\n/g, '<br>')}</div></div>`;
                } else {
                    formattedContent += `<div class="analysis-content">${section.replace(/\n/g, '<br>')}</div>`;
                }
            }
        });
        freeAnalysisText.innerHTML = formattedContent;
    }
    
    // 渲染锁定内容
    const lockedAnalysisText = UI.lockedAnalysisText();
    if (lockedAnalysisText) {
        let formattedLockedContent = '';
        const lockedSectionsArray = lockedContent.split('\n\n');
        lockedSectionsArray.forEach(section => {
            if (section.trim()) {
                const titleMatch = section.match(/【([^】]+)】/);
                if (titleMatch) {
                    const title = titleMatch[1];
                    const content = section.replace(titleMatch[0], '').trim();
                    formattedLockedContent += `<div class="analysis-section"><h5>${title}</h5><div class="analysis-content">${content.replace(/\n/g, '<br>')}</div></div>`;
                } else {
                    formattedLockedContent += `<div class="analysis-content">${section.replace(/\n/g, '<br>')}</div>`;
                }
            }
        });
        lockedAnalysisText.innerHTML = formattedLockedContent;
    }
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
                serviceType: STATE.currentService,
                userData: STATE.userData
            })
        });
        
        const result = await response.json();
        console.log('支付响应:', result);
        
        if (!result.success) {
            alert('创建订单失败：' + (result.error || '请稍后重试'));
            closePaymentModal();
            return;
        }
        
        const { orderId, outTradeNo, paymentUrl, paymentType, amount } = result.data;
        
        UI.paymentServiceType().textContent = STATE.currentService;
        UI.paymentAmount().textContent = '¥' + amount;
        UI.paymentOrderId().textContent = outTradeNo;
        STATE.currentOrderId = orderId;
        STATE.currentOutTradeNo = outTradeNo;
        
        if (STATE.fullAnalysisResult) {
            localStorage.setItem('last_analysis_result', STATE.fullAnalysisResult);
            localStorage.setItem('last_analysis_service', STATE.currentService);
            localStorage.setItem('last_user_data', JSON.stringify(STATE.userData || {}));
            localStorage.setItem('last_order_id', orderId);
        }
        
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
    
    if (typeof unlockDownloadButton === 'function') {
        unlockDownloadButton();
    }
    if (typeof updateUnlockInterface === 'function') {
        updateUnlockInterface();
    }
    if (typeof showFullAnalysisContent === 'function') {
        showFullAnalysisContent();
    }
    if (window.PaymentManager && typeof PaymentManager.unlockContent === 'function') {
        PaymentManager.unlockContent(orderId);
    }
}

export function closePaymentModal() {
    const paymentModal = UI.paymentModal();
    if (paymentModal) {
        hideElement(paymentModal);
        document.body.style.overflow = 'auto';
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
    if (lockedAnalysisText && lockedAnalysisText.textContent.trim() && freeAnalysisText) {
        freeAnalysisText.innerHTML = freeAnalysisText.innerHTML + lockedAnalysisText.innerHTML;
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
            unlockBtn.innerHTML = `解锁完整报告 (¥<span id="unlock-price">${serviceConfig.price}</span>)`;
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
    }
}
