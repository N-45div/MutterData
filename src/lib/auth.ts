import { betterAuth } from "better-auth";

export const auth = betterAuth({
  // Using memory adapter for now - user sync handled separately
  baseURL: process.env.NODE_ENV === "production" 
    ? "https://mutterdata.com"
    : "http://localhost:3000",
  trustedOrigins: [
    "http://localhost:3000",
    "https://dynamic-llama-988.convex.site",
    "https://mutterdata.com",
    "https://mutterdata-q019v8ell-n45divs-projects.vercel.app"
  ],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      redirectURI: process.env.NODE_ENV === "production"
        ? "https://mutterdata.com/api/auth/callback/google"
        : "http://localhost:3000/api/auth/callback/google",
      prompt: "select_account",
      accessType: "offline",
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});
