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
  good:     { label: 'Good',     color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30', Icon: CheckCircle },
  fair:     { label: 'Fair',     color: 'text-cyan-400',    bg: 'bg-cyan-500/15 border-cyan-500/30',       Icon: Info },
  warning:  { label: 'Warning',  color: 'text-amber-400',   bg: 'bg-amber-500/15 border-amber-500/30',    Icon: AlertCircle },
  critical: { label: 'Critical', color: 'text-rose-400',    bg: 'bg-rose-500/15 border-rose-500/30',      Icon: AlertTriangle },
  unknown:  { label: 'Unknown',  color: 'text-slate-500',    bg: 'bg-slate-100 border-slate-200',             Icon: Info },
};

const SEVERITY_CONFIG = {
  high:   { color: 'text-rose-400',   bg: 'bg-rose-500/10 border-rose-500/20',   dot: 'bg-rose-400' },
  medium: { color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-400' },
  low:    { color: 'text-cyan-400',   bg: 'bg-cyan-500/10 border-cyan-500/20',   dot: 'bg-cyan-400' },
};

function FindingCard({ finding, index }: { finding: GapFinding; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = SEVERITY_CONFIG[finding.severity];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07 }}
      className={`border rounded-xl overflow-hidden ${cfg.bg}`}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left"
      >
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold uppercase tracking-wide ${cfg.color}`}>
              {finding.severity}
            </span>
            <span className="text-slate-500 text-xs">{finding.rule_id}</span>
          </div>
          <p className="text-slate-900 text-sm font-medium mt-0.5">{finding.title}</p>
        </div>
        <div className="text-slate-500 flex-shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 space-y-3 border-t border-slate-200 pt-3">
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Metric</p>
                <p className={`text-sm font-semibold ${cfg.color}`}>{finding.metric}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">What this means</p>
                <p className="text-slate-600 text-sm">{finding.description}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Recommendation</p>
                <p className="text-slate-600 text-sm">{finding.recommendation}</p>
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

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-slate-900 font-semibold">AI-Powered Gap Analysis</h2>
            <p className="text-slate-500 text-sm mt-1">
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
              <Play className="w-4 h-4" />
              {loading ? 'Analysing…' : 'Run Analysis'}
            </Button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-violet-400" />
          </div>
          <div className="text-center">
            <p className="text-slate-600 font-medium">Analysing your financial data…</p>
            <p className="text-slate-500 text-sm mt-1">Running rule checks and generating AI insights</p>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {/* Health Status */}
          {health && (
            <div className={`flex items-center gap-4 p-5 border rounded-2xl ${health.bg}`}>
              <health.Icon className={`w-8 h-8 ${health.color} flex-shrink-0`} />
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Overall Financial Health</p>
                <p className={`text-2xl font-bold ${health.color}`}>{health.label}</p>
                <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  Generated {new Date(result.generated_at).toLocaleString()}
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-slate-500 text-xs">Risks detected</p>
                <p className={`text-3xl font-bold ${health.color}`}>{result.finding_count}</p>
              </div>
            </div>
          )}

          {/* Findings */}
          {result.rule_findings.length === 0 ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <p className="text-emerald-400 font-semibold">No risks detected!</p>
              <p className="text-slate-500 text-sm mt-1">Your finances look healthy for the selected period.</p>
            </div>
          ) : (
            <div>
              <h3 className="text-slate-700 text-xs font-semibold uppercase tracking-wide mb-3">
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
            <div className="bg-violet-500/5 border border-violet-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <h3 className="text-violet-300 font-semibold text-sm">AI Analysis</h3>
                <span className="text-slate-400 text-xs ml-auto">Powered by Gemini Flash</span>
              </div>
              <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                {result.ai_explanation}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Empty state (before first run) */}
      {!loading && !analysisRan && !error && (
        <div className="text-center py-16 text-slate-400">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-30 text-slate-400" />
          <p className="font-medium text-slate-900">Run your first gap analysis</p>
          <p className="text-sm mt-1 text-slate-500">Select a period above and click "Run Analysis"</p>
        </div>
      )}
    </div>
  );
}
