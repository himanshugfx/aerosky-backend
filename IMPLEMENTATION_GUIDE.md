# 🛠️ CODE REVIEW FIXES - IMPLEMENTATION GUIDE

## Priority 1: Security Fixes (URGENT)

### Fix #1: Remove Hardcoded Secrets

**Step 1**: Create `.env.example` (safe to commit)
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/aerosys?schema=public"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with: openssl rand -hex 32"
JWT_SECRET="generate-with: openssl rand -hex 32"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="app-password-here"

# Environment
NODE_ENV="development"
NEXT_PUBLIC_API_URL="http://localhost:3000"

# IP Whitelist (use JSON array)
ALLOWED_IPS='["0.0.0.0/0"]'  # Allow all in dev, restrict in prod
```

**Step 2**: Create `src/lib/env-validator.ts`
```typescript
import { z } from 'zod';

const envSchema = z.object({
  // Required in all environments
  DATABASE_URL: z.string().url().startsWith('postgresql://'),
  NEXTAUTH_SECRET: z.string().min(32),
  JWT_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  
  // Optional with defaults
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:3000'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export const env = envSchema.parse(process.env);

export function validateEnvironment() {
  try {
    envSchema.parse(process.env);
    console.log('✅ Environment variables validated');
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    process.exit(1);
  }
}
```

**Step 3**: Add to `src/app/layout.tsx` or `pages/_app.tsx`
```typescript
import { validateEnvironment } from '@/lib/env-validator';

// Call at startup
if (typeof window === 'undefined') {
  validateEnvironment();
}
```

**Step 4**: Update `.gitignore`
```gitignore
.env
.env.local
.env.*.local
```

**Step 5**: Rotate secrets in production!
```bash
# Generate new secrets
openssl rand -hex 32  # For NEXTAUTH_SECRET
openssl rand -hex 32  # For JWT_SECRET

# Update production .env on hosting platform
# (Railway/Vercel dashboard → Settings → Environment Variables)
```

---

### Fix #2: Add Rate Limiting

**Install dependency**:
```bash
npm install @upstash/ratelimit @upstash/redis
```

**Create `src/lib/rate-limiter.ts`**:
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create Redis instance
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Different limiters for different endpoints
export const loginLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 attempts per 15 minutes
  analytics: true,
});

export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
  analytics: true,
});

export const uploadLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 uploads per hour
  analytics: true,
});
```

**Use in `/src/app/api/mobile/auth/login/route.ts`**:
```typescript
import { loginLimiter } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body;

  // Apply rate limit - use email as identifier
  const { success, remaining, retryAfter } = await loginLimiter.limit(email);
  
  if (!success) {
    return NextResponse.json(
      {
        error: 'TOO_MANY_ATTEMPTS',
        message: `Too many login attempts. Try again in ${retryAfter}s`,
        retryAfter,
      },
      { status: 429 }
    );
  }

  // Existing login logic here
  // ...
}
```

**For local development** (without Upstash):
```typescript
// src/lib/rate-limiter-local.ts
export class LocalRateLimiter {
  private attempts = new Map<string, { count: number; reset: number }>();

  async limit(identifier: string) {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (!record || record.reset < now) {
      this.attempts.set(identifier, { count: 1, reset: now + 15 * 60 * 1000 });
      return { success: true, remaining: 4, retryAfter: 0 };
    }

    if (record.count >= 5) {
      return {
        success: false,
        remaining: 0,
        retryAfter: Math.ceil((record.reset - now) / 1000),
      };
    }

    record.count++;
    return { success: true, remaining: 5 - record.count, retryAfter: 0 };
  }
}
```

---

### Fix #3: Fix CORS Configuration

**Update `next.config.js`**:
```javascript
const ALLOWED_ORIGINS = {
  development: ['http://localhost:3000', 'http://localhost:3001'],
  production: [
    'https://app.aerosysaviation.in',
    'https://mobile.aerosysaviation.in',
    'https://dashboard.aerosysaviation.in',
  ],
};

const getAllowedOrigins = () => {
  const env = process.env.NODE_ENV || 'development';
  return ALLOWED_ORIGINS[env] || ALLOWED_ORIGINS.development;
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        {
          key: 'Access-Control-Allow-Credentials',
          value: 'true',
        },
        {
          key: 'Access-Control-Allow-Methods',
          value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        },
        {
          key: 'Access-Control-Allow-Headers',
          value: 'Content-Type, Authorization',
        },
      ],
    },
  ],
  async rewrites() {
    return {
      fallback: [
        {
          source: '/api/:path*',
          destination: '/api/:path*',
        },
      ],
    };
  },
};

module.exports = nextConfig;
```

**Add CORS middleware** (`src/middleware.ts`):
```typescript
import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGINS = {
  development: ['http://localhost:3000', 'http://localhost:3001'],
  production: ['https://app.aerosysaviation.in', 'https://mobile.aerosysaviation.in'],
};

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  const env = process.env.NODE_ENV || 'development';
  const allowedOrigins = ALLOWED_ORIGINS[env as keyof typeof ALLOWED_ORIGINS] || [];

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    if (allowedOrigins.includes(origin || '')) {
      return new NextResponse(null, {
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
    return new NextResponse(null, { status: 403 });
  }

  // Existing middleware logic
  // ...

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
```

---

### Fix #4: Add Input Validation to All Endpoints

**Create reusable schema library** (`src/lib/schemas.ts`):
```typescript
import { z } from 'zod';

// Common types
export const idSchema = z.string().uuid();
export const emailSchema = z.string().email();
export const urlSchema = z.string().url();
export const dateSchema = z.string().datetime();
export const positiveIntSchema = z.number().int().positive();

// Resources
export const createTeamMemberSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  accessId: z.string().min(1).max(50),
  position: z.string().max(100),
  phone: z.string().max(20),
  role: z.enum(['ADMIN', 'USER', 'MANUFACTURING', 'DESIGN', 'SALES']),
});

export const createDroneSchema = z.object({
  modelName: z.string().min(1).max(100),
  serialNumber: z.string().min(1),
  purchaseDate: z.string().datetime().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']).default('ACTIVE'),
});

export const createComponentSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
  quantity: z.number().int().min(0),
  unitPrice: z.number().min(0).optional(),
});

// Utility function to validate and return error
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { data: T; error?: null } | { data?: null; error: { fields: Record<string, string[]> } } {
  try {
    const validated = schema.parse(data);
    return { data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: {
          fields: error.flatten().fieldErrors as Record<string, string[]>,
        },
      };
    }
    throw error;
  }
}
```

**Update endpoints** (example: `/api/team/route.ts`):
```typescript
import { createTeamMemberSchema, validateRequest } from '@/lib/schemas';

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth) return res.unauthorized();

  try {
    const body = await request.json();
    
    // Validate input
    const validation = validateRequest(createTeamMemberSchema, body);
    if (validation.error) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          fields: validation.error.fields,
        },
        { status: 400 }
      );
    }

    const { data: validated } = validation;

    // Create team member
    const teamMember = await prisma.teamMember.create({
      data: {
        ...validated,
        organizationId: auth.user.organizationId,
      },
    });

    return NextResponse.json({
      success: true,
      data: teamMember,
    });
  } catch (error) {
    logger.error('Failed to create team member', { error, userId: auth.user.id });
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Failed to create team member',
      },
      { status: 500 }
    );
  }
}
```

---

### Fix #5: Unified Error Handling

**Create error handler** (`src/lib/error-handler.ts`):
```typescript
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

export class ApiError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }

  toJSON() {
    return {
      error: this.code,
      message: this.message,
      ...(this.details && { details: this.details }),
    };
  }
}

export const errors = {
  unauthorized: () =>
    new ApiError('UNAUTHORIZED', 401, 'Unauthorized access'),
  forbidden: (reason?: string) =>
    new ApiError('FORBIDDEN', 403, `Forbidden: ${reason || 'Access denied'}`),
  notFound: (resource?: string) =>
    new ApiError('NOT_FOUND', 404, `${resource || 'Resource'} not found`),
  conflict: (message: string) =>
    new ApiError('CONFLICT', 409, message),
  validationError: (details: Record<string, unknown>) =>
    new ApiError('VALIDATION_ERROR', 400, 'Validation failed', details),
  internalError: (message?: string) =>
    new ApiError('INTERNAL_ERROR', 500, message || 'Internal server error'),
};

export function handleError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(error.toJSON(), { status: error.statusCode });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        {
          error: 'DUPLICATE_ENTRY',
          message: `Duplicate entry: ${error.meta?.target || 'unknown field'}`,
        },
        { status: 409 }
      );
    }
    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          error: 'NOT_FOUND',
          message: 'Record not found',
        },
        { status: 404 }
      );
    }
  }

  // Log unexpected errors
  console.error('Unhandled error:', error);

  return NextResponse.json(
    {
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
    { status: 500 }
  );
}
```

**Usage in endpoints**:
```typescript
import { errors, handleError } from '@/lib/error-handler';

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) throw errors.unauthorized();

    if (auth.user.role === 'VIEWER') {
      throw errors.forbidden('Viewers cannot create resources');
    }

    // ...rest of logic

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleError(error);
  }
}
```

---

## Priority 2: Architecture Improvements

### Fix #6: Unify Authentication

**Create unified auth service** (`src/lib/auth-service.ts`):
```typescript
import { User, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export interface AuthenticatedUser {
  id: string;
  username: string;
  email?: string;
  role: Role;
  organizationId?: string;
}

export class AuthService {
  // Authenticate with credentials
  async authenticateWithCredentials(
    username: string,
    password: string
  ): Promise<AuthenticatedUser | null> {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { organization: { select: { id: true } } },
    });

    if (!user) return null;

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) return null;

    return {
      id: user.id,
      username: user.username,
      email: user.email || undefined,
      role: user.role,
      organizationId: user.organizationId || undefined,
    };
  }

  // Authenticate with token (JWT or session)
  async authenticateWithToken(
    token: string,
    isJwt: boolean = false
  ): Promise<AuthenticatedUser | null> {
    if (isJwt) {
      return this.verifyJwt(token);
    } else {
      return this.verifySessionToken(token);
    }
  }

  // JWT helpers
  private async verifyJwt(token: string): Promise<AuthenticatedUser | null> {
    try {
      const decoded = verifyJWT(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          organizationId: true,
        },
      });
      return user || null;
    } catch (error) {
      return null;
    }
  }

  private async verifySessionToken(token: string): Promise<AuthenticatedUser | null> {
    // Implementation for session verification
    // Could use NextAuth session verification
    return null;
  }

  // Hash password
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  // Generate JWT token
  generateJwt(user: AuthenticatedUser): string {
    return signJWT({
      id: user.id,
      username: user.username,
      role: user.role,
      organizationId: user.organizationId,
    });
  }
}

export const authService = new AuthService();
```

**Use in both web and mobile**:
```typescript
// src/app/api/mobile/auth/login/route.ts
import { authService } from '@/lib/auth-service';

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  const user = await authService.authenticateWithCredentials(username, password);
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = authService.generateJwt(user);
  return NextResponse.json({ token, user });
}
```

---

### Fix #7: Extract Service Layer

**Create service for orders** (`src/services/orderService.ts`):
```typescript
import { prisma } from '@/lib/prisma';
import PDFDocument from 'pdfkit';
import { AuthenticatedUser } from '@/lib/auth-service';

export class OrderService {
  async getOrderById(
    id: string,
    user: AuthenticatedUser
  ) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) return null;

    // Check authorization
    if (
      user.role !== 'ADMIN' &&
      user.organizationId &&
      order.organizationId !== user.organizationId
    ) {
      throw new Error('Unauthorized');
    }

    return order;
  }

  async generateOrderPDF(order: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Generate PDF content
      doc.fontSize(25).text('Order #' + order.contractNumber, 100, 100);
      doc.fontSize(12).text(`Client: ${order.clientName}`);
      doc.text(`Value: ${order.contractValue}`);
      // ... add more content

      doc.end();
    });
  }

  async validateOrder(order: any): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    if (!order.contractNumber) errors.push({ field: 'contractNumber', message: 'Missing' });
    if (!order.clientName) errors.push({ field: 'clientName', message: 'Missing' });
    if (order.contractValue <= 0) errors.push({ field: 'contractValue', message: 'Must be positive' });

    return errors;
  }
}
```

**Refactored endpoint** (`src/app/api/orders/download/route.ts`):
```typescript
import { OrderService } from '@/services/orderService';
import { authenticateRequest } from '@/lib/api-auth';

const orderService = new OrderService();

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) throw errors.unauthorized();

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) throw errors.validationError({ orderId: ['Required'] });

    const order = await orderService.getOrderById(orderId, auth.user);
    if (!order) throw errors.notFound('Order');

    const validationErrors = await orderService.validateOrder(order);
    if (validationErrors.length > 0) {
      throw errors.validationError(
        Object.fromEntries(validationErrors.map(e => [e.field, [e.message]]))
      );
    }

    const pdf = await orderService.generateOrderPDF(order);

    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="order-${orderId}.pdf"`,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
```

---

### Fix #8: Add Pagination to List Endpoints

**Create pagination utilities** (`src/lib/pagination.ts`):
```typescript
import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1)).default('1'),
  limit: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(1).max(100))
    .default('20'),
});

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
  };
}

export function getPaginationParams(searchParams: URLSearchParams): PaginationParams {
  const validated = paginationSchema.parse({
    page: searchParams.get('page') || '1',
    limit: searchParams.get('limit') || '20',
  });
  return {
    page: validated.page,
    limit: validated.limit,
  };
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      pages: Math.ceil(total / params.limit),
      hasNext: params.page < Math.ceil(total / params.limit),
    },
  };
}
```

**Update endpoint** (`src/app/api/components/route.ts`):
```typescript
import { getPaginationParams, createPaginatedResponse } from '@/lib/pagination';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) throw errors.unauthorized();

    const { searchParams } = new URL(request.url);
    const { page, limit } = getPaginationParams(searchParams);

    const where = {
      organizationId: auth.user.organizationId,
    };

    const [items, total] = await Promise.all([
      prisma.component.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          quantity: true,
          unitPrice: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.component.count({ where }),
    ]);

    const response = createPaginatedResponse(items, total, { page, limit });
    return NextResponse.json(response);
  } catch (error) {
    return handleError(error);
  }
}
```

---

## Priority 3: Database Optimization

### Fix #9: Add Database Indexes

**Update `prisma/schema.prisma`**:
```prisma
model User {
  id                String    @id @default(cuid())
  username          String    @unique
  email             String?   @unique
  passwordHash      String
  role              Role      @default(USER)
  organizationId    String?
  organization      Organization? @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([username])
  @@index([email])
  @@index([organizationId])
  @@index([createdAt])
}

model Component {
  id                String    @id @default(cuid())
  name              String
  organizationId    String?
  organization      Organization? @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  quantity          Int       @default(0)
  unitPrice         Float?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([organizationId])
  @@index([name])
  @@index([createdAt])
}

model Order {
  id                String    @id @default(cuid())
  contractNumber    String    @unique
  organizationId    String?
  organization      Organization? @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  status            String    @default("PENDING")
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([organizationId])
  @@index([status])
  @@index([createdAt])
  @@index([organizationId, status, createdAt])
}
```

**Deploy migration**:
```bash
npx prisma migrate dev --name "add-indexes"
npx prisma generate
```

---

## Deployment & Verification

### Production Checklist

- [ ] Remove all hardcoded secrets
- [ ] Enable HTTPS only (set NEXTAUTH_URL to https)
- [ ] Set restrictive CORS origins
- [ ] Enable database SSL
- [ ] Configure rate limiting in production
- [ ] Set up error tracking (Sentry)
- [ ] Enable request logging
- [ ] Configure backups
- [ ] Set up monitoring/alerts
- [ ] Test authentication endpoints
- [ ] Load test APIs
- [ ] Security audit before launch

---

**Updated**: April 7, 2026  
**Reviewed by**: Code Review Agent  
