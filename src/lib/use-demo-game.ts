import { useCallback, useRef, useState } from 'react';
/** Session-local virtual credits, never connected to the cash wallet. */
export function useDemoGame(initial=2000) {
 const [balance,setBalance]=useState(initial);const current=useRef(initial);
 const change=useCallback((delta:number)=>{if(!Number.isFinite(delta)||current.current+delta<0)return false;current.current+=delta;setBalance(current.current);return true;},[]);
 return {balance,change};
}
