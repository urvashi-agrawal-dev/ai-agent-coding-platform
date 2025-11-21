import { useState } from 'react';
import axios from 'axios';

interface TestingPanelProps {
  code: string;
  onTestsGenerated: (tests: string) => void;
}

export default function TestingPanel({ code, onTestsGenerated }: TestingPanelProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'generation' | 'execution' | 'coverage'>('generation');

  const generateTests = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/tests/generate', {
        code,
        action: 'generate'
      });
      setResult(response.data);
      if (response.data.data.generation?.generatedTests) {
        onTestsGenerated(response.data.data.generation.generatedTests);
      }
    } catch (error) {
      console.error('Test generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const runFullCycle = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/tests/full-cycle', {
        code
      });
      setResult(response.data);
    } catch (error) {
      console.error('Test cycle failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const generation = result?.data?.generation;
  const execution = result?.data?.execution;
  const fixes = result?.data?.fixes;

  return (
    <div className="testing-panel">
      <h3>🧪 Testing Agent</h3>
      
      <div className="test-controls">
        <button onClick={generateTests} disabled={loading} className="btn-primary">
          {loading ? 'Generating...' : 'Generate Tests'}
        </button>
        <button onClick={runFullCycle} disabled={loading} className="btn-secondary">
          {loading ? 'Running...' : 'Full Test Cycle'}
        </button>
      </div>

      {result && (
        <div className="test-results">
          <div className="tabs">
            <button 
              className={activeTab === 'generation' ? 'active' : ''}
              onClick={() => setActiveTab('generation')}
            >
              Generation
            </button>
            <button 
              className={activeTab === 'execution' ? 'active' : ''}
              onClick={() => setActiveTab('execution')}
              disabled={!execution}
            >
              Execution
            </button>
            <button 
              className={activeTab === 'coverage' ? 'active' : ''}
              onClick={() => setActiveTab('coverage')}
              disabled={!execution?.coverage}
            >
              Coverage
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'generation' && generation && (
              <div className="generation-results">
                <div className="stats">
                  <div className="stat">
                    <span className="stat-label">Tests Generated:</span>
                    <span className="stat-value">{generation.testCount}</span>
                  </div>
                </div>

                <h4>Test Cases:</h4>
                <div className="test-cases">
                  {generation.testCases.map((tc: any, idx: number) => (
                    <div key={idx} className={`test-case ${tc.category}`}>
                      <div className="test-name">{tc.name}</div>
                      <div className="test-desc">{tc.description}</div>
                      <span className="test-badge">{tc.category}</span>
                    </div>
                  ))}
                </div>

                <h4>Generated Code:</h4>
                <pre className="generated-code">{generation.generatedTests}</pre>
              </div>
            )}

            {activeTab === 'execution' && execution && (
              <div className="execution-results">
                <div className="test-summary">
                  <div className={`summary-card ${execution.failed > 0 ? 'failed' : 'passed'}`}>
                    <div className="summary-stat">
                      <span className="big-number">{execution.passed}</span>
                      <span className="label">Passed</span>
                    </div>
                    <div className="summary-stat">
                      <span className="big-number">{execution.failed}</span>
                      <span className="label">Failed</span>
                    </div>
                    <div className="summary-stat">
                      <span className="big-number">{execution.total}</span>
                      <span className="label">Total</span>
                    </div>
                    <div className="summary-stat">
                      <span className="big-number">{execution.duration}ms</span>
                      <span className="label">Duration</span>
                    </div>
                  </div>
                </div>

                <h4>Test Details:</h4>
                <div className="test-details">
                  {execution.details.map((detail: any, idx: number) => (
                    <div key={idx} className={`test-detail ${detail.status}`}>
                      <div className="test-header">
                        <span className="status-icon">
                          {detail.status === 'passed' ? '✅' : 
                           detail.status === 'failed' ? '❌' : '⊘'}
                        </span>
                        <span className="test-name">{detail.name}</span>
                        <span className="duration">{detail.duration}ms</span>
                      </div>
                      {detail.error && (
                        <pre className="test-error">{detail.error}</pre>
                      )}
                    </div>
                  ))}
                </div>

                {fixes && fixes.length > 0 && (
                  <div className="test-fixes">
                    <h4>🔧 Suggested Fixes:</h4>
                    {fixes.map((fix: any, idx: number) => (
                      <div key={idx} className="fix-card">
                        <div className="fix-issue">
                          <strong>Issue:</strong> {fix.issue}
                        </div>
                        <div className="fix-solution">
                          <strong>Fix:</strong> {fix.fix}
                        </div>
                        <details>
                          <summary>View Changes</summary>
                          <div className="fix-diff">
                            <div className="original">
                              <h5>Original:</h5>
                              <pre>{fix.originalTest}</pre>
                            </div>
                            <div className="fixed">
                              <h5>Fixed:</h5>
                              <pre>{fix.fixedTest}</pre>
                            </div>
                          </div>
                        </details>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'coverage' && execution?.coverage && (
              <div className="coverage-results">
                <h4>Code Coverage Report:</h4>
                <div className="coverage-metrics">
                  {['statements', 'branches', 'functions', 'lines'].map(metric => {
                    const value = execution.coverage[metric];
                    const status = value >= 80 ? 'good' : value >= 60 ? 'ok' : 'poor';
                    return (
                      <div key={metric} className="coverage-metric">
                        <div className="metric-header">
                          <span className="metric-name">{metric}</span>
                          <span className={`metric-value ${status}`}>{value}%</span>
                        </div>
                        <div className="metric-bar">
                          <div 
                            className={`metric-fill ${status}`}
                            style={{ width: `${value}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="coverage-summary">
                  {execution.coverage.statements >= 80 ? (
                    <p className="success">✅ Great coverage! Your code is well tested.</p>
                  ) : execution.coverage.statements >= 60 ? (
                    <p className="warning">⚠️ Coverage is acceptable but could be improved.</p>
                  ) : (
                    <p className="error">❌ Low coverage. Add more tests to improve reliability.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
