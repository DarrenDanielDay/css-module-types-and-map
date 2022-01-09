# css-module-types-and-map

A simple extension for generating TypeScript definition files and source map files for css modules.

## Features

- Generate TypeScript definition and source map code for `css module` \(`*.module.css`\).
- Naming export variable with `camelCased` file name.
- Support to add generated files to `.gitignore`.

## How it works

The inspiration of this extension is another extension -- [`CSS Modules Typed`](https://github.com/awwit/vscode-typed-css-modules). It generates TypeScript definition files for `css modules`. When we import `css module` files in JavaScript/TypeScript code, the vscode's builtin TypeScript language service knows that the exported object should have properties declared in the `.d.ts` files and then gives us auto complete options for the class names, and `@value` names.

However, when we try to go to the definition of these properties (class name and `@value` name), we will get to the `.d.ts` files. This extension will also generate `.d.ts.map` files mapping to `css module` files so we can get to the `css modules` files where the class name / `@value` name occurred first.


Maybe it's a tricky way to implement some language features for `css module`. But source map files are designed to map the position in source file for a generated file. Since `.d.ts` files are generated, it's reasonable to generate corresponding source map files.

Currently only `.module.css` files are supported, and `scss`, `sass`, `less` will not be supported since the naming logic is complicated in nested structure.

---

**Enjoy!**