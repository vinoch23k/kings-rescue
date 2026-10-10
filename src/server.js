// AI-assisted implementation. See AI_DISCLOSURE.md.
import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { StatsRepository } from './stats-repository.js';
import { AuthService,readToken } from './auth-service.js';
import { GameEngine,GameError } from './game-engine.js';
import { FishApiClient } from './fish-api-client.js';
import { LEVELS } from './level-config.js';
export async function createApp({repo=new StatsRepository(),fish=new FishApiClient()}={}){
 await repo.init();const auth=new AuthService(repo),games=new Map(),locks=new Set(),rate=new Map();const app=express();
 app.disable('x-powered-by');app.use(express.json({limit:'8kb'}));
 app.use((req,res,next)=>{res.set({'X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','Content-Security-Policy':"default-src 'self'; img-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"});next();});
 const origin=process.env.APP_ORIGIN||`http://localhost:${process.env.PORT||3000}`;
 app.use('/api',(req,res,next)=>{res.set('Cache-Control','no-store');
  if(req.method==='POST'&&(!req.is('application/json')||(req.headers.origin&&req.headers.origin!==origin)||req.headers['sec-fetch-site']==='cross-site'))return res.status(403).json({error:'Request origin or content type rejected.'});next();});
 const cookie=(token)=>`rescue_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400${process.env.NODE_ENV==='production'?'; Secure':''}`;
 const limit=(req,res,next)=>{const key=req.socket.remoteAddress,now=Date.now();let x=rate.get(key);if(!x||x.until<now){x={count:0,until:now+60000};rate.set(key,x);}if(++x.count>25)return res.status(429).json({error:'Please wait a minute before trying again.'});next();};
 app.get('/api/levels',(req,res)=>res.json({levels:LEVELS,storage:repo.mode}));
 app.post('/api/auth/register',limit,async(req,res)=>{await auth.register(req.body?.username,req.body?.password);res.status(201).json({message:'Account created. Sign in to play.'});});
 app.post('/api/auth/login',limit,async(req,res)=>{const s=await auth.login(req.body?.username,req.body?.password);res.set('Set-Cookie',cookie(s.token));res.json({user:s.user,csrf:s.csrf});});
 app.get('/api/auth/me',async(req,res)=>{const s=await auth.session(readToken(req));if(!s)return res.status(401).json({error:'Please sign in.'});res.json({user:{username:s.username},csrf:s.csrf});});
 app.use('/api',async(req,res,next)=>{if(req.path.startsWith('/leaderboard/'))return next();const s=await auth.session(readToken(req));if(!s)return res.status(401).json({error:'Please sign in.'});req.player=s;
  if(req.method==='POST'&&req.headers['x-csrf-token']!==s.csrf)return res.status(403).json({error:'Session verification failed. Reload and sign in.'});next();});
 app.post('/api/auth/logout',async(req,res)=>{await auth.logout(readToken(req));res.set('Set-Cookie',`rescue_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${process.env.NODE_ENV==='production'?'; Secure':''}`);res.json({ok:true});});
 const save=async(req,g)=>{if(['won','lost'].includes(g.status)&&!g.saved){await repo.saveScore({gameId:g.id,userId:req.player.userId,username:req.player.username,level:g.level,score:g.score,rating:g.rating,won:g.status==='won',created:new Date().toISOString()});g.saved=true;}};
 const current=req=>{const g=games.get(req.player.userId);if(!g)throw new GameError('Start a level first.',404);g.sync();return g;};
 const exclusive=fn=>async(req,res,next)=>{const key=req.player.userId;if(locks.has(key))throw new GameError('A puzzle request is already in progress.');locks.add(key);try{await fn(req,res,next);}finally{locks.delete(key);}};
 const load=async g=>{g.setPuzzle(await fish.next());};
 app.post('/api/game/start',exclusive(async(req,res)=>{const g=new GameEngine(req.body?.level);games.set(req.player.userId,g);await load(g);res.json(g.state());}));
 app.get('/api/game',async(req,res)=>{const g=current(req);await save(req,g);res.json(g.state());});
 app.get('/api/game/image/:id',(req,res)=>{const g=current(req);if(!g.puzzle||g.puzzle.id!==req.params.id)throw new GameError('Puzzle expired.',404);res.type(g.puzzle.mime).send(g.puzzle.image);});
 app.post('/api/game/ready',exclusive(async(req,res)=>{const g=current(req);g.ready(req.body?.puzzleId);await save(req,g);res.json(g.state());}));
 app.post('/api/game/answer',exclusive(async(req,res)=>{const g=current(req);const correct=g.submit(req.body?.puzzleId,req.body?.fish,req.body?.chest);await save(req,g);if(g.status==='loading')await load(g);res.json({...g.state(),correct});}));
 app.post('/api/game/hint',exclusive(async(req,res)=>{const g=current(req);g.hint(req.body?.puzzleId);res.json(g.state());}));
 app.get('/api/leaderboard/:level',async(req,res)=>{if(!LEVELS[req.params.level])throw new GameError('Invalid level.',400);res.json({entries:await repo.leaderboard(req.params.level)});});
 app.use(express.static(fileURLToPath(new URL('../public',import.meta.url))));
 app.use('/api',(req,res)=>res.status(404).json({error:'Unknown API route.'}));
 app.use((err,req,res,next)=>{if(!err.status||err.status>=500)console.error(err);res.status(err.status||500).json({error:err.status?err.message:'Server error. Please retry.'});});
 // Expire abandoned games and bounded rate-limit data; clocks use wall time, not this interval.
 const sweep=setInterval(()=>{for(const [id,g] of games){g.sync();if(g.clock()-g.updated>3600000&&!locks.has(id))games.delete(id);}for(const [key,x] of rate)if(x.until<Date.now())rate.delete(key);for(const [key,x] of auth.failures)if(!x.until||x.until<Date.now())auth.failures.delete(key);},600000);sweep.unref();
 return {app,repo,games,close:async()=>{clearInterval(sweep);await repo.close();}};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 try{const runtime=await createApp();const server=runtime.app.listen(Number(process.env.PORT)||3000,()=>console.log(`King's Rescue: ${process.env.APP_ORIGIN||'http://localhost:3000'}`));process.on('SIGTERM',()=>server.close(async()=>{await runtime.close();process.exit(0);}));}catch(e){console.error('Startup failed:',e.message,'\nStart MongoDB, or set STORAGE_MODE=file for a local demonstration.');process.exitCode=1;}
}
