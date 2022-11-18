export type GenerateTypesOptions = {
    url: string;
    email: string;
    password: string;
    output: string;
};

export type Type = {
    id: string;
    name: string;
    isToSend: boolean;
    entries: TypeEntry[];
};

export type CollectionType = Type & {
    pluralName: string;
};

export type TypeEntry = {
    name: string;
    type: TypeEntryType;
    isRequired: boolean;
    isOptional: boolean;
    isPrivate: boolean;
};

export type TypeEntryType = {
    types: (TypeEntryType | string)[];
    isArray?: boolean;
};

export type StrapiEnum = {
    name: string;
    values: string[];
};

export type GeneratedType = Type | CollectionType | StrapiEnum;
