"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Stethoscope } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function AIReportChat({ report }: { report: any }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hello! I'm your HealthAI Assistant. I've finished reviewing your report for **${report.filename || 'your current file'}**. \n\nHow can I help you understand your results today?`
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    
    // Add user message to UI immediately
    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          reportContext: report // Pass the raw JSON directly as context!
        }),
      });

      const data = await res.json();
      
      if (res.ok && data.reply) {
        setMessages([...newMessages, { role: "assistant", content: data.reply }]);
      } else {
        setMessages([...newMessages, { role: "assistant", content: "Sorry, I encountered a server error. Please try again." }]);
      }
    } catch (err) {
      console.error(err);
      setMessages([...newMessages, { role: "assistant", content: "Network error occurred." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-[600px] flex flex-col glassmorphism rounded-3xl overflow-hidden border border-card-border mt-12 bg-background/50">
      
      {/* Header */}
      <div className="bg-card/50 backdrop-blur-md px-6 py-4 border-b border-card-border flex items-center gap-3">
        <div className="p-2 bg-accent/20 rounded-full">
          <Stethoscope className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h3 className="font-heading font-bold text-lg text-foreground">AI Medical Coach</h3>
          <p className="text-xs text-foreground/50">Ask questions about your uploaded report</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === "user" ? "bg-accent text-background" : "bg-card border border-accent/30 text-accent"}`}>
              {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
              msg.role === "user" 
                ? "bg-accent/10 border border-accent/20 text-foreground" 
                : "bg-card border border-card-border text-foreground/80 prose prose-invert prose-p:leading-relaxed prose-pre:bg-black/50"
            }`}>
               <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4 flex-row">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-card border border-accent/30 text-accent">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="bg-card border border-card-border rounded-2xl px-5 py-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent/50 animate-bounce" style={{ animationDelay: "0ms" }}></div>
              <div className="w-2 h-2 rounded-full bg-accent/50 animate-bounce" style={{ animationDelay: "150ms" }}></div>
              <div className="w-2 h-2 rounded-full bg-accent/50 animate-bounce" style={{ animationDelay: "300ms" }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-card/50 border-t border-card-border backdrop-blur-md">
        <form onSubmit={sendMessage} className="relative flex items-center">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Ask about your cholesterol, blood pressure, etc..."
            className="w-full bg-background border border-card-border rounded-full pl-6 pr-14 py-4 text-sm focus:outline-none focus:border-accent/50 transition-colors disabled:opacity-50"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2.5 bg-accent text-background rounded-full hover:shadow-[0_0_10px_rgba(0,245,255,0.4)] transition-all disabled:opacity-50 disabled:hover:shadow-none"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
