import { StrapiEnum, Type } from "./types";
import { Component, ContentType } from "../../strapi-types";

export const isContentType = (collection: ContentType | Component): collection is ContentType =>
    (collection as ContentType).apiID !== undefined;

export const isType = (type: Type | StrapiEnum): type is Type => (type as Type).id !== undefined;
