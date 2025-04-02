const User = require("../models/userModel");
const APIFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

const generatePDF = require("../utils/pdfGenerate");
const { initiatePayRequest } = require("../utils/darajaAPI");

const Transaction = require("./../models/transactionModel");
const { trySending } = require("../utils/email");

/**Here we shall be handling all maters transaction */
exports.getTransaction = catchAsync(async (req, res, next) => {
  /**This will be defined as an arbitrary value: FIXME TO BE UPDATED*/
  const amount = req.body.amount;
  let phone;

  /**Based on user input,we convert the value */
  if (req.body.phone.startsWith("0")) {
    const correctPhone = req.body.phone.split("").slice(1);

    correctPhone.unshift("254");

    const phoneStr = correctPhone.join("");
    phone = phoneStr;
  } else {
    phone = req.body.phone;
  }

  const paymentResponse = await initiatePayRequest(phone, amount);

  res.status(200).json({
    status: "success",
    data: paymentResponse?.ResponseDescription
  });
});

/**Endpoint for the confirmation of our api request status */
exports.getCallback = catchAsync(async (req, res, next) => {
  // Handle GET requests (from the frontend)
  if (req.method === "GET") {
    const { CheckoutRequestID } = req.query;
    const payment = await Transaction.findOne({
      checkoutRequestID: CheckoutRequestID
    });

    if (!payment) {
      return res.status(200).json({ message: "Awaiting result" });
    }

    return res.status(200).json({
      status: payment.status,
      message:
        payment.status === "success"
          ? "Successfully paid"
          : payment.errorMessage
    });
  }

  const callbackSTK = req.body?.Body.stkCallback;

  const { ResultCode } = req.body?.Body.stkCallback;

  if (!callbackSTK) {
    return res.status(200).json({ message: "Awaiting result" });
  }

  // // Check if a transaction already exists for this CheckoutRequestID
  // const existingTransaction = await Transaction.findOne({
  //   checkoutRequestID: CheckoutRequestID
  // });

  // if (existingTransaction) {
  //   // If it exists, return early to avoid duplicates
  //   return res.status(200).json({
  //     status: existingTransaction.status,
  //     message:
  //       existingTransaction.status === "success"
  //         ? "Successfully paid"
  //         : existingTransaction.errorMessage
  //   });
  // }

  /**If the transaction was successfull,we need to create the transaction in the DB */
  if (ResultCode === 0) {
    const items = callbackSTK.CallbackMetadata?.Item || [];

    const { Amount, MpesaReceiptNumber, TransactionDate, PhoneNumber } =
      items.reduce((acc, item) => {
        acc[item.Name] = item.Value || "";
        return acc;
      }, {});

    /**I guess we can also find a tenant by phone number and then insert tenant id to the transaction */
    /**Here we are converting the 254......number into one readable*/
    let phonestr = "";
    const phone = `${PhoneNumber}`.substring(3);

    if (phone.length === 8) {
      phonestr = "07";
    } else if (phone.length === 9) {
      phonestr = "0";
    }

    const normalPhone = `${PhoneNumber}`.replace(/^254/, phonestr);

    const tenantPaying = await User.findOne({
      phoneNumber: normalPhone
    });

    /**Create a new transaction */
    const data = await Transaction.create({
      amountPaid: Amount,
      mpesatransactionCode: MpesaReceiptNumber,
      phoneNumber: PhoneNumber,
      tenant: tenantPaying._id,
      checkoutRequestID: callbackSTK.CheckoutRequestID,
      status: "success"
    });

    console.log(data);

    if (!data) {
      return next(
        new AppError("There was an error creating a transaction", 404)
      );
    }

    /**Add the transaction Id to the transaction array on the user document */
    const tenant = await User.updateOne(
      { phoneNumber: normalPhone },
      {
        $push: { payments: data._id },
        $set: { paidRent: true }
      },
      { new: true }
    );

    if (!tenant) {
      return next(new AppError("Tenant does not exist", 404));
    }

    // const date = new Date();
    // const month = date.getMonth() + 1;

    // const optionsObj = {
    //   email: [tenant.email],
    //   subject: "Payment confirmation",
    //   message: `Dear ${tenant.firstName} ,
    //     Thankyou for making your rent payment for this Month ${month}
    //     Amount: ${Amount}
    //     `
    // };

    // await trySending(optionsObj);

    res.status(200).json({
      status: "success",
      message: "Successfully paid"
    });
  } else {
    /** Handle common M-Pesa errors */
    const errorMessages = {
      1037: "Ensure your mobile is on!",
      1025: "Transaction error. Try again.",
      999: "Transaction error. Try again.",
      1032: "You cancelled the request. Try again!",
      1: "Insufficient funds. Try again.",
      1019: "Transaction expired. Please try again.",
      2001: "You have entered wrong pin"
    };

    const errorMessage =
      errorMessages[ResultCode] || "Payment processing error";
    await Transaction.create({
      errorMessage,
      checkoutRequestID: callbackSTK.CheckoutRequestID,
      status: "failed"
    });

    return next(new AppError(errorMessage, 401));
  }
  // return next(new AppError("Payment processing error", 400));

  // } else if (ResultCode === 1037) {
  //   return next(new AppError("Please ensure your mobile is on!", 401));
  // } else if (ResultCode === 1025 || ResultCode === 999 || ResultCode === 1025) {
  //   return next(new AppError("There was an error. Please try again.", 401));
  // } else if (ResultCode === 1032) {
  //   return next(new AppError("You cancelled the request. Try again!", 401));
  // } else if (ResultCode === 1) {
  //   return next(
  //     new AppError("You do not have sufficient funds try again.", 401)
  //   );
  // } else if (ResultCode === 1019) {
  //   return next(new AppError("Transaction expired,please try again.", 401));
  // } else if (ResultCode === 1037) {
  //   return next(new AppError("Request Failed,please try again", 401));
  // }
});

/**TODO I guess this will be implemented later */
exports.verifyTransaction = catchAsync(async (req, res, next) => {});

exports.getAllTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find().populate("tenant");

    // await Transaction.calcTotalRent(3);

    res.status(200).json({
      status: "success",
      data: transactions
    });
  } catch (err) {
    console.log(err);
  }
};

exports.calculateMonthlyTransactions = catchAsync(async (req, res, next) => {
  const result = await Transaction.calcTotalMonthRent();

  res.status(200).json({
    status: "success",
    data: result
  });
});

exports.calculateTotalYearlyTransactions = catchAsync(
  async (req, res, next) => {
    const result = await Transaction.calcTotalYearlyRent();

    res.status(200).json({
      status: "success",
      data: result
    });
  }
);

exports.generatePaymentsReports = catchAsync(async (req, res, next) => {
  const reportType = req.params.type;
  let data, reportName;

  /**We need to fetch payments data */
  /**Also tenants info */
  const customQuery = {
    ...req.query,
    role: "tenant",
    unit: { $ne: "", $ne: null, $exists: true },
    fields: "firstName,lastName,createdAt"
  };

  if (reportType === "lease") {
    const features = new APIFeatures(User.find(), customQuery)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const tenants = await features.query;

    const tenantsArr = [];

    tenants.slice().forEach((user) => {
      return tenantsArr.push({
        Firstname: user.firstName,
        Lastname: user.lastName,
        Joined: `${new Date(user.createdAt).toLocaleDateString()}`,
        unitNum: user?.unit?.unitNum,
        apartmentUnit: user?.unit?.apartmentUnit
      });
    });

    data = tenantsArr;
    reportName = "Lease";
  }
  if (reportType === "payments") {
    const payments = await Transaction.find();

    const paymentsArr = [];

    payments.slice().forEach((payment) =>
      paymentsArr.push({
        Method: payment.paymentMethod,
        Amount: payment.amountPaid,
        Phone: payment.phoneNumber,
        Paid: `${new Date(payment.createdAt).toLocaleDateString()}`
      })
    );

    data = paymentsArr;
    reportName = "PaymentHistory";
  }

  /**Here we sent the generated report to the client */
  /**TODO WE CAN IMPLEMENT THAT WHEN A REPORT IS GENERATED, THE MANAGER CAN RECEIVE AN EMAIL ON THE SAME */
  const pdfBlob = generatePDF(data, reportName);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment: filename=${reportName}_Report.pdf`
  );
  res.send(Buffer.from(await pdfBlob.arrayBuffer()));
});
