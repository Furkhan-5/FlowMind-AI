'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function unescapeMarkdown(raw: string): string {
  if (!raw) return '';

  // Protect code blocks (```...```) and inline code (`...`) and KaTeX math ($...$ or $$...$$)
  const codeBlocks: string[] = [];
  let protectedText = raw.replace(/(```[\s\S]*?```|`[^`]+`|\$\$[\s\S]*?\$\$|\$[^\$\n]+\$)/g, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  // Remove accidental backslashes escaping markdown formatting tokens
  // 1. Escaped headings: \### -> ###
  protectedText = protectedText.replace(/\\(#{1,6}\s+)/g, '$1');
  // 2. Escaped bold/italic: \*\* -> ** or \_\_ -> __
  protectedText = protectedText.replace(/\\(\*\*|__)/g, '$1');
  // 3. Escaped single asterisks/underscores: \* -> *
  protectedText = protectedText.replace(/\\([*_~])/g, '$1');
  // 4. Escaped list items: \- or \* or \1. -> - or * or 1.
  protectedText = protectedText.replace(/\\([-*+]\s+)/g, '$1');
  protectedText = protectedText.replace(/\\(\d+\.\s+)/g, '$1');
  // 5. Escaped tables: \| -> |
  protectedText = protectedText.replace(/\\(\|)/g, '|');
  // 6. Escaped brackets: \[ or \] -> [ or ]
  protectedText = protectedText.replace(/\\([\[\]\(\)])/g, '$1');

  // Restore protected blocks
  return protectedText.replace(/__CODE_BLOCK_(\d+)__/g, (_, idx) => codeBlocks[Number(idx)] || '');
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, className = '' }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = (codeText: string, index: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Helper to parse inline markdown (bold, italic, inline code)
  const renderInline = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Inline code `code`
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        parts.push(
          <code
            key={key++}
            className="px-1.5 py-0.5 rounded bg-slate-800 text-purple-300 font-mono text-[11px] border border-slate-700"
          >
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }

      // Bold **text**
      const boldMatch = remaining.match(/^(\*\*|\\?\*\*?)([^*]+)(\*\*|\\?\*\*?)/);
      if (boldMatch && (boldMatch[1].includes('**') || boldMatch[3].includes('**'))) {
        parts.push(
          <strong key={key++} className="font-bold text-white">
            {boldMatch[2]}
          </strong>
        );
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // Italic *text*
      const italicMatch = remaining.match(/^\*([^*]+)\*/);
      if (italicMatch) {
        parts.push(
          <em key={key++} className="italic text-slate-300">
            {italicMatch[1]}
          </em>
        );
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }

      // Normal text chunk up to next formatting token
      const nextSpecial = remaining.search(/[`*]/);
      if (nextSpecial === -1) {
        parts.push(remaining);
        break;
      } else if (nextSpecial === 0) {
        // Unmatched marker
        parts.push(remaining[0]);
        remaining = remaining.slice(1);
      } else {
        parts.push(remaining.slice(0, nextSpecial));
        remaining = remaining.slice(nextSpecial);
      }
    }

    return <>{parts}</>;
  };

  // Block parser with unescaping
  const normalizedContent = unescapeMarkdown(content || '');
  const lines = normalizedContent.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  let elementKey = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced Code Block ```
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // Skip closing ```
      const fullCode = codeLines.join('\n');
      const blockIdx = elementKey++;
      elements.push(
        <div key={blockIdx} className="my-2.5 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950">
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400 font-mono">
            <span>{lang || 'code'}</span>
            <button
              onClick={() => handleCopyCode(fullCode, blockIdx)}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              {copiedIndex === blockIdx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedIndex === blockIdx ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-3 text-[11px] font-mono text-purple-200 overflow-x-auto whitespace-pre">
            {fullCode}
          </pre>
        </div>
      );
      continue;
    }

    // Markdown Table | col | col |
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const headerRow = tableLines[0]
          .slice(1, -1)
          .split('|')
          .map((c) => c.trim());
        // line 1 is usually |---|---| separator
        const dataRows = tableLines.slice(2).map((r) =>
          r
            .slice(1, -1)
            .split('|')
            .map((c) => c.trim())
        );

        elements.push(
          <div key={elementKey++} className="my-3 overflow-x-auto rounded-xl border border-slate-700/80 shadow-md">
            <table className="min-w-full divide-y divide-slate-800 text-left text-xs bg-slate-950/70">
              <thead className="bg-slate-900/90 text-slate-200 font-semibold">
                <tr>
                  {headerRow.map((h, hIdx) => (
                    <th key={hIdx} className="px-3.5 py-2.5 font-bold uppercase tracking-wider text-[11px] text-purple-300">
                      {renderInline(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px] text-slate-300">
                {dataRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-900/50 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3.5 py-2 whitespace-nowrap">
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // Headings #, ##, ###, #### (with fallback for leading backslash or space)
    const trimmedLine = line.trimStart().replace(/^\\(#{1,4}\s+)/, '$1');
    if (trimmedLine.startsWith('#### ')) {
      elements.push(
        <h4 key={elementKey++} className="text-xs font-bold text-purple-300 mt-2 mb-1">
          {renderInline(trimmedLine.slice(5))}
        </h4>
      );
      i++;
      continue;
    }
    if (trimmedLine.startsWith('### ')) {
      elements.push(
        <h3 key={elementKey++} className="text-sm font-extrabold text-purple-200 border-b border-purple-500/20 pb-1 mt-3 mb-1.5 flex items-center gap-1.5">
          <span className="w-1.5 h-3.5 bg-purple-500 rounded-sm inline-block" />
          {renderInline(trimmedLine.slice(4))}
        </h3>
      );
      i++;
      continue;
    }
    if (trimmedLine.startsWith('## ')) {
      elements.push(
        <h2 key={elementKey++} className="text-sm font-black text-white mt-3.5 mb-1.5 flex items-center gap-2">
          <span className="w-2 h-4 bg-purple-600 rounded-sm inline-block" />
          {renderInline(trimmedLine.slice(3))}
        </h2>
      );
      i++;
      continue;
    }
    if (trimmedLine.startsWith('# ')) {
      elements.push(
        <h1 key={elementKey++} className="text-base font-black text-white mt-4 mb-2">
          {renderInline(trimmedLine.slice(2))}
        </h1>
      );
      i++;
      continue;
    }

    // Unordered List (- or *)
    if (/^[-*]\s+/.test(line.trim())) {
      const listItems: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i++;
      }
      elements.push(
        <ul key={elementKey++} className="my-1.5 space-y-1 list-none pl-1">
          {listItems.map((item, itemIdx) => (
            <li key={itemIdx} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
              <span className="text-purple-400 mt-0.5">•</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered List (1. 2. etc)
    if (/^\d+\.\s+/.test(line.trim())) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      elements.push(
        <ol key={elementKey++} className="my-1.5 space-y-1 list-none pl-1">
          {listItems.map((item, itemIdx) => (
            <li key={itemIdx} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
              <span className="text-purple-400 font-bold font-mono text-[11px] shrink-0">{itemIdx + 1}.</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Blockquote
    if (line.trim().startsWith('> ')) {
      elements.push(
        <blockquote
          key={elementKey++}
          className="my-2 border-l-2 border-purple-500 pl-3 py-1 italic text-slate-300 bg-purple-950/20 rounded-r text-xs"
        >
          {renderInline(line.trim().slice(2))}
        </blockquote>
      );
      i++;
      continue;
    }

    // Empty line (spacer)
    if (!line.trim()) {
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={elementKey++} className="text-xs text-slate-200 leading-relaxed my-1">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
};
