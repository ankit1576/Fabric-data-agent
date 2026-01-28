import { useState, useEffect, useRef } from "react";
import "@/App.css";
import axios from "axios";
import { Send, ChevronDown, ChevronUp, Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: inputValue.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await axios.post(`${API}/execute`, {
        prompt: userMessage.content
      });

      const agentMessage = {
        id: Date.now() + 1,
        type: "agent",
        content: response.data,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, agentMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to get response from agent");
      
      const errorMessage = {
        id: Date.now() + 1,
        type: "agent",
        content: {
          success: false,
          error: error.response?.data?.detail || error.message || "Unknown error",
          final_message: "I apologize, but I encountered an error processing your request. Please try again."
        },
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="6" fill="#0066CC"/>
                <path d="M8 16L14 10L20 16L14 22L8 16Z" fill="white"/>
                <path d="M14 10L20 16L24 12L18 6L14 10Z" fill="#00A3E0"/>
              </svg>
            </div>
            <div>
              <h1 className="app-title">Fabric Data Agent</h1>
              <p className="app-subtitle">Powered by Microsoft Fabric</p>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <div className="chat-container">
        <ScrollArea className="messages-area">
          <div className="messages-wrapper">
            {messages.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <circle cx="32" cy="32" r="32" fill="#E0F2FE"/>
                    <path d="M20 32L28 24L36 32L28 40L20 32Z" fill="#0066CC"/>
                    <path d="M28 24L36 32L44 24L36 16L28 24Z" fill="#00A3E0"/>
                  </svg>
                </div>
                <h2 className="empty-title">Welcome to Fabric Data Agent</h2>
                <p className="empty-description">
                  Ask questions about your data and get intelligent insights powered by Microsoft Fabric.
                </p>
                <div className="example-queries">
                  <p className="example-title">Try asking:</p>
                  <div className="example-chips">
                    <button 
                      className="example-chip"
                      onClick={() => setInputValue("How many disbursements are there in total?")}
                    >
                      How many disbursements are there in total?
                    </button>
                    <button 
                      className="example-chip"
                      onClick={() => setInputValue("Show me the top 5 clients by loan count")}
                    >
                      Show me the top 5 clients by loan count
                    </button>
                    <button 
                      className="example-chip"
                      onClick={() => setInputValue("What data is available?")}
                    >
                      What data is available?
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))
            )}
            
            {isLoading && (
              <div className="message-bubble agent-message loading-message">
                <div className="message-avatar agent-avatar">
                  <Loader2 className="avatar-icon spinning" size={20} />
                </div>
                <div className="message-content">
                  <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <p className="loading-text">Analyzing your query...</p>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="input-container">
          <div className="input-wrapper">
            <textarea
              data-testid="chat-input"
              className="chat-input"
              placeholder="Ask a question about your data..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              rows={1}
              disabled={isLoading}
            />
            <Button
              data-testid="send-button"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="send-button"
              size="icon"
            >
              <Send size={18} />
            </Button>
          </div>
          <p className="input-hint">
            Press Enter to send, Shift + Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }) {
  if (message.type === "user") {
    return (
      <div className="message-bubble user-message" data-testid="user-message">
        <div className="message-content">
          <p className="message-text">{message.content}</p>
        </div>
        <div className="message-avatar user-avatar">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="10" fill="white"/>
            <path d="M10 10C11.6569 10 13 8.65685 13 7C13 5.34315 11.6569 4 10 4C8.34315 4 7 5.34315 7 7C7 8.65685 8.34315 10 10 10Z" fill="#0066CC"/>
            <path d="M10 11C6.68629 11 4 13.6863 4 17H16C16 13.6863 13.3137 11 10 11Z" fill="#0066CC"/>
          </svg>
        </div>
      </div>
    );
  }

  return <AgentMessage message={message} />;
}

function AgentMessage({ message }) {
  const content = message.content;
  const finalMessage = content.final_message || "No response available.";
  const hasSteps = content.steps && content.steps.data && content.steps.data.length > 0;

  return (
    <div className="message-bubble agent-message" data-testid="agent-message">
      <div className="message-avatar agent-avatar">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect width="20" height="20" rx="4" fill="white"/>
          <path d="M5 10L8.75 6.25L12.5 10L8.75 13.75L5 10Z" fill="#0066CC"/>
          <path d="M8.75 6.25L12.5 10L15 7.5L11.25 3.75L8.75 6.25Z" fill="#00A3E0"/>
        </svg>
      </div>
      <div className="message-content">
        {/* Final Answer Section */}
        <div className="final-answer" data-testid="final-answer">
          <p className="message-text">{finalMessage}</p>
        </div>

        {/* Execution Details Section (Collapsible) */}
        {hasSteps && (
          <ExecutionDetails steps={content.steps.data} runStatus={content.run_status} />
        )}
      </div>
    </div>
  );
}

function ExecutionDetails({ steps, runStatus }) {
  const [isOpen, setIsOpen] = useState(false);

  // Extract executed queries from steps
  const executedQueries = [];
  
  steps.forEach((step, index) => {
    if (step.step_details && step.step_details.tool_calls) {
      step.step_details.tool_calls.forEach((toolCall) => {
        if (toolCall.function && toolCall.function.output) {
          // Try to extract DAX/SQL queries from the output
          const output = toolCall.function.output;
          const daxMatch = output.match(/```dax\s*([\s\S]*?)```/i);
          const sqlMatch = output.match(/```sql\s*([\s\S]*?)```/i);
          
          if (daxMatch) {
            executedQueries.push({
              type: 'DAX',
              query: daxMatch[1].trim(),
              stepIndex: index
            });
          } else if (sqlMatch) {
            executedQueries.push({
              type: 'SQL',
              query: sqlMatch[1].trim(),
              stepIndex: index
            });
          }
        }
      });
    }
  });

  // Get only completed steps
  const completedSteps = steps.filter(step => step.status === "completed");

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="execution-details" data-testid="execution-details">
      <CollapsibleTrigger className="execution-toggle">
        <span className="toggle-text">View execution details</span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </CollapsibleTrigger>
      
      <CollapsibleContent className="execution-content">
        {/* Run Status */}
        <div className="detail-section">
          <h4 className="detail-title">Execution Status</h4>
          <div className="status-badge" data-status={runStatus}>
            {runStatus}
          </div>
        </div>

        {/* Execution Steps */}
        {completedSteps.length > 0 && (
          <div className="detail-section">
            <h4 className="detail-title">Execution Steps ({completedSteps.length})</h4>
            <div className="steps-list">
              {completedSteps.map((step, index) => (
                <div key={step.id || index} className="step-item">
                  <div className="step-header">
                    <span className="step-number">{index + 1}</span>
                    <span className="step-id">{step.id}</span>
                  </div>
                  {step.step_details && step.step_details.tool_calls && (
                    <div className="tool-calls">
                      {step.step_details.tool_calls.map((toolCall, tcIndex) => (
                        <div key={tcIndex} className="tool-call">
                          <span className="tool-name">
                            {toolCall.function?.name || 'Unknown tool'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Executed Queries */}
        {executedQueries.length > 0 && (
          <div className="detail-section">
            <h4 className="detail-title">Executed Queries ({executedQueries.length})</h4>
            <div className="queries-list">
              {executedQueries.map((queryObj, index) => (
                <QueryBlock key={index} query={queryObj.query} type={queryObj.type} index={index} />
              ))}
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function QueryBlock({ query, type, index }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(query);
      setCopied(true);
      toast.success("Query copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy query");
    }
  };

  return (
    <div className="query-block" data-testid={`query-block-${index}`}>
      <div className="query-header">
        <span className="query-type">{type} Query</span>
        <button
          className="copy-button"
          onClick={handleCopy}
          data-testid={`copy-query-${index}`}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="query-code" data-testid={`query-code-${index}`}>
        <code>{query}</code>
      </pre>
    </div>
  );
}

export default App;
