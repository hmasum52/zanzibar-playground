import express = require("express");
import cors = require("cors");
import { expressjwt as jwt, GetVerificationKey } from "express-jwt";
import jwksRsa = require("jwks-rsa");
import { Store } from "./store";
import { Server } from "./server";
import { UserCache, User } from "./interfaces";
import * as dotenv from "dotenv";
import * as dotenvExpand from "dotenv-expand";
import { Request as JWTRequest } from "express-jwt";

dotenvExpand.expand(dotenv.config());


const checkJwt = jwt({
  // Dynamically provide a signing key based on the kid in the header and the signing keys provided by the JWKS endpoint
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: process.env.JWKS_URI,
  }) as GetVerificationKey,

  // Validate the audience and the issuer
  audience: process.env.AUDIENCE,
  issuer: process.env.ISSUER,
  algorithms: ["RS256"],
});

const app: express.Application = express();
app.use(express.json());
app.use(cors());

const PORT = 3001;

Store.open().then((store) => {
  const server = new Server(store);

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
      
  
      if (!checkRes) {
        res.status(500).send("Error in Check Request");
        return;
      }
    
      const checkResJson = await checkRes.json();
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
  

  // restMiddleware.Authz() selects the policy module to evaluate based on the REST convention
  //   e.g. GET /todos -> todoApp.GET.todos
  app.get(
    "/todos", 
    checkJwt, 
    checkPermissions("read"), 
    server.list.bind(server));

  app.put(
    "/todos/:id",
    checkJwt,
    checkPermissions("update"),
    server.update.bind(server),
  );

  app.delete(
    "/todos/:id",
    checkJwt,
    checkPermissions("delete"),
    server.delete.bind(server),
  );

  // commenting out restMiddleware.Authz() to demonstrate the use of the Check middleware below
  // app.post("/todos", checkJwt, restMiddleware.Authz(), server.create.bind(server));

  // checkMiddleware.Check() evaluates the "standard" rebac.check module.
  //   the Check below only grants access to users who are members of the resource-creators instance
  app.post(
    "/todos",
    checkJwt,
    checkPermissions("create"),
    server.create.bind(server),
  );

  app.listen(PORT, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
  });
});
