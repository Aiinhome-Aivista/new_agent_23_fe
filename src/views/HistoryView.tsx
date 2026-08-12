import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useSessionStore } from '../store/useSessionStore';

interface SessionHistory {
  session_id: string;
  status: string;
  tech_profile: any;
  created_at: string;
}

export const HistoryView: React.FC = () => {
  const [sessions, setSessions] = useState<SessionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { setSessionId, setCurrentStep } = useSessionStore();

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await api.get('/sessions');
        setSessions(response.data.sessions);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const handleResume = (session_id: string, status: string) => {
    setSessionId(session_id);
    // Rough heuristic for step resumption
    if (status === 'INITIALIZED') setCurrentStep(2);
    else setCurrentStep(5);
    // Actually we could just direct them to workspace or let them continue
    navigate(`/session/${session_id}/workspace`);
  };

  return (
    <div className="bg-white rounded shadow-sm border border-light-border p-8 max-w-4xl mx-auto mt-10">
      <h2 className="font-main-heading mb-6">Session History</h2>
      
      {loading ? (
        <p className="text-text-secondary">Loading history...</p>
      ) : sessions.length === 0 ? (
        <p className="text-text-secondary">No sessions found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-light-border text-text-secondary font-dropdown-label">
                <th className="py-3 px-4">Session ID</th>
                <th className="py-3 px-4">Created At</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Tech Profile</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.session_id} className="border-b border-light-border hover:bg-[#F9F9F9]">
                  <td className="py-3 px-4 font-mono text-sm">{s.session_id.substring(0, 8)}...</td>
                  <td className="py-3 px-4 text-sm text-text-secondary">
                    {new Date(s.created_at.endsWith('Z') || s.created_at.includes('+') ? s.created_at : s.created_at + 'Z').toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className="bg-input-bg border border-orange-border px-2 py-1 rounded-full text-xs text-text-primary">
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-text-secondary">
                    {s.tech_profile?.language} / {s.tech_profile?.framework}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleResume(s.session_id, s.status)}
                      className="text-primary-orange hover:underline text-sm font-medium"
                    >
                      View Workspace
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
