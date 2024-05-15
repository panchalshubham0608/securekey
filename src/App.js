import React, { useEffect, useState } from "react";
import "./App.css";
import AddPassKey from "./components/AddPassKey";
import KeysList from "./components/KeysList";
import AuthForm from "./components/AuthForm";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "./utils/firebase";

function App() {
  const [editItem, setEditItem] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    onAuthStateChanged((user) => {
      console.log(user);
      setUser(user);
    });
  }, []);

  return (
    <div className="App">
      <Router>
        <Routes>
          {<Route path="/login" element={user ? <Navigate to="/" /> : <AuthForm register={false} />} />}
          {<Route path="/register" element={user ? <Navigate to="/" /> : <AuthForm register={true} />} />}
          {<Route path="/" element={user ? <KeysList setEditItem={setEditItem} /> : <Navigate to="/login" />} />}
          {<Route path="/add-key" element={user ? <AddPassKey editItem={editItem} setEditItem={setEditItem} /> : <Navigate to="/login" />} />}
        </Routes>
      </Router>
    </div>
  );
}

export default App;
