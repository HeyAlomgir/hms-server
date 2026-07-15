# CarePulse — Hospital Management System 🏥

CarePulse is a full-stack hospital management platform that connects **patients**, **doctors**, and **admins** in one system — enabling doctor discovery, appointment booking with online payments, and role-based dashboards for managing the entire healthcare workflow.

---

## 🚀 Tech Stack

**Frontend**
- [Next.js](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [HeroUI](https://heroui.com/) — component library
- [Framer Motion](https://www.framer.com/motion/) — animations
- [React Hot Toast](https://react-hot-toast.com/) — notifications
- [Recharts](https://recharts.org/) — analytics charts

**Backend**
- [Express.js](https://expressjs.com/) + TypeScript
- [MongoDB](https://www.mongodb.com/) (Atlas) — database
- [Stripe](https://stripe.com/) — payment processing

**Authentication**
- [Better Auth](https://www.better-auth.com/) — email/password + Google OAuth
- Role-based access control (`patient`, `doctor`, `admin`)

**Other Integrations**
- [ImgBB](https://imgbb.com/) — image hosting for profile photos

---

## 👥 User Roles & Features

### 🧑‍⚕️ Patient
- Browse and search doctors by specialization
- View doctor profiles (availability, fee, ratings, reviews)
- Book appointments on available dates with secure Stripe payment
- Bookmark favorite doctors
- Leave ratings & reviews after consultation
- View personal appointment history and status
- Personal analytics dashboard

### 👨‍⚕️ Doctor
- Manage personal profile (photo, specialization, degree, description, fee, availability)
- Set working days and time slots
- View and manage incoming appointments (Approve / Reject / Mark as Completed)
- View analytics dashboard — total appointments, completed count, revenue estimate, booking trends
- Change account password

### 🛠️ Admin
- Approve or reject new doctor registrations
- View and manage all doctors (add, approve, delete)
- View and manage all patients (view appointment history, ban/unban)
- Oversee all appointments platform-wide (search, filter by status, manually cancel)
- Platform-wide analytics — total doctors, patients, appointments, monthly trends

---

## 🏠 Home Page Sections

1. **Hero Slider** — banner-style carousel of approved doctors with booking CTA
2. **Platform Stats** — total doctors, patients, appointments, and average rating
3. **Specializations Grid** — browse doctors by specialty
4. **How It Works** — 3-step booking guide
5. **Top Rated Doctors** — highest-rated doctors based on patient reviews
6. **Patient Testimonials** — real reviews from patients
7. **Call-to-Action Banner** — sign-up / browse doctors prompt

---

## 📁 Project Structure

```
hms-client/               # Next.js frontend
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   │   ├── patient/
│   │   │   ├── doctor/
│   │   │   └── admin/
│   │   ├── doctors/[id]/
│   │   ├── signin/
│   │   ├── signup/
│   │   └── api/
│   │       └── auth/            # Better Auth routes
│   ├── components/
│   │   ├── home/                # Home page section components
│   │   ├── PaymentForm.tsx
│   │   └── Footer.tsx
│   ├── lib/
│   │   ├── auth.ts              # Better Auth server config
│   │   ├── auth-client.ts       # Better Auth client
│   │   └── stripe.ts
│   └── middleware.ts            # Route protection

hms-server/                # Express backend
└── server.ts                # All API routes (doctors, appointments, reviews, bookmarks, stats)
```

---

## 🔑 Environment Variables

### Frontend (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_IMGBB_API_KEY=your_imgbb_api_key
MONGO_DB_URI=your_mongodb_connection_string
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### Backend (`.env`)

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
STRIPE_SECRET_KEY=your_stripe_secret_key
```

---

## ⚙️ Getting Started

### 1. Clone the repository

```bash
git clone <repo-url>
cd hms-client
```

### 2. Install dependencies

```bash
# Frontend
cd hms-client
npm install

# Backend
cd ../hms-server
npm install
```

### 3. Set up environment variables

Create `.env.local` in `hms-client/` and `.env` in `hms-server/` using the variables listed above.

### 4. Run the development servers

```bash
# Backend (from hms-server/)
npm run dev

# Frontend (from hms-client/, in a separate terminal)
npm run dev
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

---

## 🗄️ Database Collections (MongoDB)

| Collection      | Purpose                                      |
|------------------|-----------------------------------------------|
| `user`           | Better Auth users (patients, doctors, admins) |
| `account`        | Better Auth credentials (hashed passwords)    |
| `session`        | Better Auth sessions                          |
| `doctor`         | Doctor profiles (specialization, fee, availability) |
| `appointments`   | Appointment bookings                          |
| `reviews`        | Doctor ratings & reviews                      |
| `bookmarks`      | Patient-saved doctors                         |

---

## 🔐 Authentication Flow

- **Patients** sign up directly via email/password or Google.
- **Doctors** are onboarded by an admin, who creates their auth account (with a temporary password) and doctor profile in one step, linked via `userId`.
- **Admin** accounts are created manually / seeded.
- Route protection is handled via Next.js middleware — dashboard routes require an active session.

---

## 💳 Payments

Appointment booking is paid via **Stripe**. The flow:
1. Patient selects a doctor and an available date.
2. A payment intent is created on the backend.
3. Card details are confirmed via Stripe Elements on the frontend.
4. On successful payment, the appointment is saved with `status: "pending"`, awaiting doctor approval.

---

## 📌 Notes

- All API requests are made to the Express backend; ensure `NEXT_PUBLIC_API_URL` (or your proxy configuration) points to the correct backend URL for your environment.
- Doctor and patient profile images are uploaded via ImgBB and referenced by URL.
- Timezone-sensitive analytics (e.g., daily appointment trends) should account for `Asia/Dhaka` if deploying for a Bangladesh-based audience.

---

## 📄 License

This project is for educational/portfolio purposes.