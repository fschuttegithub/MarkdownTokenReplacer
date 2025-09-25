# Markdown Token Replacer

## Overview
Markdown Token Replacer turns plain Markdown into richer pages by swapping marked pieces of text with Mendix widgets. Use it for articles, manuals, or knowledge bases where readers should be able to open a source, definition, or action without leaving the paragraph they're reading.

## Configuration
1. Drop the widget on a page that already exposes your Markdown text.
2. Point **Markdown Input** at the attribute that holds that Markdown.
3. Choose the list of related items under **Tokens**.
4. Enter the literal text or `/regex/flags` pattern that should be replaced.
5. Drag the widget(s) you want to show for each match into **Token Content**.

### Matching strategy
- Literal text is matched exactly as you type it.
- Regular expressions can pull values from your objects (for example `/\[(?<idx>\d+)\]/g`), and the widget always adds the `g` flag.
- If two matches overlap, the widget keeps the first one so the Markdown still reads correctly.

## Runtime behaviour
- Matches refresh automatically when the Markdown changes, when you tweak the settings, or when Mendix finishes loading the list—even if Mendix reuses the same list under the hood.
- Replacement widgets render through React portals, so they keep their styling and stay interactive.
- DOMPurify sanitises the HTML output by default to block untrusted markup. Disable only when you fully trust the input.

## Styling
Style the `.markdown-token-replacer` container or the `.token-host` spans to match your app. The widgets you drop in keep their own classes, so normal styling rules apply.

## Development
1. Install dependencies with `npm install` (or `npm install --legacy-peer-deps` for npm 7).
2. Run `npm start` to rebuild the widget and copy it into your Mendix test project while you work.
3. Use `npm run build` for a production bundle and `npm run lint` to check code quality before release.

## Use cases
- Show detailed citations inline without cluttering article text.
- Make a single word or short phrase launch a microflow or page.
- Swap jargon for glossary tooltips or info cards.

## Support & feedback
Log issues or ideas in your project tracker or contact the Mendix App Store support channel linked to this widget.
