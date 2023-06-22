from pymongo import MongoClient
import re
import json

client = MongoClient('mongodb://localhost:27017')
db = client['RPCW_TP']
target_collection = db['taxonomia']

def diacritic_insensitive_regex(string):
    string = re.sub(r'[AÁÀÃÂaáàäâã]', r'[AÁÀÃÂaáàäâã]', string)
    string = re.sub(r'[EÉÈÊeéëèê]', r'[EÉÈÊeéëèê]', string)
    string = re.sub(r'[IÍÌÎiíïìî]', r'[IÍÌÎiíïìî]', string)
    string = re.sub(r'[OÓÒÕÔoóöòõô]', r'[OÓÒÕÔoóöòõô]', string)
    string = re.sub(r'[UÚÙÛuüúùû]', r'[UÚÙÛuüúùû]', string)
    string = re.sub(r'[CÇcç]', r'[CÇcç]', string)
    return string

with open("descs.json","r") as f:
    desc_list = json.load(f)

documents = list(target_collection.find({},{"name":1,"parent":1}))
last_parent_id = None
last_word = None
last_match = None
filled_documents = []
for doc in target_collection.find({}, {"name": 1, "parent": 1}):
    id = doc["_id"]
    filled_doc = doc.copy()
    word = doc["name"]
    parent = doc["parent"]
    regex_pattern = r"\b" + diacritic_insensitive_regex(re.escape(word)) + r"\b"

    if parent != None:
        if parent == last_parent_id:
            parent_word = last_word
            regex_pattern = r"\b" + diacritic_insensitive_regex(re.escape(parent_word)) + r"\b" + r'.*' + regex_pattern
            matching_documents = [
                d["url"] for d in last_match
                if any(re.search(regex_pattern, desc, re.IGNORECASE) for desc in d.get("Descritores", []))
            ]
        else:
            parent_doc = target_collection.find_one({"_id": parent}, {"name": 1})
            parent_word = parent_doc["name"]
            regex_pattern = r"\b" + diacritic_insensitive_regex(re.escape(parent_word)) + r"\b" + r'.*' + regex_pattern
            matching_documents = [
                d["url"] for d in desc_list
                if any(re.search(regex_pattern, desc, re.IGNORECASE) for desc in d.get("Descritores", []))
            ]
    else:
        last_parent_id = id
        last_word = word
        last_match = [
            d for d in desc_list
            if any(re.search(regex_pattern, desc, re.IGNORECASE) for desc in d.get("Descritores", []))
        ]
        matching_documents = [d["url"] for d in last_match]

    if matching_documents:
        filled_doc['acordaos'] = matching_documents
    filled_documents.append(filled_doc)
    if id % 200 == 0:
        print(id)
    
with open('taxonomia.json', 'w', encoding='utf-8') as json_file:
    json.dump(filled_documents, json_file, indent=4, ensure_ascii=False)

client.close()