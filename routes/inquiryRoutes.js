const express = require("express");
const inquiriesController = require("../controllers/inquiriesController");

const router = express.Router();

router
  .route("/")
  .get(inquiriesController.getAllInquiries)
  .post(inquiriesController.createInquiry);

router
  .route("/:id")
  .get(inquiriesController.getInquiry)

  .delete(inquiriesController.deleteInquiry)
  .patch(inquiriesController.updateInquiry);

module.exports = router;
