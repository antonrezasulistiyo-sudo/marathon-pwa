const { cookies, tokenRequest, COOKIE } = require("../../lib/strava");
module.exports = async (req, res) => {
  try {
    const url = new URL(req.url, `https://${req.headers.host}`);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state || state !== cookies(req).mp_state) throw new Error("bad_state");
    const t = await tokenRequest({ code, grant_type: "authorization_code" });
    res.setHeader("Set-Cookie", [
      `${COOKIE}=${encodeURIComponent(t.refresh_token)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=31536000`,
      "mp_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0",
    ]);
    res.writeHead(302, { Location: "/" });
  } catch (e) {
    res.writeHead(302, { Location: "/?login=gagal" });
  }
  res.end();
};
