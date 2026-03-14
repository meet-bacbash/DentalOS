# DentalOS Folder Structure

```
.
├── start_project.sh
├── docker-compose.yml
├── README.md
├── ARCHITECTURE.md
├── supabase/
│   └── schema.sql
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── .env.example
    ├── next.config.ts
    ├── postcss.config.js
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── scripts/
    │   ├── init-db.mjs
    │   └── seed-demo.mjs
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── globals.css
        │   ├── page.tsx
        │   ├── login/page.tsx
        │   ├── patients/page.tsx
        │   ├── appointments/page.tsx
        │   ├── ehr/page.tsx
        │   ├── billing/page.tsx
        │   └── api/
        │       ├── auth/me/route.ts
        │       ├── patients/route.ts
        │       ├── appointments/route.ts
        │       ├── billing/payments/route.ts
        │       ├── dashboard/kpis/route.ts
        │       ├── clinical/treatment-plan/route.ts
        │       └── ai/recommend/route.ts
        ├── components/
        │   ├── AuthGuard.tsx
        │   ├── Card.tsx
        │   ├── KPI.tsx
        │   └── ui/
        │       ├── button.tsx
        │       ├── card.tsx
        │       ├── input.tsx
        │       └── textarea.tsx
        ├── layouts/
        │   └── AppLayout.tsx
        ├── hooks/
        │   └── useVoiceNotes.ts
        └── lib/
            ├── api.ts
            ├── supabase.ts
            ├── utils.ts
            └── server/
                ├── auth.ts
                └── supabaseAdmin.ts
```
