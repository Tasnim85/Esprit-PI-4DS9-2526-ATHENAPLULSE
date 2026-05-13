# AthenaPulse – AI-Powered Medical Intelligence & Avatar Platform

## Overview

This project was developed as part of the PIDS – 4DS Engineering Program at Esprit School of Engineering (Academic Year 2025–2026).

AthenaPulse is an AI-powered platform designed for medical delegates, doctors, and pharmacists.
It combines intelligent monitoring, compliance verification, engagement prediction, and a virtual AI avatar to improve healthcare communication, safety, and operational efficiency.

The platform proactively detects supplement-related risks, prevents compliance violations in medical presentations, reduces training costs through digital simulations, and strengthens relationships with healthcare professionals.

AthenaPulse supports:

- SDG 3 – Good Health & Well-being
- SDG 9 – Industry, Innovation & Infrastructure
- SDG 8 – Decent Work and Economic Growth
---

## Features

### BO1 – Smart Recommendations
**DSO1: AI-Powered Recommendation System**

When a healthcare professional or representative enters a symptom or product name, the avatar instantly recommends the most relevant solution.

- Instant symptom-to-solution matching
- Product-based intelligent recommendations
- Real-time suggestions via avatar interface

**Benefits:** Faster decisions, more precise recommendations, better patient support.

### BO2 – Personalized Training Simulation
**DSO2: AI Training & Simulation Platform**

Before meeting a doctor, representatives can practice in realistic scenarios based on their experience level and the healthcare professional's profile.

- Adaptive simulations tailored to rep experience level
- HCP profile-based scenario generation
- Safe environment to rehearse visits before the field

**Benefits:** More confidence, better preparation, stronger performance in the field.

### BO3 – Instant Presentation Generation
**DSO3: Automated Presentation Engine**

By simply entering a product name, representatives receive a ready-to-use presentation tailored for their next visit.

- One-input presentation generation
- Visit-ready, professionally formatted output
- Consistent and high-quality messaging across teams

**Benefits:** Saves preparation time and ensures consistent, high-quality messaging.

### BO4 – Visit Intelligence & Sentiment Analysis
**DSO4: HCP Engagement & Sentiment Analyzer**

After each interaction, the platform analyzes conversations to measure healthcare professional interest and engagement.

- Post-visit conversation analysis
- Engagement and interest scoring per HCP
- Real-time strategy optimization alerts

**Benefits:** Companies can identify opportunities, detect declining interest, and optimize their strategy in real time.

---

## Tech Stack

**Frontend**
- Next.js
- React.js
- Tailwind CSS
- Framer Motion

**Backend**
- Node.js
- Express.js
- Fast APIs

**AI & Machine Learning**
- Python
- NLP Processing
- Risk Scoring Models
- Predictive Analytics
- Drift Detection

**Database & Auth**
- Firebase (Authentication & Data Management)

**Avatar Development**
- Avaturn (base character & lip-sync)
- Mixamo (animations & movements)
- Blender (final integration & refinement)
- 3D Web Avatar (Three.js / WebGL-based rendering)
- AI Conversation Engine

---

## Project Structure

```
athenapulse/
├── avatar-backend/          # Python ML services
│   ├── dso1/                # Smart Recommendations (port 8001)
│   ├── dso2/                # Training Simulation (port 8002)
│   ├── dso3/                # Presentation Generation (port 8003)
│   └── dso4/                # Visit Intelligence & Sentiment Analysis (port 8004)
├── AvatarDeployment/        # Avatar Next.js app
└── front-athenapulse/       # Main Next.js frontend
```

---

## Setup

### Frontend (both Next.js apps)

```bash
npm install
npm run dev
```

> Run this in both `AvatarDeployment/` and `front-athenapulse/`.

### Backend — each DSO folder

Each service runs on its own port:

| Service | Folder              | Port |
|---------|---------------------|------|
| DSO1    | `avatar-backend/dso1` | 8001 |
| DSO2    | `avatar-backend/dso2` | 8002 |
| DSO3    | `avatar-backend/dso3` | 8003 |
| DSO4    | `avatar-backend/dso4` | 8004 |

```bash
# Inside each dso folder
pip install -r requirements.txt
```

---

### Download ML Models

Models are hosted on Hugging Face (not included in repo due to size).

```bash
pip install huggingface_hub
```

```python
from huggingface_hub import snapshot_download

# DSO1 models (speech/whisper)
snapshot_download(repo_id="TasnimBenhassin/athenapulse-models", local_dir="avatar-backend/dso1/")

# DSO2 & DSO4 models (already on Hugging Face)
# They are loaded directly in code via their model ID
```

---

## Environment Variables

Each service needs a `.env` file. Copy `.env.example` and fill in your keys.

```bash
cp .env.example .env
```

---

## Architecture

AthenaPulse follows a modular AI-driven architecture and adopts TDSP methodology for AI project lifecycle management:

### 1. Data Sources
- Internal CRM
- Delegate visit reports
- Conversation logs
- Product database
- External health sources (NIH, FDA,Parapharmacie.tn products extracted)

### 2. Data Processing Layer
- Batch data ingestion
- Data lake storage (Firebase)
- NLP preprocessing (cleaning, normalization, entity extraction)
- Feature engineering

### 3. AI Orchestrator
- Smart Recommendation Agent (DSO1)
- Training Simulation Engine (DSO2)
- Presentation Generation Engine (DSO3)
- Visit Intelligence & Sentiment Analyzer (DSO4)

### 4. API Gateway
- Secure microservice communication

### 5. MLOps & Monitoring
- Audit logs
- Model performance tracking
- Drift detection
- Retraining pipeline
- Version control

### 6. Deployment Layer – Avatar Platform
- Delegate Training Portal
- 3D AI Medical Avatar
- Alert Notification System
- Supervisor Compliance Dashboard

---

## Contributors

| Name | Role |
|------|------|
| Tasnim BENHASSINE | Project Manager |
| Yasmine ASKRI | Project Lead |
| Mohamed Aziz TRABELSI | Solution Architect |
| Rabeb BOUGATEF | Solution Architect |
| Mohamed Youssef AZZOUZ | Data Scientist |
| Wiem MHEDHBI | Data Scientist |

---

## Academic Context

Developed at **Esprit School of Engineering – Tunisia**
PIDS – 4DS | Academic Year 2025–2026

This project integrates Artificial Intelligence, Data Science, and Full-Stack Engineering to address real-world healthcare monitoring and compliance challenges.

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- Firebase project (Authentication & Firestore)
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/Tasnim85/Esprit-PI-4DS9-2526-ATHENAPULSE.git

# Navigate to project
cd athenapulse

# Install main frontend dependencies
cd front-athenapulse
npm install

# Install avatar frontend dependencies
cd ../AvatarDeployment
npm install

# Install Python dependencies for each DSO
cd ../avatar-backend/dso1 && pip install -r requirements.txt
cd ../dso2 && pip install -r requirements.txt
cd ../dso3 && pip install -r requirements.txt
cd ../dso4 && pip install -r requirements.txt
```
