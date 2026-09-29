/* ------------------------------------------------------------------ */
/*  Pixel tarot art - "The One-Sized Arcana" (50x70 px)               */
/*  Source: artistic-pixel-tarot-deck scripts/generate-deck-assets     */
/*  Imported (inlined as data URIs by vite) - index === TarotCard.id   */
/* ------------------------------------------------------------------ */
import type { TarotCard } from "./tarot";

import cardBack from "../assets/cards/card-back.png";
import c0 from "../assets/cards/major-00-the-fool.png";
import c1 from "../assets/cards/major-01-the-magician.png";
import c2 from "../assets/cards/major-02-the-high-priestess.png";
import c3 from "../assets/cards/major-03-the-empress.png";
import c4 from "../assets/cards/major-04-the-emperor.png";
import c5 from "../assets/cards/major-05-the-hierophant.png";
import c6 from "../assets/cards/major-06-the-lovers.png";
import c7 from "../assets/cards/major-07-the-chariot.png";
import c8 from "../assets/cards/major-08-strength.png";
import c9 from "../assets/cards/major-09-the-hermit.png";
import c10 from "../assets/cards/major-10-wheel-of-fortune.png";
import c11 from "../assets/cards/major-11-justice.png";
import c12 from "../assets/cards/major-12-the-hanged-man.png";
import c13 from "../assets/cards/major-13-death.png";
import c14 from "../assets/cards/major-14-temperance.png";
import c15 from "../assets/cards/major-15-the-devil.png";
import c16 from "../assets/cards/major-16-the-tower.png";
import c17 from "../assets/cards/major-17-the-star.png";
import c18 from "../assets/cards/major-18-the-moon.png";
import c19 from "../assets/cards/major-19-the-sun.png";
import c20 from "../assets/cards/major-20-judgement.png";
import c21 from "../assets/cards/major-21-the-world.png";
import c22 from "../assets/cards/wands-01-1-of-wands.png";
import c23 from "../assets/cards/wands-02-2-of-wands.png";
import c24 from "../assets/cards/wands-03-3-of-wands.png";
import c25 from "../assets/cards/wands-04-4-of-wands.png";
import c26 from "../assets/cards/wands-05-5-of-wands.png";
import c27 from "../assets/cards/wands-06-6-of-wands.png";
import c28 from "../assets/cards/wands-07-7-of-wands.png";
import c29 from "../assets/cards/wands-08-8-of-wands.png";
import c30 from "../assets/cards/wands-09-9-of-wands.png";
import c31 from "../assets/cards/wands-10-10-of-wands.png";
import c32 from "../assets/cards/wands-11-page-of-wands.png";
import c33 from "../assets/cards/wands-12-knight-of-wands.png";
import c34 from "../assets/cards/wands-13-queen-of-wands.png";
import c35 from "../assets/cards/wands-14-king-of-wands.png";
import c36 from "../assets/cards/cups-01-1-of-cups.png";
import c37 from "../assets/cards/cups-02-2-of-cups.png";
import c38 from "../assets/cards/cups-03-3-of-cups.png";
import c39 from "../assets/cards/cups-04-4-of-cups.png";
import c40 from "../assets/cards/cups-05-5-of-cups.png";
import c41 from "../assets/cards/cups-06-6-of-cups.png";
import c42 from "../assets/cards/cups-07-7-of-cups.png";
import c43 from "../assets/cards/cups-08-8-of-cups.png";
import c44 from "../assets/cards/cups-09-9-of-cups.png";
import c45 from "../assets/cards/cups-10-10-of-cups.png";
import c46 from "../assets/cards/cups-11-page-of-cups.png";
import c47 from "../assets/cards/cups-12-knight-of-cups.png";
import c48 from "../assets/cards/cups-13-queen-of-cups.png";
import c49 from "../assets/cards/cups-14-king-of-cups.png";
import c50 from "../assets/cards/swords-01-1-of-swords.png";
import c51 from "../assets/cards/swords-02-2-of-swords.png";
import c52 from "../assets/cards/swords-03-3-of-swords.png";
import c53 from "../assets/cards/swords-04-4-of-swords.png";
import c54 from "../assets/cards/swords-05-5-of-swords.png";
import c55 from "../assets/cards/swords-06-6-of-swords.png";
import c56 from "../assets/cards/swords-07-7-of-swords.png";
import c57 from "../assets/cards/swords-08-8-of-swords.png";
import c58 from "../assets/cards/swords-09-9-of-swords.png";
import c59 from "../assets/cards/swords-10-10-of-swords.png";
import c60 from "../assets/cards/swords-11-page-of-swords.png";
import c61 from "../assets/cards/swords-12-knight-of-swords.png";
import c62 from "../assets/cards/swords-13-queen-of-swords.png";
import c63 from "../assets/cards/swords-14-king-of-swords.png";
import c64 from "../assets/cards/pentacles-01-1-of-pentacles.png";
import c65 from "../assets/cards/pentacles-02-2-of-pentacles.png";
import c66 from "../assets/cards/pentacles-03-3-of-pentacles.png";
import c67 from "../assets/cards/pentacles-04-4-of-pentacles.png";
import c68 from "../assets/cards/pentacles-05-5-of-pentacles.png";
import c69 from "../assets/cards/pentacles-06-6-of-pentacles.png";
import c70 from "../assets/cards/pentacles-07-7-of-pentacles.png";
import c71 from "../assets/cards/pentacles-08-8-of-pentacles.png";
import c72 from "../assets/cards/pentacles-09-9-of-pentacles.png";
import c73 from "../assets/cards/pentacles-10-10-of-pentacles.png";
import c74 from "../assets/cards/pentacles-11-page-of-pentacles.png";
import c75 from "../assets/cards/pentacles-12-knight-of-pentacles.png";
import c76 from "../assets/cards/pentacles-13-queen-of-pentacles.png";
import c77 from "../assets/cards/pentacles-14-king-of-pentacles.png";

/** the card back art */
export const CARD_BACK_SRC = cardBack;

/** face art for all 78 cards, index === TarotCard.id */
const CARD_SRCS: readonly string[] = [
  c0, c1, c2, c3,  // major-00-the-fool
  c4, c5, c6, c7,  // major-04-the-emperor
  c8, c9, c10, c11,  // major-08-strength
  c12, c13, c14, c15,  // major-12-the-hanged-man
  c16, c17, c18, c19,  // major-16-the-tower
  c20, c21, c22, c23,  // major-20-judgement
  c24, c25, c26, c27,  // wands-03-3-of-wands
  c28, c29, c30, c31,  // wands-07-7-of-wands
  c32, c33, c34, c35,  // wands-11-page-of-wands
  c36, c37, c38, c39,  // cups-01-1-of-cups
  c40, c41, c42, c43,  // cups-05-5-of-cups
  c44, c45, c46, c47,  // cups-09-9-of-cups
  c48, c49, c50, c51,  // cups-13-queen-of-cups
  c52, c53, c54, c55,  // swords-03-3-of-swords
  c56, c57, c58, c59,  // swords-07-7-of-swords
  c60, c61, c62, c63,  // swords-11-page-of-swords
  c64, c65, c66, c67,  // pentacles-01-1-of-pentacles
  c68, c69, c70, c71,  // pentacles-05-5-of-pentacles
  c72, c73, c74, c75,  // pentacles-09-9-of-pentacles
  c76, c77  // pentacles-13-queen-of-pentacles
];

/** art url for a card (data: uri) */
export function cardSrc(card: TarotCard): string {
  return CARD_SRCS[card.id] ?? CARD_BACK_SRC;
}
