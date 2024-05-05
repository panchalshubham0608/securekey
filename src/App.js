import React, { useState } from 'react';
import './App.css';
import AddPassKey from './components/AddPassKey';
import KeysList from './components/KeysList';

function App() {
  const [selectedWidget, setSelectedWidget] = useState("add-key");
  return (
    <div className="App">
      {selectedWidget === "keys" && <KeysList onAddKey={() => setSelectedWidget("add-key")} />}
      {selectedWidget === "add-key" && <AddPassKey onBack={() => setSelectedWidget("keys")} />}
      <p className="text-center merriweather-light footer">Made with <i className="fa-solid fa-heart"></i> by <a href="https://www.linkedin.com/in/shubham-panchal-18bb6b187/">Shubham!</a></p>
    </div>
  );
}

export default App;
