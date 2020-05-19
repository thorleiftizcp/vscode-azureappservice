/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext } from 'vscode-azureextensionui';
import { TrialAppState } from '../../constants';
import { TrialAppChecklistItem } from '../../explorer/trialApp/TrialAppChecklistItem';
import { TrialAppTreeItem } from '../../explorer/trialApp/TrialAppTreeItem';
import { ext } from '../../extensionVariables';
import { ITrialAppState } from '../../TrialAppClient';

export async function checklistItemAction(_context: IActionContext, node?: TrialAppChecklistItem): Promise<void> {
    if (node) {
        await node.runWithTemporaryDescription(node.temporaryDescription ?? 'Loading...', async () => {
            await node.action(_context, <TrialAppTreeItem>node.parent?.parent);
        });

        const state: ITrialAppState | undefined = ext.context.globalState.get(TrialAppState);
        if (state) {
            state.checklist[node.label] = true;
            ext.context.globalState.update(TrialAppState, state);
        }
        await ext.tree.refresh();
    }
}
