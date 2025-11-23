import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import CodeEditor from './CodeEditor';
import AgentPanel from './AgentPanel';
import FileUpload from './FileUpload';
import DebugPanel from './DebugPanel';

export default function Workspace() {
    const navigate = useNavigate();
    const [code, setCode] = useState('// Write your code here\n');
    const [debugReport, setDebugReport] = useState(null);
    const [logs, setLogs] = useState<string[]>(['> DevMentor initialized...', '> Ready for input.']);
    const terminalRef = useRef<HTMLDivElement>(null);

    const sampleCodes = [
        {
            name: 'Off-by-One Error',
            code: `function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i <= items.length; i++) { // Bug: off-by-one
    total += items[i].price;
  }
  return total;
}

const cart = [
  { name: 'Apple', price: 1.5 },
  { name: 'Banana', price: 0.8 }
];
console.log(calculateTotal(cart));`
        },
        {
            name: 'Undefined Variable',
            code: `function greetUser(name) {
  console.log('Hello, ' + userName); // Bug: userName is not defined
}

greetUser('Alice');`
        },
        {
            name: 'Async/Await Issue',
            code: `async function fetchData() {
  const response = fetch('https://api.example.com/data'); // Bug: missing await
  const data = await response.json();
  return data;
}

fetchData().then(console.log);`
        }
    ];

    const loadExample = () => {
        const randomExample = sampleCodes[Math.floor(Math.random() * sampleCodes.length)];
        setCode(randomExample.code);
        addLog(`Loaded example: ${randomExample.name}`);
    };

    const addLog = (message: string) => {
        setLogs(prev => [...prev, `> ${message}`]);
    };

    // Auto-scroll terminal
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="min-h-screen bg-void text-gray-300 font-ui overflow-hidden flex flex-col"
        >
            {/* Header */}
            <header className="h-16 border-b border-void-border bg-void-surface/50 backdrop-blur-md flex items-center justify-between px-6 z-50">
                <div className="flex items-center gap-3">
                    <img src="/logo.jpg" alt="DevMentor-360" className="w-14 h-14 object-contain" />
                    <h1 className="font-header text-2xl text-transparent bg-clip-text bg-gradient-to-r from-gold to-white font-bold tracking-wider">
                        DEVMENTOR<span className="text-gold-dim">360</span>
                    </h1>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                    <button
                        onClick={() => navigate('/')}
                        className="px-4 py-2 rounded-md border border-void-border bg-void-surface hover:border-gold/50 hover:text-gold transition-all duration-300 flex items-center gap-2"
                    >
                        <span>←</span> Back to Home
                    </button>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-psy-blue/30 bg-void-surface/50">
                        <span className="w-2 h-2 rounded-full bg-psy-blue animate-pulse"></span>
                        <span className="text-[10px] font-bold tracking-wider text-gray-300">BUILT WITH <span className="text-psy-blue">AMAZON Q</span></span>
                    </div>
                    <span className="px-3 py-1 rounded-full border border-void-border bg-void-surface">
                        v2.0.0 <span className="text-gold ml-1">ALCHEMIST</span>
                    </span>
                </div>
            </header>

            {/* Main Command Center Layout */}
            <main className="flex-1 flex overflow-hidden relative">

                {/* Left Sidebar - Tools */}
                <aside className="w-64 border-r border-void-border bg-void-surface/30 flex flex-col z-40 glass-panel m-4 rounded-xl">
                    <div className="p-4 border-b border-void-border">
                        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Project Files</h2>
                        <FileUpload />
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        {/* File tree placeholder */}
                        <div className="text-sm text-gray-500 italic">No files loaded</div>
                    </div>
                </aside>

                {/* Center - Code Editor */}
                <section className="flex-1 flex flex-col min-w-0 relative z-0">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-void-border bg-void-surface/50">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Code Editor</span>
                        <button
                            onClick={loadExample}
                            className="px-3 py-1.5 rounded-md bg-psy-purple/20 border border-psy-purple/50 text-psy-purple text-xs font-bold hover:bg-psy-purple/30 transition-colors flex items-center gap-2"
                        >
                            <span>📝</span> Load Example
                        </button>
                    </div>
                    <div className="flex-1 relative">
                        <CodeEditor value={code} onChange={setCode} />
                    </div>

                    {/* Bottom Panel - Terminal/Output */}
                    <div className="h-48 border-t border-void-border bg-void-surface/80 backdrop-blur-sm p-4 flex flex-col">
                        <div className="flex items-center gap-4 mb-2 border-b border-void-border pb-2">
                            <button className="text-xs font-bold text-gold border-b-2 border-gold pb-2 -mb-2.5">TERMINAL</button>
                            <button className="text-xs font-bold text-gray-500 hover:text-gray-300 transition-colors">OUTPUT</button>
                            <button className="text-xs font-bold text-gray-500 hover:text-gray-300 transition-colors">PROBLEMS</button>
                        </div>
                        <div
                            ref={terminalRef}
                            className="font-code text-xs text-gray-400 flex-1 overflow-y-auto space-y-1"
                        >
                            {logs.map((log, i) => (
                                <div key={i} className="hover:bg-white/5 px-1 rounded">{log}</div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Right Sidebar - Intelligence Hub */}
                <aside className="w-80 border-l border-void-border bg-void-surface/30 flex flex-col z-40 glass-panel m-4 rounded-xl">
                    <div className="p-4 border-b border-void-border">
                        <h2 className="text-xs font-bold text-gold uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-gold animate-pulse"></span>
                            Intelligence Hub
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        <AgentPanel
                            code={code}
                            onDebugReport={setDebugReport}
                            onLog={addLog}
                        />

                        {debugReport && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <DebugPanel report={debugReport} />
                            </div>
                        )}
                    </div>
                </aside>

            </main>
        </motion.div>
    );
}
