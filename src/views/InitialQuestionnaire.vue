<template>
  <div class="questionnaire-container">
    <div class="card questionnaire-card">
      <h2 class="card-title">Initial Questionnaire</h2>
      <p class="questionnaire-description">
        Please answer the following questions to help us understand your background and preferences.
        This information will be used for research purposes only.
      </p>
      
      <!-- Validation Error Message -->
      <div v-if="validationError" class="validation-error">
        {{ validationError }}
      </div>
      
      <form @submit.prevent="submitQuestionnaire">
        <!-- Demographic Information -->
        <section class="form-section">
          <h3>Demographic Information</h3>
          
          <div class="form-group">
            <label class="form-label" for="gender">1. Gender</label>
            <div class="radio-group">
  <label><input type="radio" value="male" v-model="responses.gender" required> Male</label>
  <label><input type="radio" value="female" v-model="responses.gender" required> Female</label>
  <label><input type="radio" value="other" v-model="responses.gender" required> Other</label>
</div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="age">2. Age Group</label>
            <div class="radio-group">
  <label><input type="radio" value="18-25" v-model="responses.ageGroup" required> 18-25</label>
  <label><input type="radio" value="26-30" v-model="responses.ageGroup" required> 26-30</label>
  <label><input type="radio" value="31-40" v-model="responses.ageGroup" required> 31-40</label>
  <label><input type="radio" value="41-50" v-model="responses.ageGroup" required> 41-50</label>
  <label><input type="radio" value="51-60" v-model="responses.ageGroup" required> 51-60</label>
  <label><input type="radio" value="over-60" v-model="responses.ageGroup" required> Over 60</label>
</div>
          </div>
        </section>
        
        <!-- Movie Preferences -->
        <section class="form-section">
          <h3>Movie Preferences</h3>
          
          <div class="form-group">
            <label class="form-label" for="favorite-movie-types">3. What types of movies do you prefer? (Select 4-8 options)</label>
            <div class="checkbox-group">
  <label><input type="checkbox" value="Drama" v-model="responses.favoriteMovieTypes"> Drama</label>
  <label><input type="checkbox" value="Comedy" v-model="responses.favoriteMovieTypes"> Comedy</label>
  <label><input type="checkbox" value="Action" v-model="responses.favoriteMovieTypes"> Action</label>
  <label><input type="checkbox" value="Crime" v-model="responses.favoriteMovieTypes"> Crime</label>
  <label><input type="checkbox" value="Romance" v-model="responses.favoriteMovieTypes"> Romance</label>
  <label><input type="checkbox" value="Thriller" v-model="responses.favoriteMovieTypes"> Thriller</label>
  <label><input type="checkbox" value="Adventure" v-model="responses.favoriteMovieTypes"> Adventure</label>
  <label><input type="checkbox" value="Mystery" v-model="responses.favoriteMovieTypes"> Mystery</label>
  <label><input type="checkbox" value="Biography" v-model="responses.favoriteMovieTypes"> Biography</label>
  <label><input type="checkbox" value="Horror" v-model="responses.favoriteMovieTypes"> Horror</label>
  <label><input type="checkbox" value="Fantasy" v-model="responses.favoriteMovieTypes"> Fantasy</label>
  <label><input type="checkbox" value="Animation" v-model="responses.favoriteMovieTypes"> Animation</label>
  <label><input type="checkbox" value="History" v-model="responses.favoriteMovieTypes"> History</label>
  <label><input type="checkbox" value="Sci-Fi" v-model="responses.favoriteMovieTypes"> Sci-Fi</label>
  <label><input type="checkbox" value="Documentary" v-model="responses.favoriteMovieTypes"> Documentary</label>
  <label><input type="checkbox" value="Music" v-model="responses.favoriteMovieTypes"> Music</label>
  <label><input type="checkbox" value="Family" v-model="responses.favoriteMovieTypes"> Family</label>
  <label><input type="checkbox" value="Sport" v-model="responses.favoriteMovieTypes"> Sport</label>
  <label><input type="checkbox" value="War" v-model="responses.favoriteMovieTypes"> War</label>
  <label><input type="checkbox" value="Musical" v-model="responses.favoriteMovieTypes"> Musical</label>
  <label><input type="checkbox" value="Western" v-model="responses.favoriteMovieTypes"> Western</label>
</div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="movie-watching-frequency">4. How often do you watch movies?</label>
            <div class="radio-group">
  <label><input type="radio" value="daily" v-model="responses.movieWatchingFrequency" required> Daily</label>
  <label><input type="radio" value="several-times-week" v-model="responses.movieWatchingFrequency" required> Several times a week</label>
  <label><input type="radio" value="weekly" v-model="responses.movieWatchingFrequency" required> Weekly</label>
  <label><input type="radio" value="monthly" v-model="responses.movieWatchingFrequency" required> Monthly</label>
  <label><input type="radio" value="rarely" v-model="responses.movieWatchingFrequency" required> Rarely (a few times a year)</label>
  <label><input type="radio" value="almost-never" v-model="responses.movieWatchingFrequency" required> Almost never</label>
</div>
          </div>
        </section>
        
        <!-- Recommendation System Usage -->
        <section class="form-section">
          <h3>Recommendation System Usage</h3>
          
          <div class="form-group">
            <label class="form-label" for="rec-system-usage">5. How much do you rely on recommendation systems (e.g., product recommendations, music recommendations, movie recommendations)?</label>
            <div class="radio-group">
  <label><input type="radio" value="barely-rely" v-model="responses.recSystemUsage" required> Barely rely (mainly active searching)</label>
  <label><input type="radio" value="occasionally-rely" v-model="responses.recSystemUsage" required> Occasionally rely</label>
  <label><input type="radio" value="moderately-rely" v-model="responses.recSystemUsage" required> Moderately rely (frequently use recommended content)</label>
  <label><input type="radio" value="heavily-rely" v-model="responses.recSystemUsage" required> Heavily rely (mainly depend on recommended content)</label>
</div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="chatgpt-usage">6. Have you used tools like ChatGPT to get content recommendations?</label>
            <div class="radio-group">
  <label><input type="radio" value="barely-rely" v-model="responses.chatgptUsage" required> Barely rely (mainly active searching)</label>
  <label><input type="radio" value="occasionally-rely" v-model="responses.chatgptUsage" required> Occasionally rely</label>
  <label><input type="radio" value="moderately-rely" v-model="responses.chatgptUsage" required> Moderately rely (frequently use recommended content)</label>
  <label><input type="radio" value="heavily-rely" v-model="responses.chatgptUsage" required> Heavily rely (mainly depend on recommended content)</label>
</div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="filter-bubble-perception">7. When using tools like ChatGPT for recommendations, I feel "trapped" in repetitive content (similar topics/styles), with few new topics or perspectives.</label>
            <div class="radio-group">
  <label><input type="radio" value="strongly-disagree" v-model="responses.filterBubblePerception" required> Strongly disagree</label>
  <label><input type="radio" value="disagree" v-model="responses.filterBubblePerception" required> Disagree</label>
  <label><input type="radio" value="neutral" v-model="responses.filterBubblePerception" required> Neutral</label>
  <label><input type="radio" value="agree" v-model="responses.filterBubblePerception" required> Agree</label>
  <label><input type="radio" value="strongly-agree" v-model="responses.filterBubblePerception" required> Strongly agree</label>
</div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="missed-interests">8. When using tools like ChatGPT for recommendations, the recommendation system misses content I might be interested in (e.g., information I've explicitly expressed interest in but wasn't recommended).</label>
            <div class="radio-group">
  <label><input type="radio" value="strongly-disagree" v-model="responses.missedInterests" required> Strongly disagree</label>
  <label><input type="radio" value="disagree" v-model="responses.missedInterests" required> Disagree</label>
  <label><input type="radio" value="neutral" v-model="responses.missedInterests" required> Neutral</label>
  <label><input type="radio" value="agree" v-model="responses.missedInterests" required> Agree</label>
  <label><input type="radio" value="strongly-agree" v-model="responses.missedInterests" required> Strongly agree</label>
</div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="limited-info">9. When using tools like ChatGPT for recommendations, the recommendation system makes me feel that my access to information is limited.</label>
            <div class="radio-group">
  <label><input type="radio" value="strongly-disagree" v-model="responses.limitedInfo" required> Strongly disagree</label>
  <label><input type="radio" value="disagree" v-model="responses.limitedInfo" required> Disagree</label>
  <label><input type="radio" value="neutral" v-model="responses.limitedInfo" required> Neutral</label>
  <label><input type="radio" value="agree" v-model="responses.limitedInfo" required> Agree</label>
  <label><input type="radio" value="strongly-agree" v-model="responses.limitedInfo" required> Strongly agree</label>
</div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="unexpected-content">10. When using tools like ChatGPT for recommendations, I rarely find unexpected content that goes beyond my interests in the recommendations.</label>
            <div class="radio-group">
  <label><input type="radio" value="strongly-disagree" v-model="responses.unexpectedContent" required> Strongly disagree</label>
  <label><input type="radio" value="disagree" v-model="responses.unexpectedContent" required> Disagree</label>
  <label><input type="radio" value="neutral" v-model="responses.unexpectedContent" required> Neutral</label>
  <label><input type="radio" value="agree" v-model="responses.unexpectedContent" required> Agree</label>
  <label><input type="radio" value="strongly-agree" v-model="responses.unexpectedContent" required> Strongly agree</label>
</div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="diverse-perspectives">11. I would like to see more diverse perspectives and viewpoints in recommended content.</label>
            <div class="radio-group">
  <label><input type="radio" value="strongly-disagree" v-model="responses.diversePerspectives" required> Strongly disagree</label>
  <label><input type="radio" value="disagree" v-model="responses.diversePerspectives" required> Disagree</label>
  <label><input type="radio" value="neutral" v-model="responses.diversePerspectives" required> Neutral</label>
  <label><input type="radio" value="agree" v-model="responses.diversePerspectives" required> Agree</label>
  <label><input type="radio" value="strongly-agree" v-model="responses.diversePerspectives" required> Strongly agree</label>
</div>
          </div>
        </section>
        
        <!-- Personality Assessment (Big Five) -->
        <section class="form-section">
          <h3>Personality Assessment</h3>
          <p class="section-description">Please indicate how much you agree or disagree with each statement.</p>
          
          <!-- Openness to Experience -->
          <div class="form-group">
            <label class="form-label" for="openness-1">12. I am curious about many different things.</label>
            <div class="radio-group">
  <label><input type="radio" value="strongly-disagree" v-model="responses.openness1" required> Strongly disagree</label>
  <label><input type="radio" value="disagree" v-model="responses.openness1" required> Disagree</label>
  <label><input type="radio" value="neutral" v-model="responses.openness1" required> Neutral</label>
  <label><input type="radio" value="agree" v-model="responses.openness1" required> Agree</label>
  <label><input type="radio" value="strongly-agree" v-model="responses.openness1" required> Strongly agree</label>
</div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="openness-2">13. I have a vivid imagination.</label>
            <div class="radio-group">
  <label><input type="radio" value="strongly-disagree" v-model="responses.openness2" required> Strongly disagree</label>
  <label><input type="radio" value="disagree" v-model="responses.openness2" required> Disagree</label>
  <label><input type="radio" value="neutral" v-model="responses.openness2" required> Neutral</label>
  <label><input type="radio" value="agree" v-model="responses.openness2" required> Agree</label>
  <label><input type="radio" value="strongly-agree" v-model="responses.openness2" required> Strongly agree</label>
</div>
          </div>
          
          <!-- Conscientiousness -->
          <div class="form-group">
            <label class="form-label" for="conscientiousness-1">14. I am always prepared.</label>
            <div class="radio-group">
  <label><input type="radio" value="strongly-disagree" v-model="responses.conscientiousness1" required> Strongly disagree</label>
  <label><input type="radio" value="disagree" v-model="responses.conscientiousness1" required> Disagree</label>
  <label><input type="radio" value="neutral" v-model="responses.conscientiousness1" required> Neutral</label>
  <label><input type="radio" value="agree" v-model="responses.conscientiousness1" required> Agree</label>
  <label><input type="radio" value="strongly-agree" v-model="responses.conscientiousness1" required> Strongly agree</label>
</div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="conscientiousness-2">15. I pay attention to details.</label>
            <div class="radio-group">
  <label><input type="radio" value="strongly-disagree" v-model="responses.conscientiousness2" required> Strongly disagree</label>
  <label><input type="radio" value="disagree" v-model="responses.conscientiousness2" required> Disagree</label>
  <label><input type="radio" value="neutral" v-model="responses.conscientiousness2" required> Neutral</label>
  <label><input type="radio" value="agree" v-model="responses.conscientiousness2" required> Agree</label>
  <label><input type="radio" value="strongly-agree" v-model="responses.conscientiousness2" required> Strongly agree</label>
</div>
          </div>
          
          <!-- Extraversion -->
          <div class="form-group">
            <label class="form-label" for="extraversion-1">16. I am the life of the party.</label>
            <div class="radio-group">
  <label><input type="radio" value="strongly-disagree" v-model="responses.extraversion1" required> Strongly disagree</label>
  <label><input type="radio" value="disagree" v-model="responses.extraversion1" required> Disagree</label>
  <label><input type="radio" value="neutral" v-model="responses.extraversion1" required> Neutral</label>
  <label><input type="radio" value="agree" v-model="responses.extraversion1" required> Agree</label>
  <label><input type="radio" value="strongly-agree" v-model="responses.extraversion1" required> Strongly agree</label>
</div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="extraversion-2">17. I feel comfortable around people.</label>
            <div class="radio-group">
  <label><input type="radio" value="strongly-disagree" v-model="responses.extraversion2" required> Strongly disagree</label>
  <label><input type="radio" value="disagree" v-model="responses.extraversion2" required> Disagree</label>
  <label><input type="radio" value="neutral" v-model="responses.extraversion2" required> Neutral</label>
  <label><input type="radio" value="agree" v-model="responses.extraversion2" required> Agree</label>
  <label><input type="radio" value="strongly-agree" v-model="responses.extraversion2" required> Strongly agree</label>
</div>
          </div>
          
          <!-- Agreeableness -->
          <div class="form-group">
            <label class="form-label" for="agreeableness-1">18. I sympathize with others' feelings.</label>
            <div class="radio-group">
  <label><input type="radio" value="strongly-disagree" v-model="responses.agreeableness1" required> Strongly disagree</label>
  <label><input type="radio" value="disagree" v-model="responses.agreeableness1" required> Disagree</label>
  <label><input type="radio" value="neutral" v-model="responses.agreeableness1" required> Neutral</label>
  <label><input type="radio" value="agree" v-model="responses.agreeableness1" required> Agree</label>
  <label><input type="radio" value="strongly-agree" v-model="responses.agreeableness1" required> Strongly agree</label>
</div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="agreeableness-2">19. I take time out for others.</label>
            <div class="radio-group">
  <label><input type="radio" value="strongly-disagree" v-model="responses.agreeableness2" required> Strongly disagree</label>
  <label><input type="radio" value="disagree" v-model="responses.agreeableness2" required> Disagree</label>
  <label><input type="radio" value="neutral" v-model="responses.agreeableness2" required> Neutral</label>
  <label><input type="radio" value="agree" v-model="responses.agreeableness2" required> Agree</label>
  <label><input type="radio" value="strongly-agree" v-model="responses.agreeableness2" required> Strongly agree</label>
</div>
          </div>
          
          <!-- Neuroticism -->
          <div class="form-group">
            <label class="form-label" for="neuroticism-1">20. I get stressed out easily.</label>
            <div class="radio-group">
  <label><input type="radio" value="strongly-disagree" v-model="responses.neuroticism1" required> Strongly disagree</label>
  <label><input type="radio" value="disagree" v-model="responses.neuroticism1" required> Disagree</label>
  <label><input type="radio" value="neutral" v-model="responses.neuroticism1" required> Neutral</label>
  <label><input type="radio" value="agree" v-model="responses.neuroticism1" required> Agree</label>
  <label><input type="radio" value="strongly-agree" v-model="responses.neuroticism1" required> Strongly agree</label>
</div>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="neuroticism-2">21. I worry about things.</label>
            <div class="radio-group">
  <label><input type="radio" value="strongly-disagree" v-model="responses.neuroticism2" required> Strongly disagree</label>
  <label><input type="radio" value="disagree" v-model="responses.neuroticism2" required> Disagree</label>
  <label><input type="radio" value="neutral" v-model="responses.neuroticism2" required> Neutral</label>
  <label><input type="radio" value="agree" v-model="responses.neuroticism2" required> Agree</label>
  <label><input type="radio" value="strongly-agree" v-model="responses.neuroticism2" required> Strongly agree</label>
</div>
          </div>
        </section>
        
        <div class="form-actions">
          <button type="submit" class="btn" :disabled="isSubmitting">
            {{ isSubmitting ? 'Submitting...' : 'Submit and Continue' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { logUserEvent, logQuestionnaireResponses } from '../services/loggingService';
import { determineSystemOrder } from '../services/systemOrderService';
import { saveRecommendedMovies } from '../services/recommendedMoviesService';

export default {
  name: 'InitialQuestionnaire',
  data() {
    return {
      isSubmitting: false,
      validationError: '',
      responses: {
        // Demographic
        gender: '',
        ageGroup: '',

        // Movie Preferences
        favoriteMovieTypes: [],
        movieWatchingFrequency: '',

        // Recommendation System Usage
        recSystemUsage: '',
        chatgptUsage: '',
        filterBubblePerception: '',
        missedInterests: '',
        limitedInfo: '',
        unexpectedContent: '',
        diversePerspectives: '',

        // Big Five Personality Assessment (TIPI proxy)
        openness1: '',
        openness2: '',
        conscientiousness1: '',
        conscientiousness2: '',
        extraversion1: '',
        extraversion2: '',
        agreeableness1: '',
        agreeableness2: '',
        neuroticism1: '',
        neuroticism2: '',
      },
    };
  },
  // ...
  methods: {
    validateForm() {
      console.log('开始表单验证...');
      console.log('当前responses:', this.responses);
      
      this.validationError = '';

      const requiredRadioGroups = [
        'gender', 'ageGroup',
        'movieWatchingFrequency',
        'recSystemUsage', 'chatgptUsage', 'filterBubblePerception',
        'missedInterests', 'limitedInfo', 'unexpectedContent', 'diversePerspectives',
        'openness1', 'openness2', 'conscientiousness1', 'conscientiousness2',
        'extraversion1', 'extraversion2', 'agreeableness1', 'agreeableness2',
        'neuroticism1', 'neuroticism2'
      ];

      const emptyFields = requiredRadioGroups.filter(field => !this.responses[field]);
      console.log('未填写的必填字段:', emptyFields);

      if (!Array.isArray(this.responses.favoriteMovieTypes) || this.responses.favoriteMovieTypes.length === 0) {
        emptyFields.push('favoriteMovieTypes');
        console.log('电影类型未选择');
      } else if (this.responses.favoriteMovieTypes.length < 4) {
        this.validationError = 'Please select at least 4 movie types.';
        console.log('电影类型选择不足4种');
        return false;
      } else if (this.responses.favoriteMovieTypes.length > 8) {
        this.validationError = 'Please select no more than 8 movie types.';
        console.log('电影类型选择超过8种');
        return false;
      }

      if (emptyFields.length > 0) {
        this.validationError = 'Please answer all questions before submitting.';
        console.log('表单验证失败，未填写字段:', emptyFields);
        return false;
      }

      console.log('表单验证通过');
      return true;
    },
    async submitQuestionnaire() {
      console.log('点击了提交按钮');
      if (!this.validateForm()) return;

      console.log('开始提交表单...');
      this.isSubmitting = true;
      try {
        // 1) Build UserInput JSON from current responses
        const userInput = this.buildUserInputFromResponses(this.responses);

        // 2) Optionally persist a copy to localStorage (no auto-download on Vercel)
        try { localStorage.setItem('fb_user_input', JSON.stringify(userInput)); } catch {}

        // 3) Generate three agent profiles using utility
        const { generateAgentProfiles } = await import('../utils/agentProfileGenerator.js');
        const generatedProfiles = generateAgentProfiles(userInput);

        // 4) Save agent profiles to Firestore so other pages can use them
        const { saveProfiles, getOrCreateUserId } = await import('../services/profileService.js');
        const userId = getOrCreateUserId();
        const profileId = await saveProfiles(userInput, generatedProfiles, userId);

        // store reference for other pages
        try {
          localStorage.setItem('fb_profile_id', profileId);
          localStorage.setItem('fb_user_id', userId);
        } catch {}

        // Simulate submission delay
        await new Promise(resolve => setTimeout(resolve, 400));

        // 不显示alert，直接跳转
        this.isSubmitting = false;
        
        // 跳转到电影推荐介绍页面
        this.$router.push('/movie-intro');
      } catch (error) {
        console.error('Error submitting questionnaire:', error);
        alert('There was an error submitting your responses. Please try again.');
        this.isSubmitting = false;
      }
    },

    // Build a normalized user input profile for the agentProfileGenerator
    buildUserInputFromResponses(resp) {
      const ageMap = {
        '18-25': '18-24',
        '26-30': '25-30',
        '31-40': '31-39',
        '41-50': '40-49',
        '51-60': '50+',
        'over-60': '50+' // fallback to 50+
      };

      const genderMap = {
        male: 'Male',
        female: 'Female',
        other: 'Other'
      };

      // Map our lowercase values to IMDB-style labels used by generator (22 genres from high-quality dataset)
      const genreLabelMap = {
        'action': 'Action',
        'adventure': 'Adventure',
        'animation': 'Animation',
        'biography': 'Biography',
        'comedy': 'Comedy',
        'crime': 'Crime',
        'documentary': 'Documentary',
        'drama': 'Drama',
        'family': 'Family',
        'fantasy': 'Fantasy',
        'history': 'History',
        'horror': 'Horror',
        'music': 'Music',
        'musical': 'Musical',
        'mystery': 'Mystery',
        'news': 'News',
        'romance': 'Romance',
        'sci-fi': 'Sci-Fi',
        'sport': 'Sport',
        'thriller': 'Thriller',
        'war': 'War',
        'western': 'Western'
      };

      const likertToTipi = (val) => {
        // Map 5-point to 1-7 TIPI scale
        const map = {
          'strongly-disagree': 1,
          'disagree': 3,
          'neutral': 4,
          'agree': 5,
          'strongly-agree': 7,
        };
        return map[val] ?? 4;
      };

      // Build TIPI items mapping from our field names
      const tipi = {
        // Extraversion
        tipi_item_1: likertToTipi(resp.extraversion1), // Extraverted, enthusiastic
        tipi_item_6: likertToTipi(resp.extraversion2), // Reserved, quiet (R)
        // Agreeableness
        tipi_item_7: likertToTipi(resp.agreeableness1), // Sympathetic, warm
        tipi_item_2: likertToTipi(resp.agreeableness2), // Critical, quarrelsome (R)
        // Conscientiousness
        tipi_item_3: likertToTipi(resp.conscientiousness1), // Dependable, self-disciplined
        tipi_item_8: likertToTipi(resp.conscientiousness2), // Disorganized, careless (R)
        // Emotional Stability (Neuroticism R)
        tipi_item_4: likertToTipi(resp.neuroticism1), // Anxious, easily upset (R)
        tipi_item_9: likertToTipi(resp.neuroticism2), // Calm, emotionally stable
        // Openness
        tipi_item_5: likertToTipi(resp.openness1), // Open to new experiences, complex
        tipi_item_10: likertToTipi(resp.openness2), // Conventional, uncreative (R)
      };

      // Normalize to generator input
      const userInput = {
        demographics: {
          age_range: ageMap[resp.ageGroup] || '25-30',
          gender: genderMap[resp.gender] || 'Other',
        },
        interests: {
          liked_genres: (resp.favoriteMovieTypes || []).map(g => genreLabelMap[g.toLowerCase()]).filter(Boolean),
        },
        personality_raw: tipi,
      };

      return userInput;
    },

    // Removed auto-download helper for Vercel compatibility. Use Firestore + localStorage refs instead.
  }
};
</script>

<style scoped>
  /* ... */
.questionnaire-container {
  max-width: 100%;
  margin: 0;
  padding: 0;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  background-color: #f8f9fa;
  background-image: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
}

.questionnaire-card {
  padding: 3rem;
  max-height: 90vh;
  overflow-y: auto;
  width: 95%;
  margin: 2rem 0;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  background-color: white;
  transition: all 0.3s ease;
}

.questionnaire-description {
  margin-bottom: 2.5rem;
  font-size: 1.1rem;
  line-height: 1.6;
  color: #555;
}

.form-section {
  margin-bottom: 3rem;
  padding: 1.5rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e9ecef;
  background-color: #fafafa;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.form-section:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.form-section h3 {
  margin-bottom: 1.8rem;
  color: var(--primary-color);
  font-size: 1.4rem;
  font-weight: 600;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--primary-color);
  display: inline-block;
}

.rating-scale {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.5rem;
}

.rating-label {
  flex: 0 0 100px;
  font-size: 0.9rem;
}

.rating-options {
  display: flex;
  flex: 1;
  justify-content: space-between;
  max-width: 300px;
  margin: 0 1rem;
}

.rating-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.rating-option input {
  margin-bottom: 0.25rem;
}

.checkbox-group {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.75rem 1rem;
  margin-top: 0.5rem;
}

.checkbox-container {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.checkbox-container input {
  margin-right: 0.5rem;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  transition: background-color 0.2s ease, transform 0.1s ease;
  border: 1px solid transparent;
}

.checkbox-group label:hover {
  background-color: #e9f0f8;
  transform: translateX(3px);
  border-color: #d0e0f0;
}

.checkbox-group input[type="checkbox"] {
  margin-right: 0.6rem;
  transform: scale(1.2);
  accent-color: var(--primary-color);
  cursor: pointer;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 0.8rem;
  padding: 0.5rem;
}

.radio-group label {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0.6rem 1rem;
  border-radius: 6px;
  transition: background-color 0.2s ease, transform 0.1s ease;
  border: 1px solid transparent;
}

.radio-group label:hover {
  background-color: #e9f0f8;
  transform: translateX(3px);
  border-color: #d0e0f0;
}

.radio-group input[type="radio"] {
  margin-right: 0.8rem;
  transform: scale(1.3);
  accent-color: var(--primary-color);
  cursor: pointer;
}

.form-actions {
  margin-top: 3rem;
  display: flex;
  justify-content: center;
  padding: 1rem 0;
}

.form-actions .btn {
  min-width: 220px;
  padding: 0.8rem 1.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 30px;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  border: none;
  color: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.form-actions .btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.form-actions .btn:active {
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
}

@media (max-width: 768px) {
  .questionnaire-card {
    padding: 1.5rem;
  }
  
  .rating-scale {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .rating-label {
    margin-bottom: 0.5rem;
  }
  
  .rating-options {
    margin: 0.5rem 0;
  }
}

.validation-error {
  background-color: #ffebee;
  color: #d32f2f;
  padding: 1rem;
  margin-bottom: 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  border-left: 4px solid #d32f2f;
  animation: shake 0.5s;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}
</style>
