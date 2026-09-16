# Gift setup — public website + home clock

Your friend needs a **public webpage** to add questions.  
The clock stays on **home Wi‑Fi**. Those two only connect if the clock has a **public HTTPS address**.

```
Friend's phone  →  yourwebsite.vercel.app  →  https://xxxx.trycloudflare.com  →  clock at home
                      (question list)              (tunnel)                    (192.168.1.123)
```

---

## Part A — Public website (Vercel, free)

### 1. Create a free Supabase database

1. Go to [supabase.com](https://supabase.com) → New project  
2. Open **SQL** → paste and run `supabase/schema.sql`  
3. Copy from **Settings → API**:
   - Project URL  
   - `anon` key  
   - `service_role` key  

### 2. Deploy this app to Vercel

```bash
cd "/Users/nafisaumar/Jeya Wedding"
npx vercel
```

Or: push the repo to GitHub → [vercel.com](https://vercel.com) → Import project.

### 3. Add environment variables in Vercel

Project → **Settings → Environment Variables**:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | from Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | from Supabase |
| `CRON_SECRET` | any long random string |

Redeploy after saving.

You now have a public URL like `https://daily-prompt-xxx.vercel.app` — share that with your friend.

---

## Part B — Let the cloud reach the clock (required)

`192.168.1.123` only works on home Wi‑Fi.  
Vercel (and your friend) are **not** on that network.

### Easiest free option: Cloudflare quick tunnel

On a computer that stays on the **same Wi‑Fi as the clock** (or a Raspberry Pi):

```bash
# install once: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
cloudflared tunnel --url http://192.168.1.123:80
```

It prints a URL like:

`https://random-words-1234.trycloudflare.com`

### Put that URL in the website Settings

1. Open your Vercel site → **Settings**  
2. **Device IP or public URL** → paste the `https://….trycloudflare.com` URL  
3. Save → **Test Connection**

Now **Push to Board Now** and the daily cron work from anywhere.

> Quick tunnels change URL when you restart `cloudflared`. For a permanent gift, create a named Cloudflare Tunnel or use Tailscale Funnel / ngrok reserved domain.

---

## Part C — Daily morning question

Already configured in `vercel.json` for **07:00 UTC**.

After deploy, Vercel Cron calls `/api/cron/daily-update` every morning, which:

1. Picks the next question in Supabase  
2. POSTs it to the public clock URL  

---

## Local testing (your machine right now)

```bash
cd "/Users/nafisaumar/Jeya Wedding"
npm run dev
```

Open the URL Next prints (often **http://localhost:3001** if 3000 is busy).

With Mac + clock on the same Wi‑Fi, Settings can use `192.168.1.123` directly — no tunnel needed for local testing.

---

## Checklist for gifting

- [ ] Supabase schema applied + env vars on Vercel  
- [ ] Site opens on phone over cellular (not just Wi‑Fi)  
- [ ] `cloudflared` (or Tailscale/ngrok) running at the couple’s home  
- [ ] Public tunnel URL saved in Settings  
- [ ] Test Connection shows “Hello Love!” on the clock  
- [ ] Push to Board Now works from cellular  
- [ ] Share the Vercel link with your friend  
