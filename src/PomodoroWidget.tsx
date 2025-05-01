// 2025-03-15 21:00:00 (updated 2025-03-15 21:00:00)
// client/src/PomodoroWidget.tsx

import React, { useState, useEffect } from 'react';
import './PomodoroWidget.css';

export default function PomodoroWidget() {
  const [showModal, setShowModal] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState("work");
  const [workDuration, setWorkDuration] = useState(25 * 60);
  const [breakDuration, setBreakDuration] = useState(5 * 60);
  const [timeLeft, setTimeLeft] = useState(workDuration);

  // Function to log a completed pomodoro session (only for work sessions)
  const logPomodoroSession = async () => {
    try {
      await fetch('/api/pomodoro-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: null }) // pass taskId if needed
      });
    } catch (err) {
      console.error("Error logging pomodoro session", err);
    }
  };

  // Update timeLeft when durations or mode change (and timer is not running)
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(mode === "work" ? workDuration : breakDuration);
    }
  }, [workDuration, breakDuration, mode, isRunning]);

  // Countdown effect
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      // When time runs out, log session if it was a work session and auto-switch mode
      if (mode === "work") {
        logPomodoroSession();
        setMode("break");
        setTimeLeft(breakDuration);
      } else {
        setMode("work");
        setTimeLeft(workDuration);
      }
      setIsRunning(false);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, timeLeft, mode, workDuration, breakDuration]);

  const formatTime = (seconds: number) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  // The modal view with full controls
  const renderModal = () => (
    <div className="pomodoro-modal-overlay" onClick={() => setShowModal(false)}>
      <div className="pomodoro-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Pomodoro Timer</h2>
        <div className="pomodoro-settings">
          <label>
            Work (min):&nbsp;
            <input
              type="number"
              min="1"
              value={Math.floor(workDuration / 60)}
              onChange={(e) => setWorkDuration(Number(e.target.value) * 60)}
            />
          </label>
          <label>
            Break (min):&nbsp;
            <input
              type="number"
              min="1"
              value={Math.floor(breakDuration / 60)}
              onChange={(e) => setBreakDuration(Number(e.target.value) * 60)}
            />
          </label>
        </div>
        <div className="timer-display">{formatTime(timeLeft)}</div>
        <div className="timer-controls">
          {isRunning ? (
            <button onClick={() => setIsRunning(false)}>Pause</button>
          ) : (
            <button onClick={() => setIsRunning(true)}>Start</button>
          )}
          <button onClick={() => {
            setIsRunning(false);
            setTimeLeft(mode === "work" ? workDuration : breakDuration);
          }}>Reset</button>
        </div>
        <p>Mode: {mode === "work" ? "Work" : "Break"}</p>
        <button className="close-modal" onClick={() => setShowModal(false)}>Close</button>
      </div>
    </div>
  );

  // Minimized view when modal is closed and timer is running
  const renderMinimized = () => (
    <div className="pomodoro-minimized" onClick={() => setShowModal(true)}>
      <img src="/tomato-icon.png" alt="Pomodoro" className="tomato-icon" />
      <span>{formatTime(timeLeft)}</span>
    </div>
  );

  return (
    <div className="pomodoro-widget-container">
      {/* When modal is closed and timer not running, show a hovering button */}
      {!showModal && !isRunning && (
        <button className="pomodoro-open-btn" onClick={() => setShowModal(true)}>
          <img src="/tomato-icon.png" alt="Open Pomodoro Timer" />
        </button>
      )}
      {showModal && renderModal()}
      {!showModal && isRunning && renderMinimized()}
    </div>
  );
}
