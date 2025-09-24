<template>
  <div class="questionnaire-container">
    <div class="card questionnaire-card">
      <h2 class="card-title">Final Questionnaire</h2>
      <p class="questionnaire-description">
        <strong>Part 1: System Experience Evaluation</strong><br>
        Instructions: For each statement, please check the box that best represents your level of agreement, using the scale below.<br>
        <strong>Reminder: 1 = Strongly Disagree | 2 = Disagree | 3 = Neutral | 4 = Agree | 5 = Strongly Agree</strong>
      </p>
      
      <form @submit.prevent="submitQuestionnaire">
        <!-- Part A: Perceived Qualities -->
        <section class="form-section">
          <h3>A. Perceived Qualities</h3>
          <h4>Perceived Accuracy</h4>
          
          <div class="form-group">
            <label class="form-label"><strong>1.</strong> The recommended movies were well-chosen.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="q1" 
                    :value="n" 
                    v-model="responses.q1" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label"><strong>2.</strong> The recommended movies seemed relevant to my situation.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="q2" 
                    :value="n" 
                    v-model="responses.q2" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label"><strong>3.</strong> The recommended movies were interesting.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="q3" 
                    :value="n" 
                    v-model="responses.q3" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>

          <h4>Novelty & Exploration</h4>

          <div class="form-group">
            <label class="form-label"><strong>4.</strong> The chatbot helped me discover new movies.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="q4" 
                    :value="n" 
                    v-model="responses.q4" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label"><strong>5.</strong> The chatbot provided me with surprising recommendations that helped me discover new movies that I wouldn't have found elsewhere.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="q5" 
                    :value="n" 
                    v-model="responses.q5" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label"><strong>6.</strong> The chatbot provided recommendations I had not considered before, which turned out to be positive discoveries.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="q6" 
                    :value="n" 
                    v-model="responses.q6" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label"><strong>7.</strong> The chatbot provided me with recommendations that were a pleasant surprise to me because I would not have discovered them somewhere else.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="q7" 
                    :value="n" 
                    v-model="responses.q7" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>

          <h4>Perceived Diversity</h4>

          <div class="form-group">
            <label class="form-label"><strong>8.</strong> The chatbot recommends movies that are very similar to each other.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="q8" 
                    :value="n" 
                    v-model="responses.q8" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label"><strong>9.</strong> The chatbot has a more varied selection of movies.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="q9" 
                    :value="n" 
                    v-model="responses.q9" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label"><strong>10.</strong> The recommended movies match a wide variety of moods.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="q10" 
                    :value="n" 
                    v-model="responses.q10" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label"><strong>11.</strong> The recommendations would suit a broad set of tastes.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="q11" 
                    :value="n" 
                    v-model="responses.q11" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>
        </section>

        <!-- Part B: User Beliefs -->
        <section class="form-section">
          <h3>B. User Beliefs</h3>
          <h4>Rapport with Agents</h4>

          <div class="form-group">
            <label class="form-label"><strong>12.</strong> The chatbot seemed to care about me.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="q12" 
                    :value="n" 
                    v-model="responses.q12" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label"><strong>13.</strong> I liked and felt a sense of warmth toward the chatbot.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="q13" 
                    :value="n" 
                    v-model="responses.q13" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label"><strong>14.</strong> I felt I had a connection with the chatbot.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="q14" 
                    :value="n" 
                    v-model="responses.q14" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label"><strong>15.</strong> The chatbot and I established a good rapport.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="q15" 
                    :value="n" 
                    v-model="responses.q15" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>

          <h4>Transparency</h4>

          <div class="form-group">
            <label class="form-label"><strong>16.</strong> I understood why these movies were recommended to me.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="q16" 
                    :value="n" 
                    v-model="responses.q16" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label"><strong>17.</strong> I understood how the chatbot determined the quality of the movies.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="q17" 
                    :value="n" 
                    v-model="responses.q17" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label"><strong>18.</strong> I understood how well the recommendations matched my preferences.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="q18" 
                    :value="n" 
                    v-model="responses.q18" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>

          <h4>Perceived Usefulness</h4>

          <div class="form-group">
            <label class="form-label"><strong>19.</strong> The chatbot helped me explore diverse movies.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="q19" 
                    :value="n" 
                    v-model="responses.q19" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label"><strong>20.</strong> Using the chatbot to discover different movies is useful.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="q20" 
                    :value="n" 
                    v-model="responses.q20" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label"><strong>21.</strong> The chatbot gave me good suggestions.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="q21" 
                    :value="n" 
                    v-model="responses.q21" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label"><strong>22.</strong> For this question, please choose the last option.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="q22" 
                    :value="n" 
                    v-model="responses.q22" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>

          <h4>Perceived Ease of Use</h4>

          <div class="form-group">
            <label class="form-label"><strong>23.</strong> I could easily use the chatbot to explore different movie recommendations.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="q23" 
                    :value="n" 
                    v-model="responses.q23" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label"><strong>24.</strong> Using the chatbot to explore diverse movie recommendations was easy.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="q24" 
                    :value="n" 
                    v-model="responses.q24" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label"><strong>25.</strong> Finding different movies to watch with the help of the chatbot was easy.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="q25" 
                    :value="n" 
                    v-model="responses.q25" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label"><strong>26.</strong> It was easy to find different movies I may like by using the chatbot.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="q26" 
                    :value="n" 
                    v-model="responses.q26" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>
        </section>

        <!-- Part C: User Attitudes & Cognitive Experience -->
        <section class="form-section">
          <h3>C. User Attitudes & Cognitive Experience</h3>
          <h4>Trust</h4>

          <div class="form-group">
            <label class="form-label"><strong>27.</strong> The movie recommendations provided by the chatbot can be trusted.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="q27" 
                    :value="n" 
                    v-model="responses.q27" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label"><strong>28.</strong> I was convinced by the movies recommended to me.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="q28" 
                    :value="n" 
                    v-model="responses.q28" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label"><strong>29.</strong> I was confident I would like the movies recommended to me.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="q29" 
                    :value="n" 
                    v-model="responses.q29" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label"><strong>30.</strong> I had confidence in accepting the movies recommended to me.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="q30" 
                    :value="n" 
                    v-model="responses.q30" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>

          <h4>Satisfaction</h4>

          <div class="form-group">
            <label class="form-label"><strong>31.</strong> I was satisfied with the movie recommendations made by the chatbot.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="q31" 
                    :value="n" 
                    v-model="responses.q31" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label"><strong>32.</strong> The movie recommendations made by the chatbot were satisfying.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="q32" 
                    :value="n" 
                    v-model="responses.q32" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label"><strong>33.</strong> These movie recommendations made by the chatbot made me feel satisfied.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="q33" 
                    :value="n" 
                    v-model="responses.q33" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>

          <h4>Intention to Watch</h4>

          <div class="form-group">
            <label class="form-label"><strong>34.</strong> Given a chance, I predict that I would consider watching the movies recommended by the chatbot in the near future.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="q34" 
                    :value="n" 
                    v-model="responses.q34" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label"><strong>35.</strong> It is likely that I will watch one or more of the recommended movies.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="q35" 
                    :value="n" 
                    v-model="responses.q35" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label"><strong>36.</strong> Given the opportunity, I intend to add some of the movies recommended by the chatbot to my watchlist.</label>
            <div class="rating-scale">
              <div class="rating-label">Strongly Disagree</div>
              <div class="rating-options">
                <label v-for="n in 5" :key="n" class="rating-option">
                  <input 
                    type="radio" 
                    name="q36" 
                    :value="n" 
                    v-model="responses.q36" 
                    required
                  >
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="rating-label">Strongly Agree</div>
            </div>
          </div>
        </section> 
        
        <div class="form-actions">
          <button type="submit" class="btn" :disabled="isSubmitting" @click="handleSubmitClick">
            {{ isSubmitting ? 'Submitting...' : 'Submit' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { logUserEvent, logQuestionnaireResponses } from '../services/loggingService';
import { getSystemOrder, getNextRouteAfterQuestionnaire, completeCurrentSystem } from '../services/systemOrderService';

export default {
  name: 'MiddleQuestionnaire',
  data() {
    return {
      isSubmitting: false,
      responses: {
        // Part A: Perceived Qualities
        // Perceived Accuracy
        q1: null,  // The recommended movies were well-chosen
        q2: null,  // The recommended movies seemed relevant to my situation
        q3: null,  // The recommended movies were interesting
        
        // Novelty & Exploration
        q4: null,  // The chatbot helped me discover new movies
        q5: null,  // The chatbot provided me with surprising recommendations that helped me discover new movies that I wouldn't have found elsewhere
        q6: null,  // The chatbot provided recommendations I had not considered before, which turned out to be positive discoveries
        q7: null,  // The chatbot provided me with recommendations that were a pleasant surprise to me because I would not have discovered them somewhere else
        
        // Perceived Diversity
        q8: null,  // The chatbot recommends movies that are very similar to each other
        q9: null,  // The chatbot has a more varied selection of movies
        q10: null, // The recommended movies match a wide variety of moods
        q11: null, // The recommendations would suit a broad set of tastes
        
        // Part B: User Beliefs
        // Rapport with Agents
        q12: null, // The chatbot seemed to care about me
        q13: null, // I liked and felt a sense of warmth toward the chatbot
        q14: null, // I felt I had a connection with the chatbot
        q15: null, // The chatbot and I established a good rapport
        
        // Transparency
        q16: null, // I understood why these movies were recommended to me
        q17: null, // I understood how the chatbot determined the quality of the movies
        q18: null, // I understood how well the recommendations matched my preferences
        
        // Perceived Usefulness
        q19: null, // The chatbot helped me explore diverse movies
        q20: null, // Using the chatbot to discover different movies is useful
        q21: null, // The chatbot gave me good suggestions
        q22: null, // For this question, please choose the last option (attention check)
        
        // Perceived Ease of Use
        q23: null, // I could easily use the chatbot to explore different movie recommendations
        q24: null, // Using the chatbot to explore diverse movie recommendations was easy
        q25: null, // Finding different movies to watch with the help of the chatbot was easy
        q26: null, // It was easy to find different movies I may like by using the chatbot
        
        // Part C: User Attitudes & Cognitive Experience
        // Trust
        q27: null, // The movie recommendations provided by the chatbot can be trusted
        q28: null, // I was convinced by the movies recommended to me
        q29: null, // I was confident I would like the movies recommended to me
        q30: null, // I had confidence in accepting the movies recommended to me
        
        // Satisfaction
        q31: null, // I was satisfied with the movie recommendations made by the chatbot
        q32: null, // The movie recommendations made by the chatbot were satisfying
        q33: null, // These movie recommendations made by the chatbot made me feel satisfied
        
        // Intention to Watch
        q34: null, // Given a chance, I predict that I would consider watching the movies recommended by the chatbot in the near future
        q35: null, // It is likely that I will watch one or more of the recommended movies
        q36: null  // Given the opportunity, I intend to add some of the movies recommended by the chatbot to my watchlist
      }
    };
  },
  created() {
    // Log page view
    console.log('MiddleQuestionnaire created, testing Firebase connection...');
    this.testFirebaseConnection();
  },
  mounted() {
    // 防止用户通过浏览器后退按钮返回到之前的页面
    this.preventBackNavigation();
  },
  beforeUnmount() {
    // 清理事件监听器
    this.cleanupBackNavigation();
  },
  methods: {
    async testFirebaseConnection() {
      try {
        console.log('Testing Firebase connection...');
        const result = await logUserEvent('view_middle_questionnaire');
        console.log('Firebase test result:', result);
      } catch (error) {
        console.error('Firebase test failed:', error);
      }
    },
    handleSubmitClick(event) {
      console.log('=== Submit button clicked ===');
      event.preventDefault();
      this.submitQuestionnaire();
    },
    async submitQuestionnaire() {
      console.log('=== Submit questionnaire method called ===');
      console.log('Current responses:', this.responses);
      
      // Check if all required fields are filled
      const requiredFields = Object.keys(this.responses);
      const emptyFields = requiredFields.filter(field => this.responses[field] === null || this.responses[field] === undefined);
      
      if (emptyFields.length > 0) {
        console.log('Empty fields found:', emptyFields);
        alert(`Please answer all questions before submitting. Missing: ${emptyFields.join(', ')}`);
        return;
      }
      
      this.isSubmitting = true;
      console.log('Starting submission process...');
      
      try {
        // Log form submission start
        console.log('Logging submission attempt...');
        const logResult = await logUserEvent('middle_questionnaire_submit_attempt');
        console.log('Log result:', logResult);
        
        // Submit questionnaire responses to Firebase
        console.log('Submitting questionnaire responses...');
        const success = await logQuestionnaireResponses('middle', this.responses);
        console.log('Questionnaire submission result:', success);
        
        if (success && success.success !== false) {
          // Log successful submission
          console.log('Logging successful submission...');
          await logUserEvent('middle_questionnaire_submitted', {
            timestamp: new Date().toISOString()
          });
          
          // 直接跳转到最终问卷页面
          console.log('MiddleQuestionnaire 直接跳转到 FinalQuestionnaire');
          try {
            console.log('Attempting router.push to /final-questionnaire');
            const result = await this.$router.push('/final-questionnaire');
            console.log('Navigation successful, result:', result);
          } catch (navError) {
            console.error('Navigation failed:', navError);
            console.log('Trying router.replace instead...');
            try {
              await this.$router.replace('/final-questionnaire');
              console.log('Router.replace successful');
            } catch (replaceError) {
              console.error('Router.replace also failed:', replaceError);
              console.log('Using window.location as fallback');
              window.location.href = '/final-questionnaire';
            }
          }
        } else {
          console.error('Submission failed:', success);
          alert('There was an error submitting your responses. Please try again.');
          this.isSubmitting = false;
        }
      } catch (error) {
        console.error('Error submitting questionnaire:', error);
        alert('There was an error submitting your responses. Please try again.');
        this.isSubmitting = false;
      }
    },
    preventBackNavigation() {
      // 添加一个新的历史记录条目
      history.pushState(null, null, location.href);
      
      // 监听popstate事件（当用户点击后退按钮时触发）
      this.handlePopState = (event) => {
        // 阻止后退，重新推送当前页面到历史记录
        history.pushState(null, null, location.href);
        
        // 可选：显示提示信息
        alert('Please complete the questionnaire before proceeding. You cannot go back to the previous page.');
      };
      
      window.addEventListener('popstate', this.handlePopState);
      
      // 防止页面刷新时的提示（可选）
      this.handleBeforeUnload = (event) => {
        const message = 'Are you sure you want to leave? Your progress may be lost.';
        event.returnValue = message;
        return message;
      };
      
      window.addEventListener('beforeunload', this.handleBeforeUnload);
    },
    
    cleanupBackNavigation() {
      // 移除事件监听器
      if (this.handlePopState) {
        window.removeEventListener('popstate', this.handlePopState);
      }
      if (this.handleBeforeUnload) {
        window.removeEventListener('beforeunload', this.handleBeforeUnload);
      }
    },
  }
};
</script>

<style scoped>
.questionnaire-container {
  max-width: 100%;
  margin: 0;
  padding: 0;
  min-height: 100vh;
  width: 100%;
}

.questionnaire-card {
  padding: 2rem;
  width: 100%;
  margin: 0 auto;
}

.questionnaire-description {
  margin-bottom: 2rem;
}

.form-section {
  margin-bottom: 2.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--light-gray);
}

.form-section h3 {
  margin-bottom: 1.5rem;
  color: var(--primary-color);
  font-size: 1.3rem;
  font-weight: bold;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 0.5rem;
}

.form-section h4 {
  margin: 1.5rem 0 1rem 0;
  color: #555;
  font-size: 1.1rem;
  font-weight: 600;
  font-style: italic;
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
  white-space: nowrap;
  text-align: center;
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

.form-actions {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
}

.form-actions .btn {
  min-width: 200px;
  background-color: #4a90e2;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
}

.form-actions .btn:hover {
  background-color: #357abd;
}

.form-actions .btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  margin-bottom: 10px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .questionnaire-card {
    padding: 1.5rem;
  }
  
  .rating-scale {
    flex-direction: row; /* 保持横向排列 */
    align-items: center;
    flex-wrap: wrap; /* 允许在小屏幕上换行 */
  }
  
  .rating-label {
    margin: 0.5rem;
    flex: 0 0 auto; /* 允许标签自适应宽度 */
  }
  
  .rating-options {
    margin: 0.5rem;
    flex: 1 1 100%; /* 在小屏幕上占满宽度 */
    order: 3; /* 确保选项在两个标签之后显示 */
  }
}
</style>
