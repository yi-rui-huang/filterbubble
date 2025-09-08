/**
 * Test file for response3-2-2.js
 * Tests the generateSecondRoundResponse function and its helper functions
 */

import { generateSecondRoundResponse, formatConversationHistory, getAgentName } from './response3-2-2.js';

// Mock data for testing
const mockAgentProfilesData = {
  agentProfiles: [
    {
      agent_id: "Agent A",
      profile_description: "A professional film critic who analyzes movies with technical expertise and industry knowledge."
    },
    {
      agent_id: "Agent B", 
      profile_description: "An independent film enthusiast who values artistic innovation and unique storytelling approaches."
    },
    {
      agent_id: "Agent C",
      profile_description: "A mainstream movie fan who enjoys blockbusters and focuses on entertainment value and audience appeal."
    }
  ]
};

const mockMessageGroups = [
  {
    userMessage: { text: "What do you think about Marvel movies?" },
    agentMessages: [
      { sender: "Agent A", text: "Marvel movies represent a significant shift in modern cinema, with their interconnected universe approach." },
      { sender: "Agent B", text: "While technically impressive, I find them lacking in artistic depth and originality." },
      { sender: "Agent C", text: "I love Marvel movies! They're incredibly entertaining and have amazing action sequences." }
    ]
  },
  {
    userMessage: { text: "How about Christopher Nolan films?" },
    agentMessages: [
      { sender: "Agent A", text: "Nolan is a master of complex narrative structures and practical effects." },
      { sender: "Agent B", text: "His films are intellectually stimulating and push the boundaries of storytelling." }
    ]
  }
];

// Test helper functions
function testHelperFunctions() {
  console.log("=== Testing Helper Functions ===");
  
  // Test getAgentName function
  console.log("Testing getAgentName:");
  console.log("Agent A ->", getAgentName("Agent A")); // Should return "Alex"
  console.log("Agent B ->", getAgentName("Agent B")); // Should return "Ben"
  console.log("Agent C ->", getAgentName("Agent C")); // Should return "Casey"
  console.log("Unknown ->", getAgentName("Unknown")); // Should return "Unknown"
  
  // Test formatConversationHistory function
  console.log("\nTesting formatConversationHistory:");
  const formattedHistory = formatConversationHistory(mockMessageGroups);
  console.log("Formatted history:", JSON.stringify(formattedHistory, null, 2));
  
  console.log("=== Helper Functions Test Complete ===\n");
}

// Test main function with mock API
async function testGenerateSecondRoundResponse() {
  console.log("=== Testing generateSecondRoundResponse ===");
  
  try {
    const userMessage = "What are your thoughts on sci-fi movies like Blade Runner?";
    
    console.log("Input parameters:");
    console.log("- User message:", userMessage);
    console.log("- Message groups count:", mockMessageGroups.length);
    console.log("- Agent profiles count:", mockAgentProfilesData.agentProfiles.length);
    
    const result = await generateSecondRoundResponse(userMessage, mockMessageGroups, mockAgentProfilesData);
    
    console.log("\nResult:");
    console.log("Type:", typeof result);
    console.log("Is array:", Array.isArray(result));
    console.log("Length:", result.length);
    console.log("Content:", JSON.stringify(result, null, 2));
    
    // Validate result structure
    if (Array.isArray(result)) {
      result.forEach((item, index) => {
        console.log(`\nValidating item ${index}:`);
        console.log("- Has agent_id:", 'agent_id' in item);
        console.log("- Has dialogue:", 'dialogue' in item);
        console.log("- Agent ID:", item.agent_id);
        console.log("- Dialogue length:", item.dialogue ? item.dialogue.length : 0);
      });
    }
    
  } catch (error) {
    console.error("Test failed with error:", error.message);
    console.error("Error details:", error);
  }
  
  console.log("=== generateSecondRoundResponse Test Complete ===\n");
}

// Test error handling
async function testErrorHandling() {
  console.log("=== Testing Error Handling ===");
  
  // Test with missing parameters
  console.log("Testing with null userMessage:");
  try {
    const result = await generateSecondRoundResponse(null, mockMessageGroups, mockAgentProfilesData);
    console.log("Result (should be fallback):", result);
  } catch (error) {
    console.log("Error caught:", error.message);
  }
  
  console.log("\nTesting with missing agentProfilesData:");
  try {
    const result = await generateSecondRoundResponse("Test message", mockMessageGroups, null);
    console.log("Result (should be fallback):", result);
  } catch (error) {
    console.log("Error caught:", error.message);
  }
  
  console.log("\nTesting with empty messageGroups:");
  try {
    const result = await generateSecondRoundResponse("Test message", [], mockAgentProfilesData);
    console.log("Result:", result);
  } catch (error) {
    console.log("Error caught:", error.message);
  }
  
  console.log("=== Error Handling Test Complete ===\n");
}

// Test data validation
function testDataValidation() {
  console.log("=== Testing Data Validation ===");
  
  // Test with malformed messageGroups
  const malformedGroups = [
    { userMessage: null, agentMessages: [] },
    { userMessage: { text: "" }, agentMessages: null },
    { userMessage: { text: "Valid message" }, agentMessages: [{ sender: "Agent A" }] } // Missing text
  ];
  
  console.log("Testing with malformed message groups:");
  const formattedHistory = formatConversationHistory(malformedGroups);
  console.log("Formatted history:", JSON.stringify(formattedHistory, null, 2));
  
  // Test with malformed agent profiles
  const malformedProfiles = {
    agentProfiles: [
      { agent_id: "Agent A" }, // Missing profile_description
      { profile_description: "Description without ID" }, // Missing agent_id
      { agent_id: "Agent C", profile_description: "Valid profile" }
    ]
  };
  
  console.log("\nTesting with malformed agent profiles:");
  console.log("Profiles:", JSON.stringify(malformedProfiles, null, 2));
  
  console.log("=== Data Validation Test Complete ===\n");
}

// Performance test
async function testPerformance() {
  console.log("=== Testing Performance ===");
  
  const startTime = Date.now();
  
  try {
    await generateSecondRoundResponse("Performance test message", mockMessageGroups, mockAgentProfilesData);
    const endTime = Date.now();
    console.log(`Execution time: ${endTime - startTime}ms`);
  } catch (error) {
    const endTime = Date.now();
    console.log(`Execution time (with error): ${endTime - startTime}ms`);
    console.log("Error:", error.message);
  }
  
  console.log("=== Performance Test Complete ===\n");
}

// Run all tests
async function runAllTests() {
  console.log("🧪 Starting comprehensive tests for response3-2-2.js\n");
  
  testHelperFunctions();
  await testGenerateSecondRoundResponse();
  await testErrorHandling();
  testDataValidation();
  await testPerformance();
  
  console.log("✅ All tests completed!");
}

// Export test functions for individual testing
export {
  testHelperFunctions,
  testGenerateSecondRoundResponse,
  testErrorHandling,
  testDataValidation,
  testPerformance,
  runAllTests
};

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}
