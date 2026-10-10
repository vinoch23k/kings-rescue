// AI-assisted tests. See AI_DISCLOSURE.md.
import test from 'node:test';import assert from 'node:assert/strict';
import {GameEngine} from '../src/game-engine.js';
import {LEVELS} from '../src/level-config.js';
const puzzle={fish:3,chest:2,source:'offline',image:Buffer.from('image'),mime:'image/png'};
function setup(level='easy'){let now=1000;const g=new GameEngine(level,()=>now);const next=()=>{g.setPuzzle(puzzle);g.ready(g.puzzle.id);};next();return {g,next,advance:ms=>now+=ms};}
test('configuration matches all three proposed levels',()=>{assert.deepEqual(Object.values(LEVELS).map(l=>[l.seconds,l.target,l.lives,l.hints]),[[60,8,3,3],[40,10,3,2],[30,15,3,1]]);});
for(const level of Object.keys(LEVELS))for(const lives of [1,2,3])test(`${level}: victory and ${lives}-life bonus`,()=>{const {g,next}=setup(level);for(let i=3;i>lives;i--){g.submit(g.puzzle.id,0,0);next();}for(let i=0;i<LEVELS[level].target;i++){g.submit(g.puzzle.id,3,2);if(g.status==='loading')next();}assert.equal(g.status,'won');assert.equal(g.score,LEVELS[level].target*10+({1:10,2:30,3:50})[lives]);});
test('wrong chest loses a life without reversing checkpoint',()=>{const {g,next}=setup();g.submit(g.puzzle.id,3,2);next();g.submit(g.puzzle.id,3,99);assert.equal(g.lives,2);assert.equal(g.progress,1);assert.equal(g.score,10);assert.equal(g.remaining,65000);});
test('three wrong answers end the level',()=>{const {g,next}=setup();for(let i=0;i<3;i++){g.submit(g.puzzle.id,0,0);if(i<2)next();}assert.equal(g.status,'lost');assert.equal(g.lives,0);});
test('wall-clock expiry wins race against final answer',()=>{const {g,advance}=setup();advance(60000);assert.throws(()=>g.submit(g.puzzle.id,3,2));assert.equal(g.status,'lost');assert.equal(g.score,0);});
test('countdown pauses during loading then resumes with bonus',()=>{const {g,next,advance}=setup();advance(12000);g.submit(g.puzzle.id,3,2);advance(18000);assert.equal(g.state().remainingMs,53000);next();advance(1000);assert.equal(g.state().remainingMs,52000);});
test('same puzzle hint is idempotent and reveals fish only',()=>{const {g}=setup();assert.equal(g.hint(g.puzzle.id),3);assert.equal(g.hint(g.puzzle.id),3);assert.equal(g.hints,2);assert.equal(g.state().hintFish,3);assert.equal(g.state().chest,undefined);});
test('hard permits one hint; next puzzle cannot reveal another',()=>{const {g,next}=setup('hard');g.hint(g.puzzle.id);g.submit(g.puzzle.id,3,2);next();assert.throws(()=>g.hint(g.puzzle.id));});
test('old puzzle id and invalid numbers do not mutate state',()=>{const {g,next}=setup();const old=g.puzzle.id;assert.throws(()=>g.submit(old,2.5,2));assert.equal(g.lives,3);g.submit(old,3,2);next();assert.throws(()=>g.submit(old,3,2));assert.equal(g.score,10);});
test('loading cannot pause a round indefinitely',()=>{const {g,advance}=setup();g.submit(g.puzzle.id,3,2);advance(45001);assert.equal(g.state().status,'lost');});
test('public state does not disclose expected counts or image source URL',()=>{const {g}=setup();const state=g.state();for(const key of ['fish','chest','image','imageUrl','deadline'])assert.equal(state[key],undefined);});
test('custom events separate rules from observers',()=>{const {g}=setup();let reached=0;g.bus.on('checkpoint:reached',()=>reached++);g.submit(g.puzzle.id,3,2);assert.equal(reached,1);});
