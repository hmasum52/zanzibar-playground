const { sign } = require('jsonwebtoken');
require("dotenv").config();

const jwtSecretKey = process.env.JWT_SECRET_KEY;

function signAccessToken(user_id, username, role) {
  const accessToken = sign(
    { user_id: user_id, username: username , role: role},
    jwtSecretKey,
    {
      expiresIn: '2d',
    }
  );
  return accessToken;
}

module.exports = {
    signAccessToken,
    };