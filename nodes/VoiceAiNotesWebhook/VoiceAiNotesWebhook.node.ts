import {
	IHookFunctions,
	IWebhookFunctions,
	IWebhookResponseData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	NodeConnectionTypes,
	NodeOperationError,
} from 'n8n-workflow';

import { WebhookPayload, CloudPBXApiCredentials } from './types';
import {
	CLOUDPBX_SCHEMA_VERSION,
	OUTPUT_MODES,
	ITEM_TYPES,
	DEFAULT_RESPONSE_MESSAGE,
	HTTP_STATUS_CODE_MIN,
	HTTP_STATUS_CODE_MAX,
} from './constants';
import {
	filterByTitle,
	safeCompare,
	buildTaskItem,
	buildAppointmentItem,
} from './helpers';

function reject(statusCode: number, error: string): IWebhookResponseData {
	return {
		webhookResponse: { status: statusCode, body: { success: false, error } },
		// outputs: Success, Rejected, Summary, Tasks, Appointments — only Rejected carries data here
		workflowData: [[], [{ json: { _statusCode: statusCode, _error: error, _receivedAt: new Date().toISOString() } }], [], [], []],
	};
}

export class VoiceAiNotesWebhook implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Voice AI Notes',
		name: 'voiceAiNotesWebhook',
		icon: 'file:voiceAiNotesWebhook.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["outputMode"]}}',
		description: 'Receives Voice AI call summaries and automatically extracts tasks and appointments',
		defaults: {
			name: 'Voice AI Notes',
		},
		inputs: [],
		outputs: [
			NodeConnectionTypes.Main,
			NodeConnectionTypes.Main,
			NodeConnectionTypes.Main,
			NodeConnectionTypes.Main,
			NodeConnectionTypes.Main,
		],
		outputNames: ['Success', 'Rejected', 'Summary', 'Tasks', 'Appointments'],
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
						displayName: 'Add Item Index',
						name: 'addIndex',
						type: 'boolean',
						default: true,
						description: 'Whether to add a sequential index to each output item',
					},
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

	// The CloudPBX Voice AI webhook is registered out-of-band: the user pastes
	// this node's webhook URL into the CloudPBX admin panel. CloudPBX exposes no
	// API to create or remove the subscription, so the lifecycle hooks are
	// no-ops — `checkExists` reports the webhook as present so n8n never calls
	// `create`, and `delete` has nothing to tear down.
	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				return true;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const outputMode = this.getNodeParameter('outputMode') as string;
		const additionalFields = this.getNodeParameter('additionalFields', {}) as IDataObject;
		const includeAppointments = this.getNodeParameter('includeAppointments', true) as boolean;
		const includeIndex = !!(additionalFields.addIndex);
		const includeMetadata = !!(additionalFields.addMetadata);
		const filterEmpty = !!(additionalFields.filterEmpty);

		const headers = this.getHeaderData();
		const bodyData = this.getBodyData();

		try {
			const credentials = await this.getCredentials('cloudPBXApi') as CloudPBXApiCredentials;
			const webhookApiKey = credentials.webhookApiKey ?? '';
			const inboundApiKey = (headers['x-api-key'] as string) ?? '';

			if (!webhookApiKey || !safeCompare(inboundApiKey, webhookApiKey)) {
				return reject(401, 'Unauthorized: invalid API key.');
			}

			const payload = new WebhookPayload(bodyData);

			if (payload.schemaVersion !== CLOUDPBX_SCHEMA_VERSION) {
				return reject(400, `Unsupported schema version: ${payload.schemaVersion}. Expected: ${CLOUDPBX_SCHEMA_VERSION}`);
			}

			const {
				callIdentifier,
				summary,
				callParticipants,
				toDos,
				calendarEntries,
				phoneCallAttendees,
				topics,
				callerDetails,
			} = payload;

			const filteredTasks = filterEmpty ? filterByTitle(toDos) : toDos;
			const filteredAppointments = filterEmpty ? filterByTitle(calendarEntries) : calendarEntries;

			const returnData: IDataObject[] = [];
			const receivedAt = new Date().toISOString();

			const context: IDataObject = {
				callIdentifier,
				summary,
				callParticipants,
				phoneCallAttendees,
				topics,
				callerDetails,
			};

			switch (outputMode) {
				case OUTPUT_MODES.TASKS_ONLY:
					filteredTasks.forEach((task, index) => {
						returnData.push(buildTaskItem(task, index, filteredTasks, includeIndex, includeMetadata, receivedAt, callerDetails));
					});
					break;

				case OUTPUT_MODES.TASKS_AND_APPOINTMENTS:
					filteredTasks.forEach((task, index) => {
						const item = buildTaskItem(task, index, filteredTasks, includeIndex, includeMetadata, receivedAt, callerDetails);
						item.type = 'task';
						if (includeIndex) item.totalAppointments = filteredAppointments.length;
						returnData.push(item);
					});
					if (includeAppointments) {
						filteredAppointments.forEach((apt, index) => {
							returnData.push(buildAppointmentItem(apt, index, filteredAppointments, filteredTasks, includeIndex, includeMetadata, receivedAt, callerDetails));
						});
					}
					break;

				case OUTPUT_MODES.FULL_SUMMARY: {
					const fullOutput: IDataObject = {
						schemaVersion: CLOUDPBX_SCHEMA_VERSION,
						callIdentifier,
						summary,
						callParticipants,
						toDos: filteredTasks,
						calendarEntries: filteredAppointments,
						phoneCallAttendees,
						topics,
						callerDetails,
					};
					if (includeMetadata) {
						fullOutput._metadata = {
							receivedAt,
							schemaVersion: CLOUDPBX_SCHEMA_VERSION,
							totalTasks: filteredTasks.length,
							totalAppointments: filteredAppointments.length,
							totalAttendees: phoneCallAttendees.length,
							totalTopics: topics.length,
						};
					}
					returnData.push(fullOutput);
					break;
				}

				case OUTPUT_MODES.TASKS_WITH_CONTEXT:
					if (filteredTasks.length === 0) {
						const outputItem: IDataObject = {
							_hasTasks: false,
							context,
							appointments: includeAppointments ? filteredAppointments : [],
						};
						if (includeMetadata) {
							outputItem._metadata = {
								receivedAt,
								itemType: 'summary',
								schemaVersion: CLOUDPBX_SCHEMA_VERSION,
								callerDetails,
								totalItems: 0,
								totalAppointments: filteredAppointments.length,
							};
						}
						returnData.push(outputItem);
					} else {
						filteredTasks.forEach((task, index) => {
							const outputItem: IDataObject = {
								task: buildTaskItem(task, index, filteredTasks, includeIndex, false, receivedAt, callerDetails),
								context,
								appointments: includeAppointments ? filteredAppointments : [],
							};
							if (includeMetadata) {
								outputItem._metadata = {
									receivedAt,
									itemType: 'task',
									schemaVersion: CLOUDPBX_SCHEMA_VERSION,
									callerDetails,
									itemNumber: index + 1,
									totalItems: filteredTasks.length,
									totalAppointments: filteredAppointments.length,
								};
							}
							returnData.push(outputItem);
						});
					}
					break;

				default:
					return reject(400, `Unknown output mode: ${outputMode}`);
			}

			// Dedicated per-type pins, populated regardless of Output Mode: Summary always
			// emits exactly one item per call, so downstream nodes that should fire once per
			// call (e.g. "send a notification email") don't get triggered once per task.
			const summaryItem: IDataObject = {
				...context,
				totalTasks: filteredTasks.length,
				totalAppointments: filteredAppointments.length,
			};
			if (includeMetadata) {
				summaryItem._metadata = {
					receivedAt,
					itemType: ITEM_TYPES.SUMMARY,
					schemaVersion: CLOUDPBX_SCHEMA_VERSION,
					callerDetails,
					totalTasks: filteredTasks.length,
					totalAppointments: filteredAppointments.length,
				};
			}

			const taskItems = filteredTasks.map((task, index) =>
				buildTaskItem(task, index, filteredTasks, includeIndex, includeMetadata, receivedAt, callerDetails),
			);
			const appointmentItems = filteredAppointments.map((apt, index) =>
				buildAppointmentItem(apt, index, filteredAppointments, filteredTasks, includeIndex, includeMetadata, receivedAt, callerDetails),
			);

			const responseMessage = (additionalFields.responseMessage as string) || DEFAULT_RESPONSE_MESSAGE;
			const rawCode = (additionalFields.responseCode as number) ?? HTTP_STATUS_CODE_MIN;
			const responseCode = rawCode >= HTTP_STATUS_CODE_MIN && rawCode <= HTTP_STATUS_CODE_MAX ? rawCode : HTTP_STATUS_CODE_MIN;

			return {
				webhookResponse: {
					status: responseCode,
					body: {
						success: true,
						message: responseMessage,
						schemaVersion: CLOUDPBX_SCHEMA_VERSION,
						tasksProcessed: filteredTasks.length,
						appointmentsProcessed: filteredAppointments.length,
						callIdentifier,
						receivedAt,
					},
				},
				// outputs: Success, Rejected, Summary, Tasks, Appointments
				workflowData: [
					returnData.map((item) => ({ json: item })),
					[],
					[{ json: summaryItem }],
					taskItems.map((item) => ({ json: item })),
					appointmentItems.map((item) => ({ json: item })),
				],
			};

		} catch (error) {
			throw new NodeOperationError(this.getNode(), error instanceof Error ? error : new Error(String(error)));
		}
	}
}

module.exports = { VoiceAiNotesWebhook };
