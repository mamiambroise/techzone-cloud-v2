# Business Manager Backend - Seeder & E2E Tests Guide

## Seeder

The seeder populates the database with sample data for testing and development.

### Prerequisites

1. PostgreSQL database running and accessible
2. Environment variables configured in `.env`
3. Database schema created

### Run Seeder

```bash
cd Backend
npm run seed
```

This will:
- Create 3 sample applications (Boutique, CRM Sales, Support Helpdesk)
- Create 2-3 versions for each application
- Populate activity logs
- Create publication records for published versions

Sample data includes:
- **Boutique Mode & Chaussures** - e-commerce platform
  - v0.1.0 (PUBLISHED) - Demo version
  - v1.0.0 (PUBLISHED) - Production-ready
  - v1.1.0 (DRAFT) - Next release
  
- **CRM Commercial** - Sales management system
  - v0.1.0 (DRAFT) - Prototype
  - v0.9.0 (READY) - Ready for testing
  
- **Support Helpdesk** - Customer support platform
  - v0.1.0 (TESTING) - In testing
  - v0.2.0 (DRAFT) - Next iteration

## E2E Tests

End-to-end tests cover all major API endpoints of the Business Manager.

### Run All E2E Tests

```bash
cd Backend
npm run test:e2e
```

### Run Specific Test Suite

```bash
npm run test:e2e -- --testNamePattern="Applications API"
```

### Test Coverage

The E2E tests cover:

1. **Applications API** - CRUD operations on applications
   - POST /api/v1/business-manager/applications
   - GET /api/v1/business-manager/applications
   - GET /api/v1/business-manager/applications/:id
   - PATCH /api/v1/business-manager/applications/:id

2. **Application Versions API** - Version management
   - POST /api/v1/business-manager/applications/:id/versions
   - GET /api/v1/business-manager/applications/:id/versions
   - GET /api/v1/business-manager/applications/:id/versions/:versionId

3. **Data Model API** - Data model management
   - POST /api/v1/business-manager/data-models
   - GET /api/v1/business-manager/data-models
   - GET /api/v1/business-manager/data-models/:id
   - POST /api/v1/business-manager/data-models/:id/validate

4. **Runtime Bridge API** - Runtime configuration
   - GET /api/v1/business-manager/applications/:id/versions/:versionId/runtime/manifest
   - GET /api/v1/business-manager/applications/:id/versions/:versionId/runtime/readiness
   - POST /api/v1/business-manager/applications/:id/versions/:versionId/runtime/contracts
   - POST /api/v1/business-manager/applications/:id/versions/:versionId/runtime/snapshot

5. **Quality & Validation API** - Quality gates and validation
   - POST /api/v1/business-manager/application-versions/:versionId/quality/campaigns
   - GET /api/v1/business-manager/application-versions/:versionId/quality/campaigns
   - GET /api/v1/business-manager/quality/campaigns/:id/report
   - GET /api/v1/business-manager/application-versions/:versionId/quality/gate
   - POST /api/v1/business-manager/application-versions/:versionId/quality/waivers

6. **Feature & Capability API** - Feature and capability management
   - POST /api/v1/business-manager/features
   - POST /api/v1/business-manager/capabilities
   - GET /api/v1/business-manager/features
   - GET /api/v1/business-manager/capabilities
   - POST /api/v1/business-manager/features/:featureId/capabilities

7. **Configuration API** - Configuration values
   - POST /api/v1/business-manager/application-versions/:versionId/configuration
   - GET /api/v1/business-manager/application-versions/:versionId/configuration

8. **Menu API** - Navigation menu management
   - POST /api/v1/business-manager/application-versions/:versionId/menus
   - GET /api/v1/business-manager/application-versions/:versionId/menus

9. **Integration API** - Integration definitions and bindings
   - POST /api/v1/business-manager/integrations
   - GET /api/v1/business-manager/integrations
   - POST /api/v1/business-manager/integrations/:integrationId/bindings
   - POST /api/v1/business-manager/integrations/:integrationId/bindings/:bindingId/test

10. **Publication API** - Application publication
    - POST /api/v1/business-manager/applications/:id/versions/:versionId/publish
    - GET /api/v1/business-manager/applications/:id/publications

11. **Clone API** - Application cloning
    - POST /api/v1/business-manager/applications/:id/clone

12. **Audit API** - Activity tracking
    - GET /api/v1/business-manager/applications/:id/audit

## Running Tests with Coverage

```bash
cd Backend
npm run test:cov
```

This generates a coverage report in the `coverage/` directory.

## Test Database Setup

The E2E tests use the configured PostgreSQL database. Make sure:

1. Database exists and is empty (or migrations are run)
2. Environment variables are configured:
   ```
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_NAME=business_manager_test
   DATABASE_USER=postgres
   DATABASE_PASSWORD=your_password
   ```

## Files

- Seeder: `src/seeder.ts`
- E2E Tests: `test/api.e2e-spec.ts`
- Test Configuration: `test/jest-e2e.json`

## Notes

- Tests require the NestJS application to be running or will initialize it in-process
- Each test suite creates/modifies data and expects a clean database state
- Tests run sequentially to ensure data consistency
- User ID header is mocked for authentication: `x-user-id: 11111111-1111-4111-8111-111111111111`
