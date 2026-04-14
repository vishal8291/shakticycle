/**
 * Indian Food & Nutrition Database
 * 100+ foods with Hindi names, nutrition per 100g, categories, and health tags
 */

const FOOD_CATEGORIES = ['grain', 'lentil', 'vegetable', 'fruit', 'dairy', 'spice', 'nut_seed', 'non_veg', 'snack', 'beverage']

const INDIAN_FOODS = [
  // ── Grains & Cereals ──
  { id: 'roti', name: 'Wheat Roti', hindi: 'रोटी', category: 'grain', veg: true, cal: 264, protein: 9.8, carbs: 50, fat: 3.6, fiber: 10.7, tags: ['staple', 'energy'], region: 'all' },
  { id: 'brown_rice', name: 'Brown Rice', hindi: 'ब्राउन चावल', category: 'grain', veg: true, cal: 216, protein: 5, carbs: 45, fat: 1.8, fiber: 3.5, tags: ['low-gi', 'fiber'], region: 'all' },
  { id: 'white_rice', name: 'White Rice (cooked)', hindi: 'सफ़ेद चावल', category: 'grain', veg: true, cal: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, tags: ['staple', 'energy'], region: 'all' },
  { id: 'bajra', name: 'Pearl Millet', hindi: 'बाजरा', category: 'grain', veg: true, cal: 361, protein: 11.6, carbs: 67, fat: 5, fiber: 11.3, tags: ['iron', 'gluten-free', 'millet'], region: 'rajasthan' },
  { id: 'jowar', name: 'Sorghum', hindi: 'ज्वार', category: 'grain', veg: true, cal: 349, protein: 10.4, carbs: 72.6, fat: 1.9, fiber: 9.7, tags: ['gluten-free', 'millet', 'fiber'], region: 'maharashtra' },
  { id: 'ragi', name: 'Finger Millet', hindi: 'रागी / नाचनी', category: 'grain', veg: true, cal: 328, protein: 7.3, carbs: 72, fat: 1.3, fiber: 11.5, tags: ['calcium', 'iron', 'millet', 'gluten-free'], region: 'karnataka' },
  { id: 'oats', name: 'Oats', hindi: 'जई', category: 'grain', veg: true, cal: 389, protein: 16.9, carbs: 66, fat: 6.9, fiber: 10.6, tags: ['fiber', 'cholesterol-friendly', 'heart'], region: 'all' },
  { id: 'poha', name: 'Flattened Rice', hindi: 'पोहा', category: 'grain', veg: true, cal: 346, protein: 6.6, carbs: 77, fat: 1.2, fiber: 2.4, tags: ['iron', 'light', 'breakfast'], region: 'maharashtra' },
  { id: 'quinoa', name: 'Quinoa', hindi: 'क्विनोआ', category: 'grain', veg: true, cal: 368, protein: 14.1, carbs: 64, fat: 6.1, fiber: 7, tags: ['protein', 'gluten-free', 'complete-protein'], region: 'all' },
  { id: 'daliya', name: 'Broken Wheat', hindi: 'दलिया', category: 'grain', veg: true, cal: 342, protein: 12.5, carbs: 63, fat: 1.7, fiber: 18, tags: ['fiber', 'low-gi', 'weight-loss'], region: 'north' },
  { id: 'makki', name: 'Cornmeal / Maize', hindi: 'मक्का', category: 'grain', veg: true, cal: 342, protein: 8.7, carbs: 73, fat: 3.4, fiber: 6.5, tags: ['gluten-free', 'winter'], region: 'punjab' },

  // ── Lentils & Legumes ──
  { id: 'moong_dal', name: 'Moong Dal', hindi: 'मूंग दाल', category: 'lentil', veg: true, cal: 347, protein: 24, carbs: 59, fat: 1.2, fiber: 16.3, tags: ['protein', 'easy-digest', 'low-gi'], region: 'all' },
  { id: 'toor_dal', name: 'Toor Dal (Arhar)', hindi: 'तूर / अरहर दाल', category: 'lentil', veg: true, cal: 343, protein: 22, carbs: 57, fat: 1.7, fiber: 15, tags: ['protein', 'iron', 'staple'], region: 'all' },
  { id: 'chana_dal', name: 'Chana Dal', hindi: 'चना दाल', category: 'lentil', veg: true, cal: 360, protein: 25, carbs: 60, fat: 3.3, fiber: 17, tags: ['protein', 'low-gi', 'fiber'], region: 'all' },
  { id: 'masoor_dal', name: 'Red Lentil', hindi: 'मसूर दाल', category: 'lentil', veg: true, cal: 352, protein: 25.4, carbs: 59.5, fat: 1.1, fiber: 10.7, tags: ['protein', 'iron', 'folate'], region: 'all' },
  { id: 'urad_dal', name: 'Black Gram', hindi: 'उड़द दाल', category: 'lentil', veg: true, cal: 341, protein: 25.2, carbs: 59.6, fat: 1.6, fiber: 18.3, tags: ['protein', 'iron', 'calcium'], region: 'all' },
  { id: 'rajma', name: 'Kidney Beans', hindi: 'राजमा', category: 'lentil', veg: true, cal: 333, protein: 23.6, carbs: 60.1, fat: 0.8, fiber: 24.9, tags: ['protein', 'fiber', 'iron'], region: 'punjab' },
  { id: 'chole', name: 'Chickpeas', hindi: 'छोले / चना', category: 'lentil', veg: true, cal: 364, protein: 19.3, carbs: 60.7, fat: 6, fiber: 17.4, tags: ['protein', 'fiber', 'iron', 'low-gi'], region: 'all' },
  { id: 'soybean', name: 'Soybean', hindi: 'सोयाबीन', category: 'lentil', veg: true, cal: 446, protein: 36.5, carbs: 30.2, fat: 19.9, fiber: 9.3, tags: ['protein', 'calcium', 'omega-3'], region: 'all' },
  { id: 'lobia', name: 'Black-eyed Peas', hindi: 'लोबिया', category: 'lentil', veg: true, cal: 336, protein: 23.5, carbs: 60.4, fat: 1.3, fiber: 10.6, tags: ['protein', 'folate', 'iron'], region: 'all' },

  // ── Vegetables ──
  { id: 'palak', name: 'Spinach', hindi: 'पालक', category: 'vegetable', veg: true, cal: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, tags: ['iron', 'calcium', 'vitamin-a', 'folate'], region: 'all' },
  { id: 'methi', name: 'Fenugreek Leaves', hindi: 'मेथी', category: 'vegetable', veg: true, cal: 49, protein: 4.4, carbs: 6, fat: 0.9, fiber: 4.2, tags: ['iron', 'diabetes-friendly', 'folate'], region: 'all' },
  { id: 'lauki', name: 'Bottle Gourd', hindi: 'लौकी', category: 'vegetable', veg: true, cal: 15, protein: 0.6, carbs: 3.4, fat: 0.1, fiber: 0.5, tags: ['low-cal', 'hydrating', 'weight-loss'], region: 'all' },
  { id: 'karela', name: 'Bitter Gourd', hindi: 'करेला', category: 'vegetable', veg: true, cal: 17, protein: 1, carbs: 3.7, fat: 0.2, fiber: 2.8, tags: ['diabetes-friendly', 'blood-sugar'], region: 'all' },
  { id: 'bhindi', name: 'Okra / Lady Finger', hindi: 'भिंडी', category: 'vegetable', veg: true, cal: 33, protein: 1.9, carbs: 7, fat: 0.2, fiber: 3.2, tags: ['fiber', 'folate', 'vitamin-c'], region: 'all' },
  { id: 'tamatar', name: 'Tomato', hindi: 'टमाटर', category: 'vegetable', veg: true, cal: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, tags: ['vitamin-c', 'antioxidant', 'lycopene'], region: 'all' },
  { id: 'pyaaz', name: 'Onion', hindi: 'प्याज़', category: 'vegetable', veg: true, cal: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7, tags: ['antioxidant', 'immunity'], region: 'all' },
  { id: 'lehsun', name: 'Garlic', hindi: 'लहसुन', category: 'vegetable', veg: true, cal: 149, protein: 6.4, carbs: 33, fat: 0.5, fiber: 2.1, tags: ['immunity', 'heart', 'anti-inflammatory'], region: 'all' },
  { id: 'adrak', name: 'Ginger', hindi: 'अदरक', category: 'vegetable', veg: true, cal: 80, protein: 1.8, carbs: 18, fat: 0.8, fiber: 2, tags: ['anti-inflammatory', 'digestion', 'immunity'], region: 'all' },
  { id: 'gajar', name: 'Carrot', hindi: 'गाजर', category: 'vegetable', veg: true, cal: 41, protein: 0.9, carbs: 10, fat: 0.2, fiber: 2.8, tags: ['vitamin-a', 'eye-health', 'antioxidant'], region: 'all' },
  { id: 'chukander', name: 'Beetroot', hindi: 'चुकंदर', category: 'vegetable', veg: true, cal: 43, protein: 1.6, carbs: 10, fat: 0.2, fiber: 2.8, tags: ['iron', 'folate', 'blood-pressure'], region: 'all' },
  { id: 'broccoli', name: 'Broccoli', hindi: 'ब्रोकली', category: 'vegetable', veg: true, cal: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, tags: ['vitamin-c', 'calcium', 'anti-cancer'], region: 'all' },
  { id: 'gobi', name: 'Cauliflower', hindi: 'गोभी', category: 'vegetable', veg: true, cal: 25, protein: 1.9, carbs: 5, fat: 0.3, fiber: 2, tags: ['vitamin-c', 'low-cal', 'fiber'], region: 'all' },
  { id: 'aloo', name: 'Potato', hindi: 'आलू', category: 'vegetable', veg: true, cal: 77, protein: 2, carbs: 17, fat: 0.1, fiber: 2.2, tags: ['energy', 'potassium', 'vitamin-c'], region: 'all' },
  { id: 'shakarkand', name: 'Sweet Potato', hindi: 'शकरकंद', category: 'vegetable', veg: true, cal: 86, protein: 1.6, carbs: 20, fat: 0.1, fiber: 3, tags: ['vitamin-a', 'fiber', 'low-gi', 'energy'], region: 'all' },
  { id: 'kaddu', name: 'Pumpkin', hindi: 'कद्दू', category: 'vegetable', veg: true, cal: 26, protein: 1, carbs: 6.5, fat: 0.1, fiber: 0.5, tags: ['vitamin-a', 'low-cal', 'immunity'], region: 'all' },
  { id: 'turai', name: 'Ridge Gourd', hindi: 'तुरई', category: 'vegetable', veg: true, cal: 20, protein: 1.2, carbs: 3.4, fat: 0.2, fiber: 2, tags: ['low-cal', 'diabetes-friendly', 'hydrating'], region: 'all' },
  { id: 'parwal', name: 'Pointed Gourd', hindi: 'परवल', category: 'vegetable', veg: true, cal: 20, protein: 2, carbs: 2.2, fat: 0.3, fiber: 3, tags: ['low-cal', 'diabetes-friendly', 'digestion'], region: 'east' },
  { id: 'drumstick', name: 'Drumstick / Moringa', hindi: 'सहजन', category: 'vegetable', veg: true, cal: 64, protein: 9.4, carbs: 8.3, fat: 1.4, fiber: 3.2, tags: ['calcium', 'iron', 'vitamin-c', 'superfood'], region: 'south' },
  { id: 'kachcha_kela', name: 'Raw Banana', hindi: 'कच्चा केला', category: 'vegetable', veg: true, cal: 89, protein: 1.3, carbs: 23, fat: 0.3, fiber: 2.6, tags: ['potassium', 'energy', 'gut-health'], region: 'south' },

  // ── Fruits ──
  { id: 'kela', name: 'Banana', hindi: 'केला', category: 'fruit', veg: true, cal: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, tags: ['potassium', 'energy', 'heart'], region: 'all' },
  { id: 'seb', name: 'Apple', hindi: 'सेब', category: 'fruit', veg: true, cal: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, tags: ['fiber', 'antioxidant', 'heart'], region: 'all' },
  { id: 'santara', name: 'Orange', hindi: 'संतरा', category: 'fruit', veg: true, cal: 47, protein: 0.9, carbs: 12, fat: 0.1, fiber: 2.4, tags: ['vitamin-c', 'immunity', 'antioxidant'], region: 'all' },
  { id: 'papita', name: 'Papaya', hindi: 'पपीता', category: 'fruit', veg: true, cal: 43, protein: 0.5, carbs: 11, fat: 0.3, fiber: 1.7, tags: ['vitamin-c', 'digestion', 'immunity'], region: 'all' },
  { id: 'amrud', name: 'Guava', hindi: 'अमरूद', category: 'fruit', veg: true, cal: 68, protein: 2.6, carbs: 14, fat: 1, fiber: 5.4, tags: ['vitamin-c', 'fiber', 'immunity', 'low-gi'], region: 'all' },
  { id: 'aam', name: 'Mango', hindi: 'आम', category: 'fruit', veg: true, cal: 60, protein: 0.8, carbs: 15, fat: 0.4, fiber: 1.6, tags: ['vitamin-a', 'vitamin-c', 'energy'], region: 'all' },
  { id: 'tarbooz', name: 'Watermelon', hindi: 'तरबूज', category: 'fruit', veg: true, cal: 30, protein: 0.6, carbs: 8, fat: 0.2, fiber: 0.4, tags: ['hydrating', 'low-cal', 'summer'], region: 'all' },
  { id: 'anaar', name: 'Pomegranate', hindi: 'अनार', category: 'fruit', veg: true, cal: 83, protein: 1.7, carbs: 19, fat: 1.2, fiber: 4, tags: ['antioxidant', 'iron', 'heart'], region: 'all' },
  { id: 'chiku', name: 'Sapodilla', hindi: 'चीकू', category: 'fruit', veg: true, cal: 83, protein: 0.4, carbs: 20, fat: 1.1, fiber: 5.3, tags: ['energy', 'fiber', 'iron'], region: 'all' },
  { id: 'jamun', name: 'Indian Blackberry', hindi: 'जामुन', category: 'fruit', veg: true, cal: 60, protein: 0.7, carbs: 14, fat: 0.2, fiber: 0.9, tags: ['diabetes-friendly', 'iron', 'antioxidant'], region: 'all' },
  { id: 'amla', name: 'Indian Gooseberry', hindi: 'आंवला', category: 'fruit', veg: true, cal: 44, protein: 0.9, carbs: 10, fat: 0.6, fiber: 4.3, tags: ['vitamin-c', 'immunity', 'superfood', 'hair'], region: 'all' },
  { id: 'nariyal', name: 'Coconut (fresh)', hindi: 'नारियल', category: 'fruit', veg: true, cal: 354, protein: 3.3, carbs: 15, fat: 33.5, fiber: 9, tags: ['energy', 'healthy-fat', 'mct'], region: 'south' },
  { id: 'sitaphal', name: 'Custard Apple', hindi: 'सीताफल', category: 'fruit', veg: true, cal: 94, protein: 2.1, carbs: 24, fat: 0.3, fiber: 4.4, tags: ['energy', 'vitamin-c', 'potassium'], region: 'all' },

  // ── Dairy ──
  { id: 'doodh', name: 'Whole Milk', hindi: 'दूध', category: 'dairy', veg: true, cal: 61, protein: 3.2, carbs: 4.8, fat: 3.3, fiber: 0, tags: ['calcium', 'protein', 'vitamin-d'], region: 'all' },
  { id: 'dahi', name: 'Curd / Yogurt', hindi: 'दही', category: 'dairy', veg: true, cal: 60, protein: 3.5, carbs: 4.7, fat: 3.3, fiber: 0, tags: ['probiotic', 'calcium', 'gut-health', 'protein'], region: 'all' },
  { id: 'chaach', name: 'Buttermilk', hindi: 'छाछ', category: 'dairy', veg: true, cal: 40, protein: 3.3, carbs: 4.8, fat: 0.9, fiber: 0, tags: ['probiotic', 'hydrating', 'digestion', 'low-cal'], region: 'all' },
  { id: 'paneer', name: 'Cottage Cheese', hindi: 'पनीर', category: 'dairy', veg: true, cal: 265, protein: 18.3, carbs: 1.2, fat: 20.8, fiber: 0, tags: ['protein', 'calcium', 'keto-friendly'], region: 'all' },
  { id: 'ghee', name: 'Clarified Butter', hindi: 'घी', category: 'dairy', veg: true, cal: 900, protein: 0, carbs: 0, fat: 100, fiber: 0, tags: ['healthy-fat', 'ayurvedic', 'energy', 'vitamin-a'], region: 'all' },
  { id: 'lassi', name: 'Lassi (sweet)', hindi: 'लस्सी', category: 'dairy', veg: true, cal: 72, protein: 3, carbs: 11, fat: 2, fiber: 0, tags: ['probiotic', 'calcium', 'hydrating'], region: 'punjab' },

  // ── Nuts & Seeds ──
  { id: 'badam', name: 'Almonds', hindi: 'बादाम', category: 'nut_seed', veg: true, cal: 579, protein: 21.2, carbs: 21.7, fat: 49.9, fiber: 12.5, tags: ['protein', 'vitamin-e', 'healthy-fat', 'brain'], region: 'all' },
  { id: 'akhrot', name: 'Walnuts', hindi: 'अखरोट', category: 'nut_seed', veg: true, cal: 654, protein: 15.2, carbs: 13.7, fat: 65.2, fiber: 6.7, tags: ['omega-3', 'brain', 'heart'], region: 'all' },
  { id: 'kaju', name: 'Cashews', hindi: 'काजू', category: 'nut_seed', veg: true, cal: 553, protein: 18.2, carbs: 30.2, fat: 43.8, fiber: 3.3, tags: ['magnesium', 'zinc', 'energy'], region: 'all' },
  { id: 'mungfali', name: 'Peanuts', hindi: 'मूंगफली', category: 'nut_seed', veg: true, cal: 567, protein: 25.8, carbs: 16.1, fat: 49.2, fiber: 8.5, tags: ['protein', 'affordable', 'energy'], region: 'all' },
  { id: 'alsi', name: 'Flaxseeds', hindi: 'अलसी', category: 'nut_seed', veg: true, cal: 534, protein: 18.3, carbs: 28.9, fat: 42.2, fiber: 27.3, tags: ['omega-3', 'fiber', 'heart', 'thyroid'], region: 'all' },
  { id: 'chia', name: 'Chia Seeds', hindi: 'चिया बीज', category: 'nut_seed', veg: true, cal: 486, protein: 16.5, carbs: 42.1, fat: 30.7, fiber: 34.4, tags: ['omega-3', 'fiber', 'calcium', 'weight-loss'], region: 'all' },
  { id: 'til', name: 'Sesame Seeds', hindi: 'तिल', category: 'nut_seed', veg: true, cal: 573, protein: 17.7, carbs: 23.5, fat: 49.7, fiber: 11.8, tags: ['calcium', 'iron', 'bone-health'], region: 'all' },
  { id: 'kalonji', name: 'Nigella Seeds', hindi: 'कलौंजी', category: 'nut_seed', veg: true, cal: 345, protein: 16, carbs: 52, fat: 14.5, fiber: 40, tags: ['immunity', 'anti-inflammatory', 'traditional'], region: 'all' },

  // ── Spices & Herbs ──
  { id: 'haldi', name: 'Turmeric', hindi: 'हल्दी', category: 'spice', veg: true, cal: 354, protein: 7.8, carbs: 65, fat: 9.9, fiber: 21.1, tags: ['anti-inflammatory', 'immunity', 'superfood'], region: 'all' },
  { id: 'jeera', name: 'Cumin', hindi: 'जीरा', category: 'spice', veg: true, cal: 375, protein: 17.8, carbs: 44.2, fat: 22.3, fiber: 10.5, tags: ['digestion', 'iron', 'metabolism'], region: 'all' },
  { id: 'dalchini', name: 'Cinnamon', hindi: 'दालचीनी', category: 'spice', veg: true, cal: 247, protein: 4, carbs: 81, fat: 1.2, fiber: 53.1, tags: ['blood-sugar', 'anti-inflammatory', 'antioxidant'], region: 'all' },
  { id: 'elaichi', name: 'Cardamom', hindi: 'इलायची', category: 'spice', veg: true, cal: 311, protein: 10.8, carbs: 68, fat: 6.7, fiber: 28, tags: ['digestion', 'breath-freshener', 'antioxidant'], region: 'all' },
  { id: 'ajwain', name: 'Carom Seeds', hindi: 'अजवाइन', category: 'spice', veg: true, cal: 305, protein: 16, carbs: 43, fat: 25, fiber: 21.2, tags: ['digestion', 'acidity', 'gas-relief'], region: 'all' },
  { id: 'methi_dana', name: 'Fenugreek Seeds', hindi: 'मेथी दाना', category: 'spice', veg: true, cal: 323, protein: 23, carbs: 58.4, fat: 6.4, fiber: 24.6, tags: ['diabetes-friendly', 'lactation', 'blood-sugar'], region: 'all' },

  // ── Non-Veg ──
  { id: 'chicken_breast', name: 'Chicken Breast', hindi: 'चिकन ब्रेस्ट', category: 'non_veg', veg: false, cal: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, tags: ['protein', 'lean', 'muscle-building'], region: 'all' },
  { id: 'egg', name: 'Egg (whole, boiled)', hindi: 'अंडा', category: 'non_veg', veg: false, cal: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, tags: ['protein', 'vitamin-d', 'b12', 'complete-protein'], region: 'all' },
  { id: 'fish_rohu', name: 'Rohu Fish', hindi: 'रोहू मछली', category: 'non_veg', veg: false, cal: 97, protein: 16.6, carbs: 0, fat: 3.4, fiber: 0, tags: ['protein', 'omega-3', 'heart'], region: 'east' },
  { id: 'mutton', name: 'Goat Meat (lean)', hindi: 'मटन', category: 'non_veg', veg: false, cal: 143, protein: 27, carbs: 0, fat: 3.0, fiber: 0, tags: ['protein', 'iron', 'b12', 'zinc'], region: 'all' },
  { id: 'pomfret', name: 'Pomfret Fish', hindi: 'पापलेट', category: 'non_veg', veg: false, cal: 96, protein: 18.5, carbs: 0, fat: 2.4, fiber: 0, tags: ['protein', 'omega-3', 'low-cal'], region: 'west' },
  { id: 'prawns', name: 'Prawns / Shrimp', hindi: 'झींगा', category: 'non_veg', veg: false, cal: 99, protein: 24, carbs: 0.2, fat: 0.3, fiber: 0, tags: ['protein', 'iodine', 'selenium', 'low-cal'], region: 'coastal' },

  // ── Snacks & Prepared ──
  { id: 'idli', name: 'Idli', hindi: 'इडली', category: 'snack', veg: true, cal: 58, protein: 2, carbs: 12, fat: 0.4, fiber: 0.6, tags: ['fermented', 'light', 'probiotic', 'breakfast'], region: 'south' },
  { id: 'dosa', name: 'Plain Dosa', hindi: 'डोसा', category: 'snack', veg: true, cal: 168, protein: 3.9, carbs: 27, fat: 5.2, fiber: 0.7, tags: ['fermented', 'breakfast', 'energy'], region: 'south' },
  { id: 'upma', name: 'Upma', hindi: 'उपमा', category: 'snack', veg: true, cal: 145, protein: 3, carbs: 22, fat: 5, fiber: 1, tags: ['breakfast', 'light', 'south-indian'], region: 'south' },
  { id: 'dhokla', name: 'Dhokla', hindi: 'ढोकला', category: 'snack', veg: true, cal: 160, protein: 7, carbs: 25, fat: 3, fiber: 1.5, tags: ['fermented', 'steamed', 'low-fat', 'protein'], region: 'gujarat' },
  { id: 'sprouts', name: 'Mixed Sprouts', hindi: 'अंकुरित अनाज', category: 'snack', veg: true, cal: 100, protein: 7, carbs: 15, fat: 0.5, fiber: 4, tags: ['protein', 'vitamin-c', 'low-cal', 'immunity'], region: 'all' },
  { id: 'khichdi', name: 'Khichdi', hindi: 'खिचड़ी', category: 'snack', veg: true, cal: 130, protein: 5, carbs: 22, fat: 2.5, fiber: 2, tags: ['comfort', 'easy-digest', 'complete-meal', 'ayurvedic'], region: 'all' },
  { id: 'thepla', name: 'Thepla', hindi: 'थेपला', category: 'snack', veg: true, cal: 200, protein: 5, carbs: 28, fat: 8, fiber: 3, tags: ['travel-friendly', 'methi', 'gujarati'], region: 'gujarat' },
  { id: 'sabudana_khichdi', name: 'Sabudana Khichdi', hindi: 'साबूदाना खिचड़ी', category: 'snack', veg: true, cal: 180, protein: 3, carbs: 32, fat: 5, fiber: 1, tags: ['energy', 'fasting', 'gluten-free'], region: 'maharashtra' },

  // ── Beverages ──
  { id: 'haldi_doodh', name: 'Turmeric Milk', hindi: 'हल्दी दूध', category: 'beverage', veg: true, cal: 80, protein: 3.5, carbs: 7, fat: 4, fiber: 0, tags: ['immunity', 'anti-inflammatory', 'sleep', 'ayurvedic'], region: 'all' },
  { id: 'green_tea', name: 'Green Tea', hindi: 'ग्रीन टी', category: 'beverage', veg: true, cal: 1, protein: 0, carbs: 0.2, fat: 0, fiber: 0, tags: ['antioxidant', 'metabolism', 'weight-loss', 'calm'], region: 'all' },
  { id: 'nimbu_pani', name: 'Lemon Water', hindi: 'नींबू पानी', category: 'beverage', veg: true, cal: 12, protein: 0.1, carbs: 3, fat: 0, fiber: 0, tags: ['vitamin-c', 'hydrating', 'digestion', 'detox'], region: 'all' },
  { id: 'coconut_water', name: 'Coconut Water', hindi: 'नारियल पानी', category: 'beverage', veg: true, cal: 19, protein: 0.7, carbs: 3.7, fat: 0.2, fiber: 1.1, tags: ['electrolytes', 'hydrating', 'potassium'], region: 'all' },
  { id: 'jaljeera', name: 'Jaljeera', hindi: 'जलजीरा', category: 'beverage', veg: true, cal: 20, protein: 0.5, carbs: 4, fat: 0.2, fiber: 0.5, tags: ['digestion', 'hydrating', 'summer', 'cooling'], region: 'north' },
  { id: 'aam_panna', name: 'Aam Panna', hindi: 'आम पन्ना', category: 'beverage', veg: true, cal: 55, protein: 0.3, carbs: 14, fat: 0.1, fiber: 0.5, tags: ['hydrating', 'summer', 'vitamin-c', 'heat-stroke'], region: 'all' },
]

/**
 * Condition-specific food recommendations
 * For each health condition, lists recommended foods, foods to avoid, and tips
 */
const CONDITION_FOODS = {
  diabetes: {
    label: 'Diabetes / Blood Sugar Control',
    recommended: ['karela', 'methi', 'moong_dal', 'brown_rice', 'daliya', 'jowar', 'bajra', 'ragi', 'palak', 'chana_dal', 'jamun', 'amrud', 'dahi', 'alsi', 'methi_dana', 'dalchini', 'turai', 'lauki', 'green_tea'],
    avoid: ['white_rice', 'aloo', 'aam', 'kela', 'chiku', 'lassi', 'sabudana_khichdi'],
    tips: [
      'Prefer whole grains over refined (brown rice, millets instead of white rice/maida)',
      'Include bitter gourd (karela) juice or sabzi 2-3 times/week',
      'Soak 1 tsp methi dana overnight and drink on empty stomach',
      'Use cinnamon (dalchini) in tea or food — helps insulin sensitivity',
      'Eat jamun (Indian blackberry) in season — seeds can be dried and powdered',
      'Pair carbs with protein/fat to lower glycemic impact',
      'Eat frequent small meals, avoid skipping meals'
    ]
  },
  hypertension: {
    label: 'High Blood Pressure',
    recommended: ['kela', 'palak', 'chukander', 'lauki', 'dahi', 'coconut_water', 'lehsun', 'alsi', 'akhrot', 'nimbu_pani', 'amla', 'turai', 'bajra', 'ragi'],
    avoid: ['ghee', 'paneer', 'mutton', 'lassi'],
    tips: [
      'Reduce salt intake to <5g/day — use herbs and lemon for flavor',
      'Eat potassium-rich foods daily (banana, coconut water, spinach)',
      'Drink beetroot (chukander) juice — shown to lower BP naturally',
      'Include garlic (2 raw cloves on empty stomach or in cooking)',
      'Practice the DASH diet approach: more fruits, veggies, whole grains',
      'Limit pickles (achaar), papad, processed foods',
      'Flaxseed (alsi) powder — 1 tbsp daily in rotis or smoothies'
    ]
  },
  anemia: {
    label: 'Anemia / Iron Deficiency',
    recommended: ['palak', 'chukander', 'methi', 'masoor_dal', 'rajma', 'bajra', 'ragi', 'poha', 'anaar', 'amla', 'til', 'drumstick', 'egg', 'mutton', 'jaggery'],
    avoid: [],
    tips: [
      'Eat iron-rich foods with Vitamin C (lemon on dal, amla daily) for better absorption',
      'Avoid tea/coffee 1 hour before and after iron-rich meals',
      'Cook in iron kadhai/tawa — increases iron content of food',
      'Eat soaked poha — it\'s iron-fortified in India',
      'Include beetroot + pomegranate juice regularly',
      'Jaggery (gud) instead of sugar adds iron to your diet',
      'Ragi/nachni is excellent — very high in calcium + iron'
    ]
  },
  cholesterol: {
    label: 'High Cholesterol',
    recommended: ['oats', 'alsi', 'akhrot', 'fish_rohu', 'palak', 'methi', 'lehsun', 'moong_dal', 'amla', 'green_tea', 'chia', 'jowar', 'chana_dal', 'seb'],
    avoid: ['ghee', 'paneer', 'mutton', 'egg', 'kaju', 'nariyal'],
    tips: [
      'Eat oats daily — beta-glucan fiber directly lowers LDL cholesterol',
      'Ground flaxseed (alsi) — 2 tbsp daily in rotis, dahi, or smoothies',
      'Include walnuts (4-5 daily) for omega-3 fatty acids',
      'Garlic (lehsun) — 2 raw cloves daily before breakfast',
      'Switch from regular oil to mustard oil or olive oil',
      'Include soluble fiber: oats, barley, moong dal, fruits with skin',
      'Amla — 1 daily or amla juice helps reduce cholesterol'
    ]
  },
  weight_loss: {
    label: 'Weight Loss',
    recommended: ['moong_dal', 'lauki', 'karela', 'palak', 'turai', 'dahi', 'chaach', 'green_tea', 'nimbu_pani', 'sprouts', 'daliya', 'jowar', 'ragi', 'egg', 'chicken_breast', 'chia', 'amrud', 'papita', 'idli'],
    avoid: ['white_rice', 'aloo', 'ghee', 'kaju', 'lassi', 'aam', 'chiku', 'nariyal', 'sabudana_khichdi'],
    tips: [
      'Start day with warm lemon water + 1 tsp honey',
      'Replace white rice with millets (jowar/bajra/ragi roti)',
      'Eat protein in every meal — dal, sprouts, egg, chicken, paneer',
      'Drink chaach (buttermilk) with lunch instead of lassi or juice',
      'Use lauki, turai, palak for low-calorie filling sabzis',
      'Evening snack: sprouts chaat, roasted chana, or fruits (not juice)',
      'No eating after 8 PM, sleep by 10:30 PM',
      'Walk 10,000 steps daily + 30 min exercise'
    ]
  },
  thyroid: {
    label: 'Thyroid Health',
    recommended: ['dahi', 'egg', 'fish_rohu', 'kela', 'badam', 'til', 'coconut_water', 'brown_rice', 'moong_dal', 'drumstick'],
    avoid: ['soybean', 'gobi', 'broccoli'],
    tips: [
      'Take thyroid medicine on empty stomach — wait 30-60 min before food',
      'Limit raw cruciferous vegetables (gobi, broccoli) — cooking reduces goitrogens',
      'Avoid soy products if you have hypothyroidism',
      'Include selenium-rich foods: eggs, fish, mushrooms, sunflower seeds',
      'Iodized salt is essential — don\'t use non-iodized/rock salt exclusively',
      'Brazil nuts are excellent for selenium (2 per day)',
      'Coconut oil may support thyroid function — use in cooking'
    ]
  },
  immunity: {
    label: 'Immunity Boosting',
    recommended: ['haldi', 'haldi_doodh', 'amla', 'lehsun', 'adrak', 'santara', 'amrud', 'palak', 'dahi', 'green_tea', 'kalonji', 'til', 'drumstick', 'nimbu_pani', 'sprouts'],
    avoid: [],
    tips: [
      'Golden milk (haldi doodh) before bed — turmeric + black pepper + milk',
      'Chew raw amla or drink amla juice daily — richest Vitamin C source',
      'Include ginger-garlic in daily cooking',
      'Eat seasonal fruits — guava in winter, citrus fruits year-round',
      'Curd (dahi) daily for gut health — 70% of immunity is in the gut',
      'Kadha recipe: boil tulsi, ginger, dalchini, black pepper, honey',
      'Include sprouted moong/chana for zinc and Vitamin C'
    ]
  },
  pregnancy: {
    label: 'Pregnancy Nutrition',
    recommended: ['palak', 'methi', 'masoor_dal', 'doodh', 'dahi', 'egg', 'kela', 'anaar', 'badam', 'akhrot', 'ragi', 'drumstick', 'shakarkand', 'til', 'amla'],
    avoid: ['papita', 'aam', 'nariyal'],
    tips: [
      'First trimester: focus on folic acid — palak, masoor dal, methi, citrus fruits',
      'Second trimester: increase protein + calcium — milk, dahi, paneer, dal',
      'Third trimester: iron + DHA — leafy greens, fish (well-cooked), walnuts',
      'Eat ragi preparations for calcium (ragi dosa, ragi porridge)',
      'Soaked almonds (6-8 daily) for brain development of baby',
      'Avoid raw papaya (has papain enzyme that may cause contractions)',
      'Stay hydrated — coconut water, nimbu pani, buttermilk',
      'Small frequent meals to manage nausea and heartburn'
    ]
  }
}

/**
 * Sample Indian meal plans for different health goals
 */
const MEAL_PLANS = {
  balanced: {
    label: 'Balanced Indian Diet',
    meals: {
      early_morning: '1 glass warm water + soaked almonds (5-6) + 1 walnut',
      breakfast: 'Moong dal chilla with mint chutney + 1 glass milk OR Ragi dosa with sambar + 1 fruit',
      mid_morning: 'Seasonal fruit (guava/apple/papaya) + green tea',
      lunch: '2 jowar/bajra rotis + 1 katori dal + sabzi (palak/gobi/turai) + salad + dahi',
      evening_snack: 'Sprouts chaat OR roasted chana + nimbu pani',
      dinner: '1 roti + 1 katori dal/khichdi + light sabzi (lauki/turai) + salad',
      bedtime: 'Haldi doodh (turmeric milk)'
    }
  },
  diabetes_friendly: {
    label: 'Diabetes-Friendly Diet',
    meals: {
      early_morning: 'Methi dana soaked water + 5 soaked almonds',
      breakfast: 'Besan chilla with veggies + mint chutney OR Moong dal idli + sambar (no sugar)',
      mid_morning: 'Guava / Jamun / Apple (low GI fruit) + green tea with dalchini',
      lunch: '1.5 bajra/jowar roti + karela sabzi / palak dal + mixed salad + chaach',
      evening_snack: 'Roasted makhana + cucumber slices + green tea',
      dinner: '1 roti + moong dal + bottle gourd sabzi + salad',
      bedtime: 'Cinnamon water OR methi tea'
    }
  },
  weight_loss_plan: {
    label: 'Weight Loss Diet',
    meals: {
      early_morning: 'Warm water + lemon + 1 tsp honey + 5 soaked almonds',
      breakfast: 'Vegetable daliya / oats upma + green tea OR 2 egg whites + 1 multigrain roti',
      mid_morning: 'Buttermilk / coconut water + seasonal fruit',
      lunch: '1 jowar/ragi roti + dal + large plate salad + light sabzi + dahi',
      evening_snack: 'Sprouts salad OR roasted chana (25g) + green tea',
      dinner: '1 small roti + grilled chicken/paneer tikka + soup + salad (before 7:30 PM)',
      bedtime: 'Haldi doodh (low-fat milk)'
    }
  },
  heart_healthy: {
    label: 'Heart-Healthy Diet',
    meals: {
      early_morning: '2 raw garlic cloves + warm water + soaked walnuts (4-5)',
      breakfast: 'Oats porridge with flaxseed + fruits OR Ragi dosa + sambar',
      mid_morning: 'Pomegranate / Orange + green tea',
      lunch: '2 multigrain rotis + palak dal + sabzi (no cream) + salad + chaach',
      evening_snack: 'Walnuts + almonds (handful) + beetroot juice',
      dinner: '1 roti + grilled fish / moong dal + lauki sabzi + salad',
      bedtime: 'Warm water with dalchini'
    }
  },
  pregnancy_plan: {
    label: 'Pregnancy Nutrition Plan',
    meals: {
      early_morning: '1 glass milk + soaked almonds (6-8) + 1 walnut + 2 dates',
      breakfast: 'Ragi porridge / Paneer paratha + fruit + milk',
      mid_morning: 'Amla juice + seasonal fruit + handful of dry fruits',
      lunch: '2 rotis + dal (masoor/toor) + palak/methi sabzi + dahi + salad',
      evening_snack: 'Sprouts chaat + coconut water + til laddu (1-2)',
      dinner: '1 roti + khichdi + drumstick sabzi + buttermilk',
      bedtime: 'Haldi doodh with a pinch of saffron'
    }
  }
}

/**
 * Get foods for a specific condition
 */
function getFoodsForCondition(condition) {
  const condData = CONDITION_FOODS[condition]
  if (!condData) return null
  return {
    ...condData,
    recommendedFoods: condData.recommended.map(id => INDIAN_FOODS.find(f => f.id === id)).filter(Boolean),
    avoidFoods: condData.avoid.map(id => INDIAN_FOODS.find(f => f.id === id)).filter(Boolean),
  }
}

/**
 * Search foods by name, hindi name, or tags
 */
function searchFoods(query) {
  const q = (query || '').toLowerCase().trim()
  if (!q) return INDIAN_FOODS.slice(0, 20)
  return INDIAN_FOODS.filter(f =>
    f.name.toLowerCase().includes(q) ||
    f.hindi.includes(q) ||
    f.id.includes(q) ||
    f.tags.some(t => t.includes(q)) ||
    f.category.includes(q)
  )
}

/**
 * Get foods by category
 */
function getFoodsByCategory(category) {
  return INDIAN_FOODS.filter(f => f.category === category)
}

/**
 * Get a meal plan by key
 */
function getMealPlan(key) {
  return MEAL_PLANS[key] || MEAL_PLANS.balanced
}

export {
  INDIAN_FOODS,
  FOOD_CATEGORIES,
  CONDITION_FOODS,
  MEAL_PLANS,
  getFoodsForCondition,
  searchFoods,
  getFoodsByCategory,
  getMealPlan,
}
