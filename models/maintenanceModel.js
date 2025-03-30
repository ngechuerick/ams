const mongoose = require("mongoose");

const maintenanceSchema = mongoose.Schema({
  photo: {
    type: String,
  },
  description: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now(),
  },
  room: {
    type: String,
  },
  tenant: {
    type: String,
  },
  status: {
    type: String,
    enum: ["new", "fixing", "fixed"],
    default: "new",
  },
});

const Maintenance = mongoose.model("Maintenance", maintenanceSchema);

module.exports = Maintenance;
