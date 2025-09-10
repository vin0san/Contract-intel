# 📄 Contract Intelligence

A full-stack application to upload, parse, and analyze PDF contracts. The system extracts structured data (parties, billing, financials, SLA, etc.), computes a completeness score, and highlights missing fields.  

Built with **FastAPI**, **MongoDB Atlas**, **React**, and **Docker**.  

---

## 🚀 Features
- Upload PDF contracts for analysis  
- Background parsing with progress tracking  
- Extract key metadata using regex (parties, billing, SLA, payment terms, etc.)  
- Completeness scoring system with missing fields detection  
- Download original PDF files  
- Responsive React frontend with progress bars  
- MongoDB Atlas for storage  
- Dockerized backend & frontend  

---

## 🛠️ Tech Stack
- **Backend:** FastAPI, PyMongo, pdfplumber  
- **Frontend:** React, Axios, Nginx  
- **Database:** MongoDB Atlas (Cloud)  
- **Deployment:** Docker, Docker Compose  

---

## 📂 Project Structure

```bash
contract-intel/
│
├── backend/ # FastAPI server
│ ├── main.py
│ ├── requirements.txt
│ ├── Dockerfile
│ └── .env # MongoDB Atlas URI
│
├── frontend/ # React client
│ ├── src/
│ ├── package.json
│ ├── Dockerfile
│
├── docker-compose.yml
└── README.md
```


---

## ⚙️ Setup & Run

### 1. Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed  
- MongoDB Atlas cluster (connection string in `backend/.env`)  

Example `.env` (in `/backend`):
```env
MONGO_URI=mongodb+srv://user01:<user_password>@cluster0.mongodb.net/contracts_db
```

### 2. Build & Run with Docker

From project root:
```
docker compose up --build
```
- Backend → http://localhost:8000/docs

- Frontend → http://localhost:3000

---
## 🧪 Testing

- Upload valid and invalid files (non-PDF should be rejected).

- Observe progress updates in the contracts list.

- Verify parsed fields and completeness score in the Contract Details panel.

- Use Swagger API docs at `/docs` for endpoint testing.

---

## 📊 Endpoints

`POST /contracts/upload` → Upload PDF contract

`GET /contracts` → List contracts

`GET /contracts/{id}/status` → Check processing status

`GET /contracts/{id}` → Get parsed contract data

`GET /contracts/{id}/download` → Download original PDF

---
## Demo

[VIdeo Demo](https://www.loom.com/share/4b6f7928616b49ab814b3d9092bbf508?sid=71d3dfbc-f9ec-466d-9cb3-fde03a1eb271)

![alt text](/media/image.png)
![alt text](/media/image-1.png)


---
## Future Improvements

- Add filtering, sorting, and search on contracts list

- Support larger file sizes with streaming upload

- More advanced NLP-based extraction for higher accuracy

- Authentication & role-based access

- Enhanced UI for business analytics and dashboards