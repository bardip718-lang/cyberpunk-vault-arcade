import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Button } from '@/components/ui/button';
import { listOperatorUsers } from '@/lib/requests.functions';
export function AdminUsers({passcode,search}:{passcode:string;search:string}){
 const fn=useServerFn(listOperatorUsers);
 const q=useQuery({queryKey:['operator-users',passcode],queryFn:()=>fn({data:{adminPasscode:passcode}}),retry:1});
 if(q.isLoading)return <p className="py-8 text-sm text-muted-foreground">Loading users…</p>;
 if(q.error)return <div role="alert" className="space-y-2 py-4"><p className="text-sm text-destructive">{q.error.message}</p><Button size="sm" variant="secondary" onClick={()=>void q.refetch()}>Retry</Button></div>;
 const s=search.trim().toLowerCase();const rows=(q.data??[]).filter(u=>[u.id,u.contact,u.name,u.referralCode].some(v=>v.toLowerCase().includes(s)));
 if(!rows.length)return <p className="py-8 text-sm text-muted-foreground">{q.data?.length?'No users match this search.':'No registered users yet.'}</p>;
 return <>{rows.map(u=><article key={u.id} className="vault-record"><header><div><span className="text-xs text-muted-foreground">USER</span><h3>{u.name||u.contact||'Unnamed'}</h3></div><strong>₹{u.deposited.toLocaleString()}</strong></header><p>Contact: {u.contact||'—'}</p><p className="break-all text-xs">ID: {u.id}</p><p className="text-xs">Withdrawn ₹{u.withdrawn.toLocaleString()} · Pending requests {u.pending}{u.referralCode&&` · Ref ${u.referralCode}`}</p><p className="text-xs text-muted-foreground">Joined {new Date(u.createdAt).toLocaleDateString()} · Last sign-in {u.lastSignIn?new Date(u.lastSignIn).toLocaleString():'never'}</p></article>)}</>;
}
