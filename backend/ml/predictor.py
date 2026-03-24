"""
MediAI — ML Prediction Engine
Pipeline: Symptoms → Disease → Medicines + Dosage + Precautions + Severity

Trained on:
  dataset1_symptoms_disease.csv  (5000 rows, 151 diseases)
  dataset2_disease_medicine.csv  (5000 rows, medicines per disease)
"""

import os, logging, re
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, MultiLabelBinarizer
from sklearn.model_selection import train_test_split

logger = logging.getLogger(__name__)

# ─── Paths ────────────────────────────────────────────────────────────────────
_BASE_DIR    = os.path.dirname(__file__)
_DS1         = os.path.join(_BASE_DIR, "dataset1_symptoms_disease.csv")
_DS2         = os.path.join(_BASE_DIR, "dataset2_disease_medicine.csv")
_M1_MODEL    = os.path.join(_BASE_DIR, "model1_disease.pkl")
_M1_MLB      = os.path.join(_BASE_DIR, "model1_mlb.pkl")
_M1_LE       = os.path.join(_BASE_DIR, "model1_le.pkl")
_LOOKUP      = os.path.join(_BASE_DIR, "medicine_lookup.csv")

# ─── Severity ordering ────────────────────────────────────────────────────────
_SEV_ORDER   = {"Mild": 0, "Moderate": 1, "Severe": 2, "Critical": 3}
_SEV_RISK    = {"Mild": "Low", "Moderate": "Medium", "Severe": "High", "Critical": "Critical"}
_SEV_NAMES   = ["Mild", "Moderate", "Severe", "Critical"]

# ─── Symptom synonyms — map common user inputs to dataset vocabulary ───────────
_SYNONYMS = {
    # fever / temperature
    "high fever":           "fever",
    "mild fever":           "fever",
    "low grade fever":      "fever",
    "low-grade fever":      "fever",
    "temperature":          "fever",
    "pyrexia":              "fever",
    # cough
    "dry cough":            "cough",
    "wet cough":            "cough",
    "persistent cough":     "cough",
    "chronic cough":        "cough",
    "coughing":             "cough",
    # pain
    "body ache":            "body aches",
    "body pain":            "body aches",
    "muscle ache":          "muscle pain",
    "muscular pain":        "muscle pain",
    "myalgia":              "muscle pain",
    "chest tightness":      "chest pain",
    "chest pressure":       "chest pain",
    "stomach pain":         "abdominal pain",
    "stomach ache":         "abdominal pain",
    "belly pain":           "abdominal pain",
    "knee pain":            "joint pain",
    "back pain":            "back or flank pain",
    "lower back pain":      "back or flank pain",
    "leg pain":             "joint pain",
    # breathing
    "breathlessness":       "shortness of breath",
    "difficulty breathing": "shortness of breath",
    "sob":                  "shortness of breath",
    "dyspnoea":             "shortness of breath",
    "dyspnea":              "shortness of breath",
    # nausea / vomiting
    "feeling nauseous":     "nausea",
    "vomit":                "vomiting",
    "throwing up":          "vomiting",
    # other
    "loose motion":         "diarrhoea",
    "loose motions":        "diarrhoea",
    "diarrhea":             "diarrhoea",
    "diarrhoeaa":           "diarrhoea",
    "loose stools":         "diarrhoea",
    "tiredness":            "fatigue",
    "exhaustion":           "fatigue",
    "lethargy":             "fatigue",
    "dizzy":                "dizziness",
    "lightheaded":          "dizziness",
    "light headed":         "dizziness",
    "sore throat":          "sore throat",
    "throat pain":          "sore throat",
    "skin rash":            "skin rash",
    "rashes":               "skin rash",
    "rash":                 "skin rash",
    "swollen lymph":        "swollen lymph nodes",
    "swollen glands":       "swollen lymph nodes",
    "itching":              "itching around veins",
    "itchy":                "itching around veins",
    "running nose":         "runny nose",
    "runny nose":           "runny nose",
    "blocked nose":         "nasal congestion",
    "stuffy nose":          "nasal congestion",
    "weight loss":          "weight loss",
    "losing weight":        "weight loss",
    "heart palpitations":   "rapid heartbeat",
    "palpitations":         "rapid heartbeat",
    "racing heart":         "rapid heartbeat",
    "increased urination":  "frequent urination",
    "urinating more":       "frequent urination",
    "blurry vision":        "blurred vision",
    "blurred vision":       "blurred vision",
    "poor vision":          "blurred vision",
    "yellow eyes":          "jaundice",
    "yellow skin":          "jaundice",
    "yellowing":            "jaundice",
    "pale skin":            "pallor",
    "paleness":             "pallor",
    "blood in urine":       "blood in urine",
    "hematuria":            "blood in urine",
    "loss of appetite":     "loss of appetite",
    "no appetite":          "loss of appetite",
    "poor appetite":        "loss of appetite",
    "memory loss":          "cognitive impairment",
    "forgetfulness":        "cognitive impairment",
    "numbness":             "tingling and numbness in thumb and fingers",
    "tingling":             "tingling and numbness in thumb and fingers",
    "swelling":             "severe oedema (swelling)",
    "oedema":               "severe oedema (swelling)",
    "edema":                "severe oedema (swelling)",
    "puffiness":            "severe oedema (swelling)",
    "anxiety":              "anxiety",
    "anxious":              "anxiety",
    "panic":                "anxiety",
    "depression":           "depression",
    "depressed":            "depression",
    "sad":                  "depression",
    "insomnia":             "sleep disturbance",
    "cant sleep":           "sleep disturbance",
    "can't sleep":          "sleep disturbance",
    "night sweats":         "sweating",
    "excessive sweating":   "sweating",
    "hot flashes":          "sweating",
    "constipation":         "constipation or diarrhoea",
    "irregular periods":    "irregular periods",
    "missed period":        "irregular periods",
    "hair loss":            "hair loss",
    "hair thinning":        "thinning scalp hair",
    "thinning hair":        "thinning scalp hair",
    "acne":                 "papules",
    "pimples":              "pustules",
    "snoring":              "loud snoring",
    "loud snoring":         "loud snoring",
    "mouth sore":           "white patches in mouth",
    "oral thrush":          "white patches in mouth",
    "frequent thirst":      "increased thirst",
    "thirst":               "increased thirst",
    "excessive thirst":     "increased thirst",
    "muscle weakness":      "muscle weakness starting in limbs or speech",
    "weakness":             "fatigue",
    "stiff neck":           "neck stiffness",
    "neck pain":            "neck stiffness",
    "heartburn":            "abdominal pain",
    "acid reflux":          "abdominal pain",
    "indigestion":          "abdominal pain",
}

# ─── Global state (lazy-loaded) ──────────────────────────────────────────────
_model      = None
_mlb        = None
_le         = None
_lookup_df  = None
_all_syms   = None   # set of all symptoms in training vocab
_loaded     = False


def _train_and_save():
    """Train the disease predictor from the raw CSVs and save pkl files."""
    logger.info("Training disease predictor model…")
    df1 = pd.read_csv(_DS1)
    sym_cols = [c for c in df1.columns if c.startswith("symptom_")]
    df1[sym_cols] = df1[sym_cols].fillna("")
    df1["symptom_list"] = df1[sym_cols].apply(
        lambda row: [s.strip().lower() for s in row if s.strip()], axis=1
    )
    mlb = MultiLabelBinarizer()
    X   = mlb.fit_transform(df1["symptom_list"])
    le  = LabelEncoder()
    y   = le.fit_transform(df1["disease"])
    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=0.10, random_state=42, stratify=y
    )
    clf = RandomForestClassifier(
        n_estimators=200, max_features="sqrt",
        class_weight="balanced", n_jobs=-1, random_state=42
    )
    clf.fit(X_tr, y_tr)
    from sklearn.metrics import accuracy_score
    acc = accuracy_score(y_te, clf.predict(X_te))
    logger.info(f"Disease model accuracy: {acc*100:.2f}%")
    joblib.dump(clf, _M1_MODEL, compress=3)
    joblib.dump(mlb, _M1_MLB,   compress=3)
    joblib.dump(le,  _M1_LE,    compress=3)
    return clf, mlb, le


def _load_models():
    """Load (or train if missing) all models + lookup table."""
    global _model, _mlb, _le, _lookup_df, _all_syms, _loaded

    # copy datasets to ml folder if not present
    if not os.path.exists(_DS1):
        import shutil
        for src, dst in [
            ("/mnt/user-data/uploads/1773632251029_dataset1_symptoms_disease.csv", _DS1),
            ("/mnt/user-data/uploads/1773632251030_dataset2_disease_medicine.csv", _DS2),
        ]:
            if os.path.exists(src):
                shutil.copy(src, dst)

    # train if pkl missing
    if not (os.path.exists(_M1_MODEL) and os.path.exists(_M1_MLB) and os.path.exists(_M1_LE)):
        _model, _mlb, _le = _train_and_save()
    else:
        _model = joblib.load(_M1_MODEL)
        _mlb   = joblib.load(_M1_MLB)
        _le    = joblib.load(_M1_LE)

    # build lookup from dataset2
    if not os.path.exists(_LOOKUP):
        df2 = pd.read_csv(_DS2)
        df2.to_csv(_LOOKUP, index=False)
    _lookup_df = pd.read_csv(_LOOKUP)

    # vocabulary set
    _all_syms = set(_mlb.classes_)
    _loaded   = True
    logger.info(f"ML engine ready: {len(_le.classes_)} diseases, {len(_all_syms)} symptoms")


def _normalize_symptom(raw: str) -> str:
    """Lower-case, strip, apply synonym map."""
    s = raw.strip().lower()
    s = re.sub(r"['\u2019]", "", s)        # remove apostrophes
    s = re.sub(r"\s+", " ", s)             # collapse spaces
    return _SYNONYMS.get(s, s)


def _map_symptoms_to_vocab(symptoms: list[str]) -> list[str]:
    """Return symptoms that exist in training vocab, after synonym mapping."""
    normalized = [_normalize_symptom(s) for s in symptoms]
    matched    = [s for s in normalized if s in _all_syms]
    # also try partial match for any unmatched
    unmatched  = [s for s in normalized if s not in _all_syms]
    for um in unmatched:
        for vocab_sym in _all_syms:
            if um in vocab_sym or vocab_sym in um:
                matched.append(vocab_sym)
                break
    return list(set(matched)) if matched else normalized   # fallback: raw


def _get_medicines_for_disease(disease: str) -> list[dict]:
    """Return deduplicated, severity-sorted medicine list for a disease."""
    meds = _lookup_df[_lookup_df["disease"].str.lower() == disease.lower()].copy()
    if meds.empty:
        return []
    # deduplicate by medicine name
    meds = meds.drop_duplicates(subset=["medicine"]).reset_index(drop=True)
    meds["_sev_order"] = meds["severity"].map(_SEV_ORDER).fillna(1)
    meds = meds.sort_values("_sev_order")
    result = []
    for _, row in meds.iterrows():
        result.append({
            "medicine":    row["medicine"],
            "dosage":      row["dosage"],
            "precautions": row["precautions"],
            "severity":    row["severity"],
        })
    return result


def _determine_severity(medicines: list[dict]) -> str:
    """Infer overall severity from the medicine list."""
    if not medicines:
        return "Moderate"
    levels = [_SEV_ORDER.get(m["severity"], 1) for m in medicines]
    avg = sum(levels) / len(levels)
    if avg <= 0.4:
        return "Mild"
    elif avg <= 1.3:
        return "Moderate"
    elif avg <= 2.2:
        return "Severe"
    return "Critical"


def _build_treatment_summary(disease: str, medicines: list[dict], severity: str) -> str:
    """Build a human-readable treatment summary string."""
    if not medicines:
        return f"Consult a doctor for {disease} treatment."
    first  = medicines[0]
    others = [m["medicine"] for m in medicines[1:4]]
    summary = f"Primary: {first['medicine']} — {first['dosage']}."
    if others:
        summary += f" Also consider: {', '.join(others)}."
    if severity in ("Severe", "Critical"):
        summary += " Immediate medical attention required."
    return summary


# ═══════════════════════════════════════════════════════════════════════════════
# PUBLIC API
# ═══════════════════════════════════════════════════════════════════════════════

def predict(
    symptoms:         list[str],
    age:              int   = 30,
    temperature:      float = 98.6,
    bp_systolic:      int   = 120,
    bp_diastolic:     int   = 80,
    has_diabetes:     bool  = False,
    has_hypertension: bool  = False,
) -> dict:
    """
    Full prediction pipeline.

    Returns:
        {
          predicted_disease, confidence_score,
          severity_level, risk_level,
          recommended_treatment,           # short string for DB
          medicines: [ {medicine, dosage, precautions, severity}, … ],
          top_diseases: [ {disease, probability}, … ],
          matched_symptoms: [ … ],
          disclaimer: …
        }
    """
    global _loaded
    if not _loaded:
        _load_models()

    # ── 1. Map symptoms to vocabulary ──────────────────────────────────────────
    matched_symptoms = _map_symptoms_to_vocab(symptoms)
    X = _mlb.transform([matched_symptoms])

    # ── 2. Predict disease probabilities ───────────────────────────────────────
    proba    = _model.predict_proba(X)[0]
    top5_idx = proba.argsort()[::-1][:5]

    predicted_disease = _le.classes_[top5_idx[0]]
    confidence        = round(float(proba[top5_idx[0]]) * 100, 1)

    top_diseases = [
        {"disease": _le.classes_[i], "probability": round(float(proba[i]) * 100, 1)}
        for i in top5_idx if proba[i] > 0.01
    ]

    # ── 3. Vitals adjustment ───────────────────────────────────────────────────
    # Bump confidence if vitals support the prediction
    fever_flag   = temperature > 99.5 or temperature > 37.5
    hbp_flag     = bp_systolic > 140 or bp_diastolic > 90
    if fever_flag and any(
        kw in predicted_disease.lower()
        for kw in ["fever", "influenza", "typhoid", "dengue", "malaria", "covid", "infection"]
    ):
        confidence = min(confidence + 5.0, 99.0)
    if has_diabetes and "diabetes" in predicted_disease.lower():
        confidence = min(confidence + 8.0, 99.0)
    if has_hypertension and hbp_flag and any(
        kw in predicted_disease.lower()
        for kw in ["hypertension", "heart", "stroke", "kidney"]
    ):
        confidence = min(confidence + 6.0, 99.0)

    # ── 4. Get medicines from lookup ───────────────────────────────────────────
    medicines = _get_medicines_for_disease(predicted_disease)

    # ── 5. Severity ────────────────────────────────────────────────────────────
    severity = _determine_severity(medicines)

    # Bump severity for dangerous vitals
    if fever_flag and severity == "Mild":
        severity = "Moderate"
    if (bp_systolic > 180 or bp_diastolic > 110) and severity in ("Mild", "Moderate"):
        severity = "Severe"
    if age >= 65 and severity == "Mild":
        severity = "Moderate"

    risk_level = _SEV_RISK.get(severity, "Medium")

    # ── 6. Treatment summary ───────────────────────────────────────────────────
    recommended_treatment = _build_treatment_summary(predicted_disease, medicines, severity)

    return {
        "predicted_disease":     predicted_disease,
        "confidence_score":      confidence,
        "severity_level":        severity,
        "risk_level":            risk_level,
        "recommended_treatment": recommended_treatment,
        "medicines":             medicines,
        "top_diseases":          top_diseases,
        "matched_symptoms":      matched_symptoms,
        "vitals_analyzed": {
            "temperature":     temperature,
            "blood_pressure":  f"{bp_systolic}/{bp_diastolic}",
            "has_diabetes":    has_diabetes,
            "has_hypertension":has_hypertension,
        },
        "disclaimer": (
            "This AI recommendation is for informational purposes only. "
            "Always consult a licensed physician before taking any medication."
        ),
    }


def get_all_symptoms() -> list[str]:
    """Return sorted list of all symptoms known to the model."""
    global _loaded
    if not _loaded:
        _load_models()
    return sorted(_all_syms)


def get_all_diseases() -> list[str]:
    """Return sorted list of all disease classes."""
    global _loaded
    if not _loaded:
        _load_models()
    return sorted(_le.classes_)
