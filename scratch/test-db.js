const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');
dotenv.config();

const dnsServers = process.env.MONGO_DNS_SERVERS
    ? process.env.MONGO_DNS_SERVERS.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

if (dnsServers.length) {
    dns.setServers(dnsServers);
    console.log(`Using DNS servers: ${dnsServers.join(', ')}`);
}

const user = process.env.MONGO_USER;
const pass = process.env.MONGO_PASS;
const hosts = 'cluster0.fxxjgvq.mongodb.net';
const options = 'retryWrites=true&w=majority';

const uri = `mongodb+srv://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${hosts}/?${options}`;
console.log('Testing connection to cluster (no DB specified):', uri.replace(/:([^@]+)@/, ':<redacted>@'));

mongoose.connect(uri)
  .then(() => {
    console.log('Successfully connected to MongoDB');
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err.message);
    process.exit(1);
  });
