import { InjectIntoHtml, InjectLocation, MiddlewareData } from "ctm-cf-worker-router-core";


const script ="<script src = https://cdn.optimizely.com/js/25653730077.js defer></script>";


/*Injects Optimizely script to enable A/B Testing*/
export async function InjectOptimizelyScripts(data: MiddlewareData): Promise<Response> {
  return InjectIntoHtml(data.response, script, InjectLocation.HeadEnd);
}