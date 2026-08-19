// ============ 【支付宝支付回调处理模块】 ============
const AlipayCallbackHandler = {
    checkBackendCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const paymentSuccess = urlParams.get('payment_success');
        const orderId = urlParams.get('order_id');
        const verified = urlParams.get('verified');
        const amount = urlParams.get('amount');
        
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
            this.cleanUrlParams();
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
            console.log('发现后端回调订单，立即解锁:', orderIdFromCallback);
            await this.verifyAndUnlock(orderIdFromCallback, true);
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
            const restored = await this.restoreAnalysis();
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
        try {
            const savedResult = localStorage.getItem('last_analysis_result');
            const savedService = localStorage.getItem('last_analysis_service');
            const savedUserData = localStorage.getItem('last_user_data');
            
            if (!savedResult || !savedService) {
                console.log('没有保存的分析结果');
                return false;
            }
            
            console.log('📥 从存储恢复分析结果...');
            console.log('保存的服务:', savedService, '当前服务:', STATE.currentService);
            
            STATE.fullAnalysisResult = savedResult;
            STATE.currentService = savedService;
            
            if (savedUserData) {
                try {
                    STATE.userData = JSON.parse(savedUserData);
                } catch (e) {
                    console.error('解析用户数据失败:', e);
                }
            }
            
            // 尝试从 localStorage 恢复排盘数据
            const savedBazi = localStorage.getItem('last_bazi_data');
            if (savedBazi) {
                try {
                    const baziData = JSON.parse(savedBazi);
                    STATE.baziData = baziData.bazi;
                    STATE.dayunData = baziData.dayun;
                    STATE.baziRawData = baziData;
                } catch (e) {
                    console.error('解析排盘数据失败:', e);
                }
            }
            
            // 恢复伴侣排盘数据
            const savedPartnerBazi = localStorage.getItem('last_partner_bazi_data');
            if (savedPartnerBazi) {
                try {
                    const partnerData = JSON.parse(savedPartnerBazi);
                    STATE.partnerBaziData = partnerData.bazi;
                    STATE.partnerDayunData = partnerData.dayun;
                } catch (e) {
                    console.error('解析伴侣排盘数据失败:', e);
                }
            }
            
            updateServiceDisplay(savedService);
            displayPredictorInfo();
            displayBaziPan();
            
            // 显示大运
            if (STATE.dayunData && STATE.dayunData.list && STATE.dayunData.list.length > 0) {
                displayDayunPan(STATE.dayunData);
            }
            if (STATE.partnerDayunData && STATE.partnerDayunData.list && STATE.partnerDayunData.list.length > 0) {
                displayPartnerDayunPan(STATE.partnerDayunData);
            }
            
            processAndDisplayAnalysis(savedResult);
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
            // 保存排盘数据
            if (STATE.baziRawData) {
                localStorage.setItem('last_bazi_data', JSON.stringify(STATE.baziRawData));
            }
            if (STATE.partnerBaziData) {
                localStorage.setItem('last_partner_bazi_data', JSON.stringify({
                    bazi: STATE.partnerBaziData,
                    dayun: STATE.partnerDayunData
                }));
            }
            console.log('✅ 分析数据已保存到 localStorage');
            return true;
        } catch (error) {
            console.error('保存分析数据失败:', error);
            return false;
        }
    }
};

// ============ 【原有主应用代码】 ============
import { SERVICES, STATE, API_CONFIG } from './config.js';
import { checkAPIStatus, parseBaziData, callDeepSeekAPI } from './api.js';
import {
    UI, initFormOptions, setDefaultValues, updateServiceDisplay,
    updateUnlockInfo, displayPredictorInfo, displayBaziPan,
    displayDayunPan, displayPartnerDayunPan,
    updateProgress,
    processAndDisplayAnalysis, showPaymentModal, closePaymentModal,
    updateUnlockInterface, showFullAnalysisContent, lockDownloadButton,
    unlockDownloadButton, resetUnlockInterface, animateButtonStretch,
    showLoadingModal, hideLoadingModal, showAnalysisResult,
    hideAnalysisResult, validateForm, collectUserData
} from './ui.js';

import { CesuanModule } from '../modules/cesuan.js';
import { YunchengModule } from '../modules/yuncheng.js';
import { XiangpiModule } from '../modules/xiangpi.js';
import { HehunModule } from '../modules/hehun.js';

var SERVICE_MODULES = {
    '测算验证': CesuanModule,
    '流年运程': YunchengModule,
    '人生详批': XiangpiModule,
    '八字合婚': HehunModule
};

// 支付成功处理函数
function handlePaymentSuccess() {
    STATE.isPaymentUnlocked = true;
    STATE.isDownloadLocked = false;
    closePaymentModal();
    updateUnlockInterface();
    showFullAnalysisContent();
    unlockDownloadButton();
    PaymentManager.showSuccessMessage();
}

// 确认支付
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
        lockDownloadButton();
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
        STATE.baziData = null;
        STATE.baziRawData = null;
        STATE.partnerBaziData = null;
        STATE.currentOrderId = null;
        STATE.userData = null;
        STATE.partnerData = null;
        STATE.dayunData = null;
        STATE.partnerDayunData = null;
        STATE.currentStep = 0;
        STATE.totalSteps = 0;
        
        // 清理大运卡片
        const dayunCards = document.querySelectorAll('.dayun-pan-card');
        dayunCards.forEach(card => {
            if (card.parentNode) card.parentNode.removeChild(card);
        });
        
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
        var partnerBaziGrid = document.getElementById('partner-bazi-grid');
        if (partnerBaziGrid) partnerBaziGrid.innerHTML = '';
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

// ============ 格式化排盘数据用于 Prompt ============
function formatBaziForPrompt(baziRawData) {
    if (!baziRawData) return '';
    const bazi = baziRawData.bazi;
    
    let text = `【八字排盘】（由专业排盘系统精确计算）\n`;
    text += `年柱：${bazi.year.ganzhi}（${bazi.year.nayin}） 生肖：${bazi.year.zodiac}\n`;
    text += `月柱：${bazi.month.ganzhi}（${bazi.month.nayin}）\n`;
    text += `日柱：${bazi.day.ganzhi}（${bazi.day.nayin}）\n`;
    text += `时柱：${bazi.hour.ganzhi}（${bazi.hour.nayin}）\n`;
    
    // 添加大运数据
    if (baziRawData.dayun && baziRawData.dayun.list && baziRawData.dayun.list.length > 0) {
        text += `\n【大运排盘】\n`;
        text += `起运年龄：${baziRawData.dayun.start_age || 8}岁\n`;
        baziRawData.dayun.list.slice(0, 8).forEach((dy, idx) => {
            text += `第${idx+1}步大运：${dy.age_start}-${dy.age_end}岁  ${dy.ganzhi}\n`;
        });
    }
    
    return text;
}

// ============ 核心分析函数 ============
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
    STATE.baziRawData = null;
    STATE.partnerBaziData = null;
    STATE.dayunData = null;
    STATE.partnerDayunData = null;
    STATE.isPaymentUnlocked = false;
    STATE.isDownloadLocked = true;
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
        
        // ============ 【调用排盘服务 - lunar-python】 ============
        console.log('🔮 调用排盘服务...');
        try {
            const baziResponse = await fetch(`${API_CONFIG.BACKEND_URL}/api/bazi/calculate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: STATE.userData.name,
                    gender: STATE.userData.gender,
                    birthYear: STATE.userData.birthYear,
                    birthMonth: STATE.userData.birthMonth,
                    birthDay: STATE.userData.birthDay,
                    birthHour: STATE.userData.birthHour,
                    birthMinute: STATE.userData.birthMinute,
                    birthCity: STATE.userData.birthCity
                })
            });
            
            const baziResult = await baziResponse.json();
            
            if (!baziResult.success) {
                throw new Error(baziResult.error || '排盘失败');
            }
            
            // 保存用户排盘数据（包含八字和大运）
            STATE.baziData = baziResult.data.bazi;
            STATE.baziRawData = baziResult.data;
            STATE.dayunData = baziResult.data.dayun;
            
            console.log('✅ 用户排盘成功:', STATE.baziData);
            console.log('✅ 用户大运数据:', STATE.dayunData);
            
            // 如果是八字合婚，还需要排伴侣的八字
            if (STATE.currentService === '八字合婚' && STATE.partnerData) {
                console.log('🔮 调用伴侣排盘服务...');
                const partnerBaziResponse = await fetch(`${API_CONFIG.BACKEND_URL}/api/bazi/calculate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: STATE.partnerData.partnerName,
                        gender: STATE.partnerData.partnerGender,
                        birthYear: STATE.partnerData.partnerBirthYear,
                        birthMonth: STATE.partnerData.partnerBirthMonth,
                        birthDay: STATE.partnerData.partnerBirthDay,
                        birthHour: STATE.partnerData.partnerBirthHour,
                        birthMinute: STATE.partnerData.partnerBirthMinute,
                        birthCity: STATE.partnerData.partnerBirthCity
                    })
                });
                
                const partnerBaziResult = await partnerBaziResponse.json();
                if (partnerBaziResult.success) {
                    STATE.partnerBaziData = partnerBaziResult.data.bazi;
                    STATE.partnerDayunData = partnerBaziResult.data.dayun;
                    console.log('✅ 伴侣排盘成功:', STATE.partnerBaziData);
                    console.log('✅ 伴侣大运数据:', STATE.partnerDayunData);
                } else {
                    console.warn('⚠️ 伴侣排盘失败:', partnerBaziResult.error);
                }
            }
            
            // 显示八字
            displayPredictorInfo();
            displayBaziPan();
            
            // 显示用户大运
            if (STATE.dayunData && STATE.dayunData.list && STATE.dayunData.list.length > 0) {
                displayDayunPan(STATE.dayunData);
                console.log('✅ 用户大运卡片已显示');
            } else {
                console.warn('⚠️ 用户大运数据为空');
            }
            
            // 如果是合婚，显示伴侣大运
            if (STATE.currentService === '八字合婚') {
                if (STATE.partnerDayunData && STATE.partnerDayunData.list && STATE.partnerDayunData.list.length > 0) {
                    displayPartnerDayunPan(STATE.partnerDayunData);
                    console.log('✅ 伴侣大运卡片已显示');
                } else {
                    console.warn('⚠️ 伴侣大运数据为空');
                }
            }
            
        } catch (error) {
            console.error('❌ 排盘失败:', error);
            alert('八字排盘失败：' + error.message);
            hideLoadingModal();
            return;
        }
        
        progressPercent = 10;
        updateProgress(currentStep, totalSteps, '准备分析数据', progressPercent, '用户信息验证完成');
        await sleep(300);
        
        var serviceModule = SERVICE_MODULES[STATE.currentService];
        if (!serviceModule) {
            throw new Error('未找到服务模块: ' + STATE.currentService);
        }
        
        // 格式化八字数据用于 Prompt
        const baziText = formatBaziForPrompt(STATE.baziRawData);
        
        // 生成 Prompt
        const prompt = serviceModule.getPrompt(STATE.userData, STATE.partnerData, baziText);
        
        console.log('生成的分析提示词长度:', prompt.length);
        console.log('当前服务:', STATE.currentService);
        
        currentStep = 2;
        progressPercent = 20;
        updateProgress(currentStep, totalSteps, 'AI命理分析', progressPercent, '正在连接AI分析引擎...');
        await sleep(500);
        
        progressPercent = 30;
        updateProgress(currentStep, totalSteps, 'AI命理分析', progressPercent, 'AI正在分析您的命理信息...');
        
        var progressInterval = setInterval(function() {
            if (progressPercent < 60) {
                progressPercent += 1;
                updateProgress(currentStep, totalSteps, 'AI命理分析', progressPercent, 'AI正在深度分析中...');
            }
        }, 1000);
        
        console.log('正在调用DeepSeek API...');
        var analysisResult = await callDeepSeekAPI(prompt, STATE.currentService);
        
        clearInterval(progressInterval);
        
        console.log('DeepSeek API调用成功，响应长度:', analysisResult.length);
        STATE.fullAnalysisResult = analysisResult;
        
        currentStep = 3;
        progressPercent = 70;
        updateProgress(currentStep, totalSteps, '生成排盘结果', progressPercent, '八字排盘生成完成');
        await sleep(300);
        
        currentStep = 4;
        progressPercent = 88;
        updateProgress(currentStep, totalSteps, '整理分析报告', progressPercent, '正在整理分析报告...');
        
        processAndDisplayAnalysis(analysisResult);
        await sleep(300);
        
        progressPercent = 95;
        updateProgress(currentStep, totalSteps, '整理分析报告', progressPercent, '报告整理完成');
        
        hideLoadingModal();
        progressPercent = 100;
        updateProgress(currentStep, totalSteps, '✅ 分析完成', progressPercent, '✅ 所有分析项目已完成！');
        
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
        console.error('分析失败:', error);
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
    if (STATE.baziData) {
        baziInfo = '八字排盘：\n年柱：' + STATE.baziData.year.ganzhi + ' (' + STATE.baziData.year.nayin + ')\n月柱：' + STATE.baziData.month.ganzhi + ' (' + STATE.baziData.month.nayin + ')\n日柱：' + STATE.baziData.day.ganzhi + ' (' + STATE.baziData.day.nayin + ')\n时柱：' + STATE.baziData.hour.ganzhi + ' (' + STATE.baziData.hour.nayin + ')';
    }
    
    var dayunInfo = '';
    if (STATE.dayunData && STATE.dayunData.list && STATE.dayunData.list.length > 0) {
        dayunInfo = '\n\n大运排盘：\n起运年龄：' + (STATE.dayunData.start_age || 8) + '岁\n';
        STATE.dayunData.list.slice(0, 8).forEach(function(dy, idx) {
            dayunInfo += '第' + (idx+1) + '步大运：' + dy.age_start + '-' + dy.age_end + '岁  ' + dy.ganzhi + '\n';
        });
    }
    
    var reportContent = '命理分析报告 - ' + STATE.currentService + '\n\n' + predictorInfo + '\n\n' + baziInfo + dayunInfo + '\n\n' + STATE.fullAnalysisResult + '\n\n--- 命理分析服务平台 ---\n分析时间：' + new Date().toLocaleString('zh-CN') + '\n使用技术：DeepSeek AI命理分析系统';
    
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
    STATE.baziData = null;
    STATE.baziRawData = null;
    STATE.partnerBaziData = null;
    STATE.dayunData = null;
    STATE.partnerDayunData = null;
    STATE.currentStep = 0;
    STATE.totalSteps = 0;
    
    // 清理大运卡片
    const dayunCards = document.querySelectorAll('.dayun-pan-card');
    dayunCards.forEach(card => {
        if (card.parentNode) card.parentNode.removeChild(card);
    });
    
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
