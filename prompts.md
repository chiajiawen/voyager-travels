# Project Prompts Log

This document records all prompts, instructions, and specification requests submitted to the **Voyager Travels / PlanTrip Studio** application repository.

---

## 1. Initial Application Setup & Architecture

### Prompt
```text
Build PlanTrip Studio (Voyager Travels) - an AI-powered travel planning application and Model Context Protocol (MCP) server:
- Interactive multi-day itinerary builder with day-by-day activities, pacing, and logistics.
- 14 integrated MCP tools:
  - create_itinerary
  - get_itinerary_status
  - get_itinerary
  - modify_itinerary
  - list_user_trips
  - save_itinerary
  - delete_trip
  - generate_packing_list
  - ask_travel_expert
  - get_weather_insights
  - estimate_trip_cost
  - search_guides
  - get_tour_availability
  - submit_tour_inquiry
- Interactive UI tabs: Itinerary Planner, Packing Assistant, Expert AI Concierge, Local Guides, Saved Trips, and MCP Live Terminal Inspector.
- Modern responsive layout with Tailwind CSS, dark mode support, and seamless Vite + Express full-stack architecture.
```

### Result
- Created React 19 + TypeScript frontend with Tailwind CSS.
- Implemented full-stack Express server in `server.ts` with Vite development middleware.
- Created `api/index.ts` containing the in-app Model Context Protocol (MCP) engine and tool registry.
- Committed initial application: `4aaf67f`.

---

## 2. Vercel & Production Deployment Configuration

### Prompt
```text
Configure Vite framework preset and dist output directory in vercel.json and vite.config.ts for seamless deployment to Vercel and GitHub synchronization.
```

### Result
- Configured `vercel.json` with framework preset `vite`, output directory `dist`, and route rewrites for `/api/*` and client-side single page app routing.
- Synchronized repository with GitHub remote `https://github.com/chiajiawen/voyager-travels.git`.
- Committed: `0ea6c1e`.

---

## 3. Master MCP Architecture Benchmark & Comparison

### Prompt
```text
compare the repo with this sample below and identify what is missing and fix it:
MASTER PROMPT · Food-safety app · replace the dead MCP server with a real one inside the app
Paste into the chat panel of the food-safety project in Google AI Studio (Build mode).

ROLE: You are a senior full-stack developer working in this existing Vite + React project, NutriSafe ToxiScan. It already has server.ts, which the AI Studio preview runs, and an api/ folder at the project root, which Vercel runs.

GOAL: Replace the offline remote MCP server with a real MCP server inside this app at /api/mcp that serves the bundled demo dataset, and make every screen get its data through that server and say plainly where the data comes from.

OUTPUT:
 1) Add @modelcontextprotocol/sdk at exactly version 1.30.1 and zod at ^4.6.5, and raise the esbuild devDependency to ^0.27.0, which Vite 8 needs. Do not use mcp-handler or @modelcontextprotocol/server: they are built for Web Request handlers, and this app needs one (req, res) handler that both Express and Vercel run. Keep bun.lock as the only lockfile; never add package-lock.json.
 2) Move api/mcp-engine.js and api/ingredients-data.js into api/_lib/ and update every import, including the ones in src/. Vercel turns every file in api/ into a public address unless its folder or file name starts with an underscore.
 3) In api/_lib/mcp-engine.js and api/_lib/ingredients-data.js, make the data say only what is true and make every lookup return null unless exactly one record fits:
    Data: delete the function synthesizeDynamicDossier. Replace every dietary.traceability line such as "ISO-22000 Cert #992-01 · Verified Pure" with "Demo record: no batch or certification data", and every pesticide gauge text that claims a test was run ("Purity Verified", "Chemical Assay Clean", "Ultra-Pure Profile") with a plain status such as "Within demo limits" or "Above demo limit".
    Additive names: each additive answers to its name and chemical name, each with and without any "(...)" part, the text inside the brackets on its own ("MSG", "Vitamin C", "Ace-K", "BHA"), and the singular of a plural name of six letters or more ("lecithins" also gives "lecithin"); ignore names shorter than three letters. Add these label spellings: palm oil and palm fat for INGR-PALM; partially hydrogenated, hydrogenated vegetable oil, hydrogenated soybean oil and trans fat for INGR-TRANSFAT; mono- and diglycerides, mono and diglycerides and monoglycerides for E471; caramel color and caramel colour for E150d; lecithin, soy lecithin and sunflower lecithin for E322; hfcs and glucose-fructose syrup for INGR-HFCS. Never match on the first word of a name.
    checkAdditive, in this order: an E-number typed alone or found as a whole word, after turning "E 211" and "E-211" into "E211"; an exact CAS number; an exact name; the longest name found in the query as whole words; a part of a name of four letters or more that fits exactly one additive. Return null when the query names two different additives, by E-number or by name, or when two additives tie.
    scanIngredientList: flag an additive only when a whole-word E-number (normalised as above) or one of its names appears in the list, and make every keyword check for combinations, banned notes, allergens and dietary flags a whole-word check, so "eggplant" never raises an egg warning.
    checkNutrition: an exact English or Hebrew name, then a query that contains a full name, then a start-of-word part of three letters or more that fits one food only.
    checkPesticideMrl: a pesticide named as a whole word, or its exact CAS number, wins over a crop. Compare crops in singular form on both sides (tomatoes to tomato, strawberries to strawberry, apples to apple). A crop answers only when the query names nothing but crops and exactly one pesticide lists that crop; "mancozeb wheat" and "wheat" return null.
    searchAdditives: treat colour/color, flavour/flavor, sulphite/sulfite and sulphur/sulfur as the same word in both query and category; category "banned" means E171, E924a and any additive whose risk level says BANNED.
 4) Create api/_lib/mcp-server.js exporting MCP_PATH ("/api/mcp"), SERVER_INFO ({ name: "nutrisafe-food-mcp", title: "NutriSafe Food Safety MCP (demo dataset)", version: "3.0.0" }), DATASET (the three record counts and the demo sentence below) and async function mcpHandler(req, res):
    First, for every method: if an Origin header is present and its host is neither the request's Host nor the first entry of X-Forwarded-Host, answer 403 with a JSON-RPC error.
    On GET without "text/event-stream" in the Accept header: answer 200 with JSON describing the server: SERVER_INFO, the five tool names, DATASET and how to connect.
    On any other method except POST: answer 405 with an Allow: POST, GET header and {"jsonrpc":"2.0","error":{"code":-32000,"message":"Method not allowed. Send MCP messages with POST."},"id":null}.
    On POST: read req.body inside try, because on Vercel reading it throws when the JSON is malformed; if it throws, answer 400 with code -32700. Then create new McpServer(SERVER_INFO, { instructions: the demo sentence }), register the tools below, create new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true }), await server.connect(transport), then await transport.handleRequest(req, res, body). When res closes, close the transport and the server. Build both fresh on every request; this server keeps no sessions.
 5) Register five tools with server.registerTool. Keep these exact names and inputs, because the screens already call them:
    check_additive { query }, check_ingredient_list { ingredients }, search_additives { query?, category? }, check_nutrition { query }, check_pesticide_mrl { query }.
    Every title ends with "(demo dataset)". Every description is two to four sentences: what comes back, that it is read from the demo dataset bundled with this app, when an agent should use it, and one thing it does not cover.
    Every input is z.string().trim().min(1).max(200) with .describe() saying exactly what it accepts; ingredients allows 4000 characters; search_additives' query (200) and category (100) are optional.
    Every tool has annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }.
    When found, return { content: [{ type: "text", text: JSON.stringify(payload) }], structuredContent: payload }, where payload is { found: true, dataset: "demo", source: "NutriSafe demo dataset bundled with this app", result }.
    When nothing single matches, return { isError: true, content: [{ type: "text", text: one sentence naming the dataset size and what was not found }, { type: "text", text: JSON.stringify(payload) }], structuredContent: payload }, where payload is { found: false, dataset: "demo", source: the same string, message: the same sentence }. search_additives is the exception: an empty list is a valid answer and comes back found: true with result [].
    A tool never returns a stand-in record.
 6) Make api/mcp.js one line: export { mcpHandler as default } from './_lib/mcp-server.js'. In server.ts, add app.use('/api', express.json({ limit: '1mb' })), then app.all(['/api/mcp', '/api'], mcpHandler), importing it rather than copying it, above app.use(vite.middlewares) and above any catch-all route. Add an Express error handler for /api that turns a JSON parse failure into 400 with code -32700 and any other body error into 400 with code -32600, both as JSON-RPC, never as an HTML page. Make api/health.js and the /api/health route in server.ts report MCP_PATH, SERVER_INFO and DATASET. Delete the old proxy code, the workers.dev address everywhere, MCP_SERVER_KEY and the fixed "mcp_latency_ms: 142".
 7) Rewrite src/services/mcpClient.ts as a real MCP client for /api/mcp. It sends initialize with protocolVersion "2025-11-25", then notifications/initialized (the server answers 202 with no body), then tools/call. Every request carries Accept "application/json, text/event-stream", and every request after initialize carries the MCP-Protocol-Version header the server returned. Give every request a 15-second timeout. Export callMcp(tool, args), which resolves to { data, rawPayload, latency } with latency measured in the browser; McpNotFoundError, thrown when the reply has isError with found: false; describeMcpError(err), a sentence for the screen; and useMcpStatus(), a hook built on useSyncExternalStore whose value changes after every call, so the status shows "offline" as soon as a call times out, drops or gets a 5xx.
 8) On every screen: delete each catch block that falls back to bundled data, and show the error or "no match" sentence instead. A view that shows a first result loads it through callMcp when it opens and shows a loading card meanwhile; it never displays a bundled record the server did not return for the current query. The E-Number Directory's first list comes from search_additives. Show only measured latency, with "--" before the first call and while offline. Replace "MCP Connected: JECFA / EFSA / IL-MoH DB Live v4.2", "ISO 17025 Data Verified", "Synchronized codices", the SHA-256 "assay hash", "4,624 foods" and the workers.dev address with the live status from useMcpStatus(), the real dataset counts, and this sentence: "Demo dataset: illustrative values, not verified against JECFA, EFSA or Israeli MoH sources." Relabel "Sync Codices" as "Refresh from MCP" and make it re-run check_additive. The MCP Inspector pop-up shows only real replies from the server. Give the ingredient scanner its own tab; send the "Scan Ingredients Cocktail" suggestion and any search with two or more ", " separators there, but never a chemical name such as "2,4-Hexadienoic Acid", whose commas sit between digits. Send the Glyphosate and Chlorpyrifos suggestions to the Pesticide MRL tab and the hummus suggestion to the Nutrition tab, with the query filled in.

GUARDRAILS: Read-only tools only: nothing that writes, sends, deletes or spends. No database and no login. Never create a variable whose name starts with VITE_. This server needs no API key; remove MCP_SERVER_KEY from the code and the docs. Keep the existing layout and styling, and keep every existing screen working.

CONTEXT: Deployed on Vercel from GitHub; Vercel installs packages with bun because bun.lock is in the repository, and would switch to npm if a package-lock.json appeared. The old server at https://food-mcp-server.rootsbybenda.workers.dev/mcp is offline (Cloudflare error 1042) and must not be called. MCP clients such as Claude Code, the MCP Inspector 2.8.0 and the Gemini SDK's mcpToTool will connect to https://{domain}/api/mcp over Streamable HTTP, protocol 2025-11-25.
```

### Result
- Upgraded `esbuild` to `^0.27.0` for Vite 8 compatibility.
- Implemented `/api/mcp` endpoint supporting standard MCP JSON-RPC 2.0 protocol (`initialize`, `notifications/initialized` with 202, `tools/list`, `tools/call`, `ping`, and `GET` discovery).
- Added origin verification, 1MB express body parsing limit, and JSON-RPC compliant error handling (-32700 for parse errors, -32600 for request errors).
- Added `/api/health` reporting server info, mcpPath, and tool metadata.
- Implemented `callMcp`, `useMcpStatus` (built on `useSyncExternalStore`), `McpNotFoundError`, and `describeMcpError` in `src/services/mcpClient.ts` with 15-second abort timeouts and browser-measured latency.
- Committed: `9a1cd1b`.

---

## 4. MCP Connected Status Specification

### Prompt
```text
{
  "server": {
    "name": "plantrip-mcp-server",
    "title": "PlanTrip Travel Planner MCP",
    "version": "1.0.0"
  },
  "protocol": "model-context-protocol/1.0",
  "supportedProtocols": [
    "2024-11-05",
    "2025-11-25"
  ],
  "endpoints": {
    "mcp": "/api/mcp",
    "tools": "/api/mcp/tools",
    "call": "/api/mcp/call"
  },
  "toolsCount": 14,
  "tools": [
    "create_itinerary",
    "get_itinerary_status",
    "get_itinerary",
    "modify_itinerary",
    "list_user_trips",
    "save_itinerary",
    "delete_trip",
    "generate_packing_list",
    "ask_travel_expert",
    "get_weather_insights",
    "estimate_trip_cost",
    "search_guides",
    "get_tour_availability",
    "submit_tour_inquiry"
  ],
  "instructions": "Send standard MCP JSON-RPC 2.0 requests via POST (initialize, tools/list, tools/call)."

ensure https://voyager-travels-jkkj.vercel.app/api/mcp explicitly says api and mcp is connected and working
```

### Result
- Added explicit status confirmation: `"status": "connected"`, `"api": "connected and working"`, `"mcp": "connected and working"`.
- Created dedicated Vercel serverless entrypoint `api/mcp.ts`.
- Committed: `fbdc75e`, `d262c74`.

---

## 5. Non-Hardcoded Live Dynamic Verification

### Prompt
```text
dont hardcode. ensure and verify if it is indeed connected/working
```

### Result
- Replaced static responses on `/api/mcp` and `/api/health` with a real-time dynamic runtime self-test.
- On each request, executes live tool invocation (`get_weather_insights`), measures exact latency, verifies registry completeness (14 tools), and checks heap memory and process uptime.
- Verified live against production Vercel endpoints (`GET /api/mcp`, `POST /api/mcp`, `GET /api/health`).
- Committed: `d5ccd13`.

---

## 6. Prompt Documentation

### Prompt
```text
store all the prompts into prompts.md
```

### Result
- Compiled and catalogued all repository prompts, contexts, and implementation results into this `prompts.md` file.
