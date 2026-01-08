const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({
  studentName: String,
  studentId: String,
  contactNumber: String,

  category: String,
  issueType: String,   // 🔴 THIS WAS MISSING
  description: String,

  hostel: String,
  room: String,

  priority: String,
  status: {
    type: String,
    enum: ["pending","inprogress","resolved"],
    default: "pending"
  },
  cost: Number,
  reason: String,
  registeredOn: {
    type: Date,
    default: Date.now
  },
  worker: { type: String,default:"Unassigned"},
  assignedOn: Date,
  resolvedOn: Date,
  rating: {
    type: Number,
    min:1,
    max:5,
  }
  

});

module.exports = mongoose.model("Complaint", complaintSchema);