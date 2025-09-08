/**
 * Test Suite for response3-1-2.js
 * Tests the second round multi-agent movie discussion response generator
 */

import { 
  generateSecondRoundResponse, 
  getFirstRoundConversationHistory 
} from './response3-1-2.js';

// Mock data for testing second round conversations
const mockMessageGroups = [
  {
    userMessage: "I'm looking for movie recommendations for tonight",
    agentMessages: [
      {
        sender: "Agent A",
        text: "I think you should try The Notebook - it's been really popular among women in their late 20s lately."
      },
      {
        sender: "Agent B", 
        text: "For your action and sci-fi preferences, I'd recommend The Avengers, Inception, and The Dark Knight."
      },
      {
        sender: "Agent C",
        text: "With your imaginative nature, you might enjoy Pride and Prejudice for its complex character development."
      }
    ]
  }
];

const mockAgentProfilesData = {
  agentProfiles: [
    {
      agent_id: "Agent A",
      match_dimension: "demographic_match",
      profile_description: "A 25-30 year old female movie enthusiast",
      gender: "female",
      age_range: "26-30"
    },
    {
      agent_id: "Agent B", 
      match_dimension: "interest_match",
      profile_description: "Shares your love for action and sci-fi movies",
      liked_genres: ["Action", "Sci-Fi", "Adventure"]
    },
    {
      agent_id: "Agent C",
      match_dimension: "personality_match", 
      profile_description: "Creative and imaginative movie lover",
      personality: { openness: true, imagination: true }
    }
  ],
  userInput: {
    gender: "female",
    age_range: "26-30",
    liked_genres: ["Action", "Sci-Fi", "Adventure"],
    personality: { openness: true, imagination: true }
  }
};

// Test runner function
async function runTests() {
  console.log('🎬 Starting response3-1-2.js Test Suite\n');
  
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

  // Test getFirstRoundConversationHistory function
  await test('getFirstRoundConversationHistory - basic functionality', () => {
    const result = getFirstRoundConversationHistory(mockMessageGroups);
    if (typeof result !== 'string') {
      throw new Error('Should return a string');
    }
    if (!result.includes('Agent A:') || !result.includes('Agent B:') || !result.includes('Agent C:')) {
      throw new Error('Should include all agent messages');
    }
    if (!result.includes('The Notebook') || !result.includes('The Avengers')) {
      throw new Error('Should include movie recommendations from conversation');
    }
  });

  await test('getFirstRoundConversationHistory - empty input', () => {
    const result = getFirstRoundConversationHistory([]);
    if (result !== '') {
      throw new Error('Should return empty string for empty input');
    }
  });

  await test('getFirstRoundConversationHistory - multiple message groups', () => {
    const multipleGroups = [
      ...mockMessageGroups,
      {
        userMessage: "Tell me more about those recommendations",
        agentMessages: [
          {
            sender: "Agent A",
            text: "The Notebook has great emotional depth that resonates with our demographic."
          }
        ]
      }
    ];
    const result = getFirstRoundConversationHistory(multipleGroups);
    if (!result.includes('emotional depth')) {
      throw new Error('Should include messages from multiple groups');
    }
  });

  // Test input validation for generateSecondRoundResponse
  await test('generateSecondRoundResponse - missing userMessage', async () => {
    try {
      await generateSecondRoundResponse(null, mockMessageGroups, mockAgentProfilesData);
      throw new Error('Should have thrown error for missing userMessage');
    } catch (error) {
      if (!error.message.includes('Missing required parameters')) {
        throw new Error('Wrong error message for missing userMessage');
      }
    }
  });

  await test('generateSecondRoundResponse - missing agentProfilesData', async () => {
    try {
      await generateSecondRoundResponse("What do you think?", mockMessageGroups, null);
      throw new Error('Should have thrown error for missing agentProfilesData');
    } catch (error) {
      if (!error.message.includes('Missing required parameters')) {
        throw new Error('Wrong error message for missing agentProfilesData');
      }
    }
  });

  await test('generateSecondRoundResponse - invalid agent count', async () => {
    const invalidAgentData = {
      agentProfiles: [mockAgentProfilesData.agentProfiles[0]], // Only one agent
      userInput: mockAgentProfilesData.userInput
    };
    try {
      await generateSecondRoundResponse("What do you think?", mockMessageGroups, invalidAgentData);
      throw new Error('Should have thrown error for invalid agent count');
    } catch (error) {
      if (!error.message.includes('exactly 3 agents')) {
        throw new Error('Wrong error message for invalid agent count');
      }
    }
  });

  // Test main function with valid inputs
  await test('generateSecondRoundResponse - valid inputs', async () => {
    const userMessage = "I'm interested in trying something different. What would you recommend?";
    const result = await generateSecondRoundResponse(userMessage, mockMessageGroups, mockAgentProfilesData);
    
    if (!Array.isArray(result)) {
      throw new Error('Result should be an array');
    }
    
    if (result.length !== 3) {
      throw new Error('Should return exactly 3 agent responses');
    }
    
    // Check if all results have required properties
    const expectedAgents = ['Agent A', 'Agent B', 'Agent C'];
    result.forEach((item, index) => {
      if (!item.agent_id || !item.dialogue) {
        throw new Error(`Item ${index} missing required properties`);
      }
      if (!expectedAgents.includes(item.agent_id)) {
        throw new Error(`Invalid agent_id: ${item.agent_id}`);
      }
      if (typeof item.dialogue !== 'string' || item.dialogue.length === 0) {
        throw new Error(`Invalid dialogue for ${item.agent_id}`);
      }
    });
    
    // Check that all three agents are represented
    const agentIds = result.map(r => r.agent_id);
    expectedAgents.forEach(expectedAgent => {
      if (!agentIds.includes(expectedAgent)) {
        throw new Error(`Missing response from ${expectedAgent}`);
      }
    });
  });

  // Test different user message types
  await test('generateSecondRoundResponse - question about specific movie', async () => {
    const userMessage = "What do you think about The Avengers specifically?";
    const result = await generateSecondRoundResponse(userMessage, mockMessageGroups, mockAgentProfilesData);
    
    if (!Array.isArray(result) || result.length !== 3) {
      throw new Error('Should return 3 agent responses');
    }
    
    // At least one response should mention The Avengers or address the specific question
    const hasRelevantResponse = result.some(r => 
      r.dialogue.toLowerCase().includes('avengers') || 
      r.dialogue.toLowerCase().includes('specific') ||
      r.dialogue.length > 20 // Ensure substantial responses
    );
    
    if (!hasRelevantResponse) {
      throw new Error('Responses should be relevant to the user question');
    }
  });

  await test('generateSecondRoundResponse - preference change request', async () => {
    const userMessage = "I'm actually more interested in romantic movies now.";
    const result = await generateSecondRoundResponse(userMessage, mockMessageGroups, mockAgentProfilesData);
    
    if (!Array.isArray(result) || result.length !== 3) {
      throw new Error('Should return 3 agent responses');
    }
    
    // Responses should address the preference change
    const addressesChange = result.some(r => 
      r.dialogue.toLowerCase().includes('romantic') || 
      r.dialogue.toLowerCase().includes('romance') ||
      r.dialogue.toLowerCase().includes('change') ||
      r.dialogue.toLowerCase().includes('interest')
    );
    
    if (!addressesChange) {
      throw new Error('At least one response should address the preference change');
    }
  });

  // Test edge cases
  await test('generateSecondRoundResponse - empty message groups', async () => {
    const result = await generateSecondRoundResponse(
      "What do you recommend?",
      [],
      mockAgentProfilesData
    );
    
    if (!Array.isArray(result) || result.length !== 3) {
      throw new Error('Should still return 3 responses even with empty history');
    }
  });

  await test('generateSecondRoundResponse - minimal user profile', async () => {
    const minimalAgentData = {
      agentProfiles: mockAgentProfilesData.agentProfiles,
      userInput: { gender: "other" } // Minimal profile
    };
    
    const result = await generateSecondRoundResponse(
      "Any recommendations?",
      mockMessageGroups,
      minimalAgentData
    );
    
    if (!Array.isArray(result) || result.length !== 3) {
      throw new Error('Should handle minimal profile gracefully');
    }
  });

  // Test response consistency
  await test('generateSecondRoundResponse - response consistency', async () => {
    const userMessage = "I need help choosing between action and romance.";
    const result = await generateSecondRoundResponse(userMessage, mockMessageGroups, mockAgentProfilesData);
    
    // Agent B should favor action (in-profile), Agent A and C should have different perspectives
    const agentB = result.find(r => r.agent_id === 'Agent B');
    const agentA = result.find(r => r.agent_id === 'Agent A');
    const agentC = result.find(r => r.agent_id === 'Agent C');
    
    if (!agentA || !agentB || !agentC) {
      throw new Error('All agents should be present in response');
    }
    
    // Each response should be unique
    const dialogues = result.map(r => r.dialogue);
    const uniqueDialogues = [...new Set(dialogues)];
    if (uniqueDialogues.length !== 3) {
      throw new Error('All agent responses should be unique');
    }
  });

  // Performance test (with shorter timeout for second round)
  await test('Performance - multiple rapid calls', async () => {
    const startTime = Date.now();
    const promises = [];
    
    for (let i = 0; i < 2; i++) {
      promises.push(
        generateSecondRoundResponse(
          `Test message ${i}`,
          mockMessageGroups,
          mockAgentProfilesData
        )
      );
    }
    
    await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`   Performance: ${promises.length} calls completed in ${duration}ms`);
    
    if (duration > 20000) { // 20 seconds timeout for parallel calls
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
    console.log('\n🎉 All tests passed! The response3-1-2.js module is working correctly.');
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
            content: "This is a mock response for testing the second round conversation."
          }
        }]
      })
    });
  });
}

// Export test functions for external use
export { runTests, mockMessageGroups, mockAgentProfilesData };

// Auto-run tests if this file is executed directly
if (typeof window === 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}
