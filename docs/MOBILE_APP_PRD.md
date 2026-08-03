# 📱 Product Requirement Document (PRD)
## Whisk Bakery — Cross-Platform Mobile Application (Flutter & Swift)

---

## 1. Executive Summary & Context

This Product Requirement Document (PRD) details the complete architectural and functional specifications for building the **Whisk Bakery Mobile Application**.

The mobile application will complement the existing **Whisk Bakery Web Platform**, leveraging the existing backend API, Supabase database, authentication flows, and invoice generation infrastructure, while providing an enriched mobile-native experience powered by **Flutter** (for cross-platform iOS & Android logic) and **Swift** (for iOS-native hardware and framework integrations).

---

## 2. Existing System & Architecture Context

The mobile app will directly integrate with the current Whisk Bakery ecosystem:

| Component | Current Technology & Setup |
| :--- | :--- |
| **Frontend Web** | React 19, Vite, Tailwind CSS v4, Zustand, Framer Motion, Three.js / React Three Fiber, Recharts |
| **Backend API** | Node.js Express REST API (`server.js`, `routes/products.js`, `routes/invoices.js`) |
| **Database & Storage**| **Supabase** (PostgreSQL Database, Auth, File Storage) + **MongoDB** (Mongoose) |
| **Authentication**| JWT Token Authentication + Supabase Auth |
| **Transactional Email**| **Resend** (Invoice emails & order confirmations) |

---

## 3. Mobile Technology Stack & Architecture

```
                       +-------------------------------------------------------+
                       |               Flutter UI / App Engine                 |
                       |  (Dart - UI Screens, Riverpod/Bloc, REST Client)      |
                       +---------------------------+---------------------------+
                                                   |
                              +--------------------+--------------------+
                              | MethodChannel / Platform Channels      |
                              +--------------------+--------------------+
                                                   |
                       +---------------------------v---------------------------+
                       |             Native Swift Modules (iOS)                |
                       |  - RealityKit / ARKit (3D AR Cake Preview)             |
                       |  - ActivityKit (Live Activities & Dynamic Island)     |
                       |  - PassKit (Apple Pay Native Sheet)                   |
                       |  - WidgetKit (iOS Home Screen Order Widget)           |
                       |  - CoreHaptics (Custom Haptics Engine)                |
                       +-------------------------------------------------------+
```

### 3.1 Cross-Platform Core: Flutter (Dart)
* **Framework:** Flutter 3.x / Dart 3.x
* **State Management:** `flutter_riverpod` or `flutter_bloc`
* **Router & Deep Linking:** `go_router` (enables push notification deep links directly to order tracking)
* **API Client:** `dio` (with auto-retry and JWT auth header interceptors)
* **3D Viewer:** `flutter_3d_controller` / `model_viewer_plus`
* **Secure Storage:** `flutter_secure_storage` (iOS Keychain / Android Keystore)
* **Offline Caching:** `hive` / `isar`

### 3.2 Native iOS Module: Swift Frameworks
* **Language:** Swift 5.10+
* **AR Cake Preview:** `ARKit` & `RealityKit` via Swift MethodChannel (`com.whiskbakery.app/ar_preview`)
* **Dynamic Island & Lock Screen:** `ActivityKit` via Swift MethodChannel (`com.whiskbakery.app/live_activity`)
* **Native Mobile Payments:** `PassKit` (Apple Pay) via Swift MethodChannel (`com.whiskbakery.app/apple_pay`)
* **Home Screen Widgets:** `WidgetKit`
* **Tactile Haptics:** `CoreHaptics`

---

## 4. User Personas

1. **Gourmet Customer:** Browses products, customizes 3D celebration cakes, previews cakes in AR on their dining table, pays via Apple Pay / Google Pay, tracks delivery on Lock Screen / Dynamic Island.
2. **Bakery Admin / Staff:** Manages order statuses (Baking, Decorating, Out for Delivery), views daily revenue analytics, updates product catalog.

---

## 5. Mobile Feature Breakdown & Requirements

### 5.1 Authentication & Security
- **Biometric Auth:** Face ID & Touch ID integration using `local_auth`.
- **Social Login:** Apple Sign-In (Native Swift/Flutter) and Google Auth.
- **Session Management:** Secure token storage with auto-refresh mechanism via Dio interceptor.

### 5.2 Interactive Catalog & Voice Search
- **Menu Display:** Category tabs (Cakes, Pastries, Custom, Seasonal), badges for stock status.
- **Voice Search:** Integrated speech recognition (Flutter `speech_to_text` + iOS Speech Framework) allowing users to search via spoken queries.

### 5.3 3D Cake Builder & AR Room Preview
- **Custom 3D Builder:** Real-time selection of cake tiers, frosting textures, toppers, and custom text icing.
- **Native Swift AR Preview (iOS):** Tapping "View in My Space" launches a native Swift `ARQuickLook` / `RealityKit` viewport placing the customized 3D cake model on a real surface at 1:1 physical scale.

### 5.4 Shopping Cart & Native Checkout
- **Cart Sync:** Local cart with cloud syncing.
- **Native Apple Pay:** Swift `PassKit` native payment sheet invocation for instant one-touch checkout.
- **PDF Invoice Generation:** PDF invoice creation matching web `invoiceService.js`, with instant download and system share sheet support.

### 5.5 Live Order Tracking & Dynamic Island
- **Pipeline Tracker:** Real-time updates: `Order Placed` ➔ `In the Oven` ➔ `Decorating` ➔ `Out for Delivery` ➔ `Delivered`.
- **Dynamic Island & Lock Screen (Swift ActivityKit):** Real-time status badge and delivery countdown visible outside the app.

---

## 6. API Endpoint Mapping

The mobile app connects to the existing Node.js REST backend:

| Feature | HTTP Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Login** | `POST` | `/api/auth/login` | Authenticates user & returns JWT |
| **Signup** | `POST` | `/api/auth/signup` | Registers new customer account |
| **Catalog** | `GET` | `/api/products` | Fetches list of products & 3D asset URLs |
| **Create Order** | `POST` | `/api/orders` | Submits new order & customized cake spec |
| **Order Status** | `GET` / Realtime | `/api/orders/:id/status` | Real-time status update for Live Activity |
| **Invoices** | `GET` | `/api/invoices/:orderId` | Retrieves PDF invoice data |

---

## 7. Implementation Milestones & Timeline

* **Phase 1 (Weeks 1–2):** Project Setup, Architecture & Design Tokens
* **Phase 2 (Weeks 3–4):** Auth System, Product Catalog & Voice Search
* **Phase 3 (Weeks 5–7):** 3D Custom Builder, Swift AR Preview & Apple Pay
* **Phase 4 (Weeks 8–9):** Live Order Tracking, Dynamic Island & WidgetKit
* **Phase 5 (Week 10):** QA, Performance Optimization & App Store Deployment

---

*Document Created for Whisk Bakery Mobile App Development Project.*
