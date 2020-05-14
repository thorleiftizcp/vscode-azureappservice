/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from 'vscode';
import { AttachedAccountRoot } from 'vscode-azureappservice';
import { ext } from 'vscode-azureappservice/out/src/extensionVariables';
import { requestUtils } from 'vscode-azureappservice/out/src/utils/requestUtils';
import { AzExtParentTreeItem } from '../../extension.bundle';
import { ITrialAppMetadata } from '../ITrialAppMetadata';
import { TrialAppClient } from '../TrialAppClient';
import { getIconPath } from '../utils/pathUtils';
import { AzureAccountTreeItem } from './AzureAccountTreeItem';
import { SiteTreeItem } from './SiteTreeItem';

export class TrialAppTreeItem extends SiteTreeItem {

    public get label(): string {
        return this.metadata.siteName ? this.metadata.siteName : 'NodeJS Trial App';
    }

    public get description(): string {
        const minutesLeft: number = this.metadata.timeLeft / 60;
        return (isNaN(minutesLeft)) ? 'Expired' : `${minutesLeft.toFixed(0)} min. remaining`;
    }

    public static get contextValue(): string {
        return 'trialApp';
    }

    public contextValue: string = 'trialApp';
    public timeLeft: number = 60;
    public parent: AzExtParentTreeItem;
    public childTypeLabel: string = 'trialApp';
    public id: string;

    public readonly iconPath: string = getIconPath('WebApp');

    public isReadOnly: boolean;

    public metadata: ITrialAppMetadata;

    public client: TrialAppClient;

    // private readonly _appSettingsNode: AppSettingsTreeItem;
    // private readonly _deploymentsNode: TrialAppDeploymentTreeItem;
    private readonly _disposables: Disposable[] = [];

    constructor(parent: AzureAccountTreeItem, client: TrialAppClient) {
        super(new AttachedAccountRoot(), client);
        this.client = client;
        this.metadata = client.metadata;
        this.parent = parent;
    }

    public dispose(): void {
        // tslint:disable-next-line: no-unsafe-any
        Disposable.from(...this._disposables).dispose();
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public async refreshImpl(): Promise<void> {
        this.metadata = await this.getTrialAppMetaData();
    }

    public isAncestorOfImpl?(_contextValue: string | RegExp): boolean {
        return false;
    }
    public async deleteTreeItemImpl(): Promise<void> {
        ext.outputChannel.appendLine(`Deleting; ${this.label} Trial app...`);

        const create: requestUtils.Request = await requestUtils.getDefaultRequest('https://tryappservice.azure.com/api/resource', this.client.credentials, 'DELETE');

        create.headers = {
            accept: "application/json,*/*",
            "accept-language": "en-US,en;q=0.9",
            "content-type": "application/json",
            "ms-x-user-agent": "VsCodeLinux/",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "cross-site"
        };

        await requestUtils.sendRequest<string>(create);
    }

    public async extendTrialApp(): Promise<void> {
        const request: requestUtils.Request = await requestUtils.getDefaultRequest('https://tryappservice.azure.com/api/resource/extend', this.client.credentials, 'POST');

        request.headers = {
            accept: "*/*",
            "accept-language": "en-US,en;q=0.9",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            cookie: `loginsession = ${this.metadata.loginSession}`
        };

        request.auth = { username: this.metadata.publishingUserName, password: this.metadata.publishingPassword };

        try {

            await requestUtils.sendRequest<string>(request);

        } catch (error) {
            throw error;
        }
    }

    public async getTrialAppMetaData(): Promise<ITrialAppMetadata> {
        const metadataRequest: requestUtils.Request = await requestUtils.getDefaultRequest('https://tryappservice.azure.com/api/vscoderesource', undefined, 'GET');

        metadataRequest.headers = {
            accept: "*/*",
            "accept-language": "en-US,en;q=0.9",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            cookie: `loginsession=${this.metadata.loginSession}`
        };

        try {
            const result: string = await requestUtils.sendRequest<string>(metadataRequest);
            return <ITrialAppMetadata>JSON.parse(result);
        } catch (error) {
            throw error;
        }
    }
}
