const express = require("express");
const transactionController = require("../controllers/transactionController");

const router = express.Router();

router.route("/payment").post(transactionController.getTransaction);
router.route("/callback").post(transactionController.getCallback);

router
  .route("/paymentsreport/:type")
  .get(transactionController.generatePaymentsReports);

router
  .route("/monthlypayments")
  .get(transactionController.calculateMonthlyTransactions);

router
  .route("/yearlypayments")
  .get(transactionController.calculateTotalYearlyTransactions);

router.route("/confirm-payment").post(transactionController.verifyTransaction);

router.route("/").get(transactionController.getAllTransactions);

module.exports = router;
