"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nodeDescription = void 0;
exports.nodeDescription = {
    displayName: 'Voice AI Notes',
    name: 'voiceAINotesWebhook',
    icon: 'file:voiceAINotesWebhook.png',
    group: ['trigger'],
    version: 1,
    description: 'Receives Voice AI call summaries and automatically extracts tasks and appointments',
    defaults: {
        name: 'Voice AI Notes',
    },
    inputs: [],
    outputs: ['main', 'main'],
    outputNames: ['Success', 'Rejected'],
    webhooks: [
        {
            name: 'default',
            httpMethod: 'POST',
            responseMode: 'onReceived',
            path: 'voiceai',
        },
    ],
    credentials: [
        {
            name: 'cloudPBXApi',
            required: true,
        },
    ],
    properties: [
        {
            displayName: 'Output Mode',
            name: 'outputMode',
            type: 'options',
            options: [
                {
                    name: 'Tasks Only',
                    value: 'tasksOnly',
                    description: 'Output only the extracted tasks',
                },
                {
                    name: 'Tasks + Appointments',
                    value: 'tasksAndAppointments',
                    description: 'Output tasks and appointments as separate items',
                },
                {
                    name: 'Full Summary',
                    value: 'fullSummary',
                    description: 'Output the complete summary with all fields',
                },
                {
                    name: 'Tasks + Context',
                    value: 'tasksWithContext',
                    description: 'Output tasks with call context (summary, participants, topics)',
                },
            ],
            default: 'tasksWithContext',
            description: 'How to structure the output data',
        },
        {
            displayName: 'Include Appointments',
            name: 'includeAppointments',
            type: 'boolean',
            default: true,
            description: 'Whether to include appointment suggestions in the output',
            displayOptions: {
                show: {
                    outputMode: ['tasksAndAppointments', 'tasksWithContext'],
                },
            },
        },
        {
            displayName: 'Additional Fields',
            name: 'additionalFields',
            type: 'collection',
            placeholder: 'Add Field',
            default: {},
            options: [
                {
                    displayName: 'Add Metadata',
                    name: 'addMetadata',
                    type: 'boolean',
                    default: true,
                    description: 'Whether to add metadata (timestamp, caller details) to each output item',
                },
                {
                    displayName: 'Filter Empty Tasks',
                    name: 'filterEmpty',
                    type: 'boolean',
                    default: true,
                    description: 'Whether to filter out empty or invalid tasks and appointments',
                },
                {
                    displayName: 'Add Item Index',
                    name: 'addIndex',
                    type: 'boolean',
                    default: true,
                    description: 'Whether to add a sequential index to each output item',
                },
                {
                    displayName: 'Response Message',
                    name: 'responseMessage',
                    type: 'string',
                    default: 'Voice AI data received and processed successfully',
                    description: 'The response message returned to the webhook sender',
                },
                {
                    displayName: 'Response Status Code',
                    name: 'responseCode',
                    type: 'number',
                    default: 200,
                    typeOptions: {
                        minValue: 200,
                        maxValue: 299,
                    },
                    description: 'The HTTP status code returned to the webhook sender (must be 200–299)',
                },
            ],
        },
    ],
};
//# sourceMappingURL=nodeDescription.js.map