"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { siteConfig } from "@/lib/site-config";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email,setEmail]=useState("");const [password,setPassword]=useState("");const [confirmPassword,setConfirmPassword]=useState("");const [invite,setInvite]=useState(false);const [inviteReady,setInviteReady]=useState(false);const [error,setError]=useState("");const [busy,setBusy]=useState(false);
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);const isInvite=params.get('invite')==='1';setInvite(isInvite);
    if(!isInvite){setInviteReady(true);return}
    let alive=true;
    const hash=new URLSearchParams(window.location.hash.slice(1));
    const accessToken=hash.get('access_token');const refreshToken=hash.get('refresh_token');
    const type=hash.get('type');
    if(hash.get('error')||hash.get('error_code')){setError('This invitation link is invalid or expired. Ask an administrator to resend it.');setInviteReady(false);return}
    if(accessToken&&refreshToken&&(!type||type==='invite'||type==='magiclink')){
      void supabase.auth.setSession({access_token:accessToken,refresh_token:refreshToken}).then(({error})=>{
        if(!alive)return;
        if(error){setError('Could not validate this invitation. Ask an administrator to resend it.');setInviteReady(false);return}
        window.history.replaceState({},document.title,window.location.pathname+window.location.search);
        setInviteReady(true);
      });
    }else{
      void supabase.auth.getSession().then(({data,error})=>{
        if(!alive)return;
        setInviteReady(Boolean(data.session&&!error));
        if(!data.session||error)setError('Open the latest invitation link from your email to set up your admin account.');
      });
    }
    return()=>{alive=false};
  },[]);
  const recordSession=async()=>{await fetch('/api/admin/session',{method:'POST',cache:'no-store'}).catch(()=>{});};
  const submit=async(e:FormEvent)=>{e.preventDefault();setBusy(true);setError("");const {error}=await supabase.auth.signInWithPassword({email,password});if(error){setError("Email or password was not accepted.");setBusy(false);return}const check=await fetch("/api/admin/me",{cache:"no-store"});if(!check.ok){await supabase.auth.signOut();setError(`This account does not have ${siteConfig.name} admin access.`);setBusy(false);return}await recordSession();router.replace("/admin");router.refresh()};
  const acceptInvite=async(e:FormEvent)=>{e.preventDefault();if(!inviteReady){setError('Validate your invitation link before setting a password.');return}if(password.length<16||!/[a-z]/.test(password)||!/[A-Z]/.test(password)||!/[0-9]/.test(password)||!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)){setError('Use at least 16 characters with uppercase, lowercase, a number, and a symbol. Avoid your email or username.');return}if(email&&password.toLowerCase().includes(email.split('@')[0].toLowerCase())){setError('Do not include your email name in the password.');return}if(password!==confirmPassword){setError('Passwords do not match.');return}setBusy(true);setError('');const {error}=await supabase.auth.updateUser({password});if(error){setError('The invitation link may have expired. Ask an admin to resend it.');setBusy(false);return}const check=await fetch('/api/admin/me',{cache:'no-store'});if(!check.ok){setError('The account invitation is not active. Ask an admin for a new invite.');setBusy(false);return}await recordSession();router.replace('/admin');router.refresh()};
  return <main className="wc-admin-login"><form onSubmit={invite?acceptInvite:submit}><span>{siteConfig.name}</span><h1>{invite?'Finish admin setup':'Admin sign in'}</h1>{!invite&&<label>Email<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)}/></label>}{invite&&<p className="wc-admin-password-rules">Use at least 16 characters with uppercase and lowercase letters, a number, and a symbol. Don’t reuse another password or include your email name.</p>}<label>{invite?'Create password':'Password'}<input type="password" autoComplete={invite?'new-password':'current-password'} minLength={invite?16:1} required value={password} onChange={e=>setPassword(e.target.value)}/></label>{invite&&<label>Confirm password<input type="password" autoComplete="new-password" minLength={16} required value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)}/></label>}{error&&<p role="alert">{error}</p>}<button disabled={busy||(invite&&!inviteReady)}>{busy?(invite?'Setting up…':'Signing in…'):(invite?'Set password and continue':'Sign in')}</button></form></main>
}
