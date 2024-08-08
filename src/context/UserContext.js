// imports
import { createContext } from "react";

// create a context
const UserContext = createContext({
  user: null,
  setUser: () => { },
  credentials: null,
  setCredentials: () => { },
});

// export the context
export default UserContext;
