/**
 * PHONETICS.JS — Gimliand trainer, medical-term pronunciation glossary
 * ----------------------------------------------------------------------
 * WHY THIS FILE EXISTS
 * deck.js keeps every scientific/medical/trial term in English inside
 * every language script (Hindi, Marathi, Gujarati, Tamil, Telugu,
 * Punjabi, Bengali) — as requested, so accuracy is never lost in
 * translation. The risk is that a TTS/STT voice reading a non-English
 * script will mispronounce the embedded English term.
 *
 * This glossary gives ONE pronunciation per term, applied globally
 * (the term is spelled and pronounced identically no matter which
 * language script surrounds it — that is the point of keeping it in
 * English). Use `phoneticize(text)` below to inject SSML <phoneme>
 * (or a plain respelling fallback) before sending a script to your
 * TTS engine.
 *
 * SOURCING / COMPLIANCE NOTE
 * - Respellings below follow standard English/medical pronunciation
 *   conventions (Merriam-Webster / Dorland's medical dictionary style).
 *   No new clinical claims are made here — this is pronunciation only.
 * - Acronyms with no single agreed spoken form (RAASi, HFrEF, ADME,
 *   SZC, MRA, ESRD, CKD) are set to letter-by-letter reading, which is
 *   always safe and is how they are taught in India. If your medical
 *   team has a house convention (e.g. "RAAS-i" said as one word),
 *   override the `mode` field for that entry.
 * - "Gimliand" is a coined brand name with no dictionary pronunciation.
 *   The respelling given is a plain reading of the spelling — CONFIRM
 *   the approved spoken form with the brand/marketing team before
 *   this goes into a live voice trainer.
 * - QD / TID / BD are expanded to their spoken meaning (once daily /
 *   three times daily) rather than read as letters, since that is how
 *   these are actually spoken on a call — verify this matches your
 *   approved call-conduct language.
 */

const PHONETICS = {
  // ---- Brand / house (CONFIRM with brand team) ----
  "Gimliand":        { mode: "word",   respelling: "GIM-lee-and",              ipa: "ˈɡɪm.li.ænd",           note: "Coined brand name — confirm approved spoken form with brand team." },
  "Avior":           { mode: "word",   respelling: "AY-vee-or",                ipa: "ˈeɪ.vi.ɔːr" },
  "Sun Pharma":      { mode: "word",   respelling: "SUN FAR-mə",               ipa: "sʌn ˈfɑːr.mə" },

  // ---- Molecule / mechanism ----
  "sodium zirconium cyclosilicate": { mode: "word", respelling: "SOH-dee-əm zər-KOH-nee-əm sy-kloh-SIL-ih-kayt", ipa: "ˈsoʊ.di.əm zɜːrˈkoʊ.ni.əm ˌsaɪ.kloʊˈsɪl.ɪ.keɪt" },
  "SZC":             { mode: "letters", respelling: "S-Z-C" },
  "patiromer":       { mode: "word",   respelling: "pə-TIR-oh-mər",            ipa: "pəˈtɪr.oʊ.mər" },
  "SPS":             { mode: "letters", respelling: "S-P-S", note: "Sodium polystyrene sulfonate" },
  "microporous lattice": { mode: "word", respelling: "MY-kroh-POR-əs LAT-iss", ipa: "ˌmaɪ.kroʊˈpɔːr.əs ˈlæt.ɪs" },
  "non-absorbed":    { mode: "word",   respelling: "non-əb-ZORBD" },
  "ADME":            { mode: "letters", respelling: "A-D-M-E", note: "Absorption, Distribution, Metabolism, Excretion" },

  // ---- Disease / physiology ----
  "hyperkalaemia":       { mode: "word", respelling: "HY-pər-kay-LEE-mee-ə",       ipa: "ˌhaɪ.pər.keɪˈliː.mi.ə" },
  "hypokalaemia":        { mode: "word", respelling: "HY-poh-kay-LEE-mee-ə",       ipa: "ˌhaɪ.poʊ.keɪˈliː.mi.ə" },
  "normokalaemia":       { mode: "word", respelling: "NOR-moh-kay-LEE-mee-ə",      ipa: "ˌnɔːr.moʊ.keɪˈliː.mi.ə" },
  "pseudohyperkalaemia": { mode: "word", respelling: "SOO-doh-HY-pər-kay-LEE-mee-ə" },
  "spironolactone":      { mode: "word", respelling: "spy-roh-noh-LAK-tohn",       ipa: "ˌspaɪ.roʊ.noʊˈlæk.toʊn" },
  "oedema":              { mode: "word", respelling: "ih-DEE-mə",                  ipa: "ɪˈdiː.mə" },
  "gastric pH":          { mode: "mixed", respelling: "GAS-trik P-H" },
  "insulin":             { mode: "word", respelling: "IN-sə-lin" },
  "peaked T waves":      { mode: "mixed", respelling: "peekt TEE wayvz" },
  "widened QRS":         { mode: "mixed", respelling: "WY-dənd Q-R-S" },
  "cardiac function":    { mode: "word", respelling: "KAR-dee-ak FUNK-shən" },
  "RAASi":               { mode: "letters", respelling: "R-A-A-S-i", note: "Renin-angiotensin-aldosterone system inhibitor. Some clinicians say it as one word ('razzy') — confirm house convention." },
  "RAASi paradox":       { mode: "mixed", respelling: "R-A-A-S-i PAIR-ə-doks" },
  "MRA":                 { mode: "letters", respelling: "M-R-A", note: "Mineralocorticoid receptor antagonist" },
  "CKD":                 { mode: "letters", respelling: "C-K-D" },
  "ESRD":                { mode: "letters", respelling: "E-S-R-D" },
  "HF":                  { mode: "letters", respelling: "H-F" },
  "HFrEF":               { mode: "letters", respelling: "H-F-r-E-F", note: "Sometimes spoken 'H-F-ref' — confirm house convention." },
  "DM":                  { mode: "letters", respelling: "D-M" },
  "K+":                  { mode: "expand", respelling: "potassium ion" },
  "Ca2+":                { mode: "expand", respelling: "calcium ion" },
  "Mg2+":                { mode: "expand", respelling: "magnesium ion" },
  "IV calcium":          { mode: "mixed", respelling: "I-V KAL-see-əm" },
  "binders":             { mode: "word", respelling: "BYN-dərz" },
  "external balance":    { mode: "word", respelling: "ik-STUR-nəl BAL-əns" },
  "internal balance":    { mode: "word", respelling: "in-TUR-nəl BAL-əns" },

  // ---- Trials / evidence (English study names — read as normal English words) ----
  "HARMONIZE":       { mode: "word",   respelling: "HAR-mə-nyz" },
  "DIALIZE":         { mode: "word",   respelling: "DY-ə-lyz" },
  "REALIZE-K":       { mode: "word",   respelling: "ree-Ə-lyz-KAY" },
  "GALVANIZE":       { mode: "word",   respelling: "GAL-və-nyz" },
  "ZS-002":          { mode: "mixed",  respelling: "Z-S oh-oh-TOO" },
  "ZS-003":          { mode: "mixed",  respelling: "Z-S oh-oh-THREE" },
  "ZS-005":          { mode: "mixed",  respelling: "Z-S oh-oh-FYVE" },
  "NCT03303521":     { mode: "digits", respelling: "N-C-T zero-three-three-zero-three-five-two-one" },
  "observational":   { mode: "word",   respelling: "ob-zər-VAY-shə-nəl" },

  // ---- Dosing shorthand (spoken form, not letters) ----
  "QD":  { mode: "expand", respelling: "once daily" },
  "TID": { mode: "expand", respelling: "three times daily" },
  "10 g TID": { mode: "expand", respelling: "ten grams, three times daily" },
  "5 g QD":   { mode: "expand", respelling: "five grams, once daily" },
};

/**
 * Wrap recognised terms in an SSML <phoneme> tag (IPA) with a plain
 * respelling as the visible fallback text — safe for SSML-aware
 * engines (Azure, Google, Amazon Polly) and harmless for engines that
 * strip tags (the respelling still reads better than raw letters).
 *
 * For `expand` entries, the term is replaced outright with its spoken
 * form (e.g. "QD" -> "once daily") rather than phonemicised, since the
 * whole point is not to sound out the abbreviation.
 */
function phoneticize(text) {
  let out = text;
  // Longest terms first so e.g. "10 g TID" matches before "TID" alone.
  const terms = Object.keys(PHONETICS).sort((a, b) => b.length - a.length);
  for (const term of terms) {
    const entry = PHONETICS[term];
    const re = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    if (entry.mode === 'expand') {
      out = out.replace(re, entry.respelling);
    } else if (entry.ipa) {
      out = out.replace(re, `<phoneme alphabet="ipa" ph="${entry.ipa}">${term}</phoneme>`);
    } else {
      // No IPA available (pure acronym/digit strings) — respelling only.
      out = out.replace(re, entry.respelling);
    }
  }
  return out;
}

if (typeof module !== 'undefined') {
  module.exports = { PHONETICS, phoneticize };
}
