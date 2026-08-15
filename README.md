# CareLink

CareLink is a full-stack healthcare app that connects patients and families with hospital attendants, home nurses, and blood donors across North-East India.

## Overview

Built as a dual-role mobile experience — one flow for **Patients/Family** looking for care, and one for **Attendants/Nurses** looking for work — CareLink handles the entire lifecycle from booking a request to job completion and rating.

## Features

- **Role-aware navigation** — separate tab experiences for Patient/Family vs. Attendant/Nurse roles
- **Booking system** — request forms with date/time pickers for scheduling attendant or nurse visits
- **Open requests marketplace** — attendants/nurses can browse and accept open care requests
- **Job completion & rating flow** — star-based rating system after job completion
- **Attendant tier progression** — a 4-tier system (Tier 1–4) based on completed jobs and ratings, rewarding reliable caregivers
- **Blood donor directory** — searchable directory to connect patients with blood donors
- **Platform fee configuration** — centralized fee logic (7.5% for hospital attendants, 9.5% for home nurses)

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native (Expo SDK 54), Expo Router |
| Language | TypeScript |
| Backend | Node.js |
| Database | Supabase (PostgreSQL, Mumbai region) |
| Local Storage | AsyncStorage |
| Build | EAS Build (Android APK) |

## Architecture Notes

- **Dual-role design**: rather than separate apps, a single codebase branches navigation and UI based on the logged-in user's role, keeping shared logic (auth, booking, ratings) centralized.
- **Tier system**: attendant tiers are computed from job count and average rating, incentivizing quality of service over time.
- **Fee config**: platform commission rates are defined in a single config source so pricing logic isn't scattered across screens.

## Getting Started

```bash
npm install
npx expo start
```

You'll need a `.env` file with your own Supabase project URL and anon key (see `.env.example`) to run this locally — these are intentionally excluded from version control.

## Status

APK builds successfully via EAS Build. Currently in active debugging phase, with a phased rollout planned via WhatsApp/Expo tunnel distribution and direct hospital outreach ahead of a Play Store submission.

## Author

Built by Arunim Gogoi.
