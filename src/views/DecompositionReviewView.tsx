import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSessionStore } from '../store/useSessionStore';
import { AlertTriangle, PlusCircle, CheckCircle2, ArrowLeft, RefreshCw, Cpu, Sparkles, XCircle, Check, Code2 } from 'lucide-react';
import api from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { MissingCodeModal, MissingItem } from '../components/modals/MissingCodeModal';
import { LanguageMismatchModal, LanguageMismatchData } from '../components/modals/LanguageMismatchModal';
import { StoryFunctionAuditModal, StoryFunctionAnalysisData } from '../components/modals/StoryFunctionAuditModal';

interface DecompositionItem {
  req_id?: string;
  rule_code: string;
  rule_text: string;
  rule_type: string;
  story_name?: string;
  story?: string;
  has_code_mapping?: boolean;
  missing_reason?: string;
  target_code_snippet?: string;
  ai_validation_score?: number;
  ai_feedback?: string;
  alignment_status?: string;
}

interface ServiceItem {
  service_id?: string;
  name: string;
  methods: string[];
  dependencies: string[];
  target_code_snippets?: any[];
  status?: string;
}

interface GapSummary {
  has_missing_items: boolean;
  total_rules: number;
  mapped_rules: number;
  missing_count: number;
  missing_items: MissingItem[];
}

export const DecompositionReviewView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setCurrentStep, setTechProfile, techProfile: storeTechProfile } = useSessionStore();
  const [rules, setRules] = useState<DecompositionItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Missing Code Pop-up State
  const [gapSummary, setGapSummary] = useState<GapSummary | null>(null);
  const [showMissingModal, setShowMissingModal] = useState(false);
  const [hasUserDismissedModal, setHasUserDismissedModal] = useState(false);

  // Language Mismatch Pop-up State
  const [gitError, setGitError] = useState<string | null>(null);
  const [languageMismatch, setLanguageMismatch] = useState<LanguageMismatchData | null>(null);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [hasUserDismissedLangModal, setHasUserDismissedLangModal] = useState(false);
  const [currentTechProfile, setCurrentTechProfile] = useState<any>(storeTechProfile || null);

  // Story Functions & Logic Gap Audit Modal State
  const [storyFunctionAnalysis, setStoryFunctionAnalysis] = useState<StoryFunctionAnalysisData | null>(null);
  const [showStoryFunctionModal, setShowStoryFunctionModal] = useState(false);
  const [isAnalyzingStoryFunctions, setIsAnalyzingStoryFunctions] = useState(false);

  // Custom Rule State & LLM Validation
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [newRule, setNewRule] = useState({ rule_code: '', rule_text: '', rule_type: 'BUSINESS_RULE', story_name: '' });
  const [isValidating, setIsValidating] = useState(false);
  const [isSavingRule, setIsSavingRule] = useState(false);
  const [validationFeedback, setValidationFeedback] = useState<{
    is_valid: boolean;
    alignment_status: string;
    match_score: number;
    feedback: string;
    error_reason?: string;
    suggested_rule_text?: string;
  } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const getPrefixForRuleType = (ruleType: string): string => {
    const normalized = (ruleType || '').toUpperCase().trim();
    if (normalized.includes('VALIDATION')) return 'VR';
    if (normalized.includes('SECURITY')) return 'SR';
    if (normalized.includes('AUTHORIZATION') || normalized.includes('AUTH')) return 'AR';
    if (normalized.includes('INTEGRATION')) return 'IR';
    if (normalized.includes('PERFORMANCE')) return 'PR';
    return 'BR';
  };

  const getNextCodeForType = (ruleType: string, existingRules: DecompositionItem[]): string => {
    const prefix = getPrefixForRuleType(ruleType);
    const regex = new RegExp(`^${prefix}[-_]?(\\d+)`, 'i');
    let maxNum = 0;
    for (const r of existingRules) {
      if (!r.rule_code) continue;
      const match = r.rule_code.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
    return `${prefix}-${String(maxNum + 1).padStart(3, '0')}`;
  };

  const handleRuleTypeChange = (selectedType: string) => {
    const nextCode = getNextCodeForType(selectedType, rules);
    setNewRule(prev => ({
      ...prev,
      rule_type: selectedType,
      rule_code: nextCode
    }));
  };

  const handleOpenAddRule = () => {
    const nextCode = getNextCodeForType('BUSINESS_RULE', rules);
    setNewRule({ rule_code: nextCode, rule_text: '', rule_type: 'BUSINESS_RULE', story_name: '' });
    setValidationError(null);
    setValidationFeedback(null);
    setIsAddingRule(true);
  };

  const handleValidateRule = async () => {
    const ruleToValidate = {
      ...newRule,
      rule_code: newRule.rule_code || getNextCodeForType(newRule.rule_type, rules)
    };
    if (!ruleToValidate.rule_text) return;
    setIsValidating(true);
    setValidationError(null);
    setValidationFeedback(null);
    try {
      const res = await api.post(`/sessions/${id}/decompositions/validate`, ruleToValidate);
      setValidationFeedback(res.data);
      if (res.data?.auto_rule_code) {
        setNewRule(prev => ({ ...prev, rule_code: res.data.auto_rule_code }));
      }
      if (!res.data.is_valid) {
        setValidationError(res.data.error_reason || res.data.feedback || "Rule is invalid or does not match the uploaded story.");
      }
    } catch (err: any) {
      console.error("Validation error:", err);
      const detail = err.response?.data?.detail;
      setValidationError(detail?.error_reason || detail?.message || "Validation failed.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleAddRule = async () => {
    const ruleToSend = {
      ...newRule,
      rule_code: newRule.rule_code || getNextCodeForType(newRule.rule_type, rules)
    };
    if (!ruleToSend.rule_text) return;
    setIsSavingRule(true);
    setValidationError(null);
    try {
      const res = await api.post(`/sessions/${id}/decompositions`, ruleToSend);
      const addedRule = res.data?.rule || { ...ruleToSend, has_code_mapping: true };
      setRules(prev => [...prev, addedRule as DecompositionItem]);
      setNewRule({ rule_code: '', rule_text: '', rule_type: 'BUSINESS_RULE', story_name: '' });
      setValidationFeedback(null);
      setValidationError(null);
      setIsAddingRule(false);
    } catch (error: any) {
      console.error("Failed to add rule:", error);
      const detail = error.response?.data?.detail;
      const errMsg = detail?.error_reason || detail?.message || "Rule is invalid or contradicts uploaded story requirements. Rule was NOT added.";
      setValidationError(errMsg);
      if (detail) {
        setValidationFeedback({
          is_valid: false,
          alignment_status: detail.alignment_status || 'MISMATCH_DETECTED',
          match_score: detail.match_score || 0,
          feedback: detail.feedback || errMsg,
          error_reason: errMsg,
          suggested_rule_text: detail.suggested_rule_text
        });
      }
    } finally {
      setIsSavingRule(false);
    }
  };

  const handleAutoSwitchLanguage = async (language: string, framework: string, mockLibrary: string) => {
    try {
      await api.put(`/sessions/${id}/tech-profile`, {
        language,
        framework,
        mockLibrary
      });
      const updated = { language, framework, mockLibrary };
      setCurrentTechProfile(updated);
      setTechProfile(updated);
      setLanguageMismatch(prev => prev ? { ...prev, is_mismatch: false, selected_language: language, selected_framework: framework, selected_mock_library: mockLibrary } : null);
      setShowLanguageModal(false);
      setHasUserDismissedLangModal(true);
    } catch (error) {
      console.error("Failed to auto-switch language:", error);
    }
  };

  const handleCustomUpdateLanguage = async (profile: { language: string; framework: string; mockLibrary: string }) => {
    try {
      await api.put(`/sessions/${id}/tech-profile`, profile);
      setCurrentTechProfile(profile);
      setTechProfile(profile);
      setLanguageMismatch(prev => prev ? { ...prev, is_mismatch: false, selected_language: profile.language, selected_framework: profile.framework, selected_mock_library: profile.mockLibrary } : null);
      setShowLanguageModal(false);
      setHasUserDismissedLangModal(true);
    } catch (error) {
      console.error("Failed to update language:", error);
    }
  };

  const handleReAnalyzeStoryFunctions = async () => {
    if (!id) return;
    setIsAnalyzingStoryFunctions(true);
    try {
      const res = await api.post(`/sessions/${id}/story-function-analysis`);
      if (res.data) {
        setStoryFunctionAnalysis(res.data);
      }
    } catch (err) {
      console.error("Failed to re-analyze story functions:", err);
    } finally {
      setIsAnalyzingStoryFunctions(false);
    }
  };

  const handleOpenStoryFunctionModal = async () => {
    setShowStoryFunctionModal(true);
    if (!storyFunctionAnalysis && id) {
      setIsAnalyzingStoryFunctions(true);
      try {
        const res = await api.get(`/sessions/${id}/story-function-analysis`);
        if (res.data) {
          setStoryFunctionAnalysis(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch story function analysis:", err);
      } finally {
        setIsAnalyzingStoryFunctions(false);
      }
    }
  };

  useEffect(() => {
    let intervalId: any;
    let seconds = 0;
    let missingModalTriggered = false;
    let langModalTriggered = false;

    async function fetchData() {
      if (!id) return;
      try {
        const [decompRes, servRes] = await Promise.all([
          api.get(`/sessions/${id}/decompositions`),
          api.get(`/sessions/${id}/services`)
        ]);

        const hasDecomps = decompRes.data?.decompositions?.length > 0;
        const hasServices = servRes.data?.services?.length > 0;

        if (decompRes.data?.tech_profile) {
          setCurrentTechProfile(decompRes.data.tech_profile);
          if (decompRes.data.tech_profile.story_function_analysis) {
            setStoryFunctionAnalysis(decompRes.data.tech_profile.story_function_analysis);
          }
          if (decompRes.data.tech_profile.git_error) {
            setGitError(decompRes.data.tech_profile.git_error);
            setLoading(false);
            clearInterval(intervalId);
            return;
          }
        }

        // Language Mismatch Detection & Pop-up Trigger
        if (decompRes.data?.language_mismatch) {
          setLanguageMismatch(decompRes.data.language_mismatch);
          if (decompRes.data.language_mismatch.is_mismatch && !langModalTriggered && !hasUserDismissedLangModal) {
            setShowLanguageModal(true);
            langModalTriggered = true;
          }
        }

        if (hasDecomps) {
          setRules(decompRes.data.decompositions);
          if (decompRes.data.gap_summary) {
            setGapSummary(decompRes.data.gap_summary);

            // Auto-trigger missing code modal if items exist and hasn't been dismissed
            if (decompRes.data.gap_summary.has_missing_items && !missingModalTriggered && !hasUserDismissedModal) {
              // If language modal is not open, open missing modal
              if (!decompRes.data?.language_mismatch?.is_mismatch) {
                setShowMissingModal(true);
                missingModalTriggered = true;
              }
            }
          }
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
  }, [id, hasUserDismissedModal, hasUserDismissedLangModal]);

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

  // Modals for loading, error, and empty states
  let overlayModal = null;

  if (loading && rules.length === 0) {
    overlayModal = (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-xl">
        <Card className="flex flex-col items-center justify-center p-10 max-w-2xl mx-auto shadow-2xl border-border bg-card">
          <div className="w-16 h-16 border-4 border-primary-orange border-t-transparent rounded-full animate-spin mb-6"></div>
          <h3 className="font-main-heading text-lg font-semibold text-foreground mb-2 animate-pulse">
            AI Agent is analyzing your codebase and sprint...
          </h3>
          <p className="text-sm text-secondary-text text-center max-w-md">
            Please wait while the LLM parses the requirements, clones the git repository, crawls the source code files, and extracts the target business rules.
          </p>
          <span className="text-xs text-placeholder mt-4 font-mono">Elapsed time: {timeElapsed}s</span>
        </Card>
      </div>
    );
  } else if (gitError) {
    overlayModal = (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-xl">
        <Card className="flex flex-col items-center justify-center p-10 max-w-2xl mx-auto shadow-2xl border-2 border-red-500/50 bg-red-500/5">
          <div className="p-3 bg-red-100 dark:bg-red-950/70 border border-red-300 rounded-full text-red-600 mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 animate-pulse" />
          </div>
          <h3 className="font-main-heading text-xl font-bold text-red-600 dark:text-red-400 mb-2">
            Git Repository Error Detected
          </h3>
          <p className="text-xs text-primary-text text-center max-w-md bg-card p-3 rounded border border-red-200 font-mono my-2 leading-relaxed">
            {gitError}
          </p>
          <p className="text-xs text-secondary-text text-center max-w-md mt-1">
            Please check that your Git repository URL is correct, the branch name (e.g. main/master) exists, and authentication tokens (if private) are valid.
          </p>
          <Button onClick={() => navigate(`/session/${id}/upload`)} className="mt-6 bg-primary-orange hover:bg-hover-orange">
            <ArrowLeft className="w-4 h-4 mr-1" /> Go Back to Upload & Fix Git Settings
          </Button>
        </Card>
      </div>
    );
  } else if (rules.length === 0) {
    overlayModal = (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-xl">
        <Card className="flex flex-col items-center justify-center p-10 max-w-2xl mx-auto shadow-2xl border-light-border bg-card">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
          <h3 className="font-main-heading text-lg font-semibold text-primary-text mb-2">
            No business rules extracted
          </h3>
          <p className="text-sm text-secondary-text text-center max-w-md">
            We couldn't extract any business rules from the uploaded sprint artifacts or connected git repository. Please check your repository URL, branch, and sprint files.
          </p>
          <Button onClick={() => navigate(`/session/${id}/upload`)} className="mt-6">
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  const missingItemsList = gapSummary?.missing_items || rules.filter(r => r.has_code_mapping === false).map(r => ({
    story_name: r.story_name || 'Story Requirement',
    rule_code: r.rule_code,
    rule_text: r.rule_text,
    rule_type: r.rule_type,
    reason: r.missing_reason || 'No matching function or class found in repository'
  }));

  const activeLang = currentTechProfile?.language || 'Java';
  const activeFramework = currentTechProfile?.framework || 'JUnit 5';

  return (
    <div className="relative flex flex-col h-[80vh] min-h-[600px] space-y-4">
      {overlayModal}
      {/* Language Mismatch Alert Pop-up Modal */}
      {languageMismatch && (
        <LanguageMismatchModal
          isOpen={showLanguageModal}
          onClose={() => {
            setShowLanguageModal(false);
            setHasUserDismissedLangModal(true);
          }}
          onAutoSwitch={handleAutoSwitchLanguage}
          onCustomUpdate={handleCustomUpdateLanguage}
          onGoBack={() => navigate(`/session/${id}/upload`)}
          mismatchData={languageMismatch}
        />
      )}

      {/* Missing Code Pop-up Modal */}
      <MissingCodeModal
        isOpen={showMissingModal && !showLanguageModal}
        onClose={() => setShowMissingModal(false)}
        onContinue={() => {
          setShowMissingModal(false);
          setHasUserDismissedModal(true);
        }}
        onGoBack={() => navigate(`/session/${id}/upload`)}
        missingItems={missingItemsList}
        totalRules={gapSummary?.total_rules || rules.length}
        mappedRules={gapSummary?.mapped_rules || (rules.length - missingItemsList.length)}
      />

      {/* Story Function & Logic Audit Modal */}
      <StoryFunctionAuditModal
        isOpen={showStoryFunctionModal}
        onClose={() => setShowStoryFunctionModal(false)}
        analysisData={storyFunctionAnalysis}
        isLoading={isAnalyzingStoryFunctions}
        onReAnalyze={handleReAnalyzeStoryFunctions}
        onContinue={handleApprove}
      />

      {/* Header Bar */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="font-main-heading text-2xl font-bold">Requirement & Service Decomposition Review</h2>
            <div className="flex items-center gap-1.5 bg-input-bg border border-light-border px-2.5 py-1 rounded-full text-xs font-semibold text-primary-text shadow-2xs">
              <Cpu className="w-3.5 h-3.5 text-primary-orange" />
              <span>Target: <strong>{activeLang}</strong> ({activeFramework})</span>
              <button
                onClick={() => {
                  const detLang = languageMismatch?.detected_language || activeLang;
                  const isDiff = activeLang.trim().toLowerCase() !== detLang.trim().toLowerCase();
                  setLanguageMismatch({
                    is_mismatch: isDiff,
                    selected_language: activeLang,
                    selected_framework: activeFramework,
                    selected_mock_library: currentTechProfile?.mockLibrary || 'Mock',
                    detected_language: detLang,
                    recommended_framework: languageMismatch?.recommended_framework || activeFramework,
                    recommended_mock_library: languageMismatch?.recommended_mock_library || 'Mock'
                  });
                  setShowLanguageModal(true);
                }}
                className="ml-1 text-primary-orange hover:underline font-bold text-[11px]"
                title="Change Language & Framework"
              >
                [Change]
              </button>
            </div>
          </div>
          <p className="text-sm text-secondary-text mt-0.5">Verify extracted business rules and service mock dependencies before initiating test generation.</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            onClick={handleOpenStoryFunctionModal}
            className="text-xs shadow-xs border-2 border-primary-orange bg-card text-primary-orange hover:bg-primary-orange hover:text-white font-bold transition-all px-3.5 py-2"
            leftIcon={<Code2 className="w-4 h-4 text-inherit" />}
          >
            Story Function & Logic Audit
            {storyFunctionAnalysis?.total_functions ? (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                storyFunctionAnalysis.has_issues ? 'bg-amber-500 text-white' : 'bg-green-600 text-white'
              }`}>
                {storyFunctionAnalysis.total_functions}
              </span>
            ) : null}
          </Button>

          <Button
            variant="default"
            onClick={() => navigate(`/session/${id}/upload`)}
            className="text-xs shadow-xs"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Upload
          </Button>
          <Button onClick={handleApprove} className="shadow-md">
            Approve Boundaries & Start Test Generation
          </Button>
        </div>
      </div>

      {/* Language Mismatch Alert Banner */}
      {Boolean(
        languageMismatch?.is_mismatch &&
        languageMismatch?.selected_language &&
        languageMismatch?.detected_language &&
        languageMismatch.selected_language.trim().toLowerCase() !== languageMismatch.detected_language.trim().toLowerCase()
      ) && languageMismatch && (
          <div className="p-3.5 bg-card border-2 border-border rounded-lg flex items-center justify-between shadow-2xs animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-input border border-border rounded-md text-primary-text">
                <AlertTriangle className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <span className="text-xs font-bold text-primary-text">
                  Technology Mismatch: Selected {languageMismatch.selected_language}, but Repository contains {languageMismatch.detected_language} Code
                </span>
                <p className="text-[11px] text-secondary-text">
                  Your unit test suite is set to generate in {languageMismatch.selected_language}. Click to auto-switch to {languageMismatch.detected_language} or adjust settings.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => handleAutoSwitchLanguage(
                  languageMismatch.detected_language || 'Python',
                  languageMismatch.recommended_framework || 'Pytest',
                  languageMismatch.recommended_mock_library || 'pytest-mock'
                )}
                className="text-xs bg-primary-orange hover:bg-hover-orange shadow-sm"
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Switch to {languageMismatch.detected_language}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowLanguageModal(true)}
                className="text-xs"
              >
                Change Options
              </Button>
            </div>
          </div>
        )}

      {/* Missing Items Alert Banner */}
      {missingItemsList.length > 0 && (
        <div className="p-3.5 bg-input border border-border rounded-lg flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-input border border-border rounded-md text-primary-orange">
              <AlertTriangle className="w-4 h-4 text-primary-orange" />
            </div>
            <div>
              <span className="text-xs font-bold text-primary">
                {missingItemsList.length} Story Requirement(s) / Functions Not Found in Codebase
              </span>
              <p className="text-[11px] text-secondary-text">
                Some uploaded stories lack matching code implementations. You can review them or continue with the mapped components.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="default"
            onClick={() => setShowMissingModal(true)}
            className="text-xs"
          >
            View Missing Items ({missingItemsList.length})
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6 flex-1 overflow-hidden">
        {/* Extracted Rules */}
        <Card className="p-5 overflow-y-auto shadow-sm border-light-border flex flex-col">
          <h3 className="font-dropdown-label border-b border-light-border pb-3 mb-4 text-primary-orange flex justify-between items-center">
            <span>Extracted Business Rules & Acceptance Criteria</span>
            <div className="flex gap-2 items-center">
              <Button size="sm" variant="default" onClick={() => isAddingRule ? setIsAddingRule(false) : handleOpenAddRule()} className="text-sm " leftIcon={<PlusCircle className="w-4 h-4" />}>
                Add Rule
              </Button>
              <Badge variant="warning" className="text-xs px-2 py-0.5 font-mono">{rules.length} Rules</Badge>
            </div>
          </h3>

          {isAddingRule && (
            <div className="p-4 bg-card border-2 border-border rounded-lg mb-4 shadow-md space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-primary-orange" />
                  Add Custom Rule (AI Story Alignment Check Enabled)
                </h4>
                <Badge variant="warning" className="text-[10px] font-bold uppercase">
                  LLM Evaluated
                </Badge>
              </div>

              <div className="flex gap-3">
                <div className="w-1/3 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-secondary-text">
                    <span>Rule Code</span>
                    <span className="text-[10px] bg-input text-primary-orange font-mono font-bold px-1.5 py-0.5 rounded">
                      Auto: {getPrefixForRuleType(newRule.rule_type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="BR-001"
                      className="bg-card text-primary-text text-sm rounded border border-border p-1.5 w-full font-mono font-bold text-primary-orange"
                      value={newRule.rule_code}
                      onChange={(e) => setNewRule({ ...newRule, rule_code: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setNewRule(prev => ({ ...prev, rule_code: getNextCodeForType(prev.rule_type, rules) }))}
                      className="p-1.5 bg-card border border-border rounded text-secondary-text hover:text-primary-orange hover:border-primary-orange transition-colors"
                      title="Auto-Regenerate Next Code for Selected Type"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-secondary-text">Rule Type</span>
                  <select
                    className="bg-card text-primary-text text-sm rounded border border-border p-1.5 w-full"
                    value={newRule.rule_type}
                    onChange={(e) => handleRuleTypeChange(e.target.value)}
                  >
                    <option value="BUSINESS_RULE">BUSINESS_RULE (BR-)</option>
                    <option value="VALIDATION_RULE">VALIDATION_RULE (VR-)</option>
                    <option value="SECURITY_RULE">SECURITY_RULE (SR-)</option>
                    <option value="AUTHORIZATION_RULE">AUTHORIZATION_RULE (AR-)</option>
                  </select>
                </div>
              </div>

              <input
                type="text"
                placeholder="Story / Feature Name (e.g. User Registration)..."
                className="bg-card text-primary-text text-sm rounded border border-border p-1.5 w-full text-xs"
                value={newRule.story_name}
                onChange={(e) => setNewRule({ ...newRule, story_name: e.target.value })}
              />
              <textarea
                placeholder="Rule Details & Acceptance Criteria..."
                className="bg-card text-primary-text text-sm rounded border border-border p-2 w-full h-20 text-xs"
                value={newRule.rule_text}
                onChange={(e) => setNewRule({ ...newRule, rule_text: e.target.value })}
              />

              {/* Validation Rejection / Error Alert */}
              {validationError && (
                <div className="p-3.5 bg-card border-2 border-border rounded-md text-xs space-y-1 animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold text-primary-text">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>INVALID RULE / STORY MISMATCH (Rule Not Added)</span>
                  </div>
                  <p className="text-secondary-text pl-6 leading-relaxed">
                    {validationError}
                  </p>
                  <p className="text-[11px] text-secondary-text pl-6 italic">
                    The rule was rejected because it violates or does not match the uploaded story specifications. Please correct the rule text or story name and retry.
                  </p>
                </div>
              )}

              {/* Validation Success Alert */}
              {validationFeedback && validationFeedback.is_valid && !validationError && (
                <div className="p-3.5 bg-card border-2 border-border rounded-md text-xs space-y-1.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-primary-text">
                      <Check className="w-4 h-4 shrink-0" />
                      <span>STORY ALIGNMENT VERIFIED • Score: {validationFeedback.match_score}%</span>
                    </div>
                    <span className="text-[10px] bg-input text-secondary-text border border-border font-bold px-2 py-0.5 rounded-full uppercase">
                      {validationFeedback.alignment_status}
                    </span>
                  </div>
                  <p className="text-secondary-text pl-6 leading-relaxed">
                    {validationFeedback.feedback}
                  </p>
                  {validationFeedback.suggested_rule_text && validationFeedback.suggested_rule_text !== newRule.rule_text && (
                    <div className="mt-2 pl-6 pt-2 border-t border-border flex items-center justify-between gap-2">
                      <span className="text-[11px] text-secondary-text">AI Enhanced Wording available</span>
                      <button
                        type="button"
                        onClick={() => setNewRule({ ...newRule, rule_text: validationFeedback.suggested_rule_text! })}
                        className="text-[11px] font-bold text-primary-orange hover:underline flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" /> Apply AI Suggestion
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleValidateRule}
                  disabled={isValidating || isSavingRule || !newRule.rule_code || !newRule.rule_text}
                  className="text-xs font-bold border-2 border-primary-orange text-primary-orange bg-card hover:bg-orange-500/10 dark:hover:bg-orange-950/40 disabled:opacity-50 disabled:border-primary-orange/40 shadow-xs"
                  leftIcon={<Sparkles className={`w-3.5 h-3.5 text-primary-orange ${isValidating ? 'animate-spin' : ''}`} />}
                >
                  <span className="text-primary-orange font-bold">
                    {isValidating ? 'Checking Story Match...' : 'Validate with LLM'}
                  </span>
                </Button>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setIsAddingRule(false);
                      setValidationError(null);
                      setValidationFeedback(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddRule}
                    disabled={isSavingRule || isValidating}
                    className="shadow-sm"
                    leftIcon={<Check className={`w-3.5 h-3.5 ${isSavingRule ? 'animate-spin' : ''}`} />}
                  >
                    {isSavingRule ? 'Validating & Saving...' : 'Save Rule'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {rules.map((rule, idx) => {
              const isMissing = rule.has_code_mapping === false;
              return (
                <div
                  key={idx}
                  className={`p-4 border rounded-md transition-all shadow-2xs ${isMissing ? 'bg-card border-border' : 'bg-card border-border hover:border-orange-border'
                    }`}
                >
                  <div className="flex justify-between items-center mb-1.5 flex-wrap gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary-orange uppercase font-mono">{rule.rule_code}</span>
                      {rule.story_name && (
                        <span className="text-xs font-semibold text-foreground">
                          • {rule.story_name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {rule.ai_validation_score && (
                        <span className="text-[10px] bg-card text-primary-text border border-border px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> Match: {rule.ai_validation_score}%
                        </span>
                      )}
                      {isMissing ? (
                        <span className="text-[10px] bg-card text-primary-text border border-border px-2 py-0.5 rounded-full font-bold">
                          ⚠️ No Code in Repo
                        </span>
                      ) : (
                        <span className="text-[10px] bg-card text-primary-text border border-border px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Code Mapped
                        </span>
                      )}
                      <span className="text-[10px] bg-muted text-secondary-text px-2 py-0.5 rounded font-semibold uppercase">{rule.rule_type}</span>
                    </div>
                  </div>
                  <p className="font-instruction-text text-sm text-secondary-text mt-1">{rule.rule_text}</p>

                  {rule.target_code_snippet && (
                    <div className="mt-2.5 pt-2 border-t border-light-border text-xs">
                      <span className="font-semibold text-primary-orange text-[11px] uppercase block mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Identified Code Snippet / Validation Scope:
                      </span>
                      <pre className="p-2.5 bg-muted text-foreground text-[11px] font-mono rounded border border-border overflow-x-auto whitespace-pre-wrap leading-relaxed">
                        {rule.target_code_snippet}
                      </pre>
                    </div>
                  )}

                  {rule.ai_feedback && (
                    <div className="mt-2 pt-1.5 border-t border-light-border text-[11px] text-secondary-text flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-primary-orange shrink-0" />
                      <span className="italic">{rule.ai_feedback}</span>
                    </div>
                  )}

                  {isMissing && rule.missing_reason && (
                    <div className="mt-2 pt-1.5 border-t border-border text-[11px] text-secondary-text italic">
                      {rule.missing_reason}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
              {srv.target_code_snippets && srv.target_code_snippets.length > 0 && (
                <div className="mt-3">
                  <span className="text-xs font-semibold text-secondary-text uppercase">Identified Validation Snippets:</span>
                  <div className="mt-1 space-y-1.5">
                    {srv.target_code_snippets.map((snip: string, si: number) => (
                      <pre key={si} className="p-2 bg-muted text-foreground text-[10px] font-mono rounded border border-border overflow-x-auto whitespace-pre-wrap">
                        {snip}
                      </pre>
                    ))}
                  </div>
                </div>
              )}
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

