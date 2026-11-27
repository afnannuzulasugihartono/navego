# Product contract

A product ticket is complete only when all of these are true:

- at least one runtime file changed;
- a test exists and was watched fail before the fix, then pass;
- npm test and npm run check are green;
- the live behaviour was driven, not inferred from the diff;
- the PR names the exact head and the reviewer gap if the reviewer could not run.

A reply that changes only documents is not shipped work unless the ticket explicitly says documentation is the deliverable.
