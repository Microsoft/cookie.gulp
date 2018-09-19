//-----------------------------------------------------------------------------
// Copyright (c) 2018 Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const tslint = require("tslint");
const gtslint = require("gulp-tslint");
const fs = require("fs");

const { chain } = require("../steams-utils");

/**
 * 
 * @param {IMsiProcessorConfig} config 
 * @param {IBuildTaget} buildTarget 
 * @param {IBuildInfos} buildInfos 
 * @param {IPackageConfig} packageJson 
 * @returns {NodeJS.ReadWriteStream}
 */
function constructProcessor(config, buildTarget, buildInfos, packageJson) {
    return chain(
        fs.existsSync("./tsconfig.json") ? gtslint.default({ program: tslint.Linter.createProgram("./tsconfig.json") }) : gtslint.default(), 
        gtslint.default.report({ summarizeFailureOutput: true }));
};
module.exports = constructProcessor;
