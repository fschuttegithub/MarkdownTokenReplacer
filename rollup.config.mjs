import json from "@rollup/plugin-json";

// Mendix PWT passes the default config via args.configDefaultConfig.
// We extend it by injecting the JSON plugin so dependencies that import
// .json files (e.g., react-showdown -> entities) bundle correctly.
export default async function (args) {
    const defaults = args.configDefaultConfig || [];
    return defaults.map(cfg => ({
        ...cfg,
        plugins: [
            // Ensure JSON is handled early in the pipeline
            json(),
            ...(cfg.plugins || [])
        ]
    }));
}

