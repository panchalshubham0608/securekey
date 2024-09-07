// validate user context
const validateUserContext = (userContext) => {
  return new Promise((resolve, reject) => {
    if (!userContext) {
      reject("User context not found");
      return;
    }
    if (!userContext.user) {
      reject("User not found in user context");
      return;
    }
    if (!userContext.user.username) {
      reject("Username not found in user context");
      return;
    }

    if (!userContext.user.password) {
      reject("Password not found in user context");
      return;
    }

    resolve(userContext);
  });
};

export {
  validateUserContext
};

