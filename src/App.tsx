//client/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import TaskDashboard from './TaskDashboard'; // your existing tasks view component
import Dashboard from './Dashboard';         // our new analytics dashboard
import ProjectDashboard from './ProjectDashboard';
import ActivityDashboard from './ActivityDashboard';
import './App.css';

function Navigation() {
  return (
    <nav className="main-nav">
      <ul>
        <li><Link to="/">Tasks</Link></li>
        <li><Link to="/dashboard">Analytics</Link></li>
        <li><Link to="/projects">Projects</Link></li>
        <li><Link to="/activities">Activities</Link></li>
      </ul>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navigation />
        <Routes>
          <Route path="/" element={<TaskDashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<ProjectDashboard />} />
          <Route path="/activities" element={<ActivityDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;