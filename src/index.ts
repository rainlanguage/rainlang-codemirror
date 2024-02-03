import { RainlangLR } from "./syntax/rainlr";
import { yaml } from "@codemirror/lang-yaml";
import { MetaStore } from "@rainlanguage/dotrain";
import { Extension, Facet } from "@codemirror/state";
import { autocompletion } from "@codemirror/autocomplete";
import { ViewPlugin, hoverTooltip } from "@codemirror/view";
import { LanguageSupport, LanguageDescription } from "@codemirror/language";
import { RainLanguageServicesPlugin, useLast, ForkCallback } from "./services/languageServices";

export { RainlangLR, MetaStore };
export * from "@rainlanguage/dotrain";
export * from "../src/services/languageServices";
export { TextDocument, TextEdit, TextDocumentContentChangeEvent } from "vscode-languageserver-textdocument";


/**
 * @public The facet used to store and retrive RainLanguageServicesPlugin instance from a EditorView.plugin().
 * By getting the facet value from the state associated with that EditoreView instance, you then can intract 
 * with the plugin directly to get the Meta.Store instance and update its subgraph and metas manually, however, 
 * this is not recommended as the meta storage and management is handled automatically by every meta hash that
 * is specified in an Rain document, so using this will not be needed in most of the cases unless some custom
 * behavior is intended.
 * This combination is provided for `rainlang` LanguageSupport class object and not for `RainlangExtention` class.
 * 
 * @example
 * ```typescript
 * // get value of the facet
 * const rainViewPlugin = editorView.state.facet(RainLanguageServicesFacet);
 * 
 * // get the plugin instance
 * const rainPlugin = editorView.plugin(rainViewPlugin);
 * 
 * // update op meta from plugin
 * rainPlugin.getMetaStore();
 * ```
 */
export const RainLanguageServicesFacet = Facet.define<
    ViewPlugin<RainLanguageServicesPlugin>,
    ViewPlugin<RainLanguageServicesPlugin>
>({ combine: useLast });

/**
 * @public Options to choose language services
 */
export type LanguageServicesConfig = {
    /**
     * Provides hover tooltips
     */
    hover?: boolean;
    /**
     * Provides code completion suggestions
     */
    completion?: boolean;
    /**
     * callback for getting native parser errors
     */
    callback?: ForkCallback
} 

/**
 * @public Rainlang as a codemirror extension
 * @example
 * ```typescript
 * // instantiate the extension that can be directly used as codemirror extension
 * const rainlangExtension = new RainlangExtention(options);
 *
 * // instantiate the extension with initial meta data
 * const rainlangExtension = await RainlangExtension.create({services, subgraphs, metas})
 * 
 * // to get the Meta.Store instance of this extension instance
 * rainlangExtension.getMetaStore();
 * ```
 */
export class RainlangExtension {
    public extension: Extension[] = [];
    private plugin: RainLanguageServicesPlugin | undefined;
    private hover = hoverTooltip(
        (_view, pos) => this.plugin?.handleHoverTooltip(pos) ?? null
    );
    private completion = autocompletion({
        override: [
            async (context) => {
                if (this.plugin == null) return null;
                return await this.plugin?.handleCompletion(context);
            },
        ],
    });

    /**
     * @public Constructor of the RainlangCodemirror class
     * @param config - Options for language services to include
     */
    constructor(config?: LanguageServicesConfig, metaStore?: MetaStore) {
        this.extension.push(
            RainlangLR,
            yaml().support,
            ViewPlugin.define(view => 
                this.plugin = new RainLanguageServicesPlugin(view, metaStore, config?.callback)
            )
        );
        if (!config) this.extension.push(this.hover, this.completion);
        else {
            if (config?.hover) this.extension.push(this.hover);
            if (config?.completion) this.extension.push(this.completion);
        }
    }

    /**
     * @public Creates the Rainlang extension with initial meta data (subgraphs and meta hash/bytes)
     * @param config - The configuration to create the extension with
     * @returns A promise that resolves with a RainlangExtension
     */
    public static async create(
        config?: {
            /**
             * Language service to include
             */
            services?: LanguageServicesConfig, 
            /**
             * Additional subgraph endpoint URLs
             */
            subgraphs?: string[];
            /**
             * Initial meta hash and meta bytes k/v pairs
             */
            cache?: Map<Uint8Array, Uint8Array>;
            /**
             * Initial cached dotrains uri/content meta hash
             */
            dotrainCache?: Map<string, Uint8Array>;
            /**
             * include rain subgraphs or not
             */
            includeRainSubgraphs?: boolean;
        }
    ): Promise<RainlangExtension> {
        const metaStore = MetaStore.create({
            subgraphs: config?.subgraphs,
            cache: config?.cache,
            dotrainCache: config?.dotrainCache,
            includeRainSubgraphs: config?.includeRainSubgraphs
        });
        return new RainlangExtension(config?.services, metaStore);
    }

    /**
     * @public Get the Meta.Store object instance in order to manualy update its subgraphs or metas
     * Using this method is not recommended as meta management is handled completely automatically 
     * from specified meta hashes in a Rain document and doesn't need any manual interference unless 
     * some custom behavior is intended.
     */
    public getMetaStore() {
        if (this.plugin) return this.plugin.getMetaStore();
    }
}

/**
 * @public 
 * Provides Rainlang implementation for codemirror as LanguageSupport
 * This is the standard implementation of rainlang for codemirror. 
 * 
 * @example
 * ```typescript
 * const rainLanguageSupport = RainLanguage(config);
 * ```
 * in order to get the Meta.Store instance, it should be done through getting the plugin instance 
 * from the EditorView with providing it the result of getting the `RainLanguageServicesFacet` 
 * facet and then calling `getMetaStore()` for it, however this is not recommended as meta management
 * is done automatically from specified meta hashes in a Rain document:
 * ```typescript
 * // get the `RainLanguageServicesFacet` value from editor view
 * const rainViewPlugin = view.state.facet(RainLanguageServicesFacet);
 * 
 * // retrive the `RainLanguageServicesPlugin` instance
 * const rainPlugin = view.plugin(rainViewPlugin);
 * 
 * // get the Meta.Store instance
 * rainPlugin.getMetaStore()
 * ```
 * 
 * @param config - Options for language services to include
 * @param metaStore - (optional) The meta store object to use
 * @returns rainlang LanguageSupport
 */
export function RainLanguage(
    config?: LanguageServicesConfig, 
    metaStore?: MetaStore
): LanguageSupport {
    let plugin: RainLanguageServicesPlugin | undefined;
    const rainViewPlugin: ViewPlugin<RainLanguageServicesPlugin> = ViewPlugin.define(
        view => plugin = new RainLanguageServicesPlugin(view, metaStore, config?.callback)
    );
    const services: Extension[] = [];
    const hover = hoverTooltip(
        (_view, pos) => plugin?.handleHoverTooltip(pos) ?? null
    );
    const completion = autocompletion({
        override: [
            async (context) => {
                if (plugin == null) return null;
                return await plugin?.handleCompletion(context);
            },
        ],
    });
    if (!config) services.push(hover, completion);
    else {
        if (config?.hover) services.push(hover);
        if (config?.completion) services.push(completion);
    }
    return new LanguageSupport(
        RainlangLR,
        [
            RainLanguageServicesFacet.of(rainViewPlugin),
            rainViewPlugin,
            yaml().support,
            ...services
        ]
    );
}

/**
 * @public Provides LanguageDescription class object for rainlang.
 * Use `load` to instantiate rain LanguageSupport with initial meta data
 */
export const RainlangDescription = LanguageDescription.of({
    name: "rainlang",
    alias: [ "Rain Language", "Rainlang", "RainLang", "rain" ],
    extensions: [ ".rain" ],
    load: async(
        config?: {
            /**
             * Language service to include
             */
            services?: LanguageServicesConfig, 
            /**
             * Additional subgraph endpoint URLs
             */
            subgraphs?: string[];
            /**
             * Initial meta hash and meta bytes k/v pairs
             */
            cache?: Map<Uint8Array, Uint8Array>;
            /**
             * Initial cached dotrains uri/content meta hash
             */
            dotrainCache?: Map<string, Uint8Array>;
            /**
             * include rain subgraphs or not
             */
            includeRainSubgraphs?: boolean;
        }
    ) => {
        const metaStore = MetaStore.create({
            subgraphs: config?.subgraphs,
            cache: config?.cache,
            dotrainCache: config?.dotrainCache,
            includeRainSubgraphs: config?.includeRainSubgraphs
        });
        return Promise.resolve(RainLanguage(config?.services, metaStore));
    },
    support: RainLanguage()
});
