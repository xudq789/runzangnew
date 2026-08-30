// 服务配置数据
export const SERVICES = {
    '测算验证': {
        heroImage: 'https://runzang-1388534671.cos.ap-guangzhou.myqcloud.com/images/1-1.jpg',
        detailImage: 'https://runzang-1388534671.cos.ap-guangzhou.myqcloud.com/images/1-2.jpg',
        price: 0.01,
        lockedItems: [
            '富贵层次评估',
            '过往大运吉凶分析',
            '过往关键流年验证', 
            '专业建议与指导'
        ],
        analysisSteps: [
            '八字排盘',
            '大运排盘',
            '八字喜用分析',
            '性格特点',
            '适宜行业职业推荐',
            '富贵层次评估',
            '过往大运吉凶分析',
            '过往关键流年验证', 
            '专业建议与指导'
        ]
    },
    '流年运程': {
        heroImage: 'https://runzang-1388534671.cos.ap-guangzhou.myqcloud.com/images/2-1.jpg',
        detailImage: 'https://runzang-1388534671.cos.ap-guangzhou.myqcloud.com/images/2-2.jpg',
        price: 0.01,
        lockedItems: [
            '富贵层次评估',
            '测算当年及往后5年运势',
            '事业财运走向分析',
            '婚姻感情趋势分析',
            '年度发展建议',
            '重要注意事项'
        ],
        analysisSteps: [
            '八字排盘',
            '大运排盘',
            '八字喜用分析',
            '性格特点',
            '适宜行业职业推荐',
            '富贵层次评估',
            '测算当年及往后5年运势',
            '事业财运走向分析',
            '婚姻感情趋势分析',
            '年度发展建议',
            '重要注意事项'
        ]
    },
    '人生详批': {
        heroImage: 'https://runzang-1388534671.cos.ap-guangzhou.myqcloud.com/images/3-1.jpg',
        detailImage: 'https://runzang-1388534671.cos.ap-guangzhou.myqcloud.com/images/3-2.jpg',
        price: 0.01,
        lockedItems: [
            '富贵层次评估',
            '人生每步大运吉凶分析',
            '人生高低点分析',
            '往后关键流年分析',
            '重要人生事项提醒',
            '风水建议',
            '个人发展建议'
        ],
        analysisSteps: [
            '八字排盘',
            '大运排盘',
            '八字喜用分析',
            '性格特点',
            '适宜行业职业推荐',
            '富贵层次评估',
            '人生每步大运吉凶分析',
            '人生高低点分析',
            '往后关键流年分析',
            '重要人生事项提醒',
            '风水建议',
            '个人发展建议'
        ]
    },
    '八字合婚': {
        heroImage: 'https://runzang-1388534671.cos.ap-guangzhou.myqcloud.com/images/4-1.jpg',
        detailImage: 'https://runzang-1388534671.cos.ap-guangzhou.myqcloud.com/images/4-2.jpg',
        price: 0.01,
        lockedItems: [
            '双方八字契合度分析',
            '感情发展趋势解读',
            '婚姻稳定性分析',
            '双方性格匹配度分析',
            '婚姻建议和注意事项'
        ],
        analysisSteps: [
            '用户八字排盘',
            '伴侣八字排盘',
            '八字喜用分析',
            '性格特点',
            '双方八字契合度分析',
            '感情发展趋势解读',
            '婚姻稳定性分析',
            '双方性格匹配度分析',
            '婚姻建议和注意事项'
        ]
    }
};

// 全局状态
export const STATE = {
    currentService: '测算验证',
    fullAnalysisResult: '',
    freeSummary: '',
    paidDetail: '',
    baziData: null,
    partnerBaziData: null,
    dayunData: null,
    partnerDayunData: null,
    currentOrderId: null,
    currentOutTradeNo: null,
    userData: null,
    partnerData: null,
    apiStatus: null,
    isPaymentUnlocked: false,
    isDownloadLocked: true
};

// ★★★ API 配置 ★★★
export const API_CONFIG = {
    BACKEND_URL: 'https://api.runzang.top',
    TIMEOUT: 120000
};
