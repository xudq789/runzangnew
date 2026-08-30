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

// ★★★ 修复：检查后端服务状态（使用正确的路径） ★★★
export async function checkAPIStatus() {
    console.log('🔍 检查后端服务状态...');
    const statusElement = DOM.id('api-status');

    if (!statusElement) return 'unknown';

    try {
        // 直接检查后端健康状态，不依赖 DeepSeek 状态接口
        const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/bazi/health`, {
            signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success || data.status === 'online') {
                statusElement.textContent = '✅ 服务连接正常';
                statusElement.className = 'api-status online';
                return 'online';
            }
        }

        statusElement.textContent = '⚠️ 后端服务异常';
        statusElement.className = 'api-status offline';
        return 'degraded';

    } catch (error) {
        console.error('状态检查失败:', error);
        statusElement.textContent = '❌ 服务不可用';
        statusElement.className = 'api-status offline';
        return 'offline';
    }
}

// 解析八字数据
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

// 解析单个八字
function parseSingleBazi(baziText) {
    const baziData = {
        year: { ganzhi: '', nayin: '' },
        month: { ganzhi: '', nayin: '' },
        day: { ganzhi: '', nayin: '' },
        hour: { ganzhi: '', nayin: '' }
    };

    // Try format: "己巳年、丙子月、丙寅日、甲午时"
    const inlineMatch = baziText.match(/([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])年[、,]\s*([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])月[、,]\s*([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])日[、,]\s*([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])时/);
    if (inlineMatch) {
        baziData.year.ganzhi = inlineMatch[1];
        baziData.month.ganzhi = inlineMatch[2];
        baziData.day.ganzhi = inlineMatch[3];
        baziData.hour.ganzhi = inlineMatch[4];
        return baziData;
    }

    const lines = baziText.split('\n');

    // Try to find the line with all four pillars (e.g., "乾造：己巳 丙子 丙寅 甲午")
    for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Match format like "乾造：己巳 丙子 丙寅 甲午" or "坤造：己巳 丙子 丙寅 甲午"
        const pillarsMatch = trimmedLine.match(/[乾坤]造[：:]\s*([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])\s+([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])\s+([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])\s+([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])/);
        
        if (pillarsMatch) {
            baziData.year.ganzhi = pillarsMatch[1];
            baziData.month.ganzhi = pillarsMatch[2];
            baziData.day.ganzhi = pillarsMatch[3];
            baziData.hour.ganzhi = pillarsMatch[4];
            break;
        }
        
        // Fallback: try individual pillar format (e.g., "年柱：己巳（大林木）" or "年柱：己巳(大林木)")
        if (trimmedLine.includes('年柱')) {
            const match = trimmedLine.match(/年柱[：:]\s*([^\s(（]+)[(（]([^)）]+)[)）]/);
            if (match) {
                baziData.year.ganzhi = match[1] || '';
                baziData.year.nayin = match[2] || '';
            }
        } else if (trimmedLine.includes('月柱')) {
            const match = trimmedLine.match(/月柱[：:]\s*([^\s(（]+)[(（]([^)）]+)[)）]/);
            if (match) {
                baziData.month.ganzhi = match[1] || '';
                baziData.month.nayin = match[2] || '';
            }
        } else if (trimmedLine.includes('日柱')) {
            const match = trimmedLine.match(/日柱[：:]\s*([^\s(（]+)[(（]([^)）]+)[)）]/);
            if (match) {
                baziData.day.ganzhi = match[1] || '';
                baziData.day.nayin = match[2] || '';
            }
        } else if (trimmedLine.includes('时柱')) {
            const match = trimmedLine.match(/时柱[：:]\s*([^\s(（]+)[(（]([^)）]+)[)）]/);
            if (match) {
                baziData.hour.ganzhi = match[1] || '';
                baziData.hour.nayin = match[2] || '';
            }
        }
    }

    return baziData;
}

// 新增：综合分析接口
export async function analyzeBazi(userData, serviceType, needPolish = true) {
    console.log('🔮 调用综合命理分析引擎...');
    console.log('用户数据:', userData);
    console.log('服务类型:', serviceType);

    try {
        const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_data: userData,
                service_type: serviceType,
                need_polish: needPolish,
                current_year: new Date().getFullYear()
            }),
            signal: AbortSignal.timeout(120000)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `请求失败 (${response.status})`);
        }

        const result = await response.json();
        console.log('✅ 综合分析响应成功');

        if (result.success) {
            return result.data;
        } else {
            throw new Error(result.error || '分析失败');
        }
    } catch (error) {
        console.error('❌ 综合分析失败:', error);
        throw error;
    }
}
