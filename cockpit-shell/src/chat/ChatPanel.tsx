"use client";

/**
 * ChatPanel.tsx — Rendu du rail chat (OpenAI GPT-4o côté serveur).
 * Logique d'état / streaming : useChat.ts
 */

import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import DOMPurify from "dompurify";
import {
  subscribe,
  getSnapshot,
  getServerSnapshot,
} from "../stores/activeProductStore";
import {
  subscribe as subActiveChat,
  getSnapshot as getActiveChat,
  getServerSnapshot as getActiveChatSSR,
  setActiveChat,
} from "../stores/activeChatStore";
import { useCockpit } from "../shell/context";
import { HearstMark } from "../shell/HearstMark";
import type { ChatMessage } from "./types";
import { useChat } from "./useChat";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderMarkdown(text: string): string {
  return (
    text
      .replace(
        /```(\w*)\n?([\s\S]*?)```/g,
        (_m, _lang: string, code: string) =>
          `<pre class="ct-chat-md-pre"><code>${escapeHtml(code.trimEnd())}</code></pre>`,
      )
      .replace(
        /`([^`]+)`/g,
        (_m, c: string) =>
          `<code>${escapeHtml(c)}</code>`,
      )
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/((?:^[-*] .+$\n?)+)/gm, (block) => {
        const items = block
          .split("\n")
          .filter(Boolean)
          .map(
            (line) =>
              `<li class="ct-chat-md-li">${line.replace(/^[-*] /, "")}</li>`,
          )
          .join("");
        return `<ul class="ct-chat-md-list">${items}</ul>`;
      })
      .replace(/\n/g, "<br>")
  );
}

function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return "";
  return DOMPurify.sanitize(html);
}

export interface ChatPanelProps {
  productName?: string;
  productColor?: string;
}

export function ChatPanel({ productName, productColor }: ChatPanelProps = {}) {
  const [input, setInput] = useState<string>("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow : la zone de saisie grandit ligne par ligne quand on tape
  // (plafonnée en CSS via max-height, qui prend alors le relais en scroll).
  // Clé `input` → couvre frappe, collage et reset à vide après envoi.
  // À vide on rend la main au CSS (min-height) : évite de figer une hauteur
  // calculée pendant que le rail est replié (scrollHeight faux/0).
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    if (!input) {
      el.style.height = "";
      return;
    }
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [input]);

  const activeProduct = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const activeChat = useSyncExternalStore(
    subActiveChat,
    getActiveChat,
    getActiveChatSSR,
  );
  const { chatConfig } = useCockpit();

  const { messages, streaming, error, sendMessage, reset } = useChat({
    apiEndpoint: chatConfig.apiEndpoint ?? "/api/cockpit-chat",
    persistence: chatConfig.persistence,
    productId: activeProduct,
    chatId: activeChat,
    onChatId: (id) => setActiveChat(id),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const newConversation = useCallback(() => {
    setActiveChat(null);
    reset();
    setInput("");
  }, [reset]);

  const handleSend = useCallback(
    (text: string) => {
      if (!text.trim() || streaming) return;
      setInput("");
      sendMessage(text);
      requestAnimationFrame(() => textareaRef.current?.focus());
    },
    [streaming, sendMessage],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend(input);
      }
    },
    [input, handleSend],
  );

  const retryLast = useCallback(() => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    sendMessage(lastUser.content);
  }, [messages, sendMessage]);

  const accent = productColor ?? "var(--ct-accent)";

  return (
    <div className="ct-chat-root">
      <div className="ct-chat-actionbar">
        <button
          type="button"
          onClick={newConversation}
          title="Nouvelle conversation"
          className="ct-chat-newbtn"
        >
          + Nouveau
        </button>
      </div>

      <div className="ct-chat-list">
        {messages.length === 0 && !streaming && (
          <p className="ct-placeholder">
            Assistant Oracle (GPT-4o)
            {productName ? ` — contexte ${productName}.` : "."}
            <br />
            Pose ta question pour démarrer.
          </p>
        )}

        {messages.map((msg) => {
          if (msg.role === "assistant" && msg.content === "") return null;
          return (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isStreamingThis={
                streaming &&
                msg.role === "assistant" &&
                msg === messages[messages.length - 1]
              }
              accent={accent}
            />
          );
        })}

        {streaming && (
          <div
            className="ct-chat-thinking active"
            aria-label="L'assistant réfléchit"
            style={{ color: accent }}
          >
            <HearstMark size={18} />
          </div>
        )}

        {error && (
          <div className="ct-chat-error">
            <p>{error}</p>
            <button type="button" onClick={retryLast} className="ct-chat-retry">
              ↻ Réessayer
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form
        className="ct-chat-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
      >
        <textarea
          ref={textareaRef}
          className="ct-chat-input"
          rows={2}
          placeholder="Message à l'assistant…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={streaming}
        />
        <button
          type="submit"
          className="ct-chat-send"
          disabled={!input.trim() || streaming}
          aria-label="Envoyer"
          style={input.trim() && !streaming ? { background: accent } : undefined}
        >
          {streaming ? (
            <span className="ct-chat-send-dots">
              <span /><span /><span />
            </span>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}

interface MessageBubbleProps {
  msg: ChatMessage;
  isStreamingThis: boolean;
  accent: string;
}

function MessageBubble({ msg, isStreamingThis, accent }: MessageBubbleProps) {
  const isUser = msg.role === "user";
  const isEmpty = msg.content === "";

  return (
    <div className={`ct-chat-msg ${isUser ? "user" : "assistant"}`}>
      {isEmpty ? (
        <div className="ct-chat-typing">
          <span />
          <span />
          <span />
        </div>
      ) : isUser ? (
        <p style={{ whiteSpace: "pre-wrap" }}>{msg.content}</p>
      ) : (
        <>
          <div
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(renderMarkdown(msg.content)),
            }}
          />
          {isStreamingThis && (
            <span className="ct-chat-cursor" style={{ background: accent }} />
          )}
        </>
      )}
    </div>
  );
}
