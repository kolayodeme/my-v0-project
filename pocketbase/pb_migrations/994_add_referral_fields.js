/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  // Add referral fields to users collection
  const usersCollection = db.collection('users');
  
  // Add referralCode field
  usersCollection.schema.addField({
    "system": false,
    "id": "referralCode",
    "name": "referralCode",
    "type": "text",
    "required": false,
    "unique": true,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  });
  
  // Add referredBy field
  usersCollection.schema.addField({
    "system": false,
    "id": "referredBy",
    "name": "referredBy",
    "type": "text",
    "required": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  });
  
  // Add referralCount field
  usersCollection.schema.addField({
    "system": false,
    "id": "referralCount",
    "name": "referralCount",
    "type": "number",
    "required": false,
    "unique": false,
    "options": {
      "min": 0,
      "max": null
    }
  });
  
  // Generate unique referral codes for existing users
  const existingUsers = db.collection('users').getFullList();
  for (const user of existingUsers) {
    // Generate a unique referral code based on username
    const username = user.username || '';
    const uniqueReferralCode = username.substring(0, 3) + Math.random().toString(36).substring(2, 7);
    
    // Update the user with the new referral code and initialize referral count
    db.collection('users').update(user.id, {
      'referralCode': uniqueReferralCode,
      'referredBy': null,
      'referralCount': 0
    });
  }
  
  return dao.saveCollection(usersCollection);
}, (db) => {
  // Revert changes
  const usersCollection = db.collection('users');
  
  // Remove the added fields
  usersCollection.schema.removeField("referralCode");
  usersCollection.schema.removeField("referredBy");
  usersCollection.schema.removeField("referralCount");
  
  return dao.saveCollection(usersCollection);
}) 