# Markdown Token Replacer

Markdown Token Replacer lets you enrich plain Markdown with components set in Studio Pro. Swap specific words, phrases, or patterns for interactive content so readers get context, actions, or definitions without leaving the paragraph.

## Use Cases
- Inline citations that open detailed references without navigating away (Useful for AI texts which include sources).
- Add tooltips on specific words in a longer text
- Replace specific words in a longer text with clickable links
- Call-to-action snippets that trigger microflows or pages directly inside text.
- Contextual help panels that expand inside documentation or knowledge base articles.

## Features
- Replace literal strings or regex matches with any Mendix widget you drop into the token content.
- Refresh replacements automatically when Markdown, token data, or widget settings change.
- Render replacements through React portals so styling and interactivity stay intact.
- Protect the reading flow by ignoring overlapping matches after the first hit.
- Keep output safe with DOMPurify sanitization, enabled by default.

## Usage
- Drop the widget on a page that already exposes the Markdown attribute.
- Bind the Markdown input
- Provide a list with tokens to be replaced
- Configure the tokens literal or regex pattern and the widgets to render.
- Preview the page to confirm matches, spacing, and responsive behaviour.

## Matching
- Literal patterns match exactly what you type.
- Regex patterns can expose named groups such as `/\[(?<idx>\d+)\]/g` for reuse inside widgets.
- When matches collide, the widget keeps the first one so the Markdown structure stays valid.

## Styling
- Adjust layout by targeting `.markdown-token-replacer` in your stylesheets.
- Fine-tune individual replacements with `.token-host`; embedded widgets retain their own classes.

## Development
- Install dependencies with `npm install` (or `npm install --legacy-peer-deps`).
- Run `npm start` to rebuild the widget and copy it into your Mendix test project during development.
- Use `npm run build` for production bundles and `npm run lint` to catch issues before release.

## Notes
- Keep regex patterns specific to avoid unexpected replacements.
- Tokens evaluate sequentially, so order them carefully for predictable output.
- Share feedback, issues, or feature requests through your Mendix App Store support channel.
- Only disable sanitization when you completely trust the Markdown source.

Example:
![ExampleUsage](Example.png)

## Issues, Suggestions, and Feature Requests

Please feel free to raise any issues, share suggestions, or request new features on the GitHub repository:
[MarkdownTokenReplacer GitHub Issues](https://github.com/fschuttegithub/MarkdownTokenReplacer/issues)





