# Contributing to ElectIQ

## Run Locally
From the repository root:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080/index.html`.

## Run Tests
Start the local server and open:

```text
http://localhost:8080/tests/test.html
```

The browser test table should show every test as `PASS`.

## Branch Policy
This challenge repository uses `main` only. Do not create extra branches for submission work.

## Pull Request Checklist
- Browser test suite passes.
- No API keys or secrets are committed.
- Repository size stays under 10 MB.
- `node_modules` and build artifacts are not committed.
- Accessibility, fallback chat, and voice flows are manually smoke-tested.
