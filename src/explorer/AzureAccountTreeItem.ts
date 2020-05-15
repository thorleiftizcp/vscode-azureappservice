/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzExtTreeItem, AzureAccountTreeItemBase, GenericTreeItem, IActionContext, ISubscriptionContext } from 'vscode-azureextensionui';
import { TrialAppLoginSession } from '../constants';
import { ext } from '../extensionVariables';
import { localize } from '../localize';
import { TrialAppClient } from '../TrialAppClient';
import { ExpiredTrialAppTreeItem } from './ExpiredTrialAppTreeItem';
import { SubscriptionTreeItem } from './SubscriptionTreeItem';
import { TrialAppTreeItem } from './TrialAppTreeItem';

export class AzureAccountTreeItem extends AzureAccountTreeItemBase {

    public trialAppClient: TrialAppClient | undefined;

    public constructor(testAccount?: {}) {
        super(undefined, testAccount);
    }

    public createSubscriptionTreeItem(root: ISubscriptionContext): SubscriptionTreeItem {
        return new SubscriptionTreeItem(this, root);
    }

    public async loadMoreChildrenImpl(clearCache: boolean, context: IActionContext): Promise<AzExtTreeItem[]> {
        const children: AzExtTreeItem[] = await super.loadMoreChildrenImpl(clearCache, context);

        const loginSession: string | undefined = ext.context.globalState.get(TrialAppLoginSession);

        if (loginSession) {

            this.trialAppClient = this.trialAppClient ?? await TrialAppClient.createTrialAppClient(loginSession);

            const createTreeItem = async (source: TrialAppClient): Promise<TrialAppTreeItem> => {
                return source.expired ? new ExpiredTrialAppTreeItem(this, source) : new TrialAppTreeItem(this, source);
            };

            const getLabelOnError = (source: TrialAppClient): string | Promise<string | undefined> => {
                return source.metadata?.siteName ?? localize('couldNotGetTrialApp', 'An error occured while fetching trial app.');
            };

            const trialAppNode: AzExtTreeItem[] =
                await this.createTreeItemsWithErrorHandling<TrialAppClient>([this.trialAppClient], ExpiredTrialAppTreeItem.contextValue, createTreeItem, getLabelOnError);

            children.push(trialAppNode[0]);
            ext.context.globalState.update(TrialAppLoginSession, this.trialAppClient.metadata.loginSession);
        }

        return children;
    }

    public compareChildrenImpl(item1: AzExtTreeItem, item2: AzExtTreeItem): number {
        if (item2 instanceof GenericTreeItem) {
            return 1; // trial apps below sign in / create account items
        }
        if (!(item1 instanceof SubscriptionTreeItem) && item2 instanceof SubscriptionTreeItem) {
            return -1; // trial apps on top of subscription items
        }
        return super.compareChildrenImpl(item1, item2);
    }
}
