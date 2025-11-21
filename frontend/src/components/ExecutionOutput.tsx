import { FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';

interface ExecutionOutputProps {
  result: {
    success: boolean;
    output: string;
    error: string;
    executionTime: number;
    language: string;
  };
}

export default function ExecutionOutput({ result }: ExecutionOutputProps) {
  return (
    <div className="border-t border-dark-border bg-dark-surface">
      <div className="px-6 py-3 flex items-center justify-between border-b border-dark-border">
        <div className="flex items-center space-x-3">
          {result.success ? (
            <FaCheckCircle className="text-accent-green" />
          ) : (
            <FaTimesCircle className="text-accent-red" />
          )}
          <span className="font-semibold text-white">
            {result.success ? 'Execution Successful' : 'Execution Failed'}
          </span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <FaClock />
          <span>{result.executionTime}ms</span>
        </div>
      </div>

      <div className="p-4 max-h-64 overflow-y-auto">
        {result.output && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-400 mb-2">Output:</h4>
            <pre className="bg-dark-bg p-3 rounded text-sm text-accent-green font-mono whitespace-pre-wrap">
              {result.output}
            </pre>
          </div>
        )}

        {result.error && (
          <div>
            <h4 className="text-sm font-semibold text-gray-400 mb-2">Error:</h4>
            <pre className="bg-dark-bg p-3 rounded text-sm text-accent-red font-mono whitespace-pre-wrap">
              {result.error}
            </pre>
          </div>
        )}

        {!result.output && !result.error && (
          <p className="text-gray-400 text-sm">No output</p>
        )}
      </div>
    </div>
  );
}
