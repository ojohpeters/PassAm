-- Seed: UNIPORT + AFIT questions (part 3 of 3)
DO $$
DECLARE
  s_uniport UUID; s_afit UUID;
  sub_eng UUID; sub_math UUID; sub_bio UUID; sub_chem UUID; sub_phys UUID;
  q UUID;
BEGIN
  SELECT id INTO s_uniport FROM public.schools WHERE abbreviation='UNIPORT';
  SELECT id INTO s_afit    FROM public.schools WHERE abbreviation='AFIT';

  SELECT id INTO sub_eng  FROM public.subjects WHERE name='English Language';
  SELECT id INTO sub_math FROM public.subjects WHERE name='Mathematics';
  SELECT id INTO sub_bio  FROM public.subjects WHERE name='Biology';
  SELECT id INTO sub_chem FROM public.subjects WHERE name='Chemistry';
  SELECT id INTO sub_phys FROM public.subjects WHERE name='Physics';

  -- =====================================================================
  -- UNIPORT — English Language (10 questions)
  -- =====================================================================

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The word GREGARIOUS means:',s_uniport,sub_eng,2023,
  'Gregarious means fond of company; sociable.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Solitary',false),(q,'B','Hostile',false),(q,'C','Sociable',true),(q,'D','Dangerous',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Choose the option that best completes the sentence: By the time they arrived, the food ___ eaten.',s_uniport,sub_eng,2022,
  'The past perfect passive "had been eaten" shows the food was eaten before the people arrived.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','was',false),(q,'B','has been',false),(q,'C','had been',true),(q,'D','would be',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The figure of speech in "The mountains sang and the valleys clapped" is:',s_uniport,sub_eng,2021,
  'Giving inanimate mountains and valleys human actions (singing and clapping) is personification.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Metaphor',false),(q,'B','Hyperbole',false),(q,'C','Personification',true),(q,'D','Synecdoche',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which of the following is NOT a conjunction?',s_uniport,sub_eng,2020,
  '"Quickly" is an adverb, not a conjunction. But, although, and because are all conjunctions.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','But',false),(q,'B','Although',false),(q,'C','Quickly',true),(q,'D','Because',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The word DIFFIDENT most nearly means:',s_uniport,sub_eng,2022,
  'Diffident means modest or shy due to lack of self-confidence.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Confident',false),(q,'B','Shy',true),(q,'C','Arrogant',false),(q,'D','Angry',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Identify the type of sentence: "Shut the door!"',s_uniport,sub_eng,2023,
  'A sentence that gives a command or instruction is an imperative sentence.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Declarative',false),(q,'B','Interrogative',false),(q,'C','Imperative',true),(q,'D','Exclamatory',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('What is the meaning of the phrase "once in a blue moon"?',s_uniport,sub_eng,2024,
  '"Once in a blue moon" means very rarely or hardly ever.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Every month',false),(q,'B','During a full moon',false),(q,'C','Very rarely',true),(q,'D','Every blue day',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('In the sentence "He gave her a gift", the pronoun HER functions as:',s_uniport,sub_eng,2019,
  '"Her" is the indirect object — it indicates to whom the gift was given.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Subject',false),(q,'B','Direct object',false),(q,'C','Indirect object',true),(q,'D','Predicate',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The word METICULOUS most nearly means:',s_uniport,sub_eng,2021,
  'Meticulous means showing great attention to detail; very careful and precise.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Careless',false),(q,'B','Thorough',true),(q,'C','Reckless',false),(q,'D','Lazy',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which of the following sentences uses "affect" correctly?',s_uniport,sub_eng,2022,
  '"Affect" is a verb meaning to influence. "The rain affected the match" uses it correctly as a verb.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','The affect of the drug was immediate',false),
  (q,'B','The rain affected the match',true),
  (q,'C','The affect was clearly visible',false),
  (q,'D','He noted the affect on the report',false);

  -- =====================================================================
  -- UNIPORT — Mathematics (10 questions)
  -- =====================================================================

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('If U = {1,2,3,4,5,6,7,8} and A = {2,4,6,8}, find A'' (complement of A).',s_uniport,sub_math,2023,
  'A'' consists of all elements in U not in A: {1, 3, 5, 7}.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','{1,2,3}',false),(q,'B','{1,3,5,7}',true),(q,'C','{3,5,7}',false),(q,'D','{1,3,5}',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('What is the next term in the sequence 1, 4, 9, 16, 25, ___?',s_uniport,sub_math,2022,
  'The sequence is perfect squares: 1², 2², 3², 4², 5², 6² = 36.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','30',false),(q,'B','36',true),(q,'C','32',false),(q,'D','49',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Solve for y: 2(y − 3) + 4 = 10',s_uniport,sub_math,2021,
  '2y − 6 + 4 = 10 → 2y − 2 = 10 → 2y = 12 → y = 6.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','4',false),(q,'B','5',false),(q,'C','6',true),(q,'D','7',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Find the HCF of 24 and 36.',s_uniport,sub_math,2020,
  'Factors of 24: 1,2,3,4,6,8,12,24. Factors of 36: 1,2,3,4,6,9,12,18,36. HCF = 12.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','6',false),(q,'B','12',true),(q,'C','18',false),(q,'D','72',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which of the following is a prime number?',s_uniport,sub_math,2022,
  '97 is a prime number — it has no factors other than 1 and itself. 91=7×13, 87=3×29, 81=3⁴.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','81',false),(q,'B','87',false),(q,'C','91',false),(q,'D','97',true);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Simplify: (3/4 + 1/2) × 8',s_uniport,sub_math,2023,
  '3/4 + 1/2 = 3/4 + 2/4 = 5/4. Then 5/4 × 8 = 10.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','8',false),(q,'B','10',true),(q,'C','12',false),(q,'D','6',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('A train travels 360 km in 4 hours. What is its average speed in km/h?',s_uniport,sub_math,2019,
  'Speed = distance/time = 360/4 = 90 km/h.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','60 km/h',false),(q,'B','90 km/h',true),(q,'C','120 km/h',false),(q,'D','80 km/h',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The sum of an arithmetic series with first term 3, common difference 2, and 10 terms is:',s_uniport,sub_math,2024,
  'S = n/2 × [2a + (n−1)d] = 10/2 × [2(3) + 9(2)] = 5 × [6+18] = 5 × 24 = 120.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','100',false),(q,'B','120',true),(q,'C','110',false),(q,'D','130',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('If two angles of a triangle are each 45°, what type of triangle is it?',s_uniport,sub_math,2021,
  'Two 45° angles → third angle = 180−45−45 = 90°. A triangle with a 90° angle is right-angled. With two equal legs it is also isosceles: a right isosceles triangle.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Equilateral',false),(q,'B','Scalene',false),(q,'C','Right isosceles',true),(q,'D','Obtuse',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Express 72 as a product of its prime factors.',s_uniport,sub_math,2022,
  '72 = 8 × 9 = 2³ × 3². As a product of prime factors: 2³ × 3².')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','2² × 3³',false),(q,'B','2³ × 3²',true),(q,'C','2⁴ × 3',false),(q,'D','2 × 3⁴',false);

  -- =====================================================================
  -- UNIPORT — Biology (9 questions)
  -- =====================================================================

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('What type of reproduction is shown by Hydra?',s_uniport,sub_bio,2023,
  'Hydra reproduces asexually by budding, where a small outgrowth forms on the parent and eventually breaks off.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Binary fission',false),(q,'B','Sporulation',false),(q,'C','Budding',true),(q,'D','Fragmentation',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The organ responsible for secreting bile in the human body is:',s_uniport,sub_bio,2022,
  'Bile is produced by the liver and stored in the gallbladder. The liver is the secreting organ.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Pancreas',false),(q,'B','Stomach',false),(q,'C','Liver',true),(q,'D','Small intestine',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The cell membrane is described as "selectively permeable" because:',s_uniport,sub_bio,2021,
  'The cell membrane allows some substances to pass through freely while restricting or preventing the passage of others — hence selectively permeable.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','It allows all substances to pass through',false),
  (q,'B','It allows only some substances to pass through',true),
  (q,'C','It prevents all substances from passing through',false),
  (q,'D','It is made of cellulose',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which of the following is the correct definition of an ecosystem?',s_uniport,sub_bio,2020,
  'An ecosystem is a biological community of interacting organisms and their physical environment.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','A group of organisms of the same species',false),
  (q,'B','All living organisms in an area',false),
  (q,'C','A community of living organisms and their physical environment interacting',true),
  (q,'D','The non-living components of a habitat',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The nitrogen cycle involves the conversion of nitrogen gas to usable compounds by:',s_uniport,sub_bio,2022,
  'Nitrogen-fixing bacteria (e.g., Rhizobium in root nodules) convert atmospheric N₂ into ammonia and nitrates that plants can use.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Green plants',false),(q,'B','Nitrogen-fixing bacteria',true),(q,'C','Fungi',false),(q,'D','Animals',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('DNA replication is described as "semi-conservative" because:',s_uniport,sub_bio,2023,
  'Each new DNA molecule retains one original strand and one newly synthesised strand — hence semi-conservative.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Each new molecule has two new strands',false),
  (q,'B','Each new molecule has one old and one new strand',true),
  (q,'C','DNA is only partly copied',false),
  (q,'D','Only one strand is used as a template',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which enzyme catalyses the breakdown of starch into maltose?',s_uniport,sub_bio,2019,
  'Amylase (salivary and pancreatic) catalyses the hydrolysis of starch into maltose.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Lipase',false),(q,'B','Protease',false),(q,'C','Amylase',true),(q,'D','Lactase',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which part of a flowering plant produces pollen grains?',s_uniport,sub_bio,2024,
  'The anther (part of the stamen) is where pollen grains are produced in flowering plants.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Stigma',false),(q,'B','Ovary',false),(q,'C','Anther',true),(q,'D','Petal',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The condition in which a gene on the X chromosome has no corresponding allele on the Y chromosome is called:',s_uniport,sub_bio,2021,
  'Sex-linkage (X-linkage) describes genes located on the X chromosome that have no corresponding locus on the Y chromosome, leading to different expression in males and females.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Co-dominance',false),(q,'B','Sex-linkage',true),(q,'C','Incomplete dominance',false),(q,'D','Multiple alleles',false);

  -- =====================================================================
  -- UNIPORT — Chemistry (9 questions)
  -- =====================================================================

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which functional group is present in carboxylic acids?',s_uniport,sub_chem,2022,
  'Carboxylic acids contain the carboxyl group (−COOH), which combines a carbonyl (C=O) and a hydroxyl (−OH).')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','−OH',false),(q,'B','−COOH',true),(q,'C','−CHO',false),(q,'D','−NH₂',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('What type of reaction is: CH₄ + Cl₂ → CH₃Cl + HCl?',s_uniport,sub_chem,2023,
  'This is a free-radical substitution reaction — a hydrogen atom in methane is substituted by a chlorine atom in the presence of UV light.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Addition reaction',false),(q,'B','Elimination reaction',false),(q,'C','Substitution reaction',true),(q,'D','Polymerisation',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The gas produced when sodium reacts with water is:',s_uniport,sub_chem,2021,
  '2Na + 2H₂O → 2NaOH + H₂. Hydrogen gas is produced and the solution becomes strongly alkaline.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Oxygen',false),(q,'B','Nitrogen',false),(q,'C','Hydrogen',true),(q,'D','Carbon dioxide',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('If 4 g of NaOH is dissolved in 100 cm³ of solution, calculate the molarity. (M(NaOH) = 40 g/mol)',s_uniport,sub_chem,2020,
  'Moles = 4/40 = 0.1 mol. Volume = 100 cm³ = 0.1 L. Molarity = 0.1/0.1 = 1 mol/L.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','0.1 mol/L',false),(q,'B','0.4 mol/L',false),(q,'C','1 mol/L',true),(q,'D','4 mol/L',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Le Chatelier''s principle states that if a system at equilibrium is disturbed, it will:',s_uniport,sub_chem,2022,
  'Le Chatelier''s principle: a system at equilibrium will shift to counteract the applied change and restore a new equilibrium.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Stop all reactions',false),
  (q,'B','Shift to counteract the disturbance',true),
  (q,'C','Always shift to the right',false),
  (q,'D','Increase the temperature',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The bleaching action of chlorine is due to its:',s_uniport,sub_chem,2023,
  'Chlorine reacts with water to form HOCl (hypochlorous acid), which releases nascent oxygen — the oxidising agent responsible for bleaching.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Reducing properties',false),(q,'B','Acidic properties',false),(q,'C','Oxidising properties',true),(q,'D','Basic properties',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which of the following will increase the rate of a chemical reaction?',s_uniport,sub_chem,2019,
  'Increasing temperature gives reactant molecules more kinetic energy, increasing collision frequency and energy — thus increasing reaction rate.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Decreasing temperature',false),(q,'B','Increasing temperature',true),(q,'C','Decreasing concentration',false),(q,'D','Removing catalyst',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Coke (carbon) is used as a reducing agent in the extraction of iron because it:',s_uniport,sub_chem,2024,
  'Carbon (as coke) reduces iron oxide in the blast furnace: Fe₂O₃ + 3CO → 2Fe + 3CO₂. It donates electrons/removes oxygen from the ore.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Oxidises the iron ore',false),(q,'B','Removes oxygen from the iron ore',true),(q,'C','Adds oxygen to iron',false),(q,'D','Neutralises the iron ore',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('What is the oxidation state of manganese in KMnO₄?',s_uniport,sub_chem,2021,
  'K is +1, each O is −2. So: +1 + Mn + 4(−2) = 0 → Mn = +7.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','+4',false),(q,'B','+6',false),(q,'C','+7',true),(q,'D','+2',false);

  -- =====================================================================
  -- UNIPORT — Physics (9 questions)
  -- =====================================================================

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('A 1,000 kg car accelerates at 3 m/s². What net force acts on it?',s_uniport,sub_phys,2023,
  'F = ma = 1000 × 3 = 3000 N.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','333 N',false),(q,'B','3,000 N',true),(q,'C','300 N',false),(q,'D','30,000 N',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Total internal reflection occurs when light travels from a denser medium to a less dense medium at an angle:',s_uniport,sub_phys,2022,
  'Total internal reflection occurs when the angle of incidence exceeds the critical angle in the denser medium.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Less than the critical angle',false),(q,'B','Equal to 45°',false),(q,'C','Greater than the critical angle',true),(q,'D','Equal to 90°',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The energy stored in a stretched spring obeys:',s_uniport,sub_phys,2021,
  'Elastic potential energy = ½kx², where k is the spring constant and x is the extension. This follows Hooke''s law (within the elastic limit).')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','E = kx',false),(q,'B','E = ½kx²',true),(q,'C','E = k/x',false),(q,'D','E = kx²/4',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Convex mirrors are used as driving mirrors because they:',s_uniport,sub_phys,2020,
  'Convex mirrors produce upright, diminished images and have a wide field of view, making them ideal as rear-view/driving mirrors.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Produce magnified images',false),
  (q,'B','Provide a wide field of view',true),
  (q,'C','Produce real images',false),
  (q,'D','Focus light to a point',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('In a series circuit with resistors R₁=3Ω and R₂=7Ω connected to a 20V source, the current is:',s_uniport,sub_phys,2022,
  'Total resistance = 3+7 = 10Ω. I = V/R = 20/10 = 2 A.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','0.5 A',false),(q,'B','1 A',false),(q,'C','2 A',true),(q,'D','4 A',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The process by which heat is transferred through a vacuum is:',s_uniport,sub_phys,2023,
  'Radiation is the only mode of heat transfer that does not require a medium — it can travel through a vacuum as electromagnetic waves.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Conduction',false),(q,'B','Convection',false),(q,'C','Radiation',true),(q,'D','Evaporation',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('A fuse in a circuit serves to:',s_uniport,sub_phys,2019,
  'A fuse melts and breaks the circuit when current exceeds the rated value, protecting appliances from damage due to overload.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Increase current flow',false),(q,'B','Decrease voltage',false),(q,'C','Protect the circuit from excess current',true),(q,'D','Store charge',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('What is the momentum of a 3 kg object moving at 10 m/s?',s_uniport,sub_phys,2024,
  'Momentum p = mv = 3 × 10 = 30 kg·m/s.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','3.3 kg·m/s',false),(q,'B','13 kg·m/s',false),(q,'C','30 kg·m/s',true),(q,'D','300 kg·m/s',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('A longitudinal wave is one in which:',s_uniport,sub_phys,2021,
  'In a longitudinal wave, the particles of the medium vibrate parallel to the direction of wave propagation (e.g. sound waves).')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Particles vibrate perpendicular to wave direction',false),
  (q,'B','Particles vibrate parallel to wave direction',true),
  (q,'C','No medium is required',false),
  (q,'D','The wave travels in circles',false);

  -- =====================================================================
  -- AFIT — English Language (10 questions)
  -- =====================================================================

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Choose the word most nearly opposite in meaning to VERBOSE.',s_afit,sub_eng,2023,
  'Verbose means using more words than needed. Its antonym is "concise" — brief and to the point.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Wordy',false),(q,'B','Concise',true),(q,'C','Talkative',false),(q,'D','Elaborate',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Select the sentence that is grammatically correct.',s_afit,sub_eng,2022,
  '"Every student must submit his or her assignment" is grammatically correct — "every" is singular and takes a singular pronoun.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Every student must submit their assignment',false),
  (q,'B','Every student must submit his or her assignment',true),
  (q,'C','Every students must submit his assignment',false),
  (q,'D','Every student must submits his assignment',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Identify the figure of speech: "He is the black sheep of the family."',s_afit,sub_eng,2021,
  '"Black sheep" is a metaphor for a disgraceful family member — a direct comparison without "like" or "as".')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Simile',false),(q,'B','Hyperbole',false),(q,'C','Metaphor',true),(q,'D','Irony',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The word TENACIOUS most nearly means:',s_afit,sub_eng,2020,
  'Tenacious means persistent and determined; not giving up easily.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Weak',false),(q,'B','Persistent',true),(q,'C','Arrogant',false),(q,'D','Cowardly',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Choose the option that best completes the sentence: The aircraft, along with its crew, ___ reported missing.',s_afit,sub_eng,2022,
  '"Along with" does not form a compound subject. The main subject "aircraft" is singular → "was".')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','were',false),(q,'B','was',true),(q,'C','have been',false),(q,'D','are',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The expression "to blow one''s trumpet" means:',s_afit,sub_eng,2023,
  '"Blow one''s own trumpet" means to boast about one''s own achievements.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','To play a musical instrument',false),
  (q,'B','To boast about oneself',true),
  (q,'C','To announce bad news',false),
  (q,'D','To celebrate a victory',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which of the following is an example of a compound sentence?',s_afit,sub_eng,2024,
  'A compound sentence consists of two or more independent clauses joined by a conjunction or semicolon.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','The soldier ran fast',false),
  (q,'B','Running fast, the soldier reached the base',false),
  (q,'C','The soldier ran fast and he reached the base on time',true),
  (q,'D','The soldier who ran fast reached the base',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The word PRAGMATIC most nearly means:',s_afit,sub_eng,2019,
  'Pragmatic means dealing with things sensibly and realistically; practical rather than theoretical.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Idealistic',false),(q,'B','Practical',true),(q,'C','Emotional',false),(q,'D','Romantic',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('In the sentence "The general ordered the troops to advance", the word ADVANCE is used as a/an:',s_afit,sub_eng,2021,
  '"To advance" functions as an infinitive and is part of the object — here the infinitive functions as the direct object of "ordered".')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Adjective',false),(q,'B','Adverb',false),(q,'C','Infinitive (verb)',true),(q,'D','Noun',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Choose the option nearest in meaning to INDEFATIGABLE.',s_afit,sub_eng,2022,
  'Indefatigable means persisting tirelessly; never showing signs of fatigue — "tireless" is the closest synonym.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Lazy',false),(q,'B','Tireless',true),(q,'C','Exhausted',false),(q,'D','Reckless',false);

  -- =====================================================================
  -- AFIT — Mathematics (10 questions — harder engineering level)
  -- =====================================================================

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('If matrix A = [[2, 1], [3, 4]], find the determinant of A.',s_afit,sub_math,2023,
  'det(A) = (2×4) − (1×3) = 8 − 3 = 5.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','11',false),(q,'B','5',true),(q,'C','−5',false),(q,'D','14',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Evaluate: lim(x→2) [(x² − 4)/(x − 2)]',s_afit,sub_math,2022,
  'Factor: (x²−4)/(x−2) = (x+2)(x−2)/(x−2) = x+2. At x=2: 2+2 = 4.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','0',false),(q,'B','2',false),(q,'C','4',true),(q,'D','Undefined',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Find dy/dx if y = 3x⁴ − 5x² + 2.',s_afit,sub_math,2021,
  'dy/dx = 12x³ − 10x. Using power rule: d/dx(3x⁴)=12x³, d/dx(−5x²)=−10x, d/dx(2)=0.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','12x³ + 10x',false),(q,'B','12x³ − 10x',true),(q,'C','12x⁴ − 10x²',false),(q,'D','3x³ − 5x',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Evaluate the integral: ∫(2x + 3) dx',s_afit,sub_math,2020,
  '∫(2x+3)dx = x² + 3x + C.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','2x² + 3 + C',false),(q,'B','x² + 3x + C',true),(q,'C','x² + 3 + C',false),(q,'D','2 + 0 + C',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Solve the quadratic equation 2x² − 7x + 3 = 0.',s_afit,sub_math,2022,
  'Using formula or factoring: 2x²−7x+3 = (2x−1)(x−3). Roots: x=1/2 and x=3.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','x=1 and x=3',false),(q,'B','x=1/2 and x=3',true),(q,'C','x=−1/2 and x=−3',false),(q,'D','x=2 and x=3',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Find the angle θ if sin θ = √3/2 and 0° ≤ θ ≤ 90°.',s_afit,sub_math,2023,
  'sin 60° = √3/2, so θ = 60°.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','30°',false),(q,'B','45°',false),(q,'C','60°',true),(q,'D','90°',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('In how many ways can 5 people be arranged in a row?',s_afit,sub_math,2019,
  '5! = 5×4×3×2×1 = 120 ways.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','25',false),(q,'B','60',false),(q,'C','120',true),(q,'D','240',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The sum of the first 20 terms of the series 2 + 5 + 8 + 11 + ... is:',s_afit,sub_math,2024,
  'a=2, d=3, n=20. S = 20/2 × [2(2) + 19(3)] = 10 × [4+57] = 10 × 61 = 610.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','590',false),(q,'B','600',false),(q,'C','610',true),(q,'D','620',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Simplify: log₃ 81 − log₃ 9',s_afit,sub_math,2021,
  'log₃ 81 = log₃ 3⁴ = 4. log₃ 9 = log₃ 3² = 2. 4 − 2 = 2.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','1',false),(q,'B','2',true),(q,'C','3',false),(q,'D','9',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('If P(A) = 0.4 and P(B) = 0.5 and A and B are independent events, find P(A ∩ B).',s_afit,sub_math,2022,
  'For independent events: P(A ∩ B) = P(A) × P(B) = 0.4 × 0.5 = 0.2.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','0.9',false),(q,'B','0.1',false),(q,'C','0.2',true),(q,'D','0.45',false);

  -- =====================================================================
  -- AFIT — Biology (9 questions)
  -- =====================================================================

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which of the following is true about aerobic respiration?',s_afit,sub_bio,2023,
  'Aerobic respiration requires oxygen and produces CO₂, H₂O, and a large amount of ATP (36–38 ATP per glucose molecule).')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','It does not require oxygen',false),
  (q,'B','It produces a large amount of ATP and requires oxygen',true),
  (q,'C','It produces lactic acid as the final product',false),
  (q,'D','It occurs only in prokaryotes',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The Hardy-Weinberg equilibrium is maintained when:',s_afit,sub_bio,2022,
  'Hardy-Weinberg equilibrium requires large population size, random mating, no mutation, no migration, and no natural selection.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Natural selection is occurring',false),
  (q,'B','There is random mating, no selection, no mutation, and no migration',true),
  (q,'C','Population size is small',false),
  (q,'D','Mutation rate is high',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which stage of mitosis involves the alignment of chromosomes at the equatorial plate?',s_afit,sub_bio,2021,
  'During metaphase, chromosomes are arranged along the cell''s equatorial plate (metaphase plate) by spindle fibres.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Prophase',false),(q,'B','Metaphase',true),(q,'C','Anaphase',false),(q,'D','Telophase',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The primary structure of a protein is determined by:',s_afit,sub_bio,2020,
  'The primary structure of a protein is its specific sequence of amino acids held together by peptide bonds.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Hydrogen bonding between amino acids',false),
  (q,'B','The sequence of amino acids (peptide bonds)',true),
  (q,'C','Disulphide bridges',false),
  (q,'D','Hydrophobic interactions',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Sickle cell anaemia is caused by a mutation in which gene?',s_afit,sub_bio,2022,
  'Sickle cell anaemia results from a point mutation in the HBB gene (coding for the beta-globin subunit of haemoglobin), causing glutamic acid to be replaced by valine.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','HBA1 (alpha-globin)',false),(q,'B','HBB (beta-globin)',true),(q,'C','CFTR',false),(q,'D','PKU gene',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which of the following hormones is NOT produced by the pituitary gland?',s_afit,sub_bio,2023,
  'Insulin is produced by the beta cells of the pancreas, not the pituitary gland. FSH, GH, and ACTH are all pituitary hormones.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Follicle Stimulating Hormone (FSH)',false),(q,'B','Growth Hormone (GH)',false),(q,'C','Insulin',true),(q,'D','ACTH',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Active transport differs from diffusion in that active transport:',s_afit,sub_bio,2019,
  'Active transport requires energy (ATP) and moves substances against their concentration gradient, unlike passive diffusion.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Moves substances down a concentration gradient',false),
  (q,'B','Does not require energy',false),
  (q,'C','Requires energy and moves substances against the gradient',true),
  (q,'D','Occurs only in plant cells',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The process by which mRNA is produced from a DNA template is called:',s_afit,sub_bio,2024,
  'Transcription is the process by which RNA polymerase synthesises mRNA from a DNA template in the nucleus.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Translation',false),(q,'B','Replication',false),(q,'C','Transcription',true),(q,'D','Transduction',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('In an experiment, a plant wilted when placed in a concentrated salt solution. This demonstrates:',s_afit,sub_bio,2021,
  'Plasmolysis: in a hypertonic solution, water leaves the cell by osmosis, causing the cytoplasm to shrink away from the cell wall — the plant wilts.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Turgidity',false),(q,'B','Active transport',false),(q,'C','Plasmolysis',true),(q,'D','Imbibition',false);

  -- =====================================================================
  -- AFIT — Chemistry (9 questions — harder/applied)
  -- =====================================================================

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Using Hess''s Law, if ΔH for A→B is +50 kJ/mol and for A→C is −30 kJ/mol, what is ΔH for C→B?',s_afit,sub_chem,2023,
  'ΔH(C→B) = ΔH(A→B) − ΔH(A→C) = 50 − (−30) = +80 kJ/mol. (Reverse A→C gives ΔH = +30; then A→B adds +50; net from C: +30+50=+80.)')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','+20 kJ/mol',false),(q,'B','−80 kJ/mol',false),(q,'C','+80 kJ/mol',true),(q,'D','+30 kJ/mol',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The van''t Hoff factor (i) for NaCl completely dissociated in water is:',s_afit,sub_chem,2022,
  'NaCl dissociates into Na⁺ and Cl⁻, giving 2 particles per formula unit. Therefore i = 2.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','1',false),(q,'B','2',true),(q,'C','3',false),(q,'D','0.5',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('In a galvanic cell, oxidation occurs at the:',s_afit,sub_chem,2021,
  'In a galvanic (voltaic) cell, oxidation (loss of electrons) occurs at the anode — the negative electrode.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Cathode',false),(q,'B','Salt bridge',false),(q,'C','Anode',true),(q,'D','Electrolyte',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The quantum number that describes the orientation of an orbital in space is the:',s_afit,sub_chem,2020,
  'The magnetic quantum number (mₗ) describes the orientation of an orbital in space relative to the other orbitals in a subshell.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Principal quantum number (n)',false),(q,'B','Azimuthal quantum number (l)',false),(q,'C','Magnetic quantum number (mₗ)',true),(q,'D','Spin quantum number (mₛ)',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The pH of a 0.01 mol/L HCl solution is:',s_afit,sub_chem,2022,
  'HCl is a strong acid — fully dissociates. [H⁺] = 0.01 = 10⁻². pH = −log[H⁺] = −log(10⁻²) = 2.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','1',false),(q,'B','2',true),(q,'C','12',false),(q,'D','14',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Calculate the number of atoms in 16 g of oxygen gas (O₂). (Nₐ = 6.02 × 10²³, M(O) = 16 g/mol)',s_afit,sub_chem,2023,
  'M(O₂) = 32 g/mol. Moles of O₂ = 16/32 = 0.5 mol. Molecules = 0.5 × 6.02×10²³ = 3.01×10²³ molecules. Atoms = 2 × 3.01×10²³ = 6.02×10²³ atoms.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','3.01 × 10²³',false),(q,'B','6.02 × 10²³',true),(q,'C','1.204 × 10²⁴',false),(q,'D','1.5 × 10²³',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which hybridisation is present in the carbon atoms of ethyne (C₂H₂)?',s_afit,sub_chem,2019,
  'In ethyne, each carbon forms a triple bond (one σ and two π bonds) and one single bond with H. This requires sp hybridisation.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','sp³',false),(q,'B','sp²',false),(q,'C','sp',true),(q,'D','dsp²',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The entropy of a system increases when:',s_afit,sub_chem,2024,
  'Entropy (disorder) increases when a solid dissolves in a liquid, when gases are produced from liquids/solids, or when temperature increases.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','A gas is compressed into a smaller volume',false),
  (q,'B','A solid dissolves in a liquid',true),
  (q,'C','Temperature decreases to absolute zero',false),
  (q,'D','A liquid freezes to a solid',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Which of the following best defines a Lewis base?',s_afit,sub_chem,2021,
  'A Lewis base is an electron pair donor. It donates a lone pair of electrons to a Lewis acid to form a coordinate bond.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','A proton acceptor',false),(q,'B','A proton donor',false),(q,'C','An electron pair donor',true),(q,'D','An electron pair acceptor',false);

  -- =====================================================================
  -- AFIT — Physics (9 questions — harder/engineering)
  -- =====================================================================

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('A projectile is fired at 30 m/s at 30° to the horizontal. What is the maximum height reached? (g = 10 m/s²)',s_afit,sub_phys,2023,
  'vy = 30 sin30° = 15 m/s. H = vy²/(2g) = 225/20 = 11.25 m.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','5.0 m',false),(q,'B','11.25 m',true),(q,'C','22.5 m',false),(q,'D','45 m',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('The equation of continuity for fluid flow states that A₁v₁ = A₂v₂. This represents conservation of:',s_afit,sub_phys,2022,
  'The continuity equation (A₁v₁ = A₂v₂) is derived from conservation of mass for incompressible flow.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Energy',false),(q,'B','Momentum',false),(q,'C','Mass (continuity)',true),(q,'D','Pressure',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('An object of mass 2 kg moves in a circle of radius 0.5 m at a speed of 4 m/s. What is the centripetal force?',s_afit,sub_phys,2021,
  'F = mv²/r = 2 × 16 / 0.5 = 64 N.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','8 N',false),(q,'B','16 N',false),(q,'C','64 N',true),(q,'D','32 N',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Using the ideal gas law PV = nRT, if temperature doubles and volume halves, the pressure:',s_afit,sub_phys,2020,
  'P = nRT/V. If T→2T and V→V/2: P_new = nR(2T)/(V/2) = 4nRT/V = 4P. Pressure becomes 4 times the original.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Doubles',false),(q,'B','Halves',false),(q,'C','Quadruples',true),(q,'D','Remains the same',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('An AC circuit has a peak voltage of 311 V. What is the RMS voltage?',s_afit,sub_phys,2022,
  'V_rms = V_peak / √2 = 311 / 1.414 ≈ 220 V. (Nigeria''s mains supply is 220 V RMS.)')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','155.5 V',false),(q,'B','220 V',true),(q,'C','440 V',false),(q,'D','311 V',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('Planck''s equation E = hf relates the energy of a photon to its:',s_afit,sub_phys,2023,
  'E = hf: E is the energy of a photon, h is Planck''s constant (6.63 × 10⁻³⁴ J·s), and f is the frequency of the radiation.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Wavelength',false),(q,'B','Frequency',true),(q,'C','Mass',false),(q,'D','Velocity',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('In a nuclear reaction, ²³⁵U absorbs a neutron and splits into ⁹²Kr, ¹⁴¹Ba and 3 neutrons. This is:',s_afit,sub_phys,2019,
  'The splitting of a heavy nucleus upon neutron absorption into lighter fragments and additional neutrons is nuclear fission.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','Nuclear fusion',false),(q,'B','Beta decay',false),(q,'C','Nuclear fission',true),(q,'D','Alpha decay',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('What is the de Broglie wavelength of an electron with momentum p = 1 × 10⁻²⁴ kg·m/s? (h = 6.63 × 10⁻³⁴ J·s)',s_afit,sub_phys,2024,
  'λ = h/p = 6.63×10⁻³⁴ / 1×10⁻²⁴ = 6.63 × 10⁻¹⁰ m ≈ 6.63 × 10⁻¹⁰ m.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','6.63 × 10⁻⁵⁸ m',false),(q,'B','6.63 × 10⁻¹⁰ m',true),(q,'C','1.51 × 10⁹ m',false),(q,'D','6.63 × 10⁻²⁴ m',false);

  INSERT INTO public.questions(text,school_id,subject_id,year,explanation)
  VALUES('A capacitor of capacitance 100 μF is charged to 12 V. What energy is stored?',s_afit,sub_phys,2021,
  'E = ½CV² = ½ × 100×10⁻⁶ × 144 = ½ × 0.0144 = 0.0072 J = 7.2 × 10⁻³ J.')
  RETURNING id INTO q;
  INSERT INTO public.options(question_id,label,text,is_correct) VALUES
  (q,'A','1.2 × 10⁻³ J',false),(q,'B','7.2 × 10⁻³ J',true),(q,'C','1.44 × 10⁻² J',false),(q,'D','6 × 10⁻⁴ J',false);

END;
$$;
