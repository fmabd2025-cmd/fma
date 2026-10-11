# FMA-2025: Friends Multipurpose Association Management System

A comprehensive financial, shareholder, investment, circular, and media management platform for Friends Multipurpose Association (2025).

**Official Production Link:** [https://fmabd.vercel.app](https://fmabd.vercel.app)

---

## 🚀 How to Deploy to Vercel (https://fmabd.vercel.app)

### Step 1: Push Code to GitHub
```bash
git remote add origin https://github.com/fmabd2025-cmd/FMA-2025.git
git push -u origin main
```

### Step 2: Import into Vercel
1. Go to [vercel.com](https://vercel.com) &rarr; **Add New...** &rarr; **Project**.
2. Select your GitHub repository (`FMA-2025`).
3. Set **Project Name** to: `fmabd`.
4. Deploy! Your app will be live at: **[https://fmabd.vercel.app](https://fmabd.vercel.app)**.
   *(The included `vercel.json` ensures full SPA routing support).*

---

## 🌐 Alternative: Deploy to Netlify

### Step 1: Create a Repository on GitHub
1. Go to [github.com/new](https://github.com/new).
2. Name your repository (e.g. `fma-2025` or `friends-multipurpose-association`).
3. Leave "Initialize this repository with a README" **unchecked** (the repository is already initialized and committed locally).
4. Click **Create repository**.

### Step 2: Push Code to GitHub
Run the following commands in your terminal:

```bash
# 1. Add your GitHub repository as the remote origin:
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/fma-2025.git

# 2. Push all code to the main branch:
git push -u origin main
```

*(Note: Whenever you make future changes, simply run `git add . && git commit -m "update" && git push`)*

---

### Step 3: Connect GitHub to Netlify (Continuous Deployment)
1. Go to [app.netlify.com](https://app.netlify.com).
2. Click **"Add new site"** &rarr; **"Import an existing project"**.
3. Select **GitHub** and grant access to your repository.
4. Netlify will automatically detect the settings from `netlify.toml`:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Click **"Deploy Site"**.

---

### Step 4: Claim Your URL (https://fma2025.netlify.app)
1. In your Netlify site dashboard, navigate to **Site configuration** (or **Site settings**).
2. Under **Site details**, click **"Change site name"**.
3. Enter `fma2025`.
4. Click **Save**.
5. Your association system is now live at: **[https://fma2025.netlify.app](https://fma2025.netlify.app)**!

---

### Step 5: (Optional) Connecting a Custom Domain via Cloudflare DNS

If you are using a custom domain with Cloudflare nameservers:
- **Nameserver 1**: `aarav.ns.cloudflare.com`
- **Nameserver 2**: `naomi.ns.cloudflare.com`

Follow these steps to connect Cloudflare to your Netlify site (`fma2025.netlify.app`):

#### 1. Configure Cloudflare DNS Records
1. Open your [Cloudflare Dashboard](https://dash.cloudflare.com/) and select your custom domain.
2. Go to **DNS** &rarr; **Records** &rarr; Click **"Add record"**:
   - **Type**: `CNAME`
   - **Name**: `@` (root domain) or `www`
   - **Target**: `fma2025.netlify.app`
   - **TTL**: Auto
   - **Proxy status**: `DNS only` (Grey Cloud) recommended during initial SSL verification, or `Proxied` (Orange Cloud) with SSL mode set to **Full (strict)**.
3. Click **Save**.

#### 2. Add Domain to Netlify
1. In [Netlify Dashboard](https://app.netlify.com), go to your `fma2025` site.
2. Go to **Site configuration** &rarr; **Domain management**.
3. Under **Custom domains**, click **"Add a custom domain"**.
4. Enter your custom domain name and click **Verify** &rarr; **Add domain**.
5. Netlify will detect your CNAME record pointing to `fma2025.netlify.app` and automatically provision an SSL certificate.

*(Note: If you previously created a "Netlify DNS Zone" in Netlify for this domain, go to Netlify **Domains** and delete the Netlify DNS zone so Cloudflare's nameservers handle resolution).*

---

### Step 6: Supabase Redirect URL Whitelisting
To ensure Supabase Auth and CORS allow your new Netlify address:
1. Open your [Supabase Dashboard > Auth Settings](https://supabase.com/dashboard/project/cxsijuhezbsigkzkynup/auth/url-configuration).
2. Set **Site URL** to: `https://fma2025.netlify.app`
3. Add `https://fma2025.netlify.app/**` to **Redirect URLs**.
4. Click **Save**.

> 💡 **Zero-Config Supabase Persistence**: The application includes fallback connectivity to your Supabase project (`cxsijuhezbsigkzkynup`). All submissions from `https://fma2025.netlify.app` automatically persist to your Supabase PostgreSQL tables and Storage bucket!

---

### Method 2: Manual Drag & Drop (Netlify Drop)

1. Run the production build locally:
   ```bash
   npm run build
   ```
2. Navigate to [app.netlify.com/drop](https://app.netlify.com/drop).
3. Drag and drop the generated `dist/` folder into the upload box.
4. Your site will be live instantly!

---

## ⚙️ Configuration Files Included

- **`netlify.toml`**: Configures the build command (`npm run build`), output folder (`dist`), Node 20 environment, and SPA fallback rules so page refreshes don't return 404 errors.
- **`wrangler.jsonc`**: Configures Cloudflare Workers static assets and SPA fallback routing.
