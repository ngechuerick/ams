const express = require("express");
const maintenanceController = require("./../controllers/maintenanceController");

const router = express.Router();

router
  .route("/")
  .get(maintenanceController.getAllMaintenances)
  .post(
    maintenanceController.uploadMaintenancePhoto,
    maintenanceController.createMaintenance
  );

router
  .route("/:id")
  .delete(maintenanceController.deleteMaintenance)
  .patch(maintenanceController.updateMaintenance)
  .get(maintenanceController.getMaintenance);

module.exports = router;
