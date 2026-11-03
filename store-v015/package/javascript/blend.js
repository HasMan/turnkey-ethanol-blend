'use strict';
// Deterministic fuel-mixing calculations. All fractions refer to ethanol by volume.
function isNumber(n) { return typeof n === 'number' && isFinite(n); }
function mixToFull(v) {
    const capacity = Number(v.capacity), levelPct = Number(v.levelPct),
          currentE = Number(v.currentE), lowE = Number(v.lowE),
          highE = Number(v.highE), targetE = Number(v.targetE);
    if (![capacity,levelPct,currentE,lowE,highE,targetE].every(isNumber))
        return {ok:false,reason:'A measurement is unavailable.'};
    if (capacity <= 0 || levelPct < 0 || levelPct > 100 ||
        [currentE,lowE,highE,targetE].some((p) => p < 0 || p > 100))
        return {ok:false,reason:'Please check fuel and ethanol inputs.'};
    if (highE <= lowE) return {ok:false,reason:'E85 ethanol must exceed pump 93 ethanol.'};
    const inTank = capacity * levelPct / 100;
    const free = Math.max(0, capacity - inTank);
    const fraction = (p) => p / 100;
    const minPossible = (inTank * fraction(currentE) + free * fraction(lowE)) / capacity * 100;
    const maxPossible = (inTank * fraction(currentE) + free * fraction(highE)) / capacity * 100;
    const out = {capacity,inTank,free,minPossible,maxPossible,currentE,lowE,highE,targetE};
    if (free < 0.001) {
        if (Math.abs(targetE-currentE)<0.005) return {...out,ok:true,addLow:0,addHigh:0,achieved:currentE};
        return {...out,ok:false,reason:'Tank already full. Drive down fuel first.'};
    }
    const high = (capacity*fraction(targetE) - inTank*fraction(currentE) - free*fraction(lowE)) /
        (fraction(highE)-fraction(lowE));
    const low = free-high;
    if (high < -1e-7 || low < -1e-7) {
        return {...out,ok:false,reason:'Target not possible by filling to full with these fuels.'};
    }
    const addHigh = Math.max(0,Math.min(free,high));
    const addLow = Math.max(0,Math.min(free,low));
    const achieved = (inTank*fraction(currentE) + addLow*fraction(lowE) + addHigh*fraction(highE)) /capacity*100;
    return {...out,ok:true,addLow,addHigh,achieved};
}
module.exports={mixToFull};
