import { useState } from 'react';
import { FaBug, FaExclamationTriangle, FaInfoCircle, FaPlay } from 'react-icons/fa';
import axios from 'axios';

export default function BugTraceViewer({ code, report }: any) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const analyzeCode = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/debug/analyze', {
        code,
        language: 'javascript',
        autoFix: false
      });
      setAnalysis(response.data.data);
    } catch (error) {
      console.error('Debug analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const executionResult = analysis?.executionResult;
  const rootCause = analysis?.rootCauseAnalysis;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Bug Trace Viewer</h2>
        <button
          onClick={analyzeCode}
          disabled={loading}
          className="px-4 py-2 bg-accent-red hover:bg-red-600 rounded-lg flex items-center space-x-2 transition disabled:opacity-50"
        >
          <FaBug className="text-sm" />
          <span>{loading ? 'Analyzing...' : 'Analyze'}</span>
        </button>
      </div>

      {executionResult && (
        <>
          {/* Execution Status */}
          <div className={`rounded-lg p-4 border ${
            executionResult.success 
              ? 'border-accent-green/20 bg-accent-green/5' 
              : 'border-accent-red/20 bg-accent-red/5'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {executionResult.success ? (
                  <FaCheckCircle className="text-accent-green text-xl" />
                ) : (
                  <FaBug className="text-accent-red text-xl" />
                )}
                <div>
                  <p className="font-semibold text-white">
                    {executionResult.success ? 'Execution Successful' : 'Execution Failed'}
                  </p>
                  <p className="text-sm text-gray-400">
                    Completed in {executionResult.executionTime}ms
                  </p>
                </div>
              </div>
            </div>

            {executionResult.error && (
              <div className="mt-4 bg-dark-bg rounded p-3">
                <pre className="text-sm text-accent-red overflow-x-auto">
                  {executionResult.error}
                </pre>
              </div>
            )}
          </div>

          {/* Stack Trace */}
          {executionResult.stackTrace && (
            <div className="bg-dark-bg rounded-lg p-4 border border-dark-border">
              <h3 className="font-semibold mb-4 text-gray-300 flex items-center space-x-2">
                <span>📍</span>
                <span>Stack Trace</span>
              </h3>
              <div className="space-y-2">
                {executionResult.stackTrace.stack.map((frame: any, idx: number) => (
                  <div key={idx} className="bg-dark-surface rounded p-3 border border-dark-border">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-accent-red/20 text-accent-red flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-mono text-accent-blue">{frame.function}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {frame.file}:{frame.line}:{frame.column}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Root Cause Analysis */}
          {rootCause && (
            <div className="bg-dark-bg rounded-lg p-4 border border-accent-purple/30">
              <h3 className="font-semibold mb-4 text-accent-purple flex items-center space-x-2">
                <span>🔍</span>
                <span>Root Cause Analysis</span>
              </h3>

              <div className="space-y-4">
                <div className="bg-dark-surface rounded p-4 border border-dark-border">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">What Happened:</h4>
                  <p className="text-white leading-relaxed">{rootCause.explanation}</p>
                </div>

                <div className="bg-dark-surface rounded p-4 border border-dark-border">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">Technical Cause:</h4>
                  <p className="text-accent-orange">{rootCause.rootCause}</p>
                </div>

                <div className="bg-dark-surface rounded p-4 border border-dark-border">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">Suggested Fix:</h4>
                  <p className="text-accent-green">{rootCause.suggestedFix}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">Confidence:</span>
                  <div className="flex-1 h-2 bg-dark-hover rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent-orange to-accent-green transition-all"
                      style={{ width: `${rootCause.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-white">
                    {Math.round(rootCause.confidence * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Static Analysis Issues */}
      {analysis?.staticAnalysis && analysis.staticAnalysis.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-300">Static Analysis Issues</h3>
          {analysis.staticAnalysis.map((issue: any, idx: number) => (
            <IssueCard key={idx} issue={issue} />
          ))}
        </div>
      )}

      {!analysis && !loading && (
        <div className="text-center py-12 text-gray-400">
          <FaBug className="text-4xl mx-auto mb-4 opacity-50" />
          <p>Click "Analyze" to detect bugs and trace execution</p>
        </div>
      )}
    </div>
  );
}

function IssueCard({ issue }: any) {
  const typeConfig = {
    error: { icon: FaBug, color: 'text-accent-red', bg: 'bg-accent-red/10', border: 'border-accent-red/30' },
    warning: { icon: FaExclamationTriangle, color: 'text-accent-orange', bg: 'bg-accent-orange/10', border: 'border-accent-orange/30' },
    info: { icon: FaInfoCircle, color: 'text-accent-blue', bg: 'bg-accent-blue/10', border: 'border-accent-blue/30' }
  };

  const config = typeConfig[issue.type as keyof typeof typeConfig];
  const Icon = config.icon;

  return (
    <div className={`rounded-lg p-4 border ${config.border} ${config.bg}`}>
      <div className="flex items-start space-x-3">
        <Icon className={`${config.color} mt-1 flex-shrink-0`} />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-white">{issue.message}</p>
            <span className="text-xs text-gray-400">Line {issue.line}</span>
          </div>
          {issue.suggestion && (
            <p className="text-sm text-gray-400 mt-2">💡 {issue.suggestion}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function FaCheckCircle({ className }: any) {
  return <div className={className}>✓</div>;
}
