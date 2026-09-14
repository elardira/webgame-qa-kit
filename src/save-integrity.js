/** @typedef {{version:number,requiredPaths?:string[],maxBytes?:number}} SaveSchema */

/** @param {unknown} value @returns {value is Record<string, unknown>} */
function isPlainObject(value) {
  return Boolean(value)&&typeof value==="object"&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;
}

/** @param {unknown} value @param {string} dotted @returns {unknown} */
function pathValue(value, dotted) {
  return dotted.split(".").reduce((current,key)=>current&&typeof current==="object"?/** @type {Record<string, unknown>} */(current)[key]:undefined,value);
}

/** @param {unknown} value @param {string} [path] @param {string[]} [issues] @returns {string[]} */
function findInvalidNumbers(value, path="save", issues=[]) {
  if (typeof value==="number"&&!Number.isFinite(value)) issues.push(`${path} contains a non-finite number`);
  else if (Array.isArray(value)) value.forEach((item,index)=>findInvalidNumbers(item,`${path}[${index}]`,issues));
  else if (value&&typeof value==="object") Object.entries(value).forEach(([key,item])=>findInvalidNumbers(item,`${path}.${key}`,issues));
  return issues;
}

/** @param {unknown} value @param {SaveSchema} schema */
export function validateSave(value,schema) {
  const issues=[];
  if (!isPlainObject(value)) return {pass:false,issues:["save must be a plain object"],bytes:0};
  const save=/** @type {Record<string, unknown>} */(value);
  if (!Number.isInteger(save.version)||save.version!==schema.version) issues.push(`version must equal ${schema.version}`);
  for (const required of schema.requiredPaths||[]) if (pathValue(save,required)===undefined) issues.push(`missing required path: ${required}`);
  findInvalidNumbers(save,"save",issues);
  let serialized="";
  try { serialized=JSON.stringify(save); } catch { issues.push("save must be JSON serializable"); }
  const bytes=Buffer.byteLength(serialized,"utf8");
  if (bytes>(schema.maxBytes||1_000_000)) issues.push(`save exceeds ${schema.maxBytes||1_000_000} bytes`);
  return {pass:issues.length===0,issues,bytes};
}

/** @param {unknown} value */
export function roundTripSave(value) {
  const encoded=JSON.stringify(value);
  const decoded=JSON.parse(encoded);
  return {encoded,decoded,stable:JSON.stringify(decoded)===encoded};
}

/** @param {Record<string, unknown>} value @param {number} targetVersion @param {Record<number,(save:Record<string, unknown>)=>Record<string, unknown>>} migrations */
export function migrateSave(value,targetVersion,migrations) {
  if (!isPlainObject(value)) throw new TypeError("save must be a plain object");
  let current=structuredClone(value);
  let version=Number(current.version);
  if (!Number.isInteger(version)||version<1||version>targetVersion) throw new Error("unsupported source version");
  const applied=[];
  while (version<targetVersion) {
    const next=version+1,migrate=migrations[next];
    if (typeof migrate!=="function") throw new Error(`missing migration ${version} -> ${next}`);
    current=migrate(structuredClone(current));
    current.version=next;
    version=next;
    applied.push(next);
  }
  return {save:current,applied};
}
