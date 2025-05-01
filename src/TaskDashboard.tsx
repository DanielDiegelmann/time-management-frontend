import React, { useEffect, useState, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ContextualAlerts from './ContextualAlerts';
import AddTaskModal from './AddTaskModal';
import AssignTaskModal from './AssignTaskModal'; // For task assignment
import './App.css';

/* Pomodoro Timer Component with Custom Durations */
function PomodoroTimer() {
  const [workDuration, setWorkDuration] = useState(25 * 60);
  const [breakDuration, setBreakDuration] = useState(5 * 60);
  const [timeLeft, setTimeLeft] = useState(workDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState("work");

  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(mode === "work" ? workDuration : breakDuration);
    }
  }, [workDuration, breakDuration, mode, isRunning]);

  useEffect(() => {
    let timer = null;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      if (mode === "work") {
        setMode("break");
        setTimeLeft(breakDuration);
      } else {
        setMode("work");
        setTimeLeft(workDuration);
      }
      setIsRunning(false);
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, mode, workDuration, breakDuration]);

  const formatTime = (seconds: number) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="pomodoro-timer">
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
    </div>
  );
}

/* Edit Task Form (Modal-style) */
function EditTaskForm({ task, onEdit, onClose }: { task: any; onEdit: any; onClose: any; }) {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onEdit(task._id, title, notes);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Edit Task</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Task Title"
          />
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Task Description"
          />
          <div className="modal-actions">
            <button type="submit">Save</button>
            <button type="button" onClick={onClose} className="secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* Form to add a detailed note */
function AddDetailedNoteForm({ taskId, onAdd }: { taskId: string; onAdd: (taskId: string, noteText: string) => void; }) {
  const [noteText, setNoteText] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (noteText.trim()) {
      onAdd(taskId, noteText);
      setNoteText('');
    }
  };
  return (
    <form onSubmit={handleSubmit} className="detailed-note-form">
      <input
        type="text"
        placeholder="Add detailed note"
        value={noteText}
        onChange={(e) => setNoteText(e.target.value)}
      />
      <button type="submit">Add Note</button>
    </form>
  );
}

/* Task Card Component with Working Toggle, Live Timer, and Assignment */
function TaskCard({
  task,
  onToggleStatus,
  onDelete,
  onEdit,
  onAddDetailedNote,
  onStartTimer,
  onStopTimer,
  onAssign,
  availableProjects = [],
}: {
  task: any,
  onToggleStatus: (task: any) => void,
  onDelete: (id: string) => void,
  onEdit: (id: string, title: string, notes: string) => void,
  onAddDetailedNote: (taskId: string, noteText: string) => void,
  onStartTimer: (taskId: string) => void,
  onStopTimer: (taskId: string) => void,
  onAssign: (taskId: string, projectId: string) => void,
  availableProjects?: any[],
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [localTime, setLocalTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const handleWorkingChange = (working: boolean) => {
    if (working && !isWorking) {
      onStartTimer && onStartTimer(task._id);
      setIsWorking(true);
      intervalRef.current = setInterval(() => {
        setLocalTime(prev => prev + 1);
      }, 1000);
    } else if (!working && isWorking) {
      onStopTimer && onStopTimer(task._id);
      setIsWorking(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      setLocalTime(0);
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const formatLocalTime = (seconds: number) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="task-card">
      <div className="task-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>{task.title}</h3>
        <span className={`status ${task.status}`}>
          {task.status === 'completed' ? 'Completed' : 'Active'}
        </span>
        <button className="expand-btn">{isExpanded ? '−' : '+'}</button>
      </div>
      {isExpanded && (
        <div className="task-body">
          <h4>Description</h4>
          {task.notes && <p className="task-description">{task.notes}</p>}
          <div className="actions">
            <button onClick={() => onToggleStatus && onToggleStatus(task)}>
              {task.status === 'completed' ? 'Activate' : 'Complete'}
            </button>
            <button onClick={() => onDelete && onDelete(task._id)} className="secondary">
              Delete
            </button>
            <button onClick={() => setShowEdit(true)} className="secondary">
              Edit
            </button>
          </div>
          {showEdit && (
            <EditTaskForm task={task} onEdit={onEdit} onClose={() => setShowEdit(false)} />
          )}
          <div className="working-toggle">
            <span>Working Status:</span>
            <label>
              <input
                type="radio"
                name={`working-${task._id}`}
                value="working"
                checked={isWorking}
                onChange={() => handleWorkingChange(true)}
              />
              Working
            </label>
            <label>
              <input
                type="radio"
                name={`working-${task._id}`}
                value="not-working"
                checked={!isWorking}
                onChange={() => handleWorkingChange(false)}
              />
              Not Working
            </label>
            {isWorking && (
              <div className="live-timer">
                Time Working: {formatLocalTime(localTime)}
              </div>
            )}
          </div>
          <div className="detailed-section">
            <h4>Detailed Notes</h4>
            <AddDetailedNoteForm taskId={task._id} onAdd={onAddDetailedNote} />
            <ul className="notes-list">
              {task.detailedNotes &&
                task.detailedNotes.map((note, idx) => (
                  <li key={idx}>
                    {note.text} <small>({new Date(note.timestamp).toLocaleString()})</small>
                  </li>
                ))}
            </ul>
          </div>
          <div className="detailed-section">
            <h4>Time Tracking (Backend)</h4>
            <div className="timer-actions">
              <button onClick={() => onStartTimer && onStartTimer(task._id)}>Start Timer</button>
              <button onClick={() => onStopTimer && onStopTimer(task._id)} className="secondary">
                Stop Timer
              </button>
            </div>
            <ul className="timer-list">
              {task.timeEntries &&
                task.timeEntries.map((entry, idx) => (
                  <li key={idx}>
                    {entry.startTime ? new Date(entry.startTime).toLocaleTimeString() : 'N/A'} -{' '}
                    {entry.endTime ? new Date(entry.endTime).toLocaleTimeString() : 'Running'}{' '}
                    {entry.duration ? `(${entry.duration} sec)` : ''}
                  </li>
                ))}
            </ul>
          </div>
          <div className="detailed-section">
            <h4>Activity Logs</h4>
            <ul className="logs-list">
              {task.activityLogs &&
                task.activityLogs.map((log, idx) => (
                  <li key={idx}>
                    {log.action} - {log.details}{' '}
                    <small>({new Date(log.timestamp).toLocaleString()})</small>
                  </li>
                ))}
            </ul>
          </div>
          <div className="assign-task">
            <button onClick={() => setShowAssignModal(true)}>Assign to Project</button>
          </div>
          {showAssignModal && (
            <AssignTaskModal
              taskId={task._id}
              currentProjectId={task.projectId || ""}
              projects={availableProjects}
              onClose={() => setShowAssignModal(false)}
              onAssign={onAssign!}
            />
          )}
        </div>
      )}
    </div>
  );
}

/* Main Task Dashboard Component */
export default function TaskDashboard() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');

  // Fetch tasks (all tasks, or could later add filtering by project if needed)
  const fetchTasks = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tasks`);
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  };

  // Fetch available projects for assignment
  const fetchProjects = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/projects`);
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, []);

  // Inline task creation handler (without project assignment)
  const handleAddTaskInline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTaskTitle, notes: newTaskNotes }),
      });
      const createdTask = await res.json();
      setTasks([...tasks, createdTask]);
      setNewTaskTitle('');
      setNewTaskNotes('');
    } catch (err) {
      console.error('Error creating task:', err);
    }
  };

  // Handler to add task via modal (with optional project assignment)
  const handleAddTaskModal = async (title: string, description: string, projectId?: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, notes: description, projectId }),
      });
      const createdTask = await res.json();
      setTasks([...tasks, createdTask]);
    } catch (err) {
      console.error('Error creating task via modal:', err);
    }
  };

  // Handler to assign a task to a project
  const handleAssignTask = async (taskId: string, projectId: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      const updatedTask = await res.json();
      setTasks(tasks.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
    } catch (err) {
      console.error('Error assigning task:', err);
    }
  };

  // Other CRUD handlers remain unchanged
  const handleDeleteTask = async (id: string) => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tasks/${id}`, { method: 'DELETE' });
      setTasks(tasks.filter((task) => task._id !== id));
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const handleToggleStatus = async (task: any) => {
    const updatedStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tasks/${task._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: updatedStatus }),
      });
      const updatedTask = await res.json();
      setTasks(tasks.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  const handleEditTask = async (taskId: string, newTitle: string, newNotes: string, newProgress?: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, notes: newNotes, progress: newProgress }),
      });
      return await res.json();
    } catch (err) {
      console.error('Error editing task:', err);
    }
  };

  const handleAddDetailedNote = async (taskId: string, noteText: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tasks/${taskId}/detailed-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: noteText }),
      });
      const updatedTask = await res.json();
      setTasks(tasks.map((task) => (task._id === taskId ? updatedTask : task)));
    } catch (err) {
      console.error('Error adding detailed note:', err);
    }
  };

  const handleStartTimer = async (taskId: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tasks/${taskId}/time-entry/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const updatedTask = await res.json();
      setTasks(tasks.map((task) => (task._id === taskId ? updatedTask : task)));
    } catch (err) {
      console.error('Error starting timer:', err);
    }
  };

  const handleStopTimer = async (taskId: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tasks/${taskId}/time-entry/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const updatedTask = await res.json();
      setTasks(tasks.map((task) => (task._id === taskId ? updatedTask : task)));
    } catch (err) {
      console.error('Error stopping timer:', err);
    }
  };

  // Drag & Drop handler: update tasks order in state
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    const reordered = Array.from(tasks);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setTasks(reordered);
  };

  const pomodoroSessions = 5; // Dummy value

  return (
    <div className="dashboard-container">
      <h1>✅ Task Dashboard</h1>
      <ContextualAlerts tasks={tasks} pomodoroSessions={pomodoroSessions} />
      <PomodoroTimer />
      {/* Inline form for quick task addition */}
      <form className="new-task-form" onSubmit={handleAddTaskInline}>
        <input
          type="text"
          placeholder="Task Title"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Task Description"
          value={newTaskNotes}
          onChange={(e) => setNewTaskNotes(e.target.value)}
        />
        <button type="submit">Add Task (Inline)</button>
      </form>
      {/* Button to open modal for task creation with project assignment */}
      <div className="add-task-button-container">
        <button onClick={() => setShowAddTaskModal(true)}>Add Task (Modal)</button>
      </div>
      {showAddTaskModal && (
        <AddTaskModal
          onClose={() => setShowAddTaskModal(false)}
          onSubmit={handleAddTaskModal}
          projects={projects}
        />
      )}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="taskList">
          {(provided) => (
            <div className="task-list" ref={provided.innerRef} {...provided.droppableProps}>
              {tasks.map((task, index) => (
                <Draggable key={task._id} draggableId={String(task._id)} index={index}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                      <TaskCard
                        task={task}
                        onToggleStatus={handleToggleStatus}
                        onDelete={handleDeleteTask}
                        onEdit={handleEditTask}
                        onAddDetailedNote={handleAddDetailedNote}
                        onStartTimer={handleStartTimer}
                        onStopTimer={handleStopTimer}
                        onAssign={handleAssignTask}
                        availableProjects={projects}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}