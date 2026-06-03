# Veggie Ville

Community-driven marketplace for neighbors to buy, sell, and swap homegrown produce.

## Local Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   Copy `.env.example` to `.env` and update the values.
   ```bash
   cp .env.example .env
   ```

3. **Database setup:**
   Import `schema.sql` into your MySQL instance.
   ```bash
   mysql -u root -p < schema.sql
   ```

4. **Seed data:**
   ```bash
   node seed.js
   ```

5. **Start the server:**
   ```bash
   npm start
   ```

## Testing
Run the full test suite with:
```bash
npm test
```

## Tech Stack
- **Backend:** Node.js, Express, MySQL
- **Frontend:** Vanilla JS, CSS, HTML (SPA)
- **Security:** JWT (HTTP-only cookies), password hashing (bcryptjs)
