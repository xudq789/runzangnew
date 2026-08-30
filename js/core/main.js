// ============ 【支付宝支付回调处理模块】 ============
const AlipayCallbackHandler = {
    checkBackendCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        console.log('🔍 检查URL参数:', window.location.search);
        console.log('🔍 所有参数:', Array.from(urlParams.entries()));
        
        const paymentSuccess = urlParams.get('payment_success');
        const orderId = urlParams.get('order_id');
        const verified = urlParams.get('verified');
        const amount = urlParams.get('amount');
        
        console.log('🔍 解析参数:', { paymentSuccess, orderId, verified, amount });
        
        if (paymentSuccess === 'true' && orderId && verified === 'true') {
            console.log('✅ 检测到后端已验证的支付成功参数:', { orderId, amount, verified });
            const paymentData = {
                orderId,
                amount,
                verified: true,
                backendVerified: true,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('alipay_payment_data', JSON.stringify(paymentData));
            console.log('支付验证信息已保存到 localStorage');
            this.cleanUrlParams();
            return orderId;
        }
        
        const paymentStatus = urlParams.get('payment_status');
        if (paymentStatus === 'waiting' && orderId) {
            console.log('⏳ 检测到支付等待状态:', orderId);
            const paymentData = {
                orderId,
                amount: null,
                verified: false,
                backendVerified: false,
                waiting: true,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('alipay_payment_data', JSON.stringify(paymentData));
            this.cleanUrlParams();
            return orderId;
        }
        return null;
    },
    
    cleanUrlParams() {
        try {
            if (window.history.replaceState) {
                const cleanUrl = window.location.pathname + window.location.hash;
                window.history.replaceState({}, document.title, cleanUrl);
                console.log('URL参数已清理');
            }
        } catch (error) {
            console.log('URL清理失败:', error);
        }
    }
};

// ============ 【支付状态管理器】 ============
const PaymentManager = {
    async initPaymentCheck() {
        console.log('🔍 初始化支付状态检查...');
        const orderIdFromCallback = AlipayCallbackHandler.checkBackendCallback();
        if (orderIdFromCallback) {
            const paymentData = this.getPaymentData();
            if (paymentData && paymentData.backendVerified) {
                console.log('发现后端已验证回调订单，立即解锁:', orderIdFromCallback);
                await this.verifyAndUnlock(orderIdFromCallback, true);
            } else if (paymentData && paymentData.waiting) {
                console.log('⏳ 支付等待中，开始轮询:', orderIdFromCallback);
                await this.waitForPayment(orderIdFromCallback);
            } else {
                console.log('发现后端回调订单，尝试验证:', orderIdFromCallback);
                await this.verifyAndUnlock(orderIdFromCallback, false);
            }
            return;
        }
        await this.checkSavedPayment();
    },
    
    async checkSavedPayment() {
        try {
            const paymentData = this.getPaymentData();
            if (!paymentData) {
                console.log('没有找到已保存的支付数据');
                return;
            }
            console.log('找到已保存的支付数据:', paymentData.orderId);
            if (paymentData.backendVerified) {
                console.log('支付已由后端验证过，解锁内容');
                await this.unlockContent(paymentData.orderId);
                return;
            }
            const verified = await this.verifyPaymentStatus(paymentData.orderId);
            if (verified) {
                await this.unlockContent(paymentData.orderId);
            }
        } catch (error) {
            console.error('检查支付状态失败:', error);
        }
    },
    
    getPaymentData() {
        try {
            const data = localStorage.getItem('alipay_payment_data');
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('解析支付数据失败:', error);
            return null;
        }
    },
    
    async verifyPaymentStatus(orderId) {
        try {
            console.log('🔐 验证支付状态，订单号:', orderId);
            const response = await fetch(API_CONFIG.BACKEND_URL + '/api/payment/status/' + orderId);
            const result = await response.json();
            console.log('支付状态响应:', result);
            if (result.success && result.data.status === 'paid') {
                console.log('✅ 支付验证成功');
                const paymentData = this.getPaymentData() || {};
                paymentData.verified = true;
                paymentData.verifiedAt = new Date().toISOString();
                localStorage.setItem('alipay_payment_data', JSON.stringify(paymentData));
                return true;
            }
            return false;
        } catch (error) {
            console.error('支付验证失败:', error);
            return false;
        }
    },
    
    async verifyAndUnlock(orderId, isBackendVerified = false) {
        try {
            if (isBackendVerified) {
                console.log('✅ 后端已验证支付，直接解锁');
                await this.unlockContent(orderId);
                return true;
            }
            const verified = await this.verifyPaymentStatus(orderId);
            if (verified) {
                await this.unlockContent(orderId);
                return true;
            }
            return false;
        } catch (error) {
            console.error('验证并解锁失败:', error);
            return false;
        }
    },
    
    async waitForPayment(orderId) {
        console.log('⏳ 开始轮询支付状态，订单:', orderId);
        const maxAttempts = 45;
        const interval = 2000;

        for (let i = 0; i < maxAttempts; i++) {
            try {
                const verified = await this.verifyPaymentStatus(orderId);
                if (verified) {
                    console.log('✅ 轮询确认支付成功，订单:', orderId);
                    const paymentData = this.getPaymentData() || {};
                    paymentData.verified = true;
                    paymentData.backendVerified = true;
                    paymentData.waiting = false;
                    localStorage.setItem('alipay_payment_data', JSON.stringify(paymentData));
                    await this.unlockContent(orderId);
                    return true;
                }
                console.log(`⏳ 轮询 ${i + 1}/${maxAttempts}，等待支付确认...`);
            } catch (error) {
                console.error('轮询支付状态失败:', error);
            }
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        
        console.log('⏰ 轮询超时，支付未被确认');
        return false;
    },
    
    async unlockContent(orderId) {
        console.log('🔓 开始解锁内容，订单:', orderId);
        STATE.isPaymentUnlocked = true;
        STATE.isDownloadLocked = false;
        STATE.currentOrderId = orderId;
        
        console.log('状态已更新:', {
            isPaymentUnlocked: STATE.isPaymentUnlocked,
            isDownloadLocked: STATE.isDownloadLocked,
            currentOrderId: STATE.currentOrderId
        });
        
        try {
            console.log('🔓 调用 restoreAnalysis()...');
            const restored = await this.restoreAnalysis();
            console.log('🔓 restoreAnalysis() 返回:', restored);
            if (restored) {
                this.updateUIAfterPayment();
                this.showSuccessMessage();
                setTimeout(() => {
                    this.unlockDownloadButtonDirectly();
                }, 300);
                setTimeout(() => {
                    const resultSection = document.getElementById('analysis-result-section');
                    if (resultSection) {
                        resultSection.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 500);
            } else {
                if (STATE.fullAnalysisResult) {
                    console.log('但有当前分析结果，直接解锁');
                    this.updateUIAfterPayment();
                    this.showSuccessMessage();
                }
            }

            const lockedOverlay = document.getElementById('locked-overlay');
            if (lockedOverlay) {
                lockedOverlay.style.display = 'none';
                console.log('✅ 锁定覆盖层已隐藏');
            }
        } catch (error) {
            console.error('解锁内容失败:', error);
            this.unlockDownloadButtonDirectly();
        }
    },
    
    unlockDownloadButtonDirectly() {
        const downloadBtn = document.getElementById('download-report-btn');
        const downloadBtnText = document.getElementById('download-btn-text');
        if (downloadBtn && downloadBtnText) {
            downloadBtn.disabled = false;
            downloadBtn.classList.remove('download-btn-locked');
            downloadBtnText.textContent = '下载报告';
            downloadBtn.style.background = 'linear-gradient(135deg, var(--primary-color), #3a7bd5)';
            downloadBtn.style.boxShadow = '0 4px 15px rgba(58, 123, 213, 0.4)';
            console.log('✅ 直接解锁下载按钮成功');
            return true;
        }
        console.error('❌ 找不到下载按钮元素');
        return false;
    },
    
    async restoreAnalysis() {
        console.log('📥 开始恢复分析结果...');
        try {
            const savedResult = localStorage.getItem('last_analysis_result');
            const savedService = localStorage.getItem('last_analysis_service');
            const savedUserData = localStorage.getItem('last_user_data');
            const savedFreeSummary = localStorage.getItem('last_free_summary');
            const savedPaidDetail = localStorage.getItem('last_paid_detail');
            
            console.log('📥 localStorage数据检查:', {
                hasResult: !!savedResult,
                hasService: !!savedService,
                hasUserData: !!savedUserData,
                hasFreeSummary: !!savedFreeSummary,
                hasPaidDetail: !!savedPaidDetail,
                resultLength: savedResult ? savedResult.length : 0,
                freeSummaryLength: savedFreeSummary ? savedFreeSummary.length : 0,
                paidDetailLength: savedPaidDetail ? savedPaidDetail.length : 0
            });
            
            if (!savedResult || !savedService) {
                console.log('❌ 没有保存的分析结果');
                return false;
            }
            
            console.log('📥 从存储恢复分析结果...');
            console.log('保存的服务:', savedService, '当前服务:', STATE.currentService);
            
            STATE.fullAnalysisResult = savedResult;
            STATE.currentService = savedService;
            STATE.freeSummary = savedFreeSummary || '';
            STATE.paidDetail = savedPaidDetail || '';
            
            if (savedUserData) {
                try {
                    STATE.userData = JSON.parse(savedUserData);
                } catch (e) {
                    console.error('解析用户数据失败:', e);
                }
            }
            
            const parsedBaziData = parseBaziData(savedResult);
            STATE.baziData = parsedBaziData.userBazi;
            console.log('📥 八字解析结果:', STATE.baziData ? '成功' : '失败（将跳过八字排盘显示）');
            
            try { updateServiceDisplay(savedService); } catch(e) { console.warn('updateServiceDisplay失败:', e); }
            try { displayPredictorInfo(); } catch(e) { console.warn('displayPredictorInfo失败:', e); }
            try { displayBaziPan(); } catch(e) { console.warn('displayBaziPan失败:', e); }
            
            const freeText = document.getElementById('free-analysis-text');
            if (freeText) {
                if (STATE.freeSummary) {
                    freeText.innerHTML = renderDeepSeekSection(STATE.freeSummary, 'free');
                } else {
                    freeText.innerHTML = '<div class="analysis-content" style="color: #999; text-align: center; padding: 20px;">暂无分析摘要</div>';
                }
            }
            
            const lockedText = document.getElementById('locked-analysis-text');
            if (lockedText) {
                if (STATE.paidDetail) {
                    lockedText.innerHTML = renderDeepSeekSection(STATE.paidDetail, 'paid');
                    lockedText.style.display = 'none';
                }
            }
            
            showAnalysisResult();
            
            console.log('✅ 分析结果恢复成功，服务类型:', savedService);
            return true;
        } catch (error) {
            console.error('恢复分析失败:', error);
            return false;
        }
    },
    
    updateUIAfterPayment() {
        console.log('🎨 更新支付后UI...');
        if (typeof updateUnlockInterface === 'function') updateUnlockInterface();
        if (typeof showFullAnalysisContent === 'function') showFullAnalysisContent();
        if (typeof unlockDownloadButton === 'function') unlockDownloadButton();
        if (typeof closePaymentModal === 'function') closePaymentModal();
    },
    
    showSuccessMessage() {
        if (document.getElementById('payment-success-alert')) return;
        const alertDiv = document.createElement('div');
        alertDiv.id = 'payment-success-alert';
        alertDiv.style.cssText = `
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            background: linear-gradient(135deg, #4CAF50, #45a049); color: white;
            padding: 15px 30px; border-radius: 8px; z-index: 10000;
            box-shadow: 0 4px 20px rgba(76, 175, 80, 0.3);
            font-size: 16px; font-weight: bold; animation: slideDown 0.5s ease;
            text-align: center; min-width: 300px; max-width: 90%;
        `;
        alertDiv.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;gap:10px;">
                <span style="font-size:20px;">✅</span>
                <span>支付成功！算命报告已解锁</span>
            </div>
            <div style="margin-top:8px;font-size:12px;opacity:0.9;">现在可以查看完整分析和下载报告</div>
        `;
        document.body.appendChild(alertDiv);
        setTimeout(() => {
            if (alertDiv.parentNode) alertDiv.parentNode.removeChild(alertDiv);
        }, 5000);
    },
    
    saveAnalysisBeforePayment() {
        if (!STATE.fullAnalysisResult || !STATE.currentService || !STATE.userData) {
            console.error('无法保存分析数据：缺少必要信息');
            return false;
        }
        try {
            localStorage.setItem('last_analysis_result', STATE.fullAnalysisResult);
            localStorage.setItem('last_analysis_service', STATE.currentService);
            localStorage.setItem('last_user_data', JSON.stringify(STATE.userData));
            localStorage.setItem('last_free_summary', STATE.freeSummary || '');
            localStorage.setItem('last_paid_detail', STATE.paidDetail || '');
            console.log('✅ 分析数据已保存到 localStorage');
            return true;
        } catch (error) {
            console.error('保存分析数据失败:', error);
            return false;
        }
    }
};

// ============ 【导入所有依赖】 ============
// 从同一目录 (js/core/) 导入
import { SERVICES, STATE, API_CONFIG } from './config.js';
import { checkAPIStatus, parseBaziData, analyzeBazi } from './api.js';
import {
    UI, initFormOptions, setDefaultValues, updateServiceDisplay,
    updateUnlockInfo, displayPredictorInfo, displayBaziPan,
    displayDayunPan, displayPartnerDayunPan,
    updateProgress,
    parseDayunData,
    processAndDisplayAnalysis, showPaymentModal, closePaymentModal,
    updateUnlockInterface, showFullAnalysisContent, lockDownloadButton,
    unlockDownloadButton, resetUnlockInterface, animateButtonStretch,
    showLoadingModal, hideLoadingModal, showAnalysisResult,
    hideAnalysisResult, validateForm, collectUserData
} from './ui.js';

// 模块文件在上级目录的 modules/ 下
// 注意：新架构已绕过这些模块，但保留导入以防万一
// import { CesuanModule } from '../modules/cesuan.js';
// import { YunchengModule } from '../modules/yuncheng.js';
// import { XiangpiModule } from '../modules/xiangpi.js';
// import { HehunModule } from '../modules/hehun.js';

// ============ 支付成功处理函数 ============
function handlePaymentSuccess() {
    STATE.isPaymentUnlocked = true;
    STATE.isDownloadLocked = false;
    closePaymentModal();
    updateUnlockInterface();
    showFullAnalysisContent();
    unlockDownloadButton();
    PaymentManager.showSuccessMessage();
}

// ============ 确认支付 ============
function confirmPayment() {
    if (!STATE.currentOrderId) {
        alert('请先点击"前往支付宝支付"按钮完成支付');
        return;
    }
    var confirmed = confirm('如果您已完成支付宝支付，请点击"确定"解锁内容。\n如支付遇到问题，请联系客服微信：runzang888');
    if (confirmed) {
        fetch(API_CONFIG.BACKEND_URL + '/api/payment/status/' + STATE.currentOrderId)
            .then(function(response) { return response.json(); })
            .then(function(result) {
                if (result.success && result.data.status === 'paid') {
                    handlePaymentSuccess();
                } else {
                    alert('支付状态未确认，请稍后再试或联系客服');
                }
            })
            .catch(function(error) {
                console.error('检查支付状态失败:', error);
                alert('网络错误，请稍后重试');
            });
    }
}

// ============ 【主要应用函数】 ============

async function initApp() {
    console.log('🚀 应用初始化开始...');
    try {
        console.log('1. 检查支付状态...');
        await PaymentManager.initPaymentCheck();
        console.log('2. 常规初始化...');
        initFormOptions();
        setDefaultValues();
        updateServiceDisplay(STATE.currentService);
        updateUnlockInfo();
        if (!STATE.isPaymentUnlocked) {
            lockDownloadButton();
        }
        setupEventListeners();
        STATE.apiStatus = await checkAPIStatus();
        preloadImages();
        console.log('✅ 应用初始化完成');
    } catch (error) {
        console.error('❌ 应用初始化失败:', error);
    }
}

function setupEventListeners() {
    console.log('设置事件监听器...');
    
    document.querySelectorAll('.service-nav a').forEach(function(link) {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            var serviceName = this.dataset.service;
            switchService(serviceName);
        });
    });
    
    UI.analyzeBtn().addEventListener('click', startAnalysis);
    UI.unlockBtn().addEventListener('click', showPaymentModal);
    UI.downloadReportBtn().addEventListener('click', downloadReport);
    UI.recalculateBtn().addEventListener('click', newAnalysis);
    UI.confirmPaymentBtn().addEventListener('click', confirmPayment);
    UI.cancelPaymentBtn().addEventListener('click', closePaymentModal);
    UI.closePaymentBtn().addEventListener('click', closePaymentModal);
    
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') closePaymentModal();
    });
    
    window.addEventListener('click', function(event) {
        var paymentModal = UI.paymentModal();
        if (event.target === paymentModal) closePaymentModal();
    });
    
    var heroImage = UI.heroImage();
    var detailImage = UI.detailImage();
    if (heroImage) {
        heroImage.addEventListener('load', function() {
            this.classList.add('loaded');
            var placeholder = this.previousElementSibling;
            if (placeholder) placeholder.style.display = 'none';
        });
    }
    if (detailImage) {
        detailImage.addEventListener('load', function() {
            this.classList.add('loaded');
            var placeholder = this.previousElementSibling;
            if (placeholder) placeholder.style.display = 'none';
        });
    }
}

function switchService(serviceName) {
    console.log('切换服务到:', serviceName, '当前服务:', STATE.currentService);
    if (!SERVICES[serviceName]) {
        console.error('服务不存在:', serviceName);
        return;
    }
    var oldService = STATE.currentService;
    if (oldService !== serviceName) {
        console.log('切换到不同服务，彻底重置状态');
        STATE.isPaymentUnlocked = false;
        STATE.isDownloadLocked = true;
        STATE.fullAnalysisResult = '';
        STATE.freeSummary = '';
        STATE.paidDetail = '';
        STATE.baziData = null;
        STATE.partnerBaziData = null;
        STATE.currentOrderId = null;
        STATE.userData = null;
        STATE.partnerData = null;
        STATE.dayunData = null;
        STATE.partnerDayunData = null;
        console.log('✅ 所有状态已重置');
    }
    STATE.currentService = serviceName;
    updateServiceDisplay(serviceName);
    updateUnlockInfo();
    resetUnlockInterface();
    lockDownloadButton();
    if (oldService !== serviceName) {
        hideAnalysisResult();
        var freeAnalysisText = UI.freeAnalysisText();
        if (freeAnalysisText) freeAnalysisText.innerHTML = '';
        var predictorInfoGrid = UI.predictorInfoGrid();
        if (predictorInfoGrid) predictorInfoGrid.innerHTML = '';
        var baziGrid = UI.baziGrid();
        if (baziGrid) baziGrid.innerHTML = '';
        
        const dayunCards = document.querySelectorAll('.dayun-pan-card');
        dayunCards.forEach(card => {
            if (card.parentNode) card.parentNode.removeChild(card);
        });
        const dayunGrid = document.getElementById('dayun-grid');
        if (dayunGrid) dayunGrid.innerHTML = '';
        const partnerDayunGrid = document.getElementById('partner-dayun-grid');
        if (partnerDayunGrid) partnerDayunGrid.innerHTML = '';

        var lockedAnalysisText = document.getElementById('locked-analysis-text');
        if (lockedAnalysisText) lockedAnalysisText.innerHTML = '';

        localStorage.removeItem('alipay_payment_data');
        localStorage.removeItem('last_analysis_result');
        localStorage.removeItem('last_analysis_service');
        localStorage.removeItem('last_user_data');
        localStorage.removeItem('last_free_summary');
        localStorage.removeItem('last_paid_detail');
        console.log('✅ localStorage支付数据已清除');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    console.log('服务切换完成，解锁状态:', STATE.isPaymentUnlocked);
}

function preloadImages() {
    console.log('预加载图片...');
    Object.values(SERVICES).forEach(function(service) {
        var heroImg = new Image();
        heroImg.src = service.heroImage;
        var detailImg = new Image();
        detailImg.src = service.detailImage;
    });
}

function sleep(ms) {
    return new Promise(function(resolve) { setTimeout(resolve, ms); });
}

// ============ 格式化排盘数据（保留备用） ============
function formatBaziForPrompt(baziRawData) {
    if (!baziRawData) return '';
    const bazi = baziRawData.bazi;
    
    let text = `【八字排盘】（由专业排盘系统精确计算）\n`;
    text += `年柱：${bazi.year.ganzhi}（${bazi.year.nayin}） 生肖：${bazi.year.zodiac}\n`;
    text += `月柱：${bazi.month.ganzhi}（${bazi.month.nayin}）\n`;
    text += `日柱：${bazi.day.ganzhi}（${bazi.day.nayin}）\n`;
    text += `时柱：${bazi.hour.ganzhi}（${bazi.hour.nayin}）\n`;
    return text;
}

// ============ DeepSeek报告格式化渲染 ============
function renderDeepSeekSection(text, part) {
    if (!text) return '';
    
    const CONCLUSION_HEADERS = ['综合结论'];
    const segments = [];
    const lines = text.split('\n');
    let currentHeader = '';
    let currentLines = [];
    
    for (const line of lines) {
        const headerMatch = line.trim().match(/^【(.+?)】/);
        if (headerMatch) {
            if (currentHeader || currentLines.length > 0) {
                segments.push({ header: currentHeader, content: currentLines.join('\n').trim() });
            }
            currentHeader = headerMatch[1];
            currentLines = [];
            const rest = line.trim().replace(/^【.+?】/, '').trim();
            if (rest) currentLines.push(rest);
        } else {
            currentLines.push(line);
        }
    }
    if (currentHeader || currentLines.length > 0) {
        segments.push({ header: currentHeader, content: currentLines.join('\n').trim() });
    }
    
    if (segments.length === 0) {
        return `<div class="ds-content ds-analysis">${text.replace(/\n/g, '<br>')}</div>`;
    }
    
    let html = '';
    for (const seg of segments) {
        const isConclusion = CONCLUSION_HEADERS.includes(seg.header);
        const contentHtml = seg.content.replace(/\n/g, '<br>');
        
        if (isConclusion) {
            html += `<div class="ds-segment ds-conclusion">
                <div class="ds-header ds-header-conclusion">【${seg.header}】</div>
                <div class="ds-content ds-conclusion-text">${contentHtml}</div>
            </div>`;
        } else {
            html += `<div class="ds-segment ds-analysis">
                <div class="ds-header ds-header-analysis">【${seg.header}】</div>
                <div class="ds-content ds-analysis-text">${contentHtml}</div>
            </div>`;
        }
    }
    
    return html;
}

async function startAnalysis() {
    console.log('开始命理分析...');
    
    if (STATE.apiStatus !== 'online') {
        alert('⚠️ API连接异常，请稍后再试或检查网络连接。');
        return;
    }
    
    if (!validateForm()) {
        alert('请填写完整的个人信息');
        return;
    }
    
    var resultServiceName = document.getElementById('result-service-name');
    if (resultServiceName) {
        resultServiceName.textContent = STATE.currentService + '分析报告';
    }
    
    STATE.fullAnalysisResult = '';
    STATE.baziData = null;
    STATE.partnerBaziData = null;
    STATE.isPaymentUnlocked = false;
    STATE.isDownloadLocked = true;
    STATE.dayunData = null;
    STATE.partnerDayunData = null;
    lockDownloadButton();
    animateButtonStretch();
    showLoadingModal();
    
    var serviceConfig = SERVICES[STATE.currentService];
    var totalSteps = serviceConfig.analysisSteps ? serviceConfig.analysisSteps.length : 8;
    var currentStep = 0;
    var progressPercent = 0;
    
    try {
        collectUserData();
        currentStep = 1;
        progressPercent = 5;
        updateProgress(currentStep, totalSteps, '验证用户信息', progressPercent, '正在验证用户信息...');
        await sleep(300);
        
        var freeAnalysisText = UI.freeAnalysisText();
        if (freeAnalysisText) {
            freeAnalysisText.innerHTML = '<div class="loading-text">正在生成分析结果...</div>';
        }
        
        console.log('🔮 调用综合命理分析引擎...');
        
        // 模拟进度：在API调用期间平滑推进进度条
        progressPercent = 10;
        updateProgress(1, totalSteps, '八字排盘计算', progressPercent, '正在排列八字四柱...');
        
        var progressTimer = setInterval(function() {
            currentStep = Math.min(currentStep + 1, totalSteps - 1);
            progressPercent = Math.min(progressPercent + Math.floor(Math.random() * 5 + 3), 75);
            var stepLabels = serviceConfig.analysisSteps || [];
            var stepLabel = stepLabels[currentStep] || '分析中';
            var stepMessages = [
                '正在排列八字四柱...',
                '正在计算大运排盘...',
                '正在分析用神喜忌...',
                '正在解析性格特点...',
                '正在推算流年运势...',
                '正在综合评估命局...',
                '正在生成详细报告...',
                '正在润色分析结果...'
            ];
            var msg = stepMessages[currentStep % stepMessages.length] || '正在深度分析...';
            updateProgress(currentStep, totalSteps, stepLabel, progressPercent, msg);
        }, 2000);
        
        const result = await analyzeBazi(STATE.userData, STATE.currentService, true);
        
        clearInterval(progressTimer);
        
        console.log('✅ 综合分析完成');
        console.log('返回数据:', result);
        
        STATE.fullAnalysisResult = result.polished_report;
        STATE.baziData = result.bazi_pan;
        
        if (result.dayun_pan && result.dayun_pan.length > 0) {
            STATE.dayunData = {
                ages: result.dayun_pan.map(d => d.age_start),
                dayuns: result.dayun_pan.map(d => d.ganzhi)
            };
            console.log('✅ 大运数据已保存:', STATE.dayunData);
        }
        
        displayPredictorInfo();
        displayBaziPan();
        
        if (result.dayun_pan && result.dayun_pan.length > 0) {
            const dayunDisplayData = {
                ages: result.dayun_pan.map(d => d.age_start),
                dayuns: result.dayun_pan.map(d => d.ganzhi)
            };
            if (result.dayun_detail && result.dayun_detail.xi_ji) {
                const xiJiMap = {};
                result.dayun_detail.xi_ji.forEach(item => {
                    xiJiMap[item.age] = { xi: item.xi, ji: item.ji };
                });
                dayunDisplayData.xi_ji = xiJiMap;
            }
            displayDayunPan(dayunDisplayData);
            console.log('✅ 大运排盘已显示');
        }
        
        // ★★★ 合婚：显示伴侣八字和大运 ★★★
        if (STATE.currentService === '八字合婚' && result.partner_bazi_pan) {
            STATE.partnerBaziData = result.partner_bazi_pan;
            console.log('✅ 伴侣八字数据已保存:', STATE.partnerBaziData);
            
            if (result.partner_dayun_pan && result.partner_dayun_pan.length > 0) {
                STATE.partnerDayunData = result.partner_dayun_pan;
                console.log('✅ 伴侣大运数据已保存:', STATE.partnerDayunData);

                displayPartnerDayunPan(result.partner_dayun_pan);
                console.log('✅ 伴侣大运排盘已显示');
            }
            
            displayBaziPan();
        }
        
        // ★★★ 显示DeepSeek免费摘要（在免费区域） ★★★
        STATE.freeSummary = result.free_summary || '';
        STATE.paidDetail = result.paid_detail || '';
        console.log('📊 DeepSeek免费摘要长度:', STATE.freeSummary.length, '付费详情长度:', STATE.paidDetail.length);
        
        const freeText = document.getElementById('free-analysis-text');
        if (freeText) {
            if (STATE.freeSummary) {
                freeText.innerHTML = renderDeepSeekSection(STATE.freeSummary, 'free');
                console.log('✅ DeepSeek免费摘要已显示');
            } else {
                freeText.innerHTML = '<div class="analysis-content" style="color: #999; text-align: center; padding: 20px;">暂无分析摘要</div>';
            }
        }
        
        // ★★★ 预加载DeepSeek付费详情（保持隐藏，支付后才显示） ★★★
        const lockedText = document.getElementById('locked-analysis-text');
        if (lockedText) {
            if (STATE.paidDetail) {
                lockedText.innerHTML = renderDeepSeekSection(STATE.paidDetail, 'paid');
                lockedText.style.display = 'none';
                console.log('✅ DeepSeek付费详情已预加载（隐藏状态）');
            } else {
                lockedText.innerHTML = '<div class="analysis-content" style="color: #999; text-align: center;">暂无详细报告</div>';
                lockedText.style.display = 'none';
            }
        }
        
        if (STATE.isPaymentUnlocked) {
            updateUnlockInterface();
            showFullAnalysisContent();
            unlockDownloadButton();
        }
        
        // ★★★ 更新进度到完成 ★★★
        currentStep = totalSteps - 1;
        progressPercent = 85;
        updateProgress(currentStep, totalSteps, '生成排盘结果', progressPercent, '八字排盘生成完成');
        await sleep(300);
        
        progressPercent = 95;
        updateProgress(currentStep, totalSteps, '整理分析报告', progressPercent, '报告整理完成');
        await sleep(300);
        
        progressPercent = 100;
        currentStep = totalSteps;
        updateProgress(currentStep, totalSteps, '✅ 分析完成', progressPercent, '✅ 所有分析项目已完成！');
        await sleep(500);
        
        hideLoadingModal();
        
        showAnalysisResult();
        
        console.log('命理分析完成，结果已显示');
        
        PaymentManager.saveAnalysisBeforePayment();
        
        var paymentData = PaymentManager.getPaymentData();
        if (paymentData && paymentData.verified) {
            var savedService = localStorage.getItem('last_analysis_service');
            if (savedService === STATE.currentService && !STATE.isPaymentUnlocked) {
                console.log('当前服务已支付，自动解锁');
                setTimeout(function() {
                    PaymentManager.updateUIAfterPayment();
                }, 500);
            }
        }
        
    } catch (error) {
        clearInterval(progressTimer);
        console.error('❌ 分析失败:', error);
        hideLoadingModal();
        
        var errorMessage = '命理分析失败，请稍后再试。';
        if (error.message.indexOf('401') !== -1 || error.message.indexOf('Unauthorized') !== -1) {
            errorMessage = 'API密钥错误，请联系管理员。';
        } else if (error.message.indexOf('429') !== -1) {
            errorMessage = '请求过于频繁，请稍后再试。';
        } else if (error.message.indexOf('网络') !== -1 || error.message.indexOf('Network') !== -1) {
            errorMessage = '网络连接失败，请检查您的网络设置。';
        } else if (error.message.indexOf('超时') !== -1 || error.message.indexOf('timeout') !== -1) {
            errorMessage = '分析请求超时，请稍后再试。';
        }
        alert(errorMessage + '\n\n错误详情：' + error.message);
    }
}

function downloadReport() {
    console.log('📥 尝试下载报告...');
    console.log('状态检查:', {
        isDownloadLocked: STATE.isDownloadLocked,
        isPaymentUnlocked: STATE.isPaymentUnlocked,
        hasUserData: !!STATE.userData,
        hasAnalysisResult: !!STATE.fullAnalysisResult,
        currentService: STATE.currentService
    });
    
    if (STATE.isPaymentUnlocked && STATE.isDownloadLocked) {
        console.log('⚠️ 状态不一致，强制解锁下载');
        STATE.isDownloadLocked = false;
        if (typeof unlockDownloadButton === 'function') unlockDownloadButton();
    }
    
    if (STATE.isDownloadLocked) {
        alert('请先解锁完整报告才能下载！');
        showPaymentModal();
        return;
    }
    
    if (!STATE.userData || !STATE.fullAnalysisResult) {
        alert('请先进行测算分析');
        return;
    }
    
    var currentServiceName = STATE.currentService || '测算验证';
    
    var predictorInfo = '命理分析报告 - ' + currentServiceName + '\n\n预测者信息：\n姓名：' + STATE.userData.name + '\n性别：' + STATE.userData.gender + '\n出生时间：' + STATE.userData.birthYear + '年' + STATE.userData.birthMonth + '月' + STATE.userData.birthDay + '日' + STATE.userData.birthHour + '时' + STATE.userData.birthMinute + '分\n出生城市：' + STATE.userData.birthCity + '\n测算服务：' + currentServiceName + '\n测算时间：' + new Date().toLocaleString('zh-CN');
    
    if (currentServiceName === '八字合婚' && STATE.partnerData) {
        predictorInfo += '\n\n伴侣信息：\n姓名：' + STATE.partnerData.partnerName + '\n性别：' + STATE.partnerData.partnerGender + '\n出生时间：' + STATE.partnerData.partnerBirthYear + '年' + STATE.partnerData.partnerBirthMonth + '月' + STATE.partnerData.partnerBirthDay + '日' + STATE.partnerData.partnerBirthHour + '时' + STATE.partnerData.partnerBirthMinute + '分\n出生城市：' + STATE.partnerData.partnerBirthCity;
    }
    
    var baziInfo = '';
    if (STATE.baziData && STATE.baziData.year && STATE.baziData.month && STATE.baziData.day && STATE.baziData.hour) {
        baziInfo = '八字排盘：\n年柱：' + STATE.baziData.year.ganzhi + ' (' + STATE.baziData.year.nayin + ')\n月柱：' + STATE.baziData.month.ganzhi + ' (' + STATE.baziData.month.nayin + ')\n日柱：' + STATE.baziData.day.ganzhi + ' (' + STATE.baziData.day.nayin + ')\n时柱：' + STATE.baziData.hour.ganzhi + ' (' + STATE.baziData.hour.nayin + ')';
    }
    
    var reportContent = '命理分析报告 - ' + STATE.currentService + '\n\n' + predictorInfo + '\n\n' + baziInfo + '\n\n' + STATE.fullAnalysisResult + '\n\n--- 命理分析服务平台 ---\n分析时间：' + new Date().toLocaleString('zh-CN') + '\n使用技术：DeepSeek AI命理分析系统';
    
    var blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = '命理分析报告_' + STATE.userData.name + '_' + new Date().toISOString().slice(0, 10) + '.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('报告下载完成');
}

function newAnalysis() {
    console.log('重新测算...');
    STATE.isPaymentUnlocked = false;
    STATE.isDownloadLocked = true;
    lockDownloadButton();
    hideAnalysisResult();
    resetUnlockInterface();
    var freeAnalysisText = UI.freeAnalysisText();
    if (freeAnalysisText) freeAnalysisText.innerHTML = '';
    STATE.currentOrderId = null;
    STATE.fullAnalysisResult = '';
    STATE.freeSummary = '';
    STATE.paidDetail = '';
    STATE.baziData = null;
    STATE.partnerBaziData = null;
    STATE.dayunData = null;
    STATE.partnerDayunData = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============ 【页面初始化】 ============
window.addEventListener('DOMContentLoaded', initApp);

// 导出给全局使用
window.switchService = switchService;
window.startAnalysis = startAnalysis;
window.showPaymentModal = showPaymentModal;
window.closePaymentModal = closePaymentModal;
window.confirmPayment = confirmPayment;
window.downloadReport = downloadReport;
window.newAnalysis = newAnalysis;
window.handlePaymentSuccess = handlePaymentSuccess;
window.PaymentManager = PaymentManager;
window.STATE = STATE;
window.formatBaziForPrompt = formatBaziForPrompt;
window.renderDeepSeekSection = renderDeepSeekSection;
