# **Rain Language - Codemirror**
The Rain language (aka rainlang) implementaion for codemirror, which works as a codemirror extension.
This extention provides: 
- Syntax highlighting (written in lezer grammar)
- Diagnostics 
- Completion (through codemirror autocomplete extension)
- Hover (through codemirror hoverTooltip extension)

This repo uses and utilized original source code from [codemirror-languageserver](https://github.com/FurqanSoftware/codemirror-languageserver).

The primary goal of the Rain language is to make smart contract development accessible for as many people as possible. This is fundamentally grounded in our belief that accessibility is the difference between theoretical and practical decentralisation. There are many people who would like to participate in authoring and auditing crypto code but currently cannot. When someone wants/needs to do something but cannot, then they delegate to someone who can, this is by definition centralisation.

For more info and details about rainlang, please read this [article](https://hackmd.io/@REJeq0MuTUiqnjx9w5SsUA/HJj9s-nfi#Rainlang-has-a-spectrum-of-representations-from-concise-gtexplicit).

If you find an issue or you want to propose an improvement, please feel free to post it on: [issues](https://github.com/rainprotocol/rainlang-codemirror/issues)

## **Tutorial**
To get started, install the package:
```bash
yarn add codemirror-rainlang
or
npm install codemirror-rainlang
```
<br>

Then you can use any of `RainLanguage()`, `RainlangExtension` an `RainlangDescription` to get rainlang codemirror extension:
```typescript
// import
import { RainLanguage, RainLanguageServicesFacet } from "codemirror-rainlang";

// get the `LanguageSupport` instance
const rainlangCodemirror = new RainlangExtension(config);

// for getting the plugin instance of a running extension
const rainViewPlugin = rainlangCodemirror.plugin;

// get the MetaStore instance or EditorView instance
const view = rainPlugin?.view;
const metaStore = rainPlugin?.metaStore;
```
