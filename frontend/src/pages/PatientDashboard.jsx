import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, User, FileText, MessageSquare, Pill,
  Bell, LogOut, Upload, Download, Eye, Heart, Clock, AlertCircle,
  Camera, Edit, Save, Plus, Send, Share2, Copy, Activity,
  CheckCircle, Brain, Menu, X, Smartphone, FileDown, Trash2,
  XCircle, CheckCheck, AlertTriangle, FileSearch, Sparkles,
  Stethoscope, Zap, Bot, ChevronRight, Mic, MicOff, RefreshCw,
  ThumbsUp, ThumbsDown, RotateCcw, Search, BookOpen, Pill as PillIcon,
  TrendingUp, Shield, Info, HelpCircle, MessageCircle, Hash,
  ArrowUpRight, Loader2, WifiOff, HeartPulse, Thermometer,
  Syringe, FlaskConical, ScanLine, Microscope, Lock
} from 'lucide-react';
import MediAiLogo from "../components/MediAiLogo";
import FeedbackModal from "../components/FeedbackModal";
import api, {
  getPatientDashboard,
  getPatientProfile,
  updatePatientProfile,
  updateProfilePicture,
  getMedicalRecords,
  uploadMedicalRecord,
  deleteMedicalRecord,
  getPrescriptions,
  getNotifications,
  markNotificationsRead,
  getSubscription,
  upgradePlan as apiUpgradePlan,
  getPredictions,
  runPrediction,
  submitPatientFeedback,
} from "../services/api";

// ─── Theme tokens ─────────────────────────────────────────────────────────────
const T = {
  bg: '#0a0e1a',
  surface: '#111827',
  card: '#1a2235',
  border: 'rgba(0,153,204,0.15)',
  borderH: 'rgba(0,153,204,0.35)',
  cyan: '#0099cc',
  cyanDim: 'rgba(0,153,204,0.10)',
  text: '#f1f5f9',
  muted: '#64748b',
  sub: '#94a3b8',
  green: '#10b981',
  red: '#ef4444',
  amber: '#f59e0b',
  purple: '#8b5cf6',
};

const fieldInput = {
  width: '100%', padding: '10px 14px',
  background: '#0d1424', border: `1px solid rgba(0,153,204,0.2)`,
  borderRadius: 10, color: T.text, fontSize: 14,
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
};
const fieldLabel = {
  display: 'block', fontSize: 12, color: T.sub,
  marginBottom: 5, fontWeight: 600, letterSpacing: '0.03em',
};

const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{
    background: T.card, border: `1px solid ${T.border}`,
    borderRadius: 16, padding: 24, cursor: onClick ? 'pointer' : 'default',
    transition: 'border-color 0.2s', ...style,
  }}>
    {children}
  </div>
);

const Btn = ({ children, onClick, variant = 'primary', style, icon: Icon, disabled }) => {
  const vs = {
    primary: { background: `linear-gradient(135deg,${T.cyan},#0066aa)`, color: '#fff', border: 'none' },
    secondary: { background: T.cyanDim, border: `1px solid ${T.border}`, color: T.cyan },
    danger: { background: T.red, color: '#fff', border: 'none' },
    ghost: { background: 'transparent', color: T.cyan, border: 'none' },
  };
  return (
    <button onClick={onClick} disabled={!!disabled} style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      padding: '9px 18px', borderRadius: 10, fontWeight: 600, fontSize: 13,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1, transition: 'all 0.2s',
      fontFamily: 'inherit', ...vs[variant], ...style,
    }}>
      {Icon && <Icon size={14} />}{children}
    </button>
  );
};

const Badge = ({ children, color = 'blue' }) => {
  const map = {
    blue: [T.cyan, 'rgba(0,153,204,0.12)'],
    green: [T.green, 'rgba(16,185,129,0.12)'],
    red: [T.red, 'rgba(239,68,68,0.12)'],
    amber: [T.amber, 'rgba(245,158,11,0.12)'],
    gray: [T.muted, 'rgba(100,116,139,0.12)'],
    purple: [T.purple, 'rgba(139,92,246,0.12)'],
  };
  const [fg, bg] = map[color] || map.blue;
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
      color: fg, background: bg, border: `1px solid ${fg}30`, whiteSpace: 'nowrap',
    }}>{children}</span>
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: T.surface, borderRadius: 20, padding: 32,
        maxWidth: 780, width: '100%', maxHeight: '92vh', overflowY: 'auto',
        border: `1px solid ${T.border}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h3 style={{ color: T.text, fontWeight: 800, fontSize: 18, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// MEDICAL REPORT VALIDATION — Full OCR + Keyword Scoring Pipeline
// ════════════════════════════════════════════════════════════════════════════

const MEDICAL_TESTS = [
  'hemoglobin', 'haemoglobin', 'hgb', 'hb',
  'wbc', 'white blood cell', 'white blood count', 'leukocyte',
  'rbc', 'red blood cell', 'erythrocyte',
  'platelet', 'thrombocyte', 'plt',
  'glucose', 'blood sugar', 'fasting glucose', 'post prandial', 'ppbs',
  'cholesterol', 'ldl', 'hdl', 'vldl', 'triglyceride', 'triglycerides', 'lipid profile',
  'blood pressure', 'systolic', 'diastolic',
  'creatinine', 'serum creatinine',
  'urea', 'blood urea nitrogen', 'bun',
  'sodium', 'potassium', 'chloride', 'bicarbonate', 'electrolyte',
  'bilirubin', 'total bilirubin', 'direct bilirubin', 'indirect bilirubin',
  'uric acid',
  'hba1c', 'glycated hemoglobin', 'glycosylated hemoglobin',
  'tsh', 'thyroid stimulating hormone', 't3', 't4', 'thyroxine', 'triiodothyronine',
  'sgpt', 'sgot', 'alt', 'ast', 'alp', 'alkaline phosphatase', 'ggt',
  'albumin', 'total protein', 'globulin', 'a/g ratio',
  'esr', 'erythrocyte sedimentation rate',
  'vitamin d', 'vitamin b12', 'vitamin b', 'folate', 'ferritin', 'serum iron', 'tibc',
  'mcv', 'mch', 'mchc', 'rdw', 'hematocrit', 'pcv', 'packed cell volume',
  'neutrophil', 'lymphocyte', 'monocyte', 'eosinophil', 'basophil', 'differential count',
  'urine protein', 'urine glucose', 'urine ketone', 'urine creatinine', 'urine culture',
  'inr', 'pt', 'prothrombin', 'aptt', 'coagulation', 'd dimer',
  'calcium', 'phosphorus', 'magnesium', 'zinc', 'copper',
  'amylase', 'lipase', 'psa', 'prostate specific antigen',
  'dengue', 'malaria', 'typhoid', 'widal', 'hiv', 'hbsag', 'anti hcv', 'hepatitis',
  'covid', 'sars', 'antigen', 'antibody', 'titer', 'immunoglobulin', 'igg', 'igm',
  'culture', 'sensitivity', 'organism', 'colony count', 'bacteria',
  'ecg', 'electrocardiogram', 'eeg', 'echo', 'echocardiogram', 'stress test',
  'cbc', 'complete blood count', 'complete blood picture', 'haemogram',
];

const REPORT_STRUCTURE = [
  'patient name', 'patient id', 'patient no', 'patient:',
  'age', 'gender', 'sex', 'date of birth', 'dob',
  'sample', 'specimen', 'sample type', 'sample id', 'sample collected',
  'reference range', 'normal range', 'normal value', 'biological reference',
  'result', 'value', 'findings', 'observation',
  'units', 'unit',
  'report date', 'collection date', 'date of collection', 'reported on',
  'registration no', 'lab no', 'report no', 'barcode', 'accession no',
  'remarks', 'comment', 'interpretation', 'impression', 'conclusion',
  'tested by', 'verified by', 'authorized by', 'approved by', 'reported by',
  'lab technician', 'pathologist', 'radiologist', 'consulting',
];

const MEDICAL_SOURCE = [
  'hospital', 'clinic', 'diagnostic', 'diagnostics',
  'laboratory', 'lab report', 'pathology', 'radiology', 'imaging centre',
  'doctor', 'physician', 'consultant', 'dr.', 'dr ',
  'mbbs', 'md ', 'ms ', 'dgo', 'phd', 'dnb', 'frcp', 'mrcp',
  'health care', 'healthcare', 'medical centre', 'medical center',
  'nursing home', 'dispensary', 'pharmacy', 'chemist',
  'department of', 'dept of', 'division of',
  'opd', 'ipd', 'ward', 'icu', 'emergency', 'casualty',
  'city hospital', 'general hospital', 'medical college', 'pvt ltd',
];

const PRESCRIPTION_KEYWORDS = [
  'prescription', 'rx', 'rx:',
  'medicine', 'medication', 'drug name',
  'tablet', 'tab ', 'cap ', 'capsule', 'syrup', 'injection', 'inj ', 'drops', 'ointment',
  'dose', 'dosage',
  'twice daily', 'once daily', 'three times', 'tds', 'bd ', 'od ', 'qid', 'sos',
  'after meal', 'before meal', 'with food', 'empty stomach', 'at bedtime',
  'days', 'weeks', 'months', 'duration', 'refill', 'dispense',
  'mg ', 'ml ', 'mcg ', 'iu ', 'units',
];

const fuzzyMatch = (text, keyword) => {
  if (text.includes(keyword)) return true;
  if (keyword.length < 5) return false;
  const kw = keyword.replace(/\s+/g, '');
  const len = kw.length;
  for (let i = 0; i <= text.length - len; i++) {
    const chunk = text.slice(i, i + len);
    let same = 0;
    for (let j = 0; j < len; j++) if (chunk[j] === kw[j]) same++;
    if (same / len >= 0.82) return true;
  }
  return false;
};

const UNIT_PATTERN = /\d+(\.\d+)?\s*(mg\/dl|g\/dl|mg\/l|mmol\/l|u\/l|iu\/l|miu\/ml|ng\/ml|pg\/ml|nmol\/l|mmhg|cells\/mm|cells\/ul|mm\/hr|g\/l|meq\/l|%|fl\b|pg\b)/i;
const VALUE_PATTERN = /\b\d{1,6}(\.\d{1,3})?\b.{0,30}\b(normal|abnormal|high|low|positive|negative|reactive|non.reactive|detected|not detected)\b/i;
const RANGE_PATTERN = /\d+(\.\d+)?\s*[-–—]\s*\d+(\.\d+)?/;

const scoreMedicalText = (text) => {
  const t = text.toLowerCase();
  let score = 0;
  const found = [];
  for (const kw of MEDICAL_TESTS) { if (fuzzyMatch(t, kw)) { score += 3; found.push(kw); } }
  for (const kw of REPORT_STRUCTURE) { if (fuzzyMatch(t, kw)) { score += 2; found.push(kw); } }
  for (const kw of MEDICAL_SOURCE) { if (fuzzyMatch(t, kw)) { score += 2; found.push(kw); } }
  for (const kw of PRESCRIPTION_KEYWORDS) { if (fuzzyMatch(t, kw)) { score += 2; found.push(kw); } }
  if (UNIT_PATTERN.test(t)) { score += 2; found.push('_medical_units'); }
  if (VALUE_PATTERN.test(t)) { score += 2; found.push('_lab_values'); }
  if (RANGE_PATTERN.test(t)) { score += 1; found.push('_reference_range'); }
  return { score, found: [...new Set(found)] };
};

const detectReportTypeFromFilename = (filename) => {
  const n = filename.toLowerCase().replace(/[_\-\.]/g, ' ');
  if (/\b(blood|cbc|hemoglobin|haemoglobin|wbc|rbc|platelet)\b/.test(n)) return 'Blood Test Report';
  if (/\b(sugar|glucose|diabetes|hba1c)\b/.test(n)) return 'Diabetes Report';
  if (/\b(cholesterol|lipid|ldl|hdl|triglyceride)\b/.test(n)) return 'Lipid Profile Report';
  if (/\b(thyroid|tsh)\b/.test(n)) return 'Thyroid Report';
  if (/\b(liver|lft|sgpt|sgot|bilirubin)\b/.test(n)) return 'Liver Function Report';
  if (/\b(kidney|urine|creatinine|urea|kft)\b/.test(n)) return 'Kidney/Urine Report';
  if (/\b(xray|x ray|chest|radiograph)\b/.test(n)) return 'X-Ray Report';
  if (/\b(mri|ct scan|ultrasound|sonography|echo)\b/.test(n)) return 'Imaging Report';
  if (/\b(prescription|rx|medicine|tablet)\b/.test(n)) return 'Prescription';
  if (/\b(discharge|summary)\b/.test(n)) return 'Discharge Summary';
  if (/\b(ecg|cardio|heart)\b/.test(n)) return 'Cardiology Report';
  if (/\b(report|result|lab|test|pathology|diagnostic)\b/.test(n)) return 'Lab Report';
  return 'Medical Document';
};

const loadTesseract = () => new Promise((resolve, reject) => {
  if (window.Tesseract) { resolve(window.Tesseract); return; }
  const existing = document.getElementById('tesseract-cdn');
  if (existing) { existing.addEventListener('load', () => resolve(window.Tesseract)); existing.addEventListener('error', reject); return; }
  const s = document.createElement('script');
  s.id = 'tesseract-cdn';
  s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
  s.onload = () => resolve(window.Tesseract);
  s.onerror = reject;
  document.head.appendChild(s);
});

const extractTextFromImage = async (file) => {
  const Tesseract = await loadTesseract();
  const dataUrl = await new Promise((res, rej) => { const r = new FileReader(); r.onload = e => res(e.target.result); r.onerror = rej; r.readAsDataURL(file); });
  const { data: { text } } = await Tesseract.recognize(dataUrl, 'eng', { logger: () => { } });
  return text || '';
};

const loadPdfJs = () => new Promise((resolve, reject) => {
  if (window.pdfjsLib) { resolve(window.pdfjsLib); return; }
  const existing = document.getElementById('pdfjs-cdn');
  if (existing) { existing.addEventListener('load', () => resolve(window.pdfjsLib)); existing.addEventListener('error', reject); return; }
  const s = document.createElement('script');
  s.id = 'pdfjs-cdn';
  s.src = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
  s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js'; resolve(window.pdfjsLib); };
  s.onerror = reject;
  document.head.appendChild(s);
});

const extractTextFromPdf = async (file) => {
  const pdfjsLib = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ').replace(/\s{2,}/g, '\n');
    fullText += pageText + '\n\n';
  }
  return fullText.trim();
};

const extractTextFromFile = async (file) => {
  try {
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) return await extractTextFromPdf(file);
    if (file.type.startsWith('image/')) return await extractTextFromImage(file);
    return '';
  } catch (err) { console.warn('Text extraction failed, continuing:', err.message); return ''; }
};

const extractEntities = (text) => {
  const t = text;
  const tl = t.toLowerCase();
  let patientName = null;
  const namePatterns = [/patient\s*(?:name)?\s*[:\-]\s*([A-Za-z][A-Za-z ]{2,40})/i, /name\s*[:\-]\s*([A-Za-z][A-Za-z ]{2,40})/i, /mr\.?\s+([A-Za-z][A-Za-z ]{2,30})/i, /mrs\.?\s+([A-Za-z][A-Za-z ]{2,30})/i, /ms\.?\s+([A-Za-z][A-Za-z ]{2,30})/i];
  for (const pat of namePatterns) { const m = t.match(pat); if (m?.[1]) { patientName = m[1].trim(); break; } }
  let patientAge = null;
  const ageMatch = t.match(/(?:age|aged?)\s*[:\-]?\s*(\d{1,3})\s*(?:yrs?|years?)?/i);
  if (ageMatch) patientAge = ageMatch[1];
  let patientGender = null;
  if (/\bgender\s*[:\-]\s*male\b|\bsex\s*[:\-]\s*male\b|\bm\s*\/\s*\d|\bmale\b/i.test(t)) patientGender = 'Male';
  else if (/\bgender\s*[:\-]\s*female\b|\bsex\s*[:\-]\s*female\b|\bf\s*\/\s*\d|\bfemale\b/i.test(t)) patientGender = 'Female';
  let reportDate = null;
  const datePatterns = [/(?:date|dated|report date|collection date|reported on)\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i, /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/, /(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4})/i];
  for (const pat of datePatterns) { const m = t.match(pat); if (m?.[1]) { reportDate = m[1].trim(); break; } }
  let doctorName = null;
  const drPatterns = [/(?:doctor|physician|consultant|referred by|dr\.?)\s*[:\-]?\s*(?:dr\.?\s+)?([A-Za-z][A-Za-z ]{2,40})/i, /(?:reported by|verified by|authorized by|tested by)\s*[:\-]?\s*(?:dr\.?\s+)?([A-Za-z][A-Za-z ]{2,40})/i, /Dr\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/];
  for (const pat of drPatterns) { const m = t.match(pat); if (m?.[1] && !m[1].match(/^(test|report|lab|result)/i)) { doctorName = m[1].trim(); break; } }
  let hospitalName = null;
  const hospMatch = t.match(/(?:^|\n)\s*([A-Z][A-Za-z\s]{3,50}(?:hospital|clinic|diagnostic|laboratory|lab|health|medical centre|medical center|pathology))/im);
  if (hospMatch) hospitalName = hospMatch[1].trim();
  const testResults = [];
  const testLinePattern = /([A-Za-z][A-Za-z\s\/\(\)]{2,40}?)\s+(\d+\.?\d*)\s*(mg\/dl|g\/dl|mg\/l|mmol\/l|u\/l|iu\/l|miu\/ml|ng\/ml|pg\/ml|nmol\/l|mmhg|cells\/mm3?|cells\/ul|\/ul|mm\/hr|g\/l|meq\/l|%|fl|pg|miu\/l|mu\/l|ug\/dl|ug\/ml|pmol\/l|µg\/dl|µmol\/l|mEq\/L|IU\/mL|mIU\/mL)?\s*(?:[\(\[]?\s*(\d+\.?\d*\s*[-–]\s*\d+\.?\d*(?:\s*(?:mg\/dl|g\/dl|mg\/l|mmol\/l|u\/l|%|fl|pg|miu\/l))?)\s*[\)\]]?)?\s*(H|L|HIGH|LOW|NORMAL|ABNORMAL|CRITICAL|\*)?/gi;
  let match;
  while ((match = testLinePattern.exec(t)) !== null) {
    const name = match[1]?.trim(); const value = match[2]; const unit = match[3] || ''; const range = match[4] || ''; const flag = match[5] || '';
    if (name && value && name.length > 2 && !name.match(/^\d/)) testResults.push({ name, value, unit, range, flag: flag.toUpperCase() });
  }
  const colonPattern = /([A-Za-z][A-Za-z\s\/\(\)]{2,35})\s*:\s*(\d+\.?\d*)\s*(mg\/dl|g\/dl|mg\/l|mmol\/l|u\/l|iu\/l|miu\/ml|ng\/ml|pg\/ml|%|fl|pg|miu\/l|iu\/l|mu\/l)?/gi;
  while ((match = colonPattern.exec(t)) !== null) {
    const name = match[1]?.trim(); const value = match[2]; const unit = match[3] || '';
    if (name && value && !name.match(/^\d/) && name.length > 2) {
      const alreadyFound = testResults.some(r => r.name.toLowerCase() === name.toLowerCase());
      if (!alreadyFound) testResults.push({ name, value, unit, range: '', flag: '' });
    }
  }
  const diagnoses = [];
  const diagSection = t.match(/(?:diagnosis|impression|conclusion|findings|assessment)\s*[:\-]?\s*([\s\S]{10,300}?)(?:\n\n|\n[A-Z]|$)/i);
  if (diagSection) { const raw = diagSection[1].replace(/\n/g, ' ').trim(); if (raw.length < 300) diagnoses.push(raw); }
  const DIAG_MAP = [
    { pattern: /\bdiabetes\b|\bdiabetic\b/i, label: 'diabetes' }, { pattern: /\bpre.diabet/i, label: 'pre-diabetes' },
    { pattern: /\bhypertension\b|\bhigh blood pressure\b/i, label: 'hypertension' }, { pattern: /\bhyperlipidemia\b|\bhigh cholesterol\b/i, label: 'hyperlipidemia' },
    { pattern: /\banaemia\b|\banemia\b/i, label: 'anaemia' }, { pattern: /\bhypothyroid/i, label: 'hypothyroidism' },
    { pattern: /\bhyperthyroid/i, label: 'hyperthyroidism' }, { pattern: /\bckd\b|\bchronic kidney\b/i, label: 'chronic kidney disease' },
    { pattern: /\bcovid\b|\bsars.cov/i, label: 'COVID-19' }, { pattern: /\bdengue\b/i, label: 'dengue' },
    { pattern: /\bmalaria\b/i, label: 'malaria' }, { pattern: /\btyphoid\b/i, label: 'typhoid' },
  ];
  for (const { pattern, label } of DIAG_MAP) { if (pattern.test(tl) && !diagnoses.includes(label)) diagnoses.push(label); }
  const medicines = [];
  const medPatterns = [/(?:tab(?:let)?|cap(?:sule)?|syrup|inj(?:ection)?|drops?)\s+([A-Za-z][A-Za-z\s]{2,30})\s*(\d+\s*mg|\d+\s*ml|\d+\s*mcg)?/gi, /([A-Z][a-z]+(?:cin|mab|zole|pril|artan|statin|mycin|olol|pam|pine|dine|ide|one|ine|ate))\s*(\d+\s*mg)?/g];
  for (const pat of medPatterns) { let m; while ((m = pat.exec(t)) !== null) { const med = (m[1] + (m[2] ? ' ' + m[2] : '')).trim(); if (med.length > 3 && !medicines.includes(med)) medicines.push(med); } }
  const summaryLines = [];
  if (patientName) summaryLines.push(`Patient: ${patientName}${patientAge ? ', Age: ' + patientAge : ''}${patientGender ? ', ' + patientGender : ''}`);
  if (reportDate) summaryLines.push(`Report Date: ${reportDate}`);
  if (doctorName) summaryLines.push(`Doctor: Dr. ${doctorName}`);
  if (hospitalName) summaryLines.push(`Lab/Hospital: ${hospitalName}`);
  if (testResults.length > 0) { summaryLines.push('\nTest Results:'); testResults.slice(0, 20).forEach(r => { let line = `  ${r.name}: ${r.value}${r.unit ? ' ' + r.unit : ''}`; if (r.range) line += ` (Normal: ${r.range})`; if (r.flag && r.flag !== 'NORMAL') line += ` ← ${r.flag}`; summaryLines.push(line); }); }
  if (diagnoses.length > 0) summaryLines.push(`\nDiagnosis/Impression: ${diagnoses.join(', ')}`);
  if (medicines.length > 0) summaryLines.push(`Medicines: ${medicines.join(', ')}`);
  return { patientName, patientAge, patientGender, reportDate, doctorName, hospitalName, testResults: testResults.slice(0, 30), diagnoses, medicines: medicines.slice(0, 15), summary: summaryLines.join('\n'), rawText: text };
};

const NON_PATIENT_PATTERNS = [/\b(abstract|introduction|methodology|conclusion|references|bibliography)\b/i, /\b(case report|case study|clinical case|case series)\b/i, /\b(journal|volume|issue|issn|doi|published|submitted|revised|online)\b/i, /\b(research|study|literature|review|manuscript|publication|author)\b/i, /\b(copyright|©|all rights reserved|reproduced|permission)\b/i, /\b(figure \d|table \d|appendix|supplementary)\b/i, /\b(et al|ibid|op cit|cf\.|viz\.)\b/i];
const KEYWORDS = ['patient', 'age', 'doctor', 'hospital', 'clinic', 'laboratory', 'lab', 'diagnostic', 'diagnosis', 'test', 'result', 'report', 'blood', 'hemoglobin', 'wbc', 'rbc', 'platelet', 'glucose', 'cholesterol', 'urea', 'creatinine', 'bilirubin', 'sgpt', 'sgot', 'thyroid', 'tsh', 'hba1c', 'urine', 'prescription', 'medicine', 'tablet', 'dose', 'mg', 'ml', 'temperature', 'pulse', 'bp', 'blood pressure', 'weight', 'height', 'findings', 'impression', 'specimen', 'sample', 'reference', 'normal range', 'date', 'name'];
const REQUIRED_FIELDS = ['patient', 'age', 'doctor', 'result'];
const LAB_VALUE_REGEX = /\d+\.?\d*\s*(mg\/dl|g\/dl|mg\/l|mmol\/l|u\/l|iu\/l|ng\/ml|pg\/ml|mmhg|bpm|cells\/mm|cells\/ul|mm\/hr|meq\/l|miu\/ml|nmol\/l|pmol\/l|µg\/dl|ug\/dl)/i;
const UNIT_REGEX = /\d+\.?\d*\s*(mg\/dl|g\/dl|mg\/l|mmol\/l|u\/l|iu\/l|ng\/ml|pg\/ml|mmhg|bpm|%|fl|pg|miu\/l|units?|cells)/i;

const scoreMedicalContent = (text) => {
  const t = text.toLowerCase();
  const kwHits = KEYWORDS.filter(kw => t.includes(kw));
  const keywordScore = Math.min(40, Math.round((kwHits.length / KEYWORDS.length) * 40 * 3));
  const fieldHits = REQUIRED_FIELDS.filter(f => t.includes(f));
  const fieldScore = fieldHits.length * 10;
  const unitScore = UNIT_REGEX.test(t) ? 20 : 0;
  return { total: keywordScore + fieldScore + unitScore, kwHits, fieldHits, hasUnits: unitScore > 0 };
};

const detectReportTypeFromText = (text) => {
  const t = text.toLowerCase();
  const hasLabValue = LAB_VALUE_REGEX.test(t);
  const hasRange = /\d+\.?\d*\s*[-–]\s*\d+\.?\d*/.test(t);
  const word = (w) => new RegExp('\\b' + w + '\\b').test(t);
  if ((hasLabValue || hasRange) && /hemoglobin|haemoglobin|wbc|rbc|platelet|cbc|haemogram|blood count/.test(t)) return 'Blood Test Report';
  if ((hasLabValue || hasRange) && /\bglucose\b|hba1c|fasting blood sugar|post prandial|ppbs/.test(t)) return 'Diabetes Report';
  if ((hasLabValue || hasRange) && /cholesterol|triglyceride|\bldl\b|\bhdl\b|\bvldl\b|lipid profile/.test(t)) return 'Lipid Profile Report';
  if ((hasLabValue || hasRange) && (/\btsh\b/.test(t) || /thyroid stimulating|thyroxine|triiodothyronine/.test(t) || (word('t3') || word('t4')))) return 'Thyroid Report';
  if ((hasLabValue || hasRange) && (/\bsgpt\b|\bsgot\b|\bbilirubin\b|liver function test|lft\b/.test(t) || ((/\balt\b/.test(t) || /\bast\b/.test(t)) && /\bsgpt\b|\bsgot\b|\bbilirubin\b|\bliver\b/.test(t)))) return 'Liver Function Report';
  if ((hasLabValue || hasRange) && /\bcreatinine\b|\burea\b|kidney function|renal function|\begfr\b/.test(t)) return 'Kidney/Urine Report';
  if ((hasLabValue || hasRange) && /\becg\b|electrocardiogram|cardiac/.test(t)) return 'Cardiology Report';
  if (/\bx.ray\b|radiograph|chest x-ray/.test(t)) return 'X-Ray Report';
  if (/\bmri\b|ct scan|ultrasound|sonography/.test(t)) return 'Imaging Report';
  if (/\bprescription\b|rx:|twice daily|once daily|after meals|before meals/.test(t)) return 'Prescription';
  if (/discharge summary|date of admission|date of discharge/.test(t)) return 'Discharge Summary';
  if (hasLabValue || hasRange) return 'Lab Report';
  return 'Medical Document';
};

const validateMedicalReport = async (file) => {
  const ext = file.name.split('.').pop().toLowerCase();
  const validExts = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];
  const validMimes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp', ''];
  if (!validExts.includes(ext) && !validMimes.includes(file.type)) return { valid: false, reason: 'Invalid file format. Please upload a PDF, JPG, or PNG file.' };
  if (file.size > 10 * 1024 * 1024) return { valid: false, reason: 'File too large. Maximum size is 10MB.' };
  const fname = file.name.toLowerCase();
  const CAMERA_FILENAME = /^(img_|dsc_|dscn_|dcim_|photo[-_]|whatsapp.?image|screenshot|selfie|pic_|pxl_|signal-|cam_|thumbnail|preview|largepreview|image\d*\.|untitled|capture|snap_|frame_|\d{8}[_\-]\d{6}|\d{4}[_\-]\d{2}[_\-]\d{2})/i;
  if (CAMERA_FILENAME.test(fname) && file.type.startsWith('image/')) return { valid: false, reason: 'This appears to be a personal photo, not a medical report. Please upload a clear image of your lab report, blood test, prescription, or scan.' };
  let ocrText = '';
  try { ocrText = await extractTextFromFile(file); } catch (e) { console.warn('OCR extraction error:', e.message); }
  const ocrHasContent = ocrText.trim().length > 20;
  if (ocrHasContent) { const nonPatientHits = NON_PATIENT_PATTERNS.filter(p => p.test(ocrText)); if (nonPatientHits.length >= 2) return { valid: false, reason: 'This appears to be a research article or case report, not a patient medical report.' }; }
  if (ocrHasContent && file.type.startsWith('image/')) {
    const lines = ocrText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const totalWords = ocrText.split(/\s+/).filter(w => w.length > 1).length;
    const { kwHits } = scoreMedicalContent(ocrText);
    const hasEnoughLines = lines.length >= 5;
    const medicalDensity = totalWords > 0 ? kwHits.length / totalWords : 0;
    const hasMedicalDensity = medicalDensity >= 0.08;
    const hasActualLabValue = LAB_VALUE_REGEX.test(ocrText);
    const hasReferenceRange = /\d+\.?\d*\s*[-–]\s*\d+\.?\d*/.test(ocrText);
    if (!hasEnoughLines) return { valid: false, reason: 'This image does not appear to contain a medical report.' };
    if (!hasMedicalDensity && !hasActualLabValue && !hasReferenceRange) return { valid: false, reason: 'This image does not appear to be a medical report — no medical values or lab data detected.' };
  }
  const { total } = scoreMedicalContent(ocrText);
  if (ocrHasContent && total < 30) return { valid: false, reason: 'This does not appear to be a valid patient medical report.', score: total };
  if (!ocrHasContent) { const fnText = file.name.toLowerCase().replace(/[_\-.]/g, ' '); const { total: fnTotal } = scoreMedicalContent(fnText); if (fnTotal < 5) return { valid: false, reason: 'Could not read any text from this file. Please upload a clear, well-lit photo or PDF.' }; }
  const reportType = ocrText.trim().length > 30 ? detectReportTypeFromText(ocrText) : detectReportTypeFromFilename(file.name);
  return { valid: true, reportType, ocrText, score: total };
};

const getReportIcon = (reportType) => {
  const map = { 'Blood Test Report': '🩸', 'Diabetes Report': '📊', 'Lipid Profile Report': '🧪', 'Thyroid Report': '🦋', 'Liver Function Report': '🫀', 'Kidney/Urine Report': '💧', 'X-Ray Report': '🦴', 'Imaging Report': '🔬', 'Prescription': '💊', 'Discharge Summary': '🏥', 'Lab Report': '🧬', 'Cardiology Report': '❤️', 'Medical Document': '📋', 'Medical Report (PDF)': '📄' };
  return map[reportType] || '📋';
};

// ─── AI Health Knowledge Base ─────────────────────────────────────────────────
const QUICK_QUESTIONS = [
  { icon: Thermometer, label: 'Fever & chills', query: 'I have fever and chills, what should I do?' },
  { icon: HeartPulse, label: 'Heart palpitations', query: 'I am experiencing heart palpitations. What could cause this?' },
  { icon: Brain, label: 'Headache & dizziness', query: 'I have a severe headache with dizziness. What could it be?' },
  { icon: Stethoscope, label: 'Breathing issues', query: 'I have difficulty breathing and chest tightness. What should I do?' },
  { icon: FlaskConical, label: 'Blood test results', query: 'How do I understand my blood test results?' },
  { icon: PillIcon, label: 'Medicine interaction', query: 'How can I check if two medicines interact with each other?' },
  { icon: Activity, label: 'High BP symptoms', query: 'What are the symptoms of high blood pressure?' },
  { icon: Pill, label: 'Paracetamol info', query: 'What is paracetamol used for and what is the correct dosage?' },
];

const HEALTH_KB = [
  { keys: ['fever', 'chills', 'temperature', 'hot', 'body temperature'], answer: `🌡️ **Fever & Chills**\n\nFever (body temp > 38°C / 100.4°F) is usually your body fighting an infection.\n\n**Common causes:**\n• Viral infections (cold, flu, COVID-19)\n• Bacterial infections\n• Urinary tract infections\n• Malaria or dengue (if you've been in a high-risk area)\n\n**What to do:**\n• Rest and drink plenty of fluids (water, ORS, coconut water)\n• Take paracetamol (500–1000mg every 6–8 hrs) to reduce fever\n• Use a cool, damp cloth on the forehead\n• Wear light clothing\n\n⚠️ **See a doctor immediately if:**\n• Fever > 39.5°C / 103°F\n• Fever lasts more than 3 days\n• You have a rash, stiff neck, or confusion\n• Child under 3 months has any fever` },
  { keys: ['headache', 'head pain', 'migraine', 'dizziness', 'dizzy'], answer: `🧠 **Headache & Dizziness**\n\n**Common types:**\n• Tension headache – dull pressure around the head\n• Migraine – throbbing pain, often one-sided\n• Sinus headache – pressure around nose/forehead\n\n**For relief:**\n• Rest in a dark, quiet room\n• Paracetamol or ibuprofen (with food)\n• Stay hydrated\n• Cold or warm compress on the forehead/neck\n\n⚠️ **Emergency signs:**\n• Sudden severe "worst headache of your life"\n• Headache with vision loss, weakness, slurred speech\n• Headache after a head injury` },
  { keys: ['palpitation', 'heart racing', 'fast heartbeat', 'irregular heartbeat', 'chest flutter'], answer: `❤️ **Heart Palpitations**\n\n**Common non-serious causes:**\n• Stress, anxiety, or panic attacks\n• Too much caffeine\n• Dehydration\n• Lack of sleep\n\n**What to do:**\n• Sit down, breathe slowly and deeply\n• Drink a glass of cold water\n• Avoid caffeine and stimulants\n\n⚠️ **See a doctor urgently if palpitations come with:**\n• Chest pain or pressure\n• Shortness of breath\n• Fainting or near-fainting` },
  { keys: ['breathing', 'breath', 'shortness', 'chest tightness', 'asthma', 'wheez'], answer: `🫁 **Breathing Difficulty & Chest Tightness**\n\n**Immediate steps:**\n• Sit upright — don't lie flat\n• Breathe slowly through your nose\n• Use your inhaler if you are asthmatic\n• Loosen tight clothing around the chest\n\n⚠️ **Call emergency services (112) immediately if:**\n• You cannot speak in full sentences\n• Lips or fingernails turn blue\n• Sudden severe chest pain` },
  { keys: ['blood test', 'cbc', 'hemoglobin', 'wbc', 'rbc', 'platelet', 'result', 'lab report', 'normal range'], answer: `🧪 **Understanding Blood Test Results**\n\n| Test | Normal Range |\n|------|-------------|\n| Hemoglobin | Men: 13–17 g/dL · Women: 12–15 g/dL |\n| WBC | 4,000–11,000 cells/µL |\n| Platelets | 1.5–4.0 lakh/µL |\n| Fasting Glucose | 70–100 mg/dL |\n| HbA1c | < 5.7% (normal) |\n| Total Cholesterol | < 200 mg/dL |\n| Creatinine | 0.6–1.2 mg/dL |\n| TSH | 0.4–4.0 mIU/L |\n\n💡 Always discuss results with your doctor.` },
  { keys: ['medicine interaction', 'drug interaction', 'two medicines', 'combine tablet', 'safe to take'], answer: `💊 **Medicine Interactions**\n\n**Common dangerous combinations:**\n• Aspirin + Warfarin → increased bleeding risk\n• Paracetamol + Alcohol → liver damage\n• Antacids + Iron tablets → reduces iron absorption\n\n**How to check safely:**\n1. Tell your doctor ALL medicines you take\n2. Use verified drug interaction checkers (Drugs.com)\n3. Read the package insert carefully` },
  { keys: ['blood pressure', 'hypertension', 'high bp', 'bp high', 'systolic', 'diastolic'], answer: `💉 **High Blood Pressure**\n\n**Normal BP:** < 120/80 mmHg\n**High (Stage 2):** ≥ 140 / ≥ 90 mmHg\n**Crisis:** > 180 / > 120 mmHg → Emergency!\n\n**Lifestyle management:**\n• Reduce salt intake (< 5g/day)\n• Exercise 30 min, 5 days/week\n• Quit smoking and limit alcohol\n• DASH diet (fruits, vegetables, low-fat dairy)\n\n💊 If prescribed BP medicines, **never stop them suddenly** without doctor's advice.` },
  { keys: ['paracetamol', 'crocin', 'acetaminophen', 'panadol', 'fever tablet', 'pain relief'], answer: `💊 **Paracetamol (Crocin / Tylenol)**\n\n**Standard Adult Dosage:**\n• 500mg–1000mg per dose\n• Every 6–8 hours as needed\n• Maximum: 4000mg (4g) per day\n\n⚠️ Do NOT exceed the daily maximum — overdose causes liver damage\n✅ Can be taken with or without food.` },
];

const getLocalBotResponse = (query) => {
  const q = query.toLowerCase();
  let bestMatch = null; let bestScore = 0;
  for (const entry of HEALTH_KB) { const score = entry.keys.filter(k => q.includes(k)).length; if (score > bestScore) { bestScore = score; bestMatch = entry; } }
  if (bestMatch && bestScore > 0) return bestMatch.answer;
  return `🤖 **Medi AI Health Assistant**\n\nI can help you with common health questions. Try asking about:\n\n• 🌡️ Fever & temperature\n• 🧠 Headaches & migraines\n• ❤️ Heart palpitations\n• 🫁 Breathing difficulties\n• 💉 Blood pressure\n• 📊 Diabetes & blood sugar\n• 🧪 Blood test interpretation\n• 💊 Common medicines\n• 🤧 Cold, cough & sore throat\n\n⚠️ For emergencies, call **112** or visit the nearest hospital.`;
};

// ─── Main Component ───────────────────────────────────────────────────────────
const PatientDashboard = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const profilePicRef = useRef(null);
  const messagesEndRef = useRef(null);
  const medicalRecordInputRef = useRef(null);
  const aiChatEndRef = useRef(null);

  const [page, setPage] = useState('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [shareMenu, setShareMenu] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [selNotif, setSelNotif] = useState(null);
  const [recFilter, setRecFilter] = useState({ date: '', type: '', doctor: '' });
  const [recNote, setRecNote] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [aiFile, setAiFile] = useState(null);
  const [aiRecs, setAiRecs] = useState([]);
  const [subInfo, setSubInfo] = useState(null);
  const [showPlans, setShowPlans] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [recordViewModal, setRecordViewModal] = useState(false);
  const [aiFilePreviewUrl, setAiFilePreviewUrl] = useState(null);
  const [uploadingReport, setUploadingReport] = useState(false);
  const [reportValidation, setReportValidation] = useState(null);
  const [extractedReportText, setExtractedReportText] = useState('');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backendPredictions, setBackendPredictions] = useState([]);
  // Password change state
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pd, setPd] = useState({ name: '', age: '', gender: '', email: '', phone: '', address: '', bloodGroup: '', allergies: '', chronicConditions: '', profilePic: null, height_cm: '', weight_kg: '', bmi: null });
  const [medRecs, setMedRecs] = useState([
    { id: 1, title: 'Blood Test Report', date: '2026-01-15', doctor: 'Dr. Michael Chen', type: 'Lab Report', note: 'Annual health checkup', extractedData: null },
    { id: 2, title: 'X-Ray Chest', date: '2026-01-20', doctor: 'Dr. Sarah Williams', type: 'Imaging', note: 'Respiratory examination', extractedData: null },
    { id: 3, title: 'Prescription Record', date: '2026-02-01', doctor: 'Dr. Robert Brown', type: 'Prescription', note: 'Fever treatment', extractedData: null },
  ]);
  const [prescriptions, setPrescriptions] = useState({ current: [], past: [] });
  const [assignedDoctor, setAssignedDoctor] = useState({ name: 'Your Doctor', initial: 'D', specialization: '' });
  const [notifs, setNotifs] = useState([]);
  const [botChat, setBotChat] = useState([{ id: 0, role: 'bot', text: "Hello! I'm your Medi AI Health Assistant 👋\n\nTry asking about fever, headache, blood pressure, blood test results, or medicines.", time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }]);
  const [botMsg, setBotMsg] = useState('');
  const [botLoading, setBotLoading] = useState(false);
  const botEndRef = useRef(null);
  const botInputRef = useRef(null);
  const [activity, setActivity] = useState([]);
  const [medRecFiles, setMedRecFiles] = useState({});
  const toastTimerRef = useRef(null);

  const showToast = (message, type = 'error') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 5000);
  };

  const menuItems = [
    { id: 'Dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'My Profile', icon: User, label: 'My Profile' },
    { id: 'Medical Records', icon: FileText, label: 'Medical Records' },
    { id: 'AI Treatment Recommendation', icon: Brain, label: 'AI Treatment' },
    { id: 'Prescriptions', icon: Pill, label: 'Prescriptions' },
    { id: 'Messages / Notifications', icon: MessageSquare, label: 'Messages' },
    { id: 'Subscription', icon: Activity, label: 'Subscription' },
  ];

  const handleReportUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return; e.target.value = '';
    setUploadingReport(true); setReportValidation(null); setExtractedReportText(''); setAiFile(null);
    if (aiFilePreviewUrl) URL.revokeObjectURL(aiFilePreviewUrl); setAiFilePreviewUrl(null);
    const previewUrl = URL.createObjectURL(file); setAiFilePreviewUrl(previewUrl);
    try {
      const result = await validateMedicalReport(file);
      if (!result.valid) { URL.revokeObjectURL(previewUrl); setAiFilePreviewUrl(null); showToast(result.reason || 'Invalid file.'); setReportValidation(null); return; }
      const entities = result.ocrText && result.ocrText.trim().length > 30 ? extractEntities(result.ocrText) : null;
      setExtractedReportText(result.ocrText || '');
      setReportValidation({ status: 'success', message: `${getReportIcon(result.reportType)} ${result.reportType} — verified`, reportType: result.reportType, fileInfo: { size: (file.size / 1024).toFixed(0), ext: file.name.split('.').pop().toUpperCase(), name: file.name }, entities: entities ? { patientName: entities.patientName || null, patientAge: entities.patientAge || null, patientGender: entities.patientGender || null, reportDate: entities.reportDate || null, doctorName: entities.doctorName || null, hospitalName: entities.hospitalName || null, testResults: entities.testResults || [], diagnoses: entities.diagnoses || [], medicines: entities.medicines || [], summary: entities.summary || '' } : null });
      setAiFile(file);
    } catch (err) { URL.revokeObjectURL(previewUrl); setAiFilePreviewUrl(null); showToast('Could not process this file. Please try again.'); setReportValidation(null); }
    finally { setUploadingReport(false); }
  };

  const generateAI = async () => {
    if (!symptoms.trim() && !aiFile) { alert('Please describe your symptoms or upload a medical report'); return; }
    setAiLoading(true);
    try {
      const entities = reportValidation?.entities;
      const SYMPTOM_MAP = { 'fever': 'fever', 'high fever': 'fever', 'temperature': 'fever', 'cough': 'cough', 'headache': 'headache', 'fatigue': 'fatigue', 'tired': 'fatigue', 'chest pain': 'chest pain', 'shortness of breath': 'shortness of breath', 'breathlessness': 'shortness of breath', 'nausea': 'nausea', 'vomiting': 'vomiting', 'diarrhea': 'diarrhoea', 'diarrhoea': 'diarrhoea', 'loose motion': 'diarrhoea', 'abdominal pain': 'abdominal pain', 'stomach pain': 'abdominal pain', 'back pain': 'back or flank pain', 'joint pain': 'joint pain', 'muscle pain': 'muscle pain', 'body ache': 'body aches', 'skin rash': 'skin rash', 'rash': 'skin rash', 'sore throat': 'sore throat', 'runny nose': 'runny nose', 'nasal congestion': 'nasal congestion', 'dizziness': 'dizziness', 'dizzy': 'dizziness', 'blurred vision': 'blurred vision', 'frequent urination': 'frequent urination', 'excessive thirst': 'increased thirst', 'weight loss': 'weight loss', 'loss of appetite': 'loss of appetite', 'swelling': 'severe oedema (swelling)', 'jaundice': 'jaundice', 'sweating': 'sweating', 'chills': 'chills', 'anxiety': 'anxiety', 'depression': 'depression', 'insomnia': 'sleep disturbance', 'heart palpitations': 'rapid heartbeat', 'palpitations': 'rapid heartbeat', 'hair loss': 'hair loss', 'numbness': 'tingling and numbness in thumb and fingers', 'blood in urine': 'blood in urine', 'pale skin': 'pallor', 'constipation': 'constipation or diarrhoea', 'itching': 'skin rash', 'cold': 'nasal congestion', 'wheezing': 'wheezing' };
      const inputText = symptoms.trim().toLowerCase();
      const detectedSymptoms = new Set();
      for (const [phrase, vocabTerm] of Object.entries(SYMPTOM_MAP)) { if (inputText.includes(phrase)) detectedSymptoms.add(vocabTerm); }
      const parts = inputText.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
      for (const part of parts) { if (SYMPTOM_MAP[part]) { detectedSymptoms.add(SYMPTOM_MAP[part]); } else { for (const [phrase, vocabTerm] of Object.entries(SYMPTOM_MAP)) { if (part.includes(phrase) || phrase.includes(part)) detectedSymptoms.add(vocabTerm); } if (part.length > 3) detectedSymptoms.add(part); } }
      if (entities?.diagnoses?.length > 0) { for (const diag of entities.diagnoses) { if (/diabet/i.test(diag)) { detectedSymptoms.add('frequent urination'); detectedSymptoms.add('increased thirst'); detectedSymptoms.add('fatigue'); } if (/hypertension/i.test(diag)) { detectedSymptoms.add('headache'); detectedSymptoms.add('dizziness'); } } }
      const finalSymptoms = [...detectedSymptoms].filter(Boolean);
      if (finalSymptoms.length === 0) finalSymptoms.push('fatigue');
      const bpMatch = inputText.match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
      const bpString = bpMatch ? `${bpMatch[1]}/${bpMatch[2]}` : '120/80';
      const tempMatch = inputText.match(/(\d{2,3}(?:\.\d)?)\s*(?:°c|°f|c\b|f\b|celsius|fahrenheit|degrees)/i);
      let temperature = 98.6;
      if (tempMatch) { const t = parseFloat(tempMatch[1]); temperature = t > 50 ? t : t * 9 / 5 + 32; }
      else if (/fever|high temperature/i.test(inputText)) temperature = 101.0;
      const result = await runPrediction({ age: pd.age || 30, temperature, blood_pressure: bpString, has_diabetes: entities?.diagnoses?.some(d => /diabet/i.test(d)) || /diabet/i.test(inputText) || false, has_hypertension: entities?.diagnoses?.some(d => /hypertension/i.test(d)) || /hypert|high bp|high blood pressure/i.test(inputText) || false, symptoms: finalSymptoms });
      const now = new Date();
      const disease = result.predicted_disease || 'Unknown condition';
      const severity = result.severity_level || 'Moderate';
      const risk = result.risk_level || 'Medium';
      const confidence = result.confidence_score || 0;
      const treatment = result.recommended_treatment || '';
      const medicationsRich = result.medicines || [];
      const medications = medicationsRich.map(m => `${m.medicine} — ${m.dosage}`);
      if (entities?.medicines?.length > 0) { entities.medicines.forEach(med => { if (!medications.some(m => m.toLowerCase().includes(med.toLowerCase()))) medications.push(med); }); }
      // ── Build lifestyle advice from diagnoses + severity ──
      const lifestyle = [];
      if (entities?.diagnoses?.length > 0) {
        entities.diagnoses.forEach(d => {
          if (/diabet/i.test(d)) { lifestyle.push('Follow a low-sugar, low-glycemic diet as advised for diabetes management'); lifestyle.push('Monitor blood glucose levels regularly'); }
          if (/hypertension/i.test(d)) { lifestyle.push('Reduce salt intake (< 5g/day) and follow a heart-healthy diet'); lifestyle.push('Monitor blood pressure regularly'); }
          if (/lipid|cholesterol/i.test(d)) lifestyle.push('Reduce saturated fat intake based on your lipid profile findings');
          if (/thyroid/i.test(d)) lifestyle.push('Take thyroid medication at the same time each day as prescribed');
          if (/anaemi|anemi/i.test(d)) lifestyle.push('Include iron-rich foods in diet based on blood report findings');
        });
      }
      if (severity === 'Severe' || severity === 'Critical') lifestyle.push('Seek immediate medical attention — this condition requires urgent care');
      if (temperature > 100) lifestyle.push('Stay hydrated — drink at least 2–3 litres of water daily, use ORS if needed');
      if (/fever|infection/i.test(disease)) lifestyle.push('Rest well and avoid strenuous activity until symptoms resolve');

      const warnings = [];
      if (severity === 'High' || risk === 'High' || severity === 'Severe' || severity === 'Critical') {
        warnings.push(`Severity is ${severity} — please consult a doctor promptly`);
      }
      warnings.push(`AI confidence: ${confidence.toFixed(0)}% — always confirm with a licensed physician`);
      if (entities?.testResults?.length > 0) {
        const abnormal = entities.testResults.filter(r => ['H', 'L', 'HIGH', 'LOW', 'ABNORMAL', 'CRITICAL'].includes(r.flag?.toUpperCase()));
        if (abnormal.length > 0) {
          warnings.push(`Abnormal values in your report: ${abnormal.map(r => `${r.name} (${r.value}${r.unit ? ' ' + r.unit : ''}) — ${r.flag}`).join(', ')}`);
        }
      }
      if (result.top_diseases?.length > 1) {
        const alternatives = result.top_diseases.slice(1, 3).map(d => `${d.disease} (${d.probability.toFixed(0)}%)`).join(', ');
        warnings.push(`Other possible conditions considered: ${alternatives}`);
      }

      const recommendation = {
        id: result.recommendation_id || Date.now(),
        symptoms: symptoms.trim() || (aiFile ? `Medical report uploaded: ${aiFile.name}` : 'General health inquiry'),
        date: now.toISOString().split('T')[0],
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        treatment: `Based on ${aiFile ? 'your uploaded medical report and ' : ''}reported symptoms, the AI identified: **${disease}** — Severity: ${severity}, Risk: ${risk}.\n\n${treatment}`,
        disease, confidence, severity, risk,
        medications,
        medicationsRich,
        lifestyle, warnings,
        matchedSymptoms: result.matched_symptoms || finalSymptoms,
        topDiseases: result.top_diseases || [],
        reportData: (entities && (entities.testResults?.length > 0 || entities.diagnoses?.length > 0 || entities.patientName)) ? entities : null,
        uploadedFile: aiFile ? { name: aiFile.name, type: aiFile.type, reportType: reportValidation?.reportType } : null,
      };
      setAiRecs(prev => [recommendation, ...prev]);
      const predsRes = await getPredictions(); setBackendPredictions(predsRes.predictions || []);
      setSymptoms(''); setAiFile(null); setExtractedReportText(''); setReportValidation(null);
      if (aiFilePreviewUrl) { URL.revokeObjectURL(aiFilePreviewUrl); setAiFilePreviewUrl(null); }
    } catch (err) { alert('AI prediction failed: ' + (err.response?.data?.detail || err.message)); }
    finally { setAiLoading(false); }
  };

  const handleProfilePic = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader(); r.onloadend = () => setPd(p => ({ ...p, profilePic: r.result })); r.readAsDataURL(f);
    try { const formData = new FormData(); formData.append('file', f); await updateProfilePicture(formData); } catch (err) { console.error('Profile picture upload failed:', err.message); }
  };

  const handlePasswordChange = async () => {
    if (!pwForm.current) { showToast('Enter your current password', 'error'); return; }
    if (!pwForm.newPw) { showToast('Enter a new password', 'error'); return; }
    if (pwForm.newPw.length < 8) { showToast('New password must be at least 8 characters', 'error'); return; }
    if (pwForm.newPw !== pwForm.confirm) { showToast('New passwords do not match', 'error'); return; }
    setPwSaving(true);
    try {
      await api.post('/patient/change-password', { current_password: pwForm.current, new_password: pwForm.newPw });
      showToast('✅ Password changed successfully!', 'success');
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (err) {
      showToast(err.response?.data?.detail || err.message || 'Password change failed', 'error');
    } finally { setPwSaving(false); }
  };

  const handleMedicalRecordUpload = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const formData = new FormData(); formData.append('file', f); if (recNote) formData.append('note', recNote);
      const res = await uploadMedicalRecord(formData); const newRecord = res.record;
      setMedRecs(prev => [newRecord, ...prev]);
      const fileUrl = URL.createObjectURL(f); setMedRecFiles(prev => ({ ...prev, [newRecord.id]: { url: fileUrl, name: f.name, type: f.type } }));
      setRecNote(''); alert('Medical record uploaded successfully!');
    } catch (err) { alert('Upload failed: ' + err.message); }
  };

  const downloadPDF = (rec) => {
    const testResultsSection = rec.reportData?.testResults?.length > 0
      ? `\n───────────────────────────────────────────────────
EXTRACTED TEST RESULTS FROM REPORT
───────────────────────────────────────────────────
${rec.reportData.testResults.map(r => `${r.name}: ${r.value}${r.unit ? ' ' + r.unit : ''}${r.range ? ' (Normal: ' + r.range + ')' : ''}${r.flag && r.flag !== 'NORMAL' ? ' [' + r.flag + ']' : ''}`).join('\n')}
${rec.reportData.diagnoses?.length > 0 ? `\nDetected Conditions: ${rec.reportData.diagnoses.join(', ')}` : ''}`
      : '';
    const fileContent = `═══════════════════════════════════════════════════
MEDI AI - AI TREATMENT RECOMMENDATION
═══════════════════════════════════════════════════
Patient: ${pd.name}
Date: ${rec.date} at ${rec.time}
───────────────────────────────────────────────────
SYMPTOMS / REASON
───────────────────────────────────────────────────
${rec.symptoms}
${rec.uploadedFile ? `───────────────────────────────────────────────────
UPLOADED MEDICAL REPORT: ${rec.uploadedFile.name}
Type: ${rec.uploadedFile.reportType || 'Medical Report'}${testResultsSection}
` : ''}───────────────────────────────────────────────────
AI DIAGNOSIS
───────────────────────────────────────────────────
Disease: ${rec.disease}
Severity: ${rec.severity}
Risk Level: ${rec.risk}
Confidence: ${typeof rec.confidence === 'number' ? rec.confidence.toFixed(0) : rec.confidence}%
${rec.medications?.length > 0 ? `───────────────────────────────────────────────────
TREATMENT / MEDICATIONS
───────────────────────────────────────────────────
${rec.medications.map((m, i) => `${i + 1}. ${m}`).join('\n')}
` : ''}
${rec.lifestyle?.length > 0 ? `───────────────────────────────────────────────────
LIFESTYLE ADVICE
───────────────────────────────────────────────────
${rec.lifestyle.map((l, i) => `${i + 1}. ${l}`).join('\n')}
` : ''}
${rec.warnings?.length > 0 ? `───────────────────────────────────────────────────
WARNINGS
───────────────────────────────────────────────────
${rec.warnings.map((r, i) => `${i + 1}. ${r}`).join('\n')}
` : ''}
═══════════════════════════════════════════════════
DISCLAIMER: AI-generated. Consult a qualified healthcare professional.
Generated by Medi AI © ${new Date().getFullYear()}
═══════════════════════════════════════════════════`;
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AI_Treatment_${pd.name.replace(' ', '_')}_${rec.date}.txt`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const sendBotMessage = async (overrideText) => {
    const userText = (overrideText || botMsg).trim(); if (!userText || botLoading) return;
    const ts = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setBotChat(p => [...p, { id: Date.now(), role: 'user', text: userText, time: ts, userName: pd.name || 'You' }]);
    setBotMsg(''); setBotLoading(true);
    await new Promise(r => setTimeout(r, 600 + Math.random() * 600));
    const reply = getLocalBotResponse(userText);
    setBotChat(p => [...p, { id: Date.now() + 1, role: 'bot', text: reply, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }]);
    setBotLoading(false);
  };

  const handleUpgradePlan = async (planKey) => {
    setUpgrading(true);
    try {
      const planName = planKey.charAt(0).toUpperCase() + planKey.slice(1);
      const res = await apiUpgradePlan(planName); setSubInfo(res.subscription); setShowPlans(false);
      alert(`Upgraded to ${planName} plan!`);
    } catch (err) { alert('Upgrade failed: ' + err.message); }
    finally { setUpgrading(false); }
  };

  const logout = () => { ['userRole', 'token', 'userEmail'].forEach(k => localStorage.removeItem(k)); setLogoutModal(false); navigate('/login'); };

  const filteredRecs = medRecs.filter(r => (!recFilter.date || r.date.includes(recFilter.date)) && (!recFilter.type || r.type === recFilter.type) && (!recFilter.doctor || r.doctor.toLowerCase().includes(recFilter.doctor.toLowerCase())));

  useEffect(() => {
    const token = localStorage.getItem('token'); if (!token) { navigate('/login'); return; }
    const loadAll = async () => {
      setLoading(true);
      try {
        const dash = await getPatientDashboard(); const pt = dash.patient || {};
        setPd({ name: pt.name || '', age: pt.age || '', gender: pt.gender || '', email: pt.email || '', phone: pt.phone || '', address: pt.address || '', bloodGroup: pt.blood_group || '', allergies: '', chronicConditions: '', profilePic: pt.profile_image ? `http://localhost:8000/${pt.profile_image}` : null, height_cm: pt.height_cm || '', weight_kg: pt.weight_kg || '', bmi: pt.bmi || null });
        setSubInfo(dash.subscription || null);
        const iconMap = { prescription: Pill, record: FileText, ai: Brain };
        setActivity((dash.activity || []).map((a, i) => ({ id: i + 1, action: a.action, desc: a.desc, time: a.time ? new Date(a.time).toLocaleString() : '', icon: iconMap[a.type] || CheckCircle })));
        const notifRes = await getNotifications(); setNotifs((notifRes.notifications || []).map(n => ({ id: n.id, title: n.title, message: n.message, time: n.time, read: n.is_read })));
        const recRes = await getMedicalRecords(); if (recRes.records?.length > 0) setMedRecs(recRes.records);
        const rxRes = await getPrescriptions(); setPrescriptions({ current: rxRes.current || [], past: rxRes.past || [] });
        const allRx = [...(rxRes.current || []), ...(rxRes.past || [])]; const doctorRx = allRx.find(rx => rx.doctor && rx.doctor.trim());
        if (doctorRx) { const rawName = doctorRx.doctor.replace(/^Dr\.?\s*/i, '').trim(); setAssignedDoctor({ name: doctorRx.doctor.startsWith('Dr') ? doctorRx.doctor : `Dr. ${rawName}`, initial: rawName[0]?.toUpperCase() || 'D', specialization: doctorRx.specialization || 'General Physician' }); }
        const predRes = await getPredictions(); setBackendPredictions(predRes.predictions || []);
      } catch (err) { console.error('Dashboard load failed:', err.message); if (err.message.includes('401') || err.message.includes('Unauthorized')) navigate('/login'); }
      finally { setLoading(false); }
    };
    loadAll();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token'); if (!token) return;
    if (page === 'Medical Records') getMedicalRecords(recFilter).then(r => { if (r.records?.length > 0) setMedRecs(r.records); }).catch(console.error);
    if (page === 'Prescriptions') getPrescriptions().then(r => { setPrescriptions({ current: r.current || [], past: r.past || [] }); const allRx = [...(r.current || []), ...(r.past || [])]; const doctorRx = allRx.find(rx => rx.doctor && rx.doctor.trim()); if (doctorRx) { const rawName = doctorRx.doctor.replace(/^Dr\.?\s*/i, '').trim(); setAssignedDoctor({ name: doctorRx.doctor.startsWith('Dr') ? doctorRx.doctor : `Dr. ${rawName}`, initial: rawName[0]?.toUpperCase() || 'D', specialization: doctorRx.specialization || 'General Physician' }); } }).catch(console.error);
    if (page === 'Messages / Notifications') { getNotifications().then(r => setNotifs((r.notifications || []).map(n => ({ id: n.id, title: n.title, message: n.message, time: n.time, read: n.is_read })))).catch(console.error); markNotificationsRead().catch(console.error); }
    if (page === 'Subscription') getSubscription().then(s => setSubInfo(s)).catch(console.error);
  }, [page]);

  useEffect(() => { botEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [botChat, botLoading]);
  useEffect(() => { aiChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [aiRecs, aiLoading]);

  // ── Page renderers (Dashboard, Profile, MedicalRecords, AiTreatment, Prescriptions, Messages) ──
  // These are unchanged from original — kept intact below

  const renderDashboard = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ color: T.text, fontWeight: 800, fontSize: 26, margin: '0 0 4px' }}>Welcome back, {pd.name}!</h1>
        <p style={{ color: T.muted, fontSize: 13, margin: 0 }}>Here's your health overview for today</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
        {[
          { label: 'Health Status', value: pd.bmi ? `BMI ${pd.bmi}` : 'Good', sub: pd.bloodGroup ? `Blood Group: ${pd.bloodGroup}` : 'Profile set up', icon: Heart, color: T.green, p: 'My Profile' },
          { label: 'Active Prescriptions', value: prescriptions.current.length, sub: prescriptions.current.length > 0 ? 'Review below' : 'None active', icon: Pill, color: T.cyan, p: 'Prescriptions' },
          { label: 'AI Recommendations', value: aiRecs.length, sub: aiRecs.length > 0 ? 'View latest below' : 'Get AI advice', icon: Brain, color: T.purple, p: 'AI Treatment Recommendation' },
        ].map((s, i) => (
          <Card key={i} onClick={() => setPage(s.p)} style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: s.color, opacity: 0.06 }} />
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <s.icon size={18} color={s.color} />
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: T.text, letterSpacing: -1 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: T.cyan, marginTop: 4 }}>{s.sub}</div>
          </Card>
        ))}
      </div>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Activity size={16} color={T.cyan} />
          <span style={{ color: T.text, fontWeight: 700, fontSize: 15 }}>Recent Activity</span>
        </div>
        {activity.length === 0
          ? <div style={{ color: T.muted, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No recent activity</div>
          : activity.map(a => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px', background: T.cyanDim, borderRadius: 10, marginBottom: 8 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: `${T.cyan}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <a.icon size={15} color={T.cyan} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: T.text, fontWeight: 600, fontSize: 13 }}>{a.action}</div>
                <div style={{ color: T.muted, fontSize: 12 }}>{a.desc}</div>
              </div>
              <span style={{ color: T.muted, fontSize: 11, whiteSpace: 'nowrap' }}>{a.time}</span>
            </div>
          ))}
      </Card>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Btn onClick={() => setPage('Prescriptions')} icon={Pill} style={{ justifyContent: 'center', width: '100%' }}>View Prescriptions</Btn>
        <Btn onClick={() => setPage('AI Treatment Recommendation')} variant="secondary" icon={Brain} style={{ justifyContent: 'center', width: '100%' }}>Get AI Advice</Btn>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ color: T.text, fontWeight: 800, fontSize: 26, margin: 0 }}>My Profile</h1>
        {!editingProfile
          ? <Btn onClick={() => setEditingProfile(true)} icon={Edit}>Edit Profile</Btn>
          : <div style={{ display: 'flex', gap: 8 }}>
            <Btn onClick={async () => { try { await updatePatientProfile({ name: pd.name, age: pd.age, gender: pd.gender, phone: pd.phone, address: pd.address, blood_group: pd.bloodGroup, height_cm: pd.height_cm || undefined, weight_kg: pd.weight_kg || undefined }); setEditingProfile(false); showToast('Profile updated!', 'success'); } catch (err) { showToast('Update failed: ' + err.message, 'error'); } }} icon={Save}>Save Changes</Btn>
            <Btn onClick={() => setEditingProfile(false)} variant="secondary">Cancel</Btn>
          </div>}
      </div>
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <div style={{ position: 'relative' }}>
            {pd.profilePic ? <img src={pd.profilePic} alt="" style={{ width: 110, height: 110, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${T.cyan}` }} /> : <div style={{ width: 110, height: 110, borderRadius: '50%', background: `linear-gradient(135deg,${T.cyan},#005588)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={48} color="#fff" /></div>}
            <button onClick={() => profilePicRef.current?.click()} style={{ position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: '50%', background: T.cyan, border: `2px solid ${T.card}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Camera size={14} color="#fff" /></button>
            <input ref={profilePicRef} type="file" accept="image/*" onChange={handleProfilePic} style={{ display: 'none' }} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: T.text, marginTop: 12 }}>{pd.name}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16 }}>
          {[{ label: 'Full Name', key: 'name', type: 'text' }, { label: 'Age', key: 'age', type: 'number' }, { label: 'Email', key: 'email', type: 'email' }, { label: 'Phone', key: 'phone', type: 'tel' }, { label: 'Blood Group', key: 'bloodGroup', type: 'text' }, { label: 'Address', key: 'address', type: 'text' }, { label: 'Allergies', key: 'allergies', type: 'text' }, { label: 'Chronic Conditions', key: 'chronicConditions', type: 'text' }].map(f => (
            <div key={f.key}>
              <label style={fieldLabel}>{f.label}</label>
              <input type={f.type} value={pd[f.key]} disabled={!editingProfile} onChange={e => setPd(p => ({ ...p, [f.key]: f.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value }))} style={{ ...fieldInput, opacity: editingProfile ? 1 : 0.55 }} />
            </div>
          ))}
        </div>
      </Card>

      {/* ── Change Password ── */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${T.cyan}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={18} color={T.cyan} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: T.text, fontSize: 15 }}>Change Password</div>
            <div style={{ fontSize: 12, color: T.muted }}>Update your account password</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: `${T.cyan}0d`, border: `1px solid ${T.cyan}25`, borderRadius: 8, marginBottom: 18 }}>
          <Lock size={13} color={T.cyan} />
          <span style={{ fontSize: 12, color: T.sub }}>Password must be at least 8 characters long</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16, maxWidth: 600 }}>
          {[
            { label: 'Current Password', field: 'current', placeholder: 'Enter your current password' },
            { label: 'New Password', field: 'newPw', placeholder: 'Enter new password (min 8 chars)' },
            { label: 'Confirm New Password', field: 'confirm', placeholder: 'Re-enter your new password' },
          ].map(({ label, field, placeholder }) => (
            <div key={field}>
              <label style={fieldLabel}>{label}</label>
              <input
                type="password"
                placeholder={placeholder}
                value={pwForm[field]}
                onChange={e => setPwForm(f => ({ ...f, [field]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handlePasswordChange()}
                style={{
                  ...fieldInput,
                  borderColor: field === 'confirm' && pwForm.confirm && pwForm.newPw !== pwForm.confirm
                    ? T.red
                    : 'rgba(0,153,204,0.2)',
                }}
                onFocus={e => e.target.style.borderColor = T.cyan}
                onBlur={e => e.target.style.borderColor = (field === 'confirm' && pwForm.confirm && pwForm.newPw !== pwForm.confirm) ? T.red : 'rgba(0,153,204,0.2)'}
              />
              {field === 'confirm' && pwForm.confirm && pwForm.newPw !== pwForm.confirm && (
                <div style={{ fontSize: 11, color: T.red, marginTop: 4 }}>Passwords do not match</div>
              )}
              {field === 'confirm' && pwForm.confirm && pwForm.newPw === pwForm.confirm && pwForm.confirm.length > 0 && (
                <div style={{ fontSize: 11, color: T.green, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle size={11} /> Passwords match
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          <button
            onClick={handlePasswordChange}
            disabled={pwSaving}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 24px', borderRadius: 10,
              background: pwSaving ? T.muted : `linear-gradient(135deg, ${T.green}, #059669)`,
              color: '#fff', border: 'none', fontWeight: 700, fontSize: 14,
              cursor: pwSaving ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', transition: 'all 0.2s',
            }}
          >
            {pwSaving
              ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Updating…</>
              : <><CheckCircle size={14} /> Update Password</>
            }
          </button>
        </div>
      </Card>
    </div>
  );

  const renderMedicalRecords = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 80 }}>
      <h1 style={{ color: T.text, fontWeight: 800, fontSize: 26, margin: 0 }}>Medical Records</h1>
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
          <div><label style={fieldLabel}>Date</label><input type="date" value={recFilter.date} onChange={e => setRecFilter(p => ({ ...p, date: e.target.value }))} style={fieldInput} /></div>
          <div><label style={fieldLabel}>Record Type</label><select value={recFilter.type} onChange={e => setRecFilter(p => ({ ...p, type: e.target.value }))} style={fieldInput}><option value="">All Types</option><option>Lab Report</option><option>Imaging</option><option>Prescription</option><option>Document</option></select></div>
          <div><label style={fieldLabel}>Doctor</label><input type="text" value={recFilter.doctor} placeholder="Search doctor…" onChange={e => setRecFilter(p => ({ ...p, doctor: e.target.value }))} style={fieldInput} /></div>
        </div>
      </Card>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: 16 }}>
        {filteredRecs.map(rec => (
          <Card key={rec.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 9, background: T.cyanDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={17} color={T.cyan} /></div>
              <Badge color="blue">{rec.type}</Badge>
            </div>
            <div style={{ fontWeight: 700, color: T.text, fontSize: 14, marginBottom: 8 }}>{rec.title}</div>
            <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.9 }}><div>📅 {rec.date}</div><div>👨‍⚕️ {rec.doctor}</div><div>📝 {rec.note}</div>{rec.extractedData && <div style={{ color: T.green }}>✓ Analyzed by AI</div>}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <Btn variant="ghost" icon={Eye} style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setViewingRecord(rec); setRecordViewModal(true); }}>View</Btn>
              <Btn variant="ghost" icon={Download} style={{ flex: 1, justifyContent: 'center' }} onClick={() => { const stored = medRecFiles[rec.id]; if (stored) { const a = document.createElement('a'); a.href = stored.url; a.download = stored.name; document.body.appendChild(a); a.click(); document.body.removeChild(a); } else if (rec.file_path) { const a = document.createElement('a'); a.href = `http://localhost:8000/${rec.file_path}`; a.download = rec.title; a.target = '_blank'; document.body.appendChild(a); a.click(); document.body.removeChild(a); } else { alert('File not available. Please re-upload the record.'); } }}>Download</Btn>
            </div>
          </Card>
        ))}
      </div>
      <div style={{ position: 'fixed', bottom: 0, left: sidebarOpen ? 240 : 0, right: 0, background: `${T.surface}f2`, backdropFilter: 'blur(12px)', borderTop: `1px solid ${T.border}`, padding: '10px 20px', zIndex: 20, transition: 'left 0.25s' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => medicalRecordInputRef.current?.click()} style={{ width: 40, height: 40, borderRadius: '50%', background: T.cyan, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Plus size={18} color="#fff" /></button>
          <input type="text" value={recNote} onChange={e => setRecNote(e.target.value)} placeholder="Add a note for this record…" style={{ ...fieldInput, flex: 1 }} />
          <button onClick={() => medicalRecordInputRef.current?.click()} style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg,${T.cyan},#005599)`, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Send size={16} color="#fff" /></button>
          <input ref={medicalRecordInputRef} type="file" accept="image/*,.pdf" onChange={handleMedicalRecordUpload} style={{ display: 'none' }} />
        </div>
      </div>
      <Modal isOpen={recordViewModal} onClose={() => setRecordViewModal(false)} title={`📋 ${viewingRecord?.title || 'Medical Record'}`}>
        {viewingRecord && (() => {
          const stored = medRecFiles[viewingRecord.id];
          const serverUrl = viewingRecord.file_path ? `http://localhost:8000/${viewingRecord.file_path}` : null;
          const fileUrl = stored?.url || serverUrl;
          const fileName = stored?.name || viewingRecord.title || '';
          const fileType = stored?.type || (fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
          const isPdf = fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
          const isImage = fileType.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(fileName);
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: T.bg, borderRadius: 10, border: `1px solid ${T.border}` }}>
                <div><div style={{ color: T.text, fontWeight: 600, fontSize: 13 }}>{fileName}</div><div style={{ color: T.muted, fontSize: 11 }}>{viewingRecord.date} · {viewingRecord.doctor}</div></div>
                {fileUrl && (<a href={fileUrl} download={fileName} target="_blank" rel="noreferrer" style={{ padding: '6px 14px', borderRadius: 8, background: T.cyanDim, border: `1px solid ${T.border}`, color: T.cyan, fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}><Download size={13} /> Download</a>)}
              </div>
              {fileUrl ? (isPdf ? <iframe src={fileUrl} title={fileName} style={{ width: '100%', height: 520, border: 'none', borderRadius: 10 }} /> : isImage ? <div style={{ textAlign: 'center', background: T.bg, borderRadius: 10, padding: 8 }}><img src={fileUrl} alt={fileName} style={{ maxWidth: '100%', maxHeight: 520, borderRadius: 8 }} /></div> : <div style={{ textAlign: 'center', padding: 40, color: T.muted }}><FileText size={40} color={T.muted} /><div>Cannot preview this file type.</div><a href={fileUrl} download={fileName} style={{ color: T.cyan }}>Click to download</a></div>) : <div style={{ textAlign: 'center', padding: 40, color: T.muted }}><FileText size={40} color={T.muted} /><div style={{ marginTop: 12 }}>File not available for preview.</div></div>}
              <Btn onClick={() => setRecordViewModal(false)} variant="primary" style={{ width: '100%', justifyContent: 'center' }}>Close</Btn>
            </div>
          );
        })()}
      </Modal>
    </div>
  );

  const renderAiTreatment = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 58px - 44px)', maxHeight: 'calc(100vh - 58px - 44px)' }}>
      <div style={{ padding: '0 0 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ color: T.text, fontWeight: 800, fontSize: 26, margin: '0 0 4px' }}>AI Treatment Assistant</h1>
          <p style={{ color: T.muted, fontSize: 13, margin: 0 }}>Describe your symptoms or attach a medical report for AI-powered analysis</p>
        </div>
        {subInfo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', background: subInfo.can_predict ? `${T.green}12` : `${T.amber}12`, border: `1px solid ${subInfo.can_predict ? T.green : T.amber}40`, borderRadius: 12, cursor: 'pointer' }}
            onClick={() => setPage('Subscription')}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: subInfo.can_predict ? T.green : T.amber, flexShrink: 0 }} />
            <div>
              <div style={{ color: subInfo.can_predict ? T.green : T.amber, fontWeight: 700, fontSize: 12 }}>{subInfo.label}</div>
              <div style={{ color: T.muted, fontSize: 11 }}>
                {subInfo.can_predict ? (subInfo.predictions_left === 'Unlimited' ? 'Unlimited predictions' : `${subInfo.predictions_left} predictions left`) : 'Tap to upgrade'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Scrollable chat area ── */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 16, marginBottom: 140 }}>
        {aiRecs.length === 0 && !aiLoading && (
          <Card>
            <div style={{ textAlign: 'center', padding: '48px 20px' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: `linear-gradient(135deg,${T.cyan}15,${T.cyan}05)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Brain size={40} color={T.cyan} />
              </div>
              <div style={{ color: T.text, fontWeight: 800, fontSize: 20, marginBottom: 8 }}>AI Medical Assistant Ready</div>
              <div style={{ color: T.muted, fontSize: 14, lineHeight: 1.7, maxWidth: 400, margin: '0 auto' }}>
                Describe your symptoms below or upload a medical report to get started.
              </div>
            </div>
          </Card>
        )}

        {[...aiRecs].reverse().map((rec) => (
          <div key={rec.id} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* User bubble */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ maxWidth: '75%', padding: '14px 18px', background: `linear-gradient(135deg,${T.cyan}18,${T.cyan}08)`, border: `1px solid ${T.cyan}30`, borderRadius: '20px 20px 4px 20px' }}>
                <div style={{ color: T.text, fontSize: 14, lineHeight: 1.7, marginBottom: 8, whiteSpace: 'pre-wrap' }}>{rec.symptoms}</div>
                {rec.uploadedFile && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: `${T.green}15`, borderRadius: 10, marginTop: 10 }}>
                    <CheckCircle size={14} color={T.green} />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: T.green, fontSize: 12, fontWeight: 700 }}>{rec.uploadedFile.name}</div>
                      <div style={{ color: T.muted, fontSize: 10 }}>{rec.uploadedFile.reportType || 'Medical Report'}</div>
                    </div>
                  </div>
                )}
                <div style={{ color: T.muted, fontSize: 11, marginTop: 8, textAlign: 'right' }}>{rec.time}</div>
              </div>
            </div>

            {/* AI response bubble */}
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Card style={{ maxWidth: '85%', padding: 20 }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg,${T.cyan},#0066aa)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Brain size={20} color="#fff" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: T.cyan, marginBottom: 4, fontSize: 15 }}>AI Medical Assistant</div>
                    <div style={{ color: T.muted, fontSize: 12, marginBottom: 8 }}>{rec.date} at {rec.time}</div>
                    {rec.disease && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        <Badge color="blue">🔬 {rec.disease}</Badge>
                        <Badge color="green">✓ {typeof rec.confidence === 'number' ? rec.confidence.toFixed(0) : rec.confidence}%</Badge>
                        <Badge color={rec.severity === 'High' ? 'red' : rec.severity === 'Moderate' ? 'amber' : 'green'}>⚡ {rec.severity}</Badge>
                      </div>
                    )}
                  </div>
                  <button onClick={() => downloadPDF(rec)} style={{ padding: '6px 14px', background: T.cyanDim, border: `1px solid ${T.cyan}30`, borderRadius: 10, color: T.cyan, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>
                    <FileDown size={14} /> Download
                  </button>
                </div>

                {/* Treatment text */}
                <div style={{ color: T.text, fontSize: 14, lineHeight: 1.8, marginBottom: 18, whiteSpace: 'pre-wrap' }}>
                  {rec.treatment?.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
                    part.startsWith('**') && part.endsWith('**')
                      ? <strong key={i} style={{ color: T.cyan }}>{part.slice(2, -2)}</strong>
                      : part
                  )}
                </div>

                {/* 💊 Rich medicines */}
                {rec.medicationsRich && rec.medicationsRich.length > 0 && (
                  <div style={{ marginBottom: 14, padding: 16, background: `${T.purple}08`, border: `1px solid ${T.purple}20`, borderRadius: 14 }}>
                    <div style={{ fontWeight: 700, color: T.purple, marginBottom: 12, fontSize: 14 }}>💊 Recommended Medicines</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {rec.medicationsRich.slice(0, 5).map((med, mi) => {
                        const sevColor = { Mild: T.green, Moderate: T.amber, Severe: T.red, Critical: '#ff2200' }[med.severity] || T.muted;
                        const sevIcon = { Mild: '🟢', Moderate: '🟡', Severe: '🟠', Critical: '🔴' }[med.severity] || '⚪';
                        return (
                          <div key={mi} style={{ padding: 14, background: `${T.purple}06`, border: `1px solid ${T.purple}15`, borderRadius: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
                              <div style={{ fontWeight: 700, color: T.text, fontSize: 13 }}>💉 {med.medicine}</div>
                              <span style={{ padding: '2px 9px', borderRadius: 99, fontSize: 10, fontWeight: 700, color: sevColor, background: `${sevColor}18`, border: `1px solid ${sevColor}40`, whiteSpace: 'nowrap' }}>
                                {sevIcon} {med.severity}
                              </span>
                            </div>
                            <div style={{ fontSize: 12, color: T.sub, marginBottom: 4 }}>
                              <span style={{ color: T.muted, fontWeight: 600 }}>📏 Dosage: </span>{med.dosage}
                            </div>
                            {med.precautions && (
                              <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.6, padding: '6px 10px', background: `${T.amber}08`, borderRadius: 8, border: `1px solid ${T.amber}20`, marginTop: 6 }}>
                                <span style={{ color: T.amber, fontWeight: 600 }}>⚠ Precautions: </span>{med.precautions}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {rec.medicationsRich.length > 5 && (
                        <div style={{ color: T.muted, fontSize: 12, textAlign: 'center' }}>+ {rec.medicationsRich.length - 5} more medicines — consult your doctor for full list</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Alternative diseases */}
                {rec.topDiseases && rec.topDiseases.length > 1 && (
                  <div style={{ marginBottom: 14, padding: '10px 14px', background: `${T.cyan}05`, border: `1px solid ${T.cyan}18`, borderRadius: 12 }}>
                    <div style={{ fontWeight: 600, color: T.cyan, fontSize: 12, marginBottom: 8 }}>🔬 Other Conditions Considered</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {rec.topDiseases.slice(1, 4).map((d, i) => (
                        <span key={i} style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, background: `${T.cyan}10`, border: `1px solid ${T.cyan}25`, color: T.sub }}>
                          {d.disease} — {d.probability.toFixed(0)}%
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lifestyle & Warnings */}
                {[
                  { title: '🌿 Lifestyle Advice', items: rec.lifestyle, color: T.green },
                  { title: '⚠️ Warnings', items: rec.warnings, color: T.red },
                ].filter(s => s.items && s.items.length > 0).map((section, si) => (
                  <div key={si} style={{ marginBottom: 14, padding: 16, background: `${section.color}08`, border: `1px solid ${section.color}20`, borderRadius: 14 }}>
                    <div style={{ fontWeight: 700, color: section.color, marginBottom: 12, fontSize: 14 }}>{section.title}</div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {section.items.map((item, ii) => (
                        <li key={ii} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, color: T.text, fontSize: 13, marginBottom: 10, lineHeight: 1.7 }}>
                          <span style={{ color: section.color, marginTop: 3, flexShrink: 0, fontWeight: 700, fontSize: 16 }}>•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {/* Extracted test results table */}
                {rec.reportData?.testResults?.length > 0 && (
                  <div style={{ marginBottom: 14, padding: 16, background: `${T.cyan}06`, border: `1px solid ${T.cyan}20`, borderRadius: 14 }}>
                    <div style={{ fontWeight: 700, color: T.cyan, marginBottom: 12, fontSize: 14 }}>🧪 Extracted Test Results from Report</div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                            {['Test Name', 'Value', 'Unit', 'Normal Range', 'Flag'].map(h => (
                              <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: T.muted, fontWeight: 600 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rec.reportData.testResults.map((r, i) => (
                            <tr key={i} style={{ borderBottom: `1px solid ${T.border}20` }}>
                              <td style={{ padding: '6px 10px', color: T.text, fontWeight: 500 }}>{r.name}</td>
                              <td style={{ padding: '6px 10px', color: T.text, fontWeight: 700 }}>{r.value}</td>
                              <td style={{ padding: '6px 10px', color: T.muted }}>{r.unit || '—'}</td>
                              <td style={{ padding: '6px 10px', color: T.muted }}>{r.range || '—'}</td>
                              <td style={{ padding: '6px 10px' }}>
                                {r.flag && r.flag !== 'NORMAL' && r.flag !== ''
                                  ? <span style={{
                                    padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700,
                                    background: (r.flag === 'H' || r.flag === 'HIGH' || r.flag === 'CRITICAL') ? `${T.red}20` : (r.flag === 'L' || r.flag === 'LOW') ? `${T.amber}20` : `${T.border}`,
                                    color: (r.flag === 'H' || r.flag === 'HIGH' || r.flag === 'CRITICAL') ? T.red : (r.flag === 'L' || r.flag === 'LOW') ? T.amber : T.muted
                                  }}>{r.flag}</span>
                                  : <span style={{ color: T.green, fontSize: 11 }}>Normal</span>
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {rec.reportData.diagnoses?.length > 0 && (
                      <div style={{ marginTop: 10, fontSize: 12, color: T.muted }}>
                        Detected conditions: <span style={{ color: T.text, fontWeight: 600 }}>{rec.reportData.diagnoses.join(', ')}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Disclaimer */}
                <div style={{ padding: '12px 16px', background: `${T.amber}08`, border: `1px solid ${T.amber}25`, borderRadius: 12, marginTop: 14 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: T.amber, fontSize: 12, lineHeight: 1.7 }}>
                    <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span><strong>Disclaimer:</strong> ⚠ This system does not support bone injuries or organ-related diseases. Please consult a doctor for serious conditions.</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {aiLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Card style={{ maxWidth: '70%', padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg,${T.cyan},#0066aa)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Brain size={20} color="#fff" /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: T.cyan, marginBottom: 8, fontSize: 14 }}>
                    {uploadingReport ? 'Scanning medical report...' : 'AI Assistant is analyzing...'}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {[0, 0.2, 0.4].map((delay, i) => (
                      <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: T.cyan, animation: `pulse 1.5s ease-in-out ${delay}s infinite` }} />
                    ))}
                    <span style={{ color: T.muted, fontSize: 13, marginLeft: 8 }}>Analyzing symptoms and medical data...</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
        <div ref={aiChatEndRef} />
      </div>

      {/* ── Fixed input bar ── */}
      <div style={{ position: 'fixed', bottom: 0, left: sidebarOpen ? 240 : 0, right: 0, background: `${T.surface}f8`, backdropFilter: 'blur(20px)', borderTop: `1px solid ${T.borderH}`, padding: '16px 20px 20px', zIndex: 30, transition: 'left 0.25s' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: '12px 16px', background: T.card, border: `1px solid ${T.borderH}`, borderRadius: 16, boxShadow: `0 4px 20px rgba(0,153,204,0.15)` }}>
            {/* Attached file preview */}
            {aiFile && reportValidation?.status === 'success' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '8px 12px', background: `${T.green}12`, border: `1px solid ${T.green}30`, borderRadius: 10 }}>
                {aiFilePreviewUrl && aiFile?.type?.startsWith('image/') ? (
                  <img src={aiFilePreviewUrl} alt="report" style={{ width: 42, height: 42, borderRadius: 8, objectFit: 'cover', border: `1px solid ${T.green}40`, flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 42, height: 42, borderRadius: 8, background: `${T.green}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>
                    {getReportIcon(reportValidation.reportType)}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: T.text, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{aiFile.name}</div>
                  <div style={{ color: T.green, fontSize: 11, fontWeight: 600 }}>
                    ✓ {reportValidation.reportType}
                    <span style={{ color: T.muted, fontWeight: 400 }}>
                      {reportValidation.fileInfo && ` · ${reportValidation.fileInfo.ext} · ${reportValidation.fileInfo.size} KB`}
                    </span>
                  </div>
                </div>
                <button onClick={() => { setAiFile(null); setExtractedReportText(''); setReportValidation(null); if (aiFilePreviewUrl) URL.revokeObjectURL(aiFilePreviewUrl); setAiFilePreviewUrl(null); }}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: `${T.red}15`, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <X size={13} color={T.red} />
                </button>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
              <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleReportUpload} style={{ display: 'none' }} />
              <button onClick={() => fileInputRef.current?.click()} disabled={uploadingReport}
                title="Upload medical report (PDF/JPG/PNG)"
                style={{ width: 42, height: 42, borderRadius: 12, background: uploadingReport ? T.surface : T.cyanDim, border: `1px solid ${T.border}`, cursor: uploadingReport ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {uploadingReport
                  ? <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${T.cyan}`, borderTopColor: 'transparent', animation: 'spin 0.6s linear infinite' }} />
                  : <Upload size={20} color={T.cyan} />
                }
              </button>
              <textarea value={symptoms} onChange={e => setSymptoms(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && (symptoms.trim() || aiFile) && !aiLoading) { e.preventDefault(); generateAI(); } }}
                placeholder="Describe your symptoms… (e.g., fever, headache, fatigue)"
                rows={1}
                style={{ flex: 1, background: 'transparent', border: 'none', color: T.text, fontSize: 14, outline: 'none', resize: 'none', lineHeight: 1.5, maxHeight: 120, minHeight: 42, overflow: 'auto', fontFamily: 'inherit', padding: '10px 0' }} />
              <button onClick={generateAI} disabled={(!symptoms.trim() && !aiFile) || aiLoading || uploadingReport}
                style={{
                  width: 42, height: 42, borderRadius: 12, border: 'none',
                  cursor: (symptoms.trim() || aiFile) && !aiLoading && !uploadingReport ? 'pointer' : 'not-allowed',
                  background: (symptoms.trim() || aiFile) && !aiLoading && !uploadingReport ? `linear-gradient(135deg,${T.cyan},#0066aa)` : T.surface,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  opacity: (symptoms.trim() || aiFile) && !aiLoading && !uploadingReport ? 1 : 0.5
                }}>
                {aiLoading
                  ? <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid #fff`, borderTopColor: 'transparent', animation: 'spin 0.6s linear infinite' }} />
                  : <Send size={18} color={(symptoms.trim() || aiFile) ? '#fff' : T.muted} />
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const downloadPrescription = (p) => {
    const content = `MEDI AI — PRESCRIPTION\nPatient: ${pd.name}\nMedication: ${p.medication}\nDosage: ${p.dosage || 'N/A'}\nFrequency: ${p.frequency || 'As directed'}\nDoctor: ${p.doctor}\n© Medi AI ${new Date().getFullYear()}`;
    const blob = new Blob([content], { type: 'text/plain' }); const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `Prescription_${p.medication.replace(/\s+/g, '_')}_${pd.name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const sharePrescription = async (p) => {
    const shareText = `📋 Medi AI Prescription\n\n👤 ${pd.name}\n💊 ${p.medication}\n📏 ${p.dosage || 'N/A'}\n👨‍⚕️ ${p.doctor}`;
    if (navigator.share) { try { await navigator.share({ title: `Prescription — ${p.medication}`, text: shareText }); } catch (err) { if (err.name !== 'AbortError') { navigator.clipboard.writeText(shareText); alert('✅ Copied to clipboard!'); } } }
    else { navigator.clipboard.writeText(shareText); alert('✅ Copied to clipboard!'); }
  };

  const renderPrescriptions = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <h1 style={{ color: T.text, fontWeight: 800, fontSize: 26, margin: 0 }}>Prescriptions</h1>
      {[{ title: '💊 Current Prescriptions', data: prescriptions.current }, { title: '🗂 Past Prescriptions', data: prescriptions.past }].map((sec, si) => (
        <Card key={si}>
          <div style={{ fontWeight: 700, color: T.text, fontSize: 15, marginBottom: 14 }}>{sec.title}</div>
          {sec.data.length === 0 ? <div style={{ color: T.muted, fontSize: 13, textAlign: 'center', padding: '24px 0' }}>No prescriptions found</div> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>{['Medication', 'Dosage', 'Frequency', 'Start', 'End', 'Doctor', 'Actions'].map(h => (<th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, color: T.muted, fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>))}</tr></thead>
                <tbody>{sec.data.map(p => (<tr key={p.id} style={{ borderBottom: `1px solid ${T.border}` }}>{[p.medication, p.dosage, p.frequency, p.startDate, p.endDate, p.doctor].map((v, ci) => (<td key={ci} style={{ padding: '10px 10px', color: ci === 0 ? T.text : T.sub, fontSize: 12, fontWeight: ci === 0 ? 600 : 400, whiteSpace: 'nowrap' }}>{v}</td>))}<td style={{ padding: '10px 10px' }}><div style={{ display: 'flex', gap: 8 }}><button onClick={() => downloadPrescription(p)} style={{ background: 'none', border: 'none', color: T.cyan, cursor: 'pointer', display: 'flex', padding: 4, borderRadius: 6 }}><Download size={15} /></button><button onClick={() => sharePrescription(p)} style={{ background: 'none', border: 'none', color: T.cyan, cursor: 'pointer', display: 'flex', padding: 4, borderRadius: 6 }}><Share2 size={15} /></button></div></td></tr>))}</tbody>
              </table>
            </div>
          )}
        </Card>
      ))}
    </div>
  );

  const renderMessages = () => {
    const unreadCount = notifs.filter(n => !n.read).length;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 110px)' }}>
        <div style={{ marginBottom: 18, flexShrink: 0 }}>
          <h1 style={{ color: T.text, fontWeight: 800, fontSize: 26, margin: '0 0 4px' }}>Messages & Notifications</h1>
          <p style={{ color: T.muted, fontSize: 13, margin: 0 }}>Stay updated and get instant AI health guidance</p>
        </div>
        <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>
          <div style={{ background: T.card, borderRadius: 20, border: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: T.cyanDim, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Bell size={16} color={T.cyan} /></div>
                <span style={{ color: T.text, fontWeight: 800, fontSize: 15 }}>Notifications</span>
              </div>
              {unreadCount > 0 && <span style={{ padding: '2px 9px', background: T.cyan, borderRadius: 999, fontSize: 11, fontWeight: 800, color: '#fff' }}>{unreadCount}</span>}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px' }}>
              {notifs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 16px' }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: T.cyanDim, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}><Bell size={22} color={T.muted} /></div>
                  <div style={{ color: T.text, fontWeight: 700, fontSize: 13, marginBottom: 5 }}>All caught up!</div>
                  <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.5 }}>No notifications yet.</div>
                </div>
              ) : notifs.map(n => (
                <div key={n.id} style={{ padding: '12px 13px', borderRadius: 12, marginBottom: 6, background: n.read ? 'transparent' : `${T.cyan}08`, border: `1px solid ${n.read ? T.border : T.cyan + '30'}`, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 9, flex: 1 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginTop: 1, background: n.read ? `${T.muted}15` : `${T.cyan}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Bell size={12} color={n.read ? T.muted : T.cyan} /></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: T.text, fontWeight: 700, fontSize: 12, lineHeight: 1.4, marginBottom: 3 }}>{n.title}</div>
                        <div style={{ color: T.muted, fontSize: 11, lineHeight: 1.5 }}>{n.message}</div>
                        <div style={{ color: T.muted, fontSize: 10, marginTop: 5, display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={9} />{n.time}</div>
                      </div>
                    </div>
                    {!n.read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.cyan, flexShrink: 0, marginTop: 5 }} />}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: T.card, borderRadius: 20, border: `1px solid ${T.borderH}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, background: `linear-gradient(135deg, ${T.cyanDim}, rgba(0,153,204,0.03))`, display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 46, height: 46, borderRadius: '50%', background: `linear-gradient(135deg, ${T.cyan}, #005599)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Brain size={20} color="#fff" /></div>
                <div style={{ position: 'absolute', bottom: 2, right: 2, width: 11, height: 11, borderRadius: '50%', background: T.green, border: `2px solid ${T.card}` }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: T.text, fontWeight: 800, fontSize: 15 }}>Medi AI Health Assistant</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: T.green }} /><span style={{ color: T.green, fontSize: 11, fontWeight: 600 }}>Online · AI-Powered Guidance</span></div>
              </div>
              <button onClick={() => setBotChat([{ id: Date.now(), role: 'bot', text: "Chat cleared! How can I help you today?", time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }])} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 9, background: T.cyanDim, border: `1px solid ${T.border}`, color: T.cyan, cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'inherit' }}><RotateCcw size={11} /> Clear</button>
            </div>
            <div style={{ padding: '9px 14px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', flexWrap: 'nowrap' }}>
                {QUICK_QUESTIONS.map((q, i) => (<button key={i} onClick={() => sendBotMessage(q.query)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 20, flexShrink: 0, border: `1px solid ${T.border}`, background: T.cyanDim, color: T.cyan, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}><q.icon size={10} /> {q.label}</button>))}
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {botChat.map((msg, idx) => {
                const isBot = msg.role === 'bot';
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: isBot ? 'flex-start' : 'flex-end', gap: 10, alignItems: 'flex-end' }}>
                    {isBot && <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg, ${T.cyan}, #005599)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Brain size={14} color="#fff" /></div>}
                    <div style={{ maxWidth: '74%' }}>
                      {isBot && <div style={{ fontSize: 9, color: T.muted, marginBottom: 4, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Medi AI · Health Assistant</div>}
                      <div style={{ padding: '12px 15px', borderRadius: isBot ? '4px 16px 16px 16px' : '16px 16px 4px 16px', background: isBot ? T.cyanDim : `linear-gradient(135deg, ${T.cyan}, #0077bb)`, border: isBot ? `1px solid ${T.border}` : 'none' }}>
                        <div style={{ color: isBot ? T.text : '#fff', fontSize: 13, lineHeight: 1.75, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.text}</div>
                      </div>
                      <div style={{ fontSize: 9, color: T.muted, marginTop: 4, textAlign: isBot ? 'left' : 'right' }}>{msg.time}</div>
                    </div>
                    {!isBot && <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg, ${T.cyan}, #005599)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff' }}>{pd.name?.[0] || 'P'}</div>}
                  </div>
                );
              })}
              {botLoading && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg, ${T.cyan}, #005599)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Brain size={14} color="#fff" /></div>
                  <div style={{ padding: '12px 16px', borderRadius: '4px 16px 16px 16px', background: T.cyanDim, border: `1px solid ${T.border}`, display: 'flex', gap: 5, alignItems: 'center' }}>
                    {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: T.cyan, animation: `botPulse 1.4s ease-in-out ${i * 0.2}s infinite` }} />)}
                  </div>
                </div>
              )}
              <div ref={botEndRef} />
            </div>
            <div style={{ padding: '12px 16px', borderTop: `1px solid ${T.border}`, background: 'rgba(0,0,0,0.12)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9, padding: '5px 11px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 7 }}>
                <Shield size={10} color={T.amber} />
                <span style={{ color: T.amber, fontSize: 10, fontWeight: 500 }}>Emergency? Call 112 · AI advice is informational only</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 9, padding: '9px 13px', background: T.surface, border: `1px solid ${T.borderH}`, borderRadius: 14 }}>
                <textarea ref={botInputRef} value={botMsg} onChange={e => setBotMsg(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendBotMessage(); } }} placeholder="Type your message to Medi AI…" rows={1} style={{ flex: 1, background: 'transparent', border: 'none', color: T.text, fontSize: 13, outline: 'none', resize: 'none', lineHeight: 1.5, maxHeight: 90, minHeight: 30, overflow: 'auto', fontFamily: 'inherit', padding: '5px 0' }} />
                <button onClick={() => sendBotMessage()} disabled={!botMsg.trim() || botLoading} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', flexShrink: 0, background: botMsg.trim() && !botLoading ? `linear-gradient(135deg, ${T.cyan}, #0066aa)` : T.surface, cursor: botMsg.trim() && !botLoading ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: botMsg.trim() && !botLoading ? 1 : 0.4 }}>
                  {botLoading ? <Loader2 size={15} color={T.cyan} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Send size={15} color={botMsg.trim() ? '#fff' : T.muted} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // ✅ UPDATED SUBSCRIPTION PAGE — Basic ₹299 · Premium ₹999
  // ══════════════════════════════════════════════════════════════════════════
  const renderSubscription = () => {
    const plans = [
      {
        key: 'basic',
        price: '₹299',
        period: '/month',
        trial: '7-day free trial',
        predictions: '10 queries/month',
        color: T.cyan,
        badge: '7-day Trial',
        features: [
          'AI Symptom Checker (10 queries/month)',
          'AI-powered disease prediction',
          'Medication & prescription suggestions',
          'Basic health report analysis',
          '151+ diseases covered',
          '24/7 AI availability',
        ],
        excluded: [
          'Medical report uploads',
          'Priority support',
          'Detailed diagnosis history',
        ],
      },
      {
        key: 'premium',
        price: '₹999',
        period: '/month',
        trial: '14-day free trial',
        predictions: 'Unlimited',
        color: T.green,
        badge: 'Most Popular',
        features: [
          'Unlimited symptom queries',
          'AI-powered disease prediction',
          'Medication & prescription suggestions',
          'Advanced health report analysis',
          '151+ diseases covered',
          '24/7 AI availability',
          'Medical report & blood test uploads',
          'Full diagnosis history & health timeline',
          'Priority support (response within 2 hrs)',
          'Early access to new features',
        ],
        excluded: [],
      },
    ];

    const s = subInfo;
    const statusColor = { trial: 'blue', active: 'green', expired: 'red', cancelled: 'red' }[s?.status] || 'blue';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <h1 style={{ color: T.text, fontWeight: 800, fontSize: 26, margin: 0 }}>Subscription &amp; Plans</h1>

        {/* ── Current plan status card ── */}
        {s && (
          <Card style={{ background: `linear-gradient(135deg,${T.cyan}18,${T.purple}10)`, border: `1px solid ${T.cyan}40` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg,${T.cyan},#0066aa)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={26} color="#fff" />
                </div>
                <div>
                  <div style={{ color: T.text, fontWeight: 800, fontSize: 18 }}>{s.label}</div>
                  <div style={{ color: T.muted, fontSize: 13, marginTop: 3 }}>
                    {s.status === 'trial' && `${s.days_left} day(s) left in trial • ${s.predictions_left} predictions remaining`}
                    {s.status === 'active' && `${s.days_left} day(s) left • ${s.predictions_left === 'Unlimited' ? 'Unlimited' : s.predictions_left + ' predictions'} remaining`}
                    {s.status === 'expired' && 'Your plan has expired — upgrade to continue'}
                  </div>
                </div>
              </div>
              <Badge color={statusColor}>{s.status?.toUpperCase()}</Badge>
            </div>

            {/* Predictions usage bar */}
            {s.status === 'trial' && (
              <div style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: T.muted, fontSize: 12 }}>Predictions used</span>
                  <span style={{ color: T.text, fontSize: 12, fontWeight: 700 }}>{s.predictions_used} / {s.predictions_limit}</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 999 }}>
                  <div style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg,${T.cyan},${T.purple})`, width: `${Math.min(100, (s.predictions_used / s.predictions_limit) * 100)}%`, transition: 'width 0.4s' }} />
                </div>
                <div style={{ color: T.amber, fontSize: 12, marginTop: 10, fontWeight: 600 }}>
                  ⚡ Trial ends in {s.days_left} day(s). Upgrade now to keep full access.
                </div>
              </div>
            )}

            {(s.status === 'expired' || s.status === 'trial') && (
              <Btn onClick={() => setShowPlans(true)} icon={Activity} style={{ marginTop: 16 }}>
                {s.status === 'expired' ? 'Renew Subscription' : 'Upgrade to Paid Plan'}
              </Btn>
            )}
          </Card>
        )}

        {/* ── Plan cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
          {plans.map(plan => (
            <div key={plan.key} style={{ position: 'relative', background: plan.key === 'premium' ? `linear-gradient(135deg,${T.card},rgba(16,185,129,0.05))` : T.card, border: `1px solid ${plan.color}40`, borderRadius: 18, padding: 24, transition: 'transform 0.2s, box-shadow 0.2s' }}>

              {/* Badge */}
              <div style={{ position: 'absolute', top: -10, left: 20 }}>
                <span style={{ padding: '3px 14px', background: plan.color, borderRadius: 999, fontSize: 11, fontWeight: 700, color: '#fff' }}>{plan.badge}</span>
              </div>

              {/* Header */}
              <div style={{ marginTop: 10, marginBottom: 16 }}>
                <div style={{ color: T.text, fontWeight: 800, fontSize: 20, textTransform: 'capitalize', marginBottom: 2 }}>{plan.key}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 10, marginBottom: 2 }}>
                  <span style={{ color: plan.color, fontWeight: 900, fontSize: 34 }}>{plan.price}</span>
                  <span style={{ color: T.muted, fontSize: 13 }}>{plan.period}</span>
                </div>
                <div style={{ fontSize: 11, color: plan.color, fontWeight: 600 }}>✦ {plan.trial} included</div>
                <div style={{ color: T.sub, fontSize: 12, marginTop: 4 }}>✦ {plan.predictions}</div>
              </div>

              {/* Included features */}
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {plan.features.map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: T.sub, fontSize: 12 }}>
                    <CheckCircle size={14} color={plan.color} style={{ flexShrink: 0, marginTop: 1 }} />{f}
                  </li>
                ))}
                {plan.excluded.map((f, i) => (
                  <li key={`x${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: T.muted, fontSize: 12, opacity: 0.45 }}>
                    <X size={14} color={T.muted} style={{ flexShrink: 0, marginTop: 1 }} />{f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Btn
                onClick={() => handleUpgradePlan(plan.key)}
                disabled={upgrading || (subInfo?.plan === plan.key && subInfo?.status === 'active')}
                style={{ width: '100%', justifyContent: 'center', marginTop: 12, background: `linear-gradient(135deg,${plan.color},${plan.color}bb)` }}
              >
                {upgrading ? 'Processing…' : subInfo?.plan === plan.key && subInfo?.status === 'active' ? '✓ Current Plan' : plan.key === 'premium' ? 'Go Premium' : 'Get Started'}
              </Btn>
            </div>
          ))}
        </div>

        {/* Trust footer */}
        <Card>
          <div style={{ color: T.muted, fontSize: 12, textAlign: 'center', lineHeight: 2 }}>
            🔒 100% secure &amp; private — your health data is never shared or sold<br />
            ✅ Cancel anytime · Auto-renews monthly · No hidden fees<br />
            For support, contact <span style={{ color: T.cyan }}>support@mediAI.com</span>
          </div>
        </Card>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // ✅ UPDATED UPGRADE MODAL — Basic ₹299 · Premium ₹999
  // ══════════════════════════════════════════════════════════════════════════
  const renderUpgradeModal = () => {
    if (!showPlans) return null;
    const s = subInfo;
    const plans = [
      { key: 'basic', price: '₹299', color: T.cyan, label: 'Basic', queries: '10 queries/mo', trial: '7-day free trial' },
      { key: 'premium', price: '₹999', color: T.green, label: 'Premium', queries: 'Unlimited', trial: '14-day free trial' },
    ];
    return (
      <div onClick={() => setShowPlans(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
        <div onClick={e => e.stopPropagation()} style={{ background: T.surface, borderRadius: 24, padding: 32, maxWidth: 500, width: '100%', border: `1px solid ${T.border}` }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>{s?.status === 'expired' ? '🔒' : '⚡'}</div>
            <div style={{ color: T.text, fontWeight: 800, fontSize: 22, marginBottom: 6 }}>
              {s?.status === 'expired' ? 'Subscription Expired' : 'Upgrade Your Plan'}
            </div>
            <div style={{ color: T.muted, fontSize: 14 }}>Choose a plan to continue using AI predictions.</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, marginBottom: 20 }}>
            {plans.map(plan => (
              <button key={plan.key} onClick={() => handleUpgradePlan(plan.key)} disabled={upgrading}
                style={{ padding: 18, background: T.card, border: `2px solid ${plan.color}50`, borderRadius: 16, cursor: upgrading ? 'wait' : 'pointer', textAlign: 'center', fontFamily: 'inherit', transition: 'border-color 0.2s' }}>
                <div style={{ color: plan.color, fontWeight: 800, fontSize: 15, marginBottom: 6 }}>{plan.label}</div>
                <div style={{ color: T.text, fontWeight: 900, fontSize: 26, letterSpacing: -1 }}>{plan.price}</div>
                <div style={{ color: T.muted, fontSize: 11, marginTop: 4 }}>{plan.queries}</div>
                <div style={{ color: plan.color, fontSize: 10, fontWeight: 600, marginTop: 3 }}>✦ {plan.trial}</div>
              </button>
            ))}
          </div>
          <button onClick={() => setShowPlans(false)} style={{ width: '100%', padding: '10px 0', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 10, color: T.muted, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
            Maybe Later
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0e1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: `3px solid rgba(0,153,204,0.2)`, borderTop: `3px solid #0099cc`, animation: 'spin 0.8s linear infinite' }} />
        <div style={{ color: '#64748b', fontSize: 14 }}>Loading your dashboard…</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Segoe UI',system-ui,sans-serif" }}>

      {/* TOAST */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 28, right: 24, zIndex: 99999, display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', minWidth: 300, maxWidth: 420, background: T.card, border: `1px solid ${toast.type === 'error' ? '#ef444460' : toast.type === 'success' ? '#22c55e60' : `${T.cyan}60`}`, borderLeft: `4px solid ${toast.type === 'error' ? '#ef4444' : toast.type === 'success' ? '#22c55e' : T.cyan}`, borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', animation: 'toastSlide 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: toast.type === 'error' ? '#ef444420' : toast.type === 'success' ? '#22c55e20' : `${T.cyan}20` }}>
            {toast.type === 'error' ? <XCircle size={18} color="#ef4444" /> : toast.type === 'success' ? <CheckCircle size={18} color="#22c55e" /> : <AlertCircle size={18} color={T.cyan} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: toast.type === 'error' ? '#ef4444' : toast.type === 'success' ? '#22c55e' : T.cyan, marginBottom: 3 }}>{toast.type === 'error' ? 'Invalid File' : toast.type === 'success' ? 'Success' : 'Info'}</div>
            <div style={{ color: T.text, fontSize: 13, lineHeight: 1.5 }}>{toast.message}</div>
          </div>
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: 2, flexShrink: 0, display: 'flex' }}><X size={15} /></button>
        </div>
      )}

      {/* NAVBAR */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 58, zIndex: 50, background: `${T.surface}ee`, backdropFilter: 'blur(14px)', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => setSidebarOpen(o => !o)} style={{ width: 34, height: 34, borderRadius: 8, background: T.cyanDim, border: `1px solid ${T.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {sidebarOpen ? <X size={16} color={T.cyan} /> : <Menu size={16} color={T.cyan} />}
          </button>
          <MediAiLogo size={30} showText={false} />
          <span style={{ fontWeight: 800, fontSize: 15, color: T.text }}>Medi<span style={{ color: T.cyan }}>AI</span></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShareMenu(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 13px', background: T.cyanDim, border: `1px solid ${T.border}`, borderRadius: 9, color: T.cyan, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}><Share2 size={13} /> Share</button>
            {shareMenu && (
              <div style={{ position: 'absolute', right: 0, top: '110%', width: 210, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 200 }}>
                {[{ icon: Copy, label: 'Copy link', fn: () => { navigator.clipboard.writeText(window.location.href); setShareMenu(false); } }, { icon: Download, label: 'Download chat', fn: () => { alert('Coming soon!'); setShareMenu(false); } }, { icon: Smartphone, label: 'Share to WhatsApp', fn: () => { window.open(`https://wa.me/?text=${encodeURIComponent(window.location.href)}`, '_blank'); setShareMenu(false); } }].map((item, i) => (<button key={i} onClick={item.fn} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'none', border: 'none', color: T.sub, cursor: 'pointer', fontSize: 12, textAlign: 'left' }}><item.icon size={13} color={T.cyan} /> {item.label}</button>))}
              </div>
            )}
          </div>
          <button onClick={() => setPage('Messages / Notifications')} style={{ position: 'relative', padding: 7, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}>
            <Bell size={18} color={T.sub} />
            {notifs.some(n => !n.read) && <span style={{ position: 'absolute', top: 5, right: 5, width: 6, height: 6, borderRadius: '50%', background: T.red }} />}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 10, borderLeft: `1px solid ${T.border}` }}>
            {pd.profilePic ? <img src={pd.profilePic} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${T.cyan}` }} /> : <div style={{ width: 30, height: 30, borderRadius: '50%', background: `linear-gradient(135deg,${T.cyan},#005588)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff' }}>{pd.name?.[0] || 'U'}</div>}
            <div style={{ lineHeight: 1.3 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{pd.name}</div>
              <div style={{ fontSize: 10, color: T.muted }}>Patient</div>
            </div>
          </div>
        </div>
      </nav>

      {/* SIDEBAR */}
      <aside style={{ position: 'fixed', left: 0, top: 58, bottom: 0, width: sidebarOpen ? 240 : 0, overflow: 'hidden', background: T.surface, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', transition: 'width 0.25s ease', zIndex: 40 }}>
        <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
          {menuItems.map(item => {
            const active = page === item.id;
            return (<button key={item.id} onClick={() => setPage(item.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, border: 'none', background: active ? T.cyanDim : 'transparent', color: active ? T.cyan : T.sub, cursor: 'pointer', marginBottom: 2, transition: 'all 0.15s', borderLeft: `3px solid ${active ? T.cyan : 'transparent'}`, fontFamily: 'inherit' }}>
              <item.icon size={16} /><span style={{ fontSize: 12, fontWeight: active ? 700 : 500, whiteSpace: 'nowrap' }}>{item.label}</span>
            </button>);
          })}
        </nav>
        <div style={{ borderTop: `1px solid ${T.border}`, padding: '10px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10 }}>
            {pd.profilePic ? <img src={pd.profilePic} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${T.cyan}`, flexShrink: 0 }} /> : <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg,${T.cyan},#005588)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14, fontWeight: 800, color: '#fff' }}>{pd.name?.[0] || 'U'}</div>}
            <div style={{ flex: 1, overflow: 'hidden' }}><div style={{ fontSize: 12, fontWeight: 700, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pd.name}</div></div>
          </div>
          <button onClick={() => setFeedbackModal(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(0,153,204,0.07)', border: '1px solid rgba(0,153,204,0.18)', borderRadius: 9, color: T.cyan, cursor: 'pointer', marginBottom: 6, fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}><MessageCircle size={14} /> Share Feedback</button>
          <button onClick={() => setLogoutModal(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'none', border: 'none', color: T.red, cursor: 'pointer', borderRadius: 9, fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}><LogOut size={14} /> Logout</button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ marginLeft: sidebarOpen ? 240 : 0, marginTop: 58, minHeight: 'calc(100vh - 58px)', transition: 'margin-left 0.25s ease', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, padding: 22, maxWidth: 1160, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          {page === 'Dashboard' && renderDashboard()}
          {page === 'My Profile' && renderProfile()}
          {page === 'Medical Records' && renderMedicalRecords()}
          {page === 'AI Treatment Recommendation' && renderAiTreatment()}
          {page === 'Prescriptions' && renderPrescriptions()}
          {page === 'Messages / Notifications' && renderMessages()}
          {page === 'Subscription' && renderSubscription()}
        </div>
        {page !== 'AI Treatment Recommendation' && (
          <footer style={{ borderTop: `1px solid ${T.border}`, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, background: T.surface }}>
            <div style={{ display: 'flex', gap: 14, fontSize: 11 }}>
              <button onClick={() => navigate('/privacy-policy')} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 11, padding: 0 }}>Privacy Policy</button>
              <button onClick={() => navigate('/terms-of-service')} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 11, padding: 0 }}>Terms of Service</button>
            </div>
          </footer>
        )}
      </main>

      {/* MODALS */}
      <Modal isOpen={logoutModal} onClose={() => setLogoutModal(false)} title="Confirm Logout">
        <p style={{ color: T.sub, marginBottom: 22, fontSize: 14 }}>Are you sure you want to logout?</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <Btn onClick={logout} variant="danger" style={{ flex: 1, justifyContent: 'center' }}>Yes, Logout</Btn>
          <Btn onClick={() => setLogoutModal(false)} variant="secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</Btn>
        </div>
      </Modal>

      {renderUpgradeModal()}

      <FeedbackModal isOpen={feedbackModal} onClose={() => setFeedbackModal(false)} role="patient" />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1); } }
        @keyframes botPulse { 0%, 80%, 100% { opacity: 0.3; transform: scale(0.6); } 40% { opacity: 1; transform: scale(1); } }
        @keyframes toastSlide { from { transform: translateY(20px) scale(0.95); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
        @keyframes bubbleIn { from { transform: translateY(10px) scale(0.96); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,153,204,0.25); border-radius: 999px; }
        select option { background: #1a2235; color: #f1f5f9; }
        textarea { scrollbar-width: thin; }
      `}</style>
    </div>
  );
};

export default PatientDashboard;