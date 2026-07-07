"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookPayload = void 0;
class WebhookPayload {
    constructor(data) {
        if (typeof data !== 'object' || data === null) {
            throw new Error('Invalid payload: expected a non-null object');
        }
        const raw = data;
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
    static parseCallParticipants(val) {
        if (typeof val !== 'object' || val === null)
            return {};
        const p = val;
        return {
            vainCustomerPhoneNumber: typeof p.vainCustomerPhoneNumber === 'string' ? p.vainCustomerPhoneNumber : undefined,
            otherAttendeePhoneNumber: typeof p.otherAttendeePhoneNumber === 'string' ? p.otherAttendeePhoneNumber : undefined,
        };
    }
    static parseTaskArray(val) {
        if (!Array.isArray(val))
            return [];
        return val.flatMap((item) => {
            if (typeof item !== 'object' || item === null)
                return [];
            const t = item;
            if (typeof t.title !== 'string')
                return [];
            return [{ title: t.title, assignee: typeof t.assignee === 'string' ? t.assignee : undefined }];
        });
    }
    static parseAppointmentArray(val) {
        if (!Array.isArray(val))
            return [];
        return val.flatMap((item) => {
            if (typeof item !== 'object' || item === null)
                return [];
            const a = item;
            if (typeof a.title !== 'string')
                return [];
            return [{
                    title: a.title,
                    start: typeof a.start === 'string' ? a.start : undefined,
                    end: typeof a.end === 'string' ? a.end : undefined,
                }];
        });
    }
    static parseAttendeeArray(val) {
        if (!Array.isArray(val))
            return [];
        return val.flatMap((item) => {
            if (typeof item !== 'object' || item === null)
                return [];
            const a = item;
            return [{ name: typeof a.name === 'string' ? a.name : undefined, role: typeof a.role === 'string' ? a.role : undefined }];
        });
    }
    static parseTopicArray(val) {
        if (!Array.isArray(val))
            return [];
        return val.flatMap((item) => {
            if (typeof item !== 'object' || item === null)
                return [];
            const t = item;
            return [{
                    title: typeof t.title === 'string' ? t.title : undefined,
                    details: Array.isArray(t.details)
                        ? t.details.filter((d) => typeof d === 'string')
                        : undefined,
                }];
        });
    }
    static parseStringArray(val) {
        if (!Array.isArray(val))
            return [];
        return val.filter((item) => typeof item === 'string');
    }
}
exports.WebhookPayload = WebhookPayload;
//# sourceMappingURL=types.js.map