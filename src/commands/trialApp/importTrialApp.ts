/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { commands, MessageItem, ProgressLocation, window } from 'vscode';
import { AzExtTreeItem, IActionContext } from 'vscode-azureextensionui';
import { TrialAppLoginSession } from '../../constants';
import { TrialAppTreeItem } from '../../explorer/TrialAppTreeItem';
import { ext } from '../../extensionVariables';
import { localize } from '../../localize';
import { TrialAppClient } from '../../TrialAppClient';

export async function importTrialApp(_context: IActionContext, loginSession?: string): Promise<void> {

    if (!loginSession) {
        window.showErrorMessage(localize('importFailedNoLoginSession', 'Failed to import trial app. No loginSession provided.'));
        throw Error('No loginSession provided');
    }

    const hasTrialApp: boolean = ext.context.globalState.get(TrialAppLoginSession) !== undefined;

    let shouldImport: boolean = true;
    let importExpiredApp: boolean = true;

    if (hasTrialApp) { // importing an app will replace the current trial app
        const continueItem: MessageItem = { title: 'Continue' };
        const cancelItem: MessageItem = { title: 'Cancel', isCloseAffordance: true };

        await window.showInformationMessage(localize('replaceExistingTrialApp', 'Importing trial app will replace existing trial app.'), { modal: true }, continueItem, cancelItem).then((value: MessageItem | undefined): void => {
            if (value?.title === cancelItem.title) {
                shouldImport = false;
            }
        });
    }

    if (shouldImport) {
        window.withProgress({ location: ProgressLocation.Notification, cancellable: false }, async p => {
            p.report({ message: localize('importingTrialApp', 'Importing trial app...') });

            const client: TrialAppClient = await TrialAppClient.createTrialAppClient(loginSession);

            if (client.expired) {
                const yesItem: MessageItem = { title: 'Yes' };
                const noItem: MessageItem = { title: 'No', isCloseAffordance: true };

                const message: string = localize('expiredImportContinue', 'Trial app is expired. Do you still want to import?');

                await window.showInformationMessage(message, { modal: true }, yesItem, noItem).then((value: MessageItem | undefined): void => {
                    if (value?.title === noItem.title) {
                        importExpiredApp = false;
                    }
                });
            }

            if (importExpiredApp) {
                await commands.executeCommand('workbench.view.extension.azure');
                ext.azureAccountTreeItem.trialAppClient = client;
                ext.context.globalState.update(TrialAppLoginSession, loginSession);
                await ext.azureAccountTreeItem.refresh();
                const children: AzExtTreeItem[] = await ext.azureAccountTreeItem.getCachedChildren(_context);

                const trialAppTreeItem: TrialAppTreeItem | undefined = <TrialAppTreeItem>children.find((value: AzExtTreeItem) => {
                    return value instanceof TrialAppTreeItem;
                });

                const clone: MessageItem = { title: 'Clone' };
                const no: MessageItem = { title: 'No' };

                if (trialAppTreeItem !== undefined) {
                    await ext.treeView.reveal(children[children.length - 1], { select: false, focus: true, expand: 1 });
                    window.showInformationMessage(localize('cloneTrialApp', 'Succesfully imported trial app. Would you like to clone the source?'), { modal: true }, clone, no).then((value: MessageItem) => {
                        if (value.title === clone.title) {
                            commands.executeCommand('git.clone', client.metadata.gitUrl).then((path: unknown) => {
                                const disableHints: MessageItem = { title: localize('disableHints', 'Disable trial app hints') };
                                const takeMeToScm: MessageItem = { title: localize('takeMeToScm', 'View source control') };
                                window.showInformationMessage(localize('pushToDeploy', 'Commit and push to deploy changes to your app.'), takeMeToScm, disableHints).then((response: MessageItem) => {
                                    if (response.title === takeMeToScm.title) {
                                        commands.executeCommand('workbench.view.scm');
                                    }
                                });
                            });
                        }
                    });
                }
            }
        });
    }
}
