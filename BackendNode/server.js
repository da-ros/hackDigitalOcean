const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true })); // Twilio sends form-encoded data
app.use(bodyParser.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.method === "POST") {
    console.log("Request Body:", req.body);
  }
  next();
});

// In-memory storage for user data (replace with database in production)
let userData = [];

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    totalUsers: userData.length,
  });
});
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to the Twilio Studio Webhook API!",
  });
  console.log("Received request for root path");
});
// Get all stored user data
app.get("/users", (req, res) => {
  res.json({
    success: true,
    count: userData.length,
    users: userData,
  });
});

// Main webhook endpoint for Twilio Studio
app.post("/twilio-webhook", async (req, res) => {
  try {
    console.log("=== Twilio Studio Webhook Received ===");
    console.log("Full request body:", JSON.stringify(req.body, null, 2));

    // Extract user data from Twilio Studio variables
    // These should match the variable names you set in Twilio Studio
    const userInfo = {
      id: Date.now().toString(), // Simple ID generation
      name: req.body.name || req.body.user_name || req.body.UserName || "",
      job: req.body.job || req.body.current_job || req.body.CurrentJob || "",
      phone: req.body.From || req.body.Caller || "",
      callSid: req.body.CallSid || "",
      accountSid: req.body.AccountSid || "",
      timestamp: new Date().toISOString(),
      callStatus: req.body.CallStatus || "",
      fromCity: req.body.FromCity || "",
      fromState: req.body.FromState || "",
      fromCountry: req.body.FromCountry || "",
    };

    console.log("Processed user info:", userInfo);

    // Validate required fields
    if (!userInfo.name && !userInfo.job) {
      console.log("⚠️  No name or job data found in request");
      // Still process the request but log the issue
    }

    // Store user data
    if (userInfo.name || userInfo.job) {
      userData.push(userInfo);
      console.log(`✅ User data stored. Total users: ${userData.length}`);

      // Optional: Save to file for persistence
      await saveUserDataToFile(userInfo);
    }

    // Send success response back to Twilio Studio
    res.json({
      success: true,
      message: "User data received and processed successfully",
      data: {
        name: userInfo.name,
        job: userInfo.job,
        phone: userInfo.phone,
        timestamp: userInfo.timestamp,
      },
    });

    // Log successful processing
    console.log(
      `✅ Successfully processed data for: ${userInfo.name || "Unknown"}`
    );
  } catch (error) {
    console.error("❌ Error processing Twilio webhook:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Smart TwiML webhook endpoint that checks for missing info and asks follow-up questions
app.post("/twilio-twiml", async (req, res) => {
  try {
    console.log("=== Smart TwiML Webhook Received ===");
    console.log("Request body:", req.body);

    // Extract user data from request
    const userInfo = {
      name: req.body.name || req.body.user_name || req.body.UserName || "",
      job: req.body.job || req.body.current_job || req.body.CurrentJob || "",
      phone: req.body.From || "",
      callSid: req.body.CallSid || "",
      timestamp: new Date().toISOString(),
      // Track what step we're on
      step: req.body.step || "initial",
    };

    console.log("Processed user info:", userInfo);

    // Clean up the data (trim whitespace, handle "unknown" responses)
    userInfo.name = cleanUserInput(userInfo.name);
    userInfo.job = cleanUserInput(userInfo.job);

    let twiml = "";

    // Check what information is missing and create appropriate response
    const missingName = !userInfo.name;
    const missingJob = !userInfo.job;

    if (missingName && missingJob) {
      // Both missing - ask for name first
      console.log("❌ Both name and job missing - asking for name");
      twiml = createGatherTwiML(
        "I didn't catch your information clearly. Let's start over. Please say your full name after the beep.",
        "name",
        "/twilio-twiml"
      );
    } else if (missingName && !missingJob) {
      // Only name missing
      console.log("❌ Name missing - asking for name");
      twiml = createGatherTwiML(
        "I got your job title, but I didn't catch your name. Please say your full name after the beep.",
        "name",
        "/twilio-twiml",
        { job: userInfo.job } // Pass along the job we already have
      );
    } else if (!missingName && missingJob) {
      // Only job missing
      console.log("❌ Job missing - asking for job");
      twiml = createGatherTwiML(
        `Thank you ${userInfo.name}. I didn't catch your job title clearly. Please say your current job or profession after the beep.`,
        "job",
        "/twilio-twiml",
        { name: userInfo.name } // Pass along the name we already have
      );
    } else {
      // Both present - we're done!
      console.log("✅ All info collected - storing and thanking user");

      // Store the complete data
      const completeUserInfo = {
        id: Date.now().toString(),
        ...userInfo,
      };

      userData.push(completeUserInfo);
      await saveUserDataToFile(completeUserInfo);

      // Create success message
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Perfect! Thank you ${userInfo.name}. I've recorded that you work as ${userInfo.job}.</Say>
    <Pause length="1"/>
    <Say voice="alice">Your information has been saved successfully. Have a wonderful day!</Say>
    <Hangup/>
</Response>`;
    }

    console.log("Sending TwiML response");
    res.type("text/xml");
    res.send(twiml);
  } catch (error) {
    console.error("❌ Error in Smart TwiML webhook:", error);

    // Return error TwiML
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">I'm sorry, there was a technical error. Please try calling again later.</Say>
    <Hangup/>
</Response>`;

    res.type("text/xml");
    res.send(errorTwiml);
  }
});

// Helper function to create Gather TwiML for missing information
function createGatherTwiML(
  prompt,
  fieldToGather,
  webhookUrl,
  existingData = {}
) {
  // Build hidden parameters to pass existing data along
  let hiddenParams = "";
  Object.keys(existingData).forEach((key) => {
    if (existingData[key]) {
      hiddenParams += `<Parameter name="${key}" value="${existingData[key]}" />`;
    }
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech" timeout="5" speechTimeout="2" action="${webhookUrl}" method="POST">
        <Say voice="alice">${prompt}</Say>
        ${hiddenParams}
        <Parameter name="gathering" value="${fieldToGather}" />
    </Gather>
    <Say voice="alice">I didn't hear anything. Let me try asking again.</Say>
    <Redirect>${webhookUrl}?retry=true</Redirect>
</Response>`;
}

// Helper function to clean and validate user input
function cleanUserInput(input) {
  if (!input) return "";

  // Clean up the input
  let cleaned = input.toString().trim().toLowerCase();

  // Remove common speech-to-text artifacts and non-responses
  const invalidResponses = [
    "unknown",
    "unclear",
    "silence",
    "no response",
    "um",
    "uh",
    "er",
    "hmm",
    "nothing",
    "none",
    "i don't know",
    "not sure",
    "skip",
  ];

  if (invalidResponses.includes(cleaned) || cleaned.length < 2) {
    return ""; // Treat as missing
  }

  // Return properly capitalized version
  return input.toString().trim();
}

// Endpoint to receive user data directly (for testing or other integrations)
app.post("/user-data", async (req, res) => {
  try {
    console.log("=== Direct User Data Received ===");

    const userInfo = {
      id: Date.now().toString(),
      name: req.body.name || "",
      job: req.body.job || req.body.currentJob || "",
      phone: req.body.phone || "",
      timestamp: new Date().toISOString(),
      source: "direct_api",
    };

    // Validate required fields
    if (!userInfo.name || !userInfo.job) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        message: "Both name and job are required",
      });
    }

    // Store user data
    userData.push(userInfo);
    await saveUserDataToFile(userInfo);

    console.log(
      `✅ Direct user data stored: ${userInfo.name} - ${userInfo.job}`
    );

    res.json({
      success: true,
      message: "User data stored successfully",
      data: userInfo,
    });
  } catch (error) {
    console.error("❌ Error storing user data:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Get specific user by ID
app.get("/users/:id", (req, res) => {
  const user = userData.find((u) => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }
  res.json({
    success: true,
    user: user,
  });
});

// Delete user data (for testing)
app.delete("/users", (req, res) => {
  const count = userData.length;
  userData = [];
  res.json({
    success: true,
    message: `Deleted ${count} users`,
  });
});

// Helper function to save user data to file (optional persistence)
async function saveUserDataToFile(userInfo) {
  try {
    const dataDir = path.join(__dirname, "data");
    const filePath = path.join(dataDir, "users.json");

    // Create data directory if it doesn't exist
    try {
      await fs.mkdir(dataDir, { recursive: true });
    } catch (err) {
      // Directory might already exist
    }

    // Read existing data or create empty array
    let existingData = [];
    try {
      const fileContent = await fs.readFile(filePath, "utf8");
      existingData = JSON.parse(fileContent);
    } catch (err) {
      // File doesn't exist yet, start with empty array
    }

    // Add new user data
    existingData.push(userInfo);

    // Write back to file
    await fs.writeFile(filePath, JSON.stringify(existingData, null, 2));
    console.log(`💾 User data saved to file: ${filePath}`);
  } catch (error) {
    console.error("❌ Error saving to file:", error);
    // Don't throw error, just log it
  }
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("❌ Unhandled error:", error);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: error.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Not found",
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Start server
app.listen(PORT, () => {
  console.log("🚀 =================================");
  console.log(`🚀 Express Server running on port ${PORT}`);
  console.log("🚀 =================================");
  console.log(`📞 Twilio Webhook: http://localhost:${PORT}/twilio-webhook`);
  console.log(`📞 Twilio TwiML: http://localhost:${PORT}/twilio-twiml`);
  console.log(`👥 User Data API: http://localhost:${PORT}/user-data`);
  console.log(`📊 View Users: http://localhost:${PORT}/users`);
  console.log(`💚 Health Check: http://localhost:${PORT}/health`);
  console.log("🚀 =================================");
  console.log("Ready to receive Twilio Studio calls! 📞");
});

module.exports = app;
