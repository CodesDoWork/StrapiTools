#! /usr/bin/env node

import { program } from "commander";
import { generateTypes } from "./generateTypes";

program.name("strapi_tools").description("A CLI for strapi utility functions.").version("0.1.0");

program
    .command("generateTypes")
    .option("-u --url", "Strapi url", "http://localhost:1337")
    .requiredOption("-e --email <email>", "Super Admin email")
    .requiredOption("-p --password <password>", "Super Admin password")
    .option("-o --output <output>", "Output file to save the types in.", "./types/strapi.ts")
    .action(generateTypes);

if (!process.argv.slice(2).length) {
    program.outputHelp();
} else {
    program.parse();
}
