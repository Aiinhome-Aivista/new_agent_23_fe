import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSessionStore } from '../store/useSessionStore';
import { AlertTriangle, PlusCircle } from 'lucide-react';
import api from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

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

  const [isAddingRule, setIsAddingRule] = useState(false);
  const [newRule, setNewRule] = useState({ rule_code: '', rule_text: '', rule_type: 'BUSINESS_RULE' });

  const handleAddRule = async () => {
    if (!newRule.rule_code || !newRule.rule_text) return;
    try {
      await api.post(`/sessions/${id}/decompositions`, newRule);
      setRules(prev => [...prev, newRule as DecompositionItem]);
      setNewRule({ rule_code: '', rule_text: '', rule_type: 'BUSINESS_RULE' });
      setIsAddingRule(false);
    } catch (error) {
      console.error("Failed to add rule", error);
    }
  };

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
          if (seconds >= 180) {
            setLoading(false); // Stop loading after 180s timeout
            clearInterval(intervalId);
          }
        }
      } catch (e) {
        console.error("Error fetching decomposition data:", e);
        seconds += 2;
        setTimeElapsed(seconds);
        if (seconds >= 180) {
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
      <Card className="flex flex-col items-center justify-center min-h-[400px] mt-20 p-10 max-w-2xl mx-auto shadow-sm border-light-border">
        <div className="w-16 h-16 border-4 border-primary-orange border-t-transparent rounded-full animate-spin mb-6"></div>
        <h3 className="font-main-heading text-lg font-semibold text-primary-text mb-2 animate-pulse">
          AI Agent is analyzing your codebase and sprint...
        </h3>
        <p className="text-sm text-secondary-text text-center max-w-md">
          Please wait while the LLM parses the requirements, clones the git repository, crawls the source code files, and extracts the target business rules.
        </p>
        <span className="text-xs text-placeholder mt-4 font-mono">Elapsed time: {timeElapsed}s</span>
      </Card>
    );
  }

  // Error/Empty State
  if (rules.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center min-h-[400px] mt-20 p-10 max-w-2xl mx-auto shadow-sm border-light-border">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
        <h3 className="font-main-heading text-lg font-semibold text-primary-text mb-2">
          No business rules extracted
        </h3>
        <p className="text-sm text-secondary-text text-center max-w-md">
          We couldn't extract any business rules from the uploaded sprint artifacts or connected git repository. Please check your repository URL, branch, and sprint files.
        </p>
        <Button onClick={() => navigate(-1)} className="mt-6">
          Go Back
        </Button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-[80vh]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-main-heading">Requirement & Service Decomposition Review</h2>
          <p className="text-sm text-secondary-text">Verify extracted business rules and service mock dependencies before initiating test generation.</p>
        </div>
        <Button onClick={handleApprove} className="shadow-md">
          Approve Boundaries & Start Test Generation
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-6 flex-1 overflow-hidden">
        {/* Extracted Rules */}
        <Card className="p-5 overflow-y-auto shadow-sm border-light-border">
          <h3 className="font-dropdown-label border-b border-light-border pb-3 mb-4 text-primary-orange flex justify-between items-center">
            <span>Extracted Business Rules & Acceptance Criteria</span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setIsAddingRule(!isAddingRule)} className="text-xs px-2 py-0.5 h-auto" leftIcon={<PlusCircle className="w-3 h-3" />}>
                Add Rule
              </Button>
              <Badge variant="warning" className="text-xs px-2 py-0.5 font-mono">{rules.length} Rules</Badge>
            </div>
          </h3>
          
          {isAddingRule && (
            <div className="p-4 bg-secondary border border-primary-orange rounded-md mb-4 shadow-inner">
              <h4 className="text-sm font-bold text-primary-text mb-2">Add Custom Rule</h4>
              <div className="flex gap-2 mb-2">
                <input 
                  type="text" 
                  placeholder="BR-XXX" 
                  className="bg-card text-primary-text text-sm rounded border border-border p-1 w-1/4"
                  value={newRule.rule_code}
                  onChange={(e) => setNewRule({...newRule, rule_code: e.target.value})}
                />
                <select 
                  className="bg-card text-primary-text text-sm rounded border border-border p-1 flex-1"
                  value={newRule.rule_type}
                  onChange={(e) => setNewRule({...newRule, rule_type: e.target.value})}
                >
                  <option value="BUSINESS_RULE">BUSINESS_RULE</option>
                  <option value="VALIDATION_RULE">VALIDATION_RULE</option>
                  <option value="SECURITY_RULE">SECURITY_RULE</option>
                  <option value="AUTHORIZATION_RULE">AUTHORIZATION_RULE</option>
                </select>
              </div>
              <textarea 
                placeholder="Rule Details..." 
                className="bg-card text-primary-text text-sm rounded border border-border p-2 w-full mb-2 h-20"
                value={newRule.rule_text}
                onChange={(e) => setNewRule({...newRule, rule_text: e.target.value})}
              />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="secondary" onClick={() => setIsAddingRule(false)}>Cancel</Button>
                <Button size="sm" onClick={handleAddRule}>Save Rule</Button>
              </div>
            </div>
          )}

          {rules.map((rule, idx) => (
            <div key={idx} className="p-4 bg-card border border-border rounded-md mb-3 hover:border-orange-border transition-all">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-primary-orange uppercase font-mono">{rule.rule_code}</span>
                <span className="text-[10px] bg-muted text-secondary-text px-2 py-0.5 rounded font-semibold uppercase">{rule.rule_type}</span>
              </div>
              <p className="font-instruction-text text-sm text-secondary-text mt-1">{rule.rule_text}</p>
            </div>
          ))}
        </Card>

        {/* Service Contracts & Mocks */}
        <Card className="p-5 overflow-y-auto shadow-sm border-light-border">
          <h3 className="font-dropdown-label border-b border-light-border pb-3 mb-4 text-primary-orange flex justify-between items-center">
            <span>Service Catalogue & Mockable Dependencies</span>
            <Badge variant="info" className="text-xs px-2 py-0.5 font-mono">{services.length} Services</Badge>
          </h3>
          {services.map((srv, idx) => (
            <div key={idx} className="p-4 border border-border rounded-md mb-4 bg-card shadow-xs">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-secondary-text text-base">{srv.name}</h4>
                <Badge variant="success" className="text-xs px-2 py-0.5 uppercase">PROPOSED</Badge>
              </div>
              <div className="mt-3">
                <span className="text-xs font-semibold text-secondary-text uppercase">Target Methods:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {srv.methods?.map((m, mi) => (
                    <span key={mi} className="text-xs font-mono bg-muted text-foreground px-2 py-0.5 rounded border border-border">{m}()</span>
                  ))}
                </div>
              </div>
              <div className="mt-3">
                <span className="text-xs font-semibold text-secondary-text uppercase">Mocked Collaborators:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {srv.dependencies?.map((d, di) => (
                    <span key={di} className="text-xs font-mono bg-secondary text-secondary-foreground px-2 py-0.5 rounded border border-transparent">@{d}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};
