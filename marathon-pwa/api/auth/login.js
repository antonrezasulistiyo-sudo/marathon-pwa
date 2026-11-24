const crypto = require("crypto");
module.exports = (req, res) => {
  const state = crypto.randomBytes(16).toString("hex");
  const q = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID,
    redirect_uri: `https://${req.headers.host}/api/auth/callback`,
    response_type: "code",
    approval_prompt: "auto",
    scope: "read,activity:read_all",
    state,
  });
  res.setHeader("Set-Cookie", `mp_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`);
  res.writeHead(302, { Location: "https://www.strava.com/oauth/authorize?" + q });
  res.end();
};
