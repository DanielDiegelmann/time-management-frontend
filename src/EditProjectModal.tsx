// 2025-03-10 18:00:00
// client/src/EditProjectModal.tsx
import React, { useState, useEffect } from 'react';
import './AddProjectModal.css';

interface EditProjectModalProps {
  activityId: string;
  initialTitle: string;
  initialDescription: string;
  onClose: () => void;
  onSubmit: (activityId: string, title: string, description: string) => Promise<any>;
}

export default function EditProjectModal({
  activityId,
  initialTitle,
  initialDescription,
  onClose,
  onSubmit,
}: EditProjectModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);

  useEffect(() => {
    setTitle(initialTitle);
    setDescription(initialDescription);
  }, [initialTitle, initialDescription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      await onSubmit(activityId, title, description);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Edit Project</h3>
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
            <button type="submit">Save Changes</button>
            <button type="button" onClick={onClose} className="secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
