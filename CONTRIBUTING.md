# Contributing

Thank you for helping people find justice faster.

## Ground rules

1. **Every legal claim needs an official source.** Add the link to the problem's `sources` in `src/knowledge.js` (a government site, the bare Act on indiacode.nic.in, or a court or legal-services authority page). No source, no merge.
2. **Plain language.** Write for someone who left school early. Short sentences, no Latin, no section numbers without saying what they mean.
3. **Information, not advice.** Tell people what the options are and where to get a free lawyer. Do not predict case outcomes.
4. **No personal data.** Do not add logging of message text, and do not add third-party scripts or trackers.

## Good first contributions

- Hindi, Telugu, Tamil, Bengali or Marathi translations of the steps in `src/knowledge.js`.
- A sourced per-state table of the income limit for free legal aid (each State Legal Services Authority notifies its own).
- New problem types: maintenance, senior citizens' maintenance, wrongful termination, bank and UPI fraud, disability certificates.
- A voice front end (speech in, speech out) for people who cannot read.

## Checks

```bash
npm test
```

Tests must pass, and new tools need tests.
