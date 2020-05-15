/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AttachedAccountRoot, ISiteTreeRoot } from 'vscode-azureappservice';
import { requestUtils } from 'vscode-azureappservice/out/src/utils/requestUtils';
import { AzExtParentTreeItem, AzureTreeItem } from '../../extension.bundle';
import { ITrialAppMetadata } from '../ITrialAppMetadata';
import { localize } from '../localize';
import { TrialAppClient } from '../TrialAppClient';
import { getIconPath } from '../utils/pathUtils';
import { AzureAccountTreeItem } from './AzureAccountTreeItem';
import { SiteTreeItem } from './SiteTreeItem';

export class TrialAppTreeItem extends SiteTreeItem {
    public static contextValue: string = 'trialApp';
    public readonly contextValue: string = TrialAppTreeItem.contextValue;

    public get label(): string {
        return this.metadata.siteName ? this.metadata.siteName : localize('nodeJsTrialApp', 'NodeJS Trial App');
    }

    private get minutesLeft(): number {
        return this.metadata?.timeLeft / 60;
    }

    public get description(): string {
        return `${this.minutesLeft.toFixed(0)} ${localize('minutesRemaining', 'min. remaining')}`;
    }

    public timeLeft: number = 60;
    public parent: AzExtParentTreeItem;
    public childTypeLabel: string = 'trialApp';
    public id: string;

    public readonly iconPath: string = getIconPath('WebApp');

    public isReadOnly: boolean;

    public metadata: ITrialAppMetadata;

    public client: TrialAppClient;

    constructor(parent: AzureAccountTreeItem, client: TrialAppClient) {
        super(new AttachedAccountRoot(), client);
        this.client = client;
        this.metadata = client.metadata;
        this.parent = parent;
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public async refreshImpl(): Promise<void> {
        this.metadata = await this.getTrialAppMetaData();
    }

    public async loadMoreChildrenImpl(clearCache: boolean): Promise<AzureTreeItem<ISiteTreeRoot>[]> {
        const children: AzureTreeItem<ISiteTreeRoot>[] = await super.loadMoreChildrenImpl(clearCache);
        children.pop(); // rmove webjobs tree item
        return children;
    }

    public isAncestorOfImpl?(_contextValue: string | RegExp): boolean {
        return _contextValue === TrialAppTreeItem.contextValue;
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
