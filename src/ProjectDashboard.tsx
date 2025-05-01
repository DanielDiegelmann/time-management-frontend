// client/src/ProjectDashboard.tsx
import React, { useEffect, useState } from 'react';
import ProjectCard from './ProjectCard';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import './ProjectDashboard.css';

export default function ProjectDashboard() {
  const [projects, setProjects] = useState([]);

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
    fetchProjects();
  }, []);

  // Drag and drop handler for project cards
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    const reordered = Array.from(projects);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setProjects(reordered);
    // Optionally: persist the new order to your backend.
  };

  // ----------------- Task Callback Functions -----------------
  const handleToggleStatus = async (task: any) => {
    const updatedStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tasks/${task._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: updatedStatus }),
      });
      return await res.json();
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tasks/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Error deleting task:', err);
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
      return await res.json();
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
      return await res.json();
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
      return await res.json();
    } catch (err) {
      console.error('Error stopping timer:', err);
    }
  };

  const handleAssignTask = async (taskId: string, projectId: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      return await res.json();
    } catch (err) {
      console.error('Error assigning task:', err);
    }
  };

  return (
    <div className="dashboard-container">
      <h2>Projects</h2>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="projectsList">
          {(provided) => (
            <div className="projects-list" ref={provided.innerRef} {...provided.droppableProps}>
              {projects.map((project, index) => (
                <Draggable key={project._id} draggableId={String(project._id)} index={index}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.draggableProps}>
                      {/* Pass the dragHandleProps into the ProjectCard */}
                      <ProjectCard
                        dragHandleProps={provided.dragHandleProps}
                        project={project}
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

