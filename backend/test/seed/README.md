# Global seed system

`npm run seed -- --env=test --profile=minimal` seeds only the explicitly selected database URL. Supported environments are `test`, `e2e`, `dev`, `demo`, and `staging`; `prod` and `production` are always refused.

- `test` → `TEST_DATABASE_URL`; `e2e` → `E2E_DATABASE_URL`, then `TEST_DATABASE_URL`.
- `dev`, `demo`, and `staging` require their matching `*_DATABASE_URL`. `DATABASE_URL` is accepted for `dev` only with `--allow-database-url` and an explicit confirmation.
- `--dry-run` performs no write. `--cleanup` removes only deterministic seed IDs and `sourceModule=TEST_SEED` registry data.
- Profiles: `minimal`, `security`, `standard`, `full`, `demo`. Use `--modules=iam,tenant` to select modules; dependencies are added automatically.

The seeder never drops a database/schema, resets migrations, copies customer data, creates real credentials, invokes external integrations, or fabricates successful deployments/runtime execution. Modules that would require those unsafe invariants report `SKIPPED` instead.
