migrate((db) => {
  // Create a new collection for transactions
  const collection = {
    "id": "transactions",
    "name": "transactions",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "userId",
        "name": "userId",
        "type": "relation",
        "required": true,
        "unique": false,
        "options": {
          "collectionId": "users",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": []
        }
      },
      {
        "system": false,
        "id": "type",
        "name": "type",
        "type": "select",
        "required": true,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": ["CREDIT_PURCHASE", "CREDIT_USE", "PRO_PURCHASE", "ADMIN_CREDIT", "REFERRAL_CREDIT"]
        }
      },
      {
        "system": false,
        "id": "amount",
        "name": "amount",
        "type": "number",
        "required": true,
        "unique": false,
        "options": {
          "min": null,
          "max": null
        }
      },
      {
        "system": false,
        "id": "description",
        "name": "description",
        "type": "text",
        "required": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "adminId",
        "name": "adminId",
        "type": "relation",
        "required": false,
        "unique": false,
        "options": {
          "collectionId": "users",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": []
        }
      },
      {
        "system": false,
        "id": "created",
        "name": "created",
        "type": "date",
        "required": true,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
        }
      }
    ],
    "indexes": [
      "CREATE INDEX `idx_transactions_userId` ON `transactions` (`userId`)",
      "CREATE INDEX `idx_transactions_type` ON `transactions` (`type`)",
      "CREATE INDEX `idx_transactions_created` ON `transactions` (`created`)"
    ],
    "listRule": "@request.auth.id = userId.id || @request.auth.isAdmin = true",
    "viewRule": "@request.auth.id = userId.id || @request.auth.isAdmin = true",
    "createRule": "@request.auth.isAdmin = true",
    "updateRule": "@request.auth.isAdmin = true",
    "deleteRule": "@request.auth.isAdmin = true"
  };

  return dao.saveCollection(collection);
}, (db) => {
  // Revert changes
  const collection = db.collection('transactions');
  
  return dao.deleteCollection(collection);
}) 