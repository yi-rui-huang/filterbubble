/**
 * Test file for response.js functionality
 */
import { generateAgentConversation } from './response3-1.js';

// Sample test data based on the format described
const sampleMovieData = {
  inProfileMovies: [
    { primaryTitle: "Movie Madness", startYear: "1982", genres: "Comedy" },
    { primaryTitle: "Bird's Eye View - An ET's Solution for Humanity", startYear: "2020", genres: "Comedy" },
    { primaryTitle: "Sex with Love", startYear: "2003", genres: "Comedy" },
    { primaryTitle: "Casomai", startYear: "2002", genres: "Romance" },
    { primaryTitle: "Love You for Now", startYear: "2022", genres: "Romance" },
    { primaryTitle: "For the Sake of a Love", startYear: "1994", genres: "Romance" }
  ],
  outOfProfileMovies: [
    { primaryTitle: "The Remake", startYear: "2023", genres: "Adventure" },
    { primaryTitle: "Kamen Rider Heisei Generations Forever", startYear: "2018", genres: "Adventure" },
    { primaryTitle: "Silent Mission", startYear: "2022", genres: "Adventure" },
    { primaryTitle: "Soreike! Anpanman: Kagayake! Kurun to inochi no hoshi", startYear: "2018", genres: "Animation" },
    { primaryTitle: "Catcher: Cat City 2", startYear: "2007", genres: "Animation" },
    { primaryTitle: "Endless Cookie", startYear: "2025", genres: "Animation" }
  ]
};

const sampleAgentProfiles = [
  {
    agent_id: 'Agent A',
    match_dimension: 'Demographics',
    profile_description: 'This is Alex. Like you, Alex is a Female in the 40-49 age range. Your movie taste and personality might be a bit different from yours.',
    attributes: {}
  },
  {
    agent_id: 'Agent B', 
    match_dimension: 'Interests',
    profile_description: 'This is Ben. Like you, Ben is a big fan of Comedy and Romance movies. Your demographic background and personality might be different from yours.',
    attributes: {}
  },
  {
    agent_id: 'Agent C',
    match_dimension: 'Personality', 
    profile_description: 'This is Casey. Their way of thinking is very similar to yours. Your demographic background and taste in movies might be different from yours.',
    attributes: {}
  }
];

const sampleUserProfile = {
  gender: "Female",
  age_range: "40-49",
  liked_genres: ["Comedy", "Romance"],
  personality: {
    openness: true,
    imagination: true
  }
};

// Test the function (async version)
async function runTest() {
  console.log('Testing generateAgentConversation with LLM API...');
  try {
    const result = await generateAgentConversation(
      sampleMovieData,
      sampleAgentProfiles, 
      sampleUserProfile,
      "relaxing at home after a long day"
    );
    
    console.log('Generated conversation:');
    console.log(JSON.stringify(result, null, 2));
    
    // Validate the result format
    if (Array.isArray(result) && result.length > 0) {
      const hasCorrectFormat = result.every(item => 
        item.agent_id && item.dialogue && typeof item.dialogue === 'string'
      );
      
      if (hasCorrectFormat) {
        console.log('\n✅ Test passed! Conversation generated successfully with correct format.');
        console.log(`Generated ${result.length} agent responses.`);
      } else {
        console.log('\n❌ Test failed! Incorrect format detected.');
      }
    } else {
      console.log('\n❌ Test failed! Result is not a valid array.');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
runTest();
