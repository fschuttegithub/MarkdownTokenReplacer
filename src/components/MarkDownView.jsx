import { Component, createElement } from "react";
import DOMPurify from "dompurify";
import MarkdownView from "react-showdown";

export class MarkDownText extends Component {
    sanitizeHtml = html => (this.props.sanitize ? DOMPurify.sanitize(html) : html);

    render() {
        return (
            <MarkdownView
                markdown={this.props.markdown ?? this.props.markdownInput?.value ?? ""}
                sanitizeHtml={this.sanitizeHtml}
                options={{ tables: true, emoji: true, underline: true }}
            />
        );
    }
}
