import { DebugReport } from '@devmentor/shared';

interface DebugPanelProps {
  report: DebugReport | null;
}

export default function DebugPanel({ report }: DebugPanelProps) {
  if (!report) {
    return (
      <div className="debug-panel">
        <h3>Debug Report</h3>
        <p>Run the Debugger agent to see issues</p>
      </div>
    );
  }

  return (
    <div className="debug-panel">
      <h3>Debug Report</h3>
      <div className={`severity severity-${report.severity}`}>
        Severity: {report.severity}
      </div>
      
      <div className="issues">
        {report.issues.length === 0 ? (
          <p>No issues found!</p>
        ) : (
          report.issues.map((issue, idx) => (
            <div key={idx} className={`issue issue-${issue.type}`}>
              <div className="issue-header">
                <span className="issue-type">{issue.type}</span>
                <span className="issue-location">Line {issue.line}:{issue.column}</span>
              </div>
              <p className="issue-message">{issue.message}</p>
              {issue.suggestion && (
                <p className="issue-suggestion">💡 {issue.suggestion}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
