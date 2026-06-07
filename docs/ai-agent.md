# Agent IA LODENE

Agent IA intégré au site public (chatbot) et au CRM (assistant), via une **couche provider-agnostique**. Groq aujourd'hui, swappable demain (OpenAI / Mistral / Claude / Ollama).

## Architecture

```
Frontend (widget public + assistant CRM)
   │  fetch same-origin (jamais la clé IA)
   ▼
Next proxies  app/api/ai/*           (chat public · summarize/lead-score/content-generator relaient le cookie)
   ▼
Express  /api/ai/*  (backend/src/modules/ai/ai.routes.ts)
   │  rate-limit dédié · validation Zod · RBAC sur les outils CRM
   ▼
Couche IA  backend/src/ai/
   ├─ types.ts            interface AiProvider (chat tool-calling + complete)
   ├─ groq-provider.ts    Groq (fetch, API compatible OpenAI) + DisabledAiProvider
   ├─ provider-factory.ts choisit le provider selon AI_PROVIDER + clé
   ├─ prompts.ts          prompts (sécurité + rôle, ancrés sur les données réelles)
   ├─ tools.ts            outils/actions de l'agent (registry borné par scope)
   └─ agent.ts            boucle d'agent (chat → exécution d'outils → réponse)
Adapters : backend/src/shared/mailer.ts (email) · sms.ts (SMS) · AuditLog (repo)
```

## Agent à outils (actions)

L'agent **public** dispose d'outils **bornés** (sécurité par capacités) :
`get_formations` · `get_prices` · `get_agencies` · `get_available_slots` (lecture publique) ·
`create_lead` (crée un prospect) · `request_appointment` (enregistre une **demande** de RDV + confirmation email/SMS au visiteur + notification interne).

**Point de sécurité clé** : l'agent public n'a **aucun** outil pour lire des dossiers élèves, des finances ou des données d'autres clients. Même en cas de prompt-injection, il ne peut pas y accéder — la limite est *capacitaire*, pas seulement *prompt*. La prise de RDV crée une **demande** (lead) ; un conseiller confirme le créneau réel (aucune écriture directe dans le planning depuis le public). Chaque action (`create_lead`, `request_appointment`) est journalisée dans `AuditLog`.

### Agent CRM authentifié (`POST /api/ai/agent`)

Agent interne pour l'équipe (auth + `dashboard.read`). Outils supplémentaires **gardés par permission** : `find_student` (`students.read`), `book_appointment` (**réservation réelle** dans le planning, `bookings.manage`, vérifie les conflits + confirmation email/SMS à l'élève + audit `ai.book_appointment`), plus les lectures publiques et `create_lead`.

**RBAC par rôle** : le routeur **n'expose à l'agent que les outils autorisés** par le rôle connecté (`crmTools.filter(hasPermission(role, tool.permission))`). Un COMPTABLE (sans `bookings.manage`) n'a donc pas l'outil de réservation — l'agent ne peut pas l'utiliser. Auto-qualification des nouveaux prospects (chaud/tiède/froid) via `qualifyLead` sur création (contact, agent, manuel). UI : onglet **« Agent (actions) »** dans `/admin/assistant`.

**Pour changer de modèle/provider** : ajouter une implémentation de `AiProvider` et un `case` dans `provider-factory.ts`. Aucun autre changement.

## Configuration (.env)

```
AI_PROVIDER=groq
AI_MODEL=llama-3.1-8b-instant     # rapide & économique ; ex. llama-3.3-70b-versatile pour + de qualité
GROQ_API_KEY=...                  # clé gratuite : https://console.groq.com
```

Sans `GROQ_API_KEY`, l'IA est **désactivée proprement** : les routes renvoient `503 AI_UNAVAILABLE` avec un message clair, et l'UI affiche un repli (« contactez un conseiller au 01 84 80 12 45 »). L'app reste 100 % fonctionnelle.

## Endpoints

| Route | Accès | Usage |
|---|---|---|
| `POST /api/ai/chat` | **public** | Chatbot du site. Corps : `{ messages: [{role:"user"\|"assistant", content}] }` (max 12, 2000 car.). Prompt système ancré sur formations/tarifs/agences réels. |
| `POST /api/ai/summarize` | `dashboard.read` | Résume une demande client + propose une catégorie. |
| `POST /api/ai/lead-score` | `dashboard.read` | Qualifie un prospect → JSON `{temperature: chaud/tiede/froid, score, raison, prochaineAction}`. |
| `POST /api/ai/content-generator` | `content.manage` | Génère FAQ / description formation / article / email. |

## Sécurité
- **Clé jamais exposée** : uniquement côté backend ; le frontend passe par les proxies Next same-origin.
- **Rate limit dédié** sur `/api/ai/*` (20 req/min hors test), en plus de la limite globale.
- **Validation Zod** stricte (longueur et nombre de messages limités).
- Outils CRM derrière **authentification + RBAC** ; le chat public est volontairement ouvert mais borné.
- **Logs minimaux** (uniquement les erreurs IA, pas le contenu des conversations).
- Garde-fou produit : le prompt interdit d'inventer tarifs/disponibilités et impose l'orientation vers un conseiller en cas de doute.

## UX
- **Site public** : widget flottant `components/AiChatWidget.tsx` (bouton turquoise, au-dessus du bouton WhatsApp), ajouté dans `app/layout.tsx`.
- **CRM** : `components/crm/AiAssistant.tsx` sur `/admin/assistant` (3 outils : résumé, génération de contenu, qualification prospect) + lien « Assistant IA » dans l'en-tête.

## Tester
1. Obtenir une clé gratuite sur https://console.groq.com, la mettre dans `.env` (`GROQ_API_KEY`), redémarrer l'API.
2. Site public → bouton ✨ en bas à droite → poser une question (« Quel permis pour débuter ? »).
3. CRM → **Assistant IA** → coller une demande client → « Résumer » ; ou qualifier un prospect.

Sans clé, tout fonctionne mais l'IA répond par le message de repli (utile pour développer/déployer sans coût).

## Évolutions prévues
- Création automatique de tâches CRM à partir des conversations.
- Qualification auto des nouveaux leads (au `POST /contact-requests`).
- Brouillons de relance email/SMS pré-remplis.
- Streaming des réponses ; mémoire de conversation persistée.
