export const stringToBytes32 = (str: string) => {
  const bytes = new Uint8Array(32);
  const encoded = new TextEncoder().encode(str);
  bytes.set(encoded.slice(0, 32)); // Safely truncate if longer than 32
  return bytes;
};
