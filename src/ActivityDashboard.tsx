import React, { useEffect, useState } from 'react';
import ActivityCard from './ActivityCard';
import AddActivityModal from './AddActivityModal';
import ContextualAlerts from './ContextualAlerts';
import PomodoroWidget from './PomodoroWidget';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import './ActivityDashboard.css';

export default function ActivityDashboard() {
  // Activities are used to render the activity cards.
  const [activities, setActivities] = useState<any[]>([]);
  // All tasks are fetched separately to drive the contextual alerts.
  const [allTasks, setAllTasks] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [showAddActivityModal, setShowAddActivityModal] = useState(false);
  const [pomodoroSessions, setPomodoroSessions] = useState(0);

  // Fetch activities (for the Activity cards)
  const fetchActivities = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/activities`);
      const data = await res.json();
      // Sort descending by creation date if available
      if (data && Array.isArray(data)) {
        data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      setActivities(data);
    } catch (err) {
      console.error('Error fetching activities:', err);
    }
  };

  // Fetch all tasks (for the contextual alerts)
  const fetchTasks = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tasks`);
      const data = await res.json();
      setAllTasks(data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  };

  // Fetch all projects (for assignment and editing)
  const fetchProjects = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/projects`);
      const data = await res.json();
      setAllProjects(data);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  // Fetch pomodoro sessions count for today
  const fetchPomodoroSessions = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/pomodoro-sessions?date=${today}`);
      const data = await res.json();
      setPomodoroSessions(data.sessionsCount);
    } catch (err) {
      console.error("Error fetching pomodoro sessions:", err);
    }
  };

  // Optimistic update: add a temporary placeholder right away and then replace it when the real activity is returned
  const handleAddActivity = async (activityData: any) => {
    // Create a temporary activity placeholder with a temporary id and a loading flag
    const tempActivity = {
      _id: `temp-${Date.now()}`,
      title: activityData.title,
      description: activityData.description,
      isLoading: true,
    };
    setActivities(prev => [tempActivity, ...prev]);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityData)
      });
      const newActivity = await res.json();
      // Replace the temporary activity with the real one
      setActivities(prev =>
        prev.map(act => (act._id === tempActivity._id ? newActivity : act))
      );
      return newActivity;
    } catch (err) {
      console.error('Error adding activity:', err);
      // Remove the temporary activity if there was an error
      setActivities(prev => prev.filter(act => act._id !== tempActivity._id));
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchActivities();
    fetchTasks();
    fetchProjects();
    fetchPomodoroSessions();
  }, []);

  // Polling effect for real-time updates of all data points every 5 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchActivities();
      fetchTasks();
      fetchProjects();
      fetchPomodoroSessions();
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  // Drag and drop for activities (if needed)
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    const reordered = Array.from(activities);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setActivities(reordered);
  };

  // --- Project Editing Callbacks ---
  const handleEditProject = async (
    projectId: string,
    newTitle: string,
    newDescription: string
  ) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, description: newDescription }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error);
      }
      const updatedProject = await res.json();
      return updatedProject;
    } catch (err) {
      console.error('Error editing project:', err);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/projects/${projectId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Error deleting project:', err);
    }
  };

  // --- Task Callback Functions ---
  const handleToggleStatus = async (task: any) => {
    const updatedStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tasks/${task._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: updatedStatus }),
      });
      const updatedTask = await res.json();
      setAllTasks(prevTasks =>
        prevTasks.map(t => (t._id === updatedTask._id ? updatedTask : t))
      );
      return updatedTask;
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

  const handleEditTask = async (
    taskId: string,
    newTitle: string,
    newNotes: string,
    newProgress?: string
  ) => {
    const payload: any = { title: newTitle, notes: newNotes };
    if (newProgress !== undefined) {
      payload.progress = newProgress;
    }
    console.log("handleEditTask payload:", payload);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const updatedTask = await res.json();
      console.log("handleEditTask updatedTask:", updatedTask);
      setAllTasks(prevTasks =>
        prevTasks.map(task => (task._id === updatedTask._id ? updatedTask : task))
      );
      return updatedTask;
    } catch (err) {
      console.error('Error editing task:', err);
    }
  };

  const handleUpdateTaskProgress = async (taskId: string, newProgress: string) => {
    const payload = { progress: newProgress };
    console.log("handleUpdateTaskProgress payload:", payload);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const updatedTask = await res.json();
      console.log("handleUpdateTaskProgress updatedTask:", updatedTask);
      setAllTasks(prevTasks =>
        prevTasks.map(task => (task._id === updatedTask._id ? updatedTask : task))
      );
      return updatedTask;
    } catch (err) {
      console.error('Error updating task progress:', err);
    }
  };

  const handleEditActivity = async (
    activityId: string,
    newTitle: string,
    newDescription: string
  ) => {
    try {
      console.log("handleEditActivity", activityId, newTitle, newDescription);
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/activities/${activityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, description: newDescription }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        console.error("Error updating activity:", errorData.error);
        throw new Error(errorData.error);
      }
      const updatedActivity = await res.json();
      setActivities(prev =>
        prev.map(act => (act._id === updatedActivity._id ? updatedActivity : act))
      );
      return updatedActivity;
    } catch (err) {
      console.error('Error editing activity:', err);
    }
  };

  const handleUpdateTaskGoal = async (taskId: string, newGoal: number, newGoalType: string) => {
    const payload = { goal: newGoal, goalType: newGoalType };
    console.log("handleUpdateTaskGoal payload:", payload);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const updatedTask = await res.json();
      console.log("handleUpdateTaskGoal updatedTask:", updatedTask);
      setAllTasks(prevTasks =>
        prevTasks.map(task => (task._id === updatedTask._id ? updatedTask : task))
      );
      return updatedTask;
    } catch (err) {
      console.error('Error updating task goal:', err);
    }
  };

  const handleUpdateTaskRounds = async (taskId: string, newRounds: number) => {
    const payload = { rounds: newRounds };
    console.log("handleUpdateTaskRounds payload:", payload);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const updatedTask = await res.json();
      console.log("handleUpdateTaskRounds updatedTask:", updatedTask);
      setAllTasks(prevTasks =>
        prevTasks.map(task => (task._id === updatedTask._id ? updatedTask : task))
      );
      return updatedTask;
    } catch (err) {
      console.error('Error updating task rounds:', err);
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
      setAllTasks(prev =>
        prev.map(task => (task._id === taskId ? updatedTask : task))
      );
      return updatedTask;
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
      setAllTasks(prev =>
        prev.map(task => (task._id === taskId ? updatedTask : task))
      );
      return updatedTask;
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
      setAllTasks(prev =>
        prev.map(task => (task._id === taskId ? updatedTask : task))
      );
      return updatedTask;
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
      const updatedTask = await res.json();
      setAllTasks(prev =>
        prev.map(task => (task._id === updatedTask._id ? updatedTask : task))
      );
      return updatedTask;
    } catch (err) {
      console.error('Error assigning task:', err);
    }
  };

  // New function to handle activity deletion
  const handleDeleteActivity = async (id: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/activities/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setActivities(prev => prev.filter(act => act._id !== id));
      } else {
        const errText = await res.text();
        throw new Error(errText);
      }
    } catch (err: any) {
      console.error('Error deleting activity:', err);
    }
  };

  return (
    <div className="dashboard-container">
      <h1>Activity Dashboard</h1>
      {/* Contextual Alerts using real tasks and pomodoro sessions */}
      <ContextualAlerts tasks={allTasks} pomodoroSessions={pomodoroSessions} />
      {/* Pomodoro Timer Widget */}
      <PomodoroWidget />
      <div className="add-activity">
        <button onClick={() => setShowAddActivityModal(true)}>New Activity</button>
      </div>
      {showAddActivityModal && (
        <AddActivityModal
          onClose={() => setShowAddActivityModal(false)}
          onSubmit={handleAddActivity}
          onActivityAdded={(newActivity: any) => {
            // In case the modal calls this callback, update state accordingly.
            newActivity.isLoading = false;
            setActivities(prev => [newActivity, ...prev]);
          }}
        />
      )}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="activitiesList">
          {(provided) => (
            <div className="activities-list" ref={provided.innerRef} {...provided.droppableProps}>
              {activities.length === 0 ? (
                <p>No activities found. Add a new activity to get started.</p>
              ) : (
                activities.map((activity, index) => (
                  <Draggable key={activity._id} draggableId={String(activity._id)} index={index}>
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.draggableProps}>
                        <ActivityCard
                          dragHandleProps={provided.dragHandleProps}
                          key={activity._id}
                          activity={activity}
                          onToggleStatus={handleToggleStatus}
                          onDelete={handleDeleteActivity}  // Use handleDeleteActivity here instead of handleDeleteTask
                          onEdit={handleEditTask}
                          onEditActivity={handleEditActivity}
                          onEditProject={handleEditProject}
                          onDeleteProject={handleDeleteProject}
                          onUpdateProgress={handleUpdateTaskProgress}
                          onUpdateGoal={handleUpdateTaskGoal}
                          onUpdateRounds={handleUpdateTaskRounds}
                          onAddDetailedNote={handleAddDetailedNote}
                          onStartTimer={handleStartTimer}
                          onStopTimer={handleStopTimer}
                          onAssign={handleAssignTask}
                          availableProjects={allProjects}
                        />
                      </div>
                    )}
                  </Draggable>
                ))
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}