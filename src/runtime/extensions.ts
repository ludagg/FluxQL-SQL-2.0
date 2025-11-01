type ExtensionFn = (ast: any, params: any[]) => void;

export const extendRegistry: Record<string, ExtensionFn> = {};

export function extend(name: string, fn: ExtensionFn) {
  extendRegistry[name] = fn;
}
