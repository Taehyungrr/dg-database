import React from 'react';

interface BBCodeRendererProps {
  text: string;
  className?: string;
}

interface StyleContext {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  color?: string;
  code?: boolean;
  size?: string;
  heading?: number;
}

/**
 * Robust BBCode to React renderer that safely parses formatting tags:
 * [b], [i], [u], [s], [color=...], [code], [size=...], [h1], [h2], [h3]
 */
export const BBCodeRenderer: React.FC<BBCodeRendererProps> = ({ text, className = '' }) => {
  if (!text) return null;

  const renderParsedBBCode = (input: string): React.ReactNode[] => {
    // Tokenize by BBCode tags (both open and close)
    const tokenRegex = /(\[\/?[a-zA-Z0-9]+(?:=[^\]]+)?\])/g;
    const tokens = input.split(tokenRegex);

    const elements: React.ReactNode[] = [];
    const styleStack: StyleContext[] = [{}];

    tokens.forEach((token, idx) => {
      if (!token) return;

      const isTag = token.startsWith('[') && token.endsWith(']');

      if (isTag) {
        const isClosing = token.startsWith('[/');
        const rawTagName = isClosing ? token.slice(2, -1).toLowerCase() : token.slice(1, -1).toLowerCase();
        const tagParts = rawTagName.split('=');
        const tagName = tagParts[0].trim();
        const tagAttr = tagParts.length > 1 ? token.slice(1 + tagName.length + 1, -1).trim() : undefined;

        if (isClosing) {
          // Pop from stack when closing matching tag
          if (styleStack.length > 1) {
            styleStack.pop();
          }
        } else {
          // Push new style context
          const currentStyle = styleStack[styleStack.length - 1] || {};
          const newStyle: StyleContext = { ...currentStyle };

          switch (tagName) {
            case 'b':
            case 'strong':
              newStyle.bold = true;
              break;
            case 'i':
            case 'em':
              newStyle.italic = true;
              break;
            case 'u':
              newStyle.underline = true;
              break;
            case 's':
            case 'strike':
              newStyle.strike = true;
              break;
            case 'code':
              newStyle.code = true;
              break;
            case 'h1':
              newStyle.heading = 1;
              break;
            case 'h2':
              newStyle.heading = 2;
              break;
            case 'h3':
              newStyle.heading = 3;
              break;
            case 'color':
              if (tagAttr) {
                // sanitize color attribute (remove quotes if any)
                newStyle.color = tagAttr.replace(/['"]/g, '');
              }
              break;
            case 'size':
              if (tagAttr) {
                newStyle.size = tagAttr.replace(/['"]/g, '');
              }
              break;
            default:
              break;
          }

          styleStack.push(newStyle);
        }
      } else {
        // Plain text with current active styles
        const activeStyle = styleStack[styleStack.length - 1] || {};

        let inlineStyle: React.CSSProperties = {};
        if (activeStyle.color) {
          inlineStyle.color = activeStyle.color;
        }
        if (activeStyle.size) {
          const numSize = parseInt(activeStyle.size, 10);
          if (!isNaN(numSize)) {
            inlineStyle.fontSize = numSize > 24 ? '1.5em' : `${Math.max(9, numSize)}px`;
          }
        }

        const classList: string[] = [];
        if (activeStyle.bold) classList.push('font-bold text-[var(--ctexto1)]');
        if (activeStyle.italic) classList.push('italic');
        if (activeStyle.underline) classList.push('underline underline-offset-2');
        if (activeStyle.strike) classList.push('line-through opacity-75');
        if (activeStyle.code) classList.push('font-mono bg-[var(--fundo3)] px-1.5 py-0.5 rounded text-[0.9em] border border-[var(--bordadg)]');
        if (activeStyle.heading === 1) classList.push('block font-cinzel text-lg font-bold text-blue-500 my-1');
        if (activeStyle.heading === 2) classList.push('block font-cinzel text-base font-bold text-blue-400 my-1');
        if (activeStyle.heading === 3) classList.push('block font-cinzel text-sm font-semibold text-blue-400 my-0.5');

        if (classList.length > 0 || Object.keys(inlineStyle).length > 0) {
          elements.push(
            <span
              key={`bb-${idx}`}
              className={classList.join(' ')}
              style={Object.keys(inlineStyle).length > 0 ? inlineStyle : undefined}
            >
              {token}
            </span>
          );
        } else {
          elements.push(
            <React.Fragment key={`bb-${idx}`}>
              {token}
            </React.Fragment>
          );
        }
      }
    });

    return elements;
  };

  return (
    <span className={`inline ${className}`}>
      {renderParsedBBCode(text)}
    </span>
  );
};
