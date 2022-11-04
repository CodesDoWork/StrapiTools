import { StrapiEnum, Type } from "./types";

export const isStrapiEnum = (type: string | StrapiEnum): type is StrapiEnum =>
    (type as StrapiEnum).name !== undefined;

export const isType = (type: Type | StrapiEnum): type is Type => (type as Type).id !== undefined;
