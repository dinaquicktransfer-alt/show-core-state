# Agent Spec — Question Package Generator

This document defines exactly how a future Copilot / LLM agent should
generate content that the Enneagram Event Platform can import directly.

## What the agent produces
A **Question Package**: a JSON array of `QuestionItem` objects (see `DATA_MODELS.md`).
This file can be loaded verbatim in the host panel under **Question Package →
Load JSON file**, or pasted into the textarea.

## Schema (strict)
```jsonc
[
  {
    "question": "string, ending in '?'",
    "primaryType": 1,        // integer 1–9, matches the trait most strongly
    "secondaryType": 8,      // integer 1–9, close-adjacent trait
    "trait": "Leadership",   // 1–2 word tag, human-readable
    "winnerPoints": 3,
    "secondaryPoints": 2,
    "nomineePoints": 1
  }
]
```
All fields required. `winnerPoints > secondaryPoints > nomineePoints > 0`.

## Type Mapping Reference
| Type | Name           | Ideal traits                          |
| ---- | -------------- | ------------------------------------- |
| 1    | Reformer       | Integrity, Discipline, Ethics         |
| 2    | Helper         | Empathy, Warmth, Support              |
| 3    | Achiever       | Ambition, Charisma, Drive             |
| 4    | Individualist  | Creativity, Depth, Authenticity       |
| 5    | Investigator   | Insight, Focus, Mastery               |
| 6    | Loyalist       | Loyalty, Trust, Preparation           |
| 7    | Enthusiast     | Joy, Ideas, Adventure                 |
| 8    | Challenger     | Power, Courage, Command               |
| 9    | Peacemaker     | Harmony, Calm, Acceptance             |

The canonical table lives in `src/lib/enneagram.ts` (`ENNEAGRAM`).

## Trait Mapping Guidelines
Pick one leading trait per question. Map it to the primary type using the
table above. Choose a `secondaryType` that plausibly co-occurs (adjacent
wing, matching triad, or complementary energy). Examples:

- "Leadership" → primary 3 (Achiever) · secondary 8 (Challenger)
- "Fun / Party energy" → primary 7 · secondary 2
- "Crisis reliability" → primary 6 · secondary 8
- "Peacemaking" → primary 9 · secondary 2
- "Creative work" → primary 4 · secondary 5
- "Deep thinker" → primary 5 · secondary 4
- "Community glue" → primary 2 · secondary 9
- "Discipline / integrity" → primary 1 · secondary 3
- "Bold decisions" → primary 8 · secondary 3

## Chemistry Metadata (implicit)
The chemistry engine derives its results from the aggregate score
distribution — the agent does NOT need to produce chemistry data. Just
ensure the question mix covers a spread of types across the pack so the
distribution is meaningful (aim for ≥ 5 of the 9 types represented as
`primaryType` in any pack of 10+ questions).

## Example Input to the Agent
> "Generate 12 icebreaker questions for a company off-site of engineers.
> Playful tone. Balanced Enneagram coverage."

## Example Output (importable as-is)
```json
[
  { "question": "Who would you want writing the postmortem after an outage?", "primaryType": 5, "secondaryType": 1, "trait": "Analysis", "winnerPoints": 3, "secondaryPoints": 2, "nomineePoints": 1 },
  { "question": "Who plans the most over-the-top team retreat?", "primaryType": 7, "secondaryType": 2, "trait": "Fun", "winnerPoints": 3, "secondaryPoints": 2, "nomineePoints": 1 },
  { "question": "Who calls out a bad decision in a room full of VPs?", "primaryType": 8, "secondaryType": 1, "trait": "Courage", "winnerPoints": 3, "secondaryPoints": 2, "nomineePoints": 1 },
  { "question": "Who mediates the feature-priority argument?", "primaryType": 9, "secondaryType": 2, "trait": "Harmony", "winnerPoints": 3, "secondaryPoints": 2, "nomineePoints": 1 },
  { "question": "Who ships the ambitious quarterly demo on time?", "primaryType": 3, "secondaryType": 8, "trait": "Drive", "winnerPoints": 3, "secondaryPoints": 2, "nomineePoints": 1 },
  { "question": "Who is the on-call teammate you actually want?", "primaryType": 6, "secondaryType": 8, "trait": "Reliability", "winnerPoints": 3, "secondaryPoints": 2, "nomineePoints": 1 },
  { "question": "Who redesigns the internal tool nobody asked them to fix?", "primaryType": 4, "secondaryType": 5, "trait": "Craft", "winnerPoints": 3, "secondaryPoints": 2, "nomineePoints": 1 },
  { "question": "Who is the group's therapist between meetings?", "primaryType": 2, "secondaryType": 9, "trait": "Care", "winnerPoints": 3, "secondaryPoints": 2, "nomineePoints": 1 },
  { "question": "Who insists on the style guide and wins?", "primaryType": 1, "secondaryType": 5, "trait": "Standards", "winnerPoints": 3, "secondaryPoints": 2, "nomineePoints": 1 },
  { "question": "Who turns a whiteboard into a startup pitch in 10 minutes?", "primaryType": 7, "secondaryType": 3, "trait": "Vision", "winnerPoints": 3, "secondaryPoints": 2, "nomineePoints": 1 },
  { "question": "Who is the calm during a war-room incident?", "primaryType": 9, "secondaryType": 5, "trait": "Calm", "winnerPoints": 3, "secondaryPoints": 2, "nomineePoints": 1 },
  { "question": "Who defends the junior engineer in a code review?", "primaryType": 8, "secondaryType": 2, "trait": "Protection", "winnerPoints": 3, "secondaryPoints": 2, "nomineePoints": 1 }
]
```

## Validation
The platform calls `validateQuestions()` (`src/lib/enneagram.ts`) on
import; malformed entries are rejected with a specific error message.
Agents should validate against the schema before returning.
