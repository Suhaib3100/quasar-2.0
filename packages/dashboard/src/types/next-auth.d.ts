import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken?: string;
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  interface Profile {
    id: string;
    username: string;
    discriminator: string;
    avatar: string;
    email: string;
  }

  interface Token {
    accessToken?: string;
    id?: string;
  }
}