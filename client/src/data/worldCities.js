/**
 * Comprehensive World Cities Database
 * 500+ cities from around the globe - completely free, no API required
 */

export const worldCities = [
  // United States - Major Cities (50 cities)
  'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ',
  'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA', 'Dallas, TX', 'San Jose, CA',
  'Austin, TX', 'Jacksonville, FL', 'Fort Worth, TX', 'Columbus, OH', 'Charlotte, NC',
  'San Francisco, CA', 'Indianapolis, IN', 'Seattle, WA', 'Denver, CO', 'Washington, DC',
  'Boston, MA', 'El Paso, TX', 'Nashville, TN', 'Detroit, MI', 'Oklahoma City, OK',
  'Portland, OR', 'Las Vegas, NV', 'Memphis, TN', 'Louisville, KY', 'Baltimore, MD',
  'Milwaukee, WI', 'Albuquerque, NM', 'Atlanta, GA', 'Miami, FL', 'Minneapolis, MN',
  'Tampa, FL', 'New Orleans, LA', 'Cleveland, OH', 'Raleigh, NC', 'Omaha, NE',
  'Long Beach, CA', 'Virginia Beach, VA', 'Oakland, CA', 'Pittsburgh, PA', 'Tulsa, OK',
  'Arlington, TX', 'Wichita, KS', 'Bakersfield, CA', 'Aurora, CO', 'Anaheim, CA',
  
  // Canada (15 cities)
  'Toronto, ON', 'Montreal, QC', 'Vancouver, BC', 'Calgary, AB', 'Edmonton, AB',
  'Ottawa, ON', 'Winnipeg, MB', 'Quebec City, QC', 'Hamilton, ON', 'Kitchener, ON',
  'London, ON', 'Halifax, NS', 'Victoria, BC', 'Windsor, ON', 'Saskatoon, SK',
  
  // United Kingdom & Ireland (20 cities)
  'London, United Kingdom', 'Manchester, United Kingdom', 'Birmingham, United Kingdom',
  'Glasgow, Scotland', 'Edinburgh, Scotland', 'Liverpool, United Kingdom', 'Bristol, United Kingdom',
  'Leeds, United Kingdom', 'Sheffield, United Kingdom', 'Newcastle, United Kingdom',
  'Cardiff, Wales', 'Belfast, Northern Ireland', 'Nottingham, United Kingdom', 'Leicester, United Kingdom',
  'Coventry, United Kingdom', 'Bradford, United Kingdom', 'Dublin, Ireland', 'Cork, Ireland',
  'Galway, Ireland', 'Limerick, Ireland',
  
  // Western Europe (40 cities)
  'Paris, France', 'Lyon, France', 'Marseille, France', 'Toulouse, France', 'Nice, France',
  'Nantes, France', 'Strasbourg, France', 'Montpellier, France', 'Bordeaux, France', 'Lille, France',
  'Berlin, Germany', 'Munich, Germany', 'Hamburg, Germany', 'Cologne, Germany', 'Frankfurt, Germany',
  'Stuttgart, Germany', 'Düsseldorf, Germany', 'Dortmund, Germany', 'Essen, Germany', 'Leipzig, Germany',
  'Madrid, Spain', 'Barcelona, Spain', 'Valencia, Spain', 'Seville, Spain', 'Bilbao, Spain',
  'Málaga, Spain', 'Zaragoza, Spain', 'Las Palmas, Spain', 'Palma, Spain', 'Murcia, Spain',
  'Rome, Italy', 'Milan, Italy', 'Naples, Italy', 'Turin, Italy', 'Florence, Italy',
  'Bologna, Italy', 'Genoa, Italy', 'Venice, Italy', 'Palermo, Italy', 'Catania, Italy',
  
  // Northern Europe (15 cities)
  'Amsterdam, Netherlands', 'Rotterdam, Netherlands', 'The Hague, Netherlands', 'Utrecht, Netherlands',
  'Brussels, Belgium', 'Antwerp, Belgium', 'Ghent, Belgium', 'Vienna, Austria', 'Graz, Austria',
  'Zurich, Switzerland', 'Geneva, Switzerland', 'Basel, Switzerland', 'Bern, Switzerland',
  'Stockholm, Sweden', 'Gothenburg, Sweden', 'Malmö, Sweden', 'Oslo, Norway', 'Bergen, Norway',
  'Copenhagen, Denmark', 'Aarhus, Denmark', 'Helsinki, Finland', 'Espoo, Finland',
  'Lisbon, Portugal', 'Porto, Portugal', 'Luxembourg City, Luxembourg',
  
  // Eastern Europe (25 cities)
  'Moscow, Russia', 'St. Petersburg, Russia', 'Novosibirsk, Russia', 'Yekaterinburg, Russia',
  'Warsaw, Poland', 'Krakow, Poland', 'Łódź, Poland', 'Wrocław, Poland', 'Poznań, Poland',
  'Prague, Czech Republic', 'Brno, Czech Republic', 'Budapest, Hungary', 'Debrecen, Hungary',
  'Bucharest, Romania', 'Cluj-Napoca, Romania', 'Sofia, Bulgaria', 'Plovdiv, Bulgaria',
  'Zagreb, Croatia', 'Split, Croatia', 'Belgrade, Serbia', 'Novi Sad, Serbia',
  'Kiev, Ukraine', 'Kharkiv, Ukraine', 'Minsk, Belarus', 'Vilnius, Lithuania',
  
  // Asia - East Asia (30 cities)
  'Tokyo, Japan', 'Osaka, Japan', 'Kyoto, Japan', 'Yokohama, Japan', 'Nagoya, Japan',
  'Sapporo, Japan', 'Fukuoka, Japan', 'Kobe, Japan', 'Kawasaki, Japan', 'Hiroshima, Japan',
  'Seoul, South Korea', 'Busan, South Korea', 'Incheon, South Korea', 'Daegu, South Korea',
  'Daejeon, South Korea', 'Gwangju, South Korea', 'Beijing, China', 'Shanghai, China',
  'Guangzhou, China', 'Shenzhen, China', 'Chengdu, China', 'Hangzhou, China', 'Nanjing, China',
  'Wuhan, China', 'Xian, China', 'Chongqing, China', 'Tianjin, China', 'Shenyang, China',
  'Hong Kong', 'Macau', 'Taipei, Taiwan', 'Kaohsiung, Taiwan', 'Taichung, Taiwan',
  
  // Asia - Southeast Asia (25 cities)
  'Singapore', 'Bangkok, Thailand', 'Chiang Mai, Thailand', 'Phuket, Thailand',
  'Kuala Lumpur, Malaysia', 'George Town, Malaysia', 'Johor Bahru, Malaysia',
  'Jakarta, Indonesia', 'Surabaya, Indonesia', 'Bandung, Indonesia', 'Medan, Indonesia',
  'Semarang, Indonesia', 'Makassar, Indonesia', 'Manila, Philippines', 'Quezon City, Philippines',
  'Cebu, Philippines', 'Davao, Philippines', 'Ho Chi Minh City, Vietnam', 'Hanoi, Vietnam',
  'Da Nang, Vietnam', 'Phnom Penh, Cambodia', 'Siem Reap, Cambodia', 'Yangon, Myanmar',
  'Mandalay, Myanmar', 'Vientiane, Laos', 'Bandar Seri Begawan, Brunei',
  
  // Asia - South Asia (25 cities)
  'Mumbai, India', 'Delhi, India', 'Bangalore, India', 'Hyderabad, India', 'Chennai, India',
  'Kolkata, India', 'Pune, India', 'Ahmedabad, India', 'Jaipur, India', 'Surat, India',
  'Lucknow, India', 'Kanpur, India', 'Nagpur, India', 'Indore, India', 'Bhopal, India',
  'Karachi, Pakistan', 'Lahore, Pakistan', 'Islamabad, Pakistan', 'Rawalpindi, Pakistan',
  'Faisalabad, Pakistan', 'Dhaka, Bangladesh', 'Chittagong, Bangladesh', 'Sylhet, Bangladesh',
  'Colombo, Sri Lanka', 'Kandy, Sri Lanka', 'Kathmandu, Nepal', 'Pokhara, Nepal',
  
  // Middle East (25 cities)
  'Dubai, UAE', 'Abu Dhabi, UAE', 'Sharjah, UAE', 'Al Ain, UAE', 'Doha, Qatar',
  'Kuwait City, Kuwait', 'Manama, Bahrain', 'Riyadh, Saudi Arabia', 'Jeddah, Saudi Arabia',
  'Mecca, Saudi Arabia', 'Medina, Saudi Arabia', 'Dammam, Saudi Arabia', 'Tel Aviv, Israel',
  'Jerusalem, Israel', 'Haifa, Israel', 'Amman, Jordan', 'Irbid, Jordan', 'Beirut, Lebanon',
  'Tripoli, Lebanon', 'Damascus, Syria', 'Aleppo, Syria', 'Baghdad, Iraq', 'Basra, Iraq',
  'Tehran, Iran', 'Isfahan, Iran', 'Mashhad, Iran', 'Shiraz, Iran', 'Tabriz, Iran',
  'Istanbul, Turkey', 'Ankara, Turkey', 'Izmir, Turkey', 'Antalya, Turkey', 'Bursa, Turkey',
  
  // Africa (30 cities)
  'Cairo, Egypt', 'Alexandria, Egypt', 'Giza, Egypt', 'Lagos, Nigeria', 'Abuja, Nigeria',
  'Kano, Nigeria', 'Ibadan, Nigeria', 'Port Harcourt, Nigeria', 'Cape Town, South Africa',
  'Johannesburg, South Africa', 'Durban, South Africa', 'Pretoria, South Africa',
  'Port Elizabeth, South Africa', 'Casablanca, Morocco', 'Rabat, Morocco', 'Marrakech, Morocco',
  'Fez, Morocco', 'Tunis, Tunisia', 'Sfax, Tunisia', 'Algiers, Algeria', 'Oran, Algeria',
  'Accra, Ghana', 'Kumasi, Ghana', 'Nairobi, Kenya', 'Mombasa, Kenya', 'Kampala, Uganda',
  'Dar es Salaam, Tanzania', 'Dodoma, Tanzania', 'Addis Ababa, Ethiopia', 'Khartoum, Sudan',
  'Kinshasa, DR Congo', 'Lubumbashi, DR Congo', 'Luanda, Angola', 'Maputo, Mozambique',
  'Harare, Zimbabwe', 'Lusaka, Zambia', 'Gaborone, Botswana', 'Windhoek, Namibia',
  
  // Oceania (15 cities)
  'Sydney, Australia', 'Melbourne, Australia', 'Brisbane, Australia', 'Perth, Australia',
  'Adelaide, Australia', 'Canberra, Australia', 'Gold Coast, Australia', 'Newcastle, Australia',
  'Wollongong, Australia', 'Hobart, Australia', 'Darwin, Australia', 'Auckland, New Zealand',
  'Wellington, New Zealand', 'Christchurch, New Zealand', 'Hamilton, New Zealand',
  'Tauranga, New Zealand', 'Dunedin, New Zealand', 'Suva, Fiji', 'Nadi, Fiji',
  'Port Moresby, Papua New Guinea', 'Lae, Papua New Guinea', 'Noumea, New Caledonia',
  
  // South America (35 cities)
  'São Paulo, Brazil', 'Rio de Janeiro, Brazil', 'Brasília, Brazil', 'Salvador, Brazil',
  'Fortaleza, Brazil', 'Belo Horizonte, Brazil', 'Manaus, Brazil', 'Curitiba, Brazil',
  'Recife, Brazil', 'Porto Alegre, Brazil', 'Belém, Brazil', 'Goiânia, Brazil',
  'Guarulhos, Brazil', 'Campinas, Brazil', 'São Luís, Brazil', 'Buenos Aires, Argentina',
  'Córdoba, Argentina', 'Rosario, Argentina', 'Mendoza, Argentina', 'La Plata, Argentina',
  'Santiago, Chile', 'Valparaíso, Chile', 'Concepción, Chile', 'La Serena, Chile',
  'Lima, Peru', 'Arequipa, Peru', 'Trujillo, Peru', 'Cusco, Peru', 'Bogotá, Colombia',
  'Medellín, Colombia', 'Cali, Colombia', 'Barranquilla, Colombia', 'Cartagena, Colombia',
  'Caracas, Venezuela', 'Maracaibo, Venezuela', 'Valencia, Venezuela', 'Quito, Ecuador',
  'Guayaquil, Ecuador', 'Cuenca, Ecuador', 'La Paz, Bolivia', 'Santa Cruz, Bolivia',
  'Cochabamba, Bolivia', 'Asunción, Paraguay', 'Ciudad del Este, Paraguay', 'Montevideo, Uruguay',
  'Salto, Uruguay', 'Georgetown, Guyana', 'Paramaribo, Suriname', 'Cayenne, French Guiana',
  
  // Central America & Caribbean (25 cities)
  'Mexico City, Mexico', 'Guadalajara, Mexico', 'Monterrey, Mexico', 'Puebla, Mexico',
  'Tijuana, Mexico', 'León, Mexico', 'Juárez, Mexico', 'Zapopan, Mexico', 'Mérida, Mexico',
  'San Luis Potosí, Mexico', 'Aguascalientes, Mexico', 'Hermosillo, Mexico',
  'Guatemala City, Guatemala', 'Quetzaltenango, Guatemala', 'San Salvador, El Salvador',
  'Santa Ana, El Salvador', 'Tegucigalpa, Honduras', 'San Pedro Sula, Honduras',
  'Managua, Nicaragua', 'León, Nicaragua', 'San José, Costa Rica', 'Cartago, Costa Rica',
  'Panama City, Panama', 'Colón, Panama', 'Havana, Cuba', 'Santiago de Cuba, Cuba',
  'Camagüey, Cuba', 'Kingston, Jamaica', 'Spanish Town, Jamaica', 'Santo Domingo, Dominican Republic',
  'Santiago, Dominican Republic', 'San Juan, Puerto Rico', 'Bayamón, Puerto Rico',
  'Port-au-Prince, Haiti', 'Cap-Haïtien, Haiti', 'Bridgetown, Barbados', 'Nassau, Bahamas',
  'Port of Spain, Trinidad and Tobago', 'San Fernando, Trinidad and Tobago',
  
  // Regional/Metropolitan Areas (for privacy-conscious users)
  'Greater New York Area', 'San Francisco Bay Area', 'Greater Los Angeles Area',
  'Greater Chicago Area', 'Greater Boston Area', 'Greater Seattle Area', 'Greater Toronto Area',
  'Greater London Area', 'Île-de-France Region', 'Greater Tokyo Area', 'Greater Sydney Area',
  'Greater Melbourne Area', 'Greater São Paulo Area', 'Greater Buenos Aires Area',
  'Greater Mexico City Area', 'Greater Mumbai Area', 'Greater Delhi Area', 'Greater Cairo Area',
  'Greater Lagos Area', 'Greater Istanbul Area', 'Greater Moscow Area', 'Greater Berlin Area',
  'Greater Madrid Area', 'Greater Rome Area', 'Greater Paris Area', 'Greater Amsterdam Area',
  
  // Rural/Remote Options by Region
  'Rural Area - North America', 'Rural Area - Europe', 'Rural Area - Asia',
  'Rural Area - Africa', 'Rural Area - South America', 'Rural Area - Oceania',
  'Rural Area - Caribbean', 'Rural Area - Central America', 'Rural Area - Middle East',
  'Remote Area - Arctic', 'Remote Area - Islands', 'Remote Area - Mountains',
  'Remote Area - Desert', 'Remote Area - Countryside', 'Remote Area - Forest',
  'Small Town - USA', 'Small Town - Canada', 'Small Town - Europe', 'Small Town - Asia',
  'Village - Africa', 'Village - South America', 'Coastal Town', 'Mountain Town',
  'Island Community', 'Farming Community', 'Mining Town', 'Border Town'
];

// Alternative city names and aliases
export const cityAliases = {
  'NYC': 'New York, NY',
  'LA': 'Los Angeles, CA',
  'SF': 'San Francisco, CA',
  'Chi': 'Chicago, IL',
  'Philly': 'Philadelphia, PA',
  'Vegas': 'Las Vegas, NV',
  'Miami': 'Miami, FL',
  'DC': 'Washington, DC',
  'ATL': 'Atlanta, GA',
  'Boston': 'Boston, MA',
  'London': 'London, United Kingdom',
  'Paris': 'Paris, France',
  'Tokyo': 'Tokyo, Japan',
  'Mumbai': 'Mumbai, India',
  'Delhi': 'Delhi, India',
  'Sydney': 'Sydney, Australia',
  'Toronto': 'Toronto, ON',
  'Vancouver': 'Vancouver, BC',
  'Montreal': 'Montreal, QC'
};

export default worldCities;