from pymongo import MongoClient
import json

# OBTEM A LISTA DE TODOS OS DESCRITORES UNICOS

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