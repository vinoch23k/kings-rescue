// AI-assisted implementation. API contract verified against live endpoint 8 October 2026.
import { randomInt } from 'node:crypto';
export function validatePuzzle(data){
 if(!data||typeof data.question!=='string'||![data.fish,data.chest].every(n=>Number.isInteger(n)&&n>=0&&n<=100))throw new Error('Invalid Fish API response');
 return {imageUrl:data.question,fish:data.fish,chest:data.chest};
}
export function localPuzzle(){
 const fish=randomInt(2,11),chest=randomInt(1,7),items=[...Array(fish).fill('fish'),...Array(chest).fill('chest')];
 // Fisher-Yates shuffle gives uncluttered puzzles with separate, randomized slots.
 for(let i=items.length-1;i>0;i--){const j=randomInt(i+1);[items[i],items[j]]=[items[j],items[i]];}
 const symbols=items.map((type,i)=>{const x=45+(i%5)*104,y=52+Math.floor(i/5)*76;
  return type==='fish'?`<g transform="translate(${x},${y})"><path d="M-22 0 L-37 -15 L-37 15 Z" fill="#f87171"/><ellipse rx="26" ry="17" fill="#ffbb54"/><circle cx="14" cy="-4" r="4" fill="#15273c"/><path d="M0 -12 L-5 -24 L12 -15" fill="#f87171"/></g>`:`<g transform="translate(${x},${y})"><rect x="-25" y="-13" width="50" height="32" rx="4" fill="#975528" stroke="#fbd477" stroke-width="3"/><path d="M-25 -4 H25 M-16 -13 V19 M16 -13 V19" stroke="#fbd477" stroke-width="4"/><rect x="-5" y="-8" width="10" height="15" rx="2" fill="#ffe086"/></g>`;
 }).join('');
 return {fish,chest,source:'offline',mime:'image/svg+xml',image:Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="520" height="320" viewBox="0 0 520 320"><rect width="520" height="320" rx="20" fill="#e2f5f5"/>${symbols}</svg>`)};
}
export class FishApiClient {
 constructor({fetcher=fetch,url=process.env.FISH_API_URL||'https://marcconrad.com/uob/fish/api.php',timeout=Number(process.env.FISH_TIMEOUT_MS)||6000,offline=process.env.OFFLINE_PUZZLES==='true',hosts=(process.env.FISH_IMAGE_HOSTS||'www.sanfoh.com,sanfoh.com,marcconrad.com,www.marcconrad.com').split(',')}={}){Object.assign(this,{fetcher,url,timeout,offline,hosts});}
 async bounded(url){const res=await this.fetcher(url,{signal:AbortSignal.timeout(this.timeout),redirect:'error'});if(!res.ok)throw new Error(`Upstream HTTP ${res.status}`);return res;}
 async next(){if(!this.offline){for(let attempt=0;attempt<2;attempt++){try{
   const res=await this.bounded(this.url);const text=await res.text();if(text.length>10000)throw new Error('Oversized API JSON');const p=validatePuzzle(JSON.parse(text));
   const u=new URL(p.imageUrl);if(u.protocol!=='https:'||u.username||u.password||u.port||!this.hosts.includes(u.hostname))throw new Error('Untrusted puzzle image URL');
   const img=await this.bounded(u.href);const mime=img.headers.get('content-type')?.split(';')[0];if(!['image/png','image/jpeg','image/webp','image/gif'].includes(mime))throw new Error('Invalid image type');
   const chunks=[];let size=0;for await(const chunk of img.body){size+=chunk.length;if(size>2_000_000)throw new Error('Oversized image');chunks.push(chunk);}
   return {...p,source:'api',mime,image:Buffer.concat(chunks)};
  }catch(error){console.warn(`Fish API attempt ${attempt+1}: ${error.message}`);}}
 }return localPuzzle();}
}
