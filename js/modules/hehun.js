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
    
    static getPrompt(userData, partnerData) {
        if (!partnerData) {
            throw new Error('伴侣信息是八字合婚服务的必填项');
        }
        
        return `你是一位职业的命理大师，精通梁湘润论命体系。请根据以下用户信息用真太阳时排盘八字进行命理分析：

用户信息：
姓名：${userData.name}
性别：${userData.gender}
出生时间：${userData.birthYear}年${userData.birthMonth}月${userData.birthDay}日${userData.birthHour}时${userData.birthMinute}分
出生城市：${userData.birthCity}

伴侣信息：
姓名：${partnerData.partnerName}
性别：${partnerData.partnerGender}
出生时间：${partnerData.partnerBirthYear}年${partnerData.partnerBirthMonth}月${partnerData.partnerBirthDay}日${partnerData.partnerBirthHour}时${partnerData.partnerBirthMinute}分
出生城市：${partnerData.partnerBirthCity}

请先进行八字排盘，大运排盘应准确排出起运岁数并检查有无明显逻辑错误（三日一年），男命阳顺阴逆，女命阳逆阴顺，然后用以下格式输出结果：

【用户八字排盘】
年柱：[年柱干支] ([五行属性])
月柱：[月柱干支] ([五行属性])
日柱：[日柱干支] ([五行属性])
时柱：[时柱干支] ([五行属性])

【伴侣八字排盘】
年柱：[年柱干支] ([五行属性])
月柱：[年柱干支] ([五行属性])
日柱：[年柱干支] ([五行属性])
时柱：[年柱干支] ([五行属性])

【用户大运排盘】
起运岁数：[起运岁数]
起运时间：[起运时间]
大运详细：
第1步大运：[干支] ([年龄段]，[年份段])
第2步大运：[干支] ([年龄段]，[年份段])
...继续列出后续大运...

【伴侣大运排盘】
起运岁数：[起运岁数]
起运时间：[起运时间]
大运详细：
第1步大运：[干支] ([年龄段]，[年份段])
第2步大运：[干支] ([年龄段]，[年份段])
...继续列出后续大运...

【八字喜用分析】
用穷通宝鉴、子平真诠、三名通会六十甲子日时断深入分析八字喜用。

【性格特点】
详细解读用户性格特点，包括优点、缺点和个性倾向。

【双方八字契合度分析】
分析双方八字的契合程度，包括五行互补、十神关系等方面。

【感情发展趋势解读】
解读双方感情发展的趋势，指出关键时期和注意事项。

【婚姻稳定性分析】
分析双方婚姻的稳定性，指出潜在问题和解决方法。

【双方性格匹配度分析】
分析双方性格的匹配程度，指出互补和冲突的方面。

【婚姻建议和注意事项】
提供婚姻生活的具体建议和需要注意的事项。

要求：
1. 回复字数控制在3000-3200字之间
2. 使用纯文本格式，不要使用任何markdown符号
3. 回复内容要专业、详细但易懂
4. 分析要直接明了，不要有"首先"、"然后"等过程性词语
5. 严格按照上述格式输出，每个部分以【标题】开头`;
    }
    
    static calculateBazi(userData) {
        return calculateBazi(userData);
    }
}




