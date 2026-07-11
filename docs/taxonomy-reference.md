# Curriculum graph reference

Growth Planet uses the open [Marble Skill Taxonomy](https://github.com/withmarbleapp/os-taxonomy) as an architectural reference, not as copied curriculum content.

## Architectural mapping

| Marble concept | Growth Planet implementation |
| --- | --- |
| Fine-grained topic node | Original Taiwan-focused `tw_*` micro-topic |
| Topic type | `CONCEPTUAL`, `PROCEDURAL`, `REPRESENTATIONAL`, `LANGUAGE`, or `META` |
| Evidence | Observable mastery evidence attached to every topic |
| Assessment prompt | Parent/teacher-friendly check phrased in Traditional Chinese |
| Standard reference | Product-local alignment key (`local-tw-*`), not a claim of official code equivalence |
| Dependency edge | `topicId` depends on `prerequisiteId`, with hard/soft strength and a reason |
| Cluster | Parent-friendly region summary for a domain and age band |
| Interactive graph | Subject-colored constellation; prerequisite depth runs left to right; selecting a micro-topic reveals its description and mastery evidence |
| Validation | Counts, unique IDs, referential integrity, DAG cycle detection, and route coverage |

Growth Planet does not copy Marble topic IDs, names, descriptions, evidence, assessment prompts, standard text, cluster summaries, or dependency reasons. The original content in this repository is authored for a Taiwan Grade 1 product vertical.

Reference snapshot checked: Marble Skill Taxonomy v1, commit `96a7933754af672e1bfdbf7ecb05c325860c6e0d` (2026-07-08).

## Attribution

Marble Skill Taxonomy (v1) · © Generative Spark, Inc. (Marble) · https://withmarble.com · licensed under ODbL 1.0 (database) and CC BY-SA 4.0 (content).

This attribution acknowledges the structural reference. Growth Planet’s original taxonomy data is maintained separately under this repository’s own product scope.
