// API通信模块
import { DOM } from './utils.js';
import { API_CONFIG } from './config.js';

// 调用后端DeepSeek代理接口
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

// 检查API状态（DeepSeek和后端）
export async function checkAPIStatus() {
    console.log('🔍 检查后端服务状态...');
    const statusElement = DOM.id('api-status');

    if (!statusElement) return 'unknown';

    try {
        // 检查后端服务
        const response = await fetch(`${API_CONFIG.BACKEND_URL}/health`, {
            signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
            // 检查DeepSeek状态
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

// 解析八字数据（保持不变）
export function parseBaziData(analysisResult) {
    console.log('解析八字数据...');

    const result = {
        userBazi: null,
        partnerBazi: null
    };

    if (analysisResult.includes('【用户八字排盘】') && analysisResult.includes('【伴侣八字排盘】')) {
        const userBaziText = analysisResult.match(/【用户八字排盘】([\s\S]*?)【/);
        if (userBaziText && userBaziText[1]) {
            result.userBazi = parseSingleBazi(userBaziText[1]);
        }

        const partnerBaziText = analysisResult.match(/【伴侣八字排盘】([\s\S]*?)【/);
        if (partnerBaziText && partnerBaziText[1]) {
            result.partnerBazi = parseSingleBazi(partnerBaziText[1]);
        }
    } else {
        result.userBazi = parseSingleBazi(analysisResult);
    }

    console.log('解析到的八字数据:', result);
    return result;
}

// 解析单个八字（辅助函数）
function parseSingleBazi(baziText) {
    const baziData = {
        yearColumn: '',
        yearElement: '',
        monthColumn: '',
        monthElement: '',
        dayColumn: '',
        dayElement: '',
        hourColumn: '',
        hourElement: ''
    };

    const lines = baziText.split('\n');

    lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine.includes('年柱')) {
            const match = trimmedLine.match(/年柱[：:]\s*([^\s(]+)(?:\s*\(([^)]+)\))?/);
            if (match) {
                baziData.yearColumn = match[1] || '';
                baziData.yearElement = match[2] || '';
            }
        } else if (trimmedLine.includes('月柱')) {
            const match = trimmedLine.match(/月柱[：:]\s*([^\s(]+)(?:\s*\(([^)]+)\))?/);
            if (match) {
                baziData.monthColumn = match[1] || '';
                baziData.monthElement = match[2] || '';
            }
        } else if (trimmedLine.includes('日柱')) {
            const match = trimmedLine.match(/日柱[：:]\s*([^\s(]+)(?:\s*\(([^)]+)\))?/);
            if (match) {
                baziData.dayColumn = match[1] || '';
                baziData.dayElement = match[2] || '';
            }
        } else if (trimmedLine.includes('时柱')) {
            const match = trimmedLine.match(/时柱[：:]\s*([^\s(]+)(?:\s*\(([^)]+)\))?/);
            if (match) {
                baziData.hourColumn = match[1] || '';
                baziData.hourElement = match[2] || '';
            }
        }
    });

    return baziData;
}
