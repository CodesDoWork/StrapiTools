import axios, { AxiosInstance, AxiosResponse } from "axios";

export class StrapiClient {
    private readonly axios: AxiosInstance;

    constructor(private readonly baseURL: string) {
        this.axios = axios.create({
            baseURL,
        });
    }

    auth(email: string, password: string) {
        return this.axios
            .post("/admin/login", { email, password })
            .then((res: AxiosResponse<LoginResponse>) => res.data.data.token)
            .then(token => (this.axios.defaults.headers.Authorization = `Bearer ${token}`));
    }

    getComponents(): Promise<ComponentsResponse> {
        return this.axios.get("/content-type-builder/components").then(res => res.data);
    }

    getContentTypes(): Promise<ContentTypesResponse> {
        return this.axios.get("/content-type-builder/content-types").then(res => res.data);
    }
}

type LoginResponse = {
    data: {
        token: string;
        user: object;
    };
};

type ComponentsResponse = {
    data: Component[];
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

type ContentTypesResponse = {
    data: ContentType[];
};

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
