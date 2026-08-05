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
            const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/payment/status/${orderId}`);
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
            
            const parsedBaziData = parseBaziData(savedResult);
            STATE.baziData = parsedBaziData.userBazi;
            updateServiceDisplay(savedService);
            displayPredictorInfo();
            displayBaziPan();
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
    displayDayunPan,  // 新增
    updateProgress,   // 新增
    parseDayunData,   // 新增
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

const SERVICE_MODULES = {
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
    const confirmed = confirm('如果您已完成支付宝支付，请点击"确定"解锁内容。\n如支付遇到问题，请联系客服微信：runzang888');
    if (confirmed) {
        fetch(`${API_CONFIG.BACKEND_URL}/api/payment/status/${STATE.currentOrderId}`)
            .then(response => response.json())
            .then(result => {
                if (result.success && result.data.status === 'paid') {
                    handlePaymentSuccess();
                } else {
                    alert('支付状态未确认，请稍后再试或联系客服');
                }
            })
            .catch(error => {
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
    
    document.querySelectorAll('.service-nav a').forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const serviceName = this.dataset.service;
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
        const paymentModal = UI.paymentModal();
        if (event.target === paymentModal) closePaymentModal();
    });
    
    const heroImage = UI.heroImage();
    const detailImage = UI.detailImage();
    if (heroImage) {
        heroImage.addEventListener('load', function() {
            this.classList.add('loaded');
            const placeholder = this.previousElementSibling;
            if (placeholder) placeholder.style.display = 'none';
        });
    }
    if (detailImage) {
        detailImage.addEventListener('load', function() {
            this.classList.add('loaded');
            const placeholder = this.previousElementSibling;
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
    const oldService = STATE.currentService;
    if (oldService !== serviceName) {
        console.log('切换到不同服务，彻底重置状态');
        STATE.isPaymentUnlocked = false;
        STATE.isDownloadLocked = true;
        STATE.fullAnalysisResult = '';
        STATE.baziData = null;
        STATE.partnerBaziData = null;
        STATE.currentOrderId = null;
        STATE.userData = null;
        STATE.partnerData = null;
        console.log('✅ 所有状态已重置');
    }
    STATE.currentService = serviceName;
    updateServiceDisplay(serviceName);
    updateUnlockInfo();
    resetUnlockInterface();
    lockDownloadButton();
    if (oldService !== serviceName) {
        hideAnalysisResult();
        const freeAnalysisText = UI.freeAnalysisText();
        if (freeAnalysisText) freeAnalysisText.innerHTML = '';
        const predictorInfoGrid = UI.predictorInfoGrid();
        if (predictorInfoGrid) predictorInfoGrid.innerHTML = '';
        const baziGrid = UI.baziGrid();
        if (baziGrid) baziGrid.innerHTML = '';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    console.log('服务切换完成，解锁状态:', STATE.isPaymentUnlocked);
}

function preloadImages() {
    console.log('预加载图片...');
    Object.values(SERVICES).forEach(service => {
        const heroImg = new Image();
        heroImg.src = service.heroImage;
        const detailImg = new Image();
        detailImg.src = service.detailImage;
    });
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
    
    const resultServiceName = document.getElementById('result-service-name');
    if (resultServiceName) {
        resultServiceName.textContent = STATE.currentService + '分析报告';
    }
    
    STATE.fullAnalysisResult = '';
    STATE.baziData = null;
    STATE.partnerBaziData = null;
    STATE.isPaymentUnlocked = false;
    STATE.isDownloadLocked = true;
    lockDownloadButton();
    animateButtonStretch();
    showLoadingModal();
    
    // 重置进度
    updateProgress(1, 5, '准备分析数据...');
    
    try {
        // 步骤1: 收集用户数据 (5%-15%)
        collectUserData();
        updateProgress(1, 10, '已收集用户信息');
        
        const freeAnalysisText = UI.freeAnalysisText();
        if (freeAnalysisText) {
            freeAnalysisText.innerHTML = '<div class="loading-text">正在生成分析结果...</div>';
        }
        
        displayPredictorInfo();
        updateProgress(1, 15, '验证用户信息完成');
        
        // 步骤2: 生成提示词 (15%-20%)
        const serviceModule = SERVICE_MODULES[STATE.currentService];
        if (!serviceModule) {
            throw new Error(`未找到服务模块: ${STATE.currentService}`);
        }
        
        let prompt;
        try {
            prompt = serviceModule.getPrompt(STATE.userData, STATE.partnerData);
        } catch (error) {
            console.error('生成提示词失败:', error);
            alert(error.message);
            hideLoadingModal();
            return;
        }
        
        console.log('生成的分析提示词长度:', prompt.length);
        console.log('当前服务:', STATE.currentService);
        updateProgress(2, 25, '正在连接AI分析引擎...');
        
        // 步骤3: 调用DeepSeek API (20%-70%)
        updateProgress(2, 35, 'AI正在分析您的命理信息...');
        
        // 模拟进度更新
        let progressInterval = setInterval(() => {
            const currentBar = document.getElementById('progress-bar');
            if (currentBar) {
                const currentWidth = parseFloat(currentBar.style.width) || 35;
                if (currentWidth < 65) {
                    const newWidth = currentWidth + 0.5;
                    currentBar.style.width = newWidth + '%';
                    const percentEl = document.getElementById('progress-percent');
                    if (percentEl) percentEl.textContent = Math.round(newWidth) + '%';
                }
            }
        }, 800);
        
        console.log('正在调用DeepSeek API...');
        const analysisResult = await callDeepSeekAPI(prompt, STATE.currentService);
        
        clearInterval(progressInterval);
        
        console.log('DeepSeek API调用成功，响应长度:', analysisResult.length);
        updateProgress(3, 75, 'AI分析完成，正在生成排盘结果...');
        
        // 步骤4: 处理结果 (70%-90%)
        STATE.fullAnalysisResult = analysisResult;
        
        const parsedBaziData = parseBaziData(analysisResult);
        STATE.baziData = parsedBaziData.userBazi;
        STATE.partnerBaziData = parsedBaziData.partnerBazi;
        
        displayBaziPan();
        updateProgress(3, 80, '八字排盘生成完成');
        
        // 解析并显示大运排盘
        const dayunData = parseDayunData(analysisResult);
        displayDayunPan(dayunData);
        updateProgress(3, 85, '大运排盘生成完成');
        
        processAndDisplayAnalysis(analysisResult);
        updateProgress(4, 92, '分析报告整理中...');
        
        hideLoadingModal();
        updateProgress(4, 100, '✅ 分析完成！');
        
        showAnalysisResult();
        
        console.log('命理分析完成，结果已显示');
        
        PaymentManager.saveAnalysisBeforePayment();
        
        const paymentData = PaymentManager.getPaymentData();
        if (paymentData && paymentData.verified) {
            const savedService = localStorage.getItem('last_analysis_service');
            if (savedService === STATE.currentService && !STATE.isPaymentUnlocked) {
                console.log('当前服务已支付，自动解锁');
                setTimeout(() => {
                    PaymentManager.updateUIAfterPayment();
                }, 500);
            }
        }
        
    } catch (error) {
        console.error('分析失败:', error);
        hideLoadingModal();
        
        let errorMessage = '命理分析失败，请稍后再试。';
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            errorMessage = 'API密钥错误，请联系管理员。';
        } else if (error.message.includes('429')) {
            errorMessage = '请求过于频繁，请稍后再试。';
        } else if (error.message.includes('网络') || error.message.includes('Network')) {
            errorMessage = '网络连接失败，请检查您的网络设置。';
        } else if (error.message.includes('超时') || error.message.includes('timeout')) {
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
    
    const currentServiceName = STATE.currentService || '测算验证';
    
    let predictorInfo = `命理分析报告 - ${currentServiceName}\n\n预测者信息：\n姓名：${STATE.userData.name}\n性别：${STATE.userData.gender}\n出生时间：${STATE.userData.birthYear}年${STATE.userData.birthMonth}月${STATE.userData.birthDay}日${STATE.userData.birthHour}时${STATE.userData.birthMinute}分\n出生城市：${STATE.userData.birthCity}\n测算服务：${currentServiceName}\n测算时间：${new Date().toLocaleString('zh-CN')}`;
    
    if (currentServiceName === '八字合婚' && STATE.partnerData) {
        predictorInfo += `\n\n伴侣信息：\n姓名：${STATE.partnerData.partnerName}\n性别：${STATE.partnerData.partnerGender}\n出生时间：${STATE.partnerData.partnerBirthYear}年${STATE.partnerData.partnerBirthMonth}月${STATE.partnerData.partnerBirthDay}日${STATE.partnerData.partnerBirthHour}时${STATE.partnerData.partnerBirthMinute}分\n出生城市：${STATE.partnerData.partnerBirthCity}`;
    }
    
    let baziInfo = '';
    if (STATE.currentService === '八字合婚' && STATE.partnerData && STATE.partnerBaziData) {
        baziInfo = `${STATE.userData.name} 八字排盘：\n年柱：${STATE.baziData.yearColumn} (${STATE.baziData.yearElement})\n月柱：${STATE.baziData.monthColumn} (${STATE.baziData.monthElement})\n日柱：${STATE.baziData.dayColumn} (${STATE.baziData.dayElement})\n时柱：${STATE.baziData.hourColumn} (${STATE.baziData.hourElement})\n\n${STATE.partnerData.partnerName} 八字排盘：\n年柱：${STATE.partnerBaziData.yearColumn} (${STATE.partnerBaziData.yearElement})\n月柱：${STATE.partnerBaziData.monthColumn} (${STATE.partnerBaziData.monthElement})\n日柱：${STATE.partnerBaziData.dayColumn} (${STATE.partnerBaziData.dayElement})\n时柱：${STATE.partnerBaziData.hourColumn} (${STATE.partnerBaziData.hourElement})`;
    } else {
        const baziDataToDisplay = STATE.baziData;
        baziInfo = `八字排盘：\n年柱：${baziDataToDisplay.yearColumn} (${baziDataToDisplay.yearElement})\n月柱：${baziDataToDisplay.monthColumn} (${baziDataToDisplay.monthElement})\n日柱：${baziDataToDisplay.dayColumn} (${baziDataToDisplay.dayElement})\n时柱：${baziDataToDisplay.hourColumn} (${baziDataToDisplay.hourElement})`;
    }
    
    const reportContent = `命理分析报告 - ${STATE.currentService}\n\n${predictorInfo}\n\n${baziInfo}\n\n${STATE.fullAnalysisResult}\n\n--- 命理分析服务平台 ---\n分析时间：${new Date().toLocaleString('zh-CN')}\n使用技术：DeepSeek AI命理分析系统`;
    
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `命理分析报告_${STATE.userData.name}_${new Date().toISOString().slice(0, 10)}.txt`;
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
    const freeAnalysisText = UI.freeAnalysisText();
    if (freeAnalysisText) freeAnalysisText.innerHTML = '';
    STATE.currentOrderId = null;
    STATE.fullAnalysisResult = '';
    STATE.baziData = null;
    STATE.partnerBaziData = null;
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

if (typeof PaymentManager !== 'undefined') {
    window.PaymentManager = PaymentManager;
}
if (typeof STATE !== 'undefined') {
    window.STATE = STATE;
}
