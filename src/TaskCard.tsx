// 2025-03-11 16:01:00 (updated with image delete capability)
// This file is part of the Task Management App

import React, { useEffect, useState, useRef, DragEvent } from 'react';
import AssignTaskModal from './AssignTaskModal';
import EditTaskForm from './EditTaskForm';
import './TaskCard.css';
import GoalHistoryModal from './GoalHistoryModal';
import MediaGalleryModal from './MediaGalleryModal'; // Component for slideshow
import AddDetailedNoteForm from './AddDetailedNoteForm';

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
  // Basic States
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);  
  const [progressStatus, setProgressStatus] = useState(task.progress || "Not started");
  const [isWorking, setIsWorking] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);
  // Additional states (goal, rounds, checklist, etc.)
  const [rounds, setRounds] = useState(task.rounds !== undefined ? task.rounds : 0);
  const [goal, setGoal] = useState(task.goal !== undefined ? task.goal : 0);
  const [goalType, setGoalType] = useState(task.goalType || "Daily");
  const [checklistItems, setChecklistItems] = useState<{ id: string; text: string; completed: boolean }[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  
  // Modal and other controls
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showGoalHistory, setShowGoalHistory] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // Sync effect hooks…
  useEffect(() => {
    setGoalType(task.goalType || "Daily");
  }, [task.goalType]);

  useEffect(() => {
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

  // Toggle primary expansion (secondary controls are shown)
  const toggleExpansion = () => {
    setIsExpanded(prev => !prev);
  };

  // Toggle details accordion (show/hide data-heavy blocks)
  const toggleDetails = () => {
    setShowDetails(prev => !prev);
  };

  return (
    <div className="task-card">
      {/* Lightweight header view */}
      <div className="task-header">
        <div className="basic-info">
          <h3>{task.title}</h3>
          <div className="status-pill">{progressStatus}</div>
          {isWorking && <div className="status-pill working">Working</div>}
        </div>
        <div className="header-actions">
          <button onClick={toggleExpansion}>
            {isExpanded ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>

      {/* Secondary controls - appear after expansion */}
      {isExpanded && (
        <div className="secondary-controls">
          <div className="controls-row">
            {/* Progress selector, start/stop work, rounds counter, etc. */}
            <button onClick={onToggleStatus ? () => onToggleStatus(task._id) : undefined}>
              Toggle Status
            </button>
            <button onClick={onStartTimer ? () => onStartTimer(task._id) : undefined}>
              Start Timer
            </button>
            <button onClick={onStopTimer ? () => onStopTimer(task._id) : undefined}>
              Stop Timer
            </button>
            {/* Additional secondary control buttons */}
            <span>Rounds: {rounds}</span>
            {/* Placeholder for progress selector, etc. */}
          </div>
          
          {/* Details accordion for data-heavy sections */}
          <div className="details-accordion">
            <button onClick={toggleDetails}>
              {showDetails ? "Hide Details" : "Show Details"}
            </button>
            {showDetails && (
              <div className="details-content">
                {/* Media Gallery */}
                {mediaFiles.length > 0 && (
                  <div className="media-gallery">
                    <button onClick={() => { setShowMediaModal(true); setCurrentMediaIndex(0); }}>
                      View Media Gallery
                    </button>
                  </div>
                )}

                {/* Checklist Section */}
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

                {/* Detailed Notes Section */}
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

                {/* Other data-heavy blocks (logs, goal history, assign modal, etc.) would follow similarly */}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {showMediaModal && (
        <MediaGalleryModal
          mediaFiles={mediaFiles}
          initialIndex={currentMediaIndex}
          onClose={() => setShowMediaModal(false)}
        />
      )}
      {showAssignModal && onAssign && (
        <AssignTaskModal
          taskId={task._id}
          currentProjectId={task.projectId || ""}
          projects={availableProjects}
          onClose={() => setShowAssignModal(false)}
          onAssign={onAssign}
        />
      )}
      {showEdit && onEdit && (
        <EditTaskForm task={task} onEdit={onEdit} onClose={() => setShowEdit(false)} />
      )}
      {showGoalHistory && (
        <GoalHistoryModal taskId={task._id} onClose={() => setShowGoalHistory(false)} />
      )}
    </div>
  );
}
