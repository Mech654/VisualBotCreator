declare module 'vm2' {
  export interface VMOptions {
    timeout?: number;
    sandbox?: Record<string, unknown>;
    compiler?: string;
    eval?: boolean;
    wasm?: boolean;
    allowAsync?: boolean;
    fixAsync?: boolean;
  }

  export class VM {
    constructor(options?: VMOptions);
    run(code: string): unknown;
    freeze(object: unknown, name: string): void;
    protect(object: unknown, name: string): void;
    readonly context: Record<string, unknown>;
  }

  export interface NodeVMOptions {
    console?: 'inherit' | 'redirect' | 'off';
    sandbox?: Record<string, unknown>;
    require?:
      | boolean
      | {
          external?: boolean | string[];
          builtin?: string[];
          root?: string;
          mock?: Record<string, unknown>;
        };
    wrapper?: string;
    sourceExtensions?: string[];
    compiler?: string;
    strict?: boolean;
  }

  export class NodeVM {
    constructor(options?: NodeVMOptions);
    run(code: string, filepath?: string): unknown;
    freeze(object: unknown, name: string): void;
    protect(object: unknown, name: string): void;
    readonly exports: Record<string, unknown>;
    readonly context: Record<string, unknown>;
  }
}
