const { clearRefresh } = require("../../lib/strava");
module.exports = (req, res) => {
  clearRefresh(res);
  res.writeHead(302, { Location: "/" });
  res.end();
};
