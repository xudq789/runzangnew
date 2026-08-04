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

// ... 其余代码保持不变，确保使用更新后的模块
