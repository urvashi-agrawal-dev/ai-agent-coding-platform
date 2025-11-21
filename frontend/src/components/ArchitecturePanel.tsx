import { useState } from 'react';
import { FaChartLine, FaPlay, FaDownload } from 'react-icons/fa';
import axios from 'axios';

export default function ArchitecturePanel({ code, onData }: any) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const analyzeArchitecture = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/agents/execute', {
        agentType: 'architect',
        code
      });
      setAnalysis(response.data.data);
      onData?.(response.data.data);
    } catch (error) {
      console.error('Architecture analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Architecture Analysis</h2>
        <button
          onClick={analyzeArchitecture}
          disabled={loading}
          className="px-4 py-2 bg-accent-purple hover:bg-purple-600 rounded-lg flex items-center space-x-2 transition disabled:opacity-50"
        >
          <FaChartLine className="text-sm" />
          <span>{loading ? 'Analyzing...' : 'Analyze'}</span>
        </button>
      </div>

      {analysis && (
        <>
          {/* Detected Patterns */}
          <div className="bg-dark-bg rounded-lg p-4 border border-dark-border">
            <h3 className="font-semibold mb-3 text-gray-300">Detected Patterns</h3>
            <div className="flex flex-wrap gap-2">
              {analysis.detectedPatterns.map((pattern: string, idx: number) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-accent-purple/20 text-accent-purple rounded-full text-sm border border-accent-purple/30"
                >
                  {pattern}
                </span>
              ))}
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              label="Complexity"
              value={analysis.metrics.complexity}
              max={10}
              inverse
            />
            <MetricCard
              label="Maintainability"
              value={analysis.metrics.maintainability}
              max={10}
            />
            <MetricCard
              label="Modularity"
              value={analysis.metrics.modularity}
              max={10}
            />
            <MetricCard
              label="Testability"
              value={analysis.metrics.testability}
              max={10}
            />
          </div>

          {/* Layer Structure */}
          {analysis.layerStructure && analysis.layerStructure.length > 0 && (
            <div className="bg-dark-bg rounded-lg p-4 border border-dark-border">
              <h3 className="font-semibold mb-4 text-gray-300">Layer Structure</h3>
              <div className="space-y-3">
                {analysis.layerStructure.map((layer: any, idx: number) => (
                  <div key={idx} className="bg-dark-surface rounded p-3 border border-dark-border">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-white">{layer.name}</h4>
                      <span className="text-xs text-gray-400">{layer.files.length} files</span>
                    </div>
                    <div className="text-sm text-gray-400 space-y-1">
                      {layer.responsibilities.map((resp: string, ridx: number) => (
                        <div key={ridx} className="flex items-start space-x-2">
                          <span className="text-accent-blue">•</span>
                          <span>{resp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Design Flaws */}
          {analysis.designFlaws && analysis.designFlaws.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-300">Design Flaws</h3>
              {analysis.designFlaws.map((flaw: any, idx: number) => (
                <FlawCard key={idx} flaw={flaw} />
              ))}
            </div>
          )}

          {/* Recommendations */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-300">Recommendations</h3>
              {analysis.recommendations.slice(0, 5).map((rec: any, idx: number) => (
                <div key={idx} className="bg-dark-bg rounded-lg p-4 border border-dark-border">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-white">{rec.title}</h4>
                    <PriorityBadge priority={rec.priority} />
                  </div>
                  <p className="text-sm text-gray-400 mb-3">{rec.description}</p>
                  <div className="text-sm">
                    <p className="text-accent-green mb-1">Benefits:</p>
                    <ul className="list-disc list-inside text-gray-400 space-y-1">
                      {rec.benefits.map((benefit: string, bidx: number) => (
                        <li key={bidx}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Design Document */}
          {analysis.designDocument && (
            <div className="bg-dark-bg rounded-lg p-4 border border-dark-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-300">Design Document</h3>
                <button className="px-3 py-1 bg-accent-blue hover:bg-blue-600 rounded text-sm flex items-center space-x-2 transition">
                  <FaDownload className="text-xs" />
                  <span>Download</span>
                </button>
              </div>
              <div className="bg-dark-surface rounded p-3 max-h-64 overflow-y-auto">
                <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                  {analysis.designDocument.substring(0, 500)}...
                </pre>
              </div>
            </div>
          )}
        </>
      )}

      {!analysis && !loading && (
        <div className="text-center py-12 text-gray-400">
          <FaChartLine className="text-4xl mx-auto mb-4 opacity-50" />
          <p>Click "Analyze" to review architecture</p>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, max, inverse = false }: any) {
  const percentage = (value / max) * 100;
  const getColor = () => {
    const threshold = inverse ? 
      { good: 30, ok: 60 } : 
      { good: 70, ok: 40 };
    
    if (inverse) {
      if (percentage <= threshold.good) return 'bg-accent-green';
      if (percentage <= threshold.ok) return 'bg-accent-orange';
      return 'bg-accent-red';
    } else {
      if (percentage >= threshold.good) return 'bg-accent-green';
      if (percentage >= threshold.ok) return 'bg-accent-orange';
      return 'bg-accent-red';
    }
  };

  return (
    <div className="bg-dark-bg rounded-lg p-4 border border-dark-border">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-400">{label}</span>
        <span className="text-lg font-bold text-white">{value.toFixed(1)}</span>
      </div>
      <div className="h-2 bg-dark-hover rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor()} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function FlawCard({ flaw }: any) {
  const severityConfig = {
    critical: { color: 'text-accent-red', bg: 'bg-accent-red/10', border: 'border-accent-red/30' },
    high: { color: 'text-accent-orange', bg: 'bg-accent-orange/10', border: 'border-accent-orange/30' },
    medium: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30' },
    low: { color: 'text-accent-blue', bg: 'bg-accent-blue/10', border: 'border-accent-blue/30' }
  };

  const config = severityConfig[flaw.severity as keyof typeof severityConfig];

  return (
    <div className={`rounded-lg p-4 border ${config.border} ${config.bg}`}>
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-white">{flaw.type}</h4>
        <span className={`text-xs font-bold uppercase ${config.color}`}>{flaw.severity}</span>
      </div>
      <p className="text-sm text-gray-300 mb-2">{flaw.description}</p>
      <p className="text-sm text-gray-400 mb-2">
        <span className="text-accent-orange">Impact:</span> {flaw.impact}
      </p>
      <p className="text-sm text-accent-green">
        💡 {flaw.suggestion}
      </p>
    </div>
  );
}

function PriorityBadge({ priority }: any) {
  const config = {
    high: 'bg-accent-red/20 text-accent-red border-accent-red/30',
    medium: 'bg-accent-orange/20 text-accent-orange border-accent-orange/30',
    low: 'bg-accent-blue/20 text-accent-blue border-accent-blue/30'
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-bold uppercase border ${config[priority as keyof typeof config]}`}>
      {priority}
    </span>
  );
}
