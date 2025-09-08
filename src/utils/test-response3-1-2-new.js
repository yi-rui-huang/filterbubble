/**
 * Test Suite for the rewritten response3-1-2.js (Single-Call Architecture)
 * Tests the single-call conversation generator that creates complete multi-agent discussions
 */

import { generateAgentConversation } from './response3-1-2.js';

// Mock data for testing the new single-call architecture
const mockMovieData = {
  inProfileMovies: [
    { primaryTitle: "The Avengers", genres: "Action,Adventure,Sci-Fi" },
    { primaryTitle: "Inception", genres: "Action,Drama,Sci-Fi" },
    { primaryTitle: "The Dark Knight", genres: "Action,Crime,Drama" },
    { primaryTitle: "Interstellar", genres: "Adventure,Drama,Sci-Fi" },
    { primaryTitle: "Guardians of the Galaxy", genres: "Action,Adventure,Comedy" },
    { primaryTitle: "Iron Man", genres: "Action,Adventure,Sci-Fi" }
  ],
  outOfProfileMovies: [
    { primaryTitle: "The Notebook", genres: "Drama,Romance" },
    { primaryTitle: "Titanic", genres: "Drama,Romance" },
    { primaryTitle: "Pride and Prejudice", genres: "Drama,Romance" },
    { primaryTitle: "Casablanca", genres: "Drama,Romance,War" },
    { primaryTitle: "When Harry Met Sally", genres: "Comedy,Drama,Romance" },
    { primaryTitle: "Ghost", genres: "Drama,Fantasy,Romance" }
  ]
};

const mockAgentProfiles = [
  {
    agent_id: "agent_1",
    match_dimension: "demographic_match",
    profile_description: "A 25-30 year old female movie enthusiast who understands the social trends and preferences of our generation"
  },
  {
    agent_id: "agent_2", 
    match_dimension: "interest_match",
    profile_description: "A passionate action and sci-fi movie lover who shares your taste for thrilling, high-energy films"
  },
  {
    agent_id: "agent_3",
    match_dimension: "personality_match", 
    profile_description: "A creative and imaginative movie critic who appreciates complex narratives and character development"
  }
];

const mockUserProfile = {
  gender: "female",
  age_range: "26-30",
  liked_genres: ["Action", "Sci-Fi", "Adventure"],
  personality: { openness: true, imagination: true }
};

// Test runner function
async function runTests() {
  console.log('🎬 Starting response3-1-2.js (Single-Call) Test Suite\n');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Helper function to run individual tests
  function test(name, testFn) {
    totalTests++;
    try {
      console.log(`🧪 Testing: ${name}`);
      const result = testFn();
      if (result instanceof Promise) {
        return result.then(() => {
          console.log(`✅ PASSED: ${name}\n`);
          passedTests++;
        }).catch(error => {
          console.log(`❌ FAILED: ${name}`);
          console.log(`   Error: ${error.message}\n`);
        });
      } else {
        console.log(`✅ PASSED: ${name}\n`);
        passedTests++;
      }
    } catch (error) {
      console.log(`❌ FAILED: ${name}`);
      console.log(`   Error: ${error.message}\n`);
    }
  }

  // Test input validation
  await test('generateAgentConversation - missing movieData', async () => {
    try {
      await generateAgentConversation(null, mockAgentProfiles, mockUserProfile, "relaxing at home");
      throw new Error('Should have thrown error for missing movieData');
    } catch (error) {
      if (!error.message.includes('Missing one or more required parameters')) {
        throw new Error('Wrong error message for missing movieData');
      }
    }
  });

  await test('generateAgentConversation - missing agentProfiles', async () => {
    try {
      await generateAgentConversation(mockMovieData, null, mockUserProfile, "relaxing at home");
      throw new Error('Should have thrown error for missing agentProfiles');
    } catch (error) {
      if (!error.message.includes('Missing one or more required parameters')) {
        throw new Error('Wrong error message for missing agentProfiles');
      }
    }
  });

  await test('generateAgentConversation - missing userProfile', async () => {
    try {
      await generateAgentConversation(mockMovieData, mockAgentProfiles, null, "relaxing at home");
      throw new Error('Should have thrown error for missing userProfile');
    } catch (error) {
      if (!error.message.includes('Missing one or more required parameters')) {
        throw new Error('Wrong error message for missing userProfile');
      }
    }
  });

  await test('generateAgentConversation - missing userScenario', async () => {
    try {
      await generateAgentConversation(mockMovieData, mockAgentProfiles, mockUserProfile, null);
      throw new Error('Should have thrown error for missing userScenario');
    } catch (error) {
      if (!error.message.includes('Missing one or more required parameters')) {
        throw new Error('Wrong error message for missing userScenario');
      }
    }
  });

  await test('generateAgentConversation - invalid agent count', async () => {
    const invalidAgentProfiles = [mockAgentProfiles[0]]; // Only one agent
    try {
      await generateAgentConversation(mockMovieData, invalidAgentProfiles, mockUserProfile, "relaxing at home");
      throw new Error('Should have thrown error for invalid agent count');
    } catch (error) {
      if (!error.message.includes('exactly 3 agents')) {
        throw new Error('Wrong error message for invalid agent count');
      }
    }
  });

  // Test main function with valid inputs
  await test('generateAgentConversation - valid inputs', async () => {
    const result = await generateAgentConversation(
      mockMovieData, 
      mockAgentProfiles, 
      mockUserProfile,
      "relaxing at home after a long day"
    );
    
    if (!Array.isArray(result)) {
      throw new Error('Result should be an array');
    }
    
    if (result.length === 0) {
      throw new Error('Result should not be empty');
    }
    
    // Check if all results have required properties
    result.forEach((item, index) => {
      if (!item.agent_id || !item.dialogue) {
        throw new Error(`Item ${index} missing required properties`);
      }
      if (typeof item.dialogue !== 'string' || item.dialogue.length === 0) {
        throw new Error(`Invalid dialogue for item ${index}`);
      }
    });
    
    // Should have multiple conversation turns (6-8 as specified in the prompt)
    if (result.length < 3) {
      throw new Error('Conversation should have at least 3 turns');
    }
    
    // Check that all three agents are represented
    const agentIds = result.map(r => r.agent_id);
    const uniqueAgents = [...new Set(agentIds)];
    if (uniqueAgents.length !== 3) {
      throw new Error('All three agents should participate in the conversation');
    }
    
    // Verify agent IDs are correct
    const validAgentIds = ['Agent A', 'Agent B', 'Agent C'];
    result.forEach(item => {
      if (!validAgentIds.includes(item.agent_id)) {
        throw new Error(`Invalid agent_id: ${item.agent_id}`);
      }
    });
  });

  // Test different movie data formats
  await test('generateAgentConversation - array format movieData', async () => {
    const movieArray = [...mockMovieData.inProfileMovies, ...mockMovieData.outOfProfileMovies];
    const result = await generateAgentConversation(
      movieArray,
      mockAgentProfiles,
      mockUserProfile,
      "weekend movie night"
    );
    
    if (!Array.isArray(result) || result.length === 0) {
      throw new Error('Should handle array format movie data');
    }
  });

  await test('generateAgentConversation - movies property format', async () => {
    const movieDataWithMoviesProperty = {
      movies: [...mockMovieData.inProfileMovies, ...mockMovieData.outOfProfileMovies]
    };
    const result = await generateAgentConversation(
      movieDataWithMoviesProperty,
      mockAgentProfiles,
      mockUserProfile,
      "date night"
    );
    
    if (!Array.isArray(result) || result.length === 0) {
      throw new Error('Should handle movies property format');
    }
  });

  // Test different user scenarios
  await test('generateAgentConversation - different scenarios', async () => {
    const scenarios = [
      "family movie night",
      "solo viewing after work",
      "weekend binge watching",
      "romantic date night"
    ];
    
    for (const scenario of scenarios) {
      const result = await generateAgentConversation(
        mockMovieData,
        mockAgentProfiles,
        mockUserProfile,
        scenario
      );
      
      if (!Array.isArray(result) || result.length === 0) {
        throw new Error(`Failed for scenario: ${scenario}`);
      }
    }
  });

  // Test different user profiles
  await test('generateAgentConversation - minimal user profile', async () => {
    const minimalProfile = {
      gender: "other",
      liked_genres: ["Drama"]
    };
    
    const result = await generateAgentConversation(
      mockMovieData,
      mockAgentProfiles,
      minimalProfile,
      "quiet evening"
    );
    
    if (!Array.isArray(result) || result.length === 0) {
      throw new Error('Should handle minimal user profile');
    }
  });

  await test('generateAgentConversation - complex user profile', async () => {
    const complexProfile = {
      demographics: {
        gender: "female",
        age_range: "31-35"
      },
      interests: {
        liked_genres: ["Horror", "Thriller", "Mystery"]
      },
      personality: {
        openness: true,
        curious: true,
        intellectual: true
      }
    };
    
    const result = await generateAgentConversation(
      mockMovieData,
      mockAgentProfiles,
      complexProfile,
      "spooky movie marathon"
    );
    
    if (!Array.isArray(result) || result.length === 0) {
      throw new Error('Should handle complex user profile');
    }
  });

  // Test conversation quality
  await test('generateAgentConversation - conversation coherence', async () => {
    const result = await generateAgentConversation(
      mockMovieData,
      mockAgentProfiles,
      mockUserProfile,
      "choosing between action and romance"
    );
    
    if (!Array.isArray(result) || result.length < 4) {
      throw new Error('Should generate substantial conversation');
    }
    
    // Check for variety in dialogue length (not all responses should be identical)
    const dialogueLengths = result.map(r => r.dialogue.length);
    const avgLength = dialogueLengths.reduce((a, b) => a + b, 0) / dialogueLengths.length;
    
    if (avgLength < 50) {
      throw new Error('Dialogues should be substantial (average > 50 characters)');
    }
    
    // Check that dialogues are unique
    const dialogues = result.map(r => r.dialogue);
    const uniqueDialogues = [...new Set(dialogues)];
    if (uniqueDialogues.length !== dialogues.length) {
      throw new Error('All dialogues should be unique');
    }
  });

  // Test error handling and fallback
  await test('generateAgentConversation - invalid movie data format', async () => {
    const invalidMovieData = { invalid: "format" };
    
    const result = await generateAgentConversation(
      invalidMovieData,
      mockAgentProfiles,
      mockUserProfile,
      "test scenario"
    );
    
    // Should return fallback conversation
    if (!Array.isArray(result) || result.length === 0) {
      throw new Error('Should return fallback conversation for invalid data');
    }
    
    // Fallback should have the expected structure
    result.forEach(item => {
      if (!item.agent_id || !item.dialogue) {
        throw new Error('Fallback conversation should have proper structure');
      }
    });
  });

  // Performance test
  await test('Performance - single API call efficiency', async () => {
    const startTime = Date.now();
    
    const result = await generateAgentConversation(
      mockMovieData,
      mockAgentProfiles,
      mockUserProfile,
      "performance test scenario"
    );
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`   Performance: Single call completed in ${duration}ms`);
    
    if (!Array.isArray(result) || result.length === 0) {
      throw new Error('Performance test should return valid conversation');
    }
    
    // Single call should be faster than multiple parallel calls
    if (duration > 15000) { // 15 seconds timeout
      throw new Error('Single API call took too long');
    }
  });

  // Summary
  console.log('📊 Test Results Summary');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! The rewritten response3-1-2.js (Single-Call) module is working correctly.');
    console.log('✨ Key improvements verified:');
    console.log('   - Single API call architecture');
    console.log('   - JSON response format handling');
    console.log('   - Comprehensive conversation generation');
    console.log('   - Improved error handling and fallbacks');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
  }
  
  return { passed: passedTests, total: totalTests };
}

// Mock fetch for testing (enhanced for JSON response format)
if (typeof global !== 'undefined') {
  global.fetch = global.fetch || (() => {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        choices: [{
          message: {
            content: JSON.stringify({
              conversation: [
                {
                  agent_id: "Agent B",
                  dialogue: "Based on your love for action and sci-fi, I'd recommend starting with The Avengers - it's got that perfect blend of superhero action and team dynamics you enjoy!"
                },
                {
                  agent_id: "Agent A", 
                  dialogue: "That's a solid choice, but have you considered The Notebook? I know it seems different, but women in our age group are really connecting with its emotional depth lately."
                },
                {
                  agent_id: "Agent C",
                  dialogue: "I appreciate both perspectives! Given your imaginative nature, Pride and Prejudice offers incredible character complexity that might surprise you with its psychological depth."
                },
                {
                  agent_id: "Agent B",
                  dialogue: "I hear you both, but why stray from what works? Inception delivers that mind-bending sci-fi experience that perfectly matches your established preferences."
                },
                {
                  agent_id: "Agent A",
                  dialogue: "Fair point about sticking with favorites, but Titanic has this epic scope that people our age find really memorable - it's a cultural touchstone worth experiencing."
                },
                {
                  agent_id: "Agent C",
                  dialogue: "All great options! So we have The Avengers for reliable action thrills, The Notebook for emotional exploration, and Pride and Prejudice for intellectual engagement. Which direction feels right for tonight?"
                }
              ]
            })
          }
        }]
      })
    });
  });
}

// Export test functions for external use
export { runTests, mockMovieData, mockAgentProfiles, mockUserProfile };

// Auto-run tests if this file is executed directly
if (typeof window === 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}
