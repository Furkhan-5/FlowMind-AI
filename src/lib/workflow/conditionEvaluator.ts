import { variableResolver } from './variableResolver';

export class ConditionEvaluatorEngine {
  public evaluateCondition(
    expression: string,
    context: Record<string, any>
  ): boolean {
    if (!expression || !expression.trim()) return true;

    const expr = expression.trim();

    // Check for boolean literal
    if (expr.toLowerCase() === 'true') return true;
    if (expr.toLowerCase() === 'false') return false;

    // Supported operator regex patterns
    const opPatterns: { op: string; regex: RegExp }[] = [
      { op: '>=', regex: /^(.+?)\s*&gt;=\s*(.+)$|^(.+?)\s*>=\s*(.+)$/ },
      { op: '<=', regex: /^(.+?)\s*&lt;=\s*(.+)$|^(.+?)\s*<=\s*(.+)$/ },
      { op: '==', regex: /^(.+?)\s*==\s*(.+)$/ },
      { op: '!=', regex: /^(.+?)\s*!=\s*(.+)$/ },
      { op: '>', regex: /^(.+?)\s*&gt;\s*(.+)$|^(.+?)\s*>\s*(.+)$/ },
      { op: '<', regex: /^(.+?)\s*&lt;\s*(.+)$|^(.+?)\s*<\s*(.+)$/ },
      { op: 'contains', regex: /^(.+?)\s+contains\s+(.+)$/i },
      { op: 'exists', regex: /^(.+?)\s+exists$/i },
    ];

    for (const { op, regex } of opPatterns) {
      const match = expr.match(regex);
      if (match) {
        if (op === 'exists') {
          const leftRaw = match[1].trim();
          const leftVal = variableResolver.resolveTemplate(leftRaw, context);
          return leftVal !== undefined && leftVal !== null && leftVal !== '';
        }

        const leftRaw = (match[1] || match[3]).trim();
        const rightRaw = (match[2] || match[4]).trim();

        const leftVal = variableResolver.resolveTemplate(leftRaw, context);
        let rightVal: any = variableResolver.resolveTemplate(rightRaw, context);

        // Attempt numeric conversion if applicable
        const numLeft = this.parseNumeric(leftVal);
        const numRight = this.parseNumeric(rightRaw);

        if (numLeft !== null && numRight !== null) {
          return this.compareNumbers(numLeft, numRight, op);
        }

        return this.compareStrings(String(leftVal), String(rightVal).replace(/^["']|["']$/g, ''), op);
      }
    }

    // Default fallback: truthy evaluation of path
    const res = variableResolver.resolveTemplate(expr, context);
    return Boolean(res);
  }

  private parseNumeric(val: any): number | null {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const cleaned = val.replace(/[^0-9.-]/g, '');
      if (cleaned && !isNaN(Number(cleaned))) return Number(cleaned);
    }
    return null;
  }

  private compareNumbers(left: number, right: number, op: string): boolean {
    switch (op) {
      case '==': return left === right;
      case '!=': return left !== right;
      case '>': return left > right;
      case '<': return left < right;
      case '>=': return left >= right;
      case '<=': return left <= right;
      default: return false;
    }
  }

  private compareStrings(left: string, right: string, op: string): boolean {
    const l = left.toLowerCase();
    const r = right.toLowerCase();
    switch (op) {
      case '==': return l === r;
      case '!=': return l !== r;
      case 'contains': return l.includes(r);
      default: return l === r;
    }
  }
}

export const conditionEvaluator = new ConditionEvaluatorEngine();
