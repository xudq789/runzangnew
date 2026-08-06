// cesuan.js - 修改 getPrompt 方法
export class CesuanModule {
    static getServiceConfig() {
        return {
            name: '测算验证',
            description: '基本命理验证服务',
            features: [
                '八字排盘',
                '性格分析',
                '职业推荐',
                '富贵层次评估',
                '过往大运吉凶分析',
                '过往关键流年验证',
                '专业建议与指导'
            ]
        };
    }
    
    // 修改：增加 baziText 参数
    static getPrompt(userData, partnerData = null, baziText = '') {
        return `任务：你是职业命理大师，精通梁湘润论命体系。请根据以下已排盘好的八字信息进行命理解读。

用户信息：
姓名：${userData.name}
性别：${userData.gender}
出生城市：${userData.birthCity}

${baziText}

请解读以下内容（每个部分以【标题】开头）：
【性格特点】
详细解读用户性格特点（优点、缺点、个性倾向）

【适宜行业职业推荐】
根据八字喜用和五行属性，推荐行业和职业方向

【富贵层次评估】
综合评估富贵层次（财富、事业、社会地位）

【过往大运吉凶分析】
指出关键时期和转折点

【过往关键流年验证】
验证过往关键流年运势

【专业建议与指导】
提供专业命理建议和发展指导

要求：
1. 回复字数2800-3000字
2. 纯文本格式，不用markdown符号
3. 专业详细但易懂
4. 不要用"首先"、"然后"等连接词
5. 每个部分以【标题】开头`;
    }
    
    static calculateBazi(userData) {
        // 不再需要，由后端排盘
        return null;
    }
}
