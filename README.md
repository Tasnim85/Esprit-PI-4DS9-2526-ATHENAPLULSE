# AthenaPulse – AI-Powered Medical Intelligence & Avatar Platform

## Overview

This project was developed as part of the PIDS – 4DS Engineering Program at **Esprit School of Engineering** (Academic Year 2025–2026).

AthenaPulse is an AI-powered platform designed for medical delegates, doctors, and pharmacists.  
It combines intelligent monitoring, compliance verification, engagement prediction, and a virtual AI avatar to improve healthcare communication, safety, and operational efficiency.

The platform proactively detects supplement-related risks, prevents compliance violations in medical presentations, reduces training costs through digital simulations, and strengthens relationships with healthcare professionals.

AthenaPulse supports:

- SDG 3 – Good Health & Well-being  
- SDG 9 – Industry, Innovation & Infrastructure  
- SDG 16 – Peace, Justice & Strong Institutions  

---

## Features

### BO1 – Early Health Risk Detection  
**DSO1: AI-Powered Safety Monitoring System**

- Analyzes customer conversations and feedback  
- Detects harmful supplement combinations  
- Identifies side effects and ingredient sensitivities  
- Generates proactive health alerts  

---

### BO2 – Reduce Training & Operational Costs  
**DSO2: Virtual Training & AI Interaction Platform**

- AI-powered patient simulations  
- Digital academy for medical delegates  
- 24/7 online access for global teams  
- Eliminates travel and printed material costs  

---

### BO3 – Eliminate Compliance Risks  
**DSO3: Real-Time AI Risk Scoring Engine**

- Scans presentations in FR, EN, AR, ES  
- Detects unsupported claims  
- Flags missing mandatory safety information  
- Generates compliance risk scores  
- Blocks high-risk content before delivery  
- Provides full audit trails  

---

### BO4 – Prevent Loss of Healthcare Professionals  
**DSO12: AI HCP Engagement & Churn Predictor**

- Calculates engagement score per doctor/pharmacist  
- Predicts potential disengagement  
- Sends smart alerts to delegates  
- Suggests re-engagement strategies  

---

## Tech Stack

### Frontend
- Next.js  
- React.js  
- Tailwind CSS  
- Framer Motion  

### Backend
- Node.js  
- Express.js  
- REST APIs  

### AI & Machine Learning
- Python  
- NLP Processing  
- Risk Scoring Models  
- Predictive Analytics  
- Drift Detection  

### Database
- MongoDB (Data Lake)  
- CRM Integration  

### Avatar Development
- 3D Web Avatar (Three.js / WebGL-based rendering)  
- AI Conversation Engine  

---

## Architecture

AthenaPulse follows a modular AI-driven architecture and adopts TDSP methodology for AI project lifecycle management:

### 1. Data Sources
- Internal CRM  
- Delegate visit reports  
- Conversation logs  
- Product database  
- External health sources (NIH, FDA)  

### 2. Data Processing Layer
- Batch data ingestion  
- Data lake storage (MongoDB)  
- NLP preprocessing (cleaning, normalization, entity extraction)  
- Feature engineering  

### 3. AI Orchestrator
- Safety Monitoring Agent  
- Compliance Risk Agent  
- Training Simulation Engine  
- HCP Engagement Predictor  

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

- Tasnim BENHASSINE - project manager  
- Yasmine ASKRI  - project lead
- Mohamed Aziz TRABELSI  - solution architect
- Rabeb BOUGATEF - solution archotect  
- Mohamed Youssef AZZOUZ - data scientist
- Wiem MHEDHBI - data scientist  

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
- MongoDB  
- npm or yarn  

---

### Installation

```bash
# Clone repository
git clone https://github.com/Tasnim85/Esprit-PIDS-4DS9-2526-ATHENAPULSE.git

# Navigate to project
cd athenapulse

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install

# Install Python dependencies
pip install -r requirements.txt
