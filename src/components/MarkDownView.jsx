import { Component, createElement } from "react";
import MarkdownView from "react-showdown";
import DOMPurify from "dompurify";

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

