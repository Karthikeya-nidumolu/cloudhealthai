# HealthAI Cloud

HealthAI Cloud is an advanced, AI-powered medical diagnostic and visualization platform designed to help users understand their medical reports. By leveraging state-of-the-art Large Language Models (LLMs) and generative AI, the platform translates complex clinical jargon into accessible, easy-to-understand insights, accompanied by highly accurate 3D anatomical visualizations.

## What This Project Does

- **Automated Medical Report Analysis**: Upload any medical report (PDF, text), and the system uses Groq's instantaneous Llama-3 AI to parse the document, extract key health parameters, and provide a plain-English summary.
- **AI Diagnostic Illustrations**: Dynamically generates clinical, 3D anatomical visualizations (X-ray/CT scan style) tailored precisely to the condition described in the patient's report using Pollinations.ai.
- **Smart Doctor & Hospital Finder**: Integrates with OpenStreetMap data to locate relevant specialists, hospitals, and clinics within a 25km radius based on the specific medical condition detected in the report.
- **Secure Cloud Storage**: Utilizes Firebase Authentication and Firestore to securely store user profiles and their historical medical reports.
- **Interactive 3D Dashboard**: A modern, glassmorphic UI featuring a 3D interactive human body model for an immersive user experience.

---

## Setup Instructions

Follow these steps to fully configure the project on your local machine.

### 1. Firebase Admin Key Setup

Because Next.js runs middleware entirely on the server, we need to securely verify Firebase authentication using standard cookies. This requires the Firebase Admin SDK.

**Generating the Key:**
1. Go to the [Firebase Console](https://console.firebase.google.com/) -> Project Settings -> **Service Accounts**.
2. Click **"Generate new private key"**. This will download a JSON file.
3. Open the JSON file. You need the `private_key` field.
4. **IMPORTANT FORMATTING STEP**: The private key contains literal `\n` characters. When putting this in your `.env.local` file, you must **wrap the entire string in double quotes**.

Example:
```env
# correct format
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE....\n-----END PRIVATE KEY-----\n"
```
Place this, along with your other Firebase client keys, inside `.env.local`. Use `.env.example` as a template.

### 2. Setting Up the 3D Skeleton Model

The 3D Landing Page requires a `.glb` formatted 3D skeleton to animate. 

1. Download a free skeleton model (e.g., from Sketchfab). Make sure it's in the **.glb** format.
2. Ensure the skeleton has **separate named meshes** for major groups (e.g., Spine, Ribcage, Arms, Legs). It should not be merged into a single mesh if you want independent animations.
3. Rename the downloaded file strictly to `skeleton.glb`.
4. Place the file inside the `public/` directory of this Next.js project.

### 3. OpenStreetMap & Pollinations AI

The project uses OpenStreetMap (Overpass API) for location search and Pollinations.ai for image generation. Both of these are free, open-source-friendly APIs that **do not require any API keys**.

### 4. Groq AI

Create an account at [Groq Console](https://console.groq.com/) to attain an API key for instantaneous Llama-3 parsing of the documents. Add this key to your `.env.local` as `GROQ_API_KEY`.

---

## Disclaimer & License

**Educational Purposes Only**
This platform is built strictly for **educational and demonstrative purposes**. It is NOT a substitute for professional medical advice, diagnosis, or treatment. Never disregard professional medical advice or delay in seeking it because of something you have read or generated on this application. Always consult with a qualified healthcare provider for medical decisions.


