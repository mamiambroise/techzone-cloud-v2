import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { api, authApi } from '../services/apiClient.js';
const failure = config => Object.assign(new Error('unauthorized'),{config,response:{status:401,data:{},config}});
let original;
beforeEach(()=>{original=api.defaults.adapter;});
afterEach(()=>{api.defaults.adapter=original;vi.restoreAllMocks();});
describe('single-flight refresh',()=>{
 it('coalesces simultaneous failures and retries each request exactly once',async()=>{
  let finish;const refresh=vi.spyOn(authApi,'post').mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));
  const calls=[];api.defaults.adapter=async config=>{calls.push(config);if(!config._retriedAfterRefresh)throw failure(config);return {data:[],status:200,headers:{},config};};
  const result=Promise.all([api.get('/first'),api.get('/second')]);
  await vi.waitFor(()=>expect(refresh).toHaveBeenCalledTimes(1));finish({});await result;expect(calls).toHaveLength(4);
 });
 it('does not loop when retried requests still return 401',async()=>{
  const refresh=vi.spyOn(authApi,'post').mockResolvedValue({});let count=0;
  api.defaults.adapter=async config=>{count++;throw failure(config);};
  await expect(api.get('/denied')).rejects.toThrow();expect(refresh).toHaveBeenCalledTimes(1);expect(count).toBe(2);
 });
 it('rejects all queued requests when refresh fails',async()=>{
  let fail;const refresh=vi.spyOn(authApi,'post').mockImplementation(()=>new Promise((_,reject)=>{fail=reject;}));
  api.defaults.adapter=async config=>{throw failure(config);};
  const result=Promise.allSettled([api.get('/first'),api.get('/second')]);await vi.waitFor(()=>expect(refresh).toHaveBeenCalledTimes(1));fail(failure({url:'/auth/refresh'}));expect((await result).every(r=>r.status==='rejected')).toBe(true);
 });
});
