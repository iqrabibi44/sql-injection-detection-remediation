import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader, MessageCircle, AlertTriangle, Scan as ScanIcon, User, Shield, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import type { Vulnerability, Scan } from "@shared/schema";
import { DiffEditor } from "@monaco-editor/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
 
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}
 
interface ScanWithVulnerabilities extends Scan {
  vulnerabilities?: Vulnerability[];
}
 
 
export default function AIAssistant() {
  const { toast } = useToast();
  const [isAutoFixing, setIsAutoFixing] = useState(false);
  const [, setLocation] = useLocation();
  const [originalCode, setOriginalCode] = useState<string>("");
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [fixedCode, setFixedCode] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your SQL Security Assistant. Paste your code or select a vulnerability to analyze, and I'll help you identify and fix SQL injection issues.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [selectedVuln, setSelectedVuln] = useState<Vulnerability | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: scans = [] } = useQuery<ScanWithVulnerabilities[]>({
    queryKey: ["/api/user/scans"],
  });

  // Deduplicate vulnerabilities by type, line and description
  const vulnerabilities = (scans as ScanWithVulnerabilities[])
    .flatMap((scan) => scan.vulnerabilities || [])
    .filter((vuln, index, self) => 
      index === self.findIndex((v) => (
        v.type === vuln.type && 
        v.line === vuln.line && 
        v.description === vuln.description
      ))
    );

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      return apiRequest("POST", "/api/ai/chat", {
        message,
        vulnerability: selectedVuln,
      });
    },
    onSuccess: (data) => {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, newMessage]);
      setInput("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to get response from AI",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const pendingCode = sessionStorage.getItem("pending_fix_code");
    const pendingVulnString = sessionStorage.getItem("pending_fix_vuln");

    if (pendingCode && pendingVulnString && !isAutoFixing) {
      setIsAutoFixing(true);
      const vuln = JSON.parse(pendingVulnString);
      
      setSelectedVuln(vuln);
      setOriginalCode(pendingCode);

      const autoMessage = `I have a ${vuln.type} vulnerability in this code. Please provide the fixed version:\n\n${pendingCode}`;
      
      const userMsg: ChatMessage = {
        id: "auto-user",
        role: "user",
        content: autoMessage,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);

      chatMutation.mutate(autoMessage);

      sessionStorage.removeItem("pending_fix_code");
      sessionStorage.removeItem("pending_fix_vuln");
    }
  }, [isAutoFixing, chatMutation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    chatMutation.mutate(input);
  };

  const extractCodeBlock = (text: string) => {
    const match = text.match(/```[\w]*\n([\s\S]*?)```/);
    return match ? match[1].trim() : null;
  };

  return (
    <DashboardLayout>
      <div className="p-6 h-[calc(100vh-2rem)] flex flex-col overflow-hidden max-w-[1600px] mx-auto">
        <div className="mb-4 flex-shrink-0">
          <h1 className="text-3xl font-bold gradient-text-scanner mb-1">AI Fix Assistant</h1>
          <p className="text-sm text-muted-foreground">Chat with Gemini AI to get SQL vulnerability fixes</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6 flex-1 min-h-0">
          {/* Vulnerabilities Sidebar */}
          <div className="lg:col-span-1 flex flex-col min-h-0 h-full">
            <Card className="glass flex-1 flex flex-col overflow-hidden border-white/5">
              <CardHeader className="py-4 px-4 flex-shrink-0">
                <CardTitle className="text-base flex items-center gap-2">
                  <ScanIcon className="w-4 h-4 text-purple-400" />
                  Detected Issues
                  <Badge variant="secondary" className="ml-auto text-[10px] py-0 h-5">
                    {vulnerabilities.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto px-2 pb-4 space-y-2">
                {vulnerabilities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-center p-4">
                    <MessageCircle className="w-8 h-8 text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">No vulnerabilities detected yet</p>
                  </div>
                ) : (
                  vulnerabilities.map((vuln: Vulnerability) => (
                    <button
                      key={vuln.id}
                      onClick={() => setSelectedVuln(vuln)}
                      className={`w-full text-left p-3 rounded-xl border transition-all duration-300 ${
                        selectedVuln?.id === vuln.id
                          ? "bg-purple-500/20 border-purple-500/50 glow-purple"
                          : "border-white/5 hover:border-purple-500/20 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded-lg ${selectedVuln?.id === vuln.id ? "bg-purple-500/20" : "bg-white/5"}`}>
                          <AlertTriangle className={`w-3.5 h-3.5 ${vuln.severity === "high" ? "text-destructive" : "text-yellow-400"}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate text-foreground/90">{vuln.type}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-muted-foreground">Line {vuln.line}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase font-bold ${
                                vuln.severity === "high"
                                  ? "bg-destructive/10 text-destructive border border-destructive/20"
                                  : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                              }`}>
                              {vuln.severity}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3 flex flex-col min-h-0 h-full gap-4">
            {/* Messages */}
            <Card className="glass flex-1 overflow-hidden flex flex-col border-white/5 bg-black/20">
              <CardContent className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${
                      msg.role === "user" 
                        ? "bg-blue-500/20 border-blue-500/30 text-blue-400" 
                        : "bg-purple-500/20 border-purple-500/30 text-purple-400"
                    }`}>
                      {msg.role === "user" ? <User className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                    </div>
                    <div className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} max-w-[85%]`}>
                      <div
                        className={`px-4 py-3 rounded-2xl animate-slideInUp ${
                          msg.role === "user"
                            ? "bg-gradient-to-br from-blue-600/80 to-blue-700/80 text-white rounded-tr-none shadow-lg shadow-blue-900/20"
                            : "bg-white/5 text-foreground/90 rounded-tl-none border border-white/10 shadow-lg shadow-black/20"
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap font-sans">{msg.content}</p>
  
                        {msg.role === "assistant" && extractCodeBlock(msg.content) && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="mt-4 w-full bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-sm group transition-all duration-300"
                            onClick={() => {
                              const pureCode = extractCodeBlock(msg.content);
                              if (pureCode) {
                                setFixedCode(pureCode);
                                setIsDiffModalOpen(true);
                              }
                            }}
                          >
                            <ScanIcon className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-500" />
                            View Diff & Apply Fix
                          </Button>
                        )}
                      </div>
                      <span className="text-[10px] opacity-40 mt-1.5 px-1">
                        {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                ))}
                {chatMutation.isPending && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div className="bg-white/5 px-4 py-3 rounded-2xl rounded-tl-none border border-white/10 shadow-lg shadow-black/20">
                      <div className="flex gap-1.5 items-center">
                        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </CardContent>
            </Card>

            {/* Input Area */}
            <div className="flex-shrink-0">
              <Card className="glass border-white/5 bg-white/5 backdrop-blur-xl">
                <CardContent className="p-3 lg:p-4">
                  {selectedVuln && (
                    <div className="mb-3 p-2 px-3 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="p-1 rounded bg-purple-500/20">
                          <AlertTriangle className="w-3 h-3 text-purple-400" />
                        </div>
                        <p className="text-[11px]">
                          <span className="font-bold text-purple-300">Context:</span> {selectedVuln.type} (Line {selectedVuln.line})
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-[10px] hover:bg-white/5"
                        onClick={() => setSelectedVuln(null)}
                      >
                        Clear Context
                      </Button>
                    </div>
                  )}
                  <div className="flex gap-3 relative">
                    <Input
                      placeholder="Type your message here..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      disabled={chatMutation.isPending}
                      className="bg-white/5 border-white/10 rounded-xl py-6 pr-14 focus-visible:ring-purple-500/50"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!input.trim() || chatMutation.isPending}
                      size="icon"
                      className="absolute right-1.5 top-1.5 h-9 w-9 bg-purple-600 hover:bg-purple-500 text-white rounded-lg shadow-lg shadow-purple-900/20 transition-all duration-300"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground/40 text-center mt-2">
                    AI can make mistakes. Verify important security fixes.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isDiffModalOpen} onOpenChange={setIsDiffModalOpen}>
        <DialogContent className="max-w-6xl w-[95vw] h-[85vh] flex flex-col p-0 glass border-white/10 bg-[#0a0c10]/95 backdrop-blur-2xl overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  Review Security Fix
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-1">Comparing original code with AI-suggested fix</p>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-hidden bg-black/40">
            <DiffEditor
              height="100%"
              original={originalCode || "/* Original code not found. Please rescan. */"}
              modified={fixedCode}
              language="javascript"
              theme="vs-dark"
              options={{
                renderSideBySide: true,
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 13,
                padding: { top: 20 },
                scrollBeyondLastLine: false,
                lineNumbers: "on",
                folding: true,
                scrollBeyondLastColumn: 5,
                renderIndicators: true,
              }}
            />
          </div>
          <DialogFooter className="p-6 pt-4 border-t border-white/5 bg-white/5">
            <Button variant="ghost" className="hover:bg-white/5" onClick={() => setIsDiffModalOpen(false)}>Back to Chat</Button>
            <Button
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white border-0 px-8 shadow-lg shadow-green-900/20"
              onClick={() => {
                sessionStorage.setItem("rescan_code", fixedCode);
                setLocation("/scanner");
              }}
            >
              Apply Fix & Rescan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}