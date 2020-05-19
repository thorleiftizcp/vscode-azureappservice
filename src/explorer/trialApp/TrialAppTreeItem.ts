/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AttachedAccountRoot, ISiteTreeRoot } from 'vscode-azureappservice';
import { requestUtils } from 'vscode-azureappservice/out/src/utils/requestUtils';
import { AzExtParentTreeItem, AzureTreeItem } from '../../../extension.bundle';
import { ITrialAppMetadata } from '../../ITrialAppMetadata';
import { localize } from '../../localize';
import { TrialAppClient } from '../../TrialAppClient';
import { getIconPath } from '../../utils/pathUtils';
import { AzureAccountTreeItem } from '../AzureAccountTreeItem';
import { SiteTreeItem } from '../SiteTreeItem';
import { TrialAppChecklist } from './TrialAppChecklist';

export class TrialAppTreeItem extends SiteTreeItem {

    public get label(): string {
        return this.metadata.siteName ? this.metadata.siteName : localize('nodeJsTrialApp', 'NodeJS Trial App');
    }

    private get minutesLeft(): number {
        return (this.metadata?.timeLeft / 60);
    }

    public get description(): string {
        return isNaN(this.minutesLeft) ?
            localize('expired', 'Expired') : `${this.minutesLeft.toFixed(0)} ${localize('minutesRemaining', 'min. remaining')}`;
    }
    public static contextValue: string = 'trialApp';
    public contextValue: string = TrialAppTreeItem.contextValue;

    public timeLeft: number = 60;

    public parent: AzExtParentTreeItem;

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

    public async isHttpLogsEnabled(): Promise<boolean> {
        return Promise.resolve(true);
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public async refreshImpl(): Promise<void> {
        this.metadata = await this.getTrialAppMetaData();
    }

    public async loadMoreChildrenImpl(clearCache: boolean): Promise<AzureTreeItem<ISiteTreeRoot>[]> {
        const children: AzureTreeItem<ISiteTreeRoot>[] = await super.loadMoreChildrenImpl(clearCache);
        children.pop(); // remove webjobs tree item
        const checklist: TrialAppChecklist = new TrialAppChecklist(this);
        children.push(checklist);
        return children;
    }

    public isAncestorOfImpl?(_contextValue: string | RegExp): boolean {
        return _contextValue === TrialAppTreeItem.contextValue;
    }

    public compareChildrenImpl(ti1: AzureTreeItem<ISiteTreeRoot>, ti2: AzureTreeItem<ISiteTreeRoot>): number {
        if (ti1 instanceof TrialAppChecklist) {
            return -1;
        }
        return ti1.label.localeCompare(ti2.label);
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
