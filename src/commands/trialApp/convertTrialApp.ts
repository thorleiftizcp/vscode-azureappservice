/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { MessageItem, window } from 'vscode';
import { DialogResponses, IActionContext } from 'vscode-azureextensionui';
import { ExpiredTrialAppTreeItem } from '../../explorer/ExpiredTrialAppTreeItem';
import { TrialAppTreeItem } from '../../explorer/TrialAppTreeItem';
import { ext } from '../../extensionVariables';
import { ITrialAppMetadata } from '../../ITrialAppMetadata';
import { localize } from '../../localize';
import { deploy } from '../deploy/deploy';

export interface IConvertContext extends IActionContext {
    trialAppMetadata: ITrialAppMetadata;
}

export async function convertTrialApp(context: IActionContext, node?: TrialAppTreeItem): Promise<void> {
    if (!node) {
        node = await ext.tree.showTreeItemPicker<TrialAppTreeItem>([TrialAppTreeItem.contextValue, ExpiredTrialAppTreeItem.contextValue], context);
    }

    const convertContext: IConvertContext = Object.assign({ trialAppMetadata: node.metadata }, context);

    await deploy(convertContext, undefined, undefined, true);

    window.showInformationMessage(localize('trialAppExperience', 'Are you happy with your trial app experience?'), DialogResponses.yes, DialogResponses.no).then((response: MessageItem) => {
        context.telemetry.properties.HappyWithTrialApp = response.title;
    });
}
