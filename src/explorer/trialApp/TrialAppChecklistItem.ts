/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ThemeIcon } from 'vscode';
import { ISiteTreeRoot } from 'vscode-azureappservice';
import { ext } from 'vscode-azureappservice/out/src/extensionVariables';
import { AzExtParentTreeItem, AzureTreeItem, IActionContext } from 'vscode-azureextensionui';
import { TrialAppState } from '../../constants';
import { ITrialAppState } from '../../TrialAppClient';
import { TrialAppTreeItem } from './TrialAppTreeItem';

export class TrialAppChecklistItem extends AzureTreeItem<ISiteTreeRoot> {

    public static contextValue: string = 'checklistItem';
    public label: string;
    public contextValue: string;

    public temporaryDescription: string | undefined;

    public commandId: string = 'appService.ChecklistAction';

    public action: (context: IActionContext, node: TrialAppTreeItem | undefined) => Promise<void>;

    public constructor(parent: AzExtParentTreeItem, label: string, action: (context: IActionContext, node: TrialAppTreeItem | undefined) => Promise<void>, temporaryDescrption?: string) {
        super(parent);

        this.label = label;
        this.action = action;
        this.temporaryDescription = temporaryDescrption;
        this.iconPath = new ThemeIcon('dash');

        const state: ITrialAppState | undefined = ext.context.globalState.get(TrialAppState);
        if (state) {
            if (state.checklist[this.label]) {
                this.iconPath = new ThemeIcon('check');
            }
        }
    }
}
