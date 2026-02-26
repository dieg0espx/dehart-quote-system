import { createClient } from '@vercel/edge-config';

if (!process.env.EDGE_CONFIG) {
  throw new Error('EDGE_CONFIG environment variable is not set');
}

export const edgeConfig = createClient(process.env.EDGE_CONFIG);

// Helper functions
export async function getConfig<T>(key: string): Promise<T | undefined> {
  return await edgeConfig.get<T>(key);
}

export async function getAllConfig(): Promise<Record<string, any>> {
  return await edgeConfig.getAll();
}

export async function hasConfig(key: string): Promise<boolean> {
  return await edgeConfig.has(key);
}
