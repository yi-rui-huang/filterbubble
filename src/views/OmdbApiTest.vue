<template>
  <div class="omdb-api-test">
    <h1>OMDB API Key Verification</h1>
    
    <div class="form-container">
      <div class="input-group">
        <label for="apiKey">API Key:</label>
        <input 
          type="text" 
          id="apiKey" 
          v-model="apiKey" 
          placeholder="Enter OMDB API Key"
        >
      </div>
      
      <div class="input-group">
        <label for="movieTitle">Movie Title:</label>
        <input 
          type="text" 
          id="movieTitle" 
          v-model="movieTitle" 
          placeholder="Enter a movie title to search"
        >
      </div>
      
      <button @click="verifyApiKey" :disabled="isLoading">
        {{ isLoading ? 'Verifying...' : 'Verify API Key' }}
      </button>
    </div>
    
    <div v-if="result" class="result-container">
      <div v-if="result.Response === 'True'" class="success">
        <h2>API Key is Valid! ✅</h2>
        <div class="movie-info" v-if="result">
          <div class="movie-poster" v-if="result.Poster && result.Poster !== 'N/A'">
            <img :src="result.Poster" alt="Movie Poster">
          </div>
          <div class="movie-details">
            <h3>{{ result.Title }} ({{ result.Year }})</h3>
            <p><strong>Director:</strong> {{ result.Director }}</p>
            <p><strong>Actors:</strong> {{ result.Actors }}</p>
            <p><strong>Plot:</strong> {{ result.Plot }}</p>
            <p><strong>IMDB Rating:</strong> {{ result.imdbRating }}</p>
          </div>
        </div>
      </div>
      <div v-else class="error">
        <h2>API Key Verification Failed ❌</h2>
        <p>Error: {{ result.Error }}</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'OmdbApiTest',
  data() {
    return {
      apiKey: '7e374f8b', // Pre-filled with your API key
      movieTitle: 'Inception', // Default movie to search
      result: null,
      isLoading: false,
      error: null
    }
  },
  methods: {
    async verifyApiKey() {
      if (!this.apiKey || !this.movieTitle) {
        alert('Please enter both API key and movie title');
        return;
      }
      
      this.isLoading = true;
      this.result = null;
      this.error = null;
      
      try {
        const response = await fetch(`https://www.omdbapi.com/?apikey=${this.apiKey}&t=${encodeURIComponent(this.movieTitle)}`);
        const data = await response.json();
        this.result = data;
      } catch (error) {
        this.error = error.message;
        this.result = { Response: 'False', Error: error.message };
      } finally {
        this.isLoading = false;
      }
    }
  },
  mounted() {
    // Auto-verify on page load
    this.verifyApiKey();
  }
}
</script>

<style scoped>
.omdb-api-test {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
}

.form-container {
  background-color: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.input-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

button {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  width: 100%;
}

button:hover {
  background-color: #45a049;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.result-container {
  margin-top: 30px;
  padding: 20px;
  border-radius: 8px;
}

.success {
  background-color: #e8f5e9;
}

.error {
  background-color: #ffebee;
}

.movie-info {
  display: flex;
  margin-top: 20px;
}

.movie-poster {
  flex: 0 0 200px;
  margin-right: 20px;
}

.movie-poster img {
  max-width: 100%;
  border-radius: 4px;
}

.movie-details {
  flex: 1;
}

h3 {
  margin-top: 0;
}
</style>
