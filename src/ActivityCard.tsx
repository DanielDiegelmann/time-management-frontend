// 2025-03-10 17:05:00
// client/src/ActivityCard.tsx

import React, { useEffect, useState } from 'react';
import ProjectCard from './ProjectCard';
import AddProjectModal from './AddProjectModal';
import EditActivityModal from './EditActivityModal';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import './ActivityCard.css';

interface Activity {
  _id: string;
  title: string;
  description?: string;
  aggregatedTime?: number;
}

interface ActivityCardProps {
  activity: Activity;
  dragHandleProps?: any;
  // Callback functions for task interactions:
  onToggleStatus: (task: any) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
  onEdit: (id: string, newTitle: string, newNotes: string) => Promise<any>;
  onAddDetailedNote: (id: string, noteText: string) => Promise<any>;
  onStartTimer: (id: string) => Promise<any>;
  onStopTimer: (id: string) => Promise<any>;
  onAssign: (taskId: string, projectId: string) => Promise<any>;
  availableProjects: any[];
  // Callbacks for activity editing:
  onEditActivity: (activityId: string, newTitle: string, newDescription: string) => Promise<any>;
  onDeleteActivity: (activityId: string) => Promise<any>;
  // Callbacks for project editing/deletion:
  onEditProject: (projectId: string, newTitle: string, newDescription: string) => Promise<any>;
  onDeleteProject: (projectId: string) => Promise<any>;
  // NEW: Callback for updating progress in tasks (to be forwarded to nested components)
  onUpdateProgress?: (id: string, newProgress: string) => Promise<any>;
  // NEW: Callback for updating goal in tasks
  onUpdateGoal?: (id: string, newGoal: number, goalType: string) => Promise<any>;
  // NEW: Callback for updating rounds in tasks
  onUpdateRounds?: (id: string, newRounds: number) => Promise<any>;
  setActivities: React.Dispatch<React.SetStateAction<any[]>>; // NEW: Added setActivities prop
}

export default function ActivityCard({
  activity,
  dragHandleProps,
  onToggleStatus,
  onDelete,
  onEdit,
  onAddDetailedNote,
  onStartTimer,
  onStopTimer,
  onAssign,
  availableProjects,
  onEditActivity,
  onDeleteActivity,
  onEditProject,
  onDeleteProject,
  onUpdateProgress,
  onUpdateGoal,
  onUpdateRounds,
  setActivities, // NEW: Destructure setActivities prop
}: ActivityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showEditActivityModal, setShowEditActivityModal] = useState(false);
  // NEW: Local state for options dropdown
  const [showOptions, setShowOptions] = useState(false);
  const [error, setError] = useState(''); // NEW: Local state for error handling

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/projects?activityId=${activity._id}`);
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  useEffect(() => {
    if (isExpanded) {
      fetchProjects();
    }
  }, [isExpanded, activity._id]);

  const handleAddProject = async (activityId: string, title: string, description: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, activityId }),
      });
      const newProject = await res.json();
      setProjects([...projects, newProject]);
    } catch (err) {
      console.error('Error adding project:', err);
    }
  };

  // Updated: Remove activityId parameter; use activity._id directly.
  const handleActivityEdit = async (newTitle: string, newDescription: string) => {
    await onEditActivity(activity._id, newTitle, newDescription);
  };

  const handleActivityDelete = async (activityId: string) => {
    if (window.confirm("Are you sure you want to delete this activity?")) {
      setError(''); // Reset error state before deletion
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/activities/${activityId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) {
          setActivities(prev => prev.filter(act => act._id !== activityId));
        } else {
          const errText = await response.text();
          throw new Error(errText);
        }
      } catch (err: any) {
        console.error("Error deleting activity:", err);
        setError(err.message || "Error deleting activity");
      }
    }
  };

  const handleProjectsDragEnd = (result: any) => {
    if (!result.destination) return;
    const reordered = Array.from(projects);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setProjects(reordered);
  };

  return (
    <div className="activity-card" data-label="activity-card">
      <div className={`activity-header ${isExpanded ? "expanded" : ""}`}>
        {/* Options button for Edit/Delete */}
        <div className="options-container">
          <button className="options-btn" onClick={() => setShowOptions(!showOptions)}>
            ⋮
          </button>
          {showOptions && (
            <div className="options-dropdown">
              <button onClick={() => { setShowEditActivityModal(true); setShowOptions(false); }}>
                Edit
              </button>
              <button onClick={() => { handleActivityDelete(activity._id); setShowOptions(false); }}>
                Delete
              </button>
            </div>
          )}
        </div>
        <h3 onClick={() => setIsExpanded(!isExpanded)}>{activity.title}</h3>
        <span className="drag-handle" {...dragHandleProps}></span>
      </div>
      {showEditActivityModal && (
        <EditActivityModal
          initialTitle={activity.title}
          initialDescription={activity.description || ""}
          onClose={() => setShowEditActivityModal(false)}
          onSubmit={handleActivityEdit}
        />
      )}
      {isExpanded && (
        <div className="activity-body">
          {activity.description && <p>{activity.description}</p>}
          <div className="add-project">
            <button onClick={() => setShowAddProjectModal(true)}>Add Project</button>
          </div>
          {showAddProjectModal && (
            <AddProjectModal
              activityId={activity._id}
              onClose={() => setShowAddProjectModal(false)}
              onSubmit={handleAddProject}
            />
          )}
          <DragDropContext onDragEnd={handleProjectsDragEnd}>
            <Droppable droppableId={`projectsList-${activity._id}`}>
              {(provided) => (
                <div className="projects-list" ref={provided.innerRef} {...provided.droppableProps}>
                  {projects.map((project, index) => (
                    <Draggable key={project._id} draggableId={String(project._id)} index={index}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.draggableProps}>
                          <ProjectCard
                            dragHandleProps={provided.dragHandleProps}
                            project={project}
                            onToggleStatus={onToggleStatus}
                            onDelete={onDelete}
                            onEdit={onEdit}
                            onAddDetailedNote={onAddDetailedNote}
                            onStartTimer={onStartTimer}
                            onStopTimer={onStopTimer}
                            onAssign={onAssign}
                            availableProjects={availableProjects}
                            onEditProject={onEditProject}
                            onDeleteProject={onDeleteProject}
                            onUpdateProgress={onUpdateProgress}  // NEW
                            onUpdateGoal={onUpdateGoal}          // NEW
                            onUpdateRounds={onUpdateRounds}      // NEW
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
      )}
      {/* Error message display */}
      {error && <p className="error">{error}</p>}
    </div>
  );
}