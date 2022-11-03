import { existsSync, mkdirSync } from "fs";
import * as fs from "fs";

export const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const saveFile = (path: string, content: string) => {
    const pathParts = path.split("/");
    pathParts.pop();
    const parent = pathParts.join("/");
    existsSync(parent) || mkdirSync(parent);
    fs.writeFileSync(path, content);
};
