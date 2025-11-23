import Editor, { Monaco } from '@monaco-editor/react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function CodeEditor({ value, onChange }: CodeEditorProps) {
  const handleEditorWillMount = (monaco: Monaco) => {
    monaco.editor.defineTheme('alchemist-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'ff79c6' },
        { token: 'string', foreground: 'f1fa8c' },
        { token: 'number', foreground: 'bd93f9' },
        { token: 'type', foreground: '8be9fd' },
      ],
      colors: {
        'editor.background': '#050505',
        'editor.foreground': '#f8f8f2',
        'editor.lineHighlightBackground': '#1F1F1F',
        'editorCursor.foreground': '#FFD700',
        'editorWhitespace.foreground': '#3B3A32',
        'editorIndentGuide.background': '#333333',
        'editor.selectionBackground': '#44475a',
      }
    });
  };

  return (
    <div className="h-full w-full overflow-hidden rounded-xl border border-void-border glass-panel shadow-2xl">
      <Editor
        height="100%"
        defaultLanguage="javascript"
        value={value}
        onChange={(val) => onChange(val || '')}
        theme="alchemist-dark"
        beforeMount={handleEditorWillMount}
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          fontFamily: "'Fira Code', monospace",
          fontLigatures: true,
          lineNumbers: 'on',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          padding: { top: 20, bottom: 20 },
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
        }}
      />
    </div>
  );
}
