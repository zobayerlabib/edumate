import React from 'react';
import './App.css'; // Import the CSS file for styling
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';  // Import Header component
import Home from './components/Home';  // Correct path for Home
import Profile from './components/Profile';  // Correct path for Profile

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
        {/* Footer */}
        <footer>
          <p>&copy; 2025 EduMate. All Rights Reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
