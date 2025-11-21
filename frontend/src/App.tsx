import { useState } from 'react';
import CodeEditor from './components/CodeEditor';
import AgentPanel from './components/AgentPanel';
import FileUpload from './components/FileUpload';
import DebugPanel from './components/DebugPanel';
import './App.css';

function App() {
  const [code, setCode] = useState('// Write your code here\n');
  const [debugReport, setDebugReport] = useState(null);

  return (
    <div className="app">
      <header className="app-header">
        <h1>DevMentor-360</h1>
        <p>Multi-Agent Development Platform</p>
      </header>
      
      <div className="app-container">
        <aside className="sidebar">
          <FileUpload />
          <AgentPanel code={code} onDebugReport={setDebugReport} />
        </aside>
        
        <main className="main-content">
          <CodeEditor value={code} onChange={setCode} />
        </main>
        
        <aside className="right-panel">
          <DebugPanel report={debugReport} />
        </aside>
      </div>
    </div>
  );
}

export default App;
