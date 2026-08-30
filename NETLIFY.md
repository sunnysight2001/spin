# Deploy the SPIN trainer on Netlify

Audio is a Netlify function (`/api/tts`) with a native Indian neural voice per language.

Do **not** use Netlify Drop. Drop cannot run the voice function.

## Correct Netlify settings

| Field | Value |
|---|---|
| Build command | `echo no-npm` |
| Publish directory | `.` |
| Functions directory | `netlify/functions` |
| Node version | `20` |

Do **not** set publish to `dist/client`. Do **not** set build to `npm run build`. Do **not** run `npm install` — this folder already vendors the one library the voice function needs.

## Path A — GitHub then Netlify (recommended)

1. Create a **private** GitHub repo (a new repo — do not overwrite Gimliand).
2. Upload every file from this folder at the **repo root** (`index.html` must be visible at the root).
3. Netlify → Add new site → Import from Git → pick the repo.
4. Use the settings table above. Deploy.

## After deploy

- Login: `mr@sunpharma.com` / `Gimliand@2026`
- You should land on SPIN slide 1 (no workshop picker).
- Switch language to Tamil or Marathi and press Play.
- Status should read **Speaking · neural voice**.
- Toggle **Cabin lines** for what the MR says in the cabin.

If the status says “Voice server not live”, the function was not published. Check Deploys → Functions for `tts`.
