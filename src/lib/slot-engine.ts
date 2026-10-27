export type SlotSymbol = 'wild' | 'ruby' | 'emerald' | 'sapphire' | 'A' | 'K' | 'Q';
export const SLOT_SYMBOLS: SlotSymbol[] = ['wild', 'ruby', 'emerald', 'sapphire', 'A', 'K', 'Q'];
const weights = [5, 12, 16, 18, 17, 17, 15];
const pay: Record<SlotSymbol, number[]> = { wild: [5,15,50], ruby: [3,8,25], emerald: [2,5,15], sapphire: [2,4,12], A: [1,2,6], K: [.8,1.5,4], Q: [.5,1,3] };
export function pickSlotSymbol(random = Math.random): SlotSymbol {
 let value = random()*100;
 for (let i=0; i<SLOT_SYMBOLS.length; i++) { value -= weights[i] ?? 0; const symbol=SLOT_SYMBOLS[i]; if (value<=0 && symbol) return symbol; }
 return 'Q';
}
export function evaluateSlot(grid: SlotSymbol[][], stake: number) {
 let total=0; const cells: string[]=[];
 for(let row=0;row<3;row++) {
  const line=grid.map(col=>col[row] ?? 'Q'); let best=0, count=0;
  for(const target of SLOT_SYMBOLS) { let length=0; for(const symbol of line) { if(symbol===target || symbol==='wild') length++; else break; } const reward=length>=3 ? (pay[target][length-3] ?? 0)*stake : 0; if(reward>best) {best=reward;count=length;} }
  total+=best; if(best>0) for(let col=0;col<count;col++) cells.push(`${col}-${row}`);
 }
 return {total:Math.round(total),cells};
}
