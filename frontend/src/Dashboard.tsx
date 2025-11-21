import { useState, useEffect } from 'react';
import { 
  FaCode, FaBug, FaFlask, FaRobot, FaFileAlt, 
  FaChartLine, FaMicrophone, FaPlay, FaSave, FaFolderOpen 
} from 'react-icons/fa';
import CodeEditor from './components/CodeEditor';
import AgentPanel from './components/AgentPanel';
import TestResultsCard from './components/TestResultsCard';
import BugTraceViewer from './components/BugTraceViewer';
import ArchitecturePanel from './components/ArchitecturePanel';
import DocumentationPage from './components/DocumentationPage';
import VoiceAssistant from './components/VoiceAssistant';
import ExecutionOutput from './components/ExecutionOutput';
import ProjectManager from './components/ProjectManager';
import axios from 'axios';

type ActiveView = 'editor' | 'tests' | 'bugs' | 'architecture' | 'docs' | 'voice';

export default function Dashboard() {
  const [code, setCode] = useState('// Write your code here\nconsole.log("Hello DevMentor-360!");\n');
  const [language, setLanguage] = useState('javascript');
  const [activeView, setActiveView] = useState<ActiveView>('editor');
  const [debugReport, setDebugReport] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [architectureData, setArchitectureData] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [showProjectManager, setShowProjectManager] = useState(false);

  const runCode = async () => {
    setExecuting(true);
    setExecutionResult(null);
    try {
      const response = await axios.post('http://localhost:5000/api/code/execute', {
        code,
        language,
        timeout: 30000
      });
      setExecutionResult(response.data);
    } catch (error: any) {
      setExecutionResult({
        success: false,
        output: '',
        error: error.response?.data?.error || error.message,
        executionTime: 0,
        language
      });
    } finally {
      setExecuting(false);
    }
  };

  const saveProject = async () => {
    setSaving(true);
    try {
      const projectName = prompt('Enter project name:', currentProjectId ? undefined : 'My Project');
      if (!projectName) {
        setSaving(false);
        return;
      }

      const response = await axios.post('http://localhost:5000/api/project/save', {
        id: currentProjectId,
        name: projectName,
        code,
        language
      });

      if (response.data.success) {
        setCurrentProjectId(response.data.project.id);
        alert('Project saved successfully!');
      }
    } catch (error: any) {
      alert('Failed to save project: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  const loadProject = (project: any) => {
    setCode(project.code);
    setLanguage(project.language);
    setCurrentProjectId(project.id);
    setShowProjectManager(false);
  };

  return (
    <div className="min-h-screen bg-dark-bg text-gray-100">
      {/* Header */}
      <header className="bg-dark-surface border-b border-dark-border">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-accent-blue to-accent-purple rounded-lg flex items-center justify-center">
                <FaRobot className="text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent">
                  DevMentor-360
                </h1>
                <p className="text-sm text-gray-400">AI-Powered Development Assistant</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-3 py-2 bg-dark-hover border border-dark-border rounded-lg text-white focus:outline-none focus:border-accent-blue"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="c">C</option>
                <option value="cpp">C++</option>
              </select>
              
              <button 
                onClick={runCode}
                disabled={executing}
                className="px-4 py-2 bg-accent-green hover:bg-green-600 rounded-lg flex items-center space-x-2 transition disabled:opacity-50"
              >
                <FaPlay className="text-sm" />
                <span>{executing ? 'Running...' : 'Run Code'}</span>
              </button>
              
              <button 
                onClick={() => setShowProjectManager(true)}
                className="px-4 py-2 bg-dark-hover hover:bg-gray-700 rounded-lg flex items-center space-x-2 transition"
              >
                <FaFolderOpen className="text-sm" />
                <span>Load</span>
              </button>
              
              <button 
                onClick={saveProject}
                disabled={saving}
                className="px-4 py-2 bg-dark-hover hover:bg-gray-700 rounded-lg flex items-center space-x-2 transition disabled:opacity-50"
              >
                <FaSave className="text-sm" />
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <aside className="w-20 bg-dark-surface border-r border-dark-border flex flex-col items-center py-6 space-y-6">
          <NavButton 
            icon={<FaCode />} 
            label="Editor" 
            active={activeView === 'editor'}
            onClick={() => setActiveView('editor')}
          />
          <NavButton 
            icon={<FaFlask />} 
            label="Tests" 
            active={activeView === 'tests'}
            onClick={() => setActiveView('tests')}
          />
          <NavButton 
            icon={<FaBug />} 
            label="Bugs" 
            active={activeView === 'bugs'}
            onClick={() => setActiveView('bugs')}
          />
          <NavButton 
            icon={<FaChartLine />} 
            label="Architecture" 
            active={activeView === 'architecture'}
            onClick={() => setActiveView('architecture')}
          />
          <NavButton 
            icon={<FaFileAlt />} 
            label="Docs" 
            active={activeView === 'docs'}
            onClick={() => setActiveView('docs')}
          />
          <NavButton 
            icon={<FaMicrophone />} 
            label="Voice" 
            active={activeView === 'voice'}
            onClick={() => setActiveView('voice')}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex overflow-hidden">
          {/* Code Editor Section */}
          <div className={`flex-1 flex flex-col ${activeView !== 'editor' && activeView !== 'voice' ? 'hidden lg:flex' : ''}`}>
            <div className="bg-dark-surface border-b border-dark-border px-6 py-3 flex items-center justify-between">
              <h2 className="font-semibold text-gray-300">Code Editor</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <span className="capitalize">{language}</span>
                <span>•</span>
                <span>{code.split('\n').length} lines</span>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <CodeEditor value={code} onChange={setCode} />
            </div>
            
            {/* Execution Output */}
            {executionResult && (
              <ExecutionOutput result={executionResult} />
            )}
          </div>

          {/* Right Panel - Dynamic Content */}
          <div className="w-full lg:w-[500px] bg-dark-surface border-l border-dark-border overflow-y-auto">
            {activeView === 'editor' && (
              <AgentPanel code={code} onDebugReport={setDebugReport} />
            )}
            
            {activeView === 'tests' && (
              <TestResultsCard code={code} onResults={setTestResults} />
            )}
            
            {activeView === 'bugs' && (
              <BugTraceViewer code={code} report={debugReport} />
            )}
            
            {activeView === 'architecture' && (
              <ArchitecturePanel code={code} onData={setArchitectureData} />
            )}
            
            {activeView === 'docs' && (
              <DocumentationPage code={code} />
            )}
            
            {activeView === 'voice' && (
              <VoiceAssistant code={code} />
            )}
          </div>
        </main>
      </div>

      {/* Project Manager Modal */}
      {showProjectManager && (
        <ProjectManager
          onClose={() => setShowProjectManager(false)}
          onLoad={loadProject}
        />
      )}
    </div>
  );
}

function NavButton({ icon, label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all group relative ${
        active 
          ? 'bg-accent-blue text-white' 
          : 'text-gray-400 hover:text-white hover:bg-dark-hover'
      }`}
      title={label}
    >
      <span className="text-xl">{icon}</span>
      <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        {label}
      </span>
    </button>
  );
}
