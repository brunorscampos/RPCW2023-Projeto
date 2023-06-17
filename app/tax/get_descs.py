from pymongo import MongoClient
import json
#from bson import ObjectId
#string_id = "60c94c49c9025e1f2c7ff6d1"
#object_id = ObjectId(string_id)

client = MongoClient('mongodb://localhost:27017')
db = client['RPCW_TP']
source_collection = db['acordaos']

result = source_collection.find({}, {"Descritores": 1,"url":1})
documents = list(result)
serialized_documents = [
    {**doc, "_id": str(doc["_id"])}
    for doc in documents
]

with open('descs.json', 'w', encoding='utf-8') as json_file:
    json.dump(serialized_documents, json_file, indent=4, ensure_ascii=False)

client.close()

