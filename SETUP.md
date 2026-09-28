# Fashion Seminar Demo — Sharing and Local Setup

This demo explores how shopping agents assess real fashion product detail pages against a shopper’s request.

The project archive includes the app and three example queries. Saved reports live in a separate database and are not included in the archive.

## For the sender: package the project

Run this in Terminal on the Mac containing the project:

```bash
cd "/Users/mtabas/Documents/Fashion Seminar Demo"

tar \
  --exclude='./node_modules' \
  --exclude='./.next' \
  --exclude='./.git' \
  --exclude='./.env' \
  --exclude='./.env.*' \
  -czf ~/Downloads/fashion-seminar-demo.tar.gz .
```

Send `fashion-seminar-demo.tar.gz` and this guide to your colleague. The command excludes local passwords, API keys, installed dependencies and build files. The recipient creates their own `.env` below.

## For the recipient: prerequisites

Install:

- Node.js 22, including npm.
- Docker Desktop; start it before continuing.
- Obtain your own Gemini API key with access to the models used by the app.

These commands are for macOS/Linux Terminal or Windows WSL. On Windows, enable Docker Desktop integration with your WSL distribution.

## 1. Extract the project

In the folder containing the downloaded archive, run:

```bash
mkdir fashion-seminar-demo
tar -xzf fashion-seminar-demo.tar.gz -C fashion-seminar-demo
cd fashion-seminar-demo
```

Run the remaining project commands from this directory.

## 2. Start PostgreSQL

```bash
docker run --name fashion-seminar-db \
  -e POSTGRES_USER=demo \
  -e POSTGRES_PASSWORD=local-demo-password \
  -e POSTGRES_DB=fashion_seminar_demo \
  -p 127.0.0.1:5433:5432 \
  -v fashion-seminar-data:/var/lib/postgresql/data \
  -d postgres:17
```

This creates a local database with persistent storage. Port 5433 helps avoid conflicts with an existing PostgreSQL installation.

Wait until the database is ready. You can check with:

```bash
docker exec fashion-seminar-db pg_isready -U demo -d fashion_seminar_demo
```

Continue when it reports that it is accepting connections.

## 3. Configure the app

Create a plain-text file named `.env` in the project directory. Paste the following and replace the Gemini key placeholder with your own key:

```dotenv
DATABASE_URL=postgres://demo:local-demo-password@localhost:5433/fashion_seminar_demo
APP_PASSWORD=seminar-demo
GEMINI_API_KEY=PASTE_YOUR_GEMINI_API_KEY_HERE

MAX_MODELS_PER_EVALUATION=3
MAX_EVALUATION_COST_USD=1
ASSUMED_INPUT_TOKENS=20000
ASSUMED_OUTPUT_TOKENS=2000
```

The database must be named `fashion_seminar_demo`: the startup script checks this before applying migrations. Do not share your completed `.env` file.

## 4. Set up and launch

```bash
bash init.sh
```

This installs dependencies, applies database migrations, seeds the model catalogue and runs verification. Resolve any reported failure before continuing.

Then start the app:

```bash
npm run dev -- --port 3001
```

Keep this Terminal window open. Visit [http://localhost:3001](http://localhost:3001) and log in with:

```text
seminar-demo
```

This password comes from `APP_PASSWORD` in your `.env` file.

## 5. Try the three examples

Select an example shopper query, paste the corresponding product URL, select an available Gemini model and start the evaluation.

| Example query | Product page | Discussion point |
| --- | --- | --- |
| Running shoes | [ASICS GEL-Contend 9 at Sports Direct](https://ie.sportsdirect.com/asics-gel-contend-9-womens-running-shoes-210196) | Price, size, materials and returns provide evidence; selected-size stock and personal fit still need checking. |
| Rain jacket | [Rains Jacket](https://www.rains.com/products/jacket-male) | Waterproofing and hood details help; ventilation does not automatically establish breathable fabric or cycling suitability. |
| Occasion outfit | [Linenfox Emilija dress](https://linenfoxclothes.com/women/linen-dresses/midi-linen-dress-emilija-stellar-blue/) | Material and care instructions help; combined size labels and made-to-order delivery timing need attention. |

Keep the report page open while processing: it drives the job queue. A separate worker is optional and is not required for this workflow.

New evaluations use your Gemini account and may incur API charges. Product pages, prices, stock and crawl availability can change; rerun the examples before presenting.

The sender’s saved report links will not work in your new database. Generate your own reports using these URLs. Transferring the exact existing reports requires a separate database export and restore.

## Subsequent sessions

Start Docker Desktop, open Terminal in the extracted project directory, then run:

```bash
docker start fashion-seminar-db
npm run dev -- --port 3001
```

Open [http://localhost:3001](http://localhost:3001).

To stop the app, press `Ctrl+C` in its Terminal. To stop the database:

```bash
docker stop fashion-seminar-db
```

Your reports remain in the Docker volume for the next session.

## Troubleshooting

- **Docker is unavailable:** start Docker Desktop and wait until its engine is running.
- **Container name already exists:** use `docker start fashion-seminar-db` instead of repeating `docker run`.
- **Database connection fails:** confirm the container is running and that `.env` uses port 5433 and the credentials shown above.
- **Port 5433 is occupied:** choose another free host port in the Docker command and use the same port in `DATABASE_URL`.
- **Port 3001 is occupied:** run `npm run dev -- --port 3002` and visit `http://localhost:3002`.
- **Login fails:** use the value of `APP_PASSWORD` in your `.env`; restart the app after changing it.
- **Model/provider error:** check the Gemini key, account quota and access to the selected model. Restart the app after changing `.env`.
- **A retailer blocks fetching:** try another product page. A page opening in a normal browser does not guarantee that the demo can fetch it.
