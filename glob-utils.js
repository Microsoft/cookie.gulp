//-----------------------------------------------------------------------------
// Copyright (c) 2018 Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------
"use strict";

const glob = require("fast-glob");
const path = require("path");
const configs = require("./configs");

const Regex = {
    /** @type {RegExp} */
    PathRef: /^\<([^\<\>]+)\>$/ig,

    /** @type {RegExp} */
    GlobLike: /[\^\*\!\+\?\@\|]+/ig
};
exports.Regex = Regex;

/**
 * 
 * @param  {...string} [globs]
 */
function applyIgnores(...globs) {
    /** @type {Array.<string>} */
    const ignoredGlobs = [];

    for (const ignoredPath of configs.buildInfos.ignores) {
        /** @type {Array.<string>} */
        const rawGlobs = toGlob(ignoredPath);

        for (const rawGlob of rawGlobs) {
            ignoredGlobs.push("!" + rawGlob);
        }
    }

    if (!globs) {
        return ignoredGlobs;
    }

    return [...globs, ...ignoredGlobs];
}
exports.applyIgnores = applyIgnores;

/**
 * 
 * @param  {Array.<string>} globs 
 * @returns {Array.<string>}
 */
function normalizeGlobs(...globs) {
    const ignoredGlobs = exports.applyIgnores();

    /** @type {Array.<string>} */
    const gulpfiles =
        glob.sync(["**/gulpfile.js", "!./gulpfile.js", ...ignoredGlobs], { dot: true });

    /** @type {Array.<string>} */
    const outputGlobs = [
        ...globs,
        ...gulpfiles.map(((fileName) => "!" + path.join(path.dirname(fileName), "**", "*"))),
        ...ignoredGlobs
    ];

    return outputGlobs;
}
exports.normalizeGlobs = normalizeGlobs;

/**
 * 
 * @param {string} globlike 
 * @param {Array.<string>} [exts]
 * @returns {Array.<string>} 
 */
function toGlob(globlike, exts) {
    /** @type {Array.<string>} */
    const finalizedGlobs = [];

    /** @type {RegExpExecArray} */
    let regexResult;

    /** @type {string} */
    let glob;

    globlike = globlike.replace(/[\\|\/]/ig, path.sep);

    if (regexResult = Regex.PathRef.exec(globlike)) {
        glob = configs.buildInfos.paths[regexResult[1]];

    } else if (regexResult = Regex.GlobLike.exec(globlike)) {
        finalizedGlobs.push(globlike);
        return finalizedGlobs;

    } else {
        glob = globlike;
    }

    if (!exts || exts.length <= 0) {
        if (glob.endsWith("/") || glob.endsWith("\\")) {
            finalizedGlobs.push(glob.substr(0, glob.length - 1));
        } else {
            finalizedGlobs.push(glob);
        }

        finalizedGlobs.push(path.join(glob, "**", "*"));

    } else {
        for (const ext of exts) {
            finalizedGlobs.push(path.join(glob, "**", `*.${ext}`));
        }
    }

    return finalizedGlobs;
}

/**
 * 
 * @param {GlobLike} globlike 
 * @param {string | Array.<string>} exts 
 * @returns {Array.<string>}
 */
function toGlobs(globlike, exts) {
    if (!globlike) {
        throw new Error("path must be provided");
    }

    if (exts) {
        if (typeof exts === "string") {
            exts = [exts];
        } else if (!Array.isArray(exts)) {
            throw new Error("Unsupport value of param, exts");
        }
    }

    if (typeof globlike === "string") {
        globlike = [globlike];
    } else if (!Array.isArray(globlike)) {
        throw new Error("Invalid value of param globlike. Only string | Array<string> is accepted.");
    }

    /** @type {Array.<string>} */
    const results = [];

    for (const globlikeItem of globlike) {
        // @ts-ignore
        const globs = toGlob(globlikeItem, exts);

        results.push(...globs);
    }

    return normalizeGlobs(...results);
}
exports.toGlobs = toGlobs;
