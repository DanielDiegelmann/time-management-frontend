import React, { useState } from 'react';
import './AddActivityModal.css';

interface AddActivityModalProps {
  onClose: () => void;
  onActivityAdded: (activity: any) => void;
}

export default function AddActivityModal({ onClose, onActivityAdded }: AddActivityModalProps) {
  const [activityTitle, setActivityTitle] = useState('');
  const [activityDescription, setActivityDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/activities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        // Optional: include a default order value if needed.
        body: JSON.stringify({
          title: activityTitle,
          description: activityDescription,
          order: 0
        })
      });
      
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText);
      }
      
      const newActivity = await response.json();
      onActivityAdded(newActivity);
      onClose();
    } catch (err: any) {
      console.error("Error adding activity:", err);
      setError(err.message || "Error adding activity");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Add Activity</h3>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={activityTitle}
            onChange={(e) => setActivityTitle(e.target.value)}
            placeholder="Activity Title"
            required
          />
          <textarea
            value={activityDescription}
            onChange={(e) => setActivityDescription(e.target.value)}
            placeholder="Activity Description"
          />
          <div className="modal-actions">
            <button type="submit">Create Activity</button>
            <button type="button" onClick={onClose} className="secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
