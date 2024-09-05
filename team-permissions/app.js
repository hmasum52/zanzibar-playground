const express = require("express");
const router = require("express-promise-router")();
const app = express();
const cors = require("cors"); 
const morgan = require("morgan");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require("dotenv").config();

const  { signAccessToken } = require("./jwt");

app.use(express.json()); // Add this line to parse the request body as JSON
app.use(router);
app.use(cors());
app.use(morgan("dev"));


// req.isAuthenticated is provided from the auth router
router.get("/", (req, res) => {
  res.send({
    message: "Hello from the other side!",
  });
});


router.post("/login", async (req, res) => {
  console.log("Login request received");
  const user_id = req.body.user_id;
  const username = req.body.username;
  const role = req.body.role;

  if ( !user_id || !username || !role) {
    return res.status(400).send("Missing required fields");
  }

  const accessToken = signAccessToken(user_id, username, role);
  res.send({ accessToken });
});


// checkPermission middleware that lets you check 
// whether user authorized to perform specific action 
const checkPermissions = (permissionType) => {
  return async (req, res, next) => {

    // get authenticated user information from auth0
    const userInfo = await req.oidc.user;
    req.userInfo = userInfo
    console.log('userInfo', userInfo)
    
    // body params of Permify check request
    const bodyParams = {
      metadata: {
        schema_version: "",
        snap_token: "",
        depth: 20,
      },
      entity: {
        type: "document",
        id: req.params.id,
      },
      permission: permissionType,
      subject: {
        type: "user",
        id: userInfo.sid, // user id on auth0
        relation: "",
      },
    };

    // performing the check request
    const checkRes = await fetch("http://localhost:3476/v1/permissions/check", {
      method: "POST",
      body: JSON.stringify(bodyParams),
      headers: { "Content-Type": "application/json" },
    })
    .catch((err) => {
      res.status(500).send(err);
    });
    
    let checkResJson = await checkRes.json()
    console.log('Check Result:', checkResJson)

    if (checkResJson.can == "RESULT_ALLOWED") {
        // if user authorized
        req.authorized = "authorized";
        next();
    } 

    // if user not authorized
    req.authorized = "not authorized";
    next();
  };
};

// view the document
router.get("/docs/:id", checkPermissions("view"), (req, res) => {

  /// Result
  res.send(`User:${req.userInfo.sid} is ${req.authorized} to view document:${req.params.id}`);

});

// edit the resource
router.put("/docs/:id", checkPermissions("edit"), (req, res) => {
 
  // Result
  res.send(`User:${req.userInfo.sid} to edit document:${req.params.id}`);

});

// delete the resource
router.delete("/docs/:id", checkPermissions("delete"), (req, res) => {

  // Result
  res.send(`User:${req.userInfo.sid} to delete document:${req.params.id}`);

});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
