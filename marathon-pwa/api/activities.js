const { cookies, setRefresh, clearRefresh, tokenRequest, COOKIE } = require("../lib/strava");
const RUN = ["Run", "TrailRun", "VirtualRun"];
module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const rt = cookies(req)[COOKIE];
  if (!rt) return res.status(401).json({ auth: false });
  try {
    const t = await tokenRequest({ grant_type: "refresh_token", refresh_token: rt });
    setRefresh(res, t.refresh_token);
    const after = Math.floor(Date.now() / 1000) - 84 * 86400;
    const r = await fetch(`https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=200`, {
      headers: { Authorization: `Bearer ${t.access_token}` },
    });
    if (!r.ok) throw new Error("activities_" + r.status);
    const runs = (await r.json())
      .filter((a) => RUN.includes(a.sport_type || a.type))
      .map((a) => ({
        d: (a.start_date_local || a.start_date).slice(0, 10),
        km: Math.round(a.distance / 10) / 100,
        s: a.moving_time,
        e: Math.round(a.total_elevation_gain || 0),
        hr: Math.round(a.average_heartrate || 0),
        w: a.device_watts ? Math.round(a.average_watts || 0) : 0,
      }));
    res.status(200).json({ auth: true, runs });
  } catch (e) {
    if (/strava_token_(400|401)/.test(e.message)) {
      clearRefresh(res);
      return res.status(401).json({ auth: false });
    }
    res.status(502).json({ error: "strava_error" });
  }
};
