import { getFirebaseDb, isFirestoreAvailable, getFirebaseErrorMessage, isNetworkConnected } from './firebase';
import { getUserId } from '../utils/userIdentifier';
import { collection, addDoc, serverTimestamp, writeBatch, doc } from 'firebase/firestore';

// 跟踪 Firebase 连接状态
let isFirebaseAvailable = true;
let lastFirebaseErrorTime = 0;
const ERROR_COOLDOWN_MS = 10000; // 10 秒内不重复记录同类错误

// 记录权限错误状态
let hasPermissionError = false;
let permissionErrorTime = 0;
const PERMISSION_ERROR_COOLDOWN_MS = 60000; // 1分钟内不重复检查权限

// 本地存储的日志队列
let pendingLogs = [];
const MAX_PENDING_LOGS = 1000;
const SYNC_INTERVAL_MS = 60000; // 每分钟尝试同步一次

// 初始化日志服务
export function initLoggingService() {
  // 加载本地存储的日志
  loadPendingLogs();
  
  // 设置网络状态监听
  setupNetworkListeners();
  
  // 启动定期同步
  startLogSync();
  
  console.log('Logging service initialized');
}

// 初始化时从本地存储加载待处理的日志
function loadPendingLogs() {
  try {
    const storedLogs = localStorage.getItem('filterbubble_pending_logs');
    if (storedLogs) {
      pendingLogs = JSON.parse(storedLogs);
      console.log(`Loaded ${pendingLogs.length} pending logs from local storage`);
    }
  } catch (error) {
    console.error('Failed to load pending logs from local storage:', error);
  }
}

// 监听网络状态变化
function setupNetworkListeners() {
  if (typeof window !== 'undefined') {
    // 监听网络状态变化
    window.addEventListener('online', handleNetworkStatusChange);
    window.addEventListener('offline', handleNetworkStatusChange);
    
    // 初始检查网络状态
    handleNetworkStatusChange();
  }
}

// 处理网络状态变化
function handleNetworkStatusChange() {
  const isOnline = navigator.onLine;
  console.log(`Network status changed: ${isOnline ? 'online' : 'offline'}`);
  
  // 如果网络恢复连接，尝试同步日志
  if (isOnline && pendingLogs.length > 0) {
    console.log('Network is back online, attempting to sync pending logs...');
    // 重置 Firebase 状态，给它一个重新连接的机会
    isFirebaseAvailable = true;
    // 尝试同步
    setTimeout(() => syncPendingLogs(), 2000);
  }
}

// 保存待处理的日志到本地存储
function savePendingLogs() {
  try {
    // 如果日志过多，删除旧的
    if (pendingLogs.length > MAX_PENDING_LOGS) {
      pendingLogs = pendingLogs.slice(pendingLogs.length - MAX_PENDING_LOGS);
    }
    
    localStorage.setItem('filterbubble_pending_logs', JSON.stringify(pendingLogs));
  } catch (error) {
    console.error('Failed to save pending logs to local storage:', error);
  }
}

// 尝试同步待处理的日志到 Firestore
async function syncPendingLogs() {
  // 如果没有待处理的日志，直接返回
  if (pendingLogs.length === 0) return;
  
  // 如果网络不可用或 Firestore 不可用，等待下次同步
  if (!isNetworkConnected() || !isFirestoreAvailable()) return;
  
  // 如果有权限错误，跳过同步
  if (hasPermissionError) {
    console.log('Skipping sync due to permission error');
    return;
  }
  
  try {
    const db = getFirebaseDb();
    const batch = writeBatch(db);
    const logsToSync = [...pendingLogs]; // 复制一份，避免同步过程中的修改
    
    // 最多一次同步 500 条日志（Firestore 批量写入限制）
    const MAX_BATCH_SIZE = 500;
    const logsToProcess = logsToSync.slice(0, MAX_BATCH_SIZE);
    
    // 添加到批量操作
    for (const log of logsToProcess) {
      const { collectionName, data } = log;
      const newDocRef = doc(collection(db, collectionName));
      batch.set(newDocRef, {
        ...data,
        syncedAt: serverTimestamp(),
        wasOffline: true
      });
    }
    
    // 提交批量操作
    await batch.commit();
    
    // 从待处理队列中移除已同步的日志
    pendingLogs = pendingLogs.slice(logsToProcess.length);
    savePendingLogs();
    
    console.log(`Successfully synced ${logsToProcess.length} logs to Firestore`);
  } catch (error) {
    // 检查是否是权限错误
    const errorMessage = error.message || '';
    const isPermissionError = 
      errorMessage.includes('permission-denied') || 
      errorMessage.includes('权限被拒绝') ||
      error.code === 'permission-denied';
    
    if (isPermissionError) {
      console.warn('同步时检测到 Firestore 权限错误，将切换到本地存储模式');
      hasPermissionError = true;
      permissionErrorTime = Date.now();
    } else {
      console.error('Failed to sync pending logs:', error);
    }
  }
}

// 定期尝试同步待处理的日志
function startSyncInterval() {
  // 加载已保存的待处理日志
  loadPendingLogs();
  
  // 设置定期同步
  setInterval(syncPendingLogs, SYNC_INTERVAL_MS);
  
  // 当网络恢复时尝试同步
  window.addEventListener('online', () => {
    console.log('Network connection restored, attempting to sync logs');
    syncPendingLogs();
  });
}

// 在应用启动时启动同步
if (typeof window !== 'undefined') {
  startSyncInterval();
}

/**
 * 检查 Firebase 是否可用，并处理错误
 * @returns {boolean} Firebase 是否可用
 */
function checkFirebaseAvailability() {
  if (!isFirestoreAvailable()) {
    // 如果距离上次错误超过冷却时间，则记录错误
    const now = Date.now();
    if (now - lastFirebaseErrorTime > ERROR_COOLDOWN_MS) {
      console.error('Firebase database is not initialized');
      lastFirebaseErrorTime = now;
      isFirebaseAvailable = false;
    }
    return false;
  }
  
  // 如果有权限错误，并且冷却时间还没过，直接返回 false
  const now = Date.now();
  if (hasPermissionError && now - permissionErrorTime < PERMISSION_ERROR_COOLDOWN_MS) {
    return false;
  }
  
  // 如果权限错误冷却时间已过，重置状态并重新尝试
  if (hasPermissionError && now - permissionErrorTime >= PERMISSION_ERROR_COOLDOWN_MS) {
    console.log('Resetting permission error status and retrying');
    hasPermissionError = false;
  }
  
  // 如果之前不可用但现在可用，记录恢复
  if (!isFirebaseAvailable) {
    console.log('Firebase connection restored');
    isFirebaseAvailable = true;
    
    // 尝试同步待处理的日志
    syncPendingLogs();
  }
  
  return true;
}

/**
 * 记录事件到 Firestore
 * @param {string} eventType 事件类型
 * @param {Object} eventData 事件数据
 * @param {string} collectionName 集合名称，默认为 'user_events'
 * @returns {Promise<Object>} 包含事件 ID 的对象，如果失败则包含错误
 */
export async function logEvent(eventType, eventData = {}, collectionName = 'user_events') {
  try {
    const userId = getUserId();
    const timestamp = new Date().toISOString();
    
    const eventDoc = {
      userId,
      eventType,
      clientTimestamp: timestamp,
      ...eventData
    };
    
    // 检查网络连接和 Firebase 可用性
    const isNetworkAvailable = isNetworkConnected();
    const isFirebaseReady = checkFirebaseAvailability();
    
    // 如果网络不可用或 Firebase 不可用，添加到待处理队列
    if (!isNetworkAvailable || !isFirebaseReady) {
      pendingLogs.push({
        collectionName,
        data: eventDoc,
        addedAt: timestamp
      });
      
      savePendingLogs();
      
      return { 
        success: false, 
        error: isNetworkAvailable ? 'Firebase unavailable' : 'Network unavailable', 
        localLogged: true,
        pendingSync: true
      };
    }
    
    // 实现重试逻辑
    const maxRetries = 3;
    const retryDelays = [1000, 3000, 5000]; // 重试延迟：1秒，3秒，5秒
    
    let lastError = null;
    let docRef = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const db = getFirebaseDb();
        
        // 添加调试信息
        //console.log(`尝试将日志写入到集合: ${collectionName}`);
        //console.log(`使用的数据库:`, db ? db.app.options.projectId : 'null');
        
        // 添加服务器时间戳
        eventDoc.timestamp = serverTimestamp();
        eventDoc.debug_clientTime = new Date().toISOString(); // 添加客户端时间以便调试
        
        // 添加重试信息（如果是重试）
        if (attempt > 0) {
          eventDoc.retryAttempt = attempt;
          eventDoc.previousError = lastError ? lastError.message : 'Unknown error';
        }
        
        docRef = await addDoc(collection(db, collectionName), eventDoc);
        //console.log(`Event logged successfully: ${eventType}, ID: ${docRef.id}${attempt > 0 ? ` (after ${attempt} retries)` : ''}`);
        //console.log(`数据已成功写入到集合 ${collectionName}`);
        //console.log(`文档路径: ${collectionName}/${docRef.id}`);
        //console.log(`项目 ID: ${db.app.options.projectId}`);
        
        // 成功写入，跳出重试循环
        break;
      } catch (error) {
        lastError = error;
        
        // 获取错误类型
        const errorMessage = error.message || '';
        const isRetryableError = 
          errorMessage.includes('ETIMEDOUT') || 
          errorMessage.includes('unavailable') || 
          errorMessage.includes('network') ||
          errorMessage.includes('ERR_CONNECTION_CLOSED') || 
          errorMessage.includes('Connection closed') ||
          error.code === 'unavailable' ||
          error.code === 'deadline-exceeded' ||
          error.code === 'resource-exhausted';
          
        // 如果是连接关闭错误，记录到控制台
        if (errorMessage.includes('ERR_CONNECTION_CLOSED') || errorMessage.includes('Connection closed')) {
          console.warn('检测到连接关闭错误，将尝试重试或切换到本地存储模式');
        }
        
        // 检查是否是权限错误
        const isPermissionError = 
          errorMessage.includes('permission-denied') || 
          errorMessage.includes('权限被拒绝') ||
          error.code === 'permission-denied';
        
        // 如果是权限错误，记录状态并跳过后续重试
        if (isPermissionError) {
          console.warn('检测到 Firestore 权限错误，将切换到本地存储模式');
          hasPermissionError = true;
          permissionErrorTime = Date.now();
          throw error;
        }
        
        // 如果是最后一次尝试或错误不可重试，抛出错误
        if (attempt === maxRetries || !isRetryableError) {
          throw error;
        }
        
        // 记录重试信息
        console.warn(`Retry attempt ${attempt + 1}/${maxRetries} for event ${eventType} due to: ${error.message}`);
        
        // 等待指定的延迟时间后重试
        await new Promise(resolve => setTimeout(resolve, retryDelays[attempt]));
      }
    }
    
    return { success: true, eventId: docRef.id };
  } catch (error) {
    // 获取用户友好的错误消息
    const friendlyError = getFirebaseErrorMessage(error);
    console.error(`Failed to log event ${eventType} after retries:`, friendlyError);
    
    // 添加到待处理队列
    const userId = getUserId();
    const eventDoc = {
      userId,
      eventType,
      clientTimestamp: new Date().toISOString(),
      ...eventData,
      failedAfterRetries: true
    };
    
    pendingLogs.push({
      collectionName,
      data: eventDoc,
      addedAt: new Date().toISOString(),
      error: error.message
    });
    
    savePendingLogs();
    
    return { 
      success: false, 
      error: error.toString(),
      friendlyError,
      localLogged: true,
      pendingSync: true
    };
  }
}

/**
 * Log user interaction with the application
 * @param {string} eventType - Type of event (e.g., 'page_view', 'button_click')
 * @param {Object} eventData - Additional data about the event
 */
export async function logUserEvent(eventType, eventData = {}) {
  return logEvent(eventType, eventData, 'user_events');
}

/**
 * Log system events
 * @param {string} eventType - Type of event (e.g., 'error', 'warning')
 * @param {Object} eventData - Additional data about the event
 */
export async function logSystemEvent(eventType, eventData = {}) {
  return logEvent(eventType, eventData, 'system_events');
}

/**
 * Log a conversation message
 * @param {string} roundId - ID of the conversation round
 * @param {string} role - Role of the message sender (user/system)
 * @param {string} message - Content of the message
 * @param {string} agentType - Type of agent (for agent messages only)
 */
export async function logConversation(roundId, role, message, agentType = null) {
  return logEvent('conversation', { roundId, role, message, agentType }, 'conversations');
}

/**
 * Log questionnaire responses
 * @param {string} questionnaireId - ID of the questionnaire
 * @param {Object} responses - User's responses to the questionnaire
 */
export async function logQuestionnaireResponses(questionnaireId, responses) {
  return logEvent('questionnaire_responses', { questionnaireId, responses }, 'questionnaire_responses');
}

/**
 * 获取待处理日志的数量
 * @returns {number} 待处理日志的数量
 */
export function getPendingLogsCount() {
  return pendingLogs.length;
}

/**
 * 启动定期日志同步
 */
let syncIntervalId = null;
function startLogSync() {
  // 防止多次启动
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
  }
  
  // 立即尝试同步一次
  setTimeout(() => syncPendingLogs(), 5000);
  
  // 设置定期同步
  syncIntervalId = setInterval(() => {
    syncPendingLogs();
  }, SYNC_INTERVAL_MS);
  
  console.log(`Log sync started, will sync every ${SYNC_INTERVAL_MS/1000} seconds`);
}

/**
 * 停止日志同步
 */
export function stopLogSync() {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
    console.log('Log sync stopped');
  }
}

/**
 * 手动触发待处理日志的同步
 * @returns {Promise<Object>} 同步结果
 */
export async function forceSyncPendingLogs() {
  if (pendingLogs.length === 0) {
    return { success: true, message: '没有待同步的日志' };
  }
  
  if (!isNetworkConnected()) {
    return { success: false, message: '网络不可用，无法同步' };
  }
  
  if (!isFirestoreAvailable()) {
    return { success: false, message: 'Firestore 不可用，无法同步' };
  }
  
  try {
    await syncPendingLogs();
    return { 
      success: true, 
      message: `成功同步日志，还有 ${pendingLogs.length} 条待同步` 
    };
  } catch (error) {
    return { 
      success: false, 
      message: '同步失败', 
      error: error.toString() 
    };
  }
}
