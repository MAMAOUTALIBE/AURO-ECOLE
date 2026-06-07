"use client";

import { useState } from "react";
import { Bot, FileText, Sparkles, Target } from "lucide-react";
import { AiAgentChat } from "@/components/crm/AiAgentChat";

type Tool = "agent" | "resume" | "contenu" | "qualif";

const CONTENT_KINDS = [
  { key: "faq", label: "FAQ" },
  { key: "formation", label: "Description formation" },
  { key: "article", label: "Article de blog" },
  { key: "email", label: "Email / relance" }
];

async function callAi(path: string, body: unknown) {
  const response = await fetch(`/api/ai/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error?.message ?? "L'assistant IA n'est pas disponible.");
  return payload.data;
}

export function AiAssistant() {
  const [tool, setTool] = useState<Tool>("agent");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Résumé
  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");

  // Contenu
  const [kind, setKind] = useState("faq");
  const [prompt, setPrompt] = useState("");
  const [content, setContent] = useState("");

  // Qualification
  const [lead, setLead] = useState({ fullName: "", interest: "", source: "", message: "" });
  const [score, setScore] = useState<{ temperature?: string; score?: number; raison?: string; prochaineAction?: string } | null>(null);

  const reset = () => {
    setError(null);
  };

  const runSummarize = async () => {
    reset();
    setLoading(true);
    try {
      const data = await callAi("summarize", { text });
      setSummary(data.summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const runContent = async () => {
    reset();
    setLoading(true);
    try {
      const data = await callAi("content-generator", { kind, prompt });
      setContent(data.content);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const runScore = async () => {
    reset();
    setLoading(true);
    try {
      const data = await callAi("lead-score", lead);
      setScore(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const tempStyle =
    score?.temperature === "chaud" ? "bg-red-50 text-red-700" : score?.temperature === "froid" ? "bg-sky-50 text-sky-700" : "bg-amber-50 text-amber-700";

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap gap-2">
        {[
          { key: "agent" as const, label: "Agent (actions)", icon: Bot },
          { key: "resume" as const, label: "Résumer une demande", icon: FileText },
          { key: "contenu" as const, label: "Générer du contenu", icon: Sparkles },
          { key: "qualif" as const, label: "Qualifier un prospect", icon: Target }
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setTool(item.key)}
              className={`focus-ring inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                tool === item.key ? "border-loden-700 bg-loden-700 text-white" : "border-slate-200 bg-white text-loden-ink hover:bg-loden-50"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
      </div>

      {tool === "agent" ? <AiAgentChat /> : (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        {tool === "resume" ? (
          <div className="grid gap-4">
            <h2 className="text-lg font-semibold text-loden-ink">Résumer une demande client</h2>
            <textarea className="field-input min-h-32" placeholder="Collez ici le message / la demande du client…" value={text} onChange={(e) => setText(e.target.value)} />
            <button type="button" onClick={runSummarize} disabled={loading || text.trim().length < 5} className="focus-ring inline-flex w-fit items-center gap-2 rounded-full bg-loden-700 px-6 py-3 font-semibold text-white shadow-soft hover:bg-loden-800 disabled:opacity-60">
              {loading ? "Analyse…" : "Résumer"}
            </button>
            {summary ? <pre className="whitespace-pre-wrap rounded-2xl bg-loden-pearl/60 p-4 text-sm text-loden-ink">{summary}</pre> : null}
          </div>
        ) : null}

        {tool === "contenu" ? (
          <div className="grid gap-4">
            <h2 className="text-lg font-semibold text-loden-ink">Générer du contenu</h2>
            <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
              <select className="field-input" value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Type de contenu">
                {CONTENT_KINDS.map((k) => <option key={k.key} value={k.key}>{k.label}</option>)}
              </select>
              <input className="field-input" placeholder="Sujet / consigne (ex: avantages de la conduite accompagnée)" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
            </div>
            <button type="button" onClick={runContent} disabled={loading || prompt.trim().length < 3} className="focus-ring inline-flex w-fit items-center gap-2 rounded-full bg-loden-700 px-6 py-3 font-semibold text-white shadow-soft hover:bg-loden-800 disabled:opacity-60">
              {loading ? "Génération…" : "Générer"}
            </button>
            {content ? <pre className="whitespace-pre-wrap rounded-2xl bg-loden-pearl/60 p-4 text-sm text-loden-ink">{content}</pre> : null}
          </div>
        ) : null}

        {tool === "qualif" ? (
          <div className="grid gap-4">
            <h2 className="text-lg font-semibold text-loden-ink">Qualifier un prospect</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="field-input" placeholder="Nom" value={lead.fullName} onChange={(e) => setLead({ ...lead, fullName: e.target.value })} />
              <input className="field-input" placeholder="Intérêt (ex: permis accéléré)" value={lead.interest} onChange={(e) => setLead({ ...lead, interest: e.target.value })} />
              <input className="field-input" placeholder="Source (ex: site, Google)" value={lead.source} onChange={(e) => setLead({ ...lead, source: e.target.value })} />
            </div>
            <textarea className="field-input min-h-24" placeholder="Message du prospect…" value={lead.message} onChange={(e) => setLead({ ...lead, message: e.target.value })} />
            <button type="button" onClick={runScore} disabled={loading} className="focus-ring inline-flex w-fit items-center gap-2 rounded-full bg-loden-700 px-6 py-3 font-semibold text-white shadow-soft hover:bg-loden-800 disabled:opacity-60">
              {loading ? "Analyse…" : "Qualifier"}
            </button>
            {score ? (
              <div className="rounded-2xl bg-loden-pearl/60 p-4">
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-sm font-semibold capitalize ${tempStyle}`}>{score.temperature ?? "—"}</span>
                  {typeof score.score === "number" ? <span className="text-sm font-semibold text-loden-ink">{score.score}/100</span> : null}
                </div>
                {score.raison ? <p className="mt-2 text-sm text-loden-ink"><strong>Raison :</strong> {score.raison}</p> : null}
                {score.prochaineAction ? <p className="mt-1 text-sm text-loden-ink"><strong>Action :</strong> {score.prochaineAction}</p> : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {error ? <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p> : null}
        <p className="mt-4 text-xs text-loden-muted">Les suggestions IA sont indicatives : relisez avant d’envoyer ou de publier.</p>
      </div>
      )}
    </div>
  );
}
