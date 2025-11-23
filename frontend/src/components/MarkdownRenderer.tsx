import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownRendererProps {
    content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
    return (
        <div className="markdown-content text-sm text-gray-300 leading-relaxed">
            <ReactMarkdown
                components={{
                    code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                            <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                className="rounded-md border border-void-border my-4"
                                {...props}
                            >
                                {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                        ) : (
                            <code className={`${className} bg-void-surface px-1.5 py-0.5 rounded text-gold font-code text-xs`} {...props}>
                                {children}
                            </code>
                        );
                    },
                    h1: ({ node, ...props }) => <h1 className="text-xl font-bold text-gold mt-6 mb-4 border-b border-void-border pb-2" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-lg font-bold text-white mt-5 mb-3" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="text-base font-bold text-gray-200 mt-4 mb-2" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-1 mb-4 ml-2" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-1 mb-4 ml-2" {...props} />,
                    li: ({ node, ...props }) => <li className="text-gray-300" {...props} />,
                    p: ({ node, ...props }) => <p className="mb-4" {...props} />,
                    blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-gold pl-4 italic text-gray-400 my-4" {...props} />,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
