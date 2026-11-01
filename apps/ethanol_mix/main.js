 'use strict';
/** TurnKey E Blend 0.1.6. M Vitals-style pages and read-only auto diagnostics while the app is displayed, including when driving.
 * DME 0x12: OBD mode 01 PID 2F => 41 2F xx, % = xx/255*100
 * S58-specific ethanol RAM read: 23 14 B0 00 60 D2 01 => 63 xx, xx = ethanol %
 * Both worked on this X3M over independent Windows ENET; MGU TASU still vehicle-test pending.
 * READ-ONLY. No diagnostic session modification, security bypass, or CAN transmit injection.
 */
const mgu=require('./kit/mgu');
const {Diag,NRC,hex}=require('./kit/diag');
const sig=require('./kit/signals');
const G=require('./kit/gauges');
const {withAlpha}=require('./kit/canvas');
const {mixToFull}=require('./blend');
const {decodeFuelPid2F}=require('./fuel_obd');
const W=1600,H=520,DME=0x12,ETH_MEM=[0x14,0xB0,0x00,0x60,0xD2,0x01];
const PAGES=['Blend','Fuel inputs','Live readings','Sources'];
const FIELDS={1:['targetE','lowE','highE','capacity'],3:['fuelMode','ethanolMode','manualFuel','manualE']};
const YELLOW='#FFD338';
const FIELD_LABEL={targetE:'Target ethanol',lowE:'93 octane ethanol',highE:'E85 ethanol',capacity:'Tank capacity',fuelMode:'Fuel source',ethanolMode:'Ethanol source',manualFuel:'Manual fuel',manualE:'Manual ethanol'};
const READ_INTERVAL=1000,FAIL_INTERVAL=10000,MAX_AGE=15000;
const fmt=(v,n=1)=>v==null?'--':Number(v).toFixed(n);
const num=(n)=>typeof n==='number'&&Number.isFinite(n);
const bytes=(a)=>(a||[]).map(hex).join(' ');
const trim=(s,n)=>String(s||'').slice(0,n);
const valid=(x)=>num(x)&&x>=0&&x<=100;
function getField(v,name,depth){
    if(!v||typeof v!=='object'||depth>4)return null;
    if(Object.prototype.hasOwnProperty.call(v,name))return v[name];
    for(const k of ['value','data','statusRangeTankStatus']) {
        if(v[k]&&typeof v[k]==='object'){const r=getField(v[k],name,depth+1);if(r!==null)return r;}
    }
    return null;
}
function cap(s,n=55){return String(s||'').slice(0,n);}
function label(cv,x,y,s,t,size=23){cv.text(s,x,y,size,t.dim,{font:'bold'});}
function value(cv,x,y,s,t,size=58,c){cv.text(String(s),x,y,size,c||t.text,{font:'num'});}
function panel(cv,t,x,y,w,h,title){G.panel(cv,t,x,y,w,h,title);}
function subline(cv,x,y,s,t,size=19){cv.text(String(s),x,y,size,t.dim);}
function marker(cv,t,x,y,w,h){cv.strokeRoundRect(x,y,w,h,9,4,YELLOW);}
function banner(cv,t,str,c){cv.roundRect(22,469,1556,38,6,withAlpha('#ffffff',.04));cv.text(str,38,495,19,c||t.dim);}
mgu.run({
 async start(ctx){
    const {ui,settings,log,signals}=ctx;
    let page=0,diag=null,busy=false,editor=null,selectField=false,fieldIndex=0;
    let vehicleSpeed=null,rawKombi=null,kombiAt=0,kombiSamples=0;
    let eth=null,ethAt=0,ethStatus='Waiting for first automatic read';
    let fuel=null,fuelRaw=null,fuelAt=0,fuelStatus='Waiting for first automatic read',fuelSamples=0,fuelChanges=0,fuelChangeAt=0;
    let attemptedAt=0,nextReadAt=Date.now()+500,failCount=0,lastSampleLog=0;
    let lastLinkError='';
    const fuelPct=()=>{
        if(settings.get('fuelMode')==='kombi'){
            const ok=num(rawKombi)&&rawKombi>=0&&rawKombi<=60&&kombiAt>0&&Date.now()-kombiAt<90000;
            return ok?{safe:true,value:rawKombi/60*100,label:'KOMBI 0-60 (TRIAL)'}:{safe:false,value:null,label:'KOMBI DATA UNAVAILABLE'};
        }
        if(settings.get('fuelMode')==='manual'){
            const n=Number(settings.get('manualFuel'));
            return valid(n)?{safe:true,value:n,label:'MANUAL - ESTIMATE'}:{safe:false,value:null,label:'INVALID MANUAL FUEL'};
        }
        return valid(fuel)&&Date.now()-fuelAt<MAX_AGE?{safe:true,value:fuel,label:'DME PID 2F'}:{safe:false,value:null,label:'NO FRESH DME FUEL'};
    };
    const ethanolPct=()=>{
        if(settings.get('ethanolMode')==='manual'){
            const n=Number(settings.get('manualE'));
            return valid(n)?{safe:true,value:n,label:'MANUAL - ESTIMATE'}:{safe:false,value:null,label:'INVALID MANUAL ETHANOL'};
        }
        return valid(eth)&&Date.now()-ethAt<MAX_AGE?{safe:true,value:eth,label:'DME ETHANOL RAM'}:{safe:false,value:null,label:'NO FRESH DME ETHANOL'};
    };
    async function readDme(){
        if(busy)return;
        const wantFuel=settings.get('fuelMode')==='auto';
        const wantEth=settings.get('ethanolMode')!=='manual';
        if(!wantFuel&&!wantEth){nextReadAt=Date.now()+READ_INTERVAL;return;}
        busy=true;attemptedAt=Date.now();nextReadAt=attemptedAt+READ_INTERVAL;
        let bad=0;
        try{
            if(!diag){diag=new Diag(signals,log);await diag.init();}
            if(!diag.p)throw Error('TASU unavailable: '+(diag.error||'no diagnostic proxy'));
            if(wantFuel){
                fuelStatus='Reading PID 2F...';
                try{
                    const accept=r=>r&&((r[0]===0x41&&r[1]===0x2F)||(r[0]===0x7F&&r[1]===0x01));
                    const r=await diag.physical(DME,0x01,[0x2F],6000,accept);
                    if(!r)throw Error('no reply from DME');
                    if(r[0]===0x7F)throw Error('NRC '+hex(r[2])+' '+(NRC[r[2]]||''));
                    const d=decodeFuelPid2F(r);
                    if(!d.ok)throw Error(d.reason);
                    if(fuelRaw!==d.raw){fuelChanges++;fuelChangeAt=Date.now();}
                    fuel=d.percent;fuelRaw=d.raw;fuelAt=Date.now();fuelSamples++;fuelStatus=bytes(r)+' = '+fmt(fuel,2)+'%';
                    if(Date.now()-lastSampleLog>60000)log.info('PID2F: '+fuelStatus);
                }catch(e){bad++;fuelStatus=trim(e.message||e,76);log.warn('auto fuel read: '+fuelStatus);}
            }
            if(wantEth){
                ethStatus='Reading ethanol RAM...';
                try{
                    const accept=r=>r&&((r[0]===0x63)||(r[0]===0x7F&&r[1]===0x23));
                    const r=await diag.physical(DME,0x23,ETH_MEM,6000,accept);
                    if(!r)throw Error('no reply from DME');
                    if(r[0]===0x7F)throw Error('NRC '+hex(r[2])+' '+(NRC[r[2]]||''));
                    if(r.length!==2||r[0]!==0x63||r[1]>100)throw Error('invalid ethanol response');
                    eth=r[1];ethAt=Date.now();ethStatus=bytes(r)+' = E'+eth+'%';
                    if(Date.now()-lastSampleLog>60000){log.info('ethanol: '+ethStatus);lastSampleLog=Date.now();}
                }catch(e){bad++;ethStatus=trim(e.message||e,76);log.warn('auto ethanol read: '+ethStatus);}
            }
        }catch(e){
            bad=2;lastLinkError=trim(e.message||e,100);
            if(wantFuel)fuelStatus=lastLinkError;
            if(wantEth)ethStatus=lastLinkError;
            log.warn('auto DME diagnostics: '+lastLinkError);
        }finally{
            failCount=bad?Math.min(4,failCount+1):0;
            nextReadAt=bad?Date.now()+FAIL_INTERVAL:Math.max(attemptedAt+READ_INTERVAL,Date.now()+250);
            busy=false;
        }
    }
    function setPage(n){editor=null;selectField=false;page=(n+PAGES.length)%PAGES.length;return render();}
    const inputBounds=[[18,48,770,204],[808,48,770,204],[18,265,770,204],[808,265,770,204]];
    const inBox=(x,y,box)=>x>=box[0]&&x<box[0]+box[2]&&y>=box[1]&&y<box[1]+box[3];
    function beginEdit(key){
        // Inputs are intentionally not editable while moving. Monitoring continues normally.
        if(num(vehicleSpeed)&&vehicleSpeed>2){log.info('edit blocked because vehicle is moving');return;}
        const item=settings.item(key);if(!item)return;
        editor={key,kind:item.type==='choice'?'choice':'number',draft:'',error:'',cursor:0};selectField=false;
        return render();
    }
    const NUM_KEYS=['1','2','3','4','5','6','7','8','9','0','.','DEL','CANCEL','SAVE'];
    function keysForEditor(){
        if(!editor)return [];
        if(editor.kind==='choice')return editor.key==='fuelMode'?['DME','MANUAL','KOMBI','CANCEL']:['DME','MANUAL','CANCEL'];
        return NUM_KEYS;
    }
    function navigate(delta){
        if(editor){const k=keysForEditor();editor.cursor=(editor.cursor+delta+k.length)%k.length;return render();}
        if(selectField){fieldIndex=(fieldIndex+delta+5)%5;return render();}
        return setPage(page+delta);
    }
    function editOrSelect(){
        if(num(vehicleSpeed)&&vehicleSpeed>2){log.info('input disabled while vehicle moving');return;}
        if(editor){return keypadAction(keysForEditor()[editor.cursor]);}
        if(selectField){selectField=false;return fieldIndex===4?render():beginEdit(FIELDS[page][fieldIndex]);}
        if(page===0){return beginEdit('targetE');}
        if(page===1||page===3){selectField=true;fieldIndex=0;return render();}
        // live readings page: go to inputs and show field selection
        page=1;selectField=true;fieldIndex=0;return render();
    }
    function keypadAction(action){
        if(!editor)return;
        if(action==='CANCEL'){editor=null;return render();}
        if(editor.kind==='choice'){
            if(action==='DME'||action==='MANUAL'||action==='KOMBI'){
                if(editor.key==='fuelMode' || action!=='KOMBI'){
                    settings.set(editor.key,action==='DME'?'auto':action==='KOMBI'?'kombi':'manual');editor=null;
                }
            }
            return render();
        }
        if(action==='SAVE'){
            const s=editor.draft;
            const item=editor.key;
            const range=item==='capacity'?[5,30]:item==='lowE'?[0,30]:item==='highE'?[40,100]:[0,100];
            const n=Number(s);
            if(!/^\d{1,3}(?:\.\d{1,2})?$/.test(s)||!Number.isFinite(n)||n<range[0]||n>range[1]){
                editor.error='Allowed range: '+range[0]+' to '+range[1];return render();
            }
            settings.set(item,n);editor=null;return render();
        }
        if(action==='DEL')editor.draft=editor.draft.slice(0,-1);
        else if(action==='.'){
            if(editor.draft.indexOf('.')<0)editor.draft=editor.draft?editor.draft+'.':'0.';
        }else if(/^\d$/.test(action)&&editor.draft.length<7){
            editor.draft+=action;
        }
        editor.error='';return render();
    }
    // Incoming canvas touch coordinates are routed by the installed GPU renderer.
    // Hardware HMI bar buttons remain the primary control when touch routing is unavailable.
    ctx.onTouch((x,y)=>{
        log.info('canvas touch: '+Math.round(x)+','+Math.round(y));
        if(editor){
            if(editor.kind==='choice'){
                if(inBox(x,y,[375,210,240,100])|| (editor.key!=='fuelMode'&&inBox(x,y,[470,210,305,100])))return keypadAction('DME');
                if(inBox(x,y,[680,210,240,100])|| (editor.key!=='fuelMode'&&inBox(x,y,[825,210,305,100])))return keypadAction('MANUAL');
                if(editor.key==='fuelMode'&&inBox(x,y,[985,210,240,100]))return keypadAction('KOMBI');
                if(inBox(x,y,[610,352,380,67]))return keypadAction('CANCEL');
            }else{
                const grid=[['1','2','3'],['4','5','6'],['7','8','9'],['0','.','DEL']];
                for(let r=0;r<4;r++)for(let c=0;c<3;c++){
                    if(inBox(x,y,[654+c*174,112+r*85,157,74]))return keypadAction(grid[r][c]);
                }
                if(inBox(x,y,[388,333,207,54]))return keypadAction('CANCEL');
                if(inBox(x,y,[388,401,207,54]))return keypadAction('SAVE');
            }
            return;
        }
        if(page===0&&inBox(x,y,[1026,48,556,147]))return beginEdit('targetE');
        const fields=FIELDS[page];if(!fields)return;
        for(let i=0;i<inputBounds.length;i++)if(inBox(x,y,inputBounds[i]))return beginEdit(fields[i]);
    });
    function drawEditor(cv,t){
        if(selectField&&!editor){
            if(fieldIndex<4){
                const b=inputBounds[fieldIndex];
                marker(cv,t,b[0]+3,b[1]+3,b[2]-6,b[3]-6);
            }
            cv.roundRect(220,470,1160,39,7,'#28210a');
            cv.text(fieldIndex===4?'CANCEL EDITING - PRESS EDIT / OK':'PREVIOUS / NEXT: CHOOSE FIELD     EDIT / OK: OPEN KEYPAD',800,495,22,YELLOW,{font:'bold',align:'center'});
            return;
        }
        if(!editor)return;
        cv.fillRect(0,0,W,H,withAlpha('#000000',.84));
        if(editor.kind==='choice'){
            cv.roundRect(315,104,970,340,17,'#171b22');
            cv.strokeRoundRect(315,104,970,340,17,2,withAlpha('#ffffff',.3));
            G.stripes(cv,t,345,119,900);
            cv.text(FIELD_LABEL[editor.key],345,168,38,t.text,{font:'bold'});
            const opt=editor.key==='fuelMode'?[['DME',375,210],['MANUAL',680,210],['KOMBI',985,210]]:[['DME',470,210],['MANUAL',825,210]];
            for(const [name,x,y] of opt){
                const ww=editor.key==='fuelMode'?240:305;
                cv.roundRect(x,y,ww,100,10,withAlpha('#ffffff',.1));
                cv.strokeRoundRect(x,y,ww,100,10,editor.cursor===opt.findIndex(o=>o[0]===name)?5:2,editor.cursor===opt.findIndex(o=>o[0]===name)?YELLOW:withAlpha('#ffffff',.3));
                cv.text(name,x+ww/2,y+61,37,t.text,{font:'bold',align:'center'});
            }
            cv.roundRect(610,352,380,67,8,withAlpha('#ffffff',.1));
            cv.text('CANCEL',800,397,30,editor.cursor===opt.length?YELLOW:t.text,{font:'bold',align:'center'});
            if(editor.cursor===opt.length)cv.strokeRoundRect(608,350,384,71,8,4,YELLOW);
        }else{
            cv.roundRect(360,55,880,415,17,'#171b22');
            cv.strokeRoundRect(360,55,880,415,17,2,withAlpha('#ffffff',.35));
            G.stripes(cv,t,380,68,836);
            cv.text(FIELD_LABEL[editor.key],390,118,32,t.text,{font:'bold'});
            cv.text(editor.draft||'Enter value',392,213,editor.draft?66:36,editor.draft?YELLOW:t.dim,{font:editor.draft?'num':'label'});
            cv.text(editor.key==='capacity'?'US gallons':'Ethanol percent (%)',390,255,24,t.dim);
            if(editor.error)cv.text(editor.error,390,296,22,t.warn);
            cv.roundRect(388,333,207,54,8,withAlpha('#ffffff',.12));
            cv.text('CANCEL',491,370,24,t.text,{font:'bold',align:'center'});
            cv.roundRect(388,401,207,54,8,YELLOW);
            cv.text('SAVE',491,438,25,'#111111',{font:'bold',align:'center'});
            if(editor.cursor===12)cv.strokeRoundRect(386,331,211,58,8,5,YELLOW);
            if(editor.cursor===13)cv.strokeRoundRect(386,399,211,58,8,5,'#ffffff');
            const grid=[['1','2','3'],['4','5','6'],['7','8','9'],['0','.','DEL']];
            for(let r=0;r<4;r++)for(let c=0;c<3;c++){
                const x=654+c*174,y=112+r*85,k=grid[r][c];
                cv.roundRect(x,y,157,74,9,withAlpha('#ffffff',.12));
                cv.strokeRoundRect(x,y,157,74,9,editor.cursor===r*3+c?5:1,editor.cursor===r*3+c?YELLOW:withAlpha('#ffffff',.18));
                cv.text(k,x+79,y+49,k==='DEL'?24:36,t.text,{font:'bold',align:'center'});
            }
        }
        cv.text('PREVIOUS / NEXT: HIGHLIGHT     EDIT / OK: SELECT',800,494,19,YELLOW,{font:'bold',align:'center'});
    }
    sig.watch('de.bmw.infotainment.vehicle.Vehicle2','1',{
        statusCarSpeed2:v=>{
            const f=getField(v,'speedVehicleCentreOfGravity',0),raw=Number(f);
            if(f!==null&&Number.isInteger(raw)&&raw>=0&&raw<65535){
                vehicleSpeed=raw*0.015625;
            }
        }
    },log).then(r=>{if(r.error)log.warn('Vehicle2: '+r.error);});
    sig.watch('de.bmw.infotainment.KombiIF','1',{
        statusRangeTankStatus:v=>{
            const f=getField(v,'fluidLevelFuelTank',0),n=Number(f);
            if(f!==null&&Number.isInteger(n)&&n>=0&&n<=4095){rawKombi=n;kombiAt=Date.now();kombiSamples++;}
        }
    },log,{pollMs:30000}).then(r=>{if(r.error)log.warn('KombiIF: '+r.error);});
    ui.onClick('BTN_PAGE',()=>navigate(1));
    ui.onClick('BTN_PREV',()=>navigate(-1));
    ui.onClick('BTN_EDIT',()=>editOrSelect());
    ctx.onTab(i=>{if(!editor&&!selectField&&i>=0&&i<PAGES.length)return setPage(i);});
    settings.onChange((key)=>{
        if(key==='fuelMode'||key==='ethanolMode')nextReadAt=Date.now()+350;
    });
    ui.onVisible((name,visible)=>{
        if(name==='MAIN'&&visible)nextReadAt=Math.min(nextReadAt,Date.now()+500);
    });
    function drawBlend(cv,t){
        const f=fuelPct(),e=ethanolPct(),capacity=Number(settings.get('capacity'));
        const b=f.safe&&e.safe?mixToFull({capacity,levelPct:f.value,currentE:e.value,lowE:Number(settings.get('lowE')),
            highE:Number(settings.get('highE')),targetE:Number(settings.get('targetE'))}):
            {ok:false,reason:'Waiting for live DME readings. You can use manual sources.'};
        panel(cv,t,18,48,490,147,'Ethanol now');
        value(cv,40,147,e.safe?'E'+fmt(e.value,0)+'%':'--',t,70,e.safe?t.text:t.warn);
        subline(cv,285,151,e.label,t,19);
        panel(cv,t,522,48,490,147,'Fuel in tank');
        value(cv,545,147,f.safe?fmt(f.value,1)+'%':'--',t,70,f.safe?t.text:t.warn);
        subline(cv,785,151,f.label,t,19);
        panel(cv,t,1026,48,556,147,'Desired blend');
        value(cv,1048,145,'E'+settings.get('targetE'),t,70,YELLOW);
        subline(cv,1243,148,fmt(capacity,1)+' gal tank',t,23);
        panel(cv,t,18,209,770,249,'Add 93 octane');
        panel(cv,t,800,209,782,249,'Add E85');
        if(b.ok){
            value(cv,44,345,fmt(b.addLow,2),t,96);
            cv.text('gallons',370,340,30,t.dim);
            value(cv,827,345,fmt(b.addHigh,2),t,96,YELLOW);
            cv.text('gallons',1160,340,30,t.dim);
            cv.text('E'+settings.get('lowE')+'  |  '+fmt(b.free,2)+' gal total available',44,395,24,t.dim);
            cv.text('E'+settings.get('highE')+'  |  predicted E'+fmt(b.achieved,1),827,395,24,t.dim);
        }else{
            cv.text('NO FILL PLAN',44,332,54,t.warn,{font:'bold'});
            cv.text('CHECK INPUTS',827,332,54,t.warn,{font:'bold'});
            cv.text(cap(b.reason,82),44,396,23,t.dim);
            if(num(b.minPossible)&&num(b.maxPossible))
                cv.text('Achievable: E'+fmt(b.minPossible,1)+' - E'+fmt(b.maxPossible,1),827,396,24,t.dim);
        }
        banner(cv,t,'PRESS EDIT / OK TO CHANGE DESIRED BLEND  |  MIX QUANTITIES ARE ESTIMATES',t.dim);
    }
    function drawInputs(cv,t){
        const fields=FIELDS[1],xy=[[18,48],[808,48],[18,265],[808,265]],w=770,h=204;
        fields.forEach((k,i)=>{
            const [x,y]=xy[i];panel(cv,t,x,y,w,h,FIELD_LABEL[k]);
            const v=Number(settings.get(k)),shown=k==='capacity'?fmt(v,1):fmt(v,0)+'%';
            value(cv,x+30,y+143,shown,t,75,k==='targetE'?YELLOW:t.text);
            if(k==='capacity')subline(cv,x+208,y+144,'US gal',t,25);
            cv.text('EDIT / OK TO CHANGE',x+w-32,y+57,18,YELLOW,{align:'right',font:'bold'});
            cv.text(k==='capacity'?'X3M default 17.2 US gal':k==='targetE'?'Set desired final ethanol':k==='lowE'?'Premium gasoline ethanol %':'E85 dispenser actual ethanol %',x+350,y+160,23,t.dim);
        });
        banner(cv,t,'PRESS EDIT / OK TO SELECT AN INPUT, THEN TYPE DIGITS USING CONTROLLER',t.dim);
    }
    function drawLive(cv,t){
        const f=fuelPct(),e=ethanolPct();
        panel(cv,t,18,48,770,192,'Live ethanol (DME RAM)');
        value(cv,44,167,e.safe?'E'+fmt(e.value,0)+'%':'--',t,78,e.safe?t.text:t.warn);
        subline(cv,387,160,settings.get('ethanolMode')==='manual'?'Manual source selected':cap(ethStatus,31),t,19);
        subline(cv,387,189,ethAt?'Last valid: '+Math.round((Date.now()-ethAt)/1000)+'s ago':'No valid DME value yet',t,17);
        panel(cv,t,800,48,782,192,'Live tank level (selected source)');
        value(cv,826,167,f.safe?fmt(f.value,2)+'%':'--',t,76,f.safe?t.text:t.warn);
        subline(cv,1178,160,settings.get('fuelMode')==='manual'?'Manual source':settings.get('fuelMode')==='kombi'?'KOMBI raw '+(rawKombi===null?'--':rawKombi):'PID raw 0x'+(fuelRaw==null?'--':hex(fuelRaw)),t,21);
        const seenFuelAt=settings.get('fuelMode')==='kombi'?kombiAt:fuelAt;
        subline(cv,1170,189,seenFuelAt?'Last valid: '+Math.round((Date.now()-seenFuelAt)/1000)+'s ago':'No source reading yet',t,17);
        panel(cv,t,18,255,1564,203,'Diagnostic information');
        label(cv,43,330,'ETHANOL RAW: '+cap(ethStatus,76),t,24);
        label(cv,43,374,'FUEL PID 2F: '+cap(fuelStatus,76),t,24);
        label(cv,43,416,'KOMBI: '+(rawKombi===null?'--':rawKombi)+' / 60 = '+(num(rawKombi)?fmt(rawKombi/60*100,1)+'%':'--')+' (TRIAL)  |  DME SAMPLES: '+fuelSamples+'  |  DME CHANGES: '+fuelChanges+'  |  RAW: '+(fuelRaw===null?'--':'0x'+hex(fuelRaw)),t,21);
        banner(cv,t,'DME READ-ONLY: 1S TARGET, SEQUENTIAL  |  84.71%=DME RAW 0xD8; 86.67%=0xDD');
    }
    function drawSources(cv,t){
        const fields=FIELDS[3],xy=[[18,48],[808,48],[18,265],[808,265]],w=770,h=204;
        fields.forEach((k,i)=>{
            const [x,y]=xy[i];panel(cv,t,x,y,w,h,FIELD_LABEL[k]);
            const s=settings.display(k),show=k==='fuelMode'?(settings.get(k)==='auto'?'DME PID 2F':settings.get(k)==='kombi'?'KOMBI / 60':'Manual'):
                k==='ethanolMode'?(settings.get(k)==='auto'?'DME RAM':'Manual'):
                fmt(Number(settings.get(k)),1)+'%';
            const fontSize=show.length>12?46:68;
            value(cv,x+30,y+145,show,t,fontSize,t.text);
            cv.text('EDIT / OK TO CHANGE',x+w-32,y+57,18,YELLOW,{align:'right',font:'bold'});
            cv.text(k==='manualFuel'?'Only used if fuel source is Manual':k==='manualE'?'Only used if ethanol source is Manual':'Choose live diagnostics or manual fallback',x+37,y+188,21,t.dim);
        });
        banner(cv,t,'EDIT / OK: DME PID2F / KOMBI 0-60 (TRIAL) / MANUAL',t.dim);
    }
    async function render(){
        // If the car starts moving during editing, dismiss the keypad.
        if((editor||selectField)&&num(vehicleSpeed)&&vehicleSpeed>2){editor=null;selectField=false;}
        // Only read when the app is on screen. Do not inhibit reads because the car is moving.
        // No background timer or additional vehicle sessions. Requests are sequential and back off on errors.
        if(ui.isVisible('MAIN')&&ui.hasFocus('MAIN')&&!busy&&Date.now()>=nextReadAt){
            nextReadAt=Date.now()+READ_INTERVAL;
            readDme().catch(e=>log.warn('auto polling error: '+e));
        }
        const t=ctx.theme(),cv=ctx.canvas(W,H).clear(t.bg);
        G.frame(cv,t,PAGES,page,[]);
        G.stripes(cv,t,18,41,1564);
        if(page===0)drawBlend(cv,t);
        else if(page===1)drawInputs(cv,t);
        else if(page===2)drawLive(cv,t);
        else drawSources(cv,t);
        drawEditor(cv,t);
        return ui.image('MAIN_GFX',cv);
    }
    ctx.loop('MAIN',2,render);
    render().catch(e=>log.warn('render: '+e));
    log.info('E Blend 0.1.6: editor on main canvas with hardware HMI buttons; DME/KOMBI/manual fuel, 1s polling');
 }
});
