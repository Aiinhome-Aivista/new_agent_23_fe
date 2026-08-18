import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../store/useSessionStore';
import api from '../services/api';
import { TechProfile } from '../types';

export const NewSessionView: React.FC = () => {
  const { register, handleSubmit } = useForm<TechProfile>();
  const navigate = useNavigate();
  const { setSessionId, setCurrentStep, setTechProfile, resetSession } = useSessionStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    resetSession();
  }, [resetSession]);

  const onSubmit = async (data: TechProfile) => {
    setLoading(true);
    try {
      const response = await api.post('/sessions', data);
      setSessionId(response.data.session_id);
      setTechProfile(data);
      setCurrentStep(2);
      navigate(`/session/${response.data.session_id}/upload`);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card rounded shadow-sm border border-light-border p-8 max-w-2xl mx-auto mt-10">
      <h2 className="font-main-heading mb-6">Initialize Test Generation Session</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block font-dropdown-label mb-2">Session Name / Description</label>
          <input
            type="text"
            placeholder="e.g. User Authentication Suite, Ticket KAN-2"
            {...register('session_name')}
            className="w-full input-custom text-sm"
            required
          />
        </div>
        <div>
          <label className="block font-dropdown-label mb-2">Target Language</label>
          <select {...register('language')} className="w-full input-custom font-dropdown-select">
            <option value="Java">Java</option>
            <option value="Python">Python</option>
            <option value="C#">C#</option>
            <option value="TypeScript">TypeScript</option>
          </select>
        </div>
        <div>
          <label className="block font-dropdown-label mb-2">Testing Framework</label>
          <select {...register('framework')} className="w-full input-custom font-dropdown-select">
            <option value="JUnit 5">JUnit 5</option>
            <option value="Pytest">Pytest</option>
            <option value="xUnit">xUnit</option>
            <option value="Jest">Jest</option>
          </select>
        </div>
        <div>
          <label className="block font-dropdown-label mb-2">Mocking Library</label>
          <select {...register('mockLibrary')} className="w-full input-custom font-dropdown-select">
            <option value="Mockito">Mockito</option>
            <option value="pytest-mock">pytest-mock</option>
            <option value="Moq">Moq</option>
            <option value="Sinon">Sinon</option>
          </select>
        </div>
        <div className="pt-4 text-right">
          <button type="submit" disabled={loading} className="btn-orange">
            {loading ? 'Initializing...' : 'Create Session'}
          </button>
        </div>
      </form>
    </div>
  );
};
