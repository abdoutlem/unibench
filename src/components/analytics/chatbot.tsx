"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  X,
  Send,
  Loader2,
  ArrowUpRight,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatStore, type ChatMessage } from "@/store/chat";
import { useAnalyticsStore } from "@/store/analytics";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";

export function Chatbot() {
  const chat = useChatStore();
  const analytics = useAnalyticsStore();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages]);

  useEffect(() => {
    if (chat.isOpen) inputRef.current?.focus();
  }, [chat.isOpen]);

  async function handleSend() {
    const text = input.trim();
    if (!text || chat.loading) return;

    setInput("");
    chat.addMessage({ role: "user", content: text });
    chat.setLoading(true);

    try {
      const history = chat.messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const data = await apiClient.chatQuery(text, history);

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.reply,
        explore_request: data.explore_request,
        explore_result: data.explore_result,
        suggested_chart_type: data.suggested_chart_type,
        confidence: data.confidence,
      };
      chat.addMessage(assistantMsg);
    } catch (e: any) {
      chat.addMessage({
        role: "assistant",
        content: `Error: ${e.message || "Failed to get response"}`,
      });
    } finally {
      chat.setLoading(false);
    }
  }

  function handleLoadQuery(msg: ChatMessage) {
    if (!msg.explore_request) return;
    const req = msg.explore_request as any;
    analytics.setMetrics(req.metric_ids || []);
    analytics.setGroupBy(req.group_by || []);
    analytics.setFilters(
      req.filters || {
        entity_ids: [],
        fiscal_year_start: null,
        fiscal_year_end: null,
        dimension_filters: {},
      }
    );
    analytics.setAggregation(req.aggregation || "sum");
    if (msg.suggested_chart_type) {
      analytics.setChartType(msg.suggested_chart_type as any);
    }
    analytics.executeQuery();
    chat.setOpen(false);
  }

  // Floating button
  if (!chat.isOpen) {
    return (
      <button
        onClick={() => chat.setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
      >
        <MessageSquare className="h-5 w-5" />
      </button>
    );
  }

  // Chat panel
  return (
    <div className="fixed bottom-6 right-6 z-50 flex w-96 flex-col rounded-xl border bg-card shadow-2xl" style={{ maxHeight: "70vh" }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Analytics Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => chat.clear()}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Clear chat"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => chat.setOpen(false)}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ minHeight: 200, maxHeight: "50vh" }}>
        {chat.messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-8">
            <p className="font-medium">Ask me about your data</p>
            <p className="mt-1 text-xs">
              Try: &quot;Show retention rates for all universities&quot;
            </p>
          </div>
        )}

        {chat.messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "flex",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>

              {/* Load query button */}
              {msg.role === "assistant" && msg.explore_request && (
                <div className="mt-2 pt-2 border-t border-border/50">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-7"
                    onClick={() => handleLoadQuery(msg)}
                  >
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    Load Query
                    {msg.suggested_chart_type && (
                      <span className="ml-1 text-muted-foreground">
                        ({msg.suggested_chart_type})
                      </span>
                    )}
                  </Button>
                  {msg.confidence !== undefined && msg.confidence > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-1 text-center">
                      Confidence: {Math.round(msg.confidence * 100)}%
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {chat.loading && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-muted px-3 py-2 text-sm flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Thinking...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t px-3 py-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your data..."
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            disabled={chat.loading}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!input.trim() || chat.loading}
            className="h-9 w-9 p-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
