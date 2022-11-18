import { CollectionType, GeneratedType, Type, TypeEntry, TypeEntryType } from "../types";
import { StrapiClient } from "../../../StrapiClient";
import { Attribute, Component, ContentType, EnumAttribute } from "../../../strapi-types";
import { mapPluginName } from "../../../strapi-utils";
import { saveFile, toPascalCase } from "../../../utils";
import { isContentType } from "../typeguards";

export abstract class TypeGenerator {
    private readonly client: StrapiClient;

    protected constructor(private readonly url: string) {
        this.client = new StrapiClient(url);
    }

    auth(email: string, password: string) {
        return this.client.auth(email, password);
    }

    private async getTypes(): Promise<GeneratedType[]> {
        const componentTypes = await this.client
            .getComponents()
            .then(res =>
                res.data.reduce(
                    (all, component) => [...all, ...this.makeTypes(component)],
                    [] as GeneratedType[]
                )
            );
        const contentTypeTypes = await this.client
            .getContentTypes()
            .then(res =>
                res.data.reduce(
                    (all, contentType) => [
                        ...all,
                        ...this.makeTypes(contentType),
                        ...this.makeTypes(contentType, true),
                    ],
                    [] as GeneratedType[]
                )
            );

        const types = [
            ...componentTypes,
            ...contentTypeTypes,
            this.makeStrapiTypesType(contentTypeTypes),
        ];

        return types.sort((t1, t2) => t1.name.localeCompare(t2.name));
    }

    private makeStrapiTypesType(contentTypeTypes: GeneratedType[]): Type {
        const strapiTypesRegex = /^(api::.+|plugin::(users-permissions\.user|upload\.file))$/;
        const strapiTypesTypes = contentTypeTypes.filter(
            type => "pluralName" in type && strapiTypesRegex.test(type.id)
        ) as CollectionType[];

        const indent = " ".repeat(4);
        const greatIndent = indent.repeat(2);
        const makeGetSendTypeString = (typeId: string) =>
            `{\n${greatIndent}get: ${typeId};\n${greatIndent}send: send::${typeId};\n${indent}}`;

        return {
            id: "result::strapiTypes",
            name: "StrapiTypes",
            isToSend: false,
            entries: strapiTypesTypes.map(({ pluralName, id }) => ({
                name: pluralName,
                type: { types: [makeGetSendTypeString(id)] },
                isPrivate: false,
                isOptional: false,
                isRequired: true,
            })),
        };
    }

    async generateTypes(output: string) {
        await this.getTypes()
            .then(this.stringifyTypes)
            .then(this.joinTypeStrings)
            .then(content => this.saveFile(output, content));
    }

    private readonly makeTypes = (
        collection: ContentType | Component,
        isToSend = false
    ): GeneratedType[] => {
        const typename = this.getTypeName(collection, isToSend);
        let pluralName: string | undefined;

        const entries: TypeEntry[] = Object.entries(collection.schema.attributes).map(
            ([name, attribute]) => ({
                name,
                type: this.mapTypeEntryType(name, attribute, collection, isToSend),
                isRequired: !!attribute.required,
                isOptional: isToSend && (!attribute.required || attribute.default !== undefined),
                isPrivate: attribute.private || false,
            })
        );

        if (isContentType(collection)) {
            const prefix = mapPluginName(collection.plugin);
            pluralName = prefix
                ? `${prefix.toLowerCase()}-${collection.schema.pluralName}`
                : collection.schema.pluralName;
            if (pluralName.includes("-")) {
                pluralName = `"${pluralName}"`;
            }

            entries.push({
                name: "id",
                type: { types: ["number"] },
                isRequired: !isToSend,
                isOptional: isToSend,
                isPrivate: false,
            });

            if (!isToSend) {
                entries.push(
                    {
                        name: "createdAt",
                        type: { types: ["string"] },
                        isRequired: true,
                        isOptional: false,
                        isPrivate: false,
                    },
                    {
                        name: "updatedAt",
                        type: { types: ["string"] },
                        isRequired: true,
                        isOptional: false,
                        isPrivate: false,
                    }
                );
            }
        }

        const enums = isToSend
            ? []
            : Object.entries(collection.schema.attributes)
                  .filter(([, attribute]) => attribute.type === "enumeration")
                  .map(([name, attribute]) => {
                      const { enum: values } = attribute as EnumAttribute;
                      return { name: this.getEnumName(name, collection), values };
                  });

        return [
            {
                id: (isToSend ? "send::" : "") + collection.uid,
                name: typename,
                pluralName,
                isToSend,
                entries,
            },
            ...enums,
        ];
    };

    protected abstract mapTypeEntryType: (
        name: string,
        attribute: Attribute,
        collection: Component | ContentType,
        isToSend: boolean
    ) => TypeEntryType;

    protected getEnumName(attributeName: string, collection: Component | ContentType): string {
        return this.getTypeName(collection, false) + toPascalCase(attributeName);
    }

    protected getTypeName(collection: Component | ContentType, isToSend: boolean): string {
        let typename =
            mapPluginName(collection.plugin) + collection.schema.displayName.replace(/ /g, "");
        if (isToSend) {
            typename = `Send${typename}Form`;
        }

        return typename;
    }

    protected abstract stringifyTypes: (types: GeneratedType[]) => string[];

    protected joinTypeStrings = (typeStrings: string[]) => typeStrings.join("\n\n");

    protected saveFile = (output: string, content: string) => {
        saveFile(output, content + "\n");
    };
}
