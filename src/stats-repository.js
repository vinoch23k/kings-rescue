// AI-assisted implementation. See AI_DISCLOSURE.md.
import { MongoClient } from 'mongodb';
import { mkdir,readFile,writeFile,rename } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
export class StatsRepository {
 async init(){
  this.mode=process.env.STORAGE_MODE||'mongo';
  if(this.mode==='mongo'){
   this.client=new MongoClient(process.env.MONGODB_URI||'mongodb://127.0.0.1:27017',{serverSelectionTimeoutMS:5000});await this.client.connect();this.db=this.client.db(process.env.MONGODB_DATABASE||'kings_rescue');
   await Promise.all([this.db.collection('users').createIndex({username:1},{unique:true}),this.db.collection('scores').createIndex({gameId:1},{unique:true}),this.db.collection('scores').createIndex({level:1,score:-1}),this.db.collection('sessions').createIndex({expires:1},{expireAfterSeconds:0})]);
  }else if(this.mode==='file'){
   console.warn('LOCAL DEMO: JSON storage, single process only. Use MongoDB for coursework integration.');await mkdir('data',{recursive:true});try{this.data=JSON.parse(await readFile('data/store.json','utf8'));}catch(e){if(e.code!=='ENOENT')throw e;this.data={users:[],scores:[],sessions:[]};}this.queue=Promise.resolve();
  }else throw new Error('STORAGE_MODE must be mongo or file');
 }
 async flush(){if(this.mode==='file'){const snapshot=JSON.stringify(this.data,null,2);const op=this.queue.then(async()=>{await writeFile('data/store.tmp',snapshot);await rename('data/store.tmp','data/store.json');});this.queue=op.catch(()=>{});await op;}}
 async user(username){return this.mode==='mongo'?this.db.collection('users').findOne({username}):this.data.users.find(u=>u.username===username);}
 async addUser(username,passwordHash){const user={id:randomUUID(),username,passwordHash,created:new Date().toISOString()};
  if(this.mode==='mongo')await this.db.collection('users').insertOne(user);else {if(this.data.users.some(u=>u.username===username)){const e=new Error('Duplicate');e.code=11000;throw e;}this.data.users.push(user);await this.flush();}return user;
 }
 async addSession(s){if(this.mode==='mongo')await this.db.collection('sessions').insertOne({...s,expires:new Date(s.expires)});else{this.data.sessions.push(s);await this.flush();}}
 async session(hash){const s=this.mode==='mongo'?await this.db.collection('sessions').findOne({hash}):this.data.sessions.find(s=>s.hash===hash);return s&&new Date(s.expires).getTime()>Date.now()?s:null;}
 async deleteSession(hash){if(this.mode==='mongo')await this.db.collection('sessions').deleteOne({hash});else{this.data.sessions=this.data.sessions.filter(s=>s.hash!==hash);await this.flush();}}
 async saveScore(s){if(this.mode==='mongo')await this.db.collection('scores').updateOne({gameId:s.gameId},{$setOnInsert:s},{upsert:true});else {if(this.data.scores.some(x=>x.gameId===s.gameId))return;this.data.scores.push(s);await this.flush();}}
 async leaderboard(level){const all=this.mode==='mongo'?await this.db.collection('scores').find({level,won:true},{projection:{_id:0}}).sort({score:-1,created:1}).toArray():this.data.scores.filter(s=>s.level===level&&s.won).sort((a,b)=>b.score-a.score||a.created.localeCompare(b.created));
  const seen=new Set();return all.filter(s=>{if(seen.has(s.userId))return false;seen.add(s.userId);return true;}).slice(0,10).map(({username,score,rating,created})=>({username,score,rating,created}));
 }
 async close(){await this.client?.close();}
}
