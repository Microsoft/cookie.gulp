//-----------------------------------------------------------------------------
// Copyright (c) 2018 Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
"use strict";

const { Transform } = require("stream");
const path = require("path");
const fs = require("fs");
const ts = require("typescript");
const Vinyl = require("vinyl");

/**
 * 
 * @param {import("typescript").DiagnosticCategory} category 
 * @param {string} message 
 */
function writeMessage(category, message) {
    let logFunc;

    switch (category) {
        case ts.DiagnosticCategory.Error:
            logFunc = console.error;
        case ts.DiagnosticCategory.Warning:
            logFunc = console.warn;
        case ts.DiagnosticCategory.Message:
            logFunc = console.info;

        default:
            logFunc = console.log;
    }

    logFunc(`[${ts.DiagnosticCategory[category]}] ${message}`);
}

/**
 * 
 * @param {import("typescript").Diagnostic} diagnostic 
 * @param {string} basePath 
 */
function logDiagnostic(diagnostic, basePath) {
    if (diagnostic.file) {
        const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
        const fileName = typeof basePath === "string" ? path.relative(basePath, path.resolve(diagnostic.file.fileName)) : "";

        writeMessage(diagnostic.category, `${fileName} (${line + 1},${character + 1}): ${message}`)
    }
    else {
        writeMessage(diagnostic.category, `${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`);
    }
}

/**
 * Create a TypeScript compiling stream.
 * @param {import("typescript").CompilerOptions} options Compiler options.
 * @returns {NodeJS.ReadWriteStream} 
 */
exports.compile = function (options) {
    /** @type {IDictionary.<import("vinyl")>} */
    const files = {};

    return new Transform({
        objectMode: true,
        
        flush(callback) {
            // this is a tsc internal switch.
            // https://github.com/Microsoft/TypeScript/blob/194c2bc2ca806f5f1014113329e33207f683037c/src/compiler/emitter.ts#L81
            options["listEmittedFiles"] = true;

            const program = ts.createProgram(Object.values(files).map((file) => file.path), options);
            const emitResult = program.emit();
            const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
            const basePath = path.resolve(".");

            /** @type {boolean} */
            let hasError = false;

            allDiagnostics.forEach(diagnostic => {
                hasError = hasError || diagnostic.category === ts.DiagnosticCategory.Error;
                logDiagnostic(diagnostic, basePath);
            });

            if (hasError || emitResult.emitSkipped) {
                callback(new Error("Typescript compilation failed."));
                return;
            }

            if (emitResult.emittedFiles && emitResult.emittedFiles.length > 0) {
                emitResult.emittedFiles.forEach((emittedFilePath) => {
                    const emittedFileId = path.relative(options.outDir || ".", emittedFilePath);

                    if (emittedFileId in files) {
                        files[emittedFileId].path = emittedFilePath;

                        this.push(files[emittedFileId]);
                    } else {
                        this.push(new Vinyl({
                            base: options.outDir,
                            path: emittedFilePath,
                            contents: fs.createReadStream(emittedFilePath)
                        }));
                    }
                });
            }

            callback();
        },

        /**
         * @param {import("vinyl")} chunk
         */
        transform(chunk, encoding, callback) {
            files[chunk.relative] = chunk;
            callback();
        }
    });
}
