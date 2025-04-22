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
        <h2 class="card-title">Second Conversation Round</h2>
        <p class="conversation-description">
          In this section, you will have another conversation with an AI assistant. This time, the AI might
          respond differently based on your previous interactions. Feel free to explore new topics or
          continue previous discussions.
        </p>
        
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
                <p>{{ message.text }}</p>
                <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                <span v-if="message.sender === 'agent'" class="reply-hint">点击回复 (按住Shift键可@多个)</span>
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
            ></textarea>
            <button 
              class="btn send-btn" 
              @click="sendMessage" 
              :disabled="!userInput.trim() || isSubmitting"
            >
              Send
            </button>
          </div>
        </div>
        
        <div class="conversation-actions">
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
          <!-- Example recommendations - commented out as requested
          <div class="example-recommendation">
            <div class="example-movie-card">
              <h4 class="movie-title">The Shawshank Redemption</h4>
              <p class="movie-recommender">Recommended by: Agent</p>
              <p class="movie-reason">Its powerful storytelling and emotional depth make it a timeless classic.</p>
            </div>
            <div class="example-movie-card">
              <h4 class="movie-title">Inception</h4>
              
              <p class="movie-recommender">Recommended by: Agent</p>
              <p class="movie-reason">The complex narrative structure and visual effects create a unique cinematic experience.</p>
            </div>
            <div class="example-movie-card">
              <h4 class="movie-title">The Avengers</h4>
              <p class="movie-recommender">Recommended by: Agent</p>
              <p class="movie-reason">It perfectly balances action, humor, and character development in an entertaining package.</p>
            </div>
          </div>
          -->
        </div>
        <div 
          v-for="(movie, index) in recommendedMovies" 
          :key="index" 
          class="movie-card"
          :class="`recommended-by-${movie.recommendedBy}`"
        >
          <h4 class="movie-title">{{ movie.title }}</h4>
          <p class="movie-recommender">Recommended by: {{ agentProfiles.agents[movie.recommendedBy]?.role || 'Agent' }}</p>
          <p class="movie-reason" v-if="movie.reason">{{ movie.reason }}</p>
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
const BASE_URL = 'https://api.tao-shen.com/v1';
const MODEL = 'gpt-4o';
const API_TIMEOUT = 30000; // 30秒超时

// 备用API配置，如果主API失败，可以尝试使用备用API
const BACKUP_API_KEY = 'sk-SE3cDjGLJoAcscUqzyfVELo1yNnrxgJ18jFkhcwwhTqqUJUn';
const BACKUP_BASE_URL = 'https://api.tao-shen.com/v1';

export default {
  name: "V2SecondRoundConversation",
  data() {
    return {
      userInput: '',
      messages: [],
      isAgentTyping: false,
      isSubmitting: false,
      minRequiredMessages: 5, // Minimum number of user messages required
      maxMessages: 30, // Maximum number of messages allowed
      welcomeMessage: "", // Empty as we now use a full welcome message in created()
      activeAgent: null, // Currently selected agent in the sidebar
      recommendedMovies: [], // List of movies recommended by agents
      agentProfiles: agentProfiles // Import the agent profiles data
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
    // Log page view
    logUserEvent('view_second_round_conversation');
    
    // Add welcome message
    this.messages.push({
      sender: 'agent',
      agentType: 'moderator',
      text: "Welcome back to our film discussion! I'm your moderator, and I'm joined by our panel of film experts. Feel free to ask questions or share your thoughts on any movies you've seen recently. You can also direct your questions to specific agents by using @critic, @fan, or @analyst.",
      timestamp: new Date()
    });
    
    // Add introductions from each agent
    this.addAgentIntroductions();
    
    // Load agent profiles
    console.log('Agent profiles loaded:', this.agentProfiles);
    
    // Log agent welcome message
    try {
      logConversation('2', 'agent', "Welcome back to our film discussion! I'm your moderator, and I'm joined by our panel of film experts. Feel free to ask questions or share your thoughts on any movies you've seen recently. You can also direct your questions to specific agents by using @critic, @fan, or @analyst.", 'moderator');
    } catch (error) {
      console.warn('Failed to log agent welcome message to Firebase:', error);
    }
    
    // 验证API密钥
    this.validateApiKey();
  },
  mounted() {
    // Focus the input field
    this.$refs.messageInput.focus();
  },
  methods: {
    async sendMessage() {
      console.log('Starting sendMessage process...');
      if (!this.userInput.trim() || this.isSubmitting) {
        return;
      }

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

      // Check if maximum messages reached
      if (this.messages.length >= this.maxMessages * 2) { // *2 because each exchange has 2 messages
        console.log(`Maximum messages reached (${this.messages.length}/${this.maxMessages * 2}), stopping`);
        this.isSubmitting = false;
        return;
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
        
        // Select agents for this round of discussion
        let selectedAgents;
        
        if (targetedAgents.length > 0) {
          // If user is responding to specific agents, prioritize those agents
          selectedAgents = targetedAgents;
          
          // Add moderator and one other relevant agent
          const otherAgents = Object.keys(agentProfiles.agents)
            .filter(a => !targetedAgents.includes(a) && a !== 'moderator')
            .sort((a, b) => relevanceScores[b] - relevanceScores[a])
            .slice(0, 1);
            
          selectedAgents = [...selectedAgents, ...otherAgents, 'moderator'];
        } else {
          // Sort agents by relevance and select top agents
          selectedAgents = Object.keys(agentProfiles.agents)
            .sort((a, b) => relevanceScores[b] - relevanceScores[a])
            .slice(0, 3); // Limit to top 3 agents
            
          // Ensure moderator is included in important discussions
          if (this.messages.length % 6 === 0 && !selectedAgents.includes('moderator')) {
            selectedAgents[selectedAgents.length - 1] = 'moderator';
          }
        }

        console.log('Final selected agents for response:', selectedAgents);

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
          if (agentMemory.length > 0) {
            agentContext += `\nPrevious interactions with the user:\n${agentMemory.join('\n')}\n`;
          }
          
          // Add special instructions based on agent role
          if (agentKey === 'moderator') {
            agentContext += `\nAs the moderator, your role is to guide the discussion, ask follow-up questions, and ensure all perspectives are heard. If the conversation has been going on for a while, consider summarizing key points.`;
          } else if (targetedAgents.includes(agentKey)) {
            agentContext += `\nThe user is directly responding to your previous comment. Address their feedback specifically.`;
          }
          
          const prompt = 
            `${conversationHistory}\n\n${agentContext}\n\nAs a ${agentProfile.role}, with expertise in ${agentProfile.knowledge_domains.join(', ')}, engage in a natural discussion about movies. Respond to previous comments from other participants, and if appropriate, recommend movies that align with your perspective. Keep your response conversational and engaging.`;
          
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
            console.log(`API request details: URL=${BASE_URL}/chat/completions, model=${MODEL}`);
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
            
            // Try using backup API
            if (error.response && error.response.status === 401) {
              console.log('Trying backup API...');
              headers.Authorization = `Bearer ${BACKUP_API_KEY}`;
              const backupResponse = await axios.post(`${BACKUP_BASE_URL}/chat/completions`, data, { headers, timeout: API_TIMEOUT });
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
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        // If this is a longer conversation, occasionally have agents respond to each other
        if (this.messages.length > 6 && Math.random() > 0.5) {
          console.log('Triggering agent-to-agent response...');
          await this.generateAgentToAgentResponse(conversationHistory, selectedAgents);
        } else {
          console.log('Not triggering agent-to-agent response. Messages length:', this.messages.length);
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
        
        // Navigate to final questionnaire
        this.$router.push({ name: 'FinalQuestionnaire' });
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
      
      // Check if message contains agent role mentions with @ symbol
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
    
    // Generate response where one agent responds to another
    async generateAgentToAgentResponse(conversationHistory, excludeAgents) {
      console.log('Starting generateAgentToAgentResponse...');
      console.log('Excluded agents:', excludeAgents);
      
      // Select a random agent that wasn't part of the current round
      const availableAgents = Object.keys(agentProfiles.agents)
        .filter(agent => !excludeAgents.includes(agent));
      
      console.log('Available agents for response:', availableAgents);
        
      if (availableAgents.length === 0) {
        console.log('No available agents to respond, returning');
        return;
      }
      
      const respondingAgentKey = availableAgents[Math.floor(Math.random() * availableAgents.length)];
      const respondingAgent = agentProfiles.agents[respondingAgentKey];
      console.log('Selected responding agent:', respondingAgentKey);
      
      this.isAgentTyping = true;
      
      try {
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        };
        
        const prompt = 
          `${conversationHistory}\n\nAs a ${respondingAgent.role}, with expertise in ${respondingAgent.knowledge_domains.join(', ')}, join the ongoing conversation. Respond to what another participant just said, adding your unique perspective. Keep your response conversational and engaging.`;
        
        const data = {
          model: MODEL,
          messages: [{
            role: 'user',
            content: prompt
          }],
          max_tokens: 500
        };
        
        console.log(`Sending agent-to-agent API request for ${respondingAgentKey}...`);
        const response = await axios.post(`${BASE_URL}/chat/completions`, data, { headers, timeout: API_TIMEOUT });
        console.log(`Received agent-to-agent API response for ${respondingAgentKey}:`, response.status);
        const agentResponse = response.data.choices[0].message.content;
        
        // Check if the response already starts with the agent's role
        let displayText = '';
        if (agentResponse.startsWith(respondingAgent.role + ':') || 
            agentResponse.startsWith(respondingAgent.role + ' :')) {
          displayText = agentResponse;
        } else {
          displayText = `${respondingAgent.role}: ${agentResponse}`;
        }
        
        // Split long responses into multiple messages
        this.splitAndAddMessages(displayText, respondingAgentKey);
        
        // Log agent message to Firebase
        try {
          await logConversation('2', 'agent', agentResponse, respondingAgentKey);
        } catch (error) {
          console.warn('Failed to log agent message to Firebase:', error);
        }
      } catch (error) {
        console.error('Error generating agent-to-agent response:', error);
        if (error.response) {
          console.error('API error response:', error.response.status, error.response.data);
        } else if (error.request) {
          console.error('No response received from API:', error.request);
        } else {
          console.error('Error setting up API request:', error.message);
        }
      } finally {
        this.isAgentTyping = false;
        console.log('Agent-to-agent response process completed');
      }
    },
    getAgentAvatar(agentType) {
      const avatarMap = {
        'moderator': p1Image,
        'critic': p2Image,
        'fan': p3Image,
        'analyst': p4Image,
        'professional_critic': p2Image,
        'indie_enthusiast': p4Image,
        'blockbuster_fan': p3Image
      };
      
      return avatarMap[agentType] || p1Image; // Default to moderator avatar if type not found
    },
    replyToAgent(agentType, event) {
      // Get the clicked agent's role
      const agentRole = agentProfiles.agents[agentType].role;
      
      // Check if Shift key is pressed (for adding multiple agents)
      const isShiftPressed = event.shiftKey;
      
      // If Shift is pressed, append to existing @mentions
      if (isShiftPressed && this.userInput) {
        // Check if the agent is already mentioned
        if (!this.userInput.includes(`@${agentRole}`)) {
          this.userInput = this.userInput.trim() + ` @${agentRole} `;
        }
      } else {
        // Replace with new @mention
        this.userInput = `@${agentRole} `;
      }
      
      this.$refs.messageInput.focus();
    },
    setActiveAgent(agentKey) {
      this.activeAgent = agentKey;
      // Focus on the input field and add @ mention
      this.$refs.messageInput.focus();
      const agentRole = agentProfiles.agents[agentKey].role;
      this.userInput = `@${agentRole} `;
    },
    // Extract movie recommendations from agent responses
    extractMovieRecommendation(text, agentType) {
      // Simple pattern matching to find movie recommendations
      const recommendationPatterns = [
        /I recommend (?:watching |seeing )?["'](.+?)["']/i,
        /You might enjoy ["'](.+?)["']/i,
        /Have you seen ["'](.+?)["']/i,
        /["'](.+?)["'] is a great film/i,
        /["'](.+?)["'] would be perfect for you/i
      ];
      
      for (const pattern of recommendationPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          // Check if this movie is already recommended
          const existingMovie = this.recommendedMovies.find(m => m.title.toLowerCase() === match[1].toLowerCase());
          if (!existingMovie) {
            this.recommendedMovies.push({
              title: match[1],
              recommendedBy: agentType,
              timestamp: new Date(),
              reason: this.extractRecommendationReason(text, match[1])
            });
          }
          break;
        }
      }
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
          (currentMessage.length + sentence.length > 150 || 
           Math.random() < 0.3); // 30% chance to start a new message
        
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
        
        // Add a small delay between messages (300-800ms) to simulate typing
        if (i < messages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
        }
      }
    },
    // Add agent introductions with delays
    addAgentIntroductions() {
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
      }, 1000);
      
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
      }, 2000);
      
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
      }, 3000);
    },
    // 验证API密钥是否有效
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
    }
  }
};
</script>

<style scoped>
.page-container {
  display: flex;
  width: 100%;
  min-height: 100vh;
  background-color: #f8f9fa;
}

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

.conversation-container {
  flex: 1;
  padding: 20px;
  max-width: 50%;
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
  margin-bottom: 15px;
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
  font-style: italic;
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
  font-style: italic;
}

.example-movie-card .movie-reason {
  margin: 5px 0 0 0;
  font-size: 0.9rem;
  color: #555;
  font-style: italic;
  line-height: 1.4;
  border-top: 1px solid #eee;
  padding-top: 5px;
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
  border-radius: 8px;
  overflow: hidden;
  background-color: #f9f9f9;
  box-shadow: inset 0 0 5px rgba(0,0,0,0.05);
}

.messages-container {
  padding: 20px;
  max-height: 500px;
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

.message-content {
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  position: relative;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

/* Agent-specific styling */
.professional_critic-message .message-content,
.critic-message .message-content {
  background-color: #f8f9fa;
  border-left: 4px solid #3a506b;
  color: #212529;
}

.professional_critic-message::before,
.critic-message::before {
  content: "Professional Critic";
  display: block;
  font-size: 0.7rem;
  color: #3a506b;
  font-weight: bold;
  margin-bottom: 0.2rem;
}

.indie_enthusiast-message .message-content,
.analyst-message .message-content {
  background-color: #f8f9fa;
  border-left: 4px solid #6d597a;
  color: #212529;
}

.indie_enthusiast-message::before,
.analyst-message::before {
  content: "Film Analyst";
  display: block;
  font-size: 0.7rem;
  color: #6d597a;
  font-weight: bold;
  margin-bottom: 0.2rem;
}

.blockbuster_fan-message .message-content,
.fan-message .message-content {
  background-color: #f8f9fa;
  border-left: 4px solid #e56b6f;
  color: #212529;
}

.blockbuster_fan-message::before,
.fan-message::before {
  content: "Movie Fan";
  display: block;
  font-size: 0.7rem;
  color: #e56b6f;
  font-weight: bold;
  margin-bottom: 0.2rem;
}

.moderator-message .message-content {
  background-color: #f8f9fa;
  border-left: 4px solid #2a9d8f;
  color: #212529;
}

.moderator-message::before {
  content: "Moderator";
  display: block;
  font-size: 0.7rem;
  color: #2a9d8f;
  font-weight: bold;
  margin-bottom: 0.2rem;
}

.default-agent-message .message-content {
  background-color: #f8f9fa;
  border-left: 4px solid #adb5bd;
  color: #212529;
}

.default-agent-message::before {
  content: "Film Assistant";
  display: block;
  font-size: 0.7rem;
  color: #adb5bd;
  font-weight: bold;
  margin-bottom: 0.2rem;
}

.message-time {
  display: block;
  font-size: 0.75rem;
  color: #999;
  margin-top: 5px;
}

.reply-hint {
  display: block;
  font-size: 0.75rem;
  color: #777;
  margin-top: 5px;
  font-style: italic;
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
}

.message-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.send-btn {
  margin-left: 10px;
  padding: 0 20px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.send-btn:hover {
  background-color: var(--primary-color-dark);
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
</style>
