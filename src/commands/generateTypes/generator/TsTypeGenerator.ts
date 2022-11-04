import { TypeGenerator } from "./TypeGenerator";
import {
    Attribute,
    Component,
    ComponentAttribute,
    ContentType,
    DynamicZoneAttribute,
    RelationAttribute,
} from "../../../strapi-types";
import { GeneratedType, StrapiEnum, Type, TypeEntry, TypeEntryType } from "../types";
import { escapeRegExp, toPascalCase } from "../../../utils";
import { isType } from "../typeguards";

export class TsTypeGenerator extends TypeGenerator {
    constructor(url: string) {
        super(url);
    }

    protected mapTypeEntryType = (
        name: string,
        attribute: Attribute,
        collection: Component | ContentType,
        isToSend: boolean
    ): TypeEntryType => {
        let type: TypeEntryType;
        switch (attribute.type) {
            case "datetime":
            case "text":
            case "email":
            case "json":
            case "password":
                type = { types: ["string"] };
                break;
            case "decimal":
            case "integer":
                type = { types: ["number"] };
                break;
            case "relation":
                const { relation, target = "unknown" } = attribute as RelationAttribute;
                type = {
                    types: [
                        {
                            types: isToSend ? [target, "number"] : [target],
                            isArray: relation.endsWith("Many"),
                        },
                    ],
                };
                break;
            case "media":
                type = { types: ["plugin::upload.file"] };
                break;
            case "component":
                const { component, repeatable } = attribute as ComponentAttribute;
                type = { types: [{ types: [component], isArray: repeatable }] };
                break;
            case "dynamiczone":
                const { components } = attribute as DynamicZoneAttribute;
                type = { types: [{ types: components, isArray: true }] };
                break;
            case "enumeration":
                type = { types: [this.getEnumName(name, collection)] };
                break;
            default:
                type = { types: [attribute.type] };
        }

        if (!isToSend && !attribute.required) {
            type.types.push("null");
        }

        return type;
    };

    protected stringifyTypes = (types: GeneratedType[]): string[] =>
        types.map(type => {
            if (isType(type)) {
                let typeString = makeTypeString(type);
                types
                    .filter(isType)
                    .forEach(
                        ({ id, name }) =>
                            (typeString = typeString.replace(
                                new RegExp(`(?<=[ (])${escapeRegExp(id)}(?=(?:\\[])?[; )])`, "gm"),
                                name
                            ))
                    );

                return typeString;
            } else {
                return makeEnumString(type);
            }
        });
}

const makeTypeString = ({ name, entries, isToSend }: Type) =>
    `export type ${name} = {\n${entries
        .filter(entry => isToSend || !entry.isPrivate)
        .map(makeTypeEntryString)
        .join("\n")}\n};`;

const makeTypeEntryString = ({ name, type, isOptional }: TypeEntry) =>
    `    ${name}${isOptional ? "?" : ""}: ${typeEntryTypeToString(type)};`;

const typeEntryTypeToString = ({ types, isArray }: TypeEntryType): string => {
    const typesString = types
        .map(type => (typeof type === "string" ? type : typeEntryTypeToString(type)))
        .join(" | ");
    if (isArray) {
        return typesString.includes(" | ") ? `(${typesString})[]` : `${typesString}[]`;
    } else {
        return typesString;
    }
};

const makeEnumString = ({ name, values }: StrapiEnum) =>
    `export enum ${name} {\n${values
        .map(value => `    ${toPascalCase(value)} = "${value}"`)
        .join(",\n")}\n}`;
