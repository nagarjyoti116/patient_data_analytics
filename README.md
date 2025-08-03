# 🩺 Patient Data Analyzer (Node.js & Express)

A Node.js and Express application that fetches paginated patient data from an external API, calculates risk scores based on temperature, age, and blood pressure, and returns useful analytics such as:
- High-risk patients
- Patients with fever
- Patients with data quality issues

This app includes retry logic, pagination handling, and defensive data validation to handle real-world API inconsistencies.

---

##  Features
✅ Fetches patient data from a paginated external API  
✅ Handles rate limiting (HTTP 429) and intermittent server errors (HTTP 500/503) with retries  
✅ Calculates patient risk scores  
✅ Identifies patients with fever and data quality issues  
✅ Provides a single JSON API endpoint: `/patient/data/analyze`

---

## Prerequisites
- Node.js (v16 or later recommended)
- npm

---

## Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/patient-data-analyzer.git
cd patient-data-analyzer
Install dependencies:

bash
Copy
Edit
npm install
Create a .env file in the root directory:

env
Copy
Edit
API_KEY=your_api_key_here
BASE_URL=https://assessment.ksensetech.com/api
Replace your_api_key_here with your actual API key.

🚀 Running the Application
bash
Copy
Edit
node app.js
The server will start on port 5000 by default.

📡 API Endpoint
GET /patient/data/analyze
Fetches all pages of patient data and analyzes them.

Response:
json
Copy
Edit
{
  "high_risk_patients": [ "ID1", "ID2", ... ],
  "fever_patients": [ "ID3", "ID4", ... ],
  "data_quality_issues": [ "ID5", "ID6", ... ]
}
high_risk_patients: Patients with a calculated risk score ≥ 4

fever_patients: Patients with temperature ≥ 99.6°F

data_quality_issues: Patients with missing, malformed, or invalid data (age, temperature, or blood pressure)

🛡 Error Handling & Retry Logic
Retries up to 3 times on:

Rate limiting (HTTP 429)

Temporary server errors (HTTP 500 / 503)

Waits:

1000ms between normal requests

2000ms when rate limited

1000ms after server errors









