import { yaml } from "@codemirror/lang-yaml";
import { RainlangLR } from "./syntax/language";
import { MetaStore } from "@rainlanguage/dotrain";
import { Extension, Facet } from "@codemirror/state";
import { autocompletion } from "@codemirror/autocomplete";
import { ViewPlugin, hoverTooltip } from "@codemirror/view";
import { LanguageSupport, LanguageDescription } from "@codemirror/language";
import { 
    useLast, 
    NativeParserCallback, 
    RainLanguageServicesPlugin, 
    RawLanguageServicesCallbacks, 
    RawRainLanguageServicesPlugin 
} from "./services/languageServices";

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
 * @public Configuraions options for rain language services
 */
export type LanguageServicesConfig = {
    /**
     * if hover tooltips should be actiavted
     */
    hover?: boolean;
    /**
     * if code completion suggestions should be actiavted
     */
    completion?: boolean;
    /**
     * callback for getting native parser errors
     */
    callback?: NativeParserCallback,
    /**
     * The MetaStore to instantiate rain language services with
     */
    metaStore?: MetaStore
}

/**
 * @public Rainlang as a codemirror extension
 * @example
 * ```typescript
 * // instantiate the extension that can be directly used as codemirror extension
 * const rainlangExtension = new RainlangExtention(options);
 *
 * // instantiate the extension with initial meta data
 * const rainlangExtension = new RainlangExtension();
 * 
 * // to get the MetaStore instance of this extension instance
 * const metaStore = rainlangExtension.plugin.metaStore;
 * ```
 */
export class RainlangExtension extends LanguageSupport {
    public plugin: RainLanguageServicesPlugin | undefined;
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
    constructor(config?: LanguageServicesConfig) {
        const rainViewPlugin = ViewPlugin.define(view => 
            this.plugin = new RainLanguageServicesPlugin(
                view, 
                config?.metaStore, 
                config?.callback
            )
        );
        const ext = [
            yaml().support,
            RainLanguageServicesFacet.of(rainViewPlugin),
            rainViewPlugin
        ];
        super(RainlangLR, ext);
        if (!config) ext.push(this.hover, this.completion);
        else {
            if (config?.hover) ext.push(this.hover);
            if (config?.completion) ext.push(this.completion);
        }
    }
}

/**
 * @public Raw Rainlang codemirror extension, that does everything through supplied callbacks
 */
export class RawRainlangExtension extends LanguageSupport {
    public plugin: RawRainLanguageServicesPlugin | undefined;
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
     * @param callbacks - Raw language services callbacks
     */
    constructor(callbacks: RawLanguageServicesCallbacks) {
        const rainViewPlugin = ViewPlugin.define(view => 
            this.plugin = new RawRainLanguageServicesPlugin(
                view, 
                callbacks
            )
        );
        const ext = [
            yaml().support,
            RainLanguageServicesFacet.of(rainViewPlugin),
            rainViewPlugin
        ];
        super(RainlangLR, ext);
        if (callbacks.hover) ext.push(this.hover);
        if (callbacks.completion) ext.push(this.completion);
    }
}

/**
 * @public 
 * Provides Rainlang implementation for codemirror as LanguageSupport
 * This is the standard implementation of rainlang for codemirror. 
 * 
 * @example
 * ```typescript
 * const rainLanguageSupport = RainLanguageSupport(config);
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
 * rainPlugin.metaStore();
 * ```
 * 
 * @param config - Options for language services to include
 * @param metaStore - (optional) The meta store object to use
 * @returns rainlang LanguageSupport
 */
export function RainLanguageSupport(config?: LanguageServicesConfig): LanguageSupport {
    let plugin: RainLanguageServicesPlugin | undefined;
    const rainViewPlugin: ViewPlugin<RainLanguageServicesPlugin> = ViewPlugin.define(
        view => plugin = new RainLanguageServicesPlugin(view, config?.metaStore, config?.callback)
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
    load: (config?: LanguageServicesConfig) => {
        return Promise.resolve(new RainlangExtension(config));
    },
    support: new RainlangExtension()
});
