<template>
  <div class="page-container">
    <!-- Left Column: AI Assistant Profile -->
    <div class="sidebar agent-profile-sidebar">
      <h3 class="sidebar-title">AI Movie Assistant</h3>
      <div class="agent-profile">
        <div class="agent-avatar-container">
          <img src="../images/gpt_logo.png" class="agent-profile-avatar" alt="GPT Logo">
        </div>
        <div class="agent-info">
          <h4 class="agent-role">Movie Recommendation Assistant</h4>
          <p class="agent-description">
            I'm an AI assistant specialized in movie recommendations. I can help you discover new films,
            discuss your favorite movies, and provide information about actors, directors, and genres.
            Feel free to ask me about any movie-related topics!
          </p>
        </div>
      </div>
    </div>

    <!-- Middle Column: Conversation -->
    <div class="conversation-container">
      <div class="card conversation-card">
        <!--<h2 class="card-title">First Conversation Round</h2>-->
        <!-- <p class="conversation-description">
          In this section, you will have a conversation with an AI assistant. Feel free to ask questions
          or discuss topics of interest. The conversation will be recorded for research purposes.
        </p> -->
        
        <div class="conversation-area">
          <div class="messages-container" ref="messagesContainer">
            <!-- Welcome message when conversation is empty -->
            <div class="welcome-message" v-if="messages.length === 0">
              <div class="welcome-content">
                <h3>🎬 Welcome to your AI Movie Assistant!</h3>
                <p>I'm here to help you discover amazing movies tailored to your preferences. Let's start by getting to know you better!</p>
                <p>To give you the best recommendations, could you tell me about your movie plans?</p>
                <div class="welcome-prompts">
                  <div class="prompt-item">
                    <span class="prompt-icon">📅</span>
                    <strong>When</strong> would you like to watch?
                  </div>
                  <div class="prompt-item">
                    <span class="prompt-icon">📍</span>
                    <strong>Where</strong> are you planning to watch?
                  </div>
                  <div class="prompt-item">
                    <span class="prompt-icon">👥</span>
                    <strong>Who</strong> are you watching with?
                  </div>
                  <div class="prompt-item">
                    <span class="prompt-icon">🎭</span>
                    <strong>What</strong> mood or genre are you in for?
                  </div>
                </div>
                <p class="welcome-footer">The more I know about your preferences, the better our conversation will be!</p>
              </div>
            </div>
            
            <div 
              v-for="(message, index) in messages" 
              :key="index" 
              :class="['message', message.sender === 'user' ? 'user-message' : 'agent-message']"
            >
              <div v-if="message.sender === 'agent'" class="agent-avatar">
                <img src="../images/gpt_logo.png" alt="Agent Avatar" class="avatar-image">
              </div>
              <div class="message-content">
                <div class="message-text" v-html="message.text"></div>
                <span class="message-time">{{ formatTime(message.timestamp) }}</span>
              </div>
            </div>
            
            <div v-if="isAgentTyping || isExplanationGenerating" class="message agent-message typing-indicator">
              <div class="agent-avatar" v-if="isExplanationGenerating">
                <img src="../images/gpt_logo.png" alt="Agent Avatar" class="avatar-image">
              </div>
              <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <!-- <div class="typing-label" v-if="isExplanationGenerating">生成电影解释中...</div> -->
            </div>
          </div>
          
          <div class="input-area">
            <textarea 
              v-model="userInput" 
              placeholder="Type your message here..." 
              class="message-input"
              @keydown.enter.prevent="sendMessage"
              :disabled="isSubmitting || isAgentTyping || isExplanationGenerating"
              ref="messageInput"
              @input="inputError = ''"
            ></textarea>
            <div v-if="inputError" class="input-error-message">{{ inputError }}</div>
            <button 
              class="btn send-btn" 
              @click="sendMessage" 
              :disabled="!userInput.trim() || isSubmitting || isAgentTyping || isExplanationGenerating"
            >
              Send
            </button>
          </div>
        </div>
        
        <div class="conversation-actions">
          <div class="proceed-requirements">
            <p class="messages-remaining" v-if="remainingMessages > 0">
              {{ remainingMessages }} round conversation remaining before you can proceed
            </p>
            <p class="rating-reminder" v-if="needRatingReminder">
              Please rate 4-6 movies as your top choices before proceeding ({{ ratedMoviesCount }} rated)
            </p>
          </div>
          <button 
            class="btn next-btn" 
            @click="finishConversation" 
            :disabled="!canProceed"
            :title="!canProceed ? 'You need to have enough conversation and rate 4-6 movies' : ''"
          >
            Post-study Questionnaire
          </button>
        </div>
      </div>
    </div>

    <!-- Right Column: Movie Recommendations -->
    <div class="sidebar movie-recommendations-sidebar">
      <h3 class="sidebar-title">Movie Recommendations</h3>
      <div class="movie-list" ref="movieListContainer">
        <div v-if="recommendedMovies.length === 0" class="no-recommendations">
          <p>Movies will appear here as they are mentioned in the conversation.</p>
        </div>
        <div v-else class="movies-grid">
          <!-- 显示推荐电影 -->
          <div 
            v-for="(movie, index) in recommendedMovies" 
            :key="movie.imdbID || movie.title"
            class="movie-card"
            :class="[movie.inWatchlist ? 'in-watchlist' : '']"
          >
            <div class="movie-details-container">
              <div class="movie-poster-container">
                <!-- 有海报时显示图片 -->
                <img 
                  v-if="movie.Poster && movie.Poster !== 'N/A'" 
                  :src="movie.Poster" 
                  :alt="movie.title + ' poster'" 
                  class="movie-poster"
                  @error="handlePosterError($event, movie)"
                >
                <!-- 没有海报或加载失败时显示替代图片 -->
                <div 
                  :style="{
                    display: (movie.Poster && movie.Poster !== 'N/A' && !movie.posterError) ? 'none' : 'flex',
                    width: '100%',
                    height: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '6px',
                    color: '#666',
                    fontSize: '12px',
                    textAlign: 'center',
                    backgroundImage: 'url(https://via.placeholder.com/60x90/e0e0e0/666666?text=Movie)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }"
                ></div>
              </div>
              <div class="movie-info">
                <div class="movie-header" @click.stop="openImdbPage(movie)" style="cursor: pointer;">
                  <h4 class="movie-title" :title="movie.title" style="display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; min-height: 20px; line-height: 1.2; margin-bottom: 5px;">{{ movie.title }}</h4>
                  <p v-if="movie.Director" class="movie-director">Director: {{ movie.Director }}</p>
                  <p v-if="movie.imdbRating && movie.imdbRating !== 'N/A'" class="movie-rating">IMDB: {{ movie.imdbRating }}</p>
                </div>
                
                <!-- Movie explanation -->
                <!-- <div class="movie-explanation" v-if="movie.explanation">
                  <p>{{ movie.explanation }}</p>
                </div> -->
                
                <!-- Watchlist button (only visible when not in watchlist) -->
                <div class="watchlist-button-container" v-if="!movie.inWatchlist">
                  <button 
                    class="btn watchlist-btn" 
                    @click.stop="addToWatchlist(movie)"
                    :disabled="ratedMoviesCount >= 6"
                    :class="{ 'disabled': ratedMoviesCount >= 6 }"
                    :title="ratedMoviesCount >= 6 ? 'You have already rated 6 movies. Cannot add more to watchlist.' : ''"
                  >
                    <i class="fas fa-plus"></i> Add to Watchlist
                  </button>
                </div>
                
                <!-- 用户评分系统 (only visible when in watchlist) -->
                <div class="movie-rating-stars" v-if="movie.inWatchlist">
                  <span>Your Rating:</span>
                  <div class="stars" :class="{ 'disabled': ratedMoviesCount >= 6 && !movie.userRating }">
                    <span 
                      v-for="star in 5" 
                      :key="star" 
                      :class="['star', movie.userRating >= star ? 'filled' : '', (ratedMoviesCount >= 6 && !movie.userRating) ? 'disabled' : '']"
                      @click.stop="(ratedMoviesCount >= 6 && !movie.userRating) ? null : rateMovie(movie, star)"
                      :title="(ratedMoviesCount >= 6 && !movie.userRating) ? 'You have already rated 6 movies. Cannot rate more movies.' : ''"
                    >
                      ★
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { logConversation, logUserEvent } from '../services/loggingService';
import { completeCurrentSystem, getCurrentQuestionnaireRoute } from '../services/systemOrderService';
import { loadMoviesData, markMoviesInMessage, updateMovieList, normalizeMovieTitle } from '../services/movieService';
import { getFirebaseDb } from '../services/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { getProfilesById } from '@/services/profileService';
import { saveConversationTurn } from '../services/conversationService';
import { API_KEY, BASE_URL, MODEL, API_TIMEOUT } from '../config.js';
import { selectMoviesForExperiment } from '../utils/12movies.js';

export default {
  name: 'FirstRoundConversation',
  data() {
    return {
      userInput: '',
      messages: [],
      isAgentTyping: false,
      isExplanationGenerating: false,
      isSubmitting: false,
      minRequiredMessages: 5,
      maxMessages: 10,
      welcomeMessage: "Hey! I'm your movie buddy here to chat about films and understand your preferences. Just let me know when you're planning to watch, who you'll be watching with, and what kind of vibe you're going for—like a chill comedy night with friends, a romantic evening with your partner, or a fun family weekend. The more I know about your preferences, the better our conversation will be!",
      moviesData: [],
      movieMentions: new Map(),
      recommendedMovies: [],
      inputError: '',
      movieRatings: {}, // 存储用户对电影的评分
      watchlist: [], // 存储用户的观影清单
      movieDataset: [], // 存储完整的电影数据集
      userProfile: { // 用户画像
        in_profile_genres: ['Animation', 'Sport', 'Family'] // 从用户输入的liked_genres得来
      },
      movieStats: new Map(), // 电影统计数据
      movieStatsObject: {}, // 响应式电影统计对象
      movieDetailsMap: {}, // 电影详情映射
      recommendationsGenerated: false, // 标记是否已生成推荐
      profileId: null, // 存储用户配置文件ID
      dynamicProfiles: null, // 存储从数据库读取的用户配置
      existingConversations: [] // 存储已有的对话记录
    };
  },
  computed: {
    userMessageCount() {
      return this.messages.filter(m => m.sender === 'user').length;
    },
    remainingMessages() {
      return Math.max(this.minRequiredMessages - this.userMessageCount, 0);
    },
    canProceed() {
      // 检查用户消息数量是否达到最低要求
      const hasEnoughMessages = this.userMessageCount >= this.minRequiredMessages;
      
      // 检查用户是否评分了4-6部电影
      const ratedMoviesCount = Object.keys(this.movieRatings).length;
      const hasEnoughRatings = ratedMoviesCount >= 4 && ratedMoviesCount <= 6;
      
      return hasEnoughMessages && hasEnoughRatings;
    },
    
    // 获取用户已评分的电影数量
    ratedMoviesCount() {
      return Object.keys(this.movieRatings).length;
    },
    
    // 检查是否需要显示评分提示
    needRatingReminder() {
      return this.userMessageCount >= this.minRequiredMessages && (this.ratedMoviesCount < 4 || this.ratedMoviesCount > 6);
    },
    // 按提及次数排序的电影列表
    sortedMovies() {
      // 将对象转换为数组并排序
      return Object.entries(this.movieStatsObject)
        .sort((a, b) => b[1] - a[1]); // 按计数降序排序
    }
  },
  async created() {
    // 记录页面加载事件
    try {
      await logUserEvent('page_loaded', {
        page: 'FirstRoundConversation',
        profileId: this.profileId || null,
        roundId: '1',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log page load event:', error);
    }
    
    logUserEvent('view_first_round_conversation');
    
    // 清空本地存储的数据
    this.clearLocalStorage();
    
    // 读取用户配置和已有对话记录
    await this.loadUserProfileAndConversations();
    
    // Don't add the old welcome message automatically - let the new welcome component handle it
  // this.addMessage({
  //   sender: 'agent',
  //   text: this.welcomeMessage,
  //   timestamp: new Date()
  // });
    
    // 初始化电影相关数据
    this.recommendedMovies = [];
    
    // 加载保存的电影评分（如果有）
    const savedMovieRatings = localStorage.getItem('movieRatings');
    if (savedMovieRatings) {
      try {
        this.movieRatings = JSON.parse(savedMovieRatings);
        console.log('Loaded saved movie ratings from localStorage:', this.movieRatings);
      } catch (error) {
        console.error('Error parsing saved movie ratings:', error);
      }
    }
    
    // 加载保存的观影清单（如果有）
    const savedWatchlist = localStorage.getItem('movieWatchlist');
    if (savedWatchlist) {
      try {
        this.watchlist = JSON.parse(savedWatchlist);
        console.log('Loaded saved watchlist from localStorage:', this.watchlist);
      } catch (error) {
        console.error('Error parsing saved watchlist:', error);
      }
    }
    
    // Listen for movie mention events
    document.addEventListener('movie-mentioned', this.handleMovieMention);
    
    // 测试OMDB API - 手动获取一个知名电影的详细信息
    console.log('Testing OMDB API with a known movie title');
    this.fetchMovieDetailsIfNeeded("The Shawshank Redemption");
  },
  async mounted() {
    this.$refs.messageInput.focus();
    
    // Load movie dataset only, don't generate recommendations yet
    await this.loadMovieDataset();
    
    // Initial scroll to bottom if there are movies
    this.$nextTick(() => {
      if (Object.keys(this.movieStatsObject).length > 0) {
        this.scrollToBottomOfMovieList();
      }
    });
  },
  
  beforeDestroy() {
    // Clean up event listener
    document.removeEventListener('movie-mentioned', this.handleMovieMention);
    
    // 保存电影统计数据到localStorage
    try {
      localStorage.setItem('movieStats', JSON.stringify(this.movieStatsObject));
      console.log('Saved movie stats to localStorage:', this.movieStatsObject);
    } catch (error) {
      console.error('Error saving movie stats:', error);
    }
    
    // Save movie ratings
    try {
      localStorage.setItem('movieRatings', JSON.stringify(this.movieRatings));
      console.log('Saved movie ratings to localStorage:', this.movieRatings);
    } catch (error) {
      console.error('Error saving movie ratings:', error);
    }
    
    // Save watchlist
    try {
      localStorage.setItem('movieWatchlist', JSON.stringify(this.watchlist));
      console.log('Saved watchlist to localStorage:', this.watchlist);
    } catch (error) {
      console.error('Error saving watchlist:', error);
    }
  },
  methods: {
    // 使用API提取电影名称
    async extractMoviesWithAPI(text, agentType = 'gpt') {
      // 使用从config.js导入的API配置
      
      try {
        console.log('使用API提取电影名称...');
        
        const prompt = `
Analyze the following conversation about movies. Extract all movie titles mentioned and determine the speaker's attitude toward each movie (support, oppose, or indifferent).

Return only a JSON response with the following format, without any additional text:
{
  "movies": [
    {
      "title": "Movie Title 1",
      "attitude": "support|oppose|indifferent"
    },
    {
      "title": "Movie Title 2",
      "attitude": "support|oppose|indifferent"
    }
  ]
}

Conversation:
${text}
`;

        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        };
        
        const data = {
          model: MODEL,
          messages: [
            { role: 'system', content: 'You are a specialized assistant that extracts movie titles from conversations. Output only JSON format results, nothing else.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1,
          max_tokens: 1000
        };
        
        const response = await axios.post(`${BASE_URL}/chat/completions`, data, { 
          headers, 
          timeout: API_TIMEOUT 
        });
        
        if (response.data && response.data.choices && response.data.choices.length > 0) {
          const content = response.data.choices[0].message.content;
          console.log('API返回的电影提取结果:', content);
          
          try {
            // 尝试解析JSON结果
            let jsonContent = content;
            
            // 如果返回的不是纯JSON，尝试提取JSON部分
            if (content.includes('{') && content.includes('}')) {
              const jsonStart = content.indexOf('{');
              const jsonEnd = content.lastIndexOf('}') + 1;
              jsonContent = content.substring(jsonStart, jsonEnd);
            }
            
            const result = JSON.parse(jsonContent);
            
            if (result.movies && Array.isArray(result.movies)) {
              console.log(`API成功提取了 ${result.movies.length} 部电影`);
              
              // 处理每部提取的电影
              for (const movie of result.movies) {
                if (movie.title) {
                  // 确保电影标题是干净的（没有HTML标签）
                  const cleanMovieTitle = this.stripHtmlTags(movie.title).trim();
                  if (!cleanMovieTitle) continue;
                  
                  // 更新电影统计数据
                  const currentCount = this.movieStats.get(cleanMovieTitle) || 0;
                  const newCount = currentCount + 1;
                  
                  // 更新Map和响应式对象
                  this.movieStats.set(cleanMovieTitle, newCount);
                  this.movieStatsObject[cleanMovieTitle] = newCount;
                  
                  // 获取电影详情
                  this.fetchMovieDetailsIfNeeded(cleanMovieTitle);
                }
              }
              
              // 强制Vue更新对象
              this.movieStatsObject = {...this.movieStatsObject};
              this.movieStats = new Map(this.movieStats);
              
              // 滚动到电影列表底部
              this.$nextTick(() => {
                this.scrollToBottomOfMovieList();
              });
              
              return true; // 表示成功提取
            }
          } catch (parseError) {
            console.error('解析API返回的电影数据失败:', parseError);
          }
        }
        
        return false; // 表示未成功提取
      } catch (error) {
        console.error('使用API提取电影名称时出错:', error);
        console.error('错误详情:', error.response ? error.response.data : '无响应数据');
        return false; // 表示未成功提取
      }
    },
    // 添加电影到观影清单
    async addToWatchlist(movie) {
      const movieTitle = typeof movie === 'string' ? movie : movie.title;
      if (!this.watchlist.includes(movieTitle)) {
        this.watchlist.push(movieTitle);
        localStorage.setItem('movieWatchlist', JSON.stringify(this.watchlist));
        console.log(`添加 "${movieTitle}" 到观影清单`);
        
        // 保存到Firestore user_events集合
        try {
          const movieDetails = typeof movie === 'object' ? {
            imdbID: movie.imdbID || null,
            year: movie.Year || null,
            genre: movie.Genre || null,
            poster: movie.Poster || null
          } : null;
          
          await logUserEvent('movie_add_to_watchlist', {
            movieTitle: movieTitle,
            profileId: this.profileId,
            roundId: '1',
            movieDetails: movieDetails,
            watchlistCount: this.watchlist.length
          });
        } catch (error) {
          console.error('Failed to log watchlist event:', error);
        }
        
        // 更新电影对象的inWatchlist状态
        if (typeof movie === 'object') {
          movie.inWatchlist = true;
        }
      }
    },
    
    // 检查电影是否在观影清单中
    movieInWatchlist(movie) {
      if (typeof movie === 'string') {
        return this.watchlist.includes(movie);
      }
      return movie.inWatchlist || false;
    },
    
    // 对电影进行评分
    async rateMovie(movie, rating) {
      const movieTitle = typeof movie === 'string' ? movie : movie.title;
      const previousRating = this.movieRatings[movieTitle];
      
      this.movieRatings[movieTitle] = rating;
      localStorage.setItem('movieRatings', JSON.stringify(this.movieRatings));
      console.log(`为 "${movieTitle}" 评分: ${rating} 星`);
      
      // 保存到Firestore user_events集合
      try {
        const movieDetails = typeof movie === 'object' ? {
          imdbID: movie.imdbID || null,
          year: movie.Year || null,
          genre: movie.Genre || null,
          poster: movie.Poster || null
        } : null;
        
        await logUserEvent('movie_rating', {
          movieTitle: movieTitle,
          rating: rating,
          previousRating: previousRating || null,
          profileId: this.profileId,
          roundId: '1',
          movieDetails: movieDetails,
          totalRatedMovies: Object.keys(this.movieRatings).length
        });
      } catch (error) {
        console.error('Failed to log rating event:', error);
      }
      
      // 更新电影对象的userRating
      if (typeof movie === 'object') {
        movie.userRating = rating;
      }
    },
    
    // 打开IMDb页面
    async openImdbPage(movie) {
      if (movie.imdbID) {
        window.open(`https://www.imdb.com/title/${movie.imdbID}`, '_blank');
        
        // 记录用户点击IMDB链接事件
        try {
          await logUserEvent('movie_imdb_click', {
            movieTitle: movie.title || 'Unknown',
            imdbID: movie.imdbID || null,
            profileId: this.profileId,
            roundId: '1'
          });
        } catch (error) {
          console.error('Failed to log IMDB click event:', error);
        }
      } else {
        console.warn('No IMDb ID available for movie:', movie.title);
      }
    },
    
    // 处理海报加载错误
    handlePosterError(event, movie) {
      console.log(`Poster for "${movie.title}" failed to load`);
      // 标记海报加载失败
      movie.posterError = true;
      // 隐藏图片元素，显示替代内容
      event.target.style.display = 'none';
      if (event.target.nextElementSibling) {
        event.target.nextElementSibling.style.display = 'flex';
      }
      
      // 尝试使用备用海报URL（如果有）
      if (movie.backupPoster) {
        console.log(`Trying backup poster for "${movie.title}":`, movie.backupPoster);
        event.target.src = movie.backupPoster;
        event.target.style.display = 'block';
        // 重置错误处理，以便如果备用海报也失败，会再次触发错误处理
        movie.posterError = false;
      }
    },
    
    // Format agent responses using Markdown format
    formatAgentResponse(text) {
      if (!text) return '';
      
      // 将Markdown加粗语法转换为HTML加粗标签
      text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // 处理数字列表，确保每个列表项前有换行
      text = text.replace(/((?:^|\.|!|\?)\s*)(\d+\.)/g, '$1<br>$2');
      
      // 在特定列表标题的冒号后添加换行，但避免影响电影标题中的冒号
      text = text.replace(/(\d+\.\s*<strong>[A-Za-z\s]+<\/strong>):(\s+)/g, '$1:<br>$2');
      
      // 将普通换行符转换为HTML换行标签
      text = text.replace(/\n/g, '<br>');
      
      // 在段落之间添加额外的换行（句号后跟大写字母通常表示新段落）
      text = text.replace(/([.!?])\s{1,}([A-Z])/g, '$1<br><br>$2');
      
      // 在特定短语前添加段落分隔
      const paragraphBreakPatterns = [
        'Let me know', 'Hope this helps', 'Enjoy', 'What do you think',
        'Would you like', 'Is there anything', 'Do you have'
      ];
      
      paragraphBreakPatterns.forEach(pattern => {
        const regex = new RegExp(`([.!?]\\s*)(${pattern})`, 'gi');
        text = text.replace(regex, '$1<br><br>$2');
      });
      
      return text;
    },
    
    // Helper method to fetch movie details if not already in the map
    // 加载电影数据集
    async loadMovieDataset() {
      try {
        console.log('Loading movie dataset...');
        // Try multiple possible paths for the TSV file
        const possiblePaths = [
          '/src/data/title.high_quality.tsv',
          '/title.high_quality.tsv',
          '/data/title.high_quality.tsv',
          '/title.basics.movie.filtered.tsv'
        ];
        
        let response = null;
        let successfulPath = null;
        
        for (const path of possiblePaths) {
          try {
            console.log(`Trying path: ${path}`);
            response = await fetch(path);
            if (response.ok) {
              successfulPath = path;
              console.log(`Successfully loaded from: ${path}`);
              break;
            }
          } catch (e) {
            console.log(`Failed to load from ${path}:`, e.message);
          }
        }
        
        if (!response || !response.ok) {
          throw new Error('Could not load movie dataset from any path');
        }
        const tsvText = await response.text();
        
        // Parse TSV data
        const lines = tsvText.split('\n');
        const headers = lines[0].split('\t').map(header => header.trim().replace(/\r/g, ''));
        
        console.log('TSV headers:', headers);
        
        this.movieDataset = lines.slice(1)
          .filter(line => line.trim())
          .map((line, index) => {
            const values = line.split('\t');
            const movie = {};
            headers.forEach((header, headerIndex) => {
              // Ensure we don't go out of bounds and handle missing values
              movie[header] = values[headerIndex] !== undefined ? values[headerIndex] : '';
              // Convert \N to empty string for missing values
              if (movie[header] === '\\N') {
                movie[header] = '';
              }
            });
            
            // Debug first few movies to check genres field
            if (index < 3) {
              console.log(`Movie ${index + 1}:`, {
                tconst: movie.tconst,
                title: movie.primaryTitle,
                genres: movie.genres,
                genresType: typeof movie.genres,
                allFields: Object.keys(movie)
              });
            }
            
            return movie;
          })
          .filter(movie => movie.tconst && movie.primaryTitle && movie.genres && movie.genres !== ''); // Filter out invalid entries including missing genres
        
        console.log(`Loaded ${this.movieDataset.length} movies from dataset`);
        
        // Additional debug: check a sample movie
        if (this.movieDataset.length > 0) {
          const sample = this.movieDataset[0];
          console.log('Sample movie after parsing:', sample);
          console.log('Sample genres field:', sample.genres, typeof sample.genres);
        }
        
      } catch (error) {
        console.error('Failed to load movie dataset:', error);
        this.movieDataset = []; // Fallback to empty array
      }
    },

    // 加载电影数据集并使用12movies.js获取推荐
    async loadMovieDatasetAndRecommendations() {
      try {
        if (!this.movieDataset || this.movieDataset.length === 0) {
          await this.loadMovieDataset();
        }
        
        const recommendations = await selectMoviesForExperiment(
          this.movieDataset,
          this.userProfile,
          "General movie recommendations" // 默认场景
        );
        
        console.log('获得推荐电影:', recommendations);
        
        // Save the 12 movies to Firestore recommended_movie_sets collection
        await this.saveMovieSetToFirestore(recommendations, this.userProfile, "General movie recommendations");
        
        // 处理推荐结果
        await this.processMovieRecommendations(recommendations);
        
      } catch (error) {
        console.error('获取电影推荐失败:', error);
      }
    },

    
    
    // 处理电影推荐结果
    async processMovieRecommendations(recommendedMovies) {
      try {
        this.recommendedMovies = [];
        
        const moviePromises = recommendedMovies.map(async (movie, index) => {
          let movieTitle = '';
          
          if (movie.primaryTitle && typeof movie.primaryTitle === 'string' && movie.primaryTitle.trim() && movie.primaryTitle !== '\\N') {
            movieTitle = movie.primaryTitle.trim();
          } 
          else if (movie.originalTitle && typeof movie.originalTitle === 'string' && movie.originalTitle.trim() && movie.originalTitle !== '\\N') {
            movieTitle = movie.originalTitle.trim();
          }
          else if (movie.title && typeof movie.title === 'string' && movie.title.trim()) {
            movieTitle = movie.title.trim();
          }
          else if (movie.Title && typeof movie.Title === 'string' && movie.Title.trim()) {
            movieTitle = movie.Title.trim();
          }
          else if (movie.name && typeof movie.name === 'string' && movie.name.trim()) {
            movieTitle = movie.name.trim();
          }
          else {
            if (movie.tconst) {
              movieTitle = `Movie ${movie.tconst}`;
            } else {
              movieTitle = `Unknown Movie ${index + 1}`;
            }
          }
          
          if (!movieTitle || movieTitle === 'undefined' || movieTitle === '') {
            return null;
          }
          
          const movieObj = {
            title: movieTitle,
            Year: movie.startYear,
            Poster: 'N/A',
            Director: '',
            imdbRating: 'N/A',
            imdbID: movie.tconst,
            inWatchlist: false,
            userRating: 0,
            genres: movie.genres
          };
          
          // 尝试从OMDB获取详情
          try {
            const movieDetails = await this.fetchMovieDetails(movieTitle);
            if (movieDetails && movieDetails.Poster && movieDetails.Poster !== 'N/A') {
              movieObj.Poster = movieDetails.Poster;
              movieObj.Director = movieDetails.Director || '';
              movieObj.imdbRating = movieDetails.imdbRating || 'N/A';
              movieObj.imdbID = movieDetails.imdbID || movie.tconst;
            }
          } catch (error) {
            console.warn(`获取电影 "${movieTitle}" 详情失败:`, error);
          }
          
          return movieObj;
        });
        
        // 等待所有电影详情获取完成
        const processedMovies = await Promise.all(moviePromises);
        this.recommendedMovies = processedMovies.filter(movie => movie !== null);
        
        const movieRecommendations = [];
        
        // 显示生成解释的loading状态
        this.isExplanationGenerating = true;
        this.scrollToBottom(); // 滚动到底部显示加载状态
        
        // 使用LLM为每部电影生成解释
        const explanationPromises = this.recommendedMovies.map(async (movie, index) => {
          try {
            // 使用LLM生成解释
            const explanation = await this.generateMovieExplanationWithLLM(movie);
            
            // 直接将解释添加到电影对象中
            this.recommendedMovies[index].explanation = explanation;
            
            return {
              title: movie.title,
              reason: `This ${movie.genres} movie offers a diverse viewing experience.`,
              explanation: explanation
            };
          } catch (error) {
            console.error(`为电影 "${movie.title}" 生成LLM解释失败:`, error);
            // 如果LLM生成失败，使用默认解释
            const defaultExplanation = `"${movie.title}" (${movie.Year || 'N/A'}) - ${movie.genres ? `A ${movie.genres.split(',')[0].trim().toLowerCase()} film` : 'A great movie'} that offers an engaging viewing experience.`;
            
            // 添加默认解释到电影对象
            this.recommendedMovies[index].explanation = defaultExplanation;
            
            return {
              title: movie.title,
              reason: `This ${movie.genres} movie offers a diverse viewing experience.`,
              explanation: defaultExplanation
            };
          }
        });
        
        // 等待所有解释生成完成
        try {
          const processedRecommendations = await Promise.all(explanationPromises);
          movieRecommendations.push(...processedRecommendations);
          
          await this.sendRecommendationMessage(movieRecommendations);
          
          this.$nextTick(() => {
            this.scrollToBottomOfMovieList();
          });
        } catch (error) {
          console.error('处理电影推荐时出错:', error);
          // 确保在出错时也关闭loading状态
          this.isExplanationGenerating = false;
        }
        
      } catch (error) {
        console.error('处理电影推荐失败:', error);
        // 不再调用TMDB备用方法，避免重复推荐
        this.recommendationsGenerated = false; // 重置标记，允许重试
      }
    },

    // 生成电影推荐解释
    generateMovieExplanation(movie) {
      const genres = movie.genres ? movie.genres.split(',').map(g => g.trim()) : [];
      const year = movie.startYear;
      const targetGenre = movie.targetGenre;
      
      // 获取电影标题，使用多种可能的字段
      const movieTitle = movie.primaryTitle || movie.title || movie.Title || movie.originalTitle || 'Unknown Movie';
      
      // 根据类型和年份生成英文解释
      let explanation = `"${movieTitle}"`;
      
      if (year) {
        explanation += ` (${year})`;
      }
      
      if (targetGenre) {
        if (targetGenre === 'Supplementary') {
          explanation += `: This movie offers a diverse viewing experience`;
        } else {
          const isUserPreferred = this.userProfile.in_profile_genres.includes(targetGenre);
          if (isUserPreferred) {
            explanation += `: This ${targetGenre} movie matches your preferences`;
          } else {
            explanation += `: This ${targetGenre} movie offers a new viewing experience`;
          }
        }
      }
      
      if (genres.length > 1) {
        explanation += ` It combines elements of ${genres.slice(0, 3).join(', ')}`;
      }
      
      // 根据年份添加描述
      if (year) {
        const currentYear = new Date().getFullYear();
        const movieAge = currentYear - parseInt(year);
        
        if (movieAge < 5) {
          explanation += ', a relatively recent film';
        } else if (movieAge < 15) {
          explanation += ', a well-regarded film';
        } else if (movieAge < 30) {
          explanation += ', a classic work';
        } else {
          explanation += ', a timeless classic';
        }
      }
      
      explanation += '.';
      
      return explanation;
    },
    
    // 使用LLM生成电影推荐解释
    async generateMovieExplanationWithLLM(movie) {
      try {
        console.log('使用LLM生成电影解释:', movie.title);
        
        // 获取电影标题，使用多种可能的字段
        const movieTitle = movie.primaryTitle || movie.title || movie.Title || movie.originalTitle || 'Unknown Movie';
        const year = movie.Year || movie.startYear || 'N/A';
        const genres = movie.genres || 'N/A';
        const director = movie.Director || 'N/A';
        const imdbRating = movie.imdbRating || 'N/A';
        
        // 获取用户个人资料信息
        let userProfileInfo = '';
        if (this.dynamicUserProfile) {
          // 构建用户个人资料信息字符串
          const userInput = this.dynamicUserProfile;
          
          // 提取人口统计学信息
          const ageRange = userInput?.demographics?.age_range || '';
          const gender = userInput?.demographics?.gender || '';
          
          // 提取兴趣和喜欢的电影类型
          const likedGenres = userInput?.interests?.liked_genres || [];
          const likedGenresStr = Array.isArray(likedGenres) ? likedGenres.join(', ') : '';
          
          // 提取性格特征
          const personality = userInput?.personality_raw || {};
          
          // 分析性格特征
          let personalityTraits = [];
          
          // 检查所有TIPI量表项目是否存在
          const hasPersonalityData = Object.keys(personality).some(key => key.startsWith('tipi_item_'));
          
          if (hasPersonalityData) {
            // 分析开放性 (Openness)
            if ((personality.tipi_item_5 && personality.tipi_item_5 > 4) || 
                (personality.tipi_item_10 && personality.tipi_item_10 < 4)) {
              personalityTraits.push('open to new experiences');
            }
            
            // 分析尽责性 (Conscientiousness)
            if ((personality.tipi_item_3 && personality.tipi_item_3 > 4) || 
                (personality.tipi_item_8 && personality.tipi_item_8 < 4)) {
              personalityTraits.push('conscientious and organized');
            }
            
            // 分析外向性 (Extraversion)
            if ((personality.tipi_item_1 && personality.tipi_item_1 > 4) || 
                (personality.tipi_item_6 && personality.tipi_item_6 < 4)) {
              personalityTraits.push('extraverted and enthusiastic');
            }
            
            // 分析容易相处性 (Agreeableness)
            if ((personality.tipi_item_7 && personality.tipi_item_7 > 4) || 
                (personality.tipi_item_2 && personality.tipi_item_2 < 4)) {
              personalityTraits.push('agreeable and warm');
            }
            
            // 分析神经质性 (Neuroticism)
            if ((personality.tipi_item_9 && personality.tipi_item_9 > 4) || 
                (personality.tipi_item_4 && personality.tipi_item_4 < 4)) {
              personalityTraits.push('emotionally sensitive');
            }
          }
          
          const personalityStr = personalityTraits.length > 0 ? personalityTraits.join(', ') : '';
          
          // 构建用户资料信息
          userProfileInfo = `
          User Profile Information:
          ${ageRange ? `- Age Range: ${ageRange}` : ''}
          ${gender ? `- Gender: ${gender}` : ''}
          ${likedGenresStr ? `- Liked Movie Genres: ${likedGenresStr}` : ''}
          ${personalityStr ? `- Personality Traits: ${personalityStr}` : ''}
          `.trim();
        }
        
        // 构建提示词，包含用户个人资料信息
        const prompt = `
        Generate a brief, engaging explanation for the movie "${movieTitle}" (${year}) to recommend it to a user.
        
        Movie details:
        - Title: ${movieTitle}
        - Year: ${year}
        - Genres: ${genres}
        - Director: ${director}
        - IMDB Rating: ${imdbRating}
        
        ${userProfileInfo ? userProfileInfo + '\n\n' : ''}
        ${userProfileInfo ? 'Consider the user profile information above when generating your explanation. Tailor your recommendation to match their preferences and interests.' : ''}
        
        The explanation should be 1-2 sentences long, highlight what makes this movie special, and why someone might enjoy it.
        Focus on the movie's unique qualities, style, or cultural significance.
        Do NOT use phrases like "This movie is about" or "This film tells the story of".
        Start directly with the movie title in quotes, followed by the year in parentheses.
        Example format: "Movie Title" (Year) - [your engaging description here].
        `;
        
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        };
        
        const data = {
          model: MODEL,
          messages: [
            { role: 'system', content: 'You are a movie expert who provides concise, engaging movie explanations tailored to the user\'s preferences.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 150
        };
        
        const response = await axios.post(`${BASE_URL}/chat/completions`, data, { 
          headers, 
          timeout: API_TIMEOUT 
        });
        
        if (response.data && response.data.choices && response.data.choices.length > 0) {
          const explanation = response.data.choices[0].message.content.trim();
          console.log('LLM生成的电影解释:', explanation);
          return explanation;
        }
        
        // 如果API调用失败，回退到默认解释
        console.log('LLM生成解释失败，使用默认解释');
        return this.generateMovieExplanation(movie);
      } catch (error) {
        console.error('使用LLM生成电影解释时出错:', error);
        console.error('错误详情:', error.response ? error.response.data : '无响应数据');
        // 出错时回退到默认解释
        return this.generateMovieExplanation(movie);
      }
    },

    // 发送包含推荐解释的消息
    async sendRecommendationMessage(movieRecommendations) {
      let recommendationText = 'Here are some great movie ideas perfect for you:\n\n';
      
      movieRecommendations.forEach((rec, index) => {
        recommendationText += `${index + 1}. ${rec.explanation}\n\n`;
      });
      
      recommendationText += 'These are the initial recommendations we\'ve prepared for you based on our conversation.';
      
      // 添加第一条消息：电影推荐
      this.addMessage({
        sender: 'agent',
        text: recommendationText,
        timestamp: new Date()
      });
      
      // 记录第一条消息到Firebase
      await this.saveMessageToFirebase('agent', recommendationText);
      
      // 稍微延迟后发送第二条消息：操作指引
      setTimeout(async () => {
        const instructionText = 'What\'s next?\n' +
                               '1. Ask for more details: Feel free to ask me anything about these movies. This is the explanation round, and I won\'t recommend new films, but I can provide deeper insights to help you choose.\n' +
                               '2. Rate your top choices: When you feel you have enough information, please select and rate **4 to 6 movies** you are most interested in from the list on the right. You can do this by adding them to your watchlist and then clicking the stars.\n\n' +
                               'Once you\'ve completed the rating, the button to proceed to the final questionnaire will become active.';
        
        // 添加第二条消息：操作指引
        this.addMessage({
          sender: 'agent',
          text: instructionText,
          timestamp: new Date()
        });
        
        // 记录第二条消息到Firebase
        await this.saveMessageToFirebase('agent', instructionText);
      }, 1000); // 1秒延迟
      
      // 关闭解释生成的loading状态
      this.isExplanationGenerating = false;
    },

    // 原有的TMDB API方法作为备用
    async fetchMovieRecommendationsFromTMDB() {
      try {
        console.log('回退到TMDB API获取电影推荐列表...');
        
        // 使用TMDB API获取热门电影列表
        const TMDB_API_KEY = '3e1dd42e6a047c4b4a4c99d2c1e9a1c2';
        const response = await axios.get(
          `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`
        );
        
        if (response.data && response.data.results) {
          console.log('成功获取TMDB推荐电影列表:', response.data.results);
          this.recommendedMovies = response.data.results;
          
          // 将获取到的电影添加到推荐列表中
          this.recommendedMovies.slice(0, 12).forEach(movie => {
            const movieTitle = movie.title;
            // 更新电影统计数据
            this.movieStats.set(movieTitle, 1);
            this.movieStatsObject[movieTitle] = 1;
            
            // 将TMDB电影数据转换为OMDB格式以兼容现有代码
            const movieDetails = {
              Title: movie.title,
              Year: movie.release_date ? movie.release_date.substring(0, 4) : '',
              Poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'N/A',
              Plot: movie.overview,
              imdbRating: (movie.vote_average / 2).toFixed(1),
              imdbID: `tmdb-${movie.id}`
            };
            
            // 添加到电影详情映射
            this.movieDetailsMap[movieTitle] = movieDetails;
          });
          
          // 强制Vue更新对象
          this.movieStatsObject = {...this.movieStatsObject};
          this.movieDetailsMap = {...this.movieDetailsMap};
          this.movieStats = new Map(this.movieStats);
          
          // 滚动到电影列表底部
          this.$nextTick(() => {
            this.scrollToBottomOfMovieList();
          });
        }
      } catch (error) {
        console.error('TMDB API获取电影推荐列表失败:', error);
      }
    },
    
    fetchMovieDetailsIfNeeded(movieTitle) {
      if (!movieTitle || this.movieDetailsMap[movieTitle]) {
        console.log(`Skipping fetch for "${movieTitle}": ${!movieTitle ? 'Empty title' : 'Already in cache'}`);
        return;
      }
      
      // 清理电影标题，移除特殊字符
      const cleanTitle = normalizeMovieTitle(movieTitle);
      if (!cleanTitle) {
        console.log(`Skipping fetch for "${movieTitle}": Title is invalid after cleaning`);
        return;
      }
      
      this.fetchMovieDetails(cleanTitle).then(details => {
        if (details) {
          // Vue 3 直接赋值即可实现响应式更新
          this.movieDetailsMap[movieTitle] = details;
          console.log(`Successfully fetched details for "${movieTitle}":`, details);
        } else {
          console.log(`No details found for movie: ${movieTitle}`);
        }
      });
    },
    
    // Method to scroll to the bottom of the movie list
    scrollToBottomOfMovieList() {
      if (this.$refs.movieListContainer) {
        const container = this.$refs.movieListContainer;
        // Force scroll to the very bottom
        container.scrollTop = container.scrollHeight;
      }
    },
    
    // Method to scroll to the bottom of the conversation
    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.conversationContainer;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    },
    
    // 从OMDB API获取电影详情
    async fetchMovieDetails(movieTitle) {
      try {
        // 使用一致的API密钥
        const API_KEY = '7e374f8b';
        const response = await axios.get(`https://www.omdbapi.com/?apikey=${API_KEY}&t=${encodeURIComponent(movieTitle)}`);
        if (response.data.Response === 'True') {
          return response.data;
        }
        
        // 如果第一次尝试失败，尝试使用标题的变体
        if (movieTitle.includes(':')) {
          // 尝试不带副标题（冒号后的文本）
          const mainTitle = movieTitle.split(':')[0].trim();
          console.log(`第一次尝试失败，仅使用主标题重试: "${mainTitle}"`);
          const retryResponse = await axios.get(`https://www.omdbapi.com/?apikey=${API_KEY}&t=${encodeURIComponent(mainTitle)}`);
          if (retryResponse.data.Response === 'True') {
            return retryResponse.data;
          }
        }
        
        return null;
      } catch (error) {
        console.error('获取电影详情时出错:', error);
        return null;
      }
    },
    
    async fetchGPT4oResponse(userMessage) {
      // 使用从config.js导入的API配置
      
      // Prepare conversation history for the API
      const systemPrompt = `
You are a friendly, empathetic, and personalized AI movie companion.  

## Core Purpose  
Your mission is to create a natural, engaging conversation about movies that feels tailored to the user's unique profile (demographics, interests, and personality). You are here to **explore ideas with the user** and help them reflect on their own preferences, not to prescribe answers.  

## How to Use the User Profile  
You will always be provided with user profile details. You MUST actively use this information to:  
1. **Build Rapport** — Frame your responses in ways that resonate with their background, life stage, and personality.  
2. **Ask Insightful Questions** — Invite reflection through thoughtful follow-ups connected to their traits or interests.  
3. **Personalize the Discussion** — When referencing a movie, connect its themes, tone, or style back to the user’s profile.  

*For example:*  
- If the user enjoys Sci-Fi: *"Since you're into Sci-Fi, what aspects of 'Dune' stood out to you most? Was it the epic world-building, or the political intrigue?"*  
- If the user is described as open-minded and mentions a complex film: *"That’s an interesting choice. Given your openness to new experiences, how did you feel about the film’s ambiguous ending? Did you enjoy interpreting it in your own way?"*  

## Critical Rule  
 **You must NEVER give direct recommendations, suggestions, or lists of movies to watch.**   
Your role is to **discuss, question, and reflect**. The recommendation engine is separate.  

If the user asks *“What should I watch?”* or makes any request for recommendations:  
- Do **not** provide a title.  
- Instead, ask clarifying or exploratory questions that guide them to reflect on their own mood, preferences, or goals.  
- The aim is to help the user arrive at their own choice through dialogue.  

*Examples of safe responses:*  
- "That’s an interesting question! What kind of experience are you hoping for right now?"  
- "I’d love to explore that with you — are you leaning toward something light and fun, or something deeper and more thought-provoking?"  
- "Good point! Before jumping into choices, what’s been on your mind lately when it comes to movies?"  

## Formatting Rules  
- Always use double quotes for movie titles (e.g., "Inception").  
- Keep responses conversational, empathetic, and open-ended.
      `;
      const apiMessages = [
        // System message to set the context
        { role: 'system', content: systemPrompt },
        // Include the welcome message as the first assistant message
        { role: 'assistant', content: this.welcomeMessage }
      ];
      
      // Add conversation history (limited to last few exchanges to avoid token limits)
      const recentMessages = this.messages.slice(-6); // Get last 6 messages (3 exchanges)
      recentMessages.forEach(msg => {
        apiMessages.push({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        });
      });
      
      // 获取用户个人资料信息
      let userProfileInfo = '';
      if (this.dynamicUserProfile) {
        const userInput = this.dynamicUserProfile;
        
        // 提取人口统计学信息
        const ageRange = userInput?.demographics?.age_range || '';
        const gender = userInput?.demographics?.gender || '';
        
        // 提取兴趣和喜欢的电影类型
        const likedGenres = userInput?.interests?.liked_genres || [];
        const likedGenresStr = Array.isArray(likedGenres) ? likedGenres.join(', ') : '';
        
        // 提取性格特征
        const personality = userInput?.personality_raw || {};
        
        // 分析性格特征
        let personalityTraits = [];
        
        // 检查所有TIPI量表项目是否存在
        const hasPersonalityData = Object.keys(personality).some(key => key.startsWith('tipi_item_'));
        
        if (hasPersonalityData) {
          // 分析开放性 (Openness)
          if ((personality.tipi_item_5 && personality.tipi_item_5 > 4) || 
              (personality.tipi_item_10 && personality.tipi_item_10 < 4)) {
            personalityTraits.push('open to new experiences');
          }
          
          // 分析尽责性 (Conscientiousness)
          if ((personality.tipi_item_3 && personality.tipi_item_3 > 4) || 
              (personality.tipi_item_8 && personality.tipi_item_8 < 4)) {
            personalityTraits.push('conscientious and organized');
          }
          
          // 分析外向性 (Extraversion)
          if ((personality.tipi_item_1 && personality.tipi_item_1 > 4) || 
              (personality.tipi_item_6 && personality.tipi_item_6 < 4)) {
            personalityTraits.push('extraverted and enthusiastic');
          }
          
          // 分析容易相处性 (Agreeableness)
          if ((personality.tipi_item_7 && personality.tipi_item_7 > 4) || 
              (personality.tipi_item_2 && personality.tipi_item_2 < 4)) {
            personalityTraits.push('agreeable and warm');
          }
          
          // 分析神经质性 (Neuroticism)
          if ((personality.tipi_item_9 && personality.tipi_item_9 > 4) || 
              (personality.tipi_item_4 && personality.tipi_item_4 < 4)) {
            personalityTraits.push('emotionally sensitive');
          }
        }
        
        const personalityStr = personalityTraits.length > 0 ? personalityTraits.join(', ') : '';
        
        // 构建用户资料信息
        userProfileInfo = `
User Profile Information:
${ageRange ? `- Age Range: ${ageRange}` : ''}
${gender ? `- Gender: ${gender}` : ''}
${likedGenresStr ? `- Liked Movie Genres: ${likedGenresStr}` : ''}
${personalityStr ? `- Personality Traits: ${personalityStr}` : ''}

Consider the user profile information above when generating your response.`;
      }
      
      // Add the current user message with user profile information
      apiMessages.push({ role: 'user', content: userMessage + (userProfileInfo ? userProfileInfo : '') });
      
      try {
        const response = await axios.post(`${BASE_URL}/chat/completions`, {
          model: MODEL,
          messages: apiMessages,
          max_tokens: 1000
        }, {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          }
        });
        return response.data.choices[0].message.content;
      } catch (error) {
        console.error('Error fetching GPT-4o response:', error);
        return 'Sorry, I encountered an error while processing your request.';
      }
    },
    async logConversationToFirestore(sender, text) {
      const db = getFirebaseDb();
      if (!db) {
        console.error('Firestore is not initialized');
        return;
      }
      try {
        // 加载用户配置和已有对话记录
        await this.loadUserProfileAndConversations();
        
        if (!this.profileId) {
          console.warn('[FirstRound] No profileId available, skipping Firestore logging');
          return;
        }

        // 构建对话记录
        const conversationTurn = {
          profileId: this.profileId,
          userId: this.dynamicProfiles?.userId || null,
          roundId: "1", // FirstRound的roundId为1
          timestamp: serverTimestamp(),
        };

        // 根据发送者类型添加消息内容
        if (sender === 'user') {
          conversationTurn.userMessage = {
            text: text,
            timestamp: new Date()
          };
        } else if (sender === 'agent') {
          conversationTurn.agentResponse = {
            text: text,
            timestamp: new Date()
          };
        }

        // 保存到conversation_turns集合
        await saveConversationTurn(conversationTurn);
        
        console.log('[FirstRound] Conversation logged to Firestore successfully');
      } catch (error) {
        console.error('[FirstRound] Error logging conversation to Firestore:', error);
      }
    },

    // 加载用户配置和已有对话记录
    async loadUserProfileAndConversations() {
      try {
        // 获取profileId
        const idFromRoute = this.$route?.query?.profileId;
        const idFromLocal = localStorage.getItem('fb_profile_id');
        this.profileId = idFromRoute || idFromLocal;

        if (this.profileId) {
          console.log('[FirstRound] Loading profile data for ID:', this.profileId);
          
          // 读取用户配置
          const data = await getProfilesById(this.profileId);
          if (data) {
            this.dynamicProfiles = data;
            this.dynamicUserProfile = data.userInput; // 设置dynamicUserProfile
            console.log('[FirstRound] Loaded user profile:', data);
            
            // 更新用户画像
            if (data.liked_genres) {
              this.userProfile.in_profile_genres = data.liked_genres;
            } else if (data.userInput?.liked_genres) {
              this.userProfile.in_profile_genres = data.userInput.liked_genres;
            } else if (data.userInput?.favoriteMovieTypes) {
              this.userProfile.in_profile_genres = data.userInput.favoriteMovieTypes;
            } else {
              // 如果没有liked_genres或favoriteMovieTypes，则使用默认值
              this.userProfile.in_profile_genres = ['Animation', 'Sport', 'Family'];
            }
          }

          // 读取已有的对话记录（roundId为1）
          await this.loadExistingConversations();
        }
      } catch (error) {
        console.error('[FirstRound] Failed to load user profile:', error);
      }
    },

      // 读取已有的roundId为1的对话记录
    async loadExistingConversations() {
      try {
        const db = getFirebaseDb();
        const conversationsCollection = collection(db, 'conversation_turns');
        
        // 查询roundId为1且profileId匹配的对话记录
        const q = query(
          conversationsCollection,
          where('profileId', '==', this.profileId),
          where('roundId', '==', '1')
        );
        
        const querySnapshot = await getDocs(q);
        this.existingConversations = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          this.existingConversations.push({
            id: doc.id,
            ...data
          });
        });
        
        console.log(`[FirstRound] Loaded ${this.existingConversations.length} existing conversations for roundId=1`);
        
        // 禁用恢复历史对话记录功能，确保每次刷新页面时不显示之前的聊天记录
        // if (this.existingConversations.length > 0) {
        //   this.restoreExistingConversations();
        // }
        
      } catch (error) {
        console.error('[FirstRound] Failed to load existing conversations:', error);
      }
    },

    // 恢复已有对话到界面
    restoreExistingConversations() {
      // 清空当前消息（除了欢迎消息）
      this.messages = this.messages.filter(msg => msg.sender === 'agent' && msg.text === this.welcomeMessage);
      
      // 按时间戳排序并恢复对话
      const sortedConversations = this.existingConversations.sort((a, b) => 
        new Date(a.timestamp?.toDate ? a.timestamp.toDate() : a.timestamp) - 
        new Date(b.timestamp?.toDate ? b.timestamp.toDate() : b.timestamp)
      );
      
      sortedConversations.forEach(conv => {
        // 添加用户消息
        if (conv.userMessage) {
          this.addMessage({
            sender: 'user',
            text: conv.userMessage.text,
            timestamp: conv.userMessage.timestamp?.toDate ? conv.userMessage.timestamp.toDate() : new Date(conv.userMessage.timestamp)
          });
        }
        
        // 添加AI响应
        if (conv.agentResponse) {
          this.addMessage({
            sender: 'agent',
            text: conv.agentResponse.text,
            timestamp: conv.agentResponse.timestamp?.toDate ? conv.agentResponse.timestamp.toDate() : new Date(conv.agentResponse.timestamp)
          });
        }
      });
      
      console.log('[FirstRound] Restored existing conversations to UI');
    },
    async sendMessage() {
      if (!this.userInput.trim() || this.isSubmitting) {
        return;
      }
      
      this.inputError = '';
      this.isSubmitting = true;
      
      try {
        const userMessage = this.userInput.trim();
        
        // 记录用户发送消息事件
        try {
          await logUserEvent('user_message_sent', {
            messageText: userMessage || '',
            messageLength: userMessage ? userMessage.length : 0,
            profileId: this.profileId || null,
            roundId: '1',
            messageCount: this.userMessageCount + 1
          });
        } catch (error) {
          console.error('Failed to log user message event:', error);
        }
        
        // 添加用户消息到界面
        this.addMessage({
          sender: 'user',
          text: userMessage,
          timestamp: new Date()
        });
        
        // 清空输入框
        this.userInput = '';
        
        // Validate input to prevent code injection
        if (!this.validateUserInput(userMessage)) {
          this.inputError = '请输入有效的文字，不允许输入代码或特殊字符';
          return;
        }
        
        await this.logConversationToFirestore('user', userMessage);
        if (this.messages.length >= this.maxMessages * 2) {
          return;
        }
        
        // Check for movies in user message
        const userMovieDetection = markMoviesInMessage(userMessage, this.$refs.messagesContainer);
        console.log('User message movie detection:', userMovieDetection);
        
        if (userMovieDetection.movies && userMovieDetection.movies.length > 0) {
          console.log(`Found ${userMovieDetection.movies.length} movies in user message:`, userMovieDetection.movies);
          
          // Update movie list in the service
          updateMovieList(userMovieDetection.movies);
          
          // Also directly update local movieStats for immediate UI update
          userMovieDetection.movies.forEach(movie => {
            if (!movie) return; // 跳过空值
            
            const currentCount = this.movieStats.get(movie) || 0;
            const newCount = currentCount + 1;
            console.log(`Updating local movie count: ${movie} from ${currentCount} to ${newCount}`);
            
            // Update both the Map and the reactive object
            this.movieStats.set(movie, newCount);
            // In Vue 3, directly set properties on reactive objects
            this.movieStatsObject[movie] = newCount;
            
            // 强制Vue更新对象
            this.movieStatsObject = {...this.movieStatsObject};
            
            // Create a new map to trigger reactivity
            this.movieStats = new Map(this.movieStats);
            
            // Fetch movie details from OMDB if not already fetched
            if (!this.movieDetailsMap[movie]) {
              this.fetchMovieDetails(movie).then(details => {
                if (details) {
                  // Add movie details to the map (Vue 3 compatible)
                  this.movieDetailsMap[movie] = details;
                  this.movieDetailsMap = { ...this.movieDetailsMap };
                  console.log(`Fetched details for movie: ${movie}`, details);
                }
              });  
            }
          });
          
          // 强制Vue更新对象
          this.movieStatsObject = {...this.movieStatsObject};
          
          // Create a new map to trigger reactivity
          this.movieStats = new Map(this.movieStats);
        }
        
        // 如果这是用户的第一条消息且还未生成推荐，触发电影推荐
        const isFirstUserMessage = this.messages.filter(msg => msg.sender === 'user').length === 1;
        if (isFirstUserMessage && !this.recommendationsGenerated) {
          console.log('检测到用户第一条消息，开始获取电影推荐...');
          this.recommendationsGenerated = true; // 标记已开始生成推荐
          
          // 立即显示打字动画效果
          this.isAgentTyping = true;
          
          // 异步获取电影推荐，不阻塞对话
          this.loadMovieDatasetAndRecommendations().then(() => {
            // 记录电影推荐生成事件
            logUserEvent('movie_recommendations_generated', {
              profileId: this.profileId || null,
              roundId: '1',
              recommendedCount: this.recommendedMovies ? this.recommendedMovies.length : 0,
              userGenres: this.userProfile && this.userProfile.in_profile_genres ? this.userProfile.in_profile_genres : []
            }).catch(error => {
              console.error('Failed to log movie recommendations event:', error);
            });
            
            // 电影推荐生成完成后，关闭打字动画
            this.isAgentTyping = false;
          }).catch(error => {
            console.error('获取电影推荐失败:', error);
            // 即使失败也要关闭打字动画
            this.isAgentTyping = false;
          });
          
          // 对于第一条消息，直接返回，不进行AI对话回复
          this.isSubmitting = false;
          return;
        }

        // 对于非第一条消息，进行正常的AI响应处理
        this.isAgentTyping = true;
        const agentResponse = await this.fetchGPT4oResponse(userMessage);
        this.isAgentTyping = false;
        
        // 直接添加AI响应到对话中，不进行电影提取
        const formattedResponse = this.formatAgentResponse(agentResponse);
        
        this.addMessage({
          sender: 'agent',
          text: formattedResponse,
          timestamp: new Date()
        });
        
        // 创建一个副本用于电影提取，避免影响原始消息
        const responseForExtraction = agentResponse;
        
        // 使用setTimeout将电影提取放入下一个事件循环，避免影响消息渲染
        setTimeout(() => {
          this.extractMoviesWithAPI(responseForExtraction).catch(error => {
            console.error('提取电影失败:', error);
          });
        }, 100);
        
        await logConversation('1', 'agent', agentResponse);
        await this.logConversationToFirestore('agent', agentResponse);
        
        // 重置提交状态，允许用户继续输入
        this.isSubmitting = false;
      } catch (error) {
        console.error('Error sending message:', error);
        this.isSubmitting = false;
      }
    },
    addMessage(message) {
      this.messages.push(message);
      this.$nextTick(() => {
        const container = this.$refs.messagesContainer;
        container.scrollTop = container.scrollHeight;
      });
    },
    formatTime(timestamp) {
      return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },
    
    // Handle movie mention events
    handleMovieMention(event) {
      const { movie, count } = event.detail;
      console.log(`handleMovieMention received: movie=${movie}, count=${count}`);
      
      if (!movie) return; // 跳过空值
      
      // Make sure movie title is clean (no HTML tags)
      // This is a safeguard in case the movieService didn't clean it properly
      const cleanMovieTitle = this.stripHtmlTags(movie).trim();
      if (!cleanMovieTitle) return; // Skip if nothing remains after stripping HTML
      
      // Update the movie stats map
      this.movieStats.set(cleanMovieTitle, count);
      
      // In Vue 3, directly set properties on reactive objects
      this.movieStatsObject[cleanMovieTitle] = count;
      
      // 强制Vue更新对象
      this.movieStatsObject = {...this.movieStatsObject};
      
      // Create a new map to trigger reactivity
      this.movieStats = new Map(this.movieStats);
      
      // Fetch movie details from OMDB if not already fetched
      this.fetchMovieDetailsIfNeeded(cleanMovieTitle);
      
      // Scroll to the bottom of the movie list after Vue updates the DOM
      this.$nextTick(() => {
        this.scrollToBottomOfMovieList();
      });
      
      console.log('Updated movieStatsObject:', this.movieStatsObject);
      console.log('Updated movieStats:', Object.fromEntries(this.movieStats));
    },

    // Save movie set to Firestore recommended_movie_sets collection
    async saveMovieSetToFirestore(selectedMovies, userProfile, userQuery) {
      const db = getFirebaseDb();
      if (!db) {
        console.error('Firestore is not initialized');
        return;
      }

      try {
        if (!this.profileId) {
          console.warn('[FirstRoundConversation] No profileId available, skipping movie set save');
          return;
        }

        // Categorize movies into include/exclude based on user preferences
        const userGenres = userProfile.in_profile_genres || userProfile.favoriteMovieTypes || [];
        const includeMovies = [];
        const excludeMovies = [];

        selectedMovies.forEach(movie => {
          // Check if movie's targetGenre is in user's preferred genres
          const isIncludeType = userGenres.includes(movie.targetGenre);
          
          const movieData = {
            tconst: movie.tconst,
            primaryTitle: movie.primaryTitle,
            originalTitle: movie.originalTitle,
            startYear: movie.startYear,
            genres: movie.genres,
            targetGenre: movie.targetGenre,
            runtimeMinutes: movie.runtimeMinutes || '',
            isAdult: movie.isAdult || '0'
          };

          if (isIncludeType) {
            includeMovies.push(movieData);
          } else {
            excludeMovies.push(movieData);
          }
        });

        // Prepare the document to save
        const movieSetDoc = {
          profileId: this.profileId,
          userId: this.userId || null,
          userQuery: userQuery,
          userProfile: {
            demographics: userProfile.demographics || {},
            preferences: {
              in_profile_genres: userGenres,
              movie_types: userProfile.in_profile_genres || userProfile.favoriteMovieTypes || []
            }
          },
          movieSet: {
            includeMovies: {
              genres: [...new Set(includeMovies.map(m => m.targetGenre))],
              count: includeMovies.length,
              movies: includeMovies
            },
            excludeMovies: {
              genres: [...new Set(excludeMovies.map(m => m.targetGenre))],
              count: excludeMovies.length,
              movies: excludeMovies
            },
            totalCount: selectedMovies.length
          },
          metadata: {
            generatedAt: serverTimestamp(),
            roundId: '1',
            experimentType: 'first_round_conversation',
            selectionAlgorithm: '12movies_utility_v2'
          }
        };

        // Save to Firestore
        const docRef = await addDoc(collection(db, 'recommended_movie_sets'), movieSetDoc);
        
        console.log('[FirstRoundConversation] Movie set saved to Firestore with ID:', docRef.id);
        console.log('[FirstRoundConversation] Saved movie set structure:', {
          includeCount: includeMovies.length,
          excludeCount: excludeMovies.length,
          includeGenres: [...new Set(includeMovies.map(m => m.targetGenre))],
          excludeGenres: [...new Set(excludeMovies.map(m => m.targetGenre))]
        });

      } catch (error) {
        console.error('[FirstRoundConversation] Error saving movie set to Firestore:', error);
      }
    },

    async finishConversation() {
      // 检查消息数量是否足够
      if (this.userMessageCount < this.minRequiredMessages) {
        alert(`Please send at least ${this.minRequiredMessages} messages before proceeding to the questionnaire.`);
        return;
      }
      
      // 检查评分数量是否足够
      const ratedCount = Object.keys(this.movieRatings).length;
      if (ratedCount < 4 || ratedCount > 6) {
        alert('Please rate 4-6 movies as your top choices before proceeding to the questionnaire.');
        return;
      }
      
      // 记录完成对话事件
      try {
        await logUserEvent('conversation_finished', {
          profileId: this.profileId || null,
          roundId: '1',
          totalMessages: this.messages ? this.messages.length : 0,
          userMessages: this.userMessageCount || 0,
          ratedMovies: this.movieRatings ? Object.keys(this.movieRatings).length : 0,
          watchlistMovies: this.watchlist ? this.watchlist.length : 0,
          movieRatings: this.movieRatings || {},
          watchlist: this.watchlist || []
        });
      } catch (error) {
        console.error('Failed to log conversation finish event:', error);
      }
      
      // 最终检查
      if (!this.canProceed) {
        return;
      }
      this.isSubmitting = true;
      try {
        // Log the event
        logUserEvent('finish_first_round', {
          messageCount: this.messages.length,
          userMessageCount: this.userMessageCount
        });

        // Save the conversation to localStorage
        localStorage.setItem('firstRoundMessages', JSON.stringify(this.messages));
        
        // 收集所有电影评分数据
        const movieRatingsData = Object.entries(this.movieRatings).map(([title, rating]) => ({
          title: title,
          rating: rating,
          mention_count: this.movieStatsObject[title] || 1
        }));
        
        // Record conversation completion event with movie ratings
        logUserEvent({
          event_type: 'conversation_completed',
          round: 'first',
          message_count: this.messages.length,
          user_message_count: this.userMessageCount,
          movie_ratings: movieRatingsData
        });
        
        // 注意：在这里不调用completeCurrentSystem()，因为完成标记应该在问卷提交时进行
        // 强制导航到FirstRoundQuestionnaire，而不是使用getCurrentQuestionnaireRoute()
        console.log('从 FirstRoundConversation 导航到 FirstRoundQuestionnaire');
        this.$router.push('/first-round-questionnaire');
      } catch (error) {
        console.error('Error completing first round:', error);
        this.isSubmitting = false;
        alert('There was an error completing this round. Please try again.');
      }
    },
    
    // 恢复本地存储的数据
    // 清空本地存储的数据
    clearLocalStorage() {
      try {
        // 清空电影统计数据
        localStorage.removeItem('movieStats');
        // 清空电影评分数据
        localStorage.removeItem('movieRatings');
        // 清空推荐电影数据
        localStorage.removeItem('recommendedMovies');
        // 清空其他可能存在的相关数据
        localStorage.removeItem('watchlist');
        
        console.log('Cleared all movie-related data from localStorage');
        
        // 重置内存中的数据
        this.movieStats = new Map();
        this.movieStatsObject = {};
        this.movieRatings = {};
        this.recommendedMovies = [];
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }
    },
    
    restoreLocalStorage() {
      try {
        const savedMovieStats = localStorage.getItem('movieStats');
        if (savedMovieStats) {
          const parsedStats = JSON.parse(savedMovieStats);
          this.movieStatsObject = parsedStats;
          this.movieStats = new Map(Object.entries(parsedStats));
          console.log('Restored movie stats from localStorage:', parsedStats);
        }
      } catch (error) {
        console.error('Error restoring movie stats from localStorage:', error);
      }
    },
    
    // 保存消息到Firebase
    async saveMessageToFirebase(sender, text) {
      try {
        await this.logConversationToFirestore(sender, text);
      } catch (error) {
        console.error('Error saving message to Firebase:', error);
      }
    },
    
    /**
     * Helper function to strip HTML tags from a string
     * @param {string} html - String that may contain HTML tags
     * @returns {string} String with HTML tags removed
     */
    stripHtmlTags(html) {
      if (!html || typeof html !== 'string') return '';
      return html.replace(/<\/?[^>]+(>|$)/gi, '');
    },
    
    // Validate user input to prevent code injection
    validateUserInput(input) {
      if (!input) return false;
      
      // Check for potential code or script injection
      const codePatterns = [
        /<script/i,                // HTML script tags
        /<\/?[a-z][\s\S]*>/i,     // HTML tags
        /\$\{.*\}/,               // Template literals
        /function\s*\(/,          // JavaScript functions
        /=>\s*\{/,                // Arrow functions
        /eval\s*\(/,              // eval calls
        /document\./,             // DOM manipulation
        /window\./,               // Window object
        /\bvar\b|\blet\b|\bconst\b/ // Variable declarations
      ];
      
      // If any code pattern is found, return false
      for (const pattern of codePatterns) {
        if (pattern.test(input)) {
          return false;
        }
      }
      
      return true;
    }
  }
};
</script>

<style scoped>
body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
}
.input-error-message {
  color: #ff3860;
  font-size: 0.85rem;
  margin-top: 0.25rem;
  margin-bottom: 0.5rem;
  text-align: left;
}
/* Page Layout */
.page-container {
  display: flex;
  width: 100%;
  min-height: 100vh;
  background-color: #f8f9fa;
  justify-content: space-between;
}

/* Sidebar Styles */
.sidebar {
  width: 25%;
  padding: 20px;
  background-color: white;
  box-shadow: 0 0 10px rgba(0,0,0,0.05);
  overflow-y: auto;
  height: 100vh;
  position: sticky;
  top: 0;
}

.sidebar-title {
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: #333;
  text-align: center;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.agent-profile-sidebar {
  border-right: 1px solid #eee;
}

.movie-recommendations-sidebar {
  border-left: 1px solid #eee;
  width: 26%;
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.movie-list {
  max-height: calc(100vh - 100px);
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

/* Agent Profile Styles */
.agent-profile {
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 8px;
  background-color: #f8f9fa;
}

.agent-avatar-container {
  width: 120px;
  height: 120px;
  margin: 0 auto 15px;
  display: flex;
  justify-content: center;
}

.agent-profile-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: contain;
  border: 2px solid #ddd;
}

.agent-info {
  text-align: center;
}

.agent-role {
  margin: 0 0 10px 0;
  font-size: 1.2rem;
  color: #333;
}

.agent-description {
  margin: 0;
  font-size: 0.9rem;
  color: #666;
  line-height: 1.5;
  text-align: left;
}

/* Movie Card Styles */
.movie-card {
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 8px;
  background-color: #f8f9fa;
  border-left: 4px solid #ddd;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  min-width: 260px;
  width: 100%;
}

/* Movie Explanation Styles */
.movie-explanation {
  margin: 8px 0 12px;
  font-size: 0.9rem;
  color: #555;
  line-height: 1.4;
  font-style: italic;
  background-color: #f0f0f0;
  padding: 8px 10px;
  border-radius: 6px;
  border-left: 3px solid #2196f3;
}

.movie-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  /* 删除了橙色边框 */ 
}

/* Movies Grid for Right Sidebar */
.movies-grid {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* Enhanced Movie Card Styles */
.movie-card {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 10px;
  padding: 15px;
  transition: transform 0.2s, box-shadow 0.2s;
  margin-bottom: 15px;
}

.movie-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.movie-header {
  margin-bottom: 10px;
}

.movie-title {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 1.1em;
  font-weight: bold;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.movie-year {
  margin: 4px 0;
  color: #28a745;
  font-weight: 500;
  font-size: 0.9em;
}

.movie-genre {
  margin: 4px 0;
  color: #6c757d;
  font-style: italic;
  font-size: 0.85em;
}

.movie-rating {
  margin: 4px 0;
  color: #666;
  font-size: 0.9em;
}

.watchlist-button-container {
  margin-top: 10px;
}

.watchlist-btn {
  padding: 6px 12px;
  background-color: #8d6e63;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s ease;
}

.watchlist-btn:hover {
  background-color: #6d4c41;
  transform: translateY(-1px);
  box-shadow: 0 3px 5px rgba(141, 110, 99, 0.3);
}

.movie-rating-stars {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9em;
}

.stars {
  display: flex;
  gap: 2px;
}

.star {
  color: #ddd;
  cursor: pointer;
  font-size: 16px;
  transition: color 0.2s;
}

.star:hover,
.star.filled {
  color: #ffc107;
}

.movie-details-container {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.movie-poster-container {
  flex-shrink: 0;
  width: 60px;
  height: 90px;
  border-radius: 6px;
  overflow: hidden;
  background-color: #f0f0f0;
}

.movie-poster {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.movie-info {
  flex: 1;
  min-width: 0;
}

.movie-title {
  margin: 0 0 8px 0;
  font-size: 1rem;
  color: #333;
  font-weight: bold;
}

.recommendation-count {
  margin: 0 0 5px 0;
  font-size: 0.85rem;
  color: #666;
}

.movie-director {
  margin: 0 0 5px 0;
  font-size: 0.9rem;
  color: #666;
}

.movie-rating {
  margin: 0;
  font-size: 0.9rem;
  color: #666;
}

.imdb-link-hint {
  font-size: 0.8rem;
  color: #f5c518; /* IMDB黄色 */
  margin-left: 5px;
  font-style: italic;
}

/* 用户评分样式 */
.user-rating-container {
  margin-top: 5px;
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
}

.rating-label {
  margin: 0 4px 0 0;
  font-size: 0.85rem;
  color: #666;
  white-space: nowrap;
}

.star-rating {
  display: flex;
  gap: 2px;
  flex-wrap: nowrap;
}

.star {
  color: #ddd;
  cursor: pointer;
  font-size: 1rem;
  transition: color 0.2s;
  display: inline-block;
}

.star:hover {
  color: #ffcc00;
}

.star.active {
  color: #ffcc00;
}

.rating-value {
  margin-left: 4px;
  font-size: 0.85rem;
  color: #666;
}

/* Color coding based on mention count */
.recommendation-count-1 {
  border-left-color: #ddd;
}

.recommendation-count-2 {
  border-left-color: #4caf50;
  background-color: #f7fff7;
}

.recommendation-count-3 {
  border-left-color: #2196f3;
  background-color: #f0f8ff;
}

.recommendation-count-4 {
  border-left-color: #9c27b0;
  background-color: #faf0ff;
}

.recommendation-count-5 {
  border-left-color: #e91e63;
  background-color: #fff0f5;
  font-weight: bold;
}

/* Watchlist styles */
.movie-card.in-watchlist {
  background-color: #f5f0e6; /* Brown background */
  border-left: 4px solid #8d6e63; /* Brown border */
}

.watchlist-button-container {
  margin-top: 8px;
  display: flex;
  justify-content: center;
}

.watchlist-btn {
  padding: 6px 12px;
  background-color: #8d6e63;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s ease;
}

.watchlist-btn:hover {
  background-color: #6d4c41;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 3px 5px rgba(141, 110, 99, 0.3);
}

.movie-count-summary {
  font-size: 14px;
  color: #666;
  margin-bottom: 15px;
  padding: 8px 10px;
  background-color: #f0f0f0;
  border-radius: 6px;
  text-align: center;
  font-weight: 500;
  border-left: 4px solid #2196f3;
}

.no-recommendations {
  text-align: center;
  padding: 20px 15px;
  color: #888;
  font-style: italic;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 15px;
  border: 1px dashed #ddd;
}

/* Conversation Container */
.conversation-container {
  flex: 1;
  padding: 20px;
  max-width: 48%;
}

.conversation-card {
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  padding: 20px;
  margin-bottom: 20px;
}

.card-title {
  font-size: 1.8rem;
  margin-bottom: 10px;
  color: #333;
  text-align: center;
}

.conversation-description {
  color: #666;
  margin-bottom: 20px;
  text-align: center;
  font-size: 0.95rem;
  line-height: 1.5;
}

.conversation-area {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 200px);
  border-radius: 8px;
  overflow: hidden;
  background-color: #ffffff;
  box-shadow: inset 0 0 5px #ffffff;
  margin-bottom: 1.5rem;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}



/* Message Styles */
.message {
  display: flex;
  margin-bottom: 15px;
  position: relative;
  animation: fadeIn 0.3s ease-in-out;
}

.agent-avatar {
  margin-right: 10px;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ddd;
}

.user-message {
  flex-direction: row-reverse;
  max-width: 80%;
  margin-left: auto;
}

.agent-message {
  max-width: 80%;
  margin-right: auto;
}

.user-message .message-content {
  background-color: #e3f2fd;
  color: #333;
  border-radius: 18px 18px 0 18px;
}

.agent-message .message-content {
  background-color: #ffffff !important;
  color: #333;
  border-radius: 0 18px 18px 18px;
}

.message-content {
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  position: relative;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.message-text {
  margin: 0;
  line-height: 1.5;
  white-space: pre-wrap;
}

.message-text br {
  display: block;
  content: "";
  margin-top: 0.3rem;
}

.message-time {
  display: block;
  font-size: 0.75rem;
  color: #999;
  margin-top: 5px;
}

.typing-indicator {
  padding: 10px;
}

.typing-dots {
  display: flex;
  align-items: center;
  justify-content: center;
}

.typing-dots span {
  height: 8px;
  width: 8px;
  margin: 0 2px;
  background-color: #bbb;
  border-radius: 50%;
  display: inline-block;
  animation: typingAnimation 1.4s infinite ease-in-out both;
}

.typing-dots span:nth-child(1) {
  animation-delay: 0s;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
  margin-right: 0;
}

.typing-label {
  margin-left: 10px;
  font-size: 0.9rem;
  color: #666;
  font-style: italic;
}

@keyframes typingAnimation {
  0%, 80%, 100% { 
    transform: scale(0.6);
  } 
  40% { 
    transform: scale(1.0);
  }
}

.input-area {
  display: flex;
  padding: 15px;
  background-color: white;
  border-top: 1px solid #eee;
}

.message-input {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 20px;
  resize: none;
  height: 45px;
  font-size: 0.95rem;
  transition: border-color 0.3s;
  font-family: inherit;
}

.message-input:focus {
  outline: none;
  border-color: #4caf50;
}

.send-btn {
  margin-left: 10px;
  padding: 0 20px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.send-btn:hover {
  background-color: #388e3c;
}

.send-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.conversation-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
}

.proceed-requirements {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 10px;
}

.messages-remaining {
  color: #666;
  font-size: 0.9rem;
}

.rating-reminder {
  color: #e74c3c;
  font-size: 0.9rem;
  font-weight: 500;
}

.next-btn {
  padding: 10px 20px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
  min-width: 200px;
}

.next-btn:hover {
  background-color: #1976d2;
}

.next-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Movie mention styles */
.movie-mention {
  font-weight: bold;
  color: #2196f3;
  text-decoration: underline;
  cursor: pointer;
  transition: color 0.2s ease;
}

.movie-mention:hover {
  color: #1976d2;
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .page-container {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    height: auto;
    position: relative;
  }
  
  .conversation-container {
    max-width: 100%;
  }
  
  .movie-list {
    display: flex;
    overflow-x: auto;
    padding-bottom: 15px;
  }
  
  .movie-card {
    min-width: 250px;
    margin-right: 15px;
  }
}

@media (max-width: 768px) {
  .conversation-card {
    padding: 1.5rem;
  }
  
  .conversation-area {
    height: 400px;
  }
  
  .message {
    max-width: 90%;
  }
}

/* Welcome Message Styles */
.welcome-message {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 20px;
}

.welcome-content {
  max-width: 600px;
  text-align: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 40px 30px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.welcome-content h3 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: 600;
}

.welcome-content > p {
  margin: 0 0 25px 0;
  color: #34495e;
  font-size: 1rem;
  line-height: 1.6;
}

.welcome-prompts {
  text-align: left;
  margin: 25px 0;
  background: rgba(255, 255, 255, 0.7);
  padding: 20px;
  border-radius: 12px;
  border-left: 4px solid #3498db;
}

.prompt-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 15px;
  font-size: 0.95rem;
  line-height: 1.5;
}

.prompt-item:last-child {
  margin-bottom: 0;
}

.prompt-icon {
  font-size: 1.2rem;
  margin-right: 12px;
  margin-top: 2px;
  flex-shrink: 0;
}

.prompt-item strong {
  color: #2c3e50;
  margin-right: 6px;
}

.prompt-item em {
  color: #7f8c8d;
  font-style: italic;
  margin-left: 4px;
}

.welcome-footer {
  margin: 25px 0 15px 0 !important;
  color: #2c3e50;
  font-weight: 500;
  font-size: 1rem;
}

/* Disabled button and rating styles */
.watchlist-btn.disabled {
  background-color: #ccc !important;
  color: #666 !important;
  cursor: not-allowed !important;
  opacity: 0.6;
}

.watchlist-btn:disabled {
  background-color: #ccc !important;
  color: #666 !important;
  cursor: not-allowed !important;
  opacity: 0.6;
}

.stars.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.star.disabled {
  color: #ccc !important;
  cursor: not-allowed !important;
  opacity: 0.5;
}
</style>
