/**
 * Test Suite for response3-1.js
 * Tests the multi-agent movie discussion response generator
 */

import { 
  generateAgentConversation, 
  parseMovieData, 
  mapAgentsToRoles, 
  getMovieTitle 
} from './response3-1-2.js';

// Mock data for testing
const mockMovieData = {
  inProfileMovies: [
    { primaryTitle: "The Avengers", title: "The Avengers", genres: "Action,Adventure,Sci-Fi" },
    { primaryTitle: "Inception", title: "Inception", genres: "Action,Drama,Sci-Fi" },
    { primaryTitle: "The Dark Knight", title: "The Dark Knight", genres: "Action,Crime,Drama" },
    { primaryTitle: "Interstellar", title: "Interstellar", genres: "Adventure,Drama,Sci-Fi" },
    { primaryTitle: "Guardians of the Galaxy", title: "Guardians of the Galaxy", genres: "Action,Adventure,Comedy" },
    { primaryTitle: "Iron Man", title: "Iron Man", genres: "Action,Adventure,Sci-Fi" }
  ],
  outOfProfileMovies: [
    { primaryTitle: "The Notebook", title: "The Notebook", genres: "Drama,Romance" },
    { primaryTitle: "Titanic", title: "Titanic", genres: "Drama,Romance" },
    { primaryTitle: "Pride and Prejudice", title: "Pride and Prejudice", genres: "Drama,Romance" },
    { primaryTitle: "Casablanca", title: "Casablanca", genres: "Drama,Romance,War" },
    { primaryTitle: "When Harry Met Sally", title: "When Harry Met Sally", genres: "Comedy,Drama,Romance" },
    { primaryTitle: "Ghost", title: "Ghost", genres: "Drama,Fantasy,Romance" }
  ]
};

const mockAgentProfiles = [
  {
    agent_id: "agent_1",
    match_dimension: "demographic_match",
    profile_description: "A 25-30 year old female movie enthusiast",
    gender: "female",
    age_range: "26-30"
  },
  {
    agent_id: "agent_2", 
    match_dimension: "interest_match",
    profile_description: "Shares your love for action and sci-fi movies",
    liked_genres: ["Action", "Sci-Fi", "Adventure"]
  },
  {
    agent_id: "agent_3",
    match_dimension: "personality_match", 
    profile_description: "Creative and imaginative movie lover",
    personality: { openness: true, imagination: true }
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
  console.log('🎬 Starting response3-1.js Test Suite\n');
  
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

  // Test parseMovieData function
  await test('parseMovieData - with categorized object', () => {
    const result = parseMovieData(mockMovieData);
    if (!result.inProfileMovies || !result.outOfProfileMovies) {
      throw new Error('Missing required properties');
    }
    if (result.inProfileMovies.length !== 6 || result.outOfProfileMovies.length !== 6) {
      throw new Error('Incorrect movie counts');
    }
  });

  await test('parseMovieData - with array input', () => {
    const movieArray = [...mockMovieData.inProfileMovies, ...mockMovieData.outOfProfileMovies];
    const result = parseMovieData(movieArray);
    if (result.inProfileMovies.length !== 6 || result.outOfProfileMovies.length !== 6) {
      throw new Error('Array splitting failed');
    }
  });

  await test('parseMovieData - with alternative naming', () => {
    const altData = {
      includeMovies: mockMovieData.inProfileMovies,
      excludeMovies: mockMovieData.outOfProfileMovies
    };
    const result = parseMovieData(altData);
    if (result.inProfileMovies.length !== 6) {
      throw new Error('Alternative naming parsing failed');
    }
  });

  // Test getMovieTitle function
  await test('getMovieTitle - with string input', () => {
    const result = getMovieTitle("Test Movie");
    if (result !== "Test Movie") {
      throw new Error('String title extraction failed');
    }
  });

  await test('getMovieTitle - with object having primaryTitle', () => {
    const movie = { primaryTitle: "The Avengers", title: "Avengers" };
    const result = getMovieTitle(movie);
    if (result !== "The Avengers") {
      throw new Error('primaryTitle extraction failed');
    }
  });

  await test('getMovieTitle - with object having only title', () => {
    const movie = { title: "Inception" };
    const result = getMovieTitle(movie);
    if (result !== "Inception") {
      throw new Error('title extraction failed');
    }
  });

  await test('getMovieTitle - with empty object', () => {
    const result = getMovieTitle({});
    if (result !== "Unknown Movie") {
      throw new Error('Default title not returned');
    }
  });

  // Test mapAgentsToRoles function
  await test('mapAgentsToRoles - correct mapping', () => {
    const result = mapAgentsToRoles(mockAgentProfiles);
    if (!result.agentA || !result.agentB || !result.agentC) {
      throw new Error('Missing agent mappings');
    }
    if (result.agentA.stance !== 'out-of-profile') {
      throw new Error('Agent A stance incorrect');
    }
    if (result.agentB.stance !== 'in-profile') {
      throw new Error('Agent B stance incorrect');
    }
    if (result.agentC.stance !== 'out-of-profile') {
      throw new Error('Agent C stance incorrect');
    }
  });

  await test('mapAgentsToRoles - with missing agents', () => {
    const incompleteProfiles = [mockAgentProfiles[0]]; // Only demographic agent
    const result = mapAgentsToRoles(incompleteProfiles);
    if (!result.agentA || !result.agentB || !result.agentC) {
      throw new Error('Default agents not created');
    }
  });

  // Test input validation
  await test('generateAgentConversation - missing parameters', async () => {
    try {
      await generateAgentConversation(null, null, null);
      throw new Error('Should have thrown error for missing parameters');
    } catch (error) {
      if (!error.message.includes('Missing required parameters')) {
        throw new Error('Wrong error message for missing parameters');
      }
    }
  });

  await test('generateAgentConversation - invalid agent count', async () => {
    try {
      await generateAgentConversation(mockMovieData, [mockAgentProfiles[0]], mockUserProfile);
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
      "relaxing at home"
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
    });
  });

  // Test edge cases
  await test('generateAgentConversation - empty movie data', async () => {
    const emptyMovieData = { inProfileMovies: [], outOfProfileMovies: [] };
    const result = await generateAgentConversation(
      emptyMovieData,
      mockAgentProfiles,
      mockUserProfile
    );
    
    if (!Array.isArray(result)) {
      throw new Error('Should return fallback conversation array');
    }
  });

  await test('generateAgentConversation - minimal user profile', async () => {
    const minimalProfile = { gender: "other" };
    const result = await generateAgentConversation(
      mockMovieData,
      mockAgentProfiles,
      minimalProfile
    );
    
    if (!Array.isArray(result)) {
      throw new Error('Should handle minimal profile gracefully');
    }
  });

  // Test different movie data formats
  await test('parseMovieData - mixed format movies', () => {
    const mixedMovies = [
      "Simple String Movie",
      { title: "Object Movie" },
      { primaryTitle: "Primary Title Movie", originalTitle: "Original" },
      { originalTitle: "Only Original Title" }
    ];
    
    const result = parseMovieData(mixedMovies);
    if (result.inProfileMovies.length !== 4) {
      throw new Error('Mixed format parsing failed');
    }
  });

  // Performance test
  await test('Performance - multiple rapid calls', async () => {
    const startTime = Date.now();
    const promises = [];
    
    for (let i = 0; i < 3; i++) {
      promises.push(
        generateAgentConversation(mockMovieData, mockAgentProfiles, mockUserProfile)
      );
    }
    
    await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`   Performance: ${promises.length} calls completed in ${duration}ms`);
    
    if (duration > 30000) { // 30 seconds timeout
      throw new Error('Performance test took too long');
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
    console.log('\n🎉 All tests passed! The response3-1.js module is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
  }
  
  return { passed: passedTests, total: totalTests };
}

// Mock fetch for testing (in case API calls are made)
if (typeof global !== 'undefined') {
  global.fetch = global.fetch || (() => {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        choices: [{
          message: {
            content: "This is a mock response for testing purposes."
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
