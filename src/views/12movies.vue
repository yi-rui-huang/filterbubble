<template>
  <div class="movies-test-page">
    <div class="container">
      <h1>12movies.js 测试页面</h1>
      
      <!-- 用户信息显示 -->
      <div class="user-info" v-if="userProfile">
        <h3>用户画像信息</h3>
        <p><strong>偏好类型:</strong> {{ userProfile.in_profile_genres?.join(', ') || '未设置' }}</p>
        <p><strong>用户ID:</strong> {{ userId }}</p>
        <p><strong>Profile ID:</strong> {{ profileId }}</p>
      </div>

      <!-- 场景输入区域 -->
      <div class="scenario-input">
        <h3>输入场景描述</h3>
        <div class="input-group">
          <textarea 
            v-model="scenarioQuery" 
            placeholder="请输入场景描述，例如：和小孩看、家庭聚会、浪漫约会等..."
            rows="3"
            :disabled="isLoading"
          ></textarea>
          <button 
            @click="testMovieSelection" 
            :disabled="!scenarioQuery.trim() || isLoading"
            class="test-button"
          >
            {{ isLoading ? '处理中...' : '测试电影筛选' }}
          </button>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading">
        <div class="spinner"></div>
        <p>正在筛选电影，请稍候...</p>
      </div>

      <!-- 错误信息 -->
      <div v-if="errorMessage" class="error">
        <h3>错误信息</h3>
        <p>{{ errorMessage }}</p>
      </div>

      <!-- 电影结果展示 -->
      <div v-if="selectedMovies.length > 0" class="movies-result">
        <h3>筛选结果 ({{ selectedMovies.length }} 部电影)</h3>
        <div class="movies-grid">
          <div 
            v-for="(movie, index) in selectedMovies" 
            :key="movie.tconst"
            class="movie-card"
          >
            <div class="movie-number">{{ index + 1 }}</div>
            <div class="movie-info">
              <h4>{{ movie.primaryTitle }}</h4>
              <p class="movie-details">
                <span class="year">{{ movie.startYear }}</span>
                <span class="genres">{{ movie.genres }}</span>
              </p>
              <p class="movie-id">ID: {{ movie.tconst }}</p>
              <p class="runtime" v-if="movie.runtimeMinutes && movie.runtimeMinutes !== '\\N'">
                时长: {{ movie.runtimeMinutes }} 分钟
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 调试信息 -->
      <div v-if="debugInfo" class="debug-info">
        <h3>调试信息</h3>
        <pre>{{ debugInfo }}</pre>
      </div>

      <!-- 导航按钮 -->
      <div class="navigation-buttons">
        <button @click="goToInitialQuestionnaire" class="nav-button">
          返回问卷页面
        </button>
        <button @click="goToFirstRound" class="nav-button">
          进入第一轮对话
        </button>
        <button @click="goHome" class="nav-button secondary">
          返回首页
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { selectMoviesForExperiment } from '../utils/12movies.js';

export default {
  name: 'MoviesTest',
  data() {
    return {
      scenarioQuery: '',
      selectedMovies: [],
      userProfile: null,
      userId: null,
      profileId: null,
      isLoading: false,
      errorMessage: '',
      debugInfo: '',
      movieDataset: []
    };
  },
  async mounted() {
    await this.loadUserProfile();
    await this.loadMovieDataset();
  },
  methods: {
    loadUserProfile() {
      try {
        console.log('=== 开始调试用户画像加载 ===');
        
        // 检查所有localStorage键
        console.log('localStorage中的所有键:', Object.keys(localStorage));
        
        // 从localStorage获取用户信息 - 使用正确的键名
        this.userId = localStorage.getItem('fb_user_id');
        this.profileId = localStorage.getItem('fb_profile_id');
        
        console.log('fb_user_id:', this.userId);
        console.log('fb_profile_id:', this.profileId);
        
        // 检查所有可能的用户数据键
        const possibleKeys = ['fb_user_input', 'userProfile', 'user_input', 'profileData'];
        possibleKeys.forEach(key => {
          const data = localStorage.getItem(key);
          console.log(`${key}:`, data ? JSON.parse(data) : null);
        });
        
        // 尝试从fb_user_input获取用户画像数据
        const userInputData = localStorage.getItem('fb_user_input');
        if (userInputData) {
          console.log('找到fb_user_input数据');
          const userInput = JSON.parse(userInputData);
          console.log('解析后的用户输入数据:', userInput);
          
          // 从interests.liked_genres提取电影偏好
          if (userInput.interests && userInput.interests.liked_genres && userInput.interests.liked_genres.length > 0) {
            this.userProfile = {
              in_profile_genres: userInput.interests.liked_genres
            };
            console.log('成功从interests.liked_genres提取用户画像:', this.userProfile);
          } else {
            console.log('未找到interests.liked_genres数据');
            console.log('完整数据结构:', JSON.stringify(userInput, null, 2));
          }
        } else {
          console.log('未找到fb_user_input数据');
        }

        if (!this.userProfile || !this.userProfile.in_profile_genres) {
          // 如果没有用户画像，创建一个默认的用于测试
          this.userProfile = {
            in_profile_genres: ['Comedy', 'Romance']
          };
          console.warn('未找到用户画像，使用默认测试画像');
        } else {
          console.log('成功加载用户画像:', this.userProfile);
        }
        
        console.log('=== 用户画像加载调试结束 ===');
      } catch (error) {
        console.error('加载用户画像失败:', error);
        this.errorMessage = '加载用户画像失败: ' + error.message;
      }
    },

    async loadMovieDataset() {
      try {
        console.log('开始加载电影数据集...');
        const response = await fetch('/src/data/title.basics.movie.filtered.tsv');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const tsvText = await response.text();
        this.movieDataset = this.parseTSV(tsvText);
        console.log(`电影数据集加载完成，共 ${this.movieDataset.length} 部电影`);
      } catch (error) {
        console.error('加载电影数据集失败:', error);
        this.errorMessage = '加载电影数据集失败: ' + error.message;
        
        // 创建一些测试数据
        this.movieDataset = this.createTestMovieData();
        console.log('使用测试电影数据');
      }
    },

    parseTSV(tsvText) {
      const lines = tsvText.split('\n');
      const headers = lines[0].split('\t').map(header => header.trim().replace(/\r/g, ''));
      const movies = [];

      console.log('TSV解析调试信息:');
      console.log('Headers:', headers);
      console.log('Headers数量:', headers.length);

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split('\t');
        const movie = {};
        
        // 调试第一行数据
        if (i === 1) {
          console.log('第一行数据values:', values);
          console.log('Values数量:', values.length);
          console.log('Headers vs Values长度匹配:', headers.length === values.length);
        }
        
        headers.forEach((header, index) => {
          movie[header] = values[index] || '';
          
          // 调试genres字段
          if (i === 1 && header === 'genres') {
            console.log(`genres字段调试: header="${header}", index=${index}, value="${values[index]}"`);
          }
        });
        
        // 调试第一个电影对象
        if (i === 1) {
          console.log('第一个电影对象:', movie);
          console.log('genres字段值:', movie.genres);
        }
        
        movies.push(movie);
      }
      
      console.log(`TSV解析完成，共解析 ${movies.length} 部电影`);
      return movies;
    },

    createTestMovieData() {
      return [
        {
          tconst: 'tt0111161',
          titleType: 'movie',
          primaryTitle: 'The Shawshank Redemption',
          originalTitle: 'The Shawshank Redemption',
          isAdult: '0',
          startYear: '1994',
          endYear: '\\N',
          runtimeMinutes: '142',
          genres: 'Drama'
        },
        {
          tconst: 'tt0068646',
          titleType: 'movie',
          primaryTitle: 'The Godfather',
          originalTitle: 'The Godfather',
          isAdult: '0',
          startYear: '1972',
          endYear: '\\N',
          runtimeMinutes: '175',
          genres: 'Crime,Drama'
        },
        {
          tconst: 'tt0468569',
          titleType: 'movie',
          primaryTitle: 'The Dark Knight',
          originalTitle: 'The Dark Knight',
          isAdult: '0',
          startYear: '2008',
          endYear: '\\N',
          runtimeMinutes: '152',
          genres: 'Action,Crime,Drama'
        },
        {
          tconst: 'tt0167260',
          titleType: 'movie',
          primaryTitle: 'The Lord of the Rings: The Return of the King',
          originalTitle: 'The Lord of the Rings: The Return of the King',
          isAdult: '0',
          startYear: '2003',
          endYear: '\\N',
          runtimeMinutes: '201',
          genres: 'Action,Adventure,Drama'
        },
        {
          tconst: 'tt0109830',
          titleType: 'movie',
          primaryTitle: 'Forrest Gump',
          originalTitle: 'Forrest Gump',
          isAdult: '0',
          startYear: '1994',
          endYear: '\\N',
          runtimeMinutes: '142',
          genres: 'Drama,Romance'
        },
        {
          tconst: 'tt0137523',
          titleType: 'movie',
          primaryTitle: 'Fight Club',
          originalTitle: 'Fight Club',
          isAdult: '0',
          startYear: '1999',
          endYear: '\\N',
          runtimeMinutes: '139',
          genres: 'Drama'
        },
        {
          tconst: 'tt0080684',
          titleType: 'movie',
          primaryTitle: 'Star Wars: Episode V - The Empire Strikes Back',
          originalTitle: 'Star Wars: Episode V - The Empire Strikes Back',
          isAdult: '0',
          startYear: '1980',
          endYear: '\\N',
          runtimeMinutes: '124',
          genres: 'Action,Adventure,Fantasy'
        },
        {
          tconst: 'tt0133093',
          titleType: 'movie',
          primaryTitle: 'The Matrix',
          originalTitle: 'The Matrix',
          isAdult: '0',
          startYear: '1999',
          endYear: '\\N',
          runtimeMinutes: '136',
          genres: 'Action,Sci-Fi'
        },
        {
          tconst: 'tt0099685',
          titleType: 'movie',
          primaryTitle: 'Goodfellas',
          originalTitle: 'Goodfellas',
          isAdult: '0',
          startYear: '1990',
          endYear: '\\N',
          runtimeMinutes: '146',
          genres: 'Biography,Crime,Drama'
        },
        {
          tconst: 'tt0076759',
          titleType: 'movie',
          primaryTitle: 'Star Wars: Episode IV - A New Hope',
          originalTitle: 'Star Wars',
          isAdult: '0',
          startYear: '1977',
          endYear: '\\N',
          runtimeMinutes: '121',
          genres: 'Action,Adventure,Fantasy'
        },
        {
          tconst: 'tt0073486',
          titleType: 'movie',
          primaryTitle: 'One Flew Over the Cuckoo\'s Nest',
          originalTitle: 'One Flew Over the Cuckoo\'s Nest',
          isAdult: '0',
          startYear: '1975',
          endYear: '\\N',
          runtimeMinutes: '133',
          genres: 'Drama'
        },
        {
          tconst: 'tt0047478',
          titleType: 'movie',
          primaryTitle: 'Casablanca',
          originalTitle: 'Casablanca',
          isAdult: '0',
          startYear: '1942',
          endYear: '\\N',
          runtimeMinutes: '102',
          genres: 'Drama,Romance,War'
        },
        {
          tconst: 'tt0114369',
          titleType: 'movie',
          primaryTitle: 'Se7en',
          originalTitle: 'Se7en',
          isAdult: '0',
          startYear: '1995',
          endYear: '\\N',
          runtimeMinutes: '127',
          genres: 'Crime,Drama,Mystery'
        },
        {
          tconst: 'tt0317248',
          titleType: 'movie',
          primaryTitle: 'City of God',
          originalTitle: 'Cidade de Deus',
          isAdult: '0',
          startYear: '2002',
          endYear: '\\N',
          runtimeMinutes: '130',
          genres: 'Crime,Drama'
        },
        {
          tconst: 'tt0102926',
          titleType: 'movie',
          primaryTitle: 'The Silence of the Lambs',
          originalTitle: 'The Silence of the Lambs',
          isAdult: '0',
          startYear: '1991',
          endYear: '\\N',
          runtimeMinutes: '118',
          genres: 'Crime,Drama,Thriller'
        }
      ];
    },

    async testMovieSelection() {
      if (!this.scenarioQuery.trim()) {
        this.errorMessage = '请输入场景描述';
        return;
      }

      if (!this.userProfile || !this.userProfile.in_profile_genres) {
        this.errorMessage = '用户画像数据不完整';
        return;
      }

      if (this.movieDataset.length === 0) {
        this.errorMessage = '电影数据集未加载';
        return;
      }

      this.isLoading = true;
      this.errorMessage = '';
      this.selectedMovies = [];
      this.debugInfo = '';

      try {
        console.log('开始测试电影筛选...');
        console.log('场景描述:', this.scenarioQuery);
        console.log('用户画像:', this.userProfile);
        console.log('电影数据集大小:', this.movieDataset.length);

        const startTime = Date.now();
        
        const result = await selectMoviesForExperiment(
          this.movieDataset,
          this.userProfile,
          this.scenarioQuery
        );

        const endTime = Date.now();
        const duration = endTime - startTime;

        this.selectedMovies = result;
        
        this.debugInfo = JSON.stringify({
          scenarioQuery: this.scenarioQuery,
          userProfile: this.userProfile,
          datasetSize: this.movieDataset.length,
          resultCount: result.length,
          processingTime: `${duration}ms`,
          timestamp: new Date().toISOString()
        }, null, 2);

        console.log('电影筛选完成:', result);
        
      } catch (error) {
        console.error('电影筛选失败:', error);
        this.errorMessage = '电影筛选失败: ' + error.message;
      } finally {
        this.isLoading = false;
      }
    },

    // 导航方法
    goToInitialQuestionnaire() {
      this.$router.push({ name: 'InitialQuestionnaire' });
    },

    goToFirstRound() {
      this.$router.push({ name: 'FirstRoundConversation' });
    },

    goHome() {
      this.$router.push({ name: 'Entry' });
    }
  }
};
</script>

<style scoped>
.movies-test-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
  font-size: 2.5em;
}

.user-info {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 30px;
  border-left: 4px solid #007bff;
}

.user-info h3 {
  margin-top: 0;
  color: #007bff;
}

.scenario-input {
  margin-bottom: 30px;
}

.scenario-input h3 {
  color: #333;
  margin-bottom: 15px;
}

.input-group {
  display: flex;
  gap: 15px;
  align-items: flex-start;
}

textarea {
  flex: 1;
  padding: 15px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  resize: vertical;
  min-height: 80px;
}

textarea:focus {
  outline: none;
  border-color: #007bff;
}

.test-button {
  padding: 15px 25px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
  white-space: nowrap;
}

.test-button:hover:not(:disabled) {
  background: #0056b3;
}

.test-button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 40px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  background: #f8d7da;
  color: #721c24;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #f5c6cb;
}

.movies-result {
  margin-top: 30px;
}

.movies-result h3 {
  color: #28a745;
  margin-bottom: 20px;
}

.movies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.movie-card {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 10px;
  padding: 20px;
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
}

.movie-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.movie-number {
  position: absolute;
  top: 10px;
  right: 15px;
  background: #007bff;
  color: white;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
}

.movie-info h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.2em;
  padding-right: 40px;
}

.movie-details {
  margin: 10px 0;
  color: #666;
}

.year {
  background: #28a745;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-right: 10px;
}

.genres {
  font-style: italic;
  color: #6c757d;
}

.movie-id {
  font-family: monospace;
  font-size: 12px;
  color: #6c757d;
  margin: 5px 0;
}

.runtime {
  color: #17a2b8;
  font-size: 14px;
  margin: 5px 0 0 0;
}

.debug-info {
  margin-top: 30px;
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.debug-info h3 {
  margin-top: 0;
  color: #6c757d;
}

.debug-info pre {
  background: #e9ecef;
  padding: 15px;
  border-radius: 5px;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.4;
}

.navigation-buttons {
  margin-top: 40px;
  padding-top: 30px;
  border-top: 2px solid #dee2e6;
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

.nav-button {
  padding: 12px 24px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: none;
  display: inline-block;
}

.nav-button:hover {
  background: #0056b3;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
}

.nav-button.secondary {
  background: #6c757d;
}

.nav-button.secondary:hover {
  background: #545b62;
}

@media (max-width: 768px) {
  .input-group {
    flex-direction: column;
  }
  
  .movies-grid {
    grid-template-columns: 1fr;
  }
  
  .container {
    padding: 20px;
  }

  .navigation-buttons {
    flex-direction: column;
    align-items: center;
  }

  .nav-button {
    width: 100%;
    max-width: 300px;
  }
}
</style>