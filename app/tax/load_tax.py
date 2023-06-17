import json
from pymongo import MongoClient

mongo_uri = 'mongodb://localhost:27017'
database_name = 'RPCW_TP'
collection_name = 'taxonomia'
secondary_collection_name = 'taxonomia2'  # Name of the secondary collection

json_file = 'filled_descs.json'

client = MongoClient(mongo_uri)
database = client[database_name]
collection = database[collection_name]
secondary_collection = database[secondary_collection_name]  # Secondary collection

with open(json_file, 'r') as file:
    data = json.load(file)

for doc in data:
    collection.insert_one({"_id": doc["_id"], "name": doc["name"], "parent": doc["parent"], "acordaos": []})
    if "acordaos" in doc:
        acordaos = doc["acordaos"]

        if len(acordaos) > 100000:
            chunk1 = acordaos[:100000]
            chunk2 = acordaos[100000:]

            collection.update_one(
                {"_id": doc["_id"]},
                {"$push": {"acordaos": {"$each": chunk1}}}
            )

            secondary_collection.insert_one({"_id": doc["_id"], "acordaos": chunk2})
        else:
            collection.update_one(
                {"_id": doc["_id"]},
                {"$push": {"acordaos": {"$each": acordaos}}}
            )
    print(doc["_id"])

client.close()
