# Navego economy folder

The ledger, the knowledge library, and the current subscription state live here.

| File | What it holds |
|---|---|
| `ledger.jsonl` | One money event per line: revenue, cost, subscription, or refund. A correction is another line. |
| `knowledge/` | One Markdown file per research note, with its source and the date it was observed. |
| `subscription.json` | The AI subscription the agent currently runs on, with its price and the source that priced it. |

The command that reads and writes this folder is `navego economy`. It never spends money: it answers whether a spend keeps the reserve intact, and records the decision once the spend happened.
