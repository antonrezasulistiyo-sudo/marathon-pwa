var KEY="mp_v2",S={dist:"M",race:"",goal:"",cp:0,km:30,long:14,inj:[],sess:"A"},ST=null,F=null,vw=0,GP=null,CV="plan";
try{Object.assign(S,JSON.parse(localStorage.getItem(KEY)))}catch(e){}
try{ST=JSON.parse(localStorage.getItem("mp_strava"))}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
var $=function(i){return document.getElementById(i)};
var DIST={
"5K":{n:"5K",km:5,wk:8,pk:55,lg:16,pc:.28,tp:1,fd:0,mb:12,rw:[1.05,1.1]},
"10K":{n:"10K",km:10,wk:10,pk:65,lg:20,pc:.28,tp:1,fd:.005,mb:18,rw:[1,1.05]},
"HM":{n:"Half Marathon",km:21.0975,wk:12,pk:80,lg:26,pc:.3,tp:2,fd:.012,mb:25,rw:[.92,.97]},
"M":{n:"Marathon",km:42.195,wk:16,pk:90,lg:32,pc:.3,tp:3,fd:.03,mb:35,rw:[.85,.9]},
"50K":{n:"Ultra 50K",km:50,wk:18,pk:100,lg:35,pc:.32,tp:3,fd:.06,mb:40,rw:[.72,.8]},
"100K":{n:"Ultra 100K",km:100,wk:22,pk:110,lg:40,pc:.32,tp:3,fd:.09,mb:50,rw:[.62,.7]}};
var DEF={"5K":"25:00","10K":"52:00","HM":"1:55:00","M":"4:15:00","50K":"6:30:00","100K":"14:00:00"};
function p2s(s){s=Math.round(s);return Math.floor(s/60)+":"+("0"+s%60).slice(-2)}
function fmtT(s){s=Math.round(s);var h=Math.floor(s/3600),m=Math.floor(s%3600/60),c=s%60;return h>0?h+":"+("0"+m).slice(-2)+":"+("0"+c).slice(-2):m+":"+("0"+c).slice(-2)}
function parseT(s,dk){var a=(s||"").trim().split(":").map(Number);if(!a.length||a.some(isNaN))return 0;if(a.length===3)return a[0]*3600+a[1]*60+a[2];if(a.length===2)return(dk==="5K"||dk==="10K")?a[0]*60+a[1]:a[0]*3600+a[1]*60;return 0}
function goalSec(){return parseT(S.goal,S.dist)||parseT(DEF[S.dist],S.dist)}
function paces(){var D=DIST[S.dist],g=goalSec(),u=D.km>43?1.1:1,p10=g*Math.pow(10/D.km,1.06)/10;return{r:g/D.km,t:p10*1.04,i:p10*.965,e1:p10*1.25*u,e2:p10*1.38*u}}
function pw(a,b){return S.cp>0?" · "+Math.round(S.cp*a)+"–"+Math.round(S.cp*b)+" W":""}
function wl(){if(!S.race)return null;return Math.ceil((new Date(S.race+"T00:00:00")-new Date())/6048e5)}

/* ---- Analisis data Strava ---- */
function day0(d){var x=new Date(d);x.setHours(0,0,0,0);return x.getTime()}
function fit(R){
 if(!R||!R.length)return null;
 var t0=day0(Date.now()),wk=[],mn=[],cn=[],dy={},i,lg=0,best=null,s4=[0,0],k4=[0,0];
 for(i=0;i<12;i++){wk.push(0);mn.push(0);cn.push(0)}
 R.forEach(function(r){
  var ago=Math.round((t0-day0(r.d+"T12:00:00"))/864e5);if(ago<0)return;
  var i=Math.floor(ago/7);
  if(i<12){wk[i]+=r.km;mn[i]+=r.s/60;cn[i]++}
  if(ago<7)dy[r.d]=1;
  if(ago<56&&r.km>lg)lg=r.km;
  if(i<4){s4[0]+=r.s;k4[0]+=r.km}else if(i<8){s4[1]+=r.s;k4[1]+=r.km}
  if(ago<84&&r.km>=4.5&&r.km<=11){var t10=r.s*Math.pow(10/r.km,1.06);if(!best||t10<best.t10)best={km:r.km,s:r.s,t10:t10}}
 });
 var sum=function(a,f,t){var x=0;for(var i=f;i<t;i++)x+=a[i];return x};
 var avg4=sum(wk,0,4)/4,chr=sum(mn,0,4)/4,prev=sum(wk,1,5)/4;
 return{wk:wk,avg4:avg4,acwr:chr>0?mn[0]/chr:null,ramp:prev>0?wk[0]/prev-1:null,longest:lg,best:best,rpw:sum(cn,0,4)/4,
  pA:k4[0]>0?s4[0]/k4[0]:0,pB:k4[1]>0?s4[1]/k4[1]:0,rest:7-Object.keys(dy).length,n:R.length}}
function recalc(){F=ST&&ST.auth?fit(ST.runs):null}
function pred(km){if(!F||!F.best)return 0;var b=F.best,ex=km<=21.2?1.06:km<=42.3?1.07:1.12;return b.s*Math.pow(km/b.km,ex)}
function sync(){return fetch("/api/activities",{credentials:"same-origin"}).then(function(r){if(r.status===401){ST={auth:false};try{localStorage.removeItem("mp_strava")}catch(e){}return}if(!r.ok)throw 0;return r.json()}).then(function(d){if(!d||!d.auth)return;ST={auth:true,at:Date.now(),runs:d.runs};try{localStorage.setItem("mp_strava",JSON.stringify(ST))}catch(e){}}).catch(function(){}).then(recalc)}
function resync(){sync().then(function(){show("set")})}

/* ---- Penyusun program ---- */
function qual(D,ph,left,inj,P){
 var T=p2s(P.t)+"/km",I=p2s(P.i)+"/km",R=p2s(P.r)+"/km";
 if(left===0)return"Shakeout 20 mnt + 4 strides";
 if(inj)return"Fartlek ringan 6×1 mnt agak cepat (RPE 6) atau tempo 15 mnt @ "+T+"; ganti easy bila nyeri";
 var q={
 "5K":{Base:"Strides 6×20 dtk + tempo 12 mnt @ "+T,Build:"6×800 m @ "+I+", jog 2 mnt",Peak:"4×1 km @ "+I+", jog 2 mnt",Taper:"3×400 m @ "+I+", jog 90 dtk"},
 "10K":{Base:"Tempo 15 mnt @ "+T,Build:"5×1 km @ "+R+", jog 2 mnt",Peak:"3×2 km @ "+R+", jog 2 mnt",Taper:"3×1 km @ "+R+", jog 2 mnt"},
 "HM":{Base:"Tempo 20 mnt @ "+T,Build:"4×2 km @ "+T+", jog 90 dtk",Peak:"2×5 km @ "+R+", jog 3 mnt",Taper:"3 km @ "+R+" + 2 km easy"},
 "M":{Base:"Tempo 20 mnt @ "+T,Build:"5 km @ "+T+" + 5 km @ "+R,Peak:"2×6 km @ "+R+", jog 3 mnt",Taper:"5 km @ "+R},
 "50K":{Base:"Hill repeats 6×60 dtk menanjak (RPE 7)",Build:"Tempo 30 mnt @ "+T+" atau bukit bergelombang",Peak:"2×20 mnt ritme lomba di medan mirip",Taper:"20 mnt ritme lomba"}};
 q["100K"]=q["50K"];
 return q[S.dist==="100K"?"100K":S.dist][ph]}
function plan(){
 var D=DIST[S.dist],P=paces(),inj=S.inj.length>0,L=wl(),N=D.wk,warn=[];
 if(L!==null){if(L>=4&&L<=30)N=L;else if(L<4)warn.push("Waktu ke race kurang dari 4 minggu; program ini memakai durasi standar. Fokus taper dan pemulihan.");else warn.push("Race masih lebih dari 30 minggu lagi; program memakai durasi standar "+D.wk+" minggu.")}
 var base=Math.max(F?F.avg4:(+S.km||20),10),cap=D.pk*(inj?.85:1),km=base,peak=base,out=[];
 if(F&&base<D.mb)warn.push("Mileage 4 minggu terakhir ("+base.toFixed(0)+" km/mgg) di bawah minimum rekomendasi untuk "+D.n+" ("+D.mb+" km/mgg). Pertimbangkan jarak lebih pendek atau bangun base dulu.");
 var flag=inj||(F&&F.acwr>1.3),rp=flag?3:4,TP={1:[.5],2:[.7,.45],3:[.75,.55,.35]}[D.tp],ult=D.km>43;
 for(var w=1;w<=N;w++){
  var left=N-w,ph=left<D.tp?"Taper":w<=N*.35?"Base":w<=N*.7?"Build":"Peak",tot,rec=false;
  if(left<D.tp)tot=peak*TP[D.tp-1-left];
  else if(w===1&&F&&F.acwr>1.3){tot=base*.85;rec=true}
  else if(w%rp===0){tot=km*.8;rec=true}
  else{km=Math.min(cap,km*1.08);tot=km;peak=Math.max(peak,km)}
  if(w===1&&F&&F.acwr>1.5)tot*=.75;
  var lr=Math.min(tot*D.pc,D.lg),q=tot*.2,rs=Math.max(tot-lr-q,0),ez=p2s(P.e1)+"–"+p2s(P.e2)+"/km",E=function(x,a){return x.toFixed(1)+" km easy @ "+ez+pw(.7,.8)+(a||"")};
  var lt;
  if(left===0)lt="🏁 RACE DAY: "+D.n+" ("+D.km.toFixed(1)+" km), target "+fmtT(goalSec());
  else if(ult)lt=lr.toFixed(0)+" km easy (±"+(lr*(P.e1+P.e2)/2*1.1/3600).toFixed(1)+" jam)"+pw(.7,.8)+". Latih nutrisi 60–90 g karbo/jam dan hiking di tanjakan";
  else if(ph==="Peak"&&!inj&&D.km>=21)lt=lr.toFixed(0)+" km, "+Math.round(lr*.3)+" km terakhir @ "+p2s(P.r)+"/km"+pw(D.rw[0],D.rw[1]);
  else lt=E(lr);
  var sat=ult&&(ph==="Build"||ph==="Peak")&&left>0?"Back-to-back: "+E(lr*.5):E(rs*.25)+(left>0?" + 4 strides":" (shakeout)");
  out.push({w:w,ph:ph,tot:tot,rec:rec,left:left,days:[
   ["Sen","R","Istirahat atau mobilitas"],
   ["Sel",left===0?"E":"Q",left===0?qual(D,ph,0,inj,P):q.toFixed(1)+" km total · "+qual(D,ph,left,inj,P)],
   ["Rab","E",E(rs*.35)+" + Strength A"],
   ["Kam","E",E(rs*.4)],
   ["Jum","S","Strength B (ringan, tanpa kelelahan kaki)"],
   ["Sab","E",sat],
   ["Min","L",lt]]})}
 return{w:out,warn:warn,peak:peak,lgMax:Math.max.apply(null,out.map(function(o){return Math.min(o.tot*D.pc,D.lg)}))}}

var TAG={E:["t-e","Easy"],Q:["t-q","Kualitas"],L:["t-l","Long run"],S:["t-s","Strength"],R:["t-r","Rest"]};
function feas(D){
 if(!F||!F.best)return"<div class='card mu'>Hubungkan Strava agar prediksi waktu dan beban latihan dihitung dari data lari kamu.</div>";
 var pr=pred(D.km),g=goalSec(),d=g/pr-1,m,c;
 if(d>=0){m="Realistis";c=""}else if(d>-.05){m="Menantang tapi mungkin";c=""}else{m="Ambisius, pertimbangkan target lebih lambat";c="warn"}
 return"<div class='card'><b>Prediksi dari kebugaran sekarang: "+fmtT(pr)+"</b><div class='mu'>Estimasi dari lari terbaik 4,5–11 km ("+F.best.km.toFixed(1)+" km, "+fmtT(F.best.s)+"). Target "+fmtT(g)+": "+m+" ("+(d*100).toFixed(1)+"%). Perkiraan kasar; makin jauh jaraknya makin tidak pasti.</div></div>"}
function viewPlan(){
 var D=DIST[S.dist],P=paces(),pl=plan(),W=pl.w[vw]||pl.w[0],h="<h1>"+D.n+"</h1>";
 h+="<div class='mu'>Target "+fmtT(goalSec())+" · pace race "+p2s(P.r)+"/km · "+pl.w.length+" minggu"+(S.race?" · race "+S.race:"")+"</div>"+feas(D);
 pl.warn.forEach(function(x){h+="<div class='warn'>"+x+"</div>"});
 h+="<div class='card'><div class='wk'><button onclick='mv(-1)' aria-label='Minggu sebelumnya'>‹</button><div style='text-align:center'><h3>Minggu "+W.w+" / "+pl.w.length+"</h3><div class='mu'>"+W.ph+(W.rec?" · pekan pemulihan":"")+" · ±"+W.tot.toFixed(0)+" km</div></div><button onclick='mv(1)' aria-label='Minggu berikutnya'>›</button></div><div class='bar' style='margin-top:12px'><div style='width:"+(W.w/pl.w.length*100)+"%'></div></div></div>";
 if(F&&F.acwr>1.3&&vw===0)h+="<div class='warn'>Beban 7 hari terakhir tinggi dibanding rata-rata 4 minggu (ACWR "+F.acwr.toFixed(2)+"). Minggu pertama sengaja diturunkan. Lihat tab Insight.</div>";
 if(S.inj.length)h+="<div class='warn'>Mode cedera ("+S.inj.map(function(k){return INJ[k].n}).join(", ")+"): volume maksimum dikurangi 15%, sesi cepat diganti ringan, pemulihan tiap 3 minggu. "+S.inj.map(function(k){return INJ[k].run}).join(" ")+"</div>";
 var td=(new Date().getDay()+6)%7;
 W.days.forEach(function(d,i){var t=TAG[d[1]];h+="<div class='card day"+(vw===0&&i===td?" today":"")+"'><div class='dn'>"+d[0]+"</div><div><span class='tag "+t[0]+"'>"+t[1]+"</span><div>"+d[2]+"</div></div></div>"});
 h+="<p class='mu'>Aturan keamanan di program: kenaikan volume maksimum 8% per minggu, pekan pemulihan berkala, maksimum 2 sesi berat per minggu (kualitas dan long run) dengan jeda 2 hari, taper sebelum race. Pace dan watt hanya panduan; sesi easy harus nyaman (bisa ngobrol).</p>";
 $("v-plan").innerHTML=h}
function mv(n){var l=plan().w.length;vw=Math.max(0,Math.min(l-1,vw+n));viewPlan();window.scrollTo(0,0)}

/* ---- Insight ---- */
function viewIns(){
 var h="<h1>Insight latihan</h1>";
 if(!F){$("v-ins").innerHTML=h+"<div class='card mu'>Belum ada data Strava. Masuk lewat tab Profil.</div>";return}
 var wk=F.wk.slice().reverse(),mx=Math.max.apply(null,wk)||1,I=[];
 h+="<div class='card'><b>Km per minggu (12 minggu terakhir)</b><div class='bars' style='margin-top:10px'>"+wk.map(function(v){return"<div title='"+v.toFixed(0)+" km' style='height:"+Math.max(2,v/mx*100)+"%'></div>"}).join("")+"</div><div class='mu' style='display:flex;justify-content:space-between'><span>12 mgg lalu</span><span>7 hari terakhir: "+F.wk[0].toFixed(0)+" km</span></div></div>";
 var a=F.acwr;
 if(a===null)I.push(["ok","Belum cukup data 4 minggu untuk menghitung rasio beban."]);
 else if(a>1.5)I.push(["bad","Rasio beban akut:kronis "+a.toFixed(2)+": risiko cedera tinggi. Turunkan volume 20–30% minggu ini, hilangkan sesi cepat, tambah hari istirahat."]);
 else if(a>1.3)I.push(["warn","Rasio beban akut:kronis "+a.toFixed(2)+": waspada. Jangan menambah volume atau intensitas minggu ini."]);
 else if(a<.8)I.push(["warn","Rasio beban "+a.toFixed(2)+": beban turun dibanding biasanya. Naikkan bertahap, jangan langsung melompat."]);
 else I.push(["ok","Rasio beban akut:kronis "+a.toFixed(2)+": di zona aman (0,8–1,3)."]);
 if(F.ramp!==null){var r=F.ramp*100;if(r>15)I.push(["bad","Volume 7 hari naik "+r.toFixed(0)+"% dari rata-rata 4 minggu sebelumnya. Batas aman sekitar 10%."]);else if(r>10)I.push(["warn","Volume naik "+r.toFixed(0)+"% dibanding minggu-minggu sebelumnya, mendekati batas 10%."]);else if(r<-30)I.push(["warn","Volume turun "+Math.abs(r).toFixed(0)+"% minggu ini. Pastikan itu memang pemulihan, bukan terhenti."]);else I.push(["ok","Perubahan volume "+r.toFixed(0)+"%, terkendali."])}
 I.push([F.rpw>=3?"ok":"warn","Konsistensi: rata-rata "+F.rpw.toFixed(1)+" lari per minggu dalam 4 minggu terakhir."+(F.rpw<3?" Target 3–5 lari per minggu agar adaptasi stabil.":"")]);
 if(F.rest<=1)I.push(["warn","Hanya "+F.rest+" hari istirahat dari lari dalam 7 hari terakhir. Sisihkan minimal 1–2 hari."]);
 if(F.avg4>0&&F.longest/F.avg4>.45)I.push(["warn","Long run "+F.longest.toFixed(0)+" km terlalu dominan dibanding total mingguan ("+F.avg4.toFixed(0)+" km). Idealnya sekitar 25–35%; tambah lari easy lain."]);
 else I.push(["ok","Long run terpanjang 8 minggu: "+F.longest.toFixed(1)+" km."]);
 if(F.pA&&F.pB){var c=F.pA/F.pB-1;if(c<-.02)I.push(["ok","Pace rata-rata 4 minggu terakhir lebih cepat "+Math.abs(c*100).toFixed(1)+"% daripada 4 minggu sebelumnya."]);else if(c>.03)I.push(["warn","Pace melambat "+(c*100).toFixed(1)+"% dibanding 4 minggu sebelumnya. Jika volume naik, itu tanda kelelahan; cek tidur dan pemulihan."])}
 if(F.best)I.push(["ok","Lari terbaik 4,5–11 km: "+F.best.km.toFixed(1)+" km dalam "+fmtT(F.best.s)+" (setara 10K ±"+fmtT(F.best.t10)+")."]);
 I.forEach(function(x){h+="<div class='ins "+x[0]+"'>"+x[1]+"</div>"});
 h+="<p class='mu'>Beban dihitung dari durasi lari. Ini panduan umum, bukan diagnosis; nyeri yang menetap perlu diperiksa tenaga medis.</p>";
 $("v-ins").innerHTML=h}

/* ---- Simulasi race GPX ---- */
function gpxStats(P){
 var d=[0],i,R=6371,rad=Math.PI/180;
 for(i=1;i<P.length;i++){var a=P[i-1],b=P[i],dl=(b.la-a.la)*rad,dn=(b.lo-a.lo)*rad,h=Math.sin(dl/2)*Math.sin(dl/2)+Math.cos(a.la*rad)*Math.cos(b.la*rad)*Math.sin(dn/2)*Math.sin(dn/2);d.push(d[i-1]+2*R*Math.asin(Math.sqrt(h)))}
 var E=P.map(function(p,k){var s=0,c=0;for(var j=Math.max(0,k-5);j<=Math.min(P.length-1,k+5);j++){s+=P[j].el;c++}return s/c});
 var D=d[d.length-1],g=0,l=0;for(i=1;i<E.length;i++){var df=E[i]-E[i-1];if(df>0)g+=df;else l-=df}
 var j=0;function at(x){while(j<d.length-2&&d[j+1]<x)j++;var t=(x-d[j])/((d[j+1]-d[j])||1);t=Math.max(0,Math.min(1,t));return E[j]+(E[j+1]-E[j])*t}
 var sp=[],n=Math.ceil(D);for(i=0;i<n;i++){var s0=i,s1=Math.min(i+1,D);sp.push({k:s1-s0,a:at(s0),b:at(s1)})}
 return{D:D,gain:g,loss:l,sp:sp}}
function gf(g){return g>=0?1+.033*Math.min(g,15):Math.max(.84,1+.018*Math.max(g,-9))}
function nearest(km){var b="M",m=1e9;for(var k in DIST){var x=Math.abs(Math.log(km/DIST[k].km));if(x<m){m=x;b=k}}return b}
function simulate(G){
 var key=nearest(G.D),Dd=DIST[key],n=G.sp.length,Sw=0,cm=0,rows=[];
 G.sp.forEach(function(s){var gr=(s.b-s.a)/(s.k*1000)*100,fr=(cm+s.k/2)/G.D,fd=1+Dd.fd*Math.pow(Math.max(0,(fr-.5)/.5),2),f=gf(gr)*fd;rows.push({k:s.k,gr:gr,f:f});Sw+=s.k*f;cm+=s.k});
 var gt=goalSec();if(Math.abs(G.D/DIST[S.dist].km-1)>.03)gt=gt*Math.pow(G.D/DIST[S.dist].km,1.06);
 var p0=gt/Sw,pr=pred(G.D),flat=pr?pr/G.D*Sw:0,c=0;
 rows.forEach(function(r){r.p=p0*r.f;c+=r.p*r.k;r.c=c});
 return{rows:rows,gt:gt,pr:flat,key:key,p0:p0}}
function profSvg(G,R){
 var W=320,H=120,n=G.sp.length,mn=1e9,mx=-1e9,pm=1e9,px=-1e9;
 G.sp.forEach(function(s){mn=Math.min(mn,s.b);mx=Math.max(mx,s.b)});R.forEach(function(r){pm=Math.min(pm,r.p);px=Math.max(px,r.p)});
 if(mx-mn<10)mx=mn+10;if(px-pm<5)px=pm+5;
 var X=function(i){return(i/(n-1||1)*W).toFixed(1)};
 var e=G.sp.map(function(s,i){return X(i)+","+(H-8-(s.b-mn)/(mx-mn)*(H-20)).toFixed(1)}).join(" ");
 var p=R.map(function(r,i){return X(i)+","+(8+(r.p-pm)/(px-pm)*(H-20)).toFixed(1)}).join(" ");
 return"<svg viewBox='0 0 "+W+" "+H+"' style='width:100%'><polyline points='"+e+"' fill='none' stroke='var(--ac)' stroke-width='2'/><polyline points='"+p+"' fill='none' stroke='var(--q)' stroke-width='1.5' stroke-dasharray='4 3'/></svg><div class='mu'>Garis hijau: elevasi · putus-putus oranye: pace (atas = lebih cepat)</div>"}
function viewRace(){
 var h="<h1>Simulasi race</h1><div class='mu'>Unggah rute GPX. Pacing dihitung dari target waktu di program dan data Strava kamu.</div><div class='card'><label>File GPX</label><input type='file' id='gpx' accept='.gpx,application/gpx+xml' onchange='loadGpx(this.files[0])'></div>";
 if(GP&&GP.err)h+="<div class='warn'>GPX tidak bisa dibaca atau titiknya kurang dari 2.</div>";
 else if(GP){
  var R=simulate(GP),D=DIST[S.dist],pl=plan();
  h+="<div class='card'><b>"+GP.D.toFixed(2)+" km · naik "+Math.round(GP.gain)+" m · turun "+Math.round(GP.loss)+" m</b>"+profSvg(GP,R.rows)+"</div>";
  if(Math.abs(GP.D/D.km-1)>.1)h+="<div class='warn'>Jarak GPX berbeda dari jarak race di Profil ("+D.n+"). Target waktu diskalakan ke "+GP.D.toFixed(1)+" km.</div>";
  h+="<div class='card'><div>Target program: <b>"+fmtT(R.gt)+"</b></div>"+(R.pr?"<div>Prediksi dari kebugaran Strava (disesuaikan medan): <b>"+fmtT(R.pr)+"</b></div><div class='mu'>"+(R.pr>R.gt*1.03?"Target lebih cepat "+((R.pr/R.gt-1)*100).toFixed(1)+"% dari prediksi. Perlu tambahan kebugaran atau target direvisi.":"Target selaras dengan prediksi kebugaran kamu.")+"</div>":"<div class='mu'>Hubungkan Strava untuk prediksi kebugaran.</div>")+"</div>";
  if(F)h+="<div class='card'><b>Kesiapan dari program</b><div class='mu'>Long run terpanjang kamu "+F.longest.toFixed(0)+" km, target puncak program "+pl.lgMax.toFixed(0)+" km ("+Math.min(100,Math.round(F.longest/pl.lgMax*100))+"%). Volume sekarang "+F.avg4.toFixed(0)+" km/mgg, puncak program "+pl.peak.toFixed(0)+" km/mgg.</div></div>";
  h+="<h2>Rencana pacing per km</h2><div class='card scroll'><table><tr><th>Km</th><th>Grade</th><th>Pace</th><th>Waktu</th></tr>"+R.rows.map(function(r,i){return"<tr><td>"+(i+1)+"</td><td>"+r.gr.toFixed(1)+"%</td><td>"+p2s(r.p)+"</td><td>"+fmtT(r.c)+"</td></tr>"}).join("")+"</table></div><p class='mu'>Model: tiap +1% tanjakan menambah ±3,3% waktu, turunan hingga −9% mempercepat ±1,8% per 1%, ditambah pelambatan di paruh akhir sesuai jarak. Ini perkiraan, bukan hasil pasti.</p>";
 }
 $("v-race").innerHTML=h}
function loadGpx(f){if(!f)return;var fr=new FileReader();fr.onload=function(){try{
 var x=new DOMParser().parseFromString(fr.result,"application/xml"),pts=[].slice.call(x.getElementsByTagName("trkpt"));
 if(pts.length<2)pts=[].slice.call(x.getElementsByTagName("rtept"));
 var P=pts.map(function(p){var e=p.getElementsByTagName("ele")[0];return{la:+p.getAttribute("lat"),lo:+p.getAttribute("lon"),el:e?+e.textContent:0}});
 if(P.length<2)throw 0;GP=gpxStats(P);if(!(GP.D>.3))throw 0}catch(e){GP={err:1}}viewRace()};fr.readAsText(f)}

/* ---- Strength + animasi ---- */
var EXI={
"Glute bridge":["bridge","Menguatkan gluteus maximus dan hamstring. Glute kuat menjaga panggul stabil saat tumpuan sehingga lutut dan ITB tidak menanggung beban berlebih."],
"Split squat":["split","Menguatkan quadriceps, glute, dan stabilisator panggul pada posisi satu kaki di depan, mirip fase tumpuan saat lari."],
"Side plank":["side","Menguatkan obliques, quadratus lumborum, dan gluteus medius supaya panggul tidak jatuh ke satu sisi saat lari. Tahan posisinya."],
"Dead bug":["dead","Melatih otot core dalam (transversus abdominis) menjaga punggung bawah tetap netral saat lengan dan tungkai bergerak."],
"Single-leg Romanian deadlift":["rdl","Menguatkan hamstring dan glute pada satu kaki sambil melatih keseimbangan dan gerakan hip hinge."],
"Toe-elevated calf raise":["calf","Memberi beban tinggi pada betis dan fascia plantar lewat posisi jari terangkat, membantu fascia lebih tahan beban."],
"Soleus raise (lutut ditekuk)":["soleus","Menargetkan soleus, otot betis dalam yang menanggung beban terbesar saat lari dan ikut melindungi tibia dan Achilles."],
"Soleus raise":["soleus","Menargetkan soleus, otot betis dalam yang menanggung beban terbesar saat lari dan ikut melindungi tibia dan Achilles."],
"Short foot":[0,"Menguatkan otot kecil di telapak kaki dan menjaga lengkung kaki, sehingga tekanan pada fascia plantar lebih terdistribusi."],
"Gulung bola di telapak kaki":[0,"Melepas ketegangan jaringan telapak kaki untuk sementara. Ini bukan penguatan; gunakan tekanan ringan."],
"Tibialis raise":["tib","Menguatkan tibialis anterior di bagian depan tulang kering, membantu mengontrol kaki saat mendarat dan mengurangi beban tulang kering."],
"Single-leg calf raise":["calf","Menguatkan gastrocnemius dan soleus pada satu kaki; fase turun yang lambat melatih toleransi tendon Achilles."],
"Hip abduction side-lying":["abd","Menguatkan gluteus medius dan minimus yang menstabilkan panggul dan menjaga lutut tidak jatuh ke dalam."],
"Clamshell dengan band":[0,"Mengaktifkan gluteus medius dan rotator eksternal pinggul untuk stabilitas panggul."],
"Side plank + angkat kaki atas":["side","Menguatkan gluteus medius dan core lateral sekaligus; relevan untuk kontrol panggul pada ITBS."],
"Single-leg glute bridge":["bridge","Menguatkan glute dan hamstring satu sisi, sekaligus memeriksa kesimetrian kiri dan kanan."],
"Step-down eksentrik":["step","Melatih kontrol quadriceps dan glute medius saat turun, agar lutut tetap sejajar dengan jari kaki."],
"Spanish squat / wall sit":["wall","Isometrik quadriceps pada sudut lutut sedang; dapat membantu mengurangi nyeri sekitar tempurung lutut."],
"Step-up rendah":["step","Menguatkan quadriceps dan glute dalam gerakan naik satu kaki, mirip tenaga dorong saat lari."],
"Terminal knee extension (band)":[0,"Mengaktifkan vastus medialis dan kontrol lutut menjelang lurus."],
"Hip external rotation (band)":[0,"Menguatkan rotator eksternal pinggul yang membantu menjaga posisi lutut."],
"Isometric calf hold":["calf","Tahanan isometrik pada betis dan tendon Achilles; dapat membantu meredakan nyeri tendon sementara dan menjaga kekuatan."],
"Slow calf raise":["calf","Menguatkan betis dan toleransi tendon Achilles lewat gerakan lambat."],
"Single-leg balance":["bal","Melatih keseimbangan dan stabilitas pergelangan kaki serta pinggul (propriosepsi)."]};
/* pose: [torso, thighA, shinA, thighB, shinB, upperArmA, foreA, upperArmB, foreB, foot, stepH] ; sudut dari arah bawah, searah ke kanan */
var POSE={
bridge:[[270,130,10,130,10,90,90,90,90,90,0],[305,125,5,125,5,90,90,90,90,90,0]],
split:[[180,15,355,345,330,0,0,0,0,90,0],[180,75,355,350,260,0,0,0,0,90,0]],
side:[[259,79,79,79,79,0,90,0,90,90,0],[259,79,79,79,79,0,90,0,90,90,0]],
dead:[[270,180,90,180,90,180,180,180,180,90,0],[270,100,100,180,90,180,180,270,270,90,0]],
rdl:[[180,0,0,0,0,0,0,0,0,90,0],[100,0,0,265,265,0,0,0,0,90,0]],
calf:[[180,0,0,0,0,0,0,0,0,90,0],[180,0,0,0,0,0,0,0,0,35,0]],
soleus:[[180,35,340,35,340,0,0,0,0,90,0],[180,35,340,35,340,0,0,0,0,35,0]],
tib:[[195,10,10,10,10,0,0,0,0,90,0],[195,10,10,10,10,0,0,0,0,135,0]],
abd:[[270,90,90,90,90,270,270,270,270,90,0],[270,125,125,90,90,270,270,270,270,90,0]],
step:[[180,0,0,0,0,0,0,0,0,90,20],[180,70,350,0,0,0,0,0,0,90,20]],
wall:[[180,0,0,0,0,0,0,0,0,90,0],[180,90,0,90,0,0,0,0,0,90,0]],
bal:[[180,0,0,0,0,0,0,0,0,90,0],[180,0,0,80,10,90,90,90,90,90,0]]};
function lerpA(a,b,e){var d=((b-a)%360+540)%360-180;return a+d*e}
function dv(a,L){var r=a*Math.PI/180;return[L*Math.sin(r),L*Math.cos(r)]}
function ad(p,q){return[p[0]+q[0],p[1]+q[1]]}
function skel(p){
 var h=[0,0],n=ad(h,dv(p[0],34)),hd=ad(n,dv(p[0],10)),kA=ad(h,dv(p[1],26)),aA=ad(kA,dv(p[2],26)),tA=ad(aA,dv(p[9],8)),kB=ad(h,dv(p[3],26)),aB=ad(kB,dv(p[4],26)),tB=ad(aB,dv(p[9],8)),eA=ad(n,dv(p[5],16)),wA=ad(eA,dv(p[6],15)),eB=ad(n,dv(p[7],16)),wB=ad(eB,dv(p[8],15));
 return{h:h,n:n,hd:hd,seg:[[h,n,0],[h,kB,1],[kB,aB,1],[aB,tB,1],[n,eB,1],[eB,wB,1],[h,kA,0],[kA,aA,0],[aA,tA,0],[n,eA,0],[eA,wA,0]],aA:aA,tA:tA,all:[h,n,hd,kA,aA,tA,kB,aB,tB,eA,wA,eB,wB]}}
var ANIM=[];
function mkAnim(svg){
 var NS="http://www.w3.org/2000/svg",k=svg.getAttribute("data-k"),box=document.createElementNS(NS,"rect"),L=[],i,mk=function(t){var e=document.createElementNS(NS,t);svg.appendChild(e);return e};
 box.setAttribute("fill","var(--bd)");svg.appendChild(box);
 var fl=mk("line");fl.setAttribute("x1",4);fl.setAttribute("x2",136);fl.setAttribute("y1",108);fl.setAttribute("y2",108);fl.setAttribute("stroke","var(--bd)");fl.setAttribute("stroke-width",2);
 for(i=0;i<11;i++){var l=mk("line");l.setAttribute("stroke-width",4);l.setAttribute("stroke-linecap","round");L.push(l)}
 var c=mk("circle");c.setAttribute("r",6);c.setAttribute("fill","none");c.setAttribute("stroke-width",3);
 ANIM.push({k:k,L:L,c:c,box:box})}
function frame(a,e){
 var A=POSE[a.k][0],B=POSE[a.k][1],p=A.map(function(x,i){return i===10?x:lerpA(x,B[i],e)}),s=skel(p),H=p[10],dy,mnx=1e9,mxx=-1e9,FL=108;
 s.all.forEach(function(q){mnx=Math.min(mnx,q[0]);mxx=Math.max(mxx,q[0])});
 var dx=70-(mnx+mxx)/2;
 if(H>0)dy=(FL-H)-Math.max(s.aA[1],s.tA[1]);else{dy=FL-Math.max.apply(null,s.all.map(function(q){return q[1]}));dy=Math.min(dy,FL-(s.hd[1]+6))}
 s.seg.forEach(function(g,i){var l=a.L[i];l.setAttribute("x1",g[0][0]+dx);l.setAttribute("y1",g[0][1]+dy);l.setAttribute("x2",g[1][0]+dx);l.setAttribute("y2",g[1][1]+dy);l.setAttribute("stroke",g[2]?"var(--mu)":"var(--ac)");l.setAttribute("opacity",g[2]?.6:1)});
 a.c.setAttribute("cx",s.hd[0]+dx);a.c.setAttribute("cy",s.hd[1]+dy);a.c.setAttribute("stroke","var(--ac)");
 if(H>0){a.box.setAttribute("x",s.aA[0]+dx-22);a.box.setAttribute("y",FL-H);a.box.setAttribute("width",44);a.box.setAttribute("height",H)}else a.box.setAttribute("width",0)}
var RAF=0,still=false;try{still=matchMedia("(prefers-reduced-motion: reduce)").matches}catch(e){}
function loop(t){if(CV!=="str"){RAF=0;return}var e=still?1:(1-Math.cos(t/1300*Math.PI))/2;ANIM.forEach(function(a){frame(a,e)});RAF=requestAnimationFrame(loop)}
function exRow(e){var m=EXI[e[0]]||[0,""];return"<div class='ex2'>"+(m[0]?"<svg viewBox='0 -10 140 130' data-k='"+m[0]+"' role='img' aria-label='Animasi "+e[0]+"'></svg>":"<div></div>")+"<div><b>"+e[0]+"</b><div class='mu'>"+e[1]+" · "+e[2]+"</div><p class='fx'><b>Fungsi:</b> "+m[1]+"</p></div></div>"}
function viewStr(){
 var h="<h1>Strength</h1><div class='mu'>Sesuai cedera yang dipilih di Profil. Animasi menunjukkan pola gerak; tampak samping, versi sederhana.</div><div class='chips' style='margin-top:12px'>"+["A","B"].map(function(x){return"<button class='chip"+(S.sess===x?" on":"")+"' onclick=\"S.sess='"+x+"';save();viewStr()\">Sesi "+x+"</button>"}).join("")+"</div>";
 h+="<h2>Inti dan stabilitas</h2><div class='card'>"+(S.sess==="A"?BASE.slice(0,3):BASE.slice(2)).map(exRow).join("")+"</div>";
 if(!S.inj.length)h+="<div class='card mu'>Belum ada cedera dipilih. Tambahkan di tab Profil agar latihan rehab muncul di sini.</div>";
 S.inj.forEach(function(k){h+="<h2>Rehab: "+INJ[k].n+"</h2><div class='card'>"+INJ[k].ex.map(exRow).join("")+"</div>"});
 h+="<div class='warn'>Nyeri saat latihan boleh sampai 3/10 dan harus reda dalam 24 jam. Jika nyeri tajam, bengkak, nyeri malam hari, atau tidak membaik dalam 1–2 minggu, periksa ke dokter atau fisioterapis. Ini bukan pengganti saran medis.</div>";
 $("v-str").innerHTML=h;ANIM=[];[].forEach.call($("v-str").querySelectorAll("svg[data-k]"),mkAnim);if(!RAF)RAF=requestAnimationFrame(loop)}

/* ---- Profil ---- */
function stravaCard(){
 if(!ST||!ST.auth)return"<div class='card'><div class='mu'>Masuk dengan Strava agar program dan insight dihitung dari data lari kamu.</div><a href='/api/auth/login' style='display:block;text-align:center;text-decoration:none;margin-top:12px;padding:13px;border-radius:12px;background:var(--ac);color:#fff;font-weight:700'>Masuk dengan Strava</a></div>";
 return"<div class='card'><b>Terhubung ke Strava</b><div class='mu'>"+(F?F.n+" lari dalam 12 minggu · "+F.avg4.toFixed(0)+" km/minggu (4 minggu) · long run "+F.longest.toFixed(0)+" km":"")+"<br>Sinkron terakhir: "+new Date(ST.at).toLocaleString("id-ID")+"</div><button class='pri' onclick='resync()'>Sinkron ulang</button><p class='mu'><a href='/api/auth/logout'>Keluar dari Strava</a></p></div>"}
function viewSet(){
 var h="<h1>Profil</h1><div class='mu'>Data tersimpan di perangkat ini.</div>";
 h+="<label>Jenis race</label><select id='f-dist'>"+Object.keys(DIST).map(function(k){return"<option value='"+k+"'"+(S.dist===k?" selected":"")+">"+DIST[k].n+"</option>"}).join("")+"</select>";
 h+="<label>Tanggal race (opsional)</label><input type='date' id='f-race' value='"+S.race+"'>";
 h+="<label>Target waktu (5K/10K: mm:ss · lainnya: j:mm:ss)</label><input id='f-goal' value='"+S.goal+"' placeholder='"+DEF[S.dist]+"'>";
 h+="<label>Km per minggu (dipakai bila Strava belum terhubung)</label><input type='number' id='f-km' value='"+S.km+"'>";
 h+="<label>Critical Power / FTP lari (watt, opsional)</label><input type='number' id='f-cp' value='"+(S.cp||"")+"' placeholder='mis. 250'>";
 h+="<label>Cedera / area bermasalah</label><div class='chips'>"+Object.keys(INJ).map(function(k){return"<button class='chip"+(S.inj.indexOf(k)>-1?" on":"")+"' onclick=\"tg('"+k+"')\">"+INJ[k].n+"</button>"}).join("")+"</div>";
 h+="<button class='pri' onclick='sv()'>Simpan dan buat program</button><h2>Strava</h2>"+stravaCard();
 h+="<div class='card'><div class='mu'>Pendekatan power mengacu pada Steve Palladino (<a href='https://matthewboydphysio.com/running-with-power-meters-101-with-steve-palladino/' target='_blank' rel='noopener'>sumber</a>): Critical Power sebagai titik acuan. Persentase zona watt di sini adalah default umum, bukan angka Palladino.</div></div>";
 $("v-set").innerHTML=h}
function tg(k){rd();var i=S.inj.indexOf(k);i>-1?S.inj.splice(i,1):S.inj.push(k);save();viewSet()}
function rd(){var g=function(i){return $(i).value};S.dist=g("f-dist");S.race=g("f-race");S.goal=g("f-goal");S.km=+g("f-km")||25;S.cp=+g("f-cp")||0}
function sv(){rd();vw=0;save();show("plan")}
var VIEWS={plan:viewPlan,ins:viewIns,race:viewRace,str:viewStr,set:viewSet};
function show(v){if(CV==="set"&&v!=="set"&&$("f-dist")){try{rd();save()}catch(e){}}
 CV=v;Object.keys(VIEWS).forEach(function(x){$("v-"+x).classList.toggle("hide",x!==v)});
 [].forEach.call(document.querySelectorAll("nav button"),function(b){b.classList.toggle("on",b.dataset.v===v)});VIEWS[v]();window.scrollTo(0,0)}
function init(){
 [].forEach.call(document.querySelectorAll("nav button"),function(b){b.onclick=function(){show(b.dataset.v)}});
 recalc();show("plan");
 sync().then(function(){if(CV!=="set")show(CV)});
 if("serviceWorker" in navigator)navigator.serviceWorker.register("/sw.js").catch(function(){})}
if(typeof document!=="undefined"&&document.getElementById("v-plan"))init();
