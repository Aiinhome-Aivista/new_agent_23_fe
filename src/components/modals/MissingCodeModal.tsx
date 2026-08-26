import React from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, FileQuestion, HelpCircle, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export interface MissingItem {
  story_name?: string;
  story?: string;
  rule_code?: string;
  rule_text?: string;
  rule_type?: string;
  missing_function?: string;
  reason?: string;
}

interface MissingCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  onGoBack: () => void;
  missingItems: MissingItem[];
  totalRules?: number;
  mappedRules?: number;
}

export const MissingCodeModal: React.FC<MissingCodeModalProps> = ({
  isOpen,
  onClose,
  onContinue,
  onGoBack,
  missingItems,
  totalRules = 0,
  mappedRules = 0,
}) => {
  if (!isOpen || missingItems.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-card border border-orange-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent p-5 border-b border-light-border flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-100 dark:bg-orange-950/50 border border-orange-300 rounded-lg text-primary-orange shadow-xs">
              <AlertTriangle className="w-6 h-6 text-primary-orange animate-bounce" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
                Missing Code & Functions Detected
                <Badge variant="warning" className="text-xs font-mono px-2 py-0.5">
                  {missingItems.length} Not Found
                </Badge>
              </h2>
              <p className="text-xs text-secondary-text mt-0.5">
                Some requirements or functions from your uploaded story were not found in the codebase repository.
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

        {/* Modal Body: Stats & Missing Items List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Summary Banner */}
          <div className="bg-input-bg border border-light-border rounded-lg p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-secondary-text">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>Mapped in Codebase: <strong className="text-foreground">{mappedRules}</strong> / {totalRules || (mappedRules + missingItems.length)} rules</span>
            </div>
            <div className="flex items-center gap-2 text-primary-orange font-semibold">
              <FileQuestion className="w-4 h-4" />
              <span>Unmapped Stories: {missingItems.length}</span>
            </div>
          </div>

          <div className="text-xs font-medium text-secondary-text">
            The following stories, rules, or functions do not have matching implementations in your scanned Git repository:
          </div>

          {/* Missing Items Cards */}
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {missingItems.map((item, idx) => (
              <div 
                key={idx}
                className="p-3.5 bg-input-bg/70 border border-orange-200 dark:border-orange-950/60 rounded-lg space-y-2 hover:border-orange-400 transition-colors shadow-2xs"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.rule_code && (
                      <span className="text-[11px] font-mono font-bold text-primary-orange px-1.5 py-0.5 bg-white dark:bg-card border border-orange-200 rounded">
                        {item.rule_code}
                      </span>
                    )}
                    <span className="text-xs font-bold text-primary-text">
                      {item.story_name || 'Story Requirement'}
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-semibold whitespace-nowrap">
                    No Code in Repo
                  </span>
                </div>

                <p className="text-xs text-secondary-text line-clamp-2 leading-relaxed">
                  {item.rule_text || item.story || 'Requirement criteria specified in uploaded story.'}
                </p>

                {item.reason && (
                  <div className="text-[11px] text-primary-orange/90 italic flex items-center gap-1.5 pt-1 border-t border-light-border/60">
                    <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.reason}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Prompt */}
          <div className="p-3.5 bg-muted border border-light-border rounded-lg text-center">
            <p className="text-xs font-semibold text-primary-text">
              Do you want to continue without these missing items, or go back to modify your story / repository?
            </p>
            <p className="text-[11px] text-secondary-text mt-0.5">
              Continuing will proceed with test generation for the mapped features only.
            </p>
          </div>
        </div>

        {/* Modal Footer: Action Buttons */}
        <div className="p-4 bg-muted/60 border-t border-light-border flex items-center justify-between gap-3">
          <Button 
            variant="secondary" 
            onClick={onGoBack}
            className="text-xs"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Go Back to Upload
          </Button>

          <Button 
            onClick={onContinue}
            className="text-xs shadow-md"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Continue Without These
          </Button>
        </div>
      </div>
    </div>
  );
};
