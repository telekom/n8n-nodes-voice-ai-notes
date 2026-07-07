"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceAINotesWebhook = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const nodeDescription_1 = require("./nodeDescription");
const types_1 = require("./types");
const constants_1 = require("./constants");
const helpers_1 = require("./helpers");
function reject(statusCode, error) {
    return {
        webhookResponse: { status: statusCode, body: { success: false, error } },
        // output 0 (Success) empty, output 1 (Rejected) carries the error metadata
        workflowData: [[], [{ json: { _statusCode: statusCode, _error: error, _receivedAt: new Date().toISOString() } }]],
    };
}
class VoiceAINotesWebhook {
    constructor() {
        this.description = nodeDescription_1.nodeDescription;
    }
    async webhook() {
        var _a, _b, _c;
        const outputMode = this.getNodeParameter('outputMode');
        const additionalFields = this.getNodeParameter('additionalFields', {});
        const includeAppointments = this.getNodeParameter('includeAppointments', true);
        const includeIndex = !!(additionalFields.addIndex);
        const includeMetadata = !!(additionalFields.addMetadata);
        const filterEmpty = !!(additionalFields.filterEmpty);
        const headers = this.getHeaderData();
        const bodyData = this.getBodyData();
        try {
            const credentials = await this.getCredentials('cloudPBXApi');
            const webhookApiKey = (_a = credentials.webhookApiKey) !== null && _a !== void 0 ? _a : '';
            const inboundApiKey = (_b = headers['x-api-key']) !== null && _b !== void 0 ? _b : '';
            if (!webhookApiKey || !(0, helpers_1.safeCompare)(inboundApiKey, webhookApiKey)) {
                return reject(401, 'Unauthorized: invalid API key.');
            }
            const payload = new types_1.WebhookPayload(bodyData);
            if (payload.schemaVersion !== constants_1.CLOUDPBX_SCHEMA_VERSION) {
                return reject(400, `Unsupported schema version: ${payload.schemaVersion}. Expected: ${constants_1.CLOUDPBX_SCHEMA_VERSION}`);
            }
            const { callIdentifier, summary, callParticipants, toDos, calendarEntries, phoneCallAttendees, topics, callerDetails, } = payload;
            const filteredTasks = filterEmpty ? (0, helpers_1.filterByTitle)(toDos) : toDos;
            const filteredAppointments = filterEmpty ? (0, helpers_1.filterByTitle)(calendarEntries) : calendarEntries;
            const returnData = [];
            const receivedAt = new Date().toISOString();
            const context = {
                callIdentifier,
                summary,
                callParticipants,
                phoneCallAttendees,
                topics,
                callerDetails,
            };
            switch (outputMode) {
                case constants_1.OUTPUT_MODES.TASKS_ONLY:
                    filteredTasks.forEach((task, index) => {
                        returnData.push((0, helpers_1.buildTaskItem)(task, index, filteredTasks, includeIndex, includeMetadata, receivedAt, callerDetails));
                    });
                    break;
                case constants_1.OUTPUT_MODES.TASKS_AND_APPOINTMENTS:
                    filteredTasks.forEach((task, index) => {
                        const item = (0, helpers_1.buildTaskItem)(task, index, filteredTasks, includeIndex, includeMetadata, receivedAt, callerDetails);
                        item.type = 'task';
                        if (includeIndex)
                            item.totalAppointments = filteredAppointments.length;
                        returnData.push(item);
                    });
                    if (includeAppointments) {
                        filteredAppointments.forEach((apt, index) => {
                            returnData.push((0, helpers_1.buildAppointmentItem)(apt, index, filteredAppointments, filteredTasks, includeIndex, includeMetadata, receivedAt, callerDetails));
                        });
                    }
                    break;
                case constants_1.OUTPUT_MODES.FULL_SUMMARY: {
                    const fullOutput = {
                        schemaVersion: constants_1.CLOUDPBX_SCHEMA_VERSION,
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
                            schemaVersion: constants_1.CLOUDPBX_SCHEMA_VERSION,
                            totalTasks: filteredTasks.length,
                            totalAppointments: filteredAppointments.length,
                            totalAttendees: phoneCallAttendees.length,
                            totalTopics: topics.length,
                        };
                    }
                    returnData.push(fullOutput);
                    break;
                }
                case constants_1.OUTPUT_MODES.TASKS_WITH_CONTEXT:
                    if (filteredTasks.length === 0) {
                        const outputItem = {
                            _hasTasks: false,
                            context,
                            appointments: includeAppointments ? filteredAppointments : [],
                        };
                        if (includeMetadata) {
                            outputItem._metadata = {
                                receivedAt,
                                itemType: 'summary',
                                schemaVersion: constants_1.CLOUDPBX_SCHEMA_VERSION,
                                callerDetails,
                                totalItems: 0,
                                totalAppointments: filteredAppointments.length,
                            };
                        }
                        returnData.push(outputItem);
                    }
                    else {
                        filteredTasks.forEach((task, index) => {
                            const outputItem = {
                                task: (0, helpers_1.buildTaskItem)(task, index, filteredTasks, includeIndex, false, receivedAt, callerDetails),
                                context,
                                appointments: includeAppointments ? filteredAppointments : [],
                            };
                            if (includeMetadata) {
                                outputItem._metadata = {
                                    receivedAt,
                                    itemType: 'task',
                                    schemaVersion: constants_1.CLOUDPBX_SCHEMA_VERSION,
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
            const responseMessage = additionalFields.responseMessage || constants_1.DEFAULT_RESPONSE_MESSAGE;
            const rawCode = (_c = additionalFields.responseCode) !== null && _c !== void 0 ? _c : constants_1.HTTP_STATUS_CODE_MIN;
            const responseCode = rawCode >= constants_1.HTTP_STATUS_CODE_MIN && rawCode <= constants_1.HTTP_STATUS_CODE_MAX ? rawCode : constants_1.HTTP_STATUS_CODE_MIN;
            return {
                webhookResponse: {
                    status: responseCode,
                    body: {
                        success: true,
                        message: responseMessage,
                        schemaVersion: constants_1.CLOUDPBX_SCHEMA_VERSION,
                        tasksProcessed: filteredTasks.length,
                        appointmentsProcessed: filteredAppointments.length,
                        callIdentifier,
                        receivedAt,
                    },
                },
                // output 0 (Success) carries the data, output 1 (Rejected) empty
                workflowData: [returnData.map((item) => ({ json: item })), []],
            };
        }
        catch (error) {
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), error instanceof Error ? error : new Error(String(error)));
        }
    }
}
exports.VoiceAINotesWebhook = VoiceAINotesWebhook;
module.exports = { VoiceAINotesWebhook };
//# sourceMappingURL=VoiceAINotesWebhook.node.js.map