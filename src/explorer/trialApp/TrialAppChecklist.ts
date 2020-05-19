/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { commands, ThemeIcon } from 'vscode';
import { ISiteTreeRoot } from 'vscode-azureappservice';
import { AzExtTreeItem, AzureParentTreeItem, AzureTreeItem, IActionContext } from 'vscode-azureextensionui';
import { browseWebsite } from '../../commands/browseWebsite';
import { cloneTrialApp } from '../../commands/trialApp/cloneTrialApp';
import { convertTrialApp } from '../../commands/trialApp/convertTrialApp';
import { TrialAppChecklistItem } from './TrialAppChecklistItem';
import { TrialAppTreeItem } from './TrialAppTreeItem';

export class TrialAppChecklist extends AzureParentTreeItem<ISiteTreeRoot> {
    public label: string = 'Trial App First Steps';
    public contextValue: string = 'trialAppChecklist';
    public checklistItems: TrialAppChecklistItem[];
    public iconPath: ThemeIcon = new ThemeIcon('checklist');

    public async loadMoreChildrenImpl(_clearCache: boolean): Promise<AzureTreeItem<ISiteTreeRoot>[]> {
        const children: TrialAppChecklistItem[] = [];

        children.push(new TrialAppChecklistItem(
            this,
            'Clone source',
            async (context: IActionContext, node: TrialAppTreeItem | undefined): Promise<void> => {
                await cloneTrialApp(context, node);
            },
            'Cloning...'));

        children.push(new TrialAppChecklistItem(
            this, 'Make changes',
            async (_context: IActionContext, _node: TrialAppTreeItem | undefined): Promise<void> => {
                return await commands.executeCommand('workbench.view.explorer');
            }));

        children.push(new TrialAppChecklistItem(
            this,
            'Commit changes',
            async (_context: IActionContext, _node: TrialAppTreeItem | undefined): Promise<void> => {
                await commands.executeCommand('git.commit');
            }));

        children.push(new TrialAppChecklistItem(
            this, 'Push changes to deploy',
            async (_context: IActionContext, _node: TrialAppTreeItem | undefined): Promise<void> => {
                await commands.executeCommand('git.push');
            },
            'Pushing...'));

        children.push(new TrialAppChecklistItem(
            this,
            'Browse updated website',
            async (context: IActionContext, node: TrialAppTreeItem | undefined): Promise<void> => {
                await browseWebsite(context, node);
            }));

        children.push(new TrialAppChecklistItem(
            this,
            'Transfer app to subscription',
            async (context: IActionContext, node: TrialAppTreeItem | undefined): Promise<void> => {
                await convertTrialApp(context, node);
            },
            'Transferring to Azure subccription...'
        ));

        return children;
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public compareChildrenImpl(_item1: AzExtTreeItem, _item2: AzExtTreeItem): number {
        return 1; // custom order of checklist items
    }
}
