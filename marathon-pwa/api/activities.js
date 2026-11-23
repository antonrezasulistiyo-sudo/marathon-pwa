const { cookies, setRefresh, clearRefresh, tokenRequest, COOKIE } = require("../lib/strava");
const RUN = ["Run", "TrailRun", "VirtualRun"];
module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const rt = cookies(req)[COOKIE];
  if (!rt) return res.status(401).json({ auth: false });
  try {
    const t = await tokenRequest({ grant_type: "refresh_token", refresh_token: rt });
    setRefresh(res, t.refresh_token);
    const after = Math.floor(Date.now() / 1000) - 56 * 86400;
    const r = await fetch(`https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=100`, {
      headers: { Authorization: `Bearer ${t.access_token}` },
    });
    if (!r.ok) throw new Error("activities_" + r.status);
    const runs = (await r.json()).filter((a) => RUN.includes(a.sport_type || a.type));
    const d28 = Date.now() - 28 * 86400000;
    const km4 = runs.filter((a) => new Date(a.start_date).getTime() >= d28).reduce((s, a) => s + a.distance, 0) / 1000;
    const longest = runs.reduce((m, a) => Math.max(m, a.distance), 0) / 1000;
    const w = runs.filter((a) => a.device_watts && a.average_watts);
    const avgWatts = w.length ? Math.round(w.reduce((s, a) => s + a.average_watts, 0) / w.length) : 0;
    res.status(200).json({
      auth: true,
      avgKm4: Math.round((km4 / 4) * 10) / 10,
      longest: Math.round(longest * 10) / 10,
      avgWatts,
      runCount: runs.length,
    });
  } catch (e) {
    if (/strava_token_(400|401)/.test(e.message)) {
      clearRefresh(res);
      return res.status(401).json({ auth: false });
    }
    res.status(502).json({ error: "strava_error" });
  }
};
