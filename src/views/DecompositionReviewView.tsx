import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSessionStore } from '../store/useSessionStore';
import api from '../services/api';

export const DecompositionReviewView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setCurrentStep } = useSessionStore();

  const handleApprove = async () => {
    try {
      await api.put(`/sessions/${id}/services/confirm`, []);
      await api.post(`/sessions/${id}/generate-tests`);
      setCurrentStep(4);
      navigate(`/session/${id}/executing`);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="mt-6 flex flex-col h-[calc(100vh-140px)]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-main-heading">Requirement & Service Decomposition</h2>
        <button onClick={handleApprove} className="btn-orange">
          Approve & Start Generation
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6 flex-1 overflow-hidden">
        <div className="bg-white border border-light-border rounded p-4 overflow-y-auto">
          <h3 className="font-dropdown-label border-b border-light-border pb-2 mb-4">Extracted Rules</h3>
          <div className="p-3 bg-input-bg border border-orange-border rounded mb-3">
            <span className="text-xs font-bold text-primary-orange uppercase">Validation Rule</span>
            <p className="font-instruction-text mt-1 text-sm text-text-primary">User email must not be empty and must be valid format.</p>
          </div>
        </div>

        <div className="bg-white border border-light-border rounded p-4 overflow-y-auto">
          <h3 className="font-dropdown-label border-b border-light-border pb-2 mb-4">Service Contracts & Mocks</h3>
          <div className="p-3 border border-light-border rounded mb-3">
            <h4 className="font-bold text-text-primary">UserService</h4>
            <p className="text-sm text-text-secondary mt-1">Dependencies: UserRepository (Mock)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
