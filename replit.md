# Bot Lane Prio

## Overview

Bot Lane Prio is a League of Legends synergy and matchup analysis tool that helps players dominate bot lane. The application calculates compatibility scores using real LoLalytics Delta 2 data to recommend optimal ADC and Support picks based on ally synergy, enemy matchups, and team composition threats.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **Styling**: Tailwind CSS v4 with custom Hextech gaming theme (dark blue/gold color scheme)
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Animations**: Framer Motion for smooth transitions and interactions
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **API Design**: RESTful endpoints under `/api/` prefix
- **Development**: Hot module replacement via Vite middleware in development
- **Production**: Static file serving from built `dist/public` directory

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Validation**: Zod with drizzle-zod integration
- **Current Storage**: In-memory storage (`MemStorage` class) for drafts and users
- **Database Ready**: Schema defined in `shared/schema.ts` with PostgreSQL tables for users and drafts

### Key Design Patterns
- **Shared Types**: Common TypeScript types and Zod schemas in `shared/` directory used by both client and server
- **Path Aliases**: `@/` for client source, `@shared/` for shared code, `@assets/` for attached assets
- **Champion Data**: Static champion data including synergies, counters, and tier rankings stored in `lib/champions.ts`
- **Scoring Algorithm**: Match percentage calculated based on support synergy, enemy ADC counters, enemy support counters, and threat type compatibility

## External Dependencies

### Database
- **PostgreSQL**: Primary database (requires `DATABASE_URL` environment variable)
- **Drizzle Kit**: Database migrations stored in `./migrations` directory

### UI Libraries
- **Radix UI**: Comprehensive set of accessible UI primitives (dialog, dropdown, select, tabs, etc.)
- **Lucide React**: Icon library
- **Embla Carousel**: Carousel component
- **cmdk**: Command palette component

### Data Fetching
- **TanStack Query**: Server state management with automatic caching and refetching

### External APIs
- **League of Legends Data Dragon**: Champion splash art images loaded from `ddragon.leagueoflegends.com`

### Fonts
- **Google Fonts**: Cinzel (headings), Rajdhani (UI), Inter (body text)
