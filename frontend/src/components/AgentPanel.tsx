import { useState } from 'react';
import { FaRobot, FaBug, FaEye, FaFlask, FaBolt } from 'react-icons/fa';
import axios from 'axios';
import AgentCard from './AgentCard';
import MarkdownRenderer from './MarkdownRenderer';

interface AgentPanelProps {
  code: string;
  onDebugReport: (report: any) => void;
  onLog: (message: string) => void;
}

export default function AgentPanel({ code, onDebugReport, onLog }: AgentPanelProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const agents = [
    { type: 'architect', label: 'Architect', role: 'System Design', icon: <FaRobot className="text-xl" />, color: 'purple' as const },
    { type: 'debugger', label: 'Debugger', role: 'Error Analysis', icon: <FaBug className="text-xl" />, color: 'blue' as const },
    { type: 'reviewer', label: 'Reviewer', role: 'Code Quality', icon: <FaEye className="text-xl" />, color: 'blue' as const },
    { type: 'tester', label: 'Tester', role: 'QA Engineer', icon: <FaFlask className="text-xl" />, color: 'green' as const },
    { type: 'productivity', label: 'Productivity', role: 'Docs & Diagrams', icon: <FaBolt className="text-xl" />, color: 'purple' as const }
  ];

  const handleAgentClick = async (agentType: string) => {
    setLoading(agentType);
    onLog(`${agentType.charAt(0).toUpperCase() + agentType.slice(1)} Agent started...`);
    try {
      const response = await axios.post('http://localhost:5000/api/agents/execute', {
        agentType,
        code
      });
      setResult(response.data);
      onLog(`${agentType.charAt(0).toUpperCase() + agentType.slice(1)} Agent completed successfully`);
      if (agentType === 'debugger') {
        onDebugReport(response.data);
      }
    } catch (error) {
      console.error('Agent execution failed:', error);
      onLog(`${agentType.charAt(0).toUpperCase() + agentType.slice(1)} Agent failed: ${error}`);
    } finally {
      setLoading(null);
    }
  };

  const renderContent = () => {
    if (!result) return null;

    let content = '';
    if (typeof result.data === 'string') {
      content = result.data;
    } else {
      // If it's an object (like from Debugger), try to format it nicely or just dump it
      content = "```json\n" + JSON.stringify(result.data, null, 2) + "\n```";
    }

    return <MarkdownRenderer content={content} />;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {agents.map(agent => (
          <AgentCard
            key={agent.type}
            name={agent.label}
            role={agent.role}
            icon={agent.icon}
            color={agent.color}
            onClick={() => handleAgentClick(agent.type)}
            isLoading={loading === agent.type}
          />
        ))}
      </div>

      {result && (
        <div className="glass-card rounded-xl p-4 border border-void-border animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h4 className="font-header font-bold mb-3 text-gold flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gold"></span>
            {result.agentType} Analysis
          </h4>
          <div className="bg-void-surface/50 rounded p-3 max-h-96 overflow-y-auto border border-void-border/50">
            {renderContent()}
          </div>
        </div>
      )}
    </div>
  );
}
