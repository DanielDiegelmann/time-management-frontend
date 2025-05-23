// client/src/ProjectDashboard.tsx
// 2025-03-09 15:00:00 (updated with API base URL)

import React, { useEffect, useState } from 'react';
import TaskCard from './TaskCard';
import AddTaskModal from './AddTaskModal';
import EditProjectModal from './EditProjectModal';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import './ProjectCard.css';

interface Project {
  _id: string;
  title: string;
  description?: string;
  aggregatedTime?: number;
  activityId?: string;
}

interface ProjectCardProps {
  project: Project;
  dragHandleProps?: any; // For dedicated drag handle
  // Callbacks for task interactions:
  onToggleStatus: (task: any) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
  onEdit: (id: string, newTitle: string, newNotes: string) => Promise<any>;
  onAddDetailedNote: (id: string, noteText: string) => Promise<any>;
  onStartTimer: (id: string) => Promise<any>;
  onStopTimer: (id: string) => Promise<any>;
  onAssign: (taskId: string, projectId: string) => Promise<any>;
  availableProjects: any[];
  // New callbacks for project editing and deletion:
  onEditProject: (projectId: string, newTitle: string, newDescription: string) => Promise<any>;
  onDeleteProject: (projectId: string) => Promise<any>;
  // NEW: Callback for updating progress in tasks (to be forwarded to TaskCard)
  onUpdateProgress?: (id: string, newProgress: string) => Promise<any>;
  // NEW: Callback for updating goal in tasks
  onUpdateGoal?: (id: string, newGoal: number, goalType: string) => Promise<any>;
  // NEW: Callback for updating rounds in tasks
  onUpdateRounds?: (id: string, newRounds: number) => Promise<any>;
}

export default function ProjectCard({
  project,
  dragHandleProps,
  onToggleStatus,
  onDelete,
  onEdit,
  onAddDetailedNote,
  onStartTimer,
  onStopTimer,
  onAssign,
  availableProjects,
  onEditProject,
  onDeleteProject,
  onUpdateProgress,
  onUpdateGoal,
  onUpdateRounds,
}: ProjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [projectData, setProjectData] = useState(project);

  useEffect(() => {
    setProjectData(project);
  }, [project]);

  // Fetch tasks filtered by projectId
  const fetchTasks = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tasks?projectId=${encodeURIComponent(projectData._id)}`);
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching tasks for project:', err);
    }
  };

  useEffect(() => {
    if (isExpanded) {
      fetchTasks();
    }
  }, [isExpanded, projectData._id]);

  const handleAddTask = async (title: string, description: string, projectId?: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, notes: description, projectId: projectId || projectData._id }),
      });
      const newTask = await res.json();
      setTasks([...tasks, newTask]);
      setShowAddTaskModal(false);
    } catch (err) {
      console.error('Error adding task for project:', err);
    }
  };

  const wrappedToggleStatus = async (task: any) => {
    await onToggleStatus(task);
    fetchTasks();
  };

  const wrappedDelete = async (id: string) => {
    await onDelete(id);
    fetchTasks();
  };

  const wrappedEdit = async (id: string, newTitle: string, newNotes: string) => {
    await onEdit(id, newTitle, newNotes);
    fetchTasks();
  };

  const wrappedAddDetailedNote = async (id: string, noteText: string) => {
    await onAddDetailedNote(id, noteText);
    fetchTasks();
  };

  const wrappedStartTimer = async (id: string) => {
    await onStartTimer(id);
    fetchTasks();
  };

  const wrappedStopTimer = async (id: string) => {
    await onStopTimer(id);
    fetchTasks();
  };

  const wrappedAssign = async (taskId: string, projectId: string) => {
    await onAssign(taskId, projectId);
    fetchTasks();
  };

  const handleTaskDragEnd = (result: any) => {
    if (!result.destination) return;
    const reordered = Array.from(tasks);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setTasks(reordered);
  };

  // Accept three parameters for project editing and update local state after edit.
  const handleProjectEdit = async (
    projectId: string,
    newTitle: string,
    newDescription: string
  ) => {
    const updatedProject = await onEditProject(projectId, newTitle, newDescription);
    if (updatedProject) {
      setProjectData(updatedProject);
    }
  };

  const handleProjectDelete = async (projectId: string) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      await onDeleteProject(projectId);
    }
  };

  return (
    <div className="project-card" data-label="project-card">
      <div className={`project-header ${isExpanded ? "expanded" : ""}`}>
        <div className="options-container">
          <button className="options-btn" onClick={() => setShowOptions(!showOptions)}>
            ⋮
          </button>
          {showOptions && (
            <div className="options-dropdown">
              <button
                onClick={() => {
                  setShowEditProjectModal(true);
                  setShowOptions(false);
                }}
              >
                Edit
              </button>
              <button
                onClick={() => {
                  handleProjectDelete(projectData._id);
                  setShowOptions(false);
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
        <h4 onClick={() => setIsExpanded(!isExpanded)}>{projectData.title}</h4>
        <button className="expand-btn" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? '−' : '+'}
        </button>
        <span className="drag-handle" {...dragHandleProps}></span>
      </div>
      {showEditProjectModal && (
        <EditProjectModal
          activityId={projectData._id}
          initialTitle={projectData.title}
          initialDescription={projectData.description || ""}
          onClose={() => setShowEditProjectModal(false)}
          onSubmit={handleProjectEdit}
        />
      )}
      {isExpanded && (
        <div className="project-body">
          {projectData.description && <p>{projectData.description}</p>}
          <div className="add-task">
            <button onClick={() => setShowAddTaskModal(true)}>Add Task</button>
          </div>
          {showAddTaskModal && (
            <AddTaskModal
              onClose={() => setShowAddTaskModal(false)}
              onSubmit={handleAddTask}
              projects={[]} // For project-specific add, dropdown can be empty
            />
          )}
          <DragDropContext onDragEnd={handleTaskDragEnd}>
            <Droppable droppableId={`taskList-${projectData._id}`}>
              {(provided) => (
                <div className="tasks-list" ref={provided.innerRef} {...provided.droppableProps}>
                  {tasks.map((task, index) => (
                    <Draggable key={task._id} draggableId={String(task._id)} index={index}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.draggableProps}>
                          <TaskCard
                            dragHandleProps={provided.dragHandleProps}
                            task={task}
                            onToggleStatus={wrappedToggleStatus}
                            onDelete={wrappedDelete}
                            onEdit={wrappedEdit}
                            onAddDetailedNote={wrappedAddDetailedNote}
                            onStartTimer={wrappedStartTimer}
                            onStopTimer={wrappedStopTimer}
                            onAssign={wrappedAssign}
                            availableProjects={availableProjects}
                            onUpdateProgress={onUpdateProgress}
                            onUpdateGoal={onUpdateGoal}
                            onUpdateRounds={onUpdateRounds}
                            refreshTasks={fetchTasks}  // Pass refresh function for immediate UI update after assignment
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
    </div>
  );
}