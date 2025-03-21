declare module "cloudflare:test" {
  import { Environment } from "../src";

  interface ProvidedEnv {
    CF_ACCESS_AUTH_TOKEN: string;
    CF_ACCESS_CLIENT_ID: string;
  }

  interface ProvidedEnv extends Environment {
  }
}