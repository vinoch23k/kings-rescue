// AI-assisted implementation. See AI_DISCLOSURE.md.
import { randomUUID } from 'node:crypto';
import { LEVELS } from './level-config.js';
import { EventBus } from './event-bus.js';
export class GameError extends Error { constructor(message,status=409){super(message);this.status=status;} }
// Rules depend only on configuration, an injectable clock and events; no HTTP or DOM.
export class GameEngine {
 constructor(level, clock=Date.now, bus=new EventBus()) {
  if(!LEVELS[level]) throw new GameError('Choose a valid level.',400);
  this.id=randomUUID();this.level=level;this.config=LEVELS[level];this.clock=clock;this.bus=bus;
  this.lives=3;this.hints=this.config.hints;this.progress=0;this.score=0;
  this.remaining=this.config.seconds*1000;this.status='loading';this.loadingSince=clock();
  this.puzzle=null;this.deadline=null;this.saved=false;this.updated=clock();this.low=false;
 }
 sync(){
  if(this.status==='playing'){
   this.remaining=Math.max(0,this.deadline-this.clock());
   if(this.remaining<=10000&&!this.low){this.low=true;this.bus.emit('time:low',{gameId:this.id});}
   if(this.remaining===0)this.end(false,'Time ran out');
  } else if(this.status==='loading' && this.clock()-this.loadingSince>45000) this.end(false,'Puzzle loading timed out');
 }
 state(){this.sync();return {id:this.id,level:this.level,status:this.status,remainingMs:this.remaining,lives:this.lives,hints:this.hints,progress:this.progress,target:this.config.target,score:this.score,puzzleId:this.puzzle?.id,source:this.puzzle?.source,hintFish:this.puzzle?.revealed?this.puzzle.fish:undefined,rating:this.rating,reason:this.reason};}
 setPuzzle(puzzle){if(this.status!=='loading')return;this.puzzle={...puzzle,id:randomUUID(),revealed:false};this.bus.emit('puzzle:received',{gameId:this.id,source:puzzle.source});}
 checkPuzzle(id){this.sync();if(!this.puzzle||id!==this.puzzle.id)throw new GameError('This puzzle is no longer current.');}
 ready(id){this.checkPuzzle(id);if(this.status==='loading'){this.status='playing';this.deadline=this.clock()+this.remaining;this.bus.emit('puzzle:ready',{gameId:this.id});}return this.state();}
 submit(id,fish,chest){
  this.checkPuzzle(id);
  if(this.status!=='playing')throw new GameError('This round is not accepting answers.');
  if(![fish,chest].every(n=>Number.isInteger(n)&&n>=0&&n<=100))throw new GameError('Enter whole numbers from 0 to 100.',400);
  const correct=fish===this.puzzle.fish&&chest===this.puzzle.chest;
  if(correct){this.progress++;this.score+=10;this.remaining+=5000;this.bus.emit('answer:correct',{gameId:this.id});this.bus.emit('checkpoint:reached',{gameId:this.id,progress:this.progress});}
  else{this.lives--;this.bus.emit('answer:wrong',{gameId:this.id});this.bus.emit('life:lost',{gameId:this.id,lives:this.lives});}
  if(this.lives===0)this.end(false,'All lives lost');
  else if(this.progress===this.config.target)this.end(true,'King rescued');
  else {this.status='loading';this.loadingSince=this.clock();this.deadline=null;this.puzzle=null;}
  return correct;
 }
 hint(id){this.checkPuzzle(id);if(this.status!=='playing')throw new GameError('Wait for the puzzle.');
  if(this.puzzle.revealed)return this.puzzle.fish;
  if(this.hints===0)throw new GameError('No hints left.');
  this.hints--;this.puzzle.revealed=true;this.bus.emit('hint:used',{gameId:this.id});return this.puzzle.fish;
 }
 end(won,reason){if(['won','lost'].includes(this.status))return;this.status=won?'won':'lost';this.reason=reason;
  if(won){this.score+=({3:50,2:30,1:10})[this.lives];this.rating=({3:'Perfect Rescue',2:'Great Rescue',1:'Close Rescue'})[this.lives];}
  else this.rating='Rescue Failed';this.bus.emit('level:end',{gameId:this.id,won,score:this.score});
 }
}
