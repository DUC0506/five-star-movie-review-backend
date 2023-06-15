const express = require("express");
require("express-async-errors");
const morgan = require("morgan");
const { errorHandler } = require("./middlewares/error");
const cors = require("cors");
const { handleNotFound } = require("./utils/helper");

require("dotenv").config();
require("./db");
const userRouter = require("./routers/user");
const actorRouter = require("./routers/actor");
const movieRouter = require("./routers/movie");
const reviewRouter = require("./routers/review");
const adminRouter = require("./routers/admin");

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use("/api/user", userRouter);
app.use("/api/actor", actorRouter);
app.use("/api/movie", movieRouter);
app.use("/api/review", reviewRouter);
app.use("/api/admin", adminRouter);

app.use("/*", handleNotFound);
app.use(errorHandler);
app.listen(8000, () => {
  console.log("the port is learning on port 8000");
});
