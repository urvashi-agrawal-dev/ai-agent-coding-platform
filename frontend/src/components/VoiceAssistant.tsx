import { useState, useEffect } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import axios from 'axios';

interface VoiceAssistantProps {
  code: string;
  projectFiles?: any[];
}

export default function VoiceAssistant({ code, projectFiles }: VoiceAssistantProps) {
  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
    error: speechError
  } = useSpeechRecognition();

  const [processing, setProcessing] = useState(false);
  const [answer, setAnswer] = useState<any>(null);
  const [history, setHistory] = useState<Array<{ question: string; answer: any }>>([]);

  useEffect(() => {
    if (transcript && !isListening && transcript.trim().length > 0) {
      handleQuestion(transcript);
    }
  }, [isListening, transcript]);

  const handleQuestion = async (question: string) => {
    setProcessing(true);
    try {
      const response = await axios.post('http://localhost:5000/api/voice/ask', {
        question,
        code,
        projectFiles
      });
      
      const result = response.data.data;
      setAnswer(result);
      setHistory([{ question, answer: result }, ...history]);
      
      // Speak the answer
      if (result.answer) {
        speakAnswer(result.answer);
      }
    } catch (error) {
      console.error('Failed to process question:', error);
      setAnswer({ error: 'Failed to process your question' });
    } finally {
      setProcessing(false);
      resetTranscript();
    }
  };

  const speakAnswer = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleManualQuestion = () => {
    if (transcript.trim()) {
      stopListening();
      handleQuestion(transcript);
    }
  };

  if (!isSupported) {
    return (
      <div className="voice-assistant">
        <div className="not-supported">
          <p>⚠️ Voice input is not supported in your browser.</p>
          <p>Please use Chrome, Edge, or Safari for voice features.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="voice-assistant">
      <h3>🎤 Voice Assistant</h3>
      
      <div className="voice-controls">
        <button
          onClick={isListening ? stopListening : startListening}
          className={`voice-button ${isListening ? 'listening' : ''}`}
          disabled={processing}
        >
          {isListening ? '🔴 Stop Listening' : '🎤 Start Voice Input'}
        </button>
        
        {transcript && (
          <button
            onClick={handleManualQuestion}
            className="btn-primary"
            disabled={processing || isListening}
          >
            Ask Question
          </button>
        )}
      </div>

      {speechError && (
        <div className="error-message">
          ⚠️ {speechError}
        </div>
      )}

      {isListening && (
        <div className="listening-indicator">
          <div className="pulse-animation"></div>
          <span>Listening...</span>
        </div>
      )}

      {transcript && (
        <div className="transcript-box">
          <h4>You said:</h4>
          <p>{transcript}</p>
        </div>
      )}

      {processing && (
        <div className="processing-indicator">
          <div className="spinner"></div>
          <span>Analyzing code...</span>
        </div>
      )}

      {answer && !processing && (
        <div className="answer-box">
          <h4>Answer:</h4>
          
          {answer.error ? (
            <p className="error">{answer.error}</p>
          ) : (
            <>
              <div className="answer-text">
                <p>{answer.answer}</p>
              </div>

              {answer.codeTrace && (
                <div className="code-trace">
                  <h5>📍 Code Trace:</h5>
                  {answer.codeTrace.map((trace: any, idx: number) => (
                    <div key={idx} className="trace-step">
                      <div className="step-number">{idx + 1}</div>
                      <div className="step-content">
                        <div className="step-location">
                          {trace.file && <span className="file">{trace.file}</span>}
                          {trace.line && <span className="line">Line {trace.line}</span>}
                        </div>
                        <div className="step-description">{trace.description}</div>
                        {trace.code && (
                          <pre className="step-code">{trace.code}</pre>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {answer.dataFlow && (
                <div className="data-flow">
                  <h5>🔄 Data Flow:</h5>
                  <div className="flow-diagram">
                    {answer.dataFlow.map((step: string, idx: number) => (
                      <div key={idx} className="flow-step">
                        <span className="flow-arrow">→</span>
                        <span className="flow-text">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {answer.performance && (
                <div className="performance-analysis">
                  <h5>⚡ Performance Analysis:</h5>
                  <div className="perf-issues">
                    {answer.performance.issues.map((issue: any, idx: number) => (
                      <div key={idx} className="perf-issue">
                        <div className="issue-severity">{issue.severity}</div>
                        <div className="issue-desc">{issue.description}</div>
                        <div className="issue-fix">{issue.suggestion}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {answer.relatedCode && answer.relatedCode.length > 0 && (
                <div className="related-code">
                  <h5>📎 Related Code:</h5>
                  {answer.relatedCode.map((code: any, idx: number) => (
                    <div key={idx} className="related-item">
                      <div className="related-header">
                        <span className="related-name">{code.name}</span>
                        <span className="related-location">{code.location}</span>
                      </div>
                      <pre className="related-snippet">{code.snippet}</pre>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="history-section">
          <h4>Recent Questions:</h4>
          <div className="history-list">
            {history.slice(0, 5).map((item, idx) => (
              <div key={idx} className="history-item" onClick={() => setAnswer(item.answer)}>
                <div className="history-question">Q: {item.question}</div>
                <div className="history-preview">
                  {item.answer.answer?.substring(0, 100)}...
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="voice-tips">
        <h5>💡 Try asking:</h5>
        <ul>
          <li>"What does this function do?"</li>
          <li>"How does data flow through this code?"</li>
          <li>"What's the bug in this code?"</li>
          <li>"Why is this code slow?"</li>
          <li>"Explain this function to me"</li>
        </ul>
      </div>
    </div>
  );
}
