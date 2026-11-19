const {test}=require('node:test');
const assert=require('node:assert/strict');
require('../futebol.js');
const roster=ovr=>Array.from({length:11},(_,i)=>({id:'p'+i,name:'Jogador '+i,ovr,role:String(i)}));
function game(ovr=74){const g=new FutebolArcade({home:roster(ovr),away:roster(74),seed:12345});g.phase='play';g.paused=false;return g;}
function steps(g,n){for(let i=0;i<n;i++)g.update(1/60);}
test('movimento responde ao controle e sprint consome energia; OVR muda a velocidade',()=>{
 const g=game();g.ball.owner=-1;g.ball.x=900;g.ball.y=600;const p=g.players[g.selected],x=p.x;
 g.setInput(1,0,true);steps(g,20);assert(p.x>x+35);assert(p.energy<.95);
 assert(g.speed({...p,ovr:95},false)>g.speed({...p,ovr:55},false));
 const old=p.x;g.pause();steps(g,60);assert.equal(p.x,old);
});
test('passe usa um companheiro e muda o jogador controlado',()=>{
 const g=game();g.claim(9);const before=g.selected;assert(g.passOrSwitch());
 assert.equal(g.ball.owner,-1);assert.notEqual(g.selected,before);assert.equal(g.stats.passes[0],1);assert(g.ball.vx>0||Math.abs(g.ball.vy)>50);
});
test('força do chute aumenta com a carga; soltar novamente não duplica a finalização',()=>{
 const a=game();a.claim(9);a.beginShot();a.charge=.2;a.releaseShot();const slow=Math.hypot(a.ball.vx,a.ball.vy);
 const b=game();b.claim(9);b.beginShot();b.charge=1;b.releaseShot();assert(Math.hypot(b.ball.vx,b.ball.vy)>slow+200);
 assert.equal(b.releaseShot(),false);assert.equal(b.stats.shots[0],1);
});
test('chute veloz cruza a linha e conta só um gol, com autor e assistência',()=>{
 const g=game();Object.assign(g.ball,{owner:-1,x:1005,y:350,vx:940,vy:0,last:9,assist:7,shotBy:9});
 g.updateBall(1/60);assert.deepEqual(g.score,[1,0]);assert.equal(g.events[0].scorer,9);assert.equal(g.events[0].assist,7);
 assert.equal(g.phase,'goal');steps(g,40);assert.equal(g.score[0],1);assert(FutebolArcade.validState(g.snapshot()));
});
test('saída fora do gol vira tiro de meta e não aumenta o placar',()=>{
 const g=game();Object.assign(g.ball,{owner:-1,x:1005,y:200,vx:940,vy:0,last:9,shotBy:9});
 g.updateBall(1/60);assert.deepEqual(g.score,[0,0]);assert.equal(g.ball.owner,11);assert.equal(g.phase,'restart');
});
test('goleiro intercepta a trajetória entre frames, sem atravessar a bola',()=>{
 const g=game();g.random=()=>0;const k=g.players[11];k.x=980;k.y=360;k.cooldown=0;
 Object.assign(g.ball,{owner:-1,x:965,y:360,vx:900,vy:0,last:9,shotBy:9,age:.4});g.updateBall(1/60);
 assert.equal(g.stats.saves[1],1);assert.equal(g.ball.owner,11);
});
test('restaurar partida preserva jogadores, bola, relógio e aleatoriedade; rejeita estado inválido',()=>{
 const a=game();a.setInput(.3,-1);steps(a,30);const state=a.snapshot();assert(FutebolArcade.validState(state));
 const b=new FutebolArcade({home:roster(74),away:roster(74),state});assert.deepEqual(b.snapshot(),state);assert.equal(a.random(),b.random());
 const bad=JSON.parse(JSON.stringify(state));bad.ball.x=Infinity;assert.equal(FutebolArcade.validState(bad),false);
 bad.ball.x=500;bad.score[0]=3;assert.equal(FutebolArcade.validState(bad),false);
});
test('uma partida inteira permanece finita, o adversário joga e o fim acontece uma única vez',()=>{
 const g=game();let ends=0;g.onEnd=()=>ends++;
 for(let i=0;i<15000&&g.phase!=='end';i++){
  if(i%40===0)g.setInput(Math.sin(i/200),Math.cos(i/230),i%100<30);
  if(i%120===0)g.passOrSwitch();
  if(i%180===0)g.beginShot();if(i%180===40)g.releaseShot();g.update(1/60);
  if(i%120===0)assert(FutebolArcade.validState(g.snapshot()),'estado inválido no passo '+i);
 }
 assert.equal(g.phase,'end');assert.equal(g.elapsed,90);assert.equal(ends,1);steps(g,120);assert.equal(ends,1);
 assert(g.stats.possession[1]>0);assert(g.stats.passes[1]+g.stats.shots[1]>0);assert(FutebolArcade.validState(g.snapshot()));
});
