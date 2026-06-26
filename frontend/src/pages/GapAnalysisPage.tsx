import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, AlertCircle, CheckCircle, Info,
  Play, Clock, ChevronDown, ChevronUp, Sparkles,
} from 'lucide-react';
import { gapAnalysisApi } from '../api/gapAnalysis';
import type { GapAnalysisResult, GapFinding, HealthStatus } from '../types';
import Button from '../components/ui/Button';
import { Select } from '../components/ui/Input';

const HEALTH_CONFIG: Record<HealthStatus, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  good:     { label: 'Good',     color: 'text-emerald-600 border-emerald-200', bg: 'bg-emerald-50/70 border-emerald-100', Icon: CheckCircle },
  fair:     { label: 'Fair',     color: 'text-cyan-600 border-cyan-200',    bg: 'bg-cyan-50/70 border-cyan-100',       Icon: Info },
  warning:  { label: 'Warning',  color: 'text-amber-600 border-amber-200',   bg: 'bg-amber-50/70 border-amber-100',    Icon: AlertCircle },
  critical: { label: 'Critical', color: 'text-rose-600 border-rose-200',    bg: 'bg-rose-50/70 border-rose-100',      Icon: AlertTriangle },
  unknown:  { label: 'Unknown',  color: 'text-dark-500 border-dark-200',    bg: 'bg-dark-50 border-dark-100',             Icon: Info },
};

const SEVERITY_CONFIG = {
  high:   { color: 'text-rose-600',   bg: 'bg-rose-50/60 border-rose-100',   dot: 'bg-rose-500' },
  medium: { color: 'text-amber-600',  bg: 'bg-amber-50/60 border-amber-100', dot: 'bg-amber-500' },
  low:    { color: 'text-cyan-600',   bg: 'bg-cyan-50/60 border-cyan-100',   dot: 'bg-cyan-500' },
};

function FindingCard({ finding, index }: { finding: GapFinding; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = SEVERITY_CONFIG[finding.severity];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07 }}
      className={`border rounded-2xl overflow-hidden shadow-soft transition-all duration-300 ${cfg.bg}`}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-4 px-5 py-4.5 text-left focus:outline-none"
      >
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${cfg.color}`}>
              {finding.severity}
            </span>
            <span className="text-dark-400 text-xs font-mono">{finding.rule_id}</span>
          </div>
          <p className="text-dark-900 text-sm font-bold mt-1">{finding.title}</p>
        </div>
        <div className="text-dark-400 flex-shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-3.5 border-t border-dark-100/50 dark:border-dark-700/50 pt-4">
              <div>
                <p className="text-dark-400 dark:text-dark-500 text-xs uppercase tracking-wider font-bold mb-1">Metric</p>
                <p className={`text-sm font-bold ${cfg.color}`}>{finding.metric}</p>
              </div>
              <div>
                <p className="text-dark-400 dark:text-dark-500 text-xs uppercase tracking-wider font-bold mb-1">What this means</p>
                <p className="text-dark-700 dark:text-dark-300 text-sm font-medium leading-relaxed">{finding.description}</p>
              </div>
              <div>
                <p className="text-dark-400 dark:text-dark-500 text-xs uppercase tracking-wider font-bold mb-1">Recommendation</p>
                <p className="text-dark-700 dark:text-dark-300 text-sm font-medium leading-relaxed">{finding.recommendation}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function GapAnalysisPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GapAnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [monthsBack, setMonthsBack] = useState('3');
  const [analysisRan, setAnalysisRan] = useState(false);

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await gapAnalysisApi.run(Number(monthsBack));
      setResult(res.result);
      setAnalysisRan(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }, [monthsBack]);

  const health = result ? HEALTH_CONFIG[result.overall_health] : null;

  const renderMarkdown = (text: string) => {
    const blocks = text.split(/\n\n+/);

    const parseInlineStyles = (rawText: string) => {
      const parts = rawText.split(/\*\*([^*]+)\*\*/g);
      if (parts.length === 1) return rawText;
      return parts.map((part, index) => {
        if (index % 2 === 1) {
          return <strong key={index} className="font-bold text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 px-1 rounded text-sm">{part}</strong>;
        }
        return part;
      });
    };

    return blocks.map((block, bIdx) => {
      const trimmedBlock = block.trim();
      if (!trimmedBlock) return null;

      // Headers
      if (trimmedBlock.startsWith('# ')) {
        return (
          <h3 key={bIdx} className="text-sm font-extrabold text-brand-800 dark:text-brand-300 mt-4 mb-2 first:mt-0 border-b border-brand-200 dark:border-brand-800/50 pb-1">
            {parseInlineStyles(trimmedBlock.slice(2))}
          </h3>
        );
      }
      if (trimmedBlock.startsWith('## ')) {
        return (
          <h4 key={bIdx} className="text-sm font-extrabold text-brand-700 dark:text-brand-400 mt-4 mb-2 first:mt-0">
            {parseInlineStyles(trimmedBlock.slice(3))}
          </h4>
        );
      }
      if (trimmedBlock.startsWith('### ')) {
        return (
          <h5 key={bIdx} className="text-sm font-bold text-brand-600 dark:text-brand-400 mt-3 mb-1">
            {parseInlineStyles(trimmedBlock.slice(4))}
          </h5>
        );
      }

      // Check if block represents a list
      const lines = trimmedBlock.split('\n');
      const isListBlock = lines.some(line => {
        const tLine = line.trim();
        return tLine.match(/^[-*]\s+/) || tLine.match(/^\*\*[-*]\s*/) || tLine.match(/^(\d+)\.\s+/) || tLine.match(/^\*\*(\d+)\.\s*/);
      });

      if (isListBlock) {
        return (
          <div key={bIdx} className="space-y-1.5 my-1.5">
            {lines.map((line, lIdx) => {
              const trimmedLine = line.trim();
              
              // Bullet lists
              let isBullet = false;
              let bulletRestText = '';
              const matchNormalBullet = trimmedLine.match(/^[-*]\s+(.*)/);
              const matchBoldBullet = trimmedLine.match(/^\*\*[-*]\s*(.*)/);

              if (matchBoldBullet) {
                isBullet = true;
                bulletRestText = matchBoldBullet[1].includes('**') ? '**' + matchBoldBullet[1] : matchBoldBullet[1];
              } else if (matchNormalBullet) {
                isBullet = true;
                bulletRestText = matchNormalBullet[1];
              }

              if (isBullet) {
                return (
                  <div key={lIdx} className="flex gap-1 text-sm text-dark-700 dark:text-dark-300 leading-relaxed items-start pl-6">
                    <span className="flex-shrink-0 w-6 flex justify-end items-center pr-2 h-5 text-sm text-dark-500 dark:text-dark-400 select-none font-bold">•</span>
                    <span className="flex-1">{parseInlineStyles(bulletRestText)}</span>
                  </div>
                );
              }

              // Numbered lists
              let isNumbered = false;
              let numRestText = '';
              const matchNormalNum = trimmedLine.match(/^(\d+)\.\s+(.*)/);
              const matchBoldStartNum = trimmedLine.match(/^\*\*(\d+)\.\s*(.*)/);
              const matchBoldBothNum = trimmedLine.match(/^\*\*(\d+)\.\*\*\s*(.*)/);

              if (matchBoldBothNum) {
                isNumbered = true;
                numRestText = matchBoldBothNum[2];
              } else if (matchBoldStartNum) {
                isNumbered = true;
                numRestText = matchBoldStartNum[2].includes('**') ? '**' + matchBoldStartNum[2] : matchBoldStartNum[2];
              } else if (matchNormalNum) {
                isNumbered = true;
                numRestText = matchNormalNum[2];
              }

              if (isNumbered) {
                return (
                  <div key={lIdx} className="flex gap-1 text-sm text-dark-700 dark:text-dark-300 leading-relaxed items-start pl-6">
                    <span className="flex-shrink-0 w-6 flex justify-end items-center pr-2 h-5 text-sm text-dark-500 dark:text-dark-400 select-none font-bold">•</span>
                    <span className="flex-1">{parseInlineStyles(numRestText)}</span>
                  </div>
                );
              }

              return (
                <p key={lIdx} className="text-sm text-dark-700 dark:text-dark-300 leading-relaxed pl-6">
                  {parseInlineStyles(trimmedLine)}
                </p>
              );
            })}
          </div>
        );
      }

      // Standard paragraph - merge single-line hard breaks
      const mergedText = lines.map(line => line.trim()).join(' ');

      return (
        <p key={bIdx} className="text-sm text-[#3B3054] leading-relaxed my-1.5">
          {parseInlineStyles(mergedText)}
        </p>
      );
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Controls */}
      <div className="bg-white border border-dark-100 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-dark-900 font-bold text-lg">AI-Powered Gap Analysis</h2>
            <p className="text-dark-500 text-sm mt-1">
              Detect financial risks in your data and get AI-generated recommendations.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Select
              value={monthsBack}
              onChange={(e) => setMonthsBack(e.target.value)}
              options={[
                { value: '1', label: '1 month' },
                { value: '3', label: '3 months' },
                { value: '6', label: '6 months' },
              ]}
              className="w-32"
            />
            <Button onClick={runAnalysis} loading={loading} size="md">
              <Play className="w-4 h-4 fill-current" />
              {loading ? 'Analyzing…' : 'Run Analysis'}
            </Button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin" />
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-brand-500 animate-pulse" />
          </div>
          <div className="text-center">
            <p className="text-dark-800 font-bold">Analyzing your financial data…</p>
            <p className="text-dark-400 text-sm mt-1">Running rule checks and generating AI insights</p>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Health Status */}
          {health && (
            <div className={`flex items-center gap-4 p-6 border rounded-2xl shadow-soft ${health.bg}`}>
              <health.Icon className={`w-8 h-8 ${health.color} flex-shrink-0`} />
              <div>
                <p className="text-dark-500 text-xs font-semibold uppercase tracking-wider">Overall Financial Health</p>
                <p className={`text-2xl font-bold ${health.color} mt-0.5`}>{health.label}</p>
                <p className="text-dark-400 text-xs mt-1.5 flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  Generated {new Date(result.generated_at).toLocaleString()}
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-dark-500 text-xs font-medium">Risks detected</p>
                <p className={`text-3xl font-extrabold ${health.color} mt-0.5`}>{result.finding_count}</p>
              </div>
            </div>
          )}

          {/* Findings */}
          {result.rule_findings.length === 0 ? (
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 text-center shadow-soft">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <p className="text-emerald-600 font-bold text-lg">No risks detected!</p>
              <p className="text-dark-500 text-sm mt-1">Your finances look healthy for the selected period.</p>
            </div>
          ) : (
            <div>
              <h3 className="text-dark-500 text-xs font-bold uppercase tracking-wider mb-3">
                Risk Findings ({result.rule_findings.length})
              </h3>
              <div className="space-y-3">
                {result.rule_findings.map((f, i) => (
                  <FindingCard key={f.rule_id} finding={f} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* AI Explanation */}
          {result.ai_explanation && (
            <div className="bg-[#F8F5FE] border border-[#E5DCFC] rounded-2xl p-6 shadow-soft">
              <div className="flex items-center gap-3.5 mb-4 border-b border-[#E5DCFC] pb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#EDE5FC] text-[#7C3AED] border border-[#E5DCFC]">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-[#2D1A54] font-bold text-sm leading-tight">AI Analysis</h3>
                  <p className="text-[10px] text-[#7A6E99] font-semibold mt-0.5">Powered by Gemini Flash</p>
                </div>
              </div>
              <div className="max-w-none text-[#3B3054] leading-relaxed font-sans space-y-3">
                {renderMarkdown(result.ai_explanation)}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Empty state (before first run) */}
      {!loading && !analysisRan && !error && (
        <div className="text-center py-16 text-dark-400 bg-white border border-dark-100 rounded-2xl shadow-sm">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-30 text-brand-500" />
          <p className="font-bold text-dark-900 text-lg">Run your first gap analysis</p>
          <p className="text-sm mt-1 text-dark-500 font-medium">Select a period above and click "Run Analysis"</p>
        </div>
      )}
    </div>
  );
}
