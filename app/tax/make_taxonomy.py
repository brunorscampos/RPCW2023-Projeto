from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017')
db = client['RPCW_TP']
collection = db['taxonomia']

main_word = ""
main_id = 0
id = 0

with open('first2words3.txt', 'r') as file:
    for line in file.readlines():
        try:
            w1, w2 = line.split()
            if main_word != w1:
                main_word = w1
                main_id = id
                collection.insert_one({"_id": main_id, "name": main_word, "parent": None, "acordaos": []})
                id += 1
            collection.insert_one({"_id": id, "name": w2, "parent": main_id, "acordaos": []})
            id += 1
        except:
            main_word = line.split()[0]
            main_id = id
            collection.insert_one({"_id": main_id, "name": main_word, "parent": None, "acordaos": []})
            id += 1

client.close()
