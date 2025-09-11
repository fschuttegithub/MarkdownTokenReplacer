import { createElement, Component, createRef } from "react";
import { createPortal } from "react-dom";
import { MarkDownText } from "./components/MarkDownView.jsx";

// Widget with inline source injection logic; presentation handled by MarkDownText.
export default class MarkDownWithCitations extends Component {
    HOST_CLASS = "citation-host";
    HOST_ATTR = "data-source-idx";

    containerRef = createRef();
    state = { portals: [] };

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

    // Build list of { idx, regex } from available sources
    getSourceMatchers() {
        const { sources, sourceIndexAttribute } = this.props;
        if (!sources || sources.status !== "available" || !Array.isArray(sources.items) || !sourceIndexAttribute) return [];
        const out = [];
        for (let i = 0; i < sources.items.length; i++) {
            const item = sources.items[i];
            const exprStr = sourceIndexAttribute.get?.(item)?.value;
            const regex = this.parseExpression(exprStr);
            if (regex) out.push({ idx: i, regex });
        }
        return out;
    }

    // Insert lightweight host spans where matches occur; portals are attached post-render
    injectInlineHosts(rawMarkdown) {
        const text = typeof rawMarkdown === "string" ? rawMarkdown : "";
        const matchers = this.getSourceMatchers();
        if (!text || matchers.length === 0) return text;

        // Collect matches across all sources on the original text
        const matches = [];
        for (const { idx, regex } of matchers) {
            regex.lastIndex = 0;
            let m;
            while ((m = regex.exec(text)) !== null) {
                const start = m.index;
                const len = m[0]?.length ?? 0;
                if (len === 0) { regex.lastIndex++; continue; }
                matches.push({ start, end: start + len, idx });
            }
        }
        if (matches.length === 0) return text;

        // Sort and drop overlaps (keep first)
        matches.sort((a, b) => (a.start - b.start) || (a.end - b.end));
        const merged = [];
        let lastEnd = -1;
        for (const m of matches) {
            if (m.start >= lastEnd) { merged.push(m); lastEnd = m.end; }
        }

        // Rebuild with hosts
        let out = "";
        let cursor = 0;
        for (const m of merged) {
            if (cursor < m.start) out += text.slice(cursor, m.start);
            out += `<span class=\"${this.HOST_CLASS}\" ${this.HOST_ATTR}=\"${m.idx}\"></span>`;
            cursor = m.end;
        }
        if (cursor < text.length) out += text.slice(cursor);
        return out;
    }

    componentDidMount() {
        this.updatePortals();
    }

    componentDidUpdate(prevProps) {
        if (
            prevProps.markdownInput?.value !== this.props.markdownInput?.value ||
            prevProps.sources !== this.props.sources ||
            prevProps.sourceIndexAttribute !== this.props.sourceIndexAttribute ||
            prevProps.sourceContent !== this.props.sourceContent
        ) {
            this.updatePortals();
        }
    }

    updatePortals() {
        const container = this.containerRef?.current;
        if (!container) {
            this.setState({ portals: [] });
            return;
        }
        const hosts = Array.from(container.querySelectorAll?.(`.${this.HOST_CLASS}`) || []);
        const items = this.props.sources?.items || [];
        const portals = [];
        for (const host of hosts) {
            const idx = parseInt(host.getAttribute(this.HOST_ATTR), 10);
            if (Number.isNaN(idx)) continue;
            const item = items[idx];
            if (!item) { if (!host.textContent) host.textContent = ""; continue; }
            try {
                const content = this.props.sourceContent?.get?.(item);
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
            <div className="markdown-with-citations" ref={this.containerRef}>
                <MarkDownText markdown={mdWithHosts} sanitize={this.props.sanitize} />
                {this.state.portals}
            </div>
        );
    }
}
