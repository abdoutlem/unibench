# Database Migration Guide

This document describes the migration from YAML-based storage to SQLite database.

## Schema Overview

The database consists of 7 main tables:

1. **metric_definitions** - Core metric definitions
2. **metric_aliases** - Source-specific metric name mappings
3. **entities** - Measurable entities (organizations, buildings, etc.)
4. **dimensions** - Dimension definitions with authorized values
5. **metric_observations** - Fact table for metric observations
6. **observation_dimensions** - Links observations to dimensions
7. **source_documents** - Document traceability

## Running Migrations

### Initial Setup

1. The database will be automatically initialized on application startup
2. To manually run migrations:

```bash
cd backend
python run_migrations.py
```

### Migration Process

The migration script will:
1. Create all database tables if they don't exist
2. Migrate glossary metrics from YAML to database
3. Migrate dimensions from YAML to database
4. Preserve all existing data

## Database Location

The SQLite database is stored at:
```
backend/data/unibench.db
```

## Using the Database

The application automatically uses the database loader if available. The system will:
- Use `GlossaryLoaderDB` for glossary operations
- Use `DataStorageDB` for fact storage
- Fall back to YAML/file-based storage if database is not available

## API Changes

No API changes are required - the same endpoints work with both storage backends.

## Schema Details

### metric_definitions
- Stores core metric information
- Includes fields: calculation_logic, data_owner, source, update_frequency, version, effective_date, is_active
- Links to metric_aliases for semantic variations

### dimensions
- Stores dimension definitions
- Includes `authorized_values` as JSON array
- Supports categorical, numerical, and boolean types

### metric_observations
- Fact table for all extracted metrics
- Indexed on (metric_id, observation_date) and (entity_id, observation_date)
- Links to observation_dimensions for flexible dimension values

### observation_dimensions
- Flexible key-value storage for observation dimensions
- Composite primary key: (observation_id, dimension_id)
