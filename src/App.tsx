//client/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import TaskDashboard from './TaskDashboard'; // your existing tasks view component
import Dashboard from './Dashboard';         // our new analytics dashboard
import ProjectDashboard from './ProjectDashboard';
import ActivityDashboard from './ActivityDashboard';
import './App.css';
import { NavLink } from 'react-router-dom';

function Navigation() {
  const tabs = [
    { to: '/', label: 'Tasks' },
    { to: '/dashboard', label: 'Analytics' },
    { to: '/projects', label: 'Projects' },
    { to: '/activities', label: 'Activities' },
  ];

  return (
    <nav className="main-nav">
      <ul>
        {tabs.map(({ to, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `nav-link${isActive ? ' active' : ''}`
              }
            >
              {label}
            </NavLink>
          </li>
        ))}
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