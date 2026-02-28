interface BaseOption {
    group?: string;
    label: string;
}

export interface Option extends BaseOption {
    id: string;
}

export interface ActionOption extends Option {
    action: () => void;
    icon?: string;
    type?: "danger" | "default";
}
