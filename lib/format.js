// Bangladesh-first money & locale helpers.
// All prices in the catalog are stored as plain numbers in BDT.

export const CURRENCY = "BDT";
export const CURRENCY_SYMBOL = "৳";

export function formatMoney(amount, opts = {}) {
  const n = Number(amount) || 0;
  const { decimals = 0, symbol = true } = opts;
  const formatted = n.toLocaleString("en-BD", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return symbol ? `${CURRENCY_SYMBOL}${formatted}` : formatted;
}

// Bangladesh divisions (used as the "State / Region" equivalent on shipping forms).
export const BD_DIVISIONS = [
  "Dhaka",
  "Chattogram",
  "Khulna",
  "Rajshahi",
  "Barishal",
  "Sylhet",
  "Rangpur",
  "Mymensingh",
];

// Districts grouped by division. Used to cascade the City select on address
// forms so customers only see relevant options for their division.
export const BD_DISTRICTS = {
  Dhaka: [
    "Dhaka", "Faridpur", "Gazipur", "Gopalganj", "Kishoreganj", "Madaripur",
    "Manikganj", "Munshiganj", "Narayanganj", "Narsingdi", "Rajbari",
    "Shariatpur", "Tangail",
  ],
  Chattogram: [
    "Bandarban", "Brahmanbaria", "Chandpur", "Chattogram", "Comilla",
    "Cox's Bazar", "Feni", "Khagrachhari", "Lakshmipur", "Noakhali",
    "Rangamati",
  ],
  Khulna: [
    "Bagerhat", "Chuadanga", "Jashore", "Jhenaidah", "Khulna", "Kushtia",
    "Magura", "Meherpur", "Narail", "Satkhira",
  ],
  Rajshahi: [
    "Bogura", "Chapainawabganj", "Joypurhat", "Naogaon", "Natore", "Pabna",
    "Rajshahi", "Sirajganj",
  ],
  Barishal: [
    "Barguna", "Barishal", "Bhola", "Jhalokati", "Patuakhali", "Pirojpur",
  ],
  Sylhet: [
    "Habiganj", "Moulvibazar", "Sunamganj", "Sylhet",
  ],
  Rangpur: [
    "Dinajpur", "Gaibandha", "Kurigram", "Lalmonirhat", "Nilphamari",
    "Panchagarh", "Rangpur", "Thakurgaon",
  ],
  Mymensingh: [
    "Jamalpur", "Mymensingh", "Netrokona", "Sherpur",
  ],
};

export function getDistrictsForDivision(division) {
  return BD_DISTRICTS[division] || [];
}

// Thanas / upazilas grouped by district. Used as the 3rd-level cascade on
// shipping addresses: Division → District → Area.
//
// Urban-heavy districts (Dhaka, Chattogram, Khulna, Rajshahi, Sylhet, Barishal,
// Rangpur, Mymensingh) include their metropolitan police thanas at the start
// of the list, followed by surrounding upazilas. Rural districts only have
// upazilas. The "Other / not listed" option in the UI lets users type in a
// village or area that isn't enumerated here.
export const BD_THANAS = {
  // ── Dhaka Division ──────────────────────────────────────────────────────
  Dhaka: [
    // DMP city thanas (Dhaka metro)
    "Adabar", "Airport", "Badda", "Bangshal", "Bhasantek", "Bhatara",
    "Cantonment", "Chawk Bazar", "Dakshinkhan", "Darus Salam", "Demra",
    "Dhanmondi", "Gendaria", "Gulshan", "Hatirjheel", "Hazaribagh",
    "Jatrabari", "Kafrul", "Kalabagan", "Kamrangirchar", "Khilgaon",
    "Khilkhet", "Kotwali (Dhaka)", "Lalbagh", "Mirpur Model", "Mohammadpur",
    "Motijheel", "Mugda", "New Market", "Pallabi", "Paltan", "Ramna",
    "Rampura", "Rupnagar", "Sabujbagh", "Shah Ali", "Shahbagh",
    "Sher-e-Bangla Nagar", "Shyampur", "Sutrapur", "Tejgaon",
    "Tejgaon Industrial Area", "Turag", "Uttar Khan", "Uttara East",
    "Uttara West", "Vatara", "Wari",
    // Outskirt upazilas of Dhaka district
    "Savar", "Dhamrai", "Keraniganj", "Nawabganj", "Dohar",
  ],
  Faridpur: ["Faridpur Sadar", "Alfadanga", "Bhanga", "Boalmari", "Charbhadrasan", "Madhukhali", "Nagarkanda", "Sadarpur", "Saltha"],
  Gazipur: ["Gazipur Sadar", "Kaliakair", "Kaliganj", "Kapasia", "Sreepur", "Tongi"],
  Gopalganj: ["Gopalganj Sadar", "Kashiani", "Kotalipara", "Muksudpur", "Tungipara"],
  Kishoreganj: ["Kishoreganj Sadar", "Austagram", "Bajitpur", "Bhairab", "Hossainpur", "Itna", "Karimganj", "Katiadi", "Kuliarchar", "Mithamain", "Nikli", "Pakundia", "Tarail"],
  Madaripur: ["Madaripur Sadar", "Kalkini", "Rajoir", "Shibchar"],
  Manikganj: ["Manikganj Sadar", "Daulatpur", "Ghior", "Harirampur", "Saturia", "Shibalaya", "Singair"],
  Munshiganj: ["Munshiganj Sadar", "Gazaria", "Lohajang", "Sirajdikhan", "Sreenagar", "Tongibari"],
  Narayanganj: ["Narayanganj Sadar", "Araihazar", "Bandar (Narayanganj)", "Fatullah", "Rupganj", "Siddhirganj", "Sonargaon"],
  Narsingdi: ["Narsingdi Sadar", "Belabo", "Monohardi", "Palash", "Raipura", "Shibpur"],
  Rajbari: ["Rajbari Sadar", "Baliakandi", "Goalanda", "Kalukhali", "Pangsha"],
  Shariatpur: ["Shariatpur Sadar", "Bhedarganj", "Damudya", "Gosairhat", "Naria", "Zajira"],
  Tangail: ["Tangail Sadar", "Basail", "Bhuapur", "Delduar", "Dhanbari", "Ghatail", "Gopalpur", "Kalihati", "Madhupur", "Mirzapur", "Nagarpur", "Sakhipur"],

  // ── Chattogram Division ─────────────────────────────────────────────────
  Chattogram: [
    // CMP city thanas (Chittagong metro)
    "Akbarshah", "Bakalia", "Bandar (Chattogram)", "Bayazid", "Chandgaon",
    "Chawkbazar (Chattogram)", "Double Mooring", "EPZ", "Halishahar",
    "Karnaphuli", "Khulshi", "Kotwali (Chattogram)", "Pahartali",
    "Panchlaish", "Patenga", "Sadarghat (Chattogram)",
    // Outskirt upazilas of Chattogram district
    "Anwara", "Banshkhali", "Boalkhali", "Chandanaish", "Fatikchhari",
    "Hathazari", "Lohagara (Chattogram)", "Mirsharai", "Patiya", "Rangunia",
    "Raozan", "Sandwip", "Satkania", "Sitakunda",
  ],
  Bandarban: ["Bandarban Sadar", "Alikadam", "Lama", "Naikhongchhari", "Rowangchhari", "Ruma", "Thanchi"],
  Brahmanbaria: ["Brahmanbaria Sadar", "Akhaura", "Ashuganj", "Bancharampur", "Bijoynagar", "Kasba", "Nabinagar", "Nasirnagar", "Sarail"],
  Chandpur: ["Chandpur Sadar", "Faridganj", "Haimchar", "Haziganj", "Kachua (Chandpur)", "Matlab Dakshin", "Matlab Uttar", "Shahrasti"],
  Comilla: ["Comilla Sadar", "Comilla Sadar Dakshin", "Barura", "Brahmanpara", "Burichang", "Chandina", "Chauddagram", "Daudkandi", "Debidwar", "Homna", "Laksam", "Lalmai", "Manoharganj", "Meghna", "Muradnagar", "Nangalkot", "Titas"],
  "Cox's Bazar": ["Cox's Bazar Sadar", "Chakaria", "Kutubdia", "Maheshkhali", "Pekua", "Ramu", "Teknaf", "Ukhia"],
  Feni: ["Feni Sadar", "Chhagalnaiya", "Daganbhuiyan", "Fulgazi", "Parshuram", "Sonagazi"],
  Khagrachhari: ["Khagrachhari Sadar", "Dighinala", "Lakshmichhari", "Mahalchhari", "Manikchhari", "Matiranga", "Panchhari", "Ramgarh"],
  Lakshmipur: ["Lakshmipur Sadar", "Kamalnagar", "Raipur (Lakshmipur)", "Ramganj", "Ramgati"],
  Noakhali: ["Noakhali Sadar", "Begumganj", "Chatkhil", "Companiganj (Noakhali)", "Hatiya", "Kabirhat", "Senbagh", "Sonaimuri", "Subarnachar"],
  Rangamati: ["Rangamati Sadar", "Baghaichhari", "Barkal", "Belaichhari", "Juraichhari", "Kaptai", "Kawkhali (Rangamati)", "Langadu", "Naniarchar", "Rajasthali"],

  // ── Khulna Division ─────────────────────────────────────────────────────
  Bagerhat: ["Bagerhat Sadar", "Chitalmari", "Fakirhat", "Kachua (Bagerhat)", "Mollahat", "Mongla", "Morrelganj", "Rampal", "Sarankhola"],
  Chuadanga: ["Chuadanga Sadar", "Alamdanga", "Damurhuda", "Jibannagar"],
  Jashore: ["Jashore Sadar", "Abhaynagar", "Bagherpara", "Chaugachha", "Jhikargachha", "Keshabpur", "Manirampur", "Sharsha"],
  Jhenaidah: ["Jhenaidah Sadar", "Harinakunda", "Kaliganj (Jhenaidah)", "Kotchandpur", "Maheshpur", "Shailkupa"],
  Khulna: [
    // KMP city thanas (Khulna metro)
    "Khulna Sadar", "Sonadanga", "Khalishpur", "Daulatpur (Khulna)",
    "Khan Jahan Ali", "Kotwali (Khulna)", "Aronghata", "Harintana",
    "Labanchara",
    // Outskirt upazilas
    "Batiaghata", "Dacope", "Dighalia", "Dumuria", "Koyra",
    "Paikgachha", "Phultala", "Rupsha", "Terokhada",
  ],
  Kushtia: ["Kushtia Sadar", "Bheramara", "Daulatpur (Kushtia)", "Khoksa", "Kumarkhali", "Mirpur (Kushtia)"],
  Magura: ["Magura Sadar", "Mohammadpur (Magura)", "Shalikha", "Sreepur (Magura)"],
  Meherpur: ["Meherpur Sadar", "Gangni", "Mujibnagar"],
  Narail: ["Narail Sadar", "Kalia", "Lohagara (Narail)"],
  Satkhira: ["Satkhira Sadar", "Assasuni", "Debhata", "Kalaroa", "Kaliganj (Satkhira)", "Shyamnagar", "Tala"],

  // ── Rajshahi Division ───────────────────────────────────────────────────
  Bogura: ["Bogura Sadar", "Adamdighi", "Dhunat", "Dhupchanchia", "Gabtali", "Kahaloo", "Nandigram", "Sariakandi", "Shajahanpur", "Sherpur (Bogura)", "Shibganj (Bogura)", "Sonatala"],
  Chapainawabganj: ["Chapainawabganj Sadar", "Bholahat", "Gomastapur", "Nachole", "Shibganj (Chapainawabganj)"],
  Joypurhat: ["Joypurhat Sadar", "Akkelpur", "Kalai", "Khetlal", "Panchbibi"],
  Naogaon: ["Naogaon Sadar", "Atrai", "Badalgachhi", "Dhamoirhat", "Manda", "Mahadebpur", "Niamatpur", "Patnitala", "Porsha", "Raninagar", "Sapahar"],
  Natore: ["Natore Sadar", "Bagatipara", "Baraigram", "Gurudaspur", "Lalpur", "Naldanga", "Singra"],
  Pabna: ["Pabna Sadar", "Atgharia", "Bera", "Bhangura", "Chatmohar", "Faridpur (Pabna)", "Ishwardi", "Santhia", "Sujanagar"],
  Rajshahi: [
    // RMP city thanas (Rajshahi metro)
    "Boalia", "Motihar", "Rajpara", "Shah Makhdum", "Chandrima",
    "Kashiadanga", "Karnahar", "Damkura", "Belpukur",
    // Outskirt upazilas
    "Bagha", "Bagmara", "Charghat", "Durgapur (Rajshahi)", "Godagari",
    "Mohanpur", "Paba", "Puthia", "Tanore",
  ],
  Sirajganj: ["Sirajganj Sadar", "Belkuchi", "Chauhali", "Kamarkhanda", "Kazipur", "Raiganj", "Shahjadpur", "Tarash", "Ullahpara"],

  // ── Barishal Division ───────────────────────────────────────────────────
  Barguna: ["Barguna Sadar", "Amtali", "Bamna", "Betagi", "Patharghata", "Taltali"],
  Barishal: [
    // BMP city thanas (Barishal metro)
    "Kotwali (Barishal)", "Airport (Barishal)", "Bandar (Barishal)",
    "Kawnia", "Bakerganj",
    // Outskirt upazilas
    "Agailjhara", "Babuganj", "Banaripara", "Gaurnadi", "Hizla",
    "Mehendiganj", "Muladi", "Wazirpur",
  ],
  Bhola: ["Bhola Sadar", "Burhanuddin", "Char Fasson", "Daulatkhan", "Lalmohan", "Manpura", "Tazumuddin"],
  Jhalokati: ["Jhalokati Sadar", "Kathalia", "Nalchity", "Rajapur"],
  Patuakhali: ["Patuakhali Sadar", "Bauphal", "Dashmina", "Dumki", "Galachipa", "Kalapara", "Mirzaganj", "Rangabali"],
  Pirojpur: ["Pirojpur Sadar", "Bhandaria", "Kawkhali (Pirojpur)", "Mathbaria", "Nazirpur", "Nesarabad", "Zianagar"],

  // ── Sylhet Division ─────────────────────────────────────────────────────
  Habiganj: ["Habiganj Sadar", "Ajmiriganj", "Bahubal", "Baniachong", "Chunarughat", "Lakhai", "Madhabpur", "Nabiganj", "Shaistaganj"],
  Moulvibazar: ["Moulvibazar Sadar", "Barlekha", "Juri", "Kamalganj", "Kulaura", "Rajnagar", "Sreemangal"],
  Sunamganj: ["Sunamganj Sadar", "Bishwamvarpur", "Chhatak", "Derai", "Dharmapasha", "Dowarabazar", "Jagannathpur", "Jamalganj", "Madhyanagar", "Shantiganj", "Sullah", "Tahirpur"],
  Sylhet: [
    // SMP city thanas (Sylhet metro)
    "Kotwali (Sylhet)", "Jalalabad", "Airport (Sylhet)", "Moghlabazar",
    "South Surma", "Shah Paran",
    // Outskirt upazilas of Sylhet district
    "Balaganj", "Beanibazar", "Bishwanath", "Companiganj (Sylhet)",
    "Dakshin Surma", "Fenchuganj", "Golapganj", "Gowainghat", "Jaintiapur",
    "Kanaighat", "Osmaninagar", "Zakiganj",
  ],

  // ── Rangpur Division ────────────────────────────────────────────────────
  Dinajpur: ["Dinajpur Sadar", "Birampur", "Birganj", "Birol", "Bochaganj", "Chirirbandar", "Phulbari (Dinajpur)", "Ghoraghat", "Hakimpur", "Kaharole", "Khansama", "Nawabganj (Dinajpur)", "Parbatipur"],
  Gaibandha: ["Gaibandha Sadar", "Fulchhari", "Gobindaganj", "Palashbari", "Sadullapur", "Saghata", "Sundarganj"],
  Kurigram: ["Kurigram Sadar", "Bhurungamari", "Char Rajibpur", "Chilmari", "Phulbari (Kurigram)", "Nageshwari", "Rajarhat", "Raumari", "Ulipur"],
  Lalmonirhat: ["Lalmonirhat Sadar", "Aditmari", "Hatibandha", "Kaliganj (Lalmonirhat)", "Patgram"],
  Nilphamari: ["Nilphamari Sadar", "Dimla", "Domar", "Jaldhaka", "Kishoreganj (Nilphamari)", "Saidpur"],
  Panchagarh: ["Panchagarh Sadar", "Atwari", "Boda", "Debiganj", "Tetulia"],
  Rangpur: [
    // RpMP city thanas (Rangpur metro)
    "Kotwali (Rangpur)", "Mahiganj", "Parshuram (Rangpur)", "Tajhat",
    "Haragach",
    // Outskirt upazilas
    "Badarganj", "Gangachara", "Kaunia", "Mithapukur", "Pirgachha",
    "Pirganj (Rangpur)", "Taraganj",
  ],
  Thakurgaon: ["Thakurgaon Sadar", "Baliadangi", "Haripur", "Pirganj (Thakurgaon)", "Ranisankail"],

  // ── Mymensingh Division ─────────────────────────────────────────────────
  Jamalpur: ["Jamalpur Sadar", "Bakshiganj", "Dewanganj", "Islampur", "Madarganj", "Melandaha", "Sarishabari"],
  Mymensingh: [
    // MMP city thanas (Mymensingh metro)
    "Kotwali (Mymensingh)",
    // Outskirt upazilas
    "Bhaluka", "Dhobaura", "Fulbaria", "Gaffargaon", "Gauripur",
    "Haluaghat", "Ishwarganj", "Muktagachha", "Nandail", "Phulpur",
    "Tarakanda", "Trishal",
  ],
  Netrokona: ["Netrokona Sadar", "Atpara", "Barhatta", "Durgapur (Netrokona)", "Khaliajuri", "Kalmakanda", "Kendua", "Madan", "Mohanganj", "Purbadhala"],
  Sherpur: ["Sherpur Sadar", "Jhenaigati", "Nakla", "Nalitabari", "Sreebardi"],
};

export function getThanasForDistrict(district) {
  return BD_THANAS[district] || [];
}

export const COUNTRIES = [
  { code: "BD", name: "Bangladesh" },
];

export const DEFAULT_COUNTRY = "BD";
