# Élan Atelier — Direct MongoDB Collection JSON Data

This folder contains direct MongoDB collection exports in JSON format that you can import into your database using `mongoimport`, MongoDB Compass, or the automated import script.

---

## 📁 Files Included
- `salonconfigs.json`: Élan Atelier salon configuration (hours, cutoff, PIN).
- `services.json`: 6 realistic grooming services with pricing and durations.
- `barbers.json`: 5 professional stylists with realistic avatars and statuses.
- `queuetokens.json`: Active live queue tokens with real customer sessions (In chair, Waiting).

---

## 🚀 Method 1: Automated Node Import Script (Fastest)

Run the import script directly from your terminal:

```bash
cd server
npm run import-data
```

This connects to your `MONGO_URI` (defined in `.env`), wipes old dummy collections, and populates the clean data.

---

## 🛠️ Method 2: Official `mongoimport` CLI

If you have MongoDB Database Tools installed, run these commands:

```bash
# Set your database name (default: salon-queue)
DB_NAME="salon-queue"

mongoimport --db $DB_NAME --collection salonconfigs --file salonconfigs.json --jsonArray --drop
mongoimport --db $DB_NAME --collection services --file services.json --jsonArray --drop
mongoimport --db $DB_NAME --collection barbers --file barbers.json --jsonArray --drop
mongoimport --db $DB_NAME --collection queuetokens --file queuetokens.json --jsonArray --drop
```

---

## 🧭 Method 3: MongoDB Compass

1. Open **MongoDB Compass** and connect to your cluster.
2. Select or create your database (e.g. `salon-queue`).
3. Click on or create each collection (`salonconfigs`, `services`, `barbers`, `queuetokens`).
4. Click **Add Data** ➔ **Import File** ➔ Select the corresponding `.json` file ➔ Choose **JSON** ➔ Click **Import**.
