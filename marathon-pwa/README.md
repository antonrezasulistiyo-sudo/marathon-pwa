# Marathon Plan (PWA + Strava)

PWA program marathon dengan login Strava dan mode cedera. Tanpa build step: `public/` = frontend, `api/` = fungsi serverless Vercel.

## 1. Buat aplikasi Strava
1. Buka https://www.strava.com/settings/api dan buat aplikasi.
2. Catat **Client ID** dan **Client Secret**. Isi "Authorization Callback Domain" dengan domain Vercel kamu (tanpa https://, mis. `marathon-pwa.vercel.app`). Bisa diisi setelah langkah 3.

## 2. Push ke GitHub
Buat repo baru, lalu unggah isi folder ini (`git init`, `git add .`, `git commit`, `git push`).

## 3. Deploy di Vercel
1. Vercel → Add New Project → impor repo.
2. Framework: Other. Output directory sudah diatur lewat `vercel.json`.
3. Environment Variables: `STRAVA_CLIENT_ID` dan `STRAVA_CLIENT_SECRET`.
4. Deploy, lalu salin domainnya ke "Authorization Callback Domain" di Strava.

## 4. Pasang di HP
Buka domain Vercel → Masuk dengan Strava → "Add to Home Screen" (iOS: Share → Add to Home Screen; Android: menu → Install app).

## Catatan
- Refresh token Strava disimpan di cookie httpOnly; Client Secret hanya ada di server.
- Aplikasi baru Strava biasanya terbatas satu atlet (kamu sendiri).
- Mileage = rata-rata 4 minggu terakhir, long run = terpanjang 8 minggu terakhir. Watt hanya ada kalau jam atau Stryd merekamnya.
- Persentase zona power adalah default umum, bukan angka Palladino.
