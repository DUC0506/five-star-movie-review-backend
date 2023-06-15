const mongoose = require("mongoose");

//127.0.0.1
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("db is connected");
  })
  .catch((ex) => {
    console.log("db is connected failed:", ex);
  });
