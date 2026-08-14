import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Icon } from '../../shared/ui/icon/icon';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
}

const GENERATED_CHATS: ChatMessage[] = [
  { id: '1', sender: 'assistant', text: 'Welcome back! I am your medical learning assistant. I can help with NEET PG high-yield topics, clinical case breakdowns, certificate generation, and daily study planning. How can I assist you today?' },
  { id: '2', sender: 'user', text: 'Hi! Let us start by reviewing Cardiology topics for NEET PG.' },
  { id: '3', sender: 'assistant', text: 'Great choice! Cardiology is heavily tested. Would you like to cover ECG interpretations, valvular heart diseases, or heart failure guidelines first?' },
  { id: '4', sender: 'user', text: 'Let us do ECG interpretations. What is the classic triad of WPW syndrome?' },
  { id: '5', sender: 'assistant', text: 'The classic ECG triad for Wolff-Parkinson-White (WPW) syndrome consists of:\n1. Short PR interval (< 120 ms)\n2. Delta wave (slurred upstroke of the QRS complex)\n3. QRS prolongation (> 120 ms)\n\nRemember: Avoid AV nodal blocking agents like Adenosine, Beta-blockers, CCBs, and Digoxin during AF in WPW!' },
  { id: '6', sender: 'user', text: 'Got it. What is the drug of choice for acute WPW with atrial fibrillation?' },
  { id: '7', sender: 'assistant', text: 'Procainamide or Ibutilide are preferred for hemodynamically stable patients. If unstable, synchronized electrical cardioversion is indicated immediately.' },
  { id: '8', sender: 'user', text: 'Can you summarize the key diagnostic criteria for Infective Endocarditis using Duke criteria?' },
  { id: '9', sender: 'assistant', text: 'The Modified Duke Criteria for Infective Endocarditis requires:\n\n• Major Criteria:\n  - Positive blood culture from 2 separate blood cultures\n  - Evidence of endocardial involvement on echocardiogram (vegetation, abscess, or new valvular regurgitation)\n\n• Minor Criteria:\n  - Predisposing heart condition or IV drug use\n  - Fever ≥ 38.0°C\n  - Vascular phenomena (Janeway lesions, arterial emboli)\n  - Immunologic phenomena (Osler nodes, Roth spots, Rheumatoid factor)\n\nDiagnosis is confirmed with 2 major, 1 major + 3 minor, or 5 minor criteria.' },
  { id: '10', sender: 'user', text: 'Awesome. Now let us switch to Renal/Nephrology.' },
  { id: '11', sender: 'assistant', text: 'Sure! In Nephrology, high-yield areas include Glomerulonephritis vs Nephrotic syndrome, AKI stages, and Electrolyte disturbances. Which topic would you like to explore?' },
  { id: '12', sender: 'user', text: 'What is the most common cause of Nephrotic Syndrome in children vs adults?' },
  { id: '13', sender: 'assistant', text: '• Children: Minimal Change Disease (MCD) — characterized by effacement of podocyte foot processes on EM.\n• Adults: Focal Segmental Glomerulosclerosis (FSGS) overall, and Membranous Nephropathy (especially secondary to hepatitis B/C or malignancy).' },
  { id: '14', sender: 'user', text: 'Which drug is contraindicated in bilateral renal artery stenosis?' },
  { id: '15', sender: 'assistant', text: 'ACE inhibitors (e.g., Enalapril) and ARBs (e.g., Losartan). They inhibit efferent arteriolar constriction, causing a dramatic drop in GFR and acute renal failure.' },
  { id: '16', sender: 'user', text: 'Nice! Now can you help me draft a certificate text for my clinical module completion?' },
  { id: '17', sender: 'assistant', text: 'management, resilience, and self-discipline alongside a demanding academic curriculum.' },
  { id: '18', sender: 'assistant', text: 'Want either rendered into the certificate?' },
  { id: '19', sender: 'user', text: 'This is to certify the successful completion of the program, with demonstrated excellence in full stack development and modern AI technologies — achieved through exceptional time management, resilience, and self-discipline alongside a demanding academic curriculum. Your dedication and pursuit of excellence are truly commendable.' },
  { id: '20', sender: 'assistant', text: 'That reads cleanly and has no errors — nicely balanced final version. Want me to render it into the certificate now?' },
  { id: '21', sender: 'user', text: 'This is to certify the successful completion of the program, with demonstrated excellence achieved through exceptional time management, resilience, and self-discipline alongside a demanding academic curriculum. Your dedication and pursuit of excellence are truly commendable.' },
  { id: '22', sender: 'assistant', text: 'I have saved this exact text version for your completion certificate! Let us know if you want any formatting adjustments.' },
  { id: '23', sender: 'user', text: 'Let us continue our medical revision. What are the key high-yield facts for Neurology?' },
  { id: '24', sender: 'assistant', text: 'In Neurology, focus on:\n1. Stroke syndromes (MCA vs ACA vs PCA vs Basilar)\n2. Dementia types (Alzheimer, Pick, Lewy Body, Vascular)\n3. Cranial nerve lesions\n4. Demyelinating disorders (Multiple Sclerosis vs NMO)\n5. Movement disorders (Parkinsonism vs Huntington).' },
  { id: '25', sender: 'user', text: 'What is the classic lumbar puncture finding in Multiple Sclerosis?' },
  { id: '26', sender: 'assistant', text: 'Oligoclonal bands (IgG) on CSF electrophoresis, accompanied by an elevated IgG index.' },
  { id: '27', sender: 'user', text: 'What about Guillain-Barré Syndrome?' },
  { id: '28', sender: 'assistant', text: 'Albuminocytological dissociation — high protein content in CSF with a normal white blood cell count.' },
  { id: '29', sender: 'user', text: 'Which bacteria is most commonly associated with GBS?' },
  { id: '30', sender: 'assistant', text: 'Campylobacter jejuni (gastroenteritis prior to onset of ascending paralysis).' },
  { id: '31', sender: 'user', text: 'What is the hallmark pathological lesion in Parkinson Disease?' },
  { id: '32', sender: 'assistant', text: 'Lewy bodies (intracellular inclusions composed of aggregated alpha-synuclein) in the substantia nigra pars compacta.' },
  { id: '33', sender: 'user', text: 'Let us review Respiratory Medicine next.' },
  { id: '34', sender: 'assistant', text: 'Ready! Key Pulmonology high-yield topics:\n• Asthma vs COPD Spirometry\n• Restrictive vs Obstructive lung disease parameters\n• Pneumonia pathogens\n• Pleural effusion (Light criteria)\n• Sarcoidosis.' },
  { id: '35', sender: 'user', text: 'Remind me of Light Criteria for Exudative Pleural Effusion.' },
  { id: '36', sender: 'assistant', text: 'An effusion is Exudative if ANY 1 of the following 3 is met:\n1. Pleural fluid protein / Serum protein ratio > 0.5\n2. Pleural fluid LDH / Serum LDH ratio > 0.6\n3. Pleural fluid LDH > 2/3 upper limit of normal serum LDH.' },
  { id: '37', sender: 'user', text: 'What is the non-caseating granuloma characteristic disease in chest X-ray?' },
  { id: '38', sender: 'assistant', text: 'Sarcoidosis! Classic presentation includes bilateral hilar lymphadenopathy and non-caseating granulomas on biopsy with elevated serum ACE levels.' },
  { id: '39', sender: 'user', text: 'Now let us review Gastroenterology.' },
  { id: '40', sender: 'assistant', text: 'In GI, high yield topics include Inflammatory Bowel Disease (Crohn vs Ulcerative Colitis), Liver Cirrhosis complications, Celiac Disease, and Pancreatitis.' },
  { id: '41', sender: 'user', text: 'How do you differentiate Crohn Disease from Ulcerative Colitis?' },
  { id: '42', sender: 'assistant', text: '• Crohn Disease: Transmural inflammation, skip lesions, non-caseating granulomas, cobblestone mucosa, string sign on barium, ASCA positive.\n• Ulcerative Colitis: Mucosal/submucosal only, continuous from rectum, crypt abscesses, pseudopolyps, lead pipe colon, p-ANCA positive.' },
  { id: '43', sender: 'user', text: 'What antibody is most specific for Celiac Disease?' },
  { id: '44', sender: 'assistant', text: 'Anti-tissue transglutaminase (tTG) IgA antibody and Anti-endomysial (EMA) IgA antibody.' },
  { id: '45', sender: 'user', text: 'What is Ranson criteria used for?' },
  { id: '46', sender: 'assistant', text: 'Assessing severity and predicting mortality in acute pancreatitis at admission and at 48 hours.' },
  { id: '47', sender: 'user', text: 'Let us do Endocrinology next.' },
  { id: '48', sender: 'assistant', text: 'Endocrinology high-yields:\n• Diabetes Mellitus diagnosis & complications\n• Thyroid disorders (Graves vs Hashimoto)\n• Adrenal pathology (Cushing vs Addison)\n• Calcium homeostasis (Hyperparathyroidism).' },
  { id: '49', sender: 'user', text: 'What is the antibody in Hashimoto Thyroiditis?' },
  { id: '50', sender: 'assistant', text: 'Anti-thyroid peroxidase (Anti-TPO) and Anti-thyroglobulin antibodies.' },
  { id: '51', sender: 'user', text: 'What about Graves Disease?' },
  { id: '52', sender: 'assistant', text: 'Thyroid Stimulating Immunoglobulin (TSI) / TSH-receptor antibodies.' },
  { id: '53', sender: 'user', text: 'What test confirms Cushing Syndrome?' },
  { id: '54', sender: 'assistant', text: '1. 24-hour urinary free cortisol\n2. Low-dose dexamethasone suppression test\n3. Late-night salivary cortisol test.' },
  { id: '55', sender: 'user', text: 'What electrolyte imbalances occur in Addison Disease?' },
  { id: '56', sender: 'assistant', text: 'Hyponatremia, Hyperkalemia, Hypercalcemia, and Non-anion gap metabolic acidosis (due to aldosterone deficiency).' },
  { id: '57', sender: 'user', text: 'Let us review Hematology & Oncology.' },
  { id: '58', sender: 'assistant', text: 'Hematology key points:\n• Anemias (Microcytic, Macrocytic, Hemolytic)\n• Leukemias (AML, ALL, CML, CLL)\n• Lymphomas (Hodgkin vs Non-Hodgkin)\n• Coagulation cascades.' },
  { id: '59', sender: 'user', text: 'What chromosome translocation is diagnostic for CML?' },
  { id: '60', sender: 'assistant', text: 'Philadelphia Chromosome t(9;22), forming the BCR-ABL fusion gene. Treated with Imatinib (tyrosine kinase inhibitor).' },
  { id: '61', sender: 'user', text: 'What cell is diagnostic for Hodgkin Lymphoma?' },
  { id: '62', sender: 'assistant', text: 'Reed-Sternberg cell (owl-eye appearance, CD15+ and CD30+).' },
  { id: '63', sender: 'user', text: 'What translocation is associated with Burkitt Lymphoma?' },
  { id: '64', sender: 'assistant', text: 't(8;14) involving the c-myc oncogene. Associated with EBV ("starry sky" appearance on histology).' },
  { id: '65', sender: 'user', text: 'What translocation is associated with Acute Promyelocytic Leukemia (APL)?' },
  { id: '66', sender: 'assistant', text: 't(15;17) involving PML-RARA. Treated with All-Trans Retinoic Acid (ATRA) to prevent DIC!' },
  { id: '67', sender: 'user', text: 'Let us review Infectious Diseases next.' },
  { id: '68', sender: 'assistant', text: 'Infectious Diseases highlights:\n• Tuberculosis regimens & side effects\n• Malaria parasites & fever patterns\n• HIV opportunistic infections & CD4 cutoffs\n• Bacterial toxins.' },
  { id: '69', sender: 'user', text: 'What are the main side effects of RIPE therapy for TB?' },
  { id: '70', sender: 'assistant', text: '• Rifampin: Red-orange body fluids, Hepatotoxicity\n• Isoniazid: Peripheral neuropathy (prevent with Pyridoxine/B6), Hepatotoxicity, Drug-induced Lupus\n• Pyrazinamide: Hyperuricemia (gout), Hepatotoxicity\n• Ethambutol: Optic neuritis (red-green color blindness).' },
  { id: '71', sender: 'user', text: 'What CD4 count is associated with Pneumocystis jirovecii pneumonia in HIV?' },
  { id: '72', sender: 'assistant', text: 'CD4 < 200 cells/mm³. Prophylaxis is trimethoprim-sulfamethoxazole (TMP-SMX).' },
  { id: '73', sender: 'user', text: 'What about Toxoplasmosis and Cryptococcus?' },
  { id: '74', sender: 'assistant', text: '• Toxoplasmosis: CD4 < 100 cells/mm³ (multiple ring-enhancing brain lesions)\n• Cryptococcus: CD4 < 50 cells/mm³ (Indian ink positive CSF, soap bubble lesions in brain).' },
  { id: '75', sender: 'user', text: 'Let us review Obstetrics & Gynecology.' },
  { id: '76', sender: 'assistant', text: 'OBGYN high yield:\n• Preeclampsia & Eclampsia\n• Antepartum hemorrhage (Placenta previa vs Abruptio placentae)\n• Amenorrhea evaluation\n• Ovarian tumors.' },
  { id: '77', sender: 'user', text: 'How do you differentiate Placenta Previa from Abruptio Placentae?' },
  { id: '78', sender: 'assistant', text: '• Placenta Previa: Painless bright red vaginal bleeding in 3rd trimester. Avoid digital pelvic exam!\n• Abruptio Placentae: Painful dark red vaginal bleeding, hypertonic uterine contractions, fetal distress.' },
  { id: '79', sender: 'user', text: 'What is the antidote for Magnesium Sulfate toxicity in Eclampsia?' },
  { id: '80', sender: 'assistant', text: 'Calcium gluconate IV!' },
  { id: '81', sender: 'user', text: 'Let us review Pediatrics.' },
  { id: '82', sender: 'assistant', text: 'Pediatrics key topics:\n• Congenital heart diseases (Cyanotic vs Acyanotic)\n• Developmental milestones\n• Pediatric rashes (Measles, Scarlet fever, Kawasaki)\n• Neonatal jaundice.' },
  { id: '83', sender: 'user', text: 'What is the diagnostic triad of Kawasaki Disease?' },
  { id: '84', sender: 'assistant', text: 'Fever for ≥ 5 days plus 4 of 5:\n1. Bilateral conjunctivitis (non-purulent)\n2. Strawberry tongue / mucosal changes\n3. Cervical lymphadenopathy (usually unilateral)\n4. Polymorphous rash\n5. Extremity changes (edema, desquamation).\nComplication: Coronary artery aneurysms! Treat with IVIG + Aspirin.' },
  { id: '85', sender: 'user', text: 'What cyanotic heart disease presents with "boot-shaped heart" on X-ray?' },
  { id: '86', sender: 'assistant', text: 'Tetralogy of Fallot (TOF):\n1. VSD\n2. Pulmonary stenosis\n3. Overriding aorta\n4. Right ventricular hypertrophy.' },
  { id: '87', sender: 'user', text: 'What about "egg-on-a-string" appearance?' },
  { id: '88', sender: 'assistant', text: 'Transposition of the Great Arteries (TGA).' },
  { id: '89', sender: 'user', text: 'Let us review Pharmacology antidotes.' },
  { id: '90', sender: 'assistant', text: 'High yield Antidotes:\n• Paracetamol -> N-acetylcysteine\n• Opioids -> Naloxone\n• Benzodiazepines -> Flumazenil\n• Organophosphates -> Atropine + Pralidoxime\n• Heparin -> Protamine sulfate\n• Warfarin -> Vitamin K + PCC / FFP\n• Beta-blockers -> Glucagon\n• Digoxin -> Digoxin Immune Fab.' },
  { id: '91', sender: 'user', text: 'That is super comprehensive! Can you give me a rapid 5-question high-yield quiz to test my memory?' },
  { id: '92', sender: 'assistant', text: 'Question 1: Which nerve is injured in wrist drop?\nQuestion 2: What is the drug of choice for Absence seizures?\nQuestion 3: What enzyme is deficient in Tay-Sachs disease?\nQuestion 4: Which HLA association is seen in Ankylosing Spondylitis?\nQuestion 5: What is the classic triad of Normal Pressure Hydrocephalus (NPH)?' },
  { id: '93', sender: 'user', text: 'Here are my answers:\n1. Radial nerve\n2. Ethosuximide\n3. Hexosaminidase A\n4. HLA-B27\n5. Wet, wobbly, wacky (Incontinence, Gait ataxia, Dementia).' },
  { id: '94', sender: 'assistant', text: '100% Correct! 5/5 score! Excellent clinical recall.' },
  { id: '95', sender: 'user', text: 'What is the drug of choice for Status Epilepticus initially?' },
  { id: '96', sender: 'assistant', text: 'IV Lorazepam or IV Midazolam/Diazepam, followed by IV Levetiracetam, Fosphenytoin, or Valproate for maintenance.' },
  { id: '97', sender: 'user', text: 'What is the classic triad of Charcot in Acute Cholangitis?' },
  { id: '98', sender: 'assistant', text: 'Charcot Triad: Fever, Jaundice, Right upper quadrant abdominal pain.\nAdd Hypotension and Altered Mental Status -> Reynolds Pentad!' },
  { id: '99', sender: 'user', text: 'What is Beck Triad in Cardiac Tamponade?' },
  { id: '100', sender: 'assistant', text: 'Beck Triad:\n1. Hypotension\n2. Distended neck veins (JVD)\n3. Muffled heart sounds.' },
  { id: '101', sender: 'user', text: 'Can you summarize how to organize my final 30 days before NEET PG exam?' },
  { id: '102', sender: 'assistant', text: 'Here is your 30-Day NEET PG Strategy:\n• Days 1-15: System-wise PYQ revision (focus on Pathology, Pharma, Medicine, OBGYN, Surgery).\n• Days 16-25: High-yield image-based questions, algorithms, and tables.\n• Days 26-28: Full-length mock test review and error log analysis.\n• Days 29-30: Light revision of formulas, numbers, and restful sleep!' },
  { id: '103', sender: 'user', text: 'Thank you so much! This medical assistant chat is amazing.' },
  { id: '104', sender: 'assistant', text: 'You are very welcome! Keep pushing forward with your studies. Whenever you need more practice questions or concept breakdowns, I am right here.' },
  { id: '105', sender: 'user', text: 'Awesome! Let us keep this chat history saved for quick reference.' }
];

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [Icon, FormsModule],
  templateUrl: './ai-chat.html',
  styleUrl: './ai-chat.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AiChat implements AfterViewInit {
  @ViewChild('scrollContainer') private scrollContainer?: ElementRef<HTMLDivElement>;

  readonly promptText = signal('');
  readonly selectedModel = signal('Sonnet 5');
  readonly selectedMode = signal('Manual');

  readonly messages = signal<ChatMessage[]>(GENERATED_CHATS);

  ngAfterViewInit(): void {
    this.scrollToBottom();
  }

  sendMessage(): void {
    const text = this.promptText().trim();
    if (!text) {
      return;
    }

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text
    };

    this.messages.update((list) => [...list, userMsg]);
    this.promptText.set('');
    this.scrollToBottom();

    // Mock AI response
    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: 'I have updated your request with the latest parameters. Let me know if you would like any further adjustments!'
      };
      this.messages.update((list) => [...list, assistantMsg]);
      this.scrollToBottom();
    }, 600);
  }

  scrollToBottom(): void {
    setTimeout(() => {
      const container = this.scrollContainer?.nativeElement;
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 50);
  }
}
