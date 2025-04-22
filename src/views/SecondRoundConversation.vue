<template>
  <div class="page-container">
    <!-- Left Column: Agent Profiles -->
    <div class="sidebar agent-profiles-sidebar">
      <h3 class="sidebar-title">Film Discussion Agents</h3>
      <div class="agent-list">
        <div 
          v-for="(agent, key) in agentProfiles.agents" 
          :key="key" 
          class="agent-profile-card"
          @click="setActiveAgent(key)"
          :class="{'active': activeAgent === key}"
        >
          <div class="agent-avatar-container">
            <img :src="getAgentAvatar(key)" class="agent-profile-avatar" alt="Agent Avatar">
          </div>
          <div class="agent-info">
            <h4 class="agent-role">{{ agent.role }}</h4>
            <p class="agent-description">{{ agent.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Middle Column: Conversation -->
    <div class="conversation-container">
      <div class="card conversation-card">
        <h2 class="card-title">Film Discussion</h2>
       <!-- <p class="conversation-description">
          Chat with our film experts and share your thoughts on movies. Our panel of film enthusiasts will discuss various perspectives on cinema with you.
        </p> -->
        
        <div class="conversation-area">
          <div class="messages-container" ref="messagesContainer">
            <div 
              v-for="(message, index) in messages" 
              :key="index" 
              :class="['message', message.sender === 'user' ? 'user-message' : `agent-message ${message.agentType || 'default-agent'}-message`]"
              @click="message.sender === 'agent' ? replyToAgent(message.agentType, $event) : null"
              :style="message.sender === 'agent' ? 'cursor: pointer;' : ''"
            >
              <div v-if="message.sender === 'agent'" class="agent-avatar">
                <img :src="getAgentAvatar(message.agentType)" alt="Agent Avatar" class="avatar-image">
              </div>
              <div class="message-content">
                <div class="message-text" v-text="message.text"></div>
                <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                <span v-if="message.sender === 'agent'" class="reply-hint">Click to reply (hold Shift key to @ multiple)</span>
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
              :disabled="isSubmitting"
              ref="messageInput"
              @input="inputError = ''"
            ></textarea>
            <div v-if="inputError" class="input-error-message">{{ inputError }}</div>
            <button 
              class="btn send-btn" 
              @click="sendMessage" 
              :disabled="!userInput.trim() || isSubmitting"
            >
              Send
            </button>
          </div>
        </div>
        
        <div class="conversation-actions-inline">
          <p class="messages-remaining" v-if="remainingMessages > 0">
            {{ remainingMessages }} messages remaining before you can proceed
          </p>
          <button 
            class="btn next-btn" 
            @click="finishConversation" 
            :disabled="!canProceed"
          >
            Complete Second Round
          </button>
        </div>
      </div>
    </div>

    <!-- Right Column: Movie Recommendations -->
    <div class="sidebar movie-recommendations-sidebar">
      <h3 class="sidebar-title">Movie Recommendations</h3>
      <div class="movie-list">
        <div v-if="recommendedMovies.length === 0" class="no-recommendations">
          <p>Agents will recommend movies as you chat with them.</p>
        </div>
        <div 
          v-for="(movie, index) in recommendedMovies" 
          :key="index" 
          class="movie-card"
          :class="[`recommendation-count-${movie.recommendCount || 1}`, movie.recommendedByAgents ? '' : `recommended-by-${movie.recommendedBy}`]"
        >
          <div class="movie-details-container">
            <div v-if="movie.Poster && movie.Poster !== 'N/A'" class="movie-poster-container">
              <img :src="movie.Poster" :alt="movie.title + ' poster'" class="movie-poster">
            </div>
            <div class="movie-info">
              <h4 class="movie-title">{{ movie.title }}</h4>
              <p v-if="movie.Director" class="movie-director">Director: {{ movie.Director }}</p>
              <p v-if="movie.imdbRating" class="movie-rating">IMDB: {{ movie.imdbRating }}</p>
            </div>
          </div>
          <div class="movie-recommenders">
            <!-- 兼容旧数据结构 -->
            <div v-if="!movie.recommendedByAgents" class="recommender-avatar-container">
              <div class="avatar-tooltip">
                <img :src="getAgentAvatar(movie.recommendedBy)" class="recommender-avatar" alt="Agent Avatar" />
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
import { logConversation, logUserEvent } from '../services/loggingService';
import { analyzeRelevance, detectEmotion } from '../services/analysisService';
import p1Image from '../images/p1.png';
import p2Image from '../images/p2.png';
import p3Image from '../images/p3.png';
import p4Image from '../images/p4.png';

// Configuration for GPT-4o API
const API_KEY = 'sk-SE3cDjGLJoAcscUqzyfVELo1yNnrxgJ18jFkhcwwhTqqUJUn';
// Using proxy URL to solve CORS issues
const BASE_URL = '/api/openai';
const MODEL = 'gpt-4o';
const API_TIMEOUT = 30000; // 30 seconds timeout


export default {
  name: 'SecondRoundConversation',
  data() {
    return {
      userInput: '',
      messages: [],
      isAgentTyping: false,
      isSubmitting: false,
      minRequiredMessages: 5, // Minimum number of user messages required
      maxMessages: 200, // Increase maximum message quantity limit
      welcomeMessage: "", // Empty as we now use a full welcome message in created()
      activeAgent: null, // Currently selected agent in the sidebar
      recommendedMovies: [], // List of movies recommended by agents
      agentProfiles: agentProfiles, // Import the agent profiles data
      inputError: '', // Error message for input validation
      conversationRound: 1, // Track which round of conversation we're in (1, 2, or 3)
      userMessageCountInCurrentRound: 0, // Track user messages in current round
      firstRoundMessages: [] // Save the first round chat history
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
      return this.userMessageCount >= this.minRequiredMessages;
    }
  },
  created() {
    // Log page view and initial round
    logUserEvent('view_second_round_conversation');
    console.log('%cConversation starts in round 1', 'color: green; font-weight: bold; font-size: 14px');
    
    // Check if user came directly (not from transition page)
    const fromTransition = this.$route.query.fromTransition === 'true';
    if (!fromTransition) {
      // If user didn't come from transition page, redirect them
      this.$router.replace('/transition');
      return;
    }
    
    // Add welcome message - split into multiple messages for more realistic conversation
    const welcomeMessage = "Welcome to today's film discussion! I'm delighted to be your moderator. Let me quickly introduce our three guests. First, our Ethan Maxwell who analyzes films objectively, focusing on artistic value and technical execution. His insights are evidence-based and technically precise. Next, our Maya Cole who is passionate about unique artistic expressions. She is knowledgeable about experimental cinema and always seek innovative perspectives in film. Finally, our Jake Robinson who loves discussing popular films, box office performance, and audience reception. Today, we'll have a two-round discussion. In the first round, all three experts will respond to your messages and evaluate each other's movie recommendations. In the second round, I'll be your primary guide to provide personalized recommendations. Let’s talk about movies! Imagine you’re about to watch a film—what’s the setting? Where and when would you like to watch it? Are you with friends, family, or maybe on your own? What genre are you in the mood for? Let me know your thoughts, and we can start exploring the perfect movie together!";
    this.splitAndAddMessages(welcomeMessage, 'moderator');
    
    // Add introductions from each agent
    // this.addAgentIntroductions(); // Temporarily disable agent introductions
    
    // Load agent profiles
    console.log('Agent profiles loaded:', this.agentProfiles);
    
    // Log agent welcome message
    try {
      logConversation('2', 'agent', "Welcome to our film discussion! I'm your moderator, and I'm joined by our panel of film experts. In the first round, all three experts will respond to your messages and evaluate each other's recommendations. In the second round, I'll be your primary guide. Feel free to share your thoughts on movies you've seen recently. You can also direct your questions to specific agents by using @Ethan Maxwell, @Maya Cole, or @Jake Robinson.", 'moderator');
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
  methods: {
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
      
      return `Here is the first round conversation history:\n${formattedHistory}\n\nThis was the complete first round of the discussion with our film experts.`;
    },
    async sendMessage() {
      console.log('Starting sendMessage process...');
      if (!this.userInput.trim() || this.isSubmitting) {
        return;
      }
      
      // Validate input to prevent code injection
      if (!this.validateUserInput(this.userInput)) {
        this.inputError = '请输入有效的文字，不允许输入代码或特殊字符';
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

      // Log user message to Firebase
      try {
        await logConversation('2', 'user', userMessage);
        console.log('User message logged to Firebase');
      } catch (error) {
        console.warn('Failed to log user message to Firebase:', error);
      }

      // 检查是否达到最大消息数量，但不再阻止用户继续对话
      if (this.messages.length >= this.maxMessages * 2) { // *2 because each exchange has 2 messages
        console.log(`警告: 消息数量已达到预设上限 (${this.messages.length}/${this.maxMessages * 2})，但仍允许继续对话`);
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
        
        // Increment user message count in current round
        this.userMessageCountInCurrentRound++;
        
        // Check if we need to transition to round 2 after user's second message
        if (this.conversationRound === 1 && this.userMessageCountInCurrentRound >= 2) {
          // 保存第一轮的聊天记录
          this.saveFirstRoundMessages();
          console.log('第一轮聊天记录已保存:', this.firstRoundMessages);
          
          this.conversationRound = 2;
          // 将计数器设置为2，表示这是第二轮的第一条消息
          this.userMessageCountInCurrentRound = 2;
          console.log('%c已转换到第2轮对话', 'color: red; font-weight: bold; font-size: 14px');
          
          // 构建推荐电影的提示信息
          let movieRecommendationsText = "";
          if (this.recommendedMovies.length > 0) {
            movieRecommendationsText = ` I notice our panel has recommended some movies for you. You can see them in the recommendations panel on the right, along with which experts recommended each film.`;
          }
          
          // Add a transition message from moderator
          await this.addMessage({
            sender: 'agent',
            agentType: 'moderator',
            text: `Moderator: Thank you for sharing your thoughts with our panel. We're now moving to the second part of our discussion where I'll be your primary guide, drawing on all the insights from our experts.${movieRecommendationsText} Based on your interests and our experts' perspectives, I can help you explore films that might resonate with you. What aspects of the discussion so far have interested you most?`,
            timestamp: new Date()
          });
          
          // Log transition message
          try {
            await logConversation('2', 'agent', `Thank you for sharing your thoughts with our panel. We're now moving to the second part of our discussion where I'll be your primary guide, drawing on all the insights from our experts.${movieRecommendationsText} Based on your interests and our experts' perspectives, I can help you explore films that might resonate with you. What aspects of the discussion so far have interested you most?`, 'moderator');
          } catch (error) {
            console.warn('Failed to log transition message to Firebase:', error);
          }
        }
        
        // Check if we need to transition to round 3 after user's third message in round 2
        if (this.conversationRound === 2 && this.userMessageCountInCurrentRound >= 3) {
          this.conversationRound = 3;
          // 将计数器设置为1，表示这是第三轮的第一条消息
          this.userMessageCountInCurrentRound = 1;
          console.log('%c已转换到第3轮对话', 'color: red; font-weight: bold; font-size: 14px');
        }
        
        if (targetedAgents.length > 0) {
          // If user is specifically targeting agents
          if (this.conversationRound === 1) {
            // In round 1, respect user targeting but ensure all three main agents respond
            const mainAgents = ['professional_critic', 'indie_enthusiast', 'blockbuster_fan'];
            selectedAgents = [...new Set([...targetedAgents, ...mainAgents])];
          } else {
            // In round 2, only moderator responds regardless of targeting
            selectedAgents = ['moderator'];
            console.log('%c第二轮对话: 即使用户@提及其他agent，也只由moderator回复', 'color: purple; font-weight: bold');
            
            // 只有在用户第一次@提及其他agent时才显示提示信息
            // 检查这是否是第二轮的第一条消息，以及用户是否@提及了其他agent
            if (this.userMessageCountInCurrentRound === 3 && targetedAgents.some(agent => agent !== 'moderator')) {
              const targetedRoles = targetedAgents
                .filter(agent => agent !== 'moderator')
                .map(agent => agentProfiles.agents[agent].role)
                .join(', ');
              
              if (targetedRoles) {
                await this.addMessage({
                  sender: 'agent',
                  agentType: 'moderator',
                  text: `Moderator: I notice you're addressing ${targetedRoles}. In this round, I'll be your primary guide and will incorporate their perspectives in my responses.`,
                  timestamp: new Date()
                });
              }
            }
          }
        } else {
          // No specific targeting
          if (this.conversationRound === 1) {
            // In round 1, all three main agents respond
            selectedAgents = ['professional_critic', 'indie_enthusiast', 'blockbuster_fan'];
          } else {
            // In round 2, only moderator responds
            selectedAgents = ['moderator'];
            console.log('%c第二轮对话: moderator回复用户消息', 'color: purple; font-weight: bold');
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
        
        // For each selected agent, generate a response
        for (const agentKey of selectedAgents) {
          const agentProfile = agentProfiles.agents[agentKey];
          const agentMemory = agentMemories[agentKey] || [];
          
          const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          };
          
          // Build a more sophisticated prompt that includes:
          // 1. The agent's role and expertise
          // 2. The agent's memory of previous interactions
          // 3. The current conversation history
          // 4. Instructions for interaction with other agents
          
          let agentContext = '';
          
          // Add agent's memory of previous interactions
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
            if (this.conversationRound === 2) {
              agentContext += `\nAs the moderator in the second round, your role is to synthesize the perspectives of all experts, provide personalized guidance, and help the user explore films that match their interests. Reference the movie recommendations in the sidebar and explain which experts recommended each film.`;
            } else {
              agentContext += `\nAs the moderator, your role is to guide the discussion, ask follow-up questions, and ensure all perspectives are heard.`;
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
            
            prompt = `${conversationHistory}\n\n${agentContext}\n\nAs a ${agentProfile.role}, with expertise in ${agentProfile.knowledge_domains.join(', ')}, engage in a natural discussion about movies. Respond to the user's message and previous comments from other participants. Recommend one movie that aligns with your perspective AND evaluate previous movie recommendations from other agents with your stance (Support, Oppose, or Indifferent) with brief reasoning.${movieEvaluationContext} Keep your response conversational and engaging.`;
          } else {
            // In round 2, only moderator responds with more personalized recommendations
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
            
            // 根据对话轮次和用户消息数量调整提示
            let moderatorInstructions;
            if (this.conversationRound === 2 && this.userMessageCountInCurrentRound === 2) {
              // 第二轮的第一条消息，包含开场白和电影推荐提示
              moderatorInstructions = `As the moderator with expertise in ${agentProfile.knowledge_domains.join(', ')}, you have access to all the previous discussions and insights from our film experts (Ethan Maxwell, Maya Cole, and Jake Robinson). You are transitioning to the second round of discussion where you'll be the primary guide.\n\n${firstRoundConversationHistory}\n\nRespond to the user's message while introducing this new format. Draw their attention to the movie recommendations in the right sidebar and explain which experts recommended each film. Consider all previous movie recommendations, the experts' evaluations of films, and the user's expressed interests.\n\nIf appropriate, recommend additional movies that align with the user's preferences or ask follow-up questions to better understand their tastes. Keep your response conversational, helpful, and engaging.`;
            } else if (this.conversationRound === 3) {
              // 第三轮，直接自然对话，不需要总结
              moderatorInstructions = `As the moderator with expertise in ${agentProfile.knowledge_domains.join(', ')}, engage in a natural conversation with the user about films. Respond directly to their question or comment without summarizing previous discussions.\n\n${firstRoundConversationHistory}\n\nYou are now in a casual conversation phase where you should simply answer the user's questions or respond to their comments naturally. Keep your response conversational, helpful, and focused on the user's immediate query. You can still recommend movies if relevant to the conversation, but there's no need to reference the experts unless directly relevant to the user's question.`;
            } else {
              // 第二轮的后续消息，直接回复用户
              moderatorInstructions = `As the moderator with expertise in ${agentProfile.knowledge_domains.join(', ')}, you have access to all the previous discussions and insights from our film experts. Provide a direct, thoughtful response to the user's message that incorporates the perspectives of all our experts.\n\n${firstRoundConversationHistory}\n\nConsider all previous movie recommendations, the experts' evaluations of films, and the user's expressed interests when crafting your response. If appropriate, recommend additional movies that align with the user's preferences or ask follow-up questions. Keep your response conversational, helpful, and engaging.`;
            }
            
            prompt = `${conversationHistory}\n\n${agentContext}${movieRecommendationsContext}\n\n${moderatorInstructions}`;
          }
          
          const data = {
            model: MODEL,
            messages: [{
              role: 'user',
              content: prompt
            }],
            max_tokens: 500 // Increased token limit for more meaningful responses
          };

          console.log(`Sending API request for ${agentProfile.role}...`);
          try {
            console.log(`API request details: URL=${BASE_URL}/chat/completions, model=${MODEL} (through proxy)`);
            const response = await axios.post(`${BASE_URL}/chat/completions`, data, { headers, timeout: API_TIMEOUT });
            console.log(`Received API response for ${agentProfile.role}:`, response.status);
            const agentResponse = response.data.choices[0].message.content;
            
            // Check if the response already starts with the agent's role
            let displayText = '';
            if (agentResponse.startsWith(agentProfile.role + ':') || 
                agentResponse.startsWith(agentProfile.role + ' :')) {
              displayText = agentResponse;
            } else {
              displayText = `${agentProfile.role}: ${agentResponse}`;
            }
            
            // Split long responses into multiple messages
            this.splitAndAddMessages(displayText, agentKey);
            
            // Log agent message to Firebase
            try {
              await logConversation('2', 'agent', agentResponse, agentKey);
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
                this.splitAndAddMessages(backupAgentResponse, agentKey);
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
        }
        
        // 禁用智能体之间的互动响应，确保只有随机选择的一个智能体发言
        console.log('Agent-to-agent response disabled to ensure only one agent responds at a time.');
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
      this.messages.push(message);
      
      // Scroll to bottom of messages container
      this.$nextTick(() => {
        const container = this.$refs.messagesContainer;
        container.scrollTop = container.scrollHeight;
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
        
        // Navigate to middle questionnaire
        this.$router.push({ name: 'MiddleQuestionnaire' });
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
      const targetedAgents = [];
      
      // Check for specific agent name mentions with @ symbol
      const agentNameMap = {
        'ethan maxwell': 'professional_critic',
        'maya cole': 'indie_enthusiast',
        'jake robinson': 'blockbuster_fan'
      };
      
      // Check for @Name mentions
      for (const [agentName, agentKey] of Object.entries(agentNameMap)) {
        if (lowerMessage.includes(`@${agentName}`)) {
          targetedAgents.push(agentKey);
        }
      }
      
      // Also check for role mentions (backward compatibility)
      for (const [agentKey, profile] of Object.entries(agentProfiles.agents)) {
        const roleLower = profile.role.toLowerCase();
        if (lowerMessage.includes(`@${roleLower}`)) {
          targetedAgents.push(agentKey);
        }
      }
      
      // If no direct mentions, check if responding to the last agent
      if (targetedAgents.length === 0 && this.messages.length > 0) {
        // Find the last agent message
        for (let i = this.messages.length - 1; i >= 0; i--) {
          if (this.messages[i].sender === 'agent') {
            const lastAgentMessage = this.messages[i];
            const agentType = lastAgentMessage.agentType;
            
            // Check if user is likely responding to the last agent
            const responseIndicators = ['yes', 'no', 'agree', 'disagree', 'why', 'what', 'how', 'tell me more'];
            const isDirectResponse = responseIndicators.some(indicator => lowerMessage.includes(indicator));
            
            // If it's a short message or contains response indicators, assume it's a response to the last agent
            if (isDirectResponse || (userMessage.length < 20 && !userMessage.includes('?'))) {
              targetedAgents.push(agentType);
            }
            
            break;
          }
        }
      }
      
      return targetedAgents;
    },
    
    // Legacy function for backward compatibility
    detectTargetedAgent(userMessage) {
      const agents = this.detectTargetedAgents(userMessage);
      return agents.length > 0 ? agents[0] : null;
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
    
    // This function is now disabled in the new conversation flow
    async generateAgentToAgentResponse(conversationHistory, excludeAgents) {
      console.log('Agent-to-agent responses are disabled in the new conversation flow');
      return;
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
      // Map agent types to their full names
      const agentNameMap = {
        'professional_critic': 'Ethan Maxwell',
        'indie_enthusiast': 'Maya Cole',
        'blockbuster_fan': 'Jake Robinson',
        'moderator': 'Moderator'
      };
      
      // Get the agent's name or role
      const agentName = agentNameMap[agentType] || agentProfiles.agents[agentType].role;
      
      // Check if Shift key is pressed (for adding multiple agents)
      const isShiftPressed = event.shiftKey;
      
      // If Shift is pressed, append to existing @mentions
      if (isShiftPressed && this.userInput) {
        // Check if the agent is already mentioned
        if (!this.userInput.includes(`@${agentName}`)) {
          this.userInput = this.userInput.trim() + ` @${agentName} `;
        }
      } else {
        // Replace with new @mention
        this.userInput = `@${agentName} `;
      }
      
      this.$refs.messageInput.focus();
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
      this.userInput = `@${agentName} `;
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
        /["'](.+?)["'] is (?:an |a )?(?:excellent|amazing|fantastic|wonderful|great) (?:movie|film)/ig
      ];
      
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
      
      // 处理提取到的所有电影
      if (extractedMovies.size > 0) {
        console.log(`从 ${agentType} 的回复中提取到 ${extractedMovies.size} 部电影:`);
      }
      
      // 使用Promise.all来并行处理所有电影推荐
      const moviePromises = Array.from(extractedMovies).map(async (movieTitle) => {
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
        
        // 检查这部电影是否已经被推荐（使用标准化后的标题进行比较）
        const existingMovie = this.recommendedMovies.find(m => 
          this.normalizeMovieTitle(m.title).toLowerCase() === normalizedTitle.toLowerCase());
        
        if (!existingMovie) {
          // 如果电影不存在，创建新的电影推荐对象，使用新的数据结构
          const movieInfo = {
            title: this.normalizeMovieTitle(movieTitle),
            recommendedByAgents: [{
              agentType: agentType,
              timestamp: new Date(),
              reason: this.extractRecommendationReason(text, movieTitle),
              attitude: attitude
            }],
            recommendCount: 1,
            timestamp: new Date()
          };
          
          // 立即异步获取电影海报和详细信息
          try {
            const movieDetails = await this.fetchMovieDetails(movieTitle);
            if (movieDetails) {
              // 将获取到的电影详情合并到movieInfo中
              movieInfo.Poster = movieDetails.Poster;
              movieInfo.Director = movieDetails.Director;
              movieInfo.imdbRating = movieDetails.imdbRating;
              movieInfo.Year = movieDetails.Year;
              console.log(`成功获取电影 "${movieTitle}" 的海报和详细信息`);
            } else {
              console.log(`无法获取电影 "${movieTitle}" 的详细信息`);
            }
          } catch (error) {
            console.error(`获取电影 "${movieTitle}" 详细信息时出错:`, error);
          }
          
          // 打印提取到的电影信息
          console.log(`电影推荐提取: ${agentType} 支持电影 "${movieTitle}"`);
          if (movieInfo.recommendedByAgents[0].reason) {
            console.log(`提及上下文: ${movieInfo.recommendedByAgents[0].reason}`);
          }
          
          this.recommendedMovies.push(movieInfo);
        } else {
          // 如果电影已存在，更新推荐信息
          await this.updateMovieRecommendation(movieTitle, agentType, this.extractRecommendationReason(text, movieTitle), attitude);
          console.log(`更新现有电影: "${movieTitle}" (添加 ${agentType} 的支持)`);
        }
      });
      
      // 等待所有电影处理完成
      await Promise.all(moviePromises.filter(p => p)); // 过滤掉undefined的promise（来自态度不是support的电影）
      
      if (extractedMovies.size > 0) {
        console.log('-------------------');
      }
    },
    
    // 检查是否是有效的电影标题
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
        'it', 'the', 'a', 'an', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by',
        'about', 'like', 'through', 'over', 'before', 'between', 'after', 'since', 'without', 'under',
        'within', 'along', 'following', 'across', 'behind', 'beyond', 'plus', 'except', 'but', 'up',
        'out', 'around', 'down', 'off', 'above', 'below', 'this', 'that', 'these', 'those', 'they',
        'we', 'you', 'I', 'he', 'she', 'it', 'who', 'what', 'where', 'when', 'why', 'how'
      ];
      
      if (commonPhrases.includes(title.toLowerCase())) {
        return false;
      }
      
      // 检查是否是只包含常见词组的长句子
      if (title.split(' ').length > 10) {
        return false; // 过长的句子可能不是电影标题
      }
      
      return true;
    },
    
    // 标准化电影标题，移除结尾的标点符号和多余空格
    normalizeMovieTitle(title) {
      if (!title) return title;
      
      // 移除结尾的标点符号
      title = title.replace(/[.,!?;:"'\)\]]+$/, '');
      // 移除开头的标点符号
      title = title.replace(/^[.,!?;:"'\(\[]+/, '');
      // 移除多余空格
      title = title.trim().replace(/\s+/g, ' ');
      
      return title;
    },
    
    // 检测代理对电影的态度（support, oppose, indifferent）
    detectMovieAttitude(text, movieTitle) {
      // 将电影标题标准化以进行更准确的匹配
      const normalizedTitle = this.normalizeMovieTitle(movieTitle);
      
      // 在电影标题前后的文本中寻找态度指示词
      const supportPatterns = [
        new RegExp(`I recommend\\s+["']?${normalizedTitle}["']?`, 'i'),
        new RegExp(`I (strongly )?support\\s+["']?${normalizedTitle}["']?`, 'i'),
        new RegExp(`["']?${normalizedTitle}["']?\\s+is (a )?(great|excellent|amazing|fantastic|wonderful|good|brilliant|outstanding|superb|impressive|remarkable)`, 'i'),
        new RegExp(`I (would|highly) recommend\\s+["']?${normalizedTitle}["']?`, 'i'),
        new RegExp(`You (should|must|might|would) (definitely |really |certainly )?enjoy\\s+["']?${normalizedTitle}["']?`, 'i'),
        new RegExp(`["']?${normalizedTitle}["']?\\s+is (definitely |certainly |absolutely )?(worth|deserving)`, 'i'),
        new RegExp(`I (really |absolutely |thoroughly |completely )?(enjoyed|loved|liked|appreciated)\\s+["']?${normalizedTitle}["']?`, 'i'),
        /support this (movie|film)/i,
        /vote in favor/i,
        /strongly agree/i,
        /great choice/i,
        /excellent pick/i
      ];
      
      const opposePatterns = [
        new RegExp(`I (don't|do not) recommend\\s+["']?${normalizedTitle}["']?`, 'i'),
        new RegExp(`I (strongly )?oppose\\s+["']?${normalizedTitle}["']?`, 'i'),
        new RegExp(`["']?${normalizedTitle}["']?\\s+is (a )?(bad|terrible|awful|poor|disappointing|overrated|mediocre|weak|flawed)`, 'i'),
        new RegExp(`I (would|wouldn't|would not) (not )?recommend\\s+["']?${normalizedTitle}["']?`, 'i'),
        new RegExp(`You (should|might|would) (definitely |really |certainly )?(not|never) (enjoy|watch|see)\\s+["']?${normalizedTitle}["']?`, 'i'),
        new RegExp(`["']?${normalizedTitle}["']?\\s+is (definitely |certainly |absolutely )?(not worth|not deserving)`, 'i'),
        new RegExp(`I (really |absolutely |thoroughly |completely )?(disliked|hated|didn't like|did not like|didn't enjoy|did not enjoy)\\s+["']?${normalizedTitle}["']?`, 'i'),
        /oppose this (movie|film)/i,
        /vote against/i,
        /strongly disagree/i,
        /poor choice/i,
        /bad pick/i
      ];
      
      const indifferentPatterns = [
        new RegExp(`I am (neutral|indifferent|ambivalent) (about|on|toward)\\s+["']?${normalizedTitle}["']?`, 'i'),
        new RegExp(`["']?${normalizedTitle}["']?\\s+is (just )?(okay|so-so|average|neither good nor bad|mixed)`, 'i'),
        new RegExp(`I (have|have no|don't have|do not have) (strong |particular )?(feelings|opinion|view|stance) (about|on|toward)\\s+["']?${normalizedTitle}["']?`, 'i'),
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
    
    // 更新电影推荐数据，支持多个代理推荐同一部电影
    async updateMovieRecommendation(movieTitle, agentType, reason, attitude = 'support') {
      // 如果不是支持态度，不添加到推荐列表
      if (attitude !== 'support') {
        console.log(`代理 ${agentType} 对电影 "${movieTitle}" 不是支持态度，不添加到推荐列表`);
        return false;
      }
      
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
    splitAndAddMessages(text, agentKey) {
      // Extract agent role from the beginning of the text if present
      let agentRole = '';
      const roleMatch = text.match(/^([^:]+):/);
      if (roleMatch) {
        agentRole = roleMatch[1] + ': ';
        text = text.substring(roleMatch[0].length).trim();
      }
      
      // Split text into sentences
      const sentenceDelimiters = ['. ', '! ', '? ', '.\n', '!\n', '?\n'];
      let sentences = [text];
      
      // Split by each delimiter
      for (const delimiter of sentenceDelimiters) {
        const newSentences = [];
        for (const sentence of sentences) {
          newSentences.push(...sentence.split(delimiter).map((s, i, arr) => 
            i < arr.length - 1 ? s + delimiter.trim() : s
          ));
        }
        sentences = newSentences;
      }
      
      // Filter out empty sentences and trim
      sentences = sentences.map(s => s.trim()).filter(s => s.length > 0);
      
      // Group sentences into messages with some randomness
      const messages = [];
      let currentMessage = '';
      
      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];
        
        // Decide if we should start a new message
        const shouldStartNewMessage = 
          currentMessage.length > 0 && 
          (currentMessage.length + sentence.length > 250 || 
           Math.random() < 0.15); // 降低到15%的概率开始新消息，并增加长度阈值
        
        if (shouldStartNewMessage) {
          messages.push(currentMessage);
          currentMessage = sentence;
        } else {
          if (currentMessage.length > 0) {
            currentMessage += ' ' + sentence;
          } else {
            currentMessage = sentence;
          }
        }
      }
      
      // Add the last message if not empty
      if (currentMessage.length > 0) {
        messages.push(currentMessage);
      }
      
      // Add agent role to the first message if it was extracted
      if (agentRole && messages.length > 0) {
        messages[0] = agentRole + messages[0];
      }
      
      // Add messages to the conversation with slight delays
      this.addMessagesWithDelay(messages, agentKey);
      
      // Check for movie recommendations in the agent's response
      this.extractMovieRecommendation(text, agentKey);
    },
    
    async addMessagesWithDelay(messages, agentKey) {
      for (let i = 0; i < messages.length; i++) {
        this.addMessage({
          sender: 'agent',
          agentType: agentKey,
          text: messages[i],
          timestamp: new Date()
        });
        
        // Add an even longer delay between messages (2000-4000ms) to simulate slower, more deliberate typing
        if (i < messages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
        }
      }
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
          logConversation('2', 'agent', criticText, 'professional_critic');
        } catch (error) {
          console.warn('Failed to log agent message to Firebase:', error);
        }
      }, 3000);
      
      // Independent Film Enthusiast introduction
      setTimeout(() => {
        const indieText = "Hi there! I'm the Independent Film Enthusiast. I'm passionate about discovering unique artistic expressions and innovative storytelling. I love discussing experimental cinema, art house films, and emerging directors. I'm always looking for films that push boundaries and offer fresh perspectives. Can't wait to share some hidden gems with you!";
        
        this.messages.push({
          sender: 'agent',
          agentType: 'indie_enthusiast',
          text: indieText,
          timestamp: new Date()
        });
        
        // Log indie enthusiast introduction
        try {
          logConversation('2', 'agent', indieText, 'indie_enthusiast');
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
          logConversation('2', 'agent', fanText, 'blockbuster_fan');
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
          max_tokens: 5
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
        const response = await axios.get(`https://www.omdbapi.com/?apikey=7e374f8b&t=${encodeURIComponent(movieTitle)}`);
        if (response.data.Response === 'True') {
          return response.data;
        }
        return null;
      } catch (error) {
        console.error('Error fetching movie details:', error);
        return null;
      }
    }
  }
};
</script>

<style scoped>
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

.messages-container {
  padding: 15px;
  height: calc(100% - 200px); /* 减去其他元素的高度 */
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
}

.agent-profile-card:hover, .agent-profile-card.active {
  background-color: #e9ecef;
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
}

.message-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.messages-remaining {
  color: #666;
  font-size: 0.9rem;
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
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.movie-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
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

/* 根据推荐数量调整电影卡片的样式 */
.recommendation-count-2 {
  border-left: 3px solid #4caf50;
}

.recommendation-count-3 {
  border-left: 3px solid #2196f3;
}

.recommendation-count-4, .recommendation-count-5 {
  border-left: 3px solid #9c27b0;
}

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
  
  .agent-list, .movie-list {
    display: flex;
    overflow-x: auto;
    padding-bottom: 15px;
  }
  
  .agent-profile-card, .movie-card {
    min-width: 250px;
    margin-right: 15px;
  }
}

.conversation-card {
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
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
  background-color: #f9f9f9;
  box-shadow: inset 0 0 5px rgba(0,0,0,0.05);
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

.agent-message .message-content {
  background-color: #f5f5f5;
  border-radius: 0 18px 18px 18px;
}

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

/* 根据推荐数量调整电影卡片的样式 */
.recommendation-count-2 {
  border-left: 3px solid #4caf50;
}

.recommendation-count-3 {
  border-left: 3px solid #2196f3;
}

.recommendation-count-4, .recommendation-count-5 {
  border-left: 3px solid #9c27b0;
}

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
</style>
