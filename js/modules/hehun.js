// hehun.js
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
        
        // 对于合婚，baziText 已经包含了双方的八字信息
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
【性格特点】
详细解读双方性格特点

【双方八字契合度分析】
分析双方八字的契合程度

【感情发展趋势解读】
解读双方感情发展的趋势

【婚姻稳定性分析】
分析双方婚姻的稳定性

【双方性格匹配度分析】
分析双方性格的匹配程度

【婚姻建议和注意事项】
提供婚姻生活的具体建议

要求：
1. 回复字数3000-3200字
2. 纯文本格式，不用markdown符号
3. 专业详细但易懂
4. 每个部分以【标题】开头`;
    }
}
