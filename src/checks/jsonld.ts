export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function collectNodes(
  value: unknown,
  out: Record<string, unknown>[],
): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectNodes(item, out);
    }
    return;
  }
  if (!isRecord(value)) {
    return;
  }
  out.push(value);
  for (const nested of Object.values(value)) {
    collectNodes(nested, out);
  }
}

export function hasType(node: Record<string, unknown>, type: string): boolean {
  const value = node["@type"];
  if (typeof value === "string") {
    return value === type;
  }
  return Array.isArray(value) && value.includes(type);
}

export function hasAnyType(
  node: Record<string, unknown>,
  types: string[],
): boolean {
  return types.some((type) => hasType(node, type));
}
