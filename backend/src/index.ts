import fs from "fs";
import path from "path";
import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import logger from "morgan";
import MongoStore from "connect-mongo";
import { MongoClient } from "mongodb";
import env from "./environments";
import mountAdminEndpoints from "./handlers/admin";
import mountOrderEndpoints from "./handlers/orders";
import mountPaymentsEndpoints from "./handlers/payments";
import mountUserEndpoints from "./handlers/users";
import {
  seedProductsCollection,
  type ProductDocument,
} from "./services/products";
import {
  seedTaxonomyAndProductRelations,
  type BrandDocument,
  type CategoryDocument,
} from "./services/taxonomy";

// We must import typedefs for ts-node-dev to pick them up when they change (even though tsc would supposedly
// have no problem here)
// https://stackoverflow.com/questions/65108033/property-user-does-not-exist-on-type-session-partialsessiondata#comment125163548_65381085
import "./types/session";
import mountNotificationEndpoints from "./handlers/notifications";

const dbName = env.mongo_db_name;

const mongoUri =
  env.mongodb_uri || `mongodb://${env.mongo_host}/${dbName}`;

const mongoClientOptions = env.mongodb_uri
  ? {}
  : {
      authSource: "admin",
      auth: {
        username: env.mongo_user,
        password: env.mongo_password,
      },
    };

const redactSensitiveText = (value: string) => {
  const knownSecrets = [
    env.mongodb_uri,
    env.mongo_user,
    env.mongo_password,
    env.pi_api_key,
    env.session_secret,
  ].filter(Boolean);
  let redacted = value.replace(
    /mongodb(?:\+srv)?:\/\/[^\s"'<>]+/gi,
    "[redacted-mongo-uri]",
  );

  knownSecrets.forEach((secret) => {
    redacted = redacted.split(secret).join("[redacted]");
  });

  return redacted;
};

const readSafeStartupError = (err: unknown) => {
  if (!(err instanceof Error)) {
    return {
      error: "UnknownError",
      message: "Unknown startup error",
    };
  }

  const maybeMongoError = err as Error & { code?: unknown };

  return {
    error: err.name,
    message: redactSensitiveText(err.message),
    ...(typeof maybeMongoError.code === "number" ||
    typeof maybeMongoError.code === "string"
      ? { code: maybeMongoError.code }
      : {}),
  };
};

//
// I. Initialize and set up the express app and various middlewares and packages:
//

const app: express.Application = express();

// Log requests to the console in a compact format:
app.use(logger("dev"));

// Full log of all requests to /log/access.log:
app.use(
  logger("common", {
    stream: fs.createWriteStream(path.join(__dirname, "..", "log", "access.log"), { flags: "a" }),
  }),
);

// Enable response bodies to be sent as JSON:
app.use(express.json());

// Handle CORS:
app.use(
  cors({
    origin: env.frontend_url,
    credentials: true,
  }),
);

// Handle cookies 🍪
app.use(cookieParser());

// Use sessions:
app.set("trust proxy", 1);

app.use(
  session({
    secret: env.session_secret,
    resave: false,
    saveUninitialized: false,

    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },

    store: MongoStore.create({
      mongoUrl: mongoUri,
      mongoOptions: mongoClientOptions,
      dbName: dbName,
      collectionName: "user_sessions",
    }),
  }) as unknown as express.RequestHandler,
);

//
// II. Mount app endpoints:
//

// Payments endpoint under /payments:
const paymentsRouter = express.Router();
mountPaymentsEndpoints(paymentsRouter);
app.use("/payments", paymentsRouter);

// User endpoints (e.g signin, signout) under /user:
const userRouter = express.Router();
mountUserEndpoints(userRouter);
app.use("/user", userRouter);

// Order history endpoints under /orders:
const orderRouter = express.Router();
mountOrderEndpoints(orderRouter);
app.use("/orders", orderRouter);

// Notification endpoints under /notifications:
const notificationRouter = express.Router();
mountNotificationEndpoints(notificationRouter);
app.use("/notifications", notificationRouter);

// Admin endpoints under /admin:
const adminRouter = express.Router();
mountAdminEndpoints(adminRouter);
app.use("/admin", adminRouter);

// Hello World page to check everything works:
app.get("/", async (_, res) => {
  res.status(200).send({ message: "Hello, World!" });
});

// III. Boot up the app:

const start = async () => {
  try {
    const client = await MongoClient.connect(mongoUri, mongoClientOptions);
    const db = client.db(dbName);
    const orderCollection = db.collection("orders");
    const userProfileCollection = db.collection("user_profiles");
    const productCollection = db.collection<ProductDocument>("products");
    const categoryCollection = db.collection<CategoryDocument>("categories");
    const brandCollection = db.collection<BrandDocument>("brands");
    await orderCollection.createIndex({ pi_payment_id: 1 }, { unique: true });
    await orderCollection.createIndex(
      { orderNumber: 1 },
      {
        unique: true,
        partialFilterExpression: { orderNumber: { $type: "string" } },
      },
    );
    await userProfileCollection.createIndex({ pi_uid: 1 }, { unique: true });
    await productCollection.createIndex({ id: 1 }, { unique: true });
    await productCollection.createIndex({ sku: 1 }, { unique: true });
    await productCollection.createIndex({ category: 1 });
    await productCollection.createIndex({ brand: 1 });
    await productCollection.createIndex({ categoryId: 1 });
    await productCollection.createIndex({ brandId: 1 });
    await categoryCollection.createIndex({ id: 1 }, { unique: true });
    await categoryCollection.createIndex(
      { slug: 1 },
      {
        unique: true,
        partialFilterExpression: { deletedAt: { $exists: false } },
      },
    );
    await categoryCollection.createIndex({ parentId: 1 });
    await categoryCollection.createIndex({ active: 1 });
    await brandCollection.createIndex({ id: 1 }, { unique: true });
    await brandCollection.createIndex(
      { slug: 1 },
      {
        unique: true,
        partialFilterExpression: { deletedAt: { $exists: false } },
      },
    );
    await brandCollection.createIndex({ name: 1 });
    await brandCollection.createIndex({ active: 1 });
    await seedProductsCollection(productCollection);
    await seedTaxonomyAndProductRelations(
      productCollection,
      categoryCollection,
      brandCollection,
    );
    app.locals.orderCollection = orderCollection;
    app.locals.userProfileCollection = userProfileCollection;
    app.locals.productCollection = productCollection;
    app.locals.categoryCollection = categoryCollection;
    app.locals.brandCollection = brandCollection;
    app.locals.userCollection = db.collection("users");
    console.log("Connected to MongoDB");

    app.listen(env.port, () => {
      console.log(`App platform demo app - Backend listening on port ${env.port}!`);
      console.log(`CORS config: configured to respond to a frontend hosted on ${env.frontend_url}`);
    });
  } catch (err) {
    console.error("Backend startup failed", readSafeStartupError(err));
    process.exit(1);
  }
};

start();
