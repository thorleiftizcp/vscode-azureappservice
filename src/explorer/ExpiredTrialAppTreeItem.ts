/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from '../localize';
import { TrialAppTreeItem } from './TrialAppTreeItem';

export class ExpiredTrialAppTreeItem extends TrialAppTreeItem {

    public static contextValue: string = 'expiredTrialApp';

    public get description(): string { return localize('expired', 'Expired'); }

    public readonly contextValue: string = ExpiredTrialAppTreeItem.contextValue;
}
