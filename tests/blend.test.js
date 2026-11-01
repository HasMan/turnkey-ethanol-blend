"use strict";
const assert = require('node:assert/strict');
const {mixToFull} = require('../apps/ethanol_mix/blend');
function approx(a,b,tol=1e-8) {assert.ok(Math.abs(a-b)<tol, `${a} != ${b}`);}
{const r=mixToFull({capacity:17.2,levelPct:50,currentE:43,lowE:10,highE:85,targetE:45});
assert.equal(r.ok,true); approx(r.addHigh,4.242666666666667); approx(r.addLow,4.357333333333333); approx(r.achieved,45);}
{const r=mixToFull({capacity:17.2,levelPct:86.66666666666667,currentE:43,lowE:10,highE:85,targetE:45});
assert.equal(r.ok,true); approx(r.addHigh,1.4677333333333336); approx(r.addLow,0.8255999999999977);}
{const r=mixToFull({capacity:17.2,levelPct:100,currentE:43,lowE:10,highE:85,targetE:43});
assert.equal(r.ok,true); approx(r.addLow,0); approx(r.addHigh,0);}
{const r=mixToFull({capacity:17.2,levelPct:100,currentE:43,lowE:10,highE:85,targetE:50});
assert.equal(r.ok,false);}
{const r=mixToFull({capacity:17.2,levelPct:98,currentE:43,lowE:10,highE:85,targetE:75});
assert.equal(r.ok,false);}
{const r=mixToFull({capacity:17.2,levelPct:40,currentE:43,lowE:85,highE:10,targetE:45});
assert.equal(r.ok,false);}
console.log('blend.test.js: all checks passed');
