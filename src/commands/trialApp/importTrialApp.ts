/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { window } from 'vscode';
import { AzExtTreeItem, IActionContext } from 'vscode-azureextensionui';
import { ext } from '../../extensionVariables';
import { localize } from '../../localize';

export async function importTrialApp(context: IActionContext, loginSession?: string): Promise<void> {

    if (loginSession) {
        ext.context.globalState.update('trialApp.loginsession', loginSession);
        ext.context.globalState.update('trialApp.imported', true);

        await ext.azureAccountTreeItem.refresh();
        const children: AzExtTreeItem[] = await ext.azureAccountTreeItem.getCachedChildren(context);
        await ext.treeView.reveal(children[-1], { expand: 2, focus: true, select: true });
    } else {
        window.showErrorMessage(localize('importFailedNoLoginSession', 'Failed to import trial app. No loginSession provided.'));
    }
}
