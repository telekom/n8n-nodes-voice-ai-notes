"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MobilfunkApi = void 0;
class MobilfunkApi {
    constructor() {
        this.name = 'mobilfunkApi';
        this.displayName = 'Mobilfunk API';
        this.icon = 'file:voiceAINotesWebhook.png';
        this.properties = [
            {
                displayName: 'Mobilfunknummer',
                name: 'mobilfunknummer',
                type: 'string',
                default: '',
                required: true,
                placeholder: 'e.g. 4917612345678 (no + or 00)',
                description: 'Your mobile number in E.164 format without leading + or 00 (e.g. 4917612345678). Incoming webhook requests are verified against this number.',
            },
            {
                displayName: 'Webhook Secret',
                name: 'webhookSecret',
                type: 'string',
                typeOptions: { password: true },
                default: '',
                placeholder: 'Optional additional secret',
                description: 'Optional: extra protection. If set, the sending service must include this value as the X-Webhook-Secret header.',
            },
        ];
        this.test = {
            request: {
                method: 'GET',
                url: 'https://api.nexmo.com/',
                ignoreHttpStatusErrors: true,
            },
        };
    }
}
exports.MobilfunkApi = MobilfunkApi;
//# sourceMappingURL=MobilfunkApi.credentials.js.map