let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

function searchNotes(word) {
  const target = word.toLowerCase();
  return notes.filter((note) => note.text.toLowerCase().includes(target));
}

console.log(searchNotes("the"));   // 2 notes: ids 2 and 3
console.log(searchNotes("MILK"));  // 1 note: id 1 (ignores case)
console.log(searchNotes("zebra")); // [] (no results)

function longestNote() {
  if (notes.length === 0) return null;
  let longest = notes[0];
  for (const note of notes) {
    if (note.text.length > longest.text.length) {
      longest = note;
    }
  }
  return longest;
}

console.log(longestNote()); // id 3, "Email the project report to Grace"

const backup = notes;       // save the real array
notes = [];
console.log(longestNote()); // null
notes = backup;             // restore it

function countByCategory() {
  const counts = {};
  for (const note of notes) {
    if (counts[note.category]) {
      counts[note.category]++;
    } else {
      counts[note.category] = 1;
    }
  }
  return counts;
}

console.log(countByCategory()); // { personal: 2, study: 2, work: 1 }

function getSummary() {
  const counts = countByCategory();
  const total = notes.length;
  const word = total === 1 ? "note" : "notes";
  const personal = counts.personal || 0;
  const work = counts.work || 0;
  const study = counts.study || 0;
  return `${total} ${word}: ${personal} personal, ${work} work, ${study} study.`;
}

console.log(getSummary()); // "5 notes: 2 personal, 1 work, 2 study."

const backup2 = notes;
notes = [notes[0]];
console.log(getSummary()); // "1 note: 1 personal, 0 work, 0 study."
notes = backup2;

function normalise(text) {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

function isDuplicate(text) {
  const target = normalise(text);
  return notes.some((note) => normalise(note.text) === target);
}

console.log(isDuplicate("Call mum"));       // true
console.log(isDuplicate("  call   MUM ")); // true (case and extra spaces ignored)
console.log(isDuplicate("Call dad"));       // false

const validCategories = ["personal", "work", "study"];

function addNote(text, category) {
  const cleaned = text.trim();
  if (cleaned.length < 1 || cleaned.length > 200) {
    console.log("❌ Rejected: text must be 1-200 characters.");
    return false;
  }
  if (isDuplicate(cleaned)) {
    console.log("❌ Rejected: that note already exists.");
    return false;
  }
  if (!validCategories.includes(category)) {
    console.log("❌ Rejected: category must be personal, work or study.");
    return false;
  }
  notes.push({ id: Date.now(), text: cleaned, category: category });
  console.log(`✅ Added: "${cleaned}" (${category})`);
  return true;
}

console.log(addNote("Pay rent", "work"));        // ✅ message, then true
console.log(addNote("pay  RENT", "work"));       // ❌ duplicate, then false
console.log(addNote("   ", "work"));             // ❌ length, then false
console.log(addNote("a".repeat(201), "work"));   // ❌ length, then false
console.log(addNote("Go running", "fitness"));   // ❌ category, then false
console.log(getSummary()); // "6 notes: 2 personal, 2 work, 2 study."