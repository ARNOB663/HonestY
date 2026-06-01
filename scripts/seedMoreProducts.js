// Adds ~35 demo products to the catalogue. Idempotent: products whose slug
// already exists are skipped, so it's safe to re-run after edits or partial
// failures. Does NOT wipe — existing products + your own data stay intact.
//
// Run:  node scripts/seedMoreProducts.js
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import mongoose from "mongoose";
import Product from "../models/Product.js";

// Cost-price helper. Default landed cost = 40% of selling price (typical
// import/import-resell margin). Override per item by passing a number.
const cost = (price, pct = 0.4) => Math.round(price * pct);

const PRODUCTS = [
  // ── FASHION ────────────────────────────────────────────────────────────
  {
    slug: "denim-jacket-vintage",
    title: "Washed Denim Jacket — Vintage Blue",
    description: "Heavyweight 14oz selvedge denim, raw hem, classic trucker cut. Softens beautifully with wear.",
    price: 6900, compareAtPrice: 8500, costPrice: cost(6900),
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=900&q=80",
    collection: "fashion", tags: ["denim", "jacket", "outerwear"], inventory: 30, featured: true,
  },
  {
    slug: "kurta-cotton-cream",
    title: "Hand-Loom Cotton Kurta — Cream",
    description: "Soft handloom cotton, side-pocket detail, mandarin collar. Made by weavers in Tangail.",
    price: 2400, costPrice: cost(2400),
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=80",
    collection: "fashion", tags: ["kurta", "cotton", "bangladesh-made"], inventory: 60,
  },
  {
    slug: "linen-shorts-stone",
    title: "European Linen Shorts — Stone",
    description: "Pure flax linen with an elastic drawstring waist. Quick-drying, breezy, good for monsoon.",
    price: 3200, costPrice: cost(3200),
    image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=80",
    collection: "fashion", tags: ["linen", "summer"], inventory: 80,
  },
  {
    slug: "graphic-tee-organic",
    title: "Organic Cotton Tee — Olive",
    description: "Heavyweight 240gsm organic cotton. Boxy fit. Screen-printed in small batches in Dhaka.",
    price: 1100, compareAtPrice: 1500, costPrice: cost(1100),
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
    collection: "fashion", tags: ["tshirt", "organic-cotton"], inventory: 200, featured: true,
  },
  {
    slug: "saree-jamdani-classic",
    title: "Hand-woven Jamdani Saree — Indigo",
    description: "Traditional Jamdani from Sonargaon weavers. Pure cotton, 12 yards, with paisley motifs.",
    price: 18500, compareAtPrice: 22000, costPrice: cost(18500, 0.55),
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80",
    collection: "fashion", tags: ["saree", "jamdani", "bangladesh-made"], inventory: 12, featured: true,
  },

  // ── HOME & LIVING ──────────────────────────────────────────────────────
  {
    slug: "jute-floor-mat",
    title: "Hand-braided Jute Floor Mat",
    description: "Natural jute braided by hand in Faridpur. 90×150cm. Reversible. Spot-clean only.",
    price: 3800, costPrice: cost(3800),
    image: "https://images.unsplash.com/photo-1576020799627-aeac74d58064?auto=format&fit=crop&w=900&q=80",
    collection: "home-living", tags: ["jute", "rug", "bangladesh-made"], inventory: 40,
  },
  {
    slug: "rattan-pendant-light",
    title: "Rattan Pendant Lamp Shade",
    description: "Naturally finished rattan dome, 38cm diameter. Fits standard E27 bulb (not included).",
    price: 4500, costPrice: cost(4500),
    image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=900&q=80",
    collection: "home-living", tags: ["lighting", "rattan"], inventory: 25,
  },
  {
    slug: "terracotta-planter-trio",
    title: "Terracotta Planter Set (3)",
    description: "Hand-thrown terracotta from Rajshahi. Three sizes — 10/15/20cm. Drainage holes included.",
    price: 2200, costPrice: cost(2200),
    image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=80",
    collection: "home-living", tags: ["planter", "ceramic", "bangladesh-made"], inventory: 55, featured: true,
  },
  {
    slug: "brass-mortar-pestle",
    title: "Hand-cast Brass Mortar & Pestle",
    description: "Solid brass, weighty enough to crush whole spices in seconds. Patinas beautifully.",
    price: 5800, costPrice: cost(5800),
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=900&q=80",
    collection: "home-living", tags: ["kitchen", "brass"], inventory: 35,
  },
  {
    slug: "cotton-bedsheet-set",
    title: "Sateen Cotton Bedsheet Set — Sage",
    description: "300 thread-count long-staple cotton. Queen fitted + flat + 2 pillowcases. Soft hand-feel.",
    price: 8900, compareAtPrice: 11500, costPrice: cost(8900),
    image: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?auto=format&fit=crop&w=900&q=80",
    collection: "home-living", tags: ["bedding", "cotton"], inventory: 28,
  },

  // ── BEAUTY ─────────────────────────────────────────────────────────────
  {
    slug: "neem-face-wash",
    title: "Neem & Turmeric Face Wash",
    description: "Gentle daily cleanser with cold-pressed neem oil and Sylhet turmeric. Sulfate-free.",
    price: 850, costPrice: cost(850),
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80",
    collection: "beauty", tags: ["skincare", "ayurvedic", "bangladesh-made"], inventory: 120,
  },
  {
    slug: "argan-hair-oil",
    title: "Cold-Pressed Argan Hair Oil",
    description: "Pure Moroccan argan with a touch of vitamin E. 50ml glass dropper. For dry, frizzy hair.",
    price: 2400, costPrice: cost(2400),
    image: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=900&q=80",
    collection: "beauty", tags: ["haircare", "argan"], inventory: 75, featured: true,
  },
  {
    slug: "rose-water-mist",
    title: "Damask Rose Water Mist",
    description: "Steam-distilled damask rose petals. Toner + setting spray. 100ml.",
    price: 1100, costPrice: cost(1100),
    image: "https://images.unsplash.com/photo-1599733589046-8b6d2f5b9d3a?auto=format&fit=crop&w=900&q=80",
    collection: "beauty", tags: ["toner", "rose"], inventory: 90,
  },
  {
    slug: "natural-soap-trio",
    title: "Cold-Process Soap Trio",
    description: "Three handmade soaps: oat & honey, charcoal, sandalwood. ~110g each. Vegan.",
    price: 1500, compareAtPrice: 1900, costPrice: cost(1500),
    image: "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?auto=format&fit=crop&w=900&q=80",
    collection: "beauty", tags: ["soap", "set", "bangladesh-made"], inventory: 65,
  },
  {
    slug: "kohl-eyeliner",
    title: "Natural Kohl Eyeliner — Deep Black",
    description: "Camphor and almond oil base, no parabens. Smooth glide, smudge-friendly. Refillable case.",
    price: 980, costPrice: cost(980),
    image: "https://images.unsplash.com/photo-1631214504285-d4a4d7e2e0b1?auto=format&fit=crop&w=900&q=80",
    collection: "beauty", tags: ["makeup", "eyeliner"], inventory: 110,
  },

  // ── WELLNESS ───────────────────────────────────────────────────────────
  {
    slug: "ayurveda-tea-set",
    title: "Ayurvedic Loose Tea Set (4)",
    description: "Tulsi, turmeric-ginger, chamomile, and golden milk blend. 50g each in kraft pouches.",
    price: 2200, costPrice: cost(2200),
    image: "https://images.unsplash.com/photo-1536013455681-30c2e93f2cad?auto=format&fit=crop&w=900&q=80",
    collection: "wellness", tags: ["tea", "ayurveda"], inventory: 45, featured: true,
  },
  {
    slug: "meditation-cushion",
    title: "Buckwheat Meditation Cushion — Charcoal",
    description: "Organic cotton cover, removable for washing. Filled with buckwheat hulls. 35cm.",
    price: 4200, costPrice: cost(4200),
    image: "https://images.unsplash.com/photo-1591291621164-2c6367723315?auto=format&fit=crop&w=900&q=80",
    collection: "wellness", tags: ["meditation", "cushion"], inventory: 30,
  },
  {
    slug: "copper-water-bottle",
    title: "Hammered Copper Bottle — 900ml",
    description: "Pure copper, leak-proof. Ayurvedic tradition recommends overnight storage for mineral infusion.",
    price: 2800, costPrice: cost(2800),
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=80",
    collection: "wellness", tags: ["copper", "ayurveda"], inventory: 70,
  },
  {
    slug: "yoga-block-pair",
    title: "Cork Yoga Block Pair",
    description: "Natural cork, no glue, no plastic. Two blocks, sized 23×15×7.5cm.",
    price: 1800, costPrice: cost(1800),
    image: "https://images.unsplash.com/photo-1591291621164-2c6367723315?auto=format&fit=crop&w=900&q=80",
    collection: "wellness", tags: ["yoga", "cork"], inventory: 50,
  },
  {
    slug: "lavender-pillow-mist",
    title: "Sleep Pillow Mist — Lavender",
    description: "French lavender essential oil and vetiver. Spray on pillow 15 min before sleep. 100ml.",
    price: 1400, costPrice: cost(1400),
    image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=900&q=80",
    collection: "wellness", tags: ["sleep", "aromatherapy"], inventory: 85,
  },

  // ── ELECTRONICS ────────────────────────────────────────────────────────
  {
    slug: "kz-edx-pro-earphone",
    title: "KZ EDX Pro In-Ear Earphone — 3.5mm",
    description: "Single dynamic driver, 24Ω impedance, detachable cable. Solid value monitor for studio use.",
    price: 850, costPrice: cost(850, 0.45),
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
    collection: "electronics", tags: ["earphone", "audio"], inventory: 150, featured: true,
  },
  {
    slug: "bluetooth-keyboard-mech",
    title: "Compact Mechanical Keyboard — Bluetooth",
    description: "65% layout, hot-swappable switches (red, default), USB-C + BT 5.0. Aluminum case.",
    price: 9800, compareAtPrice: 12500, costPrice: cost(9800, 0.5),
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80",
    collection: "electronics", tags: ["keyboard", "mechanical", "bluetooth"], inventory: 25,
  },
  {
    slug: "led-desk-lamp",
    title: "Adjustable LED Desk Lamp — Warm",
    description: "3-step brightness, 2700K warm white. USB-C powered, foldable arm. 8-hour autonomy on a charge.",
    price: 3400, costPrice: cost(3400),
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80",
    collection: "electronics", tags: ["lighting", "desk"], inventory: 60,
  },
  {
    slug: "power-bank-20000",
    title: "20000mAh Power Bank — Fast Charge",
    description: "PD 22.5W USB-C in/out + dual USB-A. Charges most phones 4–5 times. Aluminum body.",
    price: 2600, costPrice: cost(2600),
    image: "https://images.unsplash.com/photo-1583863788434-e58a36a5a6a3?auto=format&fit=crop&w=900&q=80",
    collection: "electronics", tags: ["power-bank", "fast-charge"], inventory: 100,
  },
  {
    slug: "smart-bulb-rgb",
    title: "Smart Wi-Fi RGB Bulb — E27",
    description: "16M colors + tunable white. Voice control via Alexa / Google. 9W, 800lm.",
    price: 750, costPrice: cost(750),
    image: "https://images.unsplash.com/photo-1567459169668-95d355371bda?auto=format&fit=crop&w=900&q=80",
    collection: "electronics", tags: ["smart-home", "lighting"], inventory: 180,
  },

  // ── KIDS & BABY ────────────────────────────────────────────────────────
  {
    slug: "bamboo-baby-bowl",
    title: "Bamboo Baby Bowl with Suction Base",
    description: "Food-grade silicone suction sticks to high-chair. Bamboo fibre bowl. Dishwasher safe.",
    price: 1200, costPrice: cost(1200),
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=900&q=80",
    collection: "kids", tags: ["feeding", "bamboo"], inventory: 80,
  },
  {
    slug: "soft-cotton-bibs",
    title: "Organic Cotton Bibs (Pack of 5)",
    description: "GOTS-certified organic cotton, snap-button closure. Five gender-neutral colors.",
    price: 1600, costPrice: cost(1600),
    image: "https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&w=900&q=80",
    collection: "kids", tags: ["bib", "organic-cotton"], inventory: 90, featured: true,
  },
  {
    slug: "wooden-shape-sorter",
    title: "Beech Wood Shape Sorter Cube",
    description: "12 painted-free wooden shapes, finished with food-safe oil. Ages 2+.",
    price: 2100, costPrice: cost(2100),
    image: "https://images.unsplash.com/photo-1558877385-8c1c11d96aeb?auto=format&fit=crop&w=900&q=80",
    collection: "kids", tags: ["toys", "wood", "montessori"], inventory: 40,
  },
  {
    slug: "baby-sleep-bag",
    title: "Muslin Sleep Bag — 6-12 months",
    description: "100% cotton muslin, 1.0 TOG, side zip. Sleeveless for warm nights.",
    price: 2400, costPrice: cost(2400),
    image: "https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&w=900&q=80",
    collection: "kids", tags: ["sleep", "muslin", "baby"], inventory: 55,
  },
  {
    slug: "kid-storybook-set",
    title: "Bengali Folk Tales Storybook Set (3)",
    description: "Three illustrated children's books in Bengali — Thakurma'r Jhuli classics. Ages 4-9.",
    price: 1800, costPrice: cost(1800),
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=80",
    collection: "kids", tags: ["books", "bengali", "bangladesh-made"], inventory: 70,
  },

  // ── ACCESSORIES ────────────────────────────────────────────────────────
  {
    slug: "leather-belt-tan",
    title: "Full-Grain Leather Belt — Tan",
    description: "Vegetable-tanned cowhide, solid brass buckle. Ages to a rich patina. 35mm wide.",
    price: 3200, costPrice: cost(3200),
    image: "https://images.unsplash.com/photo-1606044466411-207f3e9fc651?auto=format&fit=crop&w=900&q=80",
    collection: "accessories", tags: ["belt", "leather"], inventory: 60,
  },
  {
    slug: "panama-hat",
    title: "Hand-woven Panama Hat",
    description: "Toquilla palm straw, hand-woven in Ecuador. UPF 50+. Adjustable inner band.",
    price: 5500, compareAtPrice: 6900, costPrice: cost(5500),
    image: "https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=900&q=80",
    collection: "accessories", tags: ["hat", "summer"], inventory: 20,
  },
  {
    slug: "wool-beanie",
    title: "Merino Wool Beanie — Charcoal",
    description: "100% Italian merino wool. Soft, non-itchy, with a tonal cuff fold. One size.",
    price: 1900, costPrice: cost(1900),
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=900&q=80",
    collection: "accessories", tags: ["beanie", "wool", "winter"], inventory: 85,
  },
  {
    slug: "passport-holder-leather",
    title: "Leather Passport & Card Holder",
    description: "Slim folio with two card slots and a pen loop. Vegetable-tanned. Hand-stitched.",
    price: 2800, costPrice: cost(2800),
    image: "https://images.unsplash.com/photo-1606044466411-207f3e9fc651?auto=format&fit=crop&w=900&q=80",
    collection: "accessories", tags: ["travel", "leather"], inventory: 50, featured: true,
  },
  {
    slug: "umbrella-windproof",
    title: "Windproof Travel Umbrella — Navy",
    description: "9-rib reinforced canopy, auto open/close, fits in a bag at 28cm closed. For monsoon.",
    price: 1500, costPrice: cost(1500),
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=900&q=80",
    collection: "accessories", tags: ["umbrella", "monsoon"], inventory: 130,
  },
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  await mongoose.connect(uri);

  // Skip products whose slug is already in the DB so re-runs are safe.
  const slugs = PRODUCTS.map((p) => p.slug);
  const existing = await Product.find({ slug: { $in: slugs } }).select("slug").lean();
  const existingSet = new Set(existing.map((d) => d.slug));
  const fresh = PRODUCTS.filter((p) => !existingSet.has(p.slug));

  if (fresh.length === 0) {
    console.log(`All ${PRODUCTS.length} products already exist. Nothing inserted.`);
  } else {
    await Product.insertMany(fresh, { ordered: false });
    console.log(`Inserted ${fresh.length} new products (${PRODUCTS.length - fresh.length} already existed).`);
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
