# Nyay Saathi: a free legal-help agent for India

**Track: Timely Justice, Legal Backlog** · Code for a Billion 2026 · MIT licence

**Live:** https://nyaysaathi.surgesoftware.co.in · **Live usage numbers:** https://nyaysaathi.surgesoftware.co.in/impact

Nyay Saathi ("justice companion") helps an ordinary person with a legal problem find their next step. They describe what happened in their own words, in English or Hindi. The agent then:

1. **Works out what kind of problem it is** (unpaid wages, consumer fraud, violence at home, police not filing an FIR, cheque bounce, a stuck government application, court case status, land or tenancy).
2. **Gives verified next steps, helplines and official links** from a curated, sourced knowledge base. It never makes up a law, deadline or phone number.
3. **Checks whether they can get a free lawyer** under section 12 of the Legal Services Authorities Act, 1987, and points them to 15100 (NALSA) and their District Legal Services Authority.
4. **Drafts the letter they need** (legal aid application, RTI application, consumer complaint, wage demand, complaint to the Superintendent of Police), which they fill in, copy or download.

No sign-up, no tracking cookies, and nothing the person types is saved.

## Why this problem

- **Size.** About **5 crore cases** are pending in Indian courts, nearly all of them in district and subordinate courts ([Business Standard, Aug 2026](https://www.business-standard.com/india-news/10000-sc-cases-pending-over-10-years-80000-hc-cases-over-30-years-126080300335_1.html)). Many more disputes never reach a court because people do not know where to start.
- **Severity.** People lose wages, deposits and years of their lives to problems that a letter, a free lawyer or a Lok Adalat could settle. Women, children, SC/ST communities, people with disabilities and industrial workers are entitled by law to a free lawyer whatever their income (women and children alone are more than half the population), yet most people have never heard of legal aid.
- **Backlog angle.** The fastest case is the one that is settled before it is filed. Nyay Saathi steers people to the cheapest path first: a written demand, a consumer helpline grievance, an RTI, legal-aid mediation or a Lok Adalat, where there is no court fee and the award is final.

## How the agent works

```
person's words ──► planner (LLM, any OpenAI-compatible endpoint)
                      │  calls tools, max 5 steps
                      ▼
      get_guidance ─ check_legal_aid ─ draft_document     (deterministic, sourced)
                      │
                      ▼
      reply + verified steps + eligibility + drafts  ──►  person
```

- The **LLM only plans and talks**. Facts come from tools (`src/tools.js`, `src/knowledge.js`), and their output is shown to the person exactly as the tool returned it, not as the model retold it.
- If the model answers without calling `get_guidance`, the server attaches verified guidance itself.
- **Offline mode.** With no LLM configured, or if the LLM fails, a keyword planner runs the same tools. The app keeps working at zero cost.
- Works with a **local open model** (Ollama, vLLM, llama.cpp server) or any hosted OpenAI-compatible API. No vendor lock-in and no paid API needed.

## Real usage data (for the "Proven impact" criterion)

The live deployment publishes its numbers at **`/impact`** (JSON at `/api/impact`, daily CSV at `/api/impact.csv`). Counted: people helped, letters drafted and taken away, legal-aid checks, helpline taps, "was this helpful", and a self-reported follow-up ("did you take the next step?") asked of returning visitors 3+ days later.

Privacy: no message text, names, phone numbers, IP addresses or user-agent strings are stored. Automated traffic and the team's own testing are flagged and **shown separately, never mixed in**. See [docs/IMPACT.md](docs/IMPACT.md) for exact definitions.

## Run it

Requires Node.js 22.5 or newer. There are no dependencies to install.

```bash
cp .env.example .env    # optional
npm start               # http://localhost:8080
npm test
```

With a local model through Ollama:

```bash
LLM_BASE_URL=http://localhost:11434/v1 LLM_MODEL=qwen2.5:7b-instruct npm start
```

With Docker:

```bash
docker build -t nyay-saathi .
docker run -p 8080:8080 -v nyay-data:/data nyay-saathi
```

Mark your own devices as internal testers by opening `/?internal=1` once on each device, so your testing never inflates the impact numbers. `/?internal=0` undoes it.

## Project layout

| Path | What it is |
|---|---|
| `src/agent.js` | Planner loop (LLM tool calling) and offline planner |
| `src/tools.js` | `get_guidance`, `check_legal_aid`, `draft_document` and their schemas |
| `src/knowledge.js` | Sourced guidance per problem type, helplines, official links |
| `src/analytics.js` | Privacy-first usage counting (SQLite via `node:sqlite`) |
| `src/server.js` | Zero-dependency HTTP server, rate limit, strict CSP |
| `public/` | Mobile-first web app and the public `/impact` page |
| `tests/` | `node --test` suite, including a fake-LLM tool-loop test |

## Limits, stated plainly

- This is legal **information**, not legal advice. Every screen says so and points to a free lawyer.
- Step-by-step guidance is written in English; the interface, the offline replies and LLM replies are in Hindi when the person uses Hindi. Hindi and Telugu translations of the guidance are the next contribution we want.
- The income limit for free legal aid is set by each state and changes, so the app does not guess it. It sends people to their DLSA to confirm.
- Eight common problem types are covered. Each new one needs official sources (see [CONTRIBUTING.md](CONTRIBUTING.md)).

## Built with

Built for Code for a Billion 2026. Plain Node.js and browser JavaScript, no frameworks, so any volunteer can read the whole codebase in an hour.

## Licence

MIT. See [LICENSE](LICENSE).
