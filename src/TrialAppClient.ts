/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
    AppServicePlan, FunctionEnvelope, FunctionEnvelopeCollection, FunctionSecrets, SiteConfigResource, SiteLogsConfig, SiteSourceControl, SlotConfigNamesResource, SourceControlCollection,
    StringDictionary, User, WebAppInstanceCollection, WebJobCollection
} from 'azure-arm-website/lib/models';
import { BasicAuthenticationCredentials, ServiceClientCredentials } from 'ms-rest';
import * as request from 'request';
import { IFunctionKeys, IHostKeys, ISiteClient } from 'vscode-azureappservice';
import { addExtensionUserAgent } from 'vscode-azureextensionui';
import { KuduClient } from 'vscode-azurekudu';
import { ITrialAppMetadata } from './ITrialAppMetadata';
import { localize } from './localize';
import { requestUtils } from './utils/requestUtils';

export class TrialAppClient implements ISiteClient {
    public get fullName(): string {
        return this.metadata.hostName;
    }

    public get kuduHostName(): string {
        return this.metadata.scmHostName;
    }

    public get defaultHostUrl(): string {
        return `https://${this.metadata.hostName}`;
    }

    public get kuduUrl(): string | undefined {
        if (this.metadata?.scmHostName) {
            return `https://${this.metadata.scmHostName}`;
        } else {
            return undefined;
        }
    }

    public get siteName(): string {
        return this.metadata?.siteName;
    }
    public get id(): string {
        return this.metadata?.siteGuid;
    }

    public get defaultHostName(): string {
        return this.metadata?.hostName;
    }
    public get gitUrl(): string | undefined {
        return this.metadata?.gitUrl;
    }

    public get expired(): boolean {
        return (isNaN(this.metadata.timeLeft));
    }

    /**
     * Metadata provided by the TryAppService API
     */
    public metadata: ITrialAppMetadata;

    public isLinux: boolean = true;

    public credentials: ServiceClientCredentials;

    public isSlot: boolean = false;

    public slotName?: string | undefined;

    public resourceGroup: string;

    public location: string;

    public serverFarmId: string;

    public kind: string;

    public initialState?: string | undefined;

    public isFunctionApp: boolean = false;

    public planResourceGroup: string;

    public planName: string;

    private constructor(metadata: ITrialAppMetadata) {
        this.metadata = metadata;
        this.credentials = new BasicAuthenticationCredentials(metadata.publishingUserName, metadata.publishingPassword);
    }

    public static async createTrialAppClient(loginSession: string): Promise<TrialAppClient> {
        const metadata: ITrialAppMetadata = await this.getTrialAppMetaData(loginSession);
        if (metadata.siteName) {
            return new TrialAppClient(metadata);
        } else {
            return Promise.reject('Could not get trial app metadata');
        }
    }

    public static async getTrialAppMetaData(loginsession: string): Promise<ITrialAppMetadata> {
        const metadataRequest: requestUtils.Request = await requestUtils.getDefaultRequest('https://tryappservice.azure.com/api/vscoderesource', undefined, 'GET');

        metadataRequest.headers = {
            accept: '*/*',
            'accept-language': 'en-US,en;q=0.9',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            cookie: `loginsession=${loginsession}`
        };

        return <ITrialAppMetadata>JSON.parse(await requestUtils.sendRequest(metadataRequest));
    }

    public async refreshMetadata(loginSession?: string): Promise<void> {
        this.metadata = await TrialAppClient.getTrialAppMetaData(loginSession || this.metadata.loginSession);
    }
    public async getIsConsumption(): Promise<boolean> {
        throw new Error('Method not implemented.');
    }
    public async stop(): Promise<void> {
        return;
    }
    public async start(): Promise<void> {
        return;
    }
    public async getState(): Promise<string | undefined> {
        throw new Error('Method not implemented.');
    }
    public async updateConfiguration(_config: SiteConfigResource): Promise<SiteConfigResource> {
        throw new Error('Method not implemented.');
    }
    public async getLogsConfig(): Promise<SiteLogsConfig> {
        return {};
    }
    public async updateLogsConfig(_config: SiteLogsConfig): Promise<SiteLogsConfig> {
        return Promise.resolve(_config);
    }
    public async getAppServicePlan(): Promise<AppServicePlan | undefined> {
        throw new Error('Method not implemented.');
    }
    public async getSourceControl(): Promise<SiteSourceControl> {
        return {
            repoUrl: this.metadata.gitUrl,
            isMercurial: false
        };
    }
    public async updateSourceControl(_siteSourceControl: SiteSourceControl): Promise<SiteSourceControl> {
        throw new Error('Cannot update source control of trial app.');
    }
    public async syncRepository(): Promise<void> {
        throw new Error('Method not implemented.');
    }
    public async listSlotConfigurationNames(): Promise<SlotConfigNamesResource> {
        return {};
    }
    public async updateSlotConfigurationNames(_appSettings: SlotConfigNamesResource): Promise<SlotConfigNamesResource> {
        throw new Error('Method not implemented.');
    }
    public async deleteMethod(_options?: { deleteMetrics?: boolean | undefined; deleteEmptyServerFarm?: boolean | undefined; skipDnsRegistration?: boolean | undefined; customHeaders?: { [headerName: string]: string; } | undefined; } | undefined): Promise<void> {
        throw new Error('Method not implemented.');
    }
    public async listInstanceIdentifiers(): Promise<WebAppInstanceCollection> {
        throw new Error('Method not implemented.');
    }
    public async listSourceControls(): Promise<SourceControlCollection> {
        throw new Error('Method not implemented.');
    }
    public async listFunctions(): Promise<FunctionEnvelopeCollection> {
        throw new Error('Method not implemented.');
    }
    public async listFunctionsNext(_nextPageLink: string): Promise<FunctionEnvelopeCollection> {
        throw new Error('Method not implemented.');
    }
    public async getFunction(_functionName: string): Promise<FunctionEnvelope> {
        throw new Error('Method not implemented.');
    }
    public async deleteFunction(_functionName: string): Promise<void> {
        throw new Error('Method not implemented.');
    }
    public async listFunctionSecrets(_functionName: string): Promise<FunctionSecrets> {
        throw new Error('Method not implemented.');
    }
    public async syncFunctionTriggers(): Promise<void> {
        throw new Error('Method not implemented.');
    }
    public async getPublishingUser(): Promise<User> {
        throw new Error('Method not implemented.');
    }
    public async listWebJobs(): Promise<WebJobCollection> {
        throw new Error('Method not implemented.');
    }
    public async listHostKeys(): Promise<IHostKeys> {
        throw new Error('Method not implemented.');
    }
    public async listFunctionKeys(_functionName: string): Promise<IFunctionKeys> {
        throw new Error('Method not implemented.');
    }

    public async getKuduClient(): Promise<KuduClient> {
        if (!this.metadata.scmHostName) {
            throw new Error(localize('notSupportedLinux', 'This operation is not supported by this app service plan.'));
        }

        const kuduClient: KuduClient = new KuduClient(this.credentials, `https://${this.metadata.scmHostName}`);
        addExtensionUserAgent(kuduClient);
        return kuduClient;
    }

    public async listApplicationSettings(): Promise<StringDictionary> {
        const kuduClient: KuduClient = await this.getKuduClient();
        const settings: StringDictionary = {};
        settings.properties = <{ [name: string]: string }>await kuduClient.settings.getAll();
        return settings;
    }

    public async deleteApplicationSetting(appSettings: StringDictionary, key: string): Promise<StringDictionary> {

        const options: request.Options = {
            method: 'DELETE',
            url: `https://${this.metadata.scmHostName}/api/settings/${key}`,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(appSettings.properties)
        };

        options.auth = { username: this.metadata.publishingUserName, password: this.metadata.publishingPassword };

        request(options, (error: Error, _response: request.Response) => {
            if (error !== undefined) { throw error; }
        });
        return Promise.resolve(appSettings);
    }
    public async getWebAppPublishCredential(): Promise<User> {
        return { publishingUserName: this.metadata.publishingUserName, publishingPassword: this.metadata.publishingPassword };
    }

    public async getSiteConfig(): Promise<SiteConfigResource> {
        return {};
    }
    public async updateApplicationSettings(appSettings: StringDictionary): Promise<StringDictionary> {

        const currentSettings: StringDictionary = await this.listApplicationSettings();

        // To handle renaming app settings, we need to delete the old setting.
        // tslint:disable-next-line:strict-boolean-expressions
        const properties: { [name: string]: string } = currentSettings.properties || {};
        await Promise.all(Object.keys(properties).map(async (key: string) => {
            if (appSettings.properties && appSettings.properties[key] === undefined) {
                await this.deleteApplicationSetting(appSettings, key);
            }
        }));

        const options: request.Options = {
            method: 'POST',
            url: `https://${this.metadata.scmHostName}/api/settings`,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(appSettings.properties)
        };

        options.auth = { username: this.metadata.publishingUserName, password: this.metadata.publishingPassword };

        request(options, (error: Error, _response: request.Response) => {
            if (error !== undefined) { throw error; }
        });

        return Promise.resolve(appSettings);
    }
}
