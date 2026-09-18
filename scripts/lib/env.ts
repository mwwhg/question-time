// The only reader of process.env. Values never reach logs, argv or committed files.

export type SecretName = "TYPESAFE_API_KEY" | "ANTHROPIC_API_KEY";

export function secret(name: SecretName): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set. Add it to .env (git-ignored).`);
  return value;
}
