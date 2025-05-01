// 2025.03.11 15:46
// client/src/AssignTaskModal.tsx

import React, { useState } from 'react';
import './AssignTaskModal.css';

interface Project {
  _id: string;
  title: string;
}

interface AssignTaskModalProps {
  taskId: string;
  currentProjectId?: string;
  projects: Project[];
  onClose: () => void;
  onAssign: (taskId: string, projectId: string) => void;
}

export default function AssignTaskModal({ taskId, currentProjectId = '', projects, onClose, onAssign }: AssignTaskModalProps) {
  const [selectedProject, setSelectedProject] = useState(currentProjectId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProject) {
      onAssign(taskId, selectedProject);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Assign Task to Project</h3>
        <form onSubmit={handleSubmit}>
          <label>
            Select Project:
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <option value="">-- Unassigned --</option>
              {projects.map((proj) => (
                <option key={proj._id} value={proj._id}>
                  {proj.title}
                </option>
              ))}
            </select>
          </label>
          <div className="modal-actions">
            <button type="submit">Assign</button>
            <button type="button" onClick={onClose} className="secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
