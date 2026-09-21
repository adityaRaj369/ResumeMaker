import { signIn } from "next-auth/react";

export function safeCallback(url: string | null | undefined, fallback = "/gallery") {
  if (!url || !url.startsWith("/") || url.startsWith("//")) return fallback;
  return url;
}

/**
 * Starts the only auth method that is actually configured. Calling `signIn("demo")`
 * when the demo provider is off looks like a successful click and then fails.
 */
export function startSignIn(options: {
  googleConfigured: boolean;
  demoConfigured: boolean;
  callbackUrl?: string;
}) {
  const callbackUrl = safeCallback(options.callbackUrl);
  if (options.googleConfigured) return signIn("google", { callbackUrl });
  if (options.demoConfigured) return signIn("demo", { callbackUrl });
  return Promise.resolve();
}

export function canSignIn(googleConfigured: boolean, demoConfigured: boolean) {
  return googleConfigured || demoConfigured;
}
