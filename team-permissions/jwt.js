const { sign, verify } = require('jsonwebtoken');
require("dotenv").config();

const jwtSecretKey = process.env.ACCESS_TOKEN_SECRET;

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

function verifyAccessToken(token) {
  return verify(token, jwtSecretKey);
}

module.exports = {
    signAccessToken,
    verifyAccessToken
    };