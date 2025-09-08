/**
 * Debug test script for Agent B movie recommendation issue
 * Run this to test the debugging logs we added to response3-1.js
 */

import { generateAgentConversation } from './response3-1.js';

// Mock data for testing
const mockMovieData = {
  inProfileMovies: [
    { primaryTitle: "The Grand Budapest Hotel", genres: "Comedy,Drama" },
    { primaryTitle: "Amélie", genres: "Comedy,Romance" },
    { primaryTitle: "Spirited Away", genres: "Animation,Family" },
    { primaryTitle: "The Princess Bride", genres: "Adventure,Comedy" },
    { primaryTitle: "Paddington", genres: "Animation,Comedy" },
    { primaryTitle: "My Neighbor Totoro", genres: "Animation,Family" }
  ],
  outOfProfileMovies: [
    { primaryTitle: "Mad Max: Fury Road", genres: "Action,Adventure" },
    { primaryTitle: "The Departed", genres: "Crime,Drama" },
    { primaryTitle: "Inception", genres: "Action,Sci-Fi" },
    { primaryTitle: "Pulp Fiction", genres: "Crime,Drama" },
    { primaryTitle: "The Matrix", genres: "Action,Sci-Fi" },
    { primaryTitle: "Goodfellas", genres: "Biography,Crime" }
  ]
};

const mockAgentProfiles = [
  {
    agent_id: "agent_1",
    match_dimension: "demographic_similarity",
    profile_description: "Shares your age and gender demographics"
  },
  {
    agent_id: "agent_2", 
    match_dimension: "interest_similarity",
    profile_description: "Shares your movie preferences and interests"
  },
  {
    agent_id: "agent_3",
    match_dimension: "personality_similarity", 
    profile_description: "Shares your personality traits and mindset"
  }
];

const mockUserProfile = {
  liked_genres: ["Comedy", "Romance", "Animation"],
  gender: "female",
  age_range: "26-30",
  personality: {
    openness: true,
    imagination: true
  }
};

async function runDebugTest() {
  console.log('=== Starting Debug Test for Agent B Movie Recommendations ===');
  console.log('');
  
  try {
    const result = await generateAgentConversation(
      mockMovieData,
      mockAgentProfiles, 
      mockUserProfile,
      "relaxing at home on a weekend"
    );
    
    console.log('');
    console.log('=== Final Result ===');
    console.log('Generated conversation:', result);
    
    // Check if Agent B's first response contains movie titles
    const agentBResponse = result.find(item => item.agent_id === "Agent B");
    if (agentBResponse) {
      console.log('');
      console.log('=== Agent B Analysis ===');
      console.log('Agent B dialogue:', agentBResponse.dialogue);
      
      const movieTitles = mockMovieData.inProfileMovies.map(m => m.primaryTitle);
      const mentionedMovies = movieTitles.filter(title => 
        agentBResponse.dialogue.includes(title)
      );
      
      console.log('Expected movies:', movieTitles.slice(0, 3));
      console.log('Mentioned movies:', mentionedMovies);
      console.log('Issue detected:', mentionedMovies.length === 0 ? 'YES - No movie titles found' : 'NO - Movie titles found');
    }
    
  } catch (error) {
    console.error('Debug test failed:', error);
  }
}

// Run the test
runDebugTest();
