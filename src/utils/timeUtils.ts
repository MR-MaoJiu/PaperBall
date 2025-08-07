/**
 * 时间格式化工具函数
 */

/**
 * 格式化时间为相对时间（如：刚刚、5分钟前、2小时前等）
 * @param date 日期对象或时间戳
 * @returns 格式化后的相对时间字符串
 */
export const formatTimeAgo = (date: Date | string | number): string => {
  let targetDate: Date;
  
  if (typeof date === 'string') {
    targetDate = new Date(date);
  } else if (typeof date === 'number') {
    targetDate = new Date(date);
  } else {
    targetDate = date;
  }
  
  // 检查日期是否有效
  if (isNaN(targetDate.getTime())) {
    return '时间未知';
  }
  
  const now = new Date();
  const diff = now.getTime() - targetDate.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  if (months < 12) return `${months}个月前`;
  return `${years}年前`;
};

/**
 * 格式化时间为标准格式（如：2024-01-15 14:30:25）
 * @param date 日期对象或时间戳
 * @returns 格式化后的标准时间字符串
 */
export const formatDateTime = (date: Date | string | number): string => {
  let targetDate: Date;
  
  if (typeof date === 'string') {
    targetDate = new Date(date);
  } else if (typeof date === 'number') {
    targetDate = new Date(date);
  } else {
    targetDate = date;
  }
  
  // 检查日期是否有效
  if (isNaN(targetDate.getTime())) {
    return '时间未知';
  }
  
  return targetDate.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

/**
 * 格式化时间为简短格式（如：01-15 14:30）
 * @param date 日期对象或时间戳
 * @returns 格式化后的简短时间字符串
 */
export const formatShortDateTime = (date: Date | string | number): string => {
  let targetDate: Date;
  
  if (typeof date === 'string') {
    targetDate = new Date(date);
  } else if (typeof date === 'number') {
    targetDate = new Date(date);
  } else {
    targetDate = date;
  }
  
  // 检查日期是否有效
  if (isNaN(targetDate.getTime())) {
    return '时间未知';
  }
  
  const now = new Date();
  const isToday = targetDate.toDateString() === now.toDateString();
  
  if (isToday) {
    return targetDate.toLocaleString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } else {
    return targetDate.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }
};

/**
 * 将服务器返回的时间戳转换为标准时间戳
 * @param timestamp 服务器返回的时间戳（可能是字符串或数字）
 * @returns 标准的数字时间戳
 */
export const normalizeTimestamp = (timestamp: string | number | Date): number => {
  if (typeof timestamp === 'string') {
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? Date.now() : date.getTime();
  } else if (typeof timestamp === 'number') {
    return timestamp;
  } else if (timestamp instanceof Date) {
    return timestamp.getTime();
  }
  return Date.now();
};