// RIKI — asosiy o'yinlar mantiqi (core)
// =====================================================================
//  RIKI — Telegram Mini App (demo). Barcha o'yinlar shu faylda.
// =====================================================================
const CFG = {
  BOT_USERNAME: 'your_bot',                 // @ belgisisiz
  CHANNEL_URL: 'https://t.me/your_channel',
  START_BALANCE: 0,                      // birinchi kirish bonusi (demo TON)
  DAILY_BONUS: 10,                          // kunlik bonus (demo TON)
  STORAGE_KEY: 'riki_v5',
  CUR: 'TON',                              // valyuta nomi (demo)
  BRAND: 'RIKI',                           // ilova nomi
  GIFT_BOT: 'your_gift_bot',               // sovg'a qabul qiluvchi bot (@ belgisisiz)
  API_URL: '',                             // bot.py server manzili, masalan 'https://xxxx.trycloudflare.com' (bo'sh = offline)
  ADMIN_IDS: [],                           // admin Telegram ID'lari, masalan [123456789] (offline rejim uchun)
  TON_RATE: 100000,                        // 1 TON = 100 000 balans
  STARS_RATE: 800                          // 1 Star = 800 balans (125 ⭐ = 100 000)
};

// ---------- Telegram ----------
const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
if (tg) { try { tg.ready(); tg.expand(); tg.setHeaderColor('#2a2a2d'); tg.setBackgroundColor('#1e1e20'); tg.disableVerticalSwipes && tg.disableVerticalSwipes() } catch (e) {} }
const TGU = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) || { id: 0, first_name: 'Guest' };
const ME = TGU.username || TGU.first_name || 'Siz';
const START_PARAM = (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param) || '';

// ---------- yordamchilar ----------
const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);
const fmt = n => (Math.round((+n || 0) * 100) / 100).toFixed(2);
// 1 000 → 1K · 10 000 → 10K · 1 500 → 1.5K · 1 000 000 → 1M · 1e9 → 1B · 500 → 500 (faqat ko'rinish; haqiqiy qiymat o'zgarmaydi)
const fmtK = n => { n = +n || 0; const a = Math.abs(n), f = (v, s) => (v >= 100 ? Math.floor(v) : Math.floor(v * 10) / 10) + s; return a >= 1e9 ? f(n / 1e9, 'B') : a >= 1e6 ? f(n / 1e6, 'M') : a >= 1e3 ? f(n / 1e3, 'K') : String(Math.round(n * 100) / 100) };
const rnd = (a, b) => a + Math.random() * (b - a);
const ri = n => Math.floor(Math.random() * n);
const pick = a => a[ri(a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const hap = t => { try { tg.HapticFeedback.impactOccurred(t || 'light') } catch (e) {} };
const hapN = t => { try { tg.HapticFeedback.notificationOccurred(t) } catch (e) {} };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const GEM = '<svg class="gem" viewBox="0 0 24 24"><defs><linearGradient id="gemG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fe3ff"/><stop offset=".5" stop-color="#2d9bff"/><stop offset="1" stop-color="#1458db"/></linearGradient></defs><path d="M6.4 3.2h11.2l4.6 6L12 21.2 1.8 9.2z" fill="url(#gemG)"/><path d="M6.4 3.2h11.2l4.6 6H1.8z" fill="#fff" fill-opacity=".22"/><path d="M1.8 9.2L12 21.2 7.8 9.2zM22.2 9.2L12 21.2l4.2-12z" fill="#0b3fa8" fill-opacity=".25"/><path d="M12 7.3l1.15 2.95 2.95 1.15-2.95 1.15L12 15.5l-1.15-2.95-2.95-1.15 2.95-1.15z" fill="#fff"/></svg>';
const g$ = n => GEM + fmt(n);

// ---------- ikonkalar ----------
const I = p => `<svg class="ic" viewBox="0 0 24 24">${p}</svg>`;
const ICO = {
  back: I('<path d="M19 12H5M11 6l-6 6 6 6"/>'), wallet: I('<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M16 12h2M3 9h13"/>'),
  gem2: I('<path d="M6 4h12l3 5-9 11L3 9z"/><path d="M3 9h18"/>'), flame: I('<path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-9z"/>'),
  bolt: I('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'), rocket: I('<path d="M5 19c1-3 3-5 3-5M14 4c4 0 6 2 6 6l-7 7-6-6z"/><circle cx="15" cy="9" r="1.6"/>'),
  swords: I('<path d="M4 4l10 10M20 4L10 14M5 19l3-3M19 19l-3-3M7 14l3 3M17 14l-3 3"/>'), pad: I('<rect x="2" y="6" width="20" height="12" rx="6"/><path d="M7 10v4M5 12h4M15 11h.01M18 13h.01"/>'),
  box: I('<path d="M12 2.5 3.5 7v10l8.5 4.5 8.5-4.5V7z"/><path d="M3.5 7 12 11.5 20.5 7M12 11.5v10"/>'), users: I('<circle cx="9" cy="8" r="3.6"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M15.5 4.6a3.6 3.6 0 0 1 0 6.8M21.5 20c0-2.8-1.6-4.8-4-5.6"/>'),
  home: I('<path d="M3.5 10.5 12 3l8.5 7.5V20a1 1 0 0 1-1 1h-4.5v-6h-6v6H4.5a1 1 0 0 1-1-1z"/>'), trophy: I('<path d="M8 21h8M12 16.5V21M7 3.5h10V9a5 5 0 0 1-10 0z"/><path d="M7 5.5H4c0 2.6 1.4 4 3.2 4.4M17 5.5h3c0 2.6-1.4 4-3.2 4.4"/>'),
  trophy2: I('<path d="M8 3.5h8V8a4 4 0 0 1-8 0zM8 5H5c0 2 1 3 3 3.5M16 5h3c0 2-1 3-3 3.5M12 12v4M9 16h6M10 20h4"/>'),
  coins: I('<circle cx="9" cy="9" r="5.5"/><path d="M14.5 9.6a5.5 5.5 0 1 1-5 5"/><path d="M9 7v4"/>'), hist: I('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>'),
  help: I('<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.7M12 17h.01"/>'),
  gift: I('<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12M12 8c-2-4-6-4-6-1.5S9 8 12 8zM12 8c2-4 6-4 6-1.5S15 8 12 8z"/>'),
  snow: I('<path d="M12 2v20M4 7l16 10M20 7L4 17M9 3.5l3 2.5 3-2.5M9 20.5l3-2.5 3 2.5"/>'), x: I('<path d="M6 6l12 12M18 6L6 18"/>'),
  swap: I('<path d="M4 8h15l-3-3M20 16H5l3 3"/>'), pct: I('<path d="M19 5L5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>'),
  bomb: I('<circle cx="11" cy="14" r="7"/><path d="M15 8l2-2M18 3v2M21 6h-2M19.5 4.5l-1 1"/>'), down: I('<path d="M6 9l6 6 6-6"/>'),
  refresh: I('<path d="M20 11a8 8 0 0 0-14.6-4.4M4 13a8 8 0 0 0 14.6 4.4"/><path d="M5 3v4h4M19 21v-4h-4"/>'), shuffle: I('<path d="M3 7h3c4 0 6 10 10 10h5M3 17h3c1.5 0 2.7-1.4 3.8-3M14.2 10c1-1.6 2.3-3 3.8-3h3M18 4l3 3-3 3M18 14l3 3-3 3"/>'),
  shield: I('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>'), target: I('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>'),
  sparkle: I('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7zM5 2l.6 1.6L7 4l-1.4.6L5 6l-.6-1.4L3 4l1.4-.4z"/>')
};

// =====================================================================
//  HAQIQIY TELEGRAM NFT GIFT KOLLEKSIYALARI VA NARXLARI
//  Manba: github.com/ssamy2/TelegramGiftsAssests (Portals / GetGems / Tonnel floor narxlari)
//  Quyidagi snapshot zaxira; ilova ochilganda jonli narxlar yuklanadi.
//  Format: [nomi, short_name, floor TON, emoji, [[model, fayl, model narxi], ...]]
// =====================================================================
// Snapshot: ssamy2/TelegramGiftsAssests Gifts_Details.json, last_updated=1793847236 (ishga tushganda jonli yangilanadi)
const GIFT_SNAP = [["Plush Pepe","plush_pepe",7250.0,"🐸",[["Hue Jester","hue_jester",5304.0],["Poison Dart","poison_dart",5666.1],["Two Face","two_face",5800.0],["Amalgam","amalgam",6650.4],["Spectrum","spectrum",6666.0],["Sunset","sunset",6799.32],["Polka Dots","polka_dots",7140.0],["Santa Pepe","santa_pepe",7996.8],["Tropical","tropical",9169.8],["Eggplant","eggplant",10888.88],["Christmas","christmas",12546.0],["Yellow Hug","yellow_hug",25498.98]]],["Algorithm Cup","algorithm_cup",1632.0,"🎁",[["Gold","gold",20400.0]]],["Intelligence Cup","intelligence_cup",1399.0,"🎁",[["Silver","silver",2040.0]]],["Heart Locket","heart_locket",1280.0,"💖",[["Soulkeeper","soulkeeper",1250.52],["Emocore","emocore",1285.2],["Disco","disco",1295.36],["Hell Rise","hell_rise",1295.37],["Karaoke Bar","karaoke_bar",1295.37],["Pepperoni","pepperoni",1295.37],["Nightclub","nightclub",1350.48],["Jupiter","jupiter",1581.0],["Royal Flush","royal_flush",1650.0],["Sanctuary","sanctuary",2091.0],["Toy Joy","toy_joy",2550.0],["Royal Heart","royal_heart",3999.0]]],["Durov's Cap","durovs_cap",409.5,"🧢",[]],["Scared Cat","scared_cat",265.19,"🐈‍⬛",[["Purrlion","purrlion",265.19],["Torracat","torracat",265.2],["Voodoo","voodoo",265.2],["Virus","virus",266.6],["Vapurr","vapurr",266.88],["Caustic","caustic",269.28],["Puss in Boots","puss_in_boots",271.32],["Blitzo","blitzo",300.9],["Ranni","ranni",306.0],["Celestia","celestia",333.0],["Endercat","endercat",367.2],["Mentos","mentos",561.0],["Garfield","garfield",816.0]]],["Precious Peach","precious_peach",258.5,"🍑",[["Iron Blush","iron_blush",259.32],["Ripe Green","ripe_green",259.32],["Rosegold","rosegold",259.33],["Iridescent","iridescent",259.37],["Soap Bubble","soap_bubble",259.4],["Purple Glow","purple_glow",259.59],["Juicy Tones","juicy_tones",264.8],["Ladybug","ladybug",284.58],["Peach Black","peach_black",301.92],["Christmas","christmas",339.66],["Smooch","smooch",377.4],["Stardust","stardust",561.0],["Impeached","impeached",1020.0]]],["Heroic Helmet","heroic_helmet",195.0,"⛑️",[["Gladiator","gladiator",193.8],["Chainsaw","chainsaw",198.89],["Centurion","centurion",198.9],["Milk Legend","milk_legend",198.9],["Bounty Hunter","bounty_hunter",200.94],["Aphrodite","aphrodite",202.25],["Atlantis","atlantis",204.0],["Bengal Tiger","bengal_tiger",219.99],["Phoenix","phoenix",239.7],["Hard Rock","hard_rock",279.48],["Biker Warrior","biker_warrior",299.88],["Mercurial","mercurial",346.8],["Hard Hat","hard_hat",458.49]]],["Loot Bag","loot_bag",138.49,"💰",[["Cortado","cortado",135.47],["Anemone","anemone",139.71],["Zip Pocket","zip_pocket",139.71],["Ombre","ombre",139.72],["Riviera","riviera",140.76],["Sunset Stripes","sunset_stripes",140.76],["Rouge Royale","rouge_royale",148.92],["Racing Stripes","racing_stripes",158.1],["Satin Beige","satin_beige",188.7],["Sunrise Bands","sunrise_bands",247.86],["Reptile Noir","reptile_noir",290.7],["Travel Bag","travel_bag",336.6],["Money Bag","money_bag",700.0]]],["Durov's Glasses","durovs_glasses",133.34,"🎁",[]],["Astral Shard","astral_shard",121.99,"🔮",[["Moonlit","moonlit",122.02],["Amethyst","amethyst",122.03],["Tourmaline","tourmaline",122.07],["Red Ruby","red_ruby",122.09],["Pure Silver","pure_silver",122.21],["Black Diamond","black_diamond",122.8],["Moonstone","moonstone",122.8],["Fractured","fractured",131.58],["Ocean Jasper","ocean_jasper",137.7],["Sapphire","sapphire",153.0],["Crystal Punk","crystal_punk",173.4],["Ammolite","ammolite",224.4],["Dark Soul","dark_soul",397.8]]],["Nail Bracelet","nail_bracelet",118.12,"💍",[["Explosive","explosive",118.32],["Candle Wax","candle_wax",119.33],["Needle","needle",121.38],["Rusty Nail","rusty_nail",122.35],["Pencil","pencil",130.56],["Rainbow Pills","rainbow_pills",137.69],["Skyline","skyline",137.7],["Argent","argent",163.2],["Aqua Ring","aqua_ring",185.0],["Gold Rush","gold_rush",255.0],["Succubus","succubus",333.0],["Diamond","diamond",499.8],["Carrot Bunny","carrot_bunny",765.0]]],["Mighty Arm","mighty_arm",117.35,"💪",[["Crab Crusher","crab_crusher",117.9],["Frankenstein","frankenstein",117.99],["Hercules","hercules",118.77],["T800","t800",120.36],["Robocop","robocop",121.38],["Poor Yorick","poor_yorick",122.08],["Cat Power","cat_power",122.09],["Bone Warrior","bone_warrior",145.86],["Cratos","cratos",171.36],["Xeno Grip","xeno_grip",199.92],["Liberator","liberator",269.99],["Night Bat","night_bat",339.66],["Champion","champion",1020.0]]],["Westside Sign","westside_sign",117.29,"🤟",[["Paisley","paisley",117.29],["Barcs A Locks","barcs_a_locks",117.3],["Tru Tank Doggs","tru_tank_doggs",118.26],["Yap Yap","yap_yap",118.27],["Signature","signature",118.52],["Wild Power","wild_power",120.36],["Duality","duality",121.89],["Woofee","woofee",127.66],["Double Cup","double_cup",129.82],["Chow Wow","chow_wow",141.78],["Organic Height","organic_height",153.0],["Snoopy","snoopy",215.22],["The Hard Way","the_hard_way",294.78]]],["Perfume Bottle","perfume_bottle",86.7,"🧴",[["Crimson Sky","crimson_sky",85.78],["Twilight Bliss","twilight_bliss",86.7],["Grape Splash","grape_splash",86.88],["Sunny Doodle","sunny_doodle",87.38],["Cotton Candy","cotton_candy",87.68],["Candy Luxe","candy_luxe",89.98],["Millet Fields","millet_fields",89.99],["Jade Script","jade_script",96.7],["Blush Petal","blush_petal",112.2],["Dairy Dew","dairy_dew",147.9],["Inkspire Red","inkspire_red",183.6],["Ebony Rose","ebony_rose",204.0],["Golden Elixir","golden_elixir",299.99]]],["Artisan Brick","artisan_brick",74.54,"🧱",[["Escher's Cube","escher’s_cube",53.83],["Concrete","concrete",74.54],["Sardines","sardines",74.55],["Domino","domino",75.28],["Harlequin","harlequin",76.68],["Retro Player","retro_player",77.52],["Escher’s Cube","escher’s_cube",78.54],["Oranges","oranges",89.76],["Art Nouveau","art_nouveau",100.47],["Firestarter","firestarter",113.22],["Game Console","game_console",140.76],["Chocolate","chocolate",158.1],["Grass Block","grass_block",362.1]]],["Mini Oscar","mini_oscar",72.2,"🏆",[["Spirulina","spirulina",66.6],["Nominee","nominee",71.4],["Catwoman","catwoman",72.81],["The Deep","the_deep",72.81],["Christmas","christmas",72.82],["Speaker","speaker",73.42],["Chieftain","chieftain",75.01],["Santa Claus","santa_claus",81.6],["Mars Attacks","mars_attacks",96.9],["Golden Sky","golden_sky",112.2],["Leopard","leopard",143.31],["Rear End","rear_end",204.0],["Starlight","starlight",499.8]]],["Ion Gem","ion_gem",71.5,"💎",[["Botanica","botanica",70.35],["Himalaya","himalaya",71.9],["Amethyst","amethyst",71.91],["Sakura","sakura",71.91],["Color Drain","color_drain",72.89],["Solar Flare","solar_flare",72.92],["Nightstone","nightstone",73.43],["Halloween","halloween",77.52],["Fireworks","fireworks",84.99],["Sweet Tooth","sweet_tooth",89.99],["Orchestra","orchestra",100.98],["Cupid Quartz","cupid_quartz",112.1],["Blood Gem","blood_gem",188.7]]],["Gem Signet","gem_signet",69.99,"💍",[["Green Beryl","green_beryl",70.24],["Fleur de Mer","fleur_de_mer",70.25],["Dark Violet","dark_violet",70.26],["Malachite","malachite",70.33],["Elven Shade","elven_shade",71.32],["Neon Signet","neon_signet",71.4],["Moonstone","moonstone",76.5],["Bloodstone","bloodstone",79.56],["Arc Reactor","arc_reactor",86.7],["Black Lotus","black_lotus",122.4],["Pixel Emerald","pixel_emerald",255.0],["Atomic Bomb","atomic_bomb",558.96]]],["Low Rider","low_rider",65.31,"🚗",[["Blaze","blaze",65.51],["Brown Sugar","brown_sugar",65.52],["Dribble","dribble",65.53],["Silent Hill","silent_hill",65.56],["Speedboat","speedboat",65.89],["Toy Car","toy_car",65.99],["Bass Drop","bass_drop",66.98],["Doggyland Bus","doggyland_bus",71.4],["Neon Phantom","neon_phantom",74.97],["Drop It!","drop_it!",78.54],["Lava-Forged","lava-forged",85.68],["Money Rider","money_rider",97.98],["Gigahorse","gigahorse",129.99]]],["Magic Potion","magic_potion",58.69,"🧪",[["Vulnerability","vulnerability",53.83],["Wicked Melon","wicked_melon",58.8],["Blue Lagoon","blue_lagoon",58.81],["Saltwater","saltwater",58.95],["Dark Side","dark_side",58.96],["Black Bile","black_bile",59.16],["Starsurge","starsurge",59.53],["Twilight","twilight",62.22],["Emerald Elixir","emerald_elixir",71.4],["Dark Secret","dark_secret",78.54],["Hemlock","hemlock",91.8],["Star Power","star_power",102.0],["Gold Medal","gold_medal",188.7]]],["Swiss Watch","swiss_watch",58.5,"⌚",[["Pip-Boy","pip-boy",59.15],["Gameboy","gameboy",59.16],["DeLorean","delorean",62.14],["Future Watch","future_watch",62.21],["Asteroid","asteroid",62.72],["Cherry Time","cherry_time",63.75],["The Grid","the_grid",63.99],["Cupid Clock","cupid_clock",88.0],["Royal Purple","royal_purple",110.16],["Iced Out","iced_out",127.49],["Patrician","patrician",138.0],["Platinum","platinum",153.0],["Galactic Year","galactic_year",288.87]]],["Sharp Tongue","sharp_tongue",54.44,"👅",[["Night Club","night_club",54.47],["Vegan Snake","vegan_snake",54.48],["Queen","queen",54.55],["Lady Night","lady_night",54.75],["Sour Bite","sour_bite",57.49],["Hot Summer","hot_summer",57.94],["Spicy Mint","spicy_mint",58.5],["High Voltage","high_voltage",63.24],["Punk Girl","punk_girl",65.2],["Karlach","karlach",71.4],["Acid Witch","acid_witch",73.49],["Pop Art","pop_art",79.33],["Teasing Look","teasing_look",160.14]]],["Kissed Frog","kissed_frog",48.3,"🐸",[["Brownie","brownie",48.3],["Sky Leaper","sky_leaper",48.31],["Peach","peach",48.32],["Banana Pox","banana_pox",48.33],["Frogtart","frogtart",48.33],["Lily Pond","lily_pond",48.33],["Minty Bloom","minty_bloom",48.33],["Frogwave","frogwave",52.36],["Duskhopper","duskhopper",56.09],["Hopberry","hopberry",64.3],["Ms. Toad","ms._toad",86.7],["Zodiak Croak","zodiak_croak",183.6],["Count Croakula","count_croakula",253.98]]],["Bonded Ring","bonded_ring",44.49,"💞",[["Love Whisper","love_whisper",45.66],["Leopard","leopard",45.67],["Spectrum","spectrum",45.68],["Dalmatian","dalmatian",45.7],["Line Art","line_art",45.9],["Ironwood","ironwood",46.9],["Runewood","runewood",46.91],["Frostband","frostband",48.96],["Black Hole","black_hole",51.0],["Solid Magma","solid_magma",55.08],["Hourglass","hourglass",68.7],["Hamster Wheel","hamster_wheel",86.7],["Moon Dust","moon_dust",204.0]]],["Vintage Cigar","vintage_cigar",39.66,"🚬",[["Blue Hue","blue_hue",39.66],["Subtle Purple","subtle_purple",39.73],["Warm Glow","warm_glow",39.74],["Mirror Finish","mirror_finish",39.78],["Premium Blend","premium_blend",39.78],["Stained Glass","stained_glass",39.78],["Silver Bullet","silver_bullet",40.8],["Cool Blue","cool_blue",42.84],["Seeing Red","seeing_red",43.86],["Sunset Orange","sunset_orange",45.9],["Aquaviolet","aquaviolet",51.0],["Super Swirls","super_swirls",74.46],["Ice Cold","ice_cold",112.2]]],["Neko Helmet","neko_helmet",39.0,"🪖",[["Lagoon","lagoon",40.46],["Copper Alloy","copper_alloy",40.47],["Techno","techno",40.64],["Optimus Prime","optimus_prime",40.65],["Poison Ivy","poison_ivy",40.8],["Solar Glare","solar_glare",40.8],["Hornet","hornet",42.41],["Jade Breeze","jade_breeze",43.99],["Shockwave","shockwave",45.9],["Queen Bee","queen_bee",50.99],["Glitch","glitch",66.3],["Hell Rider","hell_rider",75.48],["Mad Clown","mad_clown",142.8]]],["Voodoo Doll","voodoo_doll",38.56,"🪆",[["Painful Love","painful_love",38.56],["Pain Train","pain_train",38.76],["Electrician","electrician",39.14],["Bumblebee","bumblebee",39.21],["Red Checker","red_checker",39.36],["Tan Gent","tan_gent",39.37],["Vengeance","vengeance",39.37],["Rebel Spirit","rebel_spirit",43.86],["Chromed Out","chromed_out",47.89],["Pumpkin","pumpkin",50.99],["Magma Ooze","magma_ooze",56.66],["Layer One","layer_one",81.59],["Terminator","terminator",102.0]]],["Genie Lamp","genie_lamp",37.2,"🪔",[["Chrome","chrome",37.2],["Eternal Smoke","eternal_smoke",37.21],["Blueprint","blueprint",37.33],["Sunset Rays","sunset_rays",37.33],["Jade Lantern","jade_lantern",37.73],["Golden Flame","golden_flame",37.97],["Mystic Aura","mystic_aura",37.97],["Red Sketch","red_sketch",40.69],["Copper Pot","copper_pot",43.86],["Thunder","thunder",56.1],["Lost Souls","lost_souls",67.32],["Meowgical","meowgical",102.0],["Cat Spirit","cat_spirit",255.0]]],["Signet Ring","signet_ring",35.98,"💍",[["Mandarin","mandarin",35.98],["Platinum","platinum",35.99],["Hearts","hearts",36.0],["Candy Cane","candy_cane",36.09],["Titanium","titanium",36.11],["Emerald","emerald",36.16],["Christmas","christmas",36.2],["Pristine","pristine",37.03],["Off-Axis","off-axis",39.78],["Jade Lord","jade_lord",40.8],["Chrome","chrome",47.43],["Golden Pearl","golden_pearl",61.2],["Skibidi","skibidi",357.0]]],["Diamond Ring","diamond_ring",34.0,"💍",[["Vice City","vice_city",34.68],["Scrapyard","scrapyard",35.33],["Canary","canary",35.34],["Citrus Shift","citrus_shift",35.45],["Mint Candy","mint_candy",35.49],["Acid Green","acid_green",35.7],["Sunset","sunset",36.5],["Iron Feather","iron_feather",37.99],["Princess Cut","princess_cut",39.78],["Copper Rose","copper_rose",42.84],["Flamingo","flamingo",45.9],["Orion","orion",56.1],["El Dorado","el_dorado",89.76]]],["Toy Bear","toy_bear",33.86,"🧸",[["Cherry","cherry",34.54],["Froggo","froggo",34.54],["Zebra","zebra",34.56],["Alter Ego","alter_ego",34.58],["Purple Heart","purple_heart",34.58],["Graduate","graduate",34.59],["Contractor","contractor",34.74],["Teddy-800","teddy-800",36.72],["Matroskin","matroskin",38.79],["Chocolate","chocolate",40.93],["Panda","panda",45.9],["Polygon","polygon",51.0],["Deadpool","deadpool",99.96]]],["Electric Skull","electric_skull",29.93,"💀",[["Neon Green","neon_green",30.95],["Nightfall","nightfall",30.95],["Rose Quartz","rose_quartz",30.96],["Brass Fossil","brass_fossil",31.21],["Zombie","zombie",31.22],["Deadman","deadman",31.52],["Tangerine","tangerine",31.62],["Bone White","bone_white",34.68],["Polka Dead","polka_dead",35.7],["Cute Monster","cute_monster",40.8],["Happy End","happy_end",49.98],["Starman","starman",95.0],["Sleepy Hollow","sleepy_hollow",438.6]]],["Rare Bird","rare_bird",29.06,"🎁",[["Copper Quack","copper_quack",29.06],["Jade Jay","jade_jay",29.07],["Paradise","paradise",29.58],["Pigeon","pigeon",29.72],["Silver Spike","silver_spike",29.84],["Crystal Swan","crystal_swan",29.89],["Azure Spark","azure_spark",30.6],["Bat King","bat_king",32.63],["Sphinx","sphinx",34.0],["Shadow Raven","shadow_raven",35.74],["Prehistoric","prehistoric",44.88],["Winged Victory","winged_victory",88.74],["Zombie Rider","zombie_rider",163.2]]],["Eternal Rose","eternal_rose",27.22,"🌹",[["Poison Ivy","poison_ivy",27.22],["Jade Bloom","jade_bloom",27.34],["Fallout","fallout",27.52],["Stolen Bloom","stolen_bloom",27.53],["Silent Bloom","silent_bloom",28.25],["Ink Blaze","ink_blaze",28.39],["Gilded Petal","gilded_petal",28.56],["Phantom Glow","phantom_glow",28.99],["Aurora Veil","aurora_veil",29.66],["Fireflies","fireflies",30.6],["3D Glow","3d_glow",33.15],["Celestial Bud","celestial_bud",35.7],["Purple Bloom","purple_bloom",40.8]]],["Khabib's Papakha","khabibs_papakha",26.89,"🎩",[["Breakfast","breakfast",27.52],["Pile Of Hats","pile_of_hats",27.97],["Magic Carpet","magic_carpet",28.55],["Family Table","family_table",28.56],["Eagles MMA","eagles_mma",29.58],["Honor","honor",29.58],["Madridista","madridista",29.97],["Chokha","chokha",30.6],["Dagestan","dagestan",33.66],["Long Curls","long_curls",35.7],["Knockout","knockout",38.51],["Flying High","flying_high",55.55],["Black Diamond","black_diamond",202.98]]],["Bling Binky","bling_binky",26.19,"🍼",[["Cthulhu","cthulhu",26.37],["Gem Seeker","gem_seeker",26.39],["Marmalade","marmalade",26.45],["First Ax","first_ax",26.52],["Rancho","rancho",27.34],["Abyss Binky","abyss_binky",27.5],["Illuminati","illuminati",27.54],["Irish Kiss","irish_kiss",28.56],["Danger Bot","danger_bot",30.09],["Red Bull","red_bull",31.84],["Bullet","bullet",33.99],["Peach Flower","peach_flower",40.8],["Adult Toy","adult_toy",70.89]]],["Cupid Charm","cupid_charm",23.0,"💘",[["Ribbons","ribbons",23.45],["Lockpicking","lockpicking",23.46],["Bubbles","bubbles",23.76],["Snow Queen","snow_queen",23.77],["Azure Gem","azure_gem",23.84],["Crystal Clear","crystal_clear",23.97],["Faerie","faerie",23.97],["Golden Grasp","golden_grasp",24.48],["Surgery","surgery",24.48],["Blossom","blossom",25.5],["Ruby Whisper","ruby_whisper",25.5],["Cupid Pay","cupid_pay",29.38],["Gothic Core","gothic_core",42.83]]],["Sky Stilettos","sky_stilettos",19.45,"👠",[["Mystery","mystery",19.89],["Poison Ivy","poison_ivy",20.04],["Machaon","machaon",20.05],["Mistress","mistress",20.09],["Free Spirit","free_spirit",20.18],["Mermaid","mermaid",20.2],["Cowgirl","cowgirl",20.21],["Fergie","fergie",20.4],["Lost World","lost_world",20.79],["Vogue","vogue",21.42],["Ladybug","ladybug",22.44],["Glossy","glossy",25.46],["Crypto Queen","crypto_queen",59.98]]],["Trapped Heart","trapped_heart",17.48,"❤️‍🔥",[["Mended Love","mended_love",18.17],["Toxic Love","toxic_love",18.25],["Sweetheart","sweetheart",18.3],["Heartworm","heartworm",18.32],["Crime Scene","crime_scene",18.34],["Sandy Red","sandy_red",18.34],["Undead Beat","undead_beat",18.36],["Mystic Mark","mystic_mark",20.24],["Purple Haze","purple_haze",20.4],["Silver Luxe","silver_luxe",21.6],["Valentine","valentine",22.43],["Feline Fury","feline_fury",33.66],["Stardust","stardust",66.3]]],["UFC Strike","ufc_strike",16.79,"🥊",[["S. O'Malley","s._o’malley",15.8],["Level Up","level_up",17.3],["A. Pereira","a._pereira",17.33],["Classic Red","classic_red",17.34],["UFC 30 Red","ufc_30_red",17.34],["UFC 25 Blue","ufc_25_blue",17.44],["S. O’Malley","s._o’malley",17.65],["Classic Blue","classic_blue",18.36],["I. Topuria","i._topuria",20.2],["Combo Hit","combo_hit",23.46],["UFC Classic","ufc_classic",30.6],["Gold Dvalishvili","gold_dvalishvili",35.69],["Gold Chimaev","gold_chimaev",52.45]]],["Ionic Dryer","ionic_dryer",15.72,"💨",[["Rad-Dry 9000","rad-dry_9000",15.72],["Volcano","volcano",15.72],["Music Player","music_player",15.73],["Zephyrus","zephyrus",15.8],["Sound Wave","sound_wave",15.81],["Hot Bot","hot_bot",15.94],["Scorchwing","scorchwing",15.94],["Savannah","savannah",16.32],["Shooting Star","shooting_star",17.34],["Sugar Breeze","sugar_breeze",18.94],["Beetlejuice","beetlejuice",20.4],["Dried Flowers","dried_flowers",25.5],["Plumbus","plumbus",40.8]]],["Love Potion","love_potion",15.5,"💘",[["Nurgle's Rot","nurgle’s_rot",14.0],["Seeker's Wish","seeker’s_wish",15.0],["Mouthwash","mouthwash",15.8],["Poison Flask","poison_flask",15.81],["Ruby Essence","ruby_essence",15.81],["Kiwi Juice","kiwi_juice",15.91],["Fairy Pollen","fairy_pollen",16.1],["Old Rum","old_rum",16.98],["Bubble Gum","bubble_gum",17.38],["Astral Guide","astral_guide",18.87],["Romeo","romeo",19.96],["Peach Nectar","peach_nectar",23.46],["Flat Pink","flat_pink",39.99]]],["Snoop Cigar","snoop_cigar",15.3,"🚬",[["Snoop's Pipe","snoop’s_pipe",13.96],["Snoop Ring","snoop_ring",15.99],["Happy Face","happy_face",16.22],["Bandana","bandana",16.31],["Cabbage Roll","cabbage_roll",16.32],["Charmed Roll","charmed_roll",16.32],["Funk Dunk","funk_dunk",16.32],["Snooperman","snooperman",16.52],["Hyperdrive","hyperdrive",17.24],["Highway","highway",17.49],["America","america",17.88],["Dolla Rolla","dolla_rolla",18.87],["Smoke Sway","smoke_sway",24.48]]],["Flying Broom","flying_broom",13.29,"🧹",[["Green Machine","green_machine",13.29],["Dark Pine","dark_pine",13.45],["Fire Flight","fire_flight",13.48],["Bunny Broom","bunny_broom",13.68],["Unreliable","unreliable",13.69],["Lightspeed","lightspeed",13.77],["RGB Branch","rgb_branch",13.77],["Vineyard","vineyard",14.28],["Ravenclaw","ravenclaw",14.79],["Stealth Sweep","stealth_sweep",14.99],["Hufflepuff","hufflepuff",15.3],["Glitch Witch","glitch_witch",15.81],["Nimbus","nimbus",19.89]]],["Crystal Ball","crystal_ball",13.0,"🔮",[["Deathquik","deathquik",13.36],["Fortune","fortune",13.45],["Death Wish","death_wish",13.57],["Warhol","warhol",13.57],["Vitamin C","vitamin_c",13.62],["Martian","martian",13.66],["Cartoon","cartoon",13.77],["Brain Freeze","brain_freeze",14.27],["Oculus","oculus",14.7],["Electric Shock","electric_shock",15.3],["Skullberry","skullberry",16.01],["Poor Kitty","poor_kitty",21.42],["Femme Fatale","femme_fatale",30.6]]],["Mad Pumpkin","mad_pumpkin",12.94,"🎃",[["Joke-O'-Lantern","joke-o’-lantern",10.13],["Copperfield","copperfield",12.95],["Flat Joke","flat_joke",13.05],["Watermelon","watermelon",13.07],["The Mocker","the_mocker",13.09],["Unripe","unripe",13.09],["Chuckle-ate","chuckle-ate",13.11],["Green Grins","green_grins",13.77],["Krusty","krusty",14.27],["Little Sketchy","little_sketchy",15.08],["Squashbuckler","squashbuckler",16.99],["Dark Ritual","dark_ritual",21.8],["Creepy Po","creepy_po",34.0]]],["Valentine Box","valentine_box",12.52,"💝",[["Summer","summer",12.52],["Lavender","lavender",12.53],["Gold Dust","gold_dust",12.54],["Vibrant","vibrant",12.61],["Green Apple","green_apple",12.66],["Prestige","prestige",13.16],["Silver Blue","silver_blue",13.16],["Pop Art","pop_art",13.7],["White Gold","white_gold",14.28],["Inbox","inbox",15.3],["Snow Queen","snow_queen",16.27],["Kiss Emoji","kiss_emoji",18.77],["Kitten","kitten",32.64]]],["Skull Flower","skull_flower",12.45,"💀",[["Daisy","daisy",12.79],["Citrus Twist","citrus_twist",12.8],["Poinsettia","poinsettia",12.83],["Newspaper","newspaper",12.85],["Secret Sprout","secret_sprout",12.85],["Marigold","marigold",12.86],["Royal Azure","royal_azure",12.86],["Technicolor","technicolor",13.46],["Neon Pink","neon_pink",14.28],["Jack Sparrow","jack_sparrow",15.0],["Glowing Goth","glowing_goth",15.59],["Black Dahlia","black_dahlia",18.63],["Ghost Rider","ghost_rider",51.0]]],["Record Player","record_player",11.9,"📻",[["Pink Noir","pink_noir",12.24],["Red Cruiser","red_cruiser",12.24],["Velvet Draft","velvet_draft",12.24],["Moonglows","moonglows",12.44],["Purple Swag","purple_swag",12.54],["Retro Silver","retro_silver",12.54],["Mint Vinyl","mint_vinyl",12.81],["Mangosteen","mangosteen",13.26],["Sakura","sakura",14.28],["Black Gold","black_gold",15.31],["Toxic Rave","toxic_rave",18.96],["School Disco","school_disco",22.44],["The Wall","the_wall",44.87]]],["Love Candle","love_candle",11.0,"🕯️",[["Afterglow","afterglow",11.28],["Zen Garden","zen_garden",11.51],["Coral Reef","coral_reef",11.53],["Mykonos","mykonos",11.62],["Gray Smoke","gray_smoke",11.66],["Timber Glow","timber_glow",11.66],["Ocean Breeze","ocean_breeze",11.67],["Arabian Night","arabian_night",12.24],["Cloud","cloud",13.26],["Gentle Wind","gentle_wind",14.17],["Gothic Tears","gothic_tears",14.63],["Twilight","twilight",17.34],["Golden Glow","golden_glow",30.6]]],["Sakura Flower","sakura_flower",10.84,"🌸",[["Allamanda","allamanda",11.18],["Gerbera","gerbera",11.18],["Fabulous","fabulous",11.19],["Yellow Poppy","yellow_poppy",11.2],["Azure","azure",11.21],["Celestara","celestara",11.22],["Hollyhock","hollyhock",11.79],["Hawaii","hawaii",12.24],["Solivine","solivine",12.71],["Pokerface","pokerface",13.26],["Heartbeat","heartbeat",14.59],["Bubblia","bubblia",19.38],["Dog Flower","dog_flower",44.88]]],["Jingle Bells","jingle_bells",9.8,"🔔",[["Copper Pink","copper_pink",9.87],["Blue Ribbon","blue_ribbon",9.88],["Rose Gold","rose_gold",9.91],["Antique","antique",9.92],["Orchestra","orchestra",10.15],["Sleigh Bells","sleigh_bells",10.18],["Lichen","lichen",10.7],["Elsa Bell","elsa_bell",11.09],["Lithograph","lithograph",11.93],["Bell Hive","bell_hive",13.01],["Fire and Ice","fire_and_ice",15.3],["Mushrooms","mushrooms",20.4],["Little Gifts","little_gifts",191.76]]],["Sleigh Bell","sleigh_bell",9.5,"🔔",[["Deutschland","deutschland",9.95],["Fairycore","fairycore",10.08],["Truffle","truffle",10.19],["Confetti","confetti",10.2],["Satin Brass","satin_brass",10.2],["Spetsnaz","spetsnaz",10.2],["Deep Echo","deep_echo",10.27],["Candy Cane","candy_cane",10.66],["Fireball","fireball",11.0],["Mortabella","mortabella",11.92],["Dark Orb","dark_orb",13.97],["Golden Zebra","golden_zebra",14.98],["Stuart","stuart",36.72]]],["Top Hat","top_hat",9.5,"🎩",[["Blood Veil","blood_veil",10.3],["Maroon","maroon",10.3],["White Windsor","white_windsor",10.3],["Purple Rain","purple_rain",10.41],["Charlie","charlie",10.42],["Alabaster","alabaster",10.57],["Black Raven","black_raven",10.58],["Bloodline","bloodline",11.22],["Performer","performer",11.93],["Antiquity","antiquity",12.75],["Mad Hatter","mad_hatter",14.87],["Blackjack","blackjack",20.91],["Hypnosis","hypnosis",45.9]]],["Hanging Star","hanging_star",9.28,"⭐",[["Venice","venice",9.19],["Harlequin","harlequin",9.27],["Tarnished","tarnished",9.28],["Beach Ball","beach_ball",9.4],["Purple Pants","purple_pants",9.4],["Thread","thread",9.4],["Spotty","spotty",9.69],["Polka Dot","polka_dot",10.8],["Eclipse","eclipse",12.12],["Red Dwarf","red_dwarf",12.24],["Bright Geode","bright_geode",13.97],["Skeleton","skeleton",19.89],["Minion","minion",35.7]]],["Berry Box","berry_box",8.7,"🍓",[["Rose Gold","rose_gold",8.97],["Baubles","baubles",8.98],["Gryffindor","gryffindor",8.98],["Ice Diamond","ice_diamond",8.98],["Infrared","infrared",8.98],["Sweet Star","sweet_star",8.98],["RGBerry","rgberry",9.03],["Strobe","strobe",9.18],["Bowtied","bowtied",9.49],["Foraged","foraged",10.2],["Mood Ring","mood_ring",10.79],["Lovey Dovey","lovey_dovey",12.41],["Clarity","clarity",15.3]]],["Jelly Bunny","jelly_bunny",8.45,"🐰",[["Orchid","orchid",8.38],["Mushroom","mushroom",8.87],["Reindeer","reindeer",8.87],["First Bite","first_bite",8.89],["Sir Wobbleton","sir_wobbleton",8.91],["Snail Gel","snail_gel",8.93],["Commando","commando",9.18],["Violet Joy","violet_joy",9.27],["Majestic","majestic",9.92],["Sugar Kill","sugar_kill",10.2],["Light Wobble","light_wobble",12.24],["Soft Flavor","soft_flavor",14.28],["Grape Glaze","grape_glaze",20.4]]],["Bunny Muffin","bunny_muffin",8.3,"🧁",[["Key Lime","key_lime",8.66],["Green Tea","green_tea",8.68],["Apple Fresh","apple_fresh",8.7],["Watermelon","watermelon",8.73],["Blueberry","blueberry",8.77],["Berry Jam","berry_jam",8.86],["Young Chili","young_chili",8.98],["Droplet","droplet",9.49],["Latte","latte",10.2],["Photonegative","photonegative",11.82],["Party Clown","party_clown",13.26],["Gorgeous","gorgeous",16.83],["Airy Souffle","airy_souffle",31.99]]],["Evil Eye","evil_eye",8.14,"🧿",[["Grinch Gaze","grinch_gaze",8.34],["Do Not Disturb","do_not_disturb",8.35],["Blink","blink",8.36],["Direct Current","direct_current",8.57],["True North","true_north",8.57],["Cybernetic","cybernetic",8.58],["Green Lantern","green_lantern",8.66],["Succubus","succubus",8.86],["Grayscale","grayscale",9.09],["Radioactive","radioactive",9.49],["Monochrome","monochrome",10.19],["Visible Spectrum","visible_spectrum",10.2],["Tesla Coil","tesla_coil",12.79]]],["Joyful Bundle","joyful_bundle",7.73,"💐",[["Cinema Night","cinema_night",7.73],["Telegram","telegram",8.26],["Harry","harry",8.29],["Ed Opossum","ed_opossum",8.36],["Professor","professor",8.49],["Honey Bear","honey_bear",8.54],["Pacman","pacman",8.57],["Shepherd Dog","shepherd_dog",9.08],["Bronze","bronze",9.99],["Pool Party","pool_party",10.2],["Imp Simp","imp_simp",12.23],["Sad Clown","sad_clown",13.98],["Pepe Bag","pepe_bag",20.3]]],["Snow Mittens","snow_mittens",7.62,"🧤",[["Golden Pine","golden_pine",7.65],["Cherry","cherry",7.79],["Twinkle","twinkle",7.79],["The Riddler","the_riddler",7.8],["Grape Soda","grape_soda",7.81],["Green Gloves","green_gloves",7.81],["Twilight","twilight",8.01],["Seafoam","seafoam",8.26],["Lipstick","lipstick",8.84],["Karelia","karelia",9.18],["Aubergine","aubergine",9.56],["Blueberry","blueberry",10.2],["Astronaut","astronaut",14.98]]],["Witch Hat","witch_hat",7.41,"🧙",[["Cat's Grasp","cat’s_grasp",4.49],["Old Ochre","old_ochre",7.41],["Cat’s Grasp","cat’s_grasp",7.45],["Incense","incense",7.5],["Junk Mage","junk_mage",7.51],["Mad Wizard","mad_wizard",7.51],["Blood Mage","blood_mage",7.77],["Hypnosis","hypnosis",8.09],["Red Flag","red_flag",8.54],["Freyja","freyja",9.1],["Narnia","narnia",9.87],["Hat Shot","hat_shot",10.71],["Cat Familiar","cat_familiar",16.32]]],["Jolly Chimp","jolly_chimp",7.29,"🐒",[["Hex Witch","hex_witch",7.59],["Belle Bang","belle_bang",7.6],["French Cafe","french_cafe",7.62],["Artist","artist",7.64],["Baby Kong","baby_kong",7.75],["Patchwork","patchwork",7.75],["Coco Lime","coco_lime",7.81],["Tourist","tourist",8.07],["Genie","genie",8.16],["Howler","howler",8.55],["Luminous","luminous",9.75],["Monkey Mouse","monkey_mouse",12.14],["Chimpool","chimpool",28.45]]],["Surge Board","surge_board",6.86,"🎁",[["Tiger Mask","tiger_mask",6.91],["Tiki Spirit","tiki_spirit",6.94],["Steam Jet","steam_jet",6.96],["Graffiti","graffiti",6.99],["Poseidon","poseidon",7.04],["Scarab","scarab",7.04],["Aloha","aloha",7.14],["Celestial","celestial",7.26],["Privateer","privateer",7.55],["Polar Shard","polar_shard",8.99],["Great Dragon","great_dragon",15.86],["Balls of Steel","balls_of_steel",116.79]]],["Snow Globe","snow_globe",6.5,"🔮",[["Amethyst","amethyst",6.6],["Bikini Bottom","bikini_bottom",6.63],["Caramel","caramel",6.63],["Diamond","diamond",6.63],["Garnet Dawn","garnet_dawn",6.63],["Orange Tale","orange_tale",6.63],["Sky Terrace","sky_terrace",6.63],["Lavender","lavender",6.73],["Spring","spring",6.85],["Choco Waffle","choco_waffle",7.14],["Happy Town","happy_town",7.36],["Ginger House","ginger_house",7.65],["Piggy Bank","piggy_bank",30.6]]],["Spy Agaric","spy_agaric",6.45,"🍄",[["Tiger's Eye","tiger’s_eye",4.9],["D'oh! Shroom","d’oh!_shroom",5.6],["Fungal Dew","fungal_dew",6.45],["Lab Rat","lab_rat",6.45],["Merry Cap","merry_cap",6.47],["Mysctic","mysctic",6.47],["Sunspot","sunspot",6.56],["Lava Lamp","lava_lamp",6.99],["Cherry Drop","cherry_drop",7.14],["Red X","red_x",7.14],["Savannah","savannah",8.06],["RoboCap","robocap",9.08],["Pepe Mania","pepe_mania",19.37]]],["Moon Pendant","moon_pendant",6.42,"🌙",[["Ruby Core","ruby_core",6.61],["Golden Moon","golden_moon",6.63],["Royal Purple","royal_purple",6.63],["Sovereign","sovereign",6.63],["Stellar Grace","stellar_grace",6.63],["Harmony","harmony",6.66],["Carved Gold","carved_gold",6.69],["Frosted Green","frosted_green",6.81],["Twilight Wish","twilight_wish",6.83],["Silver Blue","silver_blue",7.04],["Precious Pearl","precious_pearl",7.34],["Silver Lace","silver_lace",8.16],["Calm Sunset","calm_sunset",12.24]]],["Light Sword","light_sword",6.3,"⚔️",[["Jet Fuel","jet_fuel",6.33],["Brand Name","brand_name",6.34],["Hyperdrive","hyperdrive",6.34],["Prismatic","prismatic",6.35],["Duelist","duelist",6.36],["Lava Forge","lava_forge",6.36],["Toy Blade","toy_blade",6.36],["Gaslight","gaslight",6.68],["Quasar","quasar",6.88],["Lava Lash","lava_lash",7.09],["Dragonfire","dragonfire",8.36],["Love Samurai","love_samurai",14.79],["Darksaber","darksaber",43.86]]],["Eternal Candle","eternal_candle",6.22,"🕯️",[["Wolfsbane","wolfsbane",6.22],["Twilight","twilight",6.24],["White Ash","white_ash",6.25],["Warm Embrace","warm_embrace",6.27],["Burnt Amber","burnt_amber",6.32],["Citrus Burst","citrus_burst",6.32],["Cool Metal","cool_metal",6.38],["Purple Wave","purple_wave",6.58],["Hot Emerald","hot_emerald",6.94],["Floral Scent","floral_scent",7.19],["Dreamscape","dreamscape",7.65],["Bubble Bath","bubble_bath",8.66],["Neroli Noir","neroli_noir",13.25]]],["Santa Hat","santa_hat",6.12,"🎅",[["Hearth's Fire","hearth’s_fire",5.0],["Icicle","icicle",6.4],["Golden Tide","golden_tide",6.42],["Frosted Sun","frosted_sun",6.43],["The Grinch","the_grinch",6.53],["Polar Glow","polar_glow",6.54],["80s TV","80s_tv",6.59],["Minty Fresh","minty_fresh",6.63],["Ice Cap","ice_cap",6.71],["Warm Winter","warm_winter",7.04],["Pinkie Cap","pinkie_cap",7.65],["Nighttime","nighttime",10.1],["Fireball","fireball",27.03]]],["Input Key","input_key",6.1,"⌨️",[["Hashtag","hashtag",6.1],["Underwood","underwood",6.11],["Ctrl+Pi","ctrl+pi",6.12],["Hot Grill","hot_grill",6.17],["LOL","lol",6.21],["Incredible","incredible",6.26],["V For Vegan","v_for_vegan",6.3],["Play Button","play_button",6.74],["Red Dice","red_dice",7.78],["Parking Lot","parking_lot",8.45],["Joker","joker",10.36],["Creeper","creeper",14.17],["Money Printer","money_printer",21.59]]],["Desk Calendar","desk_calendar",6.06,"📅",[["Women's Day","women’s_day",4.99],["Vacation","vacation",6.06],["Mesozoic","mesozoic",6.07],["Steampunk","steampunk",6.07],["Daily Bread","daily_bread",6.09],["April Fools","april_fools",6.11],["Bright Coral","bright_coral",6.43],["Party Time","party_time",6.61],["June","june",6.99],["December","december",7.52],["Thursday","thursday",8.16],["Wedding","wedding",11.91],["Day of Mars","day_of_mars",45.9]]],["Faith Amulet","faith_amulet",5.7,"📿",[["Sunny Mosaic","sunny_mosaic",5.85],["Winter","winter",5.85],["Morning Dew","morning_dew",5.87],["Stained Glass","stained_glass",5.88],["Lunar Veil","lunar_veil",5.91],["Mystic Tide","mystic_tide",5.91],["Moonlight","moonlight",5.92],["Aurora","aurora",6.06],["Secret Bloom","secret_bloom",6.11],["Princess","princess",6.12],["Silver Charm","silver_charm",6.12],["Miracle","miracle",6.3],["Dark Night","dark_night",7.64]]],["Spring Basket","spring_basket",5.68,"🧺",[["Bear Market","bear_market",5.81],["Dragon Hoard","dragon_hoard",5.81],["Red Panda","red_panda",5.85],["Balloon Dog","balloon_dog",5.88],["Meme Snake","meme_snake",5.89],["Eggsclusive","eggsclusive",5.99],["Marmot","marmot",5.99],["Capybara","capybara",6.12],["Penguin","penguin",6.94],["Cheems","cheems",7.73],["Cute Unicorn","cute_unicorn",9.18],["Gold Retriever","gold_retriever",13.08],["Ritual Goat","ritual_goat",66.49]]],["Snoop Dogg","snoop_dogg",5.58,"🐶",[["Iconic Dude","iconic_dude",5.59],["Backspin","backspin",5.6],["Chill Homie","chill_homie",5.61],["Huggy Bear","huggy_bear",5.61],["Long Beach","long_beach",5.61],["Club Dawg","club_dawg",5.65],["Bollywood","bollywood",5.66],["Peach Mode","peach_mode",5.71],["Black Gold","black_gold",5.81],["Horseman","horseman",5.89],["Captain Mack","captain_mack",6.07],["King Ruby","king_ruby",6.82],["Doggfather","doggfather",9.46]]],["Swag Bag","swag_bag",5.58,"👜",[["Dogg Treats","dogg_treats",5.61],["Gin and Juice","gin_and_juice",5.61],["Spicy Onion","spicy_onion",5.61],["Crook To Cook","crook_to_cook",5.65],["Lemon Pepper","lemon_pepper",5.65],["Smokefest","smokefest",5.67],["Candy Shop","candy_shop",5.7],["Muffins","muffins",5.85],["West Toast","west_toast",6.12],["Golden Nugs","golden_nugs",6.72],["Shuffle","shuffle",7.25],["Gin & Jewels","gin_&_jewels",8.1],["Take It Easy","take_it_easy",14.99]]],["Lush Bouquet","lush_bouquet",5.57,"💐",[["Oak Crown","oak_crown",5.61],["Mandrake","mandrake",5.62],["Yarn Balls","yarn_balls",5.62],["Cabbage","cabbage",5.63],["Carrots","carrots",5.65],["Chompy","chompy",5.93],["Crocodile","crocodile",5.98],["Donuts","donuts",6.81],["Rafflesia","rafflesia",8.15],["Sunflowers","sunflowers",9.69],["Berries","berries",13.13],["Golden Petals","golden_petals",17.85],["Tulips","tulips",24.99]]],["Bow Tie","bow_tie",5.49,"🎀",[["Cupid's Bow","cupid’s_bow",5.0],["Dribble","dribble",5.55],["Irish Knot","irish_knot",5.55],["The Badger","the_badger",5.55],["Elephant","elephant",5.56],["Mistletoe","mistletoe",5.56],["Mondrian","mondrian",5.56],["The Raven","the_raven",5.66],["Billiards","billiards",6.11],["Blue Morpho","blue_morpho",7.5],["Bus Guys","bus_guys",11.0],["Farfalle","farfalle",15.1],["Batwing","batwing",35.7]]],["Hex Pot","hex_pot",5.48,"🍯",[["Scarlet Sun","scarlet_sun",5.48],["Jade Grog","jade_grog",5.51],["Amethyst","amethyst",5.56],["Skygold","skygold",5.62],["Holiday Spirit","holiday_spirit",5.66],["Peppermint","peppermint",5.66],["Burnt Roses","burnt_roses",5.78],["Red Shift","red_shift",6.0],["Gummy Worm","gummy_worm",6.12],["Golden Glow","golden_glow",6.21],["Choco Cloud","choco_cloud",6.68],["Red Mirage","red_mirage",7.43],["Defensive","defensive",19.38]]],["Liberty Figure","liberty_figure",5.25,"🎁",[["Pitcher","pitcher",5.39],["Earhart","earhart",5.41],["Girl Scout","girl_scout",5.41],["West Egg","west_egg",5.45],["Edison","edison",5.48],["Washington","washington",5.48],["Gold Rush","gold_rush",5.51],["Plushie","plushie",5.76],["Golden Torch","golden_torch",6.28],["Aquamarine","aquamarine",6.47],["Diamond","diamond",7.14],["Moonwalker","moonwalker",11.1]]],["Pretty Posy","pretty_posy",5.19,"💐",[["Rock Band","rock_band",5.21],["Boom Bloom","boom_bloom",5.22],["Frankfurter","frankfurter",5.26],["Salami Set","salami_set",5.3],["Venus Flytrap","venus_flytrap",5.31],["Tangerine","tangerine",5.42],["Harvest","harvest",5.43],["Temaki","temaki",5.69],["Cinema","cinema",6.09],["Moon Shrooms","moon_shrooms",6.68],["Fresh Cash","fresh_cash",8.17],["Zen Garden","zen_garden",10.99],["Teddy Luxe","teddy_luxe",17.34]]],["Money Pot","money_pot",5.11,"🪙",[["Donut Crime","donut_crime",5.11],["Aquarium","aquarium",5.12],["Toy Bucket","toy_bucket",5.13],["Dim Sum","dim_sum",5.2],["Elf Cup","elf_cup",5.2],["Fungi Soup","fungi_soup",5.2],["Scavenger","scavenger",5.2],["Mailbox","mailbox",5.27],["Apiary","apiary",5.46],["Obelix","obelix",5.91],["Leprechaun","leprechaun",7.46],["Pumpkin","pumpkin",9.79],["Pax Romana","pax_romana",23.36]]],["Ginger Cookie","ginger_cookie",5.09,"🍪",[["Raspberry","raspberry",5.09],["Banana Bread","banana_bread",5.1],["Ice Latte","ice_latte",5.1],["Mr. Biscuit","mr._biscuit",5.12],["Truffle","truffle",5.12],["Bordeaux","bordeaux",5.14],["Periwinkle","periwinkle",5.2],["Cinnamon","cinnamon",5.41],["Choco Swirl","choco_swirl",5.51],["Waffle","waffle",5.71],["Frosty","frosty",6.22],["Tied Up","tied_up",8.11],["Eve","eve",20.4]]],["Restless Jar","restless_jar",5.08,"🫙",[["Mini Blocks","mini_blocks",5.08],["Pickles","pickles",5.09],["Autumn Candle","autumn_candle",5.1],["Solar System","solar_system",5.11],["Cherry Punch","cherry_punch",5.19],["Pineapple","pineapple",5.19],["Tomatoes","tomatoes",5.2],["Mocktail","mocktail",5.3],["Chocolate","chocolate",5.56],["Uranium","uranium",6.07],["Happy Pills","happy_pills",6.9],["Tricky Treats","tricky_treats",8.0],["Gift Holder","gift_holder",21.42]]],["Party Sparkler","party_sparkler",5.04,"🎇",[["Azurite","azurite",5.04],["Copper","copper",5.04],["Purple Rain","purple_rain",5.04],["Bright Flare","bright_flare",5.06],["Hellfire","hellfire",5.07],["Hot Handle","hot_handle",5.09],["Mint Powder","mint_powder",5.18],["Red Hot","red_hot",5.41],["Crystal","crystal",5.7],["Little Fairy","little_fairy",6.12],["Lord Vader","lord_vader",6.63],["Midas Party","midas_party",8.16],["Power Line","power_line",14.13]]],["Stellar Rocket","stellar_rocket",4.99,"🚀",[["Fireworks","fireworks",5.26],["Jet Bike","jet_bike",5.27],["Lollipop","lollipop",5.27],["Malfunction","malfunction",5.27],["Flower Power","flower_power",5.28],["Lava Lamp","lava_lamp",5.29],["Alien Pizza","alien_pizza",5.3],["First Step","first_step",5.42],["Vintage Toy","vintage_toy",5.49],["Pepelatz","pepelatz",5.78],["Silver Ride","silver_ride",6.12],["Little Journey","little_journey",8.16],["To The Moon","to_the_moon",24.28]]],["Winter Wreath","winter_wreath",4.99,"🎄",[["Cold Night","cold_night",5.12],["Pine Bloom","pine_bloom",5.12],["Grape","grape",5.15],["Negative","negative",5.25],["Chocolate","chocolate",5.28],["Hearth","hearth",5.3],["Barbie Core","barbie_core",5.4],["Celebration","celebration",5.61],["Unicorn","unicorn",5.87],["Night Bell","night_bell",6.12],["Gingerbread","gingerbread",6.53],["Hellfire","hellfire",7.97],["Telegram","telegram",22.44]]],["Cookie Heart","cookie_heart",4.93,"🍪",[["Elven Bakery","elven_bakery",5.13],["Mint Cream","mint_cream",5.15],["Changeling","changeling",5.16],["Choco Fudge","choco_fudge",5.18],["Honeymoon","honeymoon",5.18],["Infinity Gems","infinity_gems",5.18],["Fairy Tale","fairy_tale",5.29],["Spicy Maple","spicy_maple",5.49],["Medovik","medovik",5.71],["Sprinkles","sprinkles",6.07],["Last Bites","last_bites",6.42],["Hearty Crust","hearty_crust",7.28],["Cold Heart","cold_heart",16.01]]],["Clover Pin","clover_pin",4.9,"🍀",[["Top Student","top_student",4.94],["Lava Lamp","lava_lamp",5.05],["Joystick","joystick",5.08],["Watermelon","watermelon",5.1],["Pepperoni","pepperoni",5.17],["Berry Waffle","berry_waffle",5.18],["Hot Brand","hot_brand",5.18],["Balloon","balloon",5.36],["Sangria","sangria",5.68],["Corrupted","corrupted",6.0],["Nebula","nebula",6.13],["Matrix","matrix",7.14],["Emo Pin","emo_pin",9.69]]],["Mousse Cake","mousse_cake",4.8,"🍰",[["Bubble Jar","bubble_jar",5.22],["Meatcake","meatcake",5.24],["Sugar Bricks","sugar_bricks",5.25],["Ice Cream","ice_cream",5.27],["Cheesecake","cheesecake",5.28],["Italian Pie","italian_pie",5.28],["Wicked Pie","wicked_pie",5.28],["Treasure","treasure",5.41],["Solar System","solar_system",5.49],["Purple Geode","purple_geode",5.84],["Fiesta Muerta","fiesta_muerta",6.12],["Rose Bouquet","rose_bouquet",6.7],["Hollow Night","hollow_night",16.32]]],["Jack-in-the-Box","jackinthebox",4.71,"🎁",[["Let's Rock","let’s_rock",3.88],["Dentures","dentures",5.15],["Super Block","super_block",5.19],["Thumbs Up","thumbs_up",5.19],["Knockdown","knockdown",5.2],["Lunch Break","lunch_break",5.2],["Undead","undead",5.25],["Luggage","luggage",5.41],["Trash Panda","trash_panda",5.51],["Unicorn","unicorn",5.69],["New Sneakers","new_sneakers",6.12],["Crash TNT","crash_tnt",7.65],["Haunted House","haunted_house",18.86]]],["Holiday Drink","holiday_drink",4.7,"🥤",[["Choco Mint","choco_mint",4.94],["Candyman","candyman",4.99],["Banana Split","banana_split",5.0],["Ginger Joker","ginger_joker",5.0],["Hibiscus Tea","hibiscus_tea",5.0],["Hot Fuchsia","hot_fuchsia",5.0],["Kiwi Box","kiwi_box",5.0],["Citrus","citrus",5.1],["Moonberry","moonberry",5.1],["Cubism","cubism",5.2],["Mermaid","mermaid",5.61],["Blue Taser","blue_taser",6.63],["Depresso","depresso",11.22]]],["Victory Medal","victory_medal",4.67,"🎁",[["Nice Try","nice_try",4.67],["Candy King","candy_king",4.69],["Dunk Master","dunk_master",4.69],["Pathfinder","pathfinder",4.69],["Sharpshooter","sharpshooter",4.69],["Silver","silver",4.69],["Telecrafter","telecrafter",4.69],["Great Athlete","great_athlete",4.89],["Veteran","veteran",5.0],["Viking","viking",5.46],["Eternal Glory","eternal_glory",7.1],["Master Of Luck","master_of_luck",14.28],["Noble Prize","noble_prize",77.5]]],["B-Day Candle","bday_candle",4.53,"🕯️",[["Warm Wick","warm_wick",4.87],["Golden Hour","golden_hour",4.89],["Steel Strong","steel_strong",4.89],["Festive","festive",4.9],["Ice Crackle","ice_crackle",4.9],["Glittery Day","glittery_day",4.93],["Be Awesome!","be_awesome!",5.0],["Forever Young","forever_young",5.05],["Citrus Candy","citrus_candy",5.1],["Tender Flame","tender_flame",5.1],["Midnight","midnight",5.24],["Orange Mood","orange_mood",5.61],["Purr Magic","purr_magic",9.69]]],["Star Notepad","star_notepad",4.5,"📒",[["Côte d'Azur","côte_d’azur",3.58],["Joker's Notes","joker’s_notes",3.81],["Crimson","crimson",4.62],["Savoy Blue","savoy_blue",4.62],["Vineyard","vineyard",4.65],["Blue Jeans","blue_jeans",4.66],["Ocean Wave","ocean_wave",4.77],["Tobacco","tobacco",4.95],["Côte d’Azur","côte_d’azur",5.1],["Indigo","indigo",5.51],["Novelist","novelist",6.83],["Death Note","death_note",8.39],["Joker’s Notes","joker’s_notes",17.32]]],["Homemade Cake","homemade_cake",4.47,"🎂",[["It's My Party","it’s_my_party",4.9],["Tender Peach","tender_peach",5.42],["Cold Heaven","cold_heaven",5.44],["Vanilla Sky","vanilla_sky",5.53],["Golden Hour","golden_hour",5.59],["Candy Parade","candy_parade",5.6],["Sweet Dawn","sweet_dawn",5.8],["Sprinkles","sprinkles",5.92],["Toffee","toffee",5.98],["Ocean Wave","ocean_wave",6.01],["Just A Slice","just_a_slice",6.12],["Mickey Mousse","mickey_mousse",6.79],["Fire Blast","fire_blast",14.78]]],["Fresh Socks","fresh_socks",4.4,"🧦",[["Intellect","intellect",4.48],["Ambition","ambition",4.49],["Courage","courage",4.49],["Dark Power","dark_power",4.49],["Leopard","leopard",4.49],["Peg Leg","peg_leg",4.49],["Stitches","stitches",4.49],["Loyalty","loyalty",4.59],["Brothers","brothers",4.76],["Spider Web","spider_web",4.86],["Black Panther","black_panther",5.1],["Towelie","towelie",5.73],["SquareSocks","squaresocks",10.0]]],["Timeless Book","timeless_book",4.4,"🎁",[["Academic","academic",4.69],["Cookbook","cookbook",4.69],["Ulysses","ulysses",4.69],["Alphabet","alphabet",4.7],["Animal Friends","animal_friends",4.7],["Geometry","geometry",4.75],["Chemistry","chemistry",4.77],["Fairy Tales","fairy_tales",4.93],["E-Reader","e-reader",5.05],["Wisdom Scroll","wisdom_scroll",5.36],["Rocket Science","rocket_science",6.68],["Love Story","love_story",9.88],["Rebel Dog","rebel_dog",47.49]]],["Spiced Wine","spiced_wine",4.39,"🍷",[["Aries Rum","aries_rum",4.39],["Absinthe","absinthe",4.47],["Green Gradient","green_gradient",4.47],["Golden Goblet","golden_goblet",4.48],["Pink Colada","pink_colada",4.49],["Purple Potion","purple_potion",4.53],["Cube Libra","cube_libra",4.59],["Aquarium","aquarium",4.69],["Low Tide","low_tide",4.89],["Over Ice","over_ice",5.19],["Buckwheat","buckwheat",5.63],["Water Spout","water_spout",6.12],["Pink Orange","pink_orange",10.05]]],["Mood Pack","mood_pack",4.39,"🎁",[["Burger Bag","burger_bag",4.43],["Fire Show","fire_show",4.43],["Bloom Pack","bloom_pack",4.44],["Fast Courier","fast_courier",4.44],["Retro Wave","retro_wave",4.44],["Star Pupil","star_pupil",4.44],["Wanderer","wanderer",4.47],["Turtle Shell","turtle_shell",4.5],["Angel Wings","angel_wings",4.63],["Cat Pack","cat_pack",4.79],["Golden Dragon","golden_dragon",5.04],["Infernal Goat","infernal_goat",6.11],["Rare Drop","rare_drop",15.19]]],["Hypno Lollipop","hypno_lollipop",4.32,"🍭",[["Expired","expired",4.32],["Glowing Pink","glowing_pink",4.38],["Beach Treat","beach_treat",4.39],["Green Goblin","green_goblin",4.44],["Pink Clouds","pink_clouds",4.48],["Secret Citrus","secret_citrus",4.49],["Flower Sky","flower_sky",4.59],["Sugar Buzz","sugar_buzz",5.1],["Hysteria","hysteria",5.36],["Purple Petal","purple_petal",5.61],["Teddy Bear","teddy_bear",6.12],["Verdant","verdant",7.62],["Amphibian","amphibian",12.02]]],["Happy Brownie","happy_brownie",4.3,"🍫",[["Stool Sample","stool_sample",4.29],["Alien","alien",4.3],["Shitty Coffee","shitty_coffee",4.3],["Cactus","cactus",4.31],["Wrestler","wrestler",4.33],["Captain Flush","captain_flush",4.39],["Censored","censored",4.39],["Snowman","snowman",4.45],["Solid Waste","solid_waste",4.49],["Brownwood","brownwood",4.66],["Unicorn","unicorn",5.0],["Deadpoo","deadpoo",5.41],["Kawaii","kawaii",11.1]]],["Easter Egg","easter_egg",4.26,"🥚",[["Protein Lamp","protein_lamp",4.26],["Frosted","frosted",4.27],["Brick Wall","brick_wall",4.28],["Flower Bed","flower_bed",4.28],["Crown Prince","crown_prince",4.3],["Bronze","bronze",4.31],["Fine Silver","fine_silver",4.39],["Treasure Map","treasure_map",4.45],["Moon Watch","moon_watch",4.58],["Flowers","flowers",4.69],["Pure Gold","pure_gold",5.71],["Little Doge","little_doge",7.14],["Unicorn","unicorn",13.57]]],["Jester Hat","jester_hat",4.23,"🃏",[["Gecko","gecko",4.23],["Court Jester","court_jester",4.24],["Jungle Bells","jungle_bells",4.27],["Trick Tones","trick_tones",4.27],["Golden Boy","golden_boy",4.3],["Party Drink","party_drink",4.3],["Forest Stream","forest_stream",4.4],["Confetti","confetti",4.59],["Gingle Frost","gingle_frost",4.79],["Harley-Bee","harley-bee",5.09],["Ripe Banana","ripe_banana",5.29],["Rigoletto","rigoletto",6.12],["Inverse","inverse",10.2]]],["Big Year","big_year",4.09,"🎆",[["Frida Kahlo","frida_kahlo",4.12],["Picasso","picasso",4.12],["Sherlock","sherlock",4.13],["Retrowave","retrowave",4.17],["Covid-19","covid-19",4.18],["Frankenstein","frankenstein",4.18],["Salvador Dali","salvador_dali",4.18],["Einstein","einstein",4.28],["Bikini Bottom","bikini_bottom",4.39],["Fallout","fallout",4.54],["Jelly Year","jelly_year",4.78],["Qing Dynasty","qing_dynasty",6.63],["Balloons","balloons",12.24]]],["Pet Snake","pet_snake",4.09,"🐍",[["Santa's Helper","santa’s_helper",3.14],["Mojito","mojito",4.15],["Santa’s Helper","santa’s_helper",4.22],["Sour Bites","sour_bites",4.22],["Rainbow","rainbow",4.28],["Venomous","venomous",4.28],["Tempest","tempest",4.38],["Pink Bunny","pink_bunny",4.59],["Luminous","luminous",4.95],["Party Popper","party_popper",5.1],["Libertarian","libertarian",6.02],["Sunflower","sunflower",7.38],["Dracula","dracula",16.12]]],["Tama Gadget","tama_gadget",4.08,"📟",[["Malachite","malachite",4.08],["Ocean","ocean",4.08],["Pearl White","pearl_white",4.08],["Lime Shock","lime_shock",4.09],["Peach","peach",4.11],["Sunrise","sunrise",4.11],["Verdant","verdant",4.15],["Dalmatian","dalmatian",4.28],["Wish Granted","wish_granted",4.49],["Classic Blue","classic_blue",4.99],["Lavender","lavender",6.11],["Sapphire","sapphire",8.16],["Doom","doom",27.53]]],["Candy Cane","candy_cane",4.07,"🍬",[["Golden Jelly","golden_jelly",4.08],["Lovegood","lovegood",4.08],["Phoenix","phoenix",4.08],["Pink Mango","pink_mango",4.08],["Lovely Kiss","lovely_kiss",4.1],["Nightmare","nightmare",4.13],["Joker","joker",4.14],["Phantom","phantom",4.2],["Lazy Nap","lazy_nap",4.37],["Demonius","demonius",4.48],["Short Circuit","short_circuit",4.59],["Old School","old_school",4.82],["Weasley","weasley",5.61]]],["Lol Pop","lol_pop",4.06,"🍭",[["Delusion","delusion",4.06],["Mint Lemon","mint_lemon",4.06],["Plum Candy","plum_candy",4.06],["Bubblegum","bubblegum",4.07],["Citrone","citrone",4.08],["Lavender Ice","lavender_ice",4.08],["Sweet Yogurt","sweet_yogurt",4.14],["Refresh","refresh",4.18],["Icicle","icicle",4.28],["Lagoon","lagoon",4.31],["Icy Touch","icy_touch",4.59],["Einstein","einstein",4.99],["Cobweb","cobweb",6.12]]],["Lunar Snake","lunar_snake",4.05,"🐍",[["Blue Horizon","blue_horizon",4.01],["Fallen Star","fallen_star",4.04],["Fromage","fromage",4.05],["Water Snake","water_snake",4.05],["Amber Adder","amber_adder",4.06],["Glowbra","glowbra",4.06],["Black Mamba","black_mamba",4.07],["Rainbow Scale","rainbow_scale",4.07],["Pearl Scales","pearl_scales",4.08],["Red Amethyst","red_amethyst",4.11],["Hisstagram","hisstagram",4.18],["Tropicool","tropicool",4.28],["Cryoshard","cryoshard",6.12]]],["Whip Cupcake","whip_cupcake",4.05,"🧁",[["Toncoin","toncoin",4.05],["Starfish","starfish",4.07],["High Five","high_five",4.08],["Honey Bee","honey_bee",4.08],["Six Senses","six_senses",4.09],["Gummy Bears","gummy_bears",4.1],["Fantastic Four","fantastic_four",4.11],["Cloud Nine","cloud_nine",4.14],["Blueberry Hill","blueberry_hill",4.19],["Demoman","demoman",4.26],["Unicorn","unicorn",4.27],["Dracula","dracula",4.79],["Cream Scream","cream_scream",6.6]]],["Vice Cream","vice_cream",4.05,"🎁",[["Queen's Gambit","queen’s_gambit",3.0],["Chilly Bones","chilly_bones",4.05],["Pumpkin Spice","pumpkin_spice",4.06],["Sushi","sushi",4.06],["Disco Funk","disco_funk",4.07],["Dreamland","dreamland",4.07],["Taiyaki","taiyaki",4.07],["Iceman","iceman",4.08],["Ube Cream","ube_cream",4.08],["Porcelain","porcelain",4.11],["Bamboo Ice","bamboo_ice",4.17],["Vintage Bunny","vintage_bunny",4.23],["Love Glazed","love_glazed",4.74]]],["Pool Float","pool_float",4.05,"🎁",[["Lucky Dragon","lucky_dragon",4.06],["Motorboat","motorboat",4.06],["Quacky","quacky",4.06],["Toucan","toucan",4.06],["Mojito","mojito",4.07],["Pelican Decoy","pelican_decoy",4.07],["Crypto Whale","crypto_whale",4.08],["Sebastian","sebastian",4.08],["Alpaca","alpaca",4.15],["Cash Flow","cash_flow",4.25],["Peach Shake","peach_shake",4.28],["Anubis","anubis",4.54],["Nessie","nessie",6.19]]],["Ice Cream","ice_cream",4.04,"🍦",[["Bite-Size","bite-size",4.08],["Choco Almond","choco_almond",4.08],["Kiwi Sorbet","kiwi_sorbet",4.08],["Cold Steel","cold_steel",4.09],["Plastic Pop","plastic_pop",4.09],["TNT Stick","tnt_stick",4.1],["Cucumber","cucumber",4.11],["Trio Scoop","trio_scoop",4.14],["Starlit","starlit",4.19],["Ice Craft","ice_craft",4.33],["Apple Dip","apple_dip",4.44],["Cupid Aim","cupid_aim",5.05],["Poopsicle","poopsicle",7.24]]],["Xmas Stocking","xmas_stocking",4.03,"🧦",[["Bada-Boom!","bada-boom!",4.09],["Frozen Moss","frozen_moss",4.13],["Pink Faerie","pink_faerie",4.13],["Poison Ivy","poison_ivy",4.13],["Caramel Fest","caramel_fest",4.14],["Photo Negative","photo_negative",4.14],["Arctic","arctic",4.18],["Orange Dusk","orange_dusk",4.18],["Vintage","vintage",4.2],["Radioactive","radioactive",4.28],["Monster","monster",4.33],["Banana Love","banana_love",4.39],["Halloween","halloween",5.34]]],["Instant Ramen","instant_ramen",4.0,"🍜",[["Shrimp","shrimp",3.95],["Bacon","bacon",4.04],["Chicken","chicken",4.04],["Squid Wok","squid_wok",4.04],["Broth Pack","broth_pack",4.05],["Ramen Snack","ramen_snack",4.05],["Spicy Beef","spicy_beef",4.05],["Cable Mess","cable_mess",4.07],["Dragon Soup","dragon_soup",4.08],["Sewing Stew","sewing_stew",4.08],["Black Pasta","black_pasta",4.18],["Pika-Pika!","pika-pika!",4.47],["Gold Chain","gold_chain",5.05]]],["Chill Flame","chill_flame",3.88,"🎁",[["Paper Lantern","paper_lantern",4.04],["Carousel","carousel",4.05],["Ionic Column","ionic_column",4.05],["Los Angeles","los_angeles",4.05],["Druid Flame","druid_flame",4.06],["Eternal Flame","eternal_flame",4.06],["Iron Rose","iron_rose",4.06],["Bubble Prism","bubble_prism",4.08],["Olympia","olympia",4.08],["Triumph","triumph",4.13],["Victory","victory",4.17],["Ghost Light","ghost_light",4.47],["Pixel Art","pixel_art",4.97]]],["Snake Box","snake_box",3.61,"📦",[["Double Joy","double_joy",4.05],["Fuchsia","fuchsia",4.05],["Lemonade","lemonade",4.06],["Purple","purple",4.06],["Raspberry","raspberry",4.06],["Red Ribbon","red_ribbon",4.06],["Emerald","emerald",4.07],["Choco Surprise","choco_surprise",4.08],["Red Dash","red_dash",4.11],["Honey Bee","honey_bee",4.24],["Heart Box","heart_box",4.72],["Birthday","birthday",5.05],["Prison Cell","prison_cell",6.38]]]];

const ASSET = 'https://cdn.jsdelivr.net/gh/ssamy2/TelegramGiftsAssests@main/';
const RAWB = 'https://raw.githubusercontent.com/ssamy2/TelegramGiftsAssests/main/';
const mkGift = (r, i) => { const [n, sh, p, e, mods] = r; return { i, n, sh, p: +p, e: e || '🎁', mods: mods || [], slug: n.toLowerCase().replace(/[^a-z0-9]/g, ''), pas: n.replace(/['’]/g, '').split(/[^A-Za-z0-9]+/).filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join('') } };
const GIFTS = GIFT_SNAP.map(mkGift);
let PRICE_TS = 1793847236 * 1000, PRICE_LIVE = false;
const GBN = {}; GIFTS.forEach(g => GBN[g.n] = g);
const GBS = {}; GIFTS.forEach(g => GBS[g.sh] = g);
const byName = n => (n && (GBN[n] || GBN[String(n).replace(/'/g, '’')])) || BYPRICE[0];
const tierOf = p => p >= 300 ? 4 : p >= 40 ? 3 : p >= 10 ? 2 : p >= 4 ? 1 : 0;
const TIER_N = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
const TIER_C = ['#22d3ee', '#4ade80', '#60a5fa', '#a78bfa', '#fbbf24'];
let BYPRICE = [...GIFTS].sort((a, b) => a.p - b.p);

// Barcha NFT variantlari (kolleksiya floor + har bir model narxi) — yutuqni aniq hisoblash uchun
let NFTS = [];
function buildNFTS() { NFTS = []; GIFTS.forEach(g => { NFTS.push({ g, m: null, ms: null, p: g.p }); g.mods.forEach(([m, ms, mp]) => { if (mp >= g.p * .6) NFTS.push({ g, m, ms, p: mp }) }) }); NFTS.sort((a, b) => a.p - b.p) }
buildNFTS();
// rasm: jsDelivr -> GitHub raw -> fragment -> chizilgan sovg'a belgisi (emoji emas)
const thumbURL = g => `${ASSET}webp/by_name/${g.sh}.webp`;
const thumbRAW = g => `${RAWB}webp/by_name/${g.sh}.webp`;
const fragURL = g => `https://fragment.com/file/gifts/${g.slug}/thumb.webp`;
const modelURL = (g, ms) => `${ASSET}models/${g.sh}/${ms}.webp`;
const modelRAW = (g, ms) => `${RAWB}models/${g.sh}/${ms}.webp`;
const nftURL = (g, n) => `https://nft.fragment.com/gift/${g.slug}-${n}.webp`;
const GBOXSVG = '<svg viewBox="0 0 48 48" class="gfbs"><rect x="7" y="19" width="34" height="23" rx="4" fill="currentColor" opacity=".28"/><rect x="5" y="13" width="38" height="9" rx="3" fill="currentColor" opacity=".55"/><rect x="21" y="13" width="6" height="29" fill="currentColor"/><path d="M24 13c-3-7-11-8-11-3s8 3 11 3zm0 0c3-7 11-8 11-3s-8 3-11 3z" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>';
function gfb(img) { // keyingi manbaga o'tadi; hammasi tugasa — sovg'a qutisi belgisi
  const urls = (img.dataset.u || '').split('|').filter(Boolean), step = +(img.dataset.s || 0);
  if (step < urls.length) { img.dataset.s = step + 1; img.src = urls[step]; return }
  const w = img.parentElement; const s = document.createElement('span'); s.className = 'gfb'; s.title = img.alt || ''; s.innerHTML = GBOXSVG; img.replaceWith(s); if (w) w.classList.remove('ld');
  if (window.RIKI_IMGFAIL) window.RIKI_IMGFAIL(img.alt);
}
function gld(img) { const w = img.parentElement; if (w) w.classList.remove('ld') }
window.gfb = gfb; window.gld = gld;
const GI = (g, cls = '') => `<span class="gi-wrap ld ${cls}"><img class="gim" src="${thumbURL(g)}" data-u="${thumbRAW(g)}|${fragURL(g)}" loading="lazy" alt="${esc(g.n)}" onload="gld(this)" onerror="gfb(this)"></span>`;
const GIM = (g, ms, cls = '') => ms ? `<span class="gi-wrap ld ${cls}"><img class="gim" src="${modelURL(g, ms)}" data-u="${modelRAW(g, ms)}|${thumbURL(g)}|${thumbRAW(g)}" loading="lazy" alt="${esc(g.n)}" onload="gld(this)" onerror="gfb(this)"></span>` : GI(g, cls);
const GII = (it, cls = '') => GIM(GIFTS[it.g], it.ms, cls);
const itName = it => GIFTS[it.g].n + (it.m ? ' · ' + it.m : '');
const GIN = (g, n, cls = 'nftimg') => `<img class="${cls}" src="${nftURL(g, n)}" data-u="${thumbURL(g)}|${thumbRAW(g)}" loading="lazy" alt="${esc(g.n)}" onerror="gfb(this)">`;

async function loadLivePrices() {
  const urls = [RAWB + 'Gifts_Details.json?t=' + Math.floor(Date.now() / 6e5), ASSET + 'Gifts_Details.json'];
  for (const u of urls) {
    try {
      const r = await fetch(u, { cache: 'no-store' }); if (!r.ok) continue; const d = await r.json();
      (d.upgraded || []).forEach(x => {
        const fp = +x.floor_price_ton || 0; if (fp <= 0) return;
        const g = GBS[x.short_name];
        if (g) { const k = fp / g.p; g.p = Math.round(fp * 100) / 100; g.mods.forEach(mm => mm[2] = Math.round(mm[2] * Math.min(3, Math.max(.33, k)) * 100) / 100) }
        else { const ng = mkGift([x.full_name.replace(/’/g, "'"), x.short_name, fp, '🎁', []], GIFTS.length); GIFTS.push(ng); GBN[ng.n] = ng; GBS[ng.sh] = ng }
      });
      PRICE_TS = (d.last_updated || Date.now() / 1000) * 1000; PRICE_LIVE = true;
      BYPRICE = [...GIFTS].sort((a, b) => a.p - b.p); buildNFTS(); CASES.forEach(c => CS.drops[c.id] = caseDrops(c));
      if (ENTER[cur]) ENTER[cur]();
      return true;
    } catch (e) {}
  }
  return false;
}
// model narxini jonli tekshirish (yutilgan NFT uchun)
async function liveModelPrice(g, m) { try { const r = await fetch(RAWB + `models/${g.sh}/prices.json?t=` + Math.floor(Date.now() / 6e5)); const d = await r.json(); const v = d.models && (d.models[m] ?? d.models[m.replace(/'/g, '’')]); return v > 0 ? +v : null } catch (e) { return null } }
const priceDate = () => new Date(PRICE_TS).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

// =====================================================================
//  HOLAT (localStorage + Telegram CloudStorage)
// =====================================================================
let S;
function defState() { return { bal: CFG.START_BALANCE, inv: [], hist: [], wag: 0, won: 0, games: 0, pvpScore: 0, lastDaily: 0, lastFreeCase: 0, tasks: {}, ref: 0, refB: 0, created: Date.now() } }
function load() {
  try { S = JSON.parse(localStorage.getItem(CFG.STORAGE_KEY)) } catch (e) { S = null }
  const first = !S;
  if (!S) S = defState();
  S = Object.assign(defState(), S);
  return first;
}
let saveT = 0;
function save() {
  clearTimeout(saveT);
  saveT = setTimeout(() => {
    const j = JSON.stringify(S);
    try { localStorage.setItem(CFG.STORAGE_KEY, j) } catch (e) {}
    try { if (tg && tg.CloudStorage && j.length < 4000) tg.CloudStorage.setItem(CFG.STORAGE_KEY, j) } catch (e) {}
  }, 250);
}
function setBal(d) { S.bal = Math.max(0, Math.round((S.bal + d) * 100) / 100); renderBal(); save() }
function renderBal() { const t = fmt(S.bal), i = t.lastIndexOf('.'); $$('.balv').forEach(e => { if (e.closest('.bal') && i > 0) e.innerHTML = t.slice(0, i) + '<small class="dec">' + t.slice(i) + '</small>'; else e.textContent = t }) }   // sarlavhada kasr qismi kichikroq
function addItem(g, v, n, m, ms) { const it = { id: uid(), g: g.i, sh: g.sh, v: Math.round((v || g.p) * 100) / 100, n: n || (1 + ri(900)), m: m || null, ms: ms || null }; S.inv.unshift(it); save(); return it }
const invGet = id => S.inv.find(x => x.id === id);
function invDel(ids) { S.inv = S.inv.filter(x => !ids.includes(x.id)); save() }
function logGame(game, bet, win, note) {
  S.hist.unshift({ game, bet: +bet, win: +win, note: note || '', t: Date.now() });
  if (S.hist.length > 80) S.hist.length = 80;
  S.games++; S.wag += +bet; if (win > bet) S.won += win - bet;
  save(); renderTasks();
}

// =====================================================================
//  UI asoslari
// =====================================================================
function toast(html, ms) { const t = $('#toast'); t.innerHTML = html; t.classList.add('on'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('on'), ms || 1900) }
function openM(id) { $('#' + id).classList.add('on') }
function closeM(id) { $('#' + id).classList.remove('on') }
document.addEventListener('click', e => {
  const c = e.target.closest('[data-close]'); if (c) { c.closest('.modal').classList.remove('on'); return }
  if (e.target.classList.contains('modal')) e.target.classList.remove('on');
});
function info(title, html) { $('#infoT').textContent = title; $('#infoB').innerHTML = html; openM('infoM') }
function showRes(win, g, title, sub) {
  const o = $('#resOv');
  o.className = 'res-ov on' + (win ? '' : ' lose');
  o.innerHTML = `<div class="big tiers${g ? tierOf(g.p) : 3}">${g ? GI(g).replace('loading="lazy"', '') : '<span class="gfb" style="font-size:67px">💥</span>'}</div><b>${title}</b><span>${sub || ''}</span><button>OK</button>`;
  o.querySelector('button').onclick = () => o.classList.remove('on');
  hapN(win ? 'success' : 'error');
}

const PAL = ['#f97316', '#ec4899', '#a855f7', '#3b82f6', '#22c55e', '#eab308', '#06b6d4', '#ef4444', '#8b5cf6', '#14b8a6'];
const AVG = ['linear-gradient(160deg,#6cd0ff,#2f86f6)', 'linear-gradient(160deg,#f9a8d4,#db2777)', 'linear-gradient(160deg,#fde68a,#d97706)', 'linear-gradient(160deg,#86efac,#16a34a)', 'linear-gradient(160deg,#c4b5fd,#7c3aed)', 'linear-gradient(160deg,#fca5a5,#dc2626)', 'linear-gradient(160deg,#67e8f9,#0891b2)'];
const BOTN = ['degenov', 'ivoryelena', 'RO2k3', 'Golden Ape', 'xavier', 'mfdgsgsa', 'axmedov', 'nikipopus', 'thenune', 'sedist', 'rtpking', 'Sunny Viking', 'marivana', 'Germanyadagi', 'movsar_012', 'lucky_tom', 'pepe_hodler', 'tonwhale', 'asal_07', 'jasur.uz', 'kotik', 'crash_god', 'sardor', 'm1rzo', 'ilyos', 'diyor', 'neo', 'zarina', 'boss_tg', 'ton_kid'];
const avHTML = (name, cls = '') => {
  if (typeof BOTAV !== 'undefined' && BOTAV[name]) return `<span class="av bot ${cls}">${BOTAV[name]}<i class="bb">BOT</i></span>`;
  if (name === ME && TGU.photo_url) return `<span class="av ${cls}" style="background:#393939 url('${TGU.photo_url}') center/cover"></span>`;
  const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0); return `<span class="av ${cls}" style="background:${AVG[h % AVG.length]}">${esc(name[0] || '?')}</span>` };
const bot = () => ({ name: pick(BOTN), bot: true });
// Bot tikishi: ko'pincha kichik, ba'zan katta — eng ko'pi 1000
function botAmt(cap) { const r = Math.random(); const v = r < .55 ? rnd(.1, 3) : r < .85 ? rnd(3, 60) : r < .97 ? rnd(60, 300) : rnd(300, 1000); return Math.round(Math.min(cap || 1000, v) * 100) / 100 }
const BOTAV = { PvP: '🤖', Ice: '🧊', Fire: '🔥' };

function fillStatic() {
  $$('.gm').forEach(e => e.innerHTML = GEM);
  $$('[data-icon]').forEach(e => { if (!e.dataset.f) { e.innerHTML = ICO[e.dataset.icon] || ''; e.dataset.f = 1 } });
  $$('[data-g]').forEach(e => { if (!e.dataset.f) { e.innerHTML = GI(byName(e.dataset.g)); e.dataset.f = 1 } });
  $$('[data-hero]').forEach(e => e.innerHTML = HERO[e.dataset.hero] || '');
  $$('.myav').forEach(e => { if (TGU.photo_url) { e.textContent = ''; e.style.background = `#333 url('${TGU.photo_url}') center/cover` } else e.textContent = (ME[0] || 'R').toUpperCase() });
}

// ---------- chizilgan qahramon rasmlar (o'zimizniki) ----------
const HERO = {
  rocket: `<svg class="hero" viewBox="0 0 150 170"><defs><linearGradient id="hrB" x1="0" x2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#c7d2fe"/></linearGradient><linearGradient id="hrF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fde68a"/><stop offset="1" stop-color="#f97316" stop-opacity="0"/></linearGradient></defs><g transform="rotate(35 75 85)"><path class="hfl" d="M62 128 Q75 175 88 128Z" fill="url(#hrF)"/><path d="M75 12 C100 35 104 80 96 122 H54 C46 80 50 35 75 12Z" fill="url(#hrB)"/><path d="M75 12 C88 24 95 40 97 55 H53 C55 40 62 24 75 12Z" fill="#ef4444"/><circle cx="75" cy="76" r="13" fill="#1e3a8a" stroke="#93c5fd" stroke-width="4"/><circle cx="71" cy="72" r="4" fill="#fff" opacity=".7"/><path d="M54 98 L32 126 L56 120Z M96 98 L118 126 L94 120Z" fill="#ef4444"/><rect x="60" y="118" width="30" height="10" rx="3" fill="#64748b"/></g></svg>`,
  ship: `<svg viewBox="0 0 230 150"><defs><linearGradient id="rsB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#cbd5e1"/></linearGradient><linearGradient id="rsF" x1="1" x2="0"><stop offset="0" stop-color="#fef08a"/><stop offset=".5" stop-color="#f97316"/><stop offset="1" stop-color="#ef4444" stop-opacity="0"/></linearGradient></defs><path class="flame" d="M58 62 Q0 75 58 88Z" fill="url(#rsF)"/><path d="M60 50 H150 C185 52 205 66 212 75 C205 84 185 98 150 100 H60 Z" fill="url(#rsB)"/><path d="M168 54 C192 60 205 68 212 75 C205 82 192 90 168 96Z" fill="#ef4444"/><circle cx="135" cy="75" r="12" fill="#1e3a8a" stroke="#93c5fd" stroke-width="4"/><circle cx="105" cy="75" r="9" fill="#1e3a8a" stroke="#93c5fd" stroke-width="3"/><path d="M70 50 L52 22 L96 50Z M70 100 L52 128 L96 100Z" fill="#ef4444"/><rect x="54" y="58" width="10" height="34" rx="3" fill="#64748b"/></svg>`,
  pyramid: (() => { let s = '<svg class="hero" viewBox="0 0 130 130">'; for (let r = 0; r < 5; r++) for (let c = 0; c <= r + 1; c++) s += `<circle cx="${65 - (r + 1) * 11 + c * 22}" cy="${18 + r * 20}" r="5.5" fill="#efe4ff"/>`; for (let c = 0; c < 6; c++) s += `<rect x="${4 + c * 21}" y="112" width="18" height="12" rx="4" fill="${['#f472b6', '#a78bfa', '#818cf8', '#818cf8', '#a78bfa', '#f472b6'][c]}"/>`; return s + '<circle cx="65" cy="62" r="7" fill="#fbbf24"/></svg>' })(),
  dice: `<svg class="hero" viewBox="0 0 140 140"><defs><linearGradient id="dcT" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4b5563"/><stop offset="1" stop-color="#111827"/></linearGradient></defs><path d="M70 12 L124 40 L124 100 L70 128 L16 100 L16 40Z" fill="url(#dcT)" stroke="#6b7280" stroke-width="2"/><path d="M70 12 L124 40 L70 68 L16 40Z" fill="#374151"/><path d="M70 68 V128" stroke="#000" stroke-opacity=".4"/><circle cx="70" cy="40" r="7" fill="#fbbf24"/><circle cx="40" cy="74" r="6" fill="#fff"/><circle cx="52" cy="98" r="6" fill="#fff"/><circle cx="92" cy="74" r="6" fill="#fff"/><circle cx="104" cy="90" r="6" fill="#fff"/><circle cx="88" cy="104" r="6" fill="#fff"/></svg>`,
  ring: `<svg class="hero" viewBox="0 0 84 84"><circle cx="42" cy="42" r="32" fill="none" stroke="#ffffff40" stroke-width="10"/><circle cx="42" cy="42" r="32" fill="none" stroke="#fff" stroke-width="10" stroke-dasharray="48 200" transform="rotate(-90 42 42)" stroke-linecap="round"/><text x="42" y="48" text-anchor="middle" font-size="16" font-weight="900" fill="#fff">24%</text></svg>`,
  ring2: `<svg viewBox="0 0 156 156" style="width:100%;height:100%"><circle cx="78" cy="78" r="64" fill="none" stroke="#ffffff38" stroke-width="18"/><circle cx="78" cy="78" r="64" fill="none" stroke="#fff" stroke-width="18" stroke-dasharray="96 400" transform="rotate(-90 78 78)" stroke-linecap="round"/><circle cx="78" cy="78" r="46" fill="#3fc93a"/></svg>`
};

// =====================================================================
//  NAVIGATSIYA
// =====================================================================
const MAIN_HDR = ['home', 'playhub', 'backpack', 'invite', 'leader', 'earn', 'market', 'cases', 'crafts', 'upgrade', 'pvphub'];
const NAV_TABS = ['backpack', 'invite', 'home', 'leader', 'earn'];
const ENTER = {};
let cur = 'home', stack = [];
function go(id, noPush) {
  if (!$('#' + id)) return;
  if (!noPush && id !== cur) stack.push(cur);
  if (NAV_TABS.includes(id)) stack = id === 'home' ? [] : ['home'];
  cur = id;
  $$('.screen').forEach(s => s.classList.toggle('on', s.id === id));
  $$('nav button').forEach(b => b.classList.toggle('on', b.dataset.go === id));
  const main = MAIN_HDR.includes(id);
  $('#hMain').style.display = main ? 'flex' : 'none';
  $('#hPill').style.display = main ? 'none' : 'flex';
  $('#hTop').style.display = ['pvp', 'tvt'].includes(id) ? 'grid' : 'none';
  $('#hHelp').style.display = ['pvp'].includes(id) ? 'none' : 'grid';
  window.scrollTo(0, 0);
  if (tg && tg.BackButton) { try { id === 'home' ? tg.BackButton.hide() : tg.BackButton.show() } catch (e) {} }
  ENTER[id] && ENTER[id]();
  hap();
}
function back() { const p = stack.pop(); go(p || 'home', true) }
if (tg && tg.BackButton) tg.BackButton.onClick(back);
document.addEventListener('click', e => {
  const b = e.target.closest('[data-go]'); if (b && !e.target.closest('.modal')) { go(b.dataset.go) }
  if (e.target.closest('[data-dep]')) openDeposit();
});

// =====================================================================
//  TIKISH TANLASH (TON yoki sovg'a)
// =====================================================================
const BS = {};
function bindBet(key, inputId, onChange) {
  BS[key] = { mode: 'coin', gifts: [], inp: $('#' + inputId), on: onChange || (() => {}) };
  const tog = $(`[data-tog="${key}"]`);
  if (tog) tog.querySelectorAll('button').forEach(b => b.onclick = () => setBetMode(key, b.dataset.m));
  const inp = BS[key].inp;
  inp.addEventListener('click', () => { if (BS[key].mode === 'gift') pickGifts({ multi: true, title: 'Gifts to bet', sel: BS[key].gifts, done: ids => { BS[key].gifts = ids; syncBet(key) } }) });
  inp.addEventListener('input', () => BS[key].on());
}
function setBetMode(key, m) {
  const b = BS[key]; b.mode = m;
  $(`[data-tog="${key}"]`).querySelectorAll('button').forEach(x => x.classList.toggle('on', x.dataset.m === m));
  b.inp.readOnly = m === 'gift';
  b.inp.value = ''; b.gifts = [];
  b.inp.placeholder = m === 'gift' ? 'Select gifts ›' : 'TON amount';
  if (m === 'gift') pickGifts({ multi: true, title: 'Gifts to bet', sel: [], done: ids => { b.gifts = ids; syncBet(key) } });
  b.on();
}
function syncBet(key) { const b = BS[key]; const v = b.gifts.reduce((s, id) => s + (invGet(id)?.v || 0), 0); b.inp.value = v ? fmt(v) : ''; b.on() }
function betVal(key) { const b = BS[key]; if (b.mode === 'gift') return b.gifts.reduce((s, id) => s + (invGet(id)?.v || 0), 0); return Math.round((parseFloat(b.inp.value) || 0) * 100) / 100 }
// pulni/sovg'ani yechib oladi, muvaffaqiyatli bo'lsa summani qaytaradi
function takeBet(key, minBet = 0.05) {
  const b = BS[key], v = betVal(key);
  if (b.mode === 'gift') {
    if (!b.gifts.length) { toast("Select a gift"); return 0 }
    invDel(b.gifts); b.gifts = []; b.inp.value = ''; b.on(); return v;
  }
  if (v < minBet) { toast(`Minimum bet ${GEM}${fmt(minBet)}`); return 0 }
  if (v > S.bal) { toast('Insufficient balance'); openDeposit(); return 0 }
  setBal(-v); return v;
}

// ---------- sovg'a tanlash oynasi ----------
function pickGifts(o) {
  // o: {multi, title, sel, done, source:'inv'|'cat', filter}
  const src = o.source || 'inv';
  let sel = [...(o.sel || [])];
  $('#gpT').textContent = o.title || "Select a gift";
  $('#gpQ').value = '';
  $('#gpBar').style.display = o.multi ? 'flex' : 'none';
  const draw = () => {
    const q = $('#gpQ').value.trim().toLowerCase();
    let html = '';
    if (src === 'inv') {
      let list = S.inv.filter(it => !o.filter || o.filter(it)).filter(it => !q || itName(it).toLowerCase().includes(q));
      if (!list.length) html = `<div class="empty">Your backpack is empty. <a data-go2="home">Open boxes</a> or buy on <a data-go2="market">P2P</a>.</div>`;
      html += list.map(it => itemCard(it, `data-id="${it.id}"`, sel.includes(it.id) ? 'sel' : '')).join('');
    } else {
      let list = GIFTS.filter(g => !o.filter || o.filter(g)).filter(g => !q || g.n.toLowerCase().includes(q)).sort((a, b) => a.p - b.p);
      if (!list.length) html = `<div class="empty">No matching gifts</div>`;
      html += list.map(g => giftCard(g, g.p, `data-gi="${g.i}"`)).join('');
    }
    $('#gpGrid').innerHTML = html;
    const sum = sel.reduce((s, id) => s + (invGet(id)?.v || 0), 0);
    $('#gpSum').innerHTML = `${sel.length} selected · ${g$(sum)}`;
  };
  $('#gpQ').oninput = draw;
  $('#gpGrid').onclick = e => {
    const a = e.target.closest('[data-go2]'); if (a) { closeM('gpM'); go(a.dataset.go2); return }
    const c = e.target.closest('.gift'); if (!c) return; hap();
    if (src === 'cat') { closeM('gpM'); o.done(+c.dataset.gi); return }
    const id = c.dataset.id;
    if (!o.multi) { closeM('gpM'); o.done(id); return }
    if (sel.includes(id)) sel = sel.filter(x => x !== id); else { if (o.max && sel.length >= o.max) { toast(`Maximum ${o.max}`); return } sel.push(id) }
    draw();
  };
  $('#gpOk').onclick = () => { closeM('gpM'); o.done(sel) };
  draw(); openM('gpM');
}
function itemCard(it, attrs = '', extra = '') { const g = GIFTS[it.g]; return `<div class="gift tiers${tierOf(it.v)} ${extra}" ${attrs}>${GII(it)}<small>${esc(it.m || g.n)}</small><b>${g$(it.v)}</b></div>` }
function giftCard(g, v, attrs = '', extra = '', num) {
  return `<div class="gift tiers${tierOf(g.p)} ${extra}" ${attrs}>${GI(g)}<small>${esc(g.n)}${num ? ' #' + num : ''}</small><b>${g$(v)}</b></div>`;
}

// =====================================================================
//  HOME: jonli lenta
// =====================================================================
function feedTick() {
  const f = $('#feed'); if (!f) return;
  const g = Math.random() < .12 ? pick(GIFTS.slice(0, 20)) : pick(GIFTS);
  const d = document.createElement('div');
  d.className = 'fi tiers' + tierOf(g.p); d.innerHTML = GI(g); d.title = g.n;
  d.onclick = () => toast(`Won: <b>${esc(g.n)}</b> ${g$(g.p)}`);
  f.prepend(d); while (f.children.length > 12) f.lastChild.remove();
}

// =====================================================================
//  1) ROCKET (Crash)
// =====================================================================
const RK = { phase: 'wait', t0: 0, waitEnd: 0, crash: 1, m: 1, bets: [], my: null, next: null, hist: [], round: 10231 };
function rkCrashPoint() { const r = Math.random(); if (r < 0.03) return 1; return Math.min(1000, Math.max(1, Math.floor(0.97 / (1 - r) * 100) / 100)) }
function rkNew() {
  RK.phase = 'wait'; RK.waitEnd = performance.now() + 7000; RK.m = 1; RK.round++;
  RK.crash = rkCrashPoint(); RK.bets = []; RK.my = null;
  if (RK.next) { RK.my = RK.next; RK.next = null; RK.bets.push(RK.my) }
  const stg = $('#rkStage'); stg.classList.remove('fly', 'boom');
  const sh = $('#rkShip'); sh.classList.remove('rev'); void sh.offsetWidth; sh.classList.add('rev');
  rkRender(true);
}
function rkAddBot() {
  const b = bot(); if (RK.bets.some(x => x.name === b.name)) return;
  RK.bets.push({ name: b.name, amt: Math.round(rnd(0.1, Math.random() < .2 ? 40 : 4) * 100) / 100, auto: Math.random() < .85 ? Math.round(rnd(1.05, Math.random() < .2 ? 12 : 3.2) * 100) / 100 : 0, out: 0 });
}
function rkTick(now) {
  if (window.LIVE_HOOK && window.LIVE_HOOK.on()) { window.LIVE_HOOK.rk(now); if (cur === 'rocket') rkRender(); return }
  if (RK.phase === 'wait') {
    if (now >= RK.waitEnd) { RK.phase = 'fly'; RK.t0 = now; $('#rkStage').classList.add('fly') }
  } else if (RK.phase === 'fly') {
    const t = (now - RK.t0) / 1000;
    RK.m = Math.floor(Math.exp(0.085 * t) * 100) / 100;
    RK.bets.forEach(b => {
      if (!b.out && b.auto && RK.m >= b.auto && b.auto <= RK.crash) rkCash(b, b.auto);
      else if (!b.out && !b.me && !b.auto && Math.random() < .004) rkCash(b, RK.m);
    });
    if (RK.m >= RK.crash) {
      RK.m = RK.crash; RK.phase = 'crash'; RK.crashAt = now;
      $('#rkStage').classList.remove('fly'); $('#rkStage').classList.add('boom');
      RK.hist.unshift(RK.crash); if (RK.hist.length > 14) RK.hist.pop();
      if (RK.my && !RK.my.out) { logGame('Rocket', RK.my.amt, 0, '💥 ' + RK.crash.toFixed(2) + 'x'); if (cur === 'rocket') { hapN('error'); toast('💥 Crashed at ' + RK.crash.toFixed(2) + 'x') } }
      rkFrags();
    }
  } else if (RK.phase === 'crash') {
    if (now - RK.crashAt > 3000) rkNew();
  }
  if (cur === 'rocket') rkRender();
}
// yutuq summasiga mos eng qimmat haqiqiy NFT (kolleksiya floor yoki model narxi <= summa)
function giftFor(v) { let best = null; for (const x of NFTS) { if (x.p <= v) best = x; else break } return best }
function rkCash(b, m) {
  b.out = m;
  const w = Math.round(b.amt * m * 100) / 100;
  const nf = null; b.gift = GBS.plush_pepe || null; b.nf = null;
  if (!b.me) return;
  // Rocket yutug'i: TON emas — yutuq qiymatidagi yashil Plush Pepe backpack'ga (onlayn: server beradi)
  const pepe = GBS.plush_pepe || byName('Plush Pepe'); b.gift = pepe; b.nf = { g: pepe, p: w };
  const RW = window.RIKI_W;
  if (RW && RW.on()) { setTimeout(() => RW.pull(true), 400) } else addItem(pepe, w);
  logGame('Rocket', b.amt, w, `${m.toFixed(2)}x → Plush Pepe (${fmt(w)})`); hapN('success');
  toast(`🐸 Plush Pepe (${fmt(w)}) → Backpack`);
  if (cur === 'rocket') showRes(true, pepe, 'Plush Pepe → Backpack 🐸', `${fmt(b.amt)} TON × ${m.toFixed(2)} = <b>${g$(w)}</b>`);
}
function showResNFT(it, sub) {
  const g = GIFTS[it.g], o = $('#resOv');
  o.className = 'res-ov on';
  o.innerHTML = `<div class="big tiers${tierOf(it.v)}">${GII(it).replace(/loading="lazy"/g, '')}</div><b>${esc(g.n)}</b>${it.m ? `<span style="color:#cfcfd6;font-size:12px">Model: ${esc(it.m)}</span>` : ''}<span style="font-size:12px;line-height:1.5;display:block;color:#e5e5ea">${sub}</span><span style="font-size:10px;color:#8b8b94">Price: ${PRICE_LIVE ? 'live floor' : 'snapshot'} · ${priceDate()}</span><button>In Backpack ✓</button>`;
  o.querySelector('button').onclick = () => o.classList.remove('on');
}
let rkLastList = 0;
function rkRender(force) {
  const now = performance.now();
  $('#rkMul').textContent = RK.phase === 'wait' ? '' : RK.m.toFixed(2) + 'x';
  const md = $('#rkModel');
  if (RK.my && RK.phase === 'fly' && !RK.my.out) { const gg = giftFor(RK.my.amt * RK.m); if (gg) { const key = gg.g.i + ':' + gg.m; if (md.dataset.g != key) { md.dataset.g = key; md.innerHTML = `${GIM(gg.g, gg.ms)}<span>${esc(gg.m || gg.g.n)}</span><em>${g$(gg.p)}</em>`; md.style.setProperty('--glow', TIER_C[tierOf(gg.p)]); md.classList.remove('rev'); void md.offsetWidth; md.classList.add('rev', 'gw') } } else if (md.dataset.g !== 'x') { md.dataset.g = 'x'; md.classList.remove('gw'); md.innerHTML = `NFT: <em>${g$(NFTS[0].p)}+</em>` } }
  else if (md.dataset.g !== 'r' + RK.round) { md.dataset.g = 'r' + RK.round; md.classList.remove('gw'); md.innerHTML = `Round <em>#${RK.round}</em>` }
  const btn = $('#rkBtn');
  if (RK.phase === 'wait') {
    const s = Math.max(0, (RK.waitEnd - now) / 1000);
    $('#rkSub').textContent = 'Starting in ' + s.toFixed(1) + 's';
    $('#rkBar').style.width = (100 - s / 7 * 100) + '%';
    if (RK.my) { btn.className = 'bigbtn wait'; btn.innerHTML = `Cancel bet · ${g$(RK.my.amt)}` }
    else { btn.className = 'bigbtn ok'; btn.textContent = 'Place bet' }
  } else if (RK.phase === 'fly') {
    $('#rkSub').textContent = RK.my && !RK.my.out ? '' : 'Flying…'; $('#rkBar').style.width = Math.min(100, Math.log(RK.m) / Math.log(20) * 100) + '%';
    if (RK.my && !RK.my.out) { btn.className = 'bigbtn out'; btn.innerHTML = `Cash out ${g$(RK.my.amt * RK.m)}` }
    else if (RK.next) { btn.className = 'bigbtn wait'; btn.innerHTML = `Next round: ${g$(RK.next.amt)}` }
    else { btn.className = 'bigbtn ok'; btn.textContent = RK.my ? 'Cashed out ✓ · Next round' : 'Place bet (next round)' }
    if (RK.my && !RK.my.out) { const gg = giftFor(RK.my.amt * RK.m); $('#rkSub').innerHTML = gg ? `🎁 ${esc(gg.g.n)}${gg.m ? ' · ' + esc(gg.m) : ''} (${fmt(gg.p)}) + ${g$(RK.my.amt * RK.m - gg.p)}` : `Need ${g$(NFTS[0].p)} for an NFT` }
  } else {
    $('#rkSub').textContent = 'Crashed!'; $('#rkBar').style.width = '0%';
    btn.className = 'bigbtn ok'; btn.textContent = RK.next ? 'Bet placed for next round' : 'Place bet';
  }
}
function rkSmoke() { const st = $('#rkStage'); const s = document.createElement('i'); s.className = 'smk'; s.style.left = (st.clientWidth / 2 - 85) + 'px'; s.style.top = (st.clientHeight * .48 + rnd(-6, 6)) + 'px'; s.style.setProperty('--dy', rnd(-30, 30) + 'px'); st.appendChild(s); setTimeout(() => s.remove(), 800) }
function rkFrags() { if (cur !== 'rocket') return; const st = $('#rkStage'); for (let i = 0; i < 18; i++) { const f = document.createElement('i'); f.className = 'frag'; f.style.left = '50%'; f.style.top = '48%'; f.style.background = pick(['#fff', '#ef4444', '#f97316', '#fde68a', '#94a3b8']); f.style.setProperty('--dx', rnd(-160, 160) + 'px'); f.style.setProperty('--dy', rnd(-140, 140) + 'px'); st.appendChild(f); setTimeout(() => f.remove(), 900) } }
function rkStars() { const s = $('#stars'); let h = ''; for (let i = 0; i < 28; i++) h += `<i class="pt2" style="left:${ri(110)}%;top:${ri(100)}%;width:${rnd(2, 7)}px;height:${rnd(2, 7)}px;background:${pick(['#fff', '#fde68a', '#fca5a5', '#c4b5fd'])};animation-duration:${rnd(4, 12)}s;animation-delay:-${rnd(0, 10)}s"></i>`; s.innerHTML = h }
$('#rkBtn').onclick = () => {
  if (RK.phase === 'fly' && RK.my && !RK.my.out) { rkCash(RK.my, RK.m); rkRender(true); return }
  if (RK.phase === 'wait' && RK.my) { // bekor qilish
    if (RK.my.gift) { toast("Gift bets can't be cancelled"); return }
    setBal(RK.my.amt); RK.bets = RK.bets.filter(b => b !== RK.my); RK.my = null; rkRender(true); return;
  }
  if (RK.next) { if (!RK.next.gift) setBal(RK.next.amt); RK.next = null; toast('Cancelled'); return }
  openBetModal();
};
// tikish oynasi
function openBetModal() {
  BS.bt = BS.bt || { mode: 'coin', gifts: [], inp: $('#btAmt'), on: () => {} };
  const setT = t => { BS.bt.mode = t; $$('#btTabs button').forEach(b => b.classList.toggle('on', b.dataset.t === t)); $('#btCoin').style.display = t === 'coin' ? '' : 'none'; $('#btGift').style.display = t === 'gift' ? '' : 'none'; drawG() };
  const drawG = () => { $('#btGifts').innerHTML = S.inv.length ? S.inv.map(it => itemCard(it, `data-id="${it.id}"`, BS.bt.gifts.includes(it.id) ? 'sel' : '')).join('') : '<div class="empty">Your backpack is empty</div>' };
  $$('#btTabs button').forEach(b => b.onclick = () => setT(b.dataset.t));
  $('#btGifts').onclick = e => { const c = e.target.closest('.gift'); if (!c) return; const id = c.dataset.id; BS.bt.gifts = BS.bt.gifts.includes(id) ? BS.bt.gifts.filter(x => x !== id) : [...BS.bt.gifts, id]; drawG() };
  $$('#btCoin [data-q]').forEach(b => b.onclick = () => { const v = parseFloat($('#btAmt').value) || 0.1; const q = b.dataset.q; $('#btAmt').value = fmt(q === 'max' ? S.bal : Math.min(S.bal, v * +q)) });
  $('#btAutoOn').onchange = () => $('#btAutoW').style.display = $('#btAutoOn').checked ? '' : 'none';
  setT(BS.bt.mode); renderBal(); openM('betM');
}
$('#btGo').onclick = () => {
  const auto = $('#btAutoOn').checked ? Math.max(1.01, parseFloat($('#btAuto').value) || 2) : 0;
  const amt = takeBet('bt', 0.05); if (!amt) return;
  const b = { name: ME, me: true, amt, auto, out: 0, gift: BS.bt.mode === 'gift' };
  if (RK.phase === 'wait') { RK.my = b; RK.bets.push(b); toast('🚀 Bet placed') }
  else { RK.next = b; toast('Bet placed for next round') }
  closeM('betM'); rkRender(true); hap('medium');
};

// =====================================================================
//  2) PvP SOLO
// =====================================================================
const PV = { phase: 'wait', end: 0, pl: [], game: 468339, spinEnd: 0 };
function pvTotal() { return PV.pl.reduce((s, p) => s + p.amt, 0) }
function pvReset() { PV.phase = 'wait'; PV.end = 0; PV.pl = []; PV.game++; PV.winner = null; $('#pvStrip').classList.remove('spinning'); pvRender(true) }
function pvAdd(name, amt, me, isBot) {
  let p = PV.pl.find(x => x.name === name && !!x.me === !!me);
  if (p) p.amt = Math.round((p.amt + amt) * 100) / 100;
  else { p = { name, amt, me, bot: !!isBot, c: PAL[PV.pl.length % PAL.length] }; PV.pl.push(p) }
  if (PV.pl.length >= 2 && !PV.end) PV.end = Date.now() + 20000;
}
function pvTick() {
  if (window.LIVE_HOOK && window.LIVE_HOOK.on()) { window.LIVE_HOOK.pv(); if (cur === 'pvp') pvRender(); if (cur === 'pvphub') pvHub(); return }
  if (PV.phase === 'wait') {
    const pb = PV.pl.find(x => x.bot);
    const humans = PV.pl.filter(x => !x.bot).length;
    if (!pb && (humans ? Math.random() < .02 : Math.random() < .004)) pvAdd('PvP', botAmt(), false, true);
    else if (pb && pb.amt < 1000 && Math.random() < .002) { pb.amt = Math.round(Math.min(1000, pb.amt + botAmt(1000 - pb.amt)) * 100) / 100 }
    if (PV.end && Date.now() >= PV.end) pvSpin();
  } else if (PV.phase === 'spin' && Date.now() >= PV.spinEnd) {
    PV.phase = 'done'; const w = PV.winner, tot = pvTotal();
    const mine = PV.pl.find(p => p.me);
    if (mine) {
      if (w.me) { setBal(tot); logGame('PvP', mine.amt, tot, 'Win'); S.pvpScore += tot; save(); if (cur === 'pvp') showRes(true, null, 'You won! 🏆', `+${g$(tot)}`) }
      else { logGame('PvP', mine.amt, 0, 'Winner: ' + w.name); if (cur === 'pvp') toast(`Winner: <b>${esc(w.name)}</b>`) }
    }
    setTimeout(pvReset, 4500);
  }
  if (cur === 'pvp') pvRender(); if (cur === 'pvphub') pvHub();
}
function pvSpin(forced) {
  PV.phase = 'spin';
  const tot = pvTotal(); let r = Math.random() * tot, w = PV.pl[0];
  for (const p of PV.pl) { if (r < p.amt) { w = p; break } r -= p.amt }
  if (forced) w = forced;
  PV.winner = w;
  // tasma
  const cards = []; for (let i = 0; i < 60; i++) { let rr = Math.random() * tot, c = PV.pl[0]; for (const p of PV.pl) { if (rr < p.amt) { c = p; break } rr -= p.amt } cards.push(c) }
  cards[50] = w;
  const tr = $('#pvTrack');
  tr.innerHTML = cards.map((p, i) => `<div class="scard ${i === 50 ? 'wcard' : ''}" style="--c:${p.c}">${avHTML(p.name)}<b>${esc(p.name)}</b><em>${(p.amt / tot * 100).toFixed(1)}%</em></div>`).join('');
  tr.style.transition = 'none'; tr.style.transform = 'translateX(0)';
  $('#pvStrip').classList.add('spinning');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const mid = $('#pvStrip').clientWidth / 2, c = tr.children[50];
    const x = -(c.offsetLeft + c.offsetWidth / 2 - mid) + rnd(-c.offsetWidth * .35, c.offsetWidth * .35);
    tr.style.transition = 'transform 5s cubic-bezier(.08,.6,.15,1)'; tr.style.transform = `translateX(${x}px)`;
  }));
  PV.spinEnd = Date.now() + 5400;
  setTimeout(() => { const c = tr.querySelector('.wcard'); c && c.classList.add('w') }, 5200);
}
let pvLast = 0;
function pvRender(force) {
  const now = Date.now(); const tot = pvTotal();
  $('#pvPool').textContent = fmt(tot); $('#pvGame').textContent = 'Game #' + PV.game;
  const tm = $('#pvTimer');
  if (PV.phase === 'wait') { if (PV.end) { const s = Math.max(0, Math.ceil((PV.end - now) / 1000)); tm.textContent = '00:' + String(s).padStart(2, '0'); tm.classList.remove('l') } else { tm.textContent = 'WAITING'; tm.classList.add('l') } }
  else { tm.textContent = PV.phase === 'spin' ? 'LIVE' : 'WINNER'; tm.classList.add('l') }
  const jb = $('#pvJoin'); const ok = PV.phase === 'wait' && betVal('pv') > 0;
  jb.className = 'bigbtn' + (ok ? ' y' : ''); jb.textContent = PV.phase === 'wait' ? 'Join the Battle' : PV.phase === 'spin' ? 'Spinning…' : 'Next round soon';
  if (!force && now - pvLast < 400) return; pvLast = now;
  // yoy (arc)
  const ring = $('#pvRing'); const N = 12, R = 156; let h = '';
  for (let i = 0; i < N; i++) {
    const a = -90 + (i - (N - 1) / 2) * 24; const p = PV.pl[i];
    const tr = `transform:rotate(${a + 90}deg) translateY(-${R}px)`;
    h += p ? `<div class="atile" style="${tr};--c:${p.c}">${GEM}<b>${fmt(p.amt)}</b></div>` : `<div class="atile" style="${tr}"><span class="tile-ph">RIKI<br>GIFT</span></div>`;
  }
  ring.innerHTML = h; ring.classList.toggle('idle', PV.phase === 'wait');
  if (PV.phase === 'wait') {
    const tr = $('#pvTrack'); tr.style.transition = 'none'; tr.style.transform = 'translateX(0)';
    tr.innerHTML = PV.pl.length ? PV.pl.map(p => `<div class="scard" style="--c:${p.c}">${avHTML(p.name)}<b>${esc(p.name)}</b><em>${(p.amt / tot * 100).toFixed(1)}%</em></div>`).join('') : `<div class="scard" style="--c:#3f3f3f">${avHTML('?')}<b>Waiting…</b><em>0%</em></div>`;
  }
  $('#pvCnt').textContent = PV.pl.length;
  $('#pvPl').innerHTML = [...PV.pl].sort((a, b) => b.amt - a.amt).map(p => `<div class="vrow ${PV.winner === p && PV.phase === 'done' ? 'w' : ''}" style="--c:${p.c}">${avHTML(p.name)}<div><b>${esc(p.name)}${p.bot ? ' <span class="bt">BOT</span>' : ''}${p.me ? ' (you)' : ''}</b><small>${g$(p.amt)}</small></div><span class="pc2">${(p.amt / (tot || 1) * 100).toFixed(1)}%</span></div>`).join('') || '<div class="empty">Be the first to join!</div>';
}
function pvHub() {
  const tot = pvTotal();
  $('#phPot').innerHTML = g$(tot);
  $('#phStarts').textContent = PV.phase === 'done' ? '🏆 PvP won' : PV.end && PV.phase === 'wait' ? 'Starts in ' + Math.max(0, Math.ceil((PV.end - Date.now()) / 1000)) + 's' : PV.phase === 'wait' ? (PV.pl.length === 1 ? '1 more to start' : 'Waiting for players') : 'LIVE';
  const lp = $('.tvtcard .livep'); if (lp) lp.textContent = TV.phase === 'done' && TV.win ? `🏆 ${TV.win === 'ice' ? 'Ice' : 'Fire'} wins` : TV.end && TV.phase === 'wait' ? 'Starts in ' + Math.max(0, Math.ceil((TV.end - Date.now()) / 1000)) + 's' : TV.phase === 'wait' ? 'Waiting for players' : 'Live';
  let h = ''; for (let i = 0; i < 5; i++) { const p = PV.pl[i]; h += p ? `<div class="slot f">${avHTML(p.name)}<em>${fmt(p.amt)}</em></div>` : '<div class="slot e">+</div>' }
  $('#phSlots').innerHTML = h;
  const it = tvSum('ice'), ft = tvSum('fire'), t = it + ft || 1;
  $('#thI').innerHTML = g$(it); $('#thF').innerHTML = g$(ft);
  $('#thIn').textContent = TV.ice.length + ' pl'; $('#thFn').textContent = TV.fire.length + ' pl';
  $('#thIx').textContent = 'x' + (it ? (t / it).toFixed(2) : '0'); $('#thFx').textContent = 'x' + (ft ? (t / ft).toFixed(2) : '0');
}
$('#pvJoin').onclick = () => {
  if (PV.phase !== 'wait') { toast('Round in progress'); return }
  const a = takeBet('pv', 0.1); if (!a) return;
  pvAdd(ME, a, true); hap('medium'); toast(`⚔️ Joined: ${g$(a)}`); pvRender(true);
};

// =====================================================================
//  3) TvT (Ice vs Fire)
// =====================================================================
const TV = { phase: 'wait', end: 0, ice: [], fire: [], filter: 'all', game: 9120 };
const tvSum = t => TV[t].reduce((s, p) => s + p.amt, 0);
function tvReset() { TV.phase = 'wait'; TV.end = 0; TV.ice = []; TV.fire = []; TV.win = null; TV.game++; $('#tvIce').classList.remove('lose'); $('#tvArena').classList.remove('play'); $('#tvFire').classList.remove('lose'); $('#tvWin').classList.remove('on'); tvRender(true); tvBallHome() }
function tvAdd(team, name, amt, me, gifts) {
  const tw = $('#tvWin'); if (tw) { tw.innerHTML = `${esc(name)}${!me ? ' <span class="bt">BOT</span>' : ''} ${GEM}+${fmt(amt)}${gifts && gifts.length ? ' 🎁' : ''}`; tw.classList.add('on'); clearTimeout(tw._t); tw._t = setTimeout(() => tw.classList.remove('on'), 4000) }
  let p = TV[team].find(x => x.name === name && !!x.me === !!me);
  if (p) { p.amt = Math.round((p.amt + amt) * 100) / 100; if (gifts) p.gifts = (p.gifts || []).concat(gifts) } else TV[team].push({ name, amt, me, gifts: gifts || [], bot: !me });
  if (TV.ice.length && TV.fire.length && !TV.end) TV.end = Date.now() + 20000;
}
function tvTick() {
  if (window.LIVE_HOOK && window.LIVE_HOOK.on()) { window.LIVE_HOOK.tv(); if (cur === 'tvt') tvRender(); if (cur === 'pvphub') pvHub(); return }
  if (TV.phase === 'wait') {
    ['ice', 'fire'].forEach(t => {
      const nm = t === 'ice' ? 'Ice' : 'Fire', b = TV[t].find(x => x.bot);
      const humans = TV.ice.concat(TV.fire).some(x => !x.bot);
      const otherHas = TV[t === 'ice' ? 'fire' : 'ice'].length > 0, mineEmpty = !TV[t].length;
      if (!b && (otherHas && mineEmpty ? Math.random() < .06 : humans ? Math.random() < .012 : Math.random() < .003)) {
        const gs = Math.random() < .35 ? [pick(GIFTS.filter(g => g.p <= 60))] : [];
        tvAdd(t, nm, gs.length ? Math.min(1000, gs[0].p) : botAmt(), false, gs.map(g => g.i));
      } else if (b && b.amt < 1000 && Math.random() < .0025) b.amt = Math.round(Math.min(1000, b.amt + botAmt(1000 - b.amt)) * 100) / 100;
    });
    if (TV.end && Date.now() >= TV.end) tvPlay();
  }
  if (cur === 'tvt') tvRender(); if (cur === 'pvphub') pvHub();
}
const TB = { x: 0, y: 0, vx: 0, vy: 0, mode: 'idle' };
function tvBallHome() { const ar = $('#tvArena'), b = $('#tvBall'); TB.x = ar.clientWidth * ($('#tvIce').getBoundingClientRect().width / ar.clientWidth); TB.y = ar.clientHeight / 2; b.style.left = TB.x + 'px'; b.style.top = TB.y + 'px'; b.style.display = 'block'; b.className = 'ball idle' }
async function tvPlay(forced) {
  TV.phase = 'play';
  const it = tvSum('ice'), ft = tvSum('fire'), tot = it + ft;
  const win = forced || (Math.random() < it / tot ? 'ice' : 'fire'); TV.win = win;
  const ball = $('#tvBall'), ar = $('#tvArena'); ar.classList.add('play'); ball.className = 'ball'; ball.style.display = 'block';
  const W = ar.clientWidth, H = ar.clientHeight, R = 13;
  const border = () => $('#tvIce').getBoundingClientRect().width - 8;
  let x = border(), y = H / 2, sp = rnd(13, 16), an = rnd(0, Math.PI * 2);
  let vx = Math.cos(an) * sp, vy = Math.sin(an) * sp;
  const t0 = performance.now(), dur = 7000;
  // nishon: g'olib tomon hududidagi nuqta (chegaradan uzoqroq)
  const tgt = () => { const b = border(); return win === 'ice' ? [rnd(R * 2.5, Math.max(R * 3, b - 34)), rnd(H * .3, H * .7)] : [rnd(Math.min(W - R * 3, b + 34), W - R * 2.5), rnd(H * .3, H * .7)] };
  const [tx, ty] = tgt();
  const WANDER = .62; // vaqtning 62% — erkin kezish, keyin silliq sirpanib g'olib tomonda to'xtash (sakrash/teleport yo'q)
  await new Promise(res => {
    let last = t0, gx = 0, gy = 0, g0 = null;
    const step = now => {
      const dt = Math.min(2, (now - last) / 16.7); last = now; const k = Math.min(1, (now - t0) / dur);
      if (k < WANDER) {
        if (Math.random() < .03) { vx += rnd(-2.5, 2.5); vy += rnd(-2.5, 2.5) }
        const s2 = Math.hypot(vx, vy) || 1, want = 12 * (1 - k * .45); vx *= want / s2; vy *= want / s2;
        x += vx * dt; y += vy * dt;
        if (x < R) { x = R; vx = Math.abs(vx); hit() } if (x > W - R) { x = W - R; vx = -Math.abs(vx); hit() }
        if (y < R) { y = R; vy = Math.abs(vy); hit() } if (y > H - R) { y = H - R; vy = -Math.abs(vy); hit() }
      } else {
        if (!g0) { g0 = { x, y, vx, vy }; gx = x + vx * 18; gy = y + vy * 18; gx = Math.max(R, Math.min(W - R, gx)); gy = Math.max(R, Math.min(H - R, gy)) }
        const f = (k - WANDER) / (1 - WANDER), e = 1 - Math.pow(1 - f, 3); // ease-out cubic
        // kvadratik Bezier: joriy nuqta → harakat yo'nalishidagi nuqta → nishon (yo'nalish keskin o'zgarmaydi)
        x = (1 - e) * (1 - e) * g0.x + 2 * (1 - e) * e * gx + e * e * tx;
        y = (1 - e) * (1 - e) * g0.y + 2 * (1 - e) * e * gy + e * e * ty;
      }
      ball.style.left = x + 'px'; ball.style.top = y + 'px';
      if (k < .97 && Math.random() < .6) { const tl = document.createElement('i'); tl.className = 'trail'; tl.style.left = x + 'px'; tl.style.top = y + 'px'; ar.appendChild(tl); setTimeout(() => tl.remove(), 400) }
      if (k < 1) requestAnimationFrame(step); else { ball.classList.add('stop'); res() }
    };
    function hit() { ar.classList.remove('hit'); void ar.offsetWidth; ar.classList.add('hit'); hap() }
    requestAnimationFrame(step);
  });
  $(win === 'ice' ? '#tvFire' : '#tvIce').classList.add('lose');
  const wt = win === 'ice' ? it : ft;
  $('#tvWin').classList.remove('on');
  if (forced) { const mine = TV.ice.concat(TV.fire).find(p => p.me); if (mine) { if (TV[win].includes(mine)) { if (cur === 'tvt') toast('Your team won! 🏆'); window.LIVE_HOOK && window.LIVE_HOOK.rewards() } else if (cur === 'tvt') toast('Your team lost') } TV.phase = 'done'; return }
  ['ice', 'fire'].forEach(t => TV[t].forEach(p => {
    if (!p.me) return;
    if (t === win) { const pay = Math.round(p.amt / wt * tot * 100) / 100; setBal(pay); logGame('TvT', p.amt, pay, t); S.pvpScore += pay; if (cur === 'tvt') showRes(true, null, 'Your team won! 🏆', `+${g$(pay)}`) }
    else { logGame('TvT', p.amt, 0, t); if (cur === 'tvt') toast('Your team lost') }
  }));
  TV.phase = 'done'; save();
  setTimeout(tvReset, 5000);
}
let tvLast = 0;
function tvRender(force) {
  const it = tvSum('ice'), ft = tvSum('fire'), tot = it + ft;
  $('#tvIt').textContent = fmt(it); $('#tvFt').textContent = fmt(ft);
  $('#tvIx').textContent = 'x' + (it ? (tot / it).toFixed(2) : '0'); $('#tvFx').textContent = 'x' + (ft ? (tot / ft).toFixed(2) : '0');
  const ip = tot ? it / tot * 100 : 50;
  $('#tvIp').textContent = Math.round(ip) + '%'; $('#tvFp').textContent = Math.round(100 - ip) + '%';
  $('#tvIce').style.flexBasis = clamp(ip, 12, 88) + '%';
  const rem = TV.end && TV.phase === 'wait' ? Math.max(0, (TV.end - Date.now()) / 1000) : 0;
  $('#tvTimer').textContent = TV.phase === 'wait' ? (TV.end ? Math.ceil(rem) : 'VS') : TV.phase === 'play' ? '⚡' : '✓';
  $('#tvRing').style.strokeDashoffset = TV.end && TV.phase === 'wait' ? 289 * (1 - rem / 20) : TV.phase === 'wait' ? 289 : 0;
  const msg = $('#tvMsg');
  if (TV.phase === 'wait' && (!TV.ice.length || !TV.fire.length)) { msg.textContent = !TV.ice.length && !TV.fire.length ? "Waiting for players" : !TV.ice.length ? 'Waiting for Ice' : 'Waiting for Fire'; msg.classList.add('on') } else msg.classList.remove('on');
  if (!force && Date.now() - tvLast < 400) return; tvLast = Date.now();
  const stk = arr => arr.slice(0, 3).map(p => avHTML(p.name)).join('');
  $('#tvIa').innerHTML = stk(TV.ice); $('#tvFa').innerHTML = stk(TV.fire);
  $('#tvIav').innerHTML = stk(TV.ice); $('#tvFav').innerHTML = stk(TV.fire);
  $('#tcA').textContent = TV.ice.length + TV.fire.length; $('#tcI').textContent = TV.ice.length; $('#tcF').textContent = TV.fire.length;
  const rows = [];
  ['ice', 'fire'].forEach(t => { if (TV.filter === 'all' || TV.filter === t) TV[t].forEach(p => rows.push([t, p])) });
  rows.sort((a, b) => b[1].amt - a[1].amt);
  $('#tvRows').innerHTML = rows.map(([t, p]) => {
    const ts = tvSum(t) || 1;
    const chips = p.gifts && p.gifts.length ? `<div class="gch">${p.gifts.slice(0, 3).map(gi => `<span>${GI(GIFTS[gi])}</span>`).join('')}</div>` : `<div class="gch"><span>${g$(p.amt)}</span></div>`;
    return `<div class="trow"><div class="avw">${avHTML(p.name)}<span class="tb" style="background:${t === 'ice' ? '#0e7490' : '#c2410c'}">${t === 'ice' ? '❄' : '🔥'}</span></div><div><b>${esc(p.name)}</b>${p.bot ? ' <span class="bt">BOT</span>' : ''}${p.me ? ' <span class="bt">YOU</span>' : ''}<small style="color:${t === 'ice' ? '#67e8f9' : '#fdba74'}">${(p.amt / ts * 100).toFixed(1)}% of ${t === 'ice' ? 'Ice' : 'Fire'}</small></div>${chips}<span class="r">${g$(p.amt)}</span></div>`;
  }).join('') || '<div class="empty">No players yet</div>';
}
$$('#tvTabs button').forEach(b => b.onclick = () => { TV.filter = b.dataset.f; $$('#tvTabs button').forEach(x => x.classList.toggle('on', x === b)); tvRender(true) });
$$('[data-team]').forEach(b => b.onclick = () => {
  if (TV.phase !== 'wait') { toast('Round in progress'); return }
  const t = b.dataset.team, other = t === 'ice' ? 'fire' : 'ice';
  if (TV[other].some(p => p.me)) { toast("You're already on the other team"); return }
  const gifts = BS.tv.mode === 'gift' ? BS.tv.gifts.map(id => invGet(id)?.g).filter(x => x != null) : [];
  const a = takeBet('tv', 0.1); if (!a) return;
  tvAdd(t, ME, a, true, gifts); hap('medium'); toast(`${t === 'ice' ? '❄️' : '🔥'} Joined: ${g$(a)}`); tvRender(true);
});

// =====================================================================
//  4) UPGRADE
// =====================================================================
const UP = { from: null, to: null, mode: 'gift', spinning: false, rot: 0 };
function upFromVal() { return UP.mode === 'gift' ? (invGet(UP.from)?.v || 0) : (parseFloat($('#upAmt').value) || 0) }
function upChance() { const f = upFromVal(); if (!f || UP.to == null) return 0; return clamp(f / GIFTS[UP.to].p * 95, 0.5, 90) }
function upRender() {
  $$('[data-tog="up"] button').forEach(x => x.classList.toggle('on', x.dataset.m === UP.mode)); $('#upAmtW').style.display = UP.mode === 'coin' ? '' : 'none';
  const fv = upFromVal();
  const fb = $('#upFrom'), tb = $('#upTo');
  if (UP.mode === 'gift' && UP.from && invGet(UP.from)) { const it = invGet(UP.from), g = GIFTS[it.g]; fb.className = 'ubox f'; fb.innerHTML = `${GII(it)}<b>${esc(it.m || g.n)}</b><span class="uv">${g$(it.v)}</span>` }
  else if (UP.mode === 'coin') { fb.className = 'ubox f'; fb.innerHTML = `<div class="pl" style="color:#60a5fa">${GEM}</div><b>Balance</b><span class="uv">${g$(fv)}</span>` }
  else { UP.from = null; fb.className = 'ubox'; fb.innerHTML = `<div class="pl">+</div><b>Select Gift</b><small>Choose a gift to upgrade</small>` }
  if (UP.to != null) { const g = GIFTS[UP.to]; tb.className = 'ubox f'; tb.innerHTML = `${GI(g)}<b>${esc(g.n)}</b><span class="uv">${g$(g.p)}</span>` }
  else if (fv) { tb.className = 'ubox'; tb.innerHTML = `<div class="pl">+</div><b>Select Target</b><small>Pick a dream gift</small>` }
  else { tb.className = 'ubox off'; tb.innerHTML = `<div class="pl">+</div><b>Select a gift first</b><small>Select a gift to continue</small>` }
  $('#upL2').className = fv ? '' : 'off';
  const ch = upChance();
  $('#upCh').textContent = (ch || 100).toFixed(1) + '%';
  $('#upLv').textContent = !ch ? 'VERY HIGH' : ch >= 70 ? 'VERY HIGH' : ch >= 45 ? 'HIGH' : ch >= 25 ? 'MEDIUM' : ch >= 10 ? 'LOW' : 'VERY LOW';
  $('#upCh').style.color = !ch || ch >= 45 ? '#34d399' : ch >= 20 ? '#fbbf24' : '#f87171';
  const deg = (ch || 100) * 3.6;
  $('#uwi').style.background = `conic-gradient(#10b981 0 ${deg}deg, #1b2433 ${deg}deg 360deg)`;
  const btn = $('#upBtn'); const ok = ch > 0 && !UP.spinning;
  btn.className = 'bigbtn' + (ok ? ' g' : ''); btn.textContent = UP.spinning ? 'Spinning…' : ok ? `Upgrade · ${ch.toFixed(1)}%` : 'Select gifts';
}
function upTicks() { let h = ''; for (let i = 0; i < 60; i++) h += `<i style="transform:rotate(${i * 6}deg)"></i>`; $('#uwo').innerHTML = h }
$('#upFrom').onclick = () => { if (UP.spinning || UP.mode !== 'gift') return; pickGifts({ multi: false, title: 'Select your gift', done: id => { UP.from = id; if (UP.to != null && GIFTS[UP.to].p <= upFromVal()) UP.to = null; upRender() } }) };
$('#upTo').onclick = () => {
  if (UP.spinning) return; const fv = upFromVal(); if (!fv) { toast('Select your gift first'); return }
  pickGifts({ source: 'cat', title: 'Select target gift', filter: g => g.p > fv * 1.05 && g.p <= fv * 200, done: gi => { UP.to = gi; upRender() } });
};
$('#upAmt').oninput = upRender;
$$('[data-tog="up"] button').forEach(b => b.onclick = () => { UP.mode = b.dataset.m; UP.from = null; UP.to = null; $$('[data-tog="up"] button').forEach(x => x.classList.toggle('on', x === b)); $('#upAmtW').style.display = UP.mode === 'coin' ? '' : 'none'; upRender() });
$('#upBtn').onclick = async () => {
  const ch = upChance(); if (!ch || UP.spinning) return;
  const fv = upFromVal(), tg_ = GIFTS[UP.to];
  if (UP.mode === 'coin') { if (fv > S.bal) { toast('Insufficient balance'); return } if (fv < 0.1) { toast('Minimum 0.10'); return } setBal(-fv) }
  else invDel([UP.from]);
  UP.spinning = true; upRender();
  const r = Math.random() * 100, win = r < ch;
  UP.rot += 360 * 6 + (360 - (UP.rot % 360)) + (360 - r * 3.6);
  $('#uwi').style.transform = `rotate(${UP.rot}deg)`;
  hap('medium'); await sleep(4200);
  UP.spinning = false;
  if (win) { addItem(tg_, tg_.p); logGame('Upgrade', fv, tg_.p, tg_.n); showRes(true, tg_, 'Upgrade successful! ⚡', `${esc(tg_.n)} · ${g$(tg_.p)}`) }
  else { logGame('Upgrade', fv, 0, tg_.n); showRes(false, tg_, 'Better luck next time', `${esc(tg_.n)} — ${ch.toFixed(1)}%`) }
  UP.from = null; if (UP.mode === 'coin') $('#upAmt').value = ''; upRender();
};

// =====================================================================
//  5) MINES
// =====================================================================
const MN = { on: false, n: 3, bet: 0, mines: new Set(), open: new Set(), busy: false };
const mMul = k => { let m = 1; for (let i = 0; i < k; i++) m *= (25 - i) / (25 - MN.n - i); return Math.floor(m * 0.97 * 100) / 100 };
function mRender() {
  const g = $('#mGrid'); let h = '';
  for (let i = 0; i < 25; i++) {
    const op = MN.open.has(i), mine = MN.mines.has(i), reveal = !MN.on && MN.mines.size && MN.revealed;
    if (op && !mine) h += `<button class="cell s" data-i="${i}">${GEM}</button>`;
    else if ((op || reveal) && mine) h += `<button class="cell m ${op ? '' : 'dim'}" data-i="${i}">${ICO.bomb}</button>`;
    else if (reveal) h += `<button class="cell s dim" data-i="${i}">${GEM}</button>`;
    else h += `<button class="cell" data-i="${i}">${ICO.gift}</button>`;
  }
  g.innerHTML = h;
  const k = MN.open.size; let c = '';
  for (let i = 1; i <= Math.min(25 - MN.n, 24); i++) c += `<span class="${i === k + 1 && MN.on ? 'cur' : i <= k ? 'past' : ''}">${mMul(i).toFixed(2)}x</span>`;
  c += `<span class="mx">${mMul(25 - MN.n).toFixed(2)}x</span>`;
  $('#mChips').innerHTML = c;
  const cc = $('#mChips .cur'); cc && cc.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  const b = $('#mBtn'), bv = betVal('mn');
  if (MN.on) { if (k) { b.className = 'bigbtn g'; b.innerHTML = `Cash out ${g$(MN.bet * mMul(k))}` } else { b.className = 'bigbtn wait'; b.textContent = 'Pick a cell' } }
  else { b.className = 'bigbtn' + (bv > 0 ? ' ok' : ''); b.textContent = bv > 0 ? 'Place Bet' : 'Enter a bet amount' }
  $('#mCntV').textContent = MN.n;
}
function mDD() { let h = ''; for (let i = 1; i <= 24; i++) h += `<button data-n="${i}" class="${i === MN.n ? 'on' : ''}">${i}</button>`; $('#mDD').innerHTML = h }
$('#mSelB').onclick = e => { e.stopPropagation(); if (MN.on) { toast('Round in progress'); return } mDD(); $('#mSel').classList.toggle('open') };
$('#mDD').onclick = e => { const b = e.target.closest('[data-n]'); if (!b) return; MN.n = +b.dataset.n; $('#mSel')?.classList.remove('open'); MN.revealed = false; mRender() };
document.addEventListener('click', e => { if (!e.target.closest('#mSel')) $('#mSel')?.classList.remove('open') });
$('#mBtn').onclick = () => {
  if (MN.on) { if (!MN.open.size) return; const w = Math.round(MN.bet * mMul(MN.open.size) * 100) / 100; setBal(w); logGame('Mines', MN.bet, w, MN.open.size + ' cells'); MN.on = false; MN.revealed = true; hapN('success'); toast(`✅ +${g$(w)}`); mRender(); return }
  const a = takeBet('mn', 0.05); if (!a) return;
  MN.on = true; MN.bet = a; MN.open = new Set(); MN.mines = new Set(); MN.revealed = false;
  while (MN.mines.size < MN.n) MN.mines.add(ri(25));
  hap('medium'); mRender();
};
$('#mGrid').onclick = e => {
  const c = e.target.closest('.cell'); if (!c || !MN.on) return; const i = +c.dataset.i; if (MN.open.has(i)) return;
  MN.open.add(i);
  if (MN.mines.has(i)) { MN.on = false; MN.revealed = true; logGame('Mines', MN.bet, 0, '💣'); hapN('error'); toast('💣 Boom!'); mRender(); return }
  hap();
  if (MN.open.size === 25 - MN.n) { const w = Math.round(MN.bet * mMul(MN.open.size) * 100) / 100; setBal(w); logGame('Mines', MN.bet, w, 'MAX'); MN.on = false; MN.revealed = true; showRes(true, null, 'MAX WIN!', `+${g$(w)}`) }
  mRender();
};

// =====================================================================
//  6) SPINS (slot)
// =====================================================================
const SP_SYM = ['Hypno Lollipop', 'B-Day Candle', 'Jolly Chimp', 'Stellar Rocket', 'Artisan Brick', 'Scared Cat', 'Sharp Tongue', 'Precious Peach', 'Heart Locket'].map(byName);
const SP_W = [22, 20, 17, 14, 11, 7, 5, 3, 1.2];
const SP_PT = [[1.6, 3.5, 9], [2, 4.5, 11], [3, 6.5, 18], [4.4, 9, 26], [6.6, 13, 44], [11, 22, 88], [18, 44, 175], [35, 88, 440], [120, 280, 2500]];
const SP = { spd: 1, dc: false, busy: false, free: 0, freeMul: 1, grid: [] };
const spTot = SP_W.reduce((a, b) => a + b);
function spRoll() { const g = []; for (let i = 0; i < 25; i++) { let r = Math.random() * spTot, k = 0; while (r >= SP_W[k]) { r -= SP_W[k]; k++ } g.push(k) } return g }
function spEval(g) { const c = Array(9).fill(0); g.forEach(k => c[k]++); let w = 0, wins = []; c.forEach((n, k) => { if (n >= 8) { w += SP_PT[k][n >= 12 ? 2 : n >= 10 ? 1 : 0]; wins.push(k) } }); return { w, wins } }
function spDraw(anim) {
  const d = [0, .35, .22, .12][SP.spd];
  $('#sGrid').innerHTML = SP.grid.map((k, i) => `<div class="tok ${anim ? 'drop' : ''}" style="--sd:${d}s;animation-delay:${anim ? (i % 5) * d * .3 + Math.floor(i / 5) * d * .15 : 0}s" data-k="${k}">${GI(SP_SYM[k])}</div>`).join('');
}
function spBet() { return Math.max(0.05, Math.round((parseFloat($('#spBet').value) || 0.2) * 100) / 100) }
function spUI() { const b = spBet(); $('#spBuyV').textContent = fmt(b * 100); $('#spDCV').textContent = fmt(b * .25); $('#spDC').classList.toggle('on', SP.dc); $('#spInfo').innerHTML = SP.free ? `🎁 Free spins: <b>${SP.free}</b> · every win x${SP.freeMul}` : 'Land 8+ of the same gift to win. 12+ pays the most.' }
async function spSpin() {
  if (SP.busy) return;
  const bet = spBet(); const free = SP.free > 0;
  const cost = free ? 0 : Math.round(bet * (SP.dc ? 1.25 : 1) * 100) / 100;
  if (cost > S.bal) { toast('Insufficient balance'); $('#spAuto').checked = false; openDeposit(); return }
  SP.busy = true; $('#spBtn').classList.add('busy'); if (cost) setBal(-cost);
  let g = spRoll(), r = spEval(g);
  if (SP.dc && !r.w && Math.random() < .3) { g = spRoll(); r = spEval(g) }
  SP.grid = g; spDraw(true); hap();
  await sleep([0, 1100, 750, 450][SP.spd]);
  const mul = free ? SP.freeMul : 1;
  const win = Math.round(r.w * bet * mul * ((CFG.RTP || {}).spins || 100) / 100 * 100) / 100;
  if (r.wins.length) $$('#sGrid .tok').forEach(t => t.classList.add(r.wins.includes(+t.dataset.k) ? 'win' : 'dimt'));
  if (win > 0) { window.payWin ? payWin(win, 'Spins') : setBal(win); hapN('success'); if (win >= bet * 10) { $('#spWinV').innerHTML = g$(win); $('#spWin').classList.add('on'); setTimeout(() => $('#spWin').classList.remove('on'), 1800) } else toast(`+${g$(win)}`) }
  logGame('Spins', cost, win, free ? 'free' : '');
  if (free) { SP.free--; if (!SP.free) { toast('🎁 Free spins finished'); SP.freeMul = 1 } }
  spUI(); SP.busy = false; $('#spBtn').classList.remove('busy');
  if ((SP.free > 0 || $('#spAuto').checked) && cur === 'spins') { await sleep(win >= bet * 10 ? 1900 : 500); spSpin() }
}
$('#spBtn').onclick = spSpin;
$('#spMinus').onclick = () => { $('#spBet').value = fmt(Math.max(.05, spBet() - (spBet() > 1 ? .5 : .05))); spUI() };
$('#spPlus').onclick = () => { $('#spBet').value = fmt(Math.min(500, spBet() + (spBet() >= 1 ? .5 : .05))); spUI() };
$('#spBet').oninput = spUI;
$$('#spSpeed button').forEach(b => b.onclick = () => { SP.spd = +b.dataset.s; $$('#spSpeed button').forEach(x => x.classList.toggle('on', +x.dataset.s <= SP.spd)) });
$('#spDC').onclick = () => { SP.dc = !SP.dc; spUI(); toast(SP.dc ? '⚡ Double Chance on (+25%)' : 'Double Chance off') };
$('#spBuy').onclick = () => {
  if (SP.free || SP.busy) return; const c = Math.round(spBet() * 100 * 100) / 100;
  if (c > S.bal) { toast('Insufficient balance'); return }
  setBal(-c); logGame('Spins', c, 0, 'Buy feature'); SP.free = 10; SP.freeMul = 10; spUI(); toast('🎁 10 free spins · x10'); spSpin();
};
$('#spAuto').onchange = () => { if ($('#spAuto').checked) spSpin() };

// =====================================================================
//  7) PLINKO
// =====================================================================
const PL_ROWS = 12;
const PL_M = {
  easy: [10, 3, 1.6, 1.4, 1.1, 1, .5, 1, 1.1, 1.4, 1.6, 3, 10],
  med: [33, 11, 4, 2, 1.1, .6, .3, .6, 1.1, 2, 4, 11, 33],
  hard: [170, 24, 8.1, 2, .7, .2, .2, .2, .7, 2, 8.1, 24, 170]
};
const PLS = { d: 'med', balls: [], hit: {}, W: 0, H: 0 };
function plSize() { const c = $('#plCv'); const w = c.parentElement.clientWidth - 16; const dpr = window.devicePixelRatio || 1; c.width = w * dpr; c.height = w * .95 * dpr; c.style.height = w * .95 + 'px'; PLS.W = w; PLS.H = w * .95; PLS.dpr = dpr }
function plGeo() { const W = PLS.W, H = PLS.H; const gap = W / (PL_ROWS + 3); const top = gap * .8; return { gap, top, rowH: (H - top - gap * 1.6) / (PL_ROWS - 1), W, H } }
function pegXY(r, c) { const g = plGeo(); const n = r + 3; return [g.W / 2 + (c - (n - 1) / 2) * g.gap, g.top + r * g.rowH] }
function plDraw() {
  const c = $('#plCv'); if (!c.width) return; const x = c.getContext('2d'); const g = plGeo();
  x.setTransform(PLS.dpr, 0, 0, PLS.dpr, 0, 0); x.clearRect(0, 0, g.W, g.H);
  for (let r = 0; r < PL_ROWS; r++) for (let k = 0; k < r + 3; k++) { const [px, py] = pegXY(r, k); const gr = x.createRadialGradient(px - 1, py - 1, 0, px, py, 5); gr.addColorStop(0, '#fff'); gr.addColorStop(1, '#c4b5fd'); x.fillStyle = gr; x.beginPath(); x.arc(px, py, Math.max(3, g.gap * .14), 0, 7); x.fill() }
  const M = PL_M[PLS.d], sy = g.top + (PL_ROWS - 1) * g.rowH + g.gap * .55, sw = g.gap * .9;
  M.forEach((m, i) => {
    const sx = g.W / 2 + (i - 6) * g.gap - sw / 2; const t = Math.abs(i - 6) / 6;
    const hit = PLS.hit[i] && performance.now() - PLS.hit[i] < 300;
    x.fillStyle = `hsl(${270 - t * 20},${60 + t * 30}%,${(hit ? 70 : 32 + t * 22)}%)`;
    const y = sy + (hit ? 4 : 0); x.beginPath(); x.roundRect ? x.roundRect(sx, y, sw, g.gap * .8, 6) : x.rect(sx, y, sw, g.gap * .8); x.fill();
    x.fillStyle = '#fff'; x.font = `800 ${Math.max(8, g.gap * .34)}px Inter,sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(m >= 100 ? m : m, sx + sw / 2, y + g.gap * .4);
  });
  PLS.balls.forEach(b => { x.fillStyle = '#fbbf24'; x.shadowColor = '#fbbf24'; x.shadowBlur = 10; x.beginPath(); x.arc(b.x, b.y, Math.max(4, g.gap * .2), 0, 7); x.fill(); x.shadowBlur = 0 });
}
function plStep(now) {
  const g = plGeo();
  PLS.balls.forEach(b => {
    const seg = 320, k = Math.min(1, (now - b.t) / seg), i = b.i;
    const a = b.pts[i], c = b.pts[i + 1];
    if (!c) return;
    b.x = a[0] + (c[0] - a[0]) * k; b.y = a[1] + (c[1] - a[1]) * k - Math.sin(k * Math.PI) * g.rowH * .45;
    if (k >= 1) { b.i++; b.t = now; if (b.i >= b.pts.length - 1) b.done = true }
  });
  PLS.balls.filter(b => b.done && !b.paid).forEach(b => {
    b.paid = true; const m = b.srv ? b.srv.m : PL_M[b.d][b.slot]; const w = b.srv ? b.srv.pay : Math.round(b.bet * m * ((CFG.RTP || {}).plinko || 100) / 100 * 100) / 100;
    PLS.hit[b.slot] = performance.now(); if (b.srv) window.RIKI_GF(b.srv, 'Plinko', true); else window.payWin ? payWin(w, 'Plinko', true) : setBal(w); logGame('Plinko', b.bet, w, m + 'x'); hap(m >= 2 ? 'heavy' : 'light');
    if (cur === 'plinko') toast(`${m}x · ${w >= b.bet ? '+' : ''}${g$(w)}`, 1200);
  });
  PLS.balls = PLS.balls.filter(b => !b.done);
  if (cur === 'plinko') plDraw();
}
$('#plBtn').onclick = () => {
  const a = takeBet('pl', 0.05); if (!a) return;
  const g = plGeo(); const pts = [[g.W / 2 + rnd(-g.gap * .3, g.gap * .3), 0]];
  let pos = 0; const p0 = pegXY(0, 1); pts.push([p0[0] + rnd(-3, 3), p0[1] - g.gap * .2]);
  for (let r = 1; r < PL_ROWS; r++) { if (Math.random() < .5) pos++; const [px, py] = pegXY(r, pos + 1); pts.push([px + rnd(-2, 2), py - g.gap * .2]) }
  const slot = pos + (Math.random() < .5 ? 1 : 0);
  pts.push([g.W / 2 + (slot - 6) * g.gap, g.top + (PL_ROWS - 1) * g.rowH + g.gap * .9]);
  PLS.balls.push({ pts, i: 0, t: performance.now(), x: pts[0][0], y: 0, slot, bet: a, d: PLS.d }); hap();
};
$$('#plDiff button').forEach(b => b.onclick = () => { if (PLS.balls.length) { toast('Wait for the balls to land'); return } PLS.d = b.dataset.d; $$('#plDiff button').forEach(x => x.classList.toggle('on', x === b)); plDraw() });

// =====================================================================
//  8) DICE
// =====================================================================
const DC = { mode: 'over', busy: false };
function dcSync(from) {
  let T = parseFloat($('#dT').value);
  if (from === 'mu') { const m = clamp(parseFloat($('#dMu').value) || 2, 1.0102, 49.5); const ch = 99 / m; T = DC.mode === 'over' ? 100 - ch : ch }
  if (from === 'ch') { const ch = clamp(parseFloat($('#dCh').value) || 50, 2, 98); T = DC.mode === 'over' ? 100 - ch : ch }
  if (from === 'tv') T = parseFloat($('#dTv').value) || 50;
  T = clamp(T, 2, 98); $('#dT').value = T;
  const ch = DC.mode === 'over' ? 100 - T : T, m = 99 / ch;
  if (from !== 'mu') $('#dMu').value = m.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
  if (from !== 'ch') $('#dCh').value = ch.toFixed(2);
  if (from !== 'tv') $('#dTv').value = T.toFixed(2);
  $('#dModeL').textContent = DC.mode === 'over' ? 'Higher' : 'Lower';
  $('#dRd').style.width = T + '%'; $('#dGr').style.width = (100 - T) + '%';
  const RED = 'repeating-linear-gradient(115deg,#f43f5e 0 4px,#e11d48 4px 9px)', GRN = 'repeating-linear-gradient(115deg,#22c55e 0 4px,#16a34a 4px 9px)';
  $('#dRd').style.background = DC.mode === 'over' ? RED : GRN; $('#dGr').style.background = DC.mode === 'over' ? GRN : RED;
  $('#dRd').style.boxShadow = DC.mode === 'over' ? '0 0 19px #f43f5e88' : '0 0 19px #22c55e88'; $('#dGr').style.boxShadow = DC.mode === 'over' ? '0 0 19px #22c55e88' : '0 0 19px #f43f5e88';
  const b = $('#dBtn'); b.className = 'bigbtn' + (betVal('dc') > 0 ? ' ok' : '');
}
['dMu', 'dCh', 'dTv'].forEach(id => $('#' + id).addEventListener('change', () => dcSync(id.slice(1).toLowerCase())));
$('#dT').oninput = () => dcSync('t');
$('#dSwap').onclick = () => { DC.mode = DC.mode === 'over' ? 'under' : 'over'; $('#dT').value = 100 - parseFloat($('#dT').value); dcSync('t'); hap() };
$('#dBtn').onclick = async () => {
  if (DC.busy) return; const a = takeBet('dc', 0.05); if (!a) return; DC.busy = true;
  const T = parseFloat($('#dT').value), ch = DC.mode === 'over' ? 100 - T : T, m = 99 / ch;
  const r = Math.floor(Math.random() * 10001) / 100, win = DC.mode === 'over' ? r > T : r < T;
  const res = $('#dRes'); res.className = 'dres on'; res.style.left = '50%'; res.textContent = '…';
  await sleep(60); res.style.left = r + '%'; res.textContent = r.toFixed(2);
  await sleep(380); res.classList.add(win ? 'w' : 'l');
  const w = win ? Math.round(a * m * 100) / 100 : 0;
  if (win) { setBal(w); hapN('success'); toast(`🎲 ${r.toFixed(2)} · +${g$(w)}`) } else { hapN('error'); toast(`🎲 ${r.toFixed(2)} · yutqazdingiz`) }
  logGame('Dice', a, w, r.toFixed(2)); DC.busy = false;
};

// =====================================================================
//  9) CRAFTS
// =====================================================================
const CR = { mode: 'normal', slots: [], busy: false };
const CR_M = { safe: { x: 2, ch: .47, min: 2, n: 'Safe', ic: 'shield' }, normal: { x: 8, ch: .115, min: 4, n: 'Normal', ic: 'target' }, risky: { x: 100, ch: .0093, min: 10, n: 'Risky', ic: 'flame' } };
function crTotal() { return CR.slots.reduce((s, id) => s + (invGet(id)?.v || 0), 0) }
function crTarget() { const t = crTotal() * CR_M[CR.mode].x; let best = null; for (const g of BYPRICE) { if (g.p <= t && g.p > crTotal()) best = g } return best || BYPRICE.find(g => g.p > crTotal()) || BYPRICE[BYPRICE.length - 1] }
function crRender() {
  CR.slots = CR.slots.filter(id => invGet(id));
  $('#cOpts').innerHTML = Object.entries(CR_M).map(([k, m]) => `<button class="copt ${k === 'risky' ? 'risky' : ''} ${CR.mode === k ? 'on' : ''}" data-m="${k}"><span class="ci">${ICO[m.ic]}</span><b>${m.n}</b><span class="cx">x${m.x}</span><small>min cost<em>${fmt(m.min)} ${GEM}</em></small></button>`).join('');
  let h = ''; for (let i = 0; i < 10; i++) { const it = invGet(CR.slots[i]); h += it ? `<div class="cslot f" data-i="${i}">${GII(it)}<span class="rm">✕</span></div>` : `<div class="cslot ${i === CR.slots.length ? 'nx' : ''}" data-i="${i}">+</div>` }
  $('#cGrid').innerHTML = h; $('#cCnt').textContent = CR.slots.length + '/10';
  const tot = crTotal(), m = CR_M[CR.mode], b = $('#cBtn');
  if (CR.slots.length < 2) { b.className = 'cbtn'; $('#cBtnT').textContent = 'Add at least 2 gifts to start' }
  else if (tot < m.min) { b.className = 'cbtn'; $('#cBtnT').innerHTML = `Min cost ${g$(m.min)} · now ${g$(tot)}` }
  else { const t = crTarget(); b.className = 'cbtn ' + (CR.mode === 'risky' ? 'risk' : 'ok'); $('#cBtnT').innerHTML = `Craft → ${esc(t.n)} (${(m.ch * 100).toFixed(1)}%)` }
}
$('#cOpts').onclick = e => { const b = e.target.closest('[data-m]'); if (!b || CR.busy) return; CR.mode = b.dataset.m; hap(); crRender() };
$('#cGrid').onclick = e => {
  if (CR.busy) return; const s = e.target.closest('.cslot'); if (!s) return; const i = +s.dataset.i;
  if (CR.slots[i]) { CR.slots.splice(i, 1); crRender(); return }
  pickGifts({ multi: true, max: 10, title: 'Gifts to craft', sel: CR.slots, done: ids => { CR.slots = ids.slice(0, 10); crRender() } });
};
$('#cBtn').onclick = async () => {
  if (CR.busy || CR.slots.length < 2) return; const tot = crTotal(), m = CR_M[CR.mode]; if (tot < m.min) return;
  const t = crTarget(); CR.busy = true; $('#cSlots').classList.add('go'); hap('heavy');
  await sleep(1500); $('#cSlots').classList.remove('go');
  const ids = [...CR.slots]; invDel(ids); CR.slots = [];
  const win = Math.random() < m.ch * Math.min(1, tot * m.x / t.p);
  if (win) { addItem(t, t.p); logGame('Crafts', tot, t.p, t.n); showRes(true, t, 'Craft successful! ✨', `${esc(t.n)} · ${g$(t.p)}`) }
  else { logGame('Crafts', tot, 0, t.n); showRes(false, t, 'Craft failed', `${ids.length} gifts lost`) }
  CR.busy = false; crRender();
};
$('#howT').onclick = () => { const b = $('#howB'); const h = b.style.display === 'none'; b.style.display = h ? '' : 'none'; $('#howT').textContent = h ? 'Hide details ⌃' : 'Show details ⌄' };

// =====================================================================
//  10) CASES
// =====================================================================
const CASES = [
  { id: 'free', n: 'Free', p: 0, g: 'Hypno Lollipop', lo: 2, hi: 12 },
  { id: 'start', n: 'Starter', p: 2, g: 'Desk Calendar', lo: 0.4, hi: 25 },
  { id: 'rare', n: 'Rare', p: 8, g: 'Toy Bear', lo: 2, hi: 90 },
  { id: 'epic', n: 'Epic', p: 30, g: 'Magic Potion', lo: 5, hi: 400 },
  { id: 'leg', n: 'Legend', p: 120, g: 'Durov\'s Cap', lo: 20, hi: 1600 },
  { id: 'pepe', n: 'Pepe', p: 600, g: 'Plush Pepe', lo: 60, hi: 9000 }
];
function caseDrops(c) {
  const list = GIFTS.filter(g => g.p >= c.lo && g.p <= c.hi);
  if (!c.p) { const w = list.map(g => 1 / Math.pow(g.p, 2)); const s = w.reduce((a, b) => a + b); return list.map((g, i) => ({ g, w: w[i] / s })) }
  let lo = 0, hi = 5, a = 1;
  for (let k = 0; k < 40; k++) { a = (lo + hi) / 2; const w = list.map(g => Math.pow(g.p, -a)); const s = w.reduce((x, y) => x + y); const ev = list.reduce((t, g, i) => t + g.p * w[i] / s, 0); if (ev > c.p * .92) lo = a; else hi = a }
  const w = list.map(g => Math.pow(g.p, -a)); const s = w.reduce((x, y) => x + y);
  return list.map((g, i) => ({ g, w: w[i] / s })).sort((x, y) => y.g.p - x.g.p);
}
const CS = { sel: 'free', busy: false, drops: {} };
CASES.forEach(c => CS.drops[c.id] = caseDrops(c));
function caseRoll(id) { let r = Math.random(); for (const d of CS.drops[id]) { if (r < d.w) return d.g; r -= d.w } return CS.drops[id][0].g }
function freeLeft() { return Math.max(0, S.lastFreeCase + 864e5 - Date.now()) }
function hm(ms) { const h = Math.floor(ms / 36e5), m = Math.floor(ms % 36e5 / 6e4); return h + 'h ' + m + 'm' }
function caseRender() {
  $('#caseList').innerHTML = CASES.map(c => `<button class="case ${c.id === CS.sel ? 'sel' : ''} ${c.p ? '' : 'free'}" data-c="${c.id}">${GI(byName(c.g))}<b>${c.n}</b><small>${c.p ? g$(c.p) : (freeLeft() ? hm(freeLeft()) : 'FREE')}</small></button>`).join('');
  const c = CASES.find(x => x.id === CS.sel);
  $('#caseDrops').innerHTML = CS.drops[c.id].map(d => `<div class="gift tiers${tierOf(d.g.p)}">${GI(d.g)}<small>${esc(d.g.n)}</small><b>${(d.w * 100 < 0.1 ? '<0.1' : (d.w * 100).toFixed(d.w < .01 ? 2 : 1))}%</b></div>`).join('');
  const b = $('#caseBtn'); b.innerHTML = c.p ? `Open · ${g$(c.p)}` : (freeLeft() ? 'Next free: ' + hm(freeLeft()) : 'Open for free');
  if (!CS.busy) { const tr = $('#track'); tr.style.transition = 'none'; tr.style.transform = 'translateX(0)'; tr.innerHTML = Array.from({ length: 12 }, () => giftCard(caseRoll(c.id), 0)).join('').replace(/<b>.*?<\/b>/g, '') }
}
$('#caseList').onclick = e => { const b = e.target.closest('[data-c]'); if (!b || CS.busy) return; CS.sel = b.dataset.c; hap(); caseRender() };
$('#caseBtn').onclick = async () => {
  if (CS.busy) return; const c = CASES.find(x => x.id === CS.sel);
  if (!c.p) { if (freeLeft()) { toast('Free case in ' + hm(freeLeft()) + ''); return } S.lastFreeCase = Date.now() }
  else { if (c.p > S.bal) { toast('Insufficient balance'); openDeposit(); return } setBal(-c.p) }
  CS.busy = true; const win = caseRoll(c.id);
  const items = Array.from({ length: 50 }, () => caseRoll(c.id)); items[42] = win;
  const tr = $('#track'); tr.innerHTML = items.map(g => `<div class="gift tiers${tierOf(g.p)}">${GI(g)}<small>${esc(g.n)}</small></div>`).join('');
  tr.style.transition = 'none'; tr.style.transform = 'translateX(0)';
  await sleep(30);
  const mid = $('#reel').clientWidth / 2, c42 = tr.children[42]; tr.style.transition = 'transform 5s cubic-bezier(.1,.65,.15,1)'; tr.style.transform = `translateX(${-(c42.offsetLeft + c42.offsetWidth / 2 - mid) + rnd(-c42.offsetWidth * .35, c42.offsetWidth * .35)}px)`;
  hap('medium'); await sleep(5200);
  const it = (window.RIKI_W ? RIKI_W.with : (x, f) => f())({ game: 'cases', why: c.p ? '' : 'freecase' }, () => addItem(win, win.p * rnd(.95, 1.25))); logGame('Case ' + c.n, c.p, it.v, win.n);
  showRes(true, win, esc(win.n), `${g$(it.v)} · added to Backpack`);
  CS.busy = false; caseRender(); save();
};

// =====================================================================
//  11) MARKET (haqiqiy NFT rasmlari: nft.fragment.com)
// =====================================================================
const MK = { list: [], col: 'all', sort: 'lo', q: '' };
function mkGen() {
  MK.list = [];
  for (let i = 0; i < 48; i++) {
    const g = Math.random() < .25 ? pick(GIFTS.slice(0, 25)) : pick(GIFTS);
    const n = 1 + ri(Math.random() < .1 ? 60 : 900);
    const rare = n <= 100 ? 1.6 : 1;
    MK.list.push({ id: uid(), g: g.i, n, price: Math.round(g.p * rnd(1, 1.12) * rare * 100) / 100, seller: 'Market' });
  }
  mkRender();
}
function mkRender() {
  const cols = ['all', ...new Set(MK.list.map(x => x.g))].slice(0, 24);
  $('#mkChips').innerHTML = cols.map(c => c === 'all' ? `<button class="${MK.col === 'all' ? 'on' : ''}" data-c="all">Barchasi</button>` : `<button class="${MK.col == c ? 'on' : ''}" data-c="${c}">${GI(GIFTS[c])}${esc(GIFTS[c].n)}</button>`).join('');
  let l = MK.list.filter(x => MK.col === 'all' || x.g == MK.col).filter(x => !MK.q || GIFTS[x.g].n.toLowerCase().includes(MK.q));
  l.sort(MK.sort === 'lo' ? (a, b) => a.price - b.price : MK.sort === 'hi' ? (a, b) => b.price - a.price : (a, b) => a.n - b.n);
  $('#mkCnt').textContent = l.length; $('#mkTs').textContent = (PRICE_LIVE ? 'jonli ' : 'snapshot ') + priceDate();
  $('#mkGrid').innerHTML = l.map(x => { const g = GIFTS[x.g]; return `<div class="mkc" data-id="${x.id}"><div class="mki">${GIN(g, x.n)}<em style="background:${TIER_C[tierOf(g.p)]}">${TIER_N[tierOf(g.p)]}</em></div><b>${esc(g.n)}</b><small>#${x.n}</small><button class="mkb" data-buy="${x.id}">${g$(x.price)}</button></div>` }).join('') || '<div class="empty" style="grid-column:1/-1">Hech narsa topilmadi</div>';
}
$('#mkChips').onclick = e => { const b = e.target.closest('[data-c]'); if (!b) return; MK.col = b.dataset.c; mkRender() };
$$('#mkSort button').forEach(b => b.onclick = () => { MK.sort = b.dataset.s; $$('#mkSort button').forEach(x => x.classList.toggle('on', x === b)); mkRender() });
$('#mkQ').oninput = () => { MK.q = $('#mkQ').value.trim().toLowerCase(); mkRender() };
$('#mkRef').onclick = () => { mkGen(); hap(); toast('Updated') };
$('#mkGrid').onclick = e => {
  const buy = e.target.closest('[data-buy]'); const card = e.target.closest('.mkc'); if (!card) return;
  const x = MK.list.find(y => y.id === card.dataset.id); if (!x) return;
  if (buy) { mkBuy(x); return }
  nftModal({ g: GIFTS[x.g], n: x.n, v: x.price, market: x });
};
function mkBuy(x) {
  if (x.price > S.bal) { toast('Insufficient balance'); openDeposit(); return }
  setBal(-x.price); const g = GIFTS[x.g]; addItem(g, x.price, x.n, null, null, true); MK.list = MK.list.filter(y => y !== x);
  logGame('Market', x.price, x.price, 'Sotib olindi: ' + g.n); closeM('nftM'); mkRender(); hapN('success'); toast(`🎁 ${esc(g.n)} #${x.n} added to Backpack`);
}
function nftModal(o) {
  const g = o.g, t = tierOf(g.p);
  $('#nftHero').style.background = `radial-gradient(circle at 50% 40%, ${TIER_C[t]}66, #212121 70%)`;
  $('#nftArt').innerHTML = (o.ms ? GIM(g, o.ms) : o.item ? GI(g) : GIN(g, o.n)).replace(/loading="lazy"/g, '');
  $('#nftName').textContent = g.n; $('#nftSn').textContent = o.m ? 'Model: ' + o.m : o.market ? '#' + o.n : 'Collection floor';
  $('#nftTab').innerHTML = `<div class="nr"><span>Collection</span><b>${GI(g)}${esc(g.n)}</b></div><div class="nr"><span>Rarity</span><b><i class="sw2" style="background:${TIER_C[t]}"></i>${TIER_N[t]}</b></div>${o.m ? `<div class="nr"><span>Model</span><b>${GIM(g, o.ms)}${esc(o.m)}</b></div>` : ''}<div class="nr"><span>Floor</span><b>${g$(g.p)}</b><em>${PRICE_LIVE ? 'live' : 'snapshot'} · ${priceDate()}</em></div><div class="nr"><span>Price</span><b>${g$(o.v)}</b></div>${o.market ? `<div class="nr"><span>Seller</span><b>${esc(o.market.seller)}</b></div>` : ''}`;
  let btn = '';
  if (o.market) btn = `<button class="p" id="nfB">Buy · ${g$(o.v)}</button>`;
  else if (o.item) btn = `<button class="g" id="nfS">Sell · ${g$(o.item.v * .95)}</button><button class="p" id="nfU">⚡ Upgrade</button><button id="nfC">✨ Add to Craft</button><button id="nfW">↗ Transfer</button>`;
  btn += o.market ? `<a href="https://t.me/nft/${g.pas}-${o.n}" target="_blank" id="nfL">View NFT in Telegram ↗</a>` : `<a href="https://fragment.com/gifts/${g.slug}" target="_blank" id="nfL">View collection on Fragment ↗</a>`;
  $('#nftBtns').innerHTML = btn;
  const L = $('#nfL'); L.onclick = e => { if (tg && tg.openTelegramLink) { e.preventDefault(); tg.openTelegramLink(L.href) } };
  if (o.market) $('#nfB').onclick = () => mkBuy(o.market);
  if (o.item) {
    $('#nfS').onclick = () => { sellItem(o.item); closeM('nftM') };
    $('#nfU').onclick = () => { closeM('nftM'); UP.mode = 'gift'; UP.from = o.item.id; UP.to = null; go('upgrade') };
    $('#nfC').onclick = () => { closeM('nftM'); if (!CR.slots.includes(o.item.id) && CR.slots.length < 10) CR.slots.push(o.item.id); go('crafts') };
    $('#nfW').onclick = () => { closeM('nftM'); window.RIKI_TR ? window.RIKI_TR('gift', o.item) : 0 };
  }
  openM('nftM');
}
function sellItem(it) { const v = Math.round(it.v * .95 * 100) / 100; invDel([it.id]); setBal(v); toast(`Sold: +${g$(v)}`); bpRender() }

// =====================================================================
//  12) BACKPACK / INVITE / LEADERBOARD / EARN
// =====================================================================
function bpRender() {
  const tot = S.inv.reduce((s, x) => s + x.v, 0);
  $('#bpTotal').innerHTML = `${S.inv.length} gifts · ${g$(tot)}`;
  $('#bpGrid').innerHTML = S.inv.length ? S.inv.map(it => { return itemCard(it, `data-id="${it.id}"`) }).join('') : `<div class="empty">Your backpack is empty.</div>`;
}
$('#bpGrid').onclick = e => { const c = e.target.closest('.gift'); if (!c) return; const it = invGet(c.dataset.id); if (it) nftModal({ g: GIFTS[it.g], n: it.n, v: it.v, item: it, m: it.m, ms: it.ms }) };
$('#sellAll').onclick = () => {
  if (!S.inv.length) return; const v = Math.round(S.inv.reduce((s, x) => s + x.v, 0) * .95 * 100) / 100;
  if (!confirm(`Sell all for ${fmt(v)} TON?`)) return;
  invDel(S.inv.map(x => x.id)); setBal(v); bpRender(); toast(`+${g$(v)}`);
};
function refLink() { return `https://t.me/${CFG.BOT_USERNAME}?start=ref_${TGU.id || 0}` }
ENTER.invite = () => { $('#refLink').textContent = refLink(); $('#refN').textContent = S.ref; $('#refB').textContent = fmt(S.refB) };
$('#copyRef').onclick = () => { const l = refLink(); (navigator.clipboard ? navigator.clipboard.writeText(l) : Promise.reject()).then(() => toast('Copied ✓')).catch(() => prompt('Link:', l)) };
$('#shareRef').onclick = () => { const u = `https://t.me/share/url?url=${encodeURIComponent(refLink())}&text=${encodeURIComponent('🎁 RIKI — NFT gift games! Join:')}`; if (tg && tg.openTelegramLink) tg.openTelegramLink(u); else window.open(u) };

const LB = { t: 'pvp', fake: null };
function lbFake() {
  if (LB.fake) return LB.fake;
  const top = ['nikipopus', 'thenune', 'sedist', 'rtpking', 'Sunny Viking', 'marivana', 'Germanyadagi', 'movsar_012', 'tonwhale', 'pepe_hodler'];
  let s = 3.8e6; LB.fake = top.map((n, i) => { s *= i === 0 ? 1 : rnd(.55, .95); return { n, s, g: [byName('Heart Locket'), byName("Durov's Cap"), byName('Precious Peach')][i] || pick(GIFTS.slice(3, 30)) } });
  return LB.fake;
}
function lbRender() {
  const f = lbFake(); const myS = LB.t === 'pvp' ? S.pvpScore : LB.t === 'rich' ? S.bal : S.inv.reduce((s, x) => s + x.v, 0);
  const mult = LB.t === 'pvp' ? 1 : LB.t === 'rich' ? .02 : .05;
  const rows = f.map((r, i) => `<div class="lrow ${i < 3 ? 't' + (i + 1) : ''}"><span class="rk">${i + 1}</span>${avHTML(r.n)}<b>${esc(r.n)}</b><span class="gi">${GI(r.g)}</span><span class="sc">${LB.t === 'pvp' ? ICO.swords : GEM}${fmtK(r.s * mult)}</span></div>`).join('');
  return `<div class="lrow me"><span class="rk">–</span>${avHTML(ME)}<div><b>${esc(ME)}</b><span class="you">You</span><br><small style="color:#fbbf24">Unranked</small></div><span class="sc" style="margin-left:auto">${GEM}${fmtK(myS)}</span></div>` + rows;
}
ENTER.leader = () => { $('#lbList').innerHTML = lbRender() };
$$('#lbTabs button').forEach(b => b.onclick = () => { LB.t = b.dataset.t; $$('#lbTabs button').forEach(x => x.classList.toggle('on', x === b)); ENTER.leader() });

const TASKS = [
  { id: 'daily', ic: '🎁', n: 'FREE24 — daily bonus', d: () => `${CFG.DAILY_BONUS} TON + random gift`, r: CFG.DAILY_BONUS, daily: true },
  { id: 'chan', ic: '📢', n: 'Subscribe to the channel', d: () => '+5 TON', r: 5, link: CFG.CHANNEL_URL },
  { id: 'g10', ic: '🎮', n: 'Play 10 games', d: () => `${Math.min(S.games, 10)}/10 · +3 TON`, r: 3, prog: () => S.games / 10 },
  { id: 'g50', ic: '🔥', n: 'Play 50 games', d: () => `${Math.min(S.games, 50)}/50 · +15 TON`, r: 15, prog: () => S.games / 50 },
  { id: 'w100', ic: '💎', n: 'Wager 100 TON', d: () => `${fmt(Math.min(S.wag, 100))}/100 · +10 TON`, r: 10, prog: () => S.wag / 100 },
  { id: 'inv3', ic: '👥', n: 'Invite 3 friends', d: () => `${Math.min(S.ref, 3)}/3 · +20 TON`, r: 20, prog: () => S.ref / 3 },
  { id: 'case', ic: '📦', n: 'Open your first case', d: () => '+2 TON', r: 2, prog: () => S.hist.some(h => h.game.startsWith('Case')) ? 1 : 0 }
];
function taskReady(t) { if (t.daily) return Date.now() - S.lastDaily >= 864e5; if (S.tasks[t.id]) return false; if (t.link) return true; return t.prog() >= 1 }
function renderTasks() {
  const n = TASKS.filter(t => taskReady(t) && !t.link).length; const b = $('#earnBadge'); b.style.display = n ? '' : 'none'; b.textContent = n;
  if (cur !== 'earn') return;
  $('#taskList').innerHTML = TASKS.map(t => {
    const done = t.daily ? !taskReady(t) : S.tasks[t.id]; const ready = taskReady(t);
    const lbl = done ? (t.daily ? hm(S.lastDaily + 864e5 - Date.now()) : '✓') : ready ? (t.link ? 'Ochish' : 'Claim') : '…';
    const pr = t.prog && !done ? `<div class="prog"><i style="width:${clamp(t.prog() * 100, 0, 100)}%"></i></div>` : '';
    return `<div class="li task"><span class="ic2">${t.ic}</span><div><b>${t.n}</b><small>${t.d()}</small>${pr}</div><button class="go ${done ? 'done' : ''}" data-t="${t.id}" ${(!ready && !done) || (done && !t.daily) ? 'disabled' : ''}>${lbl}</button></div>`;
  }).join('');
}
ENTER.earn = renderTasks;
$('#taskList').onclick = e => {
  const b = e.target.closest('[data-t]'); if (!b) return; const t = TASKS.find(x => x.id === b.dataset.t); if (!taskReady(t)) return;
  if (t.link) { if (tg && tg.openTelegramLink) tg.openTelegramLink(t.link); else window.open(t.link); b.textContent = 'Checking…'; setTimeout(() => { S.tasks[t.id] = 1; setBal(t.r); toast(`+${g$(t.r)}`); renderTasks() }, 4000); return }
  if (t.daily) { S.lastDaily = Date.now(); const g = pick(BYPRICE.slice(0, 40)); addItem(g, g.p); setBal(t.r); showRes(true, g, 'Daily bonus! 🎁', `+${g$(t.r)} and ${esc(g.n)}`) }
  else { S.tasks[t.id] = 1; setBal(t.r); toast(`+${g$(t.r)}`); hapN('success') }
  save(); renderTasks();
};

// =====================================================================
//  DEPOSIT (demo) / TARIX / YORDAM
// =====================================================================
let depT = 'ton';
function openDeposit() { depRender(); openM('depM') }
function depRender() {
  $$('#depTabs button').forEach(b => b.classList.toggle('on', b.dataset.t === depT));
  const B = $('#depBody');
  if (depT === 'ton') B.innerHTML = `<p class="note">⚠️ Demo mode: buttons add demo TON to your balance.</p><div class="amts"><button data-add="1">+1</button><button data-add="5">+5</button><button data-add="20">+20</button><button data-add="50">+50</button><button data-add="100">+100</button><button data-add="500">+500</button></div>`;
  else if (depT === 'stars') B.innerHTML = `<p class="note">⭐ Telegram Stars (demo). 1 ⭐ ≈ 0.004 TON.</p><div class="amts"><button data-add="0.2">50 ⭐</button><button data-add="0.4">100 ⭐</button><button data-add="2">500 ⭐</button></div>`;
  else B.innerHTML = `<p class="note">🎁 Send Telegram gifts to our bot to deposit them. Demo: get a random gift.</p><button class="bigbtn p" id="depGift">Get demo gift</button>`;
  B.querySelectorAll('[data-add]').forEach(b => b.onclick = () => { setBal(+b.dataset.add); toast(`+${g$(+b.dataset.add)}`); hapN('success') });
  const dg = $('#depGift'); if (dg) dg.onclick = () => { const g = pick(BYPRICE.slice(0, 60)); addItem(g, g.p); toast(`🎁 ${esc(g.n)} added to Backpack`); closeM('depM') };
}
$$('#depTabs button').forEach(b => b.onclick = () => { depT = b.dataset.t; depRender() });
$('#resetBtn').onclick = () => { if (!confirm('Balance, gifts and history will be erased. Continue?')) return; localStorage.removeItem(CFG.STORAGE_KEY); location.reload() };
$('#hHist').onclick = () => {
  const l = S.hist.filter(h => cur === 'home' || !GAME_OF[cur] || h.game.startsWith(GAME_OF[cur]));
  info('Tarix', l.length ? l.slice(0, 50).map(h => `<div class="hrow"><div><b>${esc(h.game)}</b><small>${new Date(h.t).toLocaleString()} ${esc(h.note)}</small></div><span>${g$(h.bet)}</span><em class="${h.win > h.bet ? 'w' : h.win > 0 ? 'p' : 'l'}">${h.win > 0 ? '+' + fmt(h.win) : '−' + fmt(h.bet)}</em></div>`).join('') : '<div class="empty">No games yet</div>');
};
$('#hTop').onclick = () => go('leader');
$('#hAv').onclick = () => info(esc(ME), `<div class="helpb">Games: <b>${S.games}</b><br>Total wagered: <b>${fmt(S.wag)} TON</b><br>Net profit: <b>${fmt(S.won)} TON</b><br>Gifts: <b>${S.inv.length}</b></div>`);
const GAME_OF = { rocket: 'Rocket', pvp: 'PvP', tvt: 'TvT', mines: 'Mines', spins: 'Spins', plinko: 'Plinko', dice: 'Dice' };
const HELP = {
  rocket: '<b>Rocket</b> — the multiplier grows while the rocket flies. Press <b>Cash Out</b> before it explodes. Use Auto cashout to exit automatically.',
  tvt: '<b>TvT</b> — join Ice or Fire. The winning team splits the pot by share. The bigger the team pool, the higher its chance.',
  mines: '<b>Mines</b> — mines are hidden in 25 cells. Every safe cell raises the multiplier. Cash out any time; hit a mine and the bet is lost.',
  spins: '<b>Spins</b> — 25 gifts drop. Land 8+ of the same gift to win. <b>Double Chance</b> (+25%) boosts the win chance. <b>Buy Features</b> — 10 free spins, every win x10.',
  plinko: '<b>Plinko</b> — the ball bounces off the pins into a multiplier slot. Up to 1000x on Hard.',
  dice: '<b>Dice</b> — a number from 0 to 100 is rolled. Pick a target, Higher or Lower. Lower chance means a bigger multiplier.',
  def: '<b>RIKI</b> — Telegram NFT gift games.'
};
$('#hHelp').onclick = () => info('How to play', `<div class="helpb">${HELP[cur] || HELP.def}</div>`);

// =====================================================================
//  ENTER handlerlar va ishga tushirish
// =====================================================================
ENTER.rocket = () => rkRender(true);
ENTER.pvp = () => pvRender(true);
ENTER.pvphub = () => { pvHub(); $('#phLb').innerHTML = lbRender().split('<div class="lrow').slice(0, 5).join('<div class="lrow'); $('#lbEnds').textContent = 'Ends in ' + (7 - new Date().getDay()) + 'd' };
ENTER.tvt = () => { tvRender(true); if (TV.phase === 'wait') tvBallHome() };
ENTER.upgrade = upRender;
ENTER.mines = mRender;
ENTER.spins = () => { if (!SP.grid.length) { SP.grid = spRoll(); spDraw(false) } spUI() };
ENTER.plinko = () => { plSize(); plDraw() };
ENTER.dice = () => dcSync('t');
ENTER.crafts = crRender;
ENTER.cases = caseRender;
ENTER.market = () => { if (!MK.list.length) mkGen(); else mkRender() };
ENTER.backpack = bpRender;

bindBet('pv', 'pvAmt', () => pvRender());
bindBet('tv', 'tvAmt', () => {});
bindBet('mn', 'mBet', () => mRender());
bindBet('pl', 'plBet', () => { $('#plBtn').className = 'bigbtn' + (betVal('pl') > 0 ? ' ok' : '') });
bindBet('dc', 'dBet', () => dcSync('t'));

function loop(now) {
  rkTick(now); if (PLS.balls.length || cur === 'plinko') plStep(now);
  requestAnimationFrame(loop);
}
function slow() { pvTick(); tvTick() }

const first = load();
fillStatic(); renderBal(); rkStars(); upTicks();
$('#rkShip').innerHTML = `<span class="rkfl"></span><span class="rkg">${GI(byName('Stellar Rocket')).replace('loading="lazy"', '')}</span>`;
rkNew(); for (let i = 0; i < 6; i++) RK.hist.push(rkCrashPoint());
setInterval(slow, 250); setInterval(() => { if (cur === 'cases') caseRender(); if (cur === 'earn') renderTasks() }, 30000);
requestAnimationFrame(loop);
window.addEventListener('resize', () => { if (cur === 'plinko') { plSize(); plDraw() } });
if (first && CFG.START_BALANCE > 0) { $('#welV').textContent = CFG.START_BALANCE; openM('welM') }
if (START_PARAM.startsWith('ref_') && !S.refUsed && !CFG.API_URL && !/[?&]api=/.test(location.search)) { S.refUsed = START_PARAM; setBal(5); toast('Referral bonus: +5 TON') }
renderTasks(); save();
if (!CFG.API_URL && !/[?&]api=/.test(location.search)) loadLivePrices().then(ok => { if (ok) { mkGen(); toast('💎 Prices updated', 1500) } });   // server bilan ishlaganda narxlar serverdan (/api/catalog)
