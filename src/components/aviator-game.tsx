import { useEffect, useRef, useState } from 'react';
import { Plane, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDemoGame } from '@/lib/use-demo-game';
import { sfx } from '@/lib/sfx';
type Phase='waiting'|'flying'|'crashed';
type Bet='none'|'placed'|'active'|'cashed'|'lost';
export function AviatorGame(){
 const {balance,change}=useDemoGame();const [phase,setPhase]=useState<Phase>('waiting'),[bet,setBet]=useState<Bet>('none'),[amount,setAmount]=useState(50),[multi,setMulti]=useState(1),[countdown,setCountdown]=useState(5),[history,setHistory]=useState<number[]>([]),[result,setResult]=useState(0),[sound,setSound]=useState(true);
 const state=useRef({phase:'waiting' as Phase,bet:'none' as Bet,multi:1,crash:1.5,stake:50,deadline:0,start:0});const soundRef=useRef(sound);soundRef.current=sound;
 useEffect(()=>{const round=state.current;round.deadline=performance.now()+5000;const timer=setInterval(()=>{const now=performance.now();if(round.phase==='waiting'){setCountdown(Math.max(0,Math.ceil((round.deadline-now)/1000)));if(now>=round.deadline){round.phase='flying';round.bet=round.bet==='placed'?'active':'none';round.multi=1;round.crash=Math.min(20,Math.max(1.02,.96/Math.max(.05,Math.random())));round.start=now;setPhase('flying');setBet(round.bet);setMulti(1);}}
 else if(round.phase==='flying'){const next=Math.exp((now-round.start)/6000);if(next>=round.crash){round.phase='crashed';round.multi=round.crash;round.bet=round.bet==='active'?'lost':round.bet;round.deadline=now+2200;setMulti(round.crash);setPhase('crashed');setBet(round.bet);setHistory(h=>[round.crash,...h].slice(0,8));if(soundRef.current)sfx.lose();}else{round.multi=next;setMulti(next);}}
 else if(now>=round.deadline){round.phase='waiting';round.bet='none';round.deadline=now+5000;setPhase('waiting');setBet('none');setCountdown(5);setResult(0);}},80);return()=>clearInterval(timer);},[]);
 function place(){const round=state.current;if(round.phase!=='waiting'||round.bet!=='none'||!change(-amount))return;round.bet='placed';round.stake=amount;setBet('placed');}
 function cashout(){const round=state.current;if(round.phase!=='flying'||round.bet!=='active')return;round.bet='cashed';const earned=Math.round(round.stake*round.multi);change(earned);setBet('cashed');setResult(earned);if(sound)sfx.win();}
 const progress=Math.min(1,(multi-1)/4);
 return <section className="vault-dashboard" aria-label="Aviator demo"><header className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">FLIGHT DECK · DEMO COINS</p><h2>AVIATOR</h2></div><Button size="icon" variant="ghost" aria-label={sound?'Mute sound':'Enable sound'} onClick={()=>setSound(s=>!s)}>{sound?<Volume2/>:<VolumeX/>}</Button></header>
 <div className="crash-history">{history.length?history.map((value,i)=><span key={i}>{value.toFixed(2)}×</span>):<span>Flight history will appear here</span>}</div>
 <div className="crash-screen"><div className="crash-grid"/><div className="crash-number" role="status"><span>{phase==='waiting'?'NEXT FLIGHT':phase==='crashed'?'FLEW AWAY':'IN FLIGHT'}</span><strong>{phase==='waiting'?`${countdown}s`:`${multi.toFixed(2)}×`}</strong>{result>0&&<span>Collected {result} demo coins</span>}</div>{phase==='flying'&&<div className="crash-plane" style={{left:`${10+progress*70}%`,top:`${78-progress*60}%`}}><Plane aria-hidden="true"/></div>}</div>
 <div className="vault-stats"><div><span>DEMO BALANCE</span><strong>{balance}</strong></div><div><span>BET AMOUNT</span><strong>{amount}</strong></div></div><div className="my-4 grid grid-cols-4 gap-2">{[50,100,200,500].map(value=><Button key={value} variant={amount===value?'default':'secondary'} disabled={bet!=='none'||phase!=='waiting'} onClick={()=>setAmount(value)}>{value}</Button>)}</div>
 <Button className="crash-button" disabled={!(phase==='waiting'&&bet==='none'&&balance>=amount)&&!(phase==='flying'&&bet==='active')} onClick={bet==='active'?cashout:place}>{bet==='active'&&phase==='flying'?`CASH OUT ${Math.round(state.current.stake*multi)} COINS`:bet==='placed'?'BET LOCKED':bet==='cashed'?'COLLECTED · WAIT FOR NEXT ROUND':bet==='lost'||phase!=='waiting'?'WAIT FOR NEXT ROUND':`BET ${amount} COINS`}</Button><p className="slot-disclosure">Virtual coins only. One bet per round. No cash prizes.</p></section>;
}
export const CrashGame=AviatorGame;
export default AviatorGame;
