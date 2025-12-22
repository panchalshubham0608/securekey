import { useState } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "./App.css";
import AuthForm from "./components/AuthForm";
import Dashboard from "./components/Dashboard";
import Home from "./components/Home";
import UserContext from "./context/UserContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";

function App() {
  const [user, setUser] = useState(null);
  const contextValue = { user, setUser };

  return (
    <div className="App">
      <UserContext.Provider value={contextValue}>
        <Router basename="/securekey">
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <AuthForm register={false} />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <AuthForm register={true} />
                </PublicRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/"
              element={
                <PublicRoute><Home /></PublicRoute>
              } />
          </Routes>
        </Router>
      </UserContext.Provider>
    </div>
  );
}

export default App;
