"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Menu } from "lucide-react";
import { FaArrowUp, FaPlus } from "react-icons/fa";
import { ThemeProvider } from "next-themes";
import { AuroraBackground } from "@/components/ui/aurora-background";

export default function Chat() {
  const [collapsed, setCollapsed] = useState(true);

  const [messages, setMessages] = useState<
    { role: "user" | "ai" | "ai-temp"; text: string }[]
  >([]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const [userName, setUserName] = useState("User");
  const [userId, setUserId] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);

  // ⭐ Persona dropdown
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);
  const [personaMode, setPersonaMode] = useState<string>(""); // default NONE

  const personaOptions = [
  { key: "", label: "No Persona (Default)" },
  { key: "friendly", label: "Friendly Assistant" },
  { key: "mentor", label: "Calm Mentor" },
  { key: "witty", label: "Witty Friend" },
  { key: "therapist", label: "Calm Therapist" },
  { key: "formal", label: "Formal Assistant" }
];

  // ⭐ THINK MODE (from backend signals)
  const [assistantThinking, setAssistantThinking] = useState(false);

  // Load user + session
  useEffect(() => {
    const storedName = localStorage.getItem("userName") || "User";
    const uid = localStorage.getItem("userId");
    const sid = localStorage.getItem("session_id");

    setUserName(storedName);
    setUserId(uid && !isNaN(Number(uid)) ? Number(uid) : null);
    setSessionId(sid && !isNaN(Number(sid)) ? Number(sid) : null);
  }, []);

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (el) setTimeout(() => (el.scrollTop = el.scrollHeight), 40);
  }, [messages, loading, assistantThinking]);

  const getInitials = (name: string) =>
    name ? name.split(" ").map((n) => n[0]).join("") : "U";

  // Load history
  useEffect(() => {
    if (!userId || !sessionId) return;

    async function fetchHistory() {
      try {
        const res = await fetch(
          `${apiUrl}/chat/history?user_id=${userId}&session_id=${sessionId}`,
          { headers: { Authorization: `Bearer ${apiKey}` } }
        );

        if (!res.ok) return;

        const data = await res.json();

        const formatted = data.messages.map((msg: any) => ({
          role: msg.role === "assistant" ? "ai" : "user",
          text: msg.text,
        }));

        setMessages(formatted);
      } catch (e) {
        console.error("History error:", e);
      }
    }

    fetchHistory();
  }, [userId, sessionId]);

  // ===================================================================================
  // ⭐ STREAMING RESPONSE HANDLER WITH THINKING MODE
  // ===================================================================================
  async function sendMessageBackend(message: string) {
    if (!userId || !sessionId) return;

    const res = await fetch(`${apiUrl}/chat/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        user_id: userId,
        session_id: sessionId,
        message,
        persona_mode: personaMode,
      }),
    });

    const reader = res.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder("utf-8");
    let result = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        // final message update
        setMessages((prev) => [
          ...prev.filter((m) => m.role !== "ai-temp"),
          { role: "ai", text: result },
        ]);
        break;
      }

      const text = decoder.decode(value, { stream: true });

      // THINK MODE SIGNALS
      if (text.includes("__THINKING_START__")) {
        setAssistantThinking(true);
        continue;
      }

      if (text.includes("__THINKING_END__")) {
        setAssistantThinking(false);
        continue;
      }

      // regular token
      result += text;

      setMessages((prev) => [
        ...prev.filter((m) => m.role !== "ai-temp"),
        { role: "ai-temp", text: result },
      ]);
    }
  }

  async function handleSend() {
    if (!input.trim()) return;
    if (!userId || !sessionId) return alert("User not logged in");

    const msg = input.trim();
    setInput("");

    setMessages((prev) => [...prev, { role: "user", text: msg }]);

    setLoading(true);
    await sendMessageBackend(msg);
    setLoading(false);
  }

  const isTyping = loading || assistantThinking || messages.some((m) => m.role === "ai-temp");

  // ===================================================================================
  // UI
  // ===================================================================================
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <div className="flex h-screen bg-black text-white overflow-hidden">
        <AuroraBackground className="absolute inset-0 opacity-[0.15]" />

        {/* Sidebar */}
        <aside
          className={`${
            collapsed ? "w-16" : "w-64"
          } border-r border-white/10 p-4 flex flex-col transition-all bg-white/[0.03] backdrop-blur-xl`}
        >
          <div className="flex items-center justify-between mb-4">
            {!collapsed && <h2 className="text-lg font-semibold">Menu</h2>}
            <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {!collapsed && (
            <>
              <Button className="mb-4 w-full" onClick={() => setMessages([])}>
                Reset Chat
              </Button>

              <div className="mt-auto flex flex-col items-center">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar>
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>{getInitials(userName)}</AvatarFallback>
                  </Avatar>
                  <span>{userName}</span>
                </div>

                <Button
                  variant="outline"
                  onClick={() => {
                    localStorage.clear();
                    window.location.href = "/login";
                  }}
                >
                  Logout
                </Button>
              </div>
            </>
          )}
        </aside>

        {/* Chat */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex justify-center px-4 pt-6">
            <div className="glass-panel rounded-3xl w-full max-w-4xl p-6 border border-white/10 backdrop-blur-xl shadow-xl">
              <ScrollArea className="h-[70vh]" ref={scrollRef}>
                <div className="flex flex-col gap-6 pr-2">

                  {/* MESSAGES */}
                  {messages.map((msg, idx) =>
                    msg.role === "ai" || msg.role === "ai-temp" ? (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">AI</div>
                        <div className="px-4 py-3 rounded-2xl bg-white/[0.07] border border-white/10 max-w-xl">
                          <p>{msg.text}</p>
                        </div>
                      </div>
                    ) : (
                      <div key={idx} className="flex items-start gap-3 justify-end">
                        <div className="px-4 py-3 rounded-2xl bg-blue-600 text-white max-w-xl">
                          {msg.text}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">U</div>
                      </div>
                    )
                  )}

                  {/* THINKING INDICATOR */}
                  {assistantThinking && (
                    <div className="flex items-center gap-3 ml-10 animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">🤔</div>
                      <div className="text-yellow-300/80">Thinking…</div>
                    </div>
                  )}

                  {/* TYPING DOTS */}
                  {!assistantThinking && isTyping && (
                    <div className="flex items-center gap-3 ml-10">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">AI</div>
                      <div className="flex gap-1">
                        <span className="typing-dot"></span>
                        <span className="typing-dot"></span>
                        <span className="typing-dot"></span>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Input Bar */}
          <div className="p-4 w-full flex justify-center border-t border-white/10 backdrop-blur-xl relative">
            <div className="w-full max-w-4xl relative">

              {/* Persona Selector Button */}
              <div className="absolute left-3 bottom-3">
                <Button
                  size="icon"
                  className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20"
                  onClick={() => setPersonaMenuOpen(!personaMenuOpen)}
                >
                  <FaPlus />
                </Button>

                {personaMenuOpen && (
                  <div className="absolute bottom-14 left-0 w-48 bg-white text-black shadow-lg rounded-lg p-2 z-50">
                    {personaOptions.map((p) => (
                      <div
                        key={p.key}
                        className={`p-2 rounded cursor-pointer hover:bg-gray-200 ${
                          personaMode === p.key ? "bg-gray-300" : ""
                        }`}
                        onClick={() => {
                          setPersonaMode(p.key);
                          setPersonaMenuOpen(false);
                        }}
                      >
                        {p.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Message Input */}
              <Input
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="h-16 pl-16 pr-20 rounded-xl bg-white/[0.03]"
              />

              {/* Send Button */}
              <Button
                size="icon"
                onClick={handleSend}
                className="absolute right-3 bottom-3 rounded-full bg-blue-600 hover:bg-blue-700"
              >
                <FaArrowUp />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
