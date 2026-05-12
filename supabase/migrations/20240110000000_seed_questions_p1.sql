-- Seed: UNILAG + OAU questions (part 1 of 3)
DO $$
DECLARE
  s_unilag UUID; s_oau UUID;
  sub_eng UUID; sub_math UUID; sub_bio UUID; sub_chem UUID; sub_phys UUID;
  q UUID;
BEGIN
  SELECT id INTO s_unilag  FROM public.schools WHERE abbreviation='UNILAG';
  SELECT id INTO s_oau     FROM public.schools WHERE abbreviation='OAU';

  SELECT id INTO sub_eng  FROM public.subjects WHERE name='English Language';
  SELECT id INTO sub_math FROM public.subjects WHERE name='Mathematics';
  SELECT id INTO sub_bio  FROM public.subjects WHERE name='Biology';
  SELECT id INTO sub_chem FROM public.subjects WHERE name='Chemistry';
  SELECT id INTO sub_phys FROM public.subjects WHERE name='Physics';

  -- =====================================================================
  -- UNILAG — English Language (10 questions)
  -- =====================================================================

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Choose the word nearest in meaning to GARRULOUS.',s_unilag,sub_eng,2023,
  'Garrulous means excessively talkative. "Talkative" is the closest synonym.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Silent',false),(q,'B','Talkative',true),(q,'C','Angry',false),(q,'D','Timid',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Select the option that best explains the meaning of the underlined idiom: He decided to let sleeping dogs lie.',s_unilag,sub_eng,2022,
  'Let sleeping dogs lie means to avoid bringing up old problems or conflicts.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','To wake up dogs that are sleeping',false),
  (q,'B','To avoid interfering with things that may cause trouble',true),
  (q,'C','To lie about something serious',false),
  (q,'D','To allow dogs to stay outdoors',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Choose the option opposite in meaning to BENEVOLENT.',s_unilag,sub_eng,2021,
  'Benevolent means well-meaning and kind. Its antonym is "malevolent", meaning having evil intentions.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Generous',false),(q,'B','Charitable',false),(q,'C','Malevolent',true),(q,'D','Jovial',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Identify the figure of speech in: "The wind whispered through the trees."',s_unilag,sub_eng,2023,
  'Giving the wind the human ability to whisper is personification.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Simile',false),(q,'B','Metaphor',false),(q,'C','Personification',true),(q,'D','Hyperbole',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Choose the grammatically correct sentence.',s_unilag,sub_eng,2022,
  '"Neither of the boys was present" is correct because "neither" is singular and takes a singular verb.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Neither of the boys were present',false),
  (q,'B','Neither of the boys was present',true),
  (q,'C','Neither of the boys are present',false),
  (q,'D','Neither of the boy was present',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The word LOQUACIOUS is closest in meaning to:',s_unilag,sub_eng,2020,
  'Loquacious means tending to talk a great deal; hence "verbose" (wordy/talkative).')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Reserved',false),(q,'B','Verbose',true),(q,'C','Aggressive',false),(q,'D','Boisterous',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('From the options, choose the word that has the same vowel sound as the word "HEAT".',s_unilag,sub_eng,2021,
  '"Feat" shares the same long /iː/ vowel sound as "heat".')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Hat',false),(q,'B','Hit',false),(q,'C','Feat',true),(q,'D','Hurt',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Choose the option that best completes the sentence: The lecturer, together with his students, ___ going to the conference.',s_unilag,sub_eng,2019,
  'When "together with" joins a singular subject, the verb agrees with the main subject "lecturer" — singular "is".')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','are',false),(q,'B','were',false),(q,'C','is',true),(q,'D','have been',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which of the following is an example of a rhetorical question?',s_unilag,sub_eng,2024,
  '"Is the sky blue?" is asked for effect, not to obtain information — the classic rhetorical question form.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','What time is it?',false),
  (q,'B','Where did you put my book?',false),
  (q,'C','Is the sky not blue?',true),
  (q,'D','How many students passed?',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Select the option with the correct use of the apostrophe.',s_unilag,sub_eng,2023,
  '"The girls'' books" correctly shows plural possessive — the apostrophe comes after the plural "girls".')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','The girl''s books belong to them',false),
  (q,'B','The girls'' books were on the shelf',true),
  (q,'C','The girls books were on the shelf',false),
  (q,'D','The girls''s books were on the shelf',false);

  -- =====================================================================
  -- UNILAG — Mathematics (10 questions)
  -- =====================================================================

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Simplify: 2^(3) × 2^(4) ÷ 2^(5)',s_unilag,sub_math,2023,
  '2^3 × 2^4 ÷ 2^5 = 2^(3+4−5) = 2^2 = 4.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','2',false),(q,'B','4',true),(q,'C','8',false),(q,'D','16',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Find the roots of the equation x² − 5x + 6 = 0.',s_unilag,sub_math,2022,
  'Factorising: (x−2)(x−3)=0, so x=2 or x=3.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','x=1 and x=6',false),(q,'B','x=2 and x=3',true),(q,'C','x=−2 and x=−3',false),(q,'D','x=3 and x=−2',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('A bag contains 3 red balls and 5 blue balls. What is the probability of picking a red ball?',s_unilag,sub_math,2021,
  'P(red) = 3/(3+5) = 3/8.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','1/2',false),(q,'B','5/8',false),(q,'C','3/8',true),(q,'D','3/5',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('If log₁₀ 2 = 0.3010, find log₁₀ 8.',s_unilag,sub_math,2022,
  'log₁₀ 8 = log₁₀ 2³ = 3 × 0.3010 = 0.9030.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','0.6020',false),(q,'B','0.9030',true),(q,'C','1.2040',false),(q,'D','0.4515',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The mean of five numbers is 12. If four of the numbers are 10, 14, 8, and 16, find the fifth number.',s_unilag,sub_math,2023,
  'Sum = 5×12=60. Sum of known four = 10+14+8+16=48. Fifth = 60−48=12.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','10',false),(q,'B','14',false),(q,'C','12',true),(q,'D','16',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('What is 15% of 200?',s_unilag,sub_math,2019,
  '15/100 × 200 = 30.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','25',false),(q,'B','30',true),(q,'C','35',false),(q,'D','20',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('In a class of 40 students, 25 study Mathematics and 20 study Physics. If 10 study both, how many study neither?',s_unilag,sub_math,2021,
  'n(M∪P) = 25+20−10 = 35. Neither = 40−35 = 5.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','10',false),(q,'B','5',true),(q,'C','15',false),(q,'D','35',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Evaluate: (27)^(2/3)',s_unilag,sub_math,2020,
  '27^(1/3) = 3, so 27^(2/3) = 3² = 9.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','3',false),(q,'B','6',false),(q,'C','9',true),(q,'D','18',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The sum of angles of a polygon is 1080°. How many sides does the polygon have?',s_unilag,sub_math,2024,
  'Sum = (n−2)×180 = 1080 → n−2=6 → n=8.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','6',false),(q,'B','7',false),(q,'C','8',true),(q,'D','9',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Solve for x: 3x − 7 = 2x + 5',s_unilag,sub_math,2019,
  '3x − 2x = 5 + 7 → x = 12.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','2',false),(q,'B','5',false),(q,'C','12',true),(q,'D','−12',false);

  -- =====================================================================
  -- UNILAG — Biology (9 questions)
  -- =====================================================================

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which organelle is responsible for producing ATP in the cell?',s_unilag,sub_bio,2023,
  'Mitochondria are known as the powerhouse of the cell because they generate most of the cell''s ATP through cellular respiration.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Nucleus',false),(q,'B','Ribosome',false),(q,'C','Mitochondrion',true),(q,'D','Golgi apparatus',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('What is the basic unit of classification in biology?',s_unilag,sub_bio,2022,
  'Species is the most fundamental unit of biological classification.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Genus',false),(q,'B','Family',false),(q,'C','Species',true),(q,'D','Order',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The process by which green plants make food using sunlight is called:',s_unilag,sub_bio,2021,
  'Photosynthesis is the process where chlorophyll-containing plants convert CO₂ and water into glucose using sunlight.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Respiration',false),(q,'B','Photosynthesis',true),(q,'C','Transpiration',false),(q,'D','Digestion',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which blood group is the universal donor?',s_unilag,sub_bio,2020,
  'Blood group O negative is the universal donor as its red cells lack A, B, and Rh antigens.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','A',false),(q,'B','B',false),(q,'C','AB',false),(q,'D','O',true);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('In human genetics, which chromosome combination determines a male?',s_unilag,sub_bio,2022,
  'Males have one X and one Y sex chromosome (XY), while females have two X chromosomes (XX).')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','XX',false),(q,'B','XY',true),(q,'C','YY',false),(q,'D','XXY',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which part of the brain controls balance and coordination of movement?',s_unilag,sub_bio,2023,
  'The cerebellum coordinates voluntary movements, posture, balance, and coordination.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Cerebrum',false),(q,'B','Medulla oblongata',false),(q,'C','Cerebellum',true),(q,'D','Hypothalamus',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Osmosis is best defined as the movement of:',s_unilag,sub_bio,2019,
  'Osmosis is the movement of water molecules from a region of higher water potential (lower solute concentration) to lower water potential through a semi-permeable membrane.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Solute from low to high concentration',false),
  (q,'B','Water from high to low water potential through a semi-permeable membrane',true),
  (q,'C','Gases across a membrane',false),
  (q,'D','All molecules from high to low concentration',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which vitamin is synthesised in the skin when exposed to sunlight?',s_unilag,sub_bio,2021,
  'Vitamin D is synthesised in the skin through the action of UV radiation on 7-dehydrocholesterol.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Vitamin A',false),(q,'B','Vitamin B12',false),(q,'C','Vitamin C',false),(q,'D','Vitamin D',true);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('What is the function of the nephron in the kidney?',s_unilag,sub_bio,2024,
  'The nephron is the functional unit of the kidney; it filters blood and produces urine through ultrafiltration, reabsorption, and secretion.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Transports oxygen in blood',false),
  (q,'B','Filters blood and produces urine',true),
  (q,'C','Produces hormones',false),
  (q,'D','Digests proteins',false);

  -- =====================================================================
  -- UNILAG — Chemistry (9 questions)
  -- =====================================================================

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The atomic number of an element represents:',s_unilag,sub_chem,2022,
  'The atomic number equals the number of protons in the nucleus of an atom, which identifies the element.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Number of neutrons',false),
  (q,'B','Number of protons',true),
  (q,'C','Total number of protons and neutrons',false),
  (q,'D','Number of electrons in outer shell',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which of the following is a strong acid?',s_unilag,sub_chem,2023,
  'Hydrochloric acid (HCl) is a strong acid that completely dissociates in water.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Ethanoic acid',false),(q,'B','Citric acid',false),(q,'C','Hydrochloric acid',true),(q,'D','Carbonic acid',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('What type of bond is formed between sodium and chlorine in NaCl?',s_unilag,sub_chem,2021,
  'NaCl is formed by the transfer of an electron from Na to Cl, creating oppositely charged ions held by electrostatic force — an ionic bond.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Covalent bond',false),(q,'B','Metallic bond',false),(q,'C','Ionic bond',true),(q,'D','Hydrogen bond',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Avogadro''s number is approximately:',s_unilag,sub_chem,2020,
  'Avogadro''s number (Nₐ) = 6.02 × 10²³, representing the number of particles in one mole of a substance.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','3.0 × 10²³',false),(q,'B','6.02 × 10²³',true),(q,'C','1.6 × 10⁻¹⁹',false),(q,'D','9.8 × 10²³',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The process of converting a liquid to vapour below its boiling point is called:',s_unilag,sub_chem,2022,
  'Evaporation occurs at the surface of a liquid at temperatures below its boiling point, unlike boiling which occurs throughout.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Condensation',false),(q,'B','Sublimation',false),(q,'C','Evaporation',true),(q,'D','Distillation',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which gas is produced when zinc reacts with dilute hydrochloric acid?',s_unilag,sub_chem,2021,
  'Zn + 2HCl → ZnCl₂ + H₂. Hydrogen gas is liberated when zinc reacts with dilute HCl.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Oxygen',false),(q,'B','Chlorine',false),(q,'C','Hydrogen',true),(q,'D','Carbon dioxide',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('What is the empirical formula of glucose (C₆H₁₂O₆)?',s_unilag,sub_chem,2023,
  'Dividing each subscript by 6 gives CH₂O as the simplest whole-number ratio.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','C₂H₄O₂',false),(q,'B','C₃H₆O₃',false),(q,'C','CH₂O',true),(q,'D','C₆H₁₂O₆',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The pH of a neutral solution at 25°C is:',s_unilag,sub_chem,2019,
  'A neutral solution has equal concentrations of H⁺ and OH⁻ ions, giving pH = 7 at 25°C.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','0',false),(q,'B','7',true),(q,'C','14',false),(q,'D','1',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Isotopes are atoms of the same element with the same atomic number but different:',s_unilag,sub_chem,2024,
  'Isotopes have the same number of protons (atomic number) but differ in the number of neutrons, giving different mass numbers.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Number of protons',false),(q,'B','Number of electrons',false),(q,'C','Mass number',true),(q,'D','Electronic configuration',false);

  -- =====================================================================
  -- UNILAG — Physics (9 questions)
  -- =====================================================================

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('A car accelerates from rest to 20 m/s in 5 seconds. What is its acceleration?',s_unilag,sub_phys,2023,
  'a = (v−u)/t = (20−0)/5 = 4 m/s².')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','2 m/s²',false),(q,'B','4 m/s²',true),(q,'C','10 m/s²',false),(q,'D','100 m/s²',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which of the following is the SI unit of electric current?',s_unilag,sub_phys,2022,
  'The SI unit of electric current is the Ampere (A), named after André-Marie Ampère.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Volt',false),(q,'B','Watt',false),(q,'C','Ampere',true),(q,'D','Ohm',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The speed of light in a vacuum is approximately:',s_unilag,sub_phys,2021,
  'The speed of light in vacuum c = 3 × 10⁸ m/s.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','3 × 10⁶ m/s',false),(q,'B','3 × 10⁸ m/s',true),(q,'C','3 × 10¹⁰ m/s',false),(q,'D','3 × 10⁴ m/s',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Ohm''s law states that the current through a conductor is:',s_unilag,sub_phys,2020,
  'Ohm''s law: V = IR. At constant temperature and physical conditions, current is directly proportional to voltage.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Inversely proportional to voltage',false),
  (q,'B','Directly proportional to voltage at constant resistance',true),
  (q,'C','Independent of voltage',false),
  (q,'D','Equal to the voltage',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('A body of mass 5 kg is acted upon by a force of 20 N. What is its acceleration?',s_unilag,sub_phys,2022,
  'Newton''s second law: F=ma → a = F/m = 20/5 = 4 m/s².')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','4 m/s²',true),(q,'B','25 m/s²',false),(q,'C','100 m/s²',false),(q,'D','0.25 m/s²',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which type of wave requires a material medium for propagation?',s_unilag,sub_phys,2023,
  'Mechanical waves (e.g. sound waves) require a material medium. Electromagnetic waves do not.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Radio waves',false),(q,'B','Light waves',false),(q,'C','Sound waves',true),(q,'D','X-rays',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The work done on an object equals its change in:',s_unilag,sub_phys,2019,
  'The work-energy theorem states that the net work done on an object equals its change in kinetic energy.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Momentum',false),(q,'B','Potential energy',false),(q,'C','Kinetic energy',true),(q,'D','Temperature',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('What phenomenon occurs when light bends as it passes from one medium to another?',s_unilag,sub_phys,2024,
  'Refraction is the bending of light when it passes from one optical medium to another due to a change in speed.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Reflection',false),(q,'B','Diffraction',false),(q,'C','Refraction',true),(q,'D','Dispersion',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('A transformer has 200 primary turns and 1000 secondary turns. If the primary voltage is 50 V, what is the secondary voltage?',s_unilag,sub_phys,2021,
  'Vs/Vp = Ns/Np → Vs = 50 × (1000/200) = 250 V.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','10 V',false),(q,'B','100 V',false),(q,'C','250 V',true),(q,'D','500 V',false);

  -- =====================================================================
  -- OAU — English Language (10 questions)
  -- =====================================================================

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Choose the word most nearly opposite in meaning to TACITURN.',s_oau,sub_eng,2023,
  'Taciturn means reserved or uncommunicative. Its antonym is "communicative" or "voluble". "Voluble" best expresses the opposite.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Quiet',false),(q,'B','Moody',false),(q,'C','Voluble',true),(q,'D','Introspective',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The sentence "He is as brave as a lion" is an example of:',s_oau,sub_eng,2022,
  'A simile makes a direct comparison using "as" or "like". "As brave as a lion" compares two unlike things explicitly.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Metaphor',false),(q,'B','Simile',true),(q,'C','Personification',false),(q,'D','Alliteration',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Identify the correct sentence.',s_oau,sub_eng,2021,
  '"One of the students has passed" is correct; "one" is the subject and requires the singular verb "has".')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','One of the students have passed',false),
  (q,'B','One of the students has passed',true),
  (q,'C','One of the student has passed',false),
  (q,'D','One of the students had been pass',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The word EPHEMERAL means:',s_oau,sub_eng,2020,
  'Ephemeral means lasting for a very short time, transitory.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Lasting forever',false),(q,'B','Short-lived',true),(q,'C','Extremely large',false),(q,'D','Very painful',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which option correctly completes this sentence? She __ to the market before it closed.',s_oau,sub_eng,2022,
  'The past perfect "had gone" shows the action happened before another past event (the market closing).')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','goes',false),(q,'B','had gone',true),(q,'C','will go',false),(q,'D','was going',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The expression "to bite the bullet" means:',s_oau,sub_eng,2023,
  '"Bite the bullet" means to endure a painful or unpleasant situation stoically.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','To injure oneself',false),
  (q,'B','To endure difficulty with courage',true),
  (q,'C','To attack someone',false),
  (q,'D','To eat something hard',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which of the following words is spelled correctly?',s_oau,sub_eng,2024,
  '"Occurrence" is the correct spelling. The others are common misspellings.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Occurence',false),(q,'B','Occurrance',false),(q,'C','Occurrence',true),(q,'D','Occurrrence',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('In the sentence "The committee has reached its decision", the subject is:',s_oau,sub_eng,2021,
  '"The committee" is the subject of the sentence; it is what the sentence is about.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','decision',false),(q,'B','its',false),(q,'C','committee',true),(q,'D','reached',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The plural of "criterion" is:',s_oau,sub_eng,2019,
  '"Criteria" is the correct plural of the Greek-derived word "criterion".')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Criterions',false),(q,'B','Criterias',false),(q,'C','Criteria',true),(q,'D','Criterium',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Choose the option that is closest in meaning to the word CONSPICUOUS.',s_oau,sub_eng,2022,
  'Conspicuous means clearly visible or attracting attention. "Prominent" is the closest synonym.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Hidden',false),(q,'B','Prominent',true),(q,'C','Ordinary',false),(q,'D','Dull',false);

  -- =====================================================================
  -- OAU — Mathematics (10 questions)
  -- =====================================================================

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Find the value of x if 4^x = 64.',s_oau,sub_math,2023,
  '64 = 4³, so x = 3.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','2',false),(q,'B','3',true),(q,'C','4',false),(q,'D','6',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The gradient of a line passing through (1, 2) and (3, 8) is:',s_oau,sub_math,2022,
  'Gradient = (8−2)/(3−1) = 6/2 = 3.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','2',false),(q,'B','3',true),(q,'C','4',false),(q,'D','6',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Expand (2x − 3)².',s_oau,sub_math,2021,
  '(2x−3)² = 4x² − 2(2x)(3) + 9 = 4x² − 12x + 9.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','4x² + 9',false),(q,'B','4x² − 12x + 9',true),(q,'C','4x² − 6x + 9',false),(q,'D','2x² − 12x + 9',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Convert 0.375 to a fraction in its lowest terms.',s_oau,sub_math,2020,
  '0.375 = 375/1000 = 3/8.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','1/4',false),(q,'B','3/8',true),(q,'C','2/5',false),(q,'D','5/8',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('What is the area of a circle with radius 7 cm? (Take π = 22/7)',s_oau,sub_math,2022,
  'A = πr² = (22/7) × 49 = 154 cm².')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','44 cm²',false),(q,'B','154 cm²',true),(q,'C','49 cm²',false),(q,'D','308 cm²',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('If a:b = 3:4 and b:c = 2:5, find a:c.',s_oau,sub_math,2023,
  'a:b = 3:4 and b:c = 2:5. Scale: a:b:c = 6:8:20 = 3:4:10. Therefore a:c = 3:10.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','3:5',false),(q,'B','6:20',false),(q,'C','3:10',true),(q,'D','15:16',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('How many terms are in the arithmetic progression 3, 7, 11, ..., 51?',s_oau,sub_math,2021,
  'a=3, d=4, l=51. n = (l−a)/d + 1 = (51−3)/4 + 1 = 12 + 1 = 13.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','10',false),(q,'B','12',false),(q,'C','13',true),(q,'D','15',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Simplify: √75 − √27',s_oau,sub_math,2019,
  '√75 = 5√3, √27 = 3√3. Difference = 5√3 − 3√3 = 2√3.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','√48',false),(q,'B','2√3',true),(q,'C','8√3',false),(q,'D','√3',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('A man bought a shirt for ₦2,400 and sold it for ₦3,000. What is his percentage profit?',s_oau,sub_math,2024,
  'Profit = 3000−2400 = 600. % profit = (600/2400) × 100 = 25%.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','20%',false),(q,'B','25%',true),(q,'C','30%',false),(q,'D','15%',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The median of 5, 9, 3, 7, 1 is:',s_oau,sub_math,2022,
  'Arranged in order: 1, 3, 5, 7, 9. The middle value (3rd) is 5.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','3',false),(q,'B','7',false),(q,'C','5',true),(q,'D','9',false);

  -- =====================================================================
  -- OAU — Biology (9 questions)
  -- =====================================================================

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The site of protein synthesis in the cell is the:',s_oau,sub_bio,2023,
  'Ribosomes are the cellular organelles responsible for translating mRNA into protein.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Nucleus',false),(q,'B','Ribosome',true),(q,'C','Lysosome',false),(q,'D','Vacuole',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which of the following is NOT a function of the liver?',s_oau,sub_bio,2022,
  'The liver detoxifies blood, produces bile, and regulates blood glucose. It does NOT produce insulin — that is the pancreas.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Detoxification of blood',false),
  (q,'B','Production of insulin',true),
  (q,'C','Production of bile',false),
  (q,'D','Regulation of blood glucose',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('During meiosis, the number of chromosomes in daughter cells is:',s_oau,sub_bio,2021,
  'Meiosis produces four haploid daughter cells, each with half the number of chromosomes of the parent cell.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Doubled',false),(q,'B','The same as the parent',false),(q,'C','Halved',true),(q,'D','Quadrupled',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The scientific name of modern humans is:',s_oau,sub_bio,2020,
  'Homo sapiens is the binomial nomenclature for modern humans (genus Homo, species sapiens).')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Homo erectus',false),(q,'B','Homo habilis',false),(q,'C','Homo sapiens',true),(q,'D','Homo heidelbergensis',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which of the following diseases is caused by a virus?',s_oau,sub_bio,2022,
  'HIV/AIDS is caused by the Human Immunodeficiency Virus. Malaria is a protozoan, typhoid is bacterial, ringworm is fungal.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Malaria',false),(q,'B','Typhoid',false),(q,'C','HIV/AIDS',true),(q,'D','Ringworm',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Transpiration in plants occurs mainly through the:',s_oau,sub_bio,2023,
  'Stomata (tiny pores, mainly on the underside of leaves) account for about 90% of transpiration in plants.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Roots',false),(q,'B','Stem',false),(q,'C','Stomata',true),(q,'D','Lenticels',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('A food chain always begins with a:',s_oau,sub_bio,2019,
  'All food chains begin with a producer (green plant) that harnesses sunlight energy through photosynthesis.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Carnivore',false),(q,'B','Decomposer',false),(q,'C','Producer',true),(q,'D','Primary consumer',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The part of the eye responsible for controlling the amount of light entering is the:',s_oau,sub_bio,2024,
  'The iris contains circular and radial muscles that control pupil size and therefore light entry into the eye.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Cornea',false),(q,'B','Retina',false),(q,'C','Iris',true),(q,'D','Lens',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('What is the powerhouse of the cell?',s_oau,sub_bio,2021,
  'Mitochondria are called the powerhouse of the cell because they produce ATP via cellular respiration.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Nucleus',false),(q,'B','Chloroplast',false),(q,'C','Mitochondrion',true),(q,'D','Endoplasmic reticulum',false);

  -- =====================================================================
  -- OAU — Chemistry (9 questions)
  -- =====================================================================

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which of the following is an example of a physical change?',s_oau,sub_chem,2022,
  'Melting ice is a physical change — the substance (water) retains its chemical identity; only state changes.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Burning wood',false),(q,'B','Rusting of iron',false),(q,'C','Melting of ice',true),(q,'D','Digestion of food',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Electronegativity increases across a period because:',s_oau,sub_chem,2023,
  'Across a period, nuclear charge increases while atomic radius decreases, so atoms attract bonding electrons more strongly.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Atomic radius increases',false),
  (q,'B','Nuclear charge increases and atomic radius decreases',true),
  (q,'C','The number of electron shells increases',false),
  (q,'D','Metallic character increases',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Balance the equation: H₂ + O₂ → H₂O. The correct coefficients are:',s_oau,sub_chem,2021,
  '2H₂ + O₂ → 2H₂O. Coefficients are 2, 1, 2.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','1, 1, 1',false),(q,'B','2, 1, 2',true),(q,'C','1, 2, 2',false),(q,'D','2, 2, 1',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Molar mass of CaCO₃ is: (Ca=40, C=12, O=16)',s_oau,sub_chem,2020,
  'M(CaCO₃) = 40 + 12 + (3×16) = 40 + 12 + 48 = 100 g/mol.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','84 g/mol',false),(q,'B','100 g/mol',true),(q,'C','116 g/mol',false),(q,'D','68 g/mol',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which of the following is an alkane?',s_oau,sub_chem,2022,
  'Ethane (C₂H₆) is a saturated hydrocarbon (alkane). Ethene and ethyne are unsaturated.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Ethene',false),(q,'B','Ethyne',false),(q,'C','Ethane',true),(q,'D','Benzene',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The process of breaking down large hydrocarbon molecules into smaller ones using heat is called:',s_oau,sub_chem,2023,
  'Cracking (thermal or catalytic) breaks large hydrocarbon chains into smaller, more useful molecules like petrol fractions and ethene.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Polymerisation',false),(q,'B','Cracking',true),(q,'C','Distillation',false),(q,'D','Fermentation',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('A solution that resists changes in pH is called a:',s_oau,sub_chem,2019,
  'A buffer solution resists changes in pH when small amounts of acid or base are added.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Saturated solution',false),(q,'B','Buffer solution',true),(q,'C','Colloidal solution',false),(q,'D','Standard solution',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The oxidation number of oxygen in H₂O is:',s_oau,sub_chem,2024,
  'In most compounds, oxygen has an oxidation number of −2. In H₂O, hydrogen is +1, so oxygen is −2.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','+2',false),(q,'B','0',false),(q,'C','−1',false),(q,'D','−2',true);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which of the following gases turns damp red litmus paper blue?',s_oau,sub_chem,2021,
  'Ammonia (NH₃) is an alkaline gas; it turns damp red litmus paper blue.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Carbon dioxide',false),(q,'B','Sulphur dioxide',false),(q,'C','Ammonia',true),(q,'D','Hydrogen chloride',false);

  -- =====================================================================
  -- OAU — Physics (9 questions)
  -- =====================================================================

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('A stone is dropped from a height of 80 m. How long does it take to reach the ground? (g = 10 m/s²)',s_oau,sub_phys,2023,
  'h = ½gt² → 80 = ½×10×t² → t² = 16 → t = 4 s.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','2 s',false),(q,'B','4 s',true),(q,'C','8 s',false),(q,'D','16 s',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The unit of power is:',s_oau,sub_phys,2022,
  'Power is measured in Watts (W). 1 W = 1 J/s.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Joule',false),(q,'B','Newton',false),(q,'C','Watt',true),(q,'D','Pascal',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Two resistors of 4Ω and 6Ω are connected in parallel. What is their combined resistance?',s_oau,sub_phys,2021,
  '1/R = 1/4 + 1/6 = 3/12 + 2/12 = 5/12 → R = 12/5 = 2.4 Ω.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','10 Ω',false),(q,'B','2.4 Ω',true),(q,'C','5 Ω',false),(q,'D','1.2 Ω',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which of the following is NOT an electromagnetic wave?',s_oau,sub_phys,2020,
  'Sound waves are mechanical waves requiring a medium; they are not electromagnetic. All the others are part of the electromagnetic spectrum.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','X-rays',false),(q,'B','Gamma rays',false),(q,'C','Sound waves',true),(q,'D','Radio waves',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Charles''s law states that at constant pressure, the volume of a gas is:',s_oau,sub_phys,2022,
  'Charles''s law: V ∝ T (at constant pressure), meaning volume is directly proportional to absolute temperature.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Inversely proportional to temperature',false),
  (q,'B','Directly proportional to absolute temperature',true),
  (q,'C','Independent of temperature',false),
  (q,'D','Directly proportional to pressure',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('A concave mirror has a focal length of 10 cm. What is its radius of curvature?',s_oau,sub_phys,2023,
  'Radius of curvature R = 2f = 2 × 10 = 20 cm.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','5 cm',false),(q,'B','10 cm',false),(q,'C','20 cm',true),(q,'D','40 cm',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The gravitational potential energy of an object is given by:',s_oau,sub_phys,2019,
  'GPE = mgh, where m is mass, g is gravitational field strength, and h is height above the reference point.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','½mv²',false),(q,'B','mgh',true),(q,'C','mv',false),(q,'D','Fd',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which principle states that the buoyant force on an object equals the weight of fluid displaced?',s_oau,sub_phys,2024,
  'Archimedes'' principle states that a body submerged in fluid experiences an upthrust equal to the weight of the fluid it displaces.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Pascal''s principle',false),(q,'B','Archimedes'' principle',true),(q,'C','Bernoulli''s principle',false),(q,'D','Newton''s third law',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('What type of lens is used to correct short-sightedness (myopia)?',s_oau,sub_phys,2021,
  'A concave (diverging) lens is used to correct myopia because it diverges light before it enters the eye, moving the focal point back onto the retina.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Convex lens',false),(q,'B','Concave lens',true),(q,'C','Plane mirror',false),(q,'D','Bifocal lens',false);

END;
$$;
