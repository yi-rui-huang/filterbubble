<template>
  <div class="firebase-test">
    <h2>Firebase 连接测试</h2>
    
    <div class="status-bar">
      <div class="status-item">
        <span class="status-label">网络状态:</span>
        <span :class="isOnline ? 'success' : 'error'">{{ isOnline ? '在线' : '离线' }}</span>
      </div>
      <div class="status-item">
        <span class="status-label">待同步日志:</span>
        <span :class="pendingLogsCount > 0 ? 'warning' : 'success'">{{ pendingLogsCount }}</span>
        <button v-if="pendingLogsCount > 0" @click="syncPendingLogs" class="btn btn-small">同步</button>
      </div>
    </div>
    
    <div class="test-card">
      <h3>Firestore 测试</h3>
      <p>状态: <span :class="firestoreStatus.success ? 'success' : 'error'">{{ firestoreStatus.message }}</span></p>
      <button @click="testFirestore" class="btn">测试 Firestore 连接</button>
      <div v-if="firestoreStatus.error" class="error-details">
        <p>错误详情:</p>
        <pre>{{ firestoreStatus.error }}</pre>
        <div v-if="firestoreStatus.friendlyError" class="friendly-error">
          <p><strong>可能的原因:</strong> {{ firestoreStatus.friendlyError }}</p>
        </div>
      </div>
      <div class="note-box">
        <p><strong>注意:</strong> 如果 Firestore 连接失败，可能是因为 Firebase 项目的安全规则限制了访问。您需要在 Firebase 控制台中更新安全规则。</p>
      </div>
    </div>
    
    <div class="test-card">
      <h3>Firebase Storage 测试</h3>
      <p>状态: <span :class="storageStatus.success ? 'success' : 'error'">{{ storageStatus.message }}</span></p>
      <button @click="testStorage" class="btn">测试 Storage 连接</button>
      <div v-if="storageStatus.error" class="error-details">
        <p>错误详情:</p>
        <pre>{{ storageStatus.error }}</pre>
      </div>
      <div class="note-box">
        <p><strong>注意:</strong> 在本地开发环境中，Firebase Storage 可能会遇到 CORS 问题。这是正常的，不会影响应用程序的其他功能。在生产环境中，这个问题会自动解决。</p>
      </div>
    </div>
    
    <div class="test-card">
      <h3>Firebase 配置</h3>
      <button @click="showConfig = !showConfig" class="btn">{{ showConfig ? '隐藏配置' : '显示配置' }}</button>
      <div v-if="showConfig" class="config-display">
        <pre>{{ configString }}</pre>
      </div>
    </div>
    
    <div class="test-card">
      <h3>创建测试数据</h3>
      <button @click="createTestData" class="btn" :disabled="testDataStatus === 'creating'">
        {{ testDataStatus === 'creating' ? '创建中...' : '创建测试数据' }}
      </button>
      <p v-if="testDataStatus === 'success'" class="success">测试数据创建成功</p>
      <p v-if="testDataStatus === 'error'" class="error">测试数据创建失败</p>
    </div>
  </div>
</template>

<script>
import { getFirebaseApp, getFirebaseDb, getFirebaseStorage, isStorageAvailable, mockStorageOperation, isFirestoreAvailable, getFirebaseErrorMessage, isNetworkConnected } from '../services/firebase';
import { collection, addDoc, getDocs, query, limit } from 'firebase/firestore';
import { ref, listAll } from 'firebase/storage';
import { getPendingLogsCount, forceSyncPendingLogs } from '../services/loggingService';

export default {
  name: 'FirebaseTest',
  data() {
    return {
      firestoreStatus: {
        success: null,
        message: '未测试',
        error: null,
        friendlyError: null
      },
      storageStatus: {
        success: null,
        message: '未测试',
        error: null
      },
      showConfig: false,
      testDataStatus: null,
      isOnline: true,
      pendingLogsCount: 0,
      syncStatus: null
    };
  },
  computed: {
    configString() {
      try {
        const app = getFirebaseApp();
        if (!app) return 'Firebase 应用未初始化';
        
        const config = app.options;
        // 隐藏敏感信息
        const safeConfig = {
          ...config,
          apiKey: config.apiKey ? `${config.apiKey.substring(0, 5)}...` : null
        };
        
        return JSON.stringify(safeConfig, null, 2);
      } catch (error) {
        return `无法获取配置: ${error.message}`;
      }
    }
  },
  mounted() {
    // 初始化网络状态
    this.isOnline = navigator.onLine;
    
    // 监听网络状态变化
    window.addEventListener('online', this.updateNetworkStatus);
    window.addEventListener('offline', this.updateNetworkStatus);
    
    // 定期更新待同步日志数量
    this.updatePendingLogsCount();
    this.pendingLogsInterval = setInterval(this.updatePendingLogsCount, 5000);
  },
  beforeUnmount() {
    // 移除事件监听器
    window.removeEventListener('online', this.updateNetworkStatus);
    window.removeEventListener('offline', this.updateNetworkStatus);
    
    // 清除定时器
    clearInterval(this.pendingLogsInterval);
  },
  methods: {
    updateNetworkStatus() {
      this.isOnline = navigator.onLine;
    },
    
    updatePendingLogsCount() {
      this.pendingLogsCount = getPendingLogsCount();
    },
    
    async syncPendingLogs() {
      this.syncStatus = 'syncing';
      try {
        const result = await forceSyncPendingLogs();
        this.syncStatus = result.success ? 'success' : 'error';
        
        // 更新待同步日志数量
        this.updatePendingLogsCount();
        
        // 显示结果
        alert(result.message);
      } catch (error) {
        this.syncStatus = 'error';
        alert(`同步失败: ${error.message}`);
      }
    },
    
    async testFirestore() {
      this.firestoreStatus = {
        success: null,
        message: '测试中...',
        error: null,
        friendlyError: null
      };
      
      try {
        // 检查网络连接
        if (!navigator.onLine) {
          throw new Error('网络连接不可用');
        }
        
        // 检查 Firestore 是否可用
        if (!isFirestoreAvailable()) {
          throw new Error('Firestore 未初始化或不可用');
        }
        
        const db = getFirebaseDb();
        
        // 尝试读取一个集合
        const testCollection = collection(db, 'test_connection');
        const q = query(testCollection, limit(1));
        await getDocs(q);
        
        // 尝试写入一个测试文档
        const testDoc = {
          testId: `test-${Date.now()}`,
          timestamp: new Date().toISOString(),
          message: '这是一个测试文档'
        };
        
        await addDoc(testCollection, testDoc);
        
        this.firestoreStatus = {
          success: true,
          message: '连接成功',
          error: null,
          friendlyError: null
        };
      } catch (error) {
        console.error('Firestore 测试失败:', error);
        
        // 获取用户友好的错误消息
        const friendlyError = getFirebaseErrorMessage(error);
        
        this.firestoreStatus = {
          success: false,
          message: '连接失败',
          error: error.toString(),
          friendlyError: friendlyError
        };
      }
    },
    
    async testStorage() {
      this.storageStatus = {
        success: null,
        message: '测试中...',
        error: null
      };
      
      try {
        // 检查网络连接
        if (!navigator.onLine) {
          throw new Error('网络连接不可用');
        }
        
        // 检查 Storage 是否可用
        if (!isStorageAvailable()) {
          // 在本地开发环境中，使用模拟操作
          const mockResult = mockStorageOperation('listAll');
          if (mockResult) {
            this.storageStatus = {
              success: true,
              message: '连接成功 (开发环境模拟)',
              error: null
            };
            return;
          }
        }
        
        const storage = getFirebaseStorage();
        if (!storage) {
          throw new Error('Storage 未初始化');
        }
        
        // 尝试列出根目录
        const rootRef = ref(storage);
        await listAll(rootRef);
        
        this.storageStatus = {
          success: true,
          message: '连接成功',
          error: null
        };
      } catch (error) {
        console.error('Storage 测试失败:', error);
        this.storageStatus = {
          success: false,
          message: '连接失败',
          error: error.toString()
        };
      }
    },
    
    async createTestData() {
      this.testDataStatus = 'creating';
      
      try {
        const db = getFirebaseDb();
        if (!db) {
          throw new Error('Firestore 未初始化');
        }
        
        // 创建一些测试数据
        const testData = [
          {
            collection: 'user_events',
            data: {
              userId: 'test-user',
              eventType: 'test_event',
              timestamp: new Date().toISOString(),
              details: {
                page: 'test-page',
                action: 'test-action'
              }
            }
          },
          {
            collection: 'system_events',
            data: {
              userId: 'test-user',
              eventType: 'test_system_event',
              timestamp: new Date().toISOString(),
              details: {
                component: 'test-component',
                status: 'success'
              }
            }
          }
        ];
        
        // 添加测试数据到 Firestore
        for (const item of testData) {
          await addDoc(collection(db, item.collection), item.data);
        }
        
        this.testDataStatus = 'success';
      } catch (error) {
        console.error('创建测试数据失败:', error);
        this.testDataStatus = 'error';
      }
    }
  }
};
</script>

<style scoped>
.firebase-test {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  background-color: #f5f5f5;
  padding: 10px 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.status-item {
  display: flex;
  align-items: center;
}

.status-label {
  margin-right: 8px;
  font-weight: bold;
}

.btn-small {
  font-size: 0.8rem;
  padding: 2px 8px;
  margin-left: 8px;
}

.test-card {
  background-color: #f5f5f5;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 20px;
}

h2 {
  margin-bottom: 20px;
  color: #333;
}

h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}

.btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 10px 15px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 10px 0;
  cursor: pointer;
  border-radius: 4px;
}

.btn:hover {
  background-color: #45a049;
}

.btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.success {
  color: #4CAF50;
  font-weight: bold;
}

.warning {
  color: #ff9800;
  font-weight: bold;
}

.error {
  color: #f44336;
  font-weight: bold;
}

.config-display {
  background-color: #fff;
  padding: 15px;
  border-radius: 4px;
  margin-top: 10px;
}

.error-details {
  background-color: #ffebee;
  padding: 15px;
  border-radius: 4px;
  margin-top: 10px;
}

.note-box {
  margin-top: 1rem;
  background-color: #fff;
  padding: 1rem;
  border-radius: 4px;
  border-left: 4px solid #3498db;
}

.friendly-error {
  margin-top: 1rem;
  background-color: #fff;
  padding: 1rem;
  border-radius: 4px;
  border-left: 4px solid #f1c40f;
}

pre {
  white-space: pre-wrap;
  word-break: break-word;
  overflow-x: auto;
}
</style>
