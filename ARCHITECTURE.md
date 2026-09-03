# Technical Architecture — n8n-nodes-voice-ai-notes

**Author:** André Rink · andre.rink@telekom.de  
**Version:** 0.4.1  
**Package:** `@t-digital/n8n-nodes-voice-ai-notes`  
**License:** MIT

---

## Summary

`n8n-nodes-voice-ai-notes` is a custom community node for the n8n workflow automation platform. It acts as a **webhook trigger** that receives AI-generated call summaries from the **CloudPBX Voice AI** service (Telekom Deutschland / BroadSoft XSI) and exposes the structured data — tasks, appointments, participants, and topics — to downstream n8n workflow nodes.

The node eliminates manual integration effort between the CloudPBX telephony platform and task/calendar systems (e.g. Todoist, Google Calendar, Microsoft To Do, Slack) by providing a typed, authenticated entry point into n8n.

---

## Node Description

| Property | Value |
|---|---|
| Node type | Webhook Trigger |
| HTTP method | `POST` |
| Webhook path | `/webhook/voiceai` |
| Response mode | `onReceived` (immediate HTTP 200 before workflow executes) |
| n8n API version | 1 |
| Outputs | Five `main` outputs: Success, Rejected, Summary, Tasks, Appointments |

### Input payload structure

The node expects the CloudPBX Voice AI webhook format (schema v0.2.1), with all call data on the root level:

```json
{
  "schemaVersion": "0.2.1",
  "callIdentifier": "string",
  "summary": "string",
  "toDos": [
    { "title": "string", "assignee": "string" }
  ],
  "calendarEntries": [
    { "title": "string", "start": "ISO8601", "end": "ISO8601" }
  ],
  "phoneCallAttendees": [
    { "name": "string", "role": "string" }
  ],
  "topics": [
    { "title": "string", "details": ["string"] }
  ],
  "callerDetails": ["string"]
}
```

**Schema version enforcement:** The node validates that the inbound `schemaVersion` matches the expected version (0.2.1). Requests with mismatched versions are rejected with a 400 Bad Request response.

### Output modes

| Mode | Description |
|---|---|
| `tasksWithContext` (default) | Each task as a separate item, with full call context attached |
| `tasksOnly` | Flat task list, no context |
| `tasksAndAppointments` | Tasks and appointments as mixed item stream |
| `fullSummary` | Single item containing the complete raw payload |

These apply only to the **Success** pin. Three additional pins are always populated
independently of the selected mode, so downstream nodes get the exact cardinality
they need without a Filter node in between:

| Pin | Items per call |
|---|---|
| `Summary` | Always exactly 1 |
| `Tasks` | One per extracted task |
| `Appointments` | One per extracted appointment |

---

## Authentication Architecture

Authentication is implemented in two independent layers that are both configured via a single **CloudPBX API** credential object stored in n8n's encrypted credential store.

```
CloudPBX Voice AI
       │
       │  POST /webhook/voiceai
       │  X-API-Key: <webhookApiKey>
       ▼
┌─────────────────────────────────┐
│   n8n Webhook Endpoint          │
│                                 │
│  Layer 1: Inbound API Key       │
│  ─────────────────────────────  │
│  Header X-API-Key is validated  │
│  against webhookApiKey from     │
│  the encrypted n8n credential.  │
│  → 401 on mismatch              │
│                                 │
│  Layer 2: CloudPBX API Auth     │
│  ─────────────────────────────  │
│  (Available in credential for   │
│  future outbound API calls,     │
│  e.g. fetching user profiles,   │
│  call recordings, etc.)         │
│  Basic Auth: username/password  │
└─────────────────────────────────┘
       │
       ▼
  Workflow continues
```

### Credential fields

| Field | Type | Purpose |
|---|---|---|
| `username` | String | CloudPBX user email — Basic Auth for outbound API calls |
| `password` | String (masked) | CloudPBX password — Basic Auth for outbound API calls |
| `webhookApiKey` | String (masked) | Shared secret validated on every inbound webhook request via `X-API-Key` header |

### Security properties

- The `webhookApiKey` is user-defined, stored encrypted in n8n's credential store, and never appears in node source code.
- Each n8n workflow instance gets a unique, randomly generated webhook URL — this is the primary routing/isolation mechanism (managed by n8n).
- The inbound API key check provides an additional authentication layer independent of the webhook URL.
- All credential values are injected at runtime by n8n; the node code itself contains no secrets.

---

## Technologies & Frameworks

### Implementation Language

The node is written entirely in **TypeScript 5.x** and compiled to **CommonJS (ES2019 target)** via the TypeScript compiler (`tsc`). No transpiler (Babel) or bundler (Webpack/esbuild) is involved — the compiled output is plain JavaScript that n8n loads directly via Node.js `require()`.

TypeScript was chosen because:
- It is the **mandatory language** for n8n community node verification
- Static typing reduces runtime errors in payload parsing
- n8n's own SDK (`n8n-workflow`) ships full TypeScript type definitions
- The `crypto` module (used for `timingSafeEqual`) is a Node.js built-in, no additional dependencies required

The compiled output targets **Node.js ≥ 18** (n8n's minimum runtime requirement).

### Full Stack

| Layer | Technology | Version | Role |
|---|---|---|---|
| Runtime platform | **n8n** | self-hosted | Workflow automation engine hosting the node |
| Node SDK | **n8n-workflow** | `*` (peer) | Type definitions and interfaces (`INodeType`, `IWebhookFunctions`, etc.) |
| Implementation language | **TypeScript** | `^5.0` | Statically typed source language |
| Compile target | **CommonJS / ES2019** | — | Output format required by n8n's Node.js runtime |
| Compiler | **tsc** | bundled with TypeScript | Compiles TypeScript source to JavaScript |
| Runtime | **Node.js** | ≥ 18 | Execution environment (provided by n8n host) |
| Crypto | **Node.js `crypto`** | built-in | `timingSafeEqual` for API key comparison |
| External API | **BroadSoft XSI-Actions REST API** | v2.0 | CloudPBX platform API (Telekom Deutschland) |
| Auth protocol (outbound) | **HTTP Basic Auth** | — | CloudPBX API authentication |
| Auth protocol (inbound) | **API Key via HTTP header** | — | Webhook caller authentication (`X-API-Key`) |
| Packaging | **npm** | — | Distribution as community node package |
| CI/CD (planned) | **GitHub Actions** | — | Provenance-signed npm publish (required for n8n verification from May 2026) |

### Runtime dependencies

**None.** The package has no runtime `dependencies` in `package.json`. All n8n interfaces are declared as `peerDependencies` (provided by the host n8n installation). This is a hard requirement for n8n community node verification.

### Source layout

```
n8n-nodes-voice-ai-notes/
├── credentials/
│   └── CloudPBXApi.credentials.ts     # Credential type definition
├── nodes/
│   └── VoiceAINotesWebhook/
│       ├── VoiceAINotesWebhook.node.ts # Node implementation
│       └── voiceAINotesWebhook.png     # Node icon
├── dist/                              # Compiled output (shipped to n8n)
├── .github/workflows/publish.yml      # npm publish with provenance
├── tsconfig.json
└── package.json
```

---

## Data Flow

```
1. CloudPBX finishes call processing
        │
2. CloudPBX POSTs summary to n8n webhook URL
        │  Header: X-API-Key: <webhookApiKey>
        │
3. n8n routes request to VoiceAINotesWebhook node
        │
4. Node validates X-API-Key against credential store
        │  → 401 Unauthorized on failure
        │
5. Node parses payload, filters empty tasks/appointments
        │
6. Node emits structured items to workflow output
        │
7. n8n returns 200 OK to CloudPBX immediately
        │
8. Downstream workflow nodes process tasks/appointments
        │  e.g. create Todoist tasks, Google Calendar events, Slack messages
```

---

## n8n Verification Status

The node is being prepared for submission to the **n8n Creator Portal** for official community node verification. Current compliance status:

| Requirement | Status |
|---|---|
| Package name matches `@<scope>/n8n-nodes-*` | ✅ `@t-digital/n8n-nodes-voice-ai-notes` |
| `n8n-community-node-package` keyword present | ✅ |
| MIT license | ✅ |
| No runtime dependencies | ✅ |
| No `process.env` / filesystem access | ✅ |
| TypeScript implementation | ✅ |
| English-only UI text | ✅ |
| Boolean descriptions start with "Whether…" | ✅ |
| Password fields masked | ✅ |
| README with usage documentation | ✅ |
| `repository` field in `package.json` matches GitHub repo | ✅ (added, pending repo push) |
| Public GitHub repository | 🟡 provisional URL set (https://github.com/telekom/n8n-nodes-voice-ai-notes), not yet confirmed live |
| Published to npm | ✅ (`@t-digital/n8n-nodes-voice-ai-notes`) |
| Published **with npm provenance** | ❌ confirmed failing — `npx @n8n/scan-community-package` rejects 0.3.3 and 0.4.0 because both were published locally (`npm publish`), not via CI. Must publish 0.4.1+ through `.github/workflows/publish.yml` |
| `NPM_TOKEN` secret (or Trusted Publisher) configured on GitHub repo | ❌ not yet set up |
| `npx @n8n/scan-community-package` passes end-to-end | ❌ blocked by the provenance failure above; re-run once 0.4.1 is published via the workflow |
