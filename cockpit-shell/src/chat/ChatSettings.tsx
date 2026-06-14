"use client";

/**
 * ChatSettings — réglages d'affichage du rail chat (modèle piloté côté serveur).
 */

import { useEffect, useState } from "react";

const LS_MARKDOWN = "cockpit:chat-markdown";

export interface ChatSettingsProps {
  productName?: string;
  productColor?: string;
}

export function ChatSettings({ productName, productColor }: ChatSettingsProps = {}) {
  const [markdown, setMarkdown] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setMarkdown(window.localStorage.getItem(LS_MARKDOWN) !== "0");
  }, []);

  function updateBool(key: string, val: boolean) {
    window.localStorage.setItem(key, val ? "1" : "0");
  }

  return (
    <div className="ct-chat-settings">
      <section className="ct-chat-settings-section">
        <div className="ct-chat-settings-label">Modèle (serveur)</div>
        <div className="ct-chat-settings-hint">
          Chat rail : GPT-4o · Mémo stratégique : GPT-4.1
          <br />
          Configuré via <code>OPENAI_CHAT_MODEL</code> / <code>OPENAI_MEMO_MODEL</code>
        </div>
      </section>

      <section className="ct-chat-settings-section">
        <div className="ct-chat-settings-label">Affichage</div>
        <label className="ct-chat-settings-toggle">
          <input
            type="checkbox"
            checked={markdown}
            onChange={(e) => { setMarkdown(e.target.checked); updateBool(LS_MARKDOWN, e.target.checked); }}
          />
          <span>Rendu Markdown</span>
        </label>
      </section>

      <section className="ct-chat-settings-section">
        <div className="ct-chat-settings-label">Contexte produit</div>
        <div className="ct-chat-settings-product">
          <span
            className="ct-chat-ctx-dot"
            style={{ background: productColor ?? "var(--ct-accent)" }}
          />
          <span className="ct-chat-settings-product-name">{productName ?? "—"}</span>
        </div>
        <div className="ct-chat-settings-hint">
          L'assistant connaît ce produit automatiquement et adapte ses réponses.
        </div>
      </section>
    </div>
  );
}
