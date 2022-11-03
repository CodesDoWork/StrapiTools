import { GenerateTypesOptions, StrapiEnum, Type, TypeEntry } from "./types";
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
import { escapeRegExp, saveFile, toPascalCase } from "../../utils";
import { mapPluginName } from "../../strapi-utils";
import { isStrapiEnum } from "./typeguards";

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

    const userLoginType: Type = {
        id: "custom::UserLogin",
        name: "UserLoginForm",
        entries: [
            {
                name: "identifier",
                type: "string",
                isRequired: true,
                isProvided: false,
                isPrivate: false,
            },
            {
                name: "password",
                type: "string",
                isRequired: true,
                isProvided: false,
                isPrivate: false,
            },
        ],
    };
    content += `\n\n${makeTypeString(userLoginType)}`;

    const strapiEnums = types.reduce(
        (all, type) => [
            ...all,
            ...type.entries
                .filter(entry => isStrapiEnum(entry.type))
                .map(entry => makeEnumString(entry.type as StrapiEnum)),
        ],
        [] as string[]
    );
    content += `\n\n${strapiEnums.join("\n\n")}`;

    saveFile(output, content + "\n");
};

const makeType = (collection: ContentType | Component): Type => {
    const typename =
        mapPluginName(collection.plugin) + collection.schema.displayName.replace(/ /g, "");
    const entries: TypeEntry[] = Object.entries(collection.schema.attributes).map(
        ([name, attribute]) => ({
            name,
            type: mapTypeEntryType(name, attribute, typename),
            isRequired: !!attribute.required,
            isProvided: attribute.default !== undefined,
            isPrivate: attribute.private || false,
        })
    );

    return {
        id: collection.uid,
        name: typename,
        entries,
    };
};

const mapTypeEntryType = (
    name: string,
    attribute: Attribute,
    typename: string
): string | StrapiEnum => {
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
            return { name: typename + toPascalCase(name), values };
        default:
            return attribute.type;
    }
};

const buildTypesFile = (types: Type[]) =>
    types.map(type => `${makeTypeString(type)}\n\n${makeSendTypeString(type)}`).join("\n\n");

const makeTypeString = ({ name, entries }: Type) =>
    `export type ${name} = {\n${entries
        .filter(entry => !entry.isPrivate)
        .map(makeTypeEntryString)
        .join("\n")}\n};`;

const makeTypeEntryString = ({ name, type, isRequired }: TypeEntry) =>
    `    ${name}: ${isStrapiEnum(type) ? type.name : type}${isRequired ? "" : " | null"};`;

const makeSendTypeString = ({ name, entries }: Type) =>
    `export type Send${name}Form = {\n${entries.map(makeSendTypeEntryString).join("\n")}\n};`;

const makeSendTypeEntryString = ({ name, type, isRequired, isProvided }: TypeEntry) =>
    `    ${name}${isRequired && !isProvided ? "" : "?"}: ${
        isStrapiEnum(type)
            ? type.name
            : type.includes("::")
            ? `${type} | number${type.includes("[]") ? "[]" : ""}`
            : type
    };`;

const makeEnumString = ({ name, values }: StrapiEnum) =>
    `export enum ${name} {\n${values
        .map(value => `    ${toPascalCase(value)} = "${value}"`)
        .join(",\n")}\n}`;
