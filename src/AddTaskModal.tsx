// client/src/AddTaskModal.tsx
import React, { useState } from 'react';
import './AddTaskModal.css';

interface Project {
  _id: string;
  title: string;
}

interface AddTaskModalProps {
  onClose: () => void;
  onSubmit: (title: string, description: string, projectId?: string) => void;
  projects: Project[];
  // Optional: initial values for editing assignment
  initialTitle?: string;
  initialDescription?: string;
  initialProjectId?: string;
}

export default function AddTaskModal({
  onClose,
  onSubmit,
  projects,
  initialTitle = '',
  initialDescription = '',
  initialProjectId = ''
}: AddTaskModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [projectId, setProjectId] = useState(initialProjectId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onSubmit(title, description, projectId || undefined);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>{initialTitle ? "Edit Task Assignment" : "Add New Task"}</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Task Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Task Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <label>
            Assign to Project:
            <select value={projectId} onChange={e => setProjectId(e.target.value)}>
              <option value="">-- Unassigned --</option>
              {projects.map((proj) => (
                <option key={proj._id} value={proj._id}>
                  {proj.title}
                </option>
              ))}
            </select>
          </label>
          <div className="modal-actions">
            <button type="submit">
              {initialTitle ? "Save Changes" : "Add Task"}
            </button>
            <button type="button" onClick={onClose} className="secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

