import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  X, 
  Search, 
  RefreshCw, 
  Code2, 
  Layers, 
  FileCode, 
  Check, 
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '../ui/Button';

export interface ExpectedPayloadField {
  field_name: string;
  data_type: string;
  is_required: boolean;
  validation_rules?: string;
  example_value?: string;
}

export interface ActualPayloadField {
  field_name: string;
  data_type?: string;
  is_handled?: boolean;
  validation_present?: boolean;
  notes?: string;
}

export interface ExpectedLogicStep {
  step_number: number;
  logic_type?: string;
  description: string;
  expected_outcome?: string;
}

export interface ActualLogicStep {
  step_number: number;
  implemented?: boolean;
  notes?: string;
}

export interface AnalyzedFunction {
  function_name: string;
  module_name?: string;
  description?: string;
  rule_codes?: string[];
  status: 'PROPER' | 'PARTIAL_MISS' | 'MISSING';
  found_in_file?: string | null;
  actual_method_signature?: string | null;
  expected_payload?: ExpectedPayloadField[];
  actual_payload?: ActualPayloadField[];
  expected_logic_steps?: ExpectedLogicStep[];
  actual_logic_steps?: ActualLogicStep[];
  missing_payload_fields?: string[];
  missing_logic_steps?: string[];
  discrepancies?: string[];
  gap_summary?: string;
  actual_code_snippet?: string | null;
  expected_response?: {
    success_status?: string;
    error_cases?: string[];
  };
}

export interface StoryFunctionAnalysisData {
  total_functions: number;
  proper_count: number;
  partial_miss_count: number;
  missing_count: number;
  has_issues: boolean;
  functions: AnalyzedFunction[];
  message?: string;
}

interface StoryFunctionAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisData: StoryFunctionAnalysisData | null;
  isLoading?: boolean;
  onReAnalyze?: () => Promise<void>;
  onContinue?: () => void;
}

export const StoryFunctionAuditModal: React.FC<StoryFunctionAuditModalProps> = ({
  isOpen,
  onClose,
  analysisData,
  isLoading = false,
  onReAnalyze,
  onContinue
}) => {
  const [filterTab, setFilterTab] = useState<'ALL' | 'PROPER' | 'PARTIAL_MISS' | 'MISSING'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFunctions, setExpandedFunctions] = useState<Record<string, boolean>>({});
  const [reAnalyzing, setReAnalyzing] = useState(false);

  if (!isOpen) return null;

  const functions = analysisData?.functions || [];
  const totalCount = analysisData?.total_functions || functions.length;
  const properCount = analysisData?.proper_count || functions.filter(f => f.status === 'PROPER').length;
  const partialMissCount = analysisData?.partial_miss_count || functions.filter(f => f.status === 'PARTIAL_MISS').length;
  const missingCount = analysisData?.missing_count || functions.filter(f => f.status === 'MISSING').length;

  const toggleExpand = (fnName: string) => {
    setExpandedFunctions(prev => ({
      ...prev,
      [fnName]: prev[fnName] === undefined ? false : !prev[fnName]
    }));
  };

  const handleReAnalyzeClick = async () => {
    if (!onReAnalyze) return;
    setReAnalyzing(true);
    try {
      await onReAnalyze();
    } finally {
      setReAnalyzing(false);
    }
  };

  const filteredFunctions = functions.filter(fn => {
    if (filterTab !== 'ALL' && fn.status !== filterTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = fn.function_name.toLowerCase().includes(q);
      const moduleMatch = (fn.module_name || '').toLowerCase().includes(q);
      const descMatch = (fn.description || '').toLowerCase().includes(q);
      const ruleMatch = (fn.rule_codes || []).some(r => r.toLowerCase().includes(q));
      const payloadMatch = (fn.expected_payload || []).some(p => p.field_name.toLowerCase().includes(q));
      return nameMatch || moduleMatch || descMatch || ruleMatch || payloadMatch;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-5xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Section */}
        <div className="bg-gradient-to-r from-primary-orange/10 via-primary-orange/5 to-transparent p-5 border-b border-light-border flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-primary-orange/15 border border-primary-orange/30 rounded-xl text-primary-orange shadow-xs">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold text-card-foreground">
                  Story Function, Payload & Logic Audit
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary-orange/15 text-primary-orange font-semibold border border-primary-orange/30">
                  AI Grounded Verification
                </span>
              </div>
              <p className="text-xs text-secondary-text mt-1">
                Extracted story functions, expected request payloads & validation logic cross-verified against repository code without hallucination.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-secondary-text hover:text-card-foreground p-1.5 rounded-lg hover:bg-input transition-colors"
            title="Close Audit"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats & Filter Bar */}
        <div className="bg-muted/40 px-6 py-3 border-b border-light-border flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Quick Metrics */}
          <div className="flex items-center gap-2 flex-wrap text-xs font-medium">
            <span className="text-secondary-text">Summary:</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-light-border rounded-lg shadow-2xs">
              <span className="text-secondary-text">Total:</span>
              <strong className="text-foreground">{totalCount}</strong>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 rounded-lg shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Proper:</span>
              <strong>{properCount}</strong>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 rounded-lg shadow-2xs">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Partial Miss:</span>
              <strong>{partialMissCount}</strong>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 rounded-lg shadow-2xs">
              <XCircle className="w-3.5 h-3.5" />
              <span>Missing in Code:</span>
              <strong>{missingCount}</strong>
            </div>
          </div>

          {/* Re-Analyze Button */}
          {onReAnalyze && (
            <Button
              variant="default"
              size="sm"
              onClick={handleReAnalyzeClick}
              disabled={reAnalyzing || isLoading}
              className="text-xs shrink-0 self-start md:self-auto"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${reAnalyzing || isLoading ? 'animate-spin' : ''}`} />}
            >
              {reAnalyzing || isLoading ? 'Analyzing Story...' : 'Re-Analyze with AI'}
            </Button>
          )}
        </div>

        {/* Search & Tabs Controls */}
        <div className="px-6 py-3 border-b border-light-border flex flex-col sm:flex-row items-center justify-between gap-3 bg-card">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-input/60 p-1 rounded-lg border border-light-border w-full sm:w-auto">
            <button
              onClick={() => setFilterTab('ALL')}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                filterTab === 'ALL'
                  ? 'bg-card text-foreground shadow-2xs font-semibold'
                  : 'text-secondary-text hover:text-foreground'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setFilterTab('PROPER')}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                filterTab === 'PROPER'
                  ? 'bg-green-500/15 text-green-700 dark:text-green-300 shadow-2xs font-semibold'
                  : 'text-secondary-text hover:text-foreground'
              }`}
            >
              Proper ({properCount})
            </button>
            <button
              onClick={() => setFilterTab('PARTIAL_MISS')}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                filterTab === 'PARTIAL_MISS'
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 shadow-2xs font-semibold'
                  : 'text-secondary-text hover:text-foreground'
              }`}
            >
              Partial Miss ({partialMissCount})
            </button>
            <button
              onClick={() => setFilterTab('MISSING')}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                filterTab === 'MISSING'
                  ? 'bg-red-500/15 text-red-700 dark:text-red-300 shadow-2xs font-semibold'
                  : 'text-secondary-text hover:text-foreground'
              }`}
            >
              Missing ({missingCount})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-secondary-text absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search function, payload..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-input/40 border border-light-border rounded-lg text-foreground placeholder:text-secondary-text/60 focus:outline-hidden focus:border-primary-orange focus:ring-1 focus:ring-primary-orange transition-all"
            />
          </div>
        </div>

        {/* Modal Body: Functions List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {isLoading || reAnalyzing ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-primary-orange animate-spin mx-auto" />
              <p className="text-sm font-semibold text-foreground">
                Analyzing Story Requirements & Codebase Implementation...
              </p>
              <p className="text-xs text-secondary-text max-w-md mx-auto">
                Parsing acceptance criteria, request payload schemas, and cross-verifying actual code methods without hallucination.
              </p>
            </div>
          ) : filteredFunctions.length === 0 ? (
            <div className="py-12 text-center space-y-2 bg-input/20 border border-dashed border-light-border rounded-xl">
              <Code2 className="w-8 h-8 text-secondary-text/60 mx-auto" />
              <p className="text-sm font-semibold text-foreground">No functions match your filter</p>
              <p className="text-xs text-secondary-text">Try adjusting your search query or tab selection.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFunctions.map((fn, idx) => {
                const isExpanded = expandedFunctions[fn.function_name] !== false; // Default expanded
                const isProper = fn.status === 'PROPER';
                const isPartial = fn.status === 'PARTIAL_MISS';
                const isMissing = fn.status === 'MISSING';

                return (
                  <div 
                    key={idx}
                    className={`border rounded-xl overflow-hidden transition-all shadow-xs ${
                      isProper 
                        ? 'border-green-500/30 bg-card hover:border-green-500/50' 
                        : isPartial 
                        ? 'border-amber-500/40 bg-card hover:border-amber-500/60' 
                        : 'border-red-500/40 bg-card hover:border-red-500/60'
                    }`}
                  >
                    {/* Function Card Header */}
                    <div 
                      onClick={() => toggleExpand(fn.function_name)}
                      className={`p-4 flex items-center justify-between gap-3 cursor-pointer select-none border-b transition-colors ${
                        isProper 
                          ? 'bg-green-500/5 border-green-500/20' 
                          : isPartial 
                          ? 'bg-amber-500/5 border-amber-500/20' 
                          : 'bg-red-500/5 border-red-500/20'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className={`p-2 rounded-lg shrink-0 ${
                          isProper 
                            ? 'bg-green-500/15 text-green-600 dark:text-green-400' 
                            : isPartial 
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' 
                            : 'bg-red-500/15 text-red-600 dark:text-red-400'
                        }`}>
                          {isProper ? <CheckCircle2 className="w-5 h-5" /> : isPartial ? <AlertTriangle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-sm font-bold text-foreground">
                              {fn.function_name}()
                            </span>
                            {fn.module_name && (
                              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-input border border-light-border text-secondary-text">
                                {fn.module_name}
                              </span>
                            )}
                            {(fn.rule_codes || []).map((code, cIdx) => (
                              <span key={cIdx} className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-primary-orange/10 text-primary-orange border border-primary-orange/25">
                                {code}
                              </span>
                            ))}
                          </div>
                          {fn.description && (
                            <p className="text-xs text-secondary-text mt-0.5 line-clamp-1">
                              {fn.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Status Badge */}
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border flex items-center gap-1.5 ${
                          isProper 
                            ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950/60 dark:text-green-300 dark:border-green-800' 
                            : isPartial 
                            ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800' 
                            : 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800'
                        }`}>
                          {isProper && <><Check className="w-3.5 h-3.5" /> Proper / Verified</>}
                          {isPartial && <><AlertTriangle className="w-3.5 h-3.5" /> Partial Miss (Logic/Field)</>}
                          {isMissing && <><X className="w-3.5 h-3.5" /> Missing in Codebase</>}
                        </span>

                        <button className="text-secondary-text hover:text-foreground p-1">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Function Card Content Body */}
                    {isExpanded && (
                      <div className="p-5 space-y-5 bg-card/50">
                        {/* Gap & Defect Banner (If Not Proper) */}
                        {(isPartial || isMissing) && (
                          <div className={`p-4 rounded-xl border space-y-2 ${
                            isMissing 
                              ? 'bg-red-500/10 border-red-500/30 text-red-900 dark:text-red-200' 
                              : 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                          }`}>
                            <div className="flex items-center gap-2 font-semibold text-xs">
                              <ShieldAlert className="w-4 h-4" />
                              <span>Identified Implementation Gaps:</span>
                            </div>
                            {fn.gap_summary && (
                              <p className="text-xs font-medium pl-6 leading-relaxed">
                                {fn.gap_summary}
                              </p>
                            )}
                            <div className="pl-6 space-y-1 text-xs">
                              {(fn.missing_payload_fields && fn.missing_payload_fields.length > 0) && (
                                <div className="flex items-start gap-1.5">
                                  <span className="font-semibold text-primary-orange">• Missing Payload Fields:</span>
                                  <span>{fn.missing_payload_fields.join(', ')}</span>
                                </div>
                              )}
                              {(fn.missing_logic_steps && fn.missing_logic_steps.length > 0) && (
                                <div className="flex items-start gap-1.5">
                                  <span className="font-semibold text-primary-orange">• Missing Logic Steps:</span>
                                  <span>{fn.missing_logic_steps.join('; ')}</span>
                                </div>
                              )}
                              {(fn.discrepancies && fn.discrepancies.length > 0) && (
                                <div className="flex items-start gap-1.5">
                                  <span className="font-semibold text-primary-orange">• Discrepancies:</span>
                                  <span>{fn.discrepancies.join('; ')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Location and Method Signature */}
                        {fn.found_in_file ? (
                          <div className="p-3 bg-input/40 border border-light-border rounded-lg text-xs flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-secondary-text">
                              <FileCode className="w-4 h-4 text-primary-orange shrink-0" />
                              <span>Source File: <strong className="font-mono text-foreground">{fn.found_in_file}</strong></span>
                            </div>
                            {fn.actual_method_signature && (
                              <div className="font-mono text-[11px] text-foreground bg-card px-2 py-1 rounded border border-light-border truncate max-w-lg">
                                {fn.actual_method_signature}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                            <XCircle className="w-4 h-4 shrink-0" />
                            <span>No source file or function declaration found in the scanned repository.</span>
                          </div>
                        )}

                        {/* Side-by-Side: Payload Schema Table */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                            <Layers className="w-4 h-4 text-primary-orange" />
                            Request Payload & Parameters Audit (Story vs Codebase)
                          </h4>

                          <div className="border border-light-border rounded-lg overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-muted/60 border-b border-light-border text-secondary-text">
                                  <th className="p-2.5 font-semibold">Field Name</th>
                                  <th className="p-2.5 font-semibold">Expected Type</th>
                                  <th className="p-2.5 font-semibold">Required</th>
                                  <th className="p-2.5 font-semibold">Story Validation Rules</th>
                                  <th className="p-2.5 font-semibold">Code Implementation</th>
                                  <th className="p-2.5 font-semibold">Audit Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-light-border/60">
                                {(fn.expected_payload || []).map((exp, pIdx) => {
                                  const actualField = (fn.actual_payload || []).find(
                                    a => a.field_name.toLowerCase() === exp.field_name.toLowerCase()
                                  );
                                  const isFieldPresent = isMissing ? false : (actualField ? actualField.is_handled !== false : true);
                                  const isValidationDone = isMissing ? false : (actualField ? actualField.validation_present !== false : isProper);

                                  return (
                                    <tr key={pIdx} className="hover:bg-input/20 transition-colors">
                                      <td className="p-2.5 font-mono font-bold text-foreground">
                                        {exp.field_name}
                                      </td>
                                      <td className="p-2.5 font-mono text-[11px] text-secondary-text">
                                        {exp.data_type || 'string'}
                                      </td>
                                      <td className="p-2.5">
                                        {exp.is_required ? (
                                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-semibold">
                                            Required
                                          </span>
                                        ) : (
                                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-input text-secondary-text">
                                            Optional
                                          </span>
                                        )}
                                      </td>
                                      <td className="p-2.5 text-secondary-text">
                                        {exp.validation_rules || 'No custom regex / format required'}
                                      </td>
                                      <td className="p-2.5 text-secondary-text">
                                        {actualField?.notes || (isMissing ? 'Not in code' : 'Processed in request')}
                                      </td>
                                      <td className="p-2.5">
                                        {isFieldPresent && isValidationDone ? (
                                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-600 dark:text-green-400">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Proper
                                          </span>
                                        ) : isFieldPresent && !isValidationDone ? (
                                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                            <AlertTriangle className="w-3.5 h-3.5" /> Validation Missing
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 dark:text-red-400">
                                            <XCircle className="w-3.5 h-3.5" /> Missing in Code
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                                {(!fn.expected_payload || fn.expected_payload.length === 0) && (
                                  <tr>
                                    <td colSpan={6} className="p-3 text-center text-secondary-text text-xs italic">
                                      No request payload parameters specified for this function.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Step-by-Step Business & Validation Logic */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-primary-orange" />
                            Business Logic & Validation Steps Checklist
                          </h4>

                          <div className="space-y-2">
                            {(fn.expected_logic_steps || []).map((step, sIdx) => {
                              const actualStep = (fn.actual_logic_steps || []).find(
                                a => a.step_number === step.step_number
                              );
                              const isImplemented = isMissing ? false : (actualStep ? actualStep.implemented !== false : isProper);

                              return (
                                <div 
                                  key={sIdx}
                                  className={`p-3 rounded-lg border text-xs flex items-start justify-between gap-3 ${
                                    isImplemented 
                                      ? 'bg-green-500/5 border-green-500/25 text-foreground' 
                                      : 'bg-amber-500/5 border-amber-500/30 text-foreground'
                                  }`}
                                >
                                  <div className="flex items-start gap-2.5">
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                                      isImplemented 
                                        ? 'bg-green-500/20 text-green-700 dark:text-green-300' 
                                        : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                    }`}>
                                      {step.step_number}
                                    </span>
                                    <div>
                                      <div className="font-semibold text-card-foreground">
                                        {step.description}
                                      </div>
                                      {step.expected_outcome && (
                                        <p className="text-[11px] text-secondary-text mt-0.5">
                                          Outcome: {step.expected_outcome}
                                        </p>
                                      )}
                                      {actualStep?.notes && (
                                        <p className="text-[11px] text-primary-orange italic mt-0.5">
                                          Audit Note: {actualStep.notes}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <span className={`text-[11px] px-2 py-0.5 rounded font-semibold shrink-0 ${
                                    isImplemented 
                                      ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300' 
                                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                  }`}>
                                    {isImplemented ? '✓ Implemented in Code' : '⚠ Missing / Not Implemented'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Code Snippet Viewer */}
                        {fn.actual_code_snippet && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-semibold text-secondary-text">
                              <span className="flex items-center gap-1.5">
                                <Code2 className="w-3.5 h-3.5 text-primary-orange" />
                                Scanned Repository Source Code Snippet
                              </span>
                              <span className="text-[10px] font-mono text-secondary-text">Verbatim Code</span>
                            </div>
                            <pre className="p-3.5 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-[11px] rounded-lg overflow-x-auto border border-border leading-relaxed">
                              <code>{fn.actual_code_snippet}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-muted/60 border-t border-light-border flex items-center justify-between gap-3">
          <div className="text-xs text-secondary-text hidden sm:block">
            {partialMissCount + missingCount > 0 ? (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                ⚠ {partialMissCount + missingCount} function gap(s) detected. Tests will be tailored to verify these missing edge cases.
              </span>
            ) : (
              <span className="text-green-600 dark:text-green-400 font-medium">
                ✓ All story functions, payloads, and validations are fully verified in the repository.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <Button 
              variant="default" 
              onClick={onClose}
              className="text-xs"
            >
              Close Audit
            </Button>

            {onContinue && (
              <Button 
                onClick={onContinue}
                className="text-xs shadow-md"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Proceed to Test Pack
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
