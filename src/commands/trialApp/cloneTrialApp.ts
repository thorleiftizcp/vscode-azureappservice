/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { commands } from 'vscode';
import { IActionContext } from 'vscode-azureextensionui';
import { TrialAppState } from '../../constants';
import { TrialAppTreeItem } from '../../explorer/trialApp/TrialAppTreeItem';
import { ext } from '../../extensionVariables';
import { ITrialAppState } from '../../TrialAppClient';

export async function cloneTrialApp(context: IActionContext, node?: TrialAppTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<TrialAppTreeItem>(TrialAppTreeItem.contextValue, context);
    }
    await commands.executeCommand('git.clone', node.root.client.gitUrl);

    const state: ITrialAppState | undefined = ext.context.globalState.get(TrialAppState);
    if (state) {
        state.checklist[0] = true;
        ext.context.globalState.update(TrialAppState, state);
    }
    await ext.tree.refresh();
}
