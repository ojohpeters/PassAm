import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SCHOOLS = [
  { name: "University of Lagos", abbreviation: "UNILAG", location: "Lagos" },
  { name: "Obafemi Awolowo University", abbreviation: "OAU", location: "Ile-Ife" },
  { name: "University of Benin", abbreviation: "UNIBEN", location: "Benin City" },
  { name: "University of Ibadan", abbreviation: "UI", location: "Ibadan" },
  { name: "University of Port Harcourt", abbreviation: "UNIPORT", location: "Port Harcourt" },
  { name: "Air Force Institute of Technology", abbreviation: "AFIT", location: "Kaduna" },
];

const SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English Language",
  "Government",
  "Economics",
  "Literature in English",
];

const STUDENTS = [
  { name: "Ojochegbe Attah", email: "ojochegbe.attah@gmail.com" },
  { name: "Ojochide Ameh", email: "ojochide.ameh@gmail.com" },
  { name: "Ojoma Ejeh", email: "ojoma.ejeh@gmail.com" },
  { name: "Ojone Onuh", email: "ojone.onuh@gmail.com" },
  { name: "Acheneje Okwoli", email: "acheneje.okwoli@gmail.com" },
  { name: "Ojochenemi Aduku", email: "ojochenemi.aduku@gmail.com" },
  { name: "Ejeba Ogaji", email: "ejeba.ogaji@gmail.com" },
  { name: "Onuche Onu", email: "onuche.onu@gmail.com" },
];

const SAMPLE_QUESTIONS = [
  // Mathematics
  {
    subject: "Mathematics",
    year: 2023,
    text: "If 2x + 3 = 11, find the value of x.",
    explanation: "Subtract 3 from both sides: 2x = 8, then divide by 2: x = 4.",
    options: [
      { label: "A" as const, text: "3", isCorrect: false },
      { label: "B" as const, text: "4", isCorrect: true },
      { label: "C" as const, text: "5", isCorrect: false },
      { label: "D" as const, text: "6", isCorrect: false },
    ],
  },
  {
    subject: "Mathematics",
    year: 2023,
    text: "What is the value of sin 30°?",
    explanation: "sin 30° = 1/2 = 0.5. This is a standard trigonometric identity.",
    options: [
      { label: "A" as const, text: "√3/2", isCorrect: false },
      { label: "B" as const, text: "1", isCorrect: false },
      { label: "C" as const, text: "1/2", isCorrect: true },
      { label: "D" as const, text: "0", isCorrect: false },
    ],
  },
  {
    subject: "Mathematics",
    year: 2022,
    text: "Simplify: (x² - 9) / (x - 3)",
    explanation: "Factor numerator: (x+3)(x-3) / (x-3) = x + 3, for x ≠ 3.",
    options: [
      { label: "A" as const, text: "x - 3", isCorrect: false },
      { label: "B" as const, text: "x + 3", isCorrect: true },
      { label: "C" as const, text: "x² - 3", isCorrect: false },
      { label: "D" as const, text: "x", isCorrect: false },
    ],
  },
  {
    subject: "Mathematics",
    year: 2022,
    text: "Find the sum of the first 10 terms of the arithmetic series: 2, 5, 8, 11, ...",
    explanation: "S_n = n/2 × (2a + (n-1)d). S_10 = 10/2 × (4 + 27) = 5 × 31 = 155.",
    options: [
      { label: "A" as const, text: "140", isCorrect: false },
      { label: "B" as const, text: "150", isCorrect: false },
      { label: "C" as const, text: "155", isCorrect: true },
      { label: "D" as const, text: "160", isCorrect: false },
    ],
  },
  // Physics
  {
    subject: "Physics",
    year: 2023,
    text: "A body of mass 5 kg is moving at 10 m/s. Calculate its kinetic energy.",
    explanation: "KE = ½mv² = ½ × 5 × 10² = ½ × 5 × 100 = 250 J.",
    options: [
      { label: "A" as const, text: "100 J", isCorrect: false },
      { label: "B" as const, text: "250 J", isCorrect: true },
      { label: "C" as const, text: "500 J", isCorrect: false },
      { label: "D" as const, text: "50 J", isCorrect: false },
    ],
  },
  {
    subject: "Physics",
    year: 2023,
    text: "Which of the following is a vector quantity?",
    explanation: "Velocity has both magnitude and direction, making it a vector. Speed is scalar.",
    options: [
      { label: "A" as const, text: "Speed", isCorrect: false },
      { label: "B" as const, text: "Temperature", isCorrect: false },
      { label: "C" as const, text: "Velocity", isCorrect: true },
      { label: "D" as const, text: "Mass", isCorrect: false },
    ],
  },
  {
    subject: "Physics",
    year: 2022,
    text: "The unit of electric current is:",
    explanation: "Electric current is measured in Amperes (A), named after André-Marie Ampère.",
    options: [
      { label: "A" as const, text: "Volt", isCorrect: false },
      { label: "B" as const, text: "Watt", isCorrect: false },
      { label: "C" as const, text: "Ohm", isCorrect: false },
      { label: "D" as const, text: "Ampere", isCorrect: true },
    ],
  },
  // English Language
  {
    subject: "English Language",
    year: 2023,
    text: "Choose the word that is closest in meaning to 'BENEVOLENT':",
    explanation: "Benevolent means kind and generous. Malevolent is its antonym.",
    options: [
      { label: "A" as const, text: "Malevolent", isCorrect: false },
      { label: "B" as const, text: "Kind-hearted", isCorrect: true },
      { label: "C" as const, text: "Hostile", isCorrect: false },
      { label: "D" as const, text: "Indifferent", isCorrect: false },
    ],
  },
  {
    subject: "English Language",
    year: 2023,
    text: "Identify the part of speech of the underlined word: 'She runs QUICKLY.'",
    explanation: "'Quickly' modifies the verb 'runs', describing how she runs. It is an adverb.",
    options: [
      { label: "A" as const, text: "Adjective", isCorrect: false },
      { label: "B" as const, text: "Noun", isCorrect: false },
      { label: "C" as const, text: "Adverb", isCorrect: true },
      { label: "D" as const, text: "Preposition", isCorrect: false },
    ],
  },
  // Chemistry
  {
    subject: "Chemistry",
    year: 2023,
    text: "What is the chemical symbol for Gold?",
    explanation: "Gold's symbol is Au, from the Latin 'Aurum'.",
    options: [
      { label: "A" as const, text: "Go", isCorrect: false },
      { label: "B" as const, text: "Gd", isCorrect: false },
      { label: "C" as const, text: "Au", isCorrect: true },
      { label: "D" as const, text: "Ag", isCorrect: false },
    ],
  },
  {
    subject: "Chemistry",
    year: 2022,
    text: "Which gas is produced when zinc reacts with dilute hydrochloric acid?",
    explanation: "Zn + 2HCl → ZnCl₂ + H₂↑. Hydrogen gas is evolved.",
    options: [
      { label: "A" as const, text: "Oxygen", isCorrect: false },
      { label: "B" as const, text: "Carbon dioxide", isCorrect: false },
      { label: "C" as const, text: "Hydrogen", isCorrect: true },
      { label: "D" as const, text: "Chlorine", isCorrect: false },
    ],
  },
  // Biology
  {
    subject: "Biology",
    year: 2023,
    text: "The powerhouse of the cell is the:",
    explanation: "Mitochondria produce ATP through cellular respiration, providing energy for all cell activities.",
    options: [
      { label: "A" as const, text: "Nucleus", isCorrect: false },
      { label: "B" as const, text: "Ribosome", isCorrect: false },
      { label: "C" as const, text: "Mitochondria", isCorrect: true },
      { label: "D" as const, text: "Golgi apparatus", isCorrect: false },
    ],
  },
  {
    subject: "Biology",
    year: 2022,
    text: "Which blood group is the universal donor?",
    explanation: "Blood group O- (O negative) is the universal donor because it lacks A, B, and Rh antigens.",
    options: [
      { label: "A" as const, text: "A", isCorrect: false },
      { label: "B" as const, text: "B", isCorrect: false },
      { label: "C" as const, text: "AB", isCorrect: false },
      { label: "D" as const, text: "O", isCorrect: true },
    ],
  },
  // Economics
  {
    subject: "Economics",
    year: 2023,
    text: "When demand increases and supply remains constant, the equilibrium price will:",
    explanation: "An increase in demand shifts the demand curve rightward, raising the equilibrium price.",
    options: [
      { label: "A" as const, text: "Fall", isCorrect: false },
      { label: "B" as const, text: "Rise", isCorrect: true },
      { label: "C" as const, text: "Remain unchanged", isCorrect: false },
      { label: "D" as const, text: "Become zero", isCorrect: false },
    ],
  },
  // Government
  {
    subject: "Government",
    year: 2023,
    text: "Nigeria became a republic in:",
    explanation: "Nigeria was proclaimed a republic on 1 October 1963, with Dr Nnamdi Azikiwe as the first President.",
    options: [
      { label: "A" as const, text: "1960", isCorrect: false },
      { label: "B" as const, text: "1963", isCorrect: true },
      { label: "C" as const, text: "1966", isCorrect: false },
      { label: "D" as const, text: "1979", isCorrect: false },
    ],
  },
];

async function main() {
  console.log("Seeding database...");

  // Schools
  const schools = await Promise.all(
    SCHOOLS.map((s) =>
      prisma.school.upsert({
        where: { abbreviation: s.abbreviation },
        update: {},
        create: s,
      })
    )
  );

  // Subjects
  const subjects = await Promise.all(
    SUBJECTS.map((name) =>
      prisma.subject.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  const subjectMap = new Map(subjects.map((s) => [s.name, s]));

  // Admin
  await prisma.user.upsert({
    where: { email: "admin@putme.ng" },
    update: {},
    create: {
      email: "admin@putme.ng",
      name: "Admin",
      passwordHash: await bcrypt.hash("Admin1234!", 12),
      role: "ADMIN",
      subscriptionStatus: "PRO",
    },
  });

  // Igala student accounts — all share password: Student1234!
  const studentPassword = await bcrypt.hash("Student1234!", 12);
  for (const student of STUDENTS) {
    await prisma.user.upsert({
      where: { email: student.email },
      update: {},
      create: {
        email: student.email,
        name: student.name,
        passwordHash: studentPassword,
        role: "STUDENT",
      },
    });
  }

  // Seed questions for every school using the same question set
  for (const school of schools) {
    for (const q of SAMPLE_QUESTIONS) {
      const subject = subjectMap.get(q.subject);
      if (!subject) continue;

      const existing = await prisma.question.findFirst({
        where: { text: q.text, schoolId: school.id },
      });
      if (existing) continue;

      await prisma.question.create({
        data: {
          text: q.text,
          explanation: q.explanation,
          year: q.year,
          schoolId: school.id,
          subjectId: subject.id,
          options: { create: q.options },
        },
      });
    }
  }

  console.log(`Seed complete.`);
  console.log(`  Schools:  ${schools.length}`);
  console.log(`  Subjects: ${subjects.length}`);
  console.log(`  Students: ${STUDENTS.length} (password: Student1234!)`);
  console.log(`  Admin:    admin@putme.ng (password: Admin1234!)`);
  console.log(`  Questions per school: ${SAMPLE_QUESTIONS.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
