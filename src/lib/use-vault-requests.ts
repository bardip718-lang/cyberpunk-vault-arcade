import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { supabase } from '@/integrations/supabase/client';
import { listRequests, listOperatorRequests, submitRequest, resolveRequest, type VaultRequest, type RequestKind } from '@/lib/requests.functions';
import { REQUESTS_KEY } from '@/lib/requests-query';
export function useVaultRequests(operatorPasscode?:string){
 const cache=useQueryClient();const [sessionId,setSessionId]=useState<string|null>(null);
 useEffect(()=>{void supabase.auth.getSession().then(({data})=>setSessionId(data.session?.user.id??null));const {data}=supabase.auth.onAuthStateChange((_event,session)=>setSessionId(session?.user.id??null));return()=>data.subscription.unsubscribe();},[]);
 const list=useServerFn(listRequests),adminList=useServerFn(listOperatorRequests),submit=useServerFn(submitRequest),resolveFn=useServerFn(resolveRequest);
 const query=useQuery({queryKey:[...REQUESTS_KEY,operatorPasscode?'operator':'own',sessionId],queryFn:()=>operatorPasscode?adminList({data:{adminPasscode:operatorPasscode}}):list(),enabled:operatorPasscode!==undefined?!!operatorPasscode:!!sessionId,refetchInterval:5000,retry:1});
 const create=useMutation({mutationFn:(input:{kind:RequestKind;userKey:string;userName:string;userEmail:string;amount:number;utr?:string;destination?:string;screenshotDataUrl?:string;requestKey?:string})=>submit({data:{...input,requestKey:input.requestKey??crypto.randomUUID()}}),onSuccess:()=>cache.invalidateQueries({queryKey:REQUESTS_KEY})});
 const resolve=useMutation({mutationFn:(input:{adminPasscode?:string;adminEmail?:string;id:string;status:'approved'|'rejected'})=>resolveFn({data:{adminPasscode:input.adminPasscode??'',id:input.id,status:input.status}}),onSuccess:()=>cache.invalidateQueries({queryKey:REQUESTS_KEY})});
 return {requests:query.data??[] as VaultRequest[],isLoading:query.isLoading,error:query.error,refetch:query.refetch,createRequest:create.mutateAsync,isCreating:create.isPending,resolveRequest:resolve.mutateAsync,isResolving:resolve.isPending};
}
