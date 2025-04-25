# IKAZESTORES - Multi-Tenant SaaS Platform

A Next.js 14 powered SaaS platform enabling physical and virtual store management with integrated e-commerce capabilities.

## Key Features

### Role-Based Access Control
- **Super Admin**: Full system control, user management, and platform analytics
- **Business Owner**: 
  - Create/manage physical store profiles
  - Add/update physical inventory items
  - Set base prices and product availability
- **Virtual Store Owner**:
  - Create custom virtual storefronts
  - Curate products from multiple physical stores
  - Set custom markup prices and promotions
  - Manage virtual store design and layout
- **Buyer**:
  - Browse virtual stores
  - Purchase products across multiple vendors
  - Order tracking and history

## Technology Stack
- **Framework**: Next.js 14 (App Router)
- **Backend**: Appwrite (Authentication, Database, Storage)
- **Styling**: Tailwind CSS + Shadcn/ui components
- **Form Handling**: React Hook Form + Zod validation
- **State Management**: Zustand
- **Internationalization**: next-intl
- **Testing**: Jest + React Testing Library

## Getting Started

### Prerequisites
- Node.js 18+
- Appwrite instance (local or cloud)
- Google Cloud account (for OAuth)

### Environment Setup
1. Clone repository:
   ```bash
   git clone https://github.com/Arsenethierry/ikazestores.git
