const express = require("express");

const unitController = require("./../controllers/unitController");

/**Here we are creating a sort of a miniapplication */
const router = express.Router();

router
  .route("/")
  .get(unitController.getAllUnits)
  .get(unitController.getUnit)
  .post(unitController.createUnit);

router
  .route("/:id")
  .delete(unitController.deleteUnit)
  .patch(unitController.updateUnit);

module.exports = router;
