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

export class WebhookPayload {
	readonly schemaVersion: string;
	readonly callIdentifier: string;
	readonly summary: string;
	readonly callParticipants: CallParticipants;
	readonly toDos: CallTask[];
	readonly calendarEntries: CallAppointment[];
	readonly phoneCallAttendees: CallAttendee[];
	readonly topics: CallTopic[];
	readonly callerDetails: string[];

	constructor(data: unknown) {
		if (typeof data !== 'object' || data === null) {
			throw new Error('Invalid payload: expected a non-null object');
		}
		const raw = data as Record<string, unknown>;

		this.schemaVersion = typeof raw.schemaVersion === 'string' ? raw.schemaVersion : '';
		this.callIdentifier = typeof raw.callIdentifier === 'string' ? raw.callIdentifier : '';
		this.summary = typeof raw.summary === 'string' ? raw.summary : '';
		this.callParticipants = WebhookPayload.parseCallParticipants(raw.callParticipants);
		this.toDos = WebhookPayload.parseTaskArray(raw.toDos);
		this.calendarEntries = WebhookPayload.parseAppointmentArray(raw.calendarEntries);
		this.phoneCallAttendees = WebhookPayload.parseAttendeeArray(raw.phoneCallAttendees);
		this.topics = WebhookPayload.parseTopicArray(raw.topics);
		this.callerDetails = WebhookPayload.parseStringArray(raw.callerDetails);
	}

	private static parseCallParticipants(val: unknown): CallParticipants {
		if (typeof val !== 'object' || val === null) return {};
		const p = val as Record<string, unknown>;
		return {
			vainCustomerPhoneNumber: typeof p.vainCustomerPhoneNumber === 'string' ? p.vainCustomerPhoneNumber : undefined,
			otherAttendeePhoneNumber: typeof p.otherAttendeePhoneNumber === 'string' ? p.otherAttendeePhoneNumber : undefined,
		};
	}

	private static parseTaskArray(val: unknown): CallTask[] {
		if (!Array.isArray(val)) return [];
		return val.flatMap((item) => {
			if (typeof item !== 'object' || item === null) return [];
			const t = item as Record<string, unknown>;
			if (typeof t.title !== 'string') return [];
			return [{ title: t.title, assignee: typeof t.assignee === 'string' ? t.assignee : undefined }];
		});
	}

	private static parseAppointmentArray(val: unknown): CallAppointment[] {
		if (!Array.isArray(val)) return [];
		return val.flatMap((item) => {
			if (typeof item !== 'object' || item === null) return [];
			const a = item as Record<string, unknown>;
			if (typeof a.title !== 'string') return [];
			return [{
				title: a.title,
				start: typeof a.start === 'string' ? a.start : undefined,
				end: typeof a.end === 'string' ? a.end : undefined,
			}];
		});
	}

	private static parseAttendeeArray(val: unknown): CallAttendee[] {
		if (!Array.isArray(val)) return [];
		return val.flatMap((item) => {
			if (typeof item !== 'object' || item === null) return [];
			const a = item as Record<string, unknown>;
			return [{ name: typeof a.name === 'string' ? a.name : undefined, role: typeof a.role === 'string' ? a.role : undefined }];
		});
	}

	private static parseTopicArray(val: unknown): CallTopic[] {
		if (!Array.isArray(val)) return [];
		return val.flatMap((item) => {
			if (typeof item !== 'object' || item === null) return [];
			const t = item as Record<string, unknown>;
			return [{
				title: typeof t.title === 'string' ? t.title : undefined,
				details: Array.isArray(t.details)
					? t.details.filter((d): d is string => typeof d === 'string')
					: undefined,
			}];
		});
	}

	private static parseStringArray(val: unknown): string[] {
		if (!Array.isArray(val)) return [];
		return val.filter((item): item is string => typeof item === 'string');
	}
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

