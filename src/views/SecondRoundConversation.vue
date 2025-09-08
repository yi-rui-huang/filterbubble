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
        <!-- <h2 class="card-title">Movie Discussion</h2>-->
       <!-- <p class="conversation-description">
          Chat with our movie experts and share your thoughts on movies. Our panel of movie enthusiasts will discuss various perspectives on cinema with you.
        </p> -->
        
        <div class="conversation-area">
          <div class="messages-container" ref="messagesContainer">
            <div 
              v-for="(message, index) in messages" 
              :key="index" 
              :class="['message', 
                message.sender === 'user' ? 'user-message' : 
                message.type === 'movie-summary' ? 'system-message movie-summary-message' : 
                `agent-message ${message.agentType || 'default-agent'}-message`
              ]"
            >
              <div v-if="message.sender === 'agent'" class="agent-avatar">
                <img :src="getAgentAvatar(message.agentType)" alt="Agent Avatar" class="avatar-image">
              </div>
              <div class="message-content">
                <!-- 如果是数组，则分段显示 -->
                <template v-if="Array.isArray(message.text)">
                  <transition-group name="fade" tag="div" class="markdown-sections">
                    <div v-for="(section, sectionIndex) in message.text" 
                         :key="`${message.id}-section-${sectionIndex}`" 
                         class="markdown-section"
                         v-html="renderMessageText(section)">
                    </div>
                  </transition-group>
                </template>
                <!-- 如果是字符串，则正常显示 -->
                <template v-else>
                  <div class="message-text" v-html="renderMessageText(message.text)"></div>
                </template>
                <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                <span v-if="message.sender === 'agent'" class="reply-hint"></span>
              </div>
            </div>
            
            <div v-if="isAgentTyping" class="message agent-message typing-indicator">
              <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            
            <!-- 新增：Moderator提示和选择按钮 -->
            <div v-if="showModeratorPrompt && conversationRound === 1" class="message agent-message moderator-message moderator-prompt">
              <div class="agent-avatar">
                <img :src="getAgentAvatar('moderator')" alt="Moderator Avatar" class="avatar-image">
              </div>
              <div class="message-content">
                <div class="message-text">
                  <p>Would you like to hear from another expert?</p>
                  <div class="moderator-choice-buttons">
                    <button 
                      class="btn choice-btn yes-btn" 
                      @click="handleNextAgentChoice(true)" 
                      :disabled="waitingForUserChoice"
                    >
                      Yes, continue
                    </button>
                    <button 
                      class="btn choice-btn no-btn" 
                      @click="handleNextAgentChoice(false)" 
                      :disabled="waitingForUserChoice"
                    >
                      No, summarize
                    </button>
                  </div>
                </div>
                <span class="message-time">{{ formatTime(new Date()) }}</span>
              </div>
            </div>
          </div>
          
          <div class="input-area">
            <div v-if="showMentionTip" class="mention-tip">
              try @mentioning the specific expert
            </div>
            <textarea 
              v-model="userInput" 
              placeholder="Type your message here..." 
              class="message-input"
              :disabled="isSubmitting"
              ref="messageInput"
              @input="handleInput"
              @keydown.enter.prevent="sendMessage"
            ></textarea>
            <div v-if="inputError" class="input-error-message">{{ inputError }}</div>
            
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
            <button 
              class="btn send-btn" 
              @click="sendMessage" 
              :disabled="!userInput.trim() || isSubmitting || isGroupDiscussionInProgress"
            >
              Send
            </button>
          </div>
        </div>
        
        <div class="conversation-actions-inline">
          <p class="messages-remaining" v-if="remainingMessages > 0">
            {{ remainingMessages }} messages remaining before you can proceed
          </p>
          <p class="movies-remaining" v-if="ratedMoviesCount < 4 || ratedMoviesCount > 6">
            <span v-if="ratedMoviesCount < 4">{{ 4 - ratedMoviesCount }} more movies need to be rated before you can proceed</span>
            <span v-else-if="ratedMoviesCount > 6">You have rated too many movies ({{ ratedMoviesCount }}). Please rate only 4-6 movies.</span>
          </p>

          <button 
            class="btn proceed-btn" 
            @click="finishConversation" 
            :disabled="!canProceed"
            :title="!canProceed ? 'You must send at least 5 messages and rate 4-6 movies before proceeding' : ''">
            Complete Second Round
          </button>
        </div>
      </div>
    </div>

    <!-- Right Column: Movie Recommendations -->
    <div class="sidebar movie-recommendations-sidebar">
      <h3 class="sidebar-title">Movie Recommendations</h3>
      <div class="movie-list" ref="movieListContainer">
        <div v-if="deduplicatedMovies.length === 0" class="no-recommendations">
          <p>Agents will recommend movies as you chat with them.</p>
        </div>
        <div 
          v-for="(movie, index) in deduplicatedMovies" 
          :key="movie.imdbID || `${movie.title}`" 
          class="movie-card"
          :class="[movie.recommendedByAgents ? '' : `recommended-by-${movie.recommendedBy}`, movie.inWatchlist ? 'in-watchlist' : '']"
        >
          <div class="movie-details-container">
            <div class="movie-poster-container">
              <!-- 有海报时显示图片 -->
              <img 
                v-if="movie.Poster && movie.Poster !== 'N/A'" 
                :src="movie.Poster" 
                :alt="movie.title + ' poster'" 
                class="movie-poster"
                @error="$event.target.style.display='none'; $event.target.nextElementSibling.style.display='flex';"
              >
              <!-- 没有海报或加载失败时显示替代文本 -->
              <div 
                :style="{
                  display: (movie.Poster && movie.Poster !== 'N/A') ? 'none' : 'flex',
                  width: '100%',
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '6px',
                  color: '#666',
                  fontSize: '12px',
                  textAlign: 'center'
                }"
              >No Poster</div>
            </div>
            <div class="movie-info">
              <div class="movie-header" @click.stop="openImdbPage(movie)" style="cursor: pointer;">
                <h4 class="movie-title" :title="movie.title" style="display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; min-height: 20px; line-height: 1.2; margin-bottom: 5px;">{{ movie.title }}</h4>
                <p v-if="movie.Director" class="movie-director">Director: {{ movie.Director }}</p>
                <p v-if="movie.imdbRating" class="movie-rating">IMDB: {{ movie.imdbRating }}</p>
              </div>
              
              <!-- Watchlist button (always visible) -->
              <div class="watchlist-button-container" v-if="!movie.inWatchlist">
                <button class="btn watchlist-btn" @click.stop="addToWatchlist(movie)">
                  <i class="fas fa-plus"></i> Add to Watchlist
                </button>
              </div>
              
              <!-- Rating stars (only visible after adding to watchlist) -->
              <div class="movie-rating-stars" v-if="movie.inWatchlist">
                <span>Your Rating:</span>
                <div class="stars">
                  <span 
                    v-for="star in 5" 
                    :key="star"
                    :class="['star', movie.userRating >= star ? 'filled' : '']"
                    @click.stop="rateMovie(movie, star)"
                  >
                    ★
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="movie-recommenders">
            <!-- 兼容旧数据结构 -->
            <div v-if="!movie.recommendedByAgents" class="recommender-avatar-container">
              <div class="avatar-tooltip">
                <img :src="getAgentAvatar(movie.recommendedBy)" class="recommender-avatar" alt="Agent Avatar" @click.stop="scrollToAgentMention(movie.title, movie.recommendedBy)" style="cursor: pointer;" />
                <span class="avatar-tooltip-text">{{ agentProfiles.agents[movie.recommendedBy]?.role || 'Agent' }}</span>
              </div>
            </div>
            
            <!-- 新数据结构，只显示多个代理头像 -->
            <div v-else class="recommender-avatars-container">
              <div 
                v-for="(recommender, recIndex) in movie.recommendedByAgents" 
                :key="recIndex"
                class="avatar-tooltip"
              >
                <img 
                  :src="getAgentAvatar(recommender.agentType)" 
                  class="recommender-avatar" 
                  alt="Agent Avatar" 
                  @click.stop="scrollToAgentMention(movie.title, recommender.agentType)"
                  style="cursor: pointer;"
                />
                <span class="avatar-tooltip-text">{{ agentProfiles.agents[recommender.agentType]?.role || 'Agent' }}</span>
              </div>
            </div>
          </div>
          <!-- <p class="movie-reason" v-if="movie.reason">{{ movie.reason }}</p> -->
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import agentProfiles from '../data/agent_profiles.json';
import '../assets/movie-card-styles.css';
import { logConversation, logUserEvent, getQuestionnaireResponses } from '../services/loggingService';
import { completeCurrentSystem, getCurrentQuestionnaireRoute } from '../services/systemOrderService';
import { selectBestAgent } from '../services/agentSelectionService';
import { API_KEY, BACKUP_API_KEY, BASE_URL, MODEL, API_TIMEOUT } from '../config';
import { analyzeRelevance, detectEmotion } from '../services/analysisService';
import p1Image from '../images/p1.png';
import p2Image from '../images/p2.png';
import p3Image from '../images/p3.png';
import p4Image from '../images/p4.png';
import { splitAndAddMessages as htmlSplitAndAddMessages } from '../utils/messageFormatter';
import { marked } from 'marked';

// Configuration for GPT-4o API
// API配置已迁移到config.js


export default {
  name: 'SecondRoundConversation',
  data() {
    return {
      // 用户问卷回答
      userQuestionnaireResponses: null,
      // LLM推荐的最适合专家
      llmRecommendedAgent: null,
      // 专家回复状态跟踪
      agentResponses: {},
      // 对selectedAgents的引用
      selectedAgentsRef: null,
      userInput: '',
      messages: [],
      isAgentTyping: false,
      // 跟踪每个专家的输入状态
      agentTypingStatus: {},
      isSubmitting: false,
      isGroupDiscussionInProgress: false, // Track when agents are responding in a group discussion
    isIncrementalDisplayActive: false, // 跟踪是否正在进行增量显示
      minRequiredMessages: 5, // 用户需发送两条消息才可以进入第二轮
      maxMessages: 200, // Increase maximum message quantity limit
      welcomeMessage: "", // Empty as we now use a full welcome message in created()
      activeAgent: null, // Currently selected agent in the sidebar
      recommendedMovies: [], // 存储推荐的电影，使用标题作为唯一标识符 // List of movies recommended by agents
      agentProfiles: agentProfiles, // Import the agent profiles data
      inputError: '', // Error message for input validation
      conversationRound: 1, // Track which round of conversation we're in (1, 2, or 3)
      userMessageCountInCurrentRound: 0, // Track user messages in current round
      firstRoundMessages: [], // Save the first round chat history
      movieRatings: {}, // 存储用户对电影的评分
      watchlist: {}, // 存储用户的观影清单
      showMentionList: false,
      mentionPosition: { top: 0, left: 0 },
      mentionFilterText: '',
      sessionId: '', // 添加会话ID，用于区分不同的会话
      showMentionTip: false, // 控制@提及提示的显示
      mentionTipTimer: null, // @提及提示的定时器
      hasShownMentionTip: false, // 记录提示是否已经显示过
      validatedMovies: new Map(), // 存储已验证的电影名称及其在IMDB中的存在状态
      pendingMovieValidations: [], // 存储待验证的电影信息
      tempRoundMovies: [], // 当前轮次中提取到的电影，待所有agent发言完毕后再处理
      displayingMovieSummary: false, // 是否正在显示电影总结
      processingMovieRecommendations: false, // 添加标志防止重复处理电影推荐
      // 新增：用于控制第一轮对话中的顺序输出
      firstRoundAgentQueue: [], // 存储第一轮对话中待回复的agent队列
      currentSpeakingAgent: null, // 当前正在发言的agent
      showModeratorPrompt: false, // 是否显示moderator提示
      waitingForUserChoice: false, // 是否正在等待用户选择是否继续听下一个agent
    };
  },
  computed: {
    userMessageCount() {
      return this.messages.filter(message => message.sender === 'user').length;
    },
    remainingMessages() {
      return Math.max(0, this.minRequiredMessages - this.userMessageCount);
    },
    // Count the number of movies that have been rated by the user
    ratedMoviesCount() {
      const ratedMovies = Object.values(this.movieRatings).filter(rating => rating > 0);
      return ratedMovies.length;
    },

    canProceed() {
      // 用户需要发送至少5条消息且评价4-6部电影才能进入下一轮
      return this.userMessageCount >= this.minRequiredMessages && this.ratedMoviesCount >= 4 && this.ratedMoviesCount <= 6;
    },
    // 返回去重后的电影推荐列表
    deduplicatedMovies() {
      // 使用Map按标准化标题来去重电影
      const uniqueMovies = new Map();
      
      // 遍历所有电影，按照标准化标题进行去重
      this.recommendedMovies.forEach(movie => {
        const normalizedTitle = this.normalizeMovieTitle(movie.title).toLowerCase();
        
        if (!uniqueMovies.has(normalizedTitle)) {
          uniqueMovies.set(normalizedTitle, movie);
        }
      });
      
      return Array.from(uniqueMovies.values());
    },
  },
  created() {
    // 生成新的会话ID
    this.sessionId = 'session_' + new Date().getTime();
    console.log(`创建新会话: ${this.sessionId}`);
    
    // Log page view and initial round
    logUserEvent('view_second_round_conversation');
    console.log('%cConversation starts in round 1', 'color: green; font-weight: bold; font-size: 14px');
    
    // 清除本地存储中可能存在的对话记录
    this.clearConversationHistory();
    
    // 加载保存的电影推荐数据
    this.loadRecommendedMovies();
    
    // 获取用户问卷回答
    try {
      this.userQuestionnaireResponses = getQuestionnaireResponses('initial');
      if (this.userQuestionnaireResponses) {
        console.log('成功获取用户问卷回答:', this.userQuestionnaireResponses);
      } else {
        console.warn('未能获取用户问卷回答');
      }
    } catch (error) {
      console.error('获取用户问卷回答时出错:', error);
    }
    
    // Check if user came directly (not from transition page)
    const fromTransition = this.$route.query.fromTransition === 'true';
    if (!fromTransition) {
      // If user didn't come from transition page, redirect them
      this.$router.replace('/transition');
      return;
    }
    
    // Add welcome messages with delay
    const welcomeMessages = [
      "Welcome! I'm delighted to be your moderator. Let me quickly introduce our three guests who will be recommending movies for you.",
      "First, our **Ethan Maxwell** who analyzes movies objectively, focusing on artistic value and technical execution. His insights are evidence-based and technically precise.",
      "Next, our **Maya Cole** who is passionate about unique artistic expressions. She is knowledgeable about experimental cinema and always seek innovative perspectives in movie.",
      "Finally, our **Jake Robinson** who loves discussing popular films, box office performance, and audience reception.",
      "Today, we'll start by having the guest whose movie preferences are **most similar to yours** make their recommendations **first**. Then, other guests will share their **own recommendations** and may also **comment** on the earlier recommendations. Finally, I will **summarize all the recommendations** from the group discussion.",
      "Let's talk about movies! Imagine you're about to watch a movie—what's the setting? Where and when would you like to watch it? Are you with friends, family, or maybe on your own?"
    ];
    
    // 使用异步函数和setTimeout添加延迟，每隔2秒输出一条消息
    const addMessagesWithDelay = async () => {
      for (let i = 0; i < welcomeMessages.length; i++) {
        // 添加消息
        this.addMessage({
          sender: 'agent',
          agentType: 'moderator',
          text: welcomeMessages[i],
          timestamp: new Date()
        });
        
        // 如果不是最后一条消息，则等待2秒
        if (i < welcomeMessages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    };
    
    // 执行带延迟的消息添加函数
    addMessagesWithDelay();
    
    // Add introductions from each agent
    // this.addAgentIntroductions(); // Temporarily disable agent introductions
    
    // Load agent profiles
    console.log('Agent profiles loaded:', this.agentProfiles);
    
    // Log agent welcome message
    try {
      logConversation('2', 'agent', "Welcome to our movie discussion! I'm your moderator, and I'm joined by our panel of movie experts. In the first round, all three experts will respond to your messages and evaluate each other's recommendations. In the second round, I'll be your primary guide. Feel free to share your thoughts on movies you've seen recently. You can also direct your questions to specific agents by using @Ethan Maxwell, @Maya Cole, or @Jake Robinson.", 'moderator', this.sessionId);
    } catch (error) {
      console.warn('Failed to log agent welcome message to Firebase:', error);
    }
    
    // Validate API key
    this.validateApiKey();
  },
  mounted() {
    // Focus the input field
    this.$refs.messageInput.focus();
  },
  beforeDestroy() {
    // 在组件销毁前清除对话记录
    this.clearConversationHistory();
  },
  methods: {
    // 测试函数：使用预设长文本测试消息分割和显示逻辑
    async testWithLongText() {
      // 打印recommendedMovies到控制台
      console.log('recommendedMovies:', this.recommendedMovies);
      
      console.log('%c开始长文本测试', 'background: #f00; color: #fff; font-size: 16px; padding: 5px;');
      
      // 清空现有消息，以便观察测试结果
      this.messages = [];
      this.expertMessagesMap = {};
      
      // 预设的长文本样本 - 模拟professional_critic的回复
      const longTextSample = `Hello there! I'm the Professional Critic, and I'm delighted to discuss movies with you today. Let's dive into some thoughtful analysis.

First, I'd like to talk about the art of cinema as a medium for storytelling. Cinema combines visual composition, sound design, narrative structure, and performance in ways that no other art form can. When evaluating a film, I consider how these elements work together to create a cohesive experience.

The best films, in my opinion, are those that challenge our perspectives while remaining accessible. They balance artistic vision with audience engagement. Take films like "Parasite" by Bong Joon-ho or "The Godfather" by Francis Ford Coppola - these works excel in both critical merit and emotional resonance.

When analyzing a film's narrative structure, I pay close attention to pacing, character development, and thematic coherence. A well-constructed story should flow naturally while maintaining tension and interest. Character arcs should feel earned rather than forced.

Cinematography is another crucial element. How does the director use the camera to tell the story? Are the visual choices deliberate and meaningful? Consider Roger Deakins' work in "Blade Runner 2049" or Emmanuel Lubezki's long takes in "Birdman" - these are examples of cinematography that enhances storytelling.

Sound design and music often go underappreciated, but they're fundamental to the cinematic experience. Think about how Hans Zimmer's score elevates "Inception" or how the sound design in "A Quiet Place" becomes a narrative device in itself.

I also value films that take creative risks. Not every experiment succeeds, but cinema evolves through innovation. Directors like Christopher Nolan, Wes Anderson, and Yorgos Lanthimos have distinctive styles that push boundaries in different ways.

What kinds of films do you enjoy? Are you drawn to particular genres, directors, or eras of cinema? I'd love to hear your thoughts and perhaps recommend some films that might align with your tastes.`;
      
      // 测试professional_critic的消息分割
      console.log('%c测试professional_critic的消息分割', 'background: #00f; color: #fff; padding: 2px;');
      const agentKey = 'professional_critic';
      const messages = await this.splitAndAddMessages(longTextSample, agentKey);
      
      // 存储消息到expertMessagesMap
      this.expertMessagesMap[agentKey] = messages;
      console.log(`%c已存储 ${agentKey} 的 ${messages.length} 条消息`, 'background: #070; color: #fff; padding: 2px;');
      
      // DEBUG: Log the complete messages stored in expertMessagesMap
      console.log(`%c[DEBUG] ${agentKey} 存储到expertMessagesMap的消息:`, "background: #606; color: #fff; padding: 2px;", {
        消息数量: this.expertMessagesMap[agentKey].length,
        所有消息: this.expertMessagesMap[agentKey].map((m, i) => `${i+1}: ${m.substring(0, 100)}...`)
      });
      
      // 使用interleaved方法显示消息
      console.log('%c使用interleaved方法显示消息', 'background: #00f; color: #fff; padding: 2px;');
      await this.interleavedAddMessages({ [agentKey]: messages });
      
      console.log('%c长文本测试完成', 'background: #f00; color: #fff; font-size: 16px; padding: 5px;');
    },
    /**
     * 清除对话历史记录和电影推荐数据
     * 确保刷新页面后不会保留之前的对话和电影推荐
     */
    clearConversationHistory() {
      // 清空当前组件中的消息数组和电影推荐
      this.messages = [];
      this.recommendedMovies = [];
      this.movieRatings = {};
      this.watchlist = {};
      
      // 清除本地存储中的相关数据
      try {
        // 清除代理记忆
        localStorage.removeItem('agent_memories');
        
        // 清除第一轮对话记录（如果存在）
        localStorage.removeItem('firstRoundMessages');
        
        // 清除电影推荐和评分数据
        localStorage.removeItem('recommended_movies');
        localStorage.removeItem('movie_ratings');
        localStorage.removeItem('watchlist');
        
        console.log('对话历史记录和电影推荐数据已清除');
      } catch (error) {
        console.error('清除数据时出错:', error);
      }
    },
    
    /**
     * 保存电影推荐数据到本地存储
     */
    saveRecommendedMovies() {
      try {
        if (this.recommendedMovies && this.recommendedMovies.length > 0) {
          localStorage.setItem('recommended_movies', JSON.stringify(this.recommendedMovies));
          localStorage.setItem('movie_ratings', JSON.stringify(this.movieRatings));
          localStorage.setItem('watchlist', JSON.stringify(this.watchlist));
          console.log('电影推荐数据已保存，共', this.recommendedMovies.length, '部电影');
        }
      } catch (error) {
        console.error('保存电影推荐数据时出错:', error);
      }
    },
    
    /**
     * 从本地存储加载电影推荐数据
     */
    loadRecommendedMovies() {
      try {
        const savedMovies = localStorage.getItem('recommended_movies');
        const savedRatings = localStorage.getItem('movie_ratings');
        const savedWatchlist = localStorage.getItem('watchlist');
        
        if (savedMovies) {
          this.recommendedMovies = JSON.parse(savedMovies);
          console.log('已加载电影推荐数据，共', this.recommendedMovies.length, '部电影');
          
          // 确保每部电影都有inWatchlist属性
          if (savedWatchlist) {
            const watchlist = JSON.parse(savedWatchlist);
            this.watchlist = watchlist;
            
            // 为每部电影设置watchlist状态
            this.recommendedMovies.forEach(movie => {
              const id = movie.imdbID || movie.title;
              if (watchlist[id]) {
                movie.inWatchlist = true;
              }
            });
          }
        }
        
        if (savedRatings) {
          this.movieRatings = JSON.parse(savedRatings);
        }
      } catch (error) {
        console.error('加载电影推荐数据时出错:', error);
      }
    },
    /**
     * 使用Fisher-Yates算法随机打乱专家顺序
     * @param {Array} agents - 要打乱的专家数组
     * @returns {Array} - 打乱后的专家数组
     */
    shuffleAgents(agents) {
      for (let i = agents.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [agents[i], agents[j]] = [agents[j], agents[i]];
      }
      return agents;
    },
    
    /**
     * 重新排序专家，将指定的首选专家放在前面
     * @param {string} preferredAgent - 首选专家的ID
     */
    reorderAgentsWithPreferred(preferredAgent) {
      // 如果消息还没有开始生成，我们可以重新排序
      if (!this.agentResponses || Object.keys(this.agentResponses).length === 0) {
        console.log('重新排序专家回复队列，将首选专家放在前面:', preferredAgent);
        
        // 获取当前的专家数组
        const mainAgents = ['professional_critic', 'indie_enthusiast', 'blockbuster_fan'];
        
        // 重新构建专家数组，将首选专家放在前面
        const reorderedAgents = [preferredAgent, ...mainAgents.filter(agent => agent !== preferredAgent)];
        
        // 如果当前流程中的selectedAgents还没有被使用，可以尝试替换它
        // 注意这是一个比较危险的操作，可能需要根据具体情况调整
        if (this.selectedAgentsRef && this.selectedAgentsRef.length > 0) {
          this.selectedAgentsRef.splice(0, this.selectedAgentsRef.length, ...reorderedAgents);
          console.log('成功更新专家回复队列:', this.selectedAgentsRef);
        }
      }
    },
    // 保存第一轮的聊天记录
    saveFirstRoundMessages() {
      // 只保存第一轮的消息
      this.firstRoundMessages = this.messages.filter(msg => {
        // 在转换到第二轮之前的所有消息
        return true; // 由于我们是在转换到第二轮时调用此方法，所以当前所有消息都是第一轮的
      });
    },
    
    // 获取格式化的第一轮对话历史记录，用于moderator的prompt
    getFirstRoundConversationHistory() {
      if (this.firstRoundMessages.length === 0) {
        return "There was no significant discussion in the first round.";
      }
      
      // 格式化第一轮对话记录
      const formattedHistory = this.firstRoundMessages.map(msg => {
        if (msg.sender === 'user') {
          return `User: ${msg.text}`;
        } else {
          const agentRole = this.agentProfiles.agents[msg.agentType]?.role || 'Agent';
          return `${agentRole}: ${msg.text}`;
        }
      }).join('\n');
      
      return `Here is the first round conversation history:\n${formattedHistory}\n\nThis was the complete first round of the discussion with our movie experts.`;
    },
    async sendMessage() {
      console.log('Starting sendMessage process...');
      if (!this.userInput.trim() || this.isSubmitting) {
        return;
      }
      
      // Validate input to prevent code injection
      if (!this.validateUserInput(this.userInput)) {
        this.inputError = 'Please enter valid text. Codes and special characters are not allowed.';
        this.isSubmitting = false;
        return;
      }
      
      this.inputError = ''; // Clear any previous error
      this.isSubmitting = true;
      const userMessage = this.userInput.trim();
      this.userInput = '';

      // Add user message to conversation
      this.addMessage({
        sender: 'user',
        text: userMessage,
        timestamp: new Date()
      });
      console.log('User message added to conversation');

      // Log user message to Firebase，添加会话ID
      try {
        await logConversation('2', 'user', userMessage, null, this.sessionId);
        console.log('User message logged to Firebase with sessionId:', this.sessionId);
      } catch (error) {
        console.warn('Failed to log user message to Firebase:', error);
      }

      // 检查是否达到最大消息数量，但不再阻止用户继续对话
      if (this.messages.length >= this.maxMessages * 2) { // *2 because each exchange has 2 messages
        console.log(`Warning: Message count reached limit (${this.messages.length}/${this.maxMessages * 2}), but allowing further conversation.`);
        // 不再提前返回，允许用户继续对话
      } else {
        console.log(`Current message count: ${this.messages.length}/${this.maxMessages * 2}`);
      }

      // Simulate agent typing
      this.isAgentTyping = true;
      console.log('Agent typing indicator shown');

      try {
        // Analyze user input for relevance and emotion
        console.log('Analyzing user input...');
        const relevanceScores = analyzeRelevance(agentProfiles.agents, userMessage);
        const userEmotion = detectEmotion(userMessage);
        console.log('User emotion detected:', userEmotion);
        console.log('Relevance scores:', relevanceScores);
        
        // Get previous agent memories if they exist
        const agentMemories = this.getAgentMemories();

        // Determine if this is a direct response to specific agents
        const targetedAgents = this.detectTargetedAgents(userMessage);
        
        // Select agents based on conversation round and targeting
        let selectedAgents = [];
        
        // 保存对selectedAgents的引用，以便LLM异步处理完成后可以修改
        this.selectedAgentsRef = selectedAgents;
        
        // 根据用户消息数量自动确定当前对话轮次
        const userMessageCount = this.userMessageCount;
        console.log(`用户消息数量: ${userMessageCount}`);
        
        // 根据用户消息数量设置对话轮次
        // 1条消息：第一轮，2条及以上消息：第二轮
        let newRound = 1;
        if (userMessageCount >= 2) {
          newRound = 2;
        }
        
        // 如果轮次发生变化，进行相应处理
        if (newRound !== this.conversationRound) {
          // 如果从第一轮进入其他轮次，保存第一轮聊天记录
          if (this.conversationRound === 1) {
            this.saveFirstRoundMessages();
            console.log('第一轮聊天记录已保存:', this.firstRoundMessages);
          }
          
          // 更新对话轮次
          this.conversationRound = newRound;
          console.log(`%c已转换到第${newRound}轮对话`, 'color: red; font-weight: bold; font-size: 14px');
          
          // 构建推荐电影的提示信息
          let movieRecommendationsText = "";
          if (this.recommendedMovies.length > 0) {
            movieRecommendationsText = ` I notice our panel has recommended some movies for you. You can see them in the recommendations panel on the right, along with which experts recommended each movie.`;
          }
          
          
          // Log transition message (without "Moderator:" prefix)
          try {
            await logConversation('2', 'system', 'User has transitioned to Round 2', 'moderator', this.sessionId);
          } catch (error) {
            console.warn('Failed to log transition message to Firebase:', error);
          }
        }
        
        // 对话轮次现在完全由用户消息数量决定，不再需要关键词检测
        // 1条消息：第一轮，2条消息：第二轮，3条及以上消息：第三轮
        
        if (targetedAgents.length > 0) {
          // If user is specifically targeting agents
          if (this.conversationRound === 1) {
            // In round 1, respect user targeting but ensure all three main agents respond
            const mainAgents = ['professional_critic', 'indie_enthusiast', 'blockbuster_fan'];
            selectedAgents = [...new Set([...targetedAgents, ...mainAgents])];
          } else {
            // 新的实现：在第二轮及以后，如果用户@提及特定专家，由被提及的专家直接回应
            // 过滤掉moderator，确保只有被提及的专家回应
            const mentionedExperts = targetedAgents.filter(agent => agent !== 'moderator');
            
            if (mentionedExperts.length > 0) {
              // 如果有被提及的专家，让这些专家回应
              selectedAgents = mentionedExperts;
              console.log('%c第二轮或第三轮对话: 用户@提及了专家，由被提及的专家直接回应', 'color: green; font-weight: bold');
            } else {
              // 如果只@提及了moderator或没有有效的专家提及，由moderator回应
              selectedAgents = ['moderator'];
              console.log('%c第二轮或第三轮对话: 用户只@提及了moderator，由moderator回应', 'color: purple; font-weight: bold');
            }
          }
        } else {
          // No specific targeting
          if (this.conversationRound === 1) {
            // In round 1, all three main agents respond
            selectedAgents = ['professional_critic', 'indie_enthusiast', 'blockbuster_fan'];
          } else {
            // In round 2 and later, only moderator responds if no specific agents are targeted
            selectedAgents = ['moderator'];
            console.log('%c第二轮及以后对话: 没有@提及任何专家，由moderator回复用户消息', 'color: purple; font-weight: bold');
          }
        }

        console.log('Final selected agents for response:', selectedAgents);
        
        // 打印出当前对话轮次和相关信息
        console.log(`%c当前对话轮次: ${this.conversationRound}`, 'color: blue; font-weight: bold; font-size: 14px');
        console.log(`用户在当前轮次的消息数: ${this.userMessageCountInCurrentRound}`);
        console.log(`选择的回复agent数量: ${selectedAgents.length}`);
        console.log('回复用户消息的agent是:', selectedAgents.map(agentKey => {
          const agentRole = agentProfiles.agents[agentKey].role;
          return `${agentKey} (${agentRole})`;
        }).join(', '));

        // Build conversation history with previous messages
        let conversationHistory = this.buildConversationHistory();
        
        // Add current user message
        conversationHistory += `\nUser: ${userMessage}`;
        
        // 确保在第一轮对话中只选择三个专家回复，不包括Moderator
        if (this.conversationRound === 1) {
          // 过滤掉moderator，只保留三个专家
          selectedAgents = selectedAgents.filter(agent => agent !== 'moderator');
          console.log('%c第一轮对话: 过滤掉moderator，只保留专家', 'color: red; font-weight: bold; font-size: 14px', selectedAgents);
        }
        
        // 在第一轮对话中，使用LLM或随机打乱专家回复顺序
        if (this.conversationRound === 1) {
          // 如果有问卷回答，尝试使用LLM来选择最适合的专家
          if (this.userQuestionnaireResponses) {
            console.log('%c尝试使用问卷数据和LLM选择最适合的专家', 'color: green; font-weight: bold');
            
            try {
              // 赋值给一个变量，这样可以继续处理而不需要等待
              const mainAgents = ['professional_critic', 'indie_enthusiast', 'blockbuster_fan'];
              
              // 保存原始的专家顺序以便稍后使用
              const originalSelectedAgents = [...selectedAgents];
              
              // 异步调用LLM，但不等待结果（结果会在回调中处理）
              selectBestAgent(this.userQuestionnaireResponses, mainAgents)
                .then(preferredAgent => {
                  if (preferredAgent) {
                    console.log('%c基于用户问卷，LLM推荐的首选专家：', 'color: green; font-weight: bold', preferredAgent);
                    
                    // 将首选专家放在最前面
                    this.agentResponses.llmRecommended = preferredAgent;
                    
                    // 不影响当前流程，但将用于下次对话
                    this.llmRecommendedAgent = preferredAgent;
                    
                    // 如果响应消息还没有生成，重新排序专家
                    if (this.firstRoundAgentQueue.length > 0) {
                      // 将首选专家放在队列最前面
                      this.firstRoundAgentQueue = [
                        preferredAgent,
                        ...this.firstRoundAgentQueue.filter(agent => agent !== preferredAgent)
                      ];
                      console.log('%c已将首选专家放在队列最前面:', 'color: green; font-weight: bold', this.firstRoundAgentQueue);
                    }
                  }
                })
                .catch(error => {
                  console.error('LLM专家选择失败:', error);
                });
            } catch (error) {
              console.error('LLM专家选择过程发生错误:', error);
            }
          }
          
          // 不再随机打乱专家顺序，而是按照选定的顺序回复
          // 如果有LLM推荐的专家，将其放在第一位
          if (this.llmRecommendedAgent && selectedAgents.includes(this.llmRecommendedAgent)) {
            // 将LLM推荐的专家放在第一位
            const reorderedAgents = [
              this.llmRecommendedAgent,
              ...selectedAgents.filter(agent => agent !== this.llmRecommendedAgent)
            ];
            // 更新selectedAgents数组
            selectedAgents.splice(0, selectedAgents.length, ...reorderedAgents);
            console.log('%c基于问卷和LLM推荐的专家回复顺序', 'color: green; font-weight: bold; font-size: 14px', selectedAgents);
          } else {
            console.log('%c保持原始专家回复顺序', 'color: purple; font-weight: bold; font-size: 14px', selectedAgents);
          }
        }
        
        // For each selected agent, generate a response
        console.log('%c开始生成选定代理的回复', 'background: #007; color: #fff; padding: 2px;', {
          选定代理: selectedAgents,
          对话轮次: this.conversationRound,
          用户消息: userMessage.substring(0, 30) + (userMessage.length > 30 ? '...' : '')
        });
        
        // 创建一个对象来存储所有专家的消息数组
        const expertMessagesMap = {};
        
        // 设置标志，表示正在处理专家回复
        this.isGroupDiscussionInProgress = true;
        
        // 显示所有专家正在输入的状态
        selectedAgents.forEach(agentKey => {
          this.setAgentTypingStatus(agentKey, true);
        });
        
        // 在第一轮对话中，我们将专家存入队列，而不是并行处理
        if (this.conversationRound === 1) {
          console.log('%c第一轮对话: 将专家存入队列进行顺序处理', 'color: blue; font-weight: bold');
          
          // 初始化专家队列，用于顺序处理
          this.firstRoundAgentQueue = [...selectedAgents];
          this.currentSpeakingAgent = null;
          this.showModeratorPrompt = false;
          this.waitingForUserChoice = false;
          
          // 关闭所有专家的输入状态指示，因为我们将一次只显示一个专家的输入状态
          selectedAgents.forEach(agentKey => {
            this.setAgentTypingStatus(agentKey, false);
          });
          
          // 开始处理队列中的第一个专家
          await this.processNextAgentInQueue();
          
          // 重置提交状态
          this.isSubmitting = false;
          return; // 提前返回，不执行并行处理
        }
        
        // 非第一轮对话的并行处理逻辑
        const processAgentResponses = selectedAgents.map(async (agentKey) => {
          const agentProfile = this.agentProfiles.agents[agentKey];
          if (!agentProfile) {
            console.error(`未找到专家配置: ${agentKey}`);
            return;
          }
          // 3. The current conversation history
          // 4. Instructions for interaction with other agents
          
          let agentContext = '';
          
          // Add agent'xiaoguoss memory of previous interactions
          const memories = this.getAgentMemories();
          const agentMemory = memories[agentKey] || [];

          if (agentKey === 'moderator' && this.conversationRound === 2) {
            // In round 2, give moderator access to all agents' memories
            const combinedMemories = this.getCombinedAgentMemories();
            if (combinedMemories) {
              agentContext += `\nInsights from all experts:\n${combinedMemories}\n`;
            }
            
            // Also add moderator's own memories
            if (agentMemory.length > 0) {
              agentContext += `\nYour previous interactions with the user:\n${agentMemory.join('\n')}\n`;
            }
          } else if (agentMemory.length > 0) {
            // For other agents or in round 1, just use their own memories
            agentContext += `\nPrevious interactions with the user:\n${agentMemory.join('\n')}\n`;
          }
          
          // Add special instructions based on agent role
          if (agentKey === 'moderator') {
            if (this.conversationRound === 2 && this.userMessageCountInCurrentRound === 1) {
              // 用户刚进入第二轮，moderator提供第一轮的总结
              agentContext += `\nAs the moderator with expertise in ${agentProfile.knowledge_domains.join(', ')}, you have access to all the previous discussions and insights from our movie experts (Ethan Maxwell, Maya Cole, and Jake Robinson).\n\n`;
            } else {
              agentContext += `\nAs the moderator with expertise in ${agentProfile.knowledge_domains.join(', ')}, engage in a natural conversation with the user about movies. Respond directly to their question or comment without summarizing previous discussions.\n\n`;
            }
          } else if (targetedAgents.includes(agentKey)) {
            agentContext += `\nThe user is directly responding to your previous comment. Address their feedback specifically.`;
          }
          
          let prompt;
          
          if (this.conversationRound === 1) {
            // In round 1, agents should evaluate previous movie recommendations
            const previousMovieRecommendations = this.getPreviousMovieRecommendations();
            const movieEvaluationContext = previousMovieRecommendations.length > 0 ?
              `\n\nPrevious movie recommendations in this conversation: ${previousMovieRecommendations.join(', ')}. Please evaluate at least one of these movies with your stance (Support, Oppose, or Indifferent) and explain your reasoning.` : '';
            
            prompt = `${conversationHistory}\n\n${agentContext}\n\nAs a ${agentProfile.role}, with expertise in ${agentProfile.knowledge_domains.join(', ')}, engage in a natural discussion about movies. Respond to the user's message and previous comments from other participants. Recommend at least 2 movies that aligns with your perspective AND evaluate previous movie recommendations from other agents with your stance (Support, Oppose, or Indifferent) with brief reasoning.${movieEvaluationContext} Keep your response conversational and engaging.`;
            
            // 输出第一轮对话的 prompt 到控制台
            console.log('%c第一轮对话 Prompt:', 'color: blue; font-weight: bold; font-size: 14px');
            console.log(prompt);
          } else if (agentKey !== 'moderator') {
            // 第二轮及以后，非moderator代理的提示（被@提及的专家）
            // 获取所有电影推荐的详细信息
            const recommendedMoviesDetails = this.recommendedMovies.map(movie => {
              const recommenders = movie.recommendedByAgents ? 
                movie.recommendedByAgents.map(rec => agentProfiles.agents[rec.agentType].role).join(', ') : 
                (movie.recommendedBy ? agentProfiles.agents[movie.recommendedBy].role : 'Unknown');
              
              return `"${movie.title}" (recommended by: ${recommenders})`;
            }).join('; ');
            
            const movieRecommendationsContext = this.recommendedMovies.length > 0 ? 
              `\n\nCurrent movie recommendations in the sidebar: ${recommendedMoviesDetails}.` : 
              '';
            
            // 构建专家在第二轮被@提及时的提示
            const expertInstructions = `As ${agentProfile.role} with expertise in ${agentProfile.knowledge_domains.join(', ')}, you have been directly mentioned by the user in this conversation.\n\nThe user has specifically addressed you with an @mention, indicating they want YOUR perspective directly. Respond naturally and conversationally to their question or comment, maintaining your unique perspective and expertise.\n\nYou can reference previous discussions and movie recommendations if relevant. If appropriate, you can recommend additional movies that align with your perspective and the user's interests.\n\nRemember to stay true to your character and expertise areas. The user has chosen to hear from you specifically, so provide your authentic perspective rather than a neutral or balanced view.`;
            
            prompt = `${conversationHistory}\n\n${agentContext}${movieRecommendationsContext}\n\n${expertInstructions}`;
            
            // 输出专家在第二轮被@提及时的prompt到控制台
            console.log(`%c第${this.conversationRound}轮对话 - ${agentProfile.role} 被@提及的 Prompt:`, 'color: purple; font-weight: bold; font-size: 14px');
            console.log(prompt);
          } else {
            // In round 2, moderator responds with more personalized recommendations
            // 获取所有电影推荐的详细信息
            const recommendedMoviesDetails = this.recommendedMovies.map(movie => {
              const recommenders = movie.recommendedByAgents ? 
                movie.recommendedByAgents.map(rec => agentProfiles.agents[rec.agentType].role).join(', ') : 
                (movie.recommendedBy ? agentProfiles.agents[movie.recommendedBy].role : 'Unknown');
              
              return `"${movie.title}" (recommended by: ${recommenders})`;
            }).join('; ');
            
            const movieRecommendationsContext = this.recommendedMovies.length > 0 ? 
              `\n\nCurrent movie recommendations in the sidebar: ${recommendedMoviesDetails}.` : 
              '';
            
            // 获取第一轮对话记录
            const firstRoundConversationHistory = this.getFirstRoundConversationHistory();
            
            // 根据对话轮次调整提示
            let moderatorInstructions;
            if (this.conversationRound === 2 && this.userMessageCountInCurrentRound === 1) {
              // 用户刚进入第二轮，moderator提供第一轮的总结
              moderatorInstructions = `As the moderator with expertise in ${agentProfile.knowledge_domains.join(', ')}, you have access to all the previous discussions and insights from our movie experts (Ethan Maxwell, Maya Cole, and Jake Robinson).\n\n${firstRoundConversationHistory}${movieRecommendationsContext}\n\nProvide a comprehensive summary of the first round, highlighting key points from each expert. Draw the user's attention to the movie recommendations and explain which experts recommended which films. Consider all previous movie evaluations and the user's message.\n\nIf appropriate, recommend additional movies that align with the user's preferences or ask follow-up questions to better understand their tastes. Keep your response conversational, helpful, and engaging.`;
            } else {
              // 第二轮的后续消息，直接自然对话
              moderatorInstructions = `As the moderator with expertise in ${agentProfile.knowledge_domains.join(', ')}, engage in a natural conversation with the user about movies. Respond directly to their question or comment without summarizing previous discussions.\n\n${firstRoundConversationHistory}\n\nYou are now in a casual conversation phase where you should simply answer the user's questions or respond to their comments naturally. Keep your response conversational, helpful, and focused on the user's immediate query. You can still recommend movies if relevant to the conversation, but there's no need to reference the experts unless directly relevant to the user's question.`;
            }
            
            prompt = `${conversationHistory}\n\n${agentContext}${movieRecommendationsContext}\n\n${moderatorInstructions}`;
            
            // 输出第二轮或第三轮对话的 prompt 到控制台
            console.log(`%c第${this.conversationRound}轮对话 Prompt:`, 'color: green; font-weight: bold; font-size: 14px');
            console.log(prompt);
          }
          
          const data = {
            model: MODEL,
            messages: [{
              role: 'user',
              content: prompt
            }],
            max_tokens: 1000 // Increased token limit for more meaningful responses
          };

          console.log(`Sending API request for ${agentProfile.role}...`);
          try {
            console.log(`API request details: URL=${BASE_URL}/chat/completions, model=${MODEL} (through proxy)`);
            // Define headers for the API request
            const headers = {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${API_KEY}`
            };
            const response = await axios.post(`${BASE_URL}/chat/completions`, data, { headers, timeout: API_TIMEOUT });
            console.log(`Received API response for ${agentProfile.role}:`, response.status);
            const agentResponse = response.data.choices[0].message.content;
            
            // 不再添加角色名称前缀
            let displayText = agentResponse;
            
            // 如果回复已经包含角色名称前缀，则去掉
            if (agentResponse.startsWith(agentProfile.role + ':') || 
                agentResponse.startsWith(agentProfile.role + ' :')) {
              const prefixMatch = agentResponse.match(/^[^:]+:\s*/);
              if (prefixMatch) {
                displayText = agentResponse.substring(prefixMatch[0].length);
              }
            }
            
            // 关闭该专家的输入状态指示
            this.setAgentTypingStatus(agentKey, false);
            
            // 分割长回复并获取消息数组
            console.log(`%c专家 ${agentKey} 的回复已生成，准备显示`, 'background: #070; color: #fff; padding: 2px;');
            const messagesArray = await this.splitAndAddMessages(displayText, agentKey);
            
            if (this.conversationRound === 1) {
              // 在第一轮对话中，立即显示这个专家的回复
              console.log(`%c立即显示专家 ${agentKey} 的回复`, 'background: #070; color: #fff; padding: 2px;');
              await this.addMessagesWithDelay(messagesArray, agentKey, true); // true表示这是并行处理的一部分
              
              // 将消息数组也存储在专家消息映射中（用于记录）
              expertMessagesMap[agentKey] = messagesArray;
            } else {
              // 在其他轮次中，直接显示消息
              await this.addMessagesWithDelay(messagesArray, agentKey);
            }
            
            // Log agent message to Firebase，添加会话ID
            try {
              await logConversation('2', 'agent', agentResponse, agentKey, this.sessionId);
            } catch (error) {
              console.warn('Failed to log agent message to Firebase:', error);
            }
            
            // Update agent memory with this interaction
            this.updateAgentMemory(agentKey, userMessage, agentResponse);
            
            // Update conversation history
            conversationHistory += `\n${agentProfile.role}: ${agentResponse}`;
          } catch (error) {
            console.error(`Error generating response for ${agentProfile.role}:`, error);
            console.error('Error details:', error.response ? error.response.data : 'No response data');
            
            // Try using backup API with proxy
            if (error.response && error.response.status === 401) {
              console.log('Trying backup API through proxy...');
              headers.Authorization = `Bearer ${BACKUP_API_KEY}`;
              const backupResponse = await axios.post(`${BASE_URL}/chat/completions`, data, { headers, timeout: API_TIMEOUT });
              if (backupResponse.data && backupResponse.data.choices && backupResponse.data.choices.length > 0) {
                console.log('Backup API response received');
                const backupAgentResponse = backupResponse.data.choices[0].message.content;
                const messagePromise = this.splitAndAddMessages(backupAgentResponse, agentKey);
                
                // 将Promise添加到数组中
                if (this.conversationRound === 1) {
                  expertResponsePromises.push(messagePromise);
                }
                
                await messagePromise;
              } else {
                console.error('Backup API response invalid:', backupResponse.data);
              }
            } else {
              // Add a fallback message for this specific agent
              this.addMessage({
                sender: 'agent',
                agentType: agentKey,
                text: `${agentProfile.role}: I'm having trouble formulating my thoughts right now. Let me think about this...`,
                timestamp: new Date()
              });
            }
            
            // Add a small delay between agent responses to make it feel more natural
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        });
        
        // 并行处理所有专家回复
        try {
          // 并行执行所有专家回复的处理
          await Promise.all(processAgentResponses);
          console.log('%c所有专家回复处理完成', 'background: #070; color: #fff; padding: 2px;');
        } catch (error) {
          console.error('处理专家回复时出错:', error);
        } finally {
          // 无论成功还是失败，都重置组讨论状态
          this.isGroupDiscussionInProgress = false;
          
          // 确保所有专家的输入状态都被关闭
          selectedAgents.forEach(agentKey => {
            this.setAgentTypingStatus(agentKey, false);
          });
          
          // 处理电影推荐总结
          this.processMovieRecommendations();
        }
        
        // 在第一轮对话所有专家回复完成后，自动触发Moderator总结
        // 注意：在第一轮对话中，我们始终选择三个专家回复，所以这个条件总是成立的
        if (this.conversationRound === 1) {
          console.log('%c第一轮对话专家回复完成，所有消息已显示完毕，准备触发Moderator总结', 'color: orange; font-weight: bold; font-size: 14px');
          console.log('%c当前消息列表状态:', 'background: #222; color: #ff9; padding: 2px;', this.messages.map(m => ({
            时间: new Date(m.timestamp).toLocaleTimeString(),
            发送者: m.sender,
            代理类型: m.agentType || 'N/A',
            文本开头: m.text.substring(0, 30) + '...'
          })));
          console.log('%c当前消息总数:', 'background: #222; color: #ff9; padding: 2px;', this.messages.length);
          
          // 添加短暂延迟，确保UI更新完成
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // 获取第一轮对话记录和电影推荐信息
          const firstRoundConversationHistory = this.getFirstRoundConversationHistory();
          const recommendedMoviesDetails = this.recommendedMovies.map(movie => {
            const recommenders = movie.recommendedByAgents ? 
              movie.recommendedByAgents.map(rec => agentProfiles.agents[rec.agentType].role).join(', ') : 
              (movie.recommendedBy ? agentProfiles.agents[movie.recommendedBy].role : 'Unknown');
            
            return `"${movie.title}" (recommended by: ${recommenders})`;
          }).join('; ');
          
          const movieRecommendationsContext = this.recommendedMovies.length > 0 ? 
            `\n\nCurrent movie recommendations in the sidebar: ${recommendedMoviesDetails}.` : 
            '';
          
          // 构建Moderator总结的提示词
          const moderatorSummaryPrompt = `${conversationHistory}\n\nAs the moderator with expertise in ${agentProfiles.agents['moderator'].knowledge_domains.join(', ')}, you have access to all the previous discussions and insights from our movie experts (Ethan Maxwell, Maya Cole, and Jake Robinson).\n\n${firstRoundConversationHistory}${movieRecommendationsContext}\n\nProvide a comprehensive summary of the first round, highlighting key points from each expert. Draw the user's attention to the movie recommendations and explain which experts recommended which films. Consider all previous movie evaluations and the user's message.\n\nIf appropriate, recommend additional movies that align with the user's preferences or ask follow-up questions to better understand their tastes. Keep your response conversational, helpful, and engaging.`;
          
          console.log('%cModerator总结提示词:', 'color: orange; font-weight: bold; font-size: 14px');
          console.log(moderatorSummaryPrompt);
          
          // 发送API请求获取Moderator总结
          const data = {
            model: MODEL,
            messages: [{
              role: 'user',
              content: moderatorSummaryPrompt
            }],
            max_tokens: 1000
          };
          
          // 定义API请求的headers
          const moderatorHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          };
          
          try {
            console.log('发送Moderator总结API请求...');
            const response = await axios.post(`${BASE_URL}/chat/completions`, data, { headers: moderatorHeaders, timeout: 60000 });
            console.log('收到Moderator总结API响应:', response.status);
            const moderatorSummary = response.data.choices[0].message.content;
            
            // 添加过渡语 - 使用更明显的过渡语
            const transitionText = "Now that we've heard from our three film experts, let me summarize the key points from our discussion. ";
            
            console.log('%c准备添加过渡语到Moderator总结', 'background: #f0f; color: #fff; padding: 2px;', {
              过渡语: transitionText,
              原始Moderator总结开头: moderatorSummary.substring(0, 50) + '...'
            });
            
            // 处理角色名称前缀
            let cleanedSummary = moderatorSummary;
            if (moderatorSummary.startsWith('Moderator:') || 
                moderatorSummary.startsWith('Moderator :')) {
              const prefixMatch = moderatorSummary.match(/^[^:]+:\s*/);
              if (prefixMatch) {
                cleanedSummary = moderatorSummary.substring(prefixMatch[0].length);
                console.log('%c移除了Moderator前缀', 'background: #f0f; color: #fff; padding: 2px;', {
                  前缀: prefixMatch[0],
                  处理后的文本: cleanedSummary.substring(0, 50) + '...'
                });
              }
            }
            
            // 将过渡语作为单独的消息添加
            console.log('%c先添加过渡语作为单独消息', 'background: #f0f; color: #fff; padding: 2px;');
            await this.addMessage({
              sender: 'agent',
              agentType: 'moderator',
              text: transitionText,
              timestamp: new Date()
            });
            
            // 等待一小段时间再添加主要内容
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            console.log('%c然后添加主要总结内容', 'background: #f0f; color: #fff; padding: 2px;', {
              总结内容开头: cleanedSummary.substring(0, 100) + '...'
            });
            
            // 分割长回复并获取消息数组
            const moderatorMessages = await this.splitAndAddMessages(cleanedSummary, 'moderator');
            
            // 使用addMessagesWithDelay方法将消息添加到界面上
            await this.addMessagesWithDelay(moderatorMessages, 'moderator');
            
            // 记录Moderator总结到Firebase
            try {
              await logConversation('2', 'agent', moderatorSummary, 'moderator');
            } catch (error) {
              console.warn('Failed to log moderator summary to Firebase:', error);
            }
            
            // 更新Moderator的记忆
            this.updateAgentMemory('moderator', userMessage, moderatorSummary);
          } catch (error) {
            console.error('Error generating moderator summary:', error);
            console.error('Error details:', error.response ? error.response.data : 'No response data');
          }
        }
        
        // 禁用智能体之间的互动响应，确保只有随机选择的一个智能体发言
        console.log('Agent-to-agent response disabled to ensure only one agent responds at a time.');
        
        // 如果当前是第一轮对话，并且用户已经发送了至少一条消息，自动进入第二轮
        if (this.conversationRound === 1 && this.userMessageCount >= this.minRequiredMessages) {
          console.log('%c所有agent回复完毕，自动进入第二轮对话', 'color: red; font-weight: bold; font-size: 14px');
          
          // 保存第一轮的聊天记录
          this.saveFirstRoundMessages();
          console.log('第一轮聊天记录已保存:', this.firstRoundMessages);
          
          // 设置对话轮次为第二轮
          this.conversationRound = 2;
          console.log('%c已转换到第2轮对话', 'color: red; font-weight: bold; font-size: 14px');
          
          // 构建推荐电影的提示信息
          let movieRecommendationsText = "";
          if (this.recommendedMovies.length > 0) {
            movieRecommendationsText = ` I notice our panel has recommended some movies for you. `;
          }
          
          // 添加moderator的过渡消息 - 已注释掉
          /* this.addMessage({
            sender: 'agent',
            agentType: 'moderator',
            text: `Thank you for sharing your thoughts with our panel. We're now moving to the second part of our discussion where I'll be your primary guide, drawing on all the insights from our experts.${movieRecommendationsText} Based on your interests and our experts' perspectives, I can help you explore movies that might resonate with you. What aspects of the discussion so far have interested you most?`,
            timestamp: new Date()
          }); */
          
          // 记录转换到第二轮的事件
          try {
            logUserEvent('transition_to_round_2');
            logConversation('2', 'system', 'User has transitioned to Round 2', null, this.sessionId);
          } catch (error) {
            console.warn('Failed to log transition message to Firebase:', error);
          }
        }
      } catch (error) {
        console.error('Error calling GPT-4o API:', error);
        if (error.response) {
          console.error('API error response:', error.response.status, error.response.data);
        } else if (error.request) {
          console.error('No response received from API:', error.request);
        } else {
          console.error('Error setting up API request:', error.message);
        }
        
        // Add a fallback message if API call fails
        this.addMessage({
          sender: 'agent',
          agentType: 'moderator',
          text: "Moderator: I apologize, but I'm having trouble connecting to our discussion system. Please try again in a moment.",
          timestamp: new Date()
        });
      } finally {
        this.isAgentTyping = false;
        this.isSubmitting = false;
      }
    },
    addMessage(message) {
      console.log('%c添加消息 =>', 'background: #333; color: #bada55; padding: 2px;', {
        时间: new Date().toLocaleTimeString(),
        发送者: message.sender,
        代理类型: message.agentType || 'N/A',
        文本: message.text.substring(0, 50) + (message.text.length > 50 ? '...' : '')
      });
      
      // DEBUG: Log the complete message being added to the UI
      if (message.sender === 'agent') {
        console.log(`%c[DEBUG] 添加到UI的完整消息:`, "background: #333; color: #bada55; padding: 2px;", {
          发送者: message.sender,
          代理类型: message.agentType || 'N/A',
          完整文本: message.text
        });
      }
      this.messages.push(message);
      
      // Scroll to bottom of messages container
      this.$nextTick(() => {
        this.scrollToBottom();
      });
    },
    formatTime(timestamp) {
      return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },
    async finishConversation() {
      if (!this.canProceed) {
        return;
      }
      
      this.isSubmitting = true;
      
      try {
        // Log completion of second round
        await logUserEvent('second_round_completed', {
          messageCount: this.messages.length,
          userMessageCount: this.userMessageCount
        });
        
        // 导航到中间问卷（在问卷页面才会标记系统为完成）
        this.$router.push('/middle-questionnaire');
      } catch (error) {
        console.error('Error completing second round:', error);
        this.isSubmitting = false;
        alert('There was an error completing this round. Please try again.');
      }
    },
    // Build conversation history from previous messages
    buildConversationHistory() {
      // Limit to last 10 messages to avoid token limits
      const recentMessages = this.messages.slice(-10);
      return recentMessages.map(msg => {
        if (msg.sender === 'user') {
          return `User: ${msg.text}`;
        } else {
          return msg.text; // Agent messages already include their role
        }
      }).join('\n');
    },
    
    // Detect if user is responding to specific agents
    detectTargetedAgents(userMessage) {
      const lowerMessage = userMessage.toLowerCase();
      const targetedAgents = new Set(); // Use a Set to avoid duplicates
      
      // 增强的代理名称映射，包含全名和角色名
      const agentNameMap = {
        'ethan maxwell': 'professional_critic',
        'ethan': 'professional_critic',
        'maxwell': 'professional_critic',
        'professional critic': 'professional_critic',
        'critic': 'professional_critic',
        
        'maya cole': 'indie_enthusiast',
        'maya': 'indie_enthusiast',
        'cole': 'indie_enthusiast',
        'indie enthusiast': 'indie_enthusiast',
        'indie': 'indie_enthusiast',
        
        'jake robinson': 'blockbuster_fan',
        'jake': 'blockbuster_fan',
        'robinson': 'blockbuster_fan',
        'blockbuster fan': 'blockbuster_fan',
        'blockbuster': 'blockbuster_fan',
        
        'moderator': 'moderator'
      };
      
      // 检查@提及（最高优先级）
      const atMentionRegex = /@(\w+\s*\w*)/gi;
      const atMentions = userMessage.match(atMentionRegex);
      
      if (atMentions && atMentions.length > 0) {
        console.log('检测到@提及:', atMentions);
        let foundExplicitMention = false;
        
        // 处理每个@提及
        for (const mention of atMentions) {
          // 去掉@符号并转为小写
          const mentionText = mention.substring(1).toLowerCase().trim();
          
          // 检查是否匹配任何代理名称
          for (const [agentName, agentKey] of Object.entries(agentNameMap)) {
            if (mentionText === agentName || agentName.includes(mentionText)) {
              targetedAgents.add(agentKey);
              foundExplicitMention = true;
              console.log(`@提及 "${mentionText}" 匹配到代理:`, agentKey);
              break;
            }
          }
        }
        
        // 如果找到了明确的@提及，直接返回结果
        if (foundExplicitMention) {
          return Array.from(targetedAgents);
        }
      }
      
      // 如果没有找到@提及，检查消息中是否包含代理名称（不带@符号）
      for (const [agentName, agentKey] of Object.entries(agentNameMap)) {
        if (lowerMessage.includes(agentName)) {
          targetedAgents.add(agentKey);
        }
      }
      
      // 不再根据短消息自动判断用户是在回应最后一个代理
      // 只有当消息中包含明确的回应指示词时，才认为是针对最后一个代理的回应
      if (targetedAgents.size === 0 && this.messages.length > 0) {
        // Find the last agent message
        for (let i = this.messages.length - 1; i >= 0; i--) {
          if (this.messages[i].sender === 'agent') {
            const lastAgentMessage = this.messages[i];
            const agentType = lastAgentMessage.agentType;
            
            // 只检查明确的回应指示词
            const responseIndicators = ['yes', 'no', 'agree', 'disagree', 'why', 'what', 'how', 'tell me more'];
            const isDirectResponse = responseIndicators.some(indicator => lowerMessage.includes(indicator));
            
            if (isDirectResponse) {
              targetedAgents.add(agentType);
            }
            
            break;
          }
        }
      }
      
      return Array.from(targetedAgents);
    },
    
    // Legacy function for backward compatibility
    detectTargetedAgent(userMessage) {
      const agents = this.detectTargetedAgents(userMessage);
      return agents.length > 0 ? agents[0] : null;
    },
    
    // Format agent responses using Markdown format
    formatAgentResponse(text) {
      if (!text) return '';
      
      // 保存原始消息
      const originalText = text;
      
      // 移除电影详情格式的文本
      text = this.removeMovieDetailsFromText(text);
      
      // 处理Markdown标题语法
      // 将#### (h4)转换为HTML标题标签
      text = text.replace(/^####\s+(.*?)$/gm, '<h4>$1</h4>');
      // 将### (h3)转换为HTML标题标签
      text = text.replace(/^###\s+(.*?)$/gm, '<h3>$1</h3>');
      // 将## (h2)转换为HTML标题标签
      text = text.replace(/^##\s+(.*?)$/gm, '<h2>$1</h2>');
      // 将# (h1)转换为HTML标题标签
      text = text.replace(/^#\s+(.*?)$/gm, '<h1>$1</h1>');
      
      // 将Markdown加粗语法转换为HTML加粗标签
      text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // 将Markdown斜体语法转换为HTML斜体标签
      text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
      
      // 处理数字列表，确保每个列表项前有换行
      text = text.replace(/((?:^|\.|!|\?)\s*)(\d+\.)/g, '$1<br>$2');
      
      // 在特定列表标题的冒号后添加换行，但避免影响电影标题中的冒号
      text = text.replace(/(\d+\.\s*<strong>[A-Za-z\s]+<\/strong>):(\s+)/g, '$1:<br>$2');
      
      // 将普通换行符转换为HTML换行标签
      text = text.replace(/\n/g, '<br>');
      
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
    
    // Get agent memories from localStorage
    getAgentMemories() {
      try {
        const memories = localStorage.getItem('agent_memories');
        return memories ? JSON.parse(memories) : {};
      } catch (error) {
        console.error('Error retrieving agent memories:', error);
        return {};
      }
    },
    
    // Get combined memories from all agents for the moderator in round 2
    getCombinedAgentMemories() {
      try {
        const memories = this.getAgentMemories();
        let combinedMemory = [];
        
        // Collect memories from all agents
        for (const agentKey of ['professional_critic', 'indie_enthusiast', 'blockbuster_fan']) {
          if (memories[agentKey] && memories[agentKey].length > 0) {
            const agentRole = agentProfiles.agents[agentKey].role;
            combinedMemory.push(`${agentRole}'s insights: ${memories[agentKey].join('\n')}`);
          }
        }
        
        return combinedMemory.join('\n\n');
      } catch (error) {
        console.error('Error retrieving combined agent memories:', error);
        return '';
      }
    },
    
    // Update agent memory with new interaction
    updateAgentMemory(agentKey, userMessage, agentResponse) {
      try {
        const memories = this.getAgentMemories();
        
        // Initialize agent memory if it doesn't exist
        if (!memories[agentKey]) {
          memories[agentKey] = [];
        }
        
        // Add new interaction to memory
        memories[agentKey].push(`User: ${userMessage}\n${agentProfiles.agents[agentKey].role}: ${agentResponse}`);
        
        // Limit memory size (keep last 5 interactions)
        if (memories[agentKey].length > 5) {
          memories[agentKey] = memories[agentKey].slice(-5);
        }
        
        // Save updated memories
        localStorage.setItem('agent_memories', JSON.stringify(memories));
      } catch (error) {
        console.error('Error updating agent memory:', error);
      }
    },
    
    // Get previous movie recommendations for agents to evaluate
    getPreviousMovieRecommendations() {
      // Return a list of movie titles that have been recommended so far
      return this.recommendedMovies.map(movie => movie.title);
    },
    getAgentAvatar(agentType) {
      const avatarMap = {
        'moderator': p1Image,
        'professional_critic': p2Image,
        'indie_enthusiast': p3Image,
        'blockbuster_fan': p4Image
      };
      
      return avatarMap[agentType] || p1Image; // Default to moderator avatar if type not found
    },
    replyToAgent(agentType, event) {
      // This method has been intentionally emptied to remove the auto-mention functionality
      // when clicking on agent messages, as we now have the @ mention list feature
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
      const agentName = agentNameMap[agentKey] || agentProfiles.agents[agentKey].role;
      
      // 检查当前输入是否已经包含@提及
      if (this.userInput.trim()) {
        // 如果已有内容，检查是否已包含该代理的@提及
        if (!this.userInput.includes(`@${agentName}`)) {
          // 如果不包含，在末尾添加@提及
          this.userInput = this.userInput.trim() + ` @${agentName} `;
        }
      } else {
        // 如果输入为空，直接添加@提及
        this.userInput = `@${agentName} `;
      }
    },
    // 使用API提取电影名称
    async extractMoviesWithAPI(text, agentType) {
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
                if (movie.title && this.isValidMovieTitle(movie.title)) {
                  // 标准化电影标题
                  const normalizedTitle = this.normalizeMovieTitle(movie.title);
                  
                  // 只处理支持态度的电影
                  if (movie.attitude === 'support') {
                    console.log(`代理 ${agentType} 推荐电影: "${normalizedTitle}"`);
                    
                    // 检查电影是否已经在推荐列表中
                    const existingMovie = this.tempRoundMovies.find(m => 
                      this.normalizeMovieTitle(m.title).toLowerCase() === normalizedTitle.toLowerCase()
                    );
                    
                    if (existingMovie) {
                      // 如果已存在，更新支持代理
                      if (!existingMovie.supportingAgents.includes(agentType)) {
                        existingMovie.supportingAgents.push(agentType);
                        console.log(`更新电影 "${normalizedTitle}" 的支持代理列表`);
                      }
                      
                      // 更新recommendedByAgents
                      if (!existingMovie.recommendedByAgents) {
                        existingMovie.recommendedByAgents = [];
                      }
                      
                      const agentExists = existingMovie.recommendedByAgents.some(a => a.agentType === agentType);
                      if (!agentExists) {
                        existingMovie.recommendedByAgents.push({
                          agentType,
                          timestamp: new Date(),
                          reason: '',
                          attitude: 'support'
                        });
                      }
                    } else {
                      // 如果不存在，添加到临时电影列表
                      const newMovie = {
                        title: normalizedTitle,
                        supportingAgents: [agentType],
                        recommendedByAgents: [{
                          agentType,
                          timestamp: new Date(),
                          reason: '',
                          attitude: 'support'
                        }],
                        recommendCount: 1
                      };
                      
                      this.tempRoundMovies.push(newMovie);
                      console.log(`添加新电影 "${normalizedTitle}" 到临时推荐列表`);
                    }
                  } else {
                    console.log(`代理 ${agentType} 对电影 "${normalizedTitle}" 的态度: ${movie.attitude}`);
                  }
                }
              }
            }
          } catch (parseError) {
            console.error('解析API返回的电影数据失败:', parseError);
          }
        }
      } catch (error) {
        console.error('使用API提取电影名称时出错:', error);
        console.error('错误详情:', error.response ? error.response.data : '无响应数据');
        
        // 如果API调用失败，回退到正则表达式方法
        console.log('回退到正则表达式方法提取电影名称');
        await this.extractMovieRecommendation(text, agentType);
      }
    },
    
    // Extract movie recommendations from agent responses
    async extractMovieRecommendation(text, agentType) {
      // 使用特定模式提取明确的电影推荐
      const recommendationPatterns = [
        /I recommend (?:watching |seeing )?["'](.+?)["']/ig,
        /You might enjoy ["'](.+?)["']/ig,
        /Have you seen ["'](.+?)["']/ig,
        /["'](.+?)["'] is a great film/ig,
        /["'](.+?)["'] would be perfect for you/ig,
        /["'](.+?)["'] is (?:an |a )?(?:excellent|amazing|fantastic|wonderful|great) (?:movie|film)/ig,
        // Additional patterns to catch more movie mentions
        /(?:check out|watch|try|see) ["'](.+?)["']/ig,
        /(?:film|movie) ["'](.+?)["']/ig,
        /["'](.+?)["'] (?:directed by|starring|features)/ig,
        /["'](.+?)["'] (?:came out|was released|released) in \d{4}/ig,
        /["'](.+?)["'] (?:is|was) (?:a )?(?:film|movie)/ig,
        /["'](.+?)["'] (?:by director|by filmmaker)/ig
      ];      
      // Markdown 中的电影名称格式
      const markdownMoviePatterns = [
        // 粗体格式 **电影名**
        /\*\*([^*]+)\*\*/g,
        // 斜体格式 *电影名*
        /(?<!\*)\*([^*]+)\*(?!\*)/g,
        // 下划线格式 _电影名_
        /_([^_]+)_/g,
        // 反引号格式 `电影名`
        /`([^`]+)`/g
      ];      
        
      // 电影相关上下文关键词
      const movieContextKeywords = [
        "film", "movie", "cinema", "watch", "director", "actor", "actress", 
        "screenplay", "plot", "scene", "character", "starring", "award", 
        "oscar", "rating", "review", "recommend", "classic", "blockbuster"
      ];
      
      // 检查提取的文本周围是否有电影相关上下文
      const hasMovieContext = (fullText, potentialTitle, windowSize = 50) => {
        // 获取潜在电影名前后的文本
        const titleIndex = fullText.indexOf(potentialTitle);
        if (titleIndex === -1) return false;
        
        const startIndex = Math.max(0, titleIndex - windowSize);
        const endIndex = Math.min(fullText.length, titleIndex + potentialTitle.length + windowSize);
        
        const contextText = fullText.substring(startIndex, endIndex).toLowerCase();
        
        // 检查上下文中是否包含电影相关关键词
        return movieContextKeywords.some(keyword => contextText.includes(keyword.toLowerCase()));
      };
      
      // 检测电影名后是否跟着年份 (2023)
      //const movieWithYearPattern = /([^(]+)\s*\((\d{4})\)/g;
      
      const extractedMovies = new Set();
      
      // 首先使用特定模式提取明确的电影推荐
      for (const pattern of recommendationPatterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          if (match[1] && this.isValidMovieTitle(match[1])) {
            extractedMovies.add(match[1]);
          }
        }
      }
      
      // 然后提取引号中的内容，但要更谨慎
      // 使用更精确的模式来避免捕获单引号中的内容
      const doubleQuotePattern = /"([^"]+)"/g; // 只匹配双引号
      let quoteMatch;
      
      while ((quoteMatch = doubleQuotePattern.exec(text)) !== null) {
        if (quoteMatch[1] && this.isValidMovieTitle(quoteMatch[1])) {
          extractedMovies.add(quoteMatch[1]);
        }
      }
      
      // 提取 Markdown 格式中的潜在电影名
      for (const pattern of markdownMoviePatterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          const potentialTitle = match[1].trim();
          // 只检查标题是否有效，并且确保它在电影相关上下文中
          if (this.isValidMovieTitle(potentialTitle) && hasMovieContext(text, potentialTitle)) {
            extractedMovies.add(potentialTitle);
            console.log(`从Markdown格式中提取到潜在电影: "${potentialTitle}"`);
          }
        }
      }
      
      // 提取带年份的电影名
      /*let yearMatch;
      while ((yearMatch = movieWithYearPattern.exec(text)) !== null) {
        const title = yearMatch[1].trim();
        const year = yearMatch[2];
        
        if (this.isValidMovieTitle(title)) {
          extractedMovies.add(title);
          console.log(`提取到带年份的电影: "${title}" (${year})`);
        }
      }*/
      
      // 处理提取到的所有电影
      if (extractedMovies.size > 0) {
        console.log(`从 ${agentType} 的回复中提取到 ${extractedMovies.size} 部电影:`);
      }
      
      // 使用Promise.all来并行处理所有电影推荐
      const moviePromises = Array.from(extractedMovies).map(async (movieTitle) => {
        // 检查电影是否已经在IMDB中验证过
        if (this.validatedMovies && this.validatedMovies.has(movieTitle.toLowerCase())) {
          const isValidMovie = this.validatedMovies.get(movieTitle.toLowerCase());
          if (!isValidMovie) {
            console.log(`跳过电影 "${movieTitle}"，因为它在IMDB中未找到`);
            return; // 跳过已知不存在于IMDB的电影
          }
        }
        
        // 标准化电影标题
        const normalizedTitle = this.normalizeMovieTitle(movieTitle);
        
        // 检测代理对电影的态度（support, oppose, indifferent）
        const attitude = this.detectMovieAttitude(text, movieTitle);
        
        console.log(`代理 ${agentType} 对电影 "${movieTitle}" 的态度: ${attitude}`);
        
        // 只有当态度为 support 时才添加到推荐列表
        if (attitude !== 'support') {
          console.log(`代理 ${agentType} 对电影 "${movieTitle}" 不是支持态度，不添加到推荐列表`);
          return;
        }
        
        // 检查这部电影是否已经在临时存储中
        const existingTempMovie = this.tempRoundMovies.find(m => 
          this.normalizeMovieTitle(m.title).toLowerCase() === normalizedTitle.toLowerCase() || 
          m.title.toLowerCase() === movieTitle.toLowerCase());
        
        console.log(`DEBUG: 检查电影 "${movieTitle}" 是否已在临时存储中:`, existingTempMovie ? '已存在' : '不存在');
        
        if (existingTempMovie) {
          console.log(`电影 "${movieTitle}" 已经在临时存储中，标题为 "${existingTempMovie.title}"`);
          // 如果已存在，使用现有电影标题，避免重复添加
          movieTitle = existingTempMovie.title;
        }
        
        // 同时检查这部电影是否已经在最终推荐列表中
        const existingMovie = this.recommendedMovies.find(m => 
          this.normalizeMovieTitle(m.title).toLowerCase() === normalizedTitle.toLowerCase() || 
          m.title.toLowerCase() === movieTitle.toLowerCase());
        
        if (existingMovie) {
          console.log(`电影 "${movieTitle}" 已经在最终推荐列表中，标题为 "${existingMovie.title}"`);
          movieTitle = existingMovie.title;
        }
        
        // 如果电影已经在IMDB中验证并存在
        if (this.validatedMovies && this.validatedMovies.get(movieTitle.toLowerCase()) === true) {
          // 检查这部电影是否已经在临时存储中
          const existingTempMovie = this.tempRoundMovies.find(m => 
            this.normalizeMovieTitle(m.title).toLowerCase() === normalizedTitle.toLowerCase());
          
          if (existingTempMovie) {
            // 如果电影已经在临时存储中，更新支持它的代理
            console.log(`DEBUG: 找到临时存储中的电影:`, existingTempMovie);
            
            // 更新支持代理列表
            if (!existingTempMovie.supportingAgents.includes(agentType)) {
              existingTempMovie.supportingAgents.push(agentType);
              console.log(`更新电影 "${normalizedTitle}" 的支持代理，新增 ${agentType}`);
            }
            
            // 更新recommendedByAgents数组，确保包含当前代理
            if (!existingTempMovie.recommendedByAgents) {
              existingTempMovie.recommendedByAgents = [];
            }
            
            // 检查当前代理是否已经在recommendedByAgents列表中
            const agentExists = existingTempMovie.recommendedByAgents.some(a => a.agentType === agentType);
            if (!agentExists) {
              existingTempMovie.recommendedByAgents.push({
                agentType: agentType,
                timestamp: new Date(),
                reason: this.extractRecommendationReason(text, movieTitle),
                attitude: attitude
              });
              console.log(`DEBUG: 添加代理 ${agentType} 到电影 "${normalizedTitle}" 的recommendedByAgents列表`);
            }
            
            // 更新推荐计数
            existingTempMovie.recommendCount = existingTempMovie.recommendedByAgents ? existingTempMovie.recommendedByAgents.length : existingTempMovie.supportingAgents.length;
            console.log(`DEBUG: 更新电影 "${normalizedTitle}" 的推荐计数为 ${existingTempMovie.recommendCount}`);
          } else {
            // 如果电影不在临时存储中，添加它
            console.log(`DEBUG: 创建新电影卡片: "${movieTitle}"`);
            const movieInfo = {
              title: this.normalizeMovieTitle(movieTitle),
              recommendedByAgents: [{
                agentType: agentType,
                timestamp: new Date(),
                reason: this.extractRecommendationReason(text, movieTitle),
                attitude: attitude
              }],
              recommendCount: 1,
              timestamp: new Date(),
              userRating: 0, // 初始化用户评分为0（表示未评分）
              supportingAgents: [agentType]
            };
            
            // 立即异步获取电影海报和详细信息
            try {
              const movieDetails = await this.fetchMovieDetails(movieTitle);
              if (movieDetails) {
                // 将获取到的电影详情合并到movieInfo中
                // 确保特殊字符不会被错误解析为 Markdown 格式
                movieInfo.Poster = movieDetails.Poster;
                // 处理可能包含特殊字符的字段
                if (movieDetails.Director) {
                  movieInfo.Director = this.escapeMarkdownSpecialChars(movieDetails.Director);
                }
                movieInfo.imdbRating = movieDetails.imdbRating;
                movieInfo.Year = movieDetails.Year;
                movieInfo.imdbID = movieDetails.imdbID; // 保存IMDB ID
                // 处理其他可能包含特殊字符的字段
                if (movieDetails.Plot) {
                  movieInfo.Plot = this.escapeMarkdownSpecialChars(movieDetails.Plot);
                }
                if (movieDetails.Actors) {
                  movieInfo.Actors = this.escapeMarkdownSpecialChars(movieDetails.Actors);
                }
                if (movieDetails.Genre) {
                  movieInfo.Genre = this.escapeMarkdownSpecialChars(movieDetails.Genre);
                }
                console.log(`成功获取电影 "${movieTitle}" 的海报和详细信息`);
              } else {
                console.log(`无法获取电影 "${movieTitle}" 的详细信息`);
              }
            } catch (error) {
              console.error(`获取电影 "${movieTitle}" 详细信息时出错:`, error);
            }
            
            this.tempRoundMovies.push(movieInfo);
            console.log(`将经IMDB验证的电影 "${movieTitle}" 添加到临时存储，支持代理: ${agentType}`);
          }
          
          // 检查这部电影是否已经在最终推荐列表中
          const existingMovie = this.recommendedMovies.find(m => 
            this.normalizeMovieTitle(m.title).toLowerCase() === normalizedTitle.toLowerCase());
          
          if (existingMovie) {
            // 如果电影已经在最终推荐列表中，也更新其信息
            if (!existingMovie.supportingAgents.includes(agentType)) {
              existingMovie.supportingAgents.push(agentType);
            }
            
            if (!existingMovie.recommendedByAgents) {
              existingMovie.recommendedByAgents = [];
            }
            
            const agentExists = existingMovie.recommendedByAgents.some(a => a.agentType === agentType);
            if (!agentExists) {
              existingMovie.recommendedByAgents.push({
                agentType: agentType,
                timestamp: new Date(),
                reason: this.extractRecommendationReason(text, movieTitle),
                attitude: attitude
              });
            }
            
            existingMovie.recommendCount = existingMovie.recommendedByAgents ? existingMovie.recommendedByAgents.length : existingMovie.supportingAgents.length;
          }
        } else {
          // 如果电影还未验证，添加到待验证队列
          // 检查是否已经在待验证队列中
          const existingPending = this.pendingMovieValidations.find(m => 
            m.title.toLowerCase() === movieTitle.toLowerCase() && m.agentType === agentType);
          
          if (!existingPending) {
            this.pendingMovieValidations.push({
              title: movieTitle,
              agentType: agentType
            });
            console.log(`将电影 "${movieTitle}" 添加到待IMDB验证队列，支持代理: ${agentType}`);
            
            // 异步验证电影，但不等待结果
            this.checkMovieInIMDB(movieTitle);
          }
        }
      });
      
      // 等待所有电影处理完成
      await Promise.all(moviePromises.filter(p => p)); // 过滤掉undefined的promise（来自态度不是support的电影）
      
      if (extractedMovies.size > 0) {
        console.log('-------------------');
      }
    },
    
    // 检查是否是有效的电影标题
    // 检查潜在电影名称是否有效
    isValidMovieTitle(title) {
      // 清理标题，移除结尾的标点符号
      title = this.normalizeMovieTitle(title);
      
      if (!title || title.length < 3 || title.length > 100) {
        return false; // 标题太短或太长
      }
      
      // 检查是否包含撤号，这可能是词组的一部分，而不是电影标题
      if (title.includes("'") && !title.includes(" ")) {
        return false; // 包含撤号但没有空格，可能是缩写形式如 "It's"
      }
      
      // 检查是否是常见的词组或短语
      const commonPhrases = [
        "film", "movie", "cinema", "watch", "director", "actor", "actress", 
        "screenplay", "plot", "scene", "character", "starring", "award", 
        "oscar", "rating", "review", "recommend", "classic", "blockbuster"
      ];
      
      if (commonPhrases.includes(title.toLowerCase())) {
        return false;
      }
      
      // 检查是否是只包含常见词组的长句子
      if (title.split(' ').length > 10) {
        return false; // 过长的句子可能不是电影标题
      }
      
      // 如果基本检查通过，可以开始异步检查IMDB
      // 注意：这里我们不等待异步检查结果，因为这会阻塞消息处理
      // 而是在后台进行检查，结果将用于之后的处理
      this.checkMovieInIMDB(title);
      
      return true;
    },
    
    // 异步检查电影名称是否存在于IMDB数据库中
    async checkMovieInIMDB(title) {
      try {
        // 使用现有的fetchMovieDetails方法查询IMDB
        const movieDetails = await this.fetchMovieDetails(title);
        
        // 如果找到电影，将其添加到验证过的电影缓存中
        if (movieDetails) {
          if (!this.validatedMovies) this.validatedMovies = new Map();
          this.validatedMovies.set(title.toLowerCase(), true);
          console.log(`已验证电影存在于IMDB: "${title}"`);
          
          // 处理待验证队列中的电影
          this.processPendingMovieValidations(title);
          
          return true;
        } else {
          // 如果没找到，也缓存结果以避免重复查询
          if (!this.validatedMovies) this.validatedMovies = new Map();
          this.validatedMovies.set(title.toLowerCase(), false);
          console.log(`电影在IMDB中未找到: "${title}"`);
          
          // 从待验证队列中移除不存在的电影
          this.removePendingMovie(title);
          
          return false;
        }
      } catch (error) {
        console.error(`检查电影"${title}"在IMDB中时出错:`, error);
        return false;
      }
    },
    
    // 处理待验证队列中的电影
    async processPendingMovieValidations(title) {
      // 查找待验证队列中的相关电影
      const pendingMovies = this.pendingMovieValidations.filter(item => 
        item.title.toLowerCase() === title.toLowerCase());
      
      if (pendingMovies.length === 0) return;
      
      console.log(`处理 ${pendingMovies.length} 个待验证的"${title}"电影`);
      
      // 处理每个待验证的电影
      for (const pendingMovie of pendingMovies) {
        // 检查这部电影是否已经被推荐（使用标准化后的标题进行比较）
        const normalizedTitle = this.normalizeMovieTitle(pendingMovie.title);
        const existingMovie = this.recommendedMovies.find(m => 
          this.normalizeMovieTitle(m.title).toLowerCase() === normalizedTitle.toLowerCase());
        
        if (existingMovie) {
          // 如果电影已经在推荐列表中，更新支持它的代理
          if (!existingMovie.supportingAgents.includes(pendingMovie.agentType)) {
            existingMovie.supportingAgents.push(pendingMovie.agentType);
            console.log(`更新电影 "${normalizedTitle}" 的支持代理，新增 ${pendingMovie.agentType}`);
          }
          
          // 更新recommendedByAgents数组
          const existingAgent = existingMovie.recommendedByAgents ? 
            existingMovie.recommendedByAgents.find(a => a.agentType === pendingMovie.agentType) : null;
            
          if (existingMovie.recommendedByAgents && !existingAgent) {
            existingMovie.recommendedByAgents.push({
              agentType: pendingMovie.agentType,
              timestamp: new Date(),
              reason: '',  // 在待验证队列中我们没有保存上下文
              attitude: 'support'
            });
            if (existingMovie.recommendCount) {
              existingMovie.recommendCount++;
            }
          }
        } else {
          // 如果电影不在推荐列表中，添加它
          const movieInfo = {
            title: this.normalizeMovieTitle(pendingMovie.title),
            recommendedByAgents: [{
              agentType: pendingMovie.agentType,
              timestamp: new Date(),
              reason: '',  // 在待验证队列中我们没有保存上下文
              attitude: 'support'
            }],
            recommendCount: 1,
            timestamp: new Date(),
            userRating: 0, // 初始化用户评分为0（表示未评分）
            supportingAgents: [pendingMovie.agentType]
          };
          
          // 获取电影详情
          try {
            const movieDetails = await this.fetchMovieDetails(pendingMovie.title);
            if (movieDetails) {
              // 将获取到的电影详情合并到movieInfo中
              // 确保特殊字符不会被错误解析为 Markdown 格式
              movieInfo.Poster = movieDetails.Poster;
              // 处理可能包含特殊字符的字段
              if (movieDetails.Director) {
                movieInfo.Director = this.escapeMarkdownSpecialChars(movieDetails.Director);
              }
              movieInfo.imdbRating = movieDetails.imdbRating;
              movieInfo.Year = movieDetails.Year;
              movieInfo.imdbID = movieDetails.imdbID; // 保存IMDB ID
              // 处理其他可能包含特殊字符的字段
              if (movieDetails.Plot) {
                movieInfo.Plot = this.escapeMarkdownSpecialChars(movieDetails.Plot);
              }
              if (movieDetails.Actors) {
                movieInfo.Actors = this.escapeMarkdownSpecialChars(movieDetails.Actors);
              }
              if (movieDetails.Genre) {
                movieInfo.Genre = this.escapeMarkdownSpecialChars(movieDetails.Genre);
              }
              console.log(`成功获取电影 "${pendingMovie.title}" 的海报和详细信息`);
            } else {
              console.log(`无法获取电影 "${pendingMovie.title}" 的详细信息`);
            }
          } catch (error) {
            console.error(`获取电影 "${pendingMovie.title}" 详细信息时出错:`, error);
          }
          
          this.recommendedMovies.push(movieInfo);
          console.log(`将经IMDB验证的电影 "${pendingMovie.title}" 添加到推荐列表，支持代理: ${pendingMovie.agentType}`);
        }
      }
      
      // 从待验证队列中移除已处理的电影
      this.removePendingMovie(title);
    },
    
    // 从待验证队列中移除电影
    removePendingMovie(title) {
      const lowerTitle = title.toLowerCase();
      this.pendingMovieValidations = this.pendingMovieValidations.filter(item => 
        item.title.toLowerCase() !== lowerTitle);
      console.log(`从待验证队列中移除电影: "${title}"`);
    },

    // 滚动到代理提及电影的消息处
    scrollToAgentMention(movieTitle, agentType) {
      if (!movieTitle || !agentType) {
        console.warn('无效的电影标题或代理类型');
        return;
      }
      
      try {
        // 标准化电影标题，便于比较
        const normalizedTitle = this.normalizeMovieTitle(movieTitle).toLowerCase();
        if (!normalizedTitle) {
          console.warn('标准化后的电影标题为空');
          return;
        }
        
        console.log(`查找代理 ${agentType} 提及电影 "${normalizedTitle}" 的消息`);
        
        // 查找代理提及该电影的消息
        const mentionMessage = this.messages.find(message => {
          // 只查找指定代理的消息
          if (message.sender === 'agent' && message.agentType === agentType) {
            // 检查消息文本中是否包含电影标题
            let messageText = '';
            
            if (typeof message.text === 'string') {
              messageText = message.text;
            } else if (Array.isArray(message.text)) {
              messageText = message.text.join(' ');
            }
            
            if (!messageText) return false;
            
            // 使用安全的方式检查电影标题是否在消息中
            return messageText.toLowerCase().includes(normalizedTitle);
          }
          return false;
        });
        
        if (mentionMessage) {
          console.log('找到匹配的消息:', mentionMessage);
          
          // 找到消息元素
          this.$nextTick(() => {
            const messagesContainer = document.querySelector('.messages-container');
            if (!messagesContainer) {
              console.warn('找不到消息容器元素');
              return;
            }
            
            const messageElements = messagesContainer.querySelectorAll('.message');
            if (!messageElements || messageElements.length === 0) {
              console.warn('找不到消息元素');
              return;
            }
            
            let targetElement = null;
            const messageIndex = this.messages.findIndex(m => 
              m.sender === mentionMessage.sender && 
              m.agentType === mentionMessage.agentType && 
              m.timestamp === mentionMessage.timestamp
            );
            
            if (messageIndex >= 0 && messageIndex < messageElements.length) {
              targetElement = messageElements[messageIndex];
            }
            
            if (targetElement) {
              // 滚动到目标元素
              targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              
              // 添加高亮效果
              targetElement.classList.add('highlighted-message');
              
              // 3秒后移除高亮效果
              setTimeout(() => {
                targetElement.classList.remove('highlighted-message');
              }, 3000);
              
              // 尝试高亮电影标题
              this.highlightMovieTitleInMessage(targetElement, normalizedTitle);
            } else {
              console.warn('找不到对应的消息元素');
            }
          });
        } else {
          console.warn(`找不到代理 ${agentType} 提及电影 "${movieTitle}" 的消息`);
        }
      } catch (error) {
        console.error('跳转到代理提及消息时出错:', error);
      }
    },
    
    // 在消息中高亮电影标题 - 简化版
    highlightMovieTitleInMessage(messageElement, normalizedTitle) {
      try {
        // 查找消息文本元素
        const messageTextElement = messageElement.querySelector('.message-text');
        if (!messageTextElement) {
          console.warn('找不到消息文本元素');
          return;
        }
        
        // 为整个消息添加一个特殊的类
        messageElement.classList.add('message-with-movie-mention');
        
        // 3秒后移除特殊类
        setTimeout(() => {
          messageElement.classList.remove('message-with-movie-mention');
        }, 3000);
      } catch (error) {
        console.error('高亮电影标题时出错:', error);
      }
    },
    
    // 从文本中移除电影详情格式的内容
    removeMovieDetailsFromText(text) {
      if (!text) return text;
      
      // 移除LaTeX格式的电影详情
      text = text.replace(/\$\$\s*\\begin\{aligned\}[\s\S]*?\\end\{aligned\}\s*\$\$/g, '');
      
      // 移除Director, Box Office, Genre等电影详情行
      text = text.replace(/\*\*(?:Director|Box Office|Genre|Cast|Release Date|Runtime|Rating)\*\*:.*?(?=\n|\*\*|$)/g, '');
      
      // 移除空行
      text = text.replace(/\n\s*\n/g, '\n');
      
      return text;
    },
    
    // 从文本中提取电影详情并存储，同时从原文中移除
    cleanMovieDetailsFromText(text, movieTitle) {
      if (!text || !movieTitle) return text;
      
      // 查找与电影相关的详情
      const directorMatch = text.match(new RegExp(`\\*\\*Director\\*\\*:\\s*(.+?)(?=\\n|\\*\\*|$)`, 'i'));
      const genreMatch = text.match(new RegExp(`\\*\\*Genre\\*\\*:\\s*(.+?)(?=\\n|\\*\\*|$)`, 'i'));
      const boxOfficeMatch = text.match(new RegExp(`\\*\\*Box Office\\*\\*:\\s*(.+?)(?=\\n|\\*\\*|$)`, 'i'));
      const castMatch = text.match(new RegExp(`\\*\\*Cast\\*\\*:\\s*(.+?)(?=\\n|\\*\\*|$)`, 'i'));
      
      // 查找现有电影
      const normalizedTitle = this.normalizeMovieTitle(movieTitle);
      const existingMovieIndex = this.recommendedMovies.findIndex(m => 
        this.normalizeMovieTitle(m.title).toLowerCase() === normalizedTitle.toLowerCase());
      
      if (existingMovieIndex !== -1) {
        const movie = this.recommendedMovies[existingMovieIndex];
        
        // 更新电影详情
        if (directorMatch && directorMatch[1] && (!movie.Director || movie.Director === 'N/A')) {
          movie.Director = this.escapeMarkdownSpecialChars(directorMatch[1].trim());
        }
        
        if (genreMatch && genreMatch[1] && (!movie.Genre || movie.Genre === 'N/A')) {
          movie.Genre = this.escapeMarkdownSpecialChars(genreMatch[1].trim());
        }
        
        if (boxOfficeMatch && boxOfficeMatch[1] && (!movie.BoxOffice || movie.BoxOffice === 'N/A')) {
          movie.BoxOffice = this.escapeMarkdownSpecialChars(boxOfficeMatch[1].trim());
        }
        
        if (castMatch && castMatch[1] && (!movie.Actors || movie.Actors === 'N/A')) {
          movie.Actors = this.escapeMarkdownSpecialChars(castMatch[1].trim());
        }
      }
      
      return text;
    },
    
    // 转义 Markdown 特殊字符，防止被错误解析为 Markdown 格式
    escapeMarkdownSpecialChars(text) {
      if (!text) return text;
      
      // 转义 Markdown 特殊字符
      return text
        .replace(/\\/g, '\\\\') // 转义反斜杠
        .replace(/\*/g, '\\*')   // 转义星号
        .replace(/\_/g, '\\_')   // 转义下划线
        .replace(/\$/g, '\\$')   // 转义美元符号（数学公式标记）
        .replace(/\`/g, '\\`')   // 转义反引号
        .replace(/\~/g, '\\~')   // 转义波浪号
        .replace(/\[/g, '\\[')   // 转义左方括号
        .replace(/\]/g, '\\]')   // 转义右方括号
        .replace(/\(/g, '\\(')   // 转义左圆括号
        .replace(/\)/g, '\\)')   // 转义右圆括号
        .replace(/\#/g, '\\#')   // 转义井号
        .replace(/\+/g, '\\+')   // 转义加号
        .replace(/\-/g, '\\-')   // 转义减号
        .replace(/\!/g, '\\!');  // 转义感叹号
    },
    
    // 标准化电影标题，移除结尾的标点符号和多余空格
    normalizeMovieTitle(title) {
      if (!title) return '';
      
      // 移除开头和结尾的标点符号
      let normalized = title.trim().replace(/^[.,!?;:'"]+|[.,!?;:'"]+$/g, '');
      
      // 移除多余空格
      normalized = normalized.replace(/\s+/g, ' ');
      
      // 移除所有引号
      normalized = normalized.replace(/["']/g, '');
      
      return normalized;
    },
    

    
    // 检测代理对电影的态度（support, oppose, indifferent）
    detectMovieAttitude(text, movieTitle) {
      // 将电影标题标准化以进行更准确的匹配
      const normalizedTitle = this.normalizeMovieTitle(movieTitle);
      
      // 对正则表达式中的特殊字符进行转义
      const escapeRegExp = (string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      };
      
      // 转义电影标题中的特殊字符
      const escapedTitle = escapeRegExp(normalizedTitle);
      
      // 在电影标题前后的文本中寻找态度指示词
      const supportPatterns = [
        new RegExp(`I recommend\\s+["']?${escapedTitle}["']?`, 'i'),
        new RegExp(`I (strongly )?support\\s+["']?${escapedTitle}["']?`, 'i'),
        new RegExp(`["']?${escapedTitle}["']?\\s+is (a )?(great|excellent|amazing|fantastic|wonderful|good|brilliant|outstanding|superb|impressive|remarkable)`, 'i'),
        new RegExp(`I (would|highly) recommend\\s+["']?${escapedTitle}["']?`, 'i'),
        new RegExp(`You (should|must|might|would) (definitely |really |certainly )?enjoy\\s+["']?${escapedTitle}["']?`, 'i'),
        new RegExp(`["']?${escapedTitle}["']?\\s+is (definitely |certainly |absolutely )?(worth|deserving)`, 'i'),
        new RegExp(`I (really |absolutely |thoroughly |completely )?(enjoyed|loved|liked|appreciated)\\s+["']?${escapedTitle}["']?`, 'i'),
        // Additional support patterns for more lenient detection
        new RegExp(`["']?${escapedTitle}["']?\\s+is (a )?(good|nice|interesting|compelling|powerful|moving|touching|entertaining)`, 'i'),
        new RegExp(`(check out|watch|try|see)\\s+["']?${escapedTitle}["']?`, 'i'),
        new RegExp(`["']?${escapedTitle}["']?\\s+(is|was) (a )?classic`, 'i'),
        new RegExp(`["']?${escapedTitle}["']?\\s+has (great|excellent|amazing|fantastic|wonderful|good)`, 'i'),
        // If the movie title is mentioned with film/movie context, consider it a support
        new RegExp(`(film|movie|cinema)\\s+["']?${escapedTitle}["']?`, 'i'),
        new RegExp(`["']?${escapedTitle}["']?\\s+(film|movie|cinema)`, 'i'),
        /support this (movie|film)/i,
        /vote in favor/i,
        /strongly agree/i,
        /great choice/i,
        /excellent pick/i
      ];
      
      const opposePatterns = [
        new RegExp(`I (don't|do not) recommend\\s+["']?${escapedTitle}["']?`, 'i'),
        new RegExp(`I (strongly )?oppose\\s+["']?${escapedTitle}["']?`, 'i'),
        new RegExp(`["']?${escapedTitle}["']?\\s+is (a )?(bad|terrible|awful|poor|disappointing|overrated|mediocre|weak|flawed)`, 'i'),
        new RegExp(`I (would|wouldn't|would not) (not )?recommend\\s+["']?${escapedTitle}["']?`, 'i'),
        new RegExp(`You (should|might|would) (definitely |really |certainly )?(not|never) (enjoy|watch|see)\\s+["']?${escapedTitle}["']?`, 'i'),
        new RegExp(`["']?${escapedTitle}["']?\\s+is (definitely |certainly |absolutely )?(not worth|not deserving)`, 'i'),
        new RegExp(`I (really |absolutely |thoroughly |completely )?(disliked|hated|didn't like|did not like|didn't enjoy|did not enjoy)\\s+["']?${escapedTitle}["']?`, 'i'),
        /oppose this (movie|film)/i,
        /vote against/i,
        /strongly disagree/i,
        /poor choice/i,
        /bad pick/i
      ];
      
      const indifferentPatterns = [
        new RegExp(`I am (neutral|indifferent|ambivalent) (about|on|toward)\\s+["']?${escapedTitle}["']?`, 'i'),
        new RegExp(`["']?${escapedTitle}["']?\\s+is (just )?(okay|so-so|average|neither good nor bad|mixed)`, 'i'),
        new RegExp(`I (have|have no|don't have|do not have) (strong |particular )?(feelings|opinion|view|stance) (about|on|toward)\\s+["']?${escapedTitle}["']?`, 'i'),
        /neutral stance/i,
        /indifferent about/i,
        /neither support nor oppose/i,
        /on the fence/i,
        /mixed feelings/i
      ];
      
      // 检查是否有支持态度的表达
      for (const pattern of supportPatterns) {
        if (pattern.test(text)) {
          return 'support';
        }
      }
      
      // 检查是否有反对态度的表达
      for (const pattern of opposePatterns) {
        if (pattern.test(text)) {
          return 'oppose';
        }
      }
      
      // 检查是否有中立态度的表达
      for (const pattern of indifferentPatterns) {
        if (pattern.test(text)) {
          return 'indifferent';
        }
      }
      
      // 如果没有明确的态度指示，默认为支持
      // 因为如果代理提及了电影但没有明确表达态度，通常是中性偏正面的
      return 'support';
    },
    
    // 添加电影到观影清单
    addToWatchlist(movie) {
      // 设置电影为已加入观影清单
      movie.inWatchlist = true;
      
      // 更新watchlist对象，用于本地存储
      if (movie.imdbID) {
        this.watchlist[movie.imdbID] = true;
      } else if (movie.title) {
        // 如果没有imdbID，则使用电影标题作为键
        this.watchlist[movie.title] = true;
      }
      
      // 记录添加到观影清单事件
      logUserEvent({
        event_type: 'add_to_watchlist',
        event_data: {
          movie_title: movie.title
        }
      }).catch(error => {
        console.warn('Failed to log add to watchlist event:', error);
      });
      
      // 保存到本地存储
      this.saveRecommendedMovies();
      
      console.log(`用户将电影 "${movie.title}" 添加到观影清单`);
    },

    // 用户对电影进行评分
    rateMovie(movie, rating) {
      // 检查电影是否已加入观影清单
      if (!movie.inWatchlist) {
        console.log(`用户尚未将电影 "${movie.title}" 添加到观影清单，因此无法评分`);
        return;
      }
      
      // 设置或更新电影评分 - 直接赋值（Vue 3不再需要$set）
      movie.userRating = rating;
      
      // 更新movieRatings对象，用于本地存储
      if (movie.imdbID) {
        this.movieRatings[movie.imdbID] = rating;
      } else if (movie.title) {
        // 如果没有imdbID，则使用电影标题作为键
        this.movieRatings[movie.title] = rating;
      }
      
      // 记录电影评分事件
      logUserEvent({
        event_type: 'movie_rating',
        event_data: {
          movie_title: movie.title,
          rating: rating
        }
      }).catch(error => {
        console.warn('Failed to log movie rating event:', error);
      });
      
      // 保存到本地存储
      this.saveRecommendedMovies();
      
      console.log(`用户对电影 "${movie.title}" 评分: ${rating}/5`);
    },
    
    // 打开IMDB页面
    openImdbPage(movie) {
      try {
        // 确保movie对象存在
        if (!movie) {
          console.error('Invalid movie object');
          return;
        }
        
        // 如果电影有IMDB ID，则使用它构建URL
        if (movie.imdbID && typeof movie.imdbID === 'string') {
          // 确保imdbID是有效的，移除任何可能导致URI错误的字符
          const safeImdbID = movie.imdbID.replace(/[\s\\%<>{}|^~\[\]`]/g, '');
          const imdbUrl = `https://www.imdb.com/title/${encodeURIComponent(safeImdbID)}/`;
          window.open(imdbUrl, '_blank');
          
          // 记录IMDB页面访问事件
          try {
            this.logUserEvent({
              event_type: 'imdb_page_visit',
              data: {
                movie_title: movie.title || 'Unknown',
                imdb_id: safeImdbID
              }
            });
          } catch (error) {
            console.warn('Failed to log IMDB page visit event:', error);
          }
        } else {
          // 如果没有IMDB ID，则使用电影标题搜索IMDB
          const movieTitle = (movie.title && typeof movie.title === 'string') ? movie.title : 'Unknown movie';
          const searchUrl = `https://www.imdb.com/find?q=${encodeURIComponent(movieTitle)}`;
          window.open(searchUrl, '_blank');
          
          // 记录IMDB搜索事件
          try {
            this.logUserEvent({
              event_type: 'imdb_search',
              data: {
                movie_title: movieTitle
              }
            });
          } catch (error) {
            console.warn('Failed to log IMDB search event:', error);
          }
        }
      } catch (error) {
        console.error('Error opening IMDB page:', error);
      }
    },
    
    // 处理图片加载错误
    handleImageError(event, movie) {
      console.warn(`Failed to load poster for movie: ${movie.title}`);
      // 设置默认/替代图片
      event.target.src = 'https://via.placeholder.com/60x90/f5f5f5/666666?text=No+Poster';
    },
    
    // 更新电影推荐数据，支持多个代理推荐同一部电影
    async updateMovieRecommendation(movieTitle, agentType, reason, attitude = 'support') {
      // 如果不是支持态度，不添加到推荐列表
      if (attitude !== 'support') {
        console.log(`代理 ${agentType} 对电影 "${movieTitle}" 不是支持态度，不添加到推荐列表`);
        return false;
      }
      
      // 记录电影评分事件
      logUserEvent({
        event_type: 'movie_recommendation_update',
        movie_title: movieTitle,
        agent_type: agentType,
        attitude: attitude
      });
      
      // 标准化电影标题
      const normalizedTitle = this.normalizeMovieTitle(movieTitle);
      
      // 检查这部电影是否已经被推荐（使用标准化后的标题进行比较）
      const existingMovieIndex = this.recommendedMovies.findIndex(m => 
        this.normalizeMovieTitle(m.title).toLowerCase() === normalizedTitle.toLowerCase());
      
      if (existingMovieIndex !== -1) {
        const existingMovie = this.recommendedMovies[existingMovieIndex];
        
        // 检查这个代理是否已经推荐过这部电影
        const alreadyRecommendedByAgent = existingMovie.recommendedByAgents?.some(r => r.agentType === agentType);
        
        // 兼容旧数据结构
        if (!existingMovie.recommendedByAgents) {
          existingMovie.recommendedByAgents = [{
            agentType: existingMovie.recommendedBy,
            timestamp: existingMovie.timestamp,
            reason: existingMovie.reason,
            attitude: 'support' // 默认旧数据为支持态度
          }];
          existingMovie.recommendCount = 1;
        }
        
        // 检查该代理是否已经推荐过这部电影
        const agentAlreadyRecommended = existingMovie.recommendedByAgents.some(rec => rec.agentType === agentType);
        
        if (!agentAlreadyRecommended) {
          // 添加新的推荐者信息
          existingMovie.recommendedByAgents.push({
            agentType: agentType,
            timestamp: new Date(),
            reason: reason,
            attitude: attitude
          });
          
          // 增加推荐计数
          existingMovie.recommendCount += 1;
          
          // 如果电影没有海报信息，尝试获取
          if (!existingMovie.Poster || existingMovie.Poster === 'N/A') {
            try {
              const movieDetails = await this.fetchMovieDetails(movieTitle);
              if (movieDetails) {
                // 更新电影详情
                existingMovie.Poster = movieDetails.Poster;
                existingMovie.Director = movieDetails.Director || existingMovie.Director;
                existingMovie.imdbRating = movieDetails.imdbRating || existingMovie.imdbRating;
                existingMovie.Year = movieDetails.Year || existingMovie.Year;
                existingMovie.imdbID = movieDetails.imdbID || existingMovie.imdbID; // 保存IMDB ID
                console.log(`更新电影 "${movieTitle}" 的海报和详细信息`);
              }
            } catch (error) {
              console.error(`更新电影 "${movieTitle}" 详细信息时出错:`, error);
            }
          }
          
          console.log(`更新电影: "${movieTitle}" 现在被 ${existingMovie.recommendCount} 个代理支持`);
          return true; // 表示更新了现有电影
        } else {
          console.log(`代理 ${agentType} 已经推荐过电影 "${movieTitle}"`);
          return false; // 表示没有变化
        }
      }
      return false; // 如果没有找到电影，返回false
    },
    
    // Extract the reason for recommendation
    extractRecommendationReason(text, movieTitle) {
      // Find text after the movie title that might explain why it's recommended
      const index = text.indexOf(movieTitle) + movieTitle.length;
      if (index < text.length) {
        const remainingText = text.substring(index);
        // Look for explanatory phrases
        const reasonPatterns = [
          /because (.{10,100}?)[.!?]/i,
          /since (.{10,100}?)[.!?]/i,
          /as (.{10,100}?)[.!?]/i
        ];
        
        for (const pattern of reasonPatterns) {
          const match = remainingText.match(pattern);
          if (match && match[1]) {
            return match[1];
          }
        }
      }
      return ""; // No specific reason found
    },
    async splitAndAddMessages(text, agentKey) {
      // 调用我们的HTML-based实现
      return await htmlSplitAndAddMessages(text, agentKey, this);
    },

    
    async addMessagesWithDelay(messages, agentKey, isParallel = false) {
      // 如果不是并行处理的一部分，设置组讨论进行中标志
      if (!isParallel) {
        this.isGroupDiscussionInProgress = true;
      }
      
      console.log('%c准备添加消息组', 'background: #0a0; color: #fff; padding: 2px;', {
        代理类型: agentKey,
        消息数量: messages.length,
        第一条消息: messages.length > 0 ? messages[0].substring(0, 100) + (messages[0].length > 100 ? '...' : '') : '无消息'
      });
      
      // 第一轮对话中，为不同专家添加不同的消息延迟特征
      let minDelay = 1000;
      let maxAdditionalDelay = 1000;
      
      // 根据专家类型调整消息延迟特征，使其更符合专家性格
      if (this.conversationRound === 1) {
        if (agentKey === 'professional_critic') {
          // 专业影评家更慢更深思熟虑
          minDelay = 2500;
          maxAdditionalDelay = 2500;
        } else if (agentKey === 'indie_enthusiast') {
          // 独立电影爱好者节奏中等
          minDelay = 2000;
          maxAdditionalDelay = 2000;
        } else if (agentKey === 'blockbuster_fan') {
          // 大片爱好者更快更活跃
          minDelay = 1000;
          maxAdditionalDelay = 1500;
        }
      }
      
      for (let i = 0; i < messages.length; i++) {
        // 添加随机的消息前延迟，模拟自然思考过程
        if (i === 0 && this.conversationRound === 1) {
          const thinkingDelay = 1000 + Math.random() * 2000;
          console.log(`%c${agentKey} 正在思考...`, 'color: #00a; font-style: italic;');
          await new Promise(resolve => setTimeout(resolve, thinkingDelay));
        }
        
        console.log(`%c添加第 ${i+1}/${messages.length} 条消息`, 'background: #0a0; color: #fff; padding: 2px;', {
          代理: agentKey,
          消息开头: messages[i].substring(0, 100) + (messages[i].length > 100 ? '...' : '')
        });
        
        this.addMessage({
          sender: 'agent',
          agentType: agentKey,
          text: messages[i],
          timestamp: new Date()
        });
        
        // Ensure scrolling happens after each message is added
        this.$nextTick(() => {
          this.scrollToBottom();
        });
        
        // 消息之间添加可变的延迟，模拟自然打字过程
        if (i < messages.length - 1) {
          // 根据消息长度动态调整延迟
          const messageLength = messages[i].length;
          const lengthFactor = Math.min(messageLength / 200, 1.5); // 超长消息需要更长的延迟
          
          const delay = minDelay + Math.random() * maxAdditionalDelay * lengthFactor;
          console.log(`%c${agentKey} 等待 ${Math.round(delay/1000)} 秒后继续...`, 'color: #00a; font-style: italic;');
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      // 如果不是并行处理的一部分，清除标志并处理电影推荐
      if (!isParallel) {
        // Clear flag when all messages have been added
        this.isGroupDiscussionInProgress = false;
        
        // 所有代理发言完毕后处理电影推荐总结
        this.processMovieRecommendations();
      }
      
      // Return a resolved promise to indicate completion
      return Promise.resolve();
    },
    
    // 新方法：交错显示多个专家的消息
    async interleavedAddMessages(agentMessages, isIncremental = false) {
      console.log('%c开始交错显示专家消息', 'background: #909; color: #fff; padding: 2px;', {
        专家数量: Object.keys(agentMessages).length,
        消息总数: Object.values(agentMessages).flat().length,
        增量显示: isIncremental
      });
      
      // DEBUG: Log detailed message structure for each agent before interleaving
      console.log(`%c[DEBUG] 交错显示前所有专家的消息:`, "background: #909; color: #fff; padding: 2px;");
      for (const agentKey in agentMessages) {
        console.log(`%c[DEBUG] ${agentKey} 的所有消息:`, "background: #909; color: #fff; padding: 2px;", {
          消息数量: agentMessages[agentKey].length,
          所有消息: agentMessages[agentKey].map((m, i) => `${i+1}: ${m.substring(0, 100)}...`)
        });
      }
      
      // Set flag to indicate group discussion is in progress
      this.isGroupDiscussionInProgress = true;
      
      // 找出每个专家的消息数量中的最大值
      let maxRounds = 0;
      for (const agentKey in agentMessages) {
        maxRounds = Math.max(maxRounds, agentMessages[agentKey].length);
      }
      
      // 计算每个专家的消息延迟参数
      const agentDelays = {};
      for (const agentKey in agentMessages) {
        let minDelay = 2000;
        let maxAdditionalDelay = 1500;
        
        if (agentKey === 'professional_critic') {
          minDelay = 3000;
          maxAdditionalDelay = 2000;
        } else if (agentKey === 'indie_enthusiast') {
          minDelay = 2500;
          maxAdditionalDelay = 1800;
        } else if (agentKey === 'blockbuster_fan') {
          minDelay = 2000;
          maxAdditionalDelay = 1500;
        }
        
        agentDelays[agentKey] = { minDelay, maxAdditionalDelay };
      }
      
      // 按轮次交错显示消息
      for (let round = 0; round < maxRounds; round++) {
        console.log(`%c开始第 ${round + 1}/${maxRounds} 轮交错消息`, 'background: #909; color: #fff; padding: 2px;');
        
        // DEBUG: Log the agent order for this round
        console.log(`%c[DEBUG] 第 ${round + 1} 轮交错消息顺序:`, "background: #909; color: #fff; padding: 2px;", {
          专家顺序: Object.keys(agentMessages)
        });
        
        // 使用选定代理的顺序，而不是固定优先级顺序
        let agentKeys;
        if (this.selectedAgentsRef && this.selectedAgentsRef.length > 0) {
          // 过滤出存在于agentMessages中的代理
          agentKeys = this.selectedAgentsRef.filter(agent => agent in agentMessages);
          console.log('%c使用选定代理的顺序:', 'background: #090; color: #fff; padding: 2px;', agentKeys);
        } else {
          // 如果没有selectedAgentsRef，则使用默认顺序
          const defaultOrder = ['professional_critic', 'indie_enthusiast', 'blockbuster_fan', 'moderator'];
          agentKeys = Object.keys(agentMessages).sort((a, b) => {
            return defaultOrder.indexOf(a) - defaultOrder.indexOf(b);
          });
          console.log('%c没有选定代理顺序，使用默认顺序:', 'background: #900; color: #fff; padding: 2px;', agentKeys);
        }
        
        for (const agentKey of agentKeys) {
          // 如果这个专家在这一轮有消息
          if (round < agentMessages[agentKey].length) {
            const message = agentMessages[agentKey][round];
            
            // DEBUG: Log the exact message content for this agent in this round
            console.log(`%c[DEBUG] 第 ${round + 1} 轮 ${agentKey} 的消息内容:`, "background: #f00; color: #fff; padding: 2px;", {
              完整消息: message
            });
            
            // 模拟思考时间
            if (round === 0) {
              const thinkingDelay = 500 + Math.random() * 500;
              console.log(`%c${agentKey} 正在思考...`, 'color: #00a; font-style: italic;');
              await new Promise(resolve => setTimeout(resolve, thinkingDelay));
            }
            
            // 添加消息
            console.log(`%c添加 ${agentKey} 的第 ${round + 1} 条消息`, 'background: #0a0; color: #fff; padding: 2px;', {
              消息开头: message.substring(0, 100) + (message.length > 100 ? '...' : '')
            });
            
            this.addMessage({
              sender: 'agent',
              agentType: agentKey,
              text: message,
              timestamp: new Date()
            });
            
            // 根据消息长度计算延迟
            const messageLength = message.length;
            const lengthFactor = Math.min(messageLength / 200, 1.5);
            const { minDelay, maxAdditionalDelay } = agentDelays[agentKey];
            const delay = minDelay + Math.random() * maxAdditionalDelay * lengthFactor;
            
            // 在下一个消息前添加延迟
            console.log(`%c${agentKey} 发言后等待 ${Math.round(delay/1000)} 秒...`, 'color: #00a; font-style: italic;');
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      // 所有消息已显示完毕
      this.isGroupDiscussionInProgress = false;
      
      // 如果不是增量显示，则处理电影推荐总结
      // 增量显示模式下，最后一个专家显示完毕后会统一处理
      if (!isIncremental) {
        // 所有代理发言完毕后处理电影推荐总结
        this.processMovieRecommendations();
      }
      return Promise.resolve();
    },
    // Add agent introductions with delays
    addAgentIntroductions() {
      /* 
      // Professional Film Critic introduction
      setTimeout(() => {
        const criticText = "Hello, I'm your Professional Film Critic. I analyze films through the lens of film theory, technique, and cinematic history. I focus on objective evaluation of directorial choices, narrative structure, and technical execution. I look forward to providing you with balanced, evidence-based analysis of the films we discuss.";
        
        this.messages.push({
          sender: 'agent',
          agentType: 'professional_critic',
          text: criticText,
          timestamp: new Date()
        });
        
        // Log critic introduction
        try {
          logConversation('2', 'agent', criticText, 'professional_critic', this.sessionId);
        } catch (error) {
          console.warn('Failed to log agent message to Firebase:', error);
        }
      }, 3000);
      
      // Independent Film Enthusiast introduction
      setTimeout(() => {
        const indieText = "Hi there! I'm the Independent Movie Enthusiast. I'm passionate about discovering unique artistic expressions. I love discussing experimental cinema, art house films, and emerging directors. I'm always looking for films that push boundaries and offer fresh perspectives. Can't wait to share some hidden gems with you!";
        
        this.messages.push({
          sender: 'agent',
          agentType: 'indie_enthusiast',
          text: indieText,
          timestamp: new Date()
        });
        
        // Log indie enthusiast introduction
        try {
          logConversation('2', 'agent', indieText, 'indie_enthusiast', this.sessionId);
        } catch (error) {
          console.warn('Failed to log agent message to Firebase:', error);
        }
      }, 6000);
      
      // Mainstream Movie Enthusiast introduction
      setTimeout(() => {
        const fanText = "Hey everyone! Mainstream Movie Enthusiast here. I love talking about the latest blockbusters, box office hits, and popular franchises. I'm all about the entertainment value, audience reactions, and the fun aspects of cinema. If you want to know what's trending or which big releases are worth your time, I'm your go-to expert!";
        
        this.messages.push({
          sender: 'agent',
          agentType: 'blockbuster_fan',
          text: fanText,
          timestamp: new Date()
        });
        
        // Log blockbuster fan introduction
        try {
          logConversation('2', 'agent', fanText, 'blockbuster_fan', this.sessionId);
        } catch (error) {
          console.warn('Failed to log agent message to Firebase:', error);
        }
      }, 9000);
      */
      // 暂时禁用所有agent的介绍
      console.log('Agent introductions disabled');
    },
    // Validate if the API key is valid
    async validateApiKey() {
      try {
        console.log('Validating API key...');
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        };
        
        const data = {
          model: MODEL,
          messages: [{
            role: 'user',
            content: 'Hello'
          }],
          max_tokens: 1000
        };
        
        const response = await axios.post(`${BASE_URL}/chat/completions`, data, { 
          headers, 
          timeout: 10000 
        });
        
        if (response.data && response.data.choices && response.data.choices.length > 0) {
          console.log('API key is valid');
        } else {
          console.warn('API validation returned unexpected response:', response.data);
        }
      } catch (error) {
        console.error('API key validation failed:', error);
        console.error('Error details:', error.response ? error.response.data : 'No response data');
      }
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
    },
    async fetchMovieDetails(movieTitle) {
      try {
        // Use consistent API key
        const API_KEY = '7e374f8b';
        const response = await axios.get(`https://www.omdbapi.com/?apikey=${API_KEY}&t=${encodeURIComponent(movieTitle)}`);
        if (response.data.Response === 'True') {
          return response.data;
        }
        
        // If first try fails, try with slight variations of the title
        if (movieTitle.includes(':')) {
          // Try without subtitle (text after colon)
          const mainTitle = movieTitle.split(':')[0].trim();
          console.log(`First attempt failed, trying with main title only: "${mainTitle}"`);
          const retryResponse = await axios.get(`https://www.omdbapi.com/?apikey=${API_KEY}&t=${encodeURIComponent(mainTitle)}`);
          if (retryResponse.data.Response === 'True') {
            return retryResponse.data;
          }
        }
        
        return null;
      } catch (error) {
        console.error('Error fetching movie details:', error);
        return null;
      }
    },
    async fetchMovieDetailsByIMDB(imdbID) {
      try {
        // Use consistent API key
        const API_KEY = '7e374f8b';
        const response = await axios.get(`https://www.omdbapi.com/?i=${imdbID}&apikey=${API_KEY}`);
        if (response.data.Response === 'True') {
          return response.data;
        }
        return null;
      } catch (error) {
        console.error('Error fetching movie details by IMDB ID:', error);
        return null;
      }
    },
    
    // 渲染消息文本为Markdown HTML
    renderMessageText(text) {
      if (!text) return '';
      
      try {
        //console.log('Before Rendering markdown:', text.substring(0, 100) + '...');
        // 先过滤掉LaTeX格式的文本内容
        // 删除形如 $$\text{Director: James Gunn}$$ 的文本
        text = text.replace(/\$\$\\text\{[^}]*\}\$\$/g, '');
        
        // 删除空的LaTeX块 $$\text{\n}$$
        text = text.replace(/\$\$\\text\{\s*\}\$\$/g, '');
        
        // 删除多余的空行（两个以上的换行符替换为一个）
        text = text.replace(/\n{3,}/g, '\n');
        
        // 直接使用导入的marked库
        const options = {
          breaks: true,       // 将换行符转换为<br>
          gfm: true,          // 使用GitHub风格的Markdown
          headerIds: false,   // 不添加标题ID
          mangle: false       // 不转义HTML
        };
        
        // 转换markdown为HTML
        //console.log('Rendering markdown:', text.substring(0, 100) + '...'); // Removed to prevent excessive logging
        return marked.parse(text, options);
      } catch (error) {
        console.error('Error rendering message markdown:', error);
        return text; // 出错时返回原始文本
      }
    },

    // 处理用户对是否听取下一个专家发言的选择
    async handleNextAgentChoice(continueWithNextAgent) {
      if (this.waitingForUserChoice) return;
      
      this.waitingForUserChoice = true;
      this.showModeratorPrompt = false;
      
      if (continueWithNextAgent && this.firstRoundAgentQueue.length > 0) {
        // 用户选择继续听下一个专家发言
        console.log('%c用户选择继续听取下一个专家的发言', 'color: green; font-weight: bold');
        
        // 处理队列中的下一个专家
        await this.processNextAgentInQueue();
      } else {
        // 用户选择不再听取更多专家发言，直接进行总结
        console.log('%c用户选择不再听取更多专家发言，直接进行总结', 'color: orange; font-weight: bold');
        
        // 清空队列
        this.firstRoundAgentQueue = [];
        
        // 触发moderator总结
        await this.generateModeratorSummary();
      }
      
      this.waitingForUserChoice = false;
    },
    
    // 处理队列中的下一个专家
    async processNextAgentInQueue() {
      if (this.firstRoundAgentQueue.length === 0) {
        console.log('专家队列为空，无法处理下一个专家');
        return;
      }
      
      // 获取队列中的下一个专家
      const nextAgent = this.firstRoundAgentQueue.shift();
      this.currentSpeakingAgent = nextAgent;
      
      console.log(`%c处理队列中的下一个专家: ${nextAgent}`, 'color: blue; font-weight: bold');
      
      // 生成该专家的回复
      await this.generateSingleAgentResponse(nextAgent);
      
      // 如果队列中还有专家，显示moderator提示
      if (this.firstRoundAgentQueue.length > 0) {
        this.showModeratorPrompt = true;
      } else {
        // 如果队列为空，自动触发moderator总结
        await this.generateModeratorSummary();
      }
    },
    
    // 生成单个专家的回复
    async generateSingleAgentResponse(agentKey) {
      const agentProfile = this.agentProfiles.agents[agentKey];
      if (!agentProfile) {
        console.error(`未找到专家配置: ${agentKey}`);
        return;
      }
      
      // 显示该专家正在输入
      this.setAgentTypingStatus(agentKey, true);
      
      try {
        // 构建对话历史
        let conversationHistory = this.buildConversationHistory();
        const userMessage = this.messages.find(m => m.sender === 'user')?.text || '';
        
        // 构建提示
        const prompt = this.buildAgentPrompt(agentKey, conversationHistory);
        
        // 定义API请求的headers
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        };
        
        // 构建请求数据
        const data = {
          model: MODEL,
          messages: [{
            role: 'user',
            content: prompt
          }],
          max_tokens: 1000
        };
        
        // 调用API获取回复
        console.log(`发送API请求给 ${agentProfile.role}...`);
        const response = await axios.post(`${BASE_URL}/chat/completions`, data, { headers, timeout: API_TIMEOUT });
        console.log(`收到API响应来自 ${agentProfile.role}:`, response.status);
        
        let agentResponse = response.data.choices[0].message.content;
        
        // 处理回复前缀
        let displayText = agentResponse;
        const prefixRegex = new RegExp(`^${agentProfile.role}:\\s*`, 'i');
        const prefixMatch = agentResponse.match(prefixRegex);
        if (prefixMatch) {
          displayText = agentResponse.substring(prefixMatch[0].length);
        }
        
        // 关闭该专家的输入状态指示
        this.setAgentTypingStatus(agentKey, false);
        
        // 分割长回复并显示消息
        console.log(`%c专家 ${agentKey} 的回复已生成，准备显示`, 'background: #070; color: #fff; padding: 2px;');
        const messagesArray = await this.splitAndAddMessages(displayText, agentKey);
        await this.addMessagesWithDelay(messagesArray, agentKey);
        
        // 记录到Firebase
        try {
          await logConversation('2', 'agent', agentResponse, agentKey, this.sessionId);
        } catch (error) {
          console.warn('Failed to log agent message to Firebase:', error);
        }
        
        // 更新专家记忆
        this.updateAgentMemory(agentKey, userMessage, agentResponse);
        
        // 提取电影推荐
        await this.extractMoviesWithAPI(agentResponse, agentKey);
        
        return agentResponse;
      } catch (error) {
        console.error(`生成专家 ${agentKey} 回复时出错:`, error);
        this.setAgentTypingStatus(agentKey, false);
        
        // 添加错误消息
        this.addMessage({
          sender: 'agent',
          agentType: agentKey,
          text: `I'm having trouble formulating my thoughts right now. Let me think about this...`,
          timestamp: new Date()
        });
        
        return null;
      }
    },
    
    // 构建代理提示
    buildAgentPrompt(agentKey, conversationHistory) {
      // 使用this.agentProfiles以保持一致性
      const agentProfile = this.agentProfiles.agents[agentKey];
      if (!agentProfile) {
        console.error(`未找到专家配置: ${agentKey}`);
        return '';
      }
      
      // 获取代理记忆
      const memories = this.getAgentMemories();
      const agentMemory = memories[agentKey] || [];
      
      // 构建代理上下文
      let agentContext = '';
      
      // 添加代理的记忆
      if (agentKey === 'moderator' && this.conversationRound === 2) {
        // 在第二轮，给moderator提供所有代理的记忆
        const combinedMemories = this.getCombinedAgentMemories();
        if (combinedMemories) {
          agentContext += `\nInsights from all experts:\n${combinedMemories}\n`;
        }
        
        // 也添加moderator自己的记忆
        if (agentMemory.length > 0) {
          agentContext += `\nYour previous interactions with the user:\n${agentMemory.join('\n')}\n`;
        }
      } else if (agentMemory.length > 0) {
        // 对于其他代理或在第一轮，只使用他们自己的记忆
        agentContext += `\nPrevious interactions with the user:\n${agentMemory.join('\n')}\n`;
      }
      
      // 根据代理角色添加特殊指令
      if (agentKey === 'moderator') {
        if (this.conversationRound === 2 && this.userMessageCountInCurrentRound === 1) {
          // 用户刚进入第二轮，moderator提供第一轮的总结
          agentContext += `\nAs the moderator with expertise in ${agentProfile.knowledge_domains.join(', ')}, you have access to all the previous discussions and insights from our movie experts (Ethan Maxwell, Maya Cole, and Jake Robinson).\n\n`;
        } else {
          agentContext += `\nAs the moderator with expertise in ${agentProfile.knowledge_domains.join(', ')}, engage in a natural conversation with the user about movies. Respond directly to their question or comment without summarizing previous discussions.\n\n`;
        }
      }
      
      let prompt;
      
      if (this.conversationRound === 1) {
        // 在第一轮，代理应评估以前的电影推荐
        const previousMovieRecommendations = this.getPreviousMovieRecommendations();
        const movieEvaluationContext = previousMovieRecommendations.length > 0 ?
          `\n\nPrevious movie recommendations in this conversation: ${previousMovieRecommendations.join(', ')}. Please evaluate at least one of these movies with your stance (Support, Oppose, or Indifferent) and explain your reasoning.` : '';
        
        prompt = `${conversationHistory}\n\n${agentContext}\n\nAs a ${agentProfile.role}, with expertise in ${agentProfile.knowledge_domains.join(', ')}, engage in a natural discussion about movies. Respond to the user's message and previous comments from other participants. Recommend at least 2 movies that aligns with your perspective AND evaluate previous movie recommendations from other agents with your stance (Support, Oppose, or Indifferent) with brief reasoning.${movieEvaluationContext} Keep your response conversational and engaging.`;
      } else {
        // 在第二轮及以后，使用不同的提示
        // 获取所有电影推荐的详细信息
        const recommendedMoviesDetails = this.recommendedMovies.map(movie => {
          const recommenders = movie.recommendedByAgents ? 
            movie.recommendedByAgents.map(rec => this.agentProfiles.agents[rec.agentType].role).join(', ') : 
            (movie.recommendedBy ? this.agentProfiles.agents[movie.recommendedBy].role : 'Unknown');
          
          return `"${movie.title}" (recommended by: ${recommenders})`;
        }).join('; ');
        
        const movieRecommendationsContext = this.recommendedMovies.length > 0 ? 
          `\n\nCurrent movie recommendations in the sidebar: ${recommendedMoviesDetails}.` : 
          '';
        
        if (agentKey !== 'moderator') {
          // 构建专家在第二轮被@提及时的提示
          const expertInstructions = `As ${agentProfile.role} with expertise in ${agentProfile.knowledge_domains.join(', ')}, you have been directly mentioned by the user in this conversation.\n\nThe user has specifically addressed you with an @mention, indicating they want YOUR perspective directly. Respond naturally and conversationally to their question or comment, maintaining your unique perspective and expertise.\n\nYou can reference previous discussions and movie recommendations if relevant. If appropriate, you can recommend additional movies that align with your perspective and the user's interests.\n\nRemember to stay true to your character and expertise areas. The user has chosen to hear from you specifically, so provide your authentic perspective rather than a neutral or balanced view.`;
          
          prompt = `${conversationHistory}\n\n${agentContext}${movieRecommendationsContext}\n\n${expertInstructions}`;
        } else {
          // 获取第一轮对话记录
          const firstRoundConversationHistory = this.getFirstRoundConversationHistory();
          
          // 根据对话轮次调整提示
          let moderatorInstructions;
          if (this.conversationRound === 2 && this.userMessageCountInCurrentRound === 1) {
            // 用户刚进入第二轮，moderator提供第一轮的总结
            moderatorInstructions = `As the moderator with expertise in ${agentProfile.knowledge_domains.join(', ')}, you have access to all the previous discussions and insights from our movie experts (Ethan Maxwell, Maya Cole, and Jake Robinson).\n\n${firstRoundConversationHistory}${movieRecommendationsContext}\n\nProvide a comprehensive summary of the first round, highlighting key points from each expert. Draw the user's attention to the movie recommendations and explain which experts recommended which films. Consider all previous movie evaluations and the user's message.\n\nIf appropriate, recommend additional movies that align with the user's preferences or ask follow-up questions to better understand their tastes. Keep your response conversational, helpful, and engaging.`;
          } else {
            // 在第二轮的后续对话中，moderator作为平衡的协调者
            moderatorInstructions = `As the moderator with expertise in ${agentProfile.knowledge_domains.join(', ')}, engage in a natural conversation with the user about movies.\n\n${movieRecommendationsContext}\n\nRespond directly to the user's question or comment. You can reference previous discussions and movie recommendations if relevant. If appropriate, you can recommend additional movies that align with the user's preferences or ask follow-up questions to better understand their tastes.\n\nYou can also invite specific experts to join the conversation if their expertise would be valuable. Keep your response conversational, helpful, and engaging.`;
          }
          
          prompt = `${conversationHistory}\n\n${agentContext}${movieRecommendationsContext}\n\n${moderatorInstructions}`;
        }
      }
      
      return prompt;
    },
    
    // 构建版主总结提示
    buildModeratorSummaryPrompt() {
      // 构建对话历史
      let conversationHistory = this.buildConversationHistory();
      
      // 获取第一轮对话记录
      const firstRoundConversationHistory = this.getFirstRoundConversationHistory();
      
      // 获取所有电影推荐的详细信息
      const recommendedMoviesDetails = this.recommendedMovies.map(movie => {
        const recommenders = movie.recommendedByAgents ? 
          movie.recommendedByAgents.map(rec => this.agentProfiles.agents[rec.agentType].role).join(', ') : 
          (movie.recommendedBy ? this.agentProfiles.agents[movie.recommendedBy].role : 'Unknown');
        
        return `"${movie.title}" (recommended by: ${recommenders})`;
      }).join('; ');
      
      const movieRecommendationsContext = this.recommendedMovies.length > 0 ? 
        `\n\nCurrent movie recommendations in the sidebar: ${recommendedMoviesDetails}.` : 
        '';
      
      // 构建总结提示
      const summaryPrompt = `${conversationHistory}\n\nAs the moderator with expertise in ${this.agentProfiles.agents['moderator'].knowledge_domains.join(', ')}, you have access to all the previous discussions and insights from our movie experts (Ethan Maxwell, Maya Cole, and Jake Robinson).\n\n${firstRoundConversationHistory}${movieRecommendationsContext}\n\nProvide a comprehensive summary of the first round, highlighting key points from each expert. Draw the user's attention to the movie recommendations and explain which experts recommended which films. Consider all previous movie evaluations and the user's message.\n\nIf appropriate, recommend additional movies that align with the user's preferences or ask follow-up questions to better understand their tastes. Keep your response conversational, helpful, and engaging.`;
      
      return summaryPrompt;
    },
    
    // 生成Moderator总结
    async generateModeratorSummary() {
      console.log('%c生成Moderator总结', 'color: purple; font-weight: bold');
      
      // 显示Moderator正在输入
      this.setAgentTypingStatus('moderator', true);
      
      try {
        // 构建总结提示
        const summaryPrompt = this.buildModeratorSummaryPrompt();
        
        // 定义API请求的headers
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        };
        
        // 构建请求数据
        const data = {
          model: MODEL,
          messages: [{
            role: 'user',
            content: summaryPrompt
          }],
          max_tokens: 1000
        };
        
        // 调用API获取总结
        console.log('发送Moderator总结API请求...');
        const response = await axios.post(`${BASE_URL}/chat/completions`, data, { headers, timeout: 60000 });
        console.log('收到Moderator总结API响应:', response.status);
        
        const summaryResponse = response.data.choices[0].message.content;
        
        // 处理角色名称前缀
        let cleanedSummary = summaryResponse;
        if (summaryResponse.startsWith('Moderator:') || 
            summaryResponse.startsWith('Moderator :')) {
          const prefixMatch = summaryResponse.match(/^[^:]+:\s*/);
          if (prefixMatch) {
            cleanedSummary = summaryResponse.substring(prefixMatch[0].length);
          }
        }
        
        // 关闭Moderator的输入状态指示
        this.setAgentTypingStatus('moderator', false);
        
        // 分割长回复并显示消息
        const moderatorMessages = await this.splitAndAddMessages(cleanedSummary, 'moderator');
        await this.addMessagesWithDelay(moderatorMessages, 'moderator');
        
        // 记录到Firebase
        try {
          await logConversation('2', 'agent', summaryResponse, 'moderator', this.sessionId);
        } catch (error) {
          console.warn('Failed to log moderator summary to Firebase:', error);
        }
        
        // 处理电影推荐
        this.processMovieRecommendations();
        
        // 更新对话轮次
        this.conversationRound = 2;
        console.log('%c已转换到第2轮对话', 'color: red; font-weight: bold; font-size: 14px');
        
        return summaryResponse;
      } catch (error) {
        console.error('生成Moderator总结时出错:', error);
        this.setAgentTypingStatus('moderator', false);
        
        // 添加错误消息
        this.addMessage({
          sender: 'agent',
          agentType: 'moderator',
          text: `I'm having trouble summarizing our discussion. Let me collect my thoughts...`,
          timestamp: new Date()
        });
        
        return null;
      }
    },
    
    // 处理电影推荐总结
  async processMovieRecommendations() {
    // 如果正在处理或没有推荐电影，直接返回
    if (this.processingMovieRecommendations || this.tempRoundMovies.length === 0) {
      console.log('本轮没有推荐电影或处理已在进行中，跳过总结步骤');
      return;
    }
    
    // 设置处理标志
    this.processingMovieRecommendations = true;
    
    console.log(`开始处理电影推荐总结，共有 ${this.tempRoundMovies.length} 部电影`);
    console.log('处理前recommendedMovies:', this.recommendedMovies.map(m => m.title));
    
    // 检查电影海报URL
    console.log('检查电影海报URL并尝试获取缺失的海报...');
    
    // 为所有没有海报的电影获取详情
    const posterPromises = this.tempRoundMovies.map(async movie => {
      if (!movie.Poster || movie.Poster === 'N/A') {
        console.log(`电影 "${movie.title}" 没有海报，尝试获取详情...`);
        try {
          // 先尝试完整标题
          let movieDetails = await this.fetchMovieDetails(movie.title);
          
          // 如果失败且标题中包含年份，尝试移除年份
          if ((!movieDetails || !movieDetails.Poster || movieDetails.Poster === 'N/A') && 
              /\(\d{4}\)/.test(movie.title)) {
            // 提取不带年份的标题
            const titleWithoutYear = movie.title.replace(/\s*\(\d{4}\)\s*/, '').trim();
            console.log(`尝试使用不带年份的标题搜索: "${titleWithoutYear}"`);
            movieDetails = await this.fetchMovieDetails(titleWithoutYear);
          }
          
          if (movieDetails && movieDetails.Poster && movieDetails.Poster !== 'N/A') {
            movie.Poster = movieDetails.Poster;
            // 从API获取年份，或从电影标题中提取
            const yearMatch = movie.title.match(/\((\d{4})\)/);
            movie.Year = movieDetails.Year || (yearMatch ? yearMatch[1] : '');
            movie.imdbRating = movieDetails.imdbRating;
            movie.imdbID = movieDetails.imdbID;
            console.log(`成功为电影 "${movie.title}" 获取海报: ${movie.Poster}`);
          }
        } catch (error) {
          console.error(`获取电影 "${movie.title}" 详情时出错:`, error);
        }
      }
      console.log(`电影 "${movie.title}" 的海报URL: ${movie.Poster || 'undefined'}`);
    });
    
    // 等待所有海报获取完成
    await Promise.all(posterPromises);
      
      // 创建电影标题映射，用于快速查找和去重
      const movieMap = new Map();
      
      // 先将现有的recommendedMovies添加到映射中
      this.recommendedMovies.forEach(movie => {
        const normalizedTitle = this.normalizeMovieTitle(movie.title).toLowerCase();
        movieMap.set(normalizedTitle, movie);
      });
      
      // 将临时存储中的电影添加到映射中，自动去重
      for (const movie of this.tempRoundMovies) {
        const normalizedTitle = this.normalizeMovieTitle(movie.title).toLowerCase();
        
        if (movieMap.has(normalizedTitle)) {
          // 如果已存在，更新支持代理和推荐计数
          const existingMovie = movieMap.get(normalizedTitle);
          
          // 更新支持代理
          for (const agent of movie.supportingAgents) {
            if (!existingMovie.supportingAgents.includes(agent)) {
              existingMovie.supportingAgents.push(agent);
            }
          }
          
          // 更新recommendedByAgents
          if (!existingMovie.recommendedByAgents) {
            existingMovie.recommendedByAgents = [];
          }
          
          if (movie.recommendedByAgents) {
            for (const agentRec of movie.recommendedByAgents) {
              const agentExists = existingMovie.recommendedByAgents.some(a => a.agentType === agentRec.agentType);
              if (!agentExists) {
                existingMovie.recommendedByAgents.push(agentRec);
              }
            }
          }
          
          // 更新推荐计数
          existingMovie.recommendCount = existingMovie.recommendedByAgents ? 
            existingMovie.recommendedByAgents.length : existingMovie.supportingAgents.length;
          
          console.log(`更新现有电影 "${existingMovie.title}" 的信息，推荐计数为 ${existingMovie.recommendCount}`);
        } else {
          // 如果不存在，添加到映射中
          movieMap.set(normalizedTitle, movie);
          console.log(`添加新电影 "${movie.title}" 到推荐列表`);
        }
      }
      
      // 从映射中重建recommendedMovies数组，确保完全去重
      this.recommendedMovies = Array.from(movieMap.values());
      
      // 打印处理后的电影列表，用于调试
      console.log('处理后recommendedMovies:', this.recommendedMovies.map(m => m.title));
      
      // 清空临时存储
      this.tempRoundMovies = [];
      
      // 保存到localStorage
      this.saveRecommendedMovies();
      
      // 滚动到底部
      this.$nextTick(() => {
        this.scrollToBottom();
        this.scrollToBottomOfMovieList(); // 添加滚动电影列表到底部的调用
        
        // 延迟重置处理标志，防止短时间内重复调用
        setTimeout(() => {
          this.processingMovieRecommendations = false;
          console.log('电影推荐处理标志已重置，可以处理新的推荐');
        }, 2000); // 设置2秒的冷却时间，确保足够长
      });
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
        
        // Hide mention tip because user is already using @
        this.hideMentionTip();
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
          
          // Check if we should show the @mention tip
          this.checkIfShouldShowMentionTip();
        }
      }
    },
    
    getCaretCoordinates(element, position) {
      // This is a simplified version - for a more accurate implementation,
      // consider using a library like textarea-caret-position
      const lineHeight = parseInt(getComputedStyle(element).lineHeight);
      const text = element.value.substring(0, position);
      const lines = text.split('\n');
      const lineCount = lines.length;
      const charCount = lines[lineCount - 1].length;
      
      return {
        top: (lineCount - 1) * lineHeight + lineHeight/2,
        left: charCount * 8 // Approximate character width
      };
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
    
    // Method to handle scrolling to the bottom of the messages container
    scrollToBottom() {
      const container = this.$refs.messagesContainer;
      if (container) {
        // Use smooth scrolling for better user experience
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }
    },
    
    // Method to scroll to the bottom of movie recommendations list
    scrollToBottomOfMovieList() {
      if (this.$refs.movieListContainer) {
        const container = this.$refs.movieListContainer;
        // Force scroll to the very bottom with smooth animation
        setTimeout(() => {
          container.scrollTop = container.scrollHeight;
        }, 50); // Small delay to ensure DOM is fully updated
      }
    },
    
    // 检查是否应该显示@提及提示
    checkIfShouldShowMentionTip() {
      // 如果已经显示提示或正在使用@提及功能，则不显示
      if (this.showMentionTip || this.showMentionList) return;
      
      // 如果提示已经显示过一次，则不再显示
      if (this.hasShownMentionTip) return;
      
      // 仅在第一轮对话中触发提示
      if (this.conversationRound !== 1) return;
      
      // 检测条件：至少有3条消息且最近两条是不同代理的回复
      if (this.messages.length >= 3) {
        const lastMessages = this.messages.slice(-3);
        
        // 直接显示提示，不再检查多个不同代理和用户输入条件
        {
          this.showMentionTip = true;
          this.hasShownMentionTip = true; // 标记提示已显示过，确保只显示一次
          
          // 5秒后自动隐藏提示
          if (this.mentionTipTimer) {
            clearTimeout(this.mentionTipTimer);
          }
          
          this.mentionTipTimer = setTimeout(() => {
            this.hideMentionTip();
          }, 5000);
        }
      }
    },
    
    // 隐藏@提及提示
    hideMentionTip() {
      this.showMentionTip = false;
    },
    
    // 设置专家的输入状态
    setAgentTypingStatus(agentKey, isTyping) {
      // 使用Vue 3兼容的方式更新响应式对象
      this.agentTypingStatus = { ...this.agentTypingStatus, [agentKey]: isTyping };
      
      // 更新UI中的专家输入状态指示
      if (isTyping) {
        // 添加一个临时消息，显示专家正在输入
        this.addMessage({
          sender: 'agent',
          agentType: agentKey,
          text: '...',  // 使用省略号表示正在输入
          timestamp: new Date(),
          isTyping: true,  // 标记这是一个输入状态消息
          id: `typing-${agentKey}-${Date.now()}`  // 添加唯一ID以便后续移除
        });
      } else {
        // 移除该专家的所有输入状态消息
        this.messages = this.messages.filter(msg => 
          !(msg.sender === 'agent' && msg.agentType === agentKey && msg.isTyping));
      }
      
      console.log(`专家 ${agentKey} 的输入状态设置为: ${isTyping ? '正在输入' : '已完成'}`);
    },
  }
};
</script>

<style scoped>
/* Moderator Prompt Styles */
.moderator-prompt {
  margin-top: 15px;
  margin-bottom: 15px;
  border-left: 4px solid #5c6bc0;
  background-color: #f5f7ff;
}

.moderator-choice-buttons {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.choice-btn {
  padding: 8px 15px;
  border-radius: 20px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.yes-btn {
  background-color: #4caf50;
  color: white;
  border: none;
}

.yes-btn:hover {
  background-color: #388e3c;
}

.no-btn {
  background-color: #f44336;
  color: white;
  border: none;
}

.no-btn:hover {
  background-color: #d32f2f;
}

.choice-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Global Styles */
p{
  margin-bottom: 0.3em; /* 或 0，视情况而定 */
}

ol{
  margin-top: 0.3em;
}

/* 电影标题截断样式 */
.movie-info .movie-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 220px; /* 固定宽度 */
  display: block; /* 确保标题显示 */
  min-height: 21px; /* 确保高度一致 */
}
.input-error-message {
  color: #ff3860;
  font-size: 0.85rem;
  margin-top: 0.25rem;
  margin-bottom: 0.5rem;
  text-align: left;
}
.page-container {
  display: flex;
  width: 100%;
  height: 100%; /* 使用100%高度而不是最小高度 */
  background-color: #f8f9fa;
  overflow: hidden; /* 隐藏滚动条 */
}

.sidebar {
  width: 25%;
  padding: 15px; /* 减少内边距 */
  background-color: white;
  box-shadow: 0 0 10px rgba(0,0,0,0.05);
  overflow-y: auto;
  height: 100%; /* 使用100%高度 */
  max-height: none; /* 移除最大高度限制 */
  position: relative; /* 改为相对定位 */
}

.conversation-container {
  width: 50%; /* 使用百分比宽度 */
  flex: 0 0 auto;
  padding: 15px; /* 减少内边距 */
  overflow: hidden; /* 移除滚动条 */
  margin: 0;
  height: 100%; /* 使用100%高度 */
}

.agent-list {
  max-height: calc(100% - 70px); /* 减去标题和边距的高度 */
  overflow-y: auto;
}

.movie-list {
  max-height: calc(100% - 70px); /* 减去标题和边距的高度 */
  overflow-y: auto;
}



.sidebar-title {
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: #333;
  text-align: center;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.agent-profiles-sidebar {
  border-right: 1px solid #eee;
}

.movie-recommendations-sidebar {
  border-left: 1px solid #eee;
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


.input-area {
  display: flex;
  padding: 15px;
  background-color: #ffffff;
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
}

.message-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.messages-remaining, .movies-remaining {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 5px;
}

.next-btn {
  padding: 10px 20px;
  background-color: var(--secondary-color);
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.next-btn:hover {
  background-color: var(--secondary-color-dark);
}

.next-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.movie-card {
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 8px;
  background-color: #f8f9fa;
  border-left: 4px solid #ddd;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.3s ease, background-color 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

/* Watchlist styles */
.movie-card.in-watchlist {
  background-color: #f5f0e6;
  border-left: 4px solid #8d6e63;
}

.watchlist-button-container {
  margin-top: 8px;
  display: flex;
  justify-content: center;
}

.watchlist-btn {
  background-color: transparent;
  color: #8d6e63;
  border: 1px solid #8d6e63;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  width: auto;
  display: inline-block;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  margin-top: 5px;
}

.watchlist-btn:hover {
  background-color: #8d6e63;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 3px 5px rgba(141, 110, 99, 0.3);
}

.movie-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  /* Removed blue border on hover */
}

.recommended-by-moderator {
  border-left-color: #2a9d8f;
}

.recommended-by-critic, .recommended-by-professional_critic {
  border-left-color: #3a506b;
}

.recommended-by-fan, .recommended-by-blockbuster_fan {
  border-left-color: #e56b6f;
}

.recommended-by-analyst, .recommended-by-indie_enthusiast {
  border-left-color: #6d597a;
}

.movie-title {
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  color: #333;
  font-weight: bold;
}

.movie-recommender {
  margin: 0 0 5px 0;
  font-size: 0.85rem;
  color: #666;
  display: flex;
  align-items: center;
  gap: 8px;
}

.recommender-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #ddd;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.recommender-avatar:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

/* Highlighted message style */
.highlighted-message {
  animation: highlight-pulse 3s ease-in-out;
  box-shadow: 0 0 15px rgba(33, 150, 243, 0.7);
}

@keyframes highlight-pulse {
  0% { box-shadow: 0 0 15px rgba(33, 150, 243, 0.7); }
  50% { box-shadow: 0 0 25px rgba(33, 150, 243, 0.9); }
  100% { box-shadow: 0 0 15px rgba(33, 150, 243, 0); }
}

/* Message with movie mention style */
.message-with-movie-mention {
  background-color: rgba(255, 248, 225, 0.8) !important;
  border-left: 4px solid #FFC107 !important;
  animation: mention-highlight 3s ease-in-out;
}

@keyframes mention-highlight {
  0% { background-color: rgba(255, 248, 225, 0.8); }
  50% { background-color: rgba(255, 248, 225, 1); }
  100% { background-color: rgba(255, 248, 225, 0); }
}

/* Highlighted movie title style - keeping for reference */
.highlighted-movie-title {
  background-color: rgba(255, 235, 59, 0.5);
  padding: 2px 4px;
  border-radius: 3px;
  font-weight: bold;
  animation: title-highlight 3s ease-in-out;
}

@keyframes title-highlight {
  0% { background-color: rgba(255, 235, 59, 0.5); }
  50% { background-color: rgba(255, 235, 59, 0.8); }
  100% { background-color: rgba(255, 235, 59, 0); }
}

.movie-reason {
  margin: 5px 0 0 0;
  font-size: 0.9rem;
  color: #555;
  font-style: italic;
  line-height: 1.4;
  border-top: 1px solid #eee;
  padding-top: 5px;
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

.example-recommendation {
  margin-top: 15px;
  text-align: left;
  opacity: 0.7;
}

.example-movie-card {
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 8px;
  background-color: #f8f9fa;
  border-left: 4px solid #ddd;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.example-movie-card .movie-title {
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  color: #333;
  font-weight: bold;
}

.example-movie-card .movie-recommender {
  margin: 0 0 5px 0;
  font-size: 0.85rem;
  color: #666;
  display: flex;
  align-items: center;
  gap: 8px;
}

.recommender-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  transition: transform 0.2s;
}

/* 当有多个代理推荐同一部电影时，使头像有一点重叠效果 */
.recommender-avatars-container .avatar-tooltip:not(:first-child) {
  margin-left: -10px;
}

/* 鼠标悬停时放大头像 */
.recommender-avatar:hover {
  transform: scale(1.2);
  z-index: 2;
}

/* 头像悬停提示样式 */
.avatar-tooltip {
  position: relative;
  display: inline-block;
}

.avatar-tooltip .avatar-tooltip-text {
  visibility: hidden;
  width: auto;
  min-width: 120px;
  background-color: rgba(0, 0, 0, 0.8);
  color: #fff;
  text-align: center;
  border-radius: 6px;
  padding: 5px 10px;
  position: absolute;
  z-index: 10;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
  font-size: 0.85rem;
  white-space: nowrap;
}

.avatar-tooltip .avatar-tooltip-text::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: rgba(0, 0, 0, 0.8) transparent transparent transparent;
}

.avatar-tooltip:hover .avatar-tooltip-text {
  visibility: visible;
  opacity: 1;
}

/* 电影卡片样式已移至上方 */

.movie-details-container {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.movie-poster-container {
  width: 60px;
  height: 80px;
  margin-right: 15px;
  flex-shrink: 0;
}

.movie-poster {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}


.movie-title {
  margin: 0 0 5px 0;
  font-size: 1.1rem;
  color: #333;
  font-weight: bold;
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

.conversation-actions-inline {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 用户评分样式 */
.user-rating-container {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.rating-label {
  margin: 0 0 5px 0;
  font-size: 0.9rem;
  color: #666;
}

.star-rating {
  display: flex;
  gap: 5px;
}

.star {
  color: #ddd;
  cursor: pointer;
  font-size: 1.2rem;
  transition: color 0.2s;
}

.star:hover {
  color: #ffcc00;
}

.star.active,
.star.filled {
  color: #ffcc00;
}

/* 电影总结消息样式 */
.movie-summary-message {
  background-color: rgba(230, 240, 255, 0.7);
  border-left: 4px solid #4a90e2;
  padding: 12px 15px;
  margin: 10px 0;
  text-align: center;
  font-weight: 500;
  color: #2c3e50;
}

.movie-summary-message .message-text {
  font-size: 16px;
}

.rating-value {
  margin-left: 10px;
  font-size: 0.9rem;
  color: #666;
}

.conversation-card {
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 4px 6px #ffffff;
  padding: 20px;
  margin-bottom: 20px;
  overflow-y: auto; /* 添加滚动条 */
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
  border-radius: 8px;
  overflow: hidden;
  background-color: #ffffff;
  box-shadow: inset 0 0 5px #ffffff;
}

.messages-container {
  padding: 20px;
  height: 500px; /* 固定高度而不是最大高度 */
  overflow-y: auto;
}

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
}

.user-message .message-content {
  background-color: #e3f2fd;
  border-radius: 18px 18px 0 18px;
  margin-left: auto;
}

/* Base style for all agent messages */
.agent-message .message-content {
  background-color: #ffffff !important;
  border-radius: 0 18px 18px 18px;
}

/* Specific colors for each agent type */
.professional_critic-message .message-content {
  background-color: #e8f4f8; /* Light blue for the film critic */
  border-left: 3px solid #2196f3;
}

.indie_enthusiast-message .message-content {
  background-color: #f0e8f8; /* Light purple for the indie enthusiast */
  border-left: 3px solid #9c27b0;
}

.blockbuster_fan-message .message-content {
  background-color: #fff0e8; /* Light orange for the blockbuster fan */
  border-left: 3px solid #ff9800;
}

/* Agent profile card colors matching their message bubbles */
.agent-profile-card[data-agent-key="professional_critic"] {
  background-color: #e8f4f8;
  border-left: 3px solid #2196f3;
}

.agent-profile-card[data-agent-key="indie_enthusiast"] {
  background-color: #f0e8f8;
  border-left: 3px solid #9c27b0;
}

.agent-profile-card[data-agent-key="blockbuster_fan"] {
  background-color: #fff0e8;
  border-left: 3px solid #ff9800;
}

.agent-profile-card[data-agent-key="moderator"] {
  background-color: #f5f5f5;
  border-left: 3px solid #757575;
}

/* Moderator message styling to match profile card */
.moderator-message .message-content {
  background-color: #f5f5f5;
  border-left: 3px solid #757575;
}

/* Moderator uses the default agent message styling */

/* 允许复制agent消息内容 */
.agent-message .message-text {
  user-select: text;
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
  cursor: text;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-content {
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  position: relative;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  transition: all 0.2s ease;
}

/* Add hover effect for message bubbles */
.agent-message .message-content:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

/* 电影推荐中的代理头像样式 */
.recommender-avatar-container {
  display: flex;
  align-items: center;
  margin-top: 8px;
}

.recommender-avatars-container {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 8px;
}

.recommender-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  transition: transform 0.2s;
}

/* 当有多个代理推荐同一部电影时，使头像有一点重叠效果 */
.recommender-avatars-container .avatar-tooltip:not(:first-child) {
  margin-left: -10px;
}

/* 鼠标悬停时放大头像 */
.recommender-avatar:hover {
  transform: scale(1.2);
  z-index: 2;
}

/* 头像悬停提示样式 */
.avatar-tooltip {
  position: relative;
  display: inline-block;
}

.avatar-tooltip .avatar-tooltip-text {
  visibility: hidden;
  width: auto;
  min-width: 120px;
  background-color: rgba(0, 0, 0, 0.8);
  color: #fff;
  text-align: center;
  border-radius: 6px;
  padding: 5px 10px;
  position: absolute;
  z-index: 10;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
  font-size: 0.85rem;
  white-space: nowrap;
}

.avatar-tooltip .avatar-tooltip-text::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: rgba(0, 0, 0, 0.8) transparent transparent transparent;
}

.avatar-tooltip:hover .avatar-tooltip-text {
  visibility: visible;
  opacity: 1;
}

/* 电影卡片样式已移至上方 */

.movie-details-container {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.movie-poster-container {
  width: 60px;
  height: 80px;
  margin-right: 15px;
  flex-shrink: 0;
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
  min-height: 80px;
  padding: 5px 0;
}

.movie-title {
  margin: 0 0 5px 0;
  font-size: 1.1rem;
  color: #333;
  font-weight: bold;
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

.conversation-actions-inline {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
/* @ mention tip styles */
.mention-tip {
  position: absolute;
  top: -40px;
  left: 10px;
  background-color: #e3f2fd;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #2196f3;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 10;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* @ mention dropdown styles */
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
  background-color: #ffffff !important;
}

.mention-list-item:active {
  background-color: #e0e0e0;
}

.input-area {
  position: relative;
  display: flex;
  padding: 15px;
}

/* Markdown 样式 */
.message-text {
  line-height: 1.5;
}

.message-text h1,
.message-text h2,
.message-text h3,
.message-text h4,
.message-text h5,
.message-text h6 {
  margin-top: 0.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

.message-text h1 { font-size: 1.5em; }
.message-text h2 { font-size: 1.3em; }
.message-text h3 { font-size: 1.2em; }
.message-text h4 { font-size: 1.1em; }

.message-text p {
  margin-bottom: 0.8em;
}

.message-text ul,
.message-text ol {
  padding-left: 1.5em;
  margin-bottom: 0.8em;
}

.message-text li {
  margin-bottom: 0.3em;
}

.message-text code {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.9em;
}

.message-text pre {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 1em;
  border-radius: 5px;
  overflow-x: auto;
  margin-bottom: 1em;
}

.message-text pre code {
  background-color: transparent;
  padding: 0;
}

.message-text blockquote {
  border-left: 4px solid #ddd;
  padding-left: 1em;
  color: #666;
  margin-left: 0;
  margin-right: 0;
}

.message-text a {
  color: #2196f3;
  text-decoration: none;
}

.message-text a:hover {
  text-decoration: underline;
}

.message-text img {
  max-width: 100%;
  height: auto;
}

/* Markdown 分段显示动画效果 */
.markdown-sections {
  display: flex;
  flex-direction: column;
}

.markdown-section {
  margin-bottom: 12px;
  animation: slide-in 0.5s ease-out;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s, transform 0.5s;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@keyframes slide-in {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Agent bullet point styles */
.agent-bullet {
  padding: 4px 0;
  font-size: 0.9rem;
  color: #444;
  display: flex;
  align-items: flex-start;
  line-height: 1.3;
}

.agent-description {
  margin-top: 8px;
}
</style>
