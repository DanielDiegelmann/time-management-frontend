// client/src/AddProjectModal.tsx
import React, { useState } from 'react';
import './AddProjectModal.css';

interface AddProjectModalProps {
  activityId: string;
  onClose: () => void;
  onSubmit: (activityId: string, title: string, description: string) => void;
}

export default function AddProjectModal({ activityId, onClose, onSubmit }: AddProjectModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onSubmit(activityId, title, description);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Add New Project</h3>
        <form className="form-edit" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Project Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Project Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="modal-actions">
            <button type="submit">Add Project</button>
            <button type="button" onClick={onClose} className="secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
