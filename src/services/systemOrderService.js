/**
 * System Order Service
 * Manages the randomized order of First Round and Second Round conversation systems
 * and tracks user progress through the systems.
 */

/**
 * Determines and stores the system order if not already set
 * @returns {Object} The system order configuration
 */
export function determineSystemOrder() {
  // If order already exists, return it
  const existingOrder = localStorage.getItem('systemOrder');
  if (existingOrder) {
    return JSON.parse(existingOrder);
  }
  
  // Randomly determine whether to show First or Second round first
  const isFirstThenSecond = Math.random() >= 0.5;
  
  const order = {
    isFirstThenSecond,
    currentSystem: isFirstThenSecond ? 'first' : 'second',
    firstCompleted: false,
    secondCompleted: false
  };
  
  // Store the order
  localStorage.setItem('systemOrder', JSON.stringify(order));
  
  return order;
}

/**
 * Gets the current system order
 * @returns {Object} The system order configuration
 */
export function getSystemOrder() {
  const orderStr = localStorage.getItem('systemOrder');
  return orderStr ? JSON.parse(orderStr) : determineSystemOrder();
}

/**
 * Gets the route for the current system
 * @returns {string} The route path for the current system
 */
export function getCurrentSystemRoute() {
  const order = getSystemOrder();
  
  if (order.currentSystem === 'first') {
    return '/first-round';
  } else if (order.currentSystem === 'second') {
    return '/second-round';
  }
  
  return '/final-questionnaire';
}

/**
 * Gets the route for the questionnaire that follows the current system
 * @returns {string} The route path for the appropriate questionnaire
 */
export function getCurrentQuestionnaireRoute() {
  const order = getSystemOrder();
  
  if (order.currentSystem === 'first') {
    return '/first-round-questionnaire';
  } else if (order.currentSystem === 'second') {
    return '/middle-questionnaire';
  }
  
  // If both rounds are completed, go to final questionnaire
  return '/final-questionnaire';
}

/**
 * Marks the current system as completed and advances to the next system
 * @returns {Object} The updated system order
 */
export function completeCurrentSystem() {
  const order = getSystemOrder();
  console.log('Before completion - currentSystem:', order.currentSystem, 'firstCompleted:', order.firstCompleted, 'secondCompleted:', order.secondCompleted);
  
  if (order.currentSystem === 'first') {
    // 标记第一轮为已完成
    order.firstCompleted = true;
  } else if (order.currentSystem === 'second') {
    // 标记第二轮为已完成
    order.secondCompleted = true;
  }
  
  // 检查是否两个系统都完成了
  if (order.firstCompleted && order.secondCompleted) {
    order.currentSystem = 'completed';
  }
  
  console.log('After completion - currentSystem:', order.currentSystem, 'firstCompleted:', order.firstCompleted, 'secondCompleted:', order.secondCompleted);
  localStorage.setItem('systemOrder', JSON.stringify(order));
  return order;
}

/**
 * Gets the next route after completing a questionnaire
 * @returns {string} The route path for the next step in the flow
 */
export function getNextRouteAfterQuestionnaire() {
  const order = getSystemOrder();
  console.log('getNextRouteAfterQuestionnaire - current order state:', order);
  
  // If we've completed both systems, go to final questionnaire
  if (order.firstCompleted && order.secondCompleted) {
    console.log('Both rounds completed, going to final questionnaire');
    order.currentSystem = 'completed';
    localStorage.setItem('systemOrder', JSON.stringify(order));
    return '/final-questionnaire';
  }
  
  // If first round is completed but not second, prepare for second round
  if (order.firstCompleted && !order.secondCompleted) {
    console.log('First round completed, preparing for second round');
    // Mark current system as 'second' to prepare for second round
    order.currentSystem = 'second';
    localStorage.setItem('systemOrder', JSON.stringify(order));
    return '/transition';
  }
  
  // If second round is completed but not first, prepare for first round
  if (!order.firstCompleted && order.secondCompleted) {
    console.log('Second round completed, preparing for first round');
    // Mark current system as 'first' to prepare for first round
    order.currentSystem = 'first';
    localStorage.setItem('systemOrder', JSON.stringify(order));
    return '/transition';
  }
  
  // Default case: determine the next step based on the current system
  console.log('Default case, determining next step based on current system:', order.currentSystem);
  if (order.currentSystem === 'first' || order.currentSystem === 'second') {
    return '/transition';
  }
  
  console.log('Unexpected state, going to initial page');
  return '/';
}

/**
 * Resets the system order (useful for testing or starting over)
 */
export function resetSystemOrder() {
  localStorage.removeItem('systemOrder');
}
