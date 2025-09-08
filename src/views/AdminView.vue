<template>
  <div class="admin-container">
    <div class="card admin-card">
      <h2 class="card-title">数据库管理视图</h2>
      <p class="admin-description">
        此页面显示 Firebase 数据库中存储的数据。
      </p>
      
      <div class="data-section">
        <h3>用户事件数据</h3>
        <button @click="fetchUserEvents" class="btn">加载用户事件数据</button>
        <div v-if="loading.userEvents" class="loading">加载中...</div>
        <div v-else-if="data.userEvents.length === 0 && !loading.userEvents" class="no-data">
          没有用户事件数据
        </div>
        <div v-else class="data-table">
          <table>
            <thead>
              <tr>
                <th>用户ID</th>
                <th>事件类型</th>
                <th>时间戳</th>
                <th>详情</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(event, index) in data.userEvents" :key="index">
                <td>{{ event.userId }}</td>
                <td>{{ event.eventType }}</td>
                <td>{{ formatTimestamp(event.clientTimestamp) }}</td>
                <td>
                  <button @click="showDetails(event)" class="btn-small">查看详情</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="data-section">
        <h3>问卷回答数据</h3>
        <button @click="fetchQuestionnaireResponses" class="btn">加载问卷数据</button>
        <div v-if="loading.questionnaireResponses" class="loading">加载中...</div>
        <div v-else-if="data.questionnaireResponses.length === 0 && !loading.questionnaireResponses" class="no-data">
          没有问卷回答数据
        </div>
        <div v-else class="data-table">
          <table>
            <thead>
              <tr>
                <th>用户ID</th>
                <th>问卷类型</th>
                <th>时间戳</th>
                <th>详情</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(response, index) in data.questionnaireResponses" :key="index">
                <td>{{ response.userId }}</td>
                <td>{{ response.questionnaireId }}</td>
                <td>{{ formatTimestamp(response.clientTimestamp) }}</td>
                <td>
                  <button @click="showDetails(response)" class="btn-small">查看详情</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="data-section">
        <h3>对话数据</h3>
        <button @click="fetchConversations" class="btn">加载对话数据</button>
        <div v-if="loading.conversations" class="loading">加载中...</div>
        <div v-else-if="data.conversations.length === 0 && !loading.conversations" class="no-data">
          没有对话数据
        </div>
        <div v-else class="data-table">
          <table>
            <thead>
              <tr>
                <th>用户ID</th>
                <th>轮次</th>
                <th>角色</th>
                <th>时间戳</th>
                <th>消息内容</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(message, index) in data.conversations" :key="index">
                <td>{{ message.userId }}</td>
                <td>{{ message.roundId }}</td>
                <td>{{ message.role }}</td>
                <td>{{ formatTimestamp(message.clientTimestamp) }}</td>
                <td>{{ truncateText(message.message, 50) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div v-if="selectedItem" class="details-modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>详细信息</h3>
            <button @click="selectedItem = null" class="close-btn">&times;</button>
          </div>
          <div class="modal-body">
            <pre>{{ JSON.stringify(selectedItem, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getFirebaseDb } from '../services/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

export default {
  name: 'AdminView',
  data() {
    return {
      data: {
        userEvents: [],
        questionnaireResponses: [],
        conversations: [],
        systemEvents: []
      },
      loading: {
        userEvents: false,
        questionnaireResponses: false,
        conversations: false,
        systemEvents: false
      },
      selectedItem: null
    };
  },
  methods: {
    async fetchUserEvents() {
      this.loading.userEvents = true;
      try {
        const db = getFirebaseDb();
        const eventsRef = collection(db, 'user_events');
        const q = query(eventsRef, orderBy('clientTimestamp', 'desc'), limit(50));
        const querySnapshot = await getDocs(q);
        
        this.data.userEvents = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.error('Error fetching user events:', error);
        alert('获取用户事件数据失败');
      } finally {
        this.loading.userEvents = false;
      }
    },
    
    async fetchQuestionnaireResponses() {
      this.loading.questionnaireResponses = true;
      try {
        const db = getFirebaseDb();
        const responsesRef = collection(db, 'questionnaire_responses');
        const q = query(responsesRef, orderBy('clientTimestamp', 'desc'), limit(50));
        const querySnapshot = await getDocs(q);
        
        this.data.questionnaireResponses = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.error('Error fetching questionnaire responses:', error);
        alert('获取问卷回答数据失败');
      } finally {
        this.loading.questionnaireResponses = false;
      }
    },
    
    async fetchConversations() {
      this.loading.conversations = true;
      try {
        const db = getFirebaseDb();
        const conversationsRef = collection(db, 'conversations');
        const q = query(conversationsRef, orderBy('clientTimestamp', 'desc'), limit(100));
        const querySnapshot = await getDocs(q);
        
        this.data.conversations = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.error('Error fetching conversations:', error);
        alert('获取对话数据失败');
      } finally {
        this.loading.conversations = false;
      }
    },
    
    formatTimestamp(timestamp) {
      if (!timestamp) return 'N/A';
      
      try {
        const date = new Date(timestamp);
        return date.toLocaleString();
      } catch (e) {
        return timestamp;
      }
    },
    
    truncateText(text, maxLength) {
      if (!text) return '';
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    },
    
    showDetails(item) {
      this.selectedItem = item;
    }
  }
};
</script>

<style scoped>
.admin-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 0;
}

.admin-card {
  padding: 2rem;
}

.admin-description {
  margin-bottom: 2rem;
}

.data-section {
  margin-bottom: 3rem;
  position: relative;
}

.data-section h3 {
  margin-bottom: 1rem;
  color: var(--primary-color);
}

.loading {
  padding: 1rem;
  text-align: center;
  font-style: italic;
  color: var(--secondary-color);
}

.no-data {
  padding: 1rem;
  text-align: center;
  font-style: italic;
  color: var(--secondary-color);
  background-color: #f8f8f8;
  border-radius: var(--border-radius);
}

.data-table {
  margin-top: 1rem;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

th, td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--light-gray);
}

th {
  background-color: #f0f0f0;
  font-weight: 600;
}

tr:hover {
  background-color: #f8f8f8;
}

.btn {
  padding: 0.5rem 1rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  margin-bottom: 1rem;
}

.btn:hover {
  background-color: #3a5a8c;
}

.btn-small {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
}

.btn-small:hover {
  background-color: #3a5a8c;
}

.details-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: var(--border-radius);
  width: 80%;
  max-width: 800px;
  max-height: 80vh;
  overflow: auto;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--light-gray);
}

.modal-body {
  padding: 1rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--secondary-color);
}

pre {
  white-space: pre-wrap;
  word-break: break-all;
  background-color: #f8f8f8;
  padding: 1rem;
  border-radius: var(--border-radius);
  overflow: auto;
}

@media (max-width: 768px) {
  .admin-card {
    padding: 1rem;
  }
  
  th, td {
    padding: 0.5rem;
    font-size: 0.9rem;
  }
}
</style>
