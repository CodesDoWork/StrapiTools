import { GenerateTypesOptions, Type, TypeEntry } from "./types";
import { StrapiClient } from "../../StrapiClient";
import {
    Attribute,
    Component,
    ComponentAttribute,
    ContentType,
    DynamicZoneAttribute,
    EnumAttribute,
    RelationAttribute,
} from "../../strapi-types";
import { escapeRegExp, saveFile } from "../../utils";
import { mapPluginName } from "../../strapi-utils";

export const generateTypes = async ({ url, email, password, output }: GenerateTypesOptions) => {
    const client = new StrapiClient(url);
    await client.auth(email, password);

    const componentTypes = await client.getComponents().then(res => res.data.map(makeType));
    const contentTypeTypes = await client.getContentTypes().then(res => res.data.map(makeType));
    const types = [...componentTypes, ...contentTypeTypes].sort((t1, t2) =>
        t1.name.localeCompare(t2.name)
    );

    let content = buildTypesFile(types);
    types.forEach(
        ({ id, name }) =>
            (content = content.replace(
                new RegExp(`(?<=[ (])${escapeRegExp(id)}(?=(?:\\[])?[; )])`, "gm"),
                name
            ))
    );

    saveFile(output, content + "\n");
};

const makeType = (collection: ContentType | Component): Type => {
    const entries: TypeEntry[] = Object.entries(collection.schema.attributes).map(
        ([name, attribute]) => ({
            name,
            type: mapTypeEntryType(attribute),
            isRequired: !!attribute.required,
            isProvided: attribute.default !== undefined,
            isPrivate: attribute.private || false,
        })
    );

    return {
        id: collection.uid,
        name: mapPluginName(collection.plugin) + collection.schema.displayName.replace(/ /g, ""),
        entries,
    };
};

const mapTypeEntryType = (attribute: Attribute): string => {
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

const buildTypesFile = (types: Type[]) =>
    types.map(type => `${makeTypeString(type)}\n\n${makeCreateTypeString(type)}`).join("\n\n");

const makeTypeString = ({ name, entries }: Type) =>
    `export type ${name} = {\n${entries
        .filter(entry => !entry.isPrivate)
        .map(makeTypeEntryString)
        .join("\n")}\n};`;

const makeTypeEntryString = ({ name, type, isRequired }: TypeEntry) =>
    `    ${name}: ${type}${isRequired ? "" : " | null"};`;

const makeCreateTypeString = ({ name, entries }: Type) =>
    `export type Create${name}Form = {\n${entries.map(makeCreateTypeEntryString).join("\n")}\n};`;

const makeCreateTypeEntryString = ({ name, type, isRequired, isProvided }: TypeEntry) =>
    `    ${name}${isRequired && !isProvided ? "" : "?"}: ${type};`;
