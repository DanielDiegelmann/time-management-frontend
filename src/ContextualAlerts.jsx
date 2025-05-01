// 2025-03-11 17:00:00 (updated 2025-03-11 20:30:00)
// client/src/ContextualAlerts.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import './ContextualAlerts.css';

function isToday(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export default function ContextualAlerts({ tasks, pomodoroSessions }) {
  const tasksCompletedToday = tasks.filter(
    (task) => task.status === 'completed' && isToday(task.updatedAt)
  ).length;
  const totalTasks = tasks.length;
  const tasksWithGoals = tasks.filter(task => task.goal && task.goal > 0).length;
  const goalsCompleted = tasks.filter(task => task.goal && task.rounds >= task.goal).length;

  return (
    <div className="contextual-alerts">
      <div className="alert-card">
        <h4>Today's Tasks Completed</h4>
        <p>{tasksCompletedToday} / {totalTasks}</p>
      </div>
      <div className="alert-card">
        <h4>Goals Achieved</h4>
        <p>{goalsCompleted} / {tasksWithGoals}</p>
      </div>
      <div className="alert-card">
        <h4>Pomodoro Sessions</h4>
        <p>{pomodoroSessions}</p>
      </div>
      <div className="view-more">
        <Link to="/analytics">View More Analytics</Link>
      </div>
    </div>
  );
}
