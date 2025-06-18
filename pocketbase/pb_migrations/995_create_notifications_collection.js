/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  // Create a new collection for notifications
  const collection = {
    "id": "notifications",
    "name": "notifications",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "user",
        "name": "user",
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
        "id": "title",
        "name": "title",
        "type": "text",
        "required": true,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "message",
        "name": "message",
        "type": "text",
        "required": true,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
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
          "values": ["credit_added", "referral_credit", "system"]
        }
      },
      {
        "system": false,
        "id": "isRead",
        "name": "isRead",
        "type": "bool",
        "required": false,
        "unique": false,
        "options": {}
      },
      {
        "system": false,
        "id": "createdAt",
        "name": "createdAt",
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
      "CREATE INDEX `idx_notifications_user` ON `notifications` (`user`)",
      "CREATE INDEX `idx_notifications_isRead` ON `notifications` (`isRead`)",
      "CREATE INDEX `idx_notifications_type` ON `notifications` (`type`)"
    ],
    "listRule": "@request.auth.id = user.id",
    "viewRule": "@request.auth.id = user.id",
    "createRule": "@request.auth.id = user.id",
    "updateRule": "@request.auth.id = user.id",
    "deleteRule": "@request.auth.id = user.id"
  };

  return dao.saveCollection(collection);
}, (db) => {
  // Revert changes
  const collection = db.collection('notifications');
  
  return dao.deleteCollection(collection);
}) 