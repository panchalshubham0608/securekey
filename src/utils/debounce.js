// Purpose: debounce function to prevent multiple calls to a function in a short period of time.
function debounce(func, delay) {
  let timeoutId;
  return function(...args) {
    const context = this;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(context, args), delay);
  }
}

// Export the debounce function
export default debounce;
