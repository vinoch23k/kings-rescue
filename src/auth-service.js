// AI-assisted implementation. See AI_DISCLOSURE.md.
import bcrypt from 'bcrypt';
import { randomBytes,createHash } from 'node:crypto';
import { GameError } from './game-engine.js';
const digest=t=>createHash('sha256').update(t).digest('hex');
export class AuthService {
 constructor(repo){this.repo=repo;this.failures=new Map();}
 clean(username){return typeof username==='string'?username.trim().toLowerCase():'';}
 async register(username,password){username=this.clean(username);
  if(!/^[a-z0-9_]{3,20}$/.test(username))throw new GameError('Username: 3–20 letters, digits or underscores.',400);
  if(typeof password!=='string'||password.length<8||Buffer.byteLength(password)>72)throw new GameError('Password must have at least 8 characters and at most 72 UTF-8 bytes.',400);
  try{return await this.repo.addUser(username,await bcrypt.hash(password,12));}catch(e){if(e.code===11000)throw new GameError('That username is already taken.',409);throw e;}
 }
 async login(username,password){username=this.clean(username);const failure=this.failures.get(username);
  if(failure?.until>Date.now())throw new GameError('Too many failed logins. Try again in 5 minutes.',429);
  const user=await this.repo.user(username);
  // Dummy hash avoids skipping the expensive password check for unknown accounts.
  const valid=await bcrypt.compare(typeof password==='string'?password:'',user?.passwordHash||'$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW');
  if(!user||!valid){const count=(failure?.count||0)+1;this.failures.set(username,{count:count>=5?0:count,until:count>=5?Date.now()+300000:0});throw new GameError('Incorrect username or password.',401);}
  this.failures.delete(username);const token=randomBytes(32).toString('hex'),csrf=randomBytes(24).toString('hex');
  await this.repo.addSession({hash:digest(token),csrf,userId:user.id,username:user.username,expires:new Date(Date.now()+86400000).toISOString()});return {token,csrf,user:{username:user.username}};
 }
 async session(token){return token?this.repo.session(digest(token)):null;}
 async logout(token){if(token)await this.repo.deleteSession(digest(token));}
}
export function readToken(req){const cookie=req.headers.cookie||'';const match=cookie.match(/(?:^|;\s*)rescue_session=([a-f0-9]{64})(?:;|$)/);return match?.[1];}
