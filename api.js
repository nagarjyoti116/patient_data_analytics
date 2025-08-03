const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const API_KEY = process.env.API_KEY;
const BASE_URL = process.env.BASE_URL;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

app.get('/patient/data/analyze', async (req, res) => {
  let page = 1, hasNext = true, Patients = [];

  // Fetch all pages while the API indicates there's a next page
  while (hasNext) {
    let retries = 3; // retry up to 3 times
    while (retries > 0) {
      try {
        console.log(`Fetching page: ${page} (retries left: ${retries})`);
        const response = await axios.get(`${BASE_URL}/patients`, {
          params: { page, limit: 20 },
          headers: { 'x-api-key': API_KEY }
        });
        const data = response.data;

        // Add fetched patients to our list, filter to ensure valid objects
        if (Array.isArray(data.data)) {
          Patients = Patients.concat(data.data.filter(p => typeof p === 'object' && p !== null));
        } else {
          console.warn('Unexpected data format on page', page);
        }

        // Check if there's another page
        hasNext = data.pagination?.hasNext ?? false;

        page++;
        await sleep(1000); // avoid hitting rate limits

        break; // success, exit retry loop
      } catch (err) {
        const status = err.response?.status;
        if (status === 429) {
            // API rate limited us → wait longer before retrying
            console.warn('Rate limited (429). Waiting 2 seconds before retry...');
            await sleep(2000);
        } else if (status === 500 || status === 503) {
            // Temporary server error → wait and retry
            console.warn(`Server error (${status}). Retrying after 1 second...`);
            await sleep(1000);
        } else {
            // Unexpected error → log and exit retries quickly
            console.error('Unexpected error:', err.message);
            retries = 1;
        }
        retries--;// decrease retry count
        if (retries === 0) {
          console.error('Failed to fetch after retries. Stopping.');
          hasNext = false; // stop fetching further pages
        }
      }
    }
  }

  console.log(`Fetched total patients: ${Patients.length}`);

// Calculate risk scores
  const patientsRisk = Patients
  .filter(patient => typeof patient === 'object' && patient !== null)
  .map((patient)=> {
        let bpScore = 0, tempScore = 0, ageScore =0, riskScore =0;
        const {blood_pressure, temperature, age } = patient;
        
        const temp = parseFloat(temperature);
        const ageP = parseFloat(age);

        let systolic = NaN, diastolic = NaN;
        let invalidBp = false;

        // Validate and parse blood pressure
        if (typeof blood_pressure !== 'string' || blood_pressure.trim() == '' || !blood_pressure.match(/^\d+\s*\/\s*\d+$/)) {
            invalidBp = true;
        } else {
            let parts = blood_pressure.trim().split('/');
            systolic = parseInt(parts[0], 10);
            diastolic = parseInt(parts[1], 10); 
        };
    

        // Assign temperature score
        if (temp >= 99.6 && temp <= 100.9) tempScore = 1;
        else if (temp >= 101) tempScore = 2;
    
        // Assign age score
        if (ageP >= 40 && ageP <= 65) ageScore = 1;
        else if (ageP > 65) ageScore = 2;

        // Assign blood pressure score
        if (systolic >= 140 || diastolic >= 90) bpScore = 3;
        else if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) bpScore = 2;
        else if (systolic >= 120 && systolic <= 129 && diastolic < 80) bpScore = 1;
       
        // Total risk score
        riskScore = tempScore + ageScore + bpScore;
        return {...patient,tempScore, ageScore, bpScore, riskScore, invalidBp};

    })

    // Patients with high risk (riskScore >= 4)
    const highRisk = patientsRisk.filter(patient=>patient["riskScore"]  >= 4);
    const highRiskPatientsID = highRisk.map(patient => patient.patient_id);


    // Patients with fever (temperature >= 99.6)
    const feverPatients = patientsRisk.filter(patient=>patient.temperature >= 99.6);
    const feverPatientsID = feverPatients.map(patient => patient.patient_id);

    // Patients with data quality issues (missing/invalid data)
    const poorData = patientsRisk.filter(patient=>{
        const temp = patient.temperature;
        const age = patient.age;
        const bp = patient.blood_pressure;
        const invalidBP = patient.invalidBp;
        const invalidTemp = isNaN(parseFloat(temp));
        const invalidAge  = isNaN(parseFloat(age));
        return invalidBP || invalidTemp || invalidAge;
        });

    const poorDataID = poorData.map(patient => patient.patient_id);

    // Final summary object
    const results = {
        high_risk_patients: highRiskPatientsID,
        fever_patients: feverPatientsID,
        data_quality_issues: poorDataID
    };

    console.log(results);
    res.json(results);
})

app.listen(5000, ()=> {
    console.log('server is running on 5000.....')
})



