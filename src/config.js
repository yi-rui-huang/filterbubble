// API配置 - 使用环境变量保护敏感信息
export const API_KEY = import.meta.env.VUE_APP_API_KEY || 'sk-b69b6fe4bf184117839801042f04cee9';
export const BASE_URL = import.meta.env.VUE_APP_BASE_URL || 'https://api.deepseek.com/v1';

export const BACKUP_API_KEY = import.meta.env.VUE_APP_BACKUP_API_KEY || API_KEY;

export const MODEL = import.meta.env.VUE_APP_MODEL || 'deepseek-chat';

export const API_TIMEOUT = parseInt(import.meta.env.VUE_APP_API_TIMEOUT) || 60000; // 60秒超时

// 开发环境下的警告
if (import.meta.env.DEV && !API_KEY) {
  console.warn('警告: API_KEY 未设置，请检查环境变量配置');
}
