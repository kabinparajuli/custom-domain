const STORE="fm_pro_v2_";
const defaults={balance:125680,level:1,xp:0,power:10,sound:true,anim:true,vibrate:true,catches:[],missions:{},owned:[],daily:null};
let s=JSON.parse(localStorage.getItem(STORE+"state")||"null")||structuredClone(defaults);
let game={score:0,combo:1,round:1,time:60,auto:false,turbo:false,autoTimer:null,timer:null,fishTimer:null,tournament:false,tourScore:0};
const $=id=>document.getElementById(id);
const fishTypes=[
 {e:"🐠",v:25,n:"Blue Fish"},{e:"🐡",v:15,n:"Puffer"},{e:"🐢",v:35,n:"Turtle"},
 {e:"🦈",v:60,n:"Shark"},{e:"🐟",v:8,n:"Little Fish"},{e:"🦑",v:75,n:"Squid"},
 {e:"🐉",v:200,n:"Dragon"}
];
const missions=[
 ["catch","First Catch","Catch 10 fish",10,500],
 ["score","Score Hunter","Earn 1,000 round points",1000,800],
 ["boss","Boss Hunter","Catch 3 boss fish",3,1200],
 ["combo","Combo Master","Reach x5 combo",5,700]
];
const shop=[
 ["🎯","Plasma Cannon",500],["🌊","Deep Ocean",750],["⚡","Lightning Shot",1000],
 ["👑","Golden Crown",1500],["🚀","Turbo Trail",2000],["💎","Crystal UI",2500]
];
function save(){localStorage.setItem(STORE+"state",JSON.stringify(s))}
function fmt(n){return Math.floor(n).toLocaleString()}
function toast(t){let x=$("toast");x.textContent=t;x.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>x.classList.remove("show"),1700)}
function vibrate(ms=12){if(s.vibrate&&navigator.vibrate)navigator.vibrate(ms)}
function render(){
 $("balance").textContent=fmt(s.balance);$("level").textContent=s.level;$("level2").textContent=s.level;
 $("xpBar").style.width=Math.min(100,s.xp/(s.level*100)*100)+"%";$("power").textContent=s.power;
 $("roundScore").textContent=fmt(game.score);$("combo").textContent="x"+game.combo;$("round").textContent=String(game.round).padStart(2,"0");$("roundTime").textContent=game.time;
 $("sessionPoints").textContent=fmt(game.score);
 $("soundToggle").checked=s.sound;$("animToggle").checked=s.anim;$("vibrateToggle").checked=s.vibrate;
 renderRecent();renderFeed();renderMissions();renderShop();renderRankings();renderDaily();
}
function renderDaily(){
 const today=new Date().toISOString().slice(0,10),claimed=s.daily===today;
 $("dailyBtn").disabled=claimed;$("dailyBtn").textContent=claimed?"CLAIMED TODAY":"CLAIM 500";
 $("dailyStatus").textContent=claimed?"Come back tomorrow":"Available once today";
}
function nav(view){
 document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
 $(view+"View").classList.add("active");
 document.querySelectorAll(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
 if(view==="fishing")startOcean(); if(view!=="fishing")stopAuto();
}
document.querySelectorAll(".nav-btn").forEach(b=>b.onclick=()=>nav(b.dataset.view));
document.querySelectorAll("[data-jump]").forEach(b=>b.onclick=()=>nav(b.dataset.jump));
$("mobileMenu").onclick=()=>{document.querySelector(".sidebar").style.display=document.querySelector(".sidebar").style.display==="block"?"none":"block"};
$("dailyBtn").onclick=()=>{
 const today=new Date().toISOString().slice(0,10);
 if(s.daily===today)return toast("Daily reward already claimed");
 s.daily=today;s.balance+=500;s.xp+=20;levelCheck();save();render();toast("+500 daily arcade points");vibrate(18);
};
$("powerMinus").onclick=()=>{s.power=Math.max(1,s.power-1);render()};
$("powerPlus").onclick=()=>{s.power=Math.min(100,s.power+1);render()};
$("soundBtn").onclick=()=>{s.sound=!s.sound;$("soundBtn").textContent=s.sound?"🔊":"🔇";save();render()};
$("soundToggle").onchange=e=>{s.sound=e.target.checked;save()};
$("animToggle").onchange=e=>{s.anim=e.target.checked;save();renderFishAnimation()};
$("vibrateToggle").onchange=e=>{s.vibrate=e.target.checked;save()};
$("reset").onclick=()=>{if(confirm("Reset all local arcade progress?")){localStorage.removeItem(STORE+"state");location.reload()}};

function startOcean(){
 $("roomTitle").textContent="Golden Ocean";$("roomName").textContent="GOLDEN OCEAN";
 if(!game.timer)game.timer=setInterval(()=>{if(game.time>0){game.time--;render();}else newRound()},1000);
 spawnUntilFull();clearInterval(game.fishTimer);
 game.fishTimer=setInterval(()=>{moveFish();spawnUntilFull()},700);
}
function stopAuto(){game.auto=false;clearInterval(game.autoTimer);$("autoBtn").textContent="◉ AUTO"}
function newRound(){
 game.round++;game.time=60;game.score=0;game.combo=1;clearFish();spawnUntilFull();toast("New 60-second ocean round");render();
}
function clearFish(){$("fishLayer").innerHTML=""}
function spawnUntilFull(){
 const layer=$("fishLayer");
 while(layer.children.length<9)layer.appendChild(makeFish());
 renderFishAnimation();
}
function makeFish(){
 const f=fishTypes[Math.floor(Math.random()*fishTypes.length)];
 const el=document.createElement("div");el.className="fish";
 const boss=Math.random()<.09;
 el.dataset.v=boss?120:f.v;el.dataset.n=boss?"Golden Boss":f.n;el.dataset.dx=(Math.random()>.5?1:-1)*(0.35+Math.random()*.65);
 el.dataset.dy=(Math.random()>.5?1:-1)*(0.08+Math.random()*.22);
 el.style.left=(5+Math.random()*86)+"%";el.style.top=(12+Math.random()*62)+"%";
 el.innerHTML=`<span class="emoji">${boss?"🦈":f.e}</span><small>${boss?120:f.v} pts</small>`;
 if(boss)el.classList.add("boss");
 el.addEventListener("pointerdown",e=>{e.preventDefault();e.stopPropagation();catchFish(el,e.clientX,e.clientY)});
 return el;
}
function moveFish(){
 if(!s.anim)return;
 [...$("fishLayer").children].forEach(el=>{
   let x=parseFloat(el.style.left),y=parseFloat(el.style.top),dx=Number(el.dataset.dx),dy=Number(el.dataset.dy);
   x+=dx;y+=dy;
   if(x<2||x>91){el.dataset.dx=(-dx).toFixed(2);x=Math.max(2,Math.min(91,x))}
   if(y<9||y>73){el.dataset.dy=(-dy).toFixed(2);y=Math.max(9,Math.min(73,y))}
   el.style.left=x+"%";el.style.top=y+"%";
 });
}
function renderFishAnimation(){
 [...$("fishLayer").children].forEach((el,i)=>{
   el.style.animation=s.anim?`fishBob ${2.4+(i%4)*.4}s ease-in-out infinite`:"none";
 });
}
function pointerAim(x,y){
 const r=$("arena").getBoundingClientRect(),a=$("aim");
 if(innerWidth<=650)return;
 a.style.display="block";a.style.left=(x-r.left-21)+"px";a.style.top=(y-r.top-21)+"px";
 clearTimeout(pointerAim.t);pointerAim.t=setTimeout(()=>a.style.display="none",300);
}
$("arena").addEventListener("pointermove",e=>pointerAim(e.clientX,e.clientY));
$("arena").addEventListener("pointerdown",e=>{
 if(e.target.closest(".fish,.bottom-ui,.arena-label"))return;
 pointerAim(e.clientX,e.clientY);
});
function catchFish(el,cx,cy){
 if(!el||el.classList.contains("caught"))return;
 el.classList.add("target");
 const value=Number(el.dataset.v);
 const gained=Math.max(1,Math.floor(value*s.power/10*game.combo));
 game.score+=gained;s.balance+=gained;game.combo=Math.min(10,game.combo+1);
 if(el.classList.contains("boss"))updateMission("boss",1);
 updateMission("catch",1);updateMission("score",gained);if(game.combo>=5)updateMission("combo",game.combo);
 s.catches.unshift({n:el.dataset.n,v:gained});s.catches=s.catches.slice(0,20);
 s.xp+=Math.max(1,Math.floor(gained/25));levelCheck();
 if(game.tournament){game.tourScore+=gained;$("tourScore").textContent=fmt(game.tourScore)}
 effects(el,cx,cy,gained);el.classList.remove("target");el.classList.add("caught");
 setTimeout(()=>{el.remove();spawnUntilFull()},350);
 save();render();vibrate(15);toast(`${el.dataset.n} +${fmt(gained)}`);
 clearTimeout(game.comboTimer);game.comboTimer=setTimeout(()=>{game.combo=1;render()},2300);
}
function effects(el,cx,cy,gained){
 const r=$("arena").getBoundingClientRect(),fx=$("effects"),x=cx?cx-r.left:el.offsetLeft+25,y=cy?cy-r.top:el.offsetTop;
 const sc=document.createElement("i");sc.className="splash";sc.style.left=(x-40)+"px";sc.style.top=(y-40)+"px";fx.appendChild(sc);setTimeout(()=>sc.remove(),400);
 const txt=document.createElement("b");txt.className="float-score";txt.textContent="+"+fmt(gained);txt.style.left=x+"px";txt.style.top=y+"px";fx.appendChild(txt);setTimeout(()=>txt.remove(),800);
}
function levelCheck(){
 while(s.xp>=s.level*100){s.xp-=s.level*100;s.level++;toast("LEVEL UP • Level "+s.level)}
}
function updateMission(id,amount){
 const m=missions.find(x=>x[0]===id);if(!m)return;
 const old=s.missions[id]||0;if(old>=m[3])return;
 const next=Math.min(m[3],old+amount);s.missions[id]=next;
 if(old<m[3]&&next>=m[3]){s.balance+=m[4];s.xp+=30;toast("Mission complete • +"+m[4]+" points");levelCheck()}
}
$("shootBtn").onclick=()=>{
 const list=[...$("fishLayer").children];if(!list.length)return;
 let target=list[Math.floor(Math.random()*list.length)];
 const bosses=list.filter(x=>x.classList.contains("boss"));if(bosses.length&&Math.random()<.35)target=bosses[Math.floor(Math.random()*bosses.length)];
 catchFish(target,target.getBoundingClientRect().left+20,target.getBoundingClientRect().top+20)
};
$("autoBtn").onclick=()=>{
 game.auto=!game.auto;$("autoBtn").textContent=game.auto?"■ AUTO":"◉ AUTO";
 clearInterval(game.autoTimer);
 if(game.auto)game.autoTimer=setInterval(()=>$("shootBtn").click(),game.turbo?450:900);
};
$("turboBtn").onclick=()=>{
 game.turbo=!game.turbo;$("turboBtn").style.borderColor=game.turbo?"#a9ef4b":"#31516b";
 if(game.auto){clearInterval(game.autoTimer);game.autoTimer=setInterval(()=>$("shootBtn").click(),game.turbo?450:900)}
 toast(game.turbo?"Turbo enabled":"Turbo disabled");
};

function renderRecent(){$("recent").innerHTML=s.catches.length?s.catches.slice(0,6).map(c=>`<div class="recent-card"><b>+${fmt(c.v)}</b><small>${c.n}</small></div>`).join(""):'<div class="empty">No catches yet. Enter the ocean.</div>'}
function renderFeed(){$("feed").innerHTML=s.catches.slice(0,7).map(c=>`<span>+${fmt(c.v)} • ${c.n}</span>`).join("")||"<span>Waiting for your first catch...</span>"}
function renderMissions(){$("missions").innerHTML=missions.map(m=>{let p=Math.min(m[3],s.missions[m[0]]||0),done=p>=m[3];return `<article class="mission"><h3>${m[1]} ${done?"✓":""}</h3><p>${m[2]}</p><div class="progress"><i style="width:${p/m[3]*100}%"></i></div><small>${p}/${m[3]} • One-time reward: ${m[4]} pts</small></article>`}).join("")}
function renderShop(){$("shop").innerHTML=shop.map((x,i)=>{let own=s.owned.includes(i);return `<article class="shop-item"><div class="shop-icon">${x[0]}</div><h3>${x[1]}</h3><p>Permanent cosmetic unlock for this device.</p><button ${own?"disabled":""} onclick="buy(${i})">${own?"OWNED":"BUY • "+x[2]+" pts"}</button></article>`}).join("")}
window.buy=i=>{if(s.owned.includes(i))return;if(s.balance<shop[i][2])return toast("Not enough virtual points");s.balance-=shop[i][2];s.owned.push(i);save();render();toast(shop[i][1]+" unlocked")}
function renderRankings(){const names=["Fisherman","OceanKing","BlueWhale","GoldenHook","SeaWolf","AquaPro","CoralMaster"];$("rankings").innerHTML=names.map((n,i)=>`<div class="rank-row"><span>${i+1}. ${n}${i===0?" 👑":""}</span><b>${fmt(Math.max(12000-i*1330,game.score-i*250))}</b></div>`).join("")}

$("startTournament").onclick=()=>{
 if(game.tournament)return;
 game.tournament=true;game.tourScore=0;let time=120;$("tourScore").textContent="0";$("startTournament").disabled=true;$("startTournament").textContent="ROUND ACTIVE";
 nav("fishing");toast("Tournament started • 120 seconds");
 const t=setInterval(()=>{
   time--;if($("tourTimer"))$("tourTimer").textContent=`${String(Math.floor(time/60)).padStart(2,"0")}:${String(time%60).padStart(2,"0")}`;
   if(time<=0){clearInterval(t);game.tournament=false;$("startTournament").disabled=false;$("startTournament").textContent="START NEW ROUND";$("tourScore").textContent=fmt(game.tourScore);toast("Tournament finished • "+fmt(game.tourScore)+" points")}
 },1000);
};

render();startOcean();
