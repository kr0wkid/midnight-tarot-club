/* ------------------------------------------------------------------ */
/*  COMPLETE 78-CARD TAROT DECK (22 Major Arcana + 56 Minor Arcana)   */
/*  Voiced by Anya (visual-kei occult reader) + Rider-Waite symbolism  */
/* ------------------------------------------------------------------ */

export type TopicId = "love" | "future" | "vibes";
export type ArcanaType = "major" | "minor";
export type SuitType = "wands" | "cups" | "swords" | "pentacles";

export interface TarotCard {
  id: number;
  name: string;
  arcana: ArcanaType;
  suit?: SuitType;
  numeral: string;
  icon: string;
  element: string;
  color: string;
  keywords: string[];
  /** -2 (heavy/tower) … +2 (triumphant/sun) */
  vibe: number;
  up: string;
  rev: string;
  symbolism: string;
}

export const SUIT_INFO: Record<SuitType, { name: string; element: string; icon: string; color: string; theme: string }> = {
  wands: { name: "Wands", element: "Fire", icon: "🔥", color: "#ff4a1f", theme: "drive · passion · creative fire · action" },
  cups: { name: "Cups", element: "Water", icon: "💧", color: "#00b8ff", theme: "feelings · intuition · bonds · vulnerability" },
  swords: { name: "Swords", element: "Air", icon: "⚔️", color: "#8b2cff", theme: "truth · intellect · cutting thoughts · conflict" },
  pentacles: { name: "Pentacles", element: "Earth", icon: "🪙", color: "#a8e10c", theme: "money · body · craft · tangible reality" },
};

/* ---------------- 22 MAJOR ARCANA ---------------- */
const MAJORS: TarotCard[] = [
  {
    id: 0,
    name: "The Fool",
    arcana: "major",
    numeral: "0",
    icon: "★",
    element: "Air",
    color: "#6ce4ff",
    keywords: ["leap of faith", "zero bags", "fresh start"],
    vibe: 1,
    up: "a leap off the cliff. you have zero guarantees and that's the superpower. say yes before overthinking murders the magic.",
    rev: "standing at the edge sweating. the jump isn't what hurts — the hesitation is. either leap or step back gracefully.",
    symbolism: "the cliff edge, the white rose of innocence, the little companion barking warning",
  },
  {
    id: 1,
    name: "The Magician",
    arcana: "major",
    numeral: "I",
    icon: "✦",
    element: "Air",
    color: "#ffd15c",
    keywords: ["willpower", "all 4 tools", "manifest"],
    vibe: 1,
    up: "wand, cup, sword, coin — all four elements are on your table right now. stop asking for permission and execute.",
    rev: "you're hoarding tools and watching tutorials instead of building. close twenty tabs and open one project.",
    symbolism: "the infinity lemniscate above the head, the four elemental implements, as above so below",
  },
  {
    id: 2,
    name: "High Priestess",
    arcana: "major",
    numeral: "II",
    icon: "☾",
    element: "Water",
    color: "#a494ff",
    keywords: ["gut intuition", "veil", "airplane mode"],
    vibe: 0,
    up: "the gut feeling you've been muting has been 100% correct. the answer lives behind the curtain — go quiet and listen.",
    rev: "doomscrolling because the silence forces you to think. turn off notifications. your inner voice is screaming.",
    symbolism: "the twin pillars Boaz and Jachin, the pomegranates on the veil, the crescent moon at her feet",
  },
  {
    id: 3,
    name: "The Empress",
    arcana: "major",
    numeral: "III",
    icon: "♥",
    element: "Earth",
    color: "#ff8ab8",
    keywords: ["abundance", "soft era", "nurture"],
    vibe: 1,
    up: "soft power. beauty, art, creative harvest. take care of your people — and actually let yourself receive love for once.",
    rev: "you're pouring from an empty Stanley cup, babe. self-neglect is not a virtue. take a nap, eat hot food.",
    symbolism: "the twelve-star crown, the golden wheat of harvest, the velvet cushions of luxury",
  },
  {
    id: 4,
    name: "The Emperor",
    arcana: "major",
    numeral: "IV",
    icon: "▲",
    element: "Fire",
    color: "#ff7452",
    keywords: ["spine", "boundaries", "empire builder"],
    vibe: 0,
    up: "stone throne energy. establish clear boundaries, build a daily routine, protect what's yours without apologizing.",
    rev: "micromanaging out of panic, or letting someone walk all over your lawn. re-install your spine.",
    symbolism: "the ram-headed stone throne, the golden orb of sovereignty, the armor under red robes",
  },
  {
    id: 5,
    name: "The Hierophant",
    arcana: "major",
    numeral: "V",
    icon: "✎",
    element: "Earth",
    color: "#dfd6c8",
    keywords: ["tradition", "lineage", "learn then break"],
    vibe: 0,
    up: "a mentor, an established system, the textbook move. master the rules thoroughly before you try to burn them down.",
    rev: "stale dogma. you're doing something just because 'that's how it's done.' rebel — the church is empty anyway.",
    symbolism: "the triple papal cross, the crossed keys of wisdom, the two acolytes bowing",
  },
  {
    id: 6,
    name: "The Lovers",
    arcana: "major",
    numeral: "VI",
    icon: "♡",
    element: "Air",
    color: "#ff5e87",
    keywords: ["deep choice", "soul bond", "unmasked"],
    vibe: 2,
    up: "a choice made with your whole chest. alignment between who you are and who you love. real ones only from here.",
    rev: "performing a connection that expired three months ago. when love becomes a chore, the mirror is cracked.",
    symbolism: "the angel Raphael blessing the pair, the tree of life and tree of knowledge",
  },
  {
    id: 7,
    name: "The Chariot",
    arcana: "major",
    numeral: "VII",
    icon: "➤",
    element: "Water",
    color: "#5ce6bf",
    keywords: ["speed", "dual steeds", "iron focus"],
    vibe: 1,
    up: "black and white sphinxes pulling in opposite directions — and you're steering both. unstoppable momentum.",
    rev: "spinning your wheels in the gravel. pick ONE lane and floor it; trying to visit four parties in one night fails all four.",
    symbolism: "the star-canopy chariot, the opposing black and white sphinxes, the laurel wreath of victory",
  },
  {
    id: 8,
    name: "Strength",
    arcana: "major",
    numeral: "VIII",
    icon: "❀",
    element: "Fire",
    color: "#ffad5a",
    keywords: ["taming the beast", "soft hands", "endurance"],
    vibe: 1,
    up: "you don't conquer the lion by punching it; you conquer it by stroking its mane. calm confidence beats rage.",
    rev: "self-doubt is chewing on your leg. you're stronger than the spiral, but you gotta stop feeding the beast.",
    symbolism: "the maiden gently closing the lion's jaws, the infinity lemniscate, garland of wild roses",
  },
  {
    id: 9,
    name: "The Hermit",
    arcana: "major",
    numeral: "IX",
    icon: "◉",
    element: "Earth",
    color: "#9db8df",
    keywords: ["lantern in fog", "solitude", "inner compass"],
    vibe: 0,
    up: "step back from the noise. one lonely lantern lights the next step. you already know the answer; everyone else is static.",
    rev: "isolation rot. rotting in bed pretending it's 'spiritual work.' text your friends, open the window.",
    symbolism: "the single six-pointed star within the lantern, the snowy mountain peak, the walking staff",
  },
  {
    id: 10,
    name: "Wheel of Fortune",
    arcana: "major",
    numeral: "X",
    icon: "⟳",
    element: "Fire",
    color: "#7fffd4",
    keywords: ["the turn", "karmic shift", "luck rotates"],
    vibe: 1,
    up: "the wheel is spinning in your favor. a sudden break, a lucky encounter, an unexpected door. be ready to jump on.",
    rev: "a dip in the cycle. don't take it personally — the wheel didn't target you, it just rotated. wait for the upswing.",
    symbolism: "the four winged creatures of the tetramorph, the Hebrew letters YHVH, the descending snake and ascending Anubis",
  },
  {
    id: 11,
    name: "Justice",
    arcana: "major",
    numeral: "XI",
    icon: "⚖",
    element: "Air",
    color: "#ede9e0",
    keywords: ["receipts", "fair cut", "truth out"],
    vibe: 0,
    up: "the sword cuts clean, the scales balance. truth comes out into the light. keep your side spotless and let it land.",
    rev: "unfairness in the room. someone is playing favorites or dodging accountability. the universe keeps tabs.",
    symbolism: "the double-edged upright sword, the balanced brass scales, the purple veil of impartiality",
  },
  {
    id: 12,
    name: "The Hanged Man",
    arcana: "major",
    numeral: "XII",
    icon: "⏸",
    element: "Water",
    color: "#96beff",
    keywords: ["new perspective", "sacred pause", "surrender"],
    vibe: -1,
    up: "hung by one ankle from the living tree, halo glowing. doing nothing IS the active move right now. view it upside down.",
    rev: "martyr complex. suffering dramatically for people who didn't even notice. cut yourself down from the tree.",
    symbolism: "the halo around the inverted head, the living T-cross (tau), the relaxed leg forming the number four",
  },
  {
    id: 13,
    name: "Death",
    arcana: "major",
    numeral: "XIII",
    icon: "✕",
    element: "Water",
    color: "#d0cac2",
    keywords: ["the clean end", "shedding skins", "sunrise next"],
    vibe: -1,
    up: "the old chapter is dead. don't embalm it. let it crumble so the sunrise between the twin towers can happen.",
    rev: "clinging to a zombie situation. relationship, habit, or dream that died months ago — sign the death certificate.",
    symbolism: "the black banner with the white mystic rose, the five-petaled rose of life, the sunrise between distant pillars",
  },
  {
    id: 14,
    name: "Temperance",
    arcana: "major",
    numeral: "XIV",
    icon: "≋",
    element: "Fire",
    color: "#72f0db",
    keywords: ["alchemy", "slow blend", "the middle road"],
    vibe: 1,
    up: "pouring water between golden cups without spilling a drop. balance is alchemy. blend opposites into gold.",
    rev: "extreme binge-and-purge cycle. all in or all out. your nervous system wants a warm bath, not another energy drink.",
    symbolism: "the angel with one foot in water and one on land, the perpetual stream between cups, the winding path to the dawn",
  },
  {
    id: 15,
    name: "The Devil",
    arcana: "major",
    numeral: "XV",
    icon: "⛓",
    element: "Earth",
    color: "#ff5050",
    keywords: ["loose chains", "toxic loop", "name the addiction"],
    vibe: -1,
    up: "the chains around your neck are actually loose enough to slip off over your head. you stay because it's familiar. slip out.",
    rev: "the spell breaks. seeing the obsession for what it is — a cheap thrill with high interest. walking toward the exit.",
    symbolism: "the goat-headed Baphomet, the inverted pentagram, the lovers chained with loops wide enough to escape",
  },
  {
    id: 16,
    name: "The Tower",
    arcana: "major",
    numeral: "XVI",
    icon: "⚡",
    element: "Fire",
    color: "#ffe142",
    keywords: ["lightning bolt", "the illusion cracks", "free fall"],
    vibe: -2,
    up: "lightning strikes the crown. what was built on lies falls in fifteen seconds. scary right now — absolute liberation later.",
    rev: "delaying the inevitable collapse by patching drywall over cracked foundations. let it fall. the ground is safe.",
    symbolism: "the lightning bolt knocking off the crown of pride, the 22 drops of fire (letters of Hebrew alphabet), falling figures",
  },
  {
    id: 17,
    name: "The Star",
    arcana: "major",
    numeral: "XVII",
    icon: "☆",
    element: "Air",
    color: "#d0e6ff",
    keywords: ["pure hope", "wishing well", "cleansing waters"],
    vibe: 2,
    up: "the morning star rises over the lake. pure hope, inspiration, deep healing. you survived the tower — now make your wish.",
    rev: "cynicism disguised as 'being realistic.' you're guarding your heart so hard you forgot how to dream. let hope in.",
    symbolism: "the great eight-pointed star surrounded by seven smaller stars, the ibis bird in the tree, water poured on land and sea",
  },
  {
    id: 18,
    name: "The Moon",
    arcana: "major",
    numeral: "XVIII",
    icon: "☽",
    element: "Water",
    color: "#929fff",
    keywords: ["secrets", "2am delusions", "wolf & hound"],
    vibe: -1,
    up: "the path between the towers is lit by moonlight; shadows look like monsters. intuition is high, but check your facts.",
    rev: "the 2am fog begins to lift. the secret unravels, the panic attack turns out to be dehydration. reality returns.",
    symbolism: "the crayfish crawling out of the dark water, the wolf and dog howling at the moon, dew drops of yod falling",
  },
  {
    id: 19,
    name: "The Sun",
    arcana: "major",
    numeral: "XIX",
    icon: "☀",
    element: "Fire",
    color: "#ffd438",
    keywords: ["main character", "unadulterated joy", "warm YES"],
    vibe: 2,
    up: "the naked child riding the white horse under sunflowers. absolute, unadulterated YES. joy, clarity, celebration, warmth.",
    rev: "the sun is behind a cloud for twenty minutes. the warmth didn't disappear — you just forgot to look up.",
    symbolism: "the four sunflowers of the four elements, the red banner of vitality, the white horse of solar triumph",
  },
  {
    id: 20,
    name: "Judgement",
    arcana: "major",
    numeral: "XX",
    icon: "♪",
    element: "Fire",
    color: "#ffaee6",
    keywords: ["the wake-up horn", "calling", "forgive past-you"],
    vibe: 1,
    up: "Gabriel's horn sounds across the water. rise from the coffin. you are being called up into your next evolution. answer it.",
    rev: "replaying the cringe from three years ago in 4K resolution. forgive past-you — she didn't have the script yet.",
    symbolism: "the angel blowing the banner-draped trumpet, the souls rising with arms outstretched from floating coffins",
  },
  {
    id: 21,
    name: "The World",
    arcana: "major",
    numeral: "XXI",
    icon: "◯",
    element: "Earth",
    color: "#9affc2",
    keywords: ["chapter complete", "the laurel wreath", "wholeness"],
    vibe: 2,
    up: "the dancer in the laurel wreath. a major life chapter closes in triumph. you did it. take a breath, celebrate loudly.",
    rev: "99% downloaded. finish that one last boring detail so the file actually opens. don't leave the victory hanging.",
    symbolism: "the green laurel wreath bound by red ribbons of infinity, the four living creatures guarding the four corners",
  },
];

/* ---------------- 56 MINOR ARCANA ---------------- */
function minorNum(n: number): string {
  if (n === 1) return "Ace";
  if (n === 11) return "Page";
  if (n === 12) return "Knight";
  if (n === 13) return "Queen";
  if (n === 14) return "King";
  return String(n);
}

function buildMinors(): TarotCard[] {
  const cards: TarotCard[] = [];
  const suits: SuitType[] = ["wands", "cups", "swords", "pentacles"];

  // hand-crafted meanings for each suit & rank
  const WANDS_UP = [
    "raw creative ignition. a divine spark drops into your lap — strike while the wood is dry.",
    "standing on the parapet holding the globe. the plan is sketched; now choose which harbor to sail toward.",
    "your ships are coming in across the golden sea. expansion, foresight, trusting what you sent out.",
    "four flower-wreathed staves, cozy homecoming. a safe harbor, genuine celebration, found family vibes.",
    "five kids swinging sticks in the dirt. petty competition, group chat noise, playful chaos — pick your battles.",
    "riding down the boulevard crowned with laurel. public victory, validated efforts, everyone cheering.",
    "holding the high ground against six attackers below. do not yield an inch — you have the vantage.",
    "eight arrows slicing through clear sky. swift messages, rapid momentum, things moving faster than your thumbs.",
    "bandaged forehead, leaned against the ninth staff. exhausted but undefeated. one last shift and you're clear.",
    "carrying ten heavy logs toward town, head down. you volunteered for too much. put half of it down.",
    "the passionate messenger. spicy gossip, exciting invitation, fresh curiosity about a wild idea.",
    "charging into the desert on a rearing steed. bold, impulsive, unstoppable drive — don't forget the brakes.",
    "sunflowers, black cat at her throne. magnetic confidence, warm leadership, unapologetically fierce.",
    "lion-carved throne, salamander mantle. master of vision, executive fire, getting everyone on board.",
  ];
  const WANDS_REV = [
    "fizzled spark. waiting for inspiration when what you actually need is discipline.",
    "paralysis by planning. staring at Google Maps instead of taking the first step.",
    "shipping delays. frustrating lag between your effort and the visible payoff.",
    "tension at home. awkward family dinner, feeling like an outsider at your own table.",
    "pointless drama. exhausting debates with people who just want to be loud.",
    "impostor syndrome crashing your victory lap. you earned the laurel — wear it.",
    "overwhelmed on the hill. take a step back and let someone else guard the door.",
    "miscommunications, delayed flights, texts delivered with the wrong tone.",
    "paranoia. you're flinching at shadows thinking someone is out to get you.",
    "crushed by your own promises. drop the extra weight before your knees buckle.",
    "all bark, no bite. loud promises that dissolve the moment work is required.",
    "reckless burnout. picking fights out of sheer boredom and caffeine overload.",
    "jealousy creeping into your circle. don't let insecurity dim your candle.",
    "authoritarian temper tantrum. when vision turns into stubborn dictatorship.",
  ];

  const CUPS_UP = [
    "the overflowing chalice. an outpouring of fresh love, raw tenderness, creative empathy.",
    "two cups pledged across the caduceus. mutual spark, balanced partnership, meeting your mirror.",
    "three girls dancing with raised cups. friendship circle, weekend toast, pure unfiltered warmth.",
    "sitting under the tree ignoring the fourth cup offered from the cloud. apathy, boredom, blind to the gift.",
    "three spilled cups, black cloak. mourning what leaked out — but two cups behind you are still full.",
    "exchanging white lilies in golden cups. childhood nostalgia, innocent kindness, sweet memories returning.",
    "seven cups floating in smoke (dragon, jewels, castle). so many fantasies, zero grounding — choose one reality.",
    "walking away from eight neatly stacked cups into the mountains. outgrowing a good thing for a truer thing.",
    "sitting proudly before nine full cups. wish fulfilled, emotional satisfaction, smug cozy happiness.",
    "rainbow of ten cups over the green meadow. emotional completion, harmonious home, peaceful heart.",
    "sweet dreamer holding a cup with a curious fish peering out. gentle intuition, sweet creative whispers.",
    "the romantic poet riding slowly toward the river. arriving with an open heart, offering peace.",
    "sculpting the cup of vision by the tide. emotional depth, psychic empathy, holding space for others.",
    "throne floating on rough waters while holding the golden cup steady. emotional maturity, calm in storms.",
  ];
  const CUPS_REV = [
    "emotional leak. bottling up tears until they flood your kitchen floor.",
    "one-sided crush. you're pouring all the tea while they barely hold the cup.",
    "clique drama, third-wheeling, gossip spoiling a friendship circle.",
    "shaking yourself out of the funk. finally noticing the cup offered right in front of you.",
    "picking yourself up off the wet pavement. turning around to see the two full cups.",
    "stuck in 2019 nostalgia. living in the scrapbook instead of the present hour.",
    "analysis paralysis. daydreaming yourself into a spiral of impossible choices.",
    "clinging to a connection you know you've already outgrown. pack your boots and walk.",
    "smug complacency, shallow indulgence. getting what you wanted and feeling hollow.",
    "fractures in the picture-perfect illusion. performative harmony hiding old grudges.",
    "moody, easily offended, playing the fragile victim in your own movie.",
    "manipulative love-bombing. sweet words that disappear the moment reality asks for rent.",
    "smothering codependency. drowning in someone else's emotional puddle.",
    "emotional manipulation, cold detachment, turning off feelings out of spite.",
  ];

  const SWORDS_UP = [
    "the double-edged blade piercing the golden crown. mental breakthrough, absolute truth, cutting clarity.",
    "blindfolded with two crossed swords on the shore. a deadlock choice; you have to remove the blindfold.",
    "three swords piercing the rain-soaked heart. heartbreak, sharp sorrow, painful truth that needed to land.",
    "tomb effigy in peaceful rest under church stained glass. mandatory sabbatical, resting your brain, silent retreat.",
    "smirking figure gathering dropped blades while losers walk away. hollow victory — you won the argument and lost the friend.",
    "the boatman poling six upright swords across still waters. smooth sailing ahead, moving on from rough seas.",
    "sneaking out of camp with five swords underarm, smiling. stealth, clever maneuver, working smarter not louder.",
    "bound and blindfolded in a cage of eight swords. the cage is open — you can step out whenever you stop panicking.",
    "waking in bed with head in hands, nine swords hanging overhead. 3am anxiety spiral, nightmares, manufactured doom.",
    "ten swords in the back on the beach, but sunrise is breaking. rock bottom reached — the worst is literally over.",
    "alert scout with blade raised against squally clouds. sharp mind, curious investigator, fact-checking everything.",
    "charging headlong through wind with sword thrust out. fierce intellect, fearless truth-teller, zero hesitation.",
    "stern profile on the carved throne, hand raised. sharp wit, independent mind, zero tolerance for manipulation.",
    "throne of judgment holding the upright sword of reason. authority, mental mastery, decisive leadership.",
  ];
  const SWORDS_REV = [
    "cloudy intellect, words weaponized for cruelty rather than clarity.",
    "forced to make the call. the deadlock breaks whether you like it or not.",
    "healing from the puncture. the bleeding stops, scar tissue is becoming wisdom.",
    "restlessness, burnout recovery, returning to the fight too soon.",
    "settling the grudge, apologizing, realizing winning the fight wasn't worth the carnage.",
    "baggage weighing down the boat. dragging old drama into the new city.",
    "impostor guilt, getting caught in a half-truth, owning up to your shortcuts.",
    "realizing the ropes were loose. stepping out of the victim cage into agency.",
    "sunlight melting the nightmare. realizing your 3am thoughts were lying to you.",
    "the corpse gets up. surviving the unsurvivable and dusting yourself off.",
    "petty internet troll, gossiping, being smart-aleck instead of helpful.",
    "hasty cruelty, charging into a minefield because you wanted to look brave.",
    "bitter cynicism, freezing everyone out behind an icy wall of sarcasm.",
    "cruel tyranny, overthinking yourself into cold paralysis.",
  ];

  const PENTS_UP = [
    "the golden coin floating in the garden gateway. material seed, new financial door, tangible blessing.",
    "juggling two coins within the green infinity loop while ships ride waves. multitasking, playful balance.",
    "master mason carving the cathedral arch with monk and architect. collaborative craft, respected skill.",
    "hugging the coin to your chest, sitting on two, one on your crown. financial security — but watch the hoarding.",
    "two barefoot figures limping past the stained glass window in the snow. temporary hardship, feeling left out in the cold.",
    "the merchant weighing coins into beggars' hands. generosity, fair exchange, grants received, balance restored.",
    "leaning on the hoe looking at the harvest on the vine. patient investment, long-term payoff, checking progress.",
    "the artisan hammering the eighth coin on the bench. master at work, deep focus, honing the craft.",
    "luxurious vineyard with hooded falcon on her gloved hand. self-made luxury, elegant independence, private peace.",
    "three generations under the stone archway with hounds. generational legacy, long-term wealth, home roots.",
    "studious youth holding a coin against fertile hills. studious apprentice, practical curiosity, good news about money.",
    "the heavy plow horse standing patient in the plowed field. reliable workhorse, steady progress, relentless loyalty.",
    "warm throne among blossoms and rabbits holding the great coin. warm provider, earthy hospitality, body positivity.",
    "castle throne surrounded by vines and bull motifs. financial empire, material mastery, generous provider.",
  ];
  const PENTS_REV = [
    "missed financial chance, sloppy budgeting, spending the seed before it sprouts.",
    "dropping the plates. overcommitted, budget leaking, running around like crazy.",
    "sloppy group project, ego clash between creators, shoddy craftsmanship.",
    "scarcity mindset. terrified of spending three dollars because the apocalypse is coming.",
    "finding the warm door. stepping in from the snow, financial aid arriving, healing pride.",
    "strings attached to the 'favor', unequal power dynamics, debt that feels like a leash.",
    "giving up five minutes before the harvest sprouts. impatient frustration with slow gains.",
    "perfectionism paralysis, mindless repetitive grind with zero soul, cutting corners.",
    "material superficiality, living beyond your means to impress followers who don't care.",
    "family financial friction, disputed inheritance, traditional expectations suffocating you.",
    "financial procrastination, ditching the textbook, reckless spending on gadgets.",
    "stubborn rut, obsessive workaholic refusing to take a weekend, stuck in cement.",
    "work-life collapse, smothering helicopter energy, neglecting the physical body.",
    "greed, corrupt empire, measuring human worth purely by net worth.",
  ];

  const suitMaps = {
    wands: { up: WANDS_UP, rev: WANDS_REV },
    cups: { up: CUPS_UP, rev: CUPS_REV },
    swords: { up: SWORDS_UP, rev: SWORDS_REV },
    pentacles: { up: PENTS_UP, rev: PENTS_REV },
  };

  // distinct hero glyph per rank so all 78 cards read differently in the fan
  const RANK_ICONS: Record<SuitType, string[]> = {
    wands: ["🔥", "🧭", "⛵", "🏠", "🥊", "🏆", "🛡️", "💨", "🩹", "🎒", "✉️", "🐎", "🌻", "👑"],
    cups: ["💧", "💞", "🥂", "😶", "🌧️", "🍬", "☁️", "🥾", "🌟", "🌈", "🐟", "💌", "🌊", "⚓"],
    swords: ["🗡️", "🔀", "💔", "🛌", "😏", "🌊", "🥷", "⛓️", "🌙", "🌅", "🔍", "⚡", "🧊", "⚖️"],
    pentacles: ["🪙", "🤹", "🏛️", "🔒", "❄️", "⚖️", "🌱", "🔨", "🍇", "🏠", "📚", "🐂", "🌸", "🏰"],
  };

  let idCounter = 22;
  suits.forEach((suit) => {
    const meta = SUIT_INFO[suit];
    const map = suitMaps[suit];
    for (let rank = 1; rank <= 14; rank++) {
      const rankName = minorNum(rank);
      const isCourt = rank >= 11;
      const fullName = `${rankName} of ${meta.name}`;
      const vibeScore =
        rank === 1 ? 1 : rank === 3 || rank === 6 || rank === 9 || rank === 10 ? 1 : rank === 5 || rank === 10 && suit === "swords" ? -2 : rank === 5 ? -1 : 0;

      cards.push({
        id: idCounter++,
        name: fullName,
        arcana: "minor",
        suit,
        numeral: isCourt ? rankName[0] : String(rank),
        icon: RANK_ICONS[suit][rank - 1],
        element: meta.element,
        color: meta.color,
        keywords: [meta.name.toLowerCase(), rankName.toLowerCase(), isCourt ? "court card" : "pip"],
        vibe: vibeScore,
        up: map.up[rank - 1],
        rev: map.rev[rank - 1],
        symbolism: `${meta.name} (${meta.element}): ${meta.theme}`,
      });
    }
  });

  return cards;
}

export const DECK: TarotCard[] = [...MAJORS, ...buildMinors()];

export interface DrawnCard {
  uid: number;
  card: TarotCard;
  reversed: boolean;
}

let uid = 1;

/**
 * Builds a fresh fanned spread.
 * Guarantees a rich, realistic tarot mix: at least 1 Major Arcana + a selection of Minors.
 */
export function buildSpread(n = 7): DrawnCard[] {
  const majors = DECK.filter((c) => c.arcana === "major");
  const minors = DECK.filter((c) => c.arcana === "minor");

  // shuffle pools
  const shuffle = <T>(arr: T[]) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const shMajors = shuffle(majors);
  const shMinors = shuffle(minors);

  // Take 2 majors + 5 minors for a balanced 7-card spread
  const selection = shuffle([...shMajors.slice(0, 2), ...shMinors.slice(0, n - 2)]);

  return selection.map((card) => ({
    uid: uid++,
    card,
    reversed: Math.random() < 0.28,
  }));
}

export const POSITIONS = [
  { id: "past", label: "I · PAST", sub: "the foundation · where you stood" },
  { id: "present", label: "II · PRESENT", sub: "the current storm · your cross" },
  { id: "future", label: "III · DESTINY", sub: "the horizon · where momentum leads" },
] as const;

export interface Verdict {
  stars: number;
  title: string;
  text: string;
  elements: string[];
}

export function verdictFor(picked: DrawnCard[], topic: TopicId | null): Verdict {
  const score = picked.reduce((s, p) => s + (p.reversed ? -p.card.vibe * 0.5 : p.card.vibe), 0);
  const elements = picked.map((p) => p.card.element);
  const majorCount = picked.filter((p) => p.card.arcana === "major").length;

  const topicNote =
    topic === "love"
      ? "in love & connection: stop performing for an audience that doesn't own tickets."
      : topic === "future"
        ? "for your trajectory: the path isn't paved, which means you get to pick the asphalt."
        : "for your aura: clean, charged, and tuned to 2am sodium light.";

  const weight = majorCount >= 2 ? " [Heavy Karmic Arc]" : majorCount === 1 ? " [Pivotal Turning Point]" : " [Daily Practical Action]";

  if (score >= 3.5) {
    return {
      stars: 5,
      title: `✦ BLESSED HARVEST ✦${weight}`,
      text: `the spread is humming with gold. all three cards point in alignment. ${topicNote} trust the opening.`,
      elements,
    };
  }
  if (score >= 1.5) {
    return {
      stars: 4,
      title: `soft momentum era${weight}`,
      text: `green lights ahead. not effortless, but thoroughly rewarding if you stay in motion. ${topicNote}`,
      elements,
    };
  }
  if (score >= -0.5) {
    return {
      stars: 3,
      title: `plot twist chapter${weight}`,
      text: `the cards are testing your pivot speed. messy middle, good resolution loading. ${topicNote}`,
      elements,
    };
  }
  if (score >= -2.5) {
    return {
      stars: 2,
      title: `spicy character development${weight}`,
      text: `not cursed, just cinematic and sharp. hold your boundaries tightly this week. ${topicNote}`,
      elements,
    };
  }
  return {
    stars: 1,
    title: `tower season · clearing space${weight}`,
    text: `the old structure is coming down fast so real timber can go up. let the rubble fall. ${topicNote}`,
    elements,
  };
}
