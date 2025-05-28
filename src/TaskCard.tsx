// 2025-03-10 17:20:00 (updated 2025-03-11 16:00:00)
// client/src/TaskCard.tsx

import React, { useEffect, useState, useRef, DragEvent } from 'react';
import AssignTaskModal from './AssignTaskModal';
import './TaskCard.css';
import GoalHistoryModal from './GoalHistoryModal';
import MediaGalleryModal from './MediaGalleryModal'; // New component for slideshow

interface Note {
  text: string;
  timestamp: string;
}

interface TimeEntry {
  startTime: string;
  endTime?: string;
  duration?: number;
}

interface ActivityLog {
  action: string;
  details: string;
  timestamp: string;
}

interface Task {
  _id: string;
  title: string;
  notes?: string;
  progress?: string; // Broad progress status
  rounds?: number;  // NEW: Rounds completed
  goal?: number;    // NEW: Target rounds (e.g. per day)
  goalType?: string; // NEW: Frequency (Daily/Weekly/Monthly)
  detailedNotes?: Note[];
  timeEntries?: TimeEntry[];
  activityLogs?: ActivityLog[];
  status: string;
  projectId?: string;
}

interface Project {
  _id: string;
  title: string;
}

interface TaskCardProps {
  task: Task;
  onToggleStatus?: (task: Task) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, newTitle: string, newNotes: string, newProgress?: string) => Promise<any>;
  onUpdateProgress?: (id: string, newProgress: string) => Promise<any>;
  onUpdateGoal?: (id: string, newGoal: number, goalType: string) => Promise<any>;
  onUpdateRounds?: (id: string, newRounds: number) => Promise<any>;
  onAddDetailedNote?: (id: string, noteText: string) => void;
  onStartTimer?: (id: string) => Promise<any>;
  onStopTimer?: (id: string) => Promise<any>;
  onAssign?: (taskId: string, projectId: string) => void;
  availableProjects?: Project[];
  dragHandleProps?: any;
  refreshTasks?: () => void;  // New prop to allow immediate refresh after assignment
}

function EditTaskForm({ task, onEdit, onClose }: { 
  task: Task; 
  onEdit: (id: string, newTitle: string, newNotes: string, newProgress?: string) => Promise<any>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes || '');
  
  useEffect(() => {
    console.log("EditTaskForm syncing task.progress:", task.progress);
    setTitle(task.title);
    setNotes(task.notes || '');
  }, [task]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onEdit(task._id, title, notes, undefined)
      .then(updatedTask => {
        console.log("EditTaskForm updated task progress:", updatedTask?.progress);
      })
      .catch(err => console.error("Error in EditTaskForm onEdit:", err));
    onClose();
  };
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Edit Task</h3>
        <form onSubmit={handleSubmit}>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Task Title" />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Task Description"></textarea>
          <div className="modal-actions">
            <button type="submit">Save</button>
            <button type="button" onClick={onClose} className="secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddDetailedNoteForm({ taskId, onAdd }: { taskId: string; onAdd?: (id: string, noteText: string) => void; }) {
  const [noteText, setNoteText] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (noteText.trim() && onAdd) {
      onAdd(taskId, noteText);
      console.log(`Added detailed note for task ${taskId}: ${noteText}`);
      setNoteText('');
    }
  };
  return (
    <form onSubmit={handleSubmit} className="detailed-note-form">
      <input type="text" placeholder="Add detailed note" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
      <button type="submit">Add Note</button>
    </form>
  );
}

export default function TaskCard({
  task,
  onToggleStatus,
  onDelete,
  onEdit,
  onUpdateProgress,
  onUpdateGoal,
  onUpdateRounds,
  onAddDetailedNote,
  onStartTimer,
  onStopTimer,
  onAssign,
  availableProjects = [],
  dragHandleProps,
  refreshTasks,  // New prop
}: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [localTime, setLocalTime] = useState(0);
  const [progressStatus, setProgressStatus] = useState(task.progress || "Not started");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showGoalHistory, setShowGoalHistory] = useState(false);
  
  // New state for media files (array of image URLs)
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  
  // Local state for rounds, goal, and goalType
  const [rounds, setRounds] = useState(task.rounds !== undefined ? task.rounds : 0);
  const [goal, setGoal] = useState(task.goal !== undefined ? task.goal : 0);
  const [goalType, setGoalType] = useState(task.goalType !== undefined ? task.goalType : "Daily");
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [goalInput, setGoalInput] = useState(goal);

  // Sync goalType when task prop changes
  useEffect(() => {
    setGoalType(task.goalType !== undefined ? task.goalType : "Daily");
  }, [task.goalType]);
  
  useEffect(() => {
    console.log("TaskCard useEffect: syncing progressStatus from task.progress:", task.progress);
    setProgressStatus(task.progress || "Not started");
  }, [task.progress]);
  
  useEffect(() => {
    if (task.timeEntries && task.timeEntries.some(entry => !entry.endTime)) {
      setIsWorking(true);
    } else {
      setIsWorking(false);
    }
  }, [task.timeEntries]);
  
  useEffect(() => {
    setRounds(task.rounds !== undefined ? task.rounds : 0);
  }, [task.rounds]);
  
  useEffect(() => {
    setGoal(task.goal !== undefined ? task.goal : 0);
  }, [task.goal]);

  // Sync initial media URLs (and any backend‐side changes) into local state
  useEffect(() => {
    if (Array.isArray(task.media)) {
      setMediaFiles(task.media);
    }
  }, [task.media]);
  
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
  
  const uploadMediaFile = async (taskId: string, file: File): Promise<string | undefined> => {
    const formData = new FormData();
    formData.append("media", file); // Field name "media"

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tasks/${taskId}/media`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Media upload failed');
      }
      // Expecting updated task document which includes the media array
      const updatedTask = await response.json();
      // Return the URL of the newly added media (assuming it is the last element)
      return updatedTask.media[updatedTask.media.length - 1];
    } catch (error) {
      console.error("Error uploading media:", error);
      return undefined;
    }
  };

  const handleMediaUpload = async (files: FileList) => {
    const uploadedMediaUrls: string[] = [];
    for (const file of Array.from(files)) {
      const url = await uploadMediaFile(task._id, file);
      if (url) {
        uploadedMediaUrls.push(url);
      }
    }
    // Update your state (mediaFiles) with the new URLs from the backend
    setMediaFiles((prev) => [...prev, ...uploadedMediaUrls]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleMediaUpload(e.target.files);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      handleMediaUpload(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleProgressChange = (newProgress: string) => {
    setProgressStatus(newProgress);
    if (onUpdateProgress) {
      onUpdateProgress(task._id, newProgress).catch(err => console.error("Error updating progress:", err));
    } else if (onEdit) {
      onEdit(task._id, task.title, task.notes || "", newProgress).catch(err => console.error("Error updating progress:", err));
    }
  };
  
  const handleWorkingChange = (working: boolean) => {
    if (working && !isWorking) {
      onStartTimer && onStartTimer(task._id).catch(err => console.error(err));
      setIsWorking(true);
      intervalRef.current = setInterval(() => setLocalTime(prev => prev + 1), 1000);
    } else if (!working && isWorking) {
      onStopTimer && onStopTimer(task._id).catch(err => console.error(err));
      setIsWorking(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      setLocalTime(0);
    }
  };

  const handleRoundsIncrement = () => {
    const newRounds = rounds + 1;
    setRounds(newRounds);
    if (onUpdateRounds) {
      onUpdateRounds(task._id, newRounds).catch(err => console.error("Error updating rounds:", err));
    }
  };

  const handleRoundsDecrement = () => {
    if (rounds > 0) {
      const newRounds = rounds - 1;
      setRounds(newRounds);
      if (onUpdateRounds) {
        onUpdateRounds(task._id, newRounds).catch(err => console.error("Error updating rounds:", err));
      }
    }
  };

  const handleGoalUpdate = () => {
    setGoal(goalInput);
    setShowGoalInput(false);
    if (onUpdateGoal) {
      onUpdateGoal(task._id, goalInput, goalType).catch(err => console.error("Error updating goal:", err));
    }
  };

  const handleAssign = async (taskId: string, projectId: string) => {
    if (onAssign) {
      await onAssign(taskId, projectId);
      if (refreshTasks) await refreshTasks();
    }
  };

  return (
    <div className="task-card">
      <div className={`task-header ${isExpanded ? "expanded" : ""}`}>
        {/* Options button on the far left */}
        <div className="options-container">
          <button className="options-btn" onClick={() => setShowOptions(!showOptions)}>
            ⋮
          </button>
          {showOptions && (
            <div className="options-dropdown">
              <button onClick={() => { setShowEdit(true); setShowOptions(false); }}>Edit</button>
              <button onClick={() => { onDelete && onDelete(task._id); setShowOptions(false); }}>Delete</button>
            </div>
          )}
        </div>
        {/* Title */}
        <h3 onClick={() => setIsExpanded(!isExpanded)}>{task.title}</h3>
        {/* Status display */}
        <div className="status-display">
          <span data-label="progress-status">{progressStatus}</span>
          {isWorking && <span data-label="working-status"> Working</span>}
          {(goal > 0 || rounds > 0) && (
            <span data-label="rounds-goal-status">
              {" "}
              | Rounds: {rounds}
              {goal > 0 && ` / ${goal} (${goalType})`}
            </span>
          )}
        </div>
        {/* Expand button */}
        <button className="expand-btn" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? '−' : '+'}
        </button>
        {/* Drag handle at far right */}
        <span className="drag-handle" {...(dragHandleProps || {})}></span>
      </div>
      {isExpanded && (
        <div className="task-body">
          <h4>Description</h4>
          {task.notes && <p className="task-description">{task.notes}</p>}
          
          {/* New Media Upload & Gallery Section */}
          <div className="media-section">
            <h4>Media</h4>
            <div
              className="media-upload-area"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              style={{ border: '2px dashed #FFD500', padding: '1rem', borderRadius: '8px', textAlign: 'center', marginBottom: '1rem' }}
            >
              <p>Drag and drop media files here, or click to upload</p>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
                id={`media-upload-${task._id}`}
              />
              <label htmlFor={`media-upload-${task._id}`} style={{ cursor: 'pointer', color: '#FFD500', fontWeight: 'bold' }}>
                Upload Media
              </label>
            </div>
            {mediaFiles.length > 0 && (
              <div
                className="media-gallery"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                }}
              >
                {mediaFiles.map((src, index) => {
                  console.log("Image URL:", src);
                  return (
                    <img
                      key={index}
                      src={src}
                      alt={`Uploaded media ${index + 1}`}
                      style={{
                        width: '100%',
                        height: 'auto',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        setCurrentMediaIndex(index);
                        setShowMediaModal(true);
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
          {/* End of Media Section */}
          
          {showEdit && onEdit && (
            <EditTaskForm task={task} onEdit={onEdit} onClose={() => setShowEdit(false)} />
          )}
          <div className="progress-toggle">
            <span>Progress:</span>
            <label>
              <input
                type="radio"
                name={`progress-${task._id}`}
                value="Not started"
                checked={progressStatus === "Not started"}
                onChange={(e) => handleProgressChange(e.target.value)}
                data-label="not-started-option"
              />
              Not started
            </label>
            <label>
              <input
                type="radio"
                name={`progress-${task._id}`}
                value="Started"
                checked={progressStatus === "Started"}
                onChange={(e) => handleProgressChange(e.target.value)}
                data-label="started-option"
              />
              Started
            </label>
            <label>
              <input
                type="radio"
                name={`progress-${task._id}`}
                value="On ice"
                checked={progressStatus === "On ice"}
                onChange={(e) => handleProgressChange(e.target.value)}
                data-label="on-ice-option"
              />
              On ice
            </label>
            <label>
              <input
                type="radio"
                name={`progress-${task._id}`}
                value="Completed"
                checked={progressStatus === "Completed"}
                onChange={(e) => handleProgressChange(e.target.value)}
                data-label="completed-option"
              />
              Completed
            </label>
          </div>
          <div className="working-toggle">
            <span>Working Status:</span>
            <label>
              <input
                type="radio"
                name={`working-${task._id}`}
                value="Working"
                checked={isWorking}
                onChange={() => handleWorkingChange(true)}
                data-label="working-option"
              />
              Working
            </label>
            <label>
              <input
                type="radio"
                name={`working-${task._id}`}
                value="Not working"
                checked={!isWorking}
                onChange={() => handleWorkingChange(false)}
                data-label="not-working-option"
              />
              Not working
            </label>
          </div>
          {/* Rounds and Goal section */}
          <div className="rounds-goal" data-label="rounds-goal">
            <div className="rounds-control">
              <span data-label="rounds-display">
                Rounds: {rounds}{goal > 0 ? ` / ${goal}` : ''}
              </span>
              <button data-label="rounds-decrement" onClick={handleRoundsDecrement}>−</button>
              <button data-label="rounds-increment" onClick={handleRoundsIncrement}>+</button>
            </div>
            <div className="goal-control">
              {showGoalInput ? (
                <>
                  <input
                    type="number"
                    value={goalInput}
                    onChange={(e) => setGoalInput(Number(e.target.value))}
                    placeholder="Enter goal"
                    data-label="goal-input"
                  />
                  <select
                    value={goalType}
                    onChange={(e) => setGoalType(e.target.value)}
                    data-label="goal-type"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                  <button data-label="update-goal" onClick={handleGoalUpdate}>Update Goal</button>
                </>
              ) : (
                <button data-label="set-goal" onClick={() => { setGoalInput(goal); setShowGoalInput(true); }}>
                  {goal > 0 ? `Goal (${goalType}): ${goal}` : 'Set Goal'}
                </button>
              )}
            </div>
          </div>
          <div className="goal-history-btn">
            <button onClick={() => setShowGoalHistory(true)}>View Goal History</button>
          </div>
          {showGoalHistory && (
            <GoalHistoryModal taskId={task._id} onClose={() => setShowGoalHistory(false)} />
          )}
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
                    {log.action} - {log.details} <small>({new Date(log.timestamp).toLocaleString()})</small>
                  </li>
                ))}
            </ul>
          </div>
          <div className="assign-task">
            <button onClick={() => setShowAssignModal(true)}>Assign to Project</button>
          </div>
          {showAssignModal && onAssign && (
            <AssignTaskModal
              taskId={task._id}
              currentProjectId={task.projectId || ""}
              projects={availableProjects}
              onClose={() => setShowAssignModal(false)}
              onAssign={handleAssign}
            />
          )}
          {/* End of task-body */}
        </div>
      )}
      {/* Media Gallery Modal */}
      {showMediaModal && (
        <MediaGalleryModal
          mediaFiles={mediaFiles}
          initialIndex={currentMediaIndex}
          onClose={() => setShowMediaModal(false)}
        />
      )}
    </div>
  );
}
