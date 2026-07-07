# n8n-nodes-voice-ai-cloudpbx

This is an n8n community node that integrates with the **CloudPBX Voice AI** service by Telekom Deutschland. It receives call summaries via webhook and automatically extracts structured tasks and appointments for use in your workflows.

## Features

- Receives Voice AI call summaries from CloudPBX via webhook
- Verifies inbound requests using an API key and matches the caller to the configured user account
- Extracts tasks, appointments, participants, and topics from the call summary
- Multiple output modes to fit different workflow needs
- Normalizes phone numbers to E.164 format for reliable matching

## Supported Output Modes

| Mode | Description |
|---|---|
| **Tasks Only** | Outputs each extracted task as a separate item |
| **Tasks + Appointments** | Outputs tasks and appointments as separate items |
| **Full Summary** | Outputs the complete call summary with all fields |
| **Tasks + Context** | Outputs each task together with full call context (default) |

## Installation

Follow the [n8n community node installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) to install this node in your n8n instance.

```
n8n-nodes-voice-ai-cloudpbx
```

## Credentials

This node requires **CloudPBX API** credentials with three fields:

| Field | Description |
|---|---|
| **Username** | Your CloudPBX username (email address, e.g. `user@deutschland-lan.de`) |
| **Password** | Your CloudPBX password |
| **Webhook API Key** | A shared secret you configure in the CloudPBX Voice AI webhook settings. CloudPBX sends this value in the `X-API-Key` header with every webhook call. |

### Setting up the Webhook API Key

1. In your n8n node, create a new **CloudPBX API** credential and set all three fields.
2. Copy your n8n webhook URL from the node (shown after activating the workflow).
3. In the CloudPBX portal, navigate to your Voice AI configuration and enter:
   - **Webhook URL**: your n8n webhook URL
   - **API Key**: the same value you entered as *Webhook API Key* in the credential

## Usage

### How it works

When CloudPBX finishes processing a call, it sends a POST request to the webhook URL with the call summary payload. The node:

1. Verifies the `X-API-Key` header against the key stored in your credentials
2. Fetches your user profile from the CloudPBX API to resolve your phone number
3. Compares the caller number from the payload against your registered number
4. If the numbers match, extracts and forwards the call data to your workflow

### Payload structure

The node expects the CloudPBX Voice AI webhook payload format:

```json
{
  "callIdentifier": "abc-123",
  "summarizationPromptResponse": {
    "summary": "Call about project deadline...",
    "tasks": [{ "title": "Send contract", "assignee": "John" }],
    "appointments": [{ "title": "Follow-up call", "start": "2024-12-01T10:00:00Z" }],
    "phoneCallParticipants": ["Alice", "Bob"],
    "conversationTopics": ["contract", "deadline"],
    "callerData": ["+4922843354422"]
  }
}
```

### Example workflow

1. Add the **Voice AI Notes for CloudPBX** trigger node to your workflow
2. Configure your **CloudPBX API** credentials
3. Select your preferred output mode (default: *Tasks + Context*)
4. Connect to downstream nodes, for example:
   - Create tasks in Todoist, ClickUp, or Microsoft To Do
   - Add appointments to Google Calendar or Outlook
   - Send a summary to Slack or Teams

## Configuration Options

### Include Appointments
Whether to include appointment suggestions alongside tasks in the output (available in *Tasks + Appointments* and *Tasks + Context* modes).

### Additional Fields

| Field | Default | Description |
|---|---|---|
| Add Metadata | true | Whether to attach metadata (timestamp, user ID) to each item |
| Filter Empty Tasks | true | Whether to filter out tasks or appointments with empty titles |
| Add Item Index | true | Whether to add a sequential index to each output item |
| Response Message | *(success text)* | The response message sent back to the CloudPBX webhook |
| Response Status Code | 200 | The HTTP status code returned to CloudPBX |

## Resources

- [CloudPBX API documentation](https://cpbx-hilfe.deutschland-lan.de/de/ratgeber-zur-konfiguration/tipps-und-tricks/einstellungshilfen/nutzung-der-cpbx-api?mode=user)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](LICENSE)
