# Curriculum graph reference

Growth Planet includes a filtered produced work from the open [Marble Skill Taxonomy](https://github.com/withmarbleapp/os-taxonomy). The app currently keeps Mathematics and English topics whose `ageRangeEnd` is 12 or below, plus dependency edges whose two topics remain in that filtered set.

## Architectural mapping

| Marble concept | Growth Planet implementation |
| --- | --- |
| Fine-grained topic node | Marble topic fields are preserved in `src/data/marble-topics.json` |
| Evidence and assessment | Marble-authored evidence and assessment prompts remain attached to each imported topic |
| Standard reference | Upstream standards remain part of the topic record |
| Dependency edge | `topicId` depends on `prerequisiteId`; relationship reason and strength are preserved |
| Interactive graph | Subject-colored 3D point graph; height represents age and selecting a topic reveals evidence and relations |
| Accessible equivalent | A native concept selector exposes the same topic details when Canvas cannot be used |
| Validation | Counts, unique IDs, referential integrity, subject/age filter, and DAG cycle detection |

The committed snapshot contains 698 topics and 1,326 dependencies. It is generated with:

```bash
node scripts/import-marble-taxonomy.mjs /path/to/os-taxonomy
```

The importer records the upstream Git commit in both generated JSON files. Regenerate and review both files together so the topic and edge filters cannot drift.

Reference snapshot checked: Marble Skill Taxonomy v1, commit `96a7933754af672e1bfdbf7ecb05c325860c6e0d` (2026-07-08).

## Attribution

Marble Skill Taxonomy (v1) · © Generative Spark, Inc. (Marble) · https://withmarble.com · licensed under ODbL 1.0 (database) and CC BY-SA 4.0 (content).

See `THIRD_PARTY_NOTICES.md` and `third_party/marble-skill-taxonomy/PROVENANCE.md` for the database/content license split, source notes, and reproduction receipt. The filtering performed here does not imply endorsement by Marble.
