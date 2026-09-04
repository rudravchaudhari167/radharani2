import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "❌ Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const img = (id: string) =>
  `https://images.unsplash.com/${id}?q=80&w=700&auto=format&fit=crop`;

const P = {
  men: img("photo-1602810318383-e386cc2a3ccf"),
  hoodie: img("photo-1556821840-3a63f95609a7"),
  jacket: img("photo-1544441893-675973e31985"),
  shirt: img("photo-1598033129183-c4f50c736f10"),
  overshirt: img("photo-1611312449408-fcece27cdbb7"),
  tshirt1: img("photo-1576566588028-4147f3842f27"),
  tshirt2: img("photo-1583743814966-8066b5dc11c7"),
  kurti: img("photo-1583391733956-6c78276477e2"),
  saree: img("photo-1610030469983-98e550d6193c"),
  dress1: img("photo-1595777457583-95e059d581b8"),
  dress2: img("photo-1515372039744-b8f02a3ae446"),
  lehenga: img("photo-1583496661160-fb5886a4b49c"),
  anarkali: img("photo-1610030469629-5a2a3f6f6c9a"),
  tee: img("photo-1583743814966-8066b5dc11c7"),
  pendant: img("photo-1515562141206-7a88bf7f1c9d"),
  bracelet: img("photo-1611591437281-460bfbe1220a"),
  necklace: img("photo-1599643478518-a784e5dc4c8f"),
  cap: img("photo-1521369909029-2afed882baee"),
  accessory1: img("photo-1537832816519-689ad163238b"),
  accessory2: img("photo-1607083206968-13611e3d76db"),
  across1: img("photo-1521572163474-6864f9cf17ab"),
  across2: img("photo-1562157873-818bc0726f68"),
  across3: img("photo-1554568218-0f1715e72254"),
  kids1: img("photo-1622290291468-a28f7a7dc6a8"),
  kids2: img("photo-1519238263530-99bdd11df2ea"),
  kids3: img("photo-1522771930-78848d9293e8"),
  cloth1: img("photo-1525507119028-ed4c629a60a3"),
  cloth2: img("photo-1539533018447-63fcce2678e3"),
  cloth3: img("photo-1591047139829-d91aecb6caea"),
  cloth4: img("photo-1543087903-1ac2ec7aa8c5"),
  cloth5: img("photo-1490481651871-ab68de25d43d"),
  cloth6: img("photo-1503342217505-b0a15ec3261c"),
  cloth7: img("photo-1483985988355-763728e1935b"),
  cloth8: img("photo-1445205170230-053b83016050"),
};

interface SeedProduct {
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  category: "MEN" | "WOMEN" | "UNISEX" | "KIDS" | "ACCESSORIES";
  subcategory: string;
  images: string[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  stock: number;
  tags: string[];
  featured?: boolean;
  isNewArrival?: boolean;
}

const products: SeedProduct[] = [
  // ────────────────────────── MEN ──────────────────────────
  {
    name: "Krishna Flute Shirt",
    description:
      "A premium linen-blend shirt adorned with subtle flute-inspired embroidery along the placket. Crafted for the modern connoisseur, it pairs structured tailoring with a whisper of Vrindavan's timeless melody.",
    price: 2499,
    oldPrice: 3499,
    category: "MEN",
    subcategory: "Shirts",
    images: [P.shirt, P.cloth1, P.cloth2],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Midnight Navy", hex: "#1e2a4a" },
      { name: "Moon White", hex: "#f4f4f8" },
    ],
    stock: 42,
    tags: ["flute", "krishna", "premium", "linen", "shirt"],
    featured: true,
  },
  {
    name: "Peacock Print Hoodie",
    description:
      "Heavyweight fleece hoodie with an oversized peacock morph-front print. A statement piece that merges streetwear attitude with the iridescent blues of a peacock feather.",
    price: 1999,
    oldPrice: 2799,
    category: "MEN",
    subcategory: "Hoodies",
    images: [P.hoodie, P.cloth3, P.cloth6],
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Peacock Blue", hex: "#0f3d68" },
      { name: "Charcoal", hex: "#34343d" },
    ],
    stock: 58,
    tags: ["peacock", "hoodie", "streetwear", "winter", "unisex"],
    featured: true,
    isNewArrival: true,
  },
  {
    name: "Mor Pankh Jacket",
    description:
      "A structured bomber jacket with hand-rendered mor pankh (peacock feather) art on the back panel. Lightweight, lined, and unmistakably divine.",
    price: 3299,
    oldPrice: 4499,
    category: "MEN",
    subcategory: "Jackets",
    images: [P.jacket, P.cloth8, P.cloth4],
    sizes: ["M", "L", "XL"],
    colors: [
      { name: "Emerald Teal", hex: "#0b6e6b" },
      { name: "Violet", hex: "#5b21b6" },
    ],
    stock: 25,
    tags: ["jacket", "peacock", "bomber", "art", "premium"],
    featured: true,
  },
  {
    name: "Krishna Dhoti Set",
    description:
      "A ceremonial dhoti set in soft ivory with gold zari borders, paired with an embroidered kurta. An homage to the divine silhouette of Krishna himself.",
    price: 5999,
    oldPrice: 7999,
    category: "MEN",
    subcategory: "Ethnic Sets",
    images: [P.cloth4, P.shirt, P.cloth7],
    sizes: ["M", "L", "XL"],
    colors: [
      { name: "Ivory Gold", hex: "#f2e8d5" },
      { name: "Saffron", hex: "#e08f3c" },
    ],
    stock: 14,
    tags: ["dhoti", "festive", "ethnic", "krishna", "ceremonial"],
    featured: true,
    isNewArrival: true,
  },
  {
    name: "Divine Overshirt",
    description:
      "A relaxed-fit overshirt in brushed cotton with tonal moon-and-flute jacquard. Layered styling made effortless.",
    price: 1799,
    oldPrice: 2499,
    category: "MEN",
    subcategory: "Shirts",
    images: [P.overshirt, P.cloth2, P.cloth3],
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Dusty Rose", hex: "#c49d9a" },
      { name: "Slate", hex: "#475569" },
    ],
    stock: 37,
    tags: ["overshirt", "shirt", "layering", "moon"],
    isNewArrival: true,
  },
  {
    name: "Vrindavan Kurta",
    description:
      "A celebration-ready knee-length kurta in micro-twill, with a concealed placket and a thin flute motif running down the sleeve. Breezy and composed.",
    price: 1899,
    oldPrice: 2599,
    category: "MEN",
    subcategory: "Kurtas",
    images: [P.shirt, P.cloth4, P.cloth7],
    sizes: ["M", "L", "XL", "XXL"],
    colors: [
      { name: "Ivory", hex: "#f1ece1" },
      { name: "Moss", hex: "#6b7f5e" },
    ],
    stock: 30,
    tags: ["kurta", "festive", "vrintavan", "ethnic"],
    isNewArrival: true,
  },
  {
    name: "Gopala Graphic Tee",
    description:
      "A street-smart tee with a contour-lined Radha-Krishna silhouette printed in soft neon on heavy combed cotton.",
    price: 1199,
    oldPrice: 1699,
    category: "MEN",
    subcategory: "T-Shirts",
    images: [P.tshirt2, P.tshirt1, P.tee],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "White", hex: "#f7f5f0" },
      { name: "Black", hex: "#18181b" },
    ],
    stock: 66,
    tags: ["tee", "gopala", "graphic", "streetwear"],
    featured: true,
  },
  // ────────────────────────── WOMEN ──────────────────────────
  {
    name: "Radha Kurti Set",
    description:
      "An elegant kurti set in blush georgette with gota-patti detailing and a flowing dupatta. Feminine, festive, and effortlessly graceful.",
    price: 2899,
    oldPrice: 3899,
    category: "WOMEN",
    subcategory: "Kurtis",
    images: [P.kurti, P.cloth7, P.dress1],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Blush Pink", hex: "#f3b9b9" },
      { name: "Deep Plum", hex: "#6d1a7a" },
    ],
    stock: 46,
    tags: ["kurti", "festive", "gota", "patti", "ethnic"],
    featured: true,
  },
  {
    name: "Radha Saree",
    description:
      "A handwoven art-silk saree in royal magenta, bordered with textured peacock-motif zari. Drape yourself in devotion.",
    price: 4999,
    oldPrice: 6999,
    category: "WOMEN",
    subcategory: "Sarees",
    images: [P.saree, P.cloth5, P.dress2],
    sizes: ["M", "L"],
    colors: [
      { name: "Royal Magenta", hex: "#9d1b5b" },
      { name: "Midnight Blue", hex: "#1b2a6b" },
    ],
    stock: 18,
    tags: ["saree", "silk", "handwoven", "wedding", "peacock"],
    featured: true,
    isNewArrival: true,
  },
  {
    name: "Vrindavan Anarkali",
    description:
      "A floor-sweeping anarkali in flowing chiffon with intricate zardozi on the bodice. Cinema-level drama for the woman who commands a room.",
    price: 3999,
    oldPrice: 5499,
    category: "WOMEN",
    subcategory: "Anarkalis",
    images: [P.anarkali, P.dress1, P.kurti],
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Lotus Pink", hex: "#e8a0b0" },
      { name: "Ivory", hex: "#f5f0e6" },
    ],
    stock: 22,
    tags: ["anarkali", "chiffon", "zardozi", "festive"],
    featured: true,
  },
  {
    name: "Floral Lehenga",
    description:
      "A ruffle-tiered lehenga in dupioni silk with hand-block printed florals. Pair the cropped kurti blouse and sheer dupatta for function flair.",
    price: 5499,
    oldPrice: 7499,
    category: "WOMEN",
    subcategory: "Lehengas",
    images: [P.lehenga, P.dress2, P.cloth5],
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Rose Gold", hex: "#c9968c" },
      { name: "Forest", hex: "#2e5e3d" },
    ],
    stock: 12,
    tags: ["lehenga", "wedding", "floral", "dupioni"],
    featured: true,
  },
  {
    name: "Lotus Dress",
    description:
      "A modern slip dress printed with an abstract lotus pond in watercolour. Silk-touch fabric, midi length, and a heart-shaped neckline.",
    price: 2399,
    oldPrice: 3299,
    category: "WOMEN",
    subcategory: "Dresses",
    images: [P.dress1, P.dress2, P.kurti],
    sizes: ["XS", "S", "M", "L"],
    colors: [
      { name: "Watercolour Lilac", hex: "#b7a7d9" },
      { name: "Deep Teal", hex: "#0d5c63" },
    ],
    stock: 34,
    tags: ["dress", "lotus", "mermaid", "summer"],
    isNewArrival: true,
  },
  {
    name: "Peacock Motif Top",
    description:
      "An everyday top with a tonal peacock motif woven through the yoke and puffed sleeves. Pairs beautifully with trousers or a sharara.",
    price: 1499,
    oldPrice: 2099,
    category: "WOMEN",
    subcategory: "Kurtis",
    images: [P.kurti, P.dress1, P.cloth7],
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Mint", hex: "#b7dfcb" },
      { name: "Blush", hex: "#f3b9b9" },
    ],
    stock: 41,
    tags: ["top", "peacock", "kurti", "everyday"],
    isNewArrival: true,
  },
  {
    name: "Vrindavan Ruffled Dress",
    description:
      "A ruffle-hem midi in liquid satin, with a fluted sleeve and a soft drape that catches the moonlight — as it should.",
    price: 2799,
    oldPrice: 3899,
    category: "WOMEN",
    subcategory: "Dresses",
    images: [P.dress2, P.dress1, P.cloth5],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Midnight", hex: "#1a2130" },
      { name: "Burgundy", hex: "#6b1f3a" },
    ],
    stock: 23,
    tags: ["dress", "ruffle", "satin", "evening"],
    featured: true,
    isNewArrival: true,
  },
  {
    name: "Bansi Palazzo Set",
    description:
      "A two-piece co-ord in flowing mul mul — boxy cropped top and a wide-leg palazzo — printed with scattered flute feathers. Effortless divinity.",
    price: 2199,
    oldPrice: 3199,
    category: "WOMEN",
    subcategory: "Co-ords",
    images: [P.lehenga, P.anarkali, P.cloth5],
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Coral", hex: "#f48a72" },
      { name: "Ivory", hex: "#f5f0e6" },
    ],
    stock: 28,
    tags: ["co-ord", "palazzo", "mul mul", "feather"],
    featured: true,
  },
  // ────────────────────────── UNISEX ──────────────────────────
  {
    name: "Divine Oversized Hoodie",
    description:
      "An oversized drop-shoulder hoodie with a serene Radha-Krishna line-art graphic on the chest. Made from 420gsm loopback cotton.",
    price: 2499,
    oldPrice: 3399,
    category: "UNISEX",
    subcategory: "Hoodies",
    images: [P.hoodie, P.cloth6, P.cloth3],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Mineral Black", hex: "#1c1c22" },
      { name: "Petal", hex: "#e9d8e0" },
    ],
    stock: 61,
    tags: ["hoodie", "unisex", "oversized", "graphic", "radha", "krishna"],
    featured: true,
    isNewArrival: true,
  },
  {
    name: "Vrindavan Overshirt",
    description:
      "A boxy corduroy overshirt in muted canyon tones with hidden inside pocket. Unstructured, warm, and quiet-luxury by design.",
    price: 2199,
    oldPrice: 2999,
    category: "UNISEX",
    subcategory: "Overshirts",
    images: [P.overshirt, P.jacket, P.cloth1],
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Canyon", hex: "#b08968" },
      { name: "Smoke", hex: "#6b7280" },
    ],
    stock: 29,
    tags: ["overshirt", "corduroy", "unisex", "layering"],
    isNewArrival: true,
  },
  {
    name: "Peacock Graphic Tee",
    description:
      "A boxy heavyweight tee with a sun-washed peacock graphic. Breathable combed cotton with a soft enzyme wash.",
    price: 1299,
    oldPrice: 1799,
    category: "UNISEX",
    subcategory: "T-Shirts",
    images: [P.tee, P.tshirt1, P.tshirt2],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Ecru", hex: "#eae3d4" },
      { name: "Black", hex: "#18181b" },
    ],
    stock: 88,
    tags: ["tee", "peacock", "graphic", "unisex", "streetwear"],
    featured: true,
  },
  {
    name: "Eternal Bond Tee",
    description:
      "A minimal white-on-white embroidery tee carrying the eternal bond motif. So understated, it's almost secret.",
    price: 1099,
    oldPrice: 1499,
    category: "UNISEX",
    subcategory: "T-Shirts",
    images: [P.tshirt1, P.tshirt2, P.tee],
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "White", hex: "#f7f5f0" },
      { name: "Grey", hex: "#9ca3af" },
    ],
    stock: 52,
    tags: ["tee", "minimal", "embroidery", "devotion"],
    isNewArrival: true,
  },
  {
    name: "Vrindavan Sweatpants",
    description:
      "Relaxed tapered sweatpants in loopback french terry with a subtle embroidered flute at the cuff. Loungewear for the devoted.",
    price: 1499,
    oldPrice: 2099,
    category: "UNISEX",
    subcategory: "Bottoms",
    images: [P.cloth6, P.hoodie, P.tshirt1],
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Heather Grey", hex: "#9ca3af" },
      { name: "Black", hex: "#18181b" },
    ],
    stock: 55,
    tags: ["sweatpants", "loungewear", "unisex", "terry"],
    featured: true,
    isNewArrival: true,
  },
  {
    name: "Gauze Vrindavan Shirt",
    description:
      "An airy gauze shirt with hand-rolled hems and a barely-there moon print. The summer shirt your future self will thank you for.",
    price: 1299,
    oldPrice: 1799,
    category: "UNISEX",
    subcategory: "Shirts",
    images: [P.cloth2, P.overshirt, P.cloth3],
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Sand", hex: "#d6c7a1" },
      { name: "Sky", hex: "#bfdbfe" },
    ],
    stock: 44,
    tags: ["shirt", "gauze", "summer", "unisex"],
  },
  // ────────────────────────── KIDS ──────────────────────────
  {
    name: "Little Krishna Tee",
    description:
      "A playful baby-peacock-festive tee for tiny devotees. Soft organic cotton, ribbed collar, no itchy labels.",
    price: 799,
    oldPrice: 1099,
    category: "KIDS",
    subcategory: "T-Shirts",
    images: [P.kids1, P.tshirt2, P.kids3],
    sizes: ["2Y", "4Y", "6Y", "8Y"],
    colors: [
      { name: "Butter", hex: "#f6e3b4" },
      { name: "Sky", hex: "#bfdbfe" },
    ],
    stock: 40,
    tags: ["kids", "tee", "krishna", "cotton"],
  },
  {
    name: "Peacock Playsuit",
    description:
      "A feathery-soft playsuit with an all-over feather print. Snaps at the hem for easy changes. Machine washable.",
    price: 999,
    oldPrice: 1399,
    category: "KIDS",
    subcategory: "Playsuits",
    images: [P.kids2, P.kids1, P.kids3],
    sizes: ["6M", "12M", "18M", "2Y"],
    colors: [
      { name: "Teal", hex: "#2d6a6a" },
      { name: "Coral", hex: "#f48a72" },
    ],
    stock: 33,
    tags: ["kids", "playsuit", "peacock", "infant"],
    isNewArrival: true,
  },
  {
    name: "Rasleela Kids Set",
    description:
      "An occasion-ready kurta-pajama set with subtle flute motifs and a soft-lined jacket. Festival-ready in minutes.",
    price: 1599,
    oldPrice: 2199,
    category: "KIDS",
    subcategory: "Ethnic Sets",
    images: [P.kids3, P.shirt, P.kids1],
    sizes: ["2Y", "4Y", "6Y", "8Y", "10Y"],
    colors: [
      { name: "Ivory", hex: "#f1ece1" },
      { name: "Maroon", hex: "#7a1f2b" },
    ],
    stock: 20,
    tags: ["kids", "kurta", "festive", "ethnic"],
    featured: true,
  },
  {
    name: "Radha Little Dress",
    description:
      "A twirl-test-approved smocked dress in soft cotton-poplin, with a tiny lotus print and button-back closure. Easy breezy for little ones.",
    price: 999,
    oldPrice: 1399,
    category: "KIDS",
    subcategory: "Dresses",
    images: [P.kids2, P.dress1, P.kids1],
    sizes: ["12M", "2Y", "4Y", "6Y"],
    colors: [
      { name: "Daisy", hex: "#f6e6b4" },
      { name: "Lilac", hex: "#cfb7e0" },
    ],
    stock: 36,
    tags: ["kids", "dress", "lotus", "cotton"],
    isNewArrival: true,
  },
  {
    name: "Mor Kids Hoodie",
    description:
      "A cozy kids' hoodie with a mini feather perched on the hood. Sherpa-lined hood for extra snuggles.",
    price: 1199,
    oldPrice: 1699,
    category: "KIDS",
    subcategory: "Hoodies",
    images: [P.kids1, P.hoodie, P.kids3],
    sizes: ["2Y", "4Y", "6Y", "8Y"],
    colors: [
      { name: "Peacock Blue", hex: "#0f3d68" },
      { name: "Butter", hex: "#f6e3b4" },
    ],
    stock: 31,
    tags: ["kids", "hoodie", "peacock", "winter"],
    isNewArrival: true,
  },
  // ────────────────────────── ACCESSORIES ──────────────────────────
  {
    name: "Peacock Feather Pendant",
    description:
      "A hand-plated sterling-silver pendant shaped like a single peacock eye, strung on a fine chain. Wear the emblem of the divine dancer.",
    price: 1499,
    oldPrice: 2199,
    category: "ACCESSORIES",
    subcategory: "Jewellery",
    images: [P.pendant, P.necklace, P.bracelet],
    sizes: ["One Size"],
    colors: [
      { name: "Silver", hex: "#c0c7cf" },
      { name: "Rose Gold", hex: "#e0bfb1" },
    ],
    stock: 74,
    tags: ["pendant", "peacock", "jewellery", "silver"],
    featured: true,
  },
  {
    name: "Radha-Krishna Bracelet",
    description:
      "A minimalist chain bracelet with twin charms — a flute and a lotus — representing the eternal pair. Adjustable, tarnish-resistant.",
    price: 899,
    oldPrice: 1299,
    category: "ACCESSORIES",
    subcategory: "Jewellery",
    images: [P.bracelet, P.necklace, P.pendant],
    sizes: ["One Size"],
    colors: [
      { name: "Gold", hex: "#d4a02c" },
      { name: "Silver", hex: "#c0c7cf" },
    ],
    stock: 95,
    tags: ["bracelet", "radha", "krishna", "charm"],
    featured: true,
    isNewArrival: true,
  },
  {
    name: "Flute Pendant",
    description:
      "A delicate flute-shaped pendant in brushed silver, hung with a snap-clasp. The melody of Vrindavan at your chest.",
    price: 1199,
    oldPrice: 1699,
    category: "ACCESSORIES",
    subcategory: "Jewellery",
    images: [P.necklace, P.pendant, P.bracelet],
    sizes: ["One Size"],
    colors: [{ name: "Silver", hex: "#c0c7cf" }],
    stock: 60,
    tags: ["pendant", "flute", "krishna", "silver"],
    isNewArrival: true,
  },
  {
    name: "Divine Charm",
    description:
      "A small talisman charm engraved with the sacred symbol, made for stacking on bracelets or necklaces. A pocket of calm.",
    price: 699,
    oldPrice: 999,
    category: "ACCESSORIES",
    subcategory: "Jewellery",
    images: [P.accessory1, P.bracelet, P.pendant],
    sizes: ["One Size"],
    colors: [{ name: "Antique Gold", hex: "#b8860b" }],
    stock: 120,
    tags: ["charm", "divine", "talisman", "jewellery"],
  },
  {
    name: "Peacock Print Cap",
    description:
      "A six-panel twill cap with a tone-on-tone peacock feather print under the brim. Adjustable brass clasp.",
    price: 899,
    oldPrice: 1299,
    category: "ACCESSORIES",
    subcategory: "Headwear",
    images: [P.cap, P.accessory2, P.tshirt1],
    sizes: ["One Size"],
    colors: [
      { name: "Midnight", hex: "#1a2130" },
      { name: "Sand", hex: "#d6c7a1" },
    ],
    stock: 48,
    tags: ["cap", "peacock", "headwear", "streetwear"],
    featured: true,
  },
  {
    name: "Moonlight Crossbody",
    description:
      "A crescent-moon structured crossbody bag in vegan leather with gold-tone hardware. Fits the essentials for a night out.",
    price: 1899,
    oldPrice: 2599,
    category: "ACCESSORIES",
    subcategory: "Bags",
    images: [P.accessory2, P.cloth8, P.accessory1],
    sizes: ["One Size"],
    colors: [
      { name: "Black", hex: "#18181b" },
      { name: "Ivory", hex: "#f5f0e6" },
    ],
    stock: 27,
    tags: ["bag", "crossbody", "moon", "vegan"],
    isNewArrival: true,
  },
  {
    name: "Vrindavan Silk Scarf",
    description:
      "A double-sided silk-blend scarf printed with a soft willow-and-flute motif. Wear it around the neck or tie it to your bag.",
    price: 1299,
    oldPrice: 1799,
    category: "ACCESSORIES",
    subcategory: "Scarves",
    images: [P.cloth5, P.cloth7, P.cloth1],
    sizes: ["One Size"],
    colors: [
      { name: "Mist", hex: "#dbe4e0" },
      { name: "Dusk", hex: "#4a4458" },
    ],
    stock: 39,
    tags: ["scarf", "silk", "vrintavan", "accessory"],
  },
];

const coupons: {
  code: string;
  description: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minimumOrder: number;
  maximumDiscount: number;
  expiryDate: Date;
  usageLimit: number;
  active: boolean;
}[] = [
  {
    code: "WELCOME10",
    description: "10% off your first order. Welcome, devotee.",
    discountType: "PERCENTAGE",
    discountValue: 10,
    minimumOrder: 999,
    maximumDiscount: 500,
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    usageLimit: 1000,
    active: true,
  },
  {
    code: "KRISHNA10",
    description: "A divine 10% taken off — the Krishna special.",
    discountType: "PERCENTAGE",
    discountValue: 10,
    minimumOrder: 1499,
    maximumDiscount: 750,
    expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    usageLimit: 500,
    active: true,
  },
  {
    code: "FESTIVE20",
    description: "20% off festive styles. Grand celebrations await.",
    discountType: "PERCENTAGE",
    discountValue: 20,
    minimumOrder: 2499,
    maximumDiscount: 1500,
    expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    usageLimit: 300,
    active: true,
  },
  {
    code: "SAVE500",
    description: "Flat ₹500 off on orders above ₹2999.",
    discountType: "FIXED",
    discountValue: 500,
    minimumOrder: 2999,
    maximumDiscount: 500,
    expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    usageLimit: 200,
    active: true,
  },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function seed() {
  const skuDerived = new Set<string>();
  const slugSet = new Set<string>();

  // Clear existing seed sources
  const { error: clearProductError } = await supabase
    .from("products")
    .delete()
    .gte("id", "00000000-0000-0000-0000-000000000000");
  if (clearProductError) {
    console.error("❌ Failed to clear products:", clearProductError.message);
    process.exit(1);
  }
  const { error: clearCouponError } = await supabase
    .from("coupons")
    .delete()
    .gte("id", "00000000-0000-0000-0000-000000000000");
  if (clearCouponError) {
    console.error("❌ Failed to clear coupons:", clearCouponError.message);
    process.exit(1);
  }

  let count = 0;
  for (const p of products) {
    const slug = slugify(p.name);
    let uniq = slug;
    let i = 2;
    while (slugSet.has(uniq)) {
      uniq = `${slug}-${i++}`;
    }
    slugSet.add(uniq);

    const sku = `VK-${p.category.slice(0, 3)}-${String(count + 1).padStart(3, "0")}`;
    let skuUniq = sku;
    let j = 2;
    while (skuDerived.has(skuUniq)) {
      skuUniq = `${sku}-${j++}`;
    }
    skuDerived.add(skuUniq);

    const { error } = await supabase.from("products").insert({
      name: p.name,
      slug: uniq,
      description: p.description,
      price: Math.round(p.price),
      old_price: typeof p.oldPrice === "number" ? Math.round(p.oldPrice) : null,
      category: p.category,
      subcategory: p.subcategory,
      images: p.images,
      model_3d: "",
      sizes: p.sizes,
      colors: p.colors,
      stock: p.stock,
      sku: skuUniq,
      rating: Math.round((4 + Math.random() * 0.9) * 10) / 10,
      review_count: Math.floor(Math.random() * 120) + 4,
      tags: p.tags,
      featured: p.featured ?? false,
      is_new_arrival: p.isNewArrival ?? false,
      is_active: true,
    });
    if (error) {
      console.error(`❌ Failed to insert product "${p.name}":`, error.message);
      process.exit(1);
    }
    count += 1;
  }

  for (const c of coupons) {
    const { error } = await supabase.from("coupons").insert({
      code: c.code,
      description: c.description,
      discount_type: c.discountType,
      discount_value: c.discountValue,
      minimum_order: c.minimumOrder,
      maximum_discount: c.maximumDiscount,
      expiry_date: c.expiryDate.toISOString(),
      usage_limit: c.usageLimit,
      used_count: 0,
      active: c.active,
    });
    if (error) {
      console.error(`❌ Failed to insert coupon "${c.code}":`, error.message);
      process.exit(1);
    }
  }

  console.log(
    `✅ Seeded ${count} products and ${coupons.length} coupons successfully.`
  );
  console.log("Products by category:");

  const { data: byCat } = await supabase.from("products").select("category");
  const grouped = new Map<string, number>();
  for (const row of byCat || []) {
    grouped.set(row.category, (grouped.get(row.category) || 0) + 1);
  }
  for (const category of ["MEN", "WOMEN", "UNISEX", "KIDS", "ACCESSORIES"]) {
    if (grouped.has(category)) {
      console.log(`   ${category}: ${grouped.get(category)}`);
    }
  }

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});