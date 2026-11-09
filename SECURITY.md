# Security Policy

This is the vulnerability disclosure policy for [1ARdotNO/Rahoot](https://github.com/1ARdotNO/Rahoot), a self-hosted quiz platform forked from [Ralex91/Rahoot](https://github.com/Ralex91/Rahoot). It explains what we consider in scope, how to report a vulnerability privately, and what you can expect from us.

| Version | Date       | Description     |
| ------- | ---------- | --------------- |
| 1.0     | 2026-11-09 | Initial version |

## Supported versions

Rahoot is released continuously from the `main` branch. Only the latest release receives security fixes.

| Version                                            | Supported |
| -------------------------------------------------- | --------- |
| `main` branch and `ghcr.io/1ardotno/rahoot:latest` | ✅        |
| Older images, commits, and the upstream projects   | ❌        |

We do not backport fixes. If you run Rahoot, pull the latest image regularly; dependency updates are applied automatically through Renovate once CI passes.

## Reporting a vulnerability

**Report privately through GitHub:** [Report a vulnerability](https://github.com/1ARdotNO/Rahoot/security/advisories/new) (repository _Security_ tab → _Report a vulnerability_).

Do not report security problems in public issues, pull requests, or discussions.

A good report includes:

- The affected component (web app, socket server, Docker image) and version or commit.
- Step-by-step reproduction, ideally with the exact requests or socket events involved.
- The impact you were able to demonstrate, and any preconditions (for example, a valid player session or manager login).
- Whether the issue also exists in the upstream projects, if you know.

If the vulnerability is in code inherited unchanged from [Ralex91/Rahoot](https://github.com/Ralex91/Rahoot), please report it there as well. We will coordinate with upstream where we can.

## What to expect

These are targets for a small volunteer-run project, not contractual service levels.

| Stage                           | Target                             |
| ------------------------------- | ---------------------------------- |
| Acknowledgement of your report  | Within 5 business days             |
| Initial assessment and severity | Within 10 business days            |
| Fix released (Critical / High)  | Within 7 / 30 days of confirmation |
| Fix released (Medium / Low)     | Within 90 days of confirmation     |

We rate severity with CVSS v4.0. Confirmed vulnerabilities are fixed in a private fork, published as a GitHub Security Advisory with a CVE where appropriate, and credited to you unless you prefer to remain anonymous. We will keep you informed through the advisory thread, including if we decide a report is not a vulnerability and why.

### Coordinated disclosure

Please give us 90 days from your report, or until a fix is released if that is sooner, before disclosing publicly. If a fix needs longer, we will agree an extension with you rather than ask for an open-ended delay. If a vulnerability is being actively exploited, we may publish an advisory sooner.

## Scope

### In scope

The code in this repository and the Docker image built from it, in particular:

- **Manager authentication**: bypassing the manager password, OIDC login, API keys, or session tokens.
- **Authorization between users**: one OIDC user reading, changing, or deleting another user's quizzes, results, or API keys.
- **Game integrity**: a player or non-host taking host actions, answering for other players, changing scores, or seeing correct answers early.
- **Injection**: cross-site scripting through quiz content, Markdown slides, usernames, or results; server-side injection of any kind.
- **File handling**: path traversal or arbitrary file read/write through quiz ids, result ids, or image uploads; serving uploaded content as active content.
- **The container**: privilege escalation or escape from the published Docker image.
- **Secrets**: exposure of the manager password, API keys, session tokens, or OIDC client secrets.

### Out of scope

- Deployments that ignore the documented setup, for example an unchanged default `managerPassword`, `WEB_ORIGIN=*`, or running without TLS on an untrusted network.
- Attacks that require control of the host, the `config/` directory, or the OIDC provider.
- Volumetric denial of service, load testing, and spam. Do not run these against any instance.
- Vulnerabilities in dependencies without a demonstrated exploit path in Rahoot. These are patched automatically; report them upstream to the dependency.
- Social engineering of maintainers or users, and physical attacks.
- Findings from automated scanners without a working proof of concept.

### Known limitations

These are already known. You do not need to report them, but we welcome fixes.

- **No rate limiting on the manager login.** The shared password can be guessed online. Use a long random password, or OIDC with `OIDC_ALLOWED_GROUPS`. API keys are 256-bit random values and are not practical to guess.
- **No Content Security Policy.** User content is escaped by React and Markdown rendering does not allow raw HTML, but there is no CSP as a second layer.
- **Sessions are kept in memory** and are lost on restart; the manager password is stored in plain text in `config/game.json`. Protect that directory like any other secret.

## Safe harbour

We will not pursue legal action against, or ask law enforcement to investigate, anyone who acts in good faith under this policy. Good faith means you:

- Test only against your own installation, never against instances you do not own or have written permission to test.
- Access no more data than needed to demonstrate the issue, and do not keep, share, or alter other people's data.
- Do not degrade service for others.
- Report the issue privately and give us reasonable time to fix it before disclosure.

If you are unsure whether something is in scope or allowed, ask in your private report before proceeding.

## Hardening checklist for operators

- Set a long, random `managerPassword` in `config/game.json`, or use OIDC (`MANAGER_AUTH=oidc`).
- With OIDC, set `OIDC_ALLOWED_GROUPS` so only intended accounts can manage quizzes.
- Serve both the web interface and the socket server over HTTPS behind a reverse proxy, and set `WEB_ORIGIN` and `SOCKET_URL` to the public URLs.
- Restrict access to the `config/` directory; it holds the manager password, quizzes, results, and hashed API keys.
- Revoke API keys you no longer use, and revoke a user's keys when you remove their access.
- Pull `ghcr.io/1ardotno/rahoot:latest` regularly to receive security fixes.
