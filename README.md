# SQL Injection Detection and Remediation

This project provides an end-to-end system for detecting and remediating SQL injection vulnerabilities. It leverages a Machine Learning service to identify malicious payloads and a Web Application (CyberNest) interface to demonstrate, analyze, and manage the detections.

## Project Structure

- **`/CyberNest`**: A web application built with modern web technologies (React/Vite, TypeScript, Tailwind CSS). It serves as the user interface and main application backend.
- **`/ml_service`**: A Python-based Machine Learning microservice. It contains the model training scripts, the exported models (`.joblib`), and a web service (`app.py`) to classify inputs as safe or containing SQL injection patterns.
- **`SQL_Injection_Dataset_100K_v2.csv`**: The dataset used to train the machine learning models.

## Getting Started

### Prerequisites
- Node.js (for CyberNest web app)
- Python 3 (for ML Service)

### Running the ML Service
1. Navigate to the `ml_service` directory.
2. Install the required Python dependencies (e.g., `scikit-learn`, `pandas`, `flask` etc).
3. Run the service: `python app.py`.

### Running the Web App (CyberNest)
1. Navigate to the `CyberNest` directory.
2. Install dependencies: `npm install`.
3. Start the development server: `npm run dev`.

## Features
- **Machine Learning Detection**: Robust ML models trained on a 100K record dataset to accurately detect SQLi payloads.
- **Modern Web Interface**: An intuitive and responsive web app to view code vulnerabilities and potential remediations.
- **Automated Remediation**: Suggestions and fixes for identified vulnerable code patterns.

## Repository
[SQL Injection Detection & Remediation](https://github.com/iqrabibi44/sql-injection-detection-remediation.git)
