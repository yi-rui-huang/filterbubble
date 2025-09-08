/**
 * Test file for response3-2.js
 * Tests the second round conversation response generation functionality
 */

import { 
  generateSecondRoundResponse, 
  getFirstRoundConversationHistory, 
  parseAgentResponses, 
  getAgentName 
} from './response3-2.js';

// Mock data for testing
const mockAgentProfilesData = {
  id: 'test-profile-id',
  userId: 'test-user-123',
  agentProfiles: [
    {
      agent_id: 'Agent A',
      match_dimension: 'Demographics',
      profile_description: 'This is Alex. Like you, Alex is a Female in the 40-49 age range. Alex shares your demographic background but might have different movie preferences and personality traits.',
      attributes: {
        gender: 'Female',
        age_range: '40-49'
      }
    },
    {
      agent_id: 'Agent B', 
      match_dimension: 'Interests',
      profile_description: 'This is Ben. Like you, Ben is a big fan of Comedy, Romance, and Animation movies. Ben shares your movie interests but demographic and personality might be different from yours.',
      attributes: {
        liked_genres: ['Comedy', 'Romance', 'Animation']
      }
    },
    {
      agent_id: 'Agent C',
      match_dimension: 'Personality', 
      profile_description: 'This is Casey. Their way of thinking is very similar to yours - they also have a rich imagination. Casey shares your personality traits but demographic and taste in movies might be different from yours.',
      attributes: {
        personality: 'imaginative'
      }
    }
  ]
};

const mockMessageGroups = [
  {
    userMessage: {
      text: "I'm looking for a good movie to watch tonight. Any recommendations?",
      timestamp: new Date('2024-01-01T20:00:00Z')
    },
    agentMessages: [
      {
        sender: 'Agent A',
        text: "Based on your demographic, I'd suggest 'The Intern' - it's been really popular among women in their 40s lately.",
        timestamp: new Date('2024-01-01T20:01:00Z')
      },
      {
        sender: 'Agent B', 
        text: "Perfect! Since you love comedy and romance, I'd recommend 'Crazy Rich Asians' - it's exactly the kind of romantic comedy that hits all the right notes!",
        timestamp: new Date('2024-01-01T20:01:30Z')
      },
      {
        sender: 'Agent C',
        text: "With your rich imagination, you'd really appreciate 'Inception' - it has those complex layers and creative storytelling that imaginative people find fascinating.",
        timestamp: new Date('2024-01-01T20:02:00Z')
      }
    ],
    expanded: true
  },
  {
    userMessage: {
      text: "What do you think about 'The Proposal'? Is it worth watching?",
      timestamp: new Date('2024-01-01T20:05:00Z')
    },
    agentMessages: [
      {
        sender: 'Agent A',
        text: "As someone in our age group, I think 'The Proposal' holds up really well! Sandra Bullock and Ryan Reynolds have fantastic chemistry that makes it feel fresh even years later.",
        timestamp: new Date('2024-01-01T20:05:30Z')
      },
      {
        sender: 'Agent B',
        text: "Absolutely worth watching! It's one of my favorite romantic comedies - the Alaska setting, the fake engagement trope, and Betty White's hilarious performance make it a comedy goldmine.",
        timestamp: new Date('2024-01-01T20:06:00Z')
      },
      {
        sender: 'Agent C',
        text: "I love how Alex and Ben are both right! What makes 'The Proposal' special is how it takes a predictable premise and adds imaginative twists - like that naked collision scene that's both hilarious and unexpectedly heartfelt.",
        timestamp: new Date('2024-01-01T20:06:30Z')
      }
    ],
    expanded: true
  }
];

// Test functions
async function testGetFirstRoundConversationHistory() {
  console.log('\n=== Testing getFirstRoundConversationHistory ===');
  
  try {
    const history = getFirstRoundConversationHistory(mockMessageGroups);
    
    console.log('✅ Conversation history extracted successfully');
    console.log('History length:', history.length);
    console.log('First entry:', history[0]);
    console.log('Last entry:', history[history.length - 1]);
    
    // Validate structure
    const hasUserMessages = history.some(entry => entry.role === 'user');
    const hasAgentMessages = history.some(entry => entry.role === 'agent');
    
    if (hasUserMessages && hasAgentMessages) {
      console.log('✅ History contains both user and agent messages');
    } else {
      console.log('❌ History missing user or agent messages');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error testing conversation history:', error);
    return false;
  }
}

function testParseAgentResponses() {
  console.log('\n=== Testing parseAgentResponses ===');
  
  // Test valid JSON response
  const validJsonResponse = `[
    {"agent_id": "Agent A", "dialogue": "That's a great question about romantic comedies."},
    {"agent_id": "Agent B", "dialogue": "I completely agree with Alex on this one."},
    {"agent_id": "Agent C", "dialogue": "From a creative perspective, I think we should consider..."}
  ]`;
  
  try {
    const parsed = parseAgentResponses(validJsonResponse);
    console.log('✅ Valid JSON parsed successfully');
    console.log('Parsed responses:', parsed);
    
    if (parsed.length === 3 && parsed.every(r => r.agent_id && r.dialogue)) {
      console.log('✅ All responses have required fields');
    } else {
      console.log('❌ Missing required fields in responses');
    }
  } catch (error) {
    console.error('❌ Error parsing valid JSON:', error);
  }
  
  // Test JSON with markdown
  const jsonWithMarkdown = `\`\`\`json
  [
    {"agent_id": "Agent A", "dialogue": "This is a test response."}
  ]
  \`\`\``;
  
  try {
    const parsed = parseAgentResponses(jsonWithMarkdown);
    console.log('✅ JSON with markdown parsed successfully');
    console.log('Parsed responses:', parsed);
  } catch (error) {
    console.error('❌ Error parsing JSON with markdown:', error);
  }
  
  // Test invalid JSON (should trigger manual extraction)
  const invalidJson = `Agent A said: "I think this movie is great"
  Agent B responded: "I disagree with that assessment"
  Agent C concluded: "Let's find a middle ground"`;
  
  try {
    const parsed = parseAgentResponses(invalidJson);
    console.log('✅ Invalid JSON handled with fallback');
    console.log('Fallback responses:', parsed);
  } catch (error) {
    console.error('❌ Error handling invalid JSON:', error);
  }
}

function testGetAgentName() {
  console.log('\n=== Testing getAgentName ===');
  
  const testCases = [
    { input: 'Agent A', expected: 'Alex' },
    { input: 'Agent B', expected: 'Ben' },
    { input: 'Agent C', expected: 'Casey' },
    { input: 'Unknown Agent', expected: 'Unknown Agent' }
  ];
  
  testCases.forEach(testCase => {
    const result = getAgentName(testCase.input);
    if (result === testCase.expected) {
      console.log(`✅ ${testCase.input} -> ${result}`);
    } else {
      console.log(`❌ ${testCase.input} -> ${result} (expected: ${testCase.expected})`);
    }
  });
}

async function testGenerateSecondRoundResponse() {
  console.log('\n=== Testing generateSecondRoundResponse ===');
  
  const userMessage = "What do you think about 'The Proposal'? Is it worth watching?";
  
  try {
    console.log('🔄 Calling generateSecondRoundResponse...');
    console.log('User message:', userMessage);
    console.log('Message groups count:', mockMessageGroups.length);
    console.log('Agent profiles count:', mockAgentProfilesData.agentProfiles.length);
    
    const responses = await generateSecondRoundResponse(
      userMessage, 
      mockMessageGroups, 
      mockAgentProfilesData
    );
    
    console.log('✅ Second round response generated successfully');
    console.log('Number of responses:', responses.length);
    
    responses.forEach((response, index) => {
      console.log(`\nResponse ${index + 1}:`);
      console.log(`Agent: ${response.agent_id}`);
      console.log(`Dialogue: ${response.dialogue}`);
    });
    
    // Validate response structure
    const hasAllAgents = ['Agent A', 'Agent B', 'Agent C'].every(agentId =>
      responses.some(r => r.agent_id === agentId)
    );
    
    if (hasAllAgents) {
      console.log('✅ All three agents provided responses');
    } else {
      console.log('⚠️ Not all agents provided responses (this might be expected depending on the scenario)');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error testing generateSecondRoundResponse:', error);
    console.error('Error details:', error.message);
    return false;
  }
}

async function testErrorHandling() {
  console.log('\n=== Testing Error Handling ===');
  
  // Test with missing parameters
  try {
    await generateSecondRoundResponse(null, mockMessageGroups, mockAgentProfilesData);
    console.log('❌ Should have thrown error for null userMessage');
  } catch (error) {
    console.log('✅ Correctly handled null userMessage');
  }
  
  // Test with invalid agent profiles
  try {
    const invalidProfiles = { agentProfiles: [] };
    await generateSecondRoundResponse("test", mockMessageGroups, invalidProfiles);
    console.log('❌ Should have thrown error for empty agent profiles');
  } catch (error) {
    console.log('✅ Correctly handled invalid agent profiles');
  }
  
  // Test with empty message groups
  try {
    const responses = await generateSecondRoundResponse(
      "test message", 
      [], 
      mockAgentProfilesData
    );
    console.log('✅ Handled empty message groups gracefully');
    console.log('Fallback responses:', responses.length);
  } catch (error) {
    console.error('❌ Error handling empty message groups:', error);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🧪 Starting response3-2.js Tests');
  console.log('=====================================');
  
  const results = [];
  
  // Run all tests
  results.push(await testGetFirstRoundConversationHistory());
  testParseAgentResponses();
  testGetAgentName();
  results.push(await testGenerateSecondRoundResponse());
  await testErrorHandling();
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('================');
  const passedTests = results.filter(Boolean).length;
  const totalTests = results.length;
  console.log(`Passed: ${passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️ Some tests failed. Check the logs above for details.');
  }
}

// Export for use in other files or run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { 
  runAllTests, 
  testGetFirstRoundConversationHistory, 
  testParseAgentResponses, 
  testGetAgentName, 
  testGenerateSecondRoundResponse,
  testErrorHandling,
  mockAgentProfilesData,
  mockMessageGroups
};
