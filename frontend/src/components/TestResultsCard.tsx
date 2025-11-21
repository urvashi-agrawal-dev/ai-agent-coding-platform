import { useState } from 'react';
import { FaCheckCircle, FaTimesCircle, FaClock, FaPlay } from 'react-icons/fa';
import axios from 'axios';

export default function TestResultsCard({ code, onResults }: any) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runTests = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/tests/full-cycle', { code });
      setResults(response.data.data);
      onResults?.(response.data.data);
    } catch (error) {
      console.error('Test execution failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Test Results</h2>
        <button
          onClick={runTests}
          disabled={loading}
          className="px-4 py-2 bg-accent-green hover:bg-green-600 rounded-lg flex items-center space-x-2 transition disabled:opacity-50"
        >
          <FaPlay className="text-sm" />
          <span>{loading ? 'Running...' : 'Run Tests'}</span>
        </button>
      </div>

      {results?.execution && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              icon={<FaCheckCircle className="text-accent-green" />}
              label="Passed"
              value={results.execution.passed}
              color="green"
            />
            <StatCard
              icon={<FaTimesCircle className="text-accent-red" />}
              label="Failed"
              value={results.execution.failed}
              color="red"
            />
            <StatCard
              icon={<FaClock className="text-accent-blue" />}
              label="Duration"
              value={`${results.execution.duration}ms`}
              color="blue"
            />
          </div>

          {/* Coverage */}
          {results.execution.coverage && (
            <div className="bg-dark-bg rounded-lg p-4 border border-dark-border">
              <h3 className="font-semibold mb-4 text-gray-300">Code Coverage</h3>
              <div className="space-y-3">
                {['statements', 'branches', 'functions', 'lines'].map(metric => (
                  <CoverageBar
                    key={metric}
                    label={metric}
                    value={results.execution.coverage[metric]}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Test Details */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-300">Test Cases</h3>
            {results.execution.details.map((test: any, idx: number) => (
              <TestItem key={idx} test={test} />
            ))}
          </div>
        </>
      )}

      {!results && !loading && (
        <div className="text-center py-12 text-gray-400">
          <FaFlask className="text-4xl mx-auto mb-4 opacity-50" />
          <p>Click "Run Tests" to execute test suite</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: any) {
  const colorClasses = {
    green: 'border-accent-green/20 bg-accent-green/5',
    red: 'border-accent-red/20 bg-accent-red/5',
    blue: 'border-accent-blue/20 bg-accent-blue/5'
  };

  return (
    <div className={`rounded-lg p-4 border ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="flex items-center space-x-2 mb-2">
        {icon}
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function CoverageBar({ label, value }: any) {
  const getColor = (val: number) => {
    if (val >= 80) return 'bg-accent-green';
    if (val >= 60) return 'bg-accent-orange';
    return 'bg-accent-red';
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400 capitalize">{label}</span>
        <span className="text-white font-semibold">{value}%</span>
      </div>
      <div className="h-2 bg-dark-hover rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor(value)} transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function TestItem({ test }: any) {
  const statusConfig = {
    passed: { icon: FaCheckCircle, color: 'text-accent-green', bg: 'bg-accent-green/10' },
    failed: { icon: FaTimesCircle, color: 'text-accent-red', bg: 'bg-accent-red/10' },
    skipped: { icon: FaClock, color: 'text-gray-400', bg: 'bg-gray-800' }
  };

  const config = statusConfig[test.status as keyof typeof statusConfig];
  const Icon = config.icon;

  return (
    <div className={`rounded-lg p-3 border border-dark-border ${config.bg}`}>
      <div className="flex items-start space-x-3">
        <Icon className={`${config.color} mt-1 flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white truncate">{test.name}</p>
            <span className="text-xs text-gray-400 ml-2">{test.duration}ms</span>
          </div>
          {test.error && (
            <pre className="mt-2 text-xs text-accent-red bg-dark-bg p-2 rounded overflow-x-auto">
              {test.error}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

function FaFlask({ className }: any) {
  return <div className={className}>🧪</div>;
}
