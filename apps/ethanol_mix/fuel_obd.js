'use strict';
/** ISO 15031 / SAE J1979 Mode 01 PID 2F: Fuel Tank Level Input.
    positive response: 41 2F A; fuel percent = 100*A/255.
    Note that this is a sensor estimate, not a guaranteed pump-fill volume.
*/
function decodeFuelPid2F(uds) {
    if (!uds || !Array.isArray(uds) || uds.length !== 3 || uds[0] !== 0x41 || uds[1] !== 0x2F) {
        return {ok:false, reason:'Unexpected DME response (expected 41 2F A)'};
    }
    const raw=uds[2];
    if (!Number.isInteger(raw) || raw < 0 || raw > 255) {
        return {ok:false, reason:'Invalid PID 2F byte'};
    }
    return {ok:true, raw, percent:raw*100/255};
}
module.exports={decodeFuelPid2F};
