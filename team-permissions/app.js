const express = require("express");
const router = require("express-promise-router")();
const app = express();
const cors = require("cors"); 
const morgan = require("morgan");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require("dotenv").config();

const  { signAccessToken, verifyAccessToken } = require("./jwt");

app.use(express.json()); // Add this line to parse the request body as JSON
app.use(router);
app.use(cors());
app.use(morgan("dev"));

const checkAuth = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(403).send({
      message: "Unauthorized",
    });
  }
  const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    return res.status(403).send("Unauthorized");
  }
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    console.log(error);
    return res.status(403).send({
      message: "Unauthorized",
    });
  }
}


// checkPermission middleware that lets you check 
// whether user authorized to perform specific action 
const checkPermissions = (permissionType) => {
  return async (req, res, next) => {

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
        id: req.user.user_id,
        relation: "",
      },
    };
    // performing the check request
    const checkRes = await fetch("http://localhost:3476/v1/tenants/t1/permissions/check", {
      method: "POST",
      body: JSON.stringify(bodyParams),
      headers: { "Content-Type": "application/json" },
    })
    .catch((err) => {
      res.status(500).send(err);
    });
    
    let checkResJson = await checkRes.json()
    
    if (checkResJson.can === 'CHECK_RESULT_DENIED'){
      return res.status(403).send(
        {
          message: `User:${req.user.user_id} is not authorized to ${permissionType} document ${req.params.id}`,
        }
      );
    }
    next();
  };
};



// req.isAuthenticated is provided from the auth router
router.get("/", (req, res) => {
  res.send({
    message: "Hello from the server side!",
  });
});

router.get("/health", checkAuth,(req, res) => {
  res.send({
    status: "ok",
  });
});


router.post("/login", async (req, res) => {
  console.log("Login request received");
  const user_id = req.body.user_id;
  const username = req.body.username;
  const role = req.body.role;

  if ( !user_id || !username || !role) {
    return res.status(400).send({
      message: "Invalid request! Missing required fields",
    });
  }

  const accessToken = signAccessToken(user_id, username, role);
  res.send({ accessToken });
});

router.post("/schema", checkAuth, (req, res) => {
  // read schema.perm file
  const fs = require("fs");
  const schema = fs.readFileSync("schema.perm", "utf8");

  // create schema
  fetch("http://localhost:3476/v1/tenants/t1/schemas/write", {
    method: "POST",
    body: JSON.stringify({ schema: schema }),
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => res.json())
    .then((json) => {
      res.send(json);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send(err);
    });
});





// create a new permission
router.post("/permissions", checkAuth, (req, res) => {
  // localhost:3476/v1/tenants/t1}/data/write
  console.log(req.body);
  fetch("http://localhost:3476/v1/tenants/t1/data/write", {
    method: "POST",
    body: JSON.stringify(req.body),
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => res.json())
    .then((json) => {
      console.log(json);
      res.send(json);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send(err);
    });
});

// view the document
router.get("/docs/:id", checkAuth, checkPermissions("view"), (req, res) => {
  /// Result
  res.send({
    message: `User:${req.user.user_id} is authorized to view document:${req.params.id}`,
  });
});

// edit the resource
router.put("/docs/:id", checkAuth, checkPermissions("edit"), (req, res) => {
  // Result
  res.send({
    message: `User:${req.user.user_id} is authorized to edit document:${req.params.id}`,
  });

});

// delete the resource
router.delete("/docs/:id", checkAuth, checkPermissions("delete"), (req, res) => {
  res.send({
    message: `User:${req.user.user_id} is authorized to delete document:${req.params.id}`,
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
