const COOKIE = "mp_rt";
function cookies(req) {
  const o = {};
  (req.headers.cookie || "").split(/;\s*/).filter(Boolean).forEach((c) => {
    const i = c.indexOf("=");
    o[c.slice(0, i)] = decodeURIComponent(c.slice(i + 1));
  });
  return o;
}
function setRefresh(res, rt) {
  res.setHeader("Set-Cookie", `${COOKIE}=${encodeURIComponent(rt)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=31536000`);
}
function clearRefresh(res) {
  res.setHeader("Set-Cookie", `${COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`);
}
async function tokenRequest(params) {
  const r = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      ...params,
    }),
  });
  if (!r.ok) throw new Error("strava_token_" + r.status);
  return r.json();
}
module.exports = { COOKIE, cookies, setRefresh, clearRefresh, tokenRequest };
