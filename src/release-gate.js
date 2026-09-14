/** @typedef {{id:string,pass:boolean,evidence?:unknown}} GateCheck */

/** @param {GateCheck[]} checks */
export function evaluateReleaseGate(checks) {
  if (!Array.isArray(checks)||checks.length===0) throw new TypeError("release gate needs at least one check");
  const normalized=checks.map((check,index)=>({id:String(check.id||`check-${index}`),pass:check.pass===true,...(check.evidence===undefined?{}:{evidence:check.evidence})}));
  const failed=normalized.filter(check=>!check.pass);
  return {pass:failed.length===0,total:normalized.length,passed:normalized.length-failed.length,failed:failed.length,checks:normalized};
}
