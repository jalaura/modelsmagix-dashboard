# Models Magix Dashboard

Full-stack customer dashboard for Models Magix - AI-powered product photography platform. Built with Next.js 14, Prisma, Cloudflare Pages.

## 🚀 Tech Stack

- **Framework**: Next.js 15.1.0 (App Router)
- **Database**: PostgreSQL (Neon Serverless)
- **ORM**: Prisma
- **Authentication**: NextAuth.js v5 (magic link)
- **Styling**: Tailwind CSS + shadcn/ui
- **Storage**: AWS S3 (Cloudflare R2)
- **Email**: Resend
- **Deployment**: Cloudflare Pages

## 📋 Prerequisites

- Node.js 18+ and npm
- Neon PostgreSQL database account
- Cloudflare account (Pages + R2)
- Resend API key
- AWS S3 credentials (or Cloudflare R2)

## 🛠️ Setup Instructions

### 1. Clone and Install

```bash
git clone https://github.com/jalaura/modelsmagix-dashboard.git
cd modelsmagix-dashboard
npm install
```

### 2. Environment Variables

Create `.env` file in the root:

```env
# Database
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# Auth
AUTH_SECRET="your-secret-key-here"
AUTH_URL="http://localhost:3000"

# Resend
RESEND_API_KEY="re_xxxxx"
FROM_EMAIL="noreply@yourdomain.com"

# AWS S3 / R2
AWS_REGION="auto"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
S3_BUCKET_NAME="your-bucket-name"
S3_ENDPOINT="https://xxx.r2.cloudflarestorage.com"
```

### 3. Database Setup

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Open Prisma Studio
npm run db:studio
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
modelsmagix-dashboard/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── (auth)/       # Auth routes (login)
│   │   ├── (dashboard)/  # Protected dashboard routes
│   │   ├── api/          # API routes
│   │   └── layout.tsx    # Root layout
│   ├── components/       # React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── auth/         # Auth components
│   │   └── dashboard/    # Dashboard components
│   ├── lib/              # Utilities
│   │   ├── db.ts         # Prisma client
│   │   ├── auth.ts       # Auth config
│   │   ├── s3.ts         # S3 client
│   │   └── email.ts      # Email utilities
│   └── types/            # TypeScript types
├── prisma/
│   └── schema.prisma     # Database schema
├── public/               # Static assets
└── package.json
```

## 🔑 Key Features

- **Magic Link Authentication** - Passwordless email login
- **Project Management** - Create and track photography projects
- **Image Upload** - Direct upload to S3/R2 with presigned URLs
- **Status Tracking** - Track project and image processing status
- **Responsive Design** - Mobile-friendly dashboard

## 📝 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma Client
npm run db:push      # Push schema changes to DB
npm run db:studio    # Open Prisma Studio
```

## 🚢 Deployment

### Cloudflare Pages

1. Connect GitHub repo to Cloudflare Pages
2. Build settings:
   - **Build command**: `npm run build`
   - **Build output**: `.next`
   - **Framework preset**: Next.js
3. Add environment variables in Cloudflare dashboard
4. Deploy!

### Environment Variables (Production)

Set these in Cloudflare Pages dashboard:
- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_URL`
- `RESEND_API_KEY`
- `FROM_EMAIL`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `S3_BUCKET_NAME`
- `S3_ENDPOINT`

## 📚 Database Schema

See `prisma/schema.prisma` for complete schema.

**Models:**
- `User` - User accounts
- `Account` - OAuth accounts (for NextAuth)
- `Session` - User sessions
- `VerificationToken` - Magic link tokens
- `Project` - Photography projects
- `Image` - Uploaded images

## 🔐 Authentication Flow

1. User enters email
2. Magic link sent via Resend
3. User clicks link
4. Session created
5. Redirect to dashboard

## 📦 Next Steps

After initial setup, you need to create:

1. **Configuration files:**
   - `tsconfig.json`
   - `next.config.js` 
   - `tailwind.config.ts`
   - `postcss.config.js`
   - `.env.example`

2. **Source files:**
   - Create `src/` directory structure
   - Add authentication setup
   - Build UI components
   - Implement API routes

3. **Cloudflare setup:**
   - Create R2 bucket
   - Configure CORS
   - Set up wrangler

Refer to the architecture document for detailed implementation guidance.

## 📄 License

Private - All Rights Reserved

## 🤝 Support

For issues or questions, contact: [your-email]
