import axios, { AxiosInstance, AxiosResponse } from "axios";
import { Component, ContentType } from "./strapi-types";

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

    getComponents(): Promise<StrapiResponse<Component[]>> {
        return this.axios.get("/content-type-builder/components").then(getData);
    }

    getContentTypes(): Promise<StrapiResponse<ContentType[]>> {
        return this.axios.get("/content-type-builder/content-types").then(getData);
    }
}

const getData = <T>(res: AxiosResponse<T>): T => res.data;

type StrapiResponse<T> = {
    data: T;
};

type LoginResponse = StrapiResponse<{
    token: string;
    user: object;
}>;
