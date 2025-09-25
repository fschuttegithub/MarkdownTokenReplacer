import { Component, createElement, createRef } from "react";
import { createPortal } from "react-dom";
import { MarkDownText } from "./components/MarkDownView.jsx";

// Widget that replaces matched tokens with inline Mendix content rendered by MarkDownText.
export default class MarkdownTokenReplacer extends Component {
    HOST_CLASS = "token-host";
    HOST_ATTR = "data-token-idx";

    containerRef = createRef();
    state = { portals: [] };

    lastTokensStatus = undefined;
    lastTokensSignature = null;

    // Escape a string for literal matching inside RegExp
    escapeRegExp(s) {
        return typeof s === "string" ? s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : "";
    }

    // Parse an expression string to a global RegExp
    // - If wrapped like /pattern/flags treat as regex, otherwise treat as literal
    parseExpression(exprStr) {
        if (typeof exprStr !== "string" || !exprStr) return null;
        let source = exprStr;
        let flags = "g";
        const m = exprStr.match(/^\/(.*)\/([gimsuy]*)$/);
        if (m) {
            source = m[1];
            flags = m[2] || "";
            if (!flags.includes("g")) flags += "g";
        } else {
            source = this.escapeRegExp(source);
        }
        try {
            return new RegExp(source, flags);
        } catch (_) {
            return null;
        }
    }

    // Build list of { idx, regex } from available token items
    getTokenMatchers() {
        const { tokens, tokenPattern } = this.props;
        if (!tokens || tokens.status !== "available" || !Array.isArray(tokens.items) || !tokenPattern) return [];
        const out = [];
        for (let i = 0; i < tokens.items.length; i++) {
            const item = tokens.items[i];
            const exprStr = tokenPattern.get?.(item)?.value;
            const regex = this.parseExpression(exprStr);
            if (regex) out.push({ idx: i, regex });
        }
        return out;
    }

    // Insert lightweight host spans where matches occur; portals are attached post-render
    injectInlineHosts(rawMarkdown) {
        const text = typeof rawMarkdown === "string" ? rawMarkdown : "";
        const matchers = this.getTokenMatchers();
        if (!text || matchers.length === 0) return text;

        // Collect matches across all tokens on the original text
        const matches = [];
        for (const { idx, regex } of matchers) {
            regex.lastIndex = 0;
            let m;
            while ((m = regex.exec(text)) !== null) {
                const start = m.index;
                const len = m[0]?.length ?? 0;
                if (len === 0) {
                    regex.lastIndex++;
                    continue;
                }
                matches.push({ start, end: start + len, idx });
            }
        }
        if (matches.length === 0) return text;

        // Sort and drop overlaps (keep first)
        matches.sort((a, b) => a.start - b.start || a.end - b.end);
        const merged = [];
        let lastEnd = -1;
        for (const m of matches) {
            if (m.start >= lastEnd) {
                merged.push(m);
                lastEnd = m.end;
            }
        }

        // Rebuild with hosts
        let out = "";
        let cursor = 0;
        for (const m of merged) {
            if (cursor < m.start) out += text.slice(cursor, m.start);
            out += `<span class="${this.HOST_CLASS}" ${this.HOST_ATTR}="${m.idx}"></span>`;
            cursor = m.end;
        }
        if (cursor < text.length) out += text.slice(cursor);
        return out;
    }

    buildTokenSignature(items) {
        if (!Array.isArray(items) || items.length === 0) {
            return "len:" + (Array.isArray(items) ? items.length : 0);
        }
        const { tokenPattern } = this.props;
        const parts = [];
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const id = item?.id ?? i;
            let marker = "";
            try {
                marker = tokenPattern?.get?.(item)?.value ?? "";
            } catch (_) {
                marker = "";
            }
            parts.push(id + ":" + marker);
        }
        return "len:" + items.length + "|" + parts.join("|");
    }

    updateTokenSnapshot() {
        const { tokens } = this.props;
        const status = tokens?.status;
        const items = Array.isArray(tokens?.items) ? tokens.items : [];
        const signature = this.buildTokenSignature(items);
        const changed = status !== this.lastTokensStatus || signature !== this.lastTokensSignature;
        this.lastTokensStatus = status;
        this.lastTokensSignature = signature;
        return changed;
    }

    componentDidMount() {
        this.updateTokenSnapshot();
        this.updatePortals();
    }

    componentDidUpdate(prevProps) {
        const markdownChanged = prevProps.markdownInput?.value !== this.props.markdownInput?.value;
        const configChanged =
            prevProps.tokenPattern !== this.props.tokenPattern || prevProps.tokenContent !== this.props.tokenContent;
        const tokensChanged = this.updateTokenSnapshot();

        if (markdownChanged || configChanged || tokensChanged) {
            this.updatePortals();
        }
    }

    updatePortals() {
        const container = this.containerRef?.current;
        if (!container) {
            this.setState({ portals: [] });
            return;
        }
        const hosts = Array.from(container.querySelectorAll ? container.querySelectorAll(`.${this.HOST_CLASS}`) : []);
        const items = this.props.tokens?.items || [];
        const portals = [];
        for (const host of hosts) {
            const idx = parseInt(host.getAttribute(this.HOST_ATTR), 10);
            if (Number.isNaN(idx)) continue;
            const item = items[idx];
            if (!item) {
                if (!host.textContent) host.textContent = "";
                continue;
            }
            try {
                const content = this.props.tokenContent?.get?.(item);
                if (content) portals.push(createPortal(content, host));
            } catch (_) {
                if (!host.textContent) host.textContent = "";
            }
        }
        this.setState({ portals });
    }

    render() {
        const raw = this.props.markdownInput?.value || "";
        const mdWithHosts = this.injectInlineHosts(raw);
        return (
            <div className="markdown-token-replacer" ref={this.containerRef}>
                <MarkDownText markdown={mdWithHosts} sanitize={this.props.sanitize} />
                {this.state.portals}
            </div>
        );
    }
}
