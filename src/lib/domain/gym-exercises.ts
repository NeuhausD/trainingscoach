/**
 * Kuratierte Studio-Übungen (Fitline Plaffeien). Muskelgruppen auf die elf
 * Schlüssel des Eisenhorn-Katalogs abgebildet; externalRef verweist auf den
 * Eintrag in free-exercise-db (Public Domain), aus dem die Muskelzuordnung stammt.
 */
export type GymExercise = {
  name: string;
  externalRef: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
};

export const GYM_EXERCISES: GymExercise[] = [
  { name: "Kniebeuge (Langhantel)", externalRef: "Barbell_Squat", primaryMuscles: ["legs"], secondaryMuscles: ["glutes", "calves", "back"] },
  { name: "Frontkniebeuge", externalRef: "Front_Barbell_Squat", primaryMuscles: ["legs"], secondaryMuscles: ["glutes", "calves"] },
  { name: "Goblet Squat", externalRef: "Goblet_Squat", primaryMuscles: ["legs"], secondaryMuscles: ["glutes", "shoulders"] },
  { name: "Kreuzheben", externalRef: "Barbell_Deadlift", primaryMuscles: ["back", "legs"], secondaryMuscles: ["glutes", "forearms", "neck"] },
  { name: "Rumänisches Kreuzheben", externalRef: "Romanian_Deadlift", primaryMuscles: ["legs"], secondaryMuscles: ["glutes", "back"] },
  { name: "Trap-Bar Kreuzheben", externalRef: "Trap_Bar_Deadlift", primaryMuscles: ["legs"], secondaryMuscles: ["glutes", "back"] },
  { name: "Hip Thrust", externalRef: "Barbell_Hip_Thrust", primaryMuscles: ["glutes"], secondaryMuscles: ["legs"] },
  { name: "Ausfallschritte (Langhantel)", externalRef: "Barbell_Lunge", primaryMuscles: ["legs"], secondaryMuscles: ["glutes", "calves"] },
  { name: "Beinpresse", externalRef: "Leg_Press", primaryMuscles: ["legs"], secondaryMuscles: ["glutes", "calves"] },
  { name: "Beinstrecker", externalRef: "Leg_Extensions", primaryMuscles: ["legs"], secondaryMuscles: [] },
  { name: "Beinbeuger liegend", externalRef: "Lying_Leg_Curls", primaryMuscles: ["legs"], secondaryMuscles: [] },
  { name: "Wadenheben stehend", externalRef: "Standing_Calf_Raises", primaryMuscles: ["calves"], secondaryMuscles: [] },
  { name: "Bankdrücken (Langhantel)", externalRef: "Barbell_Bench_Press_-_Medium_Grip", primaryMuscles: ["chest"], secondaryMuscles: ["shoulders", "triceps"] },
  { name: "Kurzhantel-Bankdrücken", externalRef: "Dumbbell_Bench_Press", primaryMuscles: ["chest"], secondaryMuscles: ["shoulders", "triceps"] },
  { name: "Schrägbankdrücken (Kurzhantel)", externalRef: "Incline_Dumbbell_Press", primaryMuscles: ["chest"], secondaryMuscles: ["shoulders", "triceps"] },
  { name: "Cable Crossover", externalRef: "Cable_Crossover", primaryMuscles: ["chest"], secondaryMuscles: ["shoulders"] },
  { name: "Liegestütze", externalRef: "Pushups", primaryMuscles: ["chest"], secondaryMuscles: ["shoulders", "triceps"] },
  { name: "Schulterdrücken stehend", externalRef: "Standing_Military_Press", primaryMuscles: ["shoulders"], secondaryMuscles: ["triceps"] },
  { name: "Schulterdrücken (Kurzhantel)", externalRef: "Dumbbell_Shoulder_Press", primaryMuscles: ["shoulders"], secondaryMuscles: ["triceps"] },
  { name: "Seitheben", externalRef: "Side_Lateral_Raise", primaryMuscles: ["shoulders"], secondaryMuscles: [] },
  { name: "Face Pulls", externalRef: "Face_Pull", primaryMuscles: ["shoulders"], secondaryMuscles: ["back"] },
  { name: "Klimmzüge", externalRef: "Pullups", primaryMuscles: ["back"], secondaryMuscles: ["biceps"] },
  { name: "Klimmzüge im Untergriff", externalRef: "Chin-Up", primaryMuscles: ["back"], secondaryMuscles: ["biceps", "forearms"] },
  { name: "Latzug breit", externalRef: "Wide-Grip_Lat_Pulldown", primaryMuscles: ["back"], secondaryMuscles: ["biceps", "shoulders"] },
  { name: "Rudern vorgebeugt (Langhantel)", externalRef: "Bent_Over_Barbell_Row", primaryMuscles: ["back"], secondaryMuscles: ["biceps", "shoulders"] },
  { name: "Rudern am Kabelzug sitzend", externalRef: "Seated_Cable_Rows", primaryMuscles: ["back"], secondaryMuscles: ["biceps", "shoulders"] },
  { name: "Einarmiges Kurzhantelrudern", externalRef: "One-Arm_Dumbbell_Row", primaryMuscles: ["back"], secondaryMuscles: ["biceps", "shoulders"] },
  { name: "Bizepscurls (Langhantel)", externalRef: "Barbell_Curl", primaryMuscles: ["biceps"], secondaryMuscles: ["forearms"] },
  { name: "Hammercurls", externalRef: "Hammer_Curls", primaryMuscles: ["biceps"], secondaryMuscles: ["forearms"] },
  { name: "Trizepsdrücken am Kabelzug", externalRef: "Triceps_Pushdown", primaryMuscles: ["triceps"], secondaryMuscles: [] },
  { name: "Dips", externalRef: "Dips_-_Triceps_Version", primaryMuscles: ["triceps"], secondaryMuscles: ["chest", "shoulders"] },
  { name: "Plank", externalRef: "Plank", primaryMuscles: ["core"], secondaryMuscles: [] },
  { name: "Hängendes Beinheben", externalRef: "Hanging_Leg_Raise", primaryMuscles: ["core"], secondaryMuscles: ["forearms"] },
  { name: "Russian Twist", externalRef: "Russian_Twist", primaryMuscles: ["core"], secondaryMuscles: ["back"] },
  { name: "Ab Roller", externalRef: "Ab_Roller", primaryMuscles: ["core"], secondaryMuscles: ["shoulders"] },
  { name: "Farmer's Walk", externalRef: "Farmers_Walk", primaryMuscles: ["forearms"], secondaryMuscles: ["core", "legs", "neck"] },
  { name: "Umsetzen (Power Clean)", externalRef: "Power_Clean", primaryMuscles: ["legs", "back"], secondaryMuscles: ["shoulders", "glutes", "neck"] },
  { name: "Schlitten schieben", externalRef: "Sled_Push", primaryMuscles: ["legs"], secondaryMuscles: ["glutes", "calves", "chest"] },
];
