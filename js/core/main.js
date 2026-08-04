// ============ 【支付宝支付回调处理模块】 ============
const AlipayCallbackHandler = {
    // 检查URL中是否有后端返回的支付成功参数
    checkBackendCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const paymentSuccess = urlParams.get('payment_success');
        const orderId = urlParams.get('order_id');
        const verified = urlParams.get('verified');
        const amount = urlParams.get('amount');
        
        if (paymentSuccess === 'true' && orderId && verified === 'true') {
            console.log('✅ 检测到后端已验证的支付成功参数:', { orderId, amount, verified });
            
            // 保存验证信息
            const paymentData = {
                orderId,
                amount,
                verified: true,
                backendVerified: true,
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('alipay_payment_data', JSON.stringify(paymentData));
            console.log('支付验证信息已保存到 localStorage');
            
            // 清理URL参数
            this.cleanUrlParams();
            
            return orderId;
        }
        
        // 检查其他可能的支付状态参数
        const paymentStatus = urlParams.get('payment_status');
        if (paymentStatus === 'waiting' && orderId) {
            console.log('⏳ 检测到支付等待状态:', orderId);
            this.cleanUrlParams();
        }
        
        return null;
    },
    
    // 清理URL参数
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
    // 初始化支付检查
    initPaymentCheck: async function() {
        console.log('🔍 初始化支付状态检查...');
        
        // 1. 检查后端回调
        const orderIdFromCallback = AlipayCallbackHandler.checkBackendCallback();
        if (orderIdFromCallback) {
            console.log('发现后端回调订单，立即解锁:', orderIdFromCallback);
            await this.verifyAndUnlock(orderIdFromCallback, true);
            return;
        }
        
        // 2. 检查已保存的支付状态
        await this.checkSavedPayment();
    },
    
    // 检查已保存的支付状态
    checkSavedPayment: async function() {
        try {
            const paymentData = this.getPaymentData();
            if (!paymentData) {
                console.log('没有找到已保存的支付数据');
                return;
            }
            
            console.log('找到已保存的支付数据:', paymentData.orderId);
            
            // 如果已经是后端验证过的，直接解锁
            if (paymentData.backendVerified) {
                console.log('支付已由后端验证过，解锁内容');
                await this.unlockContent(paymentData.orderId);
                return;
            }
            
            // 否则向后端查询状态
            const verified = await this.verifyPaymentStatus(paymentData.orderId);
            if (verified) {
                await this.unlockContent(paymentData.orderId);
            }
            
        } catch (error) {
            console.error('检查支付状态失败:', error);
        }
    },
    
    // 获取支付数据
    getPaymentData: function() {
        try {
            const data = localStorage.getItem('alipay_payment_data');
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('解析支付数据失败:', error);
            return null;
        }
    },
    
    // 验证支付状态
    verifyPaymentStatus: async function(orderId) {
        try {
            console.log('🔐 验证支付状态，订单号:', orderId);
            const response = await fetch(`https://runzang.top/api/payment/status/${orderId}`);
            const result = await response.json();
            
            console.log('支付状态响应:', result);
            
            if (result.success && result.data.status === 'paid') {
                console.log('✅ 支付验证成功');
                
                // 更新支付数据
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
    
    // 验证并解锁
    verifyAndUnlock: async function(orderId, isBackendVerified = false) {
        try {
            // 如果是后端已验证的，直接解锁
            if (isBackendVerified) {
                console.log('✅ 后端已验证支付，直接解锁');
                await this.unlockContent(orderId);
                return true;
            }
            
            // 否则查询状态
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
    
    // 解锁内容
    unlockContent: async function(orderId) {
        console.log('🔓 开始解锁内容，订单:', orderId);
        
        // 确保下载状态正确设置
        STATE.isPaymentUnlocked = true;
        STATE.isDownloadLocked = false;
        STATE.currentOrderId = orderId;
        
        console.log('状态已更新:', {
            isPaymentUnlocked: STATE.isPaymentUnlocked,
            isDownloadLocked: STATE.isDownloadLocked,
            currentOrderId: STATE.currentOrderId
        });
        
        try {
            // 尝试恢复分析结果
            const restored = await this.restoreAnalysis();
            
            if (restored) {
                // 恢复成功，解锁UI
                this.updateUIAfterPayment();
                
                // 显示成功消息
                this.showSuccessMessage();
                
                // 直接解锁下载按钮，确保时序正确
                setTimeout(() => {
                    this.unlockDownloadButtonDirectly();
                }, 300);
                
                // 滚动到结果区域
                setTimeout(() => {
                    const resultSection = document.getElementById('analysis-result-section');
                    if (resultSection) {
                        resultSection.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 500);
            } else {
                console.log('没有找到保存的分析结果');
                // 如果当前有分析结果，直接解锁UI
                if (STATE.fullAnalysisResult) {
                    console.log('但有当前分析结果，直接解锁');
                    this.updateUIAfterPayment();
                    this.showSuccessMessage();
                }
            }
        } catch (error) {
            console.error('解锁内容失败:', error);
            // 即使出错，也尝试解锁下载按钮
            this.unlockDownloadButtonDirectly();
        }
    },
    
    // 直接解锁下载按钮的辅助方法
    unlockDownloadButtonDirectly: function() {
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
    
   // 恢复分析结果
restoreAnalysis: async function() {
    try {
        // 检查是否有保存的分析结果
        const savedResult = localStorage.getItem('last_analysis_result');
        const savedService = localStorage.getItem('last_analysis_service');
        const savedUserData = localStorage.getItem('last_user_data');
        
        if (!savedResult || !savedService) {
            console.log('没有保存的分析结果');
            return false;
        }
        
        console.log('📥 从存储恢复分析结果...');
        console.log('保存的服务:', savedService, '当前服务:', STATE.currentService);
        
        // ✅ 关键修复：恢复分析结果的同时，也恢复服务类型
        STATE.fullAnalysisResult = savedResult;
        STATE.currentService = savedService;  // 这行是新增的，确保服务类型正确恢复
        
        if (savedUserData) {
            try {
                STATE.userData = JSON.parse(savedUserData);
            } catch (e) {
                console.error('解析用户数据失败:', e);
            }
        }
        
        // 处理结果
        const parsedBaziData = parseBaziData(savedResult);
        STATE.baziData = parsedBaziData.userBazi;
        
        // ✅ 确保UI更新使用正确的服务名称
        updateServiceDisplay(savedService);
        
        // 显示结果
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
    
    // 支付后更新UI
    updateUIAfterPayment: function() {
        console.log('🎨 更新支付后UI...');
        
        // 更新解锁界面
        if (typeof updateUnlockInterface === 'function') {
            updateUnlockInterface();
        }
        
        // 显示完整内容
        if (typeof showFullAnalysisContent === 'function') {
            showFullAnalysisContent();
        }
        
        // 解锁下载按钮
        if (typeof unlockDownloadButton === 'function') {
            unlockDownloadButton();
            console.log('✅ 下载按钮已解锁');
        }
        
        // 关闭支付弹窗（如果开着）
        if (typeof closePaymentModal === 'function') {
            closePaymentModal();
        }
    },
    
    // 显示成功消息
    showSuccessMessage: function() {
        // 避免重复显示
        if (document.getElementById('payment-success-alert')) return;
        
        const alertDiv = document.createElement('div');
        alertDiv.id = 'payment-success-alert';
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            padding: 15px 30px;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 20px rgba(76, 175, 80, 0.3);
            font-size: 16px;
            font-weight: bold;
            animation: slideDown 0.5s ease;
            text-align: center;
            min-width: 300px;
            max-width: 90%;
        `;
        
        alertDiv.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                <span style="font-size: 20px;">✅</span>
                <span>支付成功！算命报告已解锁</span>
            </div>
            <div style="margin-top: 8px; font-size: 12px; opacity: 0.9;">
                现在可以查看完整分析和下载报告
            </div>
        `;
        
        document.body.appendChild(alertDiv);
        
        // 5秒后自动移除
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 5000);
    },
    
    // 保存分析数据（支付前调用）
    saveAnalysisBeforePayment: function() {
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
// 主入口文件
import { SERVICES, STATE } from './config.js';
import { checkAPIStatus, parseBaziData, callDeepSeekAPI } from './api.js';
import {
    UI,
    initFormOptions,
    setDefaultValues,
    updateServiceDisplay,
    updateUnlockInfo,
    displayPredictorInfo,
    displayBaziPan,
    processAndDisplayAnalysis,
    showPaymentModal,
    closePaymentModal,
    updateUnlockInterface,
    showFullAnalysisContent,
    lockDownloadButton,
    unlockDownloadButton,
    resetUnlockInterface,
    animateButtonStretch,
    showLoadingModal,
    hideLoadingModal,
    showAnalysisResult,
    hideAnalysisResult,
    validateForm,
    collectUserData
} from './ui.js';

import { CesuanModule } from '../modules/cesuan.js';
import { YunchengModule } from '../modules/yuncheng.js';
import { XiangpiModule } from '../modules/xiangpi.js';
import { HehunModule } from '../modules/hehun.js';

// 服务模块映射
const SERVICE_MODULES = {
    '测算验证': CesuanModule,
    '流年运程': YunchengModule,
    '人生详批': XiangpiModule,
    '八字合婚': HehunModule
};

// ============ 【支付相关函数】 ============

// 支付成功处理函数
function handlePaymentSuccess() {
    // 设置支付解锁状态
    STATE.isPaymentUnlocked = true;
    STATE.isDownloadLocked = false;
    
    // 关闭支付弹窗
    closePaymentModal();
    
    // 更新解锁界面
    updateUnlockInterface();
    
    // 显示完整内容
    showFullAnalysisContent();
    
    // 解锁下载按钮
    unlockDownloadButton();
    
    // 显示成功提示
    PaymentManager.showSuccessMessage();
}

// 确认支付（用户手动点击"我已支付"时调用）
function confirmPayment() {
    // 检查是否有订单ID
    if (!STATE.currentOrderId) {
        alert('请先点击"前往支付宝支付"按钮完成支付');
        return;
    }
    
    const confirmed = confirm('如果您已完成支付宝支付，请点击"确定"解锁内容。\n如支付遇到问题，请联系客服微信：runzang888');
    
    if (confirmed) {
        // 调用后端接口检查支付状态
        fetch(`https://runzang.top/api/payment/status/${STATE.currentOrderId}`)
            .then(response => response.json())
            .then(result => {
                if (result.success && result.data.status === 'paid') {
                    // 支付成功，解锁内容
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

// 初始化应用
async function initApp() {
    console.log('🚀 应用初始化开始...');
    
    try {
        // ============ 【第一步：检查支付状态】 ============
        console.log('1. 检查支付状态...');
        await PaymentManager.initPaymentCheck();
        
        // ============ 【第二步：常规初始化】 ============
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

// 设置事件监听器
function setupEventListeners() {
    console.log('设置事件监听器...');
    
    // 导航栏点击事件
    document.querySelectorAll('.service-nav a').forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const serviceName = this.dataset.service;
            switchService(serviceName);
        });
    });
    
    // 立即测算按钮
    UI.analyzeBtn().addEventListener('click', startAnalysis);
    
    // 解锁按钮
    UI.unlockBtn().addEventListener('click', showPaymentModal);
    
    // 下载报告按钮
    UI.downloadReportBtn().addEventListener('click', downloadReport);
    
    // 重新测算按钮
    UI.recalculateBtn().addEventListener('click', newAnalysis);
    
    // 支付弹窗按钮
    UI.confirmPaymentBtn().addEventListener('click', confirmPayment);
    UI.cancelPaymentBtn().addEventListener('click', closePaymentModal);
    UI.closePaymentBtn().addEventListener('click', closePaymentModal);
    
    // ESC键关闭支付弹窗
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closePaymentModal();
        }
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', function(event) {
        const paymentModal = UI.paymentModal();
        if (event.target === paymentModal) {
            closePaymentModal();
        }
    });
    
    // 图片加载完成事件
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

// 切换服务 - ✅ 修复：切换服务时彻底重置状态
function switchService(serviceName) {
    console.log('切换服务到:', serviceName, '当前服务:', STATE.currentService);
    
    if (!SERVICES[serviceName]) {
        console.error('服务不存在:', serviceName);
        return;
    }
    
    // 保存旧服务名称用于比较
    const oldService = STATE.currentService;
    
    // ✅ 关键修复：切换到不同服务时，彻底重置所有状态
    if (oldService !== serviceName) {
        console.log('切换到不同服务，彻底重置状态');
        
        // 重置状态
        STATE.isPaymentUnlocked = false;
        STATE.isDownloadLocked = true;
        STATE.fullAnalysisResult = '';
        STATE.baziData = null;
        STATE.partnerBaziData = null;
        STATE.currentOrderId = null;
        
        // ✅ 关键：清空用户数据，确保重新收集
        STATE.userData = null;
        STATE.partnerData = null;
        
        console.log('✅ 所有状态已重置');
    }
    
    // 先更新当前服务状态
    STATE.currentService = serviceName;
    console.log('STATE.currentService 已更新为:', STATE.currentService);
    
    // 更新UI显示
    updateServiceDisplay(serviceName);
    
    // 更新解锁信息
    updateUnlockInfo();
    
    // 重置解锁界面
    resetUnlockInterface();
    
    // 锁定下载按钮
    lockDownloadButton();
    
    // 如果切换到不同服务，隐藏分析结果区域
    if (oldService !== serviceName) {
        hideAnalysisResult();
        
        // ✅ 清空显示内容
        const freeAnalysisText = UI.freeAnalysisText();
        if (freeAnalysisText) {
            freeAnalysisText.innerHTML = '';
        }
        
        const predictorInfoGrid = UI.predictorInfoGrid();
        if (predictorInfoGrid) {
            predictorInfoGrid.innerHTML = '';
        }
        
        const baziGrid = UI.baziGrid();
        if (baziGrid) {
            baziGrid.innerHTML = '';
        }
    }
    
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    console.log('服务切换完成，解锁状态:', STATE.isPaymentUnlocked);
}

// 预加载图片
function preloadImages() {
    console.log('预加载图片...');
    
    Object.values(SERVICES).forEach(service => {
        const heroImg = new Image();
        heroImg.src = service.heroImage;
        
        const detailImg = new Image();
        detailImg.src = service.detailImage;
    });
}

// 开始分析 - ✅ 修复：确保每次都是全新分析
async function startAnalysis() {
    console.log('开始命理分析...');
    
    // 检查API状态
    if (STATE.apiStatus !== 'online') {
        alert('⚠️ API连接异常，请稍后再试或检查网络连接。');
        return;
    }
    
    // 验证表单
    if (!validateForm()) {
        alert('请填写完整的个人信息');
        return;
    }
    
    // ✅ 关键修复：更新报告抬头
    const resultServiceName = document.getElementById('result-service-name');
    if (resultServiceName) {
        resultServiceName.textContent = STATE.currentService + '分析报告';
    }
    
    // ✅ 关键修复：每次分析前清空旧的分析结果
    console.log('🔄 清空旧的分析结果...');
    STATE.fullAnalysisResult = '';
    STATE.baziData = null;
    STATE.partnerBaziData = null;
    
    // 重置支付解锁状态
    STATE.isPaymentUnlocked = false;
    STATE.isDownloadLocked = true;
    
    // 锁定下载按钮
    lockDownloadButton();
    
    // 触发按钮拉伸动画
    animateButtonStretch();
    
    // 显示加载弹窗
    showLoadingModal();
    
    try {
        // 收集用户数据
        collectUserData();
        
        // ✅ 清空显示区域，确保显示新内容
        const freeAnalysisText = UI.freeAnalysisText();
        if (freeAnalysisText) {
            freeAnalysisText.innerHTML = '<div class="loading-text">正在生成分析结果...</div>';
        }
        
        // 先显示预测者信息
        displayPredictorInfo();
        
        // 获取当前服务的模块
        const serviceModule = SERVICE_MODULES[STATE.currentService];
        if (!serviceModule) {
            throw new Error(`未找到服务模块: ${STATE.currentService}`);
        }
        
        // 获取提示词
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
        
        // 调用API
        console.log('正在调用DeepSeek API...');
        const analysisResult = await callDeepSeekAPI(prompt);
        console.log('DeepSeek API调用成功，响应长度:', analysisResult.length);
        console.log('结果前50字符:', analysisResult.substring(0, 50));
        
        // 保存完整分析结果
        STATE.fullAnalysisResult = analysisResult;
        
        // 处理分析结果，提取八字数据
        const parsedBaziData = parseBaziData(analysisResult);
        STATE.baziData = parsedBaziData.userBazi;
        STATE.partnerBaziData = parsedBaziData.partnerBazi;
        
        // 显示八字排盘
        displayBaziPan();
        
        // 处理并显示分析结果
        processAndDisplayAnalysis(analysisResult);
        
        // 隐藏加载弹窗
        hideLoadingModal();
        
        // 显示分析结果区域
        showAnalysisResult();
        
        console.log('命理分析完成，结果已显示');
        
        // ✅ 修改：支付状态检查，确保服务匹配
        const paymentData = PaymentManager.getPaymentData();
        if (paymentData && paymentData.verified) {
            // 检查保存的服务是否与当前服务匹配
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
        
        // 隐藏加载弹窗
        hideLoadingModal();
        
        // 显示错误信息
        let errorMessage = '命理分析失败，请稍后再试。';
        
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            errorMessage = 'API密钥错误，请联系管理员。';
        } else if (error.message.includes('429')) {
            errorMessage = '请求过于频繁，请稍后再试。';
        } else if (error.message.includes('网络') || error.message.includes('Network')) {
            errorMessage = '网络连接失败，请检查您的网络设置。';
        }
        
        alert(errorMessage + '\n\n错误详情：' + error.message);
    }
}

// 下载报告 - ✅ 修复：添加状态检查和修复逻辑
function downloadReport() {
    console.log('📥 尝试下载报告...');
    
    // ✅ 添加状态检查
    console.log('状态检查:', {
        isDownloadLocked: STATE.isDownloadLocked,
        isPaymentUnlocked: STATE.isPaymentUnlocked,
        hasUserData: !!STATE.userData,
        hasAnalysisResult: !!STATE.fullAnalysisResult,
        currentService: STATE.currentService // ✅ 新增检查
    });
    
    // 如果状态不一致，强制修复
    if (STATE.isPaymentUnlocked && STATE.isDownloadLocked) {
        console.log('⚠️ 状态不一致，强制解锁下载');
        STATE.isDownloadLocked = false;
        if (typeof unlockDownloadButton === 'function') {
            unlockDownloadButton();
        }
    }
    
    // 检查是否已解锁
    if (STATE.isDownloadLocked) {
        alert('请先解锁完整报告才能下载！');
        showPaymentModal();
        return;
    }
    
    if (!STATE.userData || !STATE.fullAnalysisResult) {
        alert('请先进行测算分析');
        return;
    }
    
    // ✅ 修复：确保使用当前服务名称
    const currentServiceName = STATE.currentService || '测算验证';
    
    // 收集预测者信息
    let predictorInfo = `命理分析报告 - ${currentServiceName}

预测者信息：
姓名：${STATE.userData.name}
性别：${STATE.userData.gender}
出生时间：${STATE.userData.birthYear}年${STATE.userData.birthMonth}月${STATE.userData.birthDay}日${STATE.userData.birthHour}时${STATE.userData.birthMinute}分
出生城市：${STATE.userData.birthCity}
测算服务：${currentServiceName}
测算时间：${new Date().toLocaleString('zh-CN')}`;

    // 如果是八字合婚，添加伴侣信息
    if (currentServiceName === '八字合婚' && STATE.partnerData) {
        predictorInfo += `

伴侣信息：
姓名：${STATE.partnerData.partnerName}
性别：${STATE.partnerData.partnerGender}
出生时间：${STATE.partnerData.partnerBirthYear}年${STATE.partnerData.partnerBirthMonth}月${STATE.partnerData.partnerBirthDay}日${STATE.partnerData.partnerBirthHour}时${STATE.partnerData.partnerBirthMinute}分
出生城市：${STATE.partnerData.partnerBirthCity}`;
    }

    // 获取八字排盘信息
    let baziInfo = '';
    
    if (STATE.currentService === '八字合婚' && STATE.partnerData && STATE.partnerBaziData) {
        // 八字合婚：显示用户和伴侣的八字
        baziInfo = `${STATE.userData.name} 八字排盘：
年柱：${STATE.baziData.yearColumn} (${STATE.baziData.yearElement})
月柱：${STATE.baziData.monthColumn} (${STATE.baziData.monthElement})
日柱：${STATE.baziData.dayColumn} (${STATE.baziData.dayElement})
时柱：${STATE.baziData.hourColumn} (${STATE.baziData.hourElement})

${STATE.partnerData.partnerName} 八字排盘：
年柱：${STATE.partnerBaziData.yearColumn} (${STATE.partnerBaziData.yearElement})
月柱：${STATE.partnerBaziData.monthColumn} (${STATE.partnerBaziData.monthElement})
日柱：${STATE.partnerBaziData.dayColumn} (${STATE.partnerBaziData.dayElement})
时柱：${STATE.partnerBaziData.hourColumn} (${STATE.partnerBaziData.hourElement})`;
    } else {
        // 其他服务：只显示用户的八字
        const baziDataToDisplay = STATE.baziData;
        baziInfo = `八字排盘：
年柱：${baziDataToDisplay.yearColumn} (${baziDataToDisplay.yearElement})
月柱：${baziDataToDisplay.monthColumn} (${baziDataToDisplay.monthElement})
日柱：${baziDataToDisplay.dayColumn} (${baziDataToDisplay.dayElement})
时柱：${baziDataToDisplay.hourColumn} (${baziDataToDisplay.hourElement})`;
    }
    
    const reportContent = `命理分析报告 - ${STATE.currentService}

${predictorInfo}

${baziInfo}

${STATE.fullAnalysisResult}

--- 命理分析服务平台 ---
分析时间：${new Date().toLocaleString('zh-CN')}
使用技术：DeepSeek AI命理分析系统`;

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

// 重新测算
function newAnalysis() {
    console.log('重新测算...');
    
    // 重置支付解锁状态
    STATE.isPaymentUnlocked = false;
    STATE.isDownloadLocked = true;
    
    // 锁定下载按钮
    lockDownloadButton();
    
    // 隐藏分析结果区域
    hideAnalysisResult();
    
    // 重置解锁界面
    resetUnlockInterface();
    
    // 重置免费内容
    const freeAnalysisText = UI.freeAnalysisText();
    if (freeAnalysisText) {
        freeAnalysisText.innerHTML = '';
    }
    
    // 清除当前订单ID
    STATE.currentOrderId = null;
    
    // ✅ 可选：清空分析数据（但保留用户数据）
    STATE.fullAnalysisResult = '';
    STATE.baziData = null;
    STATE.partnerBaziData = null;
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============ 【页面初始化】 ============

// 页面加载完成后初始化
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

// ✅ 确保 PaymentManager 在全局可用
if (typeof PaymentManager !== 'undefined') {
    window.PaymentManager = PaymentManager;
}

// ✅ 确保 STATE 在全局可用（如果需要）
if (typeof STATE !== 'undefined') {
    window.STATE = STATE;
}