export type GenerateTypesOptions = {
    url: string;
    email: string;
    password: string;
    output: string;
};

export type Type = {
    id: string;
    name: string;
    entries: TypeEntry[];
};

export type TypeEntry = {
    name: string;
    type: string | StrapiEnum;
    isRequired: boolean;
    isProvided: boolean;
    isPrivate: boolean;
};

export type StrapiEnum = {
    name: string;
    values: string[];
};
