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
    type: string;
    isRequired: boolean;
    isProvided: boolean;
    isPrivate: boolean;
};
