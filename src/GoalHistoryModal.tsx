// 2025-03-10 17:35:00
// client/src/GoalHistoryModal.tsx
// (Renamed display: "Round History" to show each completed round with a timestamp)

import React, { useEffect, useState } from 'react';
import './GoalHistoryModal.css';

interface RoundRecord {
  _id: string;
  round: number;
  timestamp: string;
}

interface GoalHistoryModalProps {
  taskId: string;
  onClose: () => void;
}

export default function GoalHistoryModal({ taskId, onClose }: GoalHistoryModalProps) {
  const [records, setRecords] = useState<RoundRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/round-records?taskId=${taskId}`)
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch round records');
        }
        return res.json();
      })
      .then(data => {
        setRecords(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error in GoalHistoryModal:", err);
        setError(err.message);
        setLoading(false);
      });
  }, [taskId]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="goal-history-modal" onClick={e => e.stopPropagation()}>
        <h3>Round History</h3>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p>Error: {error}</p>
        ) : (
          <ul>
            {records.map(record => (
              <li key={record._id}>
                Round {record.round} completed at {new Date(record.timestamp).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
