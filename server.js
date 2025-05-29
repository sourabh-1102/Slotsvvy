const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const { body, validationResult } = require('express-validator');

// --- Configuration ---
const MONGODB_URI = 'mongodb+srv://jatsourabhsinghgovindsingh:r1mbgsLKRVMoGs3S@idt1.zo4xrca.mongodb.net/?';
const TWILIO_SID = 'ACc15b452c1999015451e9c85cc0fd8924';
const TWILIO_AUTH_TOKEN = '13aa52e2d1bd0b2022b7f7545420a0c0';
const TWILIO_PHONE = '+15755705350';

// Twilio Client
let twilioClient = null;
if (TWILIO_SID && TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);
}

// App Setup
const app = express();
const PORT = 3000;
app.set('view engine', 'ejs');

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.on('connected', () => console.log('✅ MongoDB connected'));
mongoose.connection.on('error', err => console.error('❌ MongoDB error:', err));

// Schema
const ParcelSchema = new mongoose.Schema({
  trackingId: { type: String, unique: true },
  senderName: String,
  senderAddress: String,
  recipientName: String,
  recipientAddress: String,
  recipientPhone: String,
  parcelWeight: Number,
  selectedSlot: String,
  status: { type: String, default: 'booked' },
  createdAt: { type: Date, default: Date.now },
});
const Parcel = mongoose.model('Parcel', ParcelSchema);

// Helpers
function generateTrackingId() {
  return 'SS' + Date.now().toString().slice(-6);
}

async function sendSMS(to, message) {
  if (!twilioClient) return;
  try {
    await twilioClient.messages.create({
      body: message,
      from: TWILIO_PHONE,
      to,
    });
    console.log(`📱 SMS sent to ${to}`);
  } catch (err) {
    console.error('❌ Twilio SMS error:', err.message);
  }
}

// Routes

// Home page
app.get('/', async (req, res) => {
  const deliveries = await Parcel.find().sort({ createdAt: -1 }).limit(3);
  res.render('index',{
    title: 'SlotSavvy', // ✅ This fixes the error
    booking: null,
    trackingResult: null,
    deliveries,
    optimizationTip:"Group 8-10 PM deliveries in Koramangala area for 30% efficiency improvement"
  });
});

// Booking endpoint
app.post('/api/book', [
  body('senderName').notEmpty(),
  body('recipientName').notEmpty(),
  body('recipientPhone').isMobilePhone(),
  body('parcelWeight').isFloat({ min: 0.1 }),
  body('selectedSlot').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const trackingId = generateTrackingId();
  try {
    const parcel = new Parcel({ ...req.body, trackingId });
    await parcel.save();

    const smsText = `Parcel booked! Tracking ID: http://localhost:${PORT}/api/track/${trackingId}, Slot: ${req.body.selectedSlot}`;
    await sendSMS(req.body.recipientPhone, smsText);

    res.status(201).json({ success: true, trackingId });
  } catch (err) {
    console.error('❌ Booking error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Tracking endpoint
app.get('/api/track/:trackingId', async (req, res) => {

 try {
    const parcel = await Parcel.findOne({ trackingId: req.params.trackingId });
    if (!parcel) return res.status(404).send('Parcel not found');

    // Use actual parcel data
    const slots = [
      { time: '11:00 AM - 12:00 PM', available: true, success: '87%', popularity: 'High', recommended: false },
      { time: '12:00 PM - 1:00 PM', available: true, success: '92%', popularity: 'Very High', recommended: true },
      { time: '2:00 PM - 3:00 PM', available: true, success: '85%', popularity: 'Medium', recommended: false },
      { time: '3:00 PM - 4:00 PM', available: false, success: 'N/A', popularity: 'N/A', recommended: false }
    ];

    res.render('receiver', {
      parcel: {
        trackingId: parcel.trackingId,
        senderName: parcel.senderName,
        senderPhone: parcel.recipientPhone,
        address: parcel.recipientAddress,
        parcelType: parcel.parcelType || 'General',
        weight: parcel.parcelWeight + ' kg',
        deliveryDate: new Date(parcel.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'long', year: 'numeric'
        }),
        currentSlot: parcel.selectedSlot
      },
      slots,
      showSuccess: req.query.updated === 'true', // 👈 This line does the magic
      accessibilityMode: false
    });
  } catch (err) {
    console.error('❌ Tracking error:', err.message);
    res.status(500).send('Server error');
  }
});

app.post('/api/update-slot', [
  body('trackingId').notEmpty(),
  body('newSlot').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const { trackingId, newSlot } = req.body;

  try {
    // Find parcel by trackingId
    const parcel = await Parcel.findOne({ trackingId });
    if (!parcel) return res.status(404).json({ error: 'Parcel not found' });

    // Update selectedSlot
    parcel.selectedSlot = newSlot;
    await parcel.save();

    // Send SMS confirmation to recipient phone number
    const smsText = `Your delivery slot for parcel ${trackingId} has been updated to ${newSlot}. Thank you for using SlotSavvy!`;
    await sendSMS(parcel.recipientPhone, smsText);

    // Respond success (could redirect or send JSON depending on frontend needs)
    res.redirect(`/api/track/${trackingId}?updated=true`);
  } catch (err) {
    console.error('❌ Update slot error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});


// Global error catch
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
