import { useState } from 'react';
import { FaRobot, FaBug, FaEye, FaFlask, FaBolt } from 'react-icons/fa';
import axios from 'axios';

interface AgentPanelProps {
  code: string;
  onDebugReport: (report: any) => void;
}

export default function AgentPanel({ code, onDebugReport }: AgentPanelProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const agents = [
    { type: 'architect', label: 'Architect', icon: FaRobot, color: 'bg-accent-purple' },
    { type: 'debugger', label: 'Debugger', icon: FaBug, color: 'bg-accent-red' },
    { type: 'reviewer', label: 'Reviewer', icon: FaEye, color: 'bg-accent-blue' },
    { type: 'tester', label: 'Tester', icon: FaFlask, color: 'bg-accent-green' },
    { type: 'productivity', label: 'Productivity', icon: FaBolt, color: 'bg-accent-orange' }
  ];

  const handleAgentClick = async (agentType: string) => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/agents/execute', {
        agentType,
        code
      });
      setResult(response.data);
      if (agentType === 'debugger') {
        onDebugReport(response.data);
      }
    } catch (error) {
      console.error('Agent execution failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold text-white">AI Agents</h2>
      
      <div className="space-y-3">
        {agents.map(agent => {
          const Icon = agent.icon;
          return (
            <button
              key={agent.type}
              onClick={() => handleAgentClick(agent.type)}
              disabled={loading}
              className={`w-full ${agent.color} hover:opacity-90 rounded-lg p-4 flex items-center space-x-3 transition disabled:opacity-50`}
            >
              <Icon className="text-xl" />
              <span className="font-semibold">{agent.label}</span>
            </button>
          );
        })}
      </div>
      
      {result && (
        <div className="bg-dark-bg rounded-lg p-4 border border-dark-border">
          <h4 className="font-semibold mb-3 text-gray-300">{result.agentType} Results</h4>
          <div className="bg-dark-surface rounded p-3 max-h-96 overflow-y-auto">
            <pre className="text-xs text-gray-300 whitespace-pre-wrap">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
