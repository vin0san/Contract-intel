from fastapi.middleware.cors import CORSMiddleware
# Import necessary libraries

from fastapi import FastAPI, UploadFile, File, HTTPException, Query, BackgroundTasks
from fastapi.responses import StreamingResponse
from pymongo import MongoClient
from bson import Binary
from uuid import uuid4
import io
import os
from dotenv import load_dotenv
import time
import pdfplumber
import re

# Load environment variables
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")

# MongoDB connection
client = MongoClient(MONGO_URI)
db = client["contracts_db"]
contracts = db["contracts"]

app = FastAPI()

# CORS middleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ----------------------------
# 1. Upload contract
# ----------------------------

def parse_contract_task(contract_id):
    # Set status to processing
    contracts.update_one({"_id": contract_id}, {"$set": {"status": "processing", "progress": 0}})

    # Retrieve PDF from MongoDB
    doc = contracts.find_one({"_id": contract_id})
    if not doc:
        return

    pdf_bytes = doc["content"]

    # Simulate parsing progress
    for i in range(1, 6):
        time.sleep(0.3)
        contracts.update_one({"_id": contract_id}, {"$set": {"progress": i * 20}})

    # Extract text
    text_content = ""
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_content += page_text + "\n"

    # -------------------------
    # Field extraction using regex
    # -------------------------
    parties = re.findall(r"(?:Party|Customer|Vendor):\s*(.*)", text_content, re.IGNORECASE)
    billing_match = re.search(r"Account Number:\s*(\d+)", text_content, re.IGNORECASE)
    contact_match = re.search(r"Contact(?: Email)?:\s*([\w\.-]+@[\w\.-]+)", text_content, re.IGNORECASE)
    total_match = re.search(r"Total Value:\s*\$?(\d[\d,]*)", text_content, re.IGNORECASE)
    currency_match = re.search(r"Currency:\s*(\w+)", text_content, re.IGNORECASE)
    payment_terms_match = re.search(r"Net\s*(\d+)", text_content, re.IGNORECASE)
    sla_match = re.search(r"(?:SLA|Uptime):\s*([\d\.%]+ uptime)", text_content, re.IGNORECASE)
    recurring_match = re.search(r"(Recurring|One-time|Subscription)", text_content, re.IGNORECASE)
    renewal_match = re.search(r"Renewal(?: Terms)?:\s*(.*)", text_content, re.IGNORECASE)
    signatory_match = re.search(r"Authorized Signatory:\s*(.*)", text_content, re.IGNORECASE)

    # -------------------------
    # Compose parsed data
    # -------------------------
    parsed_data = {
        "parties": parties or ["Not found"],
        "billing": {
            "account_number": billing_match.group(1) if billing_match else "Not found",
            "contact": contact_match.group(1) if contact_match else "Not found"
        },
        "financial": {
            "total_value": float(total_match.group(1).replace(",", "")) if total_match else 0,
            "currency": currency_match.group(1) if currency_match else "USD"
        },
        "payment_terms": f"Net {payment_terms_match.group(1)}" if payment_terms_match else "Not found",
        "sla": sla_match.group(1) if sla_match else "Not found",
        "revenue_type": recurring_match.group(1) if recurring_match else "Not found",
        "renewal_terms": renewal_match.group(1) if renewal_match else "Not found",
        "authorized_signatory": signatory_match.group(1) if signatory_match else "Not found",
    }

    # -------------------------
    # Compute weighted score
    # -------------------------
    score = 0
    missing_fields = []

    # Financial completeness (30 pts)
    if parsed_data["financial"]["total_value"] > 0:
        score += 30
    else:
        missing_fields.append("financial.total_value")

    # Party identification (25 pts)
    if parsed_data["parties"] != ["Not found"]:
        score += 25
    else:
        missing_fields.append("parties")

    # Payment terms clarity (20 pts)
    if parsed_data["payment_terms"] != "Not found":
        score += 20
    else:
        missing_fields.append("payment_terms")

    # SLA definition (15 pts)
    if parsed_data["sla"] != "Not found":
        score += 15
    else:
        missing_fields.append("sla")

    # Contact info (10 pts)
    if parsed_data["billing"]["contact"] != "Not found":
        score += 10
    else:
        missing_fields.append("billing.contact")

    parsed_data["score"] = score
    parsed_data["missing_fields"] = missing_fields

    
    # Final update in MongoDB
    contracts.update_one(
        {"_id": contract_id},
        {"$set": {"status": "completed", "progress": 100, "parsed_data": parsed_data}}
    )
#------------------------------------------------------------------------------------------------------------------
# Update upload endpoint
@app.post("/contracts/upload")
async def upload_contract(file: UploadFile = File(...), background_tasks: BackgroundTasks = None):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    contract_id = str(uuid4())
    contents = await file.read()

    contracts.insert_one({
        "_id": contract_id,
        "filename": file.filename,
        "content": Binary(contents),
        "status": "pending",
        "progress": 0,
        "error": None
    })

    # Launch background parsing
    background_tasks.add_task(parse_contract_task, contract_id)

    return {"contract_id": contract_id}

# ----------------------------
# 2. Check contract status
# ----------------------------


@app.get("/contracts/{contract_id}/status")
async def contract_status(contract_id: str):
    doc = contracts.find_one({"_id": contract_id})
    if not doc:
        raise HTTPException(404, "Contract not found")
    return {
        "status": doc["status"],
        "progress": doc["progress"],
        "error": doc["error"]
    }

# ----------------------------
# 3. Download contract
# ----------------------------


@app.get("/contracts/{contract_id}/download")
async def download_contract(contract_id: str):
    doc = contracts.find_one({"_id": contract_id})
    if not doc:
        raise HTTPException(404, "Contract not found")

    return StreamingResponse(
        io.BytesIO(doc["content"]),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename={doc["filename"]}'}
    )

# ----------------------------
# 4. List contracts
# ----------------------------

@app.get("/contracts")
async def list_contracts(
    skip: int = 0,
    limit: int = 10,
    status: str = Query(None, description="Filter by contract status"),
):
    query = {}
    if status:
        query["status"] = status

    docs = contracts.find(query).skip(skip).limit(limit)
    result = []
    for doc in docs:
        result.append({
            "contract_id": doc["_id"],
            "filename": doc["filename"],
            "status": doc["status"],
            "progress": doc.get("progress", 0)
        })
    return result

# ----------------------------
# 5. Contract data (parsed)
# ----------------------------
@app.get("/contracts/{contract_id}")
async def get_contract_data(contract_id: str):
    doc = contracts.find_one({"_id": contract_id})
    if not doc:
        raise HTTPException(404, "Contract not found")

    # Return the actual parsed data from MongoDB if parsing is completed
    parsed_data = doc.get("parsed_data", {})

    return {
        "contract_id": contract_id,
        "filename": doc["filename"],
        "status": doc["status"],
        "parsed_data": parsed_data
    }

