# Veggie Ville - Front-End & SQLite Version

Welcome to the **Front-End-SQLite-Version** branch of Veggie Ville! This branch focuses on polishing the Single Page Application (SPA) frontend user experience and fully solidifying a local, persistent SQLite database integration for authentication and state management.

## 🌟 Distinct Features (vs. Main Branch)

### 1. Robust SQLite Persistence
- **Physical Disk Storage**: Migrated the database connection to write permanently to a local `./database.sqlite` file, preventing ephemeral data wipes across server restarts.
- **Auth Integrity**: Resolved critical SQLite boolean compatibility bugs (`is_active = 1` vs `TRUE`) that previously broke the register-to-login flow.
- **Fortified Inserts**: Added strict validation boundaries to catch and explicitly reject silent database failures during registration.

### 2. Frontend Layout & UI Parity
- **Responsive Auth Views**: Overhauled the `/login` and `/register` pages with a balanced, two-column (50/50 split) flexbox design featuring a clear value proposition.
- **Cleaned Error Modals**: Intercepted raw JSON error dumps during authentication failures, replacing them with clean, human-readable strings and improved modal geometry.
- **UI Consolidation**: Removed the global footer from auth views to streamline the onboarding experience.
- **Password Toggles**: Implemented a lightweight, vanilla JS "Show/Hide" password visibility toggle on all authentication forms.

### 3. Consolidated Browse & Filter UX
- **Sidebar Consolidation**: Moved the Search bar and "Clear all" actions completely into the left sidebar, eliminating top-bar clutter.
- **Reactive State Management**:
  - The "Clear all" button natively resets DOM states (checkboxes, sliders, search) and immediately re-fetches grid data.
  - Wired up the Sort dropdown to dynamically sort the current array of products by price or date.
  - The static results counter now updates dynamically (e.g., "24 results") based on the actively filtered array length.
- **UX Routing Flow**: Enforces an explicit SPA redirect to the `/login` page with an alert after a successful account creation, rather than silently auto-logging the user in.

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js (v16+ recommended)
- npm

### Installation & Setup

1. **Clone the repository and checkout the branch:**
   ```bash
   git clone https://github.com/tmno-O/Veggie_Ville.git
   cd Veggie_Ville
   git checkout Front-End-SQLite-Version
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **(Optional) Seed the Database:**
   If this is your first time running the app, you may want to seed the SQLite database with initial product and user data:
   ```bash
   node seed.js
   ```

4. **Start the Application:**
   ```bash
   node app.js
   ```
   *(Alternatively, use `npm run dev` or `npm start` if defined in `package.json`)*

5. **View the App:**
   Open your browser and navigate to:
   **[http://localhost:3000](http://localhost:3000)**

---

**Built with:** Node.js, Express, SQLite, and Vanilla JS / CSS.
