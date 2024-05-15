// imports
import { createContext } from "react";

// create a context
const UserContext = createContext({
  user: null,
  setUser: () => { },
});

// export the context
export default UserContext;
