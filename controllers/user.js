const nodemailer = require("nodemailer");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const Movie = require("../models/movie");
const Favorite = require("../models/movieFavorite");
const User = require("../models/user");
const EmailVerificationToken = require("../models/emailVerificationToken");
const PasswordResetToken = require("../models/passwordResetToken");
const { isValidObjectId } = require("mongoose");
const { generateOTP, generateMailTransporter } = require("../utils/mail");
const { sendError, generateRandomByte, getAverageRatings } = require("../utils/helper");

exports.create = async (req, res) => {
  const { name, email, password } = req.body;

  const oldUser = await User.findOne({ email });

  if (oldUser) return sendError(res, "This email is already in use !");

  const newUser = new User({ name, email, password });

  await newUser.save();

  //create OTP
  let OTP = generateOTP();
  // store otp inside our db
  const newEmailVerificationToken = new EmailVerificationToken({
    owner: newUser._id,
    token: OTP,
  });
  await newEmailVerificationToken.save();

  // send that otp to our user

  var transport = generateMailTransporter();
  transport.sendMail({
    from: "verification@reviewapp.com",
    to: newUser.email,
    subject: "Email Verification",
    html: `
    <p>Your verification OTP</p>
    <h1>${OTP}</h1>
    `,
  });

  res.status(201).json({
    user: {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
    },
  });
};

exports.verifyEmail = async (req, res) => {
  const { userId, OTP } = req.body;

  if (!isValidObjectId(userId)) return res.json({ error: "Invalid user !" });

  const user = await User.findById(userId);

  if (!user) return sendError(res, "user not found !", 404);

  if (user.isVerified) return sendError(res, " user is already verified !");

  const token = await EmailVerificationToken.findOne({ owner: userId });

  if (!token) return sendError(res, " token not found !");

  const isMatched = await token.compareToken(OTP);

  if (!isMatched) return sendError(res, "Please submit a valid OTP!");

  user.isVerified = true;

  await user.save();

  await EmailVerificationToken.findByIdAndDelete(token._id);

  var transport = generateMailTransporter();

  transport.sendMail({
    from: "verification@reviewapp.com",
    to: user.email,
    subject: "Welcome Email ",
    html: `
    <h1>Welcome to our app and thanks for choosing us.</h1>
    
    `,
  });
  const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      token: jwtToken,
      isVerified: user.isVerified,
      role: user.role,
    },
    message: "Your email is verified",
  });
};

exports.resendEmailVerificationToken = async (req, res) => {
  const { userId } = req.body;
  const user = await User.findById(userId);
  if (!user) return sendError(res, " user not found !");

  if (user.isVerified)
    return sendError(res, " This email id is already verified !");

  const alreadyHasToken = await EmailVerificationToken.findOne({
    owner: userId,
  });

  if (alreadyHasToken)
    return sendError(
      res,
      " Only after one hour you can request for another token!"
    );

  //create OTP
  let OTP = generateOTP();
  // store otp inside our db
  const newEmailVerificationToken = new EmailVerificationToken({
    owner: user._id,
    token: OTP,
  });
  await newEmailVerificationToken.save();

  // send that otp to our user

  var transport = generateMailTransporter();

  transport.sendMail({
    from: "verification@reviewapp.com",
    to: user.email,
    subject: "Email Verification",
    html: `
    <p>Your verification OTP</p>
    <h1>${OTP}</h1>
    `,
  });
  res.json({ message: "New OTP has been sent to registered email account" });
};

exports.forgetPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return sendError(res, "email is missing ");

  const user = await User.findOne({ email });

  if (!user) return sendError(res, "User not found ", 404);

  const alreadyHasToken = await PasswordResetToken.findOne({ owner: user._id });

  if (alreadyHasToken)
    return sendError(
      res,
      " Only after one hour you can request for another token!"
    );

  const token = await generateRandomByte();
  const newPasswordResetToken = await PasswordResetToken({
    owner: user._id,
    token,
  });
  await newPasswordResetToken.save();
  const resetPasswordUrl = `http://localhost:3000/auth/reset-password?token=${token}&id=${user._id}`;

  const transport = generateMailTransporter();

  transport.sendMail({
    from: "security@reviewapp.com",
    to: user.email,
    subject: "Reset Password Link",
    html: `
    <p>Click here to reset password</p>
    <a href='${resetPasswordUrl}'>Change Password</h1>
    `,
  });

  res.json({ message: "Link sent to your email" });
};

exports.sendResetPasswordStatus = (req, res) => {
  res.json({ valid: true });
};
exports.resetPassword = async (req, res) => {
  const { newPassword, userId } = req.body;
  const user = await User.findById(userId);
  const matched = await user.comparePassword(newPassword);
  if (matched)
    return sendError(
      res,
      "The new password must be different from the old one"
    );

  user.password = newPassword;
  await user.save();
  await PasswordResetToken.findByIdAndDelete(req.resetToken._id);
  const transport = generateMailTransporter();

  transport.sendMail({
    from: "security@reviewapp.com",
    to: user.email,
    subject: "Password Reset Successfully",
    html: `
    <h1>Password Reset Successfully</h1>
    <p>Now you can use new password</p>
    `,
  });

  res.json({
    message: "Password Reset Successfully,Now you can use new password",
  });
};

exports.signIn = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  console.log(user);
  if (!user) return sendError(res, "Email/Password mismatch");

  const matched = await user.comparePassword(password);
  if (!matched) return sendError(res, "Email/Password mismatch");

  const { _id, name, role, isVerified } = user;
  const jwtToken = jwt.sign({ userId: _id }, process.env.JWT_SECRET);

  res.json({
    user: { id: _id, name, email, role, token: jwtToken, isVerified },
  });
};

exports.getUser=async(req,res)=>{
  const{userId}=req.params;
  if (!isValidObjectId(userId)) return sendError(res, "Invalid request");

  const user = await User.findById(userId)
  if (!user) return sendError(res, "Invalid request,actor not found", 404);
  res.json({user})
}

exports.addFavoriteMovie=async(req,res)=>{
  const { movieId } = req.params;
  const userId = req.user._id;
  if(!req.user.isVerified) return sendError(res,'Please verify you email first!')

  if (!isValidObjectId(movieId)) return sendError(res, "Invalid Movie");

  const movie = await Movie.findOne({ _id: movieId, status: "public" });

  if (!movie) return sendError(res, "Movie not found", 404);

  const isFavoriteMovie = await Favorite.findOne({
    owner: userId,
    listMovie: { $in: [movie._id] }
  });

  if (isFavoriteMovie)
    return sendError(res, "Invalid request,favorite movie is already their");

    const isFavoriteMovieAgain = await Favorite.findOne({
      owner: userId,
     
    });
    
  if (isFavoriteMovieAgain)
  {
    isFavoriteMovieAgain.listMovie.push(movie._id)
   
    await isFavoriteMovieAgain.save();
    res.json({ message: "Your movie favorite has been added.",isFavoriteMovieAgain, });
  }
  else{
    const newFavorite = new Favorite({
      owner: userId,
     
      
    });
    newFavorite.listMovie.push(movie._id);
    await newFavorite.save();
    res.json({ message: "Your movie favorite has been added.",newFavorite, });
  }
 
  
}
exports.deleteFavoriteMovie=async(req,res)=>{
  const { movieId } = req.params;
  const userId = req.user._id;
  if (!isValidObjectId(movieId)) return sendError(res, "Invalid Movie Id");

  
 await Favorite.findOneAndUpdate({ owner: userId,  $pull: { listMovie: movieId } });
 
   
  res.json({ message: " movie favorite has been removed." });
 
}

exports.getMovieFavorite=async(req,res)=>{
  const { userId } = req.params;

  if (!isValidObjectId(userId)) return sendError(res, "Invalid movie Id");


 const moviesFavorite=await Favorite.findOneAndUpdate({ owner: userId, }).populate({
  path: "listMovie",
 
});
 
const mapMovies= async(m)=>{
  const reviews= await getAverageRatings(m._id)
  return{
     id:m._id,
     title:m.title,
     poster:m.poster,
     responsivePosters:m.poster.responsive,
     reviews:{...reviews}
  }
  }
  const results= await Promise.all(moviesFavorite.listMovie.map(mapMovies))
  res.json({ movies: results});
 
}