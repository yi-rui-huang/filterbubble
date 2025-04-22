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
        <h2 class="card-title">First Conversation Round</h2>
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
                <div class="message-text" v-html="message.text"></div>
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
        
        <div class="conversation-actions">
          <p class="messages-remaining" v-if="remainingMessages > 0">
            {{ remainingMessages }} messages remaining before you can proceed
          </p>
          <button 
            class="btn next-btn" 
            @click="finishConversation" 
            :disabled="!canProceed"
          >
            Complete First Round
          </button>
        </div>
      </div>
    </div>

    <!-- Right Column: Movie Recommendations -->
    <div class="sidebar movie-recommendations-sidebar">
      <h3 class="sidebar-title">Movie Recommendations</h3>
      <div class="movie-list">
        <div v-if="Object.keys(movieStatsObject).length === 0" class="no-recommendations">
          <p>Movies will appear here as they are mentioned in the conversation.</p>
        </div>
        <div v-else>
          <p class="movie-count-summary">{{ Object.keys(movieStatsObject).length }} movies mentioned</p>
          <!-- 按提及次数排序电影 -->
          <div 
            v-for="[movieTitle, count] in sortedMovies" 
            :key="movieTitle" 
            class="movie-card"
            :class="`recommendation-count-${Math.min(count, 5)}`"
          >
            <div class="movie-details-container">
              <div v-if="movieDetailsMap[movieTitle]?.Poster && movieDetailsMap[movieTitle].Poster !== 'N/A'" class="movie-poster-container">
                <img :src="movieDetailsMap[movieTitle].Poster" :alt="movieTitle + ' poster'" class="movie-poster">
              </div>
              <div class="movie-info">
                <h4 class="movie-title" v-html="movieTitle"></h4>
                <p class="recommendation-count">Mentioned {{ count }} {{ count === 1 ? 'time' : 'times' }}</p>
                <p v-if="movieDetailsMap[movieTitle]?.Director && movieDetailsMap[movieTitle].Director !== 'N/A'" class="movie-director">Director: {{ movieDetailsMap[movieTitle].Director }}</p>
                <p v-if="movieDetailsMap[movieTitle]?.imdbRating && movieDetailsMap[movieTitle].imdbRating !== 'N/A'" class="movie-rating">IMDB: {{ movieDetailsMap[movieTitle].imdbRating }}</p>
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
import { loadMoviesData, markMoviesInMessage, updateMovieList, normalizeMovieTitle } from '../services/movieService';
import { getFirebaseDb } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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
      welcomeMessage: "Hello! I’m your AI assistant for movie recommendations, and I’d love to chat with you about anything that interests you. For example, imagine you’re spending a cozy weekend at home with friends, watching a movie. What’s the atmosphere like in the room? What types of movies do you enjoy watching together? Let’s dive into your perfect movie night!",
      moviesData: [],
      movieMentions: new Map(),
      movieStats: new Map(),
      movieStatsObject: {},
      movieDetailsMap: {},
      inputError: ''
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
    
    // Load movie data
    loadMoviesData().then(data => {
      this.moviesData = data;
      console.log('Loaded movie data:', data);
    });
    
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
    
    // Listen for movie mention events
    document.addEventListener('movie-mentioned', this.handleMovieMention);
    
    // 测试OMDB API - 手动获取一个知名电影的详细信息
    console.log('Testing OMDB API with a known movie title');
    this.fetchMovieDetailsIfNeeded("The Shawshank Redemption");
  },
  mounted() {
    this.$refs.messageInput.focus();
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
  },
  methods: {
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
    
    // Format agent responses to add proper line breaks
    formatAgentResponse(text) {
      if (!text) return '';
      
      // First, preserve existing line breaks
      text = text.replace(/\n/g, '<br>');
      
      // Handle numbered lists - this is the main pattern we want to format nicely
      // Look for patterns like "1. Movie title" and add a line break before each item
      text = text.replace(/((?:^|\.|!|\?|<br>)\s*)(\d+\.)/g, '$1<br>$2');
      
      // Add line breaks between paragraphs (after periods followed by a capital letter)
      // But be more selective to avoid breaking sentences unnaturally
      text = text.replace(/([.!?])\s{2,}([A-Z])/g, '$1<br><br>$2');
      
      // Add a line break after introductory phrases ending with a colon
      text = text.replace(/(Here are|Check out|Some recommendations|I recommend|You might enjoy)([^:]*:)(\s*)/gi, '$1$2<br>');
      
      // Clean up any excessive line breaks
      text = text.replace(/<br>\s*<br>\s*<br>/g, '<br><br>');
      
      // Add paragraph breaks between distinct thoughts
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
        } else {
          console.log(`No details found for movie: ${movieTitle}`);
        }
      });
    },
    async fetchGPT4oResponse(userMessage) {
      const API_KEY = 'sk-SE3cDjGLJoAcscUqzyfVELo1yNnrxgJ18jFkhcwwhTqqUJUn';  // Replace with your actual API key
      const BASE_URL = 'https://api.tao-shen.com/v1';
      const MODEL = 'gpt-4o';
      
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
      if (!this.userInput.trim() || this.isSubmitting) {
        return;
      }
      
      // Validate input to prevent code injection
      if (!this.validateUserInput(this.userInput)) {
        this.inputError = '请输入有效的文字，不允许输入代码或特殊字符';
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
      
      // Detect and mark movies in agent response
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
      
      console.log('Updated movieStatsObject:', this.movieStatsObject);
      console.log('Updated movieStats:', Object.fromEntries(this.movieStats));
    },
    async finishConversation() {
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

        // Navigate to the transition page
        this.$router.push('/transition');
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
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.movie-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.movie-details-container {
  display: flex;
  align-items: flex-start;
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
  margin: 0 0 8px 0;
  font-size: 1.1rem;
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
  max-width: 50%;
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
  height: 500px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f9f9f9;
  box-shadow: inset 0 0 5px rgba(0,0,0,0.05);
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
  background-color: #f5f5f5;
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

.messages-remaining {
  color: #666;
  font-size: 0.9rem;
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
</style>
