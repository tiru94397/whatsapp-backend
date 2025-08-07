const fs = require('fs');
const path = require('path');
const Message = require('./models/Message');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI || 'your-mongodb-uri-here');

const folder = './payloads';
fs.readdirSync(folder).forEach(file => {
  const json = JSON.parse(fs.readFileSync(path.join(folder, file), 'utf-8'));
  const messages = json.messages || [];

  messages.forEach(async msg => {
    const newMsg = {
      wa_id: msg.wa_id,
      name: msg.profile?.name || 'Unknown',
      number: msg.from,
      message: msg.text?.body || '',
      timestamp: new Date(msg.timestamp * 1000),
      status: 'sent',
      sender: msg.from_me ? 'me' : 'them',
    };
    await Message.create(newMsg);
  });
});