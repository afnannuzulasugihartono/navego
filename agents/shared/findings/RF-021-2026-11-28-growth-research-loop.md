# RF-021 — an effective growth research loop, in plain office language (2026-11-28)

## Question

The owner asked for a loop that keeps growing: a problem appears, the operator researches it, writes a finding, turns it into a task, and an engineer implements the fix. They also asked what makes that loop effective.

## Sources

| Source | What was taken |
|---|---|
| The Lean Startup, Methodology — https://theleanstartup.com/principles | Build–measure–learn. The question is "Should this product be built?", and progress is validated learning with actionable metrics, not output volume. |
| Double Diamond (Design Council) — https://en.wikipedia.org/wiki/Double_Diamond_(design_process_model) | Four steps: discover the issue by being with affected people, define the problem from that evidence, develop several solutions, deliver by testing small and rejecting what does not work. Crucially: start from the problem, not the solution. |
| PDCA / Deming cycle — https://en.wikipedia.org/wiki/PDCA | Plan, Do, Check, Act, then repeat with a better baseline. Compare predicted result with actual result; if the action did not change the outcome, it was not effective. |
| OODA loop — https://en.wikipedia.org/wiki/OODA_loop | Observe, orient, decide, act, with continuous feedback. Faster, evidence-backed turns beat a large one-time plan. The source itself notes the model can be vague, so it is used here only as a reminder to re-observe each turn. |
| Anthropic, Demystifying evals — https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents | Start with 20–50 tasks drawn from real failures; prefer deterministic graders; grade the outcome, not the transcript. |
| Google SRE, Postmortem Culture — https://sre.google/sre-book/postmortem-culture/ | A finding needs a preventive action and review; an unreviewed postmortem might as well not exist. |
| RF-018 in this repo — decision-first topic selection | A new topic is justified by a decision that would change, not by a daily quota. |

## The loop, in office language

1. **Lihat angka.** Si Buku Kas bilang: uang masih 0, atau satu langkah tidak bergerak.
2. **Tanya masalahnya, bukan solusinya.** "Kenapa orang yang sudah sampai ke harga tidak bayar?" Bukan "kita buat website lebih cantik".
3. **Kumpulkan bukti.** Dua sumber: perilaku nyata di rumah sendiri (halaman dibuka, klik, berhenti di mana) dan tulisan orang di internet yang bisa dibuka. Sertakan bukti yang *menentang* dugaan kita.
4. **Tulis kertas temuan (RF).** Satu kalimat: "Saya melihat A, jadi saya sarankan B diubah." Kalau tidak ada kalau-begini-maka-beginu, kertas itu tidak layak jadi tugas.
5. **Ubah jadi satu kertas tugas.** Isi: untuk siapa, apa yang berubah, kapan selesai, dan angka apa yang harus bergerak. Satu tugas, bukan daftar.
6. **Pekerja mengerjakan.** Test gagal dulu, kode, lalu pemeriksaan.
7. **Pasang dan baca lagi.** Lihat halaman/endpoint sungguhan — bukan cuma "CI hijau".
8. **Ukur lagi.** Kalau angka tidak bergerak, kertas temuan berikutnya ditulis. Kalau bergerak, temuan itu naik jadi pengetahuan tetap.

## What makes it effective

- **Masalah dulu, solusi kemudian.** Double Diamond says the same.
- **Satu putting-out per cycle.** PDCA repeats; a long list never closes.
- **Ukur hasil, bukan transcript.** Anthropic's guidance; our score already does this — only settled money moves it.
- **Counter-evidence is required.** Without it, every finding confirms what we already believed.
- **A finding without an owner and an action is not a finding.** SRE's unreviewed postmortem rule.
- **Cadence is not a reason.** RF-018: one new topic per turn is toil unless a decision needs it.
- **Stop at the owner boundary.** Payments, account reviews and another maintainer's merge are not research outputs.

## Applied to the current problem

No customer has told us why they do not buy. "Website jelek" is a guess, not a finding. The measurable facts are: 0 settled payments, 0 stars, Google 0 indexed pages, listing PR still Open, and a buyer who reaches pricing leaves without clicking. The first research ticket therefore asks **why a visitor who reaches pricing does not buy**, with `decision-change: choose one change to the pricing page before asking for more traffic`. It is stacked for 2026-11-29 and must pass `research-gate.ts` before dispatch.

## Money

Settled external revenue remains $0.00, 0 orders. A loop only counts when the outcome changes.
