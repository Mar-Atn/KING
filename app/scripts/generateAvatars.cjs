/**
 * Generate placeholder avatars for all 30 roles
 * Creates simple SVG avatars with initials and clan colors
 */

const fs = require('fs');
const path = require('path');

// Role names from the database
const roles = [
  // Artificers
  { name: 'Architekton Metrodoros Tekhnaios', clan: 'Artificers', color: '#8B7355' },
  { name: 'Sophia Hephaistia Polymechanikos', clan: 'Artificers', color: '#8B7355' },
  { name: 'Mekhanopoios Thales Nautilos', clan: 'Artificers', color: '#8B7355' },
  // Bankers
  { name: 'Trapezites Demetrios Chrysostomos', clan: 'Bankers', color: '#D4AF37' },
  { name: 'Kyria Antigone Oikonomos', clan: 'Bankers', color: '#D4AF37' },
  { name: 'Kyria Lyra Theodoros', clan: 'Bankers', color: '#D4AF37' },
  { name: 'Argentarius Nikandros Nomismatikos', clan: 'Bankers', color: '#D4AF37' },
  { name: 'Trapezitria Iris Chrematistes', clan: 'Bankers', color: '#D4AF37' },
  // Landlords
  { name: 'Archon Apollodoros Kourionides', clan: 'Landlords', color: '#8B4513' },
  { name: 'Kyria Alexandra Gerontos', clan: 'Landlords', color: '#8B4513' },
  { name: 'Strategos Timotheos Hoplites', clan: 'Landlords', color: '#8B4513' },
  { name: 'Kyrios Philippos Agronomos', clan: 'Landlords', color: '#8B4513' },
  { name: 'Despoina Theodora Ktemates', clan: 'Landlords', color: '#8B4513' },
  { name: 'Archon Herakles Geouchikos', clan: 'Landlords', color: '#8B4513' },
  { name: 'Georgios Agronakis', clan: 'Landlords', color: '#8B4513' },
  // Merchants
  { name: 'Navarch Theodoros Phoenikiades', clan: 'Merchants', color: '#2E8B57' },
  { name: 'Emporios Helena Kypriades', clan: 'Merchants', color: '#2E8B57' },
  { name: 'Nauplios Kyros Salaminiades', clan: 'Merchants', color: '#2E8B57' },
  { name: 'Emporios Zeno Panhellenios', clan: 'Merchants', color: '#2E8B57' },
  { name: 'Naukleros Kallisto Thalassopoula', clan: 'Merchants', color: '#2E8B57' },
  // Military
  { name: 'Strategos Nikias Korragos', clan: 'Military', color: '#8B0000' },
  { name: 'Captain Lysander Heraklidos', clan: 'Military', color: '#8B0000' },
  { name: 'Commander Demetrios Alkibiades', clan: 'Military', color: '#8B0000' },
  { name: 'Admiral Kleomenes Thalassios', clan: 'Military', color: '#8B0000' },
  { name: 'Lieutenant Andreas Polemistes', clan: 'Military', color: '#8B0000' },
  { name: 'Hoplite Commander Philon Aspidos', clan: 'Military', color: '#8B0000' },
  { name: 'Strategos Kassandra Polemarch', clan: 'Military', color: '#8B0000' },
  // Philosophers
  { name: 'Philosophos Sokrates Ethikos', clan: 'Philosophers', color: '#4B0082' },
  { name: 'Didaskalos Aristoteles Politikos', clan: 'Philosophers', color: '#4B0082' },
  { name: 'Rhetor Kalliope Logike', clan: 'Philosophers', color: '#4B0082' }
];

function getInitials(name) {
  // Get first letter of first name and last name
  const parts = name.split(' ');
  if (parts.length < 2) return name.substring(0, 2).toUpperCase();

  const firstName = parts[0];
  const lastName = parts[parts.length - 1];

  return (firstName[0] + lastName[0]).toUpperCase();
}

function generateAvatar(role, index) {
  const initials = getInitials(role.name);
  const fileName = `avatar-${index + 1}.svg`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <!-- Background circle with clan color -->
  <circle cx="50" cy="50" r="50" fill="${role.color}"/>

  <!-- Lighter overlay -->
  <circle cx="50" cy="50" r="50" fill="rgba(255, 255, 255, 0.1)"/>

  <!-- Initials -->
  <text
    x="50"
    y="50"
    font-family="Arial, sans-serif"
    font-size="32"
    font-weight="bold"
    fill="white"
    text-anchor="middle"
    dominant-baseline="central"
  >
    ${initials}
  </text>
</svg>`;

  return { fileName, svg, role };
}

// Create output directory
const outputDir = path.join(__dirname, '..', 'public', 'avatars');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate all avatars
console.log('Generating placeholder avatars...\n');
const avatarMap = [];

roles.forEach((role, index) => {
  const { fileName, svg, role: roleData } = generateAvatar(role, index);
  const filePath = path.join(outputDir, fileName);

  fs.writeFileSync(filePath, svg);
  console.log(`✓ Generated ${fileName} for ${roleData.name}`);

  avatarMap.push({
    sequence: index + 1,
    name: roleData.name,
    clan: roleData.clan,
    avatar_url: `/avatars/${fileName}`
  });
});

// Save avatar mapping for reference
const mapPath = path.join(outputDir, 'avatar-map.json');
fs.writeFileSync(mapPath, JSON.stringify(avatarMap, null, 2));

console.log(`\n✅ Generated ${roles.length} placeholder avatars`);
console.log(`📁 Saved to: ${outputDir}`);
console.log(`📋 Avatar map saved to: ${mapPath}`);
