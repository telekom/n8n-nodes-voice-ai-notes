import {
	IWebhookFunctions,
	IWebhookResponseData,
	INodeType,
	IDataObject,
	NodeOperationError,
} from 'n8n-workflow';

import { nodeDescription } from './nodeDescription';
import { WebhookPayload, CloudPBXApiCredentials } from './types';
import {
	CLOUDPBX_SCHEMA_VERSION,
	OUTPUT_MODES,
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
		// output 0 (Success) empty, output 1 (Rejected) carries the error metadata
		workflowData: [[], [{ json: { _statusCode: statusCode, _error: error, _receivedAt: new Date().toISOString() } }]],
	};
}

export class VoiceAINotesWebhook implements INodeType {
	description = nodeDescription;

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
					// output 0 (Success) carries the data, output 1 (Rejected) empty
				workflowData: [returnData.map((item) => ({ json: item })), []],
			};

		} catch (error) {
			throw new NodeOperationError(this.getNode(), error instanceof Error ? error : new Error(String(error)));
		}
	}
}

module.exports = { VoiceAINotesWebhook };
