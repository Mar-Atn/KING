-- ============================================================================
-- MIGRATION: 00010_populate_role_details.sql
-- Description: Populate background, character_traits, and interests for roles
-- Author: The New King Development Team
-- Date: 2025-10-25
-- ============================================================================

-- This migration adds the detailed role descriptions from KING_ALL_ROLES.csv
-- to the existing simulation_templates. The seed migration (00009) only
-- created basic role fields (sequence, name, clan, age, position).
-- This migration adds: background, character_traits, interests

BEGIN;

-- Update the canonical_roles in the KOURION v1.0 template
-- We'll use jsonb_set to update each role individually

DO $$
DECLARE
  target_template_id UUID;
  current_roles JSONB;
  updated_roles JSONB := '[]'::jsonb;
BEGIN
  -- Get the template ID
  SELECT template_id, canonical_roles INTO target_template_id, current_roles
  FROM simulation_templates
  WHERE name = 'The New King of Kourion' AND version = 'v1.0';

  IF target_template_id IS NULL THEN
    RAISE EXCEPTION 'KOURION v1.0 template not found!';
  END IF;

  RAISE NOTICE 'Updating roles for template: %', target_template_id;

  -- Build updated roles array with full details
  updated_roles := jsonb_build_array(
    -- ARTIFICERS (3 roles)
    jsonb_build_object(
      'sequence', 1,
      'name', 'Architekton Metrodoros Tekhnaios',
      'clan', 'Clan of Artificers',
      'age', 44,
      'position', 'Master of Naval Engineering',
      'background', 'Metrodoros has designed and built the most advanced harbor fortifications and naval vessels in the eastern Mediterranean, earning recognition from military leaders and merchants alike for his innovative engineering solutions. His family has served as master craftsmen for generations, and he personally supervised the construction of the new harbor defenses that have protected our city-kingdom from recent pirate attacks. He is known for his ability to combine traditional Greek engineering techniques with innovations learned from Persian and Egyptian masters.',
      'character_traits', 'Brilliant and innovative, Skilled at combining different techniques, Respected across clan lines, Focused on practical solutions, Passionate about technological advancement',
      'interests', 'I believe my proven ability to create innovations that strengthen our city-kingdom makes me the ideal candidate to serve as King during these times of technological opportunity. My engineering projects have already saved countless lives and protected our prosperity, and I am confident that my leadership could guide us toward becoming the most technologically advanced city-kingdom in the Mediterranean. The position of Economic Advisor would also suit my talents, as I understand how to invest in innovations that generate long-term economic benefits.'
    ),
    jsonb_build_object(
      'sequence', 2,
      'name', 'Sophia Hephaistia Polymechanikos',
      'clan', 'Clan of Artificers',
      'age', 38,
      'position', 'Master of Mechanical Innovations',
      'background', 'Sophia has developed practical innovations that have improved daily life throughout our city-kingdom, from improved water systems to more efficient copper mining techniques. Born to a family of skilled metalworkers, she has earned recognition for her ability to solve complex problems with elegant, practical solutions that ordinary citizens can understand and use. Her innovations have increased productivity in multiple sectors while reducing the physical burden on workers throughout our island.',
      'character_traits', 'Practical and problem-solving oriented, Concerned with improving daily life, Skilled at making complex ideas accessible, Collaborative and inclusive, Focused on sustainable solutions',
      'interests', 'I am willing to serve as King if our clan believes my practical approach to innovation and my understanding of how technology affects ordinary citizens would benefit our city-kingdom. My focus is ensuring that whoever leads us prioritizes innovations that actually improve people''s lives rather than pursuing impressive but impractical projects. The position of Economic Advisor would allow me to promote investment in technologies that generate real economic benefits while improving working conditions and productivity.'
    ),
    jsonb_build_object(
      'sequence', 3,
      'name', 'Mekhanopoios Thales Nautilos',
      'clan', 'Clan of Artificers',
      'age', 42,
      'position', 'Master of Harbor Engineering',
      'background', 'Thales specializes in designing and building the complex harbor infrastructure that makes Kourion''s maritime commerce possible - breakwaters, docks, loading cranes, and ship repair facilities. He studied engineering in multiple cities across the Mediterranean, learning from Greek, Phoenician, and Egyptian masters to synthesize the best techniques from each tradition. His innovative harbor designs have increased Kourion''s shipping capacity by nearly a third over the past decade, earning gratitude from merchants while making military leaders appreciate how engineering enhances naval power. He represents the practical, results-oriented side of the Artificers clan.',
      'character_traits', 'Practical problem-solver, Synthesizes diverse knowledge, Results-focused, Respected by multiple clans, Diplomatic engineer',
      'interests', 'I aspire to become King because I understand that our city-kingdom''s prosperity depends on infrastructure and capability, not just tradition and talk. My engineering projects have demonstrated how investment in practical improvements creates opportunities for merchants, power for the military, and jobs for common citizens. If serving as Economic Advisor, I would ensure that budget allocations focus on tangible improvements that benefit multiple interests rather than being captured by single-clan priorities.'
    ),
    -- BANKERS (5 roles)
    jsonb_build_object(
      'sequence', 4,
      'name', 'Trapezites Demetrios Chrysostomos',
      'clan', 'Clan of Bankers',
      'age', 47,
      'position', 'Master of the Central Treasury',
      'background', 'Demetrios controls the largest banking operation in Kourion and has personal relationships with financial leaders across the Mediterranean, from Persian imperial banks to Egyptian grain merchants. His family has managed the city-kingdom''s financial affairs for generations, and he personally negotiated the current debt agreements that allow our government to function during difficult periods. He is known for his sophisticated understanding of international finance and his ability to find creative solutions to complex economic problems.',
      'character_traits', 'Sophisticated and internationally minded, Skilled in complex financial negotiations, Pragmatic and analytical, Confident in his expertise, Protective of financial stability',
      'interests', 'I believe my deep understanding of financial systems and international economics makes me the natural choice to serve as King during these financially challenging times. No other candidate possesses the expertise needed to navigate the complex web of debts, trade agreements, and currency relationships that determine our city-kingdom''s prosperity. The position of Economic Advisor would also suit my talents, as I could guide any King toward policies that maintain our financial stability and expand our economic opportunities.'
    ),
    jsonb_build_object(
      'sequence', 5,
      'name', 'Kyria Antigone Oikonomos',
      'clan', 'Clan of Bankers',
      'age', 41,
      'position', 'Director of Debt Management',
      'background', 'Antigone specializes in managing the city-kingdom''s debt obligations and has developed a reputation for careful, conservative financial management that prioritizes stability over rapid growth. Her family has served as financial advisors to Kourion''s rulers for generations, and she is known for her ability to identify financial risks before they become crises. She advocates for sustainable financial practices and has successfully negotiated several debt restructuring agreements that have kept our city-kingdom solvent during difficult periods.',
      'character_traits', 'Conservative and risk-averse, Skilled at identifying financial risks, Focused on long-term stability, Careful and methodical, Protective of fiscal responsibility',
      'interests', 'I genuinely believe my approach to strategic planning and resource management make me a strong candidate to become the new King, not for myself, but for the benefits of the entire kingdom and our glorious clan. I am determined to ensure that whoever becomes King understands the importance of maintaining our financial stability and avoiding the reckless spending that has bankrupted other city-kingdoms. My role is to guide our clan toward the supreme power, or supporting candidates who will prioritize fiscal responsibility over popular policies.'
    ),
    jsonb_build_object(
      'sequence', 6,
      'name', 'Kyria Lyra Theodoros',
      'clan', 'Clan of Bankers',
      'age', 35,
      'position', 'Master of Investment Banking',
      'background', 'Lyra represents the new generation of bankers who specialize in financing large-scale projects and international investments rather than traditional lending. She has successfully organized funding for major harbor improvements and merchant fleet expansions, earning recognition for her ability to identify profitable opportunities and structure complex financing arrangements. Her innovative approach to banking has brought substantial profits to our clan while supporting the city-kingdom''s economic development.',
      'character_traits', 'Innovative and opportunistic, Skilled at structuring complex deals, Ambitious and confident, Focused on growth and expansion, Comfortable with calculated risks',
      'interests', 'I am eager to serve as Queen if our clan believes my modern understanding of finance and investment would benefit our city-kingdom during these times of economic opportunity. My focus is ensuring that our clan''s financial expertise shapes whatever policies the new Queen adopts, particularly regarding investment in growth projects and international economic partnerships. The position of Economic Advisor would allow me to promote innovative financial strategies that could dramatically increase our prosperity rather than settling for conservative approaches that limit our potential.'
    ),
    jsonb_build_object(
      'sequence', 7,
      'name', 'Argentarius Nikandros Nomismatikos',
      'clan', 'Clan of Bankers',
      'age', 51,
      'position', 'Master of the Royal Mint',
      'background', 'Nikandros oversees Kourion''s mint and currency operations, controlling the production and quality of our coinage - a position of immense power and responsibility. His family has held this position for three generations, building a reputation for absolute integrity in maintaining the purity and weight of Kourion''s silver drachmas. He understands that sound currency is the foundation of all trade and banking, and has successfully defended the mint''s independence from political pressure to debase the coinage for short-term gain. His knowledge of currency systems across the Mediterranean makes him an invaluable advisor on financial matters.',
      'character_traits', 'Meticulous and precise, Incorruptible, Deep financial knowledge, Conservative on currency matters, Respected across political lines',
      'interests', 'I believe I would serve excellently as King because I understand that financial credibility is the foundation of all political power - a city-kingdom with debased currency and questionable finances cannot be truly independent or strong. My decades of experience maintaining our coinage''s reputation have taught me the importance of long-term credibility over short-term expediency. If serving as Economic Advisor, my expertise in currency and finance would ensure sound fiscal policy.'
    ),
    jsonb_build_object(
      'sequence', 8,
      'name', 'Trapezitria Iris Chrematistes',
      'clan', 'Clan of Bankers',
      'age', 38,
      'position', 'Director of Commercial Banking',
      'background', 'Iris oversees the commercial banking operations that provide credit to merchants, shipbuilders, and other businesses throughout Kourion. She comes from a banking family of modest origins and rose through merit by demonstrating exceptional ability to assess credit risk and structure profitable loans. Unlike some of her more conservative clan members, Iris believes that calculated lending drives economic growth and that banks should be partners in prosperity rather than mere hoarders of gold. Her lending decisions have helped many successful businesses grow while maintaining sound lending practices that keep default rates low.',
      'character_traits', 'Analytically brilliant, Risk-aware but not risk-averse, Growth-oriented, Skilled at reading people and situations, Balances profit and prudence',
      'interests', 'I seek to ensure that whoever becomes King understands that smart lending and financial facilitation are essential for economic prosperity - hoarding wealth in vaults doesn''t create jobs or opportunities. My experience evaluating hundreds of business proposals has taught me to distinguish between genuine opportunity and reckless speculation, and this judgment is exactly what Kourion needs in its leadership. While I could serve as King, I might be even more effective as Economic Advisor, where my financial expertise would directly shape policy.'
    ),
    -- LANDLORDS (7 roles)
    jsonb_build_object(
      'sequence', 9,
      'name', 'Archon Apollodoros Kourionides',
      'clan', 'Clan of Landlords',
      'age', 50,
      'position', 'Lord of the Eastern Coastal Estates',
      'background', 'Apollodoros comes from one of the most ancient noble families in Kourion, with estates that have been in his family since the founding of our city-kingdom. His lands stretch along the eastern coast and include some of the most fertile olive groves and grain fields on the island. He is known for his traditional values, his fair treatment of tenant farmers, and his deep knowledge of both agriculture and the island''s history. His reputation as a steady, honorable leader has made him a natural spokesperson for the values of stability and continuity.',
      'character_traits', 'Noble and dignified, Deeply rooted in tradition, Fair and just in his dealings, Protective of established order, Wise in agricultural matters',
      'interests', 'As a member of one of the oldest and most respected families in Kourion, I believe I have both the birthright and the responsibility to serve as King during these turbulent times. My family''s generations of leadership have prepared me to guide our city-kingdom with the wisdom and stability that comes from understanding our island''s deepest traditions. The position of Economic Advisor would also suit my experience, as managing vast agricultural estates has taught me the fundamentals of resource allocation and long-term planning.'
    ),
    jsonb_build_object(
      'sequence', 10,
      'name', 'Kyria Alexandra Gerontos',
      'clan', 'Clan of Landlords',
      'age', 43,
      'position', 'Manager of Interior Grain Estates',
      'background', 'Alexandra has transformed her family''s inland estates into the most productive agricultural operations on the island through careful management and innovative farming techniques. Born to a family of modest landowners, she has expanded their holdings through shrewd business sense and her ability to maximize yields while maintaining soil quality. She is respected for her practical approach to agriculture and her success in negotiating fair agreements with both tenant farmers and grain merchants.',
      'character_traits', 'Practical and efficient, Innovative in agricultural methods, Skilled negotiator, Results-oriented, Adaptable to changing circumstances',
      'interests', 'I am willing to serve as King if our clan believes my practical experience and proven ability to manage resources effectively would benefit our city-kingdom during these challenging times. My focus is on ensuring that whoever leads us understands the fundamental importance of agricultural productivity and the need for policies that support sustainable land use. The position of Economic Advisor would allow me to apply my experience in resource management to help balance the competing demands of our various clans.'
    ),
    jsonb_build_object(
      'sequence', 11,
      'name', 'Strategos Timotheos Hoplites',
      'clan', 'Clan of Landlords',
      'age', 55,
      'position', 'Retired Military Commander Lord of Hill Estates',
      'background', 'Timotheos served with distinction in the military before inheriting his family''s hill estates, which produce some of the finest wine and olive oil on the island. His unique combination of military experience and agricultural knowledge has made him a valuable advisor to both clans, and he is known for his ability to see the connections between military security and agricultural prosperity. He commands respect from both warriors and farmers, making him an influential voice in clan deliberations.',
      'character_traits', 'Experienced in both military and agricultural matters, Wise and strategic in thinking, Skilled at building alliances, Protective of island security, Prefers to advise rather than lead',
      'interests', 'The crown is not a perk, but a highest of responsibilities. I''m ready to take this responsibility, and use my talents and relations to make our city strong and prosperous. Whoever becomes King must understand the vital connections between agricultural stability and military security. My role is to guide our clan toward supporting candidates who will maintain the balance between economic prosperity and defensive preparedness that has kept our island safe and prosperous. If called upon to serve as Judge or Economic Advisor, I would bring my experience and wisdom.'
    ),
    jsonb_build_object(
      'sequence', 12,
      'name', 'Kyrios Philippos Agronomos',
      'clan', 'Clan of Landlords',
      'age', 44,
      'position', 'Master of the Western Olive Groves',
      'background', 'Philippos oversees the most productive olive groves in western Kourion, lands that have been in his family for eight generations. He is renowned throughout the Mediterranean for the quality of his olive oil, which commands premium prices in both Greek and Phoenician markets. Unlike some traditional landlords, Philippos has carefully studied agricultural innovations and selectively adopted improvements that increase yields without compromising quality. His success has made him wealthy and influential, and he represents a pragmatic faction within the clan that values prosperity alongside tradition.',
      'character_traits', 'Practical and results-oriented, Quality-focused, Open to proven innovations, Commercially savvy, Dignified but approachable',
      'interests', 'I believe I would make an excellent King because I understand both the traditional values that have sustained Kourion and the practical realities of competing in Mediterranean markets. My success in producing the finest olive oil shows my ability to honor tradition while embracing improvements, and this balanced approach is what our city-kingdom needs. If serving as Economic Advisor, I would bring extensive experience in managing resources and understanding how agricultural prosperity forms the foundation of all other wealth.'
    ),
    jsonb_build_object(
      'sequence', 13,
      'name', 'Despoina Theodora Ktemates',
      'clan', 'Clan of Landlords',
      'age', 48,
      'position', 'Lady of the Northern Vineyards',
      'background', 'Theodora controls the extensive vineyards of northern Kourion, producing wines that are celebrated across the Mediterranean. Widowed young, she proved her capability by not only maintaining but expanding her late husband''s estates through shrewd management and careful diplomacy with neighboring landowners. She is particularly skilled at mediating disputes and building consensus among the often fractious landlord families. Her vineyards employ hundreds of workers, making her deeply invested in social stability and the welfare of common people who depend on the land.',
      'character_traits', 'Diplomatic and wise, Skilled mediator, Socially conscious, Strong but compassionate, Bridge-builder',
      'interests', 'I seek to ensure that whoever becomes King understands that the prosperity of Kourion rests not just on the wealth of nobles but on the wellbeing of all people connected to the land. My experience managing large estates has taught me that stability and fair treatment create more value than exploitation and rigid hierarchy. While I could serve as King, I recognize that my greatest strength lies in building coalitions and ensuring all voices are heard, making me an ideal kingmaker who can unite diverse factions.'
    ),
    jsonb_build_object(
      'sequence', 14,
      'name', 'Archon Herakles Geouchikos',
      'clan', 'Clan of Landlords',
      'age', 53,
      'position', 'Lord of the Central Plains',
      'background', 'Herakles controls the vast grain fields of central Kourion, the breadbasket that feeds our city-kingdom. His family claims descent from the original settlers who first cultivated these plains, and he takes this heritage with utmost seriousness. He is known as one of the most conservative members of the Landlords clan, deeply suspicious of change and fiercely protective of traditional land rights and hierarchies. His control over grain supplies gives him significant political leverage, though he rarely uses it overtly, preferring to work through traditional channels and established relationships.',
      'character_traits', 'Deeply conservative, Suspicious of innovation, Politically powerful but subtle, Protector of tradition, Proud of ancient lineage',
      'interests', 'I do not actively seek the crown, but if the clans called upon me, I would accept out of duty to preserve the traditions and values that have sustained Kourion since its founding. More importantly, I am determined to prevent any King from implementing dangerous innovations or foreign ideas that could undermine our agricultural foundation and social hierarchy. I will support candidates who respect the old ways and understand that the land and those who own it form the natural foundation of proper society.'
    ),
    jsonb_build_object(
      'sequence', 15,
      'name', 'Georgios Agronakis',
      'clan', 'Clan of Landlords',
      'age', 33,
      'position', 'Manager of the Southern Estates',
      'background', 'Georgios represents a younger generation of landlords who inherited smaller estates and have built them into profitable enterprises through hard work and practical innovation. Unlike the great noble families, he comes from lesser nobility and has earned his position in clan councils through demonstrated competence rather than ancient lineage. He has successfully integrated some Artificers'' innovations into his farming operations - improved plows, better irrigation systems - while maintaining profitable relationships with Merchants who export his produce. His success makes him both admired and resented within the more traditional clan circles.',
      'character_traits', 'Hardworking and practical, Open to useful innovation, Entrepreneurial mindset, Bridge between tradition and progress, Ambitious but grounded',
      'interests', 'I am determined to prove that the Landlords clan can adapt to changing times without abandoning our core values. While I respect tradition, I believe we must embrace innovations that increase productivity and prosperity rather than clinging to methods simply because they''re old. I don''t seek the crown for myself - I''m too young and lack the ancient lineage - but I will support candidates who understand that protecting agriculture means making it profitable and competitive, not just preserving it like a museum piece.'
    ),
    -- MERCHANTS (5 roles)
    jsonb_build_object(
      'sequence', 16,
      'name', 'Navarch Theodoros Phoenikiades',
      'clan', 'Clan of Merchants',
      'age', 45,
      'position', 'Master of Maritime Trade',
      'background', 'Theodoros has built the largest trading fleet in Kourion, with ships that regularly sail to Egyptian ports, Phoenician cities, and Persian markets across the Mediterranean. His family has been involved in copper trade for generations, and he personally negotiated the favorable trading agreements that now provide 30% of our city-kingdom''s budget. Known for his shrewd business sense and diplomatic skills, he has earned respect even from rival clans who benefit from the prosperity his trade networks bring to our island.',
      'character_traits', 'Shrewd and diplomatically skilled, Visionary about trade opportunities, Pragmatic and results-oriented, Confident and persuasive, Protective of merchant interests',
      'interests', 'I have proven my leadership abilities through building our trade networks and contributing substantially to our city-kingdom''s prosperity, and I believe I am the natural choice to serve as King. My experience in negotiating with foreign powers and managing complex commercial relationships has prepared me to guide Kourion through the challenging political waters we face. The position of Economic Advisor would also suit my talents, as I understand how to balance budgets and maximize revenue better than any member of the other clans.'
    ),
    jsonb_build_object(
      'sequence', 17,
      'name', 'Emporios Helena Kypriades',
      'clan', 'Clan of Merchants',
      'age', 52,
      'position', 'Guild Master of Copper Traders',
      'background', 'Helena controls the most established copper trading routes and has maintained steady relationships with traditional Greek trading partners for over two decades. Her family''s copper mines in the interior have provided consistent wealth for generations, and she represents the more conservative elements within our clan who prefer proven methods over risky innovations. She is known for her careful judgment and ability to build consensus among diverse merchant interests, making her a respected voice in clan deliberations.',
      'character_traits', 'Cautious and conservative, Skilled at building consensus, Loyal to traditional trading partners, Risk-averse but steady, Wise and experienced',
      'interests', 'I''m not one of those seeking the crown just for their own glory and flatter self-esteem. But I know I might be a great ruler for our city in these troubled times. I am determined to ensure that whoever becomes King understands the importance of maintaining our established trading relationships and avoiding reckless changes that could disrupt our prosperity. My role is to guide our clan''s support toward candidates who will protect our commercial interests while respecting the stability that has made our success possible. If I were to serve as Economic Advisor, I would bring the wisdom of experience to prevent costly mistakes that could harm our city-kingdom''s financial foundation.'
    ),
    jsonb_build_object(
      'sequence', 18,
      'name', 'Nauplios Kyros Salaminiades',
      'clan', 'Clan of Merchants',
      'age', 31,
      'position', 'Captain of New Trade Routes',
      'background', 'Kyros represents the new generation of merchants who are eager to expand into unexplored markets and experiment with innovative trading methods. He has successfully established profitable routes to distant lands and pioneered new techniques for preserving goods during long sea voyages. Born to a family of modest traders, he has risen through talent and ambition, earning recognition for his ability to identify opportunities that others miss and his skill at adapting quickly to changing circumstances.',
      'character_traits', 'Innovative and ambitious, Adaptable and opportunistic, Enthusiastic about new possibilities, Competitive and driven, Skilled at identifying market opportunities',
      'interests', 'I am eager to serve as King if our clan believes I can best advance our commercial interests, though I recognize that my youth might make some prefer more experienced candidates. My focus is ensuring that our clan''s innovative spirit and entrepreneurial energy shape whatever decisions the new King makes. The position of Economic Advisor would allow me to push for bold economic policies that could dramatically increase our prosperity, rather than settling for the cautious approaches that have limited our growth.'
    ),
    jsonb_build_object(
      'sequence', 19,
      'name', 'Emporios Zeno Panhellenios',
      'clan', 'Clan of Merchants',
      'age', 40,
      'position', 'Master of the Eastern Trade Routes',
      'background', 'Zeno built his fortune by establishing and maintaining the complex network of trade relationships connecting Kourion to the eastern Mediterranean markets, including Egypt, the Levant, and the Persian-influenced cities. He speaks multiple languages fluently and has lived in foreign ports for extended periods, giving him deep understanding of different commercial cultures and practices. His cosmopolitan outlook and ability to navigate diverse business environments make him invaluable to the Merchants clan, though his frequent praise of foreign practices sometimes makes traditional Greeks uncomfortable.',
      'character_traits', 'Cosmopolitan and culturally aware, Multilingual diplomat, Skilled negotiator, Comfortable with foreign customs, Sometimes seen as too foreign-friendly',
      'interests', 'I aspire to become King because I understand the interconnected nature of the Mediterranean world in ways that more insular leaders cannot. Our prosperity depends on maintaining relationships across cultural boundaries, and my experience navigating foreign courts and markets has prepared me to guide Kourion through the complex diplomatic landscape we face. If serving as Economic Advisor, I would bring unmatched knowledge of international trade and finance to ensure our city-kingdom thrives in an increasingly connected world.'
    ),
    jsonb_build_object(
      'sequence', 20,
      'name', 'Naukleros Kallisto Thalassopoula',
      'clan', 'Clan of Merchants',
      'age', 35,
      'position', 'Owner of the Silver Dolphin Trading Company',
      'background', 'Kallisto inherited a modest shipping business from her father and transformed it into one of Kourion''s most successful trading companies through bold decisions and calculated risks. As a woman in a male-dominated industry, she has had to prove herself repeatedly, earning respect through consistently profitable ventures and fair dealing with both crew and trading partners. She specializes in the luxury goods trade - fine pottery, jewelry, specialty foods - and has developed a reputation for understanding what wealthy customers want before they know it themselves. Her success has made her one of the wealthiest merchants in Kourion.',
      'character_traits', 'Bold and entrepreneurial, Market-savvy, Determined to prove herself, Fair but competitive, Understands luxury markets',
      'interests', 'I am determined to demonstrate that leadership ability, not gender or ancient family lineage, should determine who guides our city-kingdom. My success in building a trading empire from modest beginnings proves my capability, and I believe Kourion needs leaders who understand how to create wealth through innovation rather than merely inheriting it. While I harbor royal ambitions, I know I must first overcome prejudices by making my success so undeniable that even traditionalists must acknowledge my worth.'
    ),
    -- MILITARY (7 roles)
    jsonb_build_object(
      'sequence', 21,
      'name', 'Strategos Nikias Korragos',
      'clan', 'Military Clan',
      'age', 42,
      'position', 'Senior Naval Commander',
      'background', 'Nikias comes from a distinguished military family that has served Kourion for three generations, with his grandfather having fought in the great naval battles that secured our island''s independence. He has personally commanded our war galleys in successful campaigns against pirate confederations, earning recognition for his strategic brilliance and unwavering courage under fire. His reputation as both a skilled tactician and honorable leader makes him widely respected throughout the military ranks and among the common citizens.',
      'character_traits', 'Honorable and decisive, Strategically brilliant but sometimes rigid, Protective of Kourion''s traditions, Charismatic leader, Suspicious of foreign influences',
      'interests', 'I have dedicated my life to serving Kourion, and I believe the time has come for me to serve as King. My military experience has taught me that strong leadership requires both courage and wisdom, and I am confident I can guide our island city-kingdom through these turbulent times. The role of Economic Advisor would also suit my talents, as military campaigns have given me deep understanding of resource management and strategic planning. I know that my clan brothers respect my achievements and would support my candidacy.'
    ),
    jsonb_build_object(
      'sequence', 22,
      'name', 'Captain Lysander Heraklidos',
      'clan', 'Military Clan',
      'age', 34,
      'position', 'Captain of Coastal Defense',
      'background', 'Lysander is a rising star in the military, having distinguished himself by successfully integrating new naval technologies with traditional Greek fighting methods. Born to a family of bronze-smiths who shifted to military service, he understands both the practical and strategic aspects of warfare. His innovative approach to coastal defense, including the construction of new harbor fortifications and the training of elite marine units, has earned him recognition as a forward-thinking military leader who respects tradition while embracing necessary change.',
      'character_traits', 'Innovative and adaptable, Respectful of tradition but open to change, Diplomatic and pragmatic, Ambitious but patient, Skilled in both land and naval warfare',
      'interests', 'While I respect the experience of my senior colleagues, I believe our clan needs fresh leadership that can navigate the complex challenges facing Kourion. I am willing to serve as King if called upon, but I am equally prepared to support a candidate who truly understands the need for military innovation and strategic flexibility. The position of Economic Advisor would allow me to bridge the gap between military necessities and financial realities, ensuring our defenses remain strong without bankrupting our city-kingdom.'
    ),
    jsonb_build_object(
      'sequence', 23,
      'name', 'Commander Demetrios Alkibiades',
      'clan', 'Military Clan',
      'age', 48,
      'position', 'Commander of the Sacred Guard',
      'background', 'Demetrios is a veteran warrior who has served in the elite Sacred Guard that protects Kourion''s temples and ceremonial traditions for over two decades. His family has held military positions since the founding of our city-kingdom, and he embodies the ancient virtues of courage, honor, and unwavering loyalty to clan and city. Known for his fierce devotion to traditional military values and his skill with both sword and spear, he commands deep respect among the older generation of soldiers and citizens who remember the old ways.',
      'character_traits', 'Deeply traditional and conservative, Fiercely loyal to clan and city, Uncompromising in matters of honor, Skilled warrior and disciplinarian, Suspicious of change and foreign influence',
      'interests', 'I do not seek the crown for personal glory, but I would accept it if my clan brothers believe I can best serve our military interests and preserve our ancient traditions. My focus is ensuring that whoever becomes King understands that our clan''s strength and unity are essential for Kourion''s survival. If I cannot serve as King, I would be honored to advise the ruler on military matters, using my experience to guide decisions that affect our warriors and our city''s defense.'
    ),
    jsonb_build_object(
      'sequence', 24,
      'name', 'Admiral Kleomenes Thalassios',
      'clan', 'Military Clan',
      'age', 39,
      'position', 'Admiral of the Eastern Fleet',
      'background', 'Kleomenes commands the eastern naval squadron responsible for protecting Kourion''s trade routes from pirates and foreign threats. He rose through the ranks through exceptional naval tactics and has secured numerous victories against Cilician pirates, earning him respect among both military personnel and merchants who benefit from safe waters. Unlike some of his clan brothers, Kleomenes understands the economic importance of maritime security and maintains working relationships with merchant captains. His balanced approach to military matters makes him a bridge between traditional military values and practical economic necessities.',
      'character_traits', 'Strategic and adaptable, Diplomatic yet firm, Understands economic-military balance, Respected by both military and merchants, Pragmatic leader',
      'interests', 'I seek to become King because I understand that true strength comes from both military power and economic prosperity - you cannot have one without the other. My experience commanding fleets has taught me that protecting commerce is as important as winning battles, and I believe this balanced perspective is what our city-kingdom needs. If not King, I would serve excellently as Economic Advisor, as I understand how military spending and economic prosperity must be carefully balanced to ensure both security and wealth.'
    ),
    jsonb_build_object(
      'sequence', 25,
      'name', 'Lieutenant Andreas Polemistes',
      'clan', 'Military Clan',
      'age', 29,
      'position', 'Commander of the City Guard',
      'background', 'Andreas is the youngest officer to ever command Kourion''s prestigious City Guard, earning his position through exceptional skill in urban defense tactics and his ability to maintain order during civil unrest. He comes from a military family of modest means and has worked his way up through merit rather than family connections, making him popular among common soldiers and citizens alike. His youth and energy contrast with older military leaders, and he represents a new generation eager to prove their worth and modernize military practices while respecting tradition.',
      'character_traits', 'Young and ambitious, Meritocratic and fair, Popular with common soldiers, Energetic and reform-minded, Loyal to military values',
      'interests', 'I am determined to prove that youth and merit can serve Kourion as well as age and noble lineage. While I may not seek the crown for myself yet, I am committed to ensuring that our clan''s interests are protected and that whoever becomes King recognizes the importance of a strong, well-trained military force loyal to Kourion rather than to foreign powers. I believe that military service should be rewarded based on achievement rather than birth, and I will support any candidate who shares this view.'
    ),
    jsonb_build_object(
      'sequence', 26,
      'name', 'Hoplite Commander Philon Aspidos',
      'clan', 'Military Clan',
      'age', 46,
      'position', 'Commander of the Heavy Infantry',
      'background', 'Philon commands Kourion''s elite hoplite phalanx, the backbone of our land-based military power. He is a veteran of numerous border skirmishes and has trained generations of heavy infantry in the traditional Greek fighting formation. Coming from a family of professional soldiers dating back five generations, Philon embodies military discipline and the warrior ethos. He is deeply respected within the military clan for his unwavering dedication to traditional combat values and his refusal to compromise on training standards, though some view him as inflexible.',
      'character_traits', 'Traditional and disciplined, Uncompromising on standards, Veteran warrior, Deeply honorable, Somewhat inflexible',
      'interests', 'I do not seek the crown for myself - I am a soldier, not a politician. However, I am absolutely committed to ensuring that whoever becomes King understands that military strength and discipline are the foundations upon which all other prosperity rests. Without strong warriors trained in the traditional ways, our city-kingdom would fall to the first enemy with the will to take it. I will support candidates who respect military tradition and understand that cutting military funding is cutting our own throats.'
    ),
    jsonb_build_object(
      'sequence', 27,
      'name', 'Strategos Kassandra Polemarch',
      'clan', 'Military Clan',
      'age', 37,
      'position', 'Strategic Defense Coordinator',
      'background', 'Kassandra is one of the few women to achieve high military rank in Kourion, earning her position through exceptional strategic brilliance and her role in designing the integrated defense system that coordinates our naval and land forces. She comes from a distinguished military family and studied military theory alongside practical combat training. Her innovative approach to defense planning has earned grudging respect even from traditional military leaders, though some still question whether a woman should hold such authority. She is known for her analytical mind and ability to anticipate enemy strategies.',
      'character_traits', 'Brilliant strategist, Analytical and forward-thinking, Determined to prove herself, Bridges tradition and innovation, Politically astute',
      'interests', 'I am determined to prove that leadership ability, not gender, should determine who guides our city-kingdom. While I harbor royal ambitions, I recognize that I must first overcome prejudices and demonstrate my worth beyond question. I am committed to supporting candidates who value strategic thinking and competence over tradition for tradition''s sake, while still respecting the military values that have protected Kourion for generations. If not King, serving as Economic Advisor would allow me to demonstrate how strategic resource allocation can maximize our city-kingdom''s power.'
    ),
    -- PHILOSOPHERS (3 roles)
    jsonb_build_object(
      'sequence', 28,
      'name', 'Philosophos Sokrates Ethikos',
      'clan', 'Clan of Philosophers',
      'age', 51,
      'position', 'Master of the Academy',
      'background', 'Sokrates leads the most respected school of philosophy in Kourion and has trained many of the young leaders who now serve in various clan positions throughout our city-kingdom. His family has served as teachers and advisors for generations, and he is known for his ability to see beyond immediate political concerns to the deeper ethical questions that should guide our decisions. His reputation for wisdom and integrity has made him a trusted advisor to leaders across all clans, even those who disagree with his positions.',
      'character_traits', 'Wise and thoughtful, Committed to ethical principles, Skilled at seeing long-term consequences, Respected across clan lines, Focused on justice and fairness',
      'interests', 'I do not seek the crown for personal ambition, but I would accept it and I would use the position to ensure that our city-kingdom''s decisions are guided by wisdom and ethical principles rather than mere self-interest. My primary goal is to serve as a voice for the common good, helping our people understand that true prosperity comes from justice and virtue rather than wealth and power alone. The position of Economic Advisor would allow me to promote policies that benefit all citizens while maintaining the moral foundation that makes our society worth defending.'
    ),
    jsonb_build_object(
      'sequence', 29,
      'name', 'Didaskalos Aristoteles Politikos',
      'clan', 'Clan of Philosophers',
      'age', 39,
      'position', 'Master of Political Studies',
      'background', 'Aristoteles has studied the governmental systems of city-kingdoms throughout the Mediterranean and has developed practical theories about how philosophical principles can be applied to real political challenges. Born to a family of scholars, he has earned recognition for his ability to bridge the gap between abstract philosophical concepts and the practical needs of governance. His writings on political theory have influenced leaders throughout our region, and he is known for his balanced approach to complex problems.',
      'character_traits', 'Intellectually rigorous, Skilled at practical applications of theory, Balanced and moderate in approach, Focused on effective governance, Comfortable with complexity',
      'interests', 'I am willing to serve as King if our clan believes my understanding of political theory and practical governance would benefit our city-kingdom during these complex times. My focus is ensuring that our philosophical principles are applied in ways that actually improve the lives of our citizens rather than remaining abstract ideals. The position of Economic Advisor would allow me to promote policies that balance competing interests while maintaining the ethical foundations that make our society worth preserving.'
    ),
    jsonb_build_object(
      'sequence', 30,
      'name', 'Rhetor Kalliope Logike',
      'clan', 'Clan of Philosophers',
      'age', 45,
      'position', 'Master of Rhetoric and Public Speaking',
      'background', 'Kalliope teaches rhetoric at Kourion''s academy and serves as an advisor to citizens navigating legal and political matters. She is renowned for her ability to analyze arguments, identify logical fallacies, and articulate complex ideas in ways that move both hearts and minds. Coming from a merchant family, she brings practical understanding of commerce and politics to her philosophical training, making her less idealistic and more pragmatic than some philosophers. She has successfully mediated numerous disputes between clans and citizens, earning a reputation as someone who can find common ground even in bitter conflicts.',
      'character_traits', 'Eloquent and persuasive, Analytical and logical, Pragmatic philosopher, Skilled mediator, Understands politics and rhetoric',
      'interests', 'I seek to ensure that whoever becomes King understands the power of words and ideas in maintaining social cohesion and effective governance. My experience teaching rhetoric and mediating disputes has taught me that most conflicts arise from miscommunication and failure to understand others'' perspectives rather than from irreconcilable differences. While I could serve as King, my greatest value might be as Economic Advisor or Senior Judge, where my ability to analyze situations clearly and communicate effectively would benefit all of Kourion.'
    )
  );

  -- Update the template
  UPDATE simulation_templates
  SET canonical_roles = updated_roles,
      updated_at = NOW()
  WHERE template_id = target_template_id;

  RAISE NOTICE '✅ Successfully updated % roles with full details', jsonb_array_length(updated_roles);
END $$;

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- All 30 roles now have complete details:
--   - background (detailed backstory)
--   - character_traits (personality)
--   - interests (motivations and aspirations)
-- ============================================================================
