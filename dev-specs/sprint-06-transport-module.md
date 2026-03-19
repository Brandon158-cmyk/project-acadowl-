# Acadowl — Sprint 06: Transport Module

## Development Guide & Issue Tracker

> **Sprint Goal:** Build a complete school transport management system that works in Zambia's real-world conditions — unreliable mobile data, variable GPS signal, and parents on basic Android phones who want to know one thing: "Where is my child's bus right now?" By the end of this sprint, a driver can run their entire morning route from a progressive web app on a ZMW 500 phone. The system tracks the bus's position via GPS pings every 30 seconds, marks each student as boarded or not-boarded at their stop, fires an SMS to any guardian whose child didn't board, and shows a live map to every parent waiting at home. Transport fees are added to term invoices through the exact same `overrideLineItems` mechanism that boarding used in Sprint 04. Route delays create announcements through the Sprint 03 announcement system. Driver→parent messages flow through the Sprint 03 `context: 'transport'` message threads. Nothing built in Sprints 00–05 changes. Everything connects.

---

## 📋 Table of Contents

1. [Sprint Overview](#sprint-overview)
2. [Continuity from Sprints 00–05](#continuity-from-sprints-0005)
3. [Forward-Compatibility Commitments](#forward-compatibility-commitments)
4. [Transport Reality in Zambia](#transport-reality-in-zambia)
5. [Epic 1 — Route & Vehicle Configuration](#epic-1--route--vehicle-configuration)
6. [Epic 2 — Student Route Assignment](#epic-2--student-route-assignment)
7. [Epic 3 — Driver PWA — Core](#epic-3--driver-pwa--core)
8. [Epic 4 — GPS Tracking Engine](#epic-4--gps-tracking-engine)
9. [Epic 5 — Boarding & Alighting Tracking](#epic-5--boarding--alighting-tracking)
10. [Epic 6 — Live Parent Map](#epic-6--live-parent-map)
11. [Epic 7 — Transport Notifications](#epic-7--transport-notifications)
12. [Epic 8 — Delay & Incident Management](#epic-8--delay--incident-management)
13. [Epic 9 — Transport Fee Integration](#epic-9--transport-fee-integration)
14. [Epic 10 — Transport Announcements & Communication](#epic-10--transport-announcements--communication)
15. [Epic 11 — Guardian Portal — Transport Tab](#epic-11--guardian-portal--transport-tab)
16. [Epic 12 — Transport Analytics & Reports](#epic-12--transport-analytics--reports)
17. [Epic 13 — Admin Transport Dashboard](#epic-13--admin-transport-dashboard)
18. [Dependency Graph](#dependency-graph)
19. [Schema Additions in This Sprint](#schema-additions-in-this-sprint)
20. [Definition of Done](#definition-of-done)
21. [Sprint 06 → Sprint 07 Handoff Checklist](#sprint-06--sprint-07-handoff-checklist)

---

## Sprint Overview

| Field             | Value                                                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Sprint Name**   | Sprint 06 — Transport Module                                                                                           |
| **Duration**      | 5 weeks                                                                                                                |
| **Team Size**     | 3–4 developers                                                                                                         |
| **Total Issues**  | 43                                                                                                                     |
| **Feature Gates** | `Feature.TRANSPORT` (core) · `Feature.GPS_TRACKING`                                                                    |
| **Prerequisite**  | Sprint 05 complete and all handoff checks passed                                                                       |
| **Maps Provider** | Google Maps JavaScript API (frontend map) + Google Maps Geocoding API (stop lookup)                                    |
| **GPS Strategy**  | Browser Geolocation API (`navigator.geolocation.watchPosition`) in the driver PWA — no dedicated GPS hardware required |

### Sprint Epics at a Glance

| #   | Epic                                    | Issues | Est. Days |
| --- | --------------------------------------- | ------ | --------- |
| 1   | Route & Vehicle Configuration           | 4      | 4         |
| 2   | Student Route Assignment                | 3      | 3         |
| 3   | Driver PWA — Core                       | 5      | 5         |
| 4   | GPS Tracking Engine                     | 3      | 4         |
| 5   | Boarding & Alighting Tracking           | 4      | 4         |
| 6   | Live Parent Map                         | 3      | 4         |
| 7   | Transport Notifications                 | 4      | 4         |
| 8   | Delay & Incident Management             | 3      | 3         |
| 9   | Transport Fee Integration               | 3      | 2         |
| 10  | Transport Announcements & Communication | 3      | 2         |
| 11  | Guardian Portal — Transport Tab         | 4      | 4         |
| 12  | Transport Analytics & Reports           | 4      | 3         |
| 13  | Admin Transport Dashboard               | 4      | 3         |

---

## Continuity from Sprints 00–05

Verify every item below before writing any Sprint 06 code.

| Deliverable                                                                                                 | How Sprint 06 Uses It                                                                                 |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `routes`, `vehicles`, `gpsPings` skeleton tables (Sprint 00 ISSUE-008)                                      | Sprint 06 fully implements these — all field names are binding                                        |
| `Feature.TRANSPORT`, `Feature.GPS_TRACKING` flags (Sprint 00 ISSUE-023)                                     | Every transport route, mutation, and nav item gated on these flags                                    |
| `driver` role with `/(driver)/` route group scaffold (Sprint 00 ISSUE-017)                                  | Sprint 06 fully implements the driver PWA at this route group — the scaffold already exists           |
| `students.transportRouteId`, `students.boardingStopId`, `students.transportTermStart` (Sprint 00 ISSUE-007) | All transport fields pre-placed on the student schema — no schema changes to `students`               |
| `generateInvoiceForStudent` with `overrideLineItems` param (Sprint 02 ISSUE-095)                            | Sprint 06 appends `feeType: 'transport'` line items via this mechanism — function unchanged           |
| `creditNotes` with `type: 'transport_adjustment'` (Sprint 02 ISSUE-115)                                     | Mid-term transport opt-outs generate prorated credit notes via this existing type                     |
| `paymentContext: 'transport'` in `pendingPayments` (Sprint 03 ISSUE-146)                                    | Guardian pays transport fee from portal using this context — same Airtel/MTN actions, no changes      |
| `messageThreads` with `context: 'transport'` defined (Sprint 03 ISSUE-150)                                  | Driver→guardian missed-stop messages create threads with this context — no schema change              |
| `announcements` with `category: 'transport'` (Sprint 03 ISSUE-156)                                          | Route delay and cancellation announcements use this category — same table, same query                 |
| `guardians.notificationPreferences.busArriving`, `.studentNotBoarded`, `.routeDelay` (Sprint 03 ISSUE-161)  | All three fields defined — Sprint 06 writes to them as notification triggers                          |
| `getChildOverviewForGuardian` transport stub (Sprint 03 ISSUE-133)                                          | Sprint 06 populates `transportRoute`, `nextBusDeparture` fields already declared as comments          |
| Child switcher transport stop indicator comment (Sprint 03 ISSUE-134)                                       | Sprint 06 adds the stop name chip to `ChildSummaryCard` — component already receives the child object |
| Child detail view "Transport" in "More" menu (Sprint 03 ISSUE-134)                                          | Tab already defined — Sprint 06 implements the tab content                                            |
| `sendSms` action and `notifications` table (Sprint 01 ISSUE-072, 075)                                       | Student-not-boarded SMS, bus-arriving SMS, delay notifications — all use this unchanged               |
| `schoolEvents` with `type: 'holiday'` and `affectsAttendance: true` (Sprint 01 ISSUE-043)                   | Transport scheduler skips routes on school holidays — reads the same `schoolEvents` table             |
| Student ID card barcode (Sprint 01 ISSUE-051)                                                               | Driver can scan a student's card to mark them as boarded (alternative to tap-from-list)               |
| `counters` table (Sprint 01 ISSUE-048)                                                                      | Vehicle registration sequence, incident report numbers — same counter pattern                         |

---

## Forward-Compatibility Commitments

| Decision                                                                                                              | Future Sprint Dependency                                                                                                                                                                                    |
| --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`routeRunLog` table persists every morning and afternoon run** — including which students boarded and at which stop | Sprint 07 MoE transport return reads `routeRunLog` for annual route utilisation statistics. Sprint 07 at-risk engine can flag a student whose transport attendance is consistently low as a truancy signal. |
| **`gpsPings` are retained for 90 days** then archived — not deleted                                                   | Sprint 07 analytics can compute historical on-time performance per route per term.                                                                                                                          |
| **`transportIncidents` table has an `affectsStudents: v.array(v.id('students'))` field**                              | Sprint 07 welfare analytics cross-reference transport incidents involving specific students.                                                                                                                |
| **`vehicles.insuranceExpiry` and `vehicles.nextServiceDate` fields defined**                                          | Sprint 07 admin compliance dashboard surfaces vehicles with lapsing insurance or overdue service.                                                                                                           |
| **`routes.stops` stores `lat` and `lng` for every stop**                                                              | Sprint 07 data export for MoE requires GPS coordinates of all designated school bus stops.                                                                                                                  |
| **`studentTransportHistory` is a separate table** (not just `students.transportRouteId`)                              | Sprint 07 can compute historical route assignment data — how many terms a student used transport — for fee analytics and MoE compliance.                                                                    |
| **`transportFeePayments` are tagged with `paymentContext: 'transport'`**                                              | Sprint 07 financial analytics can isolate transport revenue from tuition revenue in the bursar's full-year report.                                                                                          |

---

## Transport Reality in Zambia

Essential context every developer must understand before building this sprint.

### Network Conditions

Drivers operate on Airtel or MTN 3G networks that are often marginal on suburban and peri-urban routes. The driver PWA must:

- Cache the day's route and student list before the run begins (when driver is still at school with better WiFi/signal)
- Queue GPS pings and boarding events locally when offline — sync when signal returns
- Show a clear "Offline — data will sync when signal returns" banner rather than failing silently
- Never block the driver's workflow waiting for a network response

### Vehicle Types

Zambian school transport uses:

- **Full-size school buses** (60+ students) — a single route may take 90 minutes
- **Minibuses / combis** (14–25 students) — more common for private schools
- **Staff vehicles** repurposed for student transport — single rows
  The system must support any passenger capacity without assumption.

### Route Pattern

Nearly all Zambian school transport follows a **hub-and-spoke** model:

- **Morning**: Bus starts at a fixed depot, collects students at sequential stops, arrives at school
- **Afternoon**: Bus departs school, drops students at the reverse stop sequence, returns to depot
  Some routes have different morning and afternoon vehicle assignments — the system handles this.

### Guardian Expectations

Parents with children on transport want to know:

1. Did my child board the bus this morning?
2. Where is the bus right now?
3. What time will it reach my stop this afternoon?

Everything else is secondary. The live map and the not-boarded SMS are the two killer features of this sprint.

### Stop Naming

Bus stops in Zambia are typically named after local landmarks — "Kamwala Market", "Arcades roundabout", "Cha Cha Cha Road". They are NOT street addresses. The stop naming must accept free text and optionally augment with GPS coordinates.

---

## Epic 1 — Route & Vehicle Configuration

> **Goal:** Define every route the school runs, place every stop on a map, and register every vehicle with its driver. This is the foundation that all other epics depend on.

---

### ISSUE-268 · Vehicle Registry

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 1 day

#### Description

Register all school vehicles — buses, minibuses, and staff cars used for student transport. Each vehicle has a registration plate, capacity, driver assignment, and compliance metadata (insurance, service dates).

#### Acceptance Criteria

**Schema additions to `vehicles` (full implementation of Sprint 00 skeleton):**

```typescript
// Full implementation
registrationPlate: v.string(),         // e.g., 'ABB 1234 ZM'
make: v.optional(v.string()),          // 'Toyota'
model: v.optional(v.string()),         // 'Coaster'
year: v.optional(v.number()),
colour: v.optional(v.string()),
capacity: v.number(),                  // Maximum student passengers
vehicleType: v.union(
  v.literal('bus'),                    // 30+ seats
  v.literal('minibus'),                // 14–29 seats
  v.literal('van'),                    // 8–13 seats
  v.literal('car')                     // < 8 seats
),
driverStaffId: v.optional(v.id('staff')),
reliefDriverStaffId: v.optional(v.id('staff')), // Backup driver
photoUrl: v.optional(v.string()),
insuranceExpiry: v.optional(v.string()),  // 'YYYY-MM-DD' — Sprint 07 compliance flag
roadTaxExpiry: v.optional(v.string()),
nextServiceDate: v.optional(v.string()),
trackerDeviceId: v.optional(v.string()),  // Hardware GPS tracker ID if school has one
isActive: v.boolean(),
notes: v.optional(v.string()),
createdAt: v.number(),
updatedAt: v.number(),
```

**Backend — `convex/transport/vehicles.ts`:**

- [ ] `registerVehicle` mutation: creates vehicle record; requires `requirePermission(ctx, Permission.MANAGE_TRANSPORT)`
- [ ] `updateVehicle` mutation: edit all fields
- [ ] `assignDriverToVehicle` mutation: sets `driverStaffId`; also writes `staff.assignedVehicleId` (schema addition to `staff`) — driver's PWA auto-loads their vehicle on login
- [ ] `deactivateVehicle` mutation: blocks if vehicle has an active route run today
- [ ] `getVehicles` query: all vehicles with driver name, current route (if on a run), compliance status
- [ ] `getVehicleComplianceAlerts` query: vehicles where `insuranceExpiry`, `roadTaxExpiry`, or `nextServiceDate` is within 30 days — shown as admin alerts

**Frontend — `/(admin)/transport/vehicles/page.tsx`:**

- [ ] Vehicle card grid: photo (or vehicle-type icon), registration plate, make/model, capacity, driver name, status badge (Active / On Route / Inactive)
- [ ] Compliance warning band: amber if insurance/tax/service due within 30 days, red if expired
- [ ] "Add Vehicle" form with all fields
- [ ] Driver assignment: search staff by name → assign; shows current driver with reassign option
- [ ] Photo upload: vehicle exterior photo stored in Cloudinary at `transport/{schoolSlug}/vehicles/{vehicleId}.jpg`

---

### ISSUE-269 · Route Builder — Stops and Sequence

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 1.5 days

#### Description

Define routes and place their stops on a Google Maps interface. Each stop has a name, GPS coordinates, scheduled morning pick-up time, and scheduled afternoon drop-off time. The stop sequence defines the order of pick-up (morning) and drop-off (afternoon, reversed).

#### User Story

> The transport manager at Munali Boys School opens the route builder. She creates "Route A — Northmead / Emmasdale". She types "Northmead Shoprite" — the system geocodes it and drops a pin on the map. She drags the pin to the correct stop outside the Shoprite car park. She sets morning pick-up: 06:30, afternoon drop-off: 16:45. She adds 7 more stops, arranges them in order, assigns the Toyota Coaster and its driver.

#### Acceptance Criteria

**Schema additions to `routes` (full implementation of Sprint 00 skeleton):**

```typescript
// Full implementation
name: v.string(),                      // 'Route A — Northmead / Emmasdale'
description: v.optional(v.string()),
status: v.union(
  v.literal('active'),
  v.literal('suspended'),              // Temporarily cancelled (e.g., vehicle breakdown)
  v.literal('archived')
),
stops: v.array(v.object({
  stopId: v.string(),                  // Client-generated UUID — stable across updates
  order: v.number(),                   // 1 = first pick-up; N = last before school
  name: v.string(),                    // 'Northmead Shoprite'
  lat: v.number(),
  lng: v.number(),
  scheduledTimeMorning: v.string(),    // 'HH:MM' — scheduled pick-up time
  scheduledTimeAfternoon: v.string(),  // 'HH:MM' — scheduled drop-off time
  landmark: v.optional(v.string()),    // 'Opposite Shoprite car park entrance'
  studentCount: v.number(),            // Denormalised — updated when students are assigned
})),
morningVehicleId: v.optional(v.id('vehicles')),
afternoonVehicleId: v.optional(v.id('vehicles')),  // Can differ from morning
morningDriverStaffId: v.optional(v.id('staff')),
afternoonDriverStaffId: v.optional(v.id('staff')),
schoolArrivalTime: v.string(),         // 'HH:MM' — when bus should reach school
schoolDepartureTime: v.string(),       // 'HH:MM' — afternoon departure from school
totalStudents: v.number(),             // Denormalised — sum of all stop studentCounts
distanceKm: v.optional(v.number()),    // Approximate route distance
estimatedDurationMinutes: v.optional(v.number()),
operatingDays: v.array(v.number()),    // [1,2,3,4,5] = Mon–Fri; some routes skip Sat
termStartDate: v.optional(v.string()),
termEndDate: v.optional(v.string()),
color: v.optional(v.string()),         // Hex color for map polyline: '#E53E3E'
createdAt: v.number(),
updatedAt: v.number(),
```

**Backend — `convex/transport/routes.ts`:**

- [ ] `createRoute` mutation: creates route with initial stops array; requires `requirePermission(ctx, Permission.MANAGE_TRANSPORT)`
- [ ] `updateRoute` mutation: updates name, description, vehicles, drivers, operating days
- [ ] `updateRouteStops` mutation: replaces the stops array atomically — the entire stop sequence is submitted as one update (avoids partial-state bugs). Recalculates `totalStudents` from current student assignments.
- [ ] `addStop` mutation: appends a stop; re-sorts by `order`
- [ ] `removeStop` mutation: removes a stop; validates no students are assigned to it first
- [ ] `reorderStops` mutation: takes `[{ stopId, newOrder }]` array
- [ ] `getRoutes` query: all routes for school with vehicle names, student counts per stop, today's run status
- [ ] `getRouteDetail` query: full route with stops, assigned students per stop, vehicle, driver

**Frontend — `/(admin)/transport/routes/[routeId]/page.tsx`:**

- [ ] **Left panel**: Stop sequence list — drag handles to reorder, each stop shows time, student count, landmark note
  - "Add Stop" button at bottom: name input + optional landmark note
  - Click stop → shows its students (with reassign option)
- [ ] **Right panel**: Google Maps embed showing the route
  - Numbered markers for each stop in sequence order
  - Polyline connecting stops in sequence (coloured by `route.color`)
  - Drag a marker to reposition a stop → updates `lat`/`lng` immediately
  - "Geocode stop" button: types stop name → calls Google Maps Geocoding API → drops pin at result
- [ ] Vehicle assignment section: morning and afternoon vehicle/driver selectors (can be same or different)
- [ ] "Preview route" button: simulates the morning run with scheduled times

---

### ISSUE-270 · Driver Assignment and Driver Profile

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 0.5 days

#### Description

Assign staff members as drivers. A driver is a staff member with the `driver` role — they have a restricted portal that only shows their assigned route and the driver PWA. Managing driver profiles includes their licence number, licence expiry, and emergency contact.

#### Acceptance Criteria

**Schema addition to `staff` (expanding existing table):**

```typescript
// Fields added to staff for drivers
assignedVehicleId: v.optional(v.id('vehicles')),
driversLicenceNumber: v.optional(v.string()),
driversLicenceExpiry: v.optional(v.string()),   // Sprint 07 compliance flag
driversLicenceClass: v.optional(v.string()),     // 'C', 'D', 'EC'
emergencyContactName: v.optional(v.string()),
emergencyContactPhone: v.optional(v.string()),
```

**Backend:**

- [ ] `assignStaffAsDriver` mutation: sets `staff.role` to include `'driver'`, links `staff.assignedVehicleId`
- [ ] `getDriverProfile` query: driver's full profile including assigned vehicle, current route, licence status
- [ ] `getDriversForSchool` query: all drivers with their vehicles and routes, licence expiry status

**Frontend — `/(admin)/transport/drivers/page.tsx`:**

- [ ] Driver cards: photo, name, assigned vehicle (registration plate), assigned route, licence expiry
- [ ] Licence expiry warnings: amber (< 30 days), red (expired)
- [ ] "Add Driver" flow: search existing staff → assign driver role → fill licence details → assign vehicle

---

### ISSUE-271 · Transport Settings and School Configuration

**Type:** Backend + Frontend | **Priority:** P1 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 0.5 days

#### Description

School-level transport configuration — GPS ping frequency, notification rules, fee policies, and operational policies that govern the whole transport module.

#### Acceptance Criteria

**Schema addition to `schools`:**

```typescript
transportConfig: v.object({
  gpsPingIntervalSeconds: v.number(), // Default: 30
  notifyGuardianNotBoardedAfterMinutes: v.number(), // After how many minutes to send not-boarded SMS: Default 15
  busArrivingNotificationMinutes: v.number(), // Alert guardian N minutes before bus reaches their stop: Default 5
  allowGuardianViewLiveMap: v.boolean(), // Whether parents can see the live map
  requireDriverConfirmToStartRun: v.boolean(), // Driver must explicitly start a run (safety check)
  lateArrivalThresholdMinutes: v.number(), // How many minutes late before flagging as delayed: Default 10
  maxGpsInaccuracyMeters: v.number(), // Discard pings with accuracy worse than this: Default 100
  transportFeeIsTermly: v.boolean(), // True = charged per term; False = per month
  operatingDays: v.array(v.number()), // School-wide default: [1,2,3,4,5]
});
```

- [ ] `/(admin)/settings/transport/page.tsx`: all transport policy settings
- [ ] GPS ping frequency warning: if set below 15 seconds, warn "Frequent pings consume driver's mobile data"
- [ ] "Test GPS" button: fires a test ping from admin's own device to verify the GPS pipeline is working

---

## Epic 2 — Student Route Assignment

---

### ISSUE-272 · Student-to-Route and Stop Assignment

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 1 day

#### Description

Assign students to routes and stops. Each student uses one stop for morning pick-up and one for afternoon drop-off (usually the same stop). Assignments are term-scoped via `studentTransportHistory`.

#### User Story

> The transport manager opens Route A's student list. She drags Chanda Banda from the "Unassigned transport students" panel onto the "Northmead Shoprite" stop. The stop's student count updates from 4 to 5. Chanda's profile now shows "Route A — Northmead Shoprite" and her guardian will receive transport notifications.

#### Acceptance Criteria

**Schema addition:**

```typescript
studentTransportHistory: defineTable({
  schoolId: v.id('schools'),
  studentId: v.id('students'),
  routeId: v.id('routes'),
  stopId: v.string(), // stopId within route.stops array
  morningStopId: v.string(), // Usually same as stopId
  afternoonStopId: v.string(), // Could differ (rare)
  termId: v.id('terms'),
  academicYearId: v.id('academicYears'),
  fromDate: v.string(),
  toDate: v.optional(v.string()), // null = currently assigned
  reason: v.union(
    v.literal('initial_assignment'),
    v.literal('stop_change'),
    v.literal('route_change'),
    v.literal('opt_out'),
  ),
  assignedBy: v.id('users'),
  createdAt: v.number(),
})
  .index('by_school', ['schoolId'])
  .index('by_student_term', ['studentId', 'termId'])
  .index('by_route_term', ['routeId', 'termId']);
```

**Backend — `convex/transport/studentAssignment.ts`:**

- [ ] `assignStudentToRoute` mutation:
  - Args: `{ studentId, routeId, stopId, morningStopId?, afternoonStopId? }`
  - Validates `Feature.TRANSPORT` is enabled
  - Validates stop exists in route.stops
  - Closes any existing open `studentTransportHistory` record for this student this term
  - Creates new `studentTransportHistory` record
  - Updates `students.transportRouteId` and `students.boardingStopId`
  - Increments `route.stops[n].studentCount` for the assigned stop
  - Updates `route.totalStudents`
  - Requires `requirePermission(ctx, Permission.MANAGE_TRANSPORT)`

- [ ] `unassignStudentFromTransport` mutation:
  - Closes `studentTransportHistory` with `toDate = today`, `reason: 'opt_out'`
  - Clears `students.transportRouteId` and `students.boardingStopId`
  - Decrements stop student count
  - If mid-term: prompts admin to generate prorated transport credit note (ISSUE-295)

- [ ] `getUnassignedTransportStudents` query: students with transport fee on their invoice but no `transportRouteId` — should be zero at term start
- [ ] `getStudentsForRoute` query: all students on a route, grouped by stop, with guardian contact info — used by driver PWA manifest download

---

### ISSUE-273 · Bulk Route Assignment Interface

**Type:** Frontend + Backend | **Priority:** P0 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 1 day

#### Description

At term start, assign 50–200 transport students to routes and stops quickly. Same drag-and-drop pattern as bed assignment (Sprint 04 ISSUE-173) — familiar to admins who have already done beds.

#### Acceptance Criteria

**Frontend — `/(admin)/transport/assignments/page.tsx`:**

- [ ] Two-panel layout:
  - **Left panel**: "Unassigned transport students" — students with `transportRouteId: null` who are fee-paying transport students. Filterable by grade, gender, last known stop.
  - **Right panel**: Route selector → stop list with student counts and capacity indicator
- [ ] Drag student from left onto a stop in right panel → assigns them
- [ ] Click-to-assign alternative: click student → click stop → assigns
- [ ] "Re-assign from last term" button: looks up each student's `studentTransportHistory` from the previous term and re-assigns to same stop where available. Returns count of auto-assigned and those needing manual placement.
- [ ] Route occupancy guard: if a stop's student count would exceed vehicle capacity, shows amber warning: "Route A vehicle seats 30 students. Adding Chanda would make 31."
- [ ] Export: PDF of route manifest per route — for printing and posting on the bus

---

### ISSUE-274 · Transport Subscription Management

**Type:** Backend + Frontend | **Priority:** P1 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 0.5 days

#### Description

A guardian can opt their child into or out of school transport. The admin manages this subscription — it drives whether transport fees appear on the term invoice and whether the student appears on route manifests.

#### Acceptance Criteria

**Schema addition to `students`:**

```typescript
transportSubscriptionStatus: v.union(
  v.literal('subscribed'),       // Paying, on a route
  v.literal('unsubscribed'),     // Not using school transport
  v.literal('pending'),          // Applied but not yet confirmed
),
```

- [ ] `subscribeToTransport` mutation: sets `transportSubscriptionStatus: 'subscribed'`, triggers invoice generation for transport fee if term already started
- [ ] `unsubscribeFromTransport` mutation: sets status to `'unsubscribed'`, calls `unassignStudentFromTransport`, generates prorated credit note if mid-term
- [ ] `getTransportSubscriptionRequests` query: students with `status: 'pending'` — admin approval queue
- [ ] Guardian portal: "Transport" section in "More" tab shows current subscription status and "Request Transport" / "Cancel Transport" button
- [ ] Admin view: transport subscription list with pending requests, per-route capacity vs demand

---

## Epic 3 — Driver PWA — Core

> **Goal:** A progressive web app that a driver installs on their own phone — no app store, no IT support, no training required. The entire morning or afternoon run is managed from this app.

---

### ISSUE-275 · Driver PWA — Authentication and Route Loading

**Type:** Frontend + Backend | **Priority:** P0 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 1 day

#### Description

The driver's entry point. They log in with their phone number (same OTP auth as all other users — Sprint 00 ISSUE-018). After login, their assigned route loads automatically. All data required for the day's run is downloaded before they leave school.

#### User Story

> Driver Mr. Mwamba arrives at school at 06:00. He opens his browser, goes to `chengelo.Acadowl.zm/driver`, and logs in with his OTP. He sees "Route A — Northmead / Emmasdale — 28 students — Departs 15:30." He taps "Pre-load for this afternoon." The app downloads the full student list, stop sequence, and GPS waypoints. At 15:30, even if signal drops on Kafue Road, the app works.

#### Acceptance Criteria

**`/(driver)/` route group — implementing Sprint 00 ISSUE-017 scaffold:**

- [ ] `/(driver)/layout.tsx`: role-gated to `driver` role; shows minimal UI — no sidebar, just route info and action buttons; dark-mode friendly for driving in low-light conditions
- [ ] `/(driver)/page.tsx` — driver home screen:
  - Driver's name and assigned vehicle (registration plate, capacity)
  - Today's scheduled runs: morning run card, afternoon run card
  - Status of each run: "Not started" / "In Progress" / "Completed" / "No run today" (school holiday)
  - "Pre-load route data" button — downloads and caches the full route manifest for offline use
  - Last sync timestamp: "Route data last synced 4 minutes ago"

**`convex/transport/driverPwa.ts`:**

- [ ] `getDriverRunsForToday` query:
  - Takes `driverStaffId` from authenticated user
  - Checks `schoolEvents` for today — returns `{ noRun: true }` if school holiday
  - Returns morning and afternoon run configs: route name, stops, students per stop, vehicle capacity, scheduled times
- [ ] `getRouteManifestForDriver` query: full offline manifest — all stops with student names, photos (Cloudinary URLs), guardian phone numbers, and stop GPS coordinates. This is the data pre-loaded before the run.

**PWA manifest and service worker:**

- [ ] `src/app/(driver)/manifest.json`: `{ name: "Acadowl Driver", display: "standalone", theme_color: "#1a365d", background_color: "#1a365d" }`
- [ ] Workbox pre-cache strategy for driver routes: CacheFirst for route manifest, NetworkFirst for live GPS and boarding data (falls back to cached on signal loss)
- [ ] "Add to Home Screen" prompt: shown after second visit if not yet installed

---

### ISSUE-276 · Driver PWA — Run Start and Safety Check

**Type:** Frontend + Backend | **Priority:** P0 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 0.5 days

#### Description

Before a run begins, the driver performs a quick safety acknowledgement. The system records the run start, the vehicle, the driver, and the initial GPS location. This creates the `routeRunLog` record that all boarding and GPS events attach to.

#### Acceptance Criteria

**Schema addition:**

```typescript
routeRunLog: defineTable({
  schoolId: v.id('schools'),
  routeId: v.id('routes'),
  vehicleId: v.id('vehicles'),
  driverStaffId: v.id('staff'),
  runType: v.union(v.literal('morning'), v.literal('afternoon')),
  date: v.string(), // 'YYYY-MM-DD'
  status: v.union(
    v.literal('not_started'),
    v.literal('in_progress'),
    v.literal('completed'),
    v.literal('cancelled'),
    v.literal('delayed'),
  ),
  scheduledDepartureTime: v.string(), // 'HH:MM'
  actualDepartureTime: v.optional(v.string()),
  scheduledArrivalTime: v.string(), // Expected school arrival (morning) or final stop (afternoon)
  actualArrivalTime: v.optional(v.string()),
  delayMinutes: v.optional(v.number()), // Computed: actual - scheduled
  startLat: v.optional(v.number()),
  startLng: v.optional(v.number()),
  totalStudentsExpected: v.number(), // From route.totalStudents at run start
  totalStudentsBoarded: v.number(), // Incremented as students board
  totalStudentsNotBoarded: v.number(),
  cancelReason: v.optional(v.string()),
  notes: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_school', ['schoolId'])
  .index('by_route_date', ['routeId', 'date'])
  .index('by_driver_date', ['driverStaffId', 'date'])
  .index('by_school_date', ['schoolId', 'date']);
```

**Backend:**

- [ ] `startRouteRun` mutation:
  - Args: `{ routeId, runType, vehicleId, startLat, startLng }`
  - Validates no other run is `in_progress` for this route and date
  - Creates `routeRunLog` record with `status: 'in_progress'`, `actualDepartureTime: now()`
  - Returns `runId` — all subsequent GPS pings and boarding events reference this `runId`
  - Broadcasts to admin dashboard via Convex real-time: "Route A morning run started at 06:02"

**Frontend — driver run start screen:**

- [ ] Safety check panel (if `transportConfig.requireDriverConfirmToStartRun`):
  - Checkbox list: "Vehicle checked ✓", "All mirrors adjusted ✓", "Doors secure ✓"
  - Cannot start run until all checked
- [ ] "Start Run" button: large, green — entire screen is the button essentially
- [ ] On start: immediately requests GPS permission (`navigator.geolocation.getCurrentPosition`) — records start coordinates
- [ ] Transitions to the active run screen (ISSUE-277)

---

### ISSUE-277 · Driver PWA — Active Run Screen

**Type:** Frontend | **Priority:** P0 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 1.5 days

#### Description

The driver's main working screen during a run. Shows the current and next stop, the students expected at each stop, and controls for marking arrivals at stops. Designed to be usable at a glance — driver should never need to look at the screen for more than 2 seconds while driving.

#### Acceptance Criteria

**Frontend — `/(driver)/route/active/page.tsx`:**

- [ ] **Large current stop banner** at top: stop name, number of students to board at this stop, ETA
- [ ] Student list for current stop: large photo (60px), name, class — tap to mark as boarded or absent (ISSUE-280)
- [ ] "Mark all boarded at this stop" — one-tap action for the common case where all students are present
- [ ] "Arrived at Stop" button: records stop arrival time, triggers bus-arriving notification to students at this stop (ISSUE-284)
- [ ] "Departed from Stop" button: records stop departure time, advances to next stop, triggers not-boarded notifications for any student not yet marked
- [ ] **Progress indicator**: "Stop 3 of 8 — 14/28 students boarded"
- [ ] **Next stop preview**: smaller card below current stop showing next stop name and time
- [ ] Offline mode: all above actions work offline — queued to Convex when signal returns
- [ ] Emergency button: "Report Incident" — large red button (ISSUE-288)
- [ ] Auto-lock prevention: calls `navigator.wakeLock.request('screen')` so screen stays on during run

---

### ISSUE-278 · Driver PWA — Run Completion

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 0.5 days

#### Description

When the driver reaches the final stop (morning: school; afternoon: last drop-off), they complete the run. The system records arrival time, computes delay, and notifies admin.

#### Acceptance Criteria

**Backend:**

- [ ] `completeRouteRun` mutation:
  - Args: `{ runId, arrivalLat, arrivalLng }`
  - Sets `status: 'completed'`, `actualArrivalTime: now()`
  - Computes `delayMinutes`: `actualArrivalTime - scheduledArrivalTime`
  - If `delayMinutes > transportConfig.lateArrivalThresholdMinutes`: updates `status: 'delayed'` for reporting (run is still completed — 'delayed' is a reporting flag)
  - Stops GPS ping watcher (sends `stopGpsTracking` signal)
  - Creates in-app notification to admin: "Route A morning run completed at 07:42 — 2 minutes early. 27/28 students boarded."

**Frontend — run complete screen:**

- [ ] Congratulatory confirmation: "Run Complete ✓ — 27 students delivered. 1 student not boarded (SMS sent to guardian)."
- [ ] Run summary card: departure time, arrival time, students boarded, not-boarded count, any incidents
- [ ] "Return to Home" button: resets driver PWA to home screen
- [ ] If any students were marked not-boarded: summary of those students with guardian contact — driver can call directly if concerned

---

### ISSUE-279 · Driver PWA — Route Cancellation

**Type:** Backend + Frontend | **Priority:** P1 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 0.5 days

#### Description

Occasionally, a run must be cancelled mid-route (vehicle breakdown, road closure, medical emergency). The driver cancels the run, specifies a reason, and the system immediately notifies all affected guardians.

#### Acceptance Criteria

- [ ] `cancelRouteRun` mutation:
  - Args: `{ runId, reason, cancelledAtStopIndex? }`
  - Sets `routeRunLog.status: 'cancelled'`, `routeRunLog.cancelReason: reason`
  - Identifies all students not yet boarded (morning) or not yet dropped off (afternoon)
  - Sends urgent SMS to ALL guardians of affected students: `"URGENT: [SchoolName] bus Route A has been cancelled today due to [reason]. Please arrange alternative transport for [StudentName]. Contact school: [phone]."`
  - Creates school-wide transport announcement (category: 'transport')
  - Sends in-app notification to admin
- [ ] Driver PWA: "Cancel Run" button in the run screen's "..." menu (not prominently placed — accidental taps must be rare)
- [ ] Cancellation confirmation: requires driver to type reason and confirm — two-tap minimum

---

## Epic 4 — GPS Tracking Engine

---

### ISSUE-280 · GPS Ping Collection and Storage

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** `Feature.GPS_TRACKING` | **Estimate:** 1 day

#### Description

The engine that collects GPS coordinates from the driver's phone every N seconds and stores them as a time-series. This is the data source for the live parent map and the on-time performance reports.

#### Acceptance Criteria

**Schema additions to `gpsPings` (full implementation of Sprint 00 skeleton):**

```typescript
// Full implementation
lat: v.number(),
lng: v.number(),
accuracy: v.number(),              // metres — GPS accuracy estimate
speed: v.optional(v.number()),     // metres per second
heading: v.optional(v.number()),   // degrees (0 = north)
altitude: v.optional(v.number()),
runId: v.id('routeRunLog'),        // Links to the active run
currentStopIndex: v.number(),      // Which stop the bus is currently approaching
isOffline: v.boolean(),            // True if ping was queued offline and synced later
timestamp: v.number(),             // Unix ms — used for ordering
createdAt: v.number(),
```

**Backend — `convex/transport/gps.ts`:**

- [ ] `recordGpsPing` mutation:
  - Args: `{ runId, lat, lng, accuracy, speed?, heading?, currentStopIndex, isOffline, timestamp }`
  - Validates `accuracy <= transportConfig.maxGpsInaccuracyMeters` — discards poor readings (sets `isDiscarded: true` rather than not inserting — for debugging)
  - Requires `Feature.GPS_TRACKING` enabled
  - Does NOT require auth check beyond "is a driver role" — performance critical, must be fast
  - This mutation is called every 30 seconds during a live run — it must complete in < 200ms

- [ ] `getLatestPingForRun` query: the most recent valid ping for a run — used by admin dashboard and parent map
- [ ] `getPingsForRun` query: all pings for a run in timestamp order — used to draw the polyline on the admin post-run map
- [ ] `retentionJob` cron: weekly job that archives (marks as `archived: true`) pings older than 90 days — they are retained for Sprint 07 analytics but excluded from active queries

**Frontend — driver PWA GPS watcher:**

```typescript
// In the driver PWA active run component
useEffect(() => {
  if (!Feature.GPS_TRACKING) return;
  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      // Queue ping — either send immediately or push to IndexedDB if offline
      queueGpsPing({
        runId,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed ?? undefined,
        heading: position.coords.heading ?? undefined,
        currentStopIndex,
        isOffline: !navigator.onLine,
        timestamp: position.timestamp,
      });
    },
    (error) => console.warn('GPS error:', error.code),
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: transportConfig.gpsPingIntervalSeconds * 1000,
    },
  );
  return () => navigator.geolocation.clearWatch(watchId);
}, [runId, currentStopIndex]);
```

- [ ] Offline ping queue: when `!navigator.onLine`, pings stored in IndexedDB with `isOffline: true`. When connection restores, the queue flushes in order (oldest first) via the `sendOfflinePingQueue` batch mutation.
- [ ] Battery warning: if `navigator.getBattery()` returns < 20%, show a warning banner to the driver: "Low battery — GPS tracking may stop. Please plug in."

---

### ISSUE-281 · ETA Computation Engine

**Type:** Backend | **Priority:** P0 | **Feature Gate:** `Feature.GPS_TRACKING` | **Estimate:** 1 day

#### Description

Compute the estimated time of arrival (ETA) for the bus at each upcoming stop, based on current GPS position, current speed, and historical travel times between stops. This is the data that drives the "Bus arriving in 4 minutes" notification.

#### Acceptance Criteria

**`convex/transport/eta.ts`:**

- [ ] `computeEtasForRun` internal action:
  - Called after every 5th GPS ping (not every ping — reduces compute load)
  - Inputs: latest GPS ping, current stop index, route stops with GPS coords, current speed
  - Algorithm:
    1. For each remaining stop: compute straight-line distance from current position using Haversine formula
    2. Apply a `roadFactor: 1.4` multiplier to convert straight-line to estimated road distance (Zambian road patterns — not straight-line friendly)
    3. Divide by current speed (or use `historicalAvgSpeedKph` if speed is 0 / unavailable): gives seconds-to-stop
    4. Add `dwellTimeSeconds: 90` per stop (time spent at each stop boarding/alighting)
    5. Returns: `Array<{ stopId, etaTimestamp, etaMinutes, confidence: 'high' | 'medium' | 'low' }>`
  - `confidence: 'low'` if speed data unavailable or accuracy > 50m

- [ ] `routeEtaSnapshots` table: stores computed ETAs per run for real-time access by parent map and notification engine:

  ```typescript
  routeEtaSnapshots: defineTable({
    schoolId: v.id('schools'),
    runId: v.id('routeRunLog'),
    computedAt: v.number(),
    currentLat: v.number(),
    currentLng: v.number(),
    currentStopIndex: v.number(),
    stopEtas: v.array(
      v.object({
        stopId: v.string(),
        etaTimestamp: v.number(),
        etaMinutes: v.number(),
        confidence: v.string(),
      }),
    ),
  }).index('by_run', ['runId']);
  ```

- [ ] `getEtaForStop` query: takes `{ runId, stopId }` — returns latest ETA snapshot for that stop. Used by parent map and notification engine.

---

### ISSUE-282 · Historical GPS Route Playback

**Type:** Frontend | **Priority:** P2 | **Feature Gate:** `Feature.GPS_TRACKING` | **Estimate:** 0.5 days

#### Description

Admin can replay a completed run's GPS track on a map — useful for investigating complaints ("The bus drove past my stop without stopping") and for route optimisation.

#### Acceptance Criteria

- [ ] `/(admin)/transport/routes/[routeId]/runs/[runId]/replay/page.tsx`:
  - Google Maps with the GPS polyline drawn from all pings in the run
  - Play/pause animation: "bus" marker moves along the polyline at 10× real speed
  - Timeline scrubber: drag to any point in the run
  - Stop markers overlaid: each stop shown with timestamp of when bus arrived
  - Boarding events shown as pop-ups when playback reaches each stop
  - Discarded pings shown in red (poor accuracy) — filtered out of the main polyline by default, toggleable
- [ ] `getRunReplayData` query: all pings + boarding events for a run in timestamp order

---

## Epic 5 — Boarding & Alighting Tracking

> **Goal:** The driver marks every student as boarded or not-boarded at each stop. This is the most important safety feature of the module — it answers the question every parent has: "Did my child actually get on the bus today?"

---

### ISSUE-283 · Student Boarding Tracker — Core Schema and Logic

**Type:** Backend | **Priority:** P0 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 1 day

#### Description

The data model for tracking whether each student boarded the bus at their stop on a given run. This is queried in real-time by the admin dashboard and the parent portal.

#### Acceptance Criteria

**Schema addition:**

```typescript
transportBoardingEvents: defineTable({
  schoolId: v.id('schools'),
  runId: v.id('routeRunLog'),
  studentId: v.id('students'),
  stopId: v.string(),
  date: v.string(), // 'YYYY-MM-DD'
  runType: v.union(v.literal('morning'), v.literal('afternoon')),
  status: v.union(
    v.literal('boarded'),
    v.literal('not_boarded'),
    v.literal('excused'), // Parent notified school: student absent today
    v.literal('late_boarded'), // Boarded at a later stop than assigned (caught up)
  ),
  boardedAt: v.optional(v.number()), // Timestamp if boarded
  markedBy: v.union(
    v.literal('driver'),
    v.literal('admin_override'), // Admin corrected the record
    v.literal('auto_absent'), // Auto-marked after stop departed with no scan
  ),
  markedByUserId: v.id('users'),
  guardianNotified: v.boolean(),
  guardianNotifiedAt: v.optional(v.number()),
  notes: v.optional(v.string()),
  createdAt: v.number(),
})
  .index('by_run', ['runId'])
  .index('by_student_date', ['studentId', 'date'])
  .index('by_school_date', ['schoolId', 'date'])
  .index('by_run_stop', ['runId', 'stopId']);
```

**Backend — `convex/transport/boarding.ts`:**

- [ ] `markStudentBoarded` mutation:
  - Args: `{ runId, studentId, stopId, status: 'boarded' | 'excused' | 'late_boarded' }`
  - Creates or updates `transportBoardingEvents` record
  - Updates `routeRunLog.totalStudentsBoarded` (increment) if status is `'boarded'`
  - Requires driver role — only the active driver or admin can call this

- [ ] `autMarkNotBoardedForStop` mutation:
  - Called by `recordStopDeparture` (ISSUE-285) when driver taps "Departed from Stop"
  - For every student assigned to this stop with no `transportBoardingEvents` record yet: creates one with `status: 'not_boarded'`, `markedBy: 'auto_absent'`
  - Queues `sendNotBoardedNotification` for each (ISSUE-284)
  - Updates `routeRunLog.totalStudentsNotBoarded`

- [ ] `adminOverrideBoardingStatus` mutation: admin can correct a boarding record (e.g., driver error). Creates audit log entry. Requires `requirePermission(ctx, Permission.MANAGE_TRANSPORT)`.
- [ ] `getBoardingStatusForRun` query: all expected students for a run with their current boarding status — live, updates as driver marks students
- [ ] `getBoardingHistoryForStudent` query: all boarding events for a student across all runs — used in attendance view

---

### ISSUE-284 · Stop Arrival and Departure Events

**Type:** Backend | **Priority:** P0 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 0.5 days

#### Description

Record when the bus arrives at and departs from each stop. This is the trigger for bus-arriving notifications and the automatic not-boarded marking.

#### Acceptance Criteria

**Schema addition:**

```typescript
stopEvents: defineTable({
  schoolId: v.id('schools'),
  runId: v.id('routeRunLog'),
  stopId: v.string(),
  stopIndex: v.number(),
  eventType: v.union(v.literal('arrived'), v.literal('departed')),
  scheduledTime: v.string(), // 'HH:MM' from route definition
  actualTimestamp: v.number(),
  delayMinutes: v.number(), // Actual - scheduled (negative = early)
  lat: v.optional(v.number()), // GPS position when event recorded
  lng: v.optional(v.number()),
}).index('by_run', ['runId']);
```

**Backend — `convex/transport/stops.ts`:**

- [ ] `recordStopArrival` mutation:
  - Creates `stopEvents` record with `eventType: 'arrived'`
  - Computes `delayMinutes`
  - Triggers `sendBusArrivingNotification` for all students at this stop whose guardians have `notifPrefs.busArriving: true` (ISSUE-286)
  - Returns: list of students expected at this stop (for driver's boarding screen)

- [ ] `recordStopDeparture` mutation:
  - Creates `stopEvents` record with `eventType: 'departed'`
  - Calls `autoMarkNotBoardedForStop` for all unmarked students at this stop
  - Advances `routeRunLog.currentStopIndex` to next stop
  - Triggers `sendNotBoardedNotifications` for all `not_boarded` students (ISSUE-286)

---

### ISSUE-285 · Boarding Scan — Barcode Alternative

**Type:** Frontend | **Priority:** P1 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 0.5 days

#### Description

On routes where students boarding is rapid and chaotic, the driver can scan student ID card barcodes with their phone camera rather than tapping names from a list. Faster for high-capacity buses.

#### Acceptance Criteria

- [ ] "Scan Mode" toggle in the driver active run screen — switches from tap-list to camera barcode scanner
- [ ] Uses the same `<BarcodeScanner />` component built for the library (Sprint 05 ISSUE-254) and boarding gate (Sprint 04 ISSUE-185) — no new scanner component needed
- [ ] On successful scan: plays a success sound (short beep via Web Audio API), shows student name+photo for 1 second, marks as `boarded`
- [ ] Unrecognised barcode: plays error sound, shows "Unknown student — not on this route"
- [ ] Wrong stop: if scanned student is assigned to a different stop — shows warning "Chanda's assigned stop is Stop 5 (Northmead). Allow boarding here?" — driver can approve and records `status: 'late_boarded'`

---

### ISSUE-286 · Excused Absence for Transport

**Type:** Backend + Frontend | **Priority:** P1 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 0.5 days

#### Description

A guardian can notify the school in advance that their child will not be taking the bus on a specific date — preventing a false "not boarded" alert. The driver and admin see this before the run starts.

#### Acceptance Criteria

**Schema addition:**

```typescript
transportExcusals: defineTable({
  schoolId: v.id('schools'),
  studentId: v.id('students'),
  date: v.string(),
  runType: v.union(v.literal('morning'), v.literal('afternoon'), v.literal('both')),
  reason: v.optional(v.string()),
  submittedBy: v.id('users'), // Guardian or admin
  createdAt: v.number(),
})
  .index('by_student_date', ['studentId', 'date'])
  .index('by_school_date', ['schoolId', 'date']);
```

- [ ] `excuseStudentFromTransport` mutation: creates excusal record; notifies driver via in-app
- [ ] When `autoMarkNotBoardedForStop` runs: checks `transportExcusals` first — excused students get `status: 'excused'` rather than `'not_boarded'` and do NOT trigger guardian SMS
- [ ] Guardian portal: "Excuse from bus" button in transport tab — date picker, run selector (morning/afternoon/both), optional reason
- [ ] Driver PWA: excused students shown with a different icon in the boarding list: "Excused — parent notified school"
- [ ] Admin dashboard: today's excusals shown as a count — "3 students excused from morning run"

---

## Epic 6 — Live Parent Map

> **Feature Gate:** `Feature.GPS_TRACKING` AND `transportConfig.allowGuardianViewLiveMap: true`

---

### ISSUE-287 · Live Bus Map — Backend

**Type:** Backend | **Priority:** P0 | **Feature Gate:** `Feature.GPS_TRACKING` | **Estimate:** 1 day

#### Description

Real-time backend queries that power the parent map. Must return current bus position, ETA to parent's stop, and which students are boarded — fast enough for a map that refreshes every 10 seconds.

#### Acceptance Criteria

**`convex/transport/liveMap.ts`:**

- [ ] `getLiveBusDataForGuardian` query:
  - Takes `{ studentId }` — guardian's specific child
  - Validates guardian has permission to view this student's transport data
  - Finds the active run for today for the student's route
  - Returns:
    ```typescript
    {
      runId: string,
      runStatus: 'not_started' | 'in_progress' | 'completed' | 'cancelled',
      currentPosition: { lat, lng, accuracy, updatedAt } | null,
      studentBoardingStatus: 'boarded' | 'not_boarded' | 'excused' | 'awaiting' | null,
      studentStop: { name, lat, lng, scheduledTime, etaMinutes, etaConfidence },
      completedStops: number,
      totalStops: number,
      vehicleRegistration: string,
      driverName: string,
      lastPingAt: number | null,
    }
    ```
  - `Feature.GPS_TRACKING` disabled: returns `{ gpsUnavailable: true }` — position shown as null

- [ ] `getLiveBusDataForAdmin` query: same as guardian query but for ALL routes simultaneously — used by admin dashboard (ISSUE-309)
- [ ] Convex real-time: these queries use Convex's reactive model — client subscribes once and receives updates automatically as GPS pings and boarding events arrive. No polling needed.

---

### ISSUE-288 · Live Bus Map — Guardian Frontend

**Type:** Frontend | **Priority:** P0 | **Feature Gate:** `Feature.GPS_TRACKING` | **Estimate:** 1.5 days

#### Description

The parent-facing live map. A Google Maps embed showing the bus position in real-time, the parent's stop, and the ETA. Designed for a parent standing at a stop with a basic Android phone.

#### User Story

> It is 06:45. Chanda's mother is waiting at the Northmead Shoprite stop. She opens the Acadowl parent app on her Tecno Spark. She taps "Live Bus" in her daughter's transport tab. A map appears showing a bus icon on Addis Ababa Drive, 1.4km away. "Bus arriving in approximately 4 minutes." She knows she doesn't need to rush Chanda outside yet.

#### Acceptance Criteria

**Frontend — `/(parent)/children/[studentId]/transport/live-map/page.tsx`:**

- [ ] Google Maps embed with:
  - Bus icon: custom SVG school bus icon — animated to face the direction of travel (`heading` from GPS)
  - Parent's stop marker: pulsing pin with stop name
  - School marker (for context)
  - Route polyline in background (faint, showing the full route path)
  - Animated path from bus to parent's stop (dashed line)
- [ ] ETA panel (pinned above map):
  - "Bus arriving at Northmead Shoprite in **4 minutes**" — large font
  - Confidence indicator: "High confidence" / "Estimate only" based on ETA confidence field
  - If run not yet started: "Bus hasn't started yet. Scheduled departure: 06:15"
  - If run completed: "Bus has completed today's run"
  - If run cancelled: full-width red banner "Today's run was cancelled — [reason]"
- [ ] Student boarding status chip below ETA: "Chanda — Not yet at stop" / "Chanda — ✓ Boarded" / "Chanda — Excused today"
- [ ] Map auto-centres on bus position every 30 seconds (configurable). Override: "Lock to my stop" toggle — keeps map centred on the parent's stop instead
- [ ] Performance: entire page must load under 3 seconds on Slow 3G — Google Maps loaded with `loading="async"`, bus data loaded first, map second
- [ ] Data usage indicator: small text at bottom "Live tracking uses ~0.5MB/30min" — transparency for metered data users

---

### ISSUE-289 · Live Map — Admin Multi-Route View

**Type:** Frontend | **Priority:** P1 | **Feature Gate:** `Feature.GPS_TRACKING` | **Estimate:** 0.5 days

#### Description

Admin and head teacher see ALL routes on one map simultaneously — a birds-eye view of the entire fleet in real-time.

#### Acceptance Criteria

**`/(admin)/transport/live/page.tsx`:**

- [ ] Single Google Maps showing all active runs:
  - One bus icon per active run, labelled with route name
  - Each route's polyline shown in the route's assigned colour
  - Bus icon pulses when a new GPS ping arrives
- [ ] Sidebar: list of all routes with status cards: "Route A — 3/8 stops completed — On time" / "Route B — In progress — 8 min delayed"
- [ ] Click a route in sidebar or on map: zooms to that route, shows its detailed run status
- [ ] Real-time: Convex subscriptions on `getLatestPingForRun` for all active runs — updates without refresh
- [ ] "No active runs" state: shown outside run hours with next scheduled run time

---

## Epic 7 — Transport Notifications

> **Goal:** The right notification to the right guardian at the right moment. Three events matter: the bus is near your stop (arriving), your child didn't board (not boarded), and the bus is running late (delay).

---

### ISSUE-290 · Bus Arriving at Stop Notification

**Type:** Backend | **Priority:** P0 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 0.5 days

#### Description

When the bus arrives at a stop, all guardians of students assigned to that stop receive an SMS and/or push notification — if they have opted in. Fired by `recordStopArrival` (ISSUE-284).

#### Acceptance Criteria

**`convex/transport/notifications.ts`:**

- [ ] `sendBusArrivingNotifications` internal action:
  - Called by `recordStopArrival`
  - Fetches all students assigned to this stop (by `stopId` and current `routeId`)
  - For each student: fetches their guardians where `notifPrefs.busArriving: true`
  - SMS: `"[SchoolName]: The bus for Route A is at [StopName] now. [StudentName] should board immediately."`
  - If ETA was computed before arrival (ISSUE-281): sends pre-arrival warning 5 minutes before:
    `"[SchoolName]: Bus arriving at [StopName] in approximately 5 minutes. Please be ready."`
  - Push notification (if PWA installed): same message, higher priority
  - Logs to `notifications` table with `type: 'transport_bus_arriving'`

- [ ] Pre-arrival notification scheduler: after `computeEtasForRun` updates the ETA snapshot, check if any stop's ETA is within `transportConfig.busArrivingNotificationMinutes` — fire pre-arrival SMS if not already sent this run for that stop. Uses `notificationsSent` set stored on `routeEtaSnapshots` to avoid duplicates.

---

### ISSUE-291 · Student Not Boarded Notification

**Type:** Backend | **Priority:** P0 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 0.5 days

#### Description

The highest-priority notification in the transport module. When a student's bus departs their stop without them boarding, their guardian receives an immediate SMS. This answers the most important question: "Did my child get on the bus?"

#### Acceptance Criteria

**`convex/transport/notifications.ts`:**

- [ ] `sendNotBoardedNotification` internal action:
  - Called by `autoMarkNotBoardedForStop` after stop departure
  - Sends to ALL guardians of the student (not filtered by preference — student safety overrides)
  - SMS: `"ALERT: [StudentName] did not board the [SchoolName] bus at [StopName] ([Time]). If unexpected, contact the school immediately: [SchoolPhone]. Route: [RouteName]."`
  - Creates a push notification (highest urgency — same level as sick bay admission)
  - Also notifies admin via in-app: "Chanda Banda did not board Route A at Northmead stop"
  - Logs to `notifications` with `type: 'transport_not_boarded'`

- [ ] Delayed send window: per `transportConfig.notifyGuardianNotBoardedAfterMinutes` (default 15 min) — this gives the driver a window to manually mark late boarders before the SMS fires. The notification is QUEUED on `recordStopDeparture` and fires after the delay window. If driver marks student as `late_boarded` within the window: cancels the queued SMS.
- [ ] Afternoon run: not-boarded on the afternoon run means a student is still at school. SMS modified: `"[StudentName] did not board the afternoon bus at school today. They are still at [SchoolName]. Please arrange collection or contact: [SchoolPhone]."`

---

### ISSUE-292 · Route Delay Notification

**Type:** Backend | **Priority:** P1 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 0.5 days

#### Description

When the bus is running significantly late, all guardians on the route receive a delay notification. This prevents parents from waiting anxiously at stops with no information.

#### Acceptance Criteria

**`convex/transport/notifications.ts`:**

- [ ] `sendRouteDelayNotification` internal action:
  - Triggered when `delayMinutes >= transportConfig.lateArrivalThresholdMinutes` computed during ETA update
  - Sends to all guardians on the route where `notifPrefs.routeDelay: true`
  - SMS: `"[SchoolName]: Route A is running approximately [N] minutes late today. Updated arrival times: [StopName] ~[ETA]. We apologise for the inconvenience."`
  - Throttled: only one delay notification per run — subsequent delay increases do not re-notify
  - Updates `routeRunLog.status: 'delayed'`

- [ ] Recovery notification: if a delayed bus catches up (delay < 5 minutes), sends: `"[SchoolName]: Route A is now back on schedule. Expected arrival times are as originally planned."`

---

### ISSUE-293 · Notification Preferences — Transport Section

**Type:** Frontend | **Priority:** P1 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 0.5 days

#### Description

Guardian notification preferences for transport events — already defined in schema (Sprint 03 ISSUE-161). This issue implements the UI controls and wires them to the preference fields.

#### Acceptance Criteria

**Guardian portal — `/(parent)/settings/notifications/page.tsx` (existing from Sprint 03 ISSUE-161):**

- [ ] Transport section (shown only if child has transport subscription):
  - "Bus arriving at my stop" toggle — `notifPrefs.busArriving`
  - "My child didn't board the bus" toggle — `notifPrefs.studentNotBoarded` — shown as **recommended and ON by default**
  - "Route delays" toggle — `notifPrefs.routeDelay`
  - Note next to `studentNotBoarded`: "⚠ We recommend keeping this on — it's your primary safety alert."
- [ ] `studentNotBoarded` preference cannot be turned off without a confirmation: "Are you sure? This alert tells you if your child didn't board the bus."
- [ ] Separate controls per child (if guardian has multiple children on different routes)

---

## Epic 8 — Delay & Incident Management

---

### ISSUE-294 · Delay Reporting by Driver

**Type:** Backend + Frontend | **Priority:** P1 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 0.5 days

#### Description

The driver can proactively report a delay with a reason — traffic, road conditions, vehicle issue. This triggers the delay notification (ISSUE-292) and creates an announcement (ISSUE-299).

#### Acceptance Criteria

- [ ] Driver PWA: "Report Delay" button in the run screen's "..." menu
- [ ] `reportDelay` mutation:
  - Args: `{ runId, estimatedDelayMinutes, reason: string }`
  - Updates `routeRunLog.status: 'delayed'`, `routeRunLog.delayMinutes`
  - Triggers `sendRouteDelayNotification`
  - Creates a transport announcement if delay > 20 minutes
- [ ] Delay log: `routeRunLog.delayEvents` — array of delay reports during a single run (for patterns analysis)
- [ ] Admin can also report a delay on behalf of the driver (for drivers without smartphones)

---

### ISSUE-295 · Transport Incident Reporting

**Type:** Backend + Frontend | **Priority:** P1 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 1 day

#### Description

Drivers and admins log transport incidents — breakdowns, accidents, near-misses, medical emergencies on the bus. Every incident is a formal record linked to the run and the affected students.

#### Acceptance Criteria

**Schema addition:**

```typescript
transportIncidents: defineTable({
  schoolId: v.id('schools'),
  runId: v.id('routeRunLog'),
  vehicleId: v.id('vehicles'),
  driverStaffId: v.id('staff'),
  incidentType: v.union(
    v.literal('breakdown'),
    v.literal('accident_minor'),
    v.literal('accident_major'),
    v.literal('medical_emergency'), // Student medical issue on bus
    v.literal('road_closure'),
    v.literal('fuel_emergency'),
    v.literal('security_concern'), // Suspicious behaviour near bus
    v.literal('other'),
  ),
  severity: v.union(
    v.literal('low'),
    v.literal('medium'),
    v.literal('high'),
    v.literal('critical'),
  ),
  description: v.string(),
  incidentLat: v.optional(v.number()),
  incidentLng: v.optional(v.number()),
  affectsStudents: v.array(v.id('students')), // Sprint 07 welfare cross-reference
  policeReportNumber: v.optional(v.string()),
  photoUrls: v.optional(v.array(v.string())),
  resolvedAt: v.optional(v.number()),
  resolution: v.optional(v.string()),
  reportedBy: v.id('users'),
  createdAt: v.number(),
})
  .index('by_school', ['schoolId'])
  .index('by_run', ['runId'])
  .index('by_vehicle', ['vehicleId']);
```

**Backend:**

- [ ] `reportTransportIncident` mutation:
  - `severity: 'critical'` or `incidentType: 'accident_major' | 'medical_emergency'`: immediately notifies ALL guardians of students on the bus AND head teacher via SMS
  - `severity: 'high'`: notifies admin in-app, creates school announcement
  - Always: creates `notifications` records for all sent alerts
  - Requires `requirePermission(ctx, Permission.MANAGE_TRANSPORT)` for admin; no permission check for driver role (driver must be able to report from PWA)

**Frontend:**

- [ ] Driver PWA: large "Report Incident" button (red) in the run screen — opens full-screen incident form
- [ ] Incident form: type selector (large icons), severity, description text area, "GPS auto-filled ✓", affected students list (pre-filled with all students currently on bus), photo capture button
- [ ] Admin: `/(admin)/transport/incidents/page.tsx` — all incidents with severity badges, run links, resolution status
- [ ] Critical incident banner: if a critical incident is open and unresolved, a persistent banner on the admin dashboard

---

### ISSUE-296 · Vehicle Maintenance Tracking

**Type:** Backend + Frontend | **Priority:** P2 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 0.5 days

#### Description

Track vehicle service records, defect reports from drivers, and compliance expiry dates. Connects to Sprint 07's compliance dashboard.

#### Acceptance Criteria

**Schema addition:**

```typescript
vehicleMaintenanceLogs: defineTable({
  schoolId: v.id('schools'),
  vehicleId: v.id('vehicles'),
  logType: v.union(
    v.literal('service'),
    v.literal('repair'),
    v.literal('inspection'),
    v.literal('defect_report'), // Driver-reported issue
    v.literal('insurance_renewal'),
    v.literal('road_tax_renewal'),
  ),
  description: v.string(),
  serviceDate: v.string(),
  serviceProvider: v.optional(v.string()),
  costZMW: v.optional(v.number()),
  nextServiceDate: v.optional(v.string()), // Updates vehicle.nextServiceDate
  reportedBy: v.id('users'),
  createdAt: v.number(),
})
  .index('by_vehicle', ['vehicleId'])
  .index('by_school', ['schoolId']);
```

- [ ] `logVehicleMaintenance` mutation: creates record; if `nextServiceDate` set → updates `vehicles.nextServiceDate`
- [ ] Driver defect report: "Report a Vehicle Issue" button on driver home screen (pre-run) → creates `logType: 'defect_report'` → notifies transport manager
- [ ] `/(admin)/transport/vehicles/[vehicleId]/maintenance/page.tsx`: full service history, upcoming service dates, cost summary

---

## Epic 9 — Transport Fee Integration

---

### ISSUE-297 · Transport Fee on Term Invoice

**Type:** Backend | **Priority:** P0 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 0.5 days

#### Description

Verify and document the integration between the transport module and the fee system. Transport fees are included in term invoices through the `overrideLineItems` mechanism — the same approach used by boarding in Sprint 04.

#### Acceptance Criteria

- [ ] Fee structure setup: the bursar creates a `feeType: 'transport'` fee type (Sprint 02 ISSUE-091) with `applicability: 'transport_only'` — visible only to students with `transportSubscriptionStatus: 'subscribed'`
- [ ] `generateInvoiceForStudent` (Sprint 02 ISSUE-095): already handles transport-subscribed students if the fee structure has a `transport` fee type entry — **no code changes to the invoice generator**
- [ ] `verifyTransportFeeInvoices` internal action: runs at term start, checks all transport-subscribed students have a transport fee line item on their invoice. Raises admin alert for any gaps.
- [ ] Integration test: Chanda Banda (transport subscribed, Route A) receives a term invoice with `lineItems: [{ feeType: 'tuition', ... }, { feeType: 'transport', ... }]`. Day student without transport subscription receives invoice with tuition only.

---

### ISSUE-298 · Mid-Term Transport Changes — Invoice Adjustments

**Type:** Backend | **Priority:** P1 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 0.5 days

#### Description

When a student starts or stops using transport mid-term, the fee must be adjusted. Uses Sprint 02's prorated credit note and supplementary invoice infrastructure.

#### Acceptance Criteria

- [ ] `unsubscribeFromTransport` mutation (ISSUE-274 — extending its financial logic):
  - Calculates unused transport days: remaining term days / total term days × transport fee
  - Creates `creditNote` with `type: 'transport_adjustment'` for the prorated amount
  - ZRA credit note submitted (Sprint 02 ISSUE-103)
  - Guardian notified via SMS: "Transport cancellation processed. Credit of ZMW [amount] applied to your account."

- [ ] `subscribeToTransport` mid-term (ISSUE-274 — extending):
  - Calculates remaining days proportion
  - Calls `generateInvoiceForStudent` with transport `overrideLineItems` and `prorationFactor`
  - New invoice submitted to ZRA
  - Guardian notified with new invoice

---

### ISSUE-299 · Transport Fee Payment from Guardian Portal

**Type:** Backend | **Priority:** P1 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 0.5 days

#### Description

Guardian pays the transport fee from the portal using the exact same mobile money flow as all other fee payments — `paymentContext: 'transport'` distinguishes it in reporting.

#### Acceptance Criteria

- [ ] Guardian portal transport tab: "Outstanding transport fee" card shown if transport invoice has unpaid balance
- [ ] "Pay Now" button: calls `initiateAirtelMoneyPayment` or `initiateMtnMomoPayment` (Sprint 03 ISSUE-146/147) with `paymentContext: 'transport'`
- [ ] `processPaymentWebhook` (Sprint 02 ISSUE-107/108): `paymentContext: 'transport'` payments allocated to the transport invoice line item
- [ ] Bursar's daily mobile money report (Sprint 04 ISSUE-204): "Transport fee payments" shown as a separate row from tuition and pocket money
- [ ] ZRA: transport fee payment receipts generated the same as tuition receipts — no special handling needed

---

## Epic 10 — Transport Announcements & Communication

---

### ISSUE-300 · Route Change and Cancellation Announcements

**Type:** Backend + Frontend | **Priority:** P0 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 1 day

#### Description

Admin sends a formal announcement about a route change, temporary stop cancellation, or schedule change. Uses the Sprint 03 announcement system with `category: 'transport'` and `targetAudience: 'transport_parents'` (a new audience value).

#### Acceptance Criteria

**Schema addition — new `targetAudience` value:**

```typescript
// Addition to announcements.targetAudience union (Sprint 03 ISSUE-156)
v.literal('transport_parents'),      // Only guardians with transport-subscribed children
v.literal('route_a_parents'),        // Route-specific: targeted by routeId
```

**Backend — `convex/transport/announcements.ts`:**

- [ ] `createTransportAnnouncement` mutation:
  - Wraps the Sprint 03 `createAnnouncement` mutation with transport-specific defaults
  - `category: 'transport'`, `targetAudience: 'transport_parents'`
  - Optional `routeId` filter: if set, only guardians on that route are notified
  - Requires `requirePermission(ctx, Permission.MANAGE_TRANSPORT)`

- [ ] `getTransportAnnouncementsForGuardian` query: announcements where guardian's child is on the relevant route (or all transport parents if no route filter)

- [ ] Auto-announcement triggers:
  - `cancelRouteRun` (ISSUE-279): auto-creates a cancellation announcement for the affected route
  - `reportDelay` (ISSUE-294): if delay > 20 minutes, auto-creates a delay announcement
  - Manual: admin can always create a route announcement from the transport dashboard

**Frontend — `/(admin)/transport/announcements/page.tsx`:**

- [ ] Quick announcement form: route selector (optional — blank = all transport parents), title, body, SMS toggle
- [ ] Past announcements list with open/resolved status

---

### ISSUE-301 · Driver-to-Guardian Messaging

**Type:** Frontend + Backend | **Priority:** P1 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 0.5 days

#### Description

A driver can send a message to a specific student's guardian — for example, to explain a missed stop or report a student's behaviour on the bus. Uses the Sprint 03 `messageThreads` with `context: 'transport'`.

#### User Story

> Chanda was acting up on the bus and the driver needs to inform her parents. The driver opens Acadowl, finds Chanda's record, and sends a message: "Chanda was standing on the seat while the bus was moving today. Please speak to her about bus safety." The guardian receives an in-app notification and can reply.

#### Acceptance Criteria

- [ ] Driver PWA: on the student boarding list, each student has a "Message Guardian" icon
- [ ] Tapping opens a compose screen — same messaging component as all other portals
- [ ] Creates a `messageThreads` record with `context: 'transport'`, participants: `[driverUserId, guardianUserId]`
- [ ] Guardian receives in-app notification: "New message from your child's bus driver"
- [ ] Admin inbox: all `context: 'transport'` threads visible to admin for safeguarding oversight
- [ ] Thread shown in guardian's Messages tab under a "Transport" filter (Sprint 03 inbox already has tabs)

---

### ISSUE-302 · Transport Section in School-Wide Notifications

**Type:** Frontend | **Priority:** P1 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 0.5 days

#### Description

Surface transport events in the guardian's main notification feed and the admin notification centre. Transport events — not-boarded, delays, cancellations — must appear clearly distinguishable from academic and fee notifications.

#### Acceptance Criteria

- [ ] Guardian notification feed (`/(parent)/notifications/page.tsx` — Sprint 03 ISSUE-158):
  - Transport notifications shown with a 🚌 icon prefix
  - "Not boarded" notifications shown in red with the highest visual weight
  - Tapping a transport notification navigates to the child's transport tab
- [ ] Admin notification centre: transport incidents, delayed runs, vehicle compliance alerts all appear here with `category: 'transport'` badge
- [ ] `type` values added to `notifications` table for transport: `'transport_not_boarded'`, `'transport_bus_arriving'`, `'transport_delay'`, `'transport_incident'`, `'transport_cancellation'`

---

## Epic 11 — Guardian Portal — Transport Tab

---

### ISSUE-303 · Guardian Portal — Transport Tab — Full Implementation

**Type:** Frontend + Backend | **Priority:** P0 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 1.5 days

#### Description

The guardian's complete transport view — already scaffolded in Sprint 03 as the "Transport" entry in the child detail "More" menu. This issue fully implements the tab content.

#### Acceptance Criteria

**`convex/guardian/transport.ts`:**

- [ ] `getTransportTabData` query — all transport data for a guardian's child:
  ```typescript
  {
    isSubscribed: boolean,
    route: {
      name: string,
      vehicleRegistration: string,
      driverName: string,
      morningPickupTime: string,
      afternoonDropTime: string,
      stopName: string,
      stopLandmark: string | null,
    } | null,
    todaysRun: {
      status: 'not_started' | 'in_progress' | 'completed' | 'cancelled',
      boardingStatus: 'boarded' | 'not_boarded' | 'excused' | 'awaiting',
      currentBusPosition: { lat, lng } | null,   // null if GPS off or run not started
      etaToStudentStop: number | null,            // minutes
    } | null,
    thisTermBoardingStats: {
      totalRuns: number,
      boarded: number,
      notBoarded: number,
      excused: number,
      boardingRate: number,            // boarded / (boarded + notBoarded) percent
    },
    recentBoardingHistory: TransportBoardingEvent[], // Last 10 events
    activeExcusals: TransportExcusal[],             // Today and future
    outstandingTransportFee: number,                 // ZMW balance
    transportAnnouncements: Announcement[],          // Recent transport announcements
  }
  ```

**Frontend — `/(parent)/children/[studentId]/transport/page.tsx`:**

- [ ] **Today's Status** section (top, most important):
  - "Bus hasn't started yet" / "Bus is on its way — Chanda boarded ✓" / "Chanda did NOT board the bus today ⚠"
  - "View Live Map" button (if `Feature.GPS_TRACKING` and guardian permission) — navigates to ISSUE-288
  - ETA chip: "Arriving at your stop in ~12 minutes" (if run in progress)

- [ ] **Route Info** card: route name, driver name and phone (tap to call on mobile), morning pick-up time and stop name, afternoon drop-off time and stop, vehicle plate

- [ ] **Boarding History** section: last 10 runs as a list — date, run type, status (boarded ✓ / not boarded ✗ / excused)
  - Term summary: "47/51 runs boarded (92%)"

- [ ] **Excusals** section:
  - "Excuse from bus" button → date picker → morning/afternoon/both → submit `excuseStudentFromTransport`
  - Upcoming excusals list

- [ ] **Transport Fee** card (if outstanding balance): balance display + "Pay Now" button → ISSUE-299 mobile money flow

- [ ] **Announcements** card: last 3 transport announcements for this route

---

### ISSUE-304 · Child Switcher — Transport Status Badge

**Type:** Frontend | **Priority:** P1 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 0.5 days

#### Description

Extend the Sprint 03 child switcher (ISSUE-134) with transport-specific status badges. The data is already returned by `getGuardianDashboardData` — this issue adds the UI elements.

#### Acceptance Criteria

- [ ] `ChildSummaryCard` updated:
  - If `transportSubscriptionStatus === 'subscribed'`: show small bus icon and stop name: "🚌 Northmead Shoprite"
  - If today's morning run is in progress and `boardingStatus === 'boarded'`: show "✓ On bus" in green
  - If `boardingStatus === 'not_boarded'`: show "⚠ Not boarded" in red with pulsing indicator
  - If run completed: show "Delivered ✓" until school hours end
- [ ] `getGuardianDashboardData` (Sprint 03 ISSUE-133) updated to include:
  - `todaysBoardingStatus`: `'boarded' | 'not_boarded' | 'excused' | 'awaiting' | null`
  - `transportStopName`: string | null
    (Returns null if `Feature.TRANSPORT` off — no UI shown)

---

### ISSUE-305 · Boarding History in Student Profile

**Type:** Frontend | **Priority:** P1 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 0.5 days

#### Description

Admin and teacher view of a student's transport boarding history — useful context for attendance investigations (a student claiming they couldn't come to school but their boarding records show they were on the bus).

#### Acceptance Criteria

- [ ] Student profile: new "Transport" tab (shown only if student has transport subscription and `Feature.TRANSPORT` enabled)
  - Route and stop assignment
  - This term's boarding rate with per-run timeline
  - Not-boarded events with dates — cross-referenceable with attendance records
  - "Compare with attendance": overlay boarding events on the attendance calendar heatmap
- [ ] `getTransportHistoryForStudent` query: all boarding events for a student in current term, grouped by week

---

### ISSUE-306 · Guardian Transport Notification Preferences

**Type:** Frontend | **Priority:** P0 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 0.5 days

#### Description

The full notification preferences UI for transport events, wiring the Sprint 03 pre-defined preference fields to a real settings screen. Already covered in ISSUE-293 — this issue ensures guardian-portal-side implementation is complete and tested.

#### Acceptance Criteria

- [ ] `/(parent)/settings/notifications/page.tsx` transport section: all three transport preferences visible and functional (ISSUE-293 confirms this — verify end-to-end)
- [ ] Default preferences on first transport subscription: `studentNotBoarded: true`, `busArriving: true`, `routeDelay: true` — all ON
- [ ] Preferences saved via `updateNotificationPreferences` mutation (Sprint 03 ISSUE-161) — no changes needed to that mutation
- [ ] SMS vs push preference per event: guardian can choose "SMS only", "App notification only", or "Both" per event type (schema addition to `notificationPreferences`)

---

## Epic 12 — Transport Analytics & Reports

---

### ISSUE-307 · Route Performance Analytics

**Type:** Backend + Frontend | **Priority:** P1 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 1 day

#### Description

Per-route on-time performance, boarding rates, and incident frequency — the data that helps admin optimise routes, justify vehicles, and present to the school board.

#### Acceptance Criteria

**`convex/transport/analytics.ts`:**

- [ ] `getRoutePerformanceReport` query — per route per term:
  ```typescript
  {
    totalRuns: number,
    onTimeRuns: number,               // delayMinutes < lateArrivalThreshold
    averageDelayMinutes: number,
    worstDelayMinutes: number,
    boardingRate: number,             // % students who boarded across all runs
    notBoardedEvents: number,
    excusedEvents: number,
    incidentCount: number,
    byIncidentType: Record<string, number>,
    punctualityTrend: Array<{ weekNumber: number, onTimePercent: number }>,
  }
  ```

**`/(admin)/transport/analytics/page.tsx`:**

- [ ] Route selector at top; defaults to all routes
- [ ] Punctuality trend chart: recharts `LineChart` — on-time % by week
- [ ] Route comparison table: all routes ranked by on-time performance, boarding rate, and incident count
- [ ] "Worst performing route" banner if any route has < 70% on-time rate

---

### ISSUE-308 · Student Transport Attendance Report

**Type:** Backend + Frontend | **Priority:** P1 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 0.5 days

#### Description

Per-student transport boarding records — useful for identifying students who regularly miss the bus (either a compliance issue or a welfare concern feeding Sprint 07).

#### Acceptance Criteria

- [ ] `getStudentTransportReport` query: per student — total expected runs, boarded count, not-boarded count, excused count, boarding rate %, trend
- [ ] `/(admin)/transport/reports/student-boarding/page.tsx`:
  - Table sorted by boarding rate ascending (worst first)
  - Students with < 80% boarding rate highlighted in amber
  - Students with < 60% highlighted in red — flagged for pastoral follow-up
  - CSV export: full report for the term
- [ ] **Progress snapshot update**: Friday cron updated to include:
  ```typescript
  // Added to studentProgressSnapshots
  transportBoardingRatePercent: v.optional(v.number()),  // null if no transport
  transportNotBoardedCount: v.optional(v.number()),
  ```
  Sprint 07 at-risk engine reads these — consistent pattern of not boarding is a truancy signal.

---

### ISSUE-309 · MoE Transport Return Data

**Type:** Backend | **Priority:** P1 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 0.5 days

#### Description

The Ministry of Education requires schools to report annual transport statistics. Scaffold the queries for Sprint 07's MoE reporting module.

#### Acceptance Criteria

- [ ] `getMoeTransportReturn` query (joins `convex/reports/moe.ts` from Sprint 01 ISSUE-090):
  ```typescript
  {
    totalStudentsUsingTransport: number,
    totalVehicles: number,
    totalRoutes: number,
    totalRouteStops: number,
    routeStopsWithGpsCoordinates: number,
    averageBoardingRatePercent: number,
    totalTransportIncidents: number,
    byIncidentType: Record<string, number>,
    vehicleInsuranceCompliance: number,   // % vehicles with valid insurance
  }
  ```
- [ ] Returns placeholder/partial data until Sprint 07 implements the full MoE return

---

### ISSUE-310 · Transport Financial Summary

**Type:** Backend + Frontend | **Priority:** P1 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 0.5 days

#### Description

A finance-module view of transport revenue — how much the school collects in transport fees vs what the transport operation costs.

#### Acceptance Criteria

- [ ] `getTransportFinancialSummary` query:
  - Transport fee revenue this term (from `invoices` where `lineItems[].feeType === 'transport'`)
  - Transport fee collected (from `payments` allocated to transport invoices)
  - Outstanding transport fees (outstanding balance per route)
  - Per-route revenue breakdown
- [ ] `/(admin)/transport/reports/financial/page.tsx`: revenue summary with route breakdown
- [ ] Bursar dashboard (Sprint 02 `/(admin)/fees/dashboard`): "Transport Revenue" added as a card — reads from this query

---

## Epic 13 — Admin Transport Dashboard

---

### ISSUE-311 · Admin Transport Home Dashboard

**Type:** Frontend + Backend | **Priority:** P0 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 1 day

#### Description

The transport manager's home screen — a real-time operational overview of all routes and vehicles. Answers "what is happening with transport right now?"

#### Acceptance Criteria

**`convex/transport/adminDashboard.ts`:**

- [ ] `getTransportAdminDashboard` query — single query for everything:
  ```typescript
  {
    activeRuns: Array<{
      routeName: string,
      runType: 'morning' | 'afternoon',
      status: string,
      studentsBoarded: number,
      studentsExpected: number,
      notBoardedCount: number,
      currentDelayMinutes: number,
      hasOpenIncident: boolean,
      lastPingAt: number | null,
      etaToSchool: number | null,         // For morning runs
    }>,
    todaysStats: {
      totalRuns: number,
      completedRuns: number,
      cancelledRuns: number,
      totalNotBoarded: number,
      openIncidents: number,
    },
    vehicleAlerts: Vehicle[],             // Compliance issues
    upcomingRuns: Array<{ routeName, scheduledTime, driverName }>,
    recentIncidents: TransportIncident[],
    pendingSubscriptionRequests: number,
  }
  ```

**`/(admin)/transport/page.tsx`:**

- [ ] Active runs grid: each run as a card with live boarding progress bar ("18/28 boarded"), status badge, delay indicator, "View on Map" link
- [ ] Not-boarded alert: if any student is not-boarded and the stop has been passed, shows a red alert: "3 students not boarded this morning"
- [ ] Upcoming runs section: next scheduled runs (afternoon departure times)
- [ ] Vehicle compliance alerts (expiring insurance/road tax): amber cards
- [ ] Live map shortcut: "View All Routes Live" → ISSUE-289
- [ ] Quick actions: "Create Announcement", "Report Incident", "Cancel a Run"

---

### ISSUE-312 · Transport Calendar and Run History

**Type:** Frontend + Backend | **Priority:** P1 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 0.5 days

#### Description

A calendar view of all past and scheduled runs. Admin can click any date to see that day's run summaries, boarding data, and any incidents.

#### Acceptance Criteria

- [ ] `/(admin)/transport/calendar/page.tsx`:
  - Monthly calendar view — each school day shows: runs completed (green), delayed (amber), cancelled (red), or no runs (gray for weekends/holidays)
  - Click a day: side panel shows all runs for that day with summary stats
  - Click a specific run: navigates to run detail (boarding list, GPS replay, incidents)
- [ ] `getRunsForDateRange` query: all `routeRunLog` records in a date range with summary stats

---

### ISSUE-313 · Route Setup Wizard — First-Time Configuration

**Type:** Frontend | **Priority:** P1 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 0.5 days

#### Description

A guided setup wizard for schools enabling transport for the first time. Walks the admin through adding vehicles, defining routes, and assigning students in the right sequence.

#### Acceptance Criteria

- [ ] Triggered when `Feature.TRANSPORT` is enabled with no existing routes or vehicles
- [ ] Step 1 — Add Vehicles: "Register your school's vehicles" — vehicle form, can add multiple
- [ ] Step 2 — Add Routes: "Define your routes" — simplified route form (full builder available after wizard)
- [ ] Step 3 — Assign Drivers: match drivers to vehicles
- [ ] Step 4 — Assign Students: "Which students use transport?" — bulk select from student list, route assignment
- [ ] Step 5 — Configure Fee: "Set up the transport fee" — links to fee structure configuration (Sprint 02)
- [ ] Completion: "Your transport module is ready. 3 routes configured, 87 students assigned."

---

### ISSUE-314 · Driver PWA — Offline Sync Audit

**Type:** Backend | **Priority:** P0 | **Feature Gate:** `Feature.TRANSPORT` | **Estimate:** 0.5 days

#### Description

An audit trail that verifies all offline-queued GPS pings and boarding events synced correctly after a run with connectivity gaps. Important for data integrity — a missed sync would leave gaps in GPS tracks and could cause incorrect not-boarded notifications.

#### Acceptance Criteria

- [ ] `verifyRunDataIntegrity` internal action — called on `completeRouteRun`:
  - Counts GPS pings for the run: if gap of > 5 minutes between consecutive pings, flags it as a `GpsGap` event
  - Checks all students in `studentTransportHistory` for this route/term have a boarding event for today's run. Any missing: creates `status: 'not_boarded'`, `markedBy: 'auto_absent'` with a note "Auto-filled — no driver record received"
  - Creates a `runIntegrityReport` sub-document on `routeRunLog`: `{ gpsGaps: N, autoFilledBoardingEvents: N, syncedAt }`

- [ ] Admin run detail view: integrity report shown as a subtle info card: "2 GPS gaps detected (possible signal loss). 0 boarding records auto-filled."
- [ ] If `autoFilledBoardingEvents > 3`: flags the run for admin review with amber badge — unusual to have many auto-filled events

---

## Dependency Graph

```
ISSUE-268 (Vehicle Registry)
    └─► ISSUE-270 (Driver Assignment)

ISSUE-269 (Route Builder)
    └─► ISSUE-272 (Student Route Assignment)
    └─► ISSUE-273 (Bulk Assignment UI)
    └─► ISSUE-274 (Subscription Management)

ISSUE-271 (Transport Settings) ── must be done early (config drives all other behaviour)

ISSUE-275 (Driver PWA Auth + Route Load) ── depends on ISSUE-268, 269, 272
    └─► ISSUE-276 (Run Start + Safety Check)
            └─► ISSUE-277 (Active Run Screen)
            └─► ISSUE-278 (Run Completion)
            └─► ISSUE-279 (Run Cancellation)

ISSUE-280 (GPS Ping Collection) ── depends on ISSUE-276 (runId)
    └─► ISSUE-281 (ETA Computation)
    └─► ISSUE-282 (GPS Replay)

ISSUE-283 (Boarding Events Schema) ── depends on ISSUE-276 (runId)
    └─► ISSUE-284 (Stop Arrival/Departure Events)
    └─► ISSUE-285 (Barcode Scan Boarding)
    └─► ISSUE-286 (Excusal Management)

ISSUE-287 (Live Map Backend) ── depends on ISSUE-280 (GPS), 283 (boarding)
    └─► ISSUE-288 (Guardian Live Map)
    └─► ISSUE-289 (Admin Multi-Route Map)

ISSUE-290 (Bus Arriving Notification) ── depends on ISSUE-284
ISSUE-291 (Not Boarded Notification) ── depends on ISSUE-283
ISSUE-292 (Delay Notification) ── depends on ISSUE-281
ISSUE-293 (Guardian Prefs UI)

ISSUE-294 (Delay Reporting)
ISSUE-295 (Incident Reporting) ── depends on ISSUE-276 (runId)
ISSUE-296 (Maintenance Tracking)

ISSUE-297 (Transport Fee Integration) ── verify Sprint 02 fee engine, no code changes
ISSUE-298 (Mid-Term Adjustments) ── depends on Sprint 02 credit note flow
ISSUE-299 (Portal Fee Payment) ── depends on Sprint 03 mobile money actions

ISSUE-300 (Route Announcements) ── depends on Sprint 03 announcements table
ISSUE-301 (Driver Messaging) ── depends on Sprint 03 messageThreads
ISSUE-302 (Notification Feed Integration)

ISSUE-303 (Guardian Transport Tab) ── depends on most above issues
    └─► ISSUE-304 (Child Switcher Badges)
    └─► ISSUE-305 (Student Profile Transport Tab)
    └─► ISSUE-306 (Notification Prefs)

ISSUE-307 (Route Performance Analytics) ── depends on routeRunLog data
ISSUE-308 (Student Transport Report) ── feeds progress snapshots
ISSUE-309 (MoE Data)
ISSUE-310 (Financial Summary)

ISSUE-311 (Admin Dashboard) ── depends on all active run data
ISSUE-312 (Transport Calendar)
ISSUE-313 (Setup Wizard) ── can be done last
ISSUE-314 (Offline Sync Audit) ── depends on ISSUE-278 (run completion)
```

---

## Schema Additions in This Sprint

**New tables:**

| New Table                 | Defined In |
| ------------------------- | ---------- |
| `studentTransportHistory` | ISSUE-272  |
| `transportExcusals`       | ISSUE-286  |
| `routeRunLog`             | ISSUE-276  |
| `stopEvents`              | ISSUE-284  |
| `transportBoardingEvents` | ISSUE-283  |
| `routeEtaSnapshots`       | ISSUE-281  |
| `transportIncidents`      | ISSUE-295  |
| `vehicleMaintenanceLogs`  | ISSUE-296  |

**Fields added to existing tables:**

| Table                      | New Fields                                                                                                                                        | Issue     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| `routes`                   | Full schema (name, status, stops array with stopId/lat/lng/scheduledTimes, morningVehicleId, afternoonVehicleId, colour, operatingDays, etc.)     | ISSUE-269 |
| `vehicles`                 | Full schema (registrationPlate, vehicleType, driverStaffId, insuranceExpiry, roadTaxExpiry, nextServiceDate, etc.)                                | ISSUE-268 |
| `gpsPings`                 | Full schema (lat, lng, accuracy, speed, heading, runId, currentStopIndex, isOffline, isDiscarded, timestamp)                                      | ISSUE-280 |
| `staff`                    | `assignedVehicleId`, `driversLicenceNumber`, `driversLicenceExpiry`, `driversLicenceClass`                                                        | ISSUE-270 |
| `schools`                  | `transportConfig`                                                                                                                                 | ISSUE-271 |
| `studentProgressSnapshots` | `transportBoardingRatePercent`, `transportNotBoardedCount`                                                                                        | ISSUE-308 |
| `announcements`            | `targetAudience: 'transport_parents'`, `routeId` optional filter                                                                                  | ISSUE-300 |
| `notifications`            | New `type` values: `'transport_not_boarded'`, `'transport_bus_arriving'`, `'transport_delay'`, `'transport_incident'`, `'transport_cancellation'` | ISSUE-302 |

---

## Definition of Done

All Sprint 00–05 DoD criteria apply, plus:

- [ ] **Feature gate isolation tested**: School with `Feature.TRANSPORT` disabled — no transport nav items, `/(driver)/` route group returns 401 not 403 (driver role doesn't exist), `routes` and `vehicles` tables are empty (or ignored). Tested against Kabulonga seed school.

- [ ] **GPS_TRACKING isolation tested**: School with `Feature.TRANSPORT` enabled but `Feature.GPS_TRACKING` disabled — route runs work, boarding tracking works, live map shows "GPS tracking not enabled for this school." No `gpsPings` records created.

- [ ] **Offline driver run tested end-to-end**: Start a run in Chrome → DevTools → Offline. Mark 5 students at stop 1. "Depart Stop." Mark 3 at stop 2. DevTools → Online. Verify: GPS pings flushed from IndexedDB to Convex, all boarding events synced, `verifyRunDataIntegrity` reports no gaps. Test on real Android device with Airtel SIM in flight mode.

- [ ] **Not-boarded SMS fires with correct delay**: `recordStopDeparture` is called at T=0. Student not marked boarded. At T=`notifyGuardianNotBoardedAfterMinutes`, SMS fires to guardian. If driver marks student as `late_boarded` at T=10 (before default 15-min window), SMS must be cancelled. Tested in integration test with mocked clock.

- [ ] **ETA computation verified**: Route with 8 stops, bus currently at stop 3, speed 30 km/h. Run `computeEtasForRun`. Verify ETAs for stops 4–8 are computed using Haversine + roadFactor, with dwell time added per stop. Unit tested with known GPS coordinates.

- [ ] **Transport fee integration verified**: Term invoice for Chanda Banda (transport subscribed, Route A) contains a `feeType: 'transport'` line item. Term invoice for day student without transport subscription does NOT. ZRA VSDC called once per invoice (not separately for transport line item). Verified in integration test against dev ZRA mock.

- [ ] **Guardian live map performance verified**: `getLiveBusDataForGuardian` query returns in < 150ms with a run active and 30 GPS pings in the table. Verified via Convex dashboard query timing.

- [ ] **`studentProgressSnapshots.transportBoardingRatePercent` populated by Friday cron**: After 5 days of runs (2 runs/day = 10 boarding events per student), verify snapshot has correct boarding rate. Students with no transport subscription have `null` — not 0.

- [ ] **Driver PWA installable**: On Android Chrome — visiting `/(driver)/` shows "Add to Home Screen" prompt. After install, app launches in standalone mode (no browser chrome). Verified on physical device.

- [ ] **School holiday skipped**: `schoolEvents` record with `type: 'holiday'` for tomorrow. `getDriverRunsForToday` query returns `{ noRun: true }` for that date. Driver PWA shows "No run scheduled — school holiday."

---

## Sprint 06 → Sprint 07 Handoff Checklist

Before Sprint 07 (College Mode + AI) begins, verify:

- [ ] `studentProgressSnapshots.transportBoardingRatePercent` and `.transportNotBoardedCount` are being written by the Friday cron — Sprint 07 at-risk engine reads these as truancy signals
- [ ] `routeRunLog` has real records from seed data — at least 10 runs per route over 2 weeks — Sprint 07 on-time performance reports need historical data to be meaningful
- [ ] `gpsPings` table has real records with `isOffline` field accurately set — Sprint 07 analytics distinguish online vs offline pings to assess network conditions on routes
- [ ] `transportIncidents.affectsStudents` is populated for all incidents — Sprint 07 welfare analytics cross-reference students involved in incidents
- [ ] `vehicles.insuranceExpiry` and `vehicles.nextServiceDate` are populated for all seed vehicles — Sprint 07 compliance dashboard immediately has data to show
- [ ] `studentTransportHistory` has term-scoped records — Sprint 07 can compute how many consecutive terms each student has used transport (pattern used in MoE return)
- [ ] The `announcements` table has records with `category: 'transport'` and `targetAudience: 'transport_parents'` — Sprint 07 MoE data export includes announcement history
- [ ] `Feature.GPS_TRACKING` can be toggled off independently of `Feature.TRANSPORT` — the live map goes away but route management, boarding tracking, fees, and notifications all continue working without GPS
- [ ] All transport seed data is present: Chengelo school has 3 routes, 8 vehicles, 4 drivers, 87 transport students assigned to stops, 2 weeks of boarding history and GPS tracks — Sprint 07 at-risk engine needs this data to validate the truancy detection algorithm
- [ ] `aiUsageLog` table (Sprint 05) is ready to receive Sprint 07 transport-optimisation AI calls — the table is designed for any feature, not just quiz generation

---

_Acadowl Development Guide — Sprint 06 — Transport Module_
_Last updated: 2025 | Previous: Sprint 05 — LMS & Library | Next: Sprint 07 — College Mode + AI At-Risk Engine_

