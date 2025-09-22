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
        <button v-if="firstIncompleteQuestion" @click="scrollToQuestion(firstIncompleteQuestion)" class="scroll-to-question-btn">
          Go to Question {{ firstIncompleteQuestion }}
        </button>
      </div>
      
      <form @submit.prevent="submitQuestionnaire">
        <!-- Demographic Information -->
        <section class="form-section">
          <h3>Demographic Information</h3>
          
          <div class="form-group" :class="{ 'incomplete': !responses.gender }" ref="question-1">
            <label class="form-label" for="gender">1. Gender <span v-if="responses.gender" class="completed-indicator">✓</span></label>
            <div class="radio-group">
  <label><input type="radio" value="male" v-model="responses.gender" required> Male</label>
  <label><input type="radio" value="female" v-model="responses.gender" required> Female</label>
  <label><input type="radio" value="other" v-model="responses.gender" required> Other</label>
</div>
          </div>
          
          <div class="form-group" :class="{ 'incomplete': !responses.ageGroup }" ref="question-2">
            <label class="form-label" for="age">2. Age Group <span v-if="responses.ageGroup" class="completed-indicator">✓</span></label>
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
          
          <div class="form-group" :class="{ 'incomplete': responses.favoriteMovieTypes.length < 4 }" ref="question-3">
            <label class="form-label" for="favorite-movie-types">3. What types of movies do you prefer? (Select 4-8 options) 
              <span v-if="responses.favoriteMovieTypes.length >= 4" class="completed-indicator">✓</span>
              <span v-if="responses.favoriteMovieTypes.length > 0 && responses.favoriteMovieTypes.length < 4" class="progress-indicator">({{ responses.favoriteMovieTypes.length }}/4)</span>
            </label>
            <div v-if="movieTypeError" class="movie-type-error">
              {{ movieTypeError }}
            </div>
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
          
          <div class="form-group" :class="{ 'incomplete': !responses.movieWatchingFrequency }" ref="question-4">
            <label class="form-label" for="movie-watching-frequency">4. How often do you watch movies? <span v-if="responses.movieWatchingFrequency" class="completed-indicator">✓</span></label>
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
          
          <div class="form-group" :class="{ 'incomplete': !responses.recSystemUsage }" ref="question-5">
            <label class="form-label" for="rec-system-usage">5. How much do you rely on recommendation systems (e.g., product recommendations, music recommendations, movie recommendations)? <span v-if="responses.recSystemUsage" class="completed-indicator">✓</span></label>
            <div class="radio-group">
  <label><input type="radio" value="barely-rely" v-model="responses.recSystemUsage" required> Barely rely (mainly active searching)</label>
  <label><input type="radio" value="occasionally-rely" v-model="responses.recSystemUsage" required> Occasionally rely</label>
  <label><input type="radio" value="moderately-rely" v-model="responses.recSystemUsage" required> Moderately rely (frequently use recommended content)</label>
  <label><input type="radio" value="heavily-rely" v-model="responses.recSystemUsage" required> Heavily rely (mainly depend on recommended content)</label>
</div>
          </div>
          
          <div class="form-group" :class="{ 'incomplete': !responses.chatgptUsage }" ref="question-6">
            <label class="form-label" for="chatgpt-usage">6. Have you used tools like ChatGPT to get content recommendations? <span v-if="responses.chatgptUsage" class="completed-indicator">✓</span></label>
            <div class="radio-group">
  <label><input type="radio" value="barely-rely" v-model="responses.chatgptUsage" required> Barely rely (mainly active searching)</label>
  <label><input type="radio" value="occasionally-rely" v-model="responses.chatgptUsage" required> Occasionally rely</label>
  <label><input type="radio" value="moderately-rely" v-model="responses.chatgptUsage" required> Moderately rely (frequently use recommended content)</label>
  <label><input type="radio" value="heavily-rely" v-model="responses.chatgptUsage" required> Heavily rely (mainly depend on recommended content)</label>
</div>
          </div>
          
          <div class="form-group" :class="{ 'incomplete': !responses.filterBubblePerception }" ref="question-7">
            <label class="form-label" for="filter-bubble-perception">7. When using tools like ChatGPT for recommendations, I feel "trapped" in repetitive content (similar topics/styles), with few new topics or perspectives. <span v-if="responses.filterBubblePerception" class="completed-indicator">✓</span></label>
            <div class="radio-group">
  <label><input type="radio" value="strongly-disagree" v-model="responses.filterBubblePerception" required> Strongly disagree</label>
  <label><input type="radio" value="disagree" v-model="responses.filterBubblePerception" required> Disagree</label>
  <label><input type="radio" value="neutral" v-model="responses.filterBubblePerception" required> Neutral</label>
  <label><input type="radio" value="agree" v-model="responses.filterBubblePerception" required> Agree</label>
  <label><input type="radio" value="strongly-agree" v-model="responses.filterBubblePerception" required> Strongly agree</label>
</div>
          </div>
          
          <div class="form-group" :class="{ 'incomplete': !responses.missedInterests }" ref="question-8">
            <label class="form-label" for="missed-interests">8. When using tools like ChatGPT for recommendations, the recommendation system misses content I might be interested in (e.g., information I've explicitly expressed interest in but wasn't recommended). <span v-if="responses.missedInterests" class="completed-indicator">✓</span></label>
            <div class="radio-group">
  <label><input type="radio" value="strongly-disagree" v-model="responses.missedInterests" required> Strongly disagree</label>
  <label><input type="radio" value="disagree" v-model="responses.missedInterests" required> Disagree</label>
  <label><input type="radio" value="neutral" v-model="responses.missedInterests" required> Neutral</label>
  <label><input type="radio" value="agree" v-model="responses.missedInterests" required> Agree</label>
  <label><input type="radio" value="strongly-agree" v-model="responses.missedInterests" required> Strongly agree</label>
</div>
          </div>
          
          <div class="form-group" :class="{ 'incomplete': !responses.limitedInfo }" ref="question-9">
            <label class="form-label" for="limited-info">9. When using tools like ChatGPT for recommendations, the recommendation system makes me feel that my access to information is limited. <span v-if="responses.limitedInfo" class="completed-indicator">✓</span></label>
            <div class="radio-group">
  <label><input type="radio" value="strongly-disagree" v-model="responses.limitedInfo" required> Strongly disagree</label>
  <label><input type="radio" value="disagree" v-model="responses.limitedInfo" required> Disagree</label>
  <label><input type="radio" value="neutral" v-model="responses.limitedInfo" required> Neutral</label>
  <label><input type="radio" value="agree" v-model="responses.limitedInfo" required> Agree</label>
  <label><input type="radio" value="strongly-agree" v-model="responses.limitedInfo" required> Strongly agree</label>
</div>
          </div>
          
          <div class="form-group" :class="{ 'incomplete': !responses.unexpectedContent }" ref="question-10">
            <label class="form-label" for="unexpected-content">10. When using tools like ChatGPT for recommendations, I rarely find unexpected content that goes beyond my interests in the recommendations. <span v-if="responses.unexpectedContent" class="completed-indicator">✓</span></label>
            <div class="radio-group">
  <label><input type="radio" value="strongly-disagree" v-model="responses.unexpectedContent" required> Strongly disagree</label>
  <label><input type="radio" value="disagree" v-model="responses.unexpectedContent" required> Disagree</label>
  <label><input type="radio" value="neutral" v-model="responses.unexpectedContent" required> Neutral</label>
  <label><input type="radio" value="agree" v-model="responses.unexpectedContent" required> Agree</label>
  <label><input type="radio" value="strongly-agree" v-model="responses.unexpectedContent" required> Strongly agree</label>
</div>
          </div>
          
          <div class="form-group" :class="{ 'incomplete': !responses.diversePerspectives }" ref="question-11">
            <label class="form-label" for="diverse-perspectives">11. I would like to see more diverse perspectives and viewpoints in recommended content. <span v-if="responses.diversePerspectives" class="completed-indicator">✓</span></label>
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
  <p class="section-description">For the following statements, please indicate how well they describe your personality.</p>
  
  <div class="form-group" :class="{ 'incomplete': !responses.extraversion1 }" ref="question-12">
    <label class="form-label" for="bfi-1">12. I see myself as someone who is reserved. <span v-if="responses.extraversion1" class="completed-indicator">✓</span></label>
    <div class="radio-group">
      <label><input type="radio" value="strongly-disagree" v-model="responses.extraversion1" required> Strongly disagree</label>
      <label><input type="radio" value="disagree" v-model="responses.extraversion1" required> Disagree</label>
      <label><input type="radio" value="neutral" v-model="responses.extraversion1" required> Neutral</label>
      <label><input type="radio" value="agree" v-model="responses.extraversion1" required> Agree</label>
      <label><input type="radio" value="strongly-agree" v-model="responses.extraversion1" required> Strongly agree</label>
    </div>
  </div>
  
  <div class="form-group" :class="{ 'incomplete': !responses.agreeableness1 }" ref="question-13">
    <label class="form-label" for="bfi-2">13. I see myself as someone who is generally trusting. <span v-if="responses.agreeableness1" class="completed-indicator">✓</span></label>
    <div class="radio-group">
      <label><input type="radio" value="strongly-disagree" v-model="responses.agreeableness1" required> Strongly disagree</label>
      <label><input type="radio" value="disagree" v-model="responses.agreeableness1" required> Disagree</label>
      <label><input type="radio" value="neutral" v-model="responses.agreeableness1" required> Neutral</label>
      <label><input type="radio" value="agree" v-model="responses.agreeableness1" required> Agree</label>
      <label><input type="radio" value="strongly-agree" v-model="responses.agreeableness1" required> Strongly agree</label>
    </div>
  </div>

  <div class="form-group" :class="{ 'incomplete': !responses.conscientiousness2 }" ref="question-14">
    <label class="form-label" for="bfi-3">14. I see myself as someone who tends to be lazy. <span v-if="responses.conscientiousness2" class="completed-indicator">✓</span></label>
    <div class="radio-group">
      <label><input type="radio" value="strongly-disagree" v-model="responses.conscientiousness2" required> Strongly disagree</label>
      <label><input type="radio" value="disagree" v-model="responses.conscientiousness2" required> Disagree</label>
      <label><input type="radio" value="neutral" v-model="responses.conscientiousness2" required> Neutral</label>
      <label><input type="radio" value="agree" v-model="responses.conscientiousness2" required> Agree</label>
      <label><input type="radio" value="strongly-agree" v-model="responses.conscientiousness2" required> Strongly agree</label>
    </div>
  </div>

  <div class="form-group" :class="{ 'incomplete': !responses.neuroticism2 }" ref="question-15">
    <label class="form-label" for="bfi-4">15. I see myself as someone who is relaxed, handles stress well. <span v-if="responses.neuroticism2" class="completed-indicator">✓</span></label>
    <div class="radio-group">
      <label><input type="radio" value="strongly-disagree" v-model="responses.neuroticism2" required> Strongly disagree</label>
      <label><input type="radio" value="disagree" v-model="responses.neuroticism2" required> Disagree</label>
      <label><input type="radio" value="neutral" v-model="responses.neuroticism2" required> Neutral</label>
      <label><input type="radio" value="agree" v-model="responses.neuroticism2" required> Agree</label>
      <label><input type="radio" value="strongly-agree" v-model="responses.neuroticism2" required> Strongly agree</label>
    </div>
  </div>

  <div class="form-group" :class="{ 'incomplete': !responses.openness2 }" ref="question-16">
    <label class="form-label" for="bfi-5">16. I see myself as someone who has few artistic interests. <span v-if="responses.openness2" class="completed-indicator">✓</span></label>
    <div class="radio-group">
      <label><input type="radio" value="strongly-disagree" v-model="responses.openness2" required> Strongly disagree</label>
      <label><input type="radio" value="disagree" v-model="responses.openness2" required> Disagree</label>
      <label><input type="radio" value="neutral" v-model="responses.openness2" required> Neutral</label>
      <label><input type="radio" value="agree" v-model="responses.openness2" required> Agree</label>
      <label><input type="radio" value="strongly-agree" v-model="responses.openness2" required> Strongly agree</label>
    </div>
  </div>

  <div class="form-group" :class="{ 'incomplete': !responses.extraversion2 }" ref="question-17">
    <label class="form-label" for="bfi-6">17. I see myself as someone who is outgoing, sociable. <span v-if="responses.extraversion2" class="completed-indicator">✓</span></label>
    <div class="radio-group">
      <label><input type="radio" value="strongly-disagree" v-model="responses.extraversion2" required> Strongly disagree</label>
      <label><input type="radio" value="disagree" v-model="responses.extraversion2" required> Disagree</label>
      <label><input type="radio" value="neutral" v-model="responses.extraversion2" required> Neutral</label>
      <label><input type="radio" value="agree" v-model="responses.extraversion2" required> Agree</label>
      <label><input type="radio" value="strongly-agree" v-model="responses.extraversion2" required> Strongly agree</label>
    </div>
  </div>

  <div class="form-group" :class="{ 'incomplete': !responses.agreeableness2 }" ref="question-18">
    <label class="form-label" for="bfi-7">18. I see myself as someone who tends to find fault with others. <span v-if="responses.agreeableness2" class="completed-indicator">✓</span></label>
    <div class="radio-group">
      <label><input type="radio" value="strongly-disagree" v-model="responses.agreeableness2" required> Strongly disagree</label>
      <label><input type="radio" value="disagree" v-model="responses.agreeableness2" required> Disagree</label>
      <label><input type="radio" value="neutral" v-model="responses.agreeableness2" required> Neutral</label>
      <label><input type="radio" value="agree" v-model="responses.agreeableness2" required> Agree</label>
      <label><input type="radio" value="strongly-agree" v-model="responses.agreeableness2" required> Strongly agree</label>
    </div>
  </div>

  <div class="form-group" :class="{ 'incomplete': !responses.conscientiousness1 }" ref="question-19">
    <label class="form-label" for="bfi-8">19. I see myself as someone who does a thorough job. <span v-if="responses.conscientiousness1" class="completed-indicator">✓</span></label>
    <div class="radio-group">
      <label><input type="radio" value="strongly-disagree" v-model="responses.conscientiousness1" required> Strongly disagree</label>
      <label><input type="radio" value="disagree" v-model="responses.conscientiousness1" required> Disagree</label>
      <label><input type="radio" value="neutral" v-model="responses.conscientiousness1" required> Neutral</label>
      <label><input type="radio" value="agree" v-model="responses.conscientiousness1" required> Agree</label>
      <label><input type="radio" value="strongly-agree" v-model="responses.conscientiousness1" required> Strongly agree</label>
    </div>
  </div>

  <div class="form-group" :class="{ 'incomplete': !responses.neuroticism1 }" ref="question-20">
    <label class="form-label" for="bfi-9">20. I see myself as someone who gets nervous easily. <span v-if="responses.neuroticism1" class="completed-indicator">✓</span></label>
    <div class="radio-group">
      <label><input type="radio" value="strongly-disagree" v-model="responses.neuroticism1" required> Strongly disagree</label>
      <label><input type="radio" value="disagree" v-model="responses.neuroticism1" required> Disagree</label>
      <label><input type="radio" value="neutral" v-model="responses.neuroticism1" required> Neutral</label>
      <label><input type="radio" value="agree" v-model="responses.neuroticism1" required> Agree</label>
      <label><input type="radio" value="strongly-agree" v-model="responses.neuroticism1" required> Strongly agree</label>
    </div>
  </div>

  <div class="form-group" :class="{ 'incomplete': !responses.openness1 }" ref="question-21">
    <label class="form-label" for="bfi-10">21. I see myself as someone who has an active imagination. <span v-if="responses.openness1" class="completed-indicator">✓</span></label>
    <div class="radio-group">
      <label><input type="radio" value="strongly-disagree" v-model="responses.openness1" required> Strongly disagree</label>
      <label><input type="radio" value="disagree" v-model="responses.openness1" required> Disagree</label>
      <label><input type="radio" value="neutral" v-model="responses.openness1" required> Neutral</label>
      <label><input type="radio" value="agree" v-model="responses.openness1" required> Agree</label>
      <label><input type="radio" value="strongly-agree" v-model="responses.openness1" required> Strongly agree</label>
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
      movieTypeError: '',
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
      firstIncompleteQuestion: null,
    };
  },
  computed: {
    completedQuestions() {
      const completed = [];
      if (this.responses.gender) completed.push(1);
      if (this.responses.ageGroup) completed.push(2);
      if (this.responses.favoriteMovieTypes.length >= 4) completed.push(3);
      if (this.responses.movieWatchingFrequency) completed.push(4);
      if (this.responses.recSystemUsage) completed.push(5);
      if (this.responses.chatgptUsage) completed.push(6);
      if (this.responses.filterBubblePerception) completed.push(7);
      if (this.responses.missedInterests) completed.push(8);
      if (this.responses.limitedInfo) completed.push(9);
      if (this.responses.unexpectedContent) completed.push(10);
      if (this.responses.diversePerspectives) completed.push(11);
      if (this.responses.openness1) completed.push(12);
      if (this.responses.openness2) completed.push(13);
      if (this.responses.conscientiousness1) completed.push(14);
      if (this.responses.conscientiousness2) completed.push(15);
      if (this.responses.extraversion1) completed.push(16);
      if (this.responses.extraversion2) completed.push(17);
      if (this.responses.agreeableness1) completed.push(18);
      if (this.responses.agreeableness2) completed.push(19);
      if (this.responses.neuroticism1) completed.push(20);
      if (this.responses.neuroticism2) completed.push(21);
      return completed;
    }
  },
  watch: {
    'responses.favoriteMovieTypes': {
      handler(newTypes) {
        if (newTypes.length > 8) {
          this.movieTypeError = 'Please select no more than 8 movie types.';
        } else {
          this.movieTypeError = '';
        }
      },
      immediate: true
    }
  },
  methods: {
    findFirstIncompleteQuestion() {
      // Check each question in order
      if (!this.responses.gender) return 1;
      if (!this.responses.ageGroup) return 2;
      if (this.responses.favoriteMovieTypes.length < 4) return 3;
      if (!this.responses.movieWatchingFrequency) return 4;
      if (!this.responses.recSystemUsage) return 5;
      if (!this.responses.chatgptUsage) return 6;
      if (!this.responses.filterBubblePerception) return 7;
      if (!this.responses.missedInterests) return 8;
      if (!this.responses.limitedInfo) return 9;
      if (!this.responses.unexpectedContent) return 10;
      if (!this.responses.diversePerspectives) return 11;
      if (!this.responses.openness1) return 12;
      if (!this.responses.openness2) return 13;
      if (!this.responses.conscientiousness1) return 14;
      if (!this.responses.conscientiousness2) return 15;
      if (!this.responses.extraversion1) return 16;
      if (!this.responses.extraversion2) return 17;
      if (!this.responses.agreeableness1) return 18;
      if (!this.responses.agreeableness2) return 19;
      if (!this.responses.neuroticism1) return 20;
      if (!this.responses.neuroticism2) return 21;
      return null; // All questions completed
    },
    
    scrollToQuestion(questionNumber) {
      const element = this.$refs[`question-${questionNumber}`];
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        // Add a highlight effect
        element.classList.add('highlight-question');
        setTimeout(() => {
          element.classList.remove('highlight-question');
        }, 3000);
      }
    },
    
    validateForm() {
      console.log('开始表单验证...');
      console.log('当前responses:', this.responses);
      
      this.validationError = '';
      this.firstIncompleteQuestion = this.findFirstIncompleteQuestion();

      if (this.firstIncompleteQuestion) {
        if (this.firstIncompleteQuestion === 3) {
          this.validationError = `Please select at least 4 movie types in Question ${this.firstIncompleteQuestion}.`;
        } else {
          this.validationError = `Please complete Question ${this.firstIncompleteQuestion} before submitting.`;
        }
        console.log('表单验证失败，第一个未完成的问题:', this.firstIncompleteQuestion);
        return false;
      }

      // Additional validation for movie types upper limit
      if (this.responses.favoriteMovieTypes.length > 8) {
        this.validationError = 'Please select no more than 8 movie types in Question 3.';
        this.firstIncompleteQuestion = 3;
        console.log('电影类型选择超过8种');
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

      // Build TIPI items from BFI-10 responses
      const tipi = {
        // Extraversion: E+ (outgoing) and E- (reserved)
        tipi_item_1: likertToTipi(resp.extraversion2), // Q17: I see myself as someone who is outgoing, sociable.
        tipi_item_6: likertToTipi(resp.extraversion1), // Q12: I see myself as someone who is reserved. (R)
        
        // Agreeableness: A+ (trusting) and A- (finds fault)
        tipi_item_2: likertToTipi(resp.agreeableness2), // Q18: I see myself as someone who tends to find fault with others. (R)
        tipi_item_7: likertToTipi(resp.agreeableness1), // Q13: I see myself as someone who is generally trusting.

        // Conscientiousness: C+ (thorough) and C- (lazy)
        tipi_item_3: likertToTipi(resp.conscientiousness1), // Q19: I see myself as someone who does a thorough job.
        tipi_item_8: likertToTipi(resp.conscientiousness2), // Q14: I see myself as someone who tends to be lazy. (R)

        // Neuroticism (Emotional Stability): N+ (nervous) and N- (relaxed)
        tipi_item_4: likertToTipi(resp.neuroticism1), // Q20: I see myself as someone who gets nervous easily.
        tipi_item_9: likertToTipi(resp.neuroticism2), // Q15: I see myself as someone who is relaxed, handles stress well. (R)

        // Openness: O+ (active imagination) and O- (few artistic interests)
        tipi_item_5: likertToTipi(resp.openness1), // Q21: I see myself as someone who has an active imagination.
        tipi_item_10: likertToTipi(resp.openness2), // Q16: I see myself as someone who has few artistic interests. (R)
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

.movie-type-error {
  background-color: #ffebee;
  color: #d32f2f;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border-radius: 6px;
  font-weight: 500;
  border-left: 4px solid #d32f2f;
  font-size: 0.9rem;
  animation: shake 0.5s;
}

/* Progressive validation styles */
.form-group.incomplete {
  border-left: 4px solid #ff9800;
  background-color: #fff3e0;
  border-radius: 8px;
  padding-left: 1rem;
  transition: all 0.3s ease;
}

.form-group.incomplete .form-label {
  color: #f57c00;
  font-weight: 600;
}

.completed-indicator {
  color: #4caf50;
  font-weight: bold;
  font-size: 1.2em;
  margin-left: 0.5rem;
}

.progress-indicator {
  color: #ff9800;
  font-weight: 600;
  font-size: 0.9em;
  margin-left: 0.5rem;
}

.scroll-to-question-btn {
  background: #ff9800;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  margin-left: 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.scroll-to-question-btn:hover {
  background: #f57c00;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.highlight-question {
  animation: highlight-pulse 3s ease-in-out;
  border-left: 4px solid #2196f3 !important;
  background-color: #e3f2fd !important;
}

@keyframes highlight-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.4);
  }
  50% {
    box-shadow: 0 0 0 20px rgba(33, 150, 243, 0);
  }
}
</style>
