// 工具函数集合

// 获取DOM元素
export const DOM = {
    get: (selector) => document.querySelector(selector),
    getAll: (selector) => document.querySelectorAll(selector),
    id: (id) => document.getElementById(id)
};

// 格式化日期
export function formatDate(date = new Date()) {
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// 生成随机订单ID
export function generateOrderId() {
    return 'ORD' + Date.now() + Math.floor(Math.random() * 1000);
}

// 预加载图片
export function preloadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        img.src = url;
    });
}

// 显示/隐藏元素
export function showElement(element, display = 'block') {
    if (element) element.style.display = display;
}

export function hideElement(element) {
    if (element) element.style.display = 'none';
}

// 防抖函数
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 节流函数
export function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 计算八字（演示函数，备用）
export function calculateBazi(userData) {
    const year = parseInt(userData.birthYear);
    const month = parseInt(userData.birthMonth);
    const day = parseInt(userData.birthDay);
    const hour = parseInt(userData.birthHour);
    
    // 天干地支基础数据
    const heavenlyStems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    const earthlyBranches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    const elements = ['木', '木', '火', '火', '土', '土', '金', '金', '水', '水'];
    
    // 计算年柱（简化算法）
    const yearIndex = (year - 4) % 60;
    const yearHeavenly = heavenlyStems[yearIndex % 10];
    const yearEarthly = earthlyBranches[yearIndex % 12];
    const yearColumn = yearHeavenly + yearEarthly;
    const yearElement = elements[yearIndex % 10];
    
    // 计算月柱（简化算法）
    const monthIndex = (month + 1) % 12;
    const monthHeavenly = heavenlyStems[(yearIndex % 10 * 2 + monthIndex) % 10];
    const monthEarthly = earthlyBranches[monthIndex];
    const monthColumn = monthHeavenly + monthEarthly;
    const monthElement = elements[(yearIndex % 10 * 2 + monthIndex) % 10];
    
    // 计算日柱（简化算法）
    const dayIndex = (year + month + day) % 60;
    const dayHeavenly = heavenlyStems[dayIndex % 10];
    const dayEarthly = earthlyBranches[dayIndex % 12];
    const dayColumn = dayHeavenly + dayEarthly;
    const dayElement = elements[dayIndex % 10];
    
    // 计算时柱（简化算法）
    const hourIndex = Math.floor(hour / 2) % 12;
    const hourHeavenly = heavenlyStems[(dayIndex % 10 * 2 + hourIndex) % 10];
    const hourEarthly = earthlyBranches[hourIndex];
    const hourColumn = hourHeavenly + hourEarthly;
    const hourElement = elements[(dayIndex % 10 * 2 + hourIndex) % 10];
    
    return {
        yearColumn,
        yearElement,
        monthColumn,
        monthElement,
        dayColumn,
        dayElement,
        hourColumn,
        hourElement
    };
}

// 生成年份选项
export function generateYearOptions(startYear = 1900, endYear = 2024) {
    const years = [];
    for (let i = startYear; i <= endYear; i++) {
        years.push({ value: i, text: `${i}年` });
    }
    return years;
}

// 验证邮箱格式
export function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// 验证手机格式
export function isValidPhone(phone) {
    const re = /^1[3-9]\d{9}$/;
    return re.test(phone);
}

// 复制到剪贴板
export function copyToClipboard(text) {
    return new Promise((resolve, reject) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text)
                .then(() => resolve(true))
                .catch(err => reject(err));
        } else {
            // 降级方案
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                resolve(true);
            } catch (err) {
                reject(err);
            }
            document.body.removeChild(textArea);
        }
    });
}

// 保存到本地存储
export function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('保存到本地存储失败:', error);
        return false;
    }
}

// 从本地存储读取
export function loadFromStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('从本地存储读取失败:', error);
        return null;
    }
}
