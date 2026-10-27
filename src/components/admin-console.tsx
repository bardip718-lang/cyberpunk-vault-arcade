import { useRef, useState } from 'react';
import { ShieldCheck, Search, RefreshCw, ImageIcon, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaymentSettingsPanel } from '@/components/payment-settings';
import { useVaultRequests } from '@/lib/use-vault-requests';
import { toast } from 'sonner';
import type { VaultRequest } from '@/lib/requests.functions';
export function AdminConsole(){
 const [code,setCode]=useState(''),[verified,setVerified]=useState(''),[search,setSearch]=useState(''),[tab,setTab]=useState('pending');const lock=useRef(false);
 const {requests,isLoading,error,refetch,resolveRequest,isResolving}=useVaultRequests(verified);
 async function review(request:VaultRequest,status:'approved'|'rejected'){if(lock.current)return;if(status==='approved'&&!window.confirm(request.kind==='withdrawal'?'Confirm the payout was actually sent outside this app. This action does not send money.':'Confirm you checked the UTR and screenshot against the actual received payment.'))return;lock.current=true;try{await resolveRequest({adminPasscode:verified,id:request.id,status});toast.success(`${request.kind==='deposit'?'Deposit':'Withdrawal'} marked ${status}.`);}catch(e){toast.error(e instanceof Error?e.message:'Review failed');}finally{lock.current=false;}}
 const filtered=requests.filter(r=>(tab!=='pending'||r.status==='pending')&&[r.userKey,r.userName,r.userEmail,r.utr,r.id].some(value=>value.toLowerCase().includes(search.trim().toLowerCase())));
 return <section className="vault-dashboard" aria-label="Operator console"><header className="mb-5 flex items-center justify-between"><div><p className="text-xs text-muted-foreground">OPERATIONS</p><h2 className="flex items-center gap-2"><ShieldCheck/> Transactions</h2></div>{verified&&<Button variant="ghost" size="icon" aria-label="Refresh transactions" onClick={()=>void refetch()}><RefreshCw/></Button>}</header>
 {!verified?<form onSubmit={e=>{e.preventDefault();setVerified(code);}} className="space-y-3"><label htmlFor="operator-code" className="text-sm">Operator passcode</label><Input id="operator-code" type="password" value={code} onChange={e=>setCode(e.target.value)} required autoComplete="off"/><Button type="submit">Unlock console</Button></form>:<>
 {error?<div role="alert" className="space-y-3"><p className="text-sm text-destructive">{error.message}</p><Button variant="secondary" onClick={()=>{setVerified('');setCode('');}}>Try another passcode</Button></div>:<>
 <div className="vault-stats"><div><span>PENDING REVIEW</span><strong>{requests.filter(r=>r.status==='pending').length}</strong></div><div><span>TRANSACTIONS</span><strong>{requests.length}</strong></div></div>
 <div className="my-4 flex gap-2">{['pending','history','settings'].map(value=><Button key={value} size="sm" variant={tab===value?'default':'secondary'} onClick={()=>setTab(value)}>{value==='pending'?'Queue':value==='history'?'History':'Settings'}</Button>)}<Button size="sm" variant="ghost" onClick={()=>setVerified('')}>Lock</Button></div>
 {tab==='settings'?<PaymentSettingsPanel/>:<><label className="relative block"><Search className="absolute left-3 top-3 size-4 text-muted-foreground"/><Input className="pl-9" aria-label="Search transactions" placeholder="User ID, phone, name or UTR" value={search} onChange={e=>setSearch(e.target.value)}/></label>
 {isLoading?<p className="py-8 text-sm text-muted-foreground">Loading transactions…</p>:filtered.length===0?<p className="py-8 text-sm text-muted-foreground">No matching transactions.</p>:filtered.map(r=><article key={r.id} className="vault-record"><header><div><span className="text-xs uppercase text-muted-foreground">{r.kind}</span><h3>{r.userName}</h3></div><strong>₹{r.amount.toLocaleString()}</strong></header><p>User ID: {r.userKey}</p><p>{r.kind==='deposit'?`UTR: ${r.utr}`:`Destination: ${r.destination}`}</p><div className="flex items-center justify-between gap-2 text-xs"><span className="text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</span><span className={r.status==='approved'?'text-success':r.status==='rejected'?'text-destructive':'text-muted-foreground'}>{r.status.toUpperCase()}</span></div>{r.screenshotUrl&&<a className="flex items-center gap-1 text-xs text-primary" href={r.screenshotUrl} target="_blank" rel="noreferrer"><ImageIcon size={14}/> Payment screenshot</a>}{r.status==='pending'&&<div className="flex gap-2"><Button disabled={isResolving} size="sm" onClick={()=>void review(r,'approved')}><Check/>{r.kind==='withdrawal'?'Confirm sent':'Approve'}</Button><Button disabled={isResolving} size="sm" variant="destructive" onClick={()=>void review(r,'rejected')}><X/>Reject</Button></div>}</article>)}</>}
 </>}
 </>}
 </section>;
}
