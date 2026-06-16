import React from 'react';

interface MarkdownProps {
  content: string;
}

export default function Markdown({ content }: MarkdownProps) {
  // Split lines to identify blocks
  const lines = content.split('\n');
  const renderedElements: React.ReactNode[] = [];
  
  let inTable = false;
  let tableRows: string[][] = [];
  let tableHeaders: string[] = [];
  let codeBlock = false;
  let codeText = '';

  const processInline = (text: string) => {
    // Basic bold **text** parsing
    const parts = text.split(/\*\*([\s\S]*?)\*\*/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="font-bold text-foreground font-mono bg-accent px-1 rounded">{part}</strong>;
      }
      
      // Basic italic *text* parsing
      const subParts = part.split(/\*([\s\S]*?)\*/g);
      return subParts.map((subPart, subIdx) => {
        if (subIdx % 2 === 1) {
          return <em key={subIdx} className="italic text-neutral">{subPart}</em>;
        }
        return subPart;
      });
    });
  };

  const flushTable = (key: number) => {
    if (tableRows.length === 0) return null;
    const element = (
      <div key={`table-${key}`} className="my-4 overflow-x-auto border border-border bg-card rounded">
        <table className="w-full text-xs font-mono text-left">
          <thead>
            <tr className="bg-accent border-b border-border text-neutral uppercase text-[10px]">
              {tableHeaders.map((header, hIdx) => (
                <th key={hIdx} className="px-4 py-2 font-bold">{header.trim()}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {tableRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-accent/40 transition">
                {row.map((cell, cIdx) => {
                  const val = cell.trim();
                  // Color positive/negative values
                  let cellClass = "px-4 py-2 ";
                  if (val.startsWith('+') || val.includes('Bullish') || val.includes('Gainer') || val.includes('Buy')) {
                    cellClass += "text-gainer font-semibold";
                  } else if (val.startsWith('-') || val.includes('Bearish') || val.includes('Loser') || val.includes('Sell')) {
                    cellClass += "text-loser font-semibold";
                  } else {
                    cellClass += "text-foreground";
                  }
                  return (
                    <td key={cIdx} className={cellClass}>
                      {val}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
    tableHeaders = [];
    inTable = false;
    return element;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] || '';

    // Code Block detection
    if (line.trim().startsWith('```')) {
      if (codeBlock) {
        // flush code block
        renderedElements.push(
          <pre key={`code-${i}`} className="bg-accent border border-border p-4 rounded text-xs font-mono overflow-x-auto text-foreground/90 my-3">
            <code>{codeText.trim()}</code>
          </pre>
        );
        codeText = '';
        codeBlock = false;
      } else {
        codeBlock = true;
      }
      continue;
    }

    if (codeBlock) {
      codeText += line + '\n';
      continue;
    }

    // Financial Table detection
    if (line.trim().startsWith('|')) {
      if (!inTable) {
        inTable = true;
        // Parse Headers
        const cols = line.split('|').slice(1, -1);
        tableHeaders = cols;
      } else {
        // Skip separator lines like |---|---|
        if (line.includes('---')) continue;
        const cols = line.split('|').slice(1, -1);
        tableRows.push(cols);
      }
      continue;
    } else if (inTable) {
      // Flush table since we hit a non-table line
      const tableElem = flushTable(i);
      if (tableElem) renderedElements.push(tableElem);
    }

    // Headers
    if (line.startsWith('### ')) {
      renderedElements.push(<h3 key={i} className="text-sm font-bold font-mono text-primary mt-4 mb-2 uppercase tracking-wide border-b border-border/40 pb-1">{processInline(line.slice(4))}</h3>);
    } else if (line.startsWith('#### ')) {
      renderedElements.push(<h4 key={i} className="text-xs font-bold font-mono text-neutral mt-3 mb-1.5 uppercase">{processInline(line.slice(5))}</h4>);
    } else if (line.startsWith('## ')) {
      renderedElements.push(<h2 key={i} className="text-base font-bold font-mono text-primary mt-6 mb-3 border-b border-border pb-1 uppercase">{processInline(line.slice(3))}</h2>);
    } else if (line.startsWith('# ')) {
      renderedElements.push(<h1 key={i} className="text-lg font-bold font-mono text-foreground mt-8 mb-4 border-b border-primary/50 pb-2 uppercase tracking-tight">{processInline(line.slice(2))}</h1>);
    }
    // Lists
    else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      renderedElements.push(
        <ul key={i} className="list-disc pl-5 my-1.5 text-xs text-foreground space-y-1">
          <li>{processInline(line.trim().slice(2))}</li>
        </ul>
      );
    }
    // Paragraph
    else if (line.trim() !== '') {
      renderedElements.push(<p key={i} className="text-xs leading-relaxed text-foreground/90 my-2">{processInline(line)}</p>);
    }
  }

  // Final flush if table was last element
  if (inTable) {
    const tableElem = flushTable(lines.length);
    if (tableElem) renderedElements.push(tableElem);
  }

  return <div className="space-y-1">{renderedElements}</div>;
}
