'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, ChevronDown, ChevronRight, Wrench, Building2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: any[];
}

const SUGGESTIONS = [
  'Top 5 urgent problems',
  'Why is Ward 7 high priority?',
  'Road repair status in Ward 15',
  'Compare project options'
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'm1',
    role: 'assistant',
    content: 'Welcome to the Fixity Intelligence Assistant. How can I assist you in analyzing municipal grievance records or scenario options today?'
  },
  {
    id: 'm2',
    role: 'user',
    content: 'Why is Ward 7 currently marked as a high priority area?'
  },
  {
    id: 'm3',
    role: 'assistant',
    content: 'Retrieving live records for Ward 7...',
    toolCalls: [
      {
        name: 'get_priority_area_details',
        arguments: '{"ward_id": 7}',
        result: 'Ward 7 has 32 active water supply complaints and a critical pothole cluster with avg severity 9.2.'
      }
    ]
  },
  {
    id: 'm4',
    role: 'assistant',
    content: 'Ward 7 is ranked as a high priority primarily due to an escalating number of water supply complaints (32 active grievances), combined with a severe road infrastructure cluster (average severity 9.2/10). Expedited dispatch for water supply engineers is recommended.'
  }
];

export default function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const toggleTool = (id: string) => {
    setExpandedTools(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const aiResponseText = `I have queried the Fixity municipal database regarding "${text}". The relevant records indicate active department dispatch in the specified wards.`;
      
      const newMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: newMsgId,
        role: 'assistant',
        content: ''
      }]);

      let i = 0;
      const words = aiResponseText.split(' ');
      const interval = setInterval(() => {
        if (i < words.length) {
          const currentWord = words[i];
          setMessages(prev => prev.map(msg => 
            msg.id === newMsgId 
              ? { ...msg, content: msg.content + (msg.content ? ' ' : '') + currentWord }
              : msg
          ));
          i++;
        } else {
          clearInterval(interval);
        }
      }, 80);

    }, 1200);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-4xl mx-auto bg-slate-50 rounded-md border border-slate-200 shadow-sm overflow-hidden text-xs">
      
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-white border-b border-slate-200">
        <div className="p-2 bg-blue-50 text-blue-700 rounded border border-blue-200">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-900">Fixity Intelligence Assistant</h1>
          <p className="text-[11px] text-slate-500">Municipal Operations & Decision Intelligence Copilot</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-2.5 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-7 h-7 rounded flex items-center justify-center shrink-0 text-white font-bold text-xs ${
                msg.role === 'user' ? 'bg-blue-700' : 'bg-slate-900'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              
              <div className="space-y-2">
                {msg.toolCalls && msg.toolCalls.map((tool, idx) => {
                  const toolId = `${msg.id}-tool-${idx}`;
                  const isExpanded = expandedTools[toolId];
                  return (
                    <div key={toolId} className="bg-white border border-slate-300 rounded overflow-hidden text-xs">
                      <button 
                        onClick={() => toggleTool(toolId)}
                        className="w-full flex items-center gap-2 p-2.5 bg-slate-100 hover:bg-slate-200 text-left font-mono text-slate-800"
                      >
                        <Wrench className="w-3.5 h-3.5 text-blue-700" />
                        <span className="flex-1 truncate font-semibold">Executed Query: {tool.name}({tool.arguments})</span>
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                      {isExpanded && (
                        <div className="p-2.5 bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap border-t border-slate-800">
                          {tool.result || 'Executed successfully.'}
                        </div>
                      )}
                    </div>
                  );
                })}

                {msg.content && (
                  <div className={`p-3.5 rounded border leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-blue-700 text-white border-blue-800' 
                      : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="flex gap-2 max-w-[80%] flex-row">
              <div className="w-7 h-7 rounded bg-slate-900 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded text-slate-700">
                <span className="animate-pulse font-mono text-xs">Querying Fixity database...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-slate-200 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(suggestion)}
              className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded text-[11px] font-medium border border-slate-200"
            >
              {suggestion}
            </button>
          ))}
        </div>
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
            placeholder="Type your query regarding ward issues, projects, or statistics..."
            className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-700"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim()}
            className="absolute right-1.5 top-1.5 p-1 bg-blue-700 text-white rounded hover:bg-blue-800 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
