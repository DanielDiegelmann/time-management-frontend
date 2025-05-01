import React, { useEffect, useState } from 'react';
import './Dashboard.css';

function Dashboard() {
  // Filter state (by date)
  const [filter, setFilter] = useState({ startDate: '', endDate: '' });
  // New state: granularity ("daily", "weekly", or "monthly")
  const [granularity, setGranularity] = useState("daily");

  // Dummy analytics data; in a real app, this would come from an API based on filter and granularity.
  const [data, setData] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    totalTimeWorked: 0, // seconds
    pomodoroSessions: 0,
    productivityTrend: [],
    recentActivity: [],
  });

  useEffect(() => {
    // Simulate fetching analytics data based on granularity and filter.
    let dummyData;
    if (granularity === "daily") {
      dummyData = {
        totalTasks: 20,
        completedTasks: 15,
        pendingTasks: 5,
        totalTimeWorked: 3600, // 1 hour
        pomodoroSessions: 8,
        productivityTrend: [
          { date: '2025-02-24', completed: 5 },
        ],
        recentActivity: [
          { action: 'Task Created', detail: 'Created "Daily Report"', timestamp: new Date() },
        ],
      };
    } else if (granularity === "weekly") {
      dummyData = {
        totalTasks: 100,
        completedTasks: 80,
        pendingTasks: 20,
        totalTimeWorked: 18000, // 5 hours
        pomodoroSessions: 30,
        productivityTrend: [
          { date: '2025-02-18', completed: 10 },
          { date: '2025-02-19', completed: 12 },
          { date: '2025-02-20', completed: 15 },
          { date: '2025-02-21', completed: 18 },
          { date: '2025-02-22', completed: 12 },
          { date: '2025-02-23', completed: 15 },
          { date: '2025-02-24', completed: 8 },
        ],
        recentActivity: [
          { action: 'Task Completed', detail: 'Completed "Weekly Report"', timestamp: new Date() },
        ],
      };
    } else { // monthly
      dummyData = {
        totalTasks: 400,
        completedTasks: 350,
        pendingTasks: 50,
        totalTimeWorked: 72000, // 20 hours
        pomodoroSessions: 80,
        productivityTrend: [
          { date: '2025-01', completed: 80 },
          { date: '2025-02', completed: 90 },
          { date: '2025-03', completed: 100 },
          { date: '2025-04', completed: 80 },
        ],
        recentActivity: [
          { action: 'Task Updated', detail: 'Updated "Monthly Budget"', timestamp: new Date() },
        ],
      };
    }
    setData(dummyData);
  }, [filter, granularity]);

  const handleFilterChange = (e) => {
    setFilter({ ...filter, [e.target.name]: e.target.value });
  };

  return (
    <div className="dashboard">
      <h2>Analytics Dashboard</h2>
      <div className="dashboard-filters">
        <label>
          Start Date:
          <input
            type="date"
            name="startDate"
            value={filter.startDate}
            onChange={handleFilterChange}
          />
        </label>
        <label>
          End Date:
          <input
            type="date"
            name="endDate"
            value={filter.endDate}
            onChange={handleFilterChange}
          />
        </label>
      </div>
      <div className="granularity-toggle">
        <button
          className={granularity === "daily" ? "active" : ""}
          onClick={() => setGranularity("daily")}
        >
          Daily
        </button>
        <button
          className={granularity === "weekly" ? "active" : ""}
          onClick={() => setGranularity("weekly")}
        >
          Weekly
        </button>
        <button
          className={granularity === "monthly" ? "active" : ""}
          onClick={() => setGranularity("monthly")}
        >
          Monthly
        </button>
      </div>
      <div className="dashboard-grid">
        <div className="card overview-card">
          <h3>Overview</h3>
          <p><strong>Total Tasks:</strong> {data.totalTasks}</p>
          <p><strong>Completed:</strong> {data.completedTasks}</p>
          <p><strong>Pending:</strong> {data.pendingTasks}</p>
        </div>
        <div className="card time-card">
          <h3>Total Time Worked</h3>
          <p>
            {Math.floor(data.totalTimeWorked / 3600)}h{" "}
            {Math.floor((data.totalTimeWorked % 3600) / 60)}m
          </p>
        </div>
        <div className="card pomodoro-card">
          <h3>Pomodoro Sessions</h3>
          <p>{data.pomodoroSessions} sessions</p>
        </div>
        <div className="card trend-card">
          <h3>Productivity Trend</h3>
          {/* In a full implementation, replace this list with an interactive chart */}
          <ul>
            {data.productivityTrend.map((item, idx) => (
              <li key={idx}>
                {item.date}: {item.completed} tasks completed
              </li>
            ))}
          </ul>
        </div>
        <div className="card activity-card">
          <h3>Recent Activity</h3>
          <ul>
            {data.recentActivity.map((act, idx) => (
              <li key={idx}>
                <strong>{act.action}</strong>: {act.detail}
                <br />
                <small>{new Date(act.timestamp).toLocaleString()}</small>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="insights">
        {data.completedTasks / data.totalTasks < 0.8 && (
          <div className="alert">
            Your completion rate is below 80%. Consider reviewing your priorities.
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
