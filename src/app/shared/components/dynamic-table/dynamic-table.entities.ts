export class ColumnSource {
    columnDef: string = '';
    headerName: string = '';
    hideOnSm?: any;
    hideOnXs?: any;
    cell?: any;
    operations?: Operation[];
    toogle?: Toogle;
    defaultSort?: boolean;
    defaultSortDesc?: boolean;
    isTemplate?: boolean;
    isIcon?: boolean;
    isActiveFormat?: boolean;
    contentClass?: string;
    conditionalClass?: any;
    headerClass?: string;
    contentTemplate?: any;
    isHtmlTemplate?: boolean;
    operationVisualization?: 'icons' | 'more' = "icons";
}

export class Operation {
    icon?: string;
    color: string = '';
    iconColor?: (i: any) => string;
    action?: any;
    toolTip?: string;
    badge?: any;
    badgeColor?: string;
    hideOnXs?: any;
    hideCondition?: any;
    isText?: boolean;
    text?: string;
}

export class Toogle {
    value: string = '';
    disabled?: string;
    action: any;
}