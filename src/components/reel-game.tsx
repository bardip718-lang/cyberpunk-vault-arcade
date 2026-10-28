import { useEffect, useRef, useState } from 'react';
import { Minus, Plus, RotateCcw, Volume2, VolumeX, Gem, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { evaluateSlot, pickSlotSymbol, type SlotSymbol } from '@/lib/slot-engine';

const initial: SlotSymbol[][] = [['ruby','wild','A'],['emerald','ruby','K'],['sapphire','emerald','wild'],['wild','sapphire','Q'],['ruby','K','emerald']];
function Tile({symbol, glow=false, neon=false}:{symbol:SlotSymbol;glow?:boolean;neon?:boolean}) {
 const image=['ruby','emerald','sapphire','wild'].includes(symbol);
 return <div className={`slot-tile ${glow?'slot-hit':''}`} data-symbol={symbol}>
 {image ? <img src={`/assets/${symbol==='wild'?'garuda-wild':symbol}.webp`} alt={symbol==='wild'?(neon?'Neon WILD':'Garuda WILD'):`${symbol} gem`} width={180} height={180} draggable={false}/> : <span className="slot-letter">{symbol}</span>}
 {symbol==='wild' && <span className="slot-wild-label">WILD</span>}
 </div>;
}
export function ReelGame({theme='garuda'}:{theme?:'garuda'|'neon'}) {
 const [balance,setBalance]=useState(2000),[bet,setBet]=useState(30),[win,setWin]=useState(0);
 const [grid,setGrid]=useState(initial),[strips,setStrips]=useState(initial),[spinning,setSpinning]=useState(false),[stopped,setStopped]=useState([true,true,true,true,true]);
 const [cells,setCells]=useState<string[]>([]),[sound,setSound]=useState(true),[round,setRound]=useState(0),[displayWin,setDisplayWin]=useState(0);
 const busy=useRef(false),timers=useRef<ReturnType<typeof setTimeout>[]>([]),audio=useRef<AudioContext|null>(null);
 const stopReel=useRef<((column:number)=>void)|null>(null);
 const clear=()=>{timers.current.forEach(clearTimeout);timers.current=[];};
 useEffect(()=>()=>{clear();stopReel.current=null;busy.current=false;void audio.current?.close();},[]);
 useEffect(()=>{if(!win){setDisplayWin(0);return;} let frame=0;const start=performance.now();const update=(now:number)=>{const progress=Math.min(1,(now-start)/700);setDisplayWin(Math.round(win*progress));if(progress<1)frame=requestAnimationFrame(update);};frame=requestAnimationFrame(update);return()=>cancelAnimationFrame(frame);},[win]);
 function tone(freq:number){if(!sound)return;try{audio.current??=new AudioContext();const ctx=audio.current;void ctx.resume();const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='triangle';osc.frequency.value=freq;gain.gain.setValueAtTime(.055,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.15);osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.15);}catch{}}
 function spin(){
  if(busy.current||balance<bet)return;busy.current=true;clear();const stake=bet;const final=Array.from({length:5},()=>Array.from({length:3},()=>pickSlotSymbol()));
  const running=final.map((col,i)=>[...(grid[i]??col),...Array.from({length:24+i*3},()=>pickSlotSymbol()),...col]);
  setStrips(running);setRound(r=>r+1);setStopped([false,false,false,false,false]);setSpinning(true);setWin(0);setCells([]);setBalance(b=>b-stake);tone(220);
  const completed=new Set<number>();
  const settle=()=>{
   if(!busy.current)return;
   busy.current=false;clear();stopReel.current=null;
   try{const result=evaluateSlot(final,stake);setWin(result.total);setCells(result.cells);setBalance(b=>b+result.total);if(result.total)tone(784);}
   finally{setGrid(final);setStopped([true,true,true,true,true]);setSpinning(false);}
  };
  const stop=(col:number)=>{
   if(!busy.current||completed.has(col))return;
   completed.add(col);
   setGrid(prev=>prev.map((value,i)=>i===col?(final[col]??value):value));
   setStopped(prev=>prev.map((value,i)=>i===col?true:value));tone(180+col*50);
   if(completed.size===5)settle();
  };
  stopReel.current=stop;
  // Animation completion is primary; timers also land reels if animation events are skipped.
  for(let col=0;col<5;col++)timers.current.push(setTimeout(()=>stop(col),1000+col*240));
  timers.current.push(setTimeout(settle,2050));timers.current.push(setTimeout(settle,5000));
 }
 const neon=theme==='neon';
 return <section className={`slot-machine ${neon?'slot-neon':''}`} aria-label={neon?'Neon Reels demo':'Garuda Gems demo'}>
 <img className="slot-backdrop" src="/assets/temple-bg.jpg" alt="" aria-hidden="true"/>
 <header className="slot-heading"><div><p className="slot-eyebrow">{neon?'CYBERPUNK ARCADE':'TEMPLE COLLECTION'}</p><h2>{neon?'NEON REELS':'GARUDA GEMS'}</h2></div><Button variant="ghost" size="icon" onClick={()=>setSound(s=>!s)} aria-label={sound?'Mute sound':'Enable sound'}>{sound?<Volume2/>:<VolumeX/>}</Button></header>
 <div className="slot-subhead"><span><Gem size={13}/> 5 REELS · 3 ROWS</span><span>VIRTUAL COINS ONLY</span></div>
 <div className="slot-reel-frame"><div className="slot-grid" aria-busy={spinning}>
 {grid.map((column,col)=><div key={col} className="slot-column" aria-label={`Reel ${col+1}`}>
 {stopped[col]?<div className="slot-landed">{column.map((symbol,row)=><Tile key={row} symbol={symbol} glow={cells.includes(`${col}-${row}`)} neon={neon}/>)}</div>:<div key={`${round}-${col}`} className="slot-strip" onAnimationEnd={event=>{if(event.target===event.currentTarget&&event.animationName==='slot-travel')stopReel.current?.(col);}} style={{'--strip-distance':`${-100*((strips[col]?.length??3)-3)/(strips[col]?.length??3)}%`,'--strip-duration':`${1000+col*240}ms`} as React.CSSProperties}>{(strips[col]??column).map((symbol,row)=><Tile key={row} symbol={symbol} neon={neon}/>)}</div>}
 </div>)}
 </div></div>
 <div className="slot-result" role="status"><span>{spinning?'REELS IN MOTION':win>0?(win>=bet*25?'JACKPOT':win>=bet*8?'BIG WIN':'NICE WIN'):'READY TO SPIN'}</span><strong>{win>0?`+${displayWin.toLocaleString()} coins`:spinning?'Good luck':'GARUDA GEMS · DEMO'}</strong></div>
 <div className="slot-meter"><div><span>DEMO BALANCE</span><strong>{balance.toLocaleString()}</strong></div><div><span>LAST RESULT</span><strong>{win.toLocaleString()}</strong></div></div>
 <div className="slot-controls"><Button variant="outline" size="icon" aria-label="Decrease bet" disabled={spinning||bet<=10} onClick={()=>setBet(b=>Math.max(10,b-10))}><Minus/></Button><div><span>BET · COINS</span><strong>{bet}</strong></div><Button variant="outline" size="icon" aria-label="Increase bet" disabled={spinning||bet>=500} onClick={()=>setBet(b=>Math.min(500,b+10))}><Plus/></Button><Button className="slot-spin" onClick={spin} disabled={spinning||balance<bet}><Zap/>{spinning?'SPINNING…':'SPIN'}</Button></div>
 {balance<bet&&!spinning&&<Button variant="ghost" className="w-full" onClick={()=>{setBalance(2000);setWin(0);}}><RotateCcw/> Reset demo coins</Button>}
 <p className="slot-disclosure">Virtual coins have no cash value. No cash prizes.</p>
 </section>;
}
export default ReelGame;
