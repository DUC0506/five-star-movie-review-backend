const express = require("express");

const {
  create,
  verifyEmail,
  resendEmailVerificationToken,
  forgetPassword,
  sendResetPasswordStatus,
  resetPassword,
  signIn,
  getUser,
  addFavoriteMovie,
  deleteFavoriteMovie,
  getMovieFavorite,
} = require("../controllers/user");
const { isAuth } = require("../middlewares/auth");
const { isValidPassResetToken } = require("../middlewares/user");
const {
  userValidator,
  validate,
  validatePassword,
  signInValidator,
} = require("../middlewares/validator");
const { sendError } = require("../utils/helper");
const router = express.Router();

router.get("/getUser/:userId", getUser);
router.get("/get-movie-favorite/:userId", getMovieFavorite);


router.delete("/movie-favorite/:movieId",isAuth,deleteFavoriteMovie)
router.post("/add-movie-favorite/:movieId",isAuth,addFavoriteMovie)
router.post("/create", userValidator, validate, create);
router.post("/sign-in", signInValidator, validate, signIn);
router.post("/verify-email", verifyEmail);
router.post("/resend-email-verification-token", resendEmailVerificationToken);
router.post("/forget-password", forgetPassword);
router.post(
  "/verify-pass-reset-token",
  isValidPassResetToken,
  sendResetPasswordStatus
);
router.post(
  "/reset-password",
  validatePassword,
  validate,
  isValidPassResetToken,
  resetPassword
);
router.get("/is-auth", isAuth, (req, res) => {
  const { user } = req;
  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      role: user.role,
    },
  });
});

module.exports = router;
