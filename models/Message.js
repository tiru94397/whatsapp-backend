const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  wa_id: String,
  name: String,
  number: String,
  message: String,
  timestamp: Date,
  status: String,
  sender: String,
});

module.exports = mongoose.model('Message', MessageSchema);
