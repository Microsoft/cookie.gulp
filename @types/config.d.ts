//-----------------------------------------------------------------------------
// Copyright (c) 2018 Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License file under the project root for license information.
//-----------------------------------------------------------------------------

interface IBuildPaths {
    [pathName: string]: string;
    intermediateDir?: string;
    publishDir?: string;
    buildDir?: string;
}

interface IBuildTargetConfig {
    platform: NodeJS.Platform;
    archs: Array<NodeJS.Architecture>;
}

interface IBuildTaget {
    platform: NodeJS.Platform;
    arch?: NodeJS.Architecture;
}

type ExecutionModel = "parallel" | "series";

type GlobLike = string | Array<string>;

interface IProcessorConfig extends IDictionary<any> {
    name: string;
}

interface IBuildTaskDefinition {
    sources?: GlobLike;
    dest?: string;
    processors: Array<string | IProcessorConfig>;
}

interface IBuildTaskGroup {
    executionModel: ExecutionModel;
    tasks: Array<string | IBuildTaskGroup>;
}

interface IBuildTasksArray extends Array<string | IBuildTaskGroup | IBuildTasksArray> { }

type BuildTaskTree = IBuildTasksArray | IBuildTaskGroup;

interface IBuildTaskDictionary {
    [taskName: string]: BuildTaskTree | IBuildTaskDefinition;

    build?: BuildTaskTree | IBuildTaskDefinition;
    publish?: BuildTaskTree | IBuildTaskDefinition;
}

interface IMsiProcessorConfig {
    autoGenerateComponentGuids?: boolean;
    generateGuidsNow?: boolean;
    keepEmptyFolders?: boolean;
    rootDirectory?: string;
    componentGroupName?: string;
    xsltTemplatePath?: string;
    wxs: GlobLike;
    variables?: IDictionary<string>;
    spdb?: boolean;
}

interface IElectronPackageProcessorConfig {
    asar?: boolean;
    icons?: GlobLike;
    macOS?: {
        appBundleId: string;
        appCategoryType: string;
        helperBundleId?: string;
    }
}

interface IElectronLinuxInstallerProcessorConfig {
    section?: string;
    icons?: GlobLike;
    categories?: Array<string>;
}

interface ILicensingProcessorConfig {
    "licenses-overrides": IDictionary<string>
}

interface IBuildTaskConfigDictionary extends IDictionary<any> {
}

interface IBuildProcessorConfigDictionary extends IDictionary<any> {
    "msi"?: IMsiProcessorConfig;
    "electron/pack"?: IElectronPackageProcessorConfig;
    "electron/deb"? : IElectronLinuxInstallerProcessorConfig;
    "electron/rpm"? : IElectronLinuxInstallerProcessorConfig;
}

interface IBuildInfos {
    productName?: string;
    executableName?: string;

    description?: string;
    copyright?: string;
    
    buildNumber?: string;

    tasks?: IBuildTaskDictionary;

    configs?: {
        tasks?: IBuildTaskConfigDictionary;
        processors?: IBuildProcessorConfigDictionary;
    };

    targets?: Array<IBuildTargetConfig>;
    paths?: IBuildPaths;
    ignores?: Array<string>;
}