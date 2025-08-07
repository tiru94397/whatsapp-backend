const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // CORS if frontend is separate

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'your-mongodb-uri-here', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Schema and model
const MessageSchema = new mongoose.Schema({
  from: String,
  to: String,
  timestamp: String,
  type: String,
  message: String,
  wa_id: String, // Optional if you're tracking by wa_id
});

const Message = mongoose.model('Message', MessageSchema);

// ===========================
// ✅ ROUTE 1: Add message manually via API
app.post('/api/messages', async (req, res) => {
  try {
    const msg = new Message(req.body);
    await msg.save();
    res.sendStatus(201);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error saving message' });
  }
});

// ✅ ROUTE 2: Get messages by wa_id
app.get('/api/messages/:wa_id', async (req, res) => {
  try {
    const messages = await Message.find({ wa_id: req.params.wa_id });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching messages' });
  }
});

// ===========================
// ✅ ROUTE 3: Upload ZIP of JSON files and store messages
const upload = multer({ dest: 'uploads/' });

app.post('/api/upload', upload.single('zipFile'), async (req, res) => {
  try {
    const zipPath = req.file.path;
    const zip = new AdmZip(zipPath);
    const zipEntries = zip.getEntries();

    let insertedCount = 0;

    for (const entry of zipEntries) {
      if (entry.entryName.endsWith('.json')) {
        const content = zip.readAsText(entry);
        const json = JSON.parse(content);

        if (json.messages) {
          for (const msg of json.messages) {
            await Message.create({
              from: msg.from || '',
              to: msg.to || '',
              timestamp: msg.timestamp || '',
              type: msg.type || '',
              message: msg.text || msg.message || '',
              wa_id: msg.from || '', // Store wa_id from sender
            });
            insertedCount++;
          }
        }
      }
    }

    fs.unlinkSync(zipPath); // Clean up uploaded file
    res.json({ success: true, inserted: insertedCount });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error processing ZIP' });
  }
});

// ===========================
// Home route
app.get('/', (req, res) => {
  res.send('WhatsApp Chat Processor API running');
});


// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
