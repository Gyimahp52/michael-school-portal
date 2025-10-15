# Firebase to Neon PostgreSQL Migration Guide

## Overview

This migration tool will transfer all your Firebase Realtime Database data to a Neon PostgreSQL database. The tool creates properly structured relational tables with foreign keys and indexes for optimal performance.

## Prerequisites

1. **Node.js** installed (v16 or higher)
2. **Firebase JSON export file** (already provided: `firebase-export.json`)
3. **Neon PostgreSQL database** connection string

## Database Schema

The migration creates the following tables:

### Core Tables
- `academic_years` - Academic year periods
- `terms` - Term periods within academic years
- `teachers` - Teacher information
- `subjects` - Subject/course definitions
- `classes` - Class information with teacher assignments
- `students` - Student records with promotion history

### Financial Tables
- `school_fees` - Fee structure per class/term
- `student_balances` - Current balance status for each student
- `invoices` - Payment invoices and records
- `canteen_collections` - Canteen/feeding fee collections

### Academic Records
- `assessments` - Student grades and scores
- `attendance` - Attendance records per class/date
- `attendance_entries` - Individual student attendance entries

### Promotion System
- `promotion_requests` - Teacher-submitted promotion requests
- `promotion_decisions` - Individual student promotion decisions
- `academic_transitions` - Historical record of student promotions

## Running the Migration

### Step 1: Update Connection String (Optional)

The connection string is already configured in the script, but you can change it by setting an environment variable:

```bash
export NEON_DB_URL="your-connection-string-here"
```

Or edit the `CONNECTION_STRING` constant in `scripts/migrate-firebase-to-neon.ts`.

### Step 2: Run the Migration

```bash
# Using tsx (recommended)
npx tsx scripts/migrate-firebase-to-neon.ts

# Or compile and run
npx tsc scripts/migrate-firebase-to-neon.ts
node scripts/migrate-firebase-to-neon.js
```

## What the Script Does

1. **Connects to Neon Database** - Establishes secure SSL connection
2. **Creates Tables** - Drops existing tables (if any) and creates new schema
3. **Migrates Data** - Transfers data in order respecting foreign key constraints:
   - Academic Years
   - Terms
   - Teachers
   - Subjects
   - Classes
   - Students
   - School Fees
   - Student Balances
   - Invoices
   - Assessments
   - Attendance (with entries)
   - Canteen Collections
   - Promotion Requests (with decisions)
   - Academic Transitions

4. **Validates Records** - Tracks success/failure for each record
5. **Generates Summary** - Provides detailed migration statistics

## Expected Output

```
🚀 Starting Firebase to Neon PostgreSQL Migration...

📖 Reading Firebase JSON export...
✅ Firebase JSON loaded successfully

✅ Connected to Neon PostgreSQL database

📊 Creating database tables...
✅ All tables created successfully

📚 Migrating Academic Years...
✅ Academic Years: 3/3 migrated

📅 Migrating Terms...
✅ Terms: 3/3 migrated

... (continues for all tables)

================================================================================
📊 MIGRATION SUMMARY
================================================================================

Table                        | Attempted | Succeeded | Failed
--------------------------------------------------------------------------------
academic_years               |         3 |         3 |      0
terms                        |         3 |         3 |      0
teachers                     |         3 |         3 |      0
subjects                     |         4 |         4 |      0
classes                      |         5 |         5 |      0
students                     |         4 |         4 |      0
school_fees                  |         4 |         4 |      0
student_balances             |         3 |         3 |      0
invoices                     |         6 |         6 |      0
assessments                  |        14 |        14 |      0
attendance                   |         4 |         4 |      0
attendance_entries           |        18 |        18 |      0
canteen_collections          |         6 |         6 |      0
promotion_requests           |         1 |         1 |      0
promotion_decisions          |         2 |         2 |      0
academic_transitions         |         2 |         2 |      0
--------------------------------------------------------------------------------
TOTAL                        |        82 |        82 |      0
================================================================================

✅ All records migrated successfully!

✅ Disconnected from database

✨ Migration completed successfully!
```

## Data Integrity Features

- **Foreign Key Constraints** - Ensures referential integrity
- **Indexed Fields** - Optimized for common queries (student_id, class_name, date, etc.)
- **JSON Storage** - Preserves complex nested data (promotionHistory)
- **Array Support** - Maintains array fields (teacherIds)
- **SSL/TLS** - Secure database connection
- **Transaction Safety** - Each record insert is handled individually with error tracking

## Error Handling

The migration tool:
- Tracks every attempted insert
- Records specific error messages for failed records
- Continues migration even if individual records fail
- Provides detailed error summary at the end
- Limits error display to prevent overwhelming output

## Post-Migration Steps

After successful migration:

1. **Verify Data** - Query key tables to confirm data integrity:
   ```sql
   SELECT COUNT(*) FROM students;
   SELECT COUNT(*) FROM assessments;
   SELECT COUNT(*) FROM attendance;
   ```

2. **Check Relationships** - Verify foreign key relationships:
   ```sql
   SELECT s.first_name, s.last_name, c.class_name 
   FROM students s
   LEFT JOIN classes c ON s.class_name = c.class_name;
   ```

3. **Update Application** - Update your application to use PostgreSQL instead of Firebase

## Troubleshooting

### Connection Issues
- Verify the connection string is correct
- Ensure your IP is whitelisted in Neon console
- Check SSL/TLS settings are enabled

### Migration Failures
- Check error messages in the summary
- Common issues:
  - Invalid foreign key references
  - Data type mismatches
  - Null values in NOT NULL fields
- Re-run migration after fixing data issues

### Performance
- Migration typically takes 30-60 seconds for small databases
- Large databases (10,000+ records) may take several minutes
- Progress is logged in real-time

## Data Excluded

The following are intentionally excluded:
- Large base64 encoded files (proof_doc_url) to prevent database bloat
- Analytics data (fee-analytics, fee-breakdown) as these are computed
- School settings (stored in application config instead)

## Security Notes

- Connection string contains credentials - keep secure
- Use environment variables for production deployments
- Enable SSL mode (already configured)
- Consider using connection pooling for production applications

## Support

For issues or questions:
1. Check error messages in migration summary
2. Verify Firebase JSON structure matches expected format
3. Ensure Neon database is accessible and properly configured
