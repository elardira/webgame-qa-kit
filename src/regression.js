/** @param {unknown} value @param {string} [prefix] @param {Record<string, unknown>} [output] @returns {Record<string, unknown>} */
function flatten(value,prefix="",output={}) {
  if (Array.isArray(value)) value.forEach((item,index)=>flatten(item,`${prefix}[${index}]`,output));
  else if (value&&typeof value==="object") Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).forEach(([key,item])=>flatten(item,prefix?`${prefix}.${key}`:key,output));
  else output[prefix]=value;
  return output;
}

/** @param {unknown} before @param {unknown} after @param {{ignore?:string[]}} [options] */
export function compareSnapshots(before,after,options={}) {
  const ignored=new Set(options.ignore||[]),left=flatten(before),right=flatten(after),keys=[...new Set([...Object.keys(left),...Object.keys(right)])].sort();
  const changes=keys.filter(key=>!ignored.has(key)&&!Object.is(left[key],right[key])).map(key=>({path:key,before:left[key],after:right[key]}));
  return {pass:changes.length===0,changes};
}

/** @param {import("playwright").Page} page @param {string[]} selectors */
export async function captureDomSnapshot(page,selectors) {
  return page.evaluate(items=>Object.fromEntries(items.map(selector=>{
    const element=document.querySelector(selector);
    if (!element) return [selector,null];
    const rect=element.getBoundingClientRect();
    return [selector,{text:(element.textContent||"").replace(/\s+/g," ").trim(),hidden:/** @type {HTMLElement} */(element).hidden,rect:{x:Math.round(rect.x),y:Math.round(rect.y),width:Math.round(rect.width),height:Math.round(rect.height)}}];
  })),selectors);
}
