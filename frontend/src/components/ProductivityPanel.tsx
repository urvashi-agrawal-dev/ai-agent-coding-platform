import { useState } from 'react';
import axios from 'axios';

interface ProductivityPanelProps {
  code: string;
  projectFiles?: any[];
}

export default function ProductivityPanel({ code, projectFiles }: ProductivityPanelProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'readme' | 'docs' | 'summary' | 'diagrams'>('readme');
  const [projectName, setProjectName] = useState('My Project');
  const [description, setDescription] = useState('');

  const generateAll = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/productivity/full', {
        code,
        projectFiles,
        projectName,
        description
      });
      setResult(response.data.data);
    } catch (error) {
      console.error('Documentation generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReadme = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/productivity/readme', {
        code,
        projectFiles,
        projectName,
        description
      });
      setResult({ ...result, readme: response.data.data });
    } catch (error) {
      console.error('README generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReadme = () => {
    if (!result?.readme) return;
    const blob = new Blob([result.readme], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'README.md';
    a.click();
  };

  const downloadDocs = () => {
    if (!result?.apiDocs) return;
    const blob = new Blob([result.apiDocs], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'API_DOCS.md';
    a.click();
  };

  return (
    <div className="productivity-panel">
      <h3>⚡ Productivity Agent</h3>
      
      <div className="project-info">
        <input
          type="text"
          placeholder="Project Name"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="input-field"
        />
        <input
          type="text"
          placeholder="Project Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input-field"
        />
      </div>

      <div className="productivity-controls">
        <button onClick={generateAll} disabled={loading} className="btn-primary">
          {loading ? 'Generating...' : '📚 Generate All Documentation'}
        </button>
        <button onClick={generateReadme} disabled={loading} className="btn-secondary">
          📄 Generate README Only
        </button>
      </div>

      {result && (
        <div className="productivity-results">
          <div className="tabs">
            <button 
              className={activeTab === 'readme' ? 'active' : ''}
              onClick={() => setActiveTab('readme')}
            >
              README
            </button>
            <button 
              className={activeTab === 'docs' ? 'active' : ''}
              onClick={() => setActiveTab('docs')}
              disabled={!result.apiDocs}
            >
              API Docs
            </button>
            <button 
              className={activeTab === 'summary' ? 'active' : ''}
              onClick={() => setActiveTab('summary')}
              disabled={!result.functionSummaries}
            >
              Summary
            </button>
            <button 
              className={activeTab === 'diagrams' ? 'active' : ''}
              onClick={() => setActiveTab('diagrams')}
              disabled={!result.diagrams}
            >
              Diagrams
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'readme' && result.readme && (
              <div className="readme-content">
                <div className="content-header">
                  <h4>README.md</h4>
                  <button onClick={downloadReadme} className="btn-download">
                    ⬇️ Download
                  </button>
                </div>
                <div className="markdown-preview">
                  <pre>{result.readme}</pre>
                </div>
              </div>
            )}

            {activeTab === 'docs' && result.apiDocs && (
              <div className="docs-content">
                <div className="content-header">
                  <h4>API Documentation</h4>
                  <button onClick={downloadDocs} className="btn-download">
                    ⬇️ Download
                  </button>
                </div>
                <div className="markdown-preview">
                  <pre>{result.apiDocs}</pre>
                </div>
              </div>
            )}

            {activeTab === 'summary' && result.functionSummaries && (
              <div className="summary-content">
                <h4>Code Summary</h4>
                
                <div className="summaries-section">
                  <h5>Functions ({result.functionSummaries.length})</h5>
                  {result.functionSummaries.map((func: any, idx: number) => (
                    <div key={idx} className="function-summary">
                      <div className="func-header">
                        <span className="func-name">{func.name}</span>
                        <span className={`complexity-badge ${func.complexity}`}>
                          {func.complexity}
                        </span>
                      </div>
                      <p className="func-desc">{func.description}</p>
                      
                      {func.parameters.length > 0 && (
                        <div className="func-params">
                          <strong>Parameters:</strong>
                          <ul>
                            {func.parameters.map((param: any, pidx: number) => (
                              <li key={pidx}>
                                <code>{param.name}</code>: {param.type}
                                {param.optional && ' (optional)'}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="func-returns">
                        <strong>Returns:</strong> <code>{func.returns}</code>
                      </div>
                      
                      {func.examples.length > 0 && (
                        <div className="func-examples">
                          <strong>Example:</strong>
                          <pre>{func.examples[0]}</pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {result.fileSummaries && (
                  <div className="summaries-section">
                    <h5>Files ({result.fileSummaries.length})</h5>
                    {result.fileSummaries.map((file: any, idx: number) => (
                      <div key={idx} className="file-summary">
                        <div className="file-header">
                          <span className="file-path">{file.path}</span>
                          <span className="file-loc">{file.linesOfCode} lines</span>
                        </div>
                        <p className="file-purpose">{file.purpose}</p>
                        
                        {file.exports.length > 0 && (
                          <div className="file-exports">
                            <strong>Exports:</strong> {file.exports.join(', ')}
                          </div>
                        )}
                        
                        {file.dependencies.length > 0 && (
                          <div className="file-deps">
                            <strong>Dependencies:</strong> {file.dependencies.slice(0, 5).join(', ')}
                            {file.dependencies.length > 5 && ` +${file.dependencies.length - 5} more`}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'diagrams' && result.diagrams && (
              <div className="diagrams-content">
                <h4>Project Diagrams</h4>
                
                <div className="diagram-section">
                  <h5>🏗️ Architecture Diagram</h5>
                  <div className="diagram-box">
                    <pre>{result.diagrams.architectureDiagram}</pre>
                  </div>
                  <p className="diagram-note">
                    Copy this Mermaid diagram to visualize in GitHub or Mermaid Live Editor
                  </p>
                </div>

                <div className="diagram-section">
                  <h5>🔄 Flow Diagram</h5>
                  <div className="diagram-box">
                    <pre>{result.diagrams.flowDiagram}</pre>
                  </div>
                </div>

                <div className="diagram-section">
                  <h5>📦 Class Diagram</h5>
                  <div className="diagram-box">
                    <pre>{result.diagrams.classDiagram}</pre>
                  </div>
                </div>

                <div className="diagram-section">
                  <h5>🔀 Sequence Diagram</h5>
                  <div className="diagram-box">
                    <pre>{result.diagrams.sequenceDiagram}</pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
