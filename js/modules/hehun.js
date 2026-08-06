// 八字合婚模块
import { calculateBazi } from '../core/utils.js';

export class HehunModule {
    static getServiceConfig() {
        return {
            name: '八字合婚',
            description: '八字合婚配对分析服务',
            features: [
                '双方八字排盘',
                '性格分析',
                '双方八字契合度分析',
                '感情发展趋势解读',
                '婚姻稳定性分析',
                '双方性格匹配度分析',
                '婚姻建议和注意事项'
            ]
        };
    }
    
    static getPrompt(userData, partnerData = null, baziText = '') {
        if (!partnerData) {
            throw new Error('伴侣信息是八字合婚服务的必填项');
        }
        
        return `任务：你是职业命理大师，精通梁湘润论命体系。请根据以下已排盘好的八字信息进行八字合婚分析。

【用户信息】
姓名：${userData.name}
性别：${userData.gender}
出生城市：${userData.birthCity}

【伴侣信息】
姓名：${partnerData.partnerName}
性别：${partnerData.partnerGender}
出生城市：${partnerData.partnerBirthCity}

${baziText}

请解读以下内容（每个部分以【标题】开头）：
【双方性格特点】
详细解读双方性格特点（优点、缺点、个性倾向）

【双方八字契合度分析】
分析双方八字的契合程度，五行互补分析，十神关系分析

【感情发展趋势解读】
解读双方感情发展的趋势，指出关键时期和注意事项

【婚姻稳定性分析】
分析双方婚姻的稳定性，指出潜在问题和解决方法

【双方性格匹配度分析】
分析双方性格的匹配程度，指出互补和冲突的方面

【婚姻建议和注意事项】
提供婚姻生活的具体建议和需要注意的事项

要求：
1. 回复字数3000-3200字
2. 纯文本格式，不用markdown符号
3. 专业详细但易懂
4. 不要用"首先"、"然后"等连接词
5. 每个部分以【标题】开头`;
    }
    
    static calculateBazi(userData) {
        return calculateBazi(userData);
    }
}
