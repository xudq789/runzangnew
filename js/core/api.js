// API通信模块
import { DOM } from './utils.js';
import { API_CONFIG } from './config.js';

export async function callDeepSeekAPI(prompt, serviceType) {
    console.log('📡 调用后端DeepSeek代理服务...');
    console.log(`📋 服务类型: ${serviceType}`);
    console.log(`📏 提示词长度: ${prompt.length}`);

    try {
        const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/deepseek/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: prompt,
                serviceType: serviceType
            }),
            signal: AbortSignal.timeout(API_CONFIG.TIMEOUT || 120000)
        });

        console.log(`📊 响应状态: ${response.status}`);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ 后端错误:', errorData);
            throw new Error(errorData.error || `请求失败 (${response.status})`);
        }

        const result = await response.json();
        console.log('✅ 后端响应成功');

        if (result.success && result.data && result.data.analysis) {
            console.log(`📝 响应长度: ${result.data.analysis.length}`);
            return result.data.analysis;
        } else {
            throw new Error('后端返回数据格式错误');
        }

    } catch (error) {
        console.error('❌ 分析请求失败:', error);

        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
            throw new Error('分析请求超时，请稍后再试');
        }

        throw error;
    }
}

export async function checkAPIStatus() {
    console.log('🔍 检查后端服务状态...');
    const statusElement = DOM.id('api-status');

    if (!statusElement) return 'unknown';

    try {
        const response = await fetch(`${API_CONFIG.BACKEND_URL}/health`, {
            signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
            const deepseekResponse = await fetch(`${API_CONFIG.BACKEND_URL}/api/deepseek/status`, {
                signal: AbortSignal.timeout(5000)
            });

            if (deepseekResponse.ok) {
                const data = await deepseekResponse.json();
                if (data.success && data.data.status === 'online') {
                    statusElement.textContent = '✅ 服务连接正常';
                    statusElement.className = 'api-status online';
                    return 'online';
                }
            }

            statusElement.textContent = '⚠️ DeepSeek服务异常';
            statusElement.className = 'api-status offline';
            return 'degraded';
        }

        statusElement.textContent = '❌ 后端服务不可用';
        statusElement.className = 'api-status offline';
        return 'offline';

    } catch (error) {
        console.error('状态检查失败:', error);
        statusElement.textContent = '❌ 服务不可用';
        statusElement.className = 'api-status offline';
        return 'offline';
    }
}
