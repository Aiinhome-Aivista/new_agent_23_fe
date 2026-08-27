import React, { useState } from 'react';
import { AlertTriangle, ArrowLeft, Check, Code2, Cpu, RefreshCw, Settings, Sparkles, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export interface LanguageMismatchData {
  is_mismatch: boolean;
  selected_language?: string;
  selected_framework?: string;
  selected_mock_library?: string;
  detected_language?: string;
  recommended_framework?: string;
  recommended_mock_library?: string;
  detected_extensions?: string[];
  message?: string;
}

interface LanguageMismatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAutoSwitch: (language: string, framework: string, mockLibrary: string) => Promise<void>;
  onCustomUpdate: (profile: { language: string; framework: string; mockLibrary: string }) => Promise<void>;
  onGoBack: () => void;
  mismatchData: LanguageMismatchData;
}

const LANGUAGE_FRAMEWORKS: Record<string, { frameworks: string[]; mocks: string[] }> = {
  Python: {
    frameworks: ['Pytest', 'unittest'],
    mocks: ['pytest-mock', 'unittest.mock']
  },
  Java: {
    frameworks: ['JUnit 5', 'JUnit 4', 'TestNG'],
    mocks: ['Mockito', 'EasyMock', 'PowerMock']
  },
  TypeScript: {
    frameworks: ['Jest', 'Vitest', 'Mocha'],
    mocks: ['Jest Mock', 'Sinon', 'ts-mockito']
  },
  JavaScript: {
    frameworks: ['Jest', 'Mocha', 'Jasmine'],
    mocks: ['Sinon', 'Jest Mock']
  },
  'C#': {
    frameworks: ['xUnit', 'NUnit', 'MSTest'],
    mocks: ['Moq', 'NSubstitute', 'FakeItEasy']
  },
  Go: {
    frameworks: ['testing', 'Ginkgo'],
    mocks: ['testify', 'gomock']
  }
};

export const LanguageMismatchModal: React.FC<LanguageMismatchModalProps> = ({
  isOpen,
  onClose,
  onAutoSwitch,
  onCustomUpdate,
  onGoBack,
  mismatchData,
}) => {
  const [isSwitching, setIsSwitching] = useState(false);

  const detectedLang = mismatchData.detected_language || 'Python';
  const selectedLang = mismatchData.selected_language || 'Java';
  const recFramework = mismatchData.recommended_framework || LANGUAGE_FRAMEWORKS[detectedLang]?.frameworks[0] || 'Pytest';
  const recMock = mismatchData.recommended_mock_library || LANGUAGE_FRAMEWORKS[detectedLang]?.mocks[0] || 'pytest-mock';

  const isActualMismatch = selectedLang.toLowerCase() !== detectedLang.toLowerCase();

  const [showCustomForm, setShowCustomForm] = useState(!isActualMismatch);

  // Custom Form State
  const [customLang, setCustomLang] = useState(selectedLang);
  const [customFramework, setCustomFramework] = useState(mismatchData.selected_framework || recFramework);
  const [customMock, setCustomMock] = useState(mismatchData.selected_mock_library || recMock);

  if (!isOpen) return null;

  const handleLanguageChange = (lang: string) => {
    setCustomLang(lang);
    const options = LANGUAGE_FRAMEWORKS[lang] || { frameworks: ['Unit Test'], mocks: ['Mock Library'] };
    setCustomFramework(options.frameworks[0] || 'Unit Test');
    setCustomMock(options.mocks[0] || 'Mock Library');
  };

  const handleQuickSwitch = async () => {
    setIsSwitching(true);
    try {
      await onAutoSwitch(detectedLang, recFramework, recMock);
      onClose();
    } finally {
      setIsSwitching(false);
    }
  };

  const handleSaveCustom = async () => {
    setIsSwitching(true);
    try {
      await onCustomUpdate({
        language: customLang,
        framework: customFramework,
        mockLibrary: customMock
      });
      onClose();
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-background/50 backdrop-blur-sm rounded-xl animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-card border-2 border-orange rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-card p-5 border-b border-light-border flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-100 dark:bg-orange-950/60 border border-orange-400 rounded-lg text-primary-orange shadow-xs">
              {isActualMismatch ? (
                <AlertTriangle className="w-6 h-6 text-primary-orange animate-bounce" />
              ) : (
                <Settings className="w-6 h-6 text-primary-orange animate-spin" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-card-foreground">
                  {isActualMismatch ? "Language & Technology Mismatch Detected" : "Technology Stack Settings"}
                </h2>
                {!isActualMismatch && (
                  <Badge variant="outline" className="text-[11px] font-mono px-2 py-0.5 font-bold uppercase border-primary-orange/40 text-primary-orange">
                    Active Stack
                  </Badge>
                )}
                {isActualMismatch && (
                  <Badge variant="warning" className="text-[11px] font-mono px-2 py-0.5 font-bold uppercase">
                    Stack Conflict
                  </Badge>
                )}
              </div>
              <p className="text-xs text-secondary-text mt-0.5">
                {isActualMismatch 
                  ? "The session target language does not match the source code found in your connected repository."
                  : "Review and configure the target language, test framework, and mocking library for your project."}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-secondary-text hover:text-card-foreground p-1 rounded-md transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Selected Profile */}
            <div className={`p-4 rounded-lg border space-y-2 ${
              isActualMismatch 
                ? "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50" 
                : "bg-muted/55 dark:bg-muted/10 border-border"
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${
                  isActualMismatch ? "text-red-600 dark:text-red-400" : "text-secondary-text"
                }`}>
                  <Cpu className="w-3.5 h-3.5" /> Selected in Session
                </span>
                <span className={`text-[10px] border px-2 py-0.5 rounded-full font-semibold ${
                  isActualMismatch 
                    ? "bg-red-100 text-red-800 border-red-300" 
                    : "bg-orange-500/10 text-primary-orange border-primary-orange/30"
                }`}>
                  Configured
                </span>
              </div>
              <div className="text-xl font-bold text-card-foreground">{selectedLang}</div>
              <div className="text-xs text-secondary-text space-y-0.5">
                <div>Framework: <strong className="text-foreground">{mismatchData.selected_framework || 'JUnit 5'}</strong></div>
                <div>Mocking: <strong className="text-foreground">{mismatchData.selected_mock_library || 'Mockito'}</strong></div>
              </div>
            </div>

            {/* Detected in Codebase */}
            <div className={`p-4 rounded-lg border space-y-2 ${
              isActualMismatch 
                ? "bg-green-50/60 dark:bg-green-950/20 border-green-300 dark:border-green-800/60" 
                : "bg-muted/55 dark:bg-muted/10 border-border"
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${
                  isActualMismatch ? "text-green-700 dark:text-green-400" : "text-secondary-text"
                }`}>
                  <Code2 className="w-3.5 h-3.5" /> Detected in Repository
                </span>
                <span className={`text-[10px] border px-2 py-0.5 rounded-full font-semibold ${
                  isActualMismatch 
                    ? "bg-green-100 text-green-800 border-green-300" 
                    : "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30"
                }`}>
                  Actual Code
                </span>
              </div>
              <div className="text-xl font-bold text-card-foreground flex items-center gap-2">
                {detectedLang}
                {mismatchData.detected_extensions && mismatchData.detected_extensions.length > 0 && (
                  <span className="text-xs font-normal text-placeholder font-mono">
                    ({mismatchData.detected_extensions.join(', ')})
                  </span>
                )}
              </div>
              <div className="text-xs text-secondary-text space-y-0.5">
                <div>Recommended: <strong className="text-foreground">{recFramework}</strong></div>
                <div>Recommended Mock: <strong className="text-foreground">{recMock}</strong></div>
              </div>
            </div>
          </div>

          {/* Conflict Explanation */}
          {isActualMismatch && (
            <div className="bg-input-bg border border-orange-200 rounded-lg p-3.5 text-xs text-primary-text space-y-1">
              <p className="font-semibold text-primary-orange">
                Why this matters:
              </p>
              <p className="text-secondary-text leading-relaxed">
                You selected <strong>{selectedLang}</strong>, but your repository contains <strong>{detectedLang}</strong> code. Generating {selectedLang} test suites (e.g. JUnit/Mockito) for {detectedLang} source code will result in uncompilable test suites and execution failures.
              </p>
            </div>
          )}

          {/* Quick Auto-Fix Banner */}
          {isActualMismatch && (
            <div className="p-4 rounded-lg bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-primary-orange/60 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
              <div>
                <div className="font-bold text-sm text-card-foreground flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-primary-orange" />
                  Recommended Quick Fix:
                </div>
                <p className="text-xs text-secondary-text mt-0.5">
                  Auto-switch Target Language to <strong>{detectedLang}</strong> ({recFramework} + {recMock}) and continue test generation.
                </p>
              </div>
              <Button
                onClick={handleQuickSwitch}
                disabled={isSwitching}
                className="whitespace-nowrap flex items-center gap-2 text-xs shadow-md bg-primary-orange hover:bg-hover-orange"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSwitching ? 'animate-spin' : ''}`} />
                Auto-Switch to {detectedLang}
              </Button>
            </div>
          )}

          {/* Toggle Manual Customization Form */}
          <div>
            {isActualMismatch && (
              <button
                type="button"
                onClick={() => setShowCustomForm(!showCustomForm)}
                className="text-xs font-semibold text-primary-orange hover:underline flex items-center gap-1 mb-3"
              >
                <Settings className="w-3.5 h-3.5" />
                {showCustomForm ? 'Hide Manual Language Settings' : 'Or Choose Target Language & Framework Manually'}
              </button>
            )}

            {(showCustomForm || !isActualMismatch) && (
              <div className="p-4 bg-muted border border-border rounded-lg space-y-3 animate-in fade-in">
                <h4 className="text-xs font-bold text-foreground">Configure Technology Stack</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-secondary-text mb-1">Target Language</label>
                    <select
                      value={customLang}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="w-full bg-card border border-light-border rounded p-1.5 text-xs text-card-foreground"
                    >
                      {Object.keys(LANGUAGE_FRAMEWORKS).map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-secondary-text mb-1">Testing Framework</label>
                    <select
                      value={customFramework}
                      onChange={(e) => setCustomFramework(e.target.value)}
                      className="w-full bg-card border border-light-border rounded p-1.5 text-xs text-card-foreground"
                    >
                      {(LANGUAGE_FRAMEWORKS[customLang]?.frameworks || ['Unit Test']).map(fw => (
                        <option key={fw} value={fw}>{fw}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-secondary-text mb-1">Mocking Library</label>
                    <select
                      value={customMock}
                      onChange={(e) => setCustomMock(e.target.value)}
                      className="w-full bg-card border border-light-border rounded p-1.5 text-xs text-card-foreground"
                    >
                      {(LANGUAGE_FRAMEWORKS[customLang]?.mocks || ['Mock Library']).map(mock => (
                        <option key={mock} value={mock}>{mock}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <Button
                    size="sm"
                    onClick={handleSaveCustom}
                    disabled={isSwitching}
                    className="text-xs"
                    leftIcon={<Check className="w-3.5 h-3.5" />}
                  >
                    Save & Apply Stack
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-muted/70 border-t border-light-border flex items-center justify-between gap-3">
          <Button 
            variant="default" 
            onClick={onGoBack}
            className="text-xs"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Go Back to Upload
          </Button>

          <button
            onClick={onClose}
            className="text-xs text-secondary-text hover:text-primary-text underline transition-colors px-2"
          >
            {isActualMismatch ? `Continue as ${selectedLang} Anyway` : 'Cancel & Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
