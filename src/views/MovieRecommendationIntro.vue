<template>
  <div class="intro-container">
    <div class="intro-content">
      <!-- Header Section -->
      <div class="header-section">
        <h1 class="main-title">Coming Soon: Movie Recommendation Process Introduction</h1>
        <p class="subtitle">
          Before you begin, please take a minute to read the following simple instructions. 
          This will help you understand how to interact with our intelligent recommendation system 
          to find the movies that are perfect for you.
        </p>
      </div>

      <!-- Process Overview -->
      <div class="overview-card">
        <h2 class="section-title">Process Overview</h2>
        <p class="overview-description">
          We will complete this movie recommendation through three simple steps:
        </p>
        <div class="steps-overview">
          <div class="step-item">
            <div class="step-number">1</div>
            <div class="step-content">
              <h3>Describe Your Scenario</h3>
              <p>Tell us about your movie-watching needs.</p>
            </div>
          </div>
          <div class="step-item">
            <div class="step-number">2</div>
            <div class="step-content">
              <h3>Interactive Understanding</h3>
              <p>The system provides recommendations and engages in dialogue to answer your questions.</p>
            </div>
          </div>
          <div class="step-item">
            <div class="step-number">3</div>
            <div class="step-content">
              <h3>Choose and Rate</h3>
              <p>You make your final choice and rate this recommendation experience.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Detailed Instructions -->
      <div class="instructions-section">
        <h2 class="section-title">Detailed Step Instructions</h2>

        <!-- Step 1 -->
        <div class="instruction-card">
          <h3 class="step-title">
            <span class="step-badge">Step 1</span>
            Describe Your Movie-Watching Scenario (Your First Turn)
          </h3>
          
          <div class="instruction-content">
            <div class="what-to-do">
              <h4>What do you need to do?</h4>
              <p>
                After entering the dialogue box on the next page, please use natural language to input 
                your <strong>"movie-watching scenario information"</strong>.
              </p>
            </div>

            <div class="what-to-include">
              <h4>What information can you include?</h4>
              <ul>
                <li><strong>Who to watch with?</strong> (e.g., with girlfriend, with family, alone, with friends)</li>
                <li><strong>Where to watch?</strong> (e.g., at the cinema, at home)</li>
                <li><strong>When to watch?</strong> (e.g., weekend evening, weekday afternoon)</li>
              </ul>
            </div>

            <div class="example-input">
              <h4>Example Input:</h4>
              <div class="example-box">
                "I want to watch a movie at home with my family on weekend evening."
              </div>
            </div>

            <div class="system-response">
              <h4>What will the system do?</h4>
              <p>
                After receiving your scenario information, the system will analyze it and carefully 
                recommend <strong>12 movies</strong> for you. Please patiently read through the initial 
                recommendation list provided by the system.
              </p>
            </div>
          </div>
        </div>

        <!-- Step 2 -->
        <div class="instruction-card">
          <h3 class="step-title">
            <span class="step-badge">Step 2</span>
            Interaction and Understanding (Subsequent Dialogue Turns)
          </h3>
          
          <div class="instruction-content">
            <div class="what-you-can-do">
              <h4>What can you do?</h4>
              <p>
                After seeing the recommendation list, if you're curious or confused about certain movies, 
                you can ask the system for explanations at any time. This is a free dialogue process - 
                you can ask multiple questions until you're satisfied.
              </p>
            </div>

            <div class="example-questions">
              <h4>What questions can you ask?</h4>
              <ul>
                <li>"Why did you recommend 'Movie A' to me?"</li>
                <li>"What's the difference between 'Movie B' and 'Movie C'?"</li>
                <li>"Which of these is more suitable for children to watch?"</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Step 3 -->
        <div class="instruction-card">
          <h3 class="step-title">
            <span class="step-badge">Step 3</span>
            Make Your Choice and Rate
          </h3>
          
          <div class="instruction-content">
            <div class="what-to-do-final">
              <h4>What do you need to do?</h4>
              <p>
                When you have a clear choice in mind through your interaction with the system, 
                please select the movie you most want to watch from the recommendation list.
              </p>
            </div>

            <div class="final-step">
              <h4>Final Step:</h4>
              <p>
                After making your choice, the system will ask you to rate your satisfaction with 
                this recommendation. Your feedback is crucial for us to continuously improve our service.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Ready Section -->
      <div class="ready-section">
        <h2 class="ready-title">Ready to Begin?</h2>
        <p class="ready-description">
          We hope to bring you an interesting and accurate movie discovery journey.
        </p>
        <button class="start-button" @click="startRecommendation">
          I Understand, Let's Start!
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MovieRecommendationIntro',
  methods: {
    startRecommendation() {
      // Array of possible conversation pages
      const conversationPages = [
        '/multiagentsstatic',
        '/first-round',
        '/multiagenttest'
      ];
      
      // Randomly select one of the three pages with equal probability
      const randomIndex = Math.floor(Math.random() * conversationPages.length);
      const selectedPage = conversationPages[randomIndex];
      
      // Navigate to the randomly selected page
      this.$router.push(selectedPage);
    }
  }
};
</script>

<style scoped>
.intro-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.intro-content {
  max-width: 900px;
  width: 100%;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.header-section {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  padding: 3rem 2rem;
  text-align: center;
}

.main-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.subtitle {
  font-size: 1.2rem;
  line-height: 1.6;
  opacity: 0.95;
  max-width: 700px;
  margin: 0 auto;
}

.overview-card {
  padding: 2.5rem 2rem;
  background: #f8f9ff;
  border-bottom: 1px solid #e9ecef;
}

.section-title {
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 1rem;
  text-align: center;
  font-weight: 600;
}

.overview-description {
  text-align: center;
  font-size: 1.1rem;
  color: #555;
  margin-bottom: 2rem;
}

.steps-overview {
  display: flex;
  justify-content: space-between;
  gap: 2rem;
  flex-wrap: wrap;
}

.step-item {
  flex: 1;
  min-width: 250px;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.step-number {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  flex-shrink: 0;
}

.step-content h3 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 1.2rem;
}

.step-content p {
  color: #666;
  line-height: 1.5;
}

.instructions-section {
  padding: 2.5rem 2rem;
}

.instruction-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 15px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.instruction-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.step-title {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  color: #2c3e50;
  font-size: 1.4rem;
}

.step-badge {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
}

.instruction-content h4 {
  color: #495057;
  margin-bottom: 0.8rem;
  font-size: 1.1rem;
  font-weight: 600;
}

.instruction-content p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 1.2rem;
}

.instruction-content ul {
  padding-left: 1.5rem;
  margin-bottom: 1.2rem;
}

.instruction-content li {
  color: #666;
  line-height: 1.6;
  margin-bottom: 0.5rem;
}

.example-box {
  background: #f8f9fa;
  border-left: 4px solid #4facfe;
  padding: 1rem 1.5rem;
  border-radius: 5px;
  font-style: italic;
  color: #495057;
  margin-bottom: 1.2rem;
}

.ready-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 3rem 2rem;
  text-align: center;
}

.ready-title {
  font-size: 2rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.ready-description {
  font-size: 1.1rem;
  margin-bottom: 2rem;
  opacity: 0.95;
}

.start-button {
  background: white;
  color: #667eea;
  border: none;
  padding: 1rem 2.5rem;
  font-size: 1.2rem;
  font-weight: 600;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.start-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  background: #f8f9ff;
}

@media (max-width: 768px) {
  .intro-container {
    padding: 1rem;
  }
  
  .header-section {
    padding: 2rem 1.5rem;
  }
  
  .main-title {
    font-size: 2rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
  
  .steps-overview {
    flex-direction: column;
  }
  
  .step-item {
    min-width: auto;
  }
  
  .overview-card,
  .instructions-section,
  .ready-section {
    padding: 2rem 1.5rem;
  }
  
  .instruction-card {
    padding: 1.5rem;
  }
  
  .step-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}

@media (max-width: 480px) {
  .main-title {
    font-size: 1.8rem;
  }
  
  .section-title {
    font-size: 1.5rem;
  }
  
  .step-title {
    font-size: 1.2rem;
  }
}
</style>
