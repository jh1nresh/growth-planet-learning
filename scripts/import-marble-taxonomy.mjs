import {execFileSync} from 'node:child_process';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const sourceDirectory = resolve(process.argv[2] ?? 'third_party/os-taxonomy');
const sourceUrl = 'https://github.com/withmarbleapp/os-taxonomy';
const subjects = new Set(['Mathematics', 'English']);

const readJson = async (file) => JSON.parse(await readFile(resolve(sourceDirectory, 'data', file), 'utf8'));
const [sourceTopics, sourceDependencies] = await Promise.all([
  readJson('topics.json'),
  readJson('dependencies.json'),
]);
const upstreamCommit = execFileSync('git', ['-C', sourceDirectory, 'rev-parse', 'HEAD'], {encoding: 'utf8'}).trim();
const topics = sourceTopics.topics.filter((topic) => subjects.has(topic.subject) && topic.ageRangeEnd <= 12);
const topicIds = new Set(topics.map((topic) => topic.id));
const dependencies = sourceDependencies.dependencies.filter(
  (edge) => topicIds.has(edge.topicId) && topicIds.has(edge.prerequisiteId),
);

const output = (name, value) => writeFile(resolve('src/data', name), `${JSON.stringify(value, null, 2)}\n`);
await Promise.all([
  output('marble-topics.json', {
    version: sourceTopics.version,
    topicCount: topics.length,
    source: sourceUrl,
    upstreamCommit,
    filter: 'subject in Mathematics, English; ageRangeEnd <= 12',
    topics,
  }),
  output('marble-dependencies.json', {
    version: sourceDependencies.version,
    edgeCount: dependencies.length,
    source: sourceUrl,
    upstreamCommit,
    note: sourceDependencies.note,
    dependencies,
  }),
]);

console.log(`Imported ${topics.length} topics and ${dependencies.length} dependencies from ${upstreamCommit}.`);
