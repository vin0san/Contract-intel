from pymongo import MongoClient

MONGO_URI = "mongodb+srv://user01:password01@cluster0.mog8ih5.mongodb.net/contracts_db?retryWrites=true&w=majority&appName=Cluster0"

client = MongoClient(MONGO_URI)
db = client["contracts_db"]
print("✅ Connected to MongoDB Atlas!")

# Insert a test doc
db.test_collection.insert_one({"msg": "Hello Atlas"})
print("Inserted test document")
