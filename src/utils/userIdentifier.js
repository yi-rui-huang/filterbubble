import { v4 as uuidv4 } from 'uuid';

const USER_ID_KEY = 'filterbubble_user_id';
const PROLIFIC_ID_KEY = 'filterbubble_prolific_id';

/**
 * Generates or retrieves a user's unique identifier
 * If a user already has an ID stored in localStorage, it will be returned
 * Otherwise, a new UUID will be generated, stored, and returned
 * @returns {string} The user's unique identifier
 */
export function getUserId() {
  // Check if user already has an ID
  let userId = localStorage.getItem(USER_ID_KEY);
  
  // If no ID exists, generate a new one and store it
  if (!userId) {
    userId = uuidv4();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  
  return userId;
}

/**
 * Gets Prolific ID from URL parameters or localStorage
 * @returns {string|null} The Prolific ID if available
 */
export function getProlificId() {
  // First check localStorage
  let prolificId = localStorage.getItem(PROLIFIC_ID_KEY);
  
  // If not in localStorage, check URL parameters
  if (!prolificId) {
    const urlParams = new URLSearchParams(window.location.search);
    prolificId = urlParams.get('PROLIFIC_PID') || urlParams.get('prolific_pid');
    
    // If found in URL, store it in localStorage
    if (prolificId) {
      localStorage.setItem(PROLIFIC_ID_KEY, prolificId);
    }
  }
  
  return prolificId;
}

/**
 * Sets the Prolific ID manually (useful for testing or manual entry)
 * @param {string} prolificId - The Prolific ID to set
 */
export function setProlificId(prolificId) {
  if (prolificId) {
    localStorage.setItem(PROLIFIC_ID_KEY, prolificId);
  }
}

/**
 * Checks if a Prolific ID exists
 * @returns {boolean} True if a Prolific ID exists, false otherwise
 */
export function hasProlificId() {
  return !!getProlificId();
}

/**
 * Checks if a user ID already exists
 * @returns {boolean} True if a user ID exists, false otherwise
 */
export function hasUserId() {
  return !!localStorage.getItem(USER_ID_KEY);
}

/**
 * Clears the user ID from localStorage (for testing or logout)
 */
export function clearUserId() {
  localStorage.removeItem(USER_ID_KEY);
}

/**
 * Clears the Prolific ID from localStorage (for testing or logout)
 */
export function clearProlificId() {
  localStorage.removeItem(PROLIFIC_ID_KEY);
}

/**
 * Clears both user ID and Prolific ID from localStorage
 */
export function clearAllUserData() {
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(PROLIFIC_ID_KEY);
}
