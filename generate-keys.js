const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SERVICE_NAME = 'learnerAI-service';

console.log('🔐 Generating ECDSA P-256 key pair for', SERVICE_NAME);
console.log('=' .repeat(60));

// Generate key pair
const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
  namedCurve: 'prime256v1', // P-256
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

// Display keys
console.log('\n📝 PRIVATE KEY (PEM):');
console.log('-'.repeat(60));
console.log(privateKey);

console.log('\n📝 PUBLIC KEY (PEM):');
console.log('-'.repeat(60));
console.log(publicKey);

// Save keys to files
const privateKeyPath = path.join(__dirname, 'learnerAI-private-key.pem');
const publicKeyPath = path.join(__dirname, 'learnerAI-public-key.pem');

fs.writeFileSync(privateKeyPath, privateKey, 'utf8');
fs.writeFileSync(publicKeyPath, publicKey, 'utf8');

console.log('\n✅ Keys saved successfully!');
console.log(`   Private Key: ${privateKeyPath}`);
console.log(`   Public Key: ${publicKeyPath}`);
console.log('\n⚠️  IMPORTANT: These keys are NOT committed to Git.');
console.log('   Keep them secure and never share the private key!');

