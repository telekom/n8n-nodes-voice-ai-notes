import { IAuthenticateGeneric, ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';
export declare class CloudPBXApi implements ICredentialType {
    name: string;
    displayName: string;
    icon: "file:voiceAINotesWebhook.png";
    documentationUrl: string;
    properties: INodeProperties[];
    authenticate: IAuthenticateGeneric;
    test: ICredentialTestRequest;
}
//# sourceMappingURL=CloudPBXApi.credentials.d.ts.map