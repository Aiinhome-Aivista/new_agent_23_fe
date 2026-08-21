import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useSessionStore } from '../store/useSessionStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

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
    <Card className="max-w-4xl mx-auto mt-10 p-8 shadow-sm border-light-border">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="font-main-heading">Session History</CardTitle>
      </CardHeader>
      
      {loading ? (
        <p className="text-secondary-text">Loading history...</p>
      ) : sessions.length === 0 ? (
        <p className="text-secondary-text">No sessions found.</p>
      ) : (
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-light-border text-secondary-text font-dropdown-label">
                <TableHead className="py-3 px-4">Session ID</TableHead>
                <TableHead className="py-3 px-4">Session Name</TableHead>
                <TableHead className="py-3 px-4">Created At</TableHead>
                <TableHead className="py-3 px-4">Status</TableHead>
                <TableHead className="py-3 px-4">Tech Profile</TableHead>
                <TableHead className="py-3 px-4 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((s) => (
                <TableRow key={s.session_id} className="border-b border-light-border hover:bg-muted">
                  <TableCell className="py-3 px-4 font-mono text-sm">{s.session_id.substring(0, 8)}...</TableCell>
                  <TableCell className="py-3 px-4 text-sm text-primary-text font-semibold">
                    {s.tech_profile?.session_name || `${s.tech_profile?.language || 'Unknown'} Suite (${s.tech_profile?.framework || 'Unknown'})`}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-sm text-secondary-text">
                    {new Date(s.created_at.endsWith('Z') || s.created_at.includes('+') ? s.created_at : s.created_at + 'Z').toLocaleString()}
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <Badge variant="outline" className="bg-input-bg border-orange-border text-primary-text">
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 px-4 text-sm text-secondary-text">
                    {s.tech_profile?.language} / {s.tech_profile?.framework}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-right">
                    <Button
                      variant="link"
                      onClick={() => handleResume(s.session_id, s.status)}
                      className="text-primary-orange text-sm font-medium p-0 h-auto"
                    >
                      View Workspace
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      )}
    </Card>
  );
};
