/**
 * Data Transformer
 * 
 * Handles bidirectional transformation between Firebase and IndexedDB formats.
 * Preserves data integrity and handles Firebase-specific types.
 */

// ===== TYPE DEFINITIONS =====

export interface FirebaseTimestamp {
  seconds: number;
  nanoseconds: number;
}

export interface TransformOptions {
  preserveNull?: boolean;
  validateSchema?: boolean;
  strictMode?: boolean;
}

// ===== FIREBASE TO INDEXEDDB TRANSFORMATION =====

/**
 * Transform Firebase data to IndexedDB format
 */
export function transformFromFirebase<T extends Record<string, any>>(
  data: any,
  options: TransformOptions = {}
): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => transformFromFirebase(item, options)) as any;
  }

  if (typeof data !== 'object') {
    return data;
  }

  const transformed: any = {};

  for (const [key, value] of Object.entries(data)) {
    // Handle Firebase Timestamps
    if (isFirebaseTimestamp(value)) {
      transformed[key] = firebaseTimestampToMillis(value);
      continue;
    }

    // Handle Firebase References (store as string IDs)
    if (isFirebaseReference(value)) {
      transformed[key] = extractReferenceId(value);
      continue;
    }

    // Handle nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      transformed[key] = transformFromFirebase(value, options);
      continue;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      transformed[key] = value.map(item => 
        typeof item === 'object' ? transformFromFirebase(item, options) : item
      );
      continue;
    }

    // Handle null vs undefined
    if (value === null && options.preserveNull) {
      transformed[key] = null;
    } else if (value !== undefined) {
      transformed[key] = value;
    }
  }

  return transformed as T;
}

/**
 * Transform IndexedDB data to Firebase format
 */
export function transformToFirebase<T extends Record<string, any>>(
  data: any,
  options: TransformOptions = {}
): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => transformToFirebase(item, options)) as any;
  }

  if (typeof data !== 'object') {
    return data;
  }

  const transformed: any = {};

  for (const [key, value] of Object.entries(data)) {
    // Skip sync metadata fields
    if (isSyncMetadataField(key)) {
      continue;
    }

    // Handle timestamp fields (convert milliseconds to ISO string)
    if (isTimestampField(key) && typeof value === 'number') {
      transformed[key] = new Date(value).toISOString();
      continue;
    }

    // Handle nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      transformed[key] = transformToFirebase(value, options);
      continue;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      transformed[key] = value.map(item =>
        typeof item === 'object' ? transformToFirebase(item, options) : item
      );
      continue;
    }

    // Handle null vs undefined
    if (value === null && options.preserveNull) {
      transformed[key] = null;
    } else if (value !== undefined) {
      transformed[key] = value;
    }
  }

  return transformed as T;
}

// ===== HELPER FUNCTIONS =====

/**
 * Check if value is a Firebase Timestamp
 */
function isFirebaseTimestamp(value: any): value is FirebaseTimestamp {
  return (
    value &&
    typeof value === 'object' &&
    'seconds' in value &&
    'nanoseconds' in value
  );
}

/**
 * Convert Firebase Timestamp to milliseconds
 */
function firebaseTimestampToMillis(timestamp: FirebaseTimestamp): number {
  return timestamp.seconds * 1000 + Math.floor(timestamp.nanoseconds / 1000000);
}

/**
 * Check if value is a Firebase Reference
 */
function isFirebaseReference(value: any): boolean {
  return (
    value &&
    typeof value === 'object' &&
    ('_path' in value || 'path' in value || '_key' in value)
  );
}

/**
 * Extract ID from Firebase Reference
 */
function extractReferenceId(reference: any): string {
  if (reference._key) return reference._key;
  if (reference.key) return reference.key;
  if (reference._path) {
    const segments = reference._path.segments || reference._path;
    return segments[segments.length - 1];
  }
  if (reference.path) {
    const segments = reference.path.split('/');
    return segments[segments.length - 1];
  }
  return '';
}

/**
 * Check if field is sync metadata
 */
function isSyncMetadataField(fieldName: string): boolean {
  return ['syncStatus', 'localUpdatedAt', 'lastSyncedAt'].includes(fieldName);
}

/**
 * Check if field is a timestamp field
 */
function isTimestampField(fieldName: string): boolean {
  const timestampFields = [
    'createdAt',
    'updatedAt',
    'enrollmentDate',
    'dateOfJoining',
    'dateOfBirth',
    'appliedDate',
    'date',
    'dueDate',
    'paymentDate',
    'lastPaymentDate',
    'uploadDate',
    'submittedAt',
    'reviewedAt',
    'lastGenerated',
    'lastUpdated',
    'promotionDate',
  ];
  return timestampFields.includes(fieldName);
}

// ===== SCHEMA VALIDATION =====

export interface SchemaField {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'timestamp';
  required?: boolean;
  arrayItemType?: string;
  nested?: Record<string, SchemaField>;
}

export interface Schema {
  [fieldName: string]: SchemaField;
}

/**
 * Validate data against schema
 */
export function validateSchema(
  data: any,
  schema: Schema,
  path: string = ''
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required fields
  for (const [fieldName, fieldSchema] of Object.entries(schema)) {
    const fieldPath = path ? `${path}.${fieldName}` : fieldName;
    const value = data[fieldName];

    // Check if required field is missing
    if (fieldSchema.required && (value === undefined || value === null)) {
      errors.push(`Required field missing: ${fieldPath}`);
      continue;
    }

    // Skip validation if field is not present and not required
    if (value === undefined || value === null) {
      continue;
    }

    // Validate type
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    const expectedType = fieldSchema.type;

    if (expectedType === 'timestamp') {
      if (typeof value !== 'string' && typeof value !== 'number') {
        errors.push(`Invalid timestamp type at ${fieldPath}: expected string or number, got ${actualType}`);
      }
    } else if (expectedType === 'array') {
      if (!Array.isArray(value)) {
        errors.push(`Invalid type at ${fieldPath}: expected array, got ${actualType}`);
      } else if (fieldSchema.arrayItemType) {
        value.forEach((item, index) => {
          const itemType = typeof item;
          if (itemType !== fieldSchema.arrayItemType) {
            errors.push(`Invalid array item type at ${fieldPath}[${index}]: expected ${fieldSchema.arrayItemType}, got ${itemType}`);
          }
        });
      }
    } else if (expectedType === 'object') {
      if (typeof value !== 'object' || Array.isArray(value)) {
        errors.push(`Invalid type at ${fieldPath}: expected object, got ${actualType}`);
      } else if (fieldSchema.nested) {
        const nestedValidation = validateSchema(value, fieldSchema.nested, fieldPath);
        errors.push(...nestedValidation.errors);
      }
    } else {
      if (actualType !== expectedType) {
        errors.push(`Invalid type at ${fieldPath}: expected ${expectedType}, got ${actualType}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ===== COLLECTION SCHEMAS =====

export const STUDENT_SCHEMA: Schema = {
  id: { type: 'string', required: true },
  firstName: { type: 'string', required: true },
  lastName: { type: 'string', required: true },
  email: { type: 'string', required: true },
  phone: { type: 'string', required: true },
  dateOfBirth: { type: 'string', required: true },
  className: { type: 'string', required: true },
  parentName: { type: 'string', required: true },
  parentPhone: { type: 'string', required: true },
  parentWhatsApp: { type: 'string', required: true },
  parentEmail: { type: 'string', required: true },
  address: { type: 'string', required: true },
  enrollmentDate: { type: 'string', required: true },
  status: { type: 'string', required: true },
  studentCode: { type: 'string' },
  previousClass: { type: 'string' },
  academicYear: { type: 'string' },
  termId: { type: 'string' },
  photoUrl: { type: 'string' },
  createdAt: { type: 'timestamp', required: true },
  updatedAt: { type: 'timestamp', required: true },
};

export const ATTENDANCE_SCHEMA: Schema = {
  id: { type: 'string', required: true },
  classId: { type: 'string', required: true },
  teacherId: { type: 'string', required: true },
  date: { type: 'string', required: true },
  entries: {
    type: 'array',
    required: true,
    arrayItemType: 'object',
  },
  createdAt: { type: 'timestamp', required: true },
  updatedAt: { type: 'timestamp', required: true },
};

export const ASSESSMENT_SCHEMA: Schema = {
  id: { type: 'string', required: true },
  studentId: { type: 'string', required: true },
  studentName: { type: 'string', required: true },
  classId: { type: 'string', required: true },
  subjectId: { type: 'string', required: true },
  teacherId: { type: 'string', required: true },
  assessmentType: { type: 'string', required: true },
  score: { type: 'number', required: true },
  maxScore: { type: 'number', required: true },
  date: { type: 'string', required: true },
  termId: { type: 'string' },
  academicYearId: { type: 'string' },
  createdAt: { type: 'timestamp', required: true },
  updatedAt: { type: 'timestamp', required: true },
};

export const STUDENT_BALANCE_SCHEMA: Schema = {
  id: { type: 'string', required: true },
  studentId: { type: 'string', required: true },
  studentName: { type: 'string', required: true },
  className: { type: 'string', required: true },
  totalFees: { type: 'number', required: true },
  amountPaid: { type: 'number', required: true },
  balance: { type: 'number', required: true },
  status: { type: 'string', required: true },
  termId: { type: 'string' },
  academicYearId: { type: 'string' },
  createdAt: { type: 'timestamp', required: true },
  updatedAt: { type: 'timestamp', required: true },
};

/**
 * Get schema for collection
 */
export function getSchemaForCollection(collectionName: string): Schema | null {
  const schemas: Record<string, Schema> = {
    students: STUDENT_SCHEMA,
    attendance: ATTENDANCE_SCHEMA,
    assessments: ASSESSMENT_SCHEMA,
    studentBalances: STUDENT_BALANCE_SCHEMA,
  };

  return schemas[collectionName] || null;
}

/**
 * Validate data for specific collection
 */
export function validateCollectionData(
  collectionName: string,
  data: any
): { valid: boolean; errors: string[] } {
  const schema = getSchemaForCollection(collectionName);
  
  if (!schema) {
    return { valid: true, errors: [] }; // No schema defined, skip validation
  }

  return validateSchema(data, schema);
}

// ===== BATCH TRANSFORMATION =====

/**
 * Transform multiple items from Firebase to IndexedDB
 */
export function batchTransformFromFirebase<T>(
  items: any[],
  options?: TransformOptions
): T[] {
  return items.map(item => transformFromFirebase<T>(item, options));
}

/**
 * Transform multiple items from IndexedDB to Firebase
 */
export function batchTransformToFirebase<T>(
  items: any[],
  options?: TransformOptions
): T[] {
  return items.map(item => transformToFirebase<T>(item, options));
}
