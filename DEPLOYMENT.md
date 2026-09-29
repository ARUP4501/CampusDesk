# CampusDesk Deployment Guide

This guide details steps for deploying CampusDesk locally via Docker Compose or onto a free cloud host with default HTTPS URLs.

---

## 1. Local Deployment with Docker Compose

CampusDesk runs with a single command on any machine with Docker installed.

### Prerequisites
- Docker (v20.10+)
- Docker Compose (v2.0+)

### Steps to Run

1. **Clone or navigate to the repository:**
   ```bash
   cd campusdesk
   ```

2. **Start the application and PostgreSQL database:**
   ```bash
   docker compose up --build -d
   ```

3. **Access the web portal:**
   Open `http://localhost:5000` in any web browser.

4. **View live logs:**
   ```bash
   docker compose logs -f app
   ```

5. **Stop containers:**
   ```bash
   docker compose down
   ```

---

## 2. Cloud Deployment (Free Default HTTPS Host)

CampusDesk uses the `APP_URL` environment variable to configure session cookies, Web Push endpoints, and CORS dynamically. No custom domain configuration is required.

### Deployment on Render.com (Web Service + Managed PostgreSQL)

1. **Create Free PostgreSQL Database:**
   - Go to Render Dashboard and click **New + > PostgreSQL**.
   - Set Database Name to `campusdesk_db` and select the Free tier.
   - Copy the provided Internal/External `DATABASE_URL`.

2. **Create Web Service:**
   - Click **New + > Web Service** and connect this repository.
   - Select **Docker** as the runtime environment.
   - Add Environment Variables:
     - `PORT`: `5000`
     - `NODE_ENV`: `production`
     - `DATABASE_URL`: *(paste connection string from Step 1)*
     - `APP_URL`: `https://<your-service-name>.onrender.com`
     - `JWT_SECRET`: *(32-character random string)*
     - `VAPID_PUBLIC_KEY`: `BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSPOSnfMSC2101MmVC30RE4FTC4m5006_5PU`
     - `VAPID_PRIVATE_KEY`: `1wR7_2L-rW56G2oQ_17uX_14l_11O_00l-57G_99l-4`
     - `SHOW_SAMPLE_BANNER`: `true`

3. **Deploy:**
   - Click **Create Web Service**.
   - Render will build the Docker container, run database migrations and seed records automatically, and expose the app with free SSL/HTTPS on `https://<your-service-name>.onrender.com`.

---

## 3. Local Development (Without Docker)

1. **Install Root Dependencies:**
   ```bash
   npm install
   ```

2. **Install Server & Client Dependencies:**
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

3. **Configure Environment:**
   ```bash
   cp .env.example server/.env
   ```

4. **Initialize Database:**
   ```bash
   cd server
   npx prisma generate
   npx prisma db push
   npx tsx prisma/seed.ts
   ```

5. **Start Development Servers:**
   ```bash
   cd ..
   npm run dev
   ```
   Client will be available at `http://localhost:5173` and API at `http://localhost:5000`.
