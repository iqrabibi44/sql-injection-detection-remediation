from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import re
import urllib.parse
import os
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
 
app = Flask(__name__)
CORS(app) # Allows Node.js to communicate with Flask
 
# ==========================================
# TEXT CLEANING FUNCTION
# ==========================================
def clean_code_data(text):
    if not isinstance(text, str):
        return ""
    # Decode URL encoded characters
    text = urllib.parse.unquote(text)
    # Convert to lowercase
    text = text.lower()
    # Remove excess whitespace
    text = re.sub(r'\s+', ' ', text)
    return text.strip()
 
# ==========================================
# 1. TRAIN THE MODEL ON STARTUP
# ==========================================
print("Loading pre-trained high-accuracy model...")
 
model = None
vectorizer = None
 
try:
    model_path = os.path.join(os.path.dirname(__file__), 'model.joblib')
    vectorizer_path = os.path.join(os.path.dirname(__file__), 'vectorizer.joblib')
    
    if os.path.exists(model_path) and os.path.exists(vectorizer_path):
        model = joblib.load(model_path)
        vectorizer = joblib.load(vectorizer_path)
        print("High-accuracy model loaded successfully!")
    else:
        print("Model files not found. Training minimal fallback model...")
        # Minimal fallback training if files are missing
        df_small = pd.read_csv(os.path.join(os.path.dirname(__file__), 'code_vulnerabilities.csv'))
        df_small.dropna(subset=['Code Snippet'], inplace=True)
        df_small['is_sqli'] = df_small['Vulnerability Type'].apply(lambda x: 1 if str(x).strip().lower() == 'sqli' else 0)
        vectorizer = TfidfVectorizer(max_features=5000)
        X = vectorizer.fit_transform(df_small['Code Snippet'].apply(lambda x: re.sub(r'\s+', ' ', str(x).lower()).strip()))
        y = df_small['is_sqli']
        model = LogisticRegression()
        model.fit(X, y)
        print("Fallback model trained.")
except Exception as e:
    print(f"Error loading model: {e}")
 
# ==========================================
# 2. CREATE THE API ENDPOINT FOR NODE.JS
# ==========================================
# ==========================================
# 2. CREATE THE API ENDPOINT FOR NODE.JS
# ==========================================
@app.route('/predict', methods=['POST'])
def predict():
    print("\n--- ML SERVICE: INCOMING REQUEST ---")
    data = request.json
    raw_code = data.get('code', '')
   
    if not raw_code:
        return jsonify({"error": "No code provided"}), 400
 
    cleaned_code = clean_code_data(raw_code)
 
    # 1. Ask the ML Model for its opinion
    vectorized_code = vectorizer.transform([cleaned_code])
    prediction = model.predict(vectorized_code)[0]
    probabilities = model.predict_proba(vectorized_code)[0]
    confidence = max(probabilities)
   
    is_vulnerable = bool(prediction == 1)
 
    # ---------------------------------------------------------
    # DANGER OVERRIDE (HEURISTIC FILTER)
    # ---------------------------------------------------------
    # If the ML says "Safe" but we find 100% malicious patterns,
    # force the result to "Vulnerable".
    danger_patterns = [
        r"select.*where.*\+",        # String concatenation with '+'
        r"select.*where.*%s",        # String formatting with %s
        r"select.*where.*\.[a-zA-Z]", # Concatenation in PHP/JS style
        r"insert into.*values.*\+",  # Concatenation in INSERT
        r"update.*set.*\+",          # Concatenation in UPDATE
        r"delete from.*where.*\+"    # Concatenation in DELETE
    ]
 
    if not is_vulnerable:
        for pattern in danger_patterns:
            if re.search(pattern, cleaned_code):
                print(f"DEBUG: ML said Safe, but found DANGER pattern '{pattern}'. OVERRULING TO VULNERABLE.")
                is_vulnerable = True
                confidence = 1.0
                break
 
    # ---------------------------------------------------------
    # SAFETY OVERRIDE (HEURISTIC FILTER)
    # ---------------------------------------------------------
    # If it's still marked as vulnerable, check if it's actually using secure placeholders
    safe_patterns = [
        r"->prepare\(",
        r"bind_param\(",
        r"bindparam\(",
        r"\?",
        r"=\s*:[a-zA-Z]+"
    ]
 
    if is_vulnerable:
        for pattern in safe_patterns:
            if re.search(pattern, cleaned_code):
                print(f"DEBUG: ML said Vulnerable, but found safe pattern '{pattern}'. OVERRULING TO SAFE.")
                is_vulnerable = False
                confidence = 1.0
                break
 
    print(f"FINAL DECISION: {'VULNERABLE' if is_vulnerable else 'SAFE'}")
    print(f"CONFIDENCE SCORE: {confidence:.2%}")
    print("--- ML SERVICE: RESPONSE SENT ---")
 
    return jsonify({
        "vulnerable": is_vulnerable,
        "confidence": float(confidence),
        "message": "SQL Injection detected!" if is_vulnerable else "Code looks safe."
    })
if __name__ == '__main__':
    print("Starting ML API on http://127.0.0.1:8000 ...")
    app.run(port=8000, debug=True)