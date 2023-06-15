const mongoose = require("mongoose");

const movieFavoriteSchema = mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  listMovie:[ {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Movie",
    required: true,
  }],

});

module.exports = mongoose.model("Favorite", movieFavoriteSchema);
