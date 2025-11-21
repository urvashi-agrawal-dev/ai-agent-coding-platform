import { useState } from 'react';
import { FaFileAlt, FaDownload, FaPlay } from 'react-icons/fa';
import axios from 'axios';

export default function DocumentationPage({ code }: any) {
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState<any>(null);
  const [projectName, setProjectName] = useState('My Project');
  const [activeTab, setActiveTab] = useState<'readme' | 'api' | 'functions'>('readme');

  const generateDocs = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/productivity/full', {
        code,
        projectName,
        description: ''
      });
      setDocs(response.data.data);
    } catch (error) {
      console.error('Documentation generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReadme = () => {
    if (!docs?.readme) return;
    const blob = new Blob([docs.readme], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'README.md';
    a.click();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Documentation Generator</h2>
        <button
          onClick={generateDocs}
          disabled={loading}
          className="px-4 py-2 bg-accent-blue hover:bg-blue-600 rounded-lg flex items-center space-x-2 transition disabled:opacity-50"
        >
          <FaPlay className="text-sm" />
          <span>{loading ? 'Generating...' : 'Generate'}</span>
        </button>
      </div>

      {/* Project Info */}
      <div className="bg-dark-bg rounded-lg p-4 border border-dark-border">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Project Name
        </label>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded-lg text-white focus:outline-none focus:border-accent-blue transition"
          placeholder="Enter project name"
        />
      </div>

      {docs && (
        <>
          {/* Tabs */}
          <div className="flex space-x-2 border-b border-dark-border">
            <TabButton
              active={activeTab === 'readme'}
              onClick={() => setActiveTab('readme')}
              label="README"
            />
            <TabButton
              active={activeTab === 'api'}
              onClick={() => setActiveTab('api')}
              label="API Docs"
            />
            <TabButton
              active={activeTab === 'functions'}
              onClick={() => setActiveTab('functions')}
              label="Functions"
            />
          </div>

          {/* Tab Content */}
          <div className="space-y-4">
            {activeTab === 'readme' && docs.readme && (
              <div className="bg-dark-bg rounded-lg p-4 border border-dark-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-300">README.md</h3>
                  <button
                    onClick={downloadReadme}
                    className="px-3 py-1 bg-accent-green hover:bg-green-600 rounded text-sm flex items-center space-x-2 transition"
                  >
                    <FaDownload className="text-xs" />
                    <span>Download</span>
                  </button>
                </div>
                <div className="bg-dark-surface rounded p-4 max-h-[600px] overflow-y-auto">
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                    {docs.readme}
                  </pre>
                </div>
              </div>
            )}

            {activeTab === 'api' && docs.apiDocs && (
              <div className="bg-dark-bg rounded-lg p-4 border border-dark-border">
                <h3 className="font-semibold text-gray-300 mb-4">API Documentation</h3>
                <div className="bg-dark-surface rounded p-4 max-h-[600px] overflow-y-auto">
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                    {docs.apiDocs}
                  </pre>
                </div>
              </div>
            )}

            {activeTab === 'functions' && docs.functionSummaries && (
              <div className="space-y-3">
                {docs.functionSummaries.map((func: any, idx: number) => (
                  <FunctionCard key={idx} func={func} />
                ))}
              </div>
            )}
          </div>

          {/* Diagrams */}
          {docs.diagrams && (
            <div className="bg-dark-bg rounded-lg p-4 border border-dark-border">
              <h3 className="font-semibold text-gray-300 mb-4">Architecture Diagram</h3>
              <div className="bg-dark-surface rounded p-4 overflow-x-auto">
                <pre className="text-xs text-accent-green font-mono">
                  {docs.diagrams.architectureDiagram}
                </pre>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Copy this Mermaid diagram to visualize in GitHub or Mermaid Live Editor
              </p>
            </div>
          )}
        </>
      )}

      {!docs && !loading && (
        <div className="text-center py-12 text-gray-400">
          <FaFileAlt className="text-4xl mx-auto mb-4 opacity-50" />
          <p>Click "Generate" to create documentation</p>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 font-medium transition ${
        active
          ? 'text-accent-blue border-b-2 border-accent-blue'
          : 'text-gray-400 hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}

function FunctionCard({ func }: any) {
  const complexityConfig = {
    low: { color: 'text-accent-green', bg: 'bg-accent-green/10' },
    medium: { color: 'text-accent-orange', bg: 'bg-accent-orange/10' },
    high: { color: 'text-accent-red', bg: 'bg-accent-red/10' }
  };

  const config = complexityConfig[func.complexity as keyof typeof complexityConfig];

  return (
    <div className="bg-dark-bg rounded-lg p-4 border border-dark-border">
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-mono font-bold text-accent-blue">{func.name}()</h4>
        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${config.color} ${config.bg}`}>
          {func.complexity}
        </span>
      </div>
      
      <p className="text-sm text-gray-300 mb-3">{func.description}</p>

      {func.parameters.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-400 mb-2">Parameters:</p>
          <div className="space-y-1">
            {func.parameters.map((param: any, idx: number) => (
              <div key={idx} className="text-sm">
                <span className="font-mono text-accent-purple">{param.name}</span>
                <span className="text-gray-400">: {param.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-3">
        <p className="text-xs font-semibold text-gray-400 mb-1">Returns:</p>
        <span className="text-sm font-mono text-accent-green">{func.returns}</span>
      </div>

      {func.examples.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-2">Example:</p>
          <div className="bg-dark-surface rounded p-2">
            <code className="text-xs text-accent-blue">{func.examples[0]}</code>
          </div>
        </div>
      )}
    </div>
  );
}
