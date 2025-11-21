import { useState } from 'react';
import { RootCauseAnalysis, ExecutionResult } from '@devmentor/shared';
import axios from 'axios';

interface DebugAnalyzerProps {
  code: string;
  language: string;
  onPatchApplied: (patchedCode: string) => void;
}

export default function DebugAnalyzer({ code, language, onPatchApplied }: DebugAnalyzerProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showPatch, setShowPatch] = useState(false);

  const analyzeCode = async (autoFix: boolean = false) => {
    setAnalyzing(true);
    try {
      const response = await axios.post('http://localhost:5000/api/debug/analyze', {
        code,
        language,
        autoFix
      });
      setResult(response.data);
      if (response.data.data.rootCauseAnalysis?.patchedCode) {
        setShowPatch(true);
      }
    } catch (error) {
      console.error('Debug analysis failed:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const applyPatch = async () => {
    if (!result?.data.rootCauseAnalysis?.patchedCode) return;
    
    try {
      await axios.post('http://localhost:5000/api/debug/apply-patch', {
        originalCode: code,
        patchedCode: result.data.rootCauseAnalysis.patchedCode
      });
      onPatchApplied(result.data.rootCauseAnalysis.patchedCode);
      setShowPatch(false);
      alert('Patch applied successfully!');
    } catch (error) {
      alert('Failed to apply patch');
    }
  };

  const executionResult: ExecutionResult | null = result?.data.executionResult;
  const rootCause: RootCauseAnalysis | null = result?.data.rootCauseAnalysis;

  return (
    <div className="debug-analyzer">
      <div className="debug-controls">
        <button 
          onClick={() => analyzeCode(false)} 
          disabled={analyzing}
          className="btn-primary"
        >
          {analyzing ? 'Analyzing...' : '🐛 Run Debug Analysis'}
        </button>
        <button 
          onClick={() => analyzeCode(true)} 
          disabled={analyzing}
          className="btn-secondary"
        >
          🔧 Analyze & Auto-Fix
        </button>
      </div>

      {executionResult && (
        <div className="execution-result">
          <h4>Execution Result</h4>
          <div className={`status ${executionResult.success ? 'success' : 'error'}`}>
            {executionResult.success ? '✅ Success' : '❌ Failed'}
            <span className="exec-time">({executionResult.executionTime}ms)</span>
          </div>
          
          {executionResult.output && (
            <div className="output-section">
              <h5>Output:</h5>
              <pre>{executionResult.output}</pre>
            </div>
          )}
          
          {executionResult.error && (
            <div className="error-section">
              <h5>Error:</h5>
              <pre className="error-text">{executionResult.error}</pre>
            </div>
          )}

          {executionResult.stackTrace && (
            <div className="stack-trace">
              <h5>Stack Trace:</h5>
              <div className="error-type">{executionResult.stackTrace.type}</div>
              <div className="error-message">{executionResult.stackTrace.message}</div>
              <div className="stack-frames">
                {executionResult.stackTrace.stack.map((frame, idx) => (
                  <div key={idx} className="stack-frame">
                    at {frame.function} ({frame.file}:{frame.line}:{frame.column})
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {rootCause && (
        <div className="root-cause-analysis">
          <h4>🔍 Root Cause Analysis</h4>
          
          <div className="analysis-section">
            <h5>What Happened (Simple English):</h5>
            <p className="explanation">{rootCause.explanation}</p>
          </div>

          <div className="analysis-section">
            <h5>Technical Root Cause:</h5>
            <p className="root-cause">{rootCause.rootCause}</p>
          </div>

          <div className="analysis-section">
            <h5>Suggested Fix:</h5>
            <p className="suggested-fix">{rootCause.suggestedFix}</p>
          </div>

          <div className="confidence-meter">
            <span>Confidence: </span>
            <div className="meter">
              <div 
                className="meter-fill" 
                style={{ width: `${rootCause.confidence * 100}%` }}
              />
            </div>
            <span>{Math.round(rootCause.confidence * 100)}%</span>
          </div>

          {rootCause.patchedCode && showPatch && (
            <div className="patch-section">
              <h5>🔧 Auto-Generated Patch:</h5>
              <pre className="patched-code">{rootCause.patchedCode}</pre>
              <div className="patch-actions">
                <button onClick={applyPatch} className="btn-success">
                  ✅ Apply Patch
                </button>
                <button onClick={() => setShowPatch(false)} className="btn-cancel">
                  ❌ Reject
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
