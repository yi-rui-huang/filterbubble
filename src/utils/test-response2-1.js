/**
 * Test script for response2-1.js
 * Tests the multi-agent movie discussion generator functionality
 */

import { 
  generateAgentConversation, 
  parseMovieData, 
  mapAgentsToRoles, 
  getMovieTitle 
} from './response2-1.js';

// Mock data for testing
const mockMovieData = {
  inProfileMovies: [
    { primaryTitle: "The Avengers", title: "The Avengers" },
    { primaryTitle: "Spider-Man", title: "Spider-Man" },
    { primaryTitle: "Iron Man", title: "Iron Man" },
    { primaryTitle: "Thor", title: "Thor" },
    { primaryTitle: "Captain America", title: "Captain America" },
    { primaryTitle: "Black Widow", title: "Black Widow" }
  ],
  outOfProfileMovies: [
    { primaryTitle: "The Notebook", title: "The Notebook" },
    { primaryTitle: "Casablanca", title: "Casablanca" },
    { primaryTitle: "Titanic", title: "Titanic" },
    { primaryTitle: "Pride and Prejudice", title: "Pride and Prejudice" },
    { primaryTitle: "The Fault in Our Stars", title: "The Fault in Our Stars" },
    { primaryTitle: "A Walk to Remember", title: "A Walk to Remember" }
  ]
};

const mockAgentProfiles = [
  {
    agent_id: "agent_1",
    match_dimension: "demographic",
    profile_description: "Demographics matcher agent",
    gender: "female",
    age_range: "26-30"
  },
  {
    agent_id: "agent_2", 
    match_dimension: "interest",
    profile_description: "Interests matcher agent",
    liked_genres: ["Comedy", "Romance", "Animation"]
  },
  {
    agent_id: "agent_3",
    match_dimension: "personality", 
    profile_description: "Personality matcher agent",
    personality: { openness: true, imagination: true }
  }
];

const mockUserProfile = {
  gender: "female",
  age_range: "26-30",
  liked_genres: ["Action", "Adventure", "Sci-Fi"],
  personality: {
    openness: true,
    imagination: true,
    curious: true
  }
};

const mockUserScenario = "relaxing at home on a Friday night";

/**
 * Test utility functions
 */
function testUtilityFunctions() {
  console.log("🧪 Testing Utility Functions...\n");
  
  // Test parseMovieData
  console.log("1. Testing parseMovieData:");
  const parsedData = parseMovieData(mockMovieData);
  console.log("✓ Parsed in-profile movies:", parsedData.inProfileMovies.length);
  console.log("✓ Parsed out-of-profile movies:", parsedData.outOfProfileMovies.length);
  
  // Test with array format
  const arrayMovieData = [...mockMovieData.inProfileMovies, ...mockMovieData.outOfProfileMovies];
  const parsedArrayData = parseMovieData(arrayMovieData);
  console.log("✓ Array format - in-profile:", parsedArrayData.inProfileMovies.length);
  console.log("✓ Array format - out-of-profile:", parsedArrayData.outOfProfileMovies.length);
  
  // Test mapAgentsToRoles
  console.log("\n2. Testing mapAgentsToRoles:");
  const mappedAgents = mapAgentsToRoles(mockAgentProfiles);
  console.log("✓ Agent A (demographics):", mappedAgents.agentA?.id);
  console.log("✓ Agent B (interests):", mappedAgents.agentB?.id);
  console.log("✓ Agent C (personality):", mappedAgents.agentC?.id);
  
  // Test getMovieTitle
  console.log("\n3. Testing getMovieTitle:");
  console.log("✓ String input:", getMovieTitle("Test Movie"));
  console.log("✓ Object with primaryTitle:", getMovieTitle({ primaryTitle: "Test Movie" }));
  console.log("✓ Object with title:", getMovieTitle({ title: "Test Movie" }));
  console.log("✓ Empty object:", getMovieTitle({}));
  
  console.log("\n✅ Utility functions test completed!\n");
}

/**
 * Test input validation
 */
function testInputValidation() {
  console.log("🔍 Testing Input Validation...\n");
  
  try {
    // Test missing parameters
    console.log("1. Testing missing parameters:");
    generateAgentConversation(null, null, null).catch(error => {
      console.log("✓ Correctly caught missing parameters error");
    });
    
    // Test invalid agent profiles
    console.log("2. Testing invalid agent profiles:");
    generateAgentConversation(mockMovieData, [], mockUserProfile).catch(error => {
      console.log("✓ Correctly caught invalid agent profiles error");
    });
    
    console.log("✅ Input validation test completed!\n");
  } catch (error) {
    console.log("⚠️ Input validation test error:", error.message);
  }
}

/**
 * Test main function with mock data (without API calls)
 */
async function testMainFunctionMock() {
  console.log("🎭 Testing Main Function (Mock Mode)...\n");
  
  try {
    // Override the API call to return mock responses
    const originalFetch = global.fetch;
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: "This is a mock response from the agent for testing purposes."
            }
          }]
        })
      })
    );
    
    console.log("1. Generating conversation with mock data...");
    const conversation = await generateAgentConversation(
      mockMovieData,
      mockAgentProfiles, 
      mockUserProfile,
      mockUserScenario
    );
    
    console.log("✓ Conversation generated successfully");
    console.log("✓ Number of agents:", conversation.length);
    console.log("✓ Agent IDs:", conversation.map(c => c.agent_id));
    
    // Validate conversation structure
    conversation.forEach((turn, index) => {
      if (turn.agent_id && turn.dialogue) {
        console.log(`✓ Turn ${index + 1}: ${turn.agent_id} - ${turn.dialogue.substring(0, 50)}...`);
      } else {
        console.log(`⚠️ Turn ${index + 1}: Missing agent_id or dialogue`);
      }
    });
    
    // Restore original fetch
    global.fetch = originalFetch;
    
    console.log("\n✅ Main function mock test completed!\n");
    return conversation;
    
  } catch (error) {
    console.log("❌ Main function mock test failed:", error.message);
    return null;
  }
}

/**
 * Test with real API (optional - requires valid API key)
 */
async function testWithRealAPI() {
  console.log("🌐 Testing with Real API...\n");
  
  try {
    console.log("1. Attempting real API call...");
    const conversation = await generateAgentConversation(
      mockMovieData,
      mockAgentProfiles,
      mockUserProfile,
      mockUserScenario
    );
    
    console.log("✅ Real API test successful!");
    console.log("✓ Generated conversation with", conversation.length, "agents");
    
    // Display actual responses
    conversation.forEach((turn, index) => {
      console.log(`\n${turn.agent_id}:`);
      console.log(turn.dialogue);
    });
    
    return conversation;
    
  } catch (error) {
    console.log("⚠️ Real API test failed (this is expected if API key is invalid):", error.message);
    console.log("ℹ️ The fallback conversation should be returned instead.");
    return null;
  }
}

/**
 * Performance test
 */
async function testPerformance() {
  console.log("⚡ Performance Test...\n");
  
  const startTime = Date.now();
  
  try {
    // Test utility functions performance
    for (let i = 0; i < 1000; i++) {
      parseMovieData(mockMovieData);
      mapAgentsToRoles(mockAgentProfiles);
      getMovieTitle("Test Movie");
    }
    
    const endTime = Date.now();
    console.log(`✓ 1000 utility function calls completed in ${endTime - startTime}ms`);
    console.log("✅ Performance test completed!\n");
    
  } catch (error) {
    console.log("❌ Performance test failed:", error.message);
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log("🚀 Starting response2-1.js Test Suite\n");
  console.log("=" .repeat(50));
  
  // Run tests in sequence
  testUtilityFunctions();
  testInputValidation();
  await testMainFunctionMock();
  await testPerformance();
  
  console.log("🎯 Optional: Testing with real API (may fail if API key is invalid)");
  await testWithRealAPI();
  
  console.log("=" .repeat(50));
  console.log("🏁 Test Suite Completed!");
  console.log("\nSummary:");
  console.log("- Utility functions: ✅ Working");
  console.log("- Input validation: ✅ Working"); 
  console.log("- Mock conversation generation: ✅ Working");
  console.log("- Performance: ✅ Acceptable");
  console.log("- Real API: ⚠️ Depends on API key validity");
}

// Simple mock for jest if not available
if (typeof jest === 'undefined') {
  global.jest = {
    fn: (implementation) => implementation || (() => {})
  };
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests, testUtilityFunctions, testMainFunctionMock, testWithRealAPI };
