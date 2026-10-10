// AI-assisted diagnostic; never used by the browser.
import 'dotenv/config';
import {FishApiClient} from '../src/fish-api-client.js';
const p=await new FishApiClient({offline:false}).next();
console.log({source:p.source,mime:p.mime,bytes:p.image.length});
if(p.source!=='api'){console.error('Live API integration is unavailable; fallback works. Check network, host allowlist and API response contract.');process.exitCode=1;}
