import pandas as pd
import numpy as np
import re
import urllib.parse
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
import joblib
import os

def clean_sql_query(text):
    if not isinstance(text, str):
        return ""
    # Decode URL encoded characters
    text = urllib.parse.unquote(text)
    # Convert to lowercase
    text = text.lower()
    # Remove excess whitespace
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def train():
    print("Starting High-Accuracy Model Training...")
    
    # Path to dataset
    dataset_path = os.path.join(os.path.dirname(__file__), '..', 'SQL_Injection_Dataset_100K_v2.csv')
    
    if not os.path.exists(dataset_path):
        print(f"Error: Dataset not found at {dataset_path}")
        return

    print(f"Loading dataset: {dataset_path}")
    df = pd.read_csv(dataset_path)
    
    # 1. Preprocessing
    print("Preprocessing data...")
    df.dropna(subset=['sql_query', 'vulnerability_status'], inplace=True)
    
    # Convert vulnerability_status to binary (yes=1, no=0)
    df['label'] = df['vulnerability_status'].map({'yes': 1, 'no': 0})
    
    print("Cleaning SQL queries...")
    df['cleaned_query'] = df['sql_query'].apply(clean_sql_query)
    
    # DATA AUGMENTATION: Add simple safe and malicious queries to reduce bias
    print("Augmenting data with synthetic queries...")
    synthetic_safe = [
        "SELECT * FROM users WHERE id = 1",
        "SELECT * FROM users WHERE id = 123",
        "SELECT * FROM products WHERE id = 5",
        "SELECT name, email FROM employees WHERE id = 10",
        "SELECT * FROM orders WHERE status = 'shipped'",
        "SELECT * FROM users WHERE email = 'test@example.com'",
        "SELECT count(*) FROM logs",
        "UPDATE users SET last_login = NOW() WHERE id = 1",
        "DELETE FROM sessions WHERE id = 100",
        "SELECT * FROM categories",
        "SELECT * FROM products WHERE price > 100",
        "SELECT name FROM customers WHERE city = 'New York'",
        "SELECT * FROM users WHERE username = 'admin'",
        "SELECT * FROM users WHERE username = 'user123'",
        "SELECT * FROM products ORDER BY price",
        "SELECT * FROM products ORDER BY price DESC",
        "SELECT * FROM users ORDER BY name",
        "SELECT * FROM users ORDER BY name DESC",
        "SELECT * FROM orders WHERE user_id = 10 ORDER BY id",
    ]
    
    synthetic_malicious = [
        "admin' OR 1=1 --",
        "1' OR '1'='1",
        "\" OR \"1\"=\"1",
        "') OR ('1'='1",
        "admin' --",
        "1; DROP TABLE users",
        "' OR TRUE --",
        "admin' #",
        "' UNION SELECT NULL, NULL --",
    ]
    
    augmented_data = []
    # Safe examples (label 0)
    for q in synthetic_safe:
        for _ in range(500):
            augmented_data.append({'cleaned_query': clean_sql_query(q), 'label': 0})
            
    # Malicious examples (label 1)
    for q in synthetic_malicious:
        for _ in range(500):
            augmented_data.append({'cleaned_query': clean_sql_query(q), 'label': 1})
    
    df_aug = pd.DataFrame(augmented_data)
    df = pd.concat([df, df_aug], ignore_index=True)
    
    # 2. Feature Extraction (TF-IDF with N-grams)
    print("Extracting features (TF-IDF with n-grams)...")
    vectorizer = TfidfVectorizer(
        max_features=10000, 
        ngram_range=(1, 2), 
        stop_words=None # SQL keywords are important, don't remove stop words
    )
    X = vectorizer.fit_transform(df['cleaned_query'])
    y = df['label']
    
    # 3. Train/Test Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # 4. Model Training (Random Forest for high accuracy)
    print("Training Random Forest Classifier (this may take a few minutes)...")
    model = RandomForestClassifier(
        n_estimators=200, 
        max_depth=None, # Allow deep trees for better pattern capture
        min_samples_leaf=1,
        n_jobs=-1, 
        random_state=42
    )
    model.fit(X_train, y_train)
    
    # 5. Evaluation
    print("Evaluating model...")
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print("\n" + "="*30)
    print(f"Training Complete!")
    print(f"Accuracy: {accuracy:.2%}")
    print("="*30)
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    # 6. Save Model and Vectorizer
    print("Saving model artifacts...")
    joblib.dump(model, os.path.join(os.path.dirname(__file__), 'model.joblib'))
    joblib.dump(vectorizer, os.path.join(os.path.dirname(__file__), 'vectorizer.joblib'))
    print("All done! artifacts saved to ml_service/model.joblib and ml_service/vectorizer.joblib")

if __name__ == "__main__":
    train()
