import path from "node:path";
import { pathToFileURL } from "node:url";

/** @typedef {{name:string,width:number,height:number}} Viewport */
/** @typedef {{name:string,path:string,readySelector?:string}} RouteCheck */
/** @typedef {{name:string,from?:string,selector:string,expectedPath:string,readySelector?:string}} NavigationCheck */
/** @typedef {{baseUrl:string,viewports:Viewport[],routes:RouteCheck[],navigation:NavigationCheck[],cardSelector:string,outputDir:string,browser:{channel?:string,executablePath?:string}}} QaConfig */

export const DEFAULT_VIEWPORTS = Object.freeze([
  Object.freeze({ name:"mobile", width:390, height:844 }),
  Object.freeze({ name:"tablet", width:768, height:1024 }),
  Object.freeze({ name:"desktop", width:1440, height:900 })
]);

/** @param {unknown} value @param {string} label */
function requiredString(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new TypeError(`${label} must be a non-empty string`);
  return value.trim();
}

/** @param {unknown} input @returns {QaConfig} */
export function normalizeConfig(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("config must be an object");
  const raw=/** @type {Record<string, unknown>} */(input);
  const baseUrl=requiredString(raw.baseUrl,"baseUrl").replace(/\/$/,"");
  const parsedBaseUrl=new URL(baseUrl);
  const protocol=parsedBaseUrl.protocol;
  if (!["http:","https:"].includes(protocol)) throw new TypeError("baseUrl must use http or https");
  if (parsedBaseUrl.username || parsedBaseUrl.password) throw new TypeError("baseUrl must not contain credentials");
  const viewports=Array.isArray(raw.viewports)&&raw.viewports.length?raw.viewports:DEFAULT_VIEWPORTS;
  const normalizedViewports=viewports.map((item,index)=>{
    if (!item||typeof item!=="object") throw new TypeError(`viewports[${index}] must be an object`);
    const value=/** @type {Record<string, unknown>} */(item);
    const width=Number(value.width),height=Number(value.height);
    if (!Number.isInteger(width)||!Number.isInteger(height)||width<240||height<240) throw new TypeError(`viewports[${index}] has invalid dimensions`);
    return {name:requiredString(value.name||`viewport-${index}`,`viewports[${index}].name`),width,height};
  });
  if (!Array.isArray(raw.routes)||raw.routes.length===0) throw new TypeError("routes must contain at least one route");
  const routes=raw.routes.map((item,index)=>{
    if (!item||typeof item!=="object") throw new TypeError(`routes[${index}] must be an object`);
    const value=/** @type {Record<string, unknown>} */(item);
    const routePath=requiredString(value.path,`routes[${index}].path`);
    if (!routePath.startsWith("/")) throw new TypeError(`routes[${index}].path must start with /`);
    return {name:requiredString(value.name||routePath,`routes[${index}].name`),path:routePath,...(value.readySelector?{readySelector:requiredString(value.readySelector,`routes[${index}].readySelector`)}:{})};
  });
  const navigation=(Array.isArray(raw.navigation)?raw.navigation:[]).map((item,index)=>{
    if (!item||typeof item!=="object") throw new TypeError(`navigation[${index}] must be an object`);
    const value=/** @type {Record<string, unknown>} */(item);
    const expectedPath=requiredString(value.expectedPath,`navigation[${index}].expectedPath`);
    return {name:requiredString(value.name||`navigation-${index}`,`navigation[${index}].name`),selector:requiredString(value.selector,`navigation[${index}].selector`),expectedPath,...(value.from?{from:requiredString(value.from,`navigation[${index}].from`)}:{}),...(value.readySelector?{readySelector:requiredString(value.readySelector,`navigation[${index}].readySelector`)}:{})};
  });
  const browser=raw.browser&&typeof raw.browser==="object"&&!Array.isArray(raw.browser)?/** @type {Record<string, unknown>} */(raw.browser):{};
  return {baseUrl,viewports:normalizedViewports,routes,navigation,cardSelector:typeof raw.cardSelector==="string"?raw.cardSelector:"[data-qa-card]",outputDir:typeof raw.outputDir==="string"?raw.outputDir:".qa-output",browser:{...(typeof browser.channel==="string"?{channel:browser.channel}:{}),...(typeof browser.executablePath==="string"?{executablePath:browser.executablePath}:{})}};
}

/** @param {string} file @returns {Promise<QaConfig>} */
export async function loadConfig(file) {
  const absolute=path.resolve(file);
  const module=await import(`${pathToFileURL(absolute).href}?t=${Date.now()}`);
  return normalizeConfig(module.default);
}
