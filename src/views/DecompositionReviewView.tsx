import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSessionStore } from '../store/useSessionStore';
import { AlertTriangle } from 'lucide-react';
import api from '../services/api';

interface DecompositionItem {
  req_id?: string;
  rule_code: string;
  rule_text: string;
  rule_type: string;
}

interface ServiceItem {
  service_id?: string;
  name: string;
  methods: string[];
  dependencies: string[];
  status?: string;
}

export const DecompositionReviewView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setCurrentStep } = useSessionStore();
  const [rules, setRules] = useState<DecompositionItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    let intervalId: any;
    let seconds = 0;

    async function fetchData() {
      if (!id) return;
      try {
        const [decompRes, servRes] = await Promise.all([
          api.get(`/sessions/${id}/decompositions`),
          api.get(`/sessions/${id}/services`)
        ]);
        
        const hasDecomps = decompRes.data?.decompositions?.length > 0;
        const hasServices = servRes.data?.services?.length > 0;
        
        if (hasDecomps) {
          setRules(decompRes.data.decompositions);
        }
        if (hasServices) {
          setServices(servRes.data.services);
        }
        
        if (hasDecomps && hasServices) {
          setLoading(false);
          clearInterval(intervalId);
        } else {
          seconds += 2;
          setTimeElapsed(seconds);
          if (seconds >= 90) {
            setLoading(false); // Stop loading after 90s timeout
            clearInterval(intervalId);
          }
        }
      } catch (e) {
        console.error("Error fetching decomposition data:", e);
        seconds += 2;
        setTimeElapsed(seconds);
        if (seconds >= 90) {
          setLoading(false);
          clearInterval(intervalId);
        }
      }
    }

    fetchData();
    // Poll every 2 seconds to wait for background process
    intervalId = setInterval(fetchData, 2000);

    return () => clearInterval(intervalId);
  }, [id]);

  const handleApprove = async () => {
    try {
      await api.put(`/sessions/${id}/services/confirm`, []);
      await api.post(`/sessions/${id}/generate-tests`);
      setCurrentStep(4);
      navigate(`/session/${id}/executing`);
    } catch (error) {
      console.error(error);
      setCurrentStep(4);
      navigate(`/session/${id}/executing`);
    }
  };

  // Beautiful Loading Spinner
  if (loading && rules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] mt-20 bg-white border border-light-border rounded-lg p-10 max-w-2xl mx-auto shadow-sm">
        <div className="w-16 h-16 border-4 border-primary-orange border-t-transparent rounded-full animate-spin mb-6"></div>
        <h3 className="font-main-heading text-lg font-semibold text-text-primary mb-2 animate-pulse">
          AI Agent is analyzing your codebase and sprint...
        </h3>
        <p className="text-sm text-text-secondary text-center max-w-md">
          Please wait while the LLM parses the requirements, clones the git repository, crawls the source code files, and extracts the target business rules.
        </p>
        <span className="text-xs text-text-placeholder mt-4 font-mono">Elapsed time: {timeElapsed}s</span>
      </div>
    );
  }

  // Error/Empty State
  if (rules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] mt-20 bg-white border border-light-border rounded-lg p-10 max-w-2xl mx-auto shadow-sm">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
        <h3 className="font-main-heading text-lg font-semibold text-text-primary mb-2">
          No business rules extracted
        </h3>
        <p className="text-sm text-text-secondary text-center max-w-md">
          We couldn't extract any business rules from the uploaded sprint artifacts or connected git repository. Please check your repository URL, branch, and sprint files.
        </p>
        <button onClick={() => navigate(-1)} className="btn-orange mt-6">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col h-[calc(100vh-140px)]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-main-heading">Requirement & Service Decomposition Review</h2>
          <p className="text-sm text-text-secondary">Verify extracted business rules and service mock dependencies before initiating test generation.</p>
        </div>
        <button onClick={handleApprove} className="btn-orange shadow-md">
          Approve Boundaries & Start Test Generation
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6 flex-1 overflow-hidden">
        {/* Extracted Rules */}
        <div className="bg-white border border-light-border rounded-lg p-5 overflow-y-auto shadow-sm">
          <h3 className="font-dropdown-label border-b border-light-border pb-3 mb-4 text-primary-orange flex justify-between items-center">
            <span>Extracted Business Rules & Acceptance Criteria</span>
            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded font-mono">{rules.length} Rules</span>
          </h3>
          {rules.map((rule, idx) => (
            <div key={idx} className="p-4 bg-input-bg border border-orange-border/40 rounded-md mb-3 hover:border-orange-border transition-all">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-primary-orange uppercase font-mono">{rule.rule_code}</span>
                <span className="text-[10px] bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-semibold uppercase">{rule.rule_type}</span>
              </div>
              <p className="font-instruction-text text-sm text-text-primary mt-1">{rule.rule_text}</p>
            </div>
          ))}
        </div>

        {/* Service Contracts & Mocks */}
        <div className="bg-white border border-light-border rounded-lg p-5 overflow-y-auto shadow-sm">
          <h3 className="font-dropdown-label border-b border-light-border pb-3 mb-4 text-primary-orange flex justify-between items-center">
            <span>Service Catalogue & Mockable Dependencies</span>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono">{services.length} Services</span>
          </h3>
          {services.map((srv, idx) => (
            <div key={idx} className="p-4 border border-light-border rounded-md mb-4 bg-white shadow-xs">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-text-primary text-base">{srv.name}</h4>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold uppercase">PROPOSED</span>
              </div>
              <div className="mt-3">
                <span className="text-xs font-semibold text-text-secondary uppercase">Target Methods:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {srv.methods?.map((m, mi) => (
                    <span key={mi} className="text-xs font-mono bg-gray-100 text-gray-800 px-2 py-0.5 rounded border border-gray-200">{m}()</span>
                  ))}
                </div>
              </div>
              <div className="mt-3">
                <span className="text-xs font-semibold text-text-secondary uppercase">Mocked Collaborators:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {srv.dependencies?.map((d, di) => (
                    <span key={di} className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">@{d}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
