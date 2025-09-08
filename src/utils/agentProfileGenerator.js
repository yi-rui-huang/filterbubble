/**
 * @file agentProfileGenerator.js
 * @description A standalone JavaScript module to generate agent profiles based on user questionnaire data.
 * This module implements the "controlled similarity" logic, where each of the three generated agents
 * matches the user on exactly one of three dimensions: Demographics, Interests, or Personality.
 */

// --- Configuration Constants ---

// A comprehensive list of 28 movie genres based on the IMDB classification.
const ALL_MOVIE_GENRES = [
    "Action", "Adventure", "Animation", "Biography", "Comedy", "Crime", "Documentary", "Drama",
    "Family", "Fantasy", "Film-Noir", "Game-Show", "History", "Horror", "Music", "Musical",
    "Mystery", "News", "Reality-TV", "Romance", "Sci-Fi", "Short", "Sport", "Talk-Show",
    "Thriller", "War", "Western", "Adult"
];
  
  // A list of age ranges to ensure generated mismatched demographics are distinct.
  const ALL_AGE_RANGES = ["18-24", "25-30", "31-39", "40-49", "50+"];
  
  // A list of genders for generating mismatched demographics.
  const ALL_GENDERS = ["Male", "Female", "Other"];
  
  
  // --- Helper Functions ---
  
  /**
   * Calculates the Big Five personality scores from raw Ten-Item Personality Inventory (TIPI) data.
   * @param {object} rawTipi - An object containing the user's 1-7 scores for the 10 TIPI items.
   * @returns {object} An object with the five calculated personality scores (extraversion, agreeableness, etc.).
   */
  export function calculatePersonalityScores(rawTipi) {
    // TIPI items 2, 4, 6, 8, 10 are reverse-scored.
    const reverseScore = (score) => 8 - score;
  
    return {
        extraversion: (rawTipi.tipi_item_1 + reverseScore(rawTipi.tipi_item_6)) / 2,
        agreeableness: (reverseScore(rawTipi.tipi_item_2) + rawTipi.tipi_item_7) / 2,
        conscientiousness: (rawTipi.tipi_item_3 + reverseScore(rawTipi.tipi_item_8)) / 2,
        emotional_stability: (reverseScore(rawTipi.tipi_item_4) + rawTipi.tipi_item_9) / 2,
        openness: (rawTipi.tipi_item_5 + reverseScore(rawTipi.tipi_item_10)) / 2,
    };
  }
  
  /**
   * Generates a mismatched demographics object.
   * @param {object} userDemographics - The user's demographics object.
   * @returns {object} A new demographics object guaranteed to be different from the user's.
   */
  function getMismatchedDemographics(userDemographics) {
    const otherAgeRanges = ALL_AGE_RANGES.filter(r => r !== userDemographics.age_range);
    const otherGenders = ALL_GENDERS.filter(g => g !== userDemographics.gender);
  
    return {
      age_range: otherAgeRanges[Math.floor(Math.random() * otherAgeRanges.length)],
      gender: otherGenders[Math.floor(Math.random() * otherGenders.length)],
    };
  }
  
  /**
   * Generates a mismatched interests object.
   * @param {object} userInterests - The user's interests object.
   * @returns {object} A new interests object with genres different from the user's.
   */
  function getMismatchedInterests(userInterests) {
    const mismatchedGenres = ALL_MOVIE_GENRES.filter(g => !userInterests.liked_genres.includes(g));
  
    // Shuffle and pick 2-3 genres for the mismatched profile
    const shuffled = mismatchedGenres.sort(() => 0.5 - Math.random());
    const count = Math.floor(Math.random() * 2) + 2; // Get 2 or 3 genres
  
    return {
      liked_genres: shuffled.slice(0, count),
    };
  }
  
  /**
   * Generates a mismatched personality scores object.
   * @param {object} userPersonality - The user's calculated personality scores.
   * @returns {object} A new personality scores object with opposite characteristics.
   */
  function getMismatchedPersonality(userPersonality) {
    const mismatched = {};
    for (const trait in userPersonality) {
      // The opposite score on a 1-7 scale is (8 - score).
      mismatched[trait] = 8 - userPersonality[trait];
    }
    return mismatched;
  }
  
  
  // --- Core Profile Generation Function ---
  
  /**
   * Generates three distinct agent profiles based on a user's initial questionnaire data.
   * Each agent matches the user on one dimension and mismatches on the other two.
   * 
   * The input format is designed to align with your questionnaire structure:
   * {
   *   demographics: { age_range: "25-30", gender: "Female" },
   *   interests: { liked_genres: ["Comedy", "Romance", "Animation"] },
   *   personality_raw: { tipi_item_1: 1-7, ..., tipi_item_10: 1-7 }
   * }
   *
   * @param {object} userInputProfile - The user's profile.
   * @param {object} userInputProfile.demographics - User demographics.
   * @param {object} userInputProfile.interests - User interests, including liked_genres.
   * @param {object} userInputProfile.personality_raw - User's raw scores for the 10 TIPI items.
   * @returns {Array<object>} An array containing the three generated agent profiles.
   */
  export function generateAgentProfiles(userInputProfile) {
    // 1. First, process the raw personality data to get the user's scored profile.
    const userPersonalityScored = calculatePersonalityScores(userInputProfile.personality_raw);
  
    const fullUserProfile = {
      demographics: userInputProfile.demographics,
      interests: userInputProfile.interests,
      personality_scored: userPersonalityScored,
    };
  
    // 2. Generate each of the three agents based on the "controlled similarity" principle.
  
    // Agent A: Matches on Demographics, mismatches on Interests and Personality.
    const agentA = {
      agent_id: "Agent A",
      match_dimension: "Demographics",
      profile_description: `This is Alex. Like you, Alex is a ${fullUserProfile.demographics.gender} in the ${fullUserProfile.demographics.age_range} age range. However, their taste in movies and personality might be a bit different from yours.`,
      attributes: {
        demographics: fullUserProfile.demographics, // Match
        interests: getMismatchedInterests(fullUserProfile.interests), // Mismatch
        personality_scored: getMismatchedPersonality(fullUserProfile.personality_scored), // Mismatch
      },
    };
  
    // Agent B: Matches on Interests, mismatches on Demographics and Personality.
    const agentB = {
      agent_id: "Agent B",
      match_dimension: "Interests",
      profile_description: `This is Ben. Like you, Ben is a big fan of ${fullUserProfile.interests.liked_genres.join(" and ")} movies. However, their personal background and personality might be different from yours.`,
      attributes: {
        demographics: getMismatchedDemographics(fullUserProfile.demographics), // Mismatch
        interests: fullUserProfile.interests, // Match
        personality_scored: getMismatchedPersonality(fullUserProfile.personality_scored), // Mismatch
      },
    };
  
    // Agent C: Matches on Personality, mismatches on Demographics and Interests.
    const agentC = {
      agent_id: "Agent C",
      match_dimension: "Personality",
      profile_description: `This is Casey. Their way of thinking is very similar to yours, for example, in terms of Openness and Conscientiousness. However, their personal background and taste in movies might be different from yours.`,
      attributes: {
        demographics: getMismatchedDemographics(fullUserProfile.demographics), // Mismatch
        interests: getMismatchedInterests(fullUserProfile.interests), // Mismatch
        personality_scored: fullUserProfile.personality_scored, // Match
      },
    };
  
    return [agentA, agentB, agentC];
  }
  
  
  // --- Example Usage (for manual testing) ---
  // The following block is disabled by default to avoid executing during bundling/import.
  // Uncomment and run this file with Node to test manually.
  // if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
  //   const sampleUserInput = {
  //     demographics: { age_range: "25-30", gender: "Male" },
  //     interests: { liked_genres: ["Sci-Fi", "Thriller"] },
  //     personality_raw: {
  //       tipi_item_1: 6,
  //       tipi_item_2: 2,
  //       tipi_item_3: 7,
  //       tipi_item_4: 2,
  //       tipi_item_5: 7,
  //       tipi_item_6: 2,
  //       tipi_item_7: 5,
  //       tipi_item_8: 1,
  //       tipi_item_9: 6,
  //       tipi_item_10: 2,
  //     },
  //   };
  //   const generatedAgents = generateAgentProfiles(sampleUserInput);
  //   console.log(JSON.stringify(generatedAgents, null, 2));
  // }
  