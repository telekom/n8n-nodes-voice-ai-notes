# n8n-nodes-voice-ai-cloudpbx

This is an n8n community node that integrates with the **CloudPBX Voice AI Notes** service by Telekom Deutschland. It receives call summaries via webhook and automatically extracts structured tasks and calendar appointments for use in your workflows.

## Features

- Receives Voice AI call summaries from CloudPBX via webhook
- Authenticates inbound requests using a shared API key (`X-API-Key` header)
- Validates the payload against the expected CloudPBX schema version
- Extracts tasks, appointments, participants, and topics from the call summary
- Four output modes to fit different workflow needs
- Dual outputs: **Success** and **Rejected** — rejected requests are routed to a separate output pin for logging or alerting without a separate IF node

## Supported Output Modes

| Mode | Description |
|---|---|
| **Tasks Only** | Outputs each extracted task as a separate item |
| **Tasks + Appointments** | Outputs tasks and appointments as separate typed items |
| **Full Summary** | Outputs the complete call summary as a single item |
| **Tasks + Context** *(default)* | Outputs each task together with full call context (summary, participants, topics) |

## Installation

Follow the [n8n community node installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) to install this node in your n8n instance.

```
n8n-nodes-voice-ai-cloudpbx
```

## Credentials

This node requires **Voice AI Notes** credentials with three fields:

| Field | Description |
|---|---|
| **Username** | Your CloudPBX username (email address, e.g. `user@deutschland-lan.de`) |
| **Password** | Your CloudPBX password |
| **Webhook API Key** | A shared secret configured in the CloudPBX Voice AI webhook settings. CloudPBX sends this value in the `X-API-Key` header with every webhook request. |

### Setting up the Webhook API Key

1. In your n8n node, create a new **Voice AI Notes** credential and fill in all three fields.
2. Copy the webhook URL from the node (shown after activating the workflow).
3. In the CloudPBX portal, navigate to your Voice AI configuration and enter:
   - **Webhook URL**: your n8n webhook URL
   - **API Key**: the same value you set as *Webhook API Key* in the credential

## How It Works

When CloudPBX finishes processing a call, it sends a POST request to the webhook URL with the call summary payload. The node:

1. Verifies the `X-API-Key` header against the key stored in your credentials using constant-time comparison
2. Validates the payload schema version against the expected version (`0.2.1`)
3. Extracts and structures the call data according to the selected output mode
4. Routes the result to the **Success** output, or to the **Rejected** output on auth or schema failure

## Payload Structure

The node expects the CloudPBX Voice AI webhook payload format (schema version `0.2.1`):

```json
{
  "schemaVersion": "0.2.1",
  "callIdentifier": "abc-123",
  "summary": "Call about the project deadline and next steps.",
  "callParticipants": {
    "vainCustomerPhoneNumber": "+4922147106642",
    "otherAttendeePhoneNumber": "+491713920042"
  },
  "toDos": [
    { "title": "Send contract", "assignee": "John" }
  ],
  "calendarEntries": [
    { "title": "Follow-up call", "start": "2024-12-01T10:00:00Z", "end": "2024-12-01T10:30:00Z" }
  ],
  "phoneCallAttendees": [
    { "name": "Alice", "role": "host" }
  ],
  "topics": [
    { "title": "Contract", "details": ["deadline", "terms"] }
  ],
  "callerDetails": ["+4922147106642"]
}
```

## Example Workflow

1. Add the **Voice AI Notes** trigger node to your workflow
2. Configure your **Voice AI Notes** credentials
3. Select your preferred output mode (default: *Tasks + Context*)
4. Connect the **Success** output to downstream nodes, for example:
   - Create tasks in Todoist, ClickUp, or Microsoft To Do
   - Add appointments to Google Calendar or Outlook
   - Send a summary to Slack or Microsoft Teams
5. Optionally connect the **Rejected** output to a logging or alerting node

## Configuration Options

### Include Appointments
Whether to include calendar entries alongside tasks in the output (available in *Tasks + Appointments* and *Tasks + Context* modes).

### Additional Fields

| Field | Default | Description |
|---|---|---|
| Add Metadata | `true` | Attaches metadata (timestamp, caller details) to each output item |
| Filter Empty Tasks | `true` | Filters out tasks or appointments with empty titles |
| Add Item Index | `true` | Adds a sequential index to each output item |
| Response Message | *(success text)* | The response body message sent back to CloudPBX |
| Response Status Code | `200` | The HTTP status code returned to CloudPBX (200–299) |

## Resources

- [CloudPBX API documentation](https://cpbx-hilfe.deutschland-lan.de/de/ratgeber-zur-konfiguration/tipps-und-tricks/einstellungshilfen/nutzung-der-cpbx-api?mode=user)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](LICENSE)
