import type { TopicId } from "./tarot";

export type GirlId = "anya" | "mila" | "kira";

/*
  ANYA — scorpio. the witch. candles, jars, freezer spells, moon water. reads the cards.
         dry, a little dark, will threaten to hex you, secretly the softest.
  MILA — gemini. the astrology girl. knows everyone's big three, blames everything on
         placements. loud, gossipy, first to be nice, first to judge your sign.
  KIRA — capricorn (cancer moon, hates that). "doesn't believe in any of it", keeps a
         dream journal, counts numbers on everything. deadpan and the meanest.
*/
export const GIRLS: Record<GirlId, { name: string; color: string; pitch: number; role: string }> = {
  anya: { name: "ANYA", color: "#ff5c6a", pitch: 420, role: "scorpio · candle witch · reads the cards" },
  mila: { name: "MILA", color: "#a6e94a", pitch: 740, role: "gemini · knows your big three already" },
  kira: { name: "KIRA", color: "#4f9bff", pitch: 540, role: "capricorn · dreams & numbers · 'doesn't believe it'" },
};

export interface Line {
  who: GirlId;
  text: string;
}

const a = (text: string): Line => ({ who: "anya", text });
const m = (text: string): Line => ({ who: "mila", text });
const k = (text: string): Line => ({ who: "kira", text });

/* ------------------------------------------------------------------ */
/*  AMBIENT — little scenes they drift through when nobody's around    */
/* ------------------------------------------------------------------ */
export const SCENES: Line[][] = [
  // chem teacher
  [
    m("mr. haddad said my lab report 'lacked effort.' he's a virgo. obviously he said that."),
    k("you wrote it in the car. in pen. on a receipt."),
    m("and it was still better than his personality."),
    a("want me to do something about him?"),
    k("don't hex a teacher over a C minus."),
    a("it's not a hex. it's a strongly worded candle."),
  ],
  // mercury retrograde
  [
    m("mercury goes retrograde thursday so if i text anyone weird this week it's not my fault."),
    k("you texted your ex 'u up' in august. mercury wasn't doing anything in august."),
    m("mercury was in my fifth house, kira. educate yourself."),
    k("i don't have houses. i have a bedroom and a mom who doesn't knock."),
  ],
  // freezer spell
  [
    a("i put dylan's name in the freezer."),
    m("what did he even do"),
    a("said my hair looked like a crime scene."),
    k("your hair does look like a crime scene."),
    a("there's room in there for you."),
  ],
  // the mile
  [
    k("coach made us run the mile. i walked it and lied about my time."),
    m("what'd you say"),
    k("six minutes."),
    a("nobody believes you ran a six minute mile."),
    k("he wrote it down. he doesn't care. nobody cares. that's the secret to school."),
  ],
  // big three
  [
    m("okay i'm making a big three chart for the group chat. anya, go."),
    a("scorpio sun, scorpio moon. you know my rising."),
    m("aquarius. which is why you're like this."),
    k("i'm not telling you mine."),
    m("you're a capricorn with a cancer moon and it's the funniest thing i know."),
    k("i'll walk into traffic."),
  ],
  // moon water
  [
    a("full moon saturday. i'm leaving water out on the roof."),
    k("last time you did that a pigeon drank it."),
    a("and that pigeon is thriving. i see him every day."),
    m("he does look blessed."),
  ],
  // the sub
  [
    m("we had a sub in english who cried during the poem."),
    k("which poem"),
    m("the red wheelbarrow one."),
    a("respect. that's a lot riding on one wheelbarrow."),
  ],
  // teeth dream
  [
    k("had the teeth falling out dream again."),
    a("that's stress. or money. or you're about to lose something."),
    m("or you need a dentist."),
    k("i hate that all three of those are true."),
  ],
  // mom vs tarot
  [
    m("my mom found my tarot deck and said it's 'a door for demons.'"),
    a("it's a door for vibes. at most."),
    k("tell her it's for a school project."),
    m("on what, being possessed?"),
    k("yeah. extra credit."),
  ],
  // wet pizza
  [
    k("the pizza today was wet. not greasy. wet."),
    m("that's a pisces pizza."),
    a("stop giving food star signs."),
    m("you know exactly what i mean though."),
    a("...yeah. i do."),
  ],
  // libras
  [
    m("jordan from bio is a libra. that's a red flag with a nice haircut."),
    a("all libras are a red flag with a nice haircut."),
    k("my cousin's a libra."),
    a("exactly."),
  ],
  // vending machine
  [
    k("the machine ate my coins again. piece of shit."),
    a("kick it on the left side. under the logo."),
    k("that's not a fix, that's assault."),
    a("works though."),
  ],
  // locker sigil
  [
    a("i drew a protection sigil inside my locker in sharpie."),
    m("is that why it smells like that"),
    a("that's the sharpie. and gerald's lunch. mostly sharpie."),
  ],
  // group chat exile
  [
    m("chloe left the group chat."),
    k("good. she only ever sent pictures of her dog."),
    m("her dog's cute though."),
    k("her dog looks like a boiled potato."),
    a("boiled potatoes are cute."),
  ],
  // detention
  [
    k("i got detention for 'disrupting the learning environment.'"),
    m("what did you do"),
    k("yawned."),
    a("loud?"),
    k("...it had some volume to it."),
  ],
  // teacher chart
  [
    m("looked up ms. park's birthday on facebook. aries. explains the whistle."),
    a("you stalked a teacher for astrology."),
    m("i did research. for the good of the class."),
    k("put it on your college application."),
  ],
  // roundabout
  [
    k("failed my driving test again."),
    m("what happened this time"),
    k("went straight through a roundabout."),
    a("like... through it?"),
    k("there was grass. i was there. shit happened."),
  ],
  // curse ethics
  [
    m("anya can you curse someone just a little. like a stubbed toe."),
    a("i don't do toes. it comes back threefold."),
    k("so you'd get three stubbed toes."),
    a("three stubbed toes, yeah. not worth it for brittany."),
  ],
  // master number
  [
    k("my locker number adds up to eleven. that's a master number."),
    a("since when do you care about numerology"),
    k("i don't. it's just nice to be told i'm special by math."),
  ],
  // cramps
  [
    m("my cramps are so bad i'd sell my soul right now."),
    a("i can arrange that."),
    m("for real?"),
    a("no. take an advil like a normal person."),
  ],
  // witching hour
  [
    k("why are we always out here at two am."),
    m("because it's the witching hour."),
    a("the witching hour's three."),
    m("so we're early. we're responsible."),
  ],
  // black candles
  [
    a("black for banishing. pink for self love. red for... you know."),
    k("you only own black candles."),
    a("i banish a lot."),
  ],
  // picture day
  [
    m("picture day's tomorrow and i have a zit the size of mars."),
    a("mars is in your first house right now. makes sense."),
    m("don't use astrology against me."),
    k("just say it's a beauty mark."),
    m("it's red, kira."),
    k("a spicy beauty mark."),
  ],
  // science fair
  [
    k("my little brother's science fair thing is 'can plants hear music.'"),
    a("can they?"),
    k("his plant died. so no. or it hated the music."),
    m("what was he playing"),
    k("nickelback."),
    m("oh then it chose death."),
  ],
  // scorpios
  [
    m("never date a scorpio. no offense anya."),
    a("offense taken. and correct."),
  ],
  // skeptic
  [
    k("i don't believe in any of this, for the record."),
    m("you asked me if your ex's moon sign was compatible with your venus."),
    k("i was drunk on orange fanta."),
    a("that's not a thing."),
    k("it is if you believe."),
  ],
  // pillow studying
  [
    m("i studied for the history test by sleeping with the textbook under my pillow."),
    a("people actually do that."),
    m("i got a 42."),
    k("so it worked 42 percent."),
  ],
  // principal's tie
  [
    a("the principal walked past me and his tie was crooked. i fixed it with my mind."),
    k("no you didn't."),
    a("he touched it right after. coincidence? no."),
  ],
  // mom's boyfriend
  [
    k("my mom's new boyfriend is a gemini."),
    m("hey. but also, oh no. two of him."),
    k("there's already too much of one of him."),
  ],
  // mall quartz
  [
    m("got a rose quartz at the mall. it's supposed to attract love."),
    k("the kiosk guy asked for your number. so it's working."),
    m("not like THAT."),
    a("he was like thirty."),
    m("i know, anya."),
  ],
  // math homework
  [
    a("did anyone do the math homework"),
    k("define 'do'"),
    a("look at it."),
    k("then no."),
  ],
  // forty
  [
    m("what if we're still doing this when we're forty."),
    k("under this lamp?"),
    m("yeah."),
    a("the lamp won't be here. the city's switching everything to LEDs."),
    m("that's the saddest thing you've ever said."),
  ],
  // ouija
  [
    m("we should do the ouija board this weekend."),
    a("absolutely not. last time it spelled 'ham.'"),
    k("it was trying to tell us something."),
    a("it was telling us you were moving the planchette."),
    k("the spirits were hungry."),
  ],
  // horoscope app
  [
    m("my horoscope says 'expect a surprise from an old friend.'"),
    k("we're your only friends and we're right here."),
    m("surprise me then."),
    k("...i ate your chips earlier."),
  ],
  // anya's birthday
  [
    a("my birthday's in three weeks and i want nothing."),
    m("a scorpio saying she wants nothing means she wants everything."),
    a("i want a black cat and for everyone to leave me alone."),
    k("the cat's doable."),
  ],
  // cult rumour
  [
    m("people at school think we're a cult."),
    k("we're three girls under a streetlight."),
    a("that's how every cult starts."),
  ],
  // potato portrait
  [
    k("we had to draw a self portrait in art. i drew a potato."),
    m("was that the assignment or"),
    k("it's how i see myself. i got a B."),
    a("the potato earned it."),
  ],
  // sleep
  [
    m("i've slept four hours this week."),
    a("total?"),
    m("i'm a gemini. i rest in pieces."),
    k("that's not what that means."),
  ],
  // blunt eyeliner
  [
    a("my sister borrowed my eyeliner and gave it back blunt."),
    m("that's actually a crime."),
    a("she's in the freezer."),
    k("your freezer's got more people in it than our grade."),
  ],
  // nothing happens
  [
    k("i feel like nothing's ever gonna happen to us."),
    a("something's happening right now."),
    k("what"),
    a("we're cold."),
  ],
  // viewer
  [
    m("don't look but someone's been standing over there for a while."),
    k("at two am? they're either cool or a cop."),
    a("cops don't wear shoes like that."),
    m("so cool then. great. hi."),
  ],
  // prom
  [
    m("are we going to prom or are we being above it."),
    k("above it. it's forty dollars to watch kyle cry in a rented vest."),
    a("i'd go if i could bring a candle."),
    m("they'll say it's a fire hazard."),
    a("i'm a fire hazard."),
  ],
  // ex's rising
  [
    m("i figured out why tyler was so weird. leo rising."),
    k("or he's just weird."),
    m("it can be both. that's the thing about astrology."),
    a("that's the thing about tyler."),
  ],
  // lunch table
  [
    k("someone sat at our lunch table today."),
    m("who"),
    k("some sophomore. she said 'is this seat taken' and i said 'emotionally, yes.'"),
    a("did she leave"),
    k("she's sitting with us tomorrow. she was kind of funny."),
  ],
  // lemon spell
  [
    a("if you write someone's name on a lemon and freeze it, they shut up."),
    m("does it work?"),
    a("mrs. dolan lost her voice for a week."),
    k("mrs. dolan had strep."),
    a("strep is a tool, kira."),
  ],
  // dream about a teacher
  [
    k("had a dream mr. haddad was my dad."),
    m("oh my god."),
    k("he made me pancakes and told me my effort was lacking."),
    a("that's a warning. change your life."),
  ],
  // angel numbers
  [
    m("i keep seeing 222 everywhere. that's balance. the universe is telling me something."),
    k("the bus you take is the 222."),
    m("and the universe put me on it."),
  ],
  // babysitting
  [
    k("i'm babysitting the kid next door friday. he asked if i'm a vampire."),
    a("what did you say"),
    k("i said 'only on weekends.' he's been really well behaved since."),
  ],
  // bad hair day
  [
    m("i look like a thumb in this beanie."),
    a("a cute thumb."),
    k("a thumb with ears."),
    m("i hate both of you and i'm keeping it on."),
  ],
];

/** walk through shuffled scenes line by line, forever */
let order: number[] = [];
let sceneIdx = 0;
let lineIdx = 0;
let endOfScene = false;

function shuffleOrder() {
  order = SCENES.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [order[i], order[j]] = [order[j], order[i]];
  }
}

export function nextAmbientLine(): Line {
  if (!order.length) shuffleOrder();
  const scene = SCENES[order[sceneIdx]];
  const line = scene[lineIdx];
  lineIdx++;
  endOfScene = lineIdx >= scene.length;
  if (endOfScene) {
    lineIdx = 0;
    sceneIdx++;
    if (sceneIdx >= order.length) {
      sceneIdx = 0;
      shuffleOrder();
    }
  }
  return line;
}

/** true right after the last line of a scene (so chatter can take a breath) */
export const sceneJustEnded = () => endOfScene;

/* ------------------------------------------------------------------ */
/*  MOOD OF THE DAY — how they treat you depends on the night          */
/* ------------------------------------------------------------------ */
export type Mood = "nice" | "mean" | "tired";
const MOODS: Mood[] = ["nice", "mean", "tired"];
export const MOOD: Mood = MOODS[(Math.random() * MOODS.length) | 0];

export const MOOD_LABEL: Record<Mood, string> = {
  nice: "they're in a good mood tonight",
  mean: "they're in a mood tonight",
  tired: "they've been out here too long",
};

/** greeting script (talk steps 0–3). step 3 is always anya asking what you want */
const GREETS: Record<Mood, Line[]> = {
  nice: [
    a("oh. hey. you can stand here if you want, the light's better."),
    m("hiii. don't be weird about it, everyone here is also weird."),
    k("i'm kira. that's mila. that's anya. anya's the one with the cards."),
    a("so. you want a reading, or are you just loitering? both are fine."),
  ],
  mean: [
    k("can we help you."),
    m("kira. be nice. ...okay but what's your sign, that decides it."),
    a("ignore them, they haven't eaten. i'm anya."),
    a("you came all the way over here, so. want me to pull some cards or what?"),
  ],
  tired: [
    m("oh thank god, a new person. we've run out of things to say."),
    k("we have not. you've been talking for four hours."),
    a("hi. i'm anya. they've been arguing about libras since eleven."),
    a("stand wherever. want a reading? i genuinely need a distraction."),
  ],
};
export const GREET = GREETS[MOOD];

export const TOPICS: { id: TopicId; label: string; emoji: string }[] = [
  { id: "love", label: "someone i like", emoji: "💘" },
  { id: "future", label: "what's next for me", emoji: "⚡" },
  { id: "vibes", label: "just read me", emoji: "☾" },
];

export const TOPIC_LINES: Record<TopicId, string> = {
  love: "a crush reading. don't tell me who. i'll find out anyway.",
  future: "the future. bold. most people just want to know if someone likes them back.",
  vibes: "no question, just vibes. i respect that. let's see what's stuck to you.",
};

export const SHUFFLE_LINE = "think about it while i shuffle. tap the deck when you're ready.";
export const SPREAD_LINE = "three cards. past, present, whatever's coming. don't overthink it.";

/** when the player leaves a question sitting there for too long */
export const IGNORED: Line[] = [
  k("...you're just gonna stand there. cool."),
  m("he's thinking about it. or having a stroke. one of the two."),
  a("you don't have to answer. that's allowed."),
  k("guess he's busy. it's fine. it's whatever."),
];

/* ------------------------------------------------------------------ */
/*  REACTIONS during the reading — mila & kira chiming in              */
/* ------------------------------------------------------------------ */
const GOOD_MILA = [
  "oh that's actually really good.",
  "okay i'm kind of jealous now.",
  "that tracks with your aura honestly.",
  "that's a good one. don't ruin it.",
  "you must have a nice venus. i can tell.",
];
const GOOD_KIRA = [
  "huh. lucky.",
  "don't get cocky about it.",
  "that's the nicest thing the deck's said all week.",
  "fine. good for you.",
];
const BAD_MILA = [
  "oh no. okay. it's fine. it's probably fine.",
  "anya, re-pull. nobody saw that.",
  "that's so rough, i'm sorry.",
  "is this a mercury thing. tell me it's a mercury thing.",
];
const BAD_KIRA = [
  "yikes.",
  "well. that sucks.",
  "at least it's honest.",
  "the deck's kind of a bitch tonight.",
  "i had a dream about this card. it didn't end well either.",
];
const MID_MILA = [
  "what does that even mean.",
  "that's so vague. very horoscope app.",
  "okay but that could be anything.",
];
const MID_KIRA = [
  "makes sense if you squint.",
  "that's a shrug of a card.",
  "sure.",
];
const REV_MILA = ["wait it's upside down, that changes it right?", "flipped. that's never a good sign."];
const REV_KIRA = ["reversed. of course it is.", "flipped. figures."];

export function reactionFor(vibe: number, reversed: boolean): Line {
  const pick = (arr: string[]) => arr[(Math.random() * arr.length) | 0];
  if (reversed && Math.random() < 0.5) {
    return Math.random() < 0.5 ? m(pick(REV_MILA)) : k(pick(REV_KIRA));
  }
  if (vibe >= 1) return Math.random() < 0.5 ? m(pick(GOOD_MILA)) : k(pick(GOOD_KIRA));
  if (vibe <= -1) return Math.random() < 0.5 ? m(pick(BAD_MILA)) : k(pick(BAD_KIRA));
  return Math.random() < 0.5 ? m(pick(MID_MILA)) : k(pick(MID_KIRA));
}

export const VERDICT_LEAD = "okay. all three together, here's what's going on with you…";

/* ------------------------------------------------------------------ */
/*  AFTER a reading — before they drift back into their own stuff      */
/* ------------------------------------------------------------------ */
const AFTERS: Record<Mood, Line[]> = {
  nice: [
    a("you can stay. the light's free."),
    m("that reading was actually good. i'm kind of jealous."),
    k("don't tell anyone at school about this. we have reputations."),
  ],
  mean: [
    k("okay. you can stay. don't make it weird."),
    m("she likes you. that's as nice as she gets."),
    a("come back on a full moon. the cards are meaner. you'd like it."),
  ],
  tired: [
    m("okay that was fun, i'm awake again."),
    a("stay if you want. we're not going anywhere."),
    k("we literally never go anywhere."),
  ],
};
export const AFTER = AFTERS[MOOD];
