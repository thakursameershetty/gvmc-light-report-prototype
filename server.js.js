const express = require('express');
const cors = require('cors'); // To allow requests from your front-end domain
const path = require('path'); // To work with file paths
const nodemailer = require('nodemailer'); // Import Nodemailer

const app = express();
const PORT = process.env.PORT || 3008; // Use port 3000 unless specified otherwise

// --- Configure Email Transporter (Replace with your actual details) ---
const transporter = nodemailer.createTransport({
  service: 'Gmail', // Or your email service provider (e.g., 'Sendgrid', 'Mailgun')
  auth: {
    user: '5221411136@gvpcdpgc.edu.in',       // Your email address
    pass: 'naac@2024' // Your email password or an App Password (for Gmail)
  }
});

// Middleware
app.use(cors()); // Allow cross-origin requests (adjust in production!)
app.use(express.json()); // Parse incoming JSON requests
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded requests

// Serve static files (HTML, CSS, JS) from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// --- API Endpoint to Receive Reports ---
app.post('/api/report', async (req, res) => {
  console.log('--- New Report Received ---');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Received report data:', req.body);

  // --- Data Validation (Basic Example) ---
  const { name, email, phone, location, issueType } = req.body;
  if (!name || !email || !phone || !location || !issueType) {
    // If required fields are missing
    console.error("Validation Failed: Missing required fields");
    return res.status(400).json({ message: 'Bad Request: Missing required fields.' });
  }

  // --- Generate a Reference ID (Simple Example) ---
  const referenceId = 'GVMC-REPORT-' + Date.now();
  console.log('Generated Reference ID:', referenceId);

  // --- Database Interaction (SIMULATED) ---
  console.log(`Simulating: Saving report ${referenceId} to database...`);

  // --- Construct the email message ---
  const mailOptions = {
    from: 'your_email@gmail.com',       // Your email address
    to: 'jeevansahukar8@gmail.com', // The email address to send the report to
    subject: `New Street Light Report - Reference ID: ${referenceId}`,
    html: `
      <p>A new street light issue has been reported:</p>
      <ul>
        <li><strong>Name:</strong> ${name}</li>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Phone:</strong> ${phone}</li>
        <li><strong>Location:</strong> ${location}</li>
        <li><strong>Latitude:</strong> ${req.body.latitude || 'N/A'}</li>
        <li><strong>Longitude:</strong> ${req.body.longitude || 'N/A'}</li>
        <li><strong>Issue Type:</strong> ${issueType}</li>
        <li><strong>Description:</strong> ${req.body.description || 'N/A'}</li>
        <li><strong>Reference ID:</strong> ${referenceId}</li>
        <li><strong>Reported At:</strong> ${new Date().toISOString()}</li>
      </ul>
    `
  };

  // --- Send the email ---
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    res.status(201).json({
      message: 'Report submitted successfully and email sent!',
      referenceId: referenceId
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(201).json({ // Still send success response to user
      message: 'Report submitted successfully, but there was an error sending the email.',
      referenceId: referenceId
    });
  }
});

// Catch-all for root - serves index.html from public folder
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log("Backend is running. Access the application through your browser.");
  console.log("Submitted reports will be logged here in the console (SIMULATED saving) AND an email will be sent to jeevansahukar8@gmail.com.");
});