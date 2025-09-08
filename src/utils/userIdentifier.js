import { v4 as uuidv4 } from 'uuid';

const USER_ID_KEY = 'filterbubble_user_id';

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
