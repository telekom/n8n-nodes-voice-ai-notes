import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class CloudPBXApi implements ICredentialType {
	name = 'cloudPBXApi';
	displayName = 'Voice AI Notes';
	icon = 'file:voiceAINotesWebhook.png' as const;
	documentationUrl = 'https://cpbx-hilfe.deutschland-lan.de/de/ratgeber-zur-konfiguration/tipps-und-tricks/einstellungshilfen/nutzung-der-cpbx-api?mode=user';

	properties: INodeProperties[] = [
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

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			auth: {
				username: '={{$credentials.username}}',
				password: '={{$credentials.password}}',
			},
		},
	};

	test: ICredentialTestRequest = {
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
