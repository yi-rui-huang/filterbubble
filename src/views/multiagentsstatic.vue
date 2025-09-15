<template>
  <div class="page-container">
    <!-- Left Column: Agent Profiles -->
    <div class="sidebar agent-profiles-sidebar">
      <h3 class="sidebar-title">Movie Discussion Agents</h3>
      <div class="agent-list">
        <div 
          v-for="(agent, key) in filteredAgents" 
          :key="key" 
          class="agent-profile-card"
          :data-agent-key="key"
          :class="[
            {'active': activeAgent === key},
            getAgentColorClass(key)
          ]"
        >
          <div class="agent-avatar-container">
            <img :src="getAgentAvatar(key)" class="agent-profile-avatar" alt="Agent Avatar">
          </div>
          <div class="agent-info">
            <h4 class="agent-role">{{ getAgentDisplayName(key) }}</h4>
            <div class="agent-chips">
              <span v-for="chip in computeAgentChips(key)" :key="chip.key" class="chip" :class="chip.class">{{ chip.label }}</span>
            </div>
            <p class="agent-description" v-html="agent.description"></p>
          </div>
        </div>
      </div>
    </div>

    <!-- Middle Column: Conversation (Empty for now) -->
    <div class="conversation-container">
      <div class="card conversation-card">
        <div class="conversation-area">
          <div class="messages-container" ref="messagesContainer">
            <!-- Welcome message when conversation is empty -->
            <div class="welcome-message" v-if="messageGroups.length === 0">
              <div class="welcome-content">
                <h3>🎬 Welcome to your personalized movie discussion!</h3>
                <p style="text-align: left;">I'll be your host. Let's introduce you to our movie experts for today: <strong>Alex</strong>, <strong>Ben</strong>, and <strong>Casey</strong> (you can see their profiles on the left).</p>
                  <p style="text-align: left;">To kick off their discussion, could you tell them a bit about your plans?</p>
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
                </div>
                <p class="welcome-footer" style="text-align: left;">Based on your input, they will start a conversation and recommend movies just for you!</p>
                <!-- <p style="text-align: left;">Please note: The first response may take 1-2 minutes as our agents analyze your preferences and prepare personalized recommendations.</p> -->
                <!-- <div class="response-time-notice">
                  <p><em>⏱️ Please note: The first response may take 1-2 minutes as our agents analyze your preferences and prepare personalized recommendations.</em></p>
                </div> -->
              </div>
            </div>
            
            <!-- Message Groups -->
            <div v-for="(group, groupIndex) in messageGroups" :key="groupIndex" class="message-group">
              <!-- User Message -->
              <div class="message user-message">
                <div class="message-content">
                  <div class="message-text" v-html="group.userMessage.text"></div>
                  <span class="message-time">{{ formatTime(group.userMessage.timestamp) }}</span>
                </div>
              </div>
              
              <!-- Agent Responses Group -->
              <div class="agent-responses-group" v-if="group.agentMessages.length > 0">
                <div class="agent-responses-header" @click="toggleAgentResponses(groupIndex)">
                  <span class="toggle-icon" :class="{ 'expanded': group.expanded }">
                    <svg width="12" height="12" viewBox="0 0 12 12">
                      <path d="M4 6l4 4V2z" fill="currentColor"/>
                    </svg>
                  </span>
                  <span class="agent-responses-title">
                    {{ group.expanded ? 'Hide' : 'Show' }} Agent Discussion ({{ group.agentMessages.length }} responses)
                  </span>
                </div>
                
                <div class="agent-responses-content" v-show="group.expanded">
                  <div 
                    v-for="(message, index) in group.agentMessages" 
                    :key="index" 
                    class="message agent-message"
                    :class="getAgentColorClass(message.sender)"
                    :data-sender="message.sender"
                    :data-group-index="groupIndex"
                    :data-message-index="index"
                  >
                    <div class="agent-avatar">
                      <img :src="getAgentAvatar(message.sender)" alt="Agent Avatar" class="avatar-image">
                    </div>
                    <div class="message-content">
                      <div class="agent-name">{{ getAgentDisplayName(message.sender) }}</div>
                      <div class="message-text" v-html="message.text"></div>
                      <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                    </div>
                  </div>
                </div>
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
              v-model="userInput" 
              placeholder="Type your message here..." 
              class="message-input"
              @keydown.enter.prevent="sendMessage"
              :disabled="isSubmitting || isAgentTyping"
              ref="messageInput"
              @input="inputError = ''"
            ></textarea>
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
            :title="!canProceed ? 'You need to have at least 5 conversation rounds and rate 4-6 movies' : ''"
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
        <div v-if="deduplicatedMovies.length === 0" class="no-recommendations">
          <p>Agents will recommend movies as you chat with them.</p>
        </div>
        <div 
          v-for="(movie, index) in deduplicatedMovies" 
          :key="movie.imdbID || `${movie.title}`" 
          class="movie-card"
          :class="[
            movie.recommendedByAgents ? '' : `recommended-by-${movie.recommendedBy}`, 
            movie.inWatchlist ? `in-watchlist-${getMainRecommendingAgent(movie)}` : ''
          ]"
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
              <div 
                v-show="!movie.Poster || movie.Poster === 'N/A'"
                class="poster-fallback"
              >No Poster</div>
              <div class="movie-recommenders">
            <!-- 兼容旧数据结构 -->
            <div v-if="!movie.recommendedByAgents" class="recommender-avatar-container">
              <div class="avatar-tooltip">
                <img :src="getAgentAvatar(movie.recommendedBy)" class="recommender-avatar" alt="Agent Avatar" @click.stop="scrollToAgentMention(movie.title, movie.recommendedBy)" style="cursor: pointer;" />
                <span class="avatar-tooltip-text">See {{ getAgentDisplayName(movie.recommendedBy) }}'s full recommendation in the conversation</span>
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
                <span class="avatar-tooltip-text">See {{ getAgentDisplayName(recommender.agentType) }}'s full recommendation in the conversation</span>
              </div>
            </div>
          </div>
            </div>
            <div class="movie-info">
              <div class="movie-header" @click.stop="openImdbPage(movie)" style="cursor: pointer;">
                <h4 class="movie-title" :title="movie.title" style="display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; min-height: 20px; line-height: 1.2; margin-bottom: 5px;">{{ movie.title }}</h4>
                <!-- Movie metadata: year, director, runtime -->
                <div class="movie-metadata">
                  <span v-if="movie.Year">{{ movie.Year }}</span>
                  <span v-if="movie.Year && (movie.Director || movie.Runtime)"> • </span>
                  <span v-if="movie.Director">{{ movie.Director }}</span>
                  <span v-if="movie.Director && movie.Runtime"> • </span>
                  <span v-if="movie.Runtime">{{ movie.Runtime }}</span>
                </div>
              </div>
              
              <!-- AI-generated one-sentence pitch -->
              <div v-if="moviePitches[movie.title]" class="movie-pitch" :class="getPitchColorClass(movie.title)">
                <div class="pitch-attribution">{{ getAgentDisplayNameById(moviePitches[movie.title].agentId) }} recommends:</div>
                <p class="pitch-text">{{ moviePitches[movie.title].pitch || moviePitches[movie.title] }}</p>
              </div>
              
              <!-- Watchlist button (always visible) -->
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
              
              <!-- Rating stars and remove button (only visible after adding to watchlist) -->
              <div class="movie-rating-stars" v-if="movie.inWatchlist">
                <div class="rating-row">
                  <span class="rating-label">Your rating:</span>
                  <div class="stars">
                    <span 
                      v-for="star in 5" 
                      :key="star"
                      :class="['star', (movieRatings[movie.title] >= star || movie.userRating >= star) ? 'filled' : '', (ratedMoviesCount >= 6 && !(movieRatings[movie.title] > 0 || movie.userRating > 0)) ? 'disabled' : '']"
                      @click.stop="(ratedMoviesCount >= 6 && !(movieRatings[movie.title] > 0 || movie.userRating > 0)) ? null : rateMovie(movie, star)"
                      :title="(ratedMoviesCount >= 6 && !(movieRatings[movie.title] > 0 || movie.userRating > 0)) ? 'You have already rated 6 movies. Cannot rate more movies.' : ''"
                    >
                      ★
                    </span>
                  </div>
                  <!-- Remove from watchlist button -->
                  <button 
                    class="btn remove-watchlist-btn" 
                    @click.stop="removeFromWatchlist(movie)"
                    title="Remove from watchlist"
                  >
                    ×
                  </button>
                </div>
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
import { getAgentProfiles, getUserProfile, getAgentProfileById } from '../services/agentProfileService';
import { getProfilesById } from '@/services/profileService';
import { saveConversationTurn } from '../services/conversationService';
import { logUserEvent } from '../services/loggingService';
import { getFirebaseDb } from '../services/firebase';
import { serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { API_KEY, BASE_URL, MODEL, API_TIMEOUT } from '../config.js';
import { selectMoviesForExperiment } from '../utils/12movies.js';
import { generateAgentConversation } from '../utils/response2-1.js';
import { generateSecondRoundResponse } from '../utils/response2-2.js';
import p1Image from '../images/p1.png';
import p2Image from '../images/p2.png';
import p3Image from '../images/p3.png';
import p4Image from '../images/p4.png';
import p6Image from '../images/p6.png';

export default {
  name: 'MultiAgentTest',
  data() {
    return {
      // 动态问卷生成的Agent Profiles（来自 Firestore 或本地缓存）
      dynamicProfiles: null,
      dynamicAgents: [],
      dynamicUserProfile: null,
      activeAgent: null,
      userInput: '',
      messageGroups: [], 
      isSubmitting: false,
      isAgentTyping: false,
      inputError: '',
      recommendedMovies: [], 
      tempRoundMovies: [], 
      validatedMovies: new Map(), 
      processingMovieRecommendations: false, 
      pendingMovieValidations: [],
      movieDataset: null, // Store the loaded movie dataset
      isFirstRound: true, // Track if this is the first conversation round 
      profileId: null, // Store the profile ID for conversation recording
      minRequiredMessages: 3, // Minimum required conversation rounds
      movieRatings: {}, // Store user movie ratings
      moviePitches: {} // Store AI-generated one-sentence movie pitches
    };
  },
  async mounted() {
    // 记录页面加载事件
    try {
      await logUserEvent('page_loaded', {
        page: 'MultiAgentStatic',
        profileId: this.profileId || null,
        roundId: '2',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log page load event:', error);
    }

    // 优先：从 Firestore 通过 fb_profile_id 读取（问卷提交保存）
    try {
      const idFromRoute = this.$route?.query?.profileId;
      const idFromLocal = localStorage.getItem('fb_profile_id');
      const profileId = idFromRoute || idFromLocal;

      if (profileId) {
        this.profileId = profileId; // Store profile ID for conversation recording
        const data = await getProfilesById(profileId);
        if (data && Array.isArray(data.agentProfiles)) {
          // Firestore 存储的结构
          this.dynamicProfiles = data; // { id, userInput, agentProfiles, createdAt, userId, ... }
          this.dynamicAgents = data.agentProfiles;
          this.dynamicUserProfile = data.userInput || null;
          console.log('[multiagenttest] Loaded Firestore agent profiles:', data);
        }
      }
    } catch (e) {
      console.warn('[multiagenttest] Firestore load failed, will fall back to local service:', e);
    }

    // 回退：读取旧的本地存储方案（如存在）
    try {
      if (!this.dynamicAgents || this.dynamicAgents.length === 0) {
        const profiles = getAgentProfiles();
        this.dynamicProfiles = this.dynamicProfiles || profiles || null;
        if (!this.dynamicAgents || this.dynamicAgents.length === 0) {
          this.dynamicAgents = (profiles && profiles.agents) ? profiles.agents : [];
        }
        this.dynamicUserProfile = this.dynamicUserProfile || getUserProfile() || null;
      }
      // 全局辅助
      window.logAgentProfiles = () => this.logAgentProfiles && this.logAgentProfiles();
      console.log('%cTip: Run logAgentProfiles() in the console to print current agent profiles.', 'color: #0b7dda');
      if (!this.dynamicAgents || this.dynamicAgents.length === 0) {
        console.warn('[multiagenttest] No dynamic Agent Profiles found. Fill and submit the Initial Questionnaire first.');
      }
    } catch (e) {
      console.error('[multiagenttest] Fallback load failed:', e);
    }

    // 若未选中活跃代理，默认选第一个
    try {
      const keys = Object.keys(this.filteredAgents || {});
      if (!this.activeAgent && keys.length > 0) {
        // this.activeAgent = keys[0]; // 取消默认激活状态
      }
    } catch {}

    // 预加载头像图片，确保立即显示
    this.preloadAvatarImages();

    // Load movie dataset (非阻塞，不影响头像显示)
    this.loadMovieDataset().catch(error => {
      console.error('Failed to load movie dataset:', error);
    });
  },
  computed: {
    // Filtered agents (no static fallback)
    filteredAgents() {
      // 优先使用动态代理（问卷生成）
      if (this.dynamicAgents && Array.isArray(this.dynamicAgents) && this.dynamicAgents.length > 0) {
        const map = {};
        this.dynamicAgents.forEach((a, idx) => {
          const key = a.id || a.key || a.type || a.code || a.role || a.name || `agent_${idx + 1}`;
          // 统一显示名（兼容多种可能的字段命名）
          // 使用固定的友好名称：Alex, Ben, Casey
          const friendlyNames = ['Alex', 'Ben', 'Casey'];
          const displayName = (
            friendlyNames[idx] ||
            a.name ||
            a.displayName ||
            a.agentName ||
            a.agent_title ||
            a.title ||
            a.label ||
            a.role ||
            a.match_dimension ||
            a.profile?.name ||
            `电影专家 ${idx + 1}` // 更友好的默认名称
          );
          map[key] = {
            ...a,
            displayName: displayName || 'Agent',
            // Firestore 映射：match_dimension 作为角色名的主要来源
            role: a.match_dimension || a.role || displayName || 'Agent',
            // Firestore 映射：profile_description 作为描述的主要来源
            description: a.profile_description || a.description || a.summary || a.persona || ''
          };
        });
        return map;
      }
      // 无动态数据时返回空映射
      return {};
    },

    // Movies shown in the right sidebar; currently our processMovieRecommendations already deduplicates.
    // Keep this computed to match the template usage and allow future tweaks (e.g., sorting).
    deduplicatedMovies() {
      return this.recommendedMovies || [];
    },

    // Count user messages for conversation validation
    userMessageCount() {
      return this.messageGroups.length;
    },

    // Calculate remaining messages needed
    remainingMessages() {
      return Math.max(this.minRequiredMessages - this.userMessageCount, 0);
    },

    // Check if user can proceed to questionnaire
    canProceed() {
      // Check if user has enough conversation rounds
      const hasEnoughMessages = this.userMessageCount >= this.minRequiredMessages;
      
      // Check if user has rated between 4-6 movies
      const ratedMoviesCount = Object.keys(this.movieRatings).length;
      const hasEnoughRatings = ratedMoviesCount >= 4 && ratedMoviesCount <= 6;
      
      return hasEnoughMessages && hasEnoughRatings;
    },

    // Get count of rated movies
    ratedMoviesCount() {
      return Object.keys(this.movieRatings).length;
    },

    // Check if rating reminder should be shown
    needRatingReminder() {
      return this.userMessageCount >= this.minRequiredMessages && (this.ratedMoviesCount < 4 || this.ratedMoviesCount > 6);
    }
  },
  methods: {
    // Get the main recommending agent for styling
    getMainRecommendingAgent(movie) {
      if (movie.recommendedByAgents && movie.recommendedByAgents.length > 0) {
        // Use the first recommending agent
        const agentType = movie.recommendedByAgents[0].agentType;
        return agentType.toLowerCase();
      } else if (movie.recommendedBy) {
        // Fallback to old data structure
        return movie.recommendedBy.toLowerCase();
      }
      return 'alex'; // Default fallback
    },

    // Navigate to post-study questionnaire
    async finishConversation() {
      // Check if user has enough conversation rounds
      if (this.userMessageCount < this.minRequiredMessages) {
        alert(`Please send at least ${this.minRequiredMessages} messages before proceeding to the questionnaire.`);
        return;
      }

      // Check if user has rated enough movies
      const ratedCount = Object.keys(this.movieRatings).length;
      if (ratedCount < 4 || ratedCount > 6) {
        alert('Please rate 4-6 movies as your top choices before proceeding to the questionnaire.');
        return;
      }

      // Final validation
      if (!this.canProceed) {
        return;
      }

      this.isSubmitting = true;

      try {
        // Log completion event
        await logUserEvent('conversation_completed', {
          messageCount: this.userMessageCount,
          profileId: this.profileId || null,
          roundId: '2',
          timestamp: new Date().toISOString()
        });

        // Navigate to middle questionnaire
        this.$router.push({
          name: 'MiddleQuestionnaire',
          query: {
            profileId: this.profileId
          }
        });
      } catch (error) {
        console.error('Error finishing conversation:', error);
        alert('An error occurred while proceeding to the questionnaire. Please try again.');
      } finally {
        this.isSubmitting = false;
      }
    },

    // 预加载头像图片，确保立即显示
    preloadAvatarImages() {
      const images = [p1Image, p2Image, p3Image, p4Image, p6Image];
      images.forEach(src => {
        const img = new Image();
        img.src = src;
      });
    },

    // 手动在控制台打印当前的Agent Profile（动态 + 静态回退 + 过滤映射）
    logAgentProfiles() {
      try {
        console.log('[multiagenttest] dynamicProfiles:', this.dynamicProfiles);
        console.log('[multiagenttest] dynamicAgents (array):', this.dynamicAgents);
        console.log('[multiagenttest] dynamicUserProfile:', this.dynamicUserProfile);
        console.log('[multiagenttest] filteredAgents (map):', this.filteredAgents);
        // removed static agentProfiles fallback
        if (Array.isArray(this.dynamicAgents)) {
          console.table(this.dynamicAgents.map((a, i) => ({
            index: i,
            key_used: a.id || a.key || a.type || a.code || a.role || a.name || `agent_${i + 1}`,
            agent_id: a.agent_id,
            match_dimension: a.match_dimension,
            profile_description: (a.profile_description || '').slice(0, 60) + (a.profile_description && a.profile_description.length > 60 ? '…' : ''),
            name_like: a.name || a.displayName || a.agentName || a.title || a.label,
          })));
        }
      } catch (e) {
        console.warn('logAgentProfiles error:', e);
      }
    },
    // 根据 key 获取代理（基于当前过滤后的映射）
    getAgentByKey(key) {
      return this.filteredAgents[key] || null;
    },

    // Map agent_id from response3-2.js to sender key used in Vue component
    mapAgentIdToKey(agentId) {
      // Map from response3-2.js agent IDs to actual keys in filteredAgents
      const agentIdToIndex = {
        'Agent A': 0,
        'Agent B': 1, 
        'Agent C': 2
      };
      
      const index = agentIdToIndex[agentId];
      if (index !== undefined && this.dynamicAgents && this.dynamicAgents[index]) {
        const agent = this.dynamicAgents[index];
        return agent.id || agent.key || agent.type || agent.code || agent.role || agent.name || `agent_${index + 1}`;
      }
      
      // Fallback: return the first available key from filteredAgents
      const availableKeys = Object.keys(this.filteredAgents);
      return availableKeys[0] || 'agent_1';
    },

    // 获取代理显示名称（用于UI、工具提示）
    getAgentDisplayName(key) {
      // Handle special system keys
      if (key === 'system') {
        return 'System';
      }
      if (key === 'user') {
        return 'User';
      }
      
      const agent = this.getAgentByKey(key);
      // 优先使用标准化的 displayName，其次再回退
      const name = agent?.displayName || agent?.name || agent?.label || agent?.title || agent?.role;
      if (!name && key !== 'system' && key !== 'user') {
        console.warn('[multiagenttest] Missing display name for agent key:', key, 'raw agent:', agent);
      }
      return name || 'Agent';
    },

    // 计算左侧标签（相似性 Chip）
    computeAgentChips(key) {
      const chips = [];
      const agent = this.getAgentByKey(key) || {};
      const user = this.dynamicUserProfile || {};

      // 尽可能兼容多种字段命名
      const aDemo = agent.demographics || agent.profile?.demographics || {};
      const uDemo = user.demographics || user.profile?.demographics || {};
      const aPrefs = agent.preferences || agent.movie_preferences || agent.profile?.preferences || {};
      const uPrefs = user.preferences || user.movie_preferences || user.profile?.preferences || {};

      const aMovies = (aPrefs.movie_types || aPrefs.genres || aPrefs.liked_genres || []);
      const uMovies = (uPrefs.movie_types || uPrefs.genres || uPrefs.liked_genres || []);

      const aPersonality = agent.personality || agent.traits || agent.personality_traits || agent.profile?.personality || {};
      const uPersonality = user.personality || user.traits || user.personality_traits || user.profile?.personality || {};

      // 🎯 同年龄&性别
      if (aDemo.gender && uDemo.gender && aDemo.ageRange && uDemo.ageRange && aDemo.gender === uDemo.gender && aDemo.ageRange === uDemo.ageRange) {
        chips.push({ key: `${key}-demo`, label: '🎯 Same Age & Gender', class: 'chip-demo' });
      }

      // 🎬 同电影偏好（有交集即认为同好）
      if (Array.isArray(aMovies) && Array.isArray(uMovies) && aMovies.length && uMovies.length) {
        const overlap = aMovies.filter(g => uMovies.includes(g));
        if (overlap.length > 0) {
          chips.push({ key: `${key}-movie`, label: '🎬 Same Movie Taste', class: 'chip-movie' });
        }
      }

      // 🧠 同人格（简单策略：存在相同为 true 的人格特质）
      try {
        const aKeys = Object.keys(aPersonality || {});
        const uKeys = Object.keys(uPersonality || {});
        const common = aKeys.filter(k => uKeys.includes(k));
        if (common.some(k => aPersonality[k] === uPersonality[k] && (aPersonality[k] === true || typeof aPersonality[k] === 'string' && aPersonality[k] === uPersonality[k]))) {
          chips.push({ key: `${key}-personality`, label: '🧠 Same Personality', class: 'chip-personality' });
        }
      } catch (_) { /* noop */ }

      return chips;
    },

    // Get agent avatar based on agent key
    getAgentAvatar(agentKey) {
      // 优先处理：根据动态代理数组索引直接分配头像（不依赖filteredAgents）
      if (this.dynamicAgents && Array.isArray(this.dynamicAgents) && this.dynamicAgents.length > 0) {
        // 找到对应的代理索引
        let agentIndex = -1;
        for (let i = 0; i < this.dynamicAgents.length; i++) {
          const a = this.dynamicAgents[i];
          const key = a.id || a.key || a.type || a.code || a.role || a.name || `agent_${i + 1}`;
          if (key === agentKey) {
            agentIndex = i;
            break;
          }
        }
        
        if (agentIndex >= 0) {
          // 检查是否是Alex（索引0），并且用户是女性
          const friendlyNames = ['Alex', 'Ben', 'Casey'];
          const displayName = friendlyNames[agentIndex];
          const userGender = this.dynamicUserProfile?.demographics?.gender || 
                            this.dynamicUserProfile?.gender || 
                            this.dynamicUserProfile?.profile?.demographics?.gender;
          
          if (displayName === 'Alex' && userGender && userGender.toLowerCase() === 'female') {
            return p6Image;
          }
          
          // 为Alex, Ben, Casey分配固定头像
          const avatarsByIndex = [p2Image, p3Image, p4Image]; // Alex=p2, Ben=p3, Casey=p4
          return avatarsByIndex[agentIndex % avatarsByIndex.length];
        }
      }

      // 回退逻辑：动态代理根据名称/角色关键词选择头像
      const agent = this.getAgentByKey(agentKey) || {};
      const name = (agent.role || agent.name || '').toLowerCase();
      
      if (name.includes('demographic') || name.includes('同龄人')) return p2Image;
      if (name.includes('kindred') || name.includes('同好')) return p3Image;
      if (name.includes('explorer') || name.includes('探索者')) return p4Image;

      // 静态代理键映射
      const avatarMap = {
        'professional_critic': p2Image,
        'indie_enthusiast': p3Image,
        'blockbuster_fan': p4Image,
        'moderator': p1Image,
        'user': null
      };

      if (avatarMap[agentKey]) {
        return avatarMap[agentKey];
      }
      
      // 最后的兜底方案：尝试使用filteredAgents索引
      const allAgentKeys = Object.keys(this.filteredAgents);
      const agentIndex = allAgentKeys.indexOf(agentKey);
      const fallback = [p2Image, p3Image, p4Image, p1Image];
      
      if (agentIndex >= 0) {
        return fallback[agentIndex % fallback.length];
      }
      
      return p1Image;
    },

    // Get agent color class based on agent key
    getAgentColorClass(agentKey) {
      // 根据动态代理数组索引确定颜色类
      if (this.dynamicAgents && Array.isArray(this.dynamicAgents) && this.dynamicAgents.length > 0) {
        let agentIndex = -1;
        for (let i = 0; i < this.dynamicAgents.length; i++) {
          const a = this.dynamicAgents[i];
          const key = a.id || a.key || a.type || a.code || a.role || a.name || `agent_${i + 1}`;
          if (key === agentKey) {
            agentIndex = i;
            break;
          }
        }
        
        if (agentIndex >= 0) {
          const friendlyNames = ['Alex', 'Ben', 'Casey'];
          const displayName = friendlyNames[agentIndex];
          
          if (displayName === 'Alex') return 'agent-alex';
          if (displayName === 'Ben') return 'agent-ben';
          if (displayName === 'Casey') return 'agent-casey';
        }
      }
      
      // 回退逻辑
      const agent = this.getAgentByKey(agentKey) || {};
      const name = (agent.role || agent.name || '').toLowerCase();
      
      if (name.includes('demographic') || name.includes('同龄人')) return 'agent-alex';
      if (name.includes('kindred') || name.includes('同好')) return 'agent-ben';
      if (name.includes('explorer') || name.includes('探索者')) return 'agent-casey';
      
      return '';
    },

    // Get pitch color class based on agent ID
    getPitchColorClass(movieTitle) {
      const pitchData = this.moviePitches[movieTitle];
      if (!pitchData || typeof pitchData === 'string') {
        return 'pitch-default';
      }
      
      const agentId = pitchData.agentId;
      switch (agentId) {
        case 'Agent A':
          return 'pitch-agent-alex';
        case 'Agent B':
          return 'pitch-agent-ben';
        case 'Agent C':
          return 'pitch-agent-casey';
        default:
          return 'pitch-default';
      }
    },

    // Get agent display name by agent ID
    getAgentDisplayNameById(agentId) {
      if (!agentId || typeof agentId !== 'string') {
        return 'Agent';
      }
      
      // Map agent IDs to friendly names
      const agentIdToName = {
        'Agent A': 'Alex',
        'Agent B': 'Ben', 
        'Agent C': 'Casey'
      };
      
      return agentIdToName[agentId] || 'Agent';
    },
    
    // Format timestamp for messages
    formatTime(timestamp) {
      return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
    
    // Build agent prompt for API call（动态优先，兼容静态字段）
    buildAgentPrompt(agentKey, conversationHistory) {
      const agentProfile = this.getAgentByKey(agentKey);
      if (!agentProfile) {
        console.error(`未找到代理配置: ${agentKey}`);
        return '';
      }

      const roleName = agentProfile.role || agentProfile.name || 'Agent';
      const knowledge = agentProfile.knowledge_domains || agentProfile.domains || agentProfile.expertise || [];
      const traits = agentProfile.behavioral_traits || agentProfile.traits || agentProfile.personality || [];
      const interaction = agentProfile.interaction_style || {};
      const focus = (agentProfile.review_analysis && agentProfile.review_analysis.focus_points) || agentProfile.focus_points || agentProfile.focus || [];

      let agentContext = `You are ${roleName}. Engage in a natural discussion about movies.`;
      if (Array.isArray(knowledge) && knowledge.length) {
        agentContext += ` You tend to bring in perspectives on ${knowledge.join(', ')}.`;
      }
      if (Array.isArray(traits) && traits.length) {
        agentContext += ` Your behavioral traits include: ${traits.join(', ')}.`;
      }
      if (interaction.tone || interaction.language) {
        const tone = interaction.tone ? `tone ${interaction.tone}` : '';
        const lang = interaction.language ? `language ${interaction.language}` : '';
        agentContext += ` Your interaction style: ${[tone, lang].filter(Boolean).join(', ')}.`;
      }
      if (Array.isArray(focus) && focus.length) {
        agentContext += ` Focus on ${focus.join(', ')} when discussing films.`;
      }

      // 注入用户画像，帮助生成更个性化的讨论
      if (this.dynamicUserProfile) {
        const u = this.dynamicUserProfile;
        const fav = Array.isArray(u.favoriteMovieTypes) ? u.favoriteMovieTypes.join(', ') : '';
        const demo = [u.gender, u.ageGroup].filter(Boolean).join(', ');
        const persona = u.openness2 ? 'has rich imagination' : '';
        const userLineParts = [];
        if (demo) userLineParts.push(`demographics: ${demo}`);
        if (fav) userLineParts.push(`likes: ${fav}`);
        if (persona) userLineParts.push(`personality: ${persona}`);
        if (userLineParts.length) {
          agentContext += ` The user profile to consider: ${userLineParts.join('; ')}.`;
        }
      }

      // 任务要求：每个代理必须给出4部电影：2部符合用户兴趣的类型，2部不在用户兴趣类型中；都要给出理由
      const liked = Array.isArray(this.dynamicUserProfile?.favoriteMovieTypes)
        ? this.dynamicUserProfile.favoriteMovieTypes
        : (this.dynamicUserProfile?.movie_preferences?.movie_types || []);
      const likedList = Array.isArray(liked) && liked.length ? liked.join(', ') : 'the user\'s liked genres';

      agentContext += ` Respond to the user's message and previous comments from other participants. Then make exactly 4 concrete movie recommendations:
      - 2 movies from the user's liked genres (${likedList}).
      - 2 movies outside the user's liked genres (novel exploration).
      For EACH movie, provide a brief rationale (1-2 sentences). For the 2 outside-genre picks, explicitly justify from YOUR PROFILE perspective (e.g., your demographics, expertise, traits) why the user might still enjoy it.
      Use clear recommendation phrasing to help identification, one per line, for example:
      - I recommend "Movie Title" because ...
      - You might enjoy "Movie Title" because ...
      Keep responses concise and engaging.`;

      const prompt = `${conversationHistory}\n\n${agentContext}`;
      return prompt;
    },

    // Call API to get agent response
    async callAgentAPI(agentKey, prompt) {
      try {
        const response = await fetch(`${BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          },
          body: JSON.stringify({
            model: MODEL,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 500
          }),
          timeout: API_TIMEOUT
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
      } catch (error) {
        console.error(`Error calling API for ${agentKey}:`, error);
        throw error;
      }
    },

    // Build conversation history for API（使用动态代理显示名）
    buildConversationHistory() {
      let history = "Previous conversation:\n";
      this.messageGroups.forEach(group => {
        history += `User: ${group.userMessage.text}\n`;
        group.agentMessages.forEach(message => {
          const agentName = this.getAgentDisplayName(message.sender);
          history += `${agentName}: ${message.text}\n`;
        });
      });
      return history;
    },

    // Load movie dataset from TSV file
    async loadMovieDataset() {
      try {
        console.log('[multiagenttest] Loading movie dataset...');
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
            console.log(`[multiagenttest] Trying path: ${path}`);
            response = await fetch(path);
            if (response.ok) {
              successfulPath = path;
              console.log(`[multiagenttest] Successfully loaded from: ${path}`);
              break;
            }
          } catch (e) {
            console.log(`[multiagenttest] Failed to load from ${path}:`, e.message);
          }
        }
        
        if (!response || !response.ok) {
          throw new Error('Could not load movie dataset from any path');
        }
        const tsvText = await response.text();
        
        // Parse TSV data
        const lines = tsvText.split('\n');
        const headers = lines[0].split('\t').map(header => header.trim().replace(/\r/g, ''));
        
        console.log('[multiagenttest] TSV headers:', headers);
        
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
              console.log(`[multiagenttest] Movie ${index + 1}:`, {
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
        
        console.log(`[multiagenttest] Loaded ${this.movieDataset.length} movies from dataset`);
        
        // Additional debug: check a sample movie
        if (this.movieDataset.length > 0) {
          const sample = this.movieDataset[0];
          console.log('[multiagenttest] Sample movie after parsing:', sample);
          console.log('[multiagenttest] Sample genres field:', sample.genres, typeof sample.genres);
        }
        
      } catch (error) {
        console.error('[multiagenttest] Failed to load movie dataset:', error);
        this.movieDataset = []; // Fallback to empty array
      }
    },

    // Send a message
    async sendMessage() {
      if (!this.userInput.trim() || this.isSubmitting || this.isAgentTyping) {
        return;
      }
      
      this.inputError = '';
      
      // Validate input to prevent code injection
      if (!this.validateUserInput(this.userInput.trim())) {
        this.inputError = '请输入有效的文字，不允许输入代码或特殊字符';
        return;
      }

      this.isSubmitting = true;
      this.inputError = '';

      try {
        const userMessage = this.userInput.trim();
        
        // 记录用户发送消息事件
        try {
          await logUserEvent('user_message_sent', {
            messageText: userMessage || '',
            messageLength: userMessage ? userMessage.length : 0,
            profileId: this.profileId || null,
            roundId: '2',
            messageCount: this.messageGroups.length + 1
          });
        } catch (error) {
          console.error('Failed to log user message event:', error);
        }
        
        // Create user message
        const userMessageObj = {
          sender: 'user',
          text: userMessage,
          timestamp: new Date()
        };
        
        // Create new message group
        const newGroup = {
          userMessage: userMessageObj,
          agentMessages: [],
          expanded: true
        };
        
        this.messageGroups.push(newGroup);
        
        const userInputCopy = this.userInput;
        this.userInput = '';
        
        // Scroll to bottom after adding user message
        this.scrollToBottom();

        // Generate agent responses using the new workflow
        // Show typing indicator while generating agent responses
        this.isAgentTyping = true;
        await this.generateAgentResponses(userInputCopy);
        
      } catch (error) {
        console.error('Error sending message:', error);
        this.inputError = 'Failed to send message. Please try again.';
      } finally {
        this.isSubmitting = false;
      }
    },

    // New method to generate agent responses using movie selection and response utilities
    async generateAgentResponses(userMessage) {
      try {
        console.log('[multiagenttest] generateAgentResponses called with:', userMessage);
        
        // Check if this is the first round
        if (this.isFirstRound) {
          console.log('[multiagenttest] First round - using full workflow (12movies + response3-1)');
          
          // Step 1: Ensure movie dataset is loaded
          if (!this.movieDataset || this.movieDataset.length === 0) {
            console.log('[multiagenttest] Movie dataset not loaded, attempting to load...');
            await this.loadMovieDataset();
            
            // Check again after loading
            if (!this.movieDataset || this.movieDataset.length === 0) {
              throw new Error('Movie dataset could not be loaded. Please check if the TSV file is available.');
            }
          }
          
          if (!this.dynamicUserProfile) {
            throw new Error('User profile not available');
          }
          
          if (!this.dynamicAgents || this.dynamicAgents.length === 0) {
            throw new Error('Agent profiles not available');
          }
          
          // Step 2: Prepare user profile for movie selection
          const userProfile = {
            in_profile_genres: this.dynamicUserProfile.interests?.liked_genres || 
                             this.dynamicUserProfile.favoriteMovieTypes || 
                             this.dynamicUserProfile.movie_preferences?.movie_types || 
                             ['Comedy', 'Drama'] // Fallback
          };
          
          console.log('[multiagenttest] User profile for movie selection:', userProfile);
          
          // Step 3: Select 12 movies using the utility
          console.log('[multiagenttest] Selecting 12 movies...');
          const selectedMovies = await selectMoviesForExperiment(
            this.movieDataset,
            userProfile,
            userMessage
          );
          
          console.log(`[multiagenttest] Selected ${selectedMovies.length} movies:`, selectedMovies);
          
          // Save the 12 movies to Firestore recommended_movie_sets collection
          await this.saveMovieSetToFirestore(selectedMovies, userProfile, userMessage);
          
          // Step 4: Generate agent conversation using the response utility
          console.log('[multiagenttest] Generating agent conversation...');
          const agentResult = await generateAgentConversation(
            selectedMovies,
            this.dynamicAgents,
            this.dynamicUserProfile,
            userMessage
          );
          
          console.log('[multiagenttest] Generated result:', agentResult);
          
          // Extract conversation and movie pitches from the new JSON structure
          const agentConversation = agentResult.conversation || agentResult;
          const moviePitches = agentResult.movie_pitches || [];
          
          // Store movie pitches for display in movie cards
          if (moviePitches && moviePitches.length > 0) {
            console.log('[multiagenttest] Storing movie pitches:', moviePitches);
            moviePitches.forEach(pitch => {
              if (pitch.movie_title && pitch.pitch) {
                // Store both pitch text and agent info for styling
                this.moviePitches[pitch.movie_title] = {
                  pitch: pitch.pitch,
                  agentId: pitch.agent_id || 'unknown',
                  timestamp: new Date()
                };
              }
            });
          }
          
          // Step 5: Add the generated responses to the conversation
          // Get the current group (the last one added)
          const currentGroup = this.messageGroups[this.messageGroups.length - 1];
          
          for (let i = 0; i < agentConversation.length; i++) {
            const agentResponse = agentConversation[i];
            
            // Add delay between responses for better UX
            if (i > 0) {
              await new Promise(resolve => setTimeout(resolve, 1500));
            }
            
            // Find the corresponding agent key
            const agentKey = this.findAgentKeyByAgentId(agentResponse.agent_id);
            
            // Add agent response to current group
            const agentMessage = {
              sender: agentKey || agentResponse.agent_id,
              text: agentResponse.dialogue,
              timestamp: new Date()
            };
            currentGroup.agentMessages.push(agentMessage);
            
            // Extract movie recommendations from the response
            await this.extractMovieRecommendation(agentResponse.dialogue, agentKey || agentResponse.agent_id);
            
            // Also add movies from the selected dataset that match this agent's stance
            if (selectedMovies && selectedMovies.length > 0) {
              await this.addAgentSpecificMovies(selectedMovies, agentKey || agentResponse.agent_id, agentResponse.agent_id);
            }
            
            // Scroll to bottom after each message
            this.scrollToBottom();
          }
          
          // Step 6: Add selected movies to the recommendation sidebar
          this.addMoviesToRecommendations(selectedMovies);
          
          // Step 7: Save conversation to Firestore
          await this.saveConversationToFirestore(currentGroup, selectedMovies);
          
          // Mark first round as completed
          this.isFirstRound = false;
          console.log('[multiagenttest] First round completed, subsequent rounds will use placeholder responses');
          
        } else {
          // Subsequent rounds - use response3-2.js method
          console.log('[multiagenttest] Subsequent round - using generateSecondRoundResponse');
          
          try {
            // Call the generateSecondRoundResponse method
            // Create the expected data structure for response3-2.js
            const agentProfilesData = {
              agentProfiles: this.dynamicAgents || [],
              userInput: this.dynamicUserProfile
            };
            
            const responses = await generateSecondRoundResponse(
              userMessage,
              this.messageGroups,
              agentProfilesData
            );
            
            console.log('[multiagenttest] Generated responses:', responses);
            
            // Get the current group (the last one added)
            const currentGroup = this.messageGroups[this.messageGroups.length - 1];
            
            // Add responses from the API
            for (let i = 0; i < responses.length; i++) {
              const response = responses[i];
              
              // Add delay between responses for better UX
              if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
              
              // Map agent_id to sender key
              const senderKey = this.mapAgentIdToKey(response.agent_id);
              
              // Add agent response
              const agentMessage = {
                sender: senderKey,
                text: response.dialogue,
                timestamp: new Date()
              };
              currentGroup.agentMessages.push(agentMessage);
              
              // Scroll to bottom after each message
              this.scrollToBottom();
            }
            
            // Save subsequent round conversation to Firestore
            await this.saveConversationToFirestore(currentGroup);
            
          } catch (error) {
            console.error('[multiagenttest] Error generating second round response:', error);
            
            // Fallback to simple responses
            const currentGroup = this.messageGroups[this.messageGroups.length - 1];
            const agentKeys = Object.keys(this.filteredAgents);
            for (let i = 0; i < agentKeys.length; i++) {
              const agentKey = agentKeys[i];
              
              if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
              
              const agentMessage = {
                sender: agentKey,
                text: 'I\'d like to continue our discussion about that.',
                timestamp: new Date()
              };
              currentGroup.agentMessages.push(agentMessage);
              this.scrollToBottom();
            }
          }
        }
        
      } catch (error) {
        console.error('[multiagenttest] Error in generateAgentResponses:', error);
        
        // Fallback to a simple error message
        const currentGroup = this.messageGroups[this.messageGroups.length - 1];
        const errorMessage = {
          sender: 'system',
          text: `Sorry, I encountered an error while generating responses: ${error.message}. Please try again.`,
          timestamp: new Date()
        };
        currentGroup.agentMessages.push(errorMessage);
      } finally {
        this.isAgentTyping = false;
      }
    },

    // Helper method to find agent key by agent_id from response.js
    findAgentKeyByAgentId(agentId) {
      const agentKeys = Object.keys(this.filteredAgents);
      
      // Try to match by agent_id or similar fields
      for (const key of agentKeys) {
        const agent = this.filteredAgents[key];
        if (agent.agent_id === agentId || 
            agent.id === agentId ||
            agent.name === agentId) {
          return key;
        }
      }
      
      // Fallback: return first available agent key
      return agentKeys[0] || 'agent_1';
    },

    // Helper method to add selected movies to recommendations
    addMoviesToRecommendations(movies) {
      console.log('[multiagenttest] Adding movies to recommendations:', movies);
      
      // Don't add movies as 'system' recommendations initially
      // Let the agent extraction process handle adding them with proper agent attribution
      console.log('[multiagenttest] Skipping system movie addition - will be added by agent extraction');
    },

    // Add movies from the selected dataset with proper agent attribution
    async addAgentSpecificMovies(selectedMovies, agentKey, agentId) {
      try {
        // Determine which movies this agent should recommend based on their stance
        let moviesToAdd = [];
        
        if (agentId === 'Agent A') {
          // Agent A recommends out-of-profile movies (indices 6-9)
          moviesToAdd = selectedMovies.slice(6, 10);
        } else if (agentId === 'Agent B') {
          // Agent B recommends in-profile movies (indices 0-3)
          moviesToAdd = selectedMovies.slice(0, 4);
        } else if (agentId === 'Agent C') {
          // Agent C recommends mixed movies (indices 4-5 from in-profile, 10-11 from out-of-profile)
          moviesToAdd = [...selectedMovies.slice(4, 6), ...selectedMovies.slice(10, 12)];
        }
        
        console.log(`[multiagenttest] Adding ${moviesToAdd.length} movies for ${agentId}:`, moviesToAdd.map(m => m.primaryTitle));
        
        for (const movie of moviesToAdd) {
          const normalizedTitle = this.normalizeMovieTitle(movie.primaryTitle || movie.title);
          
          // Check if movie already exists in recommendations
          const existingIndex = this.recommendedMovies.findIndex(m => 
            this.normalizeMovieTitle(m.title).toLowerCase() === normalizedTitle.toLowerCase()
          );
          
          if (existingIndex === -1) {
            // Add new movie with proper agent attribution
            const movieData = {
              title: movie.primaryTitle || movie.title,
              Director: 'Unknown',
              imdbRating: 'N/A',
              Poster: 'N/A',
              imdbID: movie.tconst,
              targetGenre: movie.targetGenre,
              recommendedBy: agentKey,
              recommendedByAgents: [{
                agentType: agentKey,
                timestamp: new Date(),
                reason: '',
                attitude: 'support'
              }],
              supportingAgents: [agentKey],
              inWatchlist: false,
              userRating: 0
            };
            
            this.recommendedMovies.push(movieData);
            console.log(`[multiagenttest] Added movie "${normalizedTitle}" for agent ${agentKey}`);
          } else {
            // Update existing movie with this agent's recommendation
            const existingMovie = this.recommendedMovies[existingIndex];
            
            if (!existingMovie.supportingAgents) {
              existingMovie.supportingAgents = [];
            }
            if (!existingMovie.supportingAgents.includes(agentKey)) {
              existingMovie.supportingAgents.push(agentKey);
            }
            
            if (!existingMovie.recommendedByAgents) {
              existingMovie.recommendedByAgents = [];
            }
            
            const agentExists = existingMovie.recommendedByAgents.some(a => a.agentType === agentKey);
            if (!agentExists) {
              existingMovie.recommendedByAgents.push({
                agentType: agentKey,
                timestamp: new Date(),
                reason: '',
                attitude: 'support'
              });
            }
            
            console.log(`[multiagenttest] Updated movie "${normalizedTitle}" with agent ${agentKey}`);
          }
        }
        
        // Fetch movie details for newly added movies
        await this.processMovieRecommendations();
        
      } catch (error) {
        console.error('[multiagenttest] Error adding agent-specific movies:', error);
      }
    },

    // Helper method to filter out undefined values from objects
    filterUndefinedValues(obj) {
      if (!obj || typeof obj !== 'object') {
        return {};
      }
      const filtered = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined && value !== null && value !== '') {
          filtered[key] = value;
        }
      }
      return filtered;
    },

    // Save conversation to Firestore with roundId "2"
    async saveConversationToFirestore(messageGroup, selectedMovies = null) {
      try {
        if (!this.profileId) {
          console.warn('[multiagenttest] No profile ID available, skipping Firestore save');
          return;
        }

        const conversationTurn = {
          profileId: this.profileId,
          userId: this.dynamicProfiles?.userId || this.dynamicUserProfile?.userId || null,
          roundId: "2", // Static roundId for this page
          userMessage: {
            text: messageGroup.userMessage.text,
            timestamp: messageGroup.userMessage.timestamp,
            sender: messageGroup.userMessage.sender
          },
          agentMessages: messageGroup.agentMessages.map(msg => ({
            text: msg.text,
            timestamp: msg.timestamp,
            sender: msg.sender,
            agentDisplayName: this.getAgentDisplayName(msg.sender)
          })),
          selectedMovies: selectedMovies ? selectedMovies.map(movie => ({
            title: movie.primaryTitle || movie.title,
            imdbID: movie.tconst,
            targetGenre: movie.targetGenre,
            genres: movie.genres
          })) : null,
          conversationMetadata: {
            isFirstRound: this.isFirstRound,
            totalMessageGroups: this.messageGroups.length,
            userProfile: this.filterUndefinedValues({
              gender: this.dynamicUserProfile?.gender || this.dynamicUserProfile?.demographics?.gender,
              ageRange: this.dynamicUserProfile?.age_range || this.dynamicUserProfile?.ageGroup || this.dynamicUserProfile?.demographics?.ageRange,
              favoriteGenres: this.dynamicUserProfile?.favoriteMovieTypes || 
                             this.dynamicUserProfile?.movie_preferences?.movie_types ||
                             this.dynamicUserProfile?.preferences?.movie_types ||
                             []
            }),
            agentProfiles: this.dynamicAgents?.map(agent => this.filterUndefinedValues({
              agent_id: agent.agent_id || agent.id,
              match_dimension: agent.match_dimension || agent.role,
              displayName: agent.displayName || agent.name || agent.agentName || agent.title
            })) || []
          }
        };

        // Additional validation to ensure no undefined values
        const validateObject = (obj, path = '') => {
          for (const [key, value] of Object.entries(obj)) {
            const currentPath = path ? `${path}.${key}` : key;
            if (value === undefined) {
              console.warn(`[multiagenttest] Found undefined value at ${currentPath}, removing...`);
              delete obj[key];
            } else if (value && typeof value === 'object' && !Array.isArray(value)) {
              validateObject(value, currentPath);
            } else if (Array.isArray(value)) {
              value.forEach((item, index) => {
                if (item && typeof item === 'object') {
                  validateObject(item, `${currentPath}[${index}]`);
                }
              });
            }
          }
        };

        validateObject(conversationTurn);
        
        console.log('[multiagenttest] Saving conversation to Firestore:', conversationTurn);
        
        const docId = await saveConversationTurn(conversationTurn);
        console.log('[multiagenttest] Conversation saved successfully with ID:', docId);
        
      } catch (error) {
        console.error('[multiagenttest] Error saving conversation to Firestore:', error);
        // Don't throw error to avoid breaking the conversation flow
      }
    },
    
    // Scroll to bottom of messages container
    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.messagesContainer;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    },
    
    // Toggle agent responses visibility
    toggleAgentResponses(groupIndex) {
      this.messageGroups[groupIndex].expanded = !this.messageGroups[groupIndex].expanded;
    },

    // 电影推荐相关方法
    // 使用API提取电影推荐
    async extractMovieRecommendation(text, agentType) {
      try {
        console.log(`[${agentType}] 使用API提取电影名称...`);
        console.log(`[${agentType}] 分析文本:`, text.substring(0, 200) + '...');
        
        const prompt = `
Analyze the following agent response about movies. Extract ALL movie titles mentioned, including those in quotes, recommendations, and casual mentions. Determine the speaker's attitude toward each movie.

Look for patterns like:
- "Movie Title" (in quotes)
- I recommend "Movie Title"
- You might enjoy "Movie Title"
- "Movie Title" is a great film
- Check out "Movie Title"
- Movies mentioned with positive descriptions

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

Agent Response:
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
        
        const response = await fetch(`${BASE_URL}/chat/completions`, {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
          timeout: API_TIMEOUT
        });
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }
        
        const responseData = await response.json();
        
        if (responseData && responseData.choices && responseData.choices.length > 0) {
          const content = responseData.choices[0].message.content;
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
              console.log(`[${agentType}] API成功提取了 ${result.movies.length} 部电影:`, result.movies.map(m => `"${m.title}" (${m.attitude})`));
              
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
                        recommendedBy: agentType,
                        supportingAgents: [agentType],
                        recommendedByAgents: [{
                          agentType,
                          timestamp: new Date(),
                          reason: '',
                          attitude: 'support'
                        }],
                        recommendCount: 1,
                        Poster: 'N/A',
                        Year: '',
                        imdbRating: '',
                        imdbID: '',
                        inWatchlist: false,
                        userRating: 0
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
            // 如果API解析失败，回退到正则表达式方法
            await this.extractMovieRecommendationFallback(text, agentType);
          }
        }
      } catch (error) {
        console.error('使用API提取电影名称时出错:', error);
        // 如果API调用失败，回退到正则表达式方法
        await this.extractMovieRecommendationFallback(text, agentType);
      }
      
      // 处理电影推荐
      if (this.tempRoundMovies.length > 0) {
        await this.processMovieRecommendations();
      }
    },

    // 回退方法：使用正则表达式提取电影推荐
    async extractMovieRecommendationFallback(text, agentType) {
      console.log('使用回退方法提取电影推荐...');
      
      const recommendationPatterns = [
        /I recommend (?:watching |seeing )?["'](.+?)["']/ig,
        /You might enjoy ["'](.+?)["']/ig,
        /Have you seen ["'](.+?)["']/ig,
        /["'](.+?)["'] is a great film/ig,
        /["'](.+?)["'] would be perfect for you/ig,
        /["'](.+?)["'] is (?:an |a )?(?:excellent|amazing|fantastic|wonderful|great) (?:movie|film)/ig,
        /(?:check out|watch|try|see) ["'](.+?)["']/ig,
        /(?:film|movie) ["'](.+?)["']/ig,
        /["'](.+?)["'] (?:directed by|starring|features)/ig,
        /["'](.+?)["'] (?:came out|was released|released) in \d{4}/ig,
        // Additional patterns for Agent A's responses
        /["'](.+?)["'] (?:has been|have been) (?:popular|well-received|acclaimed)/ig,
        /["'](.+?)["'] (?:offers?|provides?|delivers?)/ig,
        /["'](.+?)["'] (?:could be|might be|would be) (?:a good|an interesting|a great) (?:choice|option)/ig,
        /(?:films?|movies?) like ["'](.+?)["']/ig,
        /["'](.+?)["'] (?:and|,) ["'](.+?)["']/ig, // Catch multiple movies in one sentence
        /Trust me[^"']*["'](.+?)["']/ig,
        /Step(?:ping)? outside[^"']*["'](.+?)["']/ig
      ];

      const extractedTitles = new Set();

      // 使用正则模式提取电影标题
      for (const pattern of recommendationPatterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          const title = match[1].trim();
          if (title && title.length > 1 && title.length < 100) {
            extractedTitles.add(title);
          }
        }
      }

      // 处理提取的电影标题
      for (const title of extractedTitles) {
        if (await this.isValidMovie(title)) {
          const movieData = {
            title: title,
            recommendedBy: agentType,
            recommendedByAgents: [{ agentType: agentType, attitude: 'positive' }],
            supportingAgents: [agentType],
            recommendCount: 1,
            Poster: 'N/A',
            Year: '',
            imdbRating: '',
            imdbID: '',
            inWatchlist: false,
            userRating: 0
          };
          
          this.tempRoundMovies.push(movieData);
        }
      }
    },

    // 验证电影标题是否有效
    isValidMovieTitle(title) {
      if (!title || typeof title !== 'string') {
        return false;
      }
      
      // 过滤明显不是电影的内容
      const invalidPatterns = [
        /^(the|a|an)\s+(best|worst|good|bad|great|terrible)\s+(movie|film)$/i,
        /^(movie|film)\s+(night|time|experience)$/i,
        /^(watching|seeing)\s+(movies|films)$/i,
        /^(I|you|we|they)\s+(love|like|hate|enjoy)\s+(movies|films)$/i
      ];
      
      const isInvalid = invalidPatterns.some(pattern => pattern.test(title.trim()));
      
      return !isInvalid && title.trim().length > 2 && title.trim().length < 100;
    },

    // 验证电影是否存在
    async isValidMovie(title) {
      const normalizedTitle = this.normalizeMovieTitle(title).toLowerCase();
      
      // 检查缓存
      if (this.validatedMovies.has(normalizedTitle)) {
        return this.validatedMovies.get(normalizedTitle);
      }

      // 简单的验证逻辑：检查是否包含电影相关关键词
      const movieKeywords = ['movie', 'film', 'cinema', 'director', 'actor', 'actress', 'starring', 'cast'];
      const contextKeywords = movieKeywords.some(keyword => 
        title.toLowerCase().includes(keyword)
      );

      // 过滤明显不是电影的内容
      const invalidPatterns = [
        /^(the|a|an)\s+(best|worst|good|bad|great|terrible)\s+(movie|film)$/i,
        /^(movie|film)\s+(night|time|experience)$/i,
        /^(watching|seeing)\s+(movies|films)$/i
      ];

      const isInvalid = invalidPatterns.some(pattern => pattern.test(title));
      
      const isValid = !isInvalid && title.length > 2 && title.length < 100;
      
      // 缓存结果
      this.validatedMovies.set(normalizedTitle, isValid);
      
      return isValid;
    },

    // 标准化电影标题
    normalizeMovieTitle(title) {
      return title
        .replace(/["\u201c\u201d]/g, '') // 只移除双引号，保留单引号和撇号
        .replace(/\s+/g, ' ') // 统一空格
        .trim();
    },

    // 处理电影推荐
    async processMovieRecommendations() {
      if (this.processingMovieRecommendations || this.tempRoundMovies.length === 0) {
        return;
      }
      
      this.processingMovieRecommendations = true;

      // 获取电影详情
      const posterPromises = this.tempRoundMovies.map(async movie => {
        if (!movie.Poster || movie.Poster === 'N/A') {
          let movieDetails = await this.fetchMovieDetails(movie.title);
          if ((!movieDetails || !movieDetails.Poster || movieDetails.Poster === 'N/A') && /\(\d{4}\)/.test(movie.title)) {
            const titleWithoutYear = movie.title.replace(/\s*\(\d{4}\)\s*/, '').trim();
            movieDetails = await this.fetchMovieDetails(titleWithoutYear);
          }
          
          if (movieDetails && movieDetails.Poster && movieDetails.Poster !== 'N/A') {
            movie.Poster = movieDetails.Poster;
            const yearMatch = movie.title.match(/\((\d{4})\)/);
            movie.Year = movieDetails.Year || (yearMatch ? yearMatch[1] : '');
            movie.imdbRating = movieDetails.imdbRating;
            movie.imdbID = movieDetails.imdbID;
            movie.Director = movieDetails.Director;
          }
        }
      });

      await Promise.all(posterPromises);

      // 去重处理
      const movieMap = new Map();
      this.recommendedMovies.forEach(movie => {
        const normalizedTitle = this.normalizeMovieTitle(movie.title).toLowerCase();
        movieMap.set(normalizedTitle, movie);
      });

      for (const movie of this.tempRoundMovies) {
        const normalizedTitle = this.normalizeMovieTitle(movie.title).toLowerCase();
        if (movieMap.has(normalizedTitle)) {
          const existingMovie = movieMap.get(normalizedTitle);
          // 更新支持代理
          for (const agent of movie.supportingAgents) {
            if (!existingMovie.supportingAgents.includes(agent)) {
              existingMovie.supportingAgents.push(agent);
            }
          }
          
          // 更新推荐代理
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
          
          existingMovie.recommendCount = existingMovie.recommendedByAgents ? 
            existingMovie.recommendedByAgents.length : existingMovie.supportingAgents.length;
        } else {
          movieMap.set(normalizedTitle, movie);
        }
      }

      this.recommendedMovies = Array.from(movieMap.values());
      this.tempRoundMovies = [];
      
      this.$nextTick(() => {
        this.scrollToBottomOfMovieList();
        setTimeout(() => {
          this.processingMovieRecommendations = false;
        }, 1000);
      });
    },

    // 获取电影详情
    async fetchMovieDetails(movieTitle) {
      try {
        // Use OMDB API key
        const OMDB_API_KEY = '7e374f8b';
        console.log(`正在获取电影详情: "${movieTitle}"`);
        
        const response = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(movieTitle)}`);
        const data = await response.json();
        
        if (data.Response === 'True') {
          console.log(`成功获取电影详情: "${movieTitle}"`, data);
          return {
            Poster: data.Poster,
            Year: data.Year,
            imdbRating: data.imdbRating,
            imdbID: data.imdbID,
            Director: data.Director,
            Genre: data.Genre,
            Plot: data.Plot,
            Runtime: data.Runtime
          };
        }
        
        // If first try fails, try with slight variations of the title
        if (movieTitle.includes(':')) {
          // Try without subtitle (text after colon)
          const mainTitle = movieTitle.split(':')[0].trim();
          console.log(`首次尝试失败，尝试使用主标题: "${mainTitle}"`);
          
          const retryResponse = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(mainTitle)}`);
          const retryData = await retryResponse.json();
          
          if (retryData.Response === 'True') {
            console.log(`使用主标题成功获取电影详情: "${mainTitle}"`, retryData);
            return {
              Poster: retryData.Poster,
              Year: retryData.Year,
              imdbRating: retryData.imdbRating,
              imdbID: retryData.imdbID,
              Director: retryData.Director,
              Genre: retryData.Genre,
              Plot: retryData.Plot,
              Runtime: retryData.Runtime
            };
          }
        }
        
        // Try removing common prefixes/suffixes
        const cleanTitle = movieTitle.replace(/^(The |A |An )/i, '').replace(/ \(\d{4}\)$/, '').trim();
        if (cleanTitle !== movieTitle) {
          console.log(`尝试使用清理后的标题: "${cleanTitle}"`);
          
          const cleanResponse = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(cleanTitle)}`);
          const cleanData = await cleanResponse.json();
          
          if (cleanData.Response === 'True') {
            console.log(`使用清理标题成功获取电影详情: "${cleanTitle}"`, cleanData);
            return {
              Poster: cleanData.Poster,
              Year: cleanData.Year,
              imdbRating: cleanData.imdbRating,
              imdbID: cleanData.imdbID,
              Director: cleanData.Director,
              Genre: cleanData.Genre,
              Plot: cleanData.Plot,
              Runtime: cleanData.Runtime
            };
          }
        }
        
        console.log(`未找到电影详情: "${movieTitle}"`);
        return null;
      } catch (error) {
        console.error('获取电影详情时出错:', error);
        return null;
      }
    },

    // 通过IMDB ID获取电影详情
    async fetchMovieDetailsByIMDB(imdbID) {
      try {
        const OMDB_API_KEY = '7e374f8b';
        console.log(`通过IMDB ID获取电影详情: ${imdbID}`);
        
        const response = await fetch(`https://www.omdbapi.com/?i=${imdbID}&apikey=${OMDB_API_KEY}`);
        const data = await response.json();
        
        if (data.Response === 'True') {
          console.log(`成功通过IMDB ID获取电影详情:`, data);
          return {
            Poster: data.Poster,
            Year: data.Year,
            imdbRating: data.imdbRating,
            imdbID: data.imdbID,
            Director: data.Director,
            Genre: data.Genre,
            Plot: data.Plot,
            Runtime: data.Runtime
          };
        }
        return null;
      } catch (error) {
        console.error('通过IMDB ID获取电影详情时出错:', error);
        return null;
      }
    },

    // 打开IMDB页面
    async openImdbPage(movie) {
      if (movie.imdbID) {
        window.open(`https://www.imdb.com/title/${movie.imdbID}/`, '_blank');
        
        // 记录用户点击IMDB链接事件
        try {
          await logUserEvent('movie_imdb_click', {
            movieTitle: movie.title || 'Unknown',
            imdbID: movie.imdbID || null,
            profileId: this.profileId || null,
            roundId: '2'
          });
        } catch (error) {
          console.error('Failed to log IMDB click event:', error);
        }
      }
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
          console.warn('[MultiAgentStatic] No profileId available, skipping movie set save');
          return;
        }

        // Categorize movies into include/exclude based on user preferences
        const userGenres = userProfile.in_profile_genres || [];
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
          userId: this.dynamicProfiles?.userId || null,
          userQuery: userQuery,
          userProfile: {
            demographics: userProfile.demographics || {},
            preferences: {
              in_profile_genres: userGenres,
              movie_types: userProfile.in_profile_genres || []
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
            roundId: '2',
            experimentType: 'multiagent_static_conversation',
            selectionAlgorithm: '12movies_utility_v2'
          }
        };

        // Save to Firestore
        const docRef = await addDoc(collection(db, 'recommended_movie_sets'), movieSetDoc);
        
        console.log('[MultiAgentStatic] Movie set saved to Firestore with ID:', docRef.id);
        console.log('[MultiAgentStatic] Saved movie set structure:', {
          includeCount: includeMovies.length,
          excludeCount: excludeMovies.length,
          includeGenres: [...new Set(includeMovies.map(m => m.targetGenre))],
          excludeGenres: [...new Set(excludeMovies.map(m => m.targetGenre))]
        });

      } catch (error) {
        console.error('[MultiAgentStatic] Error saving movie set to Firestore:', error);
      }
    },

    // Rate a movie
    async rateMovie(movie, rating) {
      const movieTitle = typeof movie === 'string' ? movie : movie.title;
      const previousRating = this.movieRatings[movieTitle];
      
      this.movieRatings[movieTitle] = rating;
      
      // Update the movie object's userRating property
      const movieObj = this.recommendedMovies.find(m => m.title === movieTitle);
      if (movieObj) {
        movieObj.userRating = rating;
      }
      
      console.log(`Rated "${movieTitle}": ${rating} stars`);
      
      // Log rating event
      try {
        const movieDetails = {
          imdbID: movie.imdbID || null,
          year: movie.Year || null,
          genre: movie.Genre || null,
          poster: movie.Poster || null,
          director: movie.Director || null,
          imdbRating: movie.imdbRating || null
        };
        
        await logUserEvent('movie_rated', {
          movieTitle: movieTitle,
          rating: rating,
          previousRating: previousRating,
          profileId: this.profileId || null,
          roundId: '2',
          movieDetails: movieDetails,
          totalRatedMovies: Object.keys(this.movieRatings).length
        });
      } catch (error) {
        console.error('Failed to log rating event:', error);
      }
    },

    // Add movie to watchlist
    addToWatchlist(movie) {
      movie.inWatchlist = true;
      console.log(`Added "${movie.title}" to watchlist`);
      
      // Log watchlist event
      try {
        const movieDetails = {
          imdbID: movie.imdbID || null,
          year: movie.Year || null,
          genre: movie.Genre || null,
          poster: movie.Poster || null,
          director: movie.Director || null,
          imdbRating: movie.imdbRating || null
        };
        
        logUserEvent('movie_add_to_watchlist', {
          movieTitle: movie.title || 'Unknown',
          profileId: this.profileId || null,
          roundId: '2',
          movieDetails: movieDetails,
          recommendedBy: movie.recommendedBy || null,
          recommendedByAgents: movie.recommendedByAgents || null
        });
      } catch (error) {
        console.error('Failed to log watchlist event:', error);
      }
    },

    // Remove movie from watchlist
    async removeFromWatchlist(movie) {
      const movieTitle = movie.title;
      const hadRating = this.movieRatings[movieTitle] > 0 || movie.userRating > 0;
      
      // Remove from watchlist
      movie.inWatchlist = false;
      
      // Clear rating if it exists
      if (this.movieRatings[movieTitle]) {
        delete this.movieRatings[movieTitle];
      }
      if (movie.userRating) {
        movie.userRating = 0;
      }
      
      console.log(`Removed "${movieTitle}" from watchlist${hadRating ? ' and cleared rating' : ''}`);
      
      // Log remove from watchlist event
      try {
        const movieDetails = {
          imdbID: movie.imdbID || null,
          year: movie.Year || null,
          genre: movie.Genre || null,
          poster: movie.Poster || null,
          director: movie.Director || null,
          imdbRating: movie.imdbRating || null
        };
        
        await logUserEvent('movie_remove_from_watchlist', {
          movieTitle: movieTitle,
          hadRating: hadRating,
          profileId: this.profileId || null,
          roundId: '2',
          movieDetails: movieDetails,
          recommendedBy: movie.recommendedBy || null,
          recommendedByAgents: movie.recommendedByAgents || null,
          totalRatedMovies: Object.keys(this.movieRatings).length
        });
      } catch (error) {
        console.error('Failed to log remove from watchlist event:', error);
      }
    },

    // 滚动到代理提及：展开包含该代理发言且提及该电影的消息组，并平滑滚动到该消息
    scrollToAgentMention(movieTitle, agentType) {
      try {
        if (!movieTitle || !agentType) return;
        const normTitle = this.normalizeMovieTitle(String(movieTitle)).toLowerCase();

        // 清除之前的高亮
        this.$nextTick(() => {
          const container = this.$refs.messagesContainer;
          if (!container) return;
          
          const previousHighlights = container.querySelectorAll('.message-highlight');
          previousHighlights.forEach(el => el.classList.remove('message-highlight'));
        });

        // 找到所有匹配的消息组和消息索引
        const matchingMessages = [];
        for (let g = 0; g < this.messageGroups.length; g++) {
          const group = this.messageGroups[g];
          for (let m = 0; m < group.agentMessages.length; m++) {
            const msg = group.agentMessages[m];
            if ((msg.sender === agentType) && typeof msg.text === 'string') {
              const plain = this.normalizeMovieTitle(msg.text.replace(/<[^>]*>/g, ''));
              if (plain.toLowerCase().includes(normTitle)) {
                matchingMessages.push({ g, m });
                // 确保展开包含匹配消息的组
                if (!group.expanded) {
                  this.$set(group, 'expanded', true);
                }
              }
            }
          }
        }

        if (matchingMessages.length === 0) return;

        this.$nextTick(() => {
          const container = this.$refs.messagesContainer;
          if (!container) return;
          
          // 查找所有对应的 DOM 节点
          const nodes = container.querySelectorAll('.agent-message');
          const matchedElements = [];
          
          nodes.forEach((el) => {
            const sender = el.getAttribute('data-sender');
            if (sender !== agentType) return;
            
            const textEl = el.querySelector('.message-text');
            const text = textEl ? textEl.innerText || '' : '';
            if (this.normalizeMovieTitle(text).toLowerCase().includes(normTitle)) {
              matchedElements.push(el);
            }
          });

          // 高亮所有匹配的消息
          matchedElements.forEach(el => {
            el.classList.add('message-highlight');
          });

          // 滚动到最后一个（最近的）匹配消息
          if (matchedElements.length > 0) {
            const lastElement = matchedElements[matchedElements.length - 1];
            const top = lastElement.offsetTop - 20;
            container.scrollTo({ top, behavior: 'smooth' });
          }

          // 3秒后移除高亮效果
          setTimeout(() => {
            matchedElements.forEach(el => {
              if (el && el.classList) {
                el.classList.remove('message-highlight');
              }
            });
          }, 3000);
        });
      } catch (e) {
        console.warn('scrollToAgentMention error:', e);
      }
    }
,

    // 滚动到电影列表底部
    scrollToBottomOfMovieList() {
      this.$nextTick(() => {
        const container = this.$refs.movieListContainer;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    },

    // 保存推荐的电影到本地存储
    saveRecommendedMovies() {
      try {
        localStorage.setItem('recommendedMovies', JSON.stringify(this.recommendedMovies));
      } catch (error) {
        console.error('Error saving recommended movies:', error);
      }
    },

    // 从本地存储加载推荐的电影
    loadRecommendedMovies() {
      try {
        const saved = localStorage.getItem('recommendedMovies');
        if (saved) {
          this.recommendedMovies = JSON.parse(saved);
        }
      } catch (error) {
        console.error('Error loading recommended movies:', error);
        this.recommendedMovies = [];
      }
    }
  }
};
</script>

<style scoped>
/* Page Layout */
.page-container {
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
}

/* Sidebar Styles */
.sidebar {
  width: 25%;
  height: 100%;
  overflow-y: auto;
  padding: 20px;
  box-sizing: border-box;
  background-color: #f5f5f5;
}

.agent-profiles-sidebar {
  border-right: 1px solid #e0e0e0;
}

.movie-recommendations-sidebar {
  border-left: 1px solid #e0e0e0;
}

.sidebar-title {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1.5rem;
  color: #333;
  text-align: center;
}

/* Conversation Container */
.conversation-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 10px;
  overflow: hidden;
  min-height: 0;
}

.conversation-card {
  height: 95%;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.conversation-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px 20px 80px 20px;
}

.messages-container {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

/* Agent Profile Card */
.agent-profile-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.agent-profile-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.agent-profile-card.active {
  border: 2px solid #2196f3;
  background-color: #e3f2fd;
}

/* Agent-specific background colors */
.agent-profile-card.agent-alex {
  background-color: #e3f2fd; /* 蓝色 */
}

.agent-profile-card.agent-ben {
  background-color: #fff3e0; /* 亮橙色 */
}

.agent-profile-card.agent-casey {
  background-color: #efebe9; /* 棕色 */
}

.agent-avatar-container {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}

.agent-profile-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.agent-info {
  text-align: center;
}

.agent-role {
  margin: 0 0 5px 0;
  font-size: 1.1rem;
  color: #333;
}

.agent-description {
  margin: 0;
  font-size: 0.9rem;
  color: #666;
  line-height: 1.4;
}

/* Placeholder styles */
.placeholder-text {
  color: #999;
  text-align: center;
  padding: 20px;
  font-style: italic;
}

/* Card Styles */
.card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
}
/* Conversation Area */
.conversation-area {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 200px);
  border-radius: 8px;
  overflow: hidden;
  background-color: #ffffff;
  box-shadow: inset 0 0 5px #ffffff;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

/* Input area styles */
.input-area {
  display: flex;
  padding: 15px;
  background-color: white;
  border-top: 1px solid #eee;
  flex-shrink: 0;
  min-height: 75px;
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

.input-error-message {
  color: #ff3860;
  font-size: 0.85rem;
  margin-top: 0.25rem;
  margin-bottom: 0.5rem;
  text-align: left;
}

/* Message styles */
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
  width: fit-content;
  min-width: 100px;
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
  background-color: #ffffff;
  color: #333;
  border-radius: 0 18px 18px 18px;
}

.message-content {
  padding: 8px 12px;
  border-radius: 8px;
  width: fit-content;
  display: inline-block;
  background-color: #f0f0f0;
  position: relative;
}

.agent-name {
  font-weight: bold;
  margin-bottom: 4px;
  color: #2c3e50;
}

.message-text {
  margin: 0;
  line-height: 1.5;
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

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
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

.welcome-tip {
  margin: 15px 0 0 0 !important;
  color: #7f8c8d;
  font-size: 0.9rem;
  font-style: italic;
}

/* Message Group Styles */
.message-group {
  margin-bottom: 20px;
}

/* Agent Responses Group */
.agent-responses-group {
  margin-top: 10px;
  background-color: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
}

.agent-responses-header {
  padding: 12px 16px;
  background-color: #eeeeee;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #666;
  transition: background-color 0.2s ease;
  user-select: none;
}

.agent-responses-header:hover {
  background-color: #e8e8e8;
}

.toggle-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  transition: transform 0.2s ease;
  color: #888;
}

.toggle-icon.expanded {
  transform: rotate(90deg);
}

.agent-responses-title {
  flex: 1;
}

.agent-responses-content {
  padding: 16px;
  background-color: #f9f9f9;
}

.agent-responses-content .message {
  margin-bottom: 12px;
}

.agent-responses-content .message:last-child {
  margin-bottom: 0;
}

.agent-responses-content .agent-message .message-content {
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
}

/* Agent-specific message border colors */
.agent-responses-content .agent-message.agent-alex .message-content {
  border: 2px solid #2196f3; /* 蓝色边框 */
}

.agent-responses-content .agent-message.agent-ben .message-content {
  border: 2px solid #ff9800; /* 亮橙色边框 */
}

.agent-responses-content .agent-message.agent-casey .message-content {
  border: 2px solid #8d6e63; /* 棕色边框 */
}

/* Movie Recommendations Styles */
.movie-list {
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}

.no-recommendations {
  text-align: center;
  padding: 20px;
  color: #666;
  font-style: italic;
}

.movie-card {
  background-color: #fff;
  border-radius: 8px;
  margin-bottom: 15px;
  padding: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border-left: 4px solid #ddd;
}

.movie-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* Agent-specific watchlist styles */
.movie-card.in-watchlist-alex {
  border-left-color: #2196f3;
  background-color: #f3f8ff;
}

.movie-card.in-watchlist-jordan {
  border-left-color: #ff9800;
  background-color: #fff8f0;
}

.movie-card.in-watchlist-casey {
  border-left-color: #8d6e63;
  background-color: #f7f5f4;
}

/* Fallback for old data structure */
.movie-card.in-watchlist {
  border-left-color: #2196f3;
  background-color: #f3f8ff;
}

.movie-details-container {
  display: flex;
  gap: 12px;
  margin-bottom: 10px;
}

/* 1. 海报容器（父元素）：
   这是一个60px宽、垂直堆叠的柱状布局容器 */
.movie-poster-container {
  display: flex;
  flex-direction: column;
  align-items: center;  /* 让所有子元素（包括头像列表）在60px宽度内水平居中 */
  flex-shrink: 0;
  width: 60px;
  height: auto;       /* 正确：高度自动，以容纳海报和头像 */
  overflow: visible;    /* 正确：显示所有内容 */
}

/* 2. 海报图片（子元素）：
   这才是应该持有固定尺寸和圆角的视觉元素 */
.movie-poster {
  width: 60px;         /* 关键修复：设为固定宽度 */
  height: 90px;        /* 关键修复：设为固定高度 */
  border-radius: 6px;  /* 圆角样式属于图片 */
  object-fit: cover;   /* 你的 object-fit 规则很好，保持它 */
  display: block;
}

.movie-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.movie-header {
  margin-bottom: 8px;
}

.movie-title {
  margin: 0 0 4px 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #333;
  line-height: 1.2;
}

.movie-metadata {
  margin: 0 0 4px 0;
  font-size: 0.75rem;
  color: #666;
  line-height: 1.2;
}

.movie-director,
.movie-rating {
  margin: 2px 0;
  font-size: 0.8rem;
  color: #666;
}

/* AI-generated movie pitch styles */
.movie-pitch {
  margin: 4px 0 8px 0;
  padding: 6px 8px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid #007bff; /* Default color */
}

/* Agent-specific pitch border colors */
.movie-pitch.pitch-agent-alex {
  border-left-color: #2196f3; /* 蓝色 - 与Alex发言框颜色一致 */
}

.movie-pitch.pitch-agent-ben {
  border-left-color: #ff9800; /* 亮橙色 - 与Ben发言框颜色一致 */
}

.movie-pitch.pitch-agent-casey {
  border-left-color: #8d6e63; /* 棕色 - 与Casey发言框颜色一致 */
}

.movie-pitch.pitch-default {
  border-left-color: #007bff; /* 默认蓝色 */
}

/* Agent attribution label */
.pitch-attribution {
  font-size: 0.7rem;
  font-weight: 500;
  color: #666;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.pitch-text {
  margin: 0;
  font-size: 0.85rem;
  color: #495057;
  line-height: 1.4;
  font-style: italic;
}

.watchlist-button-container {
  margin-top: auto;
}

.watchlist-btn {
  background-color: #2196f3;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.watchlist-btn:hover {
  background-color: #1976d2;
}

.movie-rating-stars {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: auto;
  font-size: 0.75rem;
  color: #666;
}

.rating-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.rating-label {
  white-space: nowrap;
  font-size: 0.75rem;
  color: #666;
}



.remove-watchlist-btn {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 2px 4px;
  border-radius: 50%;
  font-size: 0.7rem;
  cursor: pointer;
  transition: background-color 0.3s;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  flex-shrink: 0;
}

.remove-watchlist-btn:hover {
  background-color: #d32f2f;
}

.stars {
  display: flex;
  gap: 2px;
}

.star {
  cursor: pointer;
  color: #ddd;
  font-size: 14px;
  transition: color 0.2s;
}

.star:hover,
.star.filled {
  color: #ffc107;
}

/* 3. "No Poster" 的占位符 (重要！):
   你也必须为你的 "No Poster" 那个 div 设置完全相同的固定尺寸和圆角，
   否则它将无法正确显示。
   最好的方法是删除它的内联样式，并给它一个class，比如 .poster-fallback 
*/
.poster-fallback { /* <-- 你应该在HTML中给那个div加上这个class */
  width: 60px;
  height: 90px;
  border-radius: 6px;
  background-color: #f0f0f0;
  color: #666;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

/* 4. 推荐人头像列表（子元素）：
   这是一个在海报下方的、居中的、有间距的flex行 */
.movie-recommenders {
  display: flex;
  flex-wrap: wrap;       /* 新增: 如果头像超过3个，允许换行 */
  align-items: center;
  justify-content: center; /* 修改: 在60px宽度内，"居中"通常比"末端对齐"更好看 */
  gap: 4px;              /* 修改: 8px的间距在60px的宽度下可能太大，4px更紧凑 */
  margin-top: 8px;       /* 新增: 在海报和头像列表之间添加8px的垂直间距 */
}

.recommender-avatar-container,
.recommender-avatars-container {
  display: flex;
  gap: 4px;
}

.avatar-tooltip {
  position: relative;
  display: inline-block;
}

.recommender-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: transform 0.2s;
}

.recommender-avatar:hover {
  transform: scale(1.1);
}

.avatar-tooltip-text {
  visibility: hidden;
  width: 120px;
  background-color: #333;
  color: #fff;
  text-align: center;
  border-radius: 4px;
  padding: 5px;
  position: absolute;
  z-index: 1000;
  bottom: 125%;
  left: 50%;
  margin-left: -60px;
  font-size: 0.75rem;
  opacity: 0;
  transition: opacity 0.3s;
}

.avatar-tooltip:hover .avatar-tooltip-text {
  visibility: visible;
  opacity: 1;
}

.avatar-tooltip-text::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: #333 transparent transparent transparent;
}

/* Button styles */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Conversation Actions */
.conversation-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 15px;
  background-color: white;
  border-top: 1px solid #eee;
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
  margin: 0;
}

.rating-reminder {
  color: #e74c3c;
  font-size: 0.9rem;
  font-weight: 500;
  margin: 0;
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
  font-size: 0.9rem;
}

.next-btn:hover {
  background-color: #1976d2;
}

.next-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

/* Message highlight effect */
.message-highlight {
  background-color: rgba(255, 235, 59, 0.3) !important;
  padding: 8px !important;
  border-radius: 8px !important;
  box-shadow: 0 2px 8px rgba(255, 193, 7, 0.3) !important;
  transition: all 0.3s ease !important;
  border: 2px solid rgba(255, 193, 7, 0.5) !important;
}

.message-highlight .message-content {
  background-color: rgba(255, 235, 59, 0.2) !important;
}

/* Scrollbar styles for movie list */
.movie-list::-webkit-scrollbar {
  width: 6px;
}

.movie-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.movie-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.movie-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
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