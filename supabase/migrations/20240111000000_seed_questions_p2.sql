-- Seed: UI + UNIBEN questions (part 2 of 3)
DO $$
DECLARE
  s_ui UUID; s_uniben UUID;
  sub_eng UUID; sub_math UUID; sub_bio UUID; sub_chem UUID; sub_phys UUID;
  q UUID;
BEGIN
  SELECT id INTO s_ui     FROM public.schools WHERE abbreviation='UI';
  SELECT id INTO s_uniben FROM public.schools WHERE abbreviation='UNIBEN';

  SELECT id INTO sub_eng  FROM public.subjects WHERE name='English Language';
  SELECT id INTO sub_math FROM public.subjects WHERE name='Mathematics';
  SELECT id INTO sub_bio  FROM public.subjects WHERE name='Biology';
  SELECT id INTO sub_chem FROM public.subjects WHERE name='Chemistry';
  SELECT id INTO sub_phys FROM public.subjects WHERE name='Physics';

  -- =====================================================================
  -- UI — English Language (10 questions)
  -- =====================================================================

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Choose the word that best completes the sentence: The principal spoke in an AUTHORITATIVE manner, leaving no room for ___.',s_ui,sub_eng,2023,
  '"Debate" fits contextually — an authoritative manner leaves no room for debate or challenge.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Agreement',false),(q,'B','Debate',true),(q,'C','Praise',false),(q,'D','Study',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The figure of speech in "He has a heart of stone" is:',s_ui,sub_eng,2022,
  'Comparing the heart to stone without using "like" or "as" is a metaphor.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Simile',false),(q,'B','Metaphor',true),(q,'C','Hyperbole',false),(q,'D','Oxymoron',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which of the following sentences uses the passive voice?',s_ui,sub_eng,2021,
  '"The book was written by the professor" has the subject receiving the action — passive voice.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','The professor wrote the book',false),
  (q,'B','The book was written by the professor',true),
  (q,'C','The professor is writing the book',false),
  (q,'D','The professor had written the book',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The word AMELIORATE means:',s_ui,sub_eng,2020,
  'To ameliorate means to make something bad or unsatisfactory better; to improve.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','To worsen',false),(q,'B','To improve',true),(q,'C','To calculate',false),(q,'D','To destroy',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Identify the type of clause in the sentence: "Although it was raining, the match continued."',s_ui,sub_eng,2022,
  '"Although it was raining" is an adverbial clause of concession modifying the main clause.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Relative clause',false),(q,'B','Noun clause',false),(q,'C','Adverbial clause',true),(q,'D','Independent clause',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Choose the option that is most NEARLY OPPOSITE in meaning to FRUGAL.',s_ui,sub_eng,2023,
  'Frugal means careful about spending money. Its antonym is "extravagant" — spending money freely.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Economical',false),(q,'B','Thrifty',false),(q,'C','Extravagant',true),(q,'D','Careful',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which of the following words has the stress on the second syllable?',s_ui,sub_eng,2024,
  '"reCORD" (verb) has stress on the second syllable, while "REcord" (noun) has stress on the first.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','REcord (noun)',false),(q,'B','reCORD (verb)',true),(q,'C','PREsent (noun)',false),(q,'D','INsult (noun)',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The literary device in "Peter Piper picked a peck of pickled peppers" is:',s_ui,sub_eng,2019,
  'The repetition of the initial consonant sound /p/ is alliteration.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Assonance',false),(q,'B','Alliteration',true),(q,'C','Onomatopoeia',false),(q,'D','Rhyme',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The word SYCOPHANT refers to a person who:',s_ui,sub_eng,2021,
  'A sycophant is a person who acts obsequiously toward someone in order to gain advantage; a flatterer.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Tells the truth always',false),
  (q,'B','Flatters to gain favour',true),
  (q,'C','Works very hard',false),
  (q,'D','Is extremely intelligent',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('In the sentence "Ade gave the book to Tunde", what is "the book"?',s_ui,sub_eng,2022,
  '"The book" is the direct object — the thing directly acted upon by the verb "gave".')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Subject',false),(q,'B','Indirect object',false),(q,'C','Direct object',true),(q,'D','Complement',false);

  -- =====================================================================
  -- UI — Mathematics (10 questions)
  -- =====================================================================

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('If f(x) = 3x² − 2x + 1, find f(2).',s_ui,sub_math,2023,
  'f(2) = 3(4) − 2(2) + 1 = 12 − 4 + 1 = 9.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','5',false),(q,'B','9',true),(q,'C','13',false),(q,'D','7',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The angle subtended by a semicircle at the centre is:',s_ui,sub_math,2022,
  'A semicircle subtends an angle of 180° at the centre. The angle at the circumference would be 90°.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','90°',false),(q,'B','180°',true),(q,'C','270°',false),(q,'D','360°',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Solve: |2x − 4| = 6',s_ui,sub_math,2021,
  '2x−4 = 6 → x=5; or 2x−4 = −6 → x=−1.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','x=5 only',false),(q,'B','x=−1 only',false),(q,'C','x=5 or x=−1',true),(q,'D','x=1 or x=5',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('In a geometric progression, the first term is 2 and the common ratio is 3. What is the 4th term?',s_ui,sub_math,2020,
  'T₄ = ar³ = 2 × 3³ = 2 × 27 = 54.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','18',false),(q,'B','54',true),(q,'C','162',false),(q,'D','6',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Two angles of a triangle are 65° and 70°. What is the third angle?',s_ui,sub_math,2022,
  'Sum of angles in a triangle = 180°. Third angle = 180 − 65 − 70 = 45°.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','35°',false),(q,'B','45°',true),(q,'C','55°',false),(q,'D','40°',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Factorise: 6x² + 7x − 3',s_ui,sub_math,2023,
  '6x² + 7x − 3 = (3x − 1)(2x + 3). Check: 6x² + 9x − 2x − 3 = 6x² + 7x − 3. ✓')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','(2x+1)(3x−3)',false),(q,'B','(3x−1)(2x+3)',true),(q,'C','(6x−1)(x+3)',false),(q,'D','(2x−3)(3x+1)',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Express 0.000045 in standard form.',s_ui,sub_math,2019,
  '0.000045 = 4.5 × 10⁻⁵.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','4.5 × 10⁻⁴',false),(q,'B','4.5 × 10⁻⁵',true),(q,'C','45 × 10⁻⁶',false),(q,'D','0.45 × 10⁻⁴',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The volume of a cylinder with radius 5 cm and height 10 cm is: (π ≈ 3.14)',s_ui,sub_math,2024,
  'V = πr²h = 3.14 × 25 × 10 = 785 cm³.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','157 cm³',false),(q,'B','314 cm³',false),(q,'C','785 cm³',true),(q,'D','1570 cm³',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('What is the simple interest on ₦5,000 at 8% per annum for 3 years?',s_ui,sub_math,2021,
  'SI = PRT/100 = 5000 × 8 × 3 / 100 = ₦1,200.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','₦800',false),(q,'B','₦1,200',true),(q,'C','₦2,000',false),(q,'D','₦400',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('If tan θ = 3/4, find sin θ (assuming θ is acute).',s_ui,sub_math,2022,
  'In a right triangle with opposite=3, adjacent=4, hypotenuse=√(9+16)=5. sin θ = 3/5.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','4/5',false),(q,'B','3/5',true),(q,'C','3/4',false),(q,'D','4/3',false);

  -- =====================================================================
  -- UI — Biology (9 questions)
  -- =====================================================================

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which of the following is a characteristic of living things?',s_ui,sub_bio,2023,
  'Reproduction is a fundamental characteristic of all living things. Non-living things may show some other characteristics but not reproduction.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Rusting',false),(q,'B','Burning',false),(q,'C','Reproduction',true),(q,'D','Crystallisation',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The carrier of malaria in humans is:',s_ui,sub_bio,2022,
  'The female Anopheles mosquito transmits the Plasmodium parasite that causes malaria.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Culex mosquito',false),(q,'B','Female Anopheles mosquito',true),(q,'C','Housefly',false),(q,'D','Tsetse fly',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The instrument used to measure blood pressure is called:',s_ui,sub_bio,2021,
  'A sphygmomanometer is the instrument used to measure arterial blood pressure.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Stethoscope',false),(q,'B','Thermometer',false),(q,'C','Sphygmomanometer',true),(q,'D','Spirometer',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which of the following is NOT a type of white blood cell?',s_ui,sub_bio,2020,
  'Erythrocytes are red blood cells, not white blood cells. Neutrophils, monocytes, and lymphocytes are all white blood cells (leucocytes).')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Neutrophil',false),(q,'B','Monocyte',false),(q,'C','Erythrocyte',true),(q,'D','Lymphocyte',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The process by which organisms maintain a stable internal environment is:',s_ui,sub_bio,2022,
  'Homeostasis is the process by which organisms maintain a relatively stable internal environment despite external changes.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Metabolism',false),(q,'B','Homeostasis',true),(q,'C','Respiration',false),(q,'D','Excretion',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('In a cross between two heterozygous tall plants (Tt × Tt), what is the expected ratio of tall to short offspring?',s_ui,sub_bio,2023,
  'Tt × Tt gives TT : Tt : tt = 1:2:1. Tall (TT + Tt) : short (tt) = 3:1.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','1:1',false),(q,'B','3:1',true),(q,'C','2:1',false),(q,'D','1:3',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which of the following is the correct order of taxonomy from broadest to most specific?',s_ui,sub_bio,2019,
  'Kingdom → Phylum → Class → Order → Family → Genus → Species is the standard taxonomic hierarchy.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Species, Genus, Family, Order, Class, Phylum, Kingdom',false),
  (q,'B','Kingdom, Phylum, Class, Order, Family, Genus, Species',true),
  (q,'C','Kingdom, Class, Phylum, Order, Genus, Family, Species',false),
  (q,'D','Phylum, Kingdom, Class, Order, Family, Species, Genus',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The hormone responsible for regulating blood glucose levels is:',s_ui,sub_bio,2024,
  'Insulin, produced by the beta cells of the pancreas, lowers blood glucose levels by promoting uptake of glucose into cells.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Adrenaline',false),(q,'B','Thyroxine',false),(q,'C','Insulin',true),(q,'D','Oestrogen',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which of the following is the correct description of a saprophyte?',s_ui,sub_bio,2021,
  'Saprophytes obtain nutrition by feeding on dead or decaying organic matter, breaking it down externally.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','An organism that feeds on living hosts',false),
  (q,'B','An organism that makes its own food',false),
  (q,'C','An organism that feeds on dead organic matter',true),
  (q,'D','An organism that stores food in roots',false);

  -- =====================================================================
  -- UI — Chemistry (9 questions)
  -- =====================================================================

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which of the following elements is a halogen?',s_ui,sub_chem,2022,
  'Chlorine (Cl) is a halogen in Group VIIA. Sodium is an alkali metal, calcium is an alkaline earth metal, potassium is an alkali metal.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Sodium',false),(q,'B','Calcium',false),(q,'C','Chlorine',true),(q,'D','Potassium',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('What volume of gas at STP is occupied by 2 moles of oxygen? (Molar volume at STP = 22.4 L/mol)',s_ui,sub_chem,2023,
  '2 mol × 22.4 L/mol = 44.8 L.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','11.2 L',false),(q,'B','22.4 L',false),(q,'C','44.8 L',true),(q,'D','89.6 L',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The reaction between an acid and a base to form salt and water is called:',s_ui,sub_chem,2021,
  'Neutralisation is the reaction between an acid and a base producing a salt and water.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Oxidation',false),(q,'B','Reduction',false),(q,'C','Neutralisation',true),(q,'D','Combustion',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The electronic configuration of sodium (atomic number 11) is:',s_ui,sub_chem,2020,
  'Na (Z=11): 2, 8, 1. First shell: 2 electrons; second shell: 8; third shell: 1.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','2, 9',false),(q,'B','2, 8, 1',true),(q,'C','3, 8',false),(q,'D','2, 8, 3',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which allotrope of carbon is used as a lubricant?',s_ui,sub_chem,2022,
  'Graphite is used as a lubricant because its layered structure allows layers to slide over each other easily.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Diamond',false),(q,'B','Graphite',true),(q,'C','Fullerene',false),(q,'D','Charcoal',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('What is the mass of 0.5 moles of water? (H=1, O=16)',s_ui,sub_chem,2023,
  'M(H₂O) = 2+16 = 18 g/mol. 0.5 mol × 18 = 9 g.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','36 g',false),(q,'B','18 g',false),(q,'C','9 g',true),(q,'D','4.5 g',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which of the following is a noble gas?',s_ui,sub_chem,2019,
  'Argon (Ar) is a noble gas in Group 0/18. Nitrogen and oxygen are diatomic gases; chlorine is a halogen.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Nitrogen',false),(q,'B','Oxygen',false),(q,'C','Chlorine',false),(q,'D','Argon',true);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Crude oil is separated into its fractions by:',s_ui,sub_chem,2024,
  'Crude oil is separated by fractional distillation, exploiting differences in boiling points of its components.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Filtration',false),(q,'B','Crystallisation',false),(q,'C','Fractional distillation',true),(q,'D','Chromatography',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('In a redox reaction, the species that loses electrons is:',s_ui,sub_chem,2021,
  'The species that loses electrons is oxidised, and acts as the reducing agent.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Reduced',false),(q,'B','The oxidising agent',false),(q,'C','Oxidised / the reducing agent',true),(q,'D','The catalyst',false);

  -- =====================================================================
  -- UI — Physics (9 questions)
  -- =====================================================================

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The period of a simple pendulum depends on:',s_ui,sub_phys,2023,
  'T = 2π√(L/g). The period depends on the length of the pendulum and gravitational acceleration — NOT on mass or amplitude (for small angles).')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Mass of the bob',false),
  (q,'B','Length of the pendulum and g',true),
  (q,'C','Amplitude of oscillation',false),
  (q,'D','Material of the string',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The efficiency of a machine is 80% and the load is 400 N. If the effort is 100 N, what is the mechanical advantage?',s_ui,sub_phys,2022,
  'MA = Load/Effort = 400/100 = 4.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','2',false),(q,'B','4',true),(q,'C','5',false),(q,'D','8',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which of the following has the highest frequency in the electromagnetic spectrum?',s_ui,sub_phys,2021,
  'Gamma rays have the highest frequency (and thus highest energy) in the electromagnetic spectrum.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Radio waves',false),(q,'B','Visible light',false),(q,'C','X-rays',false),(q,'D','Gamma rays',true);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Boyle''s law states that at constant temperature, the pressure of a gas is:',s_ui,sub_phys,2020,
  'Boyle''s law: P ∝ 1/V at constant temperature (PV = constant).')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Directly proportional to volume',false),
  (q,'B','Inversely proportional to volume',true),
  (q,'C','Equal to the volume',false),
  (q,'D','Independent of volume',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('What is the relationship between frequency (f) and wavelength (λ) for a wave with speed v?',s_ui,sub_phys,2022,
  'The wave equation: v = fλ, so f = v/λ. Frequency and wavelength are inversely proportional at constant speed.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','f = λ/v',false),(q,'B','f = vλ',false),(q,'C','f = v/λ',true),(q,'D','f = v − λ',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('A positively charged rod is brought near an uncharged sphere. The near end of the sphere acquires a ___ charge.',s_ui,sub_phys,2023,
  'By electrostatic induction, the near end is attracted to the rod and acquires a negative charge (electrons migrate towards the rod).')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Positive',false),(q,'B','Negative',true),(q,'C','Neutral',false),(q,'D','No charge',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('What is the kinetic energy of a 4 kg object moving at 3 m/s?',s_ui,sub_phys,2019,
  'KE = ½mv² = ½ × 4 × 9 = 18 J.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','6 J',false),(q,'B','12 J',false),(q,'C','18 J',true),(q,'D','36 J',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The apparent depth of an object seen through glass is less than its real depth because of:',s_ui,sub_phys,2024,
  'Refraction at the glass-air interface bends the light, making the object appear closer (shallower) than it actually is.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Reflection',false),(q,'B','Refraction',true),(q,'C','Diffraction',false),(q,'D','Polarisation',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which of Newton''s laws of motion explains why a rocket propels forward?',s_ui,sub_phys,2021,
  'Newton''s third law: for every action there is an equal and opposite reaction. Gas expelled backward → rocket moves forward.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','First law',false),(q,'B','Second law',false),(q,'C','Third law',true),(q,'D','Law of gravitation',false);

  -- =====================================================================
  -- UNIBEN — English Language (10 questions)
  -- =====================================================================

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Choose the word closest in meaning to VOCIFEROUS.',s_uniben,sub_eng,2023,
  'Vociferous means making a loud, emphatic, or forceful protest. "Clamorous" is the closest synonym.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Quiet',false),(q,'B','Clamorous',true),(q,'C','Gentle',false),(q,'D','Fearful',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Identify the sentence with a dangling modifier.',s_uniben,sub_eng,2022,
  '"Running quickly, the bus was caught" implies the bus was running, which is a dangling modifier error.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Running quickly, she caught the bus',false),
  (q,'B','Running quickly, the bus was caught',true),
  (q,'C','She ran quickly and caught the bus',false),
  (q,'D','The bus was caught by her after she ran quickly',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The word IMPECUNIOUS means:',s_uniben,sub_eng,2021,
  'Impecunious means having little or no money; poor.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Very wealthy',false),(q,'B','Having no money',true),(q,'C','Very intelligent',false),(q,'D','Extremely rude',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Choose the option that correctly fills the gap: Neither the teacher nor the students ___ present.',s_uniben,sub_eng,2020,
  'With "neither...nor", the verb agrees with the subject closest to it ("students" — plural), so "were" is correct.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','was',false),(q,'B','were',true),(q,'C','has been',false),(q,'D','is',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The expression "to spill the beans" means:',s_uniben,sub_eng,2022,
  '"Spill the beans" means to reveal secret or confidential information inadvertently.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','To make a mess',false),(q,'B','To reveal a secret',true),(q,'C','To cook a meal',false),(q,'D','To waste resources',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('In the phrase "a flock of birds", the word FLOCK is a:',s_uniben,sub_eng,2023,
  '"Flock" is a collective noun used to describe a group of birds.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Proper noun',false),(q,'B','Abstract noun',false),(q,'C','Collective noun',true),(q,'D','Common noun',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The word ENERVATE means to:',s_uniben,sub_eng,2024,
  'To enervate means to weaken or drain of energy or vitality.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Strengthen',false),(q,'B','Energise',false),(q,'C','Weaken',true),(q,'D','Irritate',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which of the following is an example of onomatopoeia?',s_uniben,sub_eng,2019,
  'Onomatopoeia refers to words that imitate natural sounds. "Buzz" imitates the sound a bee makes.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Beautiful flower',false),(q,'B','Heavy rain',false),(q,'C','The bee buzzed',true),(q,'D','Bright sunshine',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Choose the correctly punctuated sentence.',s_uniben,sub_eng,2021,
  'A comma must follow an introductory phrase. "After the lecture, the students went home" is correctly punctuated.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','After the lecture the students went home',false),
  (q,'B','After the lecture, the students went home',true),
  (q,'C','After, the lecture, the students went home',false),
  (q,'D','After the lecture the students, went home',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The word OSTENTATIOUS most nearly means:',s_uniben,sub_eng,2022,
  'Ostentatious means characterised by pretentious display; showy. "Flamboyant" is the closest option.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Humble',false),(q,'B','Secretive',false),(q,'C','Flamboyant',true),(q,'D','Timid',false);

  -- =====================================================================
  -- UNIBEN — Mathematics (10 questions)
  -- =====================================================================

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Solve the simultaneous equations: x + y = 7 and x − y = 3.',s_uniben,sub_math,2023,
  'Adding: 2x=10 → x=5. Substituting: y=7−5=2.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','x=3, y=4',false),(q,'B','x=5, y=2',true),(q,'C','x=4, y=3',false),(q,'D','x=6, y=1',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('What is the range of the data: 4, 7, 2, 9, 5, 11, 3?',s_uniben,sub_math,2022,
  'Range = maximum − minimum = 11 − 2 = 9.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','7',false),(q,'B','9',true),(q,'C','11',false),(q,'D','4',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('If the exterior angle of a regular polygon is 45°, how many sides does it have?',s_uniben,sub_math,2021,
  'Number of sides = 360°/exterior angle = 360/45 = 8 sides.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','6',false),(q,'B','7',false),(q,'C','8',true),(q,'D','9',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('What is the sum of the interior angles of a hexagon?',s_uniben,sub_math,2020,
  'Sum = (n−2) × 180° = (6−2) × 180° = 4 × 180° = 720°.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','540°',false),(q,'B','720°',true),(q,'C','900°',false),(q,'D','1080°',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Find the value of x: 5^(x+1) = 125',s_uniben,sub_math,2022,
  '125 = 5³, so 5^(x+1) = 5³ → x+1 = 3 → x = 2.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','1',false),(q,'B','2',true),(q,'C','3',false),(q,'D','4',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('A woman earns ₦80,000 per month. She saves 20% of her income. How much does she save per month?',s_uniben,sub_math,2023,
  '20% of 80,000 = 0.20 × 80,000 = ₦16,000.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','₦12,000',false),(q,'B','₦16,000',true),(q,'C','₦20,000',false),(q,'D','₦8,000',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The length of the hypotenuse of a right triangle with legs 6 cm and 8 cm is:',s_uniben,sub_math,2019,
  'By Pythagoras: h = √(6² + 8²) = √(36+64) = √100 = 10 cm.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','12 cm',false),(q,'B','10 cm',true),(q,'C','14 cm',false),(q,'D','7 cm',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The mode of 3, 5, 7, 5, 9, 5, 3, 7 is:',s_uniben,sub_math,2024,
  'The mode is the most frequently occurring value. 5 appears 3 times, which is more than any other value.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','3',false),(q,'B','7',false),(q,'C','5',true),(q,'D','9',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Simplify: (x²y³)² ÷ (xy)³',s_uniben,sub_math,2021,
  '(x²y³)² = x⁴y⁶. (xy)³ = x³y³. x⁴y⁶ ÷ x³y³ = x^(4−3) y^(6−3) = xy³.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','x²y⁶',false),(q,'B','xy³',true),(q,'C','x³y²',false),(q,'D','xy²',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Convert 110₂ (binary) to decimal.',s_uniben,sub_math,2022,
  '110₂ = 1×2² + 1×2¹ + 0×2⁰ = 4 + 2 + 0 = 6.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','3',false),(q,'B','4',false),(q,'C','6',true),(q,'D','12',false);

  -- =====================================================================
  -- UNIBEN — Biology (9 questions)
  -- =====================================================================

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which of the following is a vestigial organ in humans?',s_uniben,sub_bio,2023,
  'The appendix is considered a vestigial organ in humans — it has lost most of its original function through evolution.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Heart',false),(q,'B','Kidney',false),(q,'C','Appendix',true),(q,'D','Liver',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The process of breaking down food into small absorbable molecules is called:',s_uniben,sub_bio,2022,
  'Digestion is the process of chemically and mechanically breaking down food into smaller molecules that can be absorbed into the bloodstream.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Absorption',false),(q,'B','Assimilation',false),(q,'C','Digestion',true),(q,'D','Egestion',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The protein in red blood cells that carries oxygen is:',s_uniben,sub_bio,2021,
  'Haemoglobin is the iron-containing protein in red blood cells that binds and transports oxygen.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Albumin',false),(q,'B','Globulin',false),(q,'C','Haemoglobin',true),(q,'D','Fibrinogen',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which of the following organisms reproduces by budding?',s_uniben,sub_bio,2020,
  'Yeast (Saccharomyces) reproduces asexually by budding, where a small outgrowth develops into a new organism.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Amoeba',false),(q,'B','Yeast',true),(q,'C','Spirogyra',false),(q,'D','Paramecium',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('What is the role of decomposers in an ecosystem?',s_uniben,sub_bio,2022,
  'Decomposers break down dead organic matter and return nutrients to the soil, completing the nutrient cycle.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Produce food by photosynthesis',false),
  (q,'B','Break down dead organic matter and recycle nutrients',true),
  (q,'C','Feed on living organisms',false),
  (q,'D','Convert nitrogen gas to nitrates',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The four chambers of the human heart are:',s_uniben,sub_bio,2023,
  'The human heart has four chambers: right atrium, right ventricle, left atrium, and left ventricle.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Two atria and two ventricles',true),
  (q,'B','Two atria and one ventricle',false),
  (q,'C','One atrium and three ventricles',false),
  (q,'D','Three atria and one ventricle',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which gas is used in photosynthesis and released in respiration?',s_uniben,sub_bio,2019,
  'Carbon dioxide (CO₂) is absorbed during photosynthesis to make glucose, and is released during cellular respiration as a waste product.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Oxygen',false),(q,'B','Nitrogen',false),(q,'C','Carbon dioxide',true),(q,'D','Hydrogen',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The larva of a housefly is called a:',s_uniben,sub_bio,2024,
  'The larva of the housefly (Musca domestica) is called a maggot.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Caterpillar',false),(q,'B','Grub',false),(q,'C','Maggot',true),(q,'D','Nymph',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which structure in a plant cell is NOT found in an animal cell?',s_uniben,sub_bio,2021,
  'The cell wall (made of cellulose) is present in plant cells but absent in animal cells.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Nucleus',false),(q,'B','Mitochondrion',false),(q,'C','Cell wall',true),(q,'D','Ribosome',false);

  -- =====================================================================
  -- UNIBEN — Chemistry (9 questions)
  -- =====================================================================

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which of the following is a property of ionic compounds?',s_uniben,sub_chem,2022,
  'Ionic compounds have high melting points due to strong electrostatic forces between ions. They also conduct electricity when molten or in solution.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Low melting point',false),
  (q,'B','High melting point',true),
  (q,'C','Poor solubility in water',false),
  (q,'D','Conduct electricity in solid state',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('How many moles of NaOH are in 80 g? (Na=23, O=16, H=1)',s_uniben,sub_chem,2023,
  'M(NaOH) = 23+16+1 = 40 g/mol. Moles = 80/40 = 2 mol.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','1 mol',false),(q,'B','2 mol',true),(q,'C','4 mol',false),(q,'D','0.5 mol',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('During electrolysis of dilute H₂SO₄, which gas is produced at the cathode?',s_uniben,sub_chem,2021,
  'At the cathode (negative electrode), H⁺ ions are reduced to form hydrogen gas: 2H⁺ + 2e⁻ → H₂.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Oxygen',false),(q,'B','Sulphur dioxide',false),(q,'C','Hydrogen',true),(q,'D','Chlorine',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('What is the IUPAC name for CH₃CH₂OH?',s_uniben,sub_chem,2020,
  'CH₃CH₂OH has 2 carbons and an -OH group, making it ethanol (the functional group -OH gives the suffix -ol).')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Methanol',false),(q,'B','Propanol',false),(q,'C','Ethanol',true),(q,'D','Butanol',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The rate of a chemical reaction is NOT affected by:',s_uniben,sub_chem,2022,
  'The colour of the reactants has no effect on reaction rate. Rate is affected by concentration, temperature, surface area, and catalysts.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Temperature',false),(q,'B','Concentration',false),(q,'C','Colour of reactants',true),(q,'D','Catalyst',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which of the following is used to test for starch?',s_uniben,sub_chem,2023,
  'Iodine solution turns blue-black in the presence of starch, making it the standard test reagent for starch.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Benedict''s solution',false),(q,'B','Fehling''s solution',false),(q,'C','Iodine solution',true),(q,'D','Biuret reagent',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Calcium carbonate dissolves in excess hydrochloric acid to produce:',s_uniben,sub_chem,2019,
  'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂. Products are calcium chloride, water, and carbon dioxide.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','CaCl₂, H₂O, and SO₂',false),
  (q,'B','CaCl₂, H₂O, and CO₂',true),
  (q,'C','Ca(OH)₂ and CO₂',false),
  (q,'D','CaO and HCl',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Dalton''s atomic theory states that atoms of the same element are:',s_uniben,sub_chem,2024,
  'Dalton proposed that atoms of the same element are identical in mass and properties (though we now know isotopes exist).')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Different in mass',false),(q,'B','Identical in mass and properties',true),(q,'C','Divisible',false),(q,'D','Made of protons only',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Vinegar is a dilute solution of:',s_uniben,sub_chem,2021,
  'Vinegar is a dilute aqueous solution of ethanoic acid (acetic acid, CH₃COOH).')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Sulphuric acid',false),(q,'B','Hydrochloric acid',false),(q,'C','Ethanoic acid',true),(q,'D','Nitric acid',false);

  -- =====================================================================
  -- UNIBEN — Physics (9 questions)
  -- =====================================================================

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('What is the pressure at the base of a column of water 10 m deep? (ρ=1000 kg/m³, g=10 m/s²)',s_uniben,sub_phys,2023,
  'P = ρgh = 1000 × 10 × 10 = 100,000 Pa = 10⁵ Pa.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','1,000 Pa',false),(q,'B','10,000 Pa',false),(q,'C','100,000 Pa',true),(q,'D','1,000,000 Pa',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The half-life of a radioactive substance is 10 years. What fraction remains after 30 years?',s_uniben,sub_phys,2022,
  'After 3 half-lives (30 years): (½)³ = 1/8 of the original remains.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','1/4',false),(q,'B','1/8',true),(q,'C','1/16',false),(q,'D','1/2',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The phenomenon in which two waves superpose to form a resultant wave is called:',s_uniben,sub_phys,2021,
  'Interference is the superposition of two or more waves to form a resultant wave (constructive or destructive).')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Diffraction',false),(q,'B','Refraction',false),(q,'C','Interference',true),(q,'D','Polarisation',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('A 60 W bulb is left on for 5 hours. How much electrical energy does it consume?',s_uniben,sub_phys,2020,
  'E = P × t = 60 W × (5 × 3600 s) = 60 × 18000 = 1,080,000 J = 1.08 × 10⁶ J. In kWh: 60W × 5h = 300 Wh = 0.3 kWh.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','300 J',false),(q,'B','1,080,000 J',true),(q,'C','12,000 J',false),(q,'D','60,000 J',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The Doppler effect is observed when:',s_uniben,sub_phys,2022,
  'The Doppler effect occurs when there is relative motion between a wave source and observer, causing a shift in observed frequency.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Light is split into a spectrum',false),
  (q,'B','A source of waves and an observer are in relative motion',true),
  (q,'C','Waves pass through a narrow slit',false),
  (q,'D','Sound is reflected off a surface',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which of the following is a scalar quantity?',s_uniben,sub_phys,2023,
  'Temperature is a scalar — it has magnitude only. Velocity, force, and displacement are vectors (magnitude and direction).')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Velocity',false),(q,'B','Force',false),(q,'C','Temperature',true),(q,'D','Displacement',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('What is the SI unit of frequency?',s_uniben,sub_phys,2019,
  'The SI unit of frequency is the Hertz (Hz), equal to one cycle per second.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Newton',false),(q,'B','Pascal',false),(q,'C','Hertz',true),(q,'D','Joule',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('A ball thrown vertically upward returns to the same level. If the initial speed is 20 m/s, how high does it reach? (g = 10 m/s²)',s_uniben,sub_phys,2024,
  'v² = u² − 2gh. At max height v=0: 0 = 400 − 2×10×h → h = 400/20 = 20 m.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','10 m',false),(q,'B','20 m',true),(q,'C','40 m',false),(q,'D','200 m',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The critical angle is the angle of incidence in the denser medium at which the angle of refraction is:',s_uniben,sub_phys,2021,
  'The critical angle is when the angle of refraction in the less dense medium reaches exactly 90°, after which total internal reflection occurs.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','0°',false),(q,'B','45°',false),(q,'C','90°',true),(q,'D','180°',false);

END;
$$;
