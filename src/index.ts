#! /usr/bin/env node

import chalk from "chalk";
import figlet from "figlet";
import { program } from "commander";

console.log(chalk.red(figlet.textSync("Strapi", { horizontalLayout: "full" })));

program
    .version(process.env.npm_package_version || "Unknown")
    .description("An example CLI for ordering pizza's")
    .option("-p, --peppers", "Add peppers")
    .option("-P, --pineapple", "Add pineapple")
    .option("-b, --bbq", "Add bbq sauce")
    .option("-c, --cheese <type>", "Add the specified type of cheese [marble]")
    .option("-C, --no-cheese", "You do not want any cheese")
    .parse(process.argv);

if (!process.argv.slice(2).length) {
    program.outputHelp();
}
