// 2025-03-11 16:01:00 (updated with image delete capability)
// This file is part of the Task Management App

import React, { useEffect, useState, useRef, DragEvent } from 'react';
import AssignTaskModal from './AssignTaskModal';
import './TaskCard.css';
import GoalHistoryModal from './GoalHistoryModal';
import MediaGalleryModal from './MediaGalleryModal'; // Component for slideshow

const TASK_CARD_VERSION = "2025-03-11 16:01:00";

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
  progress?: string;
  rounds?: number;
  goal?: number;
  goalType?: string;
  detailedNotes?: Note[];
  timeEntries?: TimeEntry[];
  activityLogs?: ActivityLog[];
  status: string;
  projectId?: string;
  media?: string[];
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
  refreshTasks?: () => void;
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
  refreshTasks,
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
  
  // State for media files (array of image URLs)
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  
  // Local state for rounds, goal, and goalType
  const [rounds, setRounds] = useState(task.rounds !== undefined ? task.rounds : 0);
  const [goal, setGoal] = useState(task.goal !== undefined ? task.goal : 0);
  const [goalType, setGoalType] = useState(task.goalType !== undefined ? task.goalType : "Daily");
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [goalInput, setGoalInput] = useState(goal);

  // New state for checklist items
  const [checklistItems, setChecklistItems] = useState<{ id: string; text: string; completed: boolean }[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');

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
  
  useEffect(() => {
    console.log("TaskCard version:", TASK_CARD_VERSION);
  }, []);
  
  // Upload a media file and return the new image URL from the backend (which uses publicURL)
  const uploadMediaFile = async (taskId: string, file: File): Promise<string | undefined> => {
    const formData = new FormData();
    formData.append("media", file);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tasks/${taskId}/media`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Media upload failed');
      }
      const updatedTask = await response.json();
      return updatedTask.media[updatedTask.media.length - 1];
    } catch (error) {
      console.error("Error uploading media:", error);
      return undefined;
    }
  };

  // Handle multiple file upload
  const handleMediaUpload = async (files: FileList) => {
    const uploadedMediaUrls: string[] = [];
    for (const file of Array.from(files)) {
      const url = await uploadMediaFile(task._id, file);
      if (url) {
        uploadedMediaUrls.push(url);
      }
    }
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

  // New remove image function which calls the DELETE endpoint
  const handleRemoveImage = async (imageUrl: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/tasks/${task._id}/media`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl }),
        }
      );
      if (response.ok) {
        setMediaFiles((prev) => prev.filter((url) => url !== imageUrl));
        console.log("Image removed successfully");
      } else {
        console.error("Failed to remove image:", response.statusText);
      }
    } catch (error) {
      console.error("Error removing image:", error);
    }
  };

  // Handler to add new checklist item
  const handleAddChecklistItem = () => {
    if (newChecklistItem.trim()) {
      const newItem = {
        id: `item-${Date.now()}`,
        text: newChecklistItem.trim(),
        completed: false,
      };
      // Add new item and sort so that uncompleted items are on top.
      const updatedList = [newItem, ...checklistItems].sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));
      setChecklistItems(updatedList);
      setNewChecklistItem('');
    }
  };

  // Handler to toggle completion of a checklist item.
  const handleToggleChecklistItem = (id: string) => {
    const updatedList = checklistItems.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    // Re-sort so that completed items move down
    updatedList.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));
    setChecklistItems(updatedList);
  };

  // Handler to delete a checklist item.
  const handleDeleteChecklistItem = (id: string) => {
    const updatedList = checklistItems.filter(item => item.id !== id);
    setChecklistItems(updatedList);
  };

  return (
    <div className="task-card">
      <div className={`task-header ${isExpanded ? "expanded" : ""}`}>
        <div className="options-container">
          <button className="options-btn" onClick={() => setShowOptions(!showOptions)}>⋮</button>
          {showOptions && (
            <div className="options-dropdown">
              <button onClick={() => { setShowEdit(true); setShowOptions(false); }}>Edit</button>
              <button onClick={() => { onDelete && onDelete(task._id); setShowOptions(false); }}>Delete</button>
            </div>
          )}
        </div>
        <h3 onClick={() => setIsExpanded(!isExpanded)}>{task.title}</h3>
        <div className="status-display">
          <span data-label="progress-status">{progressStatus}</span>
          {isWorking && <span data-label="working-status"> Working</span>}
          {(goal > 0 || rounds > 0) && (
            <span data-label="rounds-goal-status">
              {" "} | Rounds: {rounds}{goal > 0 && ` / ${goal} (${goalType})`}
            </span>
          )}
        </div>
        <button className="expand-btn" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? '−' : '+'}
        </button>
        <span className="drag-handle" {...(dragHandleProps || {})}></span>
      </div>
      {isExpanded && (
        <div className="task-body">
          <h4>Description</h4>
          {task.notes && <p className="task-description">{task.notes}</p>}
          
          {/* Media Upload & Gallery Section */}
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
                  console.log("Using image URL:", src);
                  return (
                    <div key={index} style={{ position: 'relative' }}>
                      <img
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
                      <button
                        onClick={() => handleRemoveImage(src)}
                        style={{
                          position: 'absolute',
                          top: '5px',
                          right: '5px',
                          background: 'red',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          width: '24px',
                          height: '24px',
                        }}
                      >
                        &times;
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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
          {/* --- Begin Checklist Section --- */}
          <div className="checklist-section">
            <h4>Checklist</h4>
            <div className="checklist-add">
              <input 
                type="text" 
                placeholder="Add checklist item" 
                value={newChecklistItem} 
                onChange={(e) => setNewChecklistItem(e.target.value)} 
              />
              <button onClick={handleAddChecklistItem}>Add</button>
            </div>
            {checklistItems.length > 0 && (
              <ul className="checklist-items">
                {checklistItems.map((item) => (
                  <li key={item.id} className={item.completed ? 'completed' : ''}>
                    <input 
                      type="checkbox" 
                      checked={item.completed} 
                      onChange={() => handleToggleChecklistItem(item.id)} 
                    />
                    <span>{item.text}</span>
                    <button onClick={() => handleDeleteChecklistItem(item.id)}>Delete</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* --- End Checklist Section --- */}
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
              <button onClick={() => onStopTimer && onStopTimer(task._id)} className="secondary">Stop Timer</button>
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
