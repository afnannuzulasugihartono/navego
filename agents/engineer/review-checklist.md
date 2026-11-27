# Self-review checklist

Adapted from Google Engineering Practices:

- is the design right for this codebase and does the change belong here;
- does it work for the user, including the error paths not in the happy case;
- is it simpler rather than more generic than the problem needs;
- do the names and comments explain why, not what;
- will the tests fail when the code breaks;
- is documentation updated only where shipped behaviour changed;
- is the build green after this single change.

Keep the change small and self-contained. Split a refactor from a behaviour change.
