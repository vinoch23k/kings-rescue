// AI-assisted end-to-end service tests. See AI_DISCLOSURE.md.
import test from 'node:test';import assert from 'node:assert/strict';
import {createApp} from '../src/server.js';import {localPuzzle} from '../src/fish-api-client.js';
class MemoryRepo {constructor(){this.users=[];this.sessions=[];this.scores=[];this.mode='test';}async init(){}async close(){}async user(n){return this.users.find(u=>u.username===n);}async addUser(username,passwordHash){const u={id:username,username,passwordHash};this.users.push(u);return u;}async addSession(s){this.sessions.push(s);}async session(h){return this.sessions.find(s=>s.hash===h);}async deleteSession(h){this.sessions=this.sessions.filter(s=>s.hash!==h);}async saveScore(s){if(!this.scores.some(x=>x.gameId===s.gameId))this.scores.push(s);}async leaderboard(level){return this.scores.filter(s=>s.level===level&&s.won);}}
test('registration, cookies, CSRF, server scoring, leaderboard and logout',async t=>{const repo=new MemoryRepo(),r=await createApp({repo,fish:{next:async()=>localPuzzle()}}),server=r.app.listen(0);await new Promise(resolve=>server.on('listening',resolve));const base=`http://127.0.0.1:${server.address().port}/api`;t.after(async()=>{await new Promise(resolve=>server.close(resolve));await r.close();});let cookie='',csrf='';async function request(path,body,headers={}){return fetch(base+path,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json','X-CSRF-Token':csrf}:{}),Cookie:cookie,...headers},body:body?JSON.stringify(body):undefined});}
 assert.equal((await request('/game/start',{level:'easy'})).status,401);
 assert.equal((await request('/auth/register',{username:'rescuer',password:'TestPass123'})).status,201);
 assert.notEqual(repo.users[0].passwordHash,'TestPass123');
 const login=await request('/auth/login',{username:'rescuer',password:'TestPass123'});assert.equal(login.status,200);const c=login.headers.get('set-cookie');assert.match(c,/HttpOnly/);assert.match(c,/SameSite=Strict/);cookie=c.split(';')[0];csrf=(await login.json()).csrf;
 assert.equal((await request('/game/start',{level:'easy'},{'X-CSRF-Token':''})).status,403);
 assert.equal((await request('/game/start',{level:'easy'},{Origin:'https://evil.example'})).status,403);
 let state=await (await request('/game/start',{level:'easy'})).json();assert.equal(state.fish,undefined);assert.equal(state.chest,undefined);
 for(let i=0;i<8;i++){await request('/game/ready',{puzzleId:state.puzzleId});const g=r.games.get('rescuer');const id=state.puzzleId;state=await (await request('/game/answer',{puzzleId:id,fish:g.puzzle.fish,chest:g.puzzle.chest,score:999999})).json();assert.equal((await request('/game/answer',{puzzleId:id,fish:1,chest:1})).status,409);}
 assert.equal(state.status,'won');assert.equal(state.score,130);await request('/game');await request('/game');assert.equal(repo.scores.length,1);assert.equal((await (await request('/leaderboard/easy')).json()).entries[0].score,130);
 assert.equal((await request('/auth/logout',{})).status,200);assert.equal((await request('/auth/me')).status,401);
});
