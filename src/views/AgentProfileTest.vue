<template>
  <div class="agent-profile-test">
    <div class="container">
      <h1>Agent Profile 测试页面</h1>
      
      <!-- 检查是否存在Agent Profiles -->
      <div class="status-section">
        <h2>状态检查</h2>
        <div class="status-item">
          <span class="label">Agent Profiles 存在:</span>
          <span :class="['status', hasProfiles ? 'success' : 'error']">
            {{ hasProfiles ? '是' : '否' }}
          </span>
        </div>
        <div class="status-item" v-if="hasProfiles">
          <span class="label">验证结果:</span>
          <span :class="['status', validation.valid ? 'success' : 'error']">
            {{ validation.valid ? '有效' : validation.error }}
          </span>
        </div>
        <div class="status-item" v-if="hasProfiles">
          <span class="label">生成时间:</span>
          <span class="status">{{ generatedAt }}</span>
        </div>
      </div>

      <!-- 用户基准信息 -->
      <div class="user-section" v-if="userProfile">
        <h2>用户基准信息</h2>
        <div class="profile-card user-card">
          <h3>用户 Profile</h3>
          <div class="profile-details">
            <div class="detail-item">
              <strong>性别:</strong> {{ formatGender(userProfile.profile.gender) }}
            </div>
            <div class="detail-item">
              <strong>年龄组:</strong> {{ formatAgeGroup(userProfile.profile.ageGroup) }}
            </div>
            <div class="detail-item">
              <strong>电影偏好:</strong> {{ userProfile.profile.favoriteMovieTypes.map(type => formatMovieType(type)).join(', ') }}
            </div>
            <div class="detail-item">
              <strong>观影频率:</strong> {{ formatFrequency(userProfile.profile.movieWatchingFrequency) }}
            </div>
            <div class="detail-item">
              <strong>好奇心:</strong> {{ formatPersonality(userProfile.profile.openness1) }}
            </div>
            <div class="detail-item">
              <strong>想象力:</strong> {{ formatPersonality(userProfile.profile.openness2) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Agent Profiles -->
      <div class="agents-section" v-if="agentProfiles">
        <h2>生成的 Agent Profiles</h2>
        <div class="agents-grid">
          <div 
            v-for="(agent, index) in agentProfiles.agents" 
            :key="agent.id"
            class="profile-card agent-card"
          >
            <h3>{{ agent.name }} ({{ agent.description }})</h3>
            <div class="strategy">
              <strong>策略:</strong> {{ agent.strategy }}
            </div>
            <div class="shared-attributes">
              <strong>共享属性:</strong> {{ agent.sharedAttributes.join(', ') }}
            </div>
            
            <div class="profile-details">
              <div class="detail-item">
                <strong>性别:</strong> 
                <span :class="getComparisonClass('gender', agent.profile.gender)">
                  {{ formatGender(agent.profile.gender) }}
                </span>
                <span class="comparison">
                  (用户: {{ formatGender(userProfile.profile.gender) }})
                </span>
              </div>
              
              <div class="detail-item">
                <strong>年龄组:</strong> 
                <span :class="getComparisonClass('ageGroup', agent.profile.ageGroup)">
                  {{ formatAgeGroup(agent.profile.ageGroup) }}
                </span>
                <span class="comparison">
                  (用户: {{ formatAgeGroup(userProfile.profile.ageGroup) }})
                </span>
              </div>
              
              <div class="detail-item">
                <strong>电影偏好:</strong> 
                <span :class="getComparisonClass('favoriteMovieTypes', agent.profile.favoriteMovieTypes)">
                  {{ agent.profile.favoriteMovieTypes.map(type => formatMovieType(type)).join(', ') }}
                </span>
                <div class="comparison">
                  (用户: {{ userProfile.profile.favoriteMovieTypes.map(type => formatMovieType(type)).join(', ') }})
                </div>
              </div>
              
              <div class="detail-item">
                <strong>观影频率:</strong> 
                <span :class="getComparisonClass('movieWatchingFrequency', agent.profile.movieWatchingFrequency)">
                  {{ formatFrequency(agent.profile.movieWatchingFrequency) }}
                </span>
                <span class="comparison">
                  (用户: {{ formatFrequency(userProfile.profile.movieWatchingFrequency) }})
                </span>
              </div>
              
              <div class="detail-item">
                <strong>好奇心:</strong> 
                <span :class="getComparisonClass('openness1', agent.profile.openness1)">
                  {{ formatPersonality(agent.profile.openness1) }}
                </span>
                <span class="comparison">
                  (用户: {{ formatPersonality(userProfile.profile.openness1) }})
                </span>
              </div>
              
              <div class="detail-item">
                <strong>想象力:</strong> 
                <span :class="getComparisonClass('openness2', agent.profile.openness2)">
                  {{ formatPersonality(agent.profile.openness2) }}
                </span>
                <span class="comparison">
                  (用户: {{ formatPersonality(userProfile.profile.openness2) }})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="actions">
        <button @click="refreshData" class="btn btn-primary">刷新数据</button>
        <button @click="clearProfiles" class="btn btn-danger">清除 Profiles</button>
        <button @click="goToQuestionnaire" class="btn btn-secondary">返回问卷</button>
      </div>

      <!-- 原始数据展示 -->
      <div class="raw-data" v-if="agentProfiles">
        <h2>原始数据 (JSON)</h2>
        <pre>{{ JSON.stringify(agentProfiles, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script>
import { 
  getAgentProfiles, 
  getUserProfile, 
  hasAgentProfiles, 
  validateAgentProfiles, 
  clearAgentProfiles 
} from '../services/agentProfileService';

export default {
  name: 'AgentProfileTest',
  data() {
    return {
      agentProfiles: null,
      userProfile: null,
      hasProfiles: false,
      validation: { valid: false },
      generatedAt: ''
    };
  },
  mounted() {
    this.loadData();
  },
  methods: {
    loadData() {
      this.hasProfiles = hasAgentProfiles();
      
      if (this.hasProfiles) {
        this.agentProfiles = getAgentProfiles();
        this.userProfile = getUserProfile();
        this.validation = validateAgentProfiles();
        this.generatedAt = this.agentProfiles ? 
          new Date(this.agentProfiles.generatedAt).toLocaleString() : '';
      }
    },
    
    refreshData() {
      this.loadData();
    },
    
    clearProfiles() {
      if (confirm('确定要清除所有 Agent Profiles 吗？')) {
        clearAgentProfiles();
        this.loadData();
      }
    },
    
    goToQuestionnaire() {
      this.$router.push({ name: 'InitialQuestionnaire' });
    },
    
    // 格式化方法
    formatGender(gender) {
      const genderMap = {
        'male': 'Male',
        'female': 'Female', 
        'other': 'Other'
      };
      return genderMap[gender] || gender;
    },
    
    formatAgeGroup(ageGroup) {
      const ageMap = {
        'under-18': 'Under 18',
        '18-25': '18-25',
        '26-30': '26-30', 
        '31-40': '31-40',
        '41-50': '41-50',
        '51-60': '51-60',
        'over-60': 'Over 60'
      };
      return ageMap[ageGroup] || ageGroup;
    },
    
    formatMovieType(type) {
      const typeMap = {
        'action': 'Action',
        'comedy': 'Comedy',
        'drama': 'Drama',
        'sci-fi': 'Science Fiction',
        'fantasy': 'Fantasy',
        'horror': 'Horror',
        'romance': 'Romance',
        'thriller': 'Thriller',
        'animation': 'Animation',
        'documentary': 'Documentary',
        'comics': 'Comics/Superhero'
      };
      return typeMap[type] || type;
    },
    
    formatFrequency(frequency) {
      const frequencyMap = {
        'daily': 'Daily',
        'several-times-week': 'Several times a week',
        'weekly': 'Weekly',
        'monthly': 'Monthly',
        'rarely': 'Rarely',
        'almost-never': 'Almost never'
      };
      return frequencyMap[frequency] || frequency;
    },
    
    formatPersonality(value) {
      const personalityMap = {
        'strongly-disagree': 'Strongly Disagree',
        'disagree': 'Disagree',
        'neutral': 'Neutral',
        'agree': 'Agree',
        'strongly-agree': 'Strongly Agree'
      };
      return personalityMap[value] || value;
    },
    
    // 比较用户和Agent的属性，返回CSS类
    getComparisonClass(attribute, agentValue) {
      if (!this.userProfile) return '';
      
      const userValue = this.userProfile.profile[attribute];
      
      if (attribute === 'favoriteMovieTypes') {
        // 对于数组，检查是否有重叠
        const hasOverlap = agentValue.some(type => userValue.includes(type));
        return hasOverlap ? 'same' : 'different';
      } else {
        // 对于其他属性，直接比较
        return agentValue === userValue ? 'same' : 'different';
      }
    }
  }
};
</script>

<style scoped>
.agent-profile-test {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.container {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h1 {
  color: #333;
  margin-bottom: 2rem;
  text-align: center;
}

h2 {
  color: #555;
  margin: 2rem 0 1rem 0;
  border-bottom: 2px solid #eee;
  padding-bottom: 0.5rem;
}

.status-section {
  margin-bottom: 2rem;
}

.status-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.label {
  font-weight: bold;
  margin-right: 1rem;
  min-width: 120px;
}

.status {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: bold;
}

.status.success {
  background-color: #d4edda;
  color: #155724;
}

.status.error {
  background-color: #f8d7da;
  color: #721c24;
}

.profile-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.user-card {
  background-color: #f8f9fa;
  border-left: 4px solid #007bff;
}

.agent-card {
  background-color: #fff;
  border-left: 4px solid #28a745;
}

.agents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1rem;
}

.strategy {
  font-style: italic;
  color: #666;
  margin-bottom: 1rem;
}

.shared-attributes {
  background-color: #e9ecef;
  padding: 0.5rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.profile-details {
  margin-top: 1rem;
}

.detail-item {
  margin-bottom: 0.75rem;
  line-height: 1.5;
}

.comparison {
  font-size: 0.85rem;
  color: #666;
  margin-left: 0.5rem;
}

.same {
  background-color: #d4edda;
  color: #155724;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  font-weight: bold;
}

.different {
  background-color: #f8d7da;
  color: #721c24;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  font-weight: bold;
}

.actions {
  margin: 2rem 0;
  text-align: center;
}

.btn {
  padding: 0.75rem 1.5rem;
  margin: 0 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.raw-data {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #eee;
}

.raw-data pre {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.85rem;
  max-height: 400px;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .agents-grid {
    grid-template-columns: 1fr;
  }
  
  .agent-profile-test {
    padding: 1rem;
  }
  
  .container {
    padding: 1rem;
  }
}
</style>
