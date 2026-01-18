# 🧬 Variant Analysis with Evo2  
**AI-Powered DNA Mutation Pathogenicity Prediction**

> Predict whether a DNA mutation is **disease-causing or harmless** using a **state-of-the-art AI model**, real clinical databases, and **GPU-accelerated inference** — all wrapped in a modern full-stack web app.

---

## 🚀 Why This Project?

DNA mutations play a critical role in diseases like cancer — but understanding their impact is **slow, complex, and expensive**.

This project demonstrates how **modern AI + cloud GPUs** can:

- Analyze DNA mutations in seconds  
- Predict disease risk  
- Compare results with real clinical databases  
- Present everything in a clean, beginner-friendly UI  

🔥 **No biology background required** — the app handles the complexity for you.

---

## ✨ What You Can Do

- 🧬 Predict if a DNA mutation is **pathogenic or benign**
- ⚖️ Compare AI predictions with **ClinVar medical classifications**
- 🔍 Search genes like **BRCA1** or browse entire chromosomes
- 🌍 Choose genome assemblies (hg38, etc.)
- 📊 Get prediction confidence scores
- ⚡ Run AI inference on **NVIDIA H100 GPUs**
- 🧪 Explore real genomic and clinical data interactively

---

## 🧠 How It Works (Simple)

- DNA is made of **A, T, G, C**
- A single letter change = **mutation**
- Some mutations cause disease, some don’t

This app:
1. Takes a mutation  
2. Runs it through an AI model (**Evo2**)  
3. Compares results with real medical data  
4. Shows a clear, understandable result  

---

## 🏗️ Architecture (High Level)

```
Frontend (Next.js)
        ↓
FastAPI Backend
        ↓
Evo2 AI Model (GPU)
        ↓
ClinVar + UCSC APIs
```

- Serverless GPU inference  
- FastAPI REST endpoints  
- Modern React UI  

---

## 🧩 Key Features

- 🧬 Evo2 large language model for genomic analysis
- 🩺 Pathogenic vs benign prediction
- ⚖️ AI vs ClinVar comparison view
- 💯 Prediction confidence scoring
- 🗺️ Chromosome & gene browser
- 📜 Reference genome visualization (UCSC)
- 🔬 Real clinical variant data (NCBI ClinVar)
- ⚡ NVIDIA H100 GPU acceleration
- 🚀 Serverless deployment with Modal
- 📱 Fully responsive UI

---

## 🛠️ Tech Stack

### Backend
- Python 3.12
- FastAPI
- Modal (Serverless GPUs)
- Evo2 LLM
- NCBI ClinVar API
- UCSC Genome API

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- Shadcn UI
- T3 Stack

---

## 📦 Getting Started

### Clone the Repo
```bash
git clone https://github.com/GeneralSubhra/variant-analysis-evo2
cd variant-analysis-evo2
```

---

## ⚙️ Backend Setup
```bash
cd backend
```

### Prerequisites
- Python 3.12
- uv package manager  
  https://github.com/astral-sh/uv

### Install & Run
```bash
uv venv --python 3.12
source .venv/bin/activate   # Mac/Linux
# or .venv\Scripts\activate # Windows

uv pip install -r requirements.txt
modal setup
modal run main.py
```

### Deploy (Production)
```bash
modal deploy main.py
```

---

## 🎨 Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

App runs at:
```
http://localhost:3000
```

---

## 📚 Evo2 Model
- 📄 Paper: https://www.science.org/doi/10.1126/science.ado9336
- 💻 GitHub: https://github.com/ArcInstitute/evo2

---

👉 **Please star ⭐ the repo — it really helps!**
