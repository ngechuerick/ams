/**Here we shall be defining the global error handler */
const AppError = require("./../utils/appError");

// TODO IMPLEMENT HANDLING ERRORS FOR REFERENCE ERRORS
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;

  return new AppError(message, 400);
};

const handleValidationError = (err) => {
  const errorMsgs = Object.values(err.errors).map((el) => el.message);

  console.log(err);
  /**Creating an instance of the appError (inorder for the error to have the isOperational Flag) */
  return new AppError(errorMsgs, err.statusCode);
};

const handleEmailError = (err) => {
  return new AppError(err.message, 400);
};

const handleDuplicateError = (err) => {
  const duplicateVal = err.errorResponse.errmsg.match(
    /(["'])(?:(?=(\\?))\2.)*?\1/
  )[0];

  console.log(err);

  const message = `Duplicate field value: ${duplicateVal}. Please use another value`;

  return new AppError(message, 400);
};

const handleTokenExpiredError = (err) => {
  return new AppError("Invalid or expired token. Please log in again.", 401);
};

const sendErrorDevelopment = (err, res) => {
  /**IN DEVELOPMENT MODE WE WANT TO SEE THE WHOLE ERROR AND STACK TRACE! */
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const sendErrorProduction = (err, res) => {
  console.log(err);
  /**OPERATIONAL ERRORS WHICH ARE HANDLED: SEND A CUSTOM ERROR MESSAGE TO CLIENT */
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });

    /**PROGRAMMING OR OTHER UNKOWN ERRORS (NOT OPERATIONAL ERRORS) */
  } else {
    /**Log the error */
    console.log(err, "💣💣");

    /**Respond to user! */
    res.status(500).json({
      status: "error",
      message: "Something went very wrong!"
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  if (process.env.NODE_ENV === "development") {
    sendErrorDevelopment(err, res);
  } else if (process.env.NODE_ENV === "production") {
    console.log(err, typeof err);
    // let error = { ...err };
    let error = Object.assign({}, err, { message: err.message });

    if (err.name === "CastError") error = handleCastErrorDB(error);
    if (err.name === "ValidationError") error = handleValidationError(err);
    if (err.name === "TokenExpiredError") error = handleTokenExpiredError(err);
    if (err.code === 11000) error = handleDuplicateError(err);
    if (err.code === "ENVELOPE") error = handleEmailError(err);

    sendErrorProduction(error, res);
  }
};
