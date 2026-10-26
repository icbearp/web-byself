import type { ReactNode } from "react";

export function renderInlineMarkdown(value: string): ReactNode[] {
  const tokens = value.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^)]+\))/g);
  return tokens.filter(Boolean).map((token, index) => {
    const link = token.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (link) return <a href={link[2]} key={`${index}-${token}`} target="_blank" rel="noreferrer">{link[1]} ↗</a>;
    if (token.startsWith("**") && token.endsWith("**")) return <strong key={`${index}-${token}`}>{token.slice(2, -2)}</strong>;
    return token;
  });
}

export function TutorialBody({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";
    const key = `${index}-${line.slice(0, 12)}`;
    const image = line.match(/^!\[([^\]]*)\]\((https?:\/\/[^)]+)\)$/);
    const hasTableHeader = line.includes("|") && /^\s*\|?[\s:|-]+\|[\s:|-]+/.test(lines[index + 1] ?? "");

    if (hasTableHeader) {
      const parseRow = (row: string) => row.replace(/^\s*\||\|\s*$/g, "").split("|").map((cell) => cell.trim());
      const headers = parseRow(line);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && (lines[index] ?? "").includes("|")) {
        rows.push(parseRow(lines[index] ?? ""));
        index += 1;
      }
      blocks.push(<div className="tutorial-table-wrap" data-comment-block={`line-${index}`} key={key}><table><thead><tr>{headers.map((header, cellIndex) => <th key={`${header}-${cellIndex}`}>{renderInlineMarkdown(header)}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{headers.map((_, cellIndex) => <td key={cellIndex}>{renderInlineMarkdown(row[cellIndex] ?? "")}</td>)}</tr>)}</tbody></table></div>);
      continue;
    }

    if (!line.trim()) blocks.push(<span className="tutorial-space" key={key} />);
    else if (image) blocks.push(<figure className="tutorial-image" data-comment-block={`line-${index}`} key={key}><img src={image[2]} alt={image[1]} loading="lazy" />{image[1] && <figcaption>{image[1]}</figcaption>}</figure>);
    else if (line.startsWith("## ")) blocks.push(<h3 data-comment-block={`line-${index}`} key={key}>{renderInlineMarkdown(line.slice(3))}</h3>);
    else if (line.startsWith("### ")) blocks.push(<h4 data-comment-block={`line-${index}`} key={key}>{renderInlineMarkdown(line.slice(4))}</h4>);
    else if (line.startsWith("- ")) blocks.push(<p className="tutorial-list-line" data-comment-block={`line-${index}`} key={key}>• {renderInlineMarkdown(line.slice(2))}</p>);
    else if (/^\d+\.\s/.test(line)) blocks.push(<p className="tutorial-list-line ordered" data-comment-block={`line-${index}`} key={key}>{renderInlineMarkdown(line)}</p>);
    else if (line.startsWith("> ")) blocks.push(<blockquote data-comment-block={`line-${index}`} key={key}>{renderInlineMarkdown(line.slice(2))}</blockquote>);
    else blocks.push(<p data-comment-block={`line-${index}`} key={key}>{renderInlineMarkdown(line)}</p>);
    index += 1;
  }

  return <div className="tutorial-body">{blocks}</div>;
}
