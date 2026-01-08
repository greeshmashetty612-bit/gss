const express = require("express");
const cors = require("cors");
const connectDB = require("./db");
const Complaint = require("./models/Complaint");

connectDB();

// 👇👇 PASTE AUTO-ASSIGN CODE HERE 👇👇

// workers list (temporary / hardcoded)
const workers = [
  { name: "Suresh", department: "Electrical",available:true },
  { name: "Raju", department: "Electrical",available:true },
  { name: "Chotu", department: "Electrical",available:true },
  { name: "Ramesh", department: "Civil",available:true },
  { name: "Mukesh", department: "Civil",available:true },
  { name: "Abdul", department: "Civil",available:true },
  { name: "Amit", department: "Lan",available:true },
  { name: "Bagha", department: "Lan",available:true },
  { name: "Magan", department: "Lan",available:true },
];

async function autoAssignWorker(category) {
  const deptWorkers = workers.filter(w => w.department === category && w.available);

  if (deptWorkers.length === 0) return "Unassigned";

  let minLoad = Infinity;
  let chosenWorker ="Unassigned";

  for (let w of deptWorkers) {
    const activeCount = await Complaint.countDocuments({
      worker: w.name,
      status: "inprogress",
    });

    if (activeCount < minLoad && activeCount<3) {
      minLoad = activeCount;
      chosenWorker = w.name;
    }
  }

  return chosenWorker;
}

// 👆👆 END AUTO-ASSIGN CODE 👆👆

const app = express();
app.use(cors());
app.use(express.json());
// test route
app.get("/", (req, res) => {
  res.send("Backend is running");
});

/* ======================
   STUDENT: Raise complaint
   ====================== */
app.post("/api/complaints", async (req, res) => {
  try {
    const worker = await autoAssignWorker(req.body.category);

    const complaint = new Complaint({
      ...req.body,
      status: "pending",
      worker,
      assignedOn: worker === "Unassigned" ? null : new Date(),
      registeredOn: new Date(),
    });

    await complaint.save();
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// GET complaints of one student
app.get("/api/complaints/student/:studentId", async (req, res) => {
  const complaints = await Complaint.find({
    studentId: req.params.studentId
  });
  res.json(complaints);
});
/* ======================
   ADMIN: Fetch complaints
   ====================== */
app.get("/api/complaints", async (req, res) => {
  try {
    const complaints = await Complaint.find();
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ======================
   ADMIN: Assign worker
   ====================== */


/* ======================
   WORKER: Update complaint
   ====================== */
app.put("/api/complaints/:id", async (req, res) => {
  try {
    const { status, cost, reason } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    complaint.status = status;        // pending | inprogress | resolved
    complaint.cost = cost;
    complaint.reason = reason;

    if (status === "resolved") {
      complaint.resolvedOn = new Date();
    }
    if (status === "inprogress" && !complaint.assignedOn){
      complaint.assignedOn = new Date();
    }

    await complaint.save();
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const Announcement = require("./models/Announcement");

// Admin posts announcement
app.post("/api/announcements", async (req, res) => {
  const a = new Announcement({ text: req.body.text });
  await a.save();
  res.json(a);
});

// Student fetches announcements
app.get("/api/announcements", async (req, res) => {
  const announcements = await Announcement.find().sort({ createdAt: -1 });
  res.json(announcements);
});

// ===== delete ANNOUNCEMENTS =====
app.delete("/api/announcements/:id", async (req, res) => {
  await Announcement.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted successfully" });
});

 
//rating//
// STUDENT: Submit rating
app.put("/api/complaints/:id/rate", async (req, res) => {
  try {
    const { rating } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    if (complaint.status !== "resolved") {
      return res.status(400).json({ message: "Cannot rate unresolved complaint" });
    }

    if(complaint.rating){
      return res.status(400).json({message:"Alrready Rated"});
    }
    complaint.rating = Number(req.body.rating);
    await complaint.save();

    res.json({ message: "Rating submitted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
//workers perf//
app.get("/api/workers/performance", async (req, res) => {
  const data = await Complaint.aggregate([
    { $match: { status: "resolved", rating: { $exists: true } } },
    {
      $group: {
        _id: "$worker",
        category:{$first:"$category"},
        complaintsHandled: { $sum: 1 },
        avgRating: { $avg: "$rating" },
        totalCost: { $sum: "$cost" },
      }
    }
  ]);

  res.json(data);
});

app.listen(5000, () => {
  console.log("Server started on port 5000");
});