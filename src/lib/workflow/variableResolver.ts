export class VariableResolverService {
  public resolveTemplate(
    templateStr: string,
    context: {
      trigger?: Record<string, any>;
      nodes?: Record<string, { output?: Record<string, any> }>;
      [key: string]: any;
    }
  ): any {
    if (typeof templateStr !== 'string') return templateStr;

    // Direct exact match like "{{trigger.value}}"
    const exactMatch = templateStr.match(/^\{\{([\w.]+)\}\}$/);
    if (exactMatch) {
      return this.getValueFromPath(exactMatch[1], context);
    }

    // String interpolation like "Hello {{trigger.client}}"
    return templateStr.replace(/\{\{([\w.]+)\}\}/g, (_, path) => {
      const val = this.getValueFromPath(path, context);
      return val !== undefined && val !== null ? String(val) : '';
    });
  }

  public resolveConfig<T extends Record<string, any>>(
    config: T,
    context: Record<string, any>
  ): T {
    const resolved: Record<string, any> = {};
    for (const [key, value] of Object.entries(config)) {
      if (typeof value === 'string') {
        resolved[key] = this.resolveTemplate(value, context);
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        resolved[key] = this.resolveConfig(value, context);
      } else {
        resolved[key] = value;
      }
    }
    return resolved as T;
  }

  private getValueFromPath(path: string, obj: any): any {
    const parts = path.split('.');
    let curr = obj;

    for (const part of parts) {
      if (curr === undefined || curr === null) return undefined;
      curr = curr[part];
    }
    return curr;
  }
}

export const variableResolver = new VariableResolverService();
