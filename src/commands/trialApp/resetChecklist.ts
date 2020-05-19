/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext } from 'vscode-azureextensionui';
import { TrialAppState } from '../../constants';
import { TrialAppChecklistItem } from '../../explorer/trialApp/TrialAppChecklistItem';
import { ext } from '../../extensionVariables';
import { ITrialAppState } from '../../TrialAppClient';

export async function resetChecklist(_context: IActionContext, node?: TrialAppChecklistItem): Promise<void> {
    if (node) {
        const state: ITrialAppState | undefined = ext.context.globalState.get(TrialAppState);
        if (state) {
            state.checklist = {};
            ext.context.globalState.update(TrialAppState, state);
        }
        await ext.tree.refresh();
    }
}
