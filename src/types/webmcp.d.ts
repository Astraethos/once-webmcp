export type NativeTool = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
  execute: (input: unknown, options?: { signal: AbortSignal }) => unknown;
};

export type NativeModelContext = {
  registerTool(tool: NativeTool, options?: { signal: AbortSignal }): Promise<void>;
};

declare global {
  interface Document {
    readonly modelContext?: NativeModelContext;
  }
}
