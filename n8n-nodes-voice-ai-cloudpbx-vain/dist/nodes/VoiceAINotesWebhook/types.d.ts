import { IDataObject } from 'n8n-workflow';
export interface CallTask {
    title: string;
    assignee?: string;
}
export interface CallAppointment {
    title: string;
    start?: string;
    end?: string;
}
export interface CallAttendee {
    name?: string;
    role?: string;
}
export interface CallParticipants {
    vainCustomerPhoneNumber?: string;
    otherAttendeePhoneNumber?: string;
}
export interface CallTopic {
    title?: string;
    details?: string[];
}
export declare class WebhookPayload {
    readonly schemaVersion: string;
    readonly callIdentifier: string;
    readonly summary: string;
    readonly callParticipants: CallParticipants;
    readonly toDos: CallTask[];
    readonly calendarEntries: CallAppointment[];
    readonly phoneCallAttendees: CallAttendee[];
    readonly topics: CallTopic[];
    readonly callerDetails: string[];
    constructor(data: unknown);
    private static parseCallParticipants;
    private static parseTaskArray;
    private static parseAppointmentArray;
    private static parseAttendeeArray;
    private static parseTopicArray;
    private static parseStringArray;
}
export interface OutputMetadata extends IDataObject {
    receivedAt: string;
    itemType: 'task' | 'appointment' | 'summary';
    schemaVersion: string;
    callerDetails: string[];
    itemNumber?: number;
    totalItems: number;
}
export type OutputMode = 'tasksOnly' | 'tasksAndAppointments' | 'fullSummary' | 'tasksWithContext';
export interface CloudPBXApiCredentials {
    username: string;
    password: string;
    webhookApiKey: string;
}
//# sourceMappingURL=types.d.ts.map