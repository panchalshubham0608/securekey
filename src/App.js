import { useState } from "react";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "./App.css";
import AddPassKey from "./components/AddPassKey";
import AuthForm from "./components/AuthForm";
import Home from "./components/Home";
import KeysList from "./components/KeysList";
import UserContext from "./context/UserContext";

function App() {
  const [editItem, setEditItem] = useState(null);
  const [user, setUser] = useState(null);
  const contextValue = { user, setUser };

  return (
    <div className="App">
      <UserContext.Provider value={contextValue}>
        <Router basename="/securekey">
          <Routes>
            {<Route path="/login" element={user ? <Navigate to="/" /> : <AuthForm register={false} />} />}
            {<Route path="/register" element={user ? <Navigate to="/" /> : <AuthForm register={true} />} />}
            {<Route path="/" element={user ? <KeysList setEditItem={setEditItem} /> : <Home />} />}
            {<Route path="/add-key" element={user ? <AddPassKey editItem={editItem} setEditItem={setEditItem} /> : <Navigate to="/login" />} />}
          </Routes>
        </Router>
      </UserContext.Provider>
    </div>
  );
}

export default App;
