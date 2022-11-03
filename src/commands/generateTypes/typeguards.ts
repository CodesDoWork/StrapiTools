import { StrapiEnum } from "./types";

export const isStrapiEnum = (type: string | StrapiEnum): type is StrapiEnum =>
    (type as StrapiEnum).name !== undefined;
