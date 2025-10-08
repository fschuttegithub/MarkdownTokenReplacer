import * as ReactDOM from "react-dom";
import { createElement, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MarkDownText } from "./components/MarkDownText.jsx";

const HOST_CLASS = "token-host";
const HOST_ATTR = "data-token-idx";

const escapeRegExp = s => (typeof s === "string" ? s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : "");

const parseExpression = exprStr => {
    if (typeof exprStr !== "string" || !exprStr) return null;
    let source = exprStr;
    let flags = "g";
    const match = exprStr.match(/^\/(.*)\/([gimsuy]*)$/);
    if (match) {
        source = match[1];
        flags = match[2] || "";
        if (!flags.includes("g")) flags += "g";
    } else {
        source = escapeRegExp(source);
    }
    try {
        return new RegExp(source, flags);
    } catch (_) {
        return null;
    }
};

const getTokenMatchers = (tokensStatus, items, tokenPattern) => {
    if (tokensStatus !== "available" || !Array.isArray(items) || !tokenPattern) return [];
    const out = [];
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const exprStr = tokenPattern.get?.(item)?.value;
        const regex = parseExpression(exprStr);
        if (regex) out.push({ idx: i, regex });
    }
    return out;
};

const injectInlineHosts = (rawMarkdown, matchers) => {
    const text = typeof rawMarkdown === "string" ? rawMarkdown : "";
    if (!text || matchers.length === 0) return text;
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
    matches.sort((a, b) => a.start - b.start || a.end - b.end);
    const merged = [];
    let lastEnd = -1;
    for (const match of matches) {
        if (match.start >= lastEnd) {
            merged.push(match);
            lastEnd = match.end;
        }
    }
    let out = "";
    let cursor = 0;
    for (const match of merged) {
        if (cursor < match.start) out += text.slice(cursor, match.start);
        out += `<span class="${HOST_CLASS}" ${HOST_ATTR}="${match.idx}"></span>`;
        cursor = match.end;
    }
    if (cursor < text.length) out += text.slice(cursor);
    return out;
};

const MarkdownTokenReplacerComponent = props => {
    const { markdownInput, sanitize, tokenContent, tokenPattern, tokens } = props;
    const containerRef = useRef(null);
    const [portals, setPortals] = useState([]);

    const tokensStatus = tokens?.status;
    const tokenItems = tokens?.items;
    const items = useMemo(() => (Array.isArray(tokenItems) ? tokenItems : []), [tokenItems]);
    const markdownValue = markdownInput?.value ?? "";

    const matchers = useMemo(
        () => getTokenMatchers(tokensStatus, items, tokenPattern),
        [tokensStatus, items, tokenPattern]
    );
    const markdownWithHosts = useMemo(() => injectInlineHosts(markdownValue, matchers), [markdownValue, matchers]);

    const updatePortals = useCallback(() => {
        const container = containerRef.current;
        if (!container) {
            setPortals([]);
            return;
        }
        const hosts = Array.from(container.querySelectorAll ? container.querySelectorAll(`.${HOST_CLASS}`) : []);
        if (hosts.length === 0) {
            setPortals([]);
            return;
        }
        const nextPortals = [];
        for (const host of hosts) {
            const idx = parseInt(host.getAttribute(HOST_ATTR), 10);
            if (Number.isNaN(idx)) {
                if (!host.textContent) host.textContent = "";
                continue;
            }
            const item = items[idx];
            if (!item) {
                if (!host.textContent) host.textContent = "";
                continue;
            }
            try {
                const content = tokenContent?.get?.(item);
                if (content) {
                    nextPortals.push(ReactDOM.createPortal(content, host));
                } else if (!host.textContent) {
                    host.textContent = "";
                }
            } catch (_) {
                if (!host.textContent) host.textContent = "";
            }
        }
        setPortals(nextPortals);
    }, [items, tokenContent]);

    useEffect(() => {
        updatePortals();
    }, [updatePortals, markdownWithHosts]);

    useEffect(() => () => setPortals([]), []);

    return (
        <div className="markdown-token-replacer" ref={containerRef}>
            <MarkDownText markdown={markdownWithHosts} sanitize={sanitize} />
            {portals}
        </div>
    );
};

const propsAreEqual = (prev, next) => {
    const prevTokens = prev.tokens || {};
    const nextTokens = next.tokens || {};
    if (prevTokens.status !== nextTokens.status) return false;
    if (prevTokens.items !== nextTokens.items) return false;
    if (prev.tokenPattern !== next.tokenPattern) return false;
    if (prev.tokenContent !== next.tokenContent) return false;
    if (prev.markdownInput?.value !== next.markdownInput?.value) return false;
    if (prev.sanitize !== next.sanitize) return false;
    return true;
};

export default memo(MarkdownTokenReplacerComponent, propsAreEqual);
