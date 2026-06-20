"use client";

/**
 * ChatSettings — panneau réglages du chat (vue settings du RailRight).
 * Clé API OpenAI, choix du modèle GPT, affichage, contexte produit.
 */

import { useEffect, useState } from "react";

const LS_API_KEY = "cockpit:openai-key";
const LS_MARKDOWN = "cockpit:chat-markdown";
const LS_SHOW_THINK = "cockpit:chat-show-think";
const LS_MODEL = "cockpit:chat-model";

const DEFAULT_MODEL = "gpt-4.1";

const MODELS = [
  { value: "gpt-4.1", label: "GPT-4.1 (défaut)" },
  { value: "gpt-4o", label: "GPT-4o" },
];

export interface ChatSettingsProps {
  productName?: string;
  productColor?: string;
}

export function ChatSettings({ productName, productColor }: ChatSettingsProps = {}) {
  const [apiKey, setApiKey] = useState<string>("");
  const [apiKeyDraft, setApiKeyDraft] = useState<string>("");
  const [markdown, setMarkdown] = useState<boolean>(true);
  const [showThink, setShowThink] = useState<boolean>(false);
  const [model, setModel] = useState<string>(DEFAULT_MODEL);
  const [savedFlash, setSavedFlash] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const k = window.localStorage.getItem(LS_API_KEY) ?? "";
    setApiKey(k);
    setApiKeyDraft(k);
    setMarkdown(window.localStorage.getItem(LS_MARKDOWN) !== "0");
    setShowThink(window.localStorage.getItem(LS_SHOW_THINK) === "1");
    setModel(window.localStorage.getItem(LS_MODEL) ?? DEFAULT_MODEL);
  }, []);

  function saveApiKey() {
    window.localStorage.setItem(LS_API_KEY, apiKeyDraft);
    setApiKey(apiKeyDraft);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1600);
  }

  function updateBool(key: string, val: boolean) {
    window.localStorage.setItem(key, val ? "1" : "0");
  }

  return (
    <div className="ct-chat-settings">
      <section className="ct-chat-settings-section">
        <div className="ct-chat-settings-label">Clé API OpenAI</div>
        <div className="ct-chat-settings-row">
          <input
            type="password"
            className="ct-chat-settings-input"
            value={apiKeyDraft}
            onChange={(e) => setApiKeyDraft(e.target.value)}
            placeholder="sk-••••••••"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            className="ct-chat-settings-save"
            onClick={saveApiKey}
            disabled={apiKeyDraft === apiKey}
            style={productColor && apiKeyDraft !== apiKey ? { background: productColor } : undefined}
          >
            {savedFlash ? "✓" : "Save"}
          </button>
        </div>
        {apiKey && !savedFlash && (
          <div className="ct-chat-settings-hint">✓ Clé enregistrée localement</div>
        )}
        {savedFlash && (
          <div className="ct-chat-settings-hint">✓ Mise à jour</div>
        )}
      </section>

      <section className="ct-chat-settings-section">
        <div className="ct-chat-settings-label">Modèle</div>
        <select
          className="ct-chat-settings-select"
          value={model}
          onChange={(e) => {
            setModel(e.target.value);
            window.localStorage.setItem(LS_MODEL, e.target.value);
          }}
        >
          {MODELS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <div className="ct-chat-settings-hint">
          OpenAI GPT · API officielle
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
        <label className="ct-chat-settings-toggle">
          <input
            type="checkbox"
            checked={showThink}
            onChange={(e) => { setShowThink(e.target.checked); updateBool(LS_SHOW_THINK, e.target.checked); }}
          />
          <span>Afficher le raisonnement &lt;think&gt;</span>
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
