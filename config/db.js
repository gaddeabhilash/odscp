const mongoose = require('mongoose');
const dns = require('dns');

const buildMongoUri = () => {
  if (process.env.MONGO_URI) {
    return process.env.MONGO_URI;
  }

  const hosts = process.env.MONGO_HOSTS;
  if (!hosts) {
    throw new Error('Missing MONGO_URI and MONGO_HOSTS. Set either MONGO_URI or the non-SRV host variables.');
  }

  const user = process.env.MONGO_USER;
  const pass = process.env.MONGO_PASS;
  const db = process.env.MONGO_DB || 'odscp';
  const options = process.env.MONGO_OPTIONS ? `?${process.env.MONGO_OPTIONS}` : '';
  const credentials = user ? `${encodeURIComponent(user)}:${encodeURIComponent(pass || '')}@` : '';

  return `mongodb://${credentials}${hosts}/${db}${options}`;
};

const connectDB = async () => {
  if (process.env.USE_MOCK_DB === 'true') {
    console.log('--- RUNNING IN MOCK DATABASE MODE ---');
    console.log('No actual connection to MongoDB will be established.');
    return { connection: { host: 'MOCK_HOST' } };
  }

  const dnsServers = process.env.MONGO_DNS_SERVERS
    ? process.env.MONGO_DNS_SERVERS.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  if (dnsServers.length) {
    dns.setServers(dnsServers);
    console.log(`Using DNS servers: ${dnsServers.join(', ')}`);
  }

  const mongoUri = buildMongoUri();
  const redactedUri = mongoUri.replace(/:([^@]+)@/, ':<redacted>@');
  console.log(`Connecting to MongoDB using ${redactedUri}`);

  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    if (error.message.includes('bad auth') || error.message.toLowerCase().includes('authentication failed')) {
      console.error('MongoDB authentication failed. Verify MONGO_URI, MONGO_USER, and MONGO_PASS values.');
      console.error(`Error details: ${error.name} [${error.code}]`);
    } else if (error.message.includes('querySrv ECONNREFUSED')) {
      console.error('DNS lookup for MongoDB SRV record failed. Try setting MONGO_DNS_SERVERS or use a non-SRV connection string.');
    }
    throw error;
  }
};

module.exports = connectDB;
