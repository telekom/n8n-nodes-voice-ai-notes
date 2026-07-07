"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudPBXApi = void 0;
class CloudPBXApi {
    constructor() {
        this.name = 'cloudPBXApi';
        this.displayName = 'Voice AI Notes';
        this.icon = 'file:voiceAINotesWebhook.png';
        this.documentationUrl = 'https://cpbx-hilfe.deutschland-lan.de/de/ratgeber-zur-konfiguration/tipps-und-tricks/einstellungshilfen/nutzung-der-cpbx-api?mode=user';
        this.properties = [
            {
                displayName: 'Username',
                name: 'username',
                type: 'string',
                default: '',
                required: true,
                placeholder: 'e.g. user@deutschland-lan.de',
                description: 'Your CloudPBX username (email address)',
            },
            {
                displayName: 'Password',
                name: 'password',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                default: '',
                required: true,
                description: 'Your CloudPBX password',
            },
            {
                displayName: 'Webhook API Key',
                name: 'webhookApiKey',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                default: '',
                required: true,
                placeholder: 'e.g. my-secret-webhook-key',
                description: 'The API key that CloudPBX sends in the X-API-Key header. This value must be configured in the CloudPBX Voice AI webhook settings.',
            },
        ];
        this.authenticate = {
            type: 'generic',
            properties: {
                auth: {
                    username: '={{$credentials.username}}',
                    password: '={{$credentials.password}}',
                },
            },
        };
        this.test = {
            request: {
                method: 'GET',
                url: '=https://client.deutschland-lan.de/com.broadsoft.xsi-actions/v2.0/user/{{$credentials.username}}/profile',
            },
            rules: [
                {
                    type: 'responseCode',
                    properties: {
                        value: 200,
                        message: 'Authentication successful',
                    },
                },
            ],
        };
    }
}
exports.CloudPBXApi = CloudPBXApi;
//# sourceMappingURL=CloudPBXApi.credentials.js.map