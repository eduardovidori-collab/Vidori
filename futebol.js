/* Copeiro — futebol arcade. Simulação independente do DOM, com passo fixo de 1/60 s. */
(function(root){
'use strict';
const W=1100,H=720,L=92,R=1008,T=82,B=638,G0=274,G1=446,DURATION=90;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),len=(x,y)=>Math.hypot(x,y);
const distance=(a,b)=>len(a.x-b.x,a.y-b.y);
const FORMACAO=[[112,360],[252,146],[238,276],[238,444],[252,574],[382,360],[452,230],[452,490],[608,157],[642,360],[608,563]];
const clone=v=>JSON.parse(JSON.stringify(v));
const finite=(v,a,b)=>Number.isFinite(v)&&v>=a&&v<=b;
class FutebolArcade{
  constructor(options={}){
    this.canvas=options.canvas||null;this.ctx=this.canvas?.getContext('2d')||null;
    this.onEvent=options.onEvent||(()=>{});this.onEnd=options.onEnd||(()=>{});this.onHud=options.onHud||(()=>{});
    this.stadium=options.stadium||{};this.awayColor=options.awayColor||'#E5B45C';this.reducedMotion=!!options.reducedMotion;
    this.difficulty=clamp((options.difficulty??74)-50,0,50)/50;
    const home=options.home||[],away=options.away||[];
    this.players=Array.from({length:22},(_,i)=>{
      const team=i<11?0:1,n=i%11,f=(team?away:home)[n]||{};
      return {id:f.id||'jogador-'+i,name:f.name||String(n+1),ovr:clamp(f.ovr??70,50,100),role:f.role||'',team,n,
        x:0,y:0,vx:0,vy:0,face:team?Math.PI:0,energy:1,cooldown:0,think:.3+i*.021,step:0};
    });
    this.ball={x:550,y:360,vx:0,vy:0,z:0,owner:9,last:9,passFrom:-1,assist:-1,shotBy:-1,age:0};
    this.elapsed=0;this.score=[0,0];this.events=[];this.stats={shots:[0,0],passes:[0,0],completed:[0,0],saves:[0,0],possession:[0,0]};
    this.seed=(options.seed>>>0)||((Math.random()*4294967295)>>>0)||1;
    this.phase='ready';this.phaseTimer=0;this.kickoffTeam=0;this.selected=9;this.paused=true;
    this.input={x:0,y:0,sprint:false};this.charging=false;this.charge=0;this.notice='';this.noticeTime=0;
    this.raf=null;this.lastFrame=0;this.accumulator=0;this.view={w:1100,h:720,scale:1,portrait:false,cx:550,cy:360};
    this.trail=[];this.particles=[];this.shake=0;this.background=null;this.disposed=false;this.lastHud=-1;
    this.resetFormation(0);if(options.state&&FutebolArcade.validState(options.state))this.restore(options.state);
    this.resize();this.render();
  }
  static get duration(){return DURATION;}
  static validState(s){
    if(!s||s.v!==1||!finite(s.elapsed,0,DURATION)||!['ready','kickoff','play','goal','restart','end'].includes(s.phase)||
      !finite(s.phaseTimer,0,4)||![0,1].includes(s.kickoffTeam)||!Number.isInteger(s.selected)||s.selected<0||s.selected>10||
      !Number.isInteger(s.seed)||s.seed<1||s.seed>4294967295||!Array.isArray(s.score)||s.score.length!==2||
      !s.score.every(n=>Number.isInteger(n)&&n>=0&&n<=99)||!Array.isArray(s.players)||s.players.length!==22||!Array.isArray(s.events)||s.events.length>198)return false;
    for(const p of s.players)if(!p||!finite(p.x,L-30,R+30)||!finite(p.y,T-30,B+30)||!finite(p.vx,-500,500)||!finite(p.vy,-500,500)||
      !finite(p.face,-100,100)||!finite(p.energy,0,1)||!finite(p.cooldown,0,4)||!finite(p.think,0,4)||!finite(p.step,0,1e7))return false;
    const b=s.ball;if(!b||!finite(b.x,-100,W+100)||!finite(b.y,-100,H+100)||!finite(b.vx,-1800,1800)||!finite(b.vy,-1800,1800)||
      !finite(b.z,0,60)||!finite(b.age,0,1e7)||!['owner','last','passFrom','assist','shotBy'].every(k=>Number.isInteger(b[k])&&b[k]>=-1&&b[k]<22))return false;
    const goals=[0,0];for(const e of s.events){
      if(!e||!finite(e.t,0,DURATION)||![0,1].includes(e.team)||!Number.isInteger(e.scorer)||e.scorer< -1||e.scorer>21||
        !Number.isInteger(e.assist)||e.assist< -1||e.assist>21||typeof e.ownGoal!=='boolean')return false;
      goals[e.team]++;
    }
    if(goals.some((v,i)=>v!==s.score[i])||(s.phase==='end'&&s.elapsed!==DURATION)||!s.stats)return false;
    return ['shots','passes','completed','saves','possession'].every(k=>Array.isArray(s.stats[k])&&s.stats[k].length===2&&s.stats[k].every(n=>finite(n,0,10000)));
  }
  random(){let x=this.seed;x^=x<<13;x^=x>>>17;x^=x<<5;this.seed=(x>>>0)||1;return this.seed/4294967296;}
  snapshot(){
    return {v:1,elapsed:this.elapsed,score:[...this.score],phase:this.phase,phaseTimer:this.phaseTimer,kickoffTeam:this.kickoffTeam,
      selected:this.selected,seed:this.seed,ball:{...this.ball},events:clone(this.events),stats:clone(this.stats),
      players:this.players.map(p=>({x:p.x,y:p.y,vx:p.vx,vy:p.vy,face:p.face,energy:p.energy,cooldown:p.cooldown,think:p.think,step:p.step}))};
  }
  restore(s){
    this.elapsed=s.elapsed;this.score=[...s.score];this.phase=s.phase;this.phaseTimer=s.phaseTimer;this.kickoffTeam=s.kickoffTeam;
    this.selected=s.selected;this.seed=s.seed;this.ball={...s.ball};this.events=clone(s.events);this.stats=clone(s.stats);
    this.players.forEach((p,i)=>{for(const k of ['x','y','vx','vy','face','energy','cooldown','think','step'])p[k]=s.players[i][k];});
  }
  resetFormation(team){
    this.players.forEach(p=>{const f=FORMACAO[p.n];p.x=p.team?Math.max(580,W-f[0]):Math.min(520,f[0]);p.y=p.team?H-f[1]:f[1];p.vx=p.vy=0;p.face=p.team?Math.PI:0;});
    const i=team?20:9,p=this.players[i];p.x=team?565:535;p.y=360;
    this.ball={x:p.x,y:p.y,vx:0,vy:0,z:0,owner:i,last:i,passFrom:-1,assist:-1,shotBy:-1,age:0};
    this.selected=team?5:9;this.kickoffTeam=team;this.charging=false;this.charge=0;
  }
  start(){if(this.phase==='ready'){this.phase='kickoff';this.phaseTimer=2.1;}this.resume();}
  resume(){if(this.disposed||this.phase==='end')return;this.paused=false;this.lastFrame=0;this.accumulator=0;
    if(typeof requestAnimationFrame==='function'&&this.raf===null)this.raf=requestAnimationFrame(t=>this.frame(t));this.hud(true);}
  pause(){this.paused=true;this.input={x:0,y:0,sprint:false};this.charging=false;this.charge=0;this.lastFrame=0;
    if(this.raf!==null&&typeof cancelAnimationFrame==='function')cancelAnimationFrame(this.raf);this.raf=null;this.render();this.hud(true);}
  destroy(){this.pause();this.disposed=true;this.background=null;this.ctx=null;}
  frame(now){
    this.raf=null;if(this.paused||this.disposed)return;
    const dt=this.lastFrame?Math.min(.1,(now-this.lastFrame)/1000):0;this.lastFrame=now;this.accumulator+=dt;
    while(this.accumulator>=1/60){this.update(1/60);this.accumulator-=1/60;}
    this.render();this.hud();if(!this.paused&&this.phase!=='end')this.raf=requestAnimationFrame(t=>this.frame(t));
  }
  setInput(x,y,sprint=false){const m=Math.max(1,len(x,y));this.input={x:x/m,y:y/m,sprint:!!sprint};}
  worldInput(){return this.view.portrait?{x:-this.input.y,y:this.input.x}:{x:this.input.x,y:this.input.y};}
  speed(p,sprint=false){return (158+(p.ovr-50)*.85)*(sprint&&p.energy>.06?1.32:1)*(this.ball.owner===this.players.indexOf(p)?.9:1);}
  beginShot(){
    if(this.paused||this.phase!=='play')return false;
    if(this.ball.owner>=0&&this.players[this.ball.owner].team===0){this.selected=this.ball.owner;this.charging=true;this.charge=.15;return true;}
    this.tackle(this.selected,true);return false;
  }
  releaseShot(){if(!this.charging)return false;const charge=this.charge;this.charging=false;this.charge=0;
    if(this.paused||this.phase!=='play'||this.ball.owner!==this.selected)return false;
    return this.shoot(this.selected,charge);}
  passOrSwitch(){
    if(this.paused||this.phase!=='play')return false;
    const owner=this.ball.owner;
    if(owner>=0&&this.players[owner].team===0){this.selected=owner;return this.pass(owner,this.worldInput());}
    const choices=this.players.slice(1,11).sort((a,b)=>distance(a,this.ball)-distance(b,this.ball));
    const current=choices.findIndex(p=>this.players.indexOf(p)===this.selected);
    this.selected=this.players.indexOf(choices[current===0?1:0]);this.charging=false;return true;
  }
  pass(index,direction=null){
    const p=this.players[index];if(this.ball.owner!==index)return false;
    const attacking=p.team?-1:1;let best=null,bestValue=-Infinity;
    for(let i=0;i<22;i++){
      const q=this.players[i];if(q.team!==p.team||i===index||q.n===0)continue;
      const dx=q.x-p.x,dy=q.y-p.y,d=len(dx,dy);if(d<40||d>490)continue;
      const enemies=this.players.filter(e=>e.team!==p.team),space=Math.min(...enemies.map(e=>distance(e,q)));
      const intent=direction&&len(direction.x,direction.y)>.25?(dx*direction.x+dy*direction.y)/d:(dx*attacking/d);
      const lane=enemies.some(e=>{const f=clamp(((e.x-p.x)*dx+(e.y-p.y)*dy)/(d*d),0,1);return f>.1&&f<.9&&len(e.x-p.x-dx*f,e.y-p.y-dy*f)<21;})?110:0;
      const value=intent*165+Math.min(space,110)*.75-d*.12+(q.x-p.x)*attacking*.1-lane;
      if(value>bestValue){bestValue=value;best=i;}
    }
    if(best===null)return false;
    const q=this.players[best],flight=distance(p,q)/570;
    const angle=Math.atan2(q.y+q.vy*flight*.45-p.y,q.x+q.vx*flight*.45-p.x)+(this.random()-.5)*(100-p.ovr)*.002;
    this.kick(index,angle,550+(p.ovr-50)*2,'pass');this.stats.passes[p.team]++;
    if(p.team===0)this.selected=best;this.hud(true);
    this.notify('pass',p.name+' tocou a bola.');return true;
  }
  aimY(p){
    const move=p.team?{y:p.vy}:this.worldInput(),keeper=this.players[p.team?0:11];
    const neutral=360+(keeper.y>=360?-1:1)*(24+(p.ovr-50)*.65);
    return clamp(Math.abs(move.y)>.12?360+move.y*(p.team?.34:62):neutral,G0+15,G1-15);
  }
  shoot(index,power=.6){
    const p=this.players[index];if(this.ball.owner!==index)return false;
    const direction=p.team?-1:1,goalX=p.team?L-15:R+15,targetY=this.aimY(p);
    const error=(this.random()-.5)*(100-p.ovr)*.0036*(1+(power>.85?.3:0));
    const angle=Math.atan2(targetY-p.y,goalX-p.x)+error;
    if(Math.cos(angle)*direction<0)return false;
    this.kick(index,angle,570+clamp(power,.15,1)*370,'shot');this.stats.shots[p.team]++;
    this.notify('shot',p.name+' finalizou!');return true;
  }
  kick(index,angle,power,type){
    const p=this.players[index],b=this.ball;
    b.x=p.x+Math.cos(angle)*20;b.y=p.y+Math.sin(angle)*20;b.vx=Math.cos(angle)*power;b.vy=Math.sin(angle)*power;
    b.owner=-1;b.last=index;b.age=0;b.z=type==='shot'?10:2;b.shotBy=type==='shot'?index:-1;
    if(type==='pass'){b.passFrom=index;b.assist=-1;}else b.passFrom=-1;
    p.cooldown=.22;p.face=angle;
  }
  claim(index){
    const b=this.ball,p=this.players[index],previous=b.last;
    if(b.passFrom>=0&&b.passFrom!==index&&this.players[b.passFrom].team===p.team){this.stats.completed[p.team]++;b.assist=b.passFrom;}
    else if(previous>=0&&this.players[previous].team!==p.team)b.assist=-1;
    b.owner=index;b.last=index;b.passFrom=-1;b.shotBy=-1;b.vx=b.vy=0;b.z=0;b.age=0;
    if(p.team===0)this.selected=index;this.hud(true);
  }
  tackle(index,manual=false){
    const p=this.players[index],b=this.ball;if(p.cooldown>0||b.owner<0||this.players[b.owner].team===p.team||p.n===0)return false;
    const q=this.players[b.owner],d=distance(p,q);p.cooldown=manual?.7:.65+this.random()*.4;
    if(d>(manual?49:24))return false;
    const chance=clamp((manual?.76:p.team?.29+this.difficulty*.3:.48)+(p.ovr-q.ovr)*.006-(manual?d/240:0),.16,.92);
    if(this.random()<chance){this.claim(index);q.cooldown=.5;this.notify('tackle',p.name+' recuperou a bola.');return true;}
    return false;
  }
  move(p,tx,ty,dt,multiplier=1,sprint=false){
    const dx=tx-p.x,dy=ty-p.y,d=len(dx,dy),speed=this.speed(p,sprint)*multiplier;
    const vx=d>2?dx/d*Math.min(speed,d*7):0,vy=d>2?dy/d*Math.min(speed,d*7):0;
    const blend=1-Math.exp(-12*dt);p.vx+=(vx-p.vx)*blend;p.vy+=(vy-p.vy)*blend;
  }
  ai(dt){
    const b=this.ball,owner=b.owner>=0?this.players[b.owner]:null;
    const press=[0,1].map(team=>this.players.map((p,i)=>({p,i,d:distance(p,owner||b)})).filter(v=>v.p.team===team&&v.p.n!==0&&v.i!==this.selected).sort((a,b)=>a.d-b.d).slice(0,2).map(v=>v.i));
    for(let i=0;i<22;i++){
      const p=this.players[i];if(i===this.selected)continue;
      if(p.n===0){
        const ownX=p.team?R-22:L+22,near=p.team?b.x>700:b.x<400;
        let tx=ownX+(p.team?-1:1)*(near?19:5),ty=clamp(360+(b.y-360)*(near?.58:.25),G0+20,G1-20);
        if(b.owner===i){
          p.think-=dt;if(p.think<=0){p.think=.7;this.pass(i);}
        }
        this.move(p,tx,ty,dt,.88);continue;
      }
      const dir=p.team?-1:1,attack=owner?.team===p.team,base=FORMACAO[p.n],bx=p.team?W-base[0]:base[0],by=p.team?H-base[1]:base[1];
      const quality=p.team?(.74+this.difficulty*.35):1;
      if(b.owner===i){
        const rivals=this.players.filter(q=>q.team!==p.team&&q.n!==0),nearest=rivals.reduce((a,q)=>distance(q,p)<distance(a,p)?q:a,rivals[0]);
        const gap=distance(p,nearest),goalDistance=p.team?p.x-L:R-p.x;
        let ty=clamp(p.y+(p.y-nearest.y)*(gap<90?.8:.05)+(360-p.y)*.045,T+40,B-40);
        this.move(p,p.x+dir*130,ty,dt,quality*.94);
        p.think-=dt;
        if(p.think<=0){
          p.think=.28+this.random()*(.65-this.difficulty*.25);
          if(goalDistance<260&&Math.abs(p.y-360)<190)this.shoot(i,.45+this.random()*.5);
          else if(gap<63||this.random()<.18)this.pass(i);
        }
      }else if(!attack&&press[p.team].includes(i)){
        this.move(p,b.x+(owner?owner.vx*.1:0),b.y+(owner?owner.vy*.1:0),dt,quality);
        if(owner)this.tackle(i,false);
      }else{
        let tx=bx+(b.x-550)*.23+(attack?dir*95:-dir*30),ty=by+(b.y-360)*.18;
        if(attack&&p.n>=8){tx+=dir*40;ty=by+(b.y-360)*.08;}
        if(!attack&&owner){
          const target=this.players.filter(q=>q.team!==p.team&&q.n>5).sort((a,b)=>distance(a,p)-distance(b,p))[0];
          if(target&&distance(target,p)<150){tx=tx*.55+(target.x-dir*25)*.45;ty=ty*.55+target.y*.45;}
        }
        // Descola companheiros para abrir linhas de passe, sem formar um enxame na bola.
        for(const q of this.players){if(q===p||q.team!==p.team)continue;const d=distance(p,q);if(d<48&&d>0){tx+=(p.x-q.x)/d*24;ty+=(p.y-q.y)/d*24;}}
        this.move(p,clamp(tx,L+45,R-45),clamp(ty,T+30,B-30),dt,quality*.87);
      }
    }
  }
  update(dt){
    if(this.paused||this.disposed||this.phase==='ready'||this.phase==='end')return;
    dt=clamp(dt,0,1/30);this.noticeTime=Math.max(0,this.noticeTime-dt);this.shake=Math.max(0,this.shake-dt);
    this.particles=this.particles.filter(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=130*dt;p.life-=dt;return p.life>0;});
    if(this.phase!=='play'){
      this.phaseTimer=Math.max(0,this.phaseTimer-dt);
      if(this.phaseTimer===0){if(this.phase==='goal')this.resetFormation(this.kickoffTeam);this.phase='play';this.notify('kickoff','Bola rolando!');}
      return;
    }
    this.elapsed=Math.min(DURATION,this.elapsed+dt);
    if(this.elapsed>=DURATION){this.phase='end';this.charging=false;this.paused=true;this.onEnd(this.snapshot());this.hud(true);return;}
    const selected=this.players[this.selected],input=this.worldInput(),sprint=this.input.sprint&&len(input.x,input.y)>.1;
    if(this.charging)this.charge=Math.min(1,this.charge+dt*1.15);
    this.move(selected,selected.x+input.x*90,selected.y+input.y*90,dt,this.charging?.78:1,sprint);
    selected.energy=clamp(selected.energy+(sprint?-.26:.17)*dt,0,1);
    this.ai(dt);
    for(const p of this.players){
      p.cooldown=Math.max(0,p.cooldown-dt);p.x=clamp(p.x+p.vx*dt,L+8,R-8);p.y=clamp(p.y+p.vy*dt,T+10,B-10);
      p.step+=len(p.vx,p.vy)*dt*.06;if(p!==selected)p.energy=Math.min(1,p.energy+dt*.08);
      if(len(p.vx,p.vy)>10)p.face=Math.atan2(p.vy,p.vx);
    }
    for(let i=0;i<22;i++)for(let j=i+1;j<22;j++){
      const a=this.players[i],b=this.players[j],dx=a.x-b.x,dy=a.y-b.y,d=len(dx,dy);
      if(d>0&&d<20){const push=(20-d)*.42;a.x+=dx/d*push;a.y+=dy/d*push;b.x-=dx/d*push;b.y-=dy/d*push;}
    }
    this.updateBall(dt);
    const owner=this.ball.owner>=0?this.players[this.ball.owner]:null;
    if(owner)this.stats.possession[owner.team]+=dt;
    if(owner?.team===1&&this.players[this.selected].n===0)this.selectNearest();
  }
  updateBall(dt){
    const b=this.ball;b.age+=dt;
    if(b.owner>=0){const p=this.players[b.owner];
      b.x=clamp(p.x+Math.cos(p.face)*15,L+2,R-2);b.y=clamp(p.y+Math.sin(p.face)*15,T+3,B-3);b.vx=p.vx;b.vy=p.vy;b.z=0;
      if(p.team===1&&distance(this.players[this.selected],p)<20)this.tackle(this.selected,false);
      this.trail=[];return;
    }
    const prev={x:b.x,y:b.y};b.x+=b.vx*dt;b.y+=b.vy*dt;const drag=Math.exp(-.62*dt);b.vx*=drag;b.vy*=drag;b.z=Math.max(0,b.z-dt*13);
    // A interseção com a linha evita que chutes rápidos atravessem o gol sem contar.
    if((prev.x>=L&&b.x<L)||(prev.x<=R&&b.x>R)){
      const line=b.x<L?L:R,t=(line-prev.x)/(b.x-prev.x),y=prev.y+(b.y-prev.y)*t;
      if(y>G0+4&&y<G1-4){this.goal(line===R?0:1);return;}
      this.out(line===R?'right':'left');return;
    }
    if(b.y<T||b.y>B){this.out(b.y<T?'top':'bottom');return;}
    const speed=len(b.vx,b.vy);
    for(let i=0;i<22;i++){
      const p=this.players[i];if(p.cooldown>0||(i===b.last&&b.age<.24))continue;
      const vx=b.x-prev.x,vy=b.y-prev.y,segment=vx*vx+vy*vy;
      const t=segment?clamp(((p.x-prev.x)*vx+(p.y-prev.y)*vy)/segment,0,1):0;
      const d=len(p.x-prev.x-vx*t,p.y-prev.y-vy*t),reach=p.n===0?21+(p.ovr-50)*.1:13;
      if(d>reach)continue;
      if(p.n===0&&b.shotBy>=0&&this.players[b.shotBy].team!==p.team){
        const save=clamp(.68+(p.ovr-50)*.005-(speed-600)*.00035,.45,.96);
        if(this.random()>save){p.cooldown=.38;continue;}
        this.stats.saves[p.team]++;this.notify('save',p.name+' defendeu!');this.claim(i);p.think=.55;return;
      }
      if(speed<730||p.n===0){this.claim(i);return;}
      b.vx*=-.4;b.vy+=(this.random()-.5)*180;b.shotBy=-1;b.last=i;b.age=0;p.cooldown=.2;
      this.notify('block',p.name+' bloqueou a finalização.');return;
    }
    this.trail.push({x:b.x,y:b.y});if(this.trail.length>7)this.trail.shift();
    if(speed<8){b.vx=b.vy=0;}
  }
  selectNearest(){this.selected=this.players.slice(1,11).reduce((best,p)=>distance(p,this.ball)<distance(this.players[best],this.ball)?this.players.indexOf(p):best,1);this.hud(true);}
  out(edge){
    const b=this.ball,last=b.last>=0?this.players[b.last].team:1;let team=1-last,index;
    if(edge==='left'||edge==='right'){
      const defending=edge==='left'?0:1;
      if(last!==defending){team=defending;index=team?11:0;this.players[index].x=team?R-45:L+45;this.players[index].y=360;this.notice='Tiro de meta';}
      else{team=1-defending;index=team?19:8;this.players[index].x=edge==='right'?R-25:L+25;this.players[index].y=b.y<360?T+20:B-20;this.notice='Escanteio';}
    }else{
      const candidates=this.players.map((p,i)=>({p,i})).filter(q=>q.p.team===team&&q.p.n!==0).sort((a,c)=>distance(a.p,b)-distance(c.p,b));
      index=candidates[0].i;this.players[index].x=clamp(b.x,L+35,R-35);this.players[index].y=edge==='top'?T+20:B-20;this.notice='Lateral · '+(team?'adversário':'seu time');
    }
    this.claim(index);this.phase='restart';this.phaseTimer=.48;this.noticeTime=1.3;this.onEvent({type:'restart',text:this.notice});
  }
  goal(team){
    const b=this.ball,last=b.last>=0?this.players[b.last]:null,own=!!last&&last.team!==team;
    const event={t:this.elapsed,team,scorer:b.last,assist:!own&&b.assist>=0&&b.assist!==b.last&&this.players[b.assist].team===team?b.assist:-1,ownGoal:own};
    this.events.push(event);this.score[team]++;this.phase='goal';this.phaseTimer=2.2;this.kickoffTeam=1-team;
    this.charging=false;this.charge=0;this.shake=.4;this.notice=team?'Gol do adversário':'GOOOL!';this.noticeTime=2.2;
    if(!this.reducedMotion)for(let i=0;i<65;i++)this.particles.push({x:550,y:250,vx:(this.random()-.5)*450,vy:-this.random()*220,life:1+this.random(),color:['#EC394B','#F8F5DE','#151F1C'][i%3]});
    this.onEvent({type:'goal',team,event,text:team?'O adversário marcou. Vamos buscar!':'Gol de '+(last?.name||'seu time')+'!'});this.hud(true);
  }
  notify(type,text){this.notice=text;this.noticeTime=1.3;this.onEvent({type,text});}
  hud(force=false){
    const second=Math.ceil(DURATION-this.elapsed);if(!force&&second===this.lastHud)return;this.lastHud=second;
    const p=this.players[this.selected];this.onHud({remaining:second,score:[...this.score],name:p.name,ovr:p.ovr,phase:this.phase,paused:this.paused,energy:p.energy});
  }
  resize(){
    if(!this.canvas)return;const rect=this.canvas.getBoundingClientRect(),dpr=Math.min(root.devicePixelRatio||1,2);
    this.view.w=Math.max(1,rect.width);this.view.h=Math.max(1,rect.height);this.view.portrait=rect.height>rect.width*1.12;
    this.canvas.width=Math.round(this.view.w*dpr);this.canvas.height=Math.round(this.view.h*dpr);this.dpr=dpr;
    this.view.scale=(this.view.portrait?Math.min(rect.width/H,rect.height/W)*1.13:Math.min(rect.width/W,rect.height/H)*1.02);
    this.background=null;this.render();this.hud(true);
  }
  backgroundCanvas(){
    if(this.background)return this.background;const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;const c=canvas.getContext('2d'),s=this.stadium;
    c.fillStyle='#142A26';c.fillRect(0,0,W,H);
    const rings=clamp(s.aneis||1,1,3);
    for(let i=rings;i>0;i--){c.strokeStyle=s.mosaico?['#D9D9C8','#A53645','#E7E7D7','#263A32'][i]:'#67776C';c.lineWidth=10;c.beginPath();c.roundRect(58-i*12,49-i*12,984+i*24,622+i*24,35+i*10);c.stroke();}
    if(s.publico)for(let row=0;row<rings+1;row++)for(let x=78;x<1030;x+=9){
      if(s.publico===1&&Math.floor(x/9)%3)continue;c.fillStyle=['#E4E3D2','#B43A49','#536355'][Math.floor(x/128)%3];c.beginPath();c.arc(x,45-row*9,2.2,0,7);c.fill();c.beginPath();c.arc(x,675+row*9,2.2,0,7);c.fill();
    }
    if(s.cobertura){c.fillStyle='#BFCFC4';c.beginPath();c.moveTo(38,24);c.quadraticCurveTo(550,-12,1062,24);c.lineTo(1047,39);c.quadraticCurveTo(550,8,53,39);c.fill();}
    c.fillStyle='#7E826A';c.fillRect(75,65,950,590);c.fillStyle=s.grama?'#438251':'#AD875C';c.fillRect(L,T,R-L,B-T);
    if(s.listras)for(let i=0;i<12;i+=2){c.fillStyle='#FFFFFF0B';c.fillRect(L+(R-L)*i/12,T,(R-L)/12,B-T);}
    // Textura leve, estável: não consome aleatoriedade da simulação.
    for(let i=0;i<600;i++){c.fillStyle=i%2?'#FFFFFF06':'#0B2B1410';c.fillRect(L+(i*193)%916,T+(i*131)%556,2,2);}
    c.strokeStyle='#F1F0D9B8';c.lineWidth=2.4;c.strokeRect(L,T,R-L,B-T);c.beginPath();c.moveTo(550,T);c.lineTo(550,B);c.stroke();
    c.beginPath();c.arc(550,360,72,0,Math.PI*2);c.stroke();
    c.strokeRect(L,205,130,310);c.strokeRect(R-130,205,130,310);c.strokeRect(L,288,48,144);c.strokeRect(R-48,288,48,144);
    c.beginPath();c.arc(L+130,360,49,-1.1,1.1);c.stroke();c.beginPath();c.arc(R-130,360,49,Math.PI-1.1,Math.PI+1.1);c.stroke();
    for(const x of [L+96,550,R-96]){c.beginPath();c.arc(x,360,3,0,7);c.fillStyle='#EFEFDC';c.fill();}
    for(const side of [0,1]){const x=side?R:L-25;c.fillStyle='#DCEAD020';c.fillRect(x,G0,25,G1-G0);c.strokeStyle='#EAEEDA';c.lineWidth=4;c.strokeRect(x,G0,25,G1-G0);
      if(s.redes){c.lineWidth=.7;c.strokeStyle='#F4F3D86B';for(let y=G0+9;y<G1;y+=9){c.beginPath();c.moveTo(x,y);c.lineTo(x+25,y);c.stroke();}for(let xx=x+7;xx<x+25;xx+=7){c.beginPath();c.moveTo(xx,G0);c.lineTo(xx,G1);c.stroke();}}
    }
    if(s.refletores)for(const [x,y]of [[65,64],[1035,64],[65,655],[1035,655]]){const gradient=c.createRadialGradient(x,y,0,x,y,230);gradient.addColorStop(0,'#FFF2B324');gradient.addColorStop(1,'#FFF2B300');c.fillStyle=gradient;c.fillRect(x-230,y-230,460,460);c.fillStyle='#FFF3BF';c.fillRect(x-14,y-4,28,8);}
    c.fillStyle='#CCD8BC';c.font='700 12px sans-serif';c.textAlign='center';c.fillText('M O R U M B I   ·   C O P E I R O',550,18);this.background=canvas;return canvas;
  }
  toWorld(x,y){const v=this.view;return v.portrait?{x:550-(y-v.h/2)/v.scale,y:360+(x-v.w/2)/v.scale}:{x:550+(x-v.w/2)/v.scale,y:360+(y-v.h/2)/v.scale};}
  render(){
    const c=this.ctx;if(!c)return;const v=this.view;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.clearRect(0,0,v.w,v.h);c.fillStyle='#142A26';c.fillRect(0,0,v.w,v.h);
    c.save();c.translate(v.w/2,v.h/2);if(this.shake&&!this.reducedMotion)c.translate(Math.sin(this.elapsed*101)*2,Math.cos(this.elapsed*117)*2);
    if(v.portrait)c.rotate(-Math.PI/2);c.scale(v.scale,v.scale);c.translate(-550,-360);c.drawImage(this.backgroundCanvas(),0,0);
    for(let i=0;i<this.trail.length;i++){const p=this.trail[i];c.fillStyle='rgba(249,246,217,'+(i/this.trail.length*.16)+')';c.beginPath();c.arc(p.x,p.y,3+i*.4,0,7);c.fill();}
    const selected=this.players[this.selected],hasBall=this.ball.owner===this.selected;
    if(hasBall&&this.phase==='play'){
      const target=this.aimY(selected),angle=Math.atan2(target-selected.y,R+15-selected.x),reach=70+(this.charging?this.charge*70:0);
      c.save();c.translate(selected.x,selected.y);c.rotate(angle);c.strokeStyle=this.charging?'#F8D865':'#F3EBC09C';c.lineWidth=2;c.setLineDash([5,6]);c.beginPath();c.moveTo(22,0);c.lineTo(reach,0);c.stroke();c.setLineDash([]);c.beginPath();c.moveTo(reach-9,-5);c.lineTo(reach,0);c.lineTo(reach-9,5);c.stroke();c.restore();
    }
    for(const p of [...this.players].sort((a,b)=>a.y-b.y))this.drawPlayer(c,p,this.players.indexOf(p)===this.selected);
    const b=this.ball;c.fillStyle='#102B2159';c.beginPath();c.ellipse(b.x+2,b.y+6,7,3.5,0,0,7);c.fill();c.fillStyle='#FFF9E5';c.strokeStyle='#33493B';c.lineWidth=1.2;c.beginPath();c.arc(b.x,b.y-b.z,6,0,7);c.fill();c.stroke();c.fillStyle='#364536';c.fillRect(b.x-2,b.y-b.z-2,4,4);
    for(const p of this.particles){c.globalAlpha=Math.min(1,p.life);c.fillStyle=p.color;c.fillRect(p.x,p.y,5,3);}c.globalAlpha=1;c.restore();
    this.drawPlayerLabel(c,selected);
    if(this.phase==='kickoff'||this.phase==='goal'||this.phase==='end'||(this.paused&&this.phase!=='ready')){
      const goal=this.phase==='goal',text=goal?(this.kickoffTeam===1?'GOOOL!':'GOL ADVERSÁRIO'):this.phase==='kickoff'?String(Math.ceil(this.phaseTimer)):this.phase==='end'?'APITO FINAL':'PAUSADO';
      const y=v.h*.4;c.fillStyle='#102A22CF';c.beginPath();c.roundRect(v.w*.12,y-41,v.w*.76,90,16);c.fill();c.fillStyle=goal?'#F5D877':'#F5F2DC';c.textAlign='center';c.font='800 '+Math.min(36,v.w*.065)+'px sans-serif';c.fillText(text,v.w/2,y);
      const last=this.events[this.events.length-1],name=last&&this.players[last.scorer]?.name;
      c.fillStyle='#D5E2C8';c.font='12px sans-serif';c.fillText(goal?(name||'A rede balançou!'):this.phase==='kickoff'?'Prepare seu primeiro passe':this.phase==='end'?this.score[0]+' × '+this.score[1]:'Retome quando estiver pronto',v.w/2,y+28);
    }
    if(this.noticeTime>0&&this.phase==='play'){c.fillStyle='#16382BD9';c.beginPath();c.roundRect(v.w*.12,14,v.w*.76,31,9);c.fill();c.fillStyle='#E9EDCF';c.font='600 12px sans-serif';c.textAlign='center';c.fillText(this.notice,v.w/2,34,v.w*.7);}
  }
  drawPlayer(c,p,selected){
    const moving=len(p.vx,p.vy)>18,leg=moving?Math.sin(p.step*2.5)*3:0;
    c.save();c.translate(p.x,p.y);c.fillStyle='#12291D50';c.beginPath();c.ellipse(2,9,13,7,0,0,7);c.fill();
    if(selected){c.strokeStyle='#F2D56B';c.lineWidth=2.4;c.beginPath();c.arc(0,0,20,0,7);c.stroke();c.fillStyle='#EDD46A';c.beginPath();c.moveTo(-5,-30);c.lineTo(5,-30);c.lineTo(0,-24);c.fill();}
    c.rotate(p.face+Math.PI/2);
    c.fillStyle='#142F25';c.fillRect(-7,6+leg,5,9);c.fillRect(2,6-leg,5,9);c.fillStyle=p.team?'#253D49':'#F0F0DF';c.fillRect(-7,9+leg,5,3);c.fillRect(2,9-leg,5,3);
    c.fillStyle=p.n===0?(p.team?'#BC8270':'#D5B465'):p.team?this.awayColor:'#F4F2E5';c.strokeStyle='#203D2C';c.lineWidth=1.1;
    c.beginPath();c.moveTo(-7,-9);c.lineTo(-14,-5);c.lineTo(-11,3);c.lineTo(-7,0);c.lineTo(-7,9);c.lineTo(7,9);c.lineTo(7,0);c.lineTo(11,3);c.lineTo(14,-5);c.lineTo(7,-9);c.closePath();c.fill();c.stroke();
    if(!p.team&&p.n!==0){c.fillStyle='#BD3345';c.fillRect(-7,-2,14,4);c.fillStyle='#233A33';c.fillRect(-7,4,14,3);}
    c.fillStyle=['#BD8C68','#E0B387','#876044','#D1A17B'][p.n%4];c.beginPath();c.arc(0,-10,5.2,0,7);c.fill();c.fillStyle='#30291F';c.beginPath();c.arc(0,-11.5,4.7,Math.PI,Math.PI*2);c.fill();c.restore();
    if(selected&&this.charging){c.strokeStyle='#F8DC6A';c.lineWidth=4;c.beginPath();c.arc(p.x,p.y,24,-Math.PI/2,-Math.PI/2+this.charge*Math.PI*2);c.stroke();}
  }
  drawPlayerLabel(c,p){
    if(this.phase==='ready')return;const v=this.view;let x,y;
    if(v.portrait){x=v.w/2+(p.y-360)*v.scale;y=v.h/2-(p.x-550)*v.scale;}
    else{x=v.w/2+(p.x-550)*v.scale;y=v.h/2+(p.y-360)*v.scale;}
    const name=p.name+' · '+p.ovr;c.font='700 11px sans-serif';const width=Math.min(c.measureText(name).width+18,v.w-20);
    x=clamp(x,width/2+6,v.w-width/2-6);y=clamp(y+30,53,v.h-13);c.fillStyle='#142F27E8';c.beginPath();c.roundRect(x-width/2,y-13,width,22,7);c.fill();c.fillStyle='#F3E5B7';c.textAlign='center';c.fillText(name,x,y+2,width-12);
  }
}
root.FutebolArcade=FutebolArcade;
})(typeof window==='undefined'?globalThis:window);
