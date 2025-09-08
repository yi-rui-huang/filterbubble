<template>
  <div class="page-container">
    <!-- Left Column: Agent Profiles -->
    <div class="sidebar agent-profiles-sidebar">
      <h3 class="sidebar-title">Movie Discussion Agents</h3>
      <div class="agent-list">
        <div 
          v-for="(agent, key) in agentProfiles.agents" 
          :key="key" 
          class="agent-profile-card"
          :data-agent-key="key"
          @click="setActiveAgent(key)"
          :class="{'active': activeAgent === key}"
        >
          <div class="agent-avatar-container">
            <img :src="getAgentAvatar(key)" class="agent-profile-avatar" alt="Agent Avatar">
          </div>
          <div class="agent-info">
            <h4 class="agent-role">{{ agent.role }}</h4>
            <p class="agent-description" v-html="agent.description"></p>
          </div>
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
            <div 
              v-for="(message, index) in messages" 
              :key="index" 
              :class="['message', message.sender === 'user' ? 'user-message' : 'agent-message']"
            >
              <div v-if="message.sender === 'agent'" class="agent-avatar">
                <img src="../images/gpt_logo.png" alt="Agent Avatar" class="avatar-image">
              </div>
              <div class="message-content">
                <div class="message-text">{{ stripAllFormatting(message.text) }}</div>
                <span class="message-time">{{ formatTime(message.timestamp) }}</span>
              </div>
            </div>
            
            <div v-if="isAgentTyping" class="message agent-message typing-indicator">
              <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
          
          <div class="input-area">
            <textarea 
              ref="messageInput"
              v-model="userInput" 
              class="message-input" 
              placeholder="Type your message here..." 
              @keydown.enter.prevent="sendMessage"
              @input="handleInput"
            ></textarea>
            
            <!-- @ Mention List -->
            <div v-if="showMentionList" class="mention-list" :style="{ top: mentionPosition.top + 'px', left: mentionPosition.left + 'px' }">
              <div class="mention-list-header">
                <input 
                  type="text" 
                  v-model="mentionFilterText" 
                  placeholder="Search agents..." 
                  class="mention-filter-input"
                >
              </div>
              <div class="mention-list-body">
                <div 
                  v-for="agent in getFilteredAgents()" 
                  :key="agent" 
                  class="mention-list-item"
                  @click="selectAgent(agent)"
                >
                  {{ agent }}
                </div>
              </div>
            </div>
            
            <div v-if="inputError" class="input-error-message">{{ inputError }}</div>
            <button 
              class="btn send-btn" 
              @click="sendMessage" 
              :disabled="!userInput.trim() || isSubmitting || isAgentTyping"
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
        <div v-if="Object.keys(movieStatsObject).length === 0" class="no-recommendations">
          <p>Movies will appear here as they are mentioned in the conversation.</p>
        </div>
        <div v-else>
          <!--<p class="movie-count-summary">{{ Object.keys(movieStatsObject).length }} movies mentioned</p>-->
          <!-- 按提及次数排序电影 -->
          <div 
            v-for="[movieTitle, count] in sortedMovies" 
            :key="movieTitle"
            class="movie-card"
            :class="[`recommendation-count-${Math.min(count, 5)}`, movieInWatchlist(movieTitle) ? 'in-watchlist' : '']"
          >
            <div class="movie-details-container" @click="scrollToMovieMention(movieTitle)" :style="{ cursor: 'pointer' }">
              <div v-if="movieDetailsMap[movieTitle]?.Poster && movieDetailsMap[movieTitle].Poster !== 'N/A'" class="movie-poster-container" @click.stop="openImdbPage(movieTitle)">
                <img :src="encodeURI(movieDetailsMap[movieTitle].Poster)" :alt="movieTitle + ' poster'" class="movie-poster" :title="'Click to open IMDB page for ' + movieTitle">
              </div>
              <div class="movie-info">
                <div :title="movieTitle" style="width: 100%; max-width: 180px; height: 21px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 16px; font-weight: bold; color: #333; margin: 0 0 5px 0; padding: 0; box-sizing: border-box; display: block; min-height: 21px; max-height: 21px; line-height: 21px;">{{ movieTitle }}</div>
                <p v-if="movieDetailsMap[movieTitle]?.imdbRating && movieDetailsMap[movieTitle].imdbRating !== 'N/A'" class="movie-rating">
                  IMDB: {{ movieDetailsMap[movieTitle].imdbRating }}
                  <span v-if="movieDetailsMap[movieTitle]?.imdbID" class="imdb-link-hint"></span>
                </p>
                
                <!-- Watchlist button (only visible when not in watchlist) -->
                <div class="watchlist-button-container" v-if="!movieInWatchlist(movieTitle)">
                  <button class="btn watchlist-btn" @click.stop="addToWatchlist(movieTitle)">
                    <i class="fas fa-plus"></i> Add to Watchlist
                  </button>
                </div>
                
                <!-- 用户评分系统 (only visible when in watchlist) -->
                <div class="user-rating-container" v-if="movieInWatchlist(movieTitle)">
                  <p class="rating-label">Your rating:</p>
                  <div class="star-rating">
                    <span 
                      v-for="star in 5" 
                      :key="star" 
                      class="star" 
                      :class="{ 'active': movieRatings[movieTitle] >= star }" 
                      @click.stop="rateMovie(movieTitle, star)"
                    >
                      ★
                    </span>
                  </div>
                  <span v-if="movieRatings[movieTitle]" class="rating-value">{{ movieRatings[movieTitle] }}/5</span>
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
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { API_KEY, BACKUP_API_KEY, BASE_URL, MODEL, API_TIMEOUT } from '../config';
import agentProfiles from '../data/agent_profiles.json';
import p1Image from '../images/p1.png';
import p2Image from '../images/p2.png';
import p3Image from '../images/p3.png';
import p4Image from '../images/p4.png';

export default {
  name: 'FirstRoundConversation',
  data() {
    return {
      userInput: '',
      messages: [],
      isAgentTyping: false,
      isSubmitting: false,
      minRequiredMessages: 5,
      maxMessages: 10,
      welcomeMessage: "Hi there! I'm your AI assistant for movie recommendations, and I'm here to help you discover movies you'll enjoy. To get started, feel free to tell me a bit about what you're in the mood for—like what kind of movies you enjoy, or who you'll be watching with. Let's find something great together!",
      moviesData: [],
      movieMentions: new Map(),
      movieStats: new Map(),
      movieStatsObject: {},
      movieDetailsMap: {},
      inputError: '',
      movieRatings: {}, // 存储用户对电影的评分
      watchlist: {}, // 存储用户的观影清单
      recommendedMovies: [], // 存储从API获取的推荐电影
      agentProfiles: agentProfiles, // 导入智能体配置文件
      activeAgent: null, // 当前选中的智能体
      showMentionList: false, // 控制@提及列表的显示
      mentionPosition: { top: 0, left: 0 }, // @提及列表的位置
      mentionFilterText: '' // @提及列表的过滤文本
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
      
      // 检查用户是否对至少三部电影进行了评分
      const ratedMoviesCount = Object.keys(this.movieRatings).length;
      const hasEnoughRatings = ratedMoviesCount >= 3;
      
      return hasEnoughMessages && hasEnoughRatings;
    },
    
    // 获取用户已评分的电影数量
    ratedMoviesCount() {
      return Object.keys(this.movieRatings).length;
    },
    
    // 检查是否需要显示评分提示
    needRatingReminder() {
      return this.userMessageCount >= this.minRequiredMessages && this.ratedMoviesCount < 3;
    },
    // 按提及次数排序的电影列表
    sortedMovies() {
      // 将对象转换为数组并排序
      return Object.entries(this.movieStatsObject)
        .sort((a, b) => b[1] - a[1]); // 按计数降序排序
    }
  },
  created() {
    logUserEvent('view_first_round_conversation');
    this.addMessage({
      sender: 'agent',
      text: this.welcomeMessage,
      timestamp: new Date()
    });
    
    // 注释掉本地电影数据加载
    // loadMoviesData().then(data => {
    //   this.moviesData = data;
    //   console.log('Loaded movie data:', data);
    // });
    
    // 从外部API获取推荐电影列表
    this.fetchMovieRecommendationsFromAPI();
    
    // 从localStorage恢复电影统计数据（如果有）
    try {
      const savedMovieStats = localStorage.getItem('movieStats');
      if (savedMovieStats) {
        const parsedStats = JSON.parse(savedMovieStats);
        console.log('Restored movie stats from localStorage:', parsedStats);
        
        // 恢复到Map和对象
        this.movieStatsObject = parsedStats;
        this.movieStats = new Map(Object.entries(parsedStats));
        
        // 尝试为已知电影获取详细信息
        console.log('Attempting to fetch details for restored movies');
        Object.keys(parsedStats).forEach(movieTitle => {
          this.fetchMovieDetailsIfNeeded(movieTitle);
        });
      }
    } catch (error) {
      console.error('Error restoring movie stats:', error);
    }
    
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
    const savedWatchlist = localStorage.getItem('watchlist');
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
  mounted() {
    this.$refs.messageInput.focus();
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
      localStorage.setItem('watchlist', JSON.stringify(this.watchlist));
      console.log('Saved watchlist to localStorage:', this.watchlist);
    } catch (error) {
      console.error('Error saving watchlist:', error);
    }
  },
  methods: {
    getAgentAvatar(agentType) {
      const avatarMap = {
        'moderator': p1Image,
        'professional_critic': p2Image,
        'indie_enthusiast': p3Image,
        'blockbuster_fan': p4Image
      };
      
      return avatarMap[agentType] || p1Image; // Default to moderator avatar if type not found
    },
    setActiveAgent(agentKey) {
      this.activeAgent = agentKey;
      // Focus on the input field and add @ mention
      this.$refs.messageInput.focus();
      
      // Map agent types to their full names
      const agentNameMap = {
        'professional_critic': 'Ethan Maxwell',
        'indie_enthusiast': 'Maya Cole',
        'blockbuster_fan': 'Jake Robinson',
        'moderator': 'Moderator'
      };
      
      // Get the agent's name or role
      const agentName = agentNameMap[agentKey] || this.agentProfiles.agents[agentKey].role;
      
      // Check if current input already contains @mention
      if (this.userInput.trim()) {
        // If there's content, check if it already contains this agent's @mention
        if (!this.userInput.includes(`@${agentName}`)) {
          // If not, add @mention at the end
          this.userInput = this.userInput.trim() + ` @${agentName} `;
        }
      } else {
        // If input is empty, directly add @mention
        this.userInput = `@${agentName} `;
      }
    },
    
    handleInput(event) {
      // Clear any input error
      this.inputError = '';
      
      // Check if the @ character was just typed
      const currentValue = event.target.value;
      const cursorPosition = event.target.selectionStart;
      const currentChar = currentValue[cursorPosition - 1];
      
      if (currentChar === '@') {
        // Calculate position for the mention list
        const inputRect = event.target.getBoundingClientRect();
        const caretCoords = this.getCaretCoordinates(event.target, cursorPosition);
        
        this.mentionPosition = {
          top: inputRect.top + caretCoords.top - 120, // Position above the caret
          left: inputRect.left + caretCoords.left
        };
        
        this.showMentionList = true;
        this.mentionFilterText = '';
      } else {
        // Check if we're in the middle of a mention
        const textBeforeCursor = currentValue.substring(0, cursorPosition);
        const atSymbolIndex = textBeforeCursor.lastIndexOf('@');
        
        if (atSymbolIndex !== -1 && !textBeforeCursor.substring(atSymbolIndex).includes(' ')) {
          this.mentionFilterText = textBeforeCursor.substring(atSymbolIndex + 1);
          this.showMentionList = true;
          
          // Update position for the mention list
          const inputRect = event.target.getBoundingClientRect();
          const caretCoords = this.getCaretCoordinates(event.target, cursorPosition);
          
          this.mentionPosition = {
            top: inputRect.top + caretCoords.top - 120, // Position above the caret
            left: inputRect.left + caretCoords.left - (cursorPosition - atSymbolIndex) * 8 // Adjust for character width
          };
        } else {
          this.showMentionList = false;
        }
      }
    },
    
    getCaretCoordinates(element, position) {
      // This is a simplified version - for a more accurate implementation,
      // consider using a library like textarea-caret-position
      const lineHeight = parseInt(getComputedStyle(element).lineHeight);
      const text = element.value.substring(0, position);
      const lines = text.split('\n').length;
      
      return {
        top: lines * lineHeight,
        left: position * 8 % (element.clientWidth - 20) // Approximate character width
      };
    },
    
    getFilteredAgents() {
      const filteredAgents = [];
      
      // Add agent names
      if ('Ethan Maxwell'.toLowerCase().includes(this.mentionFilterText.toLowerCase())) {
        filteredAgents.push('Ethan Maxwell');
      }
      
      if ('Maya Cole'.toLowerCase().includes(this.mentionFilterText.toLowerCase())) {
        filteredAgents.push('Maya Cole');
      }
      
      if ('Jake Robinson'.toLowerCase().includes(this.mentionFilterText.toLowerCase())) {
        filteredAgents.push('Jake Robinson');
      }
      
      return filteredAgents;
    },
    
    selectAgent(agentName) {
      const currentValue = this.userInput;
      const cursorPosition = this.$refs.messageInput.selectionStart;
      const textBeforeCursor = currentValue.substring(0, cursorPosition);
      const atSymbolIndex = textBeforeCursor.lastIndexOf('@');
      
      if (atSymbolIndex !== -1) {
        // Replace the @partial_text with the selected agent name
        const textBeforeAt = currentValue.substring(0, atSymbolIndex);
        const textAfterCursor = currentValue.substring(cursorPosition);
        
        this.userInput = textBeforeAt + '@' + agentName + ' ' + textAfterCursor;
        
        // Set the cursor position after the inserted agent name
        setTimeout(() => {
          const newCursorPosition = atSymbolIndex + agentName.length + 2; // +2 for @ and space
          this.$refs.messageInput.focus();
          this.$refs.messageInput.setSelectionRange(newCursorPosition, newCursorPosition);
        }, 0);
      }
      
      this.showMentionList = false;
    },
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
    addToWatchlist(movieTitle) {
      // 更新观影清单
      this.watchlist = {
        ...this.watchlist,
        [movieTitle]: true
      };
      
      // 记录添加到观影清单事件
      logUserEvent({
        event_type: 'add_to_watchlist',
        movie_title: movieTitle,
        round: 'first',
        mention_count: this.movieStatsObject[movieTitle] || 1
      });
      
      console.log(`用户将电影 "${movieTitle}" 添加到观影清单`);
    },
    
    // 检查电影是否在观影清单中
    movieInWatchlist(movieTitle) {
      return Boolean(this.watchlist[movieTitle]);
    },
    
    // 对电影进行评分
    rateMovie(movieTitle, rating, event) {
      // 确保电影已添加到观影清单
      if (!this.movieInWatchlist(movieTitle)) {
        this.addToWatchlist(movieTitle);
      }
      
      // 更新电影评分 (Vue 3 兼容方式)
      this.movieRatings = {
        ...this.movieRatings,
        [movieTitle]: rating
      };
      
      // 记录评分事件
      logUserEvent({
        event_type: 'movie_rating',
        movie_title: movieTitle,
        rating: rating,
        round: 'first',
        mention_count: this.movieStatsObject[movieTitle] || 1
      });
      
      console.log(`用户对电影 "${movieTitle}" 评分: ${rating}/5`);
    },
    
    // 打开电影的IMDB页面
    openImdbPage(movieTitle) {
      const movieDetails = this.movieDetailsMap[movieTitle];
      if (movieDetails && movieDetails.imdbID) {
        let url;
        if (movieDetails.imdbID.startsWith('tmdb-')) {
          // 如果是TMDB ID，则打开TMDB页面
          const tmdbId = movieDetails.imdbID.replace('tmdb-', '');
          url = `https://www.themoviedb.org/movie/${tmdbId}`;
        } else {
          // 否则打开IMDB页面
          url = `https://www.imdb.com/title/${movieDetails.imdbID}/`;
        }
        window.open(url, '_blank');
        console.log(`Opening movie page for "${movieTitle}": ${url}`);
      } else {
        console.log(`No ID available for "${movieTitle}"`);
      }
    },
    // Fetch movie details from OMDB API
    async fetchMovieDetails(movieTitle) {
      console.log(`Attempting to fetch details for: "${movieTitle}"`);
      try {
        const url = `https://www.omdbapi.com/?apikey=7e374f8b&t=${encodeURIComponent(movieTitle)}`;
        console.log(`Making request to: ${url}`);
        const response = await axios.get(url);
        console.log(`OMDB API response:`, response.data);
        if (response.data.Response === 'True') {
          return response.data;
        }
        console.log(`No valid data returned for "${movieTitle}"`);
        return null;
      } catch (error) {
        console.error('Error fetching movie details:', error);
        return null;
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
      //text = text.replace(/([.!?])\s{1,}([A-Z])/g, '$1<br><br>$2');
      
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
    // 从外部API获取电影推荐列表
    async fetchMovieRecommendationsFromAPI() {
      try {
        console.log('正在从外部API获取电影推荐列表...');
        
        // 使用TMDB API获取热门电影列表
        const TMDB_API_KEY = '3e1dd42e6a047c4b4a4c99d2c1e9a1c2'; // 请替换为您自己的API密钥
        const response = await axios.get(
          `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`
        );
        
        if (response.data && response.data.results) {
          console.log('成功获取推荐电影列表:', response.data.results);
          this.recommendedMovies = response.data.results;
          
          // 将获取到的电影添加到推荐列表中
          this.recommendedMovies.slice(0, 10).forEach(movie => {
            const movieTitle = movie.title;
            // 更新电影统计数据
            this.movieStats.set(movieTitle, 1); // 初始计数为1
            this.movieStatsObject[movieTitle] = 1;
            
            // 将TMDB电影数据转换为OMDB格式以兼容现有代码
            const movieDetails = {
              Title: movie.title,
              Year: movie.release_date ? movie.release_date.substring(0, 4) : '',
              Poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'N/A',
              Plot: movie.overview,
              imdbRating: (movie.vote_average / 2).toFixed(1), // TMDB评分是10分制，转换为5分制
              imdbID: `tmdb-${movie.id}` // 创建一个伪IMDB ID
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
        console.error('获取电影推荐列表失败:', error);
      }
    },
    
    fetchMovieDetailsIfNeeded(movieTitle) {
      if (!movieTitle || this.movieDetailsMap[movieTitle]) {
        console.log(`Skipping fetch for "${movieTitle}": ${!movieTitle ? 'Empty title' : 'Already in cache'}`);
        return;
      }
      
      // Clean the movie title to improve search results
      const cleanTitle = this.stripHtmlTags(movieTitle).trim();
      console.log(`Original title: "${movieTitle}", Clean title: "${cleanTitle}"`);
      if (!cleanTitle) {
        console.log(`Skipping fetch: Clean title is empty`);
        return;
      }
      
      this.fetchMovieDetails(cleanTitle).then(details => {
        if (details) {
          // Vue 3 直接赋值即可实现响应式更新
          this.movieDetailsMap[movieTitle] = details;
          // 为确保响应式更新，创建一个新对象
          this.movieDetailsMap = { ...this.movieDetailsMap };
          console.log(`Fetched details for movie: ${movieTitle}`, details);
          console.log(`Current movieDetailsMap:`, this.movieDetailsMap);
          
          // Scroll to the bottom of the movie list after Vue updates the DOM
          this.$nextTick(() => {
            this.scrollToBottomOfMovieList();
          });
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
        setTimeout(() => {
          container.scrollTop = container.scrollHeight;
        }, 50); // Small delay to ensure DOM is fully updated
      }
    },
    
    // Method to scroll to movie mention in the chat and highlight it
    scrollToMovieMention(movieTitle) {
      if (!movieTitle || !this.$refs.messagesContainer) return;
      
      console.log(`Scrolling to mentions of movie: "${movieTitle}"`);      
      const messagesContainer = this.$refs.messagesContainer;
      
      // First, remove any existing highlights
      const existingHighlights = messagesContainer.querySelectorAll('.movie-mention-highlighted');
      existingHighlights.forEach(el => {
        el.classList.remove('movie-mention-highlighted');
      });
      
      // Find all movie mentions in the chat
      const movieMentions = messagesContainer.querySelectorAll('.movie-mention');
      console.log(`Found ${movieMentions.length} movie mentions in total`);
      
      // If no movie mentions with class are found, try to find the movie title in the text content
      if (movieMentions.length === 0) {
        console.log('No movie mentions with class found, searching in text content');
        this.findAndHighlightMovieInText(movieTitle, messagesContainer);
        return;
      }
      
      let foundMention = false;
      const normalizedMovieTitle = this.normalizeMovieTitle(movieTitle);
      console.log(`Normalized movie title: "${normalizedMovieTitle}"`);
      
      // Check each movie mention
      movieMentions.forEach((mention, index) => {
        // Normalize both the mention text and the movie title for comparison
        const mentionText = this.stripHtmlTags(mention.textContent).trim();
        const normalizedMentionText = this.normalizeMovieTitle(mentionText);
        
        console.log(`Checking mention #${index}: "${mentionText}" -> "${normalizedMentionText}"`);
        
        // Check if this mention matches our movie title
        if (normalizedMentionText === normalizedMovieTitle ||
            normalizedMentionText.includes(normalizedMovieTitle) ||
            normalizedMovieTitle.includes(normalizedMentionText)) {
          foundMention = true;
          console.log(`Match found! Highlighting mention: "${mentionText}"`);
          
          // Add highlight class
          mention.classList.add('movie-mention-highlighted');
          
          // Scroll the mention into view with smooth behavior - custom implementation to center in container
          setTimeout(() => {
            // Get the container and the element positions
            const container = this.$refs.messagesContainer;
            const containerRect = container.getBoundingClientRect();
            const mentionRect = mention.getBoundingClientRect();
            
            // Calculate the scroll position to center the element in the container
            const mentionMiddle = mention.offsetTop + mentionRect.height / 2;
            const containerMiddle = containerRect.height / 2;
            const scrollPosition = mentionMiddle - containerMiddle;
            
            // Smooth scroll to the calculated position
            container.scrollTo({
              top: scrollPosition,
              behavior: 'smooth'
            });
            
            console.log(`Scrolling to position ${scrollPosition} to center element`);
            
            // Add a temporary flash effect
            mention.style.animation = 'none';
            setTimeout(() => {
              mention.style.animation = 'flash-highlight 2s';
            }, 10);
          }, 100);
        }
      });
      
      if (!foundMention) {
        console.log(`No mentions found for movie: "${movieTitle}", trying text search`);
        this.findAndHighlightMovieInText(movieTitle, messagesContainer);
      }
    },
    
    // Helper method to scroll to an element in the messages container
    scrollToElement(element) {
      if (!element || !this.$refs.messagesContainer) return;
      
      setTimeout(() => {
        // Get the container and the element positions
        const container = this.$refs.messagesContainer;
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        
        // 计算滚动位置，让元素显示在视图的上方1/3处
        const offsetFromTop = containerRect.height * 0.33; // 视图高度的1/3处
        const scrollPosition = element.offsetTop - offsetFromTop;
        
        // 额外向下偏移50px，确保有足够的上下文
        const finalScrollPosition = scrollPosition + 50;
        
        // Smooth scroll to the calculated position
        container.scrollTo({
          top: finalScrollPosition,
          behavior: 'smooth'
        });
        
        console.log(`Fallback: Scrolling to position ${finalScrollPosition} to show element`);
      }, 100);
    },
    
    // Find and highlight movie mentions in text content
    findAndHighlightMovieInText(movieTitle, container) {
      const normalizedMovieTitle = this.normalizeMovieTitle(movieTitle);
      // 只在AI消息中查找电影提及，不在用户消息中查找
      const agentMessageElements = container.querySelectorAll('.agent-message .message-text');
      let foundMention = false;
      
      console.log(`Searching for "${normalizedMovieTitle}" in ${agentMessageElements.length} agent messages`);
      
      agentMessageElements.forEach((messageEl, index) => {
        const messageText = messageEl.textContent.toLowerCase();
        const normalizedMessageText = this.normalizeMovieTitle(messageText);
        
        if (normalizedMessageText.includes(normalizedMovieTitle)) {
          console.log(`Found movie "${movieTitle}" in agent message #${index}`);
          foundMention = true;
          
          // 保存原始HTML
          const originalHTML = messageEl.innerHTML;
          
          // 创建一个正则表达式来匹配电影标题
          const escapedTitle = movieTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`(${escapedTitle})`, 'gi');
          
          // 替换电影标题为高亮版本
          messageEl.innerHTML = originalHTML.replace(regex, '<span class="movie-mention-highlighted" id="highlighted-movie">$1</span>');
          
          // 获取新创建的高亮元素
          const highlightedElement = messageEl.querySelector('#highlighted-movie');
          
          if (highlightedElement) {
            // 滚动到高亮元素的确切位置
            setTimeout(() => {
              // 获取容器和高亮元素的位置
              const container = this.$refs.messagesContainer;
              const containerRect = container.getBoundingClientRect();
              
              // 计算高亮元素相对于消息容器的位置
              const highlightRect = highlightedElement.getBoundingClientRect();
              const messageElRect = messageEl.getBoundingClientRect();
              
              // 计算高亮元素在消息容器中的相对位置
              const highlightOffsetInMessage = highlightRect.top - messageElRect.top;
              const highlightPosition = messageEl.offsetTop + highlightOffsetInMessage;
              
              // 计算滚动位置，让高亮元素显示在视图的上方1/3处
              // 这样用户可以看到更多上下文
              const offsetFromTop = containerRect.height * 0.33; // 视图高度的1/3处
              const scrollPosition = highlightPosition - offsetFromTop;
              
              // 额外向下偏移50px，确保有足够的上下文
              const finalScrollPosition = scrollPosition + 50;
              
              // 平滑滚动到计算出的位置
              container.scrollTo({
                top: finalScrollPosition,
                behavior: 'smooth'
              });
              
              console.log(`Scrolling to position ${finalScrollPosition} to show highlighted movie title`);
              
              // 添加闪烁效果
              highlightedElement.style.animation = 'flash-highlight 2s';
            }, 100);
          } else {
            // 如果找不到高亮元素，回退到消息级别的滚动
            this.scrollToElement(messageEl);
          }
          
          // 延迟后恢复原始HTML
          setTimeout(() => {
            messageEl.innerHTML = originalHTML;
          }, 5000);
          
          return; // 找到第一个匹配项后停止
        }
      });
      
      if (!foundMention) {
        console.log(`Could not find any mention of "${movieTitle}" in any message`);
        // Show a notification to the user
        alert(`Could not find any mention of "${movieTitle}" in the conversation.`);
      }
    },
    
    // Helper method to normalize movie titles for comparison
    normalizeMovieTitle(title) {
      if (!title) return '';
      return title.toLowerCase()
        .replace(/[\s\-_:;,.!?()\[\]{}'"`]+/g, ' ')
        .trim();
    },
    
    // Helper method to strip HTML tags from text
    stripHtmlTags(html) {
      if (!html || typeof html !== 'string') return '';
      return html.replace(/<\/?[^>]+(>|$)/g, '');
    },
    
    // Helper method to strip all formatting from text (HTML tags, markdown, etc)
    stripAllFormatting(text) {
      if (!text || typeof text !== 'string') return '';
      
      // First remove HTML tags
      let plainText = this.stripHtmlTags(text);
      
      // Remove all markdown formatting in a more comprehensive way
      
      // Remove headers (# Header, ## Header, etc) - handle all possible positions
      plainText = plainText.replace(/^#{1,6}\s+/gm, ''); // Headers at start of line
      plainText = plainText.replace(/\s#{1,6}\s+/g, ' '); // Headers in middle of text with space before
      plainText = plainText.replace(/([^#])#{1,6}\s+/g, '$1 '); // Headers in middle with non-# char before
      plainText = plainText.replace(/#{1,6}\s*/g, ''); // Any remaining headers
      
      // Remove bold/italic formatting
      plainText = plainText.replace(/\*\*([^*]+)\*\*/g, '$1'); // Bold **text**
      plainText = plainText.replace(/\*([^*]+)\*/g, '$1');     // Italic *text*
      plainText = plainText.replace(/__([^_]+)__/g, '$1');     // Bold __text__
      plainText = plainText.replace(/_([^_]+)_/g, '$1');       // Italic _text_
      
      // Remove markdown links [text](url) with just text
      plainText = plainText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      
      // Remove code blocks and inline code
      plainText = plainText.replace(/```[\s\S]*?```/g, ''); // Code blocks with language
      plainText = plainText.replace(/`([^`]+)`/g, '$1');     // Inline code
      
      // Remove lists
      plainText = plainText.replace(/^\s*[\*\-\+]\s+/gm, ''); // Unordered lists
      plainText = plainText.replace(/^\s*\d+\.\s+/gm, '');   // Ordered lists
      
      // Remove blockquotes
      plainText = plainText.replace(/^\s*>\s+/gm, '');
      
      // Remove horizontal rules
      plainText = plainText.replace(/^\s*[-*_]{3,}\s*$/gm, '');
      
      // Remove tables
      plainText = plainText.replace(/\|[^|]+\|/g, ' ');
      plainText = plainText.replace(/^[|:-]+$/gm, '');
      
      // Replace multiple spaces with a single space
      plainText = plainText.replace(/\s+/g, ' ');
      
      // Replace any remaining special characters
      plainText = plainText.replace(/[\r\n]+/g, ' '); // Replace line breaks with spaces
      
      return plainText.trim();
    },
    async fetchGPT4oResponse(userMessage) {
      // 使用从config.js导入的API配置
      
      // Prepare conversation history for the API
      const apiMessages = [
        // System message to set the context
        { role: 'system', content: 'You are an AI assistant for movie recommendations. Be helpful, friendly, and try to mention movies when appropriate. IMPORTANT: Always use double quotes around movie titles when you mention them (e.g., "The Godfather", "Inception"). This helps users clearly identify movie titles in your responses.' },
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
      
      // Add the current user message
      apiMessages.push({ role: 'user', content: userMessage });
      
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
        // Use Firebase v9 modular API
        const conversationsCollection = collection(db, 'conversations');
        const docRef = await addDoc(conversationsCollection, {
          sender,
          text,
          timestamp: serverTimestamp()
        });
        console.log('Document written with ID: ', docRef.id);
      } catch (error) {
        console.error('Error adding document: ', error);
      }
    },
    async sendMessage() {
      if (this.isSubmitting) return;
      if (!this.userInput.trim()) {
        this.inputError = 'Please enter a message';
        return;
      }
      
      this.inputError = ''; // Clear any previous error
      const userMessage = this.userInput.trim();
      this.userInput = '';
      this.addMessage({
        sender: 'user',
        text: userMessage,
        timestamp: new Date()
      });
      await logConversation('1', 'user', userMessage);
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
                // Add movie details to the map
                this.$set(this.movieDetailsMap, movie, details);
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
      
      this.isAgentTyping = true;
      const agentResponse = await this.fetchGPT4oResponse(userMessage);
      this.isAgentTyping = false;
      
      // 尝试使用API提取电影名称
      try {
        // 先使用API提取电影名称
        const apiExtractionSuccess = await this.extractMoviesWithAPI(agentResponse);
        
        if (!apiExtractionSuccess) {
          console.log('API提取电影失败，回退到正则表达式方法');
          // 如果API提取失败，回退到正则表达式方法
          const { markedContent, movies } = markMoviesInMessage(agentResponse, this.$refs.messagesContainer);
          
          // 对movies数组做去重和规范化处理
          const processedMovies = Array.from(
            new Set(
              (movies || []).map(movie => {
                if (!movie) return null;
                const cleanTitle = this.stripHtmlTags(movie).trim();
                return normalizeMovieTitle(cleanTitle);
              }).filter(Boolean)
            )
          );
          
          // Format the response with proper line breaks
          const formattedResponse = this.formatAgentResponse(markedContent);
          
          this.addMessage({
            sender: 'agent',
            text: formattedResponse,
            timestamp: new Date()
          });
          
          // Update movie list with detected movies
          if (processedMovies.length > 0) {
            console.log(`Found ${processedMovies.length} movies in agent response:`, processedMovies);
            
            // Update movie list in the service
            updateMovieList(processedMovies);
            
            // 计数累加，避免重复卡片
            processedMovies.forEach(movie => {
              if (!movie) return; // 跳过空值
              const currentCount = this.movieStats.get(movie) || 0;
              const newCount = currentCount + 1;
              this.movieStats.set(movie, newCount);
              this.movieStatsObject[movie] = newCount;
              this.fetchMovieDetailsIfNeeded(movie);
            });
            // 强制Vue更新对象
            this.movieStatsObject = {...this.movieStatsObject};
            this.movieStats = new Map(this.movieStats);
            
            // Scroll to the bottom of the movie list after Vue updates the DOM
            this.$nextTick(() => {
              this.scrollToBottomOfMovieList();
            });
          }
        } else {
          // API提取成功，直接格式化并添加消息
          const formattedResponse = this.formatAgentResponse(agentResponse);
          
          this.addMessage({
            sender: 'agent',
            text: formattedResponse,
            timestamp: new Date()
          });
        }
      } catch (error) {
        console.error('处理电影提取时出错:', error);
        
        // 出错时回退到原始方法
        const { markedContent, movies } = markMoviesInMessage(agentResponse, this.$refs.messagesContainer);
        const formattedResponse = this.formatAgentResponse(markedContent);
        
        this.addMessage({
          sender: 'agent',
          text: formattedResponse,
          timestamp: new Date()
        });
        
        // 处理电影列表更新
        const processedMovies = Array.from(
          new Set(
            (movies || []).map(movie => {
              if (!movie) return null;
              const cleanTitle = this.stripHtmlTags(movie).trim();
              return normalizeMovieTitle(cleanTitle);
            }).filter(Boolean)
          )
        );
        
        if (processedMovies.length > 0) {
          updateMovieList(processedMovies);
          processedMovies.forEach(movie => {
            if (!movie) return;
            const currentCount = this.movieStats.get(movie) || 0;
            const newCount = currentCount + 1;
            this.movieStats.set(movie, newCount);
            this.movieStatsObject[movie] = newCount;
            this.fetchMovieDetailsIfNeeded(movie);
          });
          this.movieStatsObject = {...this.movieStatsObject};
          this.movieStats = new Map(this.movieStats);
        }
      }
      
      await logConversation('1', 'agent', agentResponse);
      await this.logConversationToFirestore('agent', agentResponse);
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
    async finishConversation() {
      // 检查消息数量是否足够
      if (this.userMessageCount < this.minRequiredMessages) {
        alert(`Please continue the conversation. You need at least ${this.minRequiredMessages} messages before proceeding.`);
        return;
      }
      
      // 检查评分数量是否足够
      const ratedCount = Object.keys(this.movieRatings).length;
      if (ratedCount < 4 || ratedCount > 6) {
        alert('Please rate 4-6 movies as your top choices before proceeding to the questionnaire.');
        return;
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
/* Agent Profiles Sidebar Styles */
.agent-profiles-sidebar {
  border-right: 1px solid #eee;
}

.agent-profile-card {
  display: flex;
  align-items: center;
  padding: 15px;
  margin-bottom: 8px;
  border-radius: 8px;
  background-color: #f8f9fa;
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
}

.agent-profile-card:hover, .agent-profile-card.active {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.agent-avatar-container {
  width: 60px;
  height: 60px;
  margin-right: 15px;
  flex-shrink: 0;
}

.agent-profile-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ddd;
}

.agent-info {
  flex: 1;
}

.agent-role {
  margin: 0 0 5px 0;
  font-size: 1rem;
  color: #333;
}

.agent-description {
  margin: 0;
  font-size: 0.85rem;
  color: #666;
  line-height: 1.4;
}

.agent-bullet {
  margin-bottom: 3px;
}

/* Mention List Styles */
.mention-list {
  position: fixed;
  width: 220px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 250px;
  overflow-y: auto;
  z-index: 1000;
  border: 1px solid #e0e0e0;
}

.mention-list-header {
  padding: 8px;
  border-bottom: 1px solid #eaeaea;
}

.mention-filter-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  outline: none;
}

.mention-filter-input:focus {
  border-color: #2196f3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

.mention-list-body {
  padding: 4px 0;
}

.mention-list-item {
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.mention-list-item:hover {
  background-color: #f5f5f5;
}

.mention-list-item:active {
  background-color: #e0e0e0;
}

/* Global Layout */
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

.movie-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  /* 删除了橙色边框 */
}

.movie-details-container {
  display: flex;
  padding: 5px;
  width: 100%;
  align-items: center;
  margin-bottom: 10px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  position: relative;
  cursor: pointer;
}

.movie-details-container:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
  background-color: #f8f9fa;
}

.movie-details-container:hover::after {
  content: '点击查看对话中的提及';
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 10;
}

.movie-poster-container {
  width: 100%;
  height: 120px;
  overflow: hidden;
  border-radius: 4px;
  margin-bottom: 8px;
  cursor: pointer;
  position: relative;
}

.movie-poster-container:hover::after {
  content: 'Open IMDB';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  text-align: center;
  padding: 4px 0;
  font-size: 12px;
}

.movie-poster {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.movie-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  width: 180px;
  min-width: 180px;
  height: auto;
  min-height: 90px;
  padding-top: 5px;
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
  justify-content: center;
  align-items: center; 
  padding: 20px;
  height: 100vh;
    
}

.conversation-card {
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  padding: 20px;
  margin-bottom: 0px;
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
  height: 625px;
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

/* Animation for movie mention highlight */
@keyframes flash-highlight {
  0% { background-color: rgba(255, 215, 0, 0.8); }
  100% { background-color: rgba(255, 215, 0, 0.3); }
}

/* Movie mention styling */
:deep(.movie-mention) {
  color: #0066cc;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  text-decoration-style: dotted;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
}

/* Highlighted movie mention styling */
:deep(.movie-mention-highlighted) {
  background-color: rgba(255, 215, 0, 0.3);
  padding: 0 2px;
  border-radius: 3px;
  animation: flash-highlight 2s;
}

.movie-mention:hover {
  color: #1976d2;
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
    justify-content: center;
    align-items: center; 
    padding: 20px;
    height: 100vh;
    
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
</style>
