# FakeStore API Automation Framework

API test automation for [FakeStore API](https://fakestoreapi.com/) — cart, products, and authentication.

## Framework Choice

**Playwright + TypeScript** was selected because:

- **Native API support** — `APIRequestContext` handles HTTP without a browser, keeping tests fast and lightweight.
- **Single toolchain** — test runner, parallel execution, fixtures, snapshots, and HTML reporting in one framework (no Postman/Newman or separate REST client).
- **Type safety** — TypeScript interfaces and compile-time checks reduce runtime errors in a growing suite.
- **CI-ready** — built-in reporters, retries, and GitHub Actions integration with minimal setup.
- **Scalable pattern** — API Client classes (POM equivalent) keep tests readable as coverage grows.

**AJV** validates JSON response contracts. **Playwright snapshots** provide contract testing for product responses.

## Assignment Coverage

| Requirement | Implementation |
|-------------|----------------|
| Cart CRUD (POST / GET / PUT / DELETE) | `tests/cart/cart-crud.spec.ts` |
| Positive & negative cases | `cart-crud.spec.ts` + `cart-negative.spec.ts` |
| Authentication | `tests/auth/auth.spec.ts` + authenticated cart access in `cart-crud.spec.ts` |
| Response schema validation | AJV schemas in `schemas/` — applied on cart, auth, and product responses |
| Data-driven test (3+ product IDs) | Product GET for IDs **1–5** in `tests/product/product.spec.ts` |
| Contract / snapshot test (senior) | Product response snapshots + schema validation in `product.spec.ts` |

**31 tests** across auth, cart, and product suites.

## Quick Start

```bash
npm install
npx playwright install
cp .env.example .env
npm test                  # run all tests
npm run test:cart         # cart suite only
npm run test:report       # open HTML report
```

**Environment variables:** `BASE_URL`, `API_USERNAME`, `API_PASSWORD`, `WORKERS`, `STRICT_RESPONSE_TIME_MS`, `MAX_RESPONSE_TIME_MS` (see `.env.example`).

## Project Layout

```
api/          → AuthApi, CartApi, ProductApi (API Client pattern)
tests/        → auth, cart, product test suites
schemas/      → AJV JSON schemas (cart, login, product)
fixtures/     → test data + Playwright custom fixtures
utils/        → apiHelper, logger, schemaValidator
```

## Reporting & Parallelisation

| Capability | Status |
|------------|--------|
| Console (list) reporter | Enabled |
| Playwright HTML report | `playwright-report/` — `npm run test:report` |
| JSON results | `test-results/results.json` |
| Parallel workers | `WORKERS` in `.env` (use `1` on Windows if workers crash) |
| CI/CD | GitHub Actions — runs on push/PR, uploads HTML report artifact |

## Extension Plan

| Phase | Enhancement |
|-------|-------------|
| **Near-term** | Allure reporting, test tagging (`@smoke` / `@regression`), Docker for consistent environments |
| **Mid-term** | Users API coverage, Faker.js test data factories, OpenAPI spec validation |
| **Long-term** | API mocking for offline runs, k6 performance tests, Slack/CI notifications, TestRail integration |

## License

MIT
