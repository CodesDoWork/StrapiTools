import { GenerateTypesOptions } from "./types";
import { TsTypeGenerator } from "./generator/TsTypeGenerator";

export const generateTypes = async ({ url, email, password, output }: GenerateTypesOptions) => {
    const generator = new TsTypeGenerator(url);
    await generator.auth(email, password);
    await generator.generateTypes(output);
};
