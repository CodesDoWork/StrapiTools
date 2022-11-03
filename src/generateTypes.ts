import {
    Attribute,
    Component,
    ComponentAttribute,
    ContentType,
    DynamicZoneAttribute,
    EnumAttribute,
    RelationAttribute,
    StrapiClient,
} from "./StrapiClient";
import { escapeRegExp } from "./utils";
import * as fs from "fs";
import { existsSync, mkdirSync } from "fs";

type GenerateTypesOptions = {
    url: string;
    email: string;
    password: string;
    output: string;
};

export const generateTypes = async ({ url, email, password, output }: GenerateTypesOptions) => {
    const client = new StrapiClient(url);
    await client.auth(email, password);

    const mapType = (attribute: Attribute): string => {
        switch (attribute.type) {
            case "datetime":
            case "text":
            case "email":
            case "json":
            case "password":
                return "string";
            case "decimal":
            case "integer":
                return "number";
            case "relation":
                const { relation, target = "unknown" } = attribute as RelationAttribute;
                return target + (relation.endsWith("Many") ? "[]" : "");
            case "media":
                return "plugin::upload.file";
            case "component":
                const { component, repeatable } = attribute as ComponentAttribute;
                return component + (repeatable ? "[]" : "");
            case "dynamiczone":
                const { components } = attribute as DynamicZoneAttribute;
                return `(${components.join(" | ")})[]`;
            case "enumeration":
                const { enum: values } = attribute as EnumAttribute;
                return values.map(value => `"${value}"`).join(" | ");
            default:
                return attribute.type;
        }
    };

    const mapPlugin = (plugin?: string) => {
        switch (plugin) {
            case "users-permissions":
                return "UsersPermissions";
            case "upload":
            case "admin":
                return "Strapi";
            case "i18n":
                return "I18N";
            default:
                return "";
        }
    };

    const makeType = (collection: ContentType | Component): Type => {
        const entries: TypeEntry[] = Object.entries(collection.schema.attributes).map(
            ([name, attribute]) => ({
                name,
                type: mapType(attribute),
                isRequired: !!attribute.required,
                isProvided: attribute.default !== undefined,
                isPrivate: attribute.private || false,
            })
        );

        return {
            id: collection.uid,
            name: mapPlugin(collection.plugin) + collection.schema.displayName.replace(/ /g, ""),
            entries,
        };
    };

    const componentTypes = await client.getComponents().then(res => res.data.map(makeType));
    const contentTypeTypes = await client.getContentTypes().then(res => res.data.map(makeType));
    const types = [...componentTypes, ...contentTypeTypes].sort((t1, t2) =>
        t1.name.localeCompare(t2.name)
    );

    let content = buildTypesFile(types) + "\n";
    types.forEach(
        type =>
            (content = content.replace(
                new RegExp(`(?<=[ (])${escapeRegExp(type.id)}(?=(?:\\[])?[; )])`, "gm"),
                type.name
            ))
    );

    const pathParts = output.split("/");
    pathParts.pop();
    const parent = pathParts.join("/");
    existsSync(parent) || mkdirSync(parent);
    fs.writeFileSync(output, content);
};

const buildTypesFile = (types: Type[]) =>
    types.map(type => makeTypeString(type) + "\n\n" + makeCreateTypeString(type)).join("\n\n");

const makeTypeString = ({ name, entries }: Type) =>
    `export type ${name} = {\n${entries
        .filter(entry => !entry.isPrivate)
        .map(({ name, type, isRequired }) => `    ${name}: ${type}${isRequired ? "" : " | null"};`)
        .join("\n")}\n};`;

const makeCreateTypeString = ({ name, entries }: Type) =>
    `export type Create${name}Form = {\n${entries
        .map(
            ({ name, type, isRequired, isProvided }) =>
                `    ${name}${isRequired && !isProvided ? "" : "?"}: ${type};`
        )
        .join("\n")}\n};`;

type Type = {
    id: string;
    name: string;
    entries: TypeEntry[];
};

type TypeEntry = {
    name: string;
    type: string;
    isRequired: boolean;
    isProvided: boolean;
    isPrivate: boolean;
};
