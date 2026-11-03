'use strict';
// BMW SOME/IP vehicle schema identifies fluidLevelFuelTank (UInt8), but gives
// no engineering units / conversion. raw60 is a ONE-POINT hypothesis only.
const LITRES_PER_US_GALLON = 3.785411784;
function decodeFuel(raw, capacityGallons, scale) {
    const n=Number(raw), cap=Number(capacityGallons);
    if(raw===null||raw===undefined||!Number.isInteger(n)||n<0||n>=254)
      return {ok:false,reason:'BMW fuel signal missing or invalid'};
    if(!Number.isFinite(cap)||cap<=0)
      return {ok:false,reason:'Invalid tank capacity'};
    const pct=scale==='raw60'? n/60*100 :
              scale==='litres'? n/(cap*LITRES_PER_US_GALLON)*100 :
              scale==='percent'? n : scale==='half'?n/2:NaN;
    if(!Number.isFinite(pct)) return {ok:false,reason:'Unknown KOMBI conversion'};
    // Rather than clamp a grossly invalid signal, ask user to switch to manual.
    if(pct<0||pct>100.5) return {ok:false,reason:'BMW fuel reading out of range for chosen scale'};
    const percentage=Math.min(100,pct);
    return {ok:true, percent:percentage, raw:n, gallons:cap*percentage/100,
      liters:cap*LITRES_PER_US_GALLON*percentage/100, provisional:true, scale};
}
module.exports={decodeFuel,LITRES_PER_US_GALLON};
