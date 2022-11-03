export type ContentType = {
    uid: string;
    plugin?: string;
    apiID: string;
    schema: {
        displayName: string;
        singularName: string;
        pluralName: string;
        description: string;
        draftAndPublic: boolean;
        pluginOptions: {
            "content-manager": {
                visible: boolean;
            };
            "content-type-builder": {
                visible: boolean;
            };
        };
        kind: string;
        collectionName: string;
        attributes: Record<string, Attribute>;
    };
};

export type Component = {
    uid: string;
    plugin: undefined;
    category: string;
    apiId: string;
    schema: {
        icon: string;
        displayName: string;
        description: string;
        collectionName: string;
        attributes: Record<string, Attribute>;
    };
};

export type Attribute = Record<string, unknown> & {
    type: string;
    required?: boolean;
    default?: unknown;
    private?: boolean;
};

export type ComponentAttribute = Attribute & {
    type: "component";
    repeatable: boolean;
    component: string;
};

export type DynamicZoneAttribute = Attribute & {
    type: "dynamiczone";
    components: string[];
};

export type RelationAttribute = Attribute & {
    type: "relation";
    relation: string;
    target: string;
};

export type EnumAttribute = Attribute & {
    type: "enumeration";
    enum: string[];
};
