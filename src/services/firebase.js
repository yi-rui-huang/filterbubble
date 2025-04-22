// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getFirestore, 
  connectFirestoreEmulator, 
  enableIndexedDbPersistence,
  enableMultiTabIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMjArPuGb61Sq2g9KhoW0_YqibywsJUx4",
  authDomain: "filterbubble-260ea.firebaseapp.com",
  projectId: "filterbubble-260ea",
  storageBucket: "filterbubble-260ea.appspot.com",
  messagingSenderId: "377672244422",
  appId: "1:377672244422:web:59a7987c23d06e161a8bc7",
  measurementId: "G-R2E669RD7P"
};

let app;
let analytics;
let db;
let storage;
let storageError = null;
let firestoreError = null;

// 检查是否在本地开发环境
const isLocalDevelopment = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1';

// 是否使用本地 Firestore 模拟器
const useFirestoreEmulator = false; // 设置为 true 可以使用本地模拟器

// 网络状态监控
let networkStatus = {
  isOnline: true,
  lastOnlineTime: Date.now(),
  lastOfflineTime: null,
  connectionAttempts: 0,
  maxConnectionAttempts: 5,
  connectionBackoff: 5000, // 初始重试间隔 (5 秒)
  maxConnectionBackoff: 60000 // 最大重试间隔 (1 分钟)
};

// 初始化网络状态监听
if (typeof window !== 'undefined') {
  // 初始化当前状态
  networkStatus.isOnline = navigator.onLine;
  
  // 添加网络状态变化事件监听
  window.addEventListener('online', () => updateNetworkStatus(true));
  window.addEventListener('offline', () => updateNetworkStatus(false));
}

// 更新网络状态
function updateNetworkStatus(isOnline) {
  const now = Date.now();
  
  if (isOnline) {
    networkStatus.isOnline = true;
    networkStatus.lastOnlineTime = now;
    networkStatus.connectionAttempts = 0; // 重置连接尝试次数
    console.log('网络连接已恢复');
  } else {
    networkStatus.isOnline = false;
    networkStatus.lastOfflineTime = now;
    console.log('网络连接已断开');
  }
}

export function initializeFirebase() {
  try {
    // Initialize Firebase
    app = initializeApp(firebaseConfig);
    
    // Initialize Analytics with error handling
    try {
      analytics = getAnalytics(app);
    } catch (error) {
      console.warn('Firebase Analytics initialization failed:', error);
      analytics = null;
    }
    
    // Initialize Firestore with enhanced offline support
    try {
      // 使用增强的离线持久化初始化 Firestore
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          cacheSizeBytes: CACHE_SIZE_UNLIMITED,
          tabManager: persistentMultipleTabManager()
        })
      });
      
      // 如果使用本地模拟器
      if (useFirestoreEmulator && isLocalDevelopment) {
        connectFirestoreEmulator(db, 'localhost', 8080);
        console.log('Connected to Firestore emulator');
      }
      
      console.log('Firestore initialized with enhanced offline support');
    } catch (error) {
      console.error('Enhanced Firestore initialization failed, falling back to standard initialization:', error);
      
      try {
        // 回退到标准初始化
        db = getFirestore(app);
        
        // 尝试启用离线持久化
        if (typeof window !== 'undefined') {
          enableIndexedDbPersistence(db)
            .then(() => {
              console.log('Firestore offline persistence enabled');
            })
            .catch((err) => {
              if (err.code === 'failed-precondition') {
                console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time');
              } else if (err.code === 'unimplemented') {
                console.warn('The current browser does not support all of the features required to enable persistence');
              } else {
                console.warn('Failed to enable Firestore offline persistence:', err);
              }
            });
        }
      } catch (fallbackError) {
        console.error('Firestore initialization completely failed:', fallbackError);
        firestoreError = fallbackError;
        db = null;
      }
    }
    
    // Initialize Storage with error handling
    try {
      storage = getStorage(app);
      console.log('Firebase Storage initialized successfully');
    } catch (error) {
      console.error('Firebase Storage initialization failed:', error);
      storage = null;
      storageError = error;
    }
    
    console.log('Firebase initialized successfully');
    return { app, analytics, db, storage };
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    throw error;
  }
}

export function getFirebaseApp() {
  return app;
}

export function getFirebaseAnalytics() {
  return analytics;
}

export function getFirebaseDb() {
  return db;
}

export function getFirebaseDbError() {
  return firestoreError;
}

export function getFirebaseStorage() {
  return storage;
}

export function getFirebaseStorageError() {
  return storageError;
}

// 在本地开发环境中模拟 Storage 操作
export function isStorageAvailable() {
  return storage !== null && !isLocalDevelopment;
}

// 用于在本地开发环境中模拟 Storage 操作的辅助函数
export function mockStorageOperation(operation) {
  if (isLocalDevelopment) {
    console.log(`[DEV] Mocked Storage operation: ${operation}`);
    return Promise.resolve({ success: true, mocked: true });
  }
  
  return null; // 表示不是模拟操作，应该使用真实的 Storage
}

// 检查 Firestore 是否可用
export function isFirestoreAvailable() {
  return db !== null;
}

// 检查网络连接状态
export function isNetworkConnected() {
  // 浏览器环境下使用 navigator.onLine
  if (typeof navigator !== 'undefined') {
    return navigator.onLine;
  }
  // 非浏览器环境下使用保存的状态
  return networkStatus.isOnline;
}

// 获取 Firebase 错误的用户友好消息
export function getFirebaseErrorMessage(error) {
  if (!error) return null;
  
  const errorCode = error.code || '';
  
  // 常见的 Firebase 错误代码映射到用户友好的消息
  const errorMessages = {
    'permission-denied': '权限被拒绝。请检查 Firestore 安全规则。',
    'unavailable': '服务不可用。请检查您的网络连接。',
    'not-found': '请求的文档或集合不存在。',
    'already-exists': '尝试创建的文档已经存在。',
    'resource-exhausted': '已超出 Firebase 配额或限制。',
    'failed-precondition': '操作被拒绝，可能是因为服务未准备好或先决条件未满足。',
    'aborted': '操作被中止，通常是由于并发修改。',
    'out-of-range': '操作尝试超出有效范围。',
    'unimplemented': '操作未实现或不受支持。',
    'internal': '内部错误。这通常表示系统错误。',
    'unavailable': '服务不可用。通常表示服务器已关闭或网络连接问题。',
    'data-loss': '不可恢复的数据丢失或损坏。',
    'unauthenticated': '请求未通过身份验证。',
    '14': '网络连接问题。无法连接到 Firebase 服务器，请检查您的网络连接。'
  };
  
  // 检查错误消息中是否包含网络相关错误
  if (error.message) {
    if (error.message.includes('ETIMEDOUT')) {
      return '连接超时。无法连接到 Firebase 服务器，可能是由于网络问题或防火墙设置。';
    }
    if (error.message.includes('ERR_CONNECTION_CLOSED') || error.message.includes('Connection closed')) {
      return '连接已关闭。与 Firebase 服务器的连接被中断，可能是由于网络问题或防火墙限制。';
    }
    if (error.message.includes('network error') || error.message.includes('Network Error')) {
      return '网络错误。无法连接到 Firebase 服务器，请检查您的网络连接。';
    }
  }
  
  // 返回映射的错误消息或默认消息
  return errorMessages[errorCode] || `发生错误: ${error.message || error}`;
}
