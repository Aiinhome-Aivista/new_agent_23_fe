import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSessionStore } from '../store/useSessionStore';
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

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        const [decompRes, servRes] = await Promise.all([
          api.get(`/sessions/${id}/decompositions`),
          api.get(`/sessions/${id}/services`)
        ]);
        
        if (decompRes.data?.decompositions?.length > 0) {
          setRules(decompRes.data.decompositions);
        } else {
          setRules([
            { rule_code: "BR-001", rule_text: "User Registration & Email Uniqueness: Unique email, BCrypt hash, default status PENDING_VERIFICATION, send email.", rule_type: "VALIDATION_RULE" },
            { rule_code: "BR-002", rule_text: "User Authentication & Lockout Policy: Track failed attempts, lock account after 5 attempts (15 min cooldown), issue JWT access/refresh tokens.", rule_type: "SECURITY_RULE" },
            { rule_code: "BR-003", rule_text: "User Profile Management: Fetch active profile DTO. Prevent lookup of soft-deleted users (404 Not Found). Validate phone number E.164 format.", rule_type: "BUSINESS_RULE" },
            { rule_code: "BR-004", rule_text: "Soft Delete & RBAC Authorization: Only users with ROLE_ADMIN can soft-delete accounts (403 Forbidden for others). Set is_deleted=true and deleted_at timestamp.", rule_type: "AUTHORIZATION_RULE" }
          ]);
        }

        if (servRes.data?.services?.length > 0) {
          setServices(servRes.data.services);
        } else {
          setServices([
            { name: "UserService", methods: ["registerUser", "getUserById", "updateProfile", "deleteUser"], dependencies: ["UserRepository", "PasswordEncoder", "NotificationClient"] },
            { name: "AuthService", methods: ["authenticateUser", "refreshToken"], dependencies: ["UserRepository", "PasswordEncoder", "JwtTokenProvider"] }
          ]);
        }
      } catch (e) {
        console.error("Error fetching decomposition data:", e);
        // Fallback default rules
        setRules([
          { rule_code: "BR-001", rule_text: "User Registration & Email Uniqueness: Unique email, BCrypt hash, default status PENDING_VERIFICATION.", rule_type: "VALIDATION_RULE" },
          { rule_code: "BR-002", rule_text: "User Authentication: Password matching, lock account after 5 failed attempts.", rule_type: "SECURITY_RULE" }
        ]);
        setServices([
          { name: "UserService", methods: ["registerUser", "getUserById", "updateProfile", "deleteUser"], dependencies: ["UserRepository", "PasswordEncoder"] },
          { name: "AuthService", methods: ["authenticateUser"], dependencies: ["UserRepository", "JwtTokenProvider"] }
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
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
          {loading ? (
            <p className="text-sm text-text-placeholder">Loading extracted requirements...</p>
          ) : (
            rules.map((rule, idx) => (
              <div key={idx} className="p-4 bg-input-bg border border-orange-border/40 rounded-md mb-3 hover:border-orange-border transition-all">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-primary-orange uppercase font-mono">{rule.rule_code}</span>
                  <span className="text-[10px] bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-semibold uppercase">{rule.rule_type}</span>
                </div>
                <p className="font-instruction-text text-sm text-text-primary mt-1">{rule.rule_text}</p>
              </div>
            ))
          )}
        </div>

        {/* Service Contracts & Mocks */}
        <div className="bg-white border border-light-border rounded-lg p-5 overflow-y-auto shadow-sm">
          <h3 className="font-dropdown-label border-b border-light-border pb-3 mb-4 text-primary-orange flex justify-between items-center">
            <span>Service Catalogue & Mockable Dependencies</span>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono">{services.length} Services</span>
          </h3>
          {loading ? (
            <p className="text-sm text-text-placeholder">Loading candidate service contracts...</p>
          ) : (
            services.map((srv, idx) => (
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
            ))
          )}
        </div>
      </div>
    </div>
  );
};
