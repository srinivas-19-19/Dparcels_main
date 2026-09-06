# DParcels 2.0 Project Context

## Overview
DParcels is an advanced delivery and logistics platform. The frontend is already completed for three applications (Customer, Rider, Admin) using React/Vite. The current task is to build the unified production-quality Node.js backend.

## Current Progress
- **Phase 1 (Audit & Plan)**: Completed. We mapped out all frontend features requiring a backend, established a unified backend approach, and defined the API contract.
- **Phase 2 (Infrastructure Setup)**: Completed. Set up `d:\DPARCELS\Backend` with Express, TypeScript, Prisma, Redis, Socket.IO, Zod, and Docker Compose.
- **Phase 3 (Database Schema)**: Completed. Designed the PostgreSQL schema using Prisma, handling RBAC, live map tracking strategies (Google Maps API integration), Order State Machines, and Idempotency.

## Next Steps
- **Phase 4**: Implementing the core Authentication logic (login, register, token refresh) and foundational API services.

## Architecture Guidelines
- **Unified Backend**: One backend serves Customer, Rider, and Admin.
- **Map Provider**: Abstracted map services. Google Maps is the primary provider for Distance/ETA calculations, Places Autocomplete, and Geocoding.
- **Live Tracking**: Redis + Socket.IO for high-frequency rider locations. PostgreSQL for persistent order events.
- **Database**: PostgreSQL (Prisma). Soft deletes/status changes instead of cascading deletes for historical records (Orders, Payments).
- **Idempotency**: Critical endpoints (Order Creation, Payments) require idempotency keys.

## Current Database Schema (`schema.prisma`)
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  CUSTOMER
  RIDER
  ADMIN
}

enum AccountStatus {
  ACTIVE
  SUSPENDED
  BANNED
  DEACTIVATED
}

model User {
  id        String        @id @default(uuid())
  email     String        @unique
  password  String
  role      Role          @default(CUSTOMER)
  status    AccountStatus @default(ACTIVE)
  
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  customerProfile CustomerProfile?
  riderProfile    RiderProfile?
  refreshTokens   RefreshToken[]
  notifications   Notification[]
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  revoked   Boolean  @default(false)
  createdAt DateTime @default(now())
}

model CustomerProfile {
  id          String    @id @default(uuid())
  userId      String    @unique
  user        User      @relation(fields: [userId], references: [id], onDelete: Restrict)
  firstName   String
  lastName    String
  phone       String?
  rating      Float     @default(5.0)
  
  addresses   Address[]
  orders      Order[]
  supportTickets SupportTicket[]
}

model RiderProfile {
  id              String    @id @default(uuid())
  userId          String    @unique
  user            User      @relation(fields: [userId], references: [id], onDelete: Restrict)
  firstName       String
  lastName        String
  phone           String
  vehicleType     String
  vehicleNumber   String
  isOnline        Boolean   @default(false)
  isApproved      Boolean   @default(false)
  rating          Float     @default(5.0)
  
  assignments     RiderAssignment[]
  ordersDelivered Order[]   
}

model Address {
  id                String   @id @default(uuid())
  customerProfileId String
  customer          CustomerProfile @relation(fields: [customerProfileId], references: [id], onDelete: Cascade)
  label             String   
  streetAddress     String
  city              String
  state             String
  postalCode        String
  country           String
  latitude          Float
  longitude         Float
  providerPlaceId   String?  

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

enum OrderStatus {
  DRAFT
  PAYMENT_PENDING
  CONFIRMED
  ASSIGNING
  RIDER_ASSIGNED
  ACCEPTED
  ARRIVED_PICKUP
  PICKED_UP
  IN_TRANSIT
  OUT_FOR_DELIVERY
  DELIVERED
  CANCELLED
  FAILED
}

model Order {
  id                String   @id @default(uuid())
  idempotencyKey    String?  @unique 
  trackingId        String   @unique 
  customerProfileId String
  customer          CustomerProfile @relation(fields: [customerProfileId], references: [id], onDelete: Restrict)
  
  pickupAddress     String
  pickupLat         Float
  pickupLng         Float
  
  dropAddress       String
  dropLat           Float
  dropLng           Float
  
  distanceKm        Float    
  estimatedTimeMins Int
  serviceType       String   
  
  status            OrderStatus @default(DRAFT)
  
  basePrice         Float
  distancePrice     Float
  totalAmount       Float
  
  riderProfileId    String?
  rider             RiderProfile? @relation(fields: [riderProfileId], references: [id], onDelete: Restrict)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  events            OrderEvent[]
  payment           Payment?
  assignments       RiderAssignment[]
  couponUsages      CouponUsage[]
}

model OrderEvent {
  id             String      @id @default(uuid())
  orderId        String
  order          Order       @relation(fields: [orderId], references: [id], onDelete: Restrict)
  
  previousStatus OrderStatus?
  newStatus      OrderStatus
  
  actorId        String?     
  actorRole      String?     
  
  description    String?
  latitude       Float?      
  longitude      Float?
  metadata       Json?       
  
  createdAt      DateTime    @default(now())
}

enum AssignmentStatus {
  PENDING
  ACCEPTED
  REJECTED
  EXPIRED
}

model RiderAssignment {
  id             String   @id @default(uuid())
  orderId        String
  order          Order    @relation(fields: [orderId], references: [id], onDelete: Restrict)
  riderProfileId String
  rider          RiderProfile @relation(fields: [riderProfileId], references: [id], onDelete: Restrict)
  status         AssignmentStatus @default(PENDING)
  assignedAt     DateTime @default(now())
  respondedAt    DateTime?
}

enum PaymentStatus {
  PENDING
  PROCESSING
  PAID
  FAILED
  REFUNDED
  PARTIALLY_REFUNDED
}

model Payment {
  id            String   @id @default(uuid())
  idempotencyKey String? @unique 
  orderId       String   @unique
  order         Order    @relation(fields: [orderId], references: [id], onDelete: Restrict)
  amount        Float
  currency      String   @default("INR")
  status        PaymentStatus @default(PENDING)
  providerId    String?  
  paymentMethod String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model CouponUsage {
  id        String   @id @default(uuid())
  orderId   String
  order     Order    @relation(fields: [orderId], references: [id], onDelete: Restrict)
  couponCode String
  discount  Float
  createdAt DateTime @default(now())
}

enum TicketStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
}

model SupportTicket {
  id                String   @id @default(uuid())
  customerProfileId String
  customer          CustomerProfile @relation(fields: [customerProfileId], references: [id], onDelete: Restrict)
  subject           String
  status            TicketStatus @default(OPEN)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  messages          SupportMessage[]
}

model SupportMessage {
  id              String   @id @default(uuid())
  supportTicketId String
  ticket          SupportTicket @relation(fields: [supportTicketId], references: [id], onDelete: Restrict)
  senderId        String   
  senderRole      Role
  message         String
  createdAt       DateTime @default(now())
}

model Notification {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String
  body      String
  isRead    Boolean  @default(false)
  type      String   
  createdAt DateTime @default(now())
}
```
