/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ProgressLocation, window } from 'vscode';
import { AzExtTreeItem, AzureAccountTreeItemBase, GenericTreeItem, IActionContext, ISubscriptionContext } from 'vscode-azureextensionui';
import { TrialApp } from '../constants';
import { ext } from '../extensionVariables';
import { localize } from '../localize';
import { TrialAppClient } from '../TrialAppClient';
import { getIconPath } from '../utils/pathUtils';
import { SubscriptionTreeItem } from './SubscriptionTreeItem';
import { TrialAppTreeItem } from './TrialAppTreeItem';

export class AzureAccountTreeItem extends AzureAccountTreeItemBase {
    public constructor(testAccount?: {}) {
        super(undefined, testAccount);
    }

    public createSubscriptionTreeItem(root: ISubscriptionContext): SubscriptionTreeItem {
        return new SubscriptionTreeItem(this, root);
    }

    public async loadMoreChildrenImpl(clearCache: boolean, context: IActionContext): Promise<AzExtTreeItem[]> {
        const children: AzExtTreeItem[] = await super.loadMoreChildrenImpl(clearCache, context);

        const hasTrialApp: boolean | undefined = ext.context.globalState.get(TrialApp.hasApp);
        const importedTrialApp: boolean | undefined = ext.context.globalState.get(TrialApp.imported);
        const loginSession: string | undefined = ext.context.globalState.get(TrialApp.loginSession);

        let addCreateTrialAppNode: boolean = !importedTrialApp && !hasTrialApp && children.length > 0 && children[0] instanceof GenericTreeItem;

        if (importedTrialApp && !hasTrialApp) {
            await window.withProgress({ location: ProgressLocation.Notification, cancellable: false }, async p => {

                if (loginSession) {
                    p.report({ message: localize('importingTrialApp', 'Importing trial app...') });
                    try {
                        const trialAppNode: AzExtTreeItem[] = await this.createTreeItemsWithErrorHandling<TrialAppClient>(
                            [await TrialAppClient.createTrialAppClient(loginSession)],
                            'invalidTrialApp',
                            (source: TrialAppClient): TrialAppTreeItem => {
                                return new TrialAppTreeItem(ext.azureAccountTreeItem, source);
                            },
                            (source: TrialAppClient): string | Promise<string | undefined> => source.metadata?.siteName
                        );

                        children.push(trialAppNode[0]);
                        ext.treeView.reveal(trialAppNode[0], { expand: 2, select: true, focus: true });
                        ext.context.globalState.update(TrialApp.hasApp, true);
                    } catch (error) {
                        window.showErrorMessage(localize('trialAppCouldNotBeImportedExpired', 'App could not be imported. Trial app has expired.'));
                        addCreateTrialAppNode = true;
                        ext.context.globalState.update(TrialApp.hasApp, false);
                    }
                }

            });
            ext.context.globalState.update(TrialApp.imported, false);
        } else {
            if (ext.context.globalState.get(TrialApp.hasApp) === true) {
                if (loginSession) {
                    const trialAppNode = new TrialAppTreeItem(this, await TrialAppClient.createTrialAppClient(loginSession));
                    children.push(trialAppNode);
                }
            }
        }

        if (addCreateTrialAppNode) {
            const ti: GenericTreeItem = new GenericTreeItem(this, {
                label: localize('createNewTrialApp', 'Create free NodeJS Trial App...'),
                commandId: 'appService.CreateTrialApp',
                contextValue: 'createTrialApp',
                iconPath: getIconPath('CreateNewProject'),
                includeInTreeItemPicker: true
            });

            ti.commandArgs = [];
            children.push(ti);
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
