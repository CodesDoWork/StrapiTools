import { GeneratedType, Type, TypeEntry, TypeEntryType } from "../types";
import { StrapiClient } from "../../../StrapiClient";
import { Attribute, Component, ContentType, EnumAttribute } from "../../../strapi-types";
import { mapPluginName } from "../../../strapi-utils";
import { saveFile, toPascalCase } from "../../../utils";

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

        const userLoginType: Type = {
            id: "custom::UserLogin",
            name: "UserLoginForm",
            isToSend: true,
            entries: [
                {
                    name: "identifier",
                    type: { types: ["string"] },
                    isRequired: true,
                    isOptional: false,
                    isPrivate: false,
                },
                {
                    name: "password",
                    type: { types: ["string"] },
                    isRequired: true,
                    isOptional: false,
                    isPrivate: false,
                },
            ],
        };

        const types = [...componentTypes, ...contentTypeTypes, userLoginType];

        return types.sort((t1, t2) => t1.name.localeCompare(t2.name));
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

        const entries: TypeEntry[] = Object.entries(collection.schema.attributes).map(
            ([name, attribute]) => ({
                name,
                type: this.mapTypeEntryType(name, attribute, collection, isToSend),
                isRequired: !!attribute.required,
                isOptional: isToSend && (!attribute.required || attribute.default !== undefined),
                isPrivate: attribute.private || false,
            })
        );

        entries.push({
            name: "id",
            type: { types: ["number"] },
            isRequired: !isToSend,
            isOptional: isToSend,
            isPrivate: false,
        });

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
