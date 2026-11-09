# How Nyay Saathi counts impact

The rules ask for "actual deployment data, not intentions". These are the exact definitions behind the numbers at `/impact`.

## What is stored

One row per event in a local SQLite file, with these columns: time, day, event kind, problem type (one of 8 fixed values), language (`en` or `hi`), planner mode (`llm`, `offline` or `offline_fallback`), a short fixed value (for example `helpful` or `15100`), a bot flag and an internal flag.

Each browser gets a random id kept in its own `localStorage`. The server stores only a salted SHA-256 hash of it, cut to 16 hex characters, so that unique devices can be counted.

**Never stored:** what the person typed, draft letter contents, names, phone numbers, addresses, IP addresses, user-agent strings or cookies. The server also rejects any event value outside a fixed allow-list, so free text cannot reach the database through the analytics endpoint.

## Definitions

| Number | Definition |
|---|---|
| People helped | Distinct devices with at least one `agent_turn` (the agent answered a problem). |
| Visitors | Distinct devices with a `page_view`. |
| Letters drafted | `draft_made` events: a draft was produced by the agent or by the person filling the form. |
| Letters taken | `draft_copied` + `draft_downloaded`. |
| Legal-aid checks | `aid_checked` events, with the result (`eligible`, `check_with_dlsa`, `need_more_info`). |
| Helpline taps | Taps on a `tel:` link (15100, 112, 181, 1098, 1915, 1930). A tap starts a call; we cannot see whether it connected. |
| Found it helpful | Share of "Yes" answers to "Was this helpful?". |
| Follow-ups | Returning visitors asked 3+ days after getting help whether they took the step. Self-reported. |

`agent_turn`, `draft_made` and `aid_checked` are recorded **only by the server** when the work actually happens. Browsers cannot post them, so they cannot be inflated by replaying requests to the event endpoint.

## Exclusions, shown not hidden

- **Automated traffic:** a request with no user agent, or one matching common crawler, monitor and script patterns, is flagged `is_bot`.
- **Internal testing:** devices opened once with `/?internal=1` are flagged `is_internal`. The team does this on every device it tests with.

Both are excluded from the headline numbers and their counts are printed at the bottom of `/impact`.

## Known limits

- One person on two devices counts twice; two people sharing one phone count once. Clearing browser storage creates a new id.
- Follow-up answers are self-reported and only come from people who return.
- A determined actor could still script fake page views. The headline "People helped" requires the agent to run, which is rate-limited per IP.
