"use client";

/**
 * ChatHistory — vue historique du rail droit.
 * Liste les conversations passées, permet de les reprendre, renommer ou supprimer.
 */

import { useCallback, useEffect, useState } from "react";
import { setView } from "../stores/chatViewStore";
import { setActiveChat } from "../stores/activeChatStore";

interface ChatSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatHistoryProps {
  productColor?: string;
}

export function ChatHistory({ productColor }: ChatHistoryProps = {}) {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingClearAll, setPendingClearAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cockpit-chats", { cache: "no-store" });
      if (!res.ok) throw new Error("load_failed");
      const data = (await res.json()) as { chats: ChatSummary[] };
      setChats(data.chats);
    } catch {
      setError("Impossible de charger l'historique.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function selectChat(id: string) {
    setActiveChat(id);
    setView("chat");
  }

  async function newChat() {
    setActiveChat(null);
    setView("chat");
  }

  async function deleteChat(id: string) {
    try {
      const res = await fetch(`/api/cockpit-chats/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete_failed");
      setChats((prev) => prev.filter((c) => c.id !== id));
      setPendingDeleteId(null);
    } catch {
      setError("Suppression impossible.");
    }
  }

  async function clearAll() {
    try {
      const res = await fetch("/api/cockpit-chats", { method: "DELETE" });
      if (!res.ok) throw new Error("clear_failed");
      setChats([]);
      setPendingClearAll(false);
    } catch {
      setError("Suppression impossible.");
    }
  }

  return (
    <div className="ct-chat-history">
      <div className="ct-chat-history-actions">
        <button
          type="button"
          className="ct-chat-history-newbtn"
          onClick={newChat}
          style={productColor ? { background: productColor } : undefined}
        >
          + Nouvelle conversation
        </button>
        {chats.length > 0 && (
          pendingClearAll ? (
            <div className="ct-chat-history-clearconfirm" role="group" aria-label="Confirmer la suppression">
              <span className="ct-chat-history-clearhint">Tout supprimer ? Irréversible.</span>
              <button
                type="button"
                className="ct-chat-history-confirmbtn danger"
                onClick={() => void clearAll()}
              >
                Supprimer
              </button>
              <button
                type="button"
                className="ct-chat-history-confirmbtn"
                onClick={() => setPendingClearAll(false)}
              >
                Annuler
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="ct-chat-history-clearbtn"
              onClick={() => { setPendingDeleteId(null); setPendingClearAll(true); }}
              title="Tout supprimer"
            >
              Tout effacer
            </button>
          )
        )}
      </div>

      {loading && <p className="ct-placeholder">Chargement…</p>}
      {error && <p className="ct-chat-error">{error}</p>}
      {!loading && !error && chats.length === 0 && (
        <p className="ct-placeholder">
          Aucune conversation pour l'instant — démarre un chat pour voir
          apparaître ton historique ici.
        </p>
      )}

      <ul className="ct-chat-history-list">
        {chats.map((c) => (
          <li key={c.id} className="ct-chat-history-item">
            <button
              type="button"
              className="ct-chat-history-item-main"
              onClick={() => {
                setPendingDeleteId(null);
                void selectChat(c.id);
              }}
            >
              <span className="ct-chat-history-title">{c.title}</span>
              <span className="ct-chat-history-date">{formatDate(c.updated_at)}</span>
            </button>
            {pendingDeleteId === c.id ? (
              <div className="ct-chat-history-confirm" role="group" aria-label="Confirmer la suppression">
                <button
                  type="button"
                  className="ct-chat-history-confirmbtn danger"
                  onClick={() => void deleteChat(c.id)}
                >
                  Supprimer
                </button>
                <button
                  type="button"
                  className="ct-chat-history-confirmbtn"
                  onClick={() => setPendingDeleteId(null)}
                >
                  Annuler
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="ct-chat-history-delete"
                onClick={() => { setPendingClearAll(false); setPendingDeleteId(c.id); }}
                aria-label="Supprimer"
                title="Supprimer"
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                  <path d="M1.5 3h10M4.5 3V2a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v1M5.5 5.5v4M7.5 5.5v4M2.5 3l.5 8a.5.5 0 0 0 .5.5h6a.5.5 0 0 0 .5-.5l.5-8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `il y a ${days} j`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
