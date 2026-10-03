"""
Generate 610 Authentic SSB Model Stories (520 TAT + 90 PPDT)
Conforming to DIPR / SSB Psychological Assessment Standards
"""

import json
import re
import random

def build_generator():
    first_names_m = [
        "Vikram", "Rohan", "Arjun", "Siddharth", "Tarun", "Aditya", "Rahul", "Varun",
        "Aman", "Kunal", "Abhinav", "Mohit", "Nikhil", "Harish", "Alok", "Gaurav",
        "Pranav", "Vivek", "Chetan", "Ashish", "Manish", "Rajat", "Deepak", "Sanjay",
        "Ankit", "Sumit", "Mayank", "Sameer", "Rajesh", "Karan", "Vishal", "Akash"
    ]
    first_names_f = [
        "Ananya", "Priya", "Neha", "Meera", "Sneha", "Kavya", "Ritu", "Shreya",
        "Deepa", "Sunita", "Aarti", "Shalini", "Swati", "Divya", "Pallavi", "Rashmi",
        "Tanvi", "Kriti", "Bhavna", "Preeti", "Nidhi", "Jyoti", "Vandana", "Pooja",
        "Isha", "Ritika", "Pooja", "Rupal", "Simran", "Nandini", "Anjali", "Sonal"
    ]
    last_names = [
        "Sharma", "Verma", "Singh", "Patel", "Rao", "Nair", "Sen", "Joshi", "Das",
        "Iyer", "Reddy", "Banerjee", "Kulkarni", "Mehta", "Choudhury", "Bhatt", "Gill",
        "Deshmukh", "Yadav", "Mishra", "Chauhan", "Mukherjee", "Pillai", "Menon",
        "Saxena", "Goswami", "Dutta", "Pandey", "Kapoor", "Bhatia", "Trivedi", "Sengupta"
    ]

    # Category scenario seeds
    category_scenarios = {
        "Crisis & Rescue": [
            {
                "theme": "Flash Flood Evacuation & Bridge Reinforcement",
                "problem": "a sudden surge in the local river threatened to submerge the low-lying bridge and cut off three hamlets",
                "actions": [
                    "quickly alerted the local administration and mobilized the village youth council",
                    "requisitioned sandbags and timber props from the nearby construction yard to reinforce the bridge supports",
                    "established an orderly evacuation line for senior citizens and livestock toward the primary school shelter",
                    "coordinated with NDRF volunteers to install safety ropes and warning markers along the inundated approach road"
                ],
                "outcome": "safely evacuated 140 villagers before the peak flood, prevented structural collapse of the bridge, and ensured emergency supplies reached all families",
                "olqs": ["Effective Intelligence", "Organizing Ability", "Initiative", "Courage", "Sense of Responsibility"],
                "blunder": "Do not show people drowning in panic or hero jumping into raging waters without safety gear. Show organized rescue and preventive administration."
            },
            {
                "theme": "Landslide Clearance & Medical Convoy Relief",
                "problem": "a monsoon landslide blocked the arterial mountain highway, stranding an ambulance convoy and over fifty commuter vehicles",
                "actions": [
                    "immediately informed the Border Roads Organisation (BRO) and local sub-divisional magistrate",
                    "marshaled available earth-moving equipment and civil volunteers from the highway toll post",
                    "triaged patients inside stranded vehicles, providing clean water, blankets, and basic first aid",
                    "directed targeted rock clearance while stationing spotters to monitor slope stability"
                ],
                "outcome": "cleared a single-lane corridor within two hours, facilitated priority passage for the medical vehicles, and ensured zero secondary casualties",
                "olqs": ["Speed of Decision", "Effective Intelligence", "Social Adaptability", "Stamina", "Organizing Ability"],
                "blunder": "Avoid dramatic stories about terrorist sabotage or panic. Focus on civil engineering, traffic management, and logistical triage."
            },
            {
                "theme": "Industrial Chemical Leak Containment",
                "problem": "a storage valve leak of mild ammonia was detected during the nocturnal shift change at an agrochemical processing plant",
                "actions": [
                    "immediately sounded the localized safety siren and engaged the water-curtain neutralization system",
                    "donned self-contained breathing apparatus and led the technician squad to shut the main isolation valve",
                    "cordoned off the hazard zone and guided downwind personnel to the designated crosswind assembly zone",
                    "contacted district fire services and handed over an accurate material safety data sheet (MSDS) upon arrival"
                ],
                "outcome": "arrested the vapor leakage within fifteen minutes, verified all shift workers were accounted for, and restored ambient air quality",
                "olqs": ["Effective Intelligence", "Self Confidence", "Sense of Responsibility", "Initiative", "Cooperation"],
                "blunder": "Do not portray fatalities, stampedes, or heroic gas-inhalation. Emphasize standard industrial SOPs, safety gear, and rapid containment."
            },
            {
                "theme": "Building Fire Containment & Evacuation",
                "problem": "an electrical short circuit sparked a localized blaze on the upper floor of a municipal commercial complex",
                "actions": [
                    "triggered the manual fire alarm and immediately cut off the building main electrical junction",
                    "organized floor wardens to direct occupants via fire staircases while discouraging elevator usage",
                    "deployed CO2 fire extinguishers to suppress the electrical panel fire before it spread to adjacent offices",
                    "assisted local fire brigades by pointing out hydrant positions and confirming full evacuation of floor premises"
                ],
                "outcome": "doused the flames swiftly with no burn injuries, prevented inventory loss, and initiated a building-wide wiring safety audit",
                "olqs": ["Organizing Ability", "Speed of Decision", "Courage", "Initiative", "Social Adaptability"],
                "blunder": "Avoid making the protagonist jump through fire or carry dead bodies. Highlight leadership, prompt alarm triggering, and orderly evacuation."
            }
        ],
        "Rural & Community Development": [
            {
                "theme": "Drip Irrigation & Check-Dam Construction",
                "problem": "scanty pre-monsoon rains caused declining water tables and threatened the upcoming kharif sowing across two adjoining villages",
                "actions": [
                    "convened a joint Gram Sabha meeting to explain the cost-benefit of community check-dams and micro-irrigation",
                    "coordinated with the block agricultural officer to secure government subsidy under PM Krishi Sinchayee Yojana",
                    "organized youth volunteers for shramdaan to build stone-and-clay bunds across the seasonal catchment nallah",
                    "guided local farmers in laying shared drip lines and adopting drought-tolerant millets"
                ],
                "outcome": "recharged four community tube-wells, increased water retention by 40%, and secured timely sowing for over two hundred farmer families",
                "olqs": ["Effective Intelligence", "Social Adaptability", "Organizing Ability", "Cooperation", "Initiative"],
                "blunder": "Do not portray villagers as ignorant or uncooperative. Show collaborative leadership, practical civil schemes, and community participation."
            },
            {
                "theme": "Rural Solar Microgrid Installation",
                "problem": "frequent grid outages disrupted study hours for matriculation students and halted evening cottage handicraft operations",
                "actions": [
                    "conducted an energy demand audit of the village school, community center, and streetlight junction",
                    "drafted a proposal for a rooftop solar microgrid under the district renewable energy initiative",
                    "mobilized village youth for basic electrical technician training conducted by the solar supplier",
                    "instituted a modest community maintenance fund to guarantee battery upkeep and spare parts"
                ],
                "outcome": "energized 24x7 solar lighting for the school library and common streets, boosting student pass percentages and nocturnal cottage productivity",
                "olqs": ["Organizing Ability", "Liveliness", "Social Adaptability", "Initiative", "Sense of Responsibility"],
                "blunder": "Avoid relying solely on government charity without community ownership. Emphasize self-reliance, local maintenance, and measurable utility."
            },
            {
                "theme": "Community Health & Sanitation Overhaul",
                "problem": "waterborne illnesses spiked in the village following monsoon waterlogging in low-lying open drains",
                "actions": [
                    "surveyed stagnant water pockets with the local Anganwadi workers and village elders",
                    "requisitioned bleaching powder, anti-larval sprays, and drain-cleaning implements from the block health office",
                    "mobilized village households into four sanitation clusters to de-silt drainage trenches and cover soak-pits",
                    "organized an interactive awareness session on drinking water boiling and chlorinated storage"
                ],
                "outcome": "completely eliminated vector breeding grounds, dropped clinic fever cases by 90%, and institutionalized weekly community sanitation drives",
                "olqs": ["Initiative", "Social Adaptability", "Organizing Ability", "Effective Intelligence", "Cooperation"],
                "blunder": "Do not introduce cholera epidemics with tragic deaths. Focus on preventive public health, cleanliness drives, and organized community hygiene."
            }
        ],
        "Industrial & Engineering": [
            {
                "theme": "Boiler Safety Overhaul & Pressure Stabilization",
                "problem": "thermal sensors in the secondary steam boiler indicated abnormal pressure spikes during peak factory production hours",
                "actions": [
                    "instructed operators to reduce burner firing rates and reroute excess steam through the bypass manifold",
                    "reviewed telemetry logs with the maintenance team to pinpoint a jammed pneumatic safety relief valve",
                    "deputed a specialized mechanical technician squad with heat-resistant gear to replace the faulty diaphragm",
                    "conducted hydrostatic pressure validation and recalibrated automated digital telemetry"
                ],
                "outcome": "safely stabilized operating pressure without plant shutdown, prevented thermal fatigue, and upgraded scheduled preventive inspections",
                "olqs": ["Effective Intelligence", "Reasoning Ability", "Organizing Ability", "Speed of Decision", "Sense of Responsibility"],
                "blunder": "Do not depict explosion disasters or boiler blasts. Focus on engineering diagnostics, systematic trouble-shooting, and preventative safety."
            },
            {
                "theme": "Bridge Structural Inspection & Retrofitting",
                "problem": "annual ultrasonic non-destructive testing revealed micro-fractures in the steel expansion joints of a vital highway flyover",
                "actions": [
                    "liaised with traffic police to introduce night-time single-lane diversions to minimize commuter inconvenience",
                    "procured high-tensile carbon-fiber reinforcement jackets and specialized hydraulic torque wrenches",
                    "supervised a round-the-clock technician crew executing precision gouging, welding, and joint sealing",
                    "conducted dynamic load-deflection sensor tests with loaded trucks to verify structural integrity"
                ],
                "outcome": "completed structural strengthening 36 hours ahead of schedule, restored full 40-tonne freight capacity, and guaranteed long-term safety",
                "olqs": ["Effective Intelligence", "Organizing Ability", "Sense of Responsibility", "Initiative", "Cooperation"],
                "blunder": "Do not write about bridge collapse or contractor corruption. Emphasize modern civil engineering, safety standards, and project planning."
            },
            {
                "theme": "Assembly Line Automation & Ergonomic Redesign",
                "problem": "bottlenecks in manual component packaging caused operator fatigue and a 15% shipment backlog in the manufacturing unit",
                "actions": [
                    "conducted a time-motion study of the assembly line alongside senior shop-floor machinists",
                    "designed an adjustable pneumatic roller fixture and relocated high-frequency tools to elbow height",
                    "conducted hands-on operator workshops on ergonomic posture and balanced rotation cycles",
                    "established an hourly digital tally board to monitor throughput and celebrate zero-defect milestones"
                ],
                "outcome": "reduced operator physical strain, eliminated the dispatch backlog within a fortnight, and elevated daily line efficiency by 22%",
                "olqs": ["Effective Intelligence", "Social Adaptability", "Organizing Ability", "Liveliness", "Cooperation"],
                "blunder": "Avoid portraying labor strikes or conflict. Focus on scientific management, employee welfare, productivity enhancement, and mutual trust."
            }
        ],
        "Law, Order & Security": [
            {
                "theme": "Crowd Control & Festival Logistics Management",
                "problem": "a footfall exceeding two lakh devotees was projected for the annual riverfront temple pilgrimage",
                "actions": [
                    "conducted a joint reconnaissance of entry-exit corridors with civil police, home guards, and shrine trustees",
                    "implemented a unidirectional zigzag barricading system and established six shaded holding bays",
                    "deployed drone surveillance, emergency PA announcement towers, and designated lost-and-found reunion desks",
                    "stationed mobile medical first-aid teams and water tanker points at hundred-meter intervals"
                ],
                "outcome": "ensured incident-free darshan for all pilgrims, prevented bottleneck surges, and received commendation for exemplary public safety",
                "olqs": ["Organizing Ability", "Effective Intelligence", "Social Adaptability", "Speed of Decision", "Courage"],
                "blunder": "Do not write about terror bomb threats or stampedes. Demonstrate meticulous crowd dynamics, route mapping, and compassionate policing."
            },
            {
                "theme": "Night Patrolling & Neighborhood Crime Deterrence",
                "problem": "a string of late-night warehouse break-ins caused apprehension among local merchants in the industrial sector",
                "actions": [
                    "mapped crime hot-spots and timeline patterns using recent station daily diary entries",
                    "convened a coordination meet with merchant association leaders to establish standardized CCTV coverage",
                    "re-aligned beat patrolling schedules, introducing randomized motorcycle patrol pairs with high-visibility jackets",
                    "created a dedicated WhatsApp distress hotline monitored round-the-clock by the sub-inspector on duty"
                ],
                "outcome": "deterred criminal elements, restored trader confidence, and achieved zero burglary incidents over the following six months",
                "olqs": ["Effective Intelligence", "Initiative", "Sense of Responsibility", "Social Adaptability", "Determination"],
                "blunder": "Avoid Hollywood style gunfights or solo vigilantism. Highlight intelligence-driven patrolling, community collaboration, and police ethics."
            }
        ],
        "Healthcare & Medical": [
            {
                "theme": "Multi-Specialty Remote Tribal Health Camp",
                "problem": "seasonal viral fever and high anemia prevalence were detected in isolated tribal settlements lacking hospital access",
                "actions": [
                    "requisitioned a mobile medical van equipped with diagnostic kits, vaccines, and essential pediatric medicines",
                    "liaised with local village heads and Anganwadi workers to ensure high attendance and clear communication",
                    "conducted systematic screening, hemoglobin spot checks, and dispensed nutritional iron-folate supplements",
                    "referred three critical expectant mothers to the district hospital via prepaid emergency ambulance transit"
                ],
                "outcome": "treated over 350 patients across two days, vaccinated 75 infants, and scheduled recurring fortnightly doctor visits",
                "olqs": ["Organizing Ability", "Social Adaptability", "Sense of Responsibility", "Initiative", "Cooperation"],
                "blunder": "Do not introduce terminal illness despair. Emphasize organized public health, compassionate patient rapport, and sustained follow-up."
            },
            {
                "theme": "Blood Donation & Trauma Readiness Drive",
                "problem": "the regional blood bank faced acute shortage of rare negative blood groups ahead of the festive travel season",
                "actions": [
                    "coordinated with city colleges, NCC units, and corporate offices to host a centralized voluntary donation camp",
                    "arranged sterile donor beds, refreshments, and medical screening booths with the Red Cross Society",
                    "conducted interactive myth-busting sessions addressing misconceptions regarding voluntary blood donation",
                    "established a digital donor directory categorized by blood group and pin code for rapid emergency mobilization"
                ],
                "outcome": "collected 280 units of whole blood, registered 95 rare group on-call donors, and bolstered regional trauma emergency reserves",
                "olqs": ["Social Adaptability", "Organizing Ability", "Initiative", "Liveliness", "Sense of Responsibility"],
                "blunder": "Do not create hospital horror scenarios. Highlight civic mobilization, awareness building, and rigorous medical hygiene standards."
            }
        ],
        "Youth, Sports & Education": [
            {
                "theme": "Inter-District Youth Football Tournament",
                "problem": "lack of structured athletic fixtures led to declining youth engagement and underutilized municipal sporting grounds",
                "actions": [
                    "mobilized local sports clubs and corporate sponsors to fund tournament kits, trophies, and hydration stations",
                    "supervised ground renovation: de-stoned the turf, rolled the pitch, and installed regulation goalposts and lighting",
                    "recruited certified district referees and partnered with the local hospital for pitch-side sports physiotherapists",
                    "instituted fair-play awards and coordinated sports scout presence from state athletic academies"
                ],
                "outcome": "successfully hosted sixteen district teams, uncovered three state-level talents, and established a perennial youth sports club",
                "olqs": ["Liveliness", "Organizing Ability", "Social Adaptability", "Cooperation", "Initiative"],
                "blunder": "Do not write about brawls, gambling, or referee bias. Show vibrant camaraderie, discipline, youth empowerment, and sportsmanship."
            },
            {
                "theme": "Digital Literacy & Modern Science Laboratory Setup",
                "problem": "students in the rural higher secondary school lacked experiential science apparatus and computer facilities",
                "actions": [
                    "spearheaded a project proposal under the corporate social responsibility (CSR) education initiative",
                    "converted an idle storage hall into an interactive STEM laboratory and eight-computer digital learning hub",
                    "trained senior students as laboratory peer-mentors to maintain equipment and assist younger classes",
                    "curated hands-on physics and chemistry demonstration modules aligned with the board syllabus"
                ],
                "outcome": "empowered 400 rural pupils with weekly practical laboratory exposure, doubling practical exam scores and sparking science curiosity",
                "olqs": ["Initiative", "Organizing Ability", "Effective Intelligence", "Social Adaptability", "Determination"],
                "blunder": "Avoid themes of despair over poverty. Emphasize proactive resource generation, student mentoring, and educational innovation."
            }
        ],
        "Maritime & Aviation": [
            {
                "theme": "Offshore Trawler Search & Rescue Coordination",
                "problem": "a sudden squall disabled the rudder and communications array of a deep-sea fishing craft with seven crew aboard",
                "actions": [
                    "plotted prevailing oceanic current drift vectors using maritime weather radar and satellite wind charts",
                    "dispatched an offshore patrol vessel while maintaining constant radio relay with coastal fishing vessels",
                    "sighted the drifting trawler through marine infrared optics and established secure towing lines",
                    "transferred emergency hot meals, warm blankets, and conducted on-board engine alternator repairs"
                ],
                "outcome": "safely towed the trawler back to harbor within four hours, ensured all fishermen were healthy, and overhauled port storm advisories",
                "olqs": ["Speed of Decision", "Effective Intelligence", "Courage", "Sense of Responsibility", "Stamina"],
                "blunder": "Do not depict ship sinkings with drowning fishermen. Highlight modern navigation, seamanship, meteorology, and search-and-rescue SOPs."
            },
            {
                "theme": "Airport Runway Debris Inspection & Flight Safety",
                "problem": "pre-dawn gale winds scattered metallic fragments and tree branches across the primary airport active runway",
                "actions": [
                    "ordered a momentary tactical ground stop for arriving flights in consultation with Air Traffic Control",
                    "marshaled airside operations vehicles and runway sweeper trucks in a synchronized sweeping sweep",
                    "conducted a line-abreast visual FOD (Foreign Object Debris) walk with ground marshals to verify tarmac clean-up",
                    "re-certified runway friction coefficients using decelerometer test runs before resuming departures"
                ],
                "outcome": "reopened the main runway in 22 minutes with zero flight cancellations, averting tyre blowouts and maintaining absolute safety",
                "olqs": ["Effective Intelligence", "Speed of Decision", "Organizing Ability", "Sense of Responsibility", "Cooperation"],
                "blunder": "Avoid dramatic plane crashes or hijacking fiction. Demonstrate rigorous aviation safety, precision coordination, and flight discipline."
            }
        ],
        "Science, Ecology & Wildlife": [
            {
                "theme": "Mangrove Afforestation & Coastal Erosion Shield",
                "problem": "cyclonic tidal surges were eroding the shoreline and threatening estuarine brackish water bio-diversity",
                "actions": [
                    "demarcated high-erosion mudflats in collaboration with coastal ecology research scholars",
                    "sourced native rhizophora saplings from coastal nursery reserves and coordinated tidal planting schedules",
                    "involved local fishing youth in creating bamboo silt-traps to anchor fresh sapling roots against undertow",
                    "instituted a community mangrove stewardship register to monitor survival rates and crab protection"
                ],
                "outcome": "planted 5,000 mangrove saplings with an 88% survival rate, stabilized 2km of coastal bank, and restored natural fish nurseries",
                "olqs": ["Initiative", "Effective Intelligence", "Social Adaptability", "Determination", "Cooperation"],
                "blunder": "Avoid fatalistic complaints about global warming. Show active ecological conservation, field botany, and community partnership."
            },
            {
                "theme": "Forest Fire Counter-Burning & Wildlife Corridors",
                "problem": "unseasonal dry winds threatened to push a forest brush fire across the buffer zone into a national park sanctuary",
                "actions": [
                    "deployed drone thermal cameras to map the fire front trajectory and active spark embers",
                    "led forest guard teams with water backpacks and leaf blowers to clear a ten-meter firebreak line",
                    "executed controlled back-burning against the wind to starve the advancing fire of combustible undergrowth",
                    "ensured open transit corridors for grazing herbivores toward the sanctuary river basin"
                ],
                "outcome": "contained the wildfire inside the buffer zone within six hours, preserved primary forest canopy, and safeguarded all wildlife",
                "olqs": ["Courage", "Speed of Decision", "Effective Intelligence", "Organizing Ability", "Stamina"],
                "blunder": "Do not show animals burning or panic. Emphasize forestry science, firebreak techniques, wildlife protection, and physical courage."
            }
        ],
        "Corporate, Logistics & Leadership": [
            {
                "theme": "Railway Freight Turnaround & Cold-Chain Logistics",
                "problem": "delays in refrigerated container offloading at the inland container depot risked spoiling perishable horticultural cargo",
                "actions": [
                    "conducted real-time yard inspection and reorganized gantry crane allocations to prioritize reefers",
                    "coordinated with terminal railway engineers to synchronize locomotive shunting with customs clearance desks",
                    "monitored ambient cooling temperature telemetry continuously, plugging reefers into auxiliary yard power bays",
                    "dispatched express road trailer convoys as soon as containers cleared inspection"
                ],
                "outcome": "reduced rake turnaround duration by 35%, preserved 100% of produce freshness, and established an express cargo protocol",
                "olqs": ["Organizing Ability", "Effective Intelligence", "Reasoning Ability", "Initiative", "Sense of Responsibility"],
                "blunder": "Avoid corporate fraud or union dispute melodrama. Highlight supply chain efficiency, logistical coordination, and asset turnaround."
            },
            {
                "theme": "Warehouse Safety Redesign & Ergonomic Workflow",
                "problem": "congested forklift aisles in the regional fulfillment hub resulted in minor pallet scrapes and dispatch delays",
                "actions": [
                    "charted forklift traffic patterns and redesigned aisle movement into a one-way circulation circuit",
                    "installed high-visibility convex mirrors, floor laser lane guides, and automated speed governors",
                    "conducted a two-day refresher on defensive forklift operation and safe pallet stacking protocols",
                    "implemented a digital barcode inventory tracking grid to eliminate redundant forklift traversing"
                ],
                "outcome": "achieved zero pallet collisions, enhanced dispatch speed by 28%, and elevated safety audit compliance to five-star standards",
                "olqs": ["Effective Intelligence", "Organizing Ability", "Social Adaptability", "Sense of Responsibility", "Cooperation"],
                "blunder": "Do not portray catastrophic forklift disasters. Emphasize standard warehouse safety, industrial design, and operator training."
            }
        ],
        "Self-Directed / Final Slide": [
            {
                "theme": "District Youth Armed Forces Mentorship Academy",
                "problem": "rural candidates lacked awareness of physical conditioning standards, psychological tests, and SSB officer procedures",
                "actions": [
                    "requisitioned the community playground to lay down obstacle training courses including rope climbing and ditch jumps",
                    "organized weekend mock testing sessions covering OIR reasoning drills, PPDT discussions, and TAT storytelling",
                    "invited veteran military officers to deliver guest lectures on leadership ethos and current affairs",
                    "established a shared library containing NDA, CDSE, and SSB reference books and daily national newspapers"
                ],
                "outcome": "trained 65 aspirants from rural schools, resulting in eight recommendations in recent board cycles and inspiring hundreds more",
                "olqs": ["Initiative", "Organizing Ability", "Social Adaptability", "Liveliness", "Sense of Responsibility"],
                "blunder": "Avoid passive daydreaming. Show realistic self-initiative, social contribution, discipline, and organized youth mentorship."
            }
        ]
    }

    return first_names_m, first_names_f, last_names, category_scenarios

def generate_all():
    first_names_m, first_names_f, last_names, category_scenarios = build_generator()

    with open('js/stimuli-data.js', 'r', encoding='utf-8') as f:
        content = f.read()

    tat_match = re.search(r'tat:\s*(\[[\s\S]*?\]),\s*ppdt:', content)
    ppdt_match = re.search(r'ppdt:\s*(\[[\s\S]*?\]),\s*docs:', content)

    tat_list = json.loads(tat_match.group(1))
    ppdt_list = json.loads(ppdt_match.group(1))

    all_stories = {
        "tat": [],
        "ppdt": []
    }

    random.seed(42) # Deterministic high quality generation

    # Generate for TAT (520)
    for idx, item in enumerate(tat_list):
        cat = item.get("category", "Crisis & Rescue")
        if cat not in category_scenarios:
            cat = "Crisis & Rescue"
        
        scenarios = category_scenarios[cat]
        scenario = scenarios[idx % len(scenarios)]
        
        is_female = (idx % 4 == 0)
        hero_fname = random.choice(first_names_f) if is_female else random.choice(first_names_m)
        hero_lname = random.choice(last_names)
        hero_name = f"{hero_fname} {hero_lname}"
        hero_age = 22 + (idx % 5) # 22 to 26
        
        roles = item.get("suggested_roles", ["Administrative Officer", "Project Lead"])
        hero_prof = roles[idx % len(roles)]

        # Generate structured 4-part story
        story_p1 = f"{hero_name}, a {hero_age}-year-old {hero_prof}, was inspecting the site when {scenario['problem']}."
        action_a = scenario["actions"][0]
        action_b = scenario["actions"][1]
        action_c = scenario["actions"][2]
        action_d = scenario["actions"][3]
        story_p2 = f"Recognizing the urgency, {hero_fname} {action_a} and {action_b}."
        story_p3 = f"Leading from the front, {hero_fname} {action_c} while ensuring that {action_d}."
        story_p4 = f"Through swift coordination and resolve, the team {scenario['outcome']}."
        
        full_story = f"{story_p1} {story_p2} {story_p3} {story_p4}"
        word_count = len(full_story.split())

        story_obj = {
            "id": item["id"],
            "num": item["num"],
            "type": "tat",
            "title": f"{item['title']} - {scenario['theme']}",
            "category": cat,
            "image": item["image"],
            "hero": {
                "name": hero_name,
                "gender": "Female" if is_female else "Male",
                "age": hero_age,
                "profession": hero_prof,
                "mood": "+"
            },
            "story": full_story,
            "word_count": word_count,
            "action_breakdown": {
                "observe": f"{hero_fname} accurately observed that {scenario['problem']}.",
                "plan": f"Formulated a focused intervention plan to {action_a}.",
                "execute": f"Personally executed {action_b} and organized {action_c}.",
                "outcome": f"Successfully {scenario['outcome']}."
            },
            "olqs_demonstrated": scenario["olqs"],
            "blunder_warning": scenario["blunder"],
            "context_cue": item.get("context_cue", "")
        }
        all_stories["tat"].append(story_obj)

    # Generate for PPDT (90)
    for idx, item in enumerate(ppdt_list):
        cat = item.get("category", "Crisis & Rescue")
        if cat not in category_scenarios:
            cat = "Crisis & Rescue"
        
        scenarios = category_scenarios[cat]
        scenario = scenarios[idx % len(scenarios)]

        is_female = (idx % 3 == 0)
        hero_fname = random.choice(first_names_f) if is_female else random.choice(first_names_m)
        hero_lname = random.choice(last_names)
        hero_name = f"{hero_fname} {hero_lname}"
        hero_age = 23 + (idx % 4) # 23 to 26

        roles = item.get("suggested_roles", ["Field Coordinator", "Youth Lead"])
        hero_prof = roles[idx % len(roles)]

        # Secondary characters in PPDT box
        char_count = 2 + (idx % 2) # 2 or 3 characters
        box_characters = [
            {"gender": "F" if is_female else "M", "age": hero_age, "mood": "+", "role": "Main Character (Hero)"}
        ]
        if char_count >= 2:
            box_characters.append({"gender": "M" if is_female else "F", "age": hero_age - 1, "mood": "+", "role": "Colleague / Peer"})
        if char_count >= 3:
            box_characters.append({"gender": "M", "age": hero_age + 20, "mood": "0", "role": "Senior / Supervisor / Villager"})

        # Action headline for PPDT
        ppdt_action = f"{scenario['theme']} in {cat}"

        story_p1 = f"{hero_name}, a {hero_age}-year-old {hero_prof}, was on field duty when {scenario['problem']}."
        action_a = scenario["actions"][0]
        action_b = scenario["actions"][1]
        action_c = scenario["actions"][2]
        action_d = scenario["actions"][3]
        story_p2 = f"Assessing the scene objectively, {hero_fname} {action_a} and delegated tasks to {action_b}."
        story_p3 = f"Taking the initiative, {hero_fname} {action_c} while coordinating with {action_d}."
        story_p4 = f"Due to disciplined team execution, they {scenario['outcome']}."

        full_story = f"{story_p1} {story_p2} {story_p3} {story_p4}"
        word_count = len(full_story.split())

        story_obj = {
            "id": item["id"],
            "num": item["num"],
            "type": "ppdt",
            "title": f"{item['title']} - {scenario['theme']}",
            "category": cat,
            "image": item["image"],
            "ppdt_action": ppdt_action,
            "hero": {
                "name": hero_name,
                "gender": "Female" if is_female else "Male",
                "age": hero_age,
                "profession": hero_prof,
                "mood": "+"
            },
            "box_characters": box_characters,
            "story": full_story,
            "word_count": word_count,
            "action_breakdown": {
                "observe": f"Identified immediate priority when {scenario['problem']}.",
                "plan": f"Formulated a step-by-step strategy to {action_a}.",
                "execute": f"Marshaled resources to {action_b} and led {action_c}.",
                "outcome": f"Accomplished goal: {scenario['outcome']}."
            },
            "olqs_demonstrated": scenario["olqs"],
            "blunder_warning": scenario["blunder"],
            "context_cue": item.get("context_cue", "")
        }
        all_stories["ppdt"].append(story_obj)

    # Output to js/model-stories-data.js
    output_js = f"/* ==========================================================================\n" \
                f"   SSB Master Model Story Archive - 610 Authentic Officer-Grade Stories\n" \
                f"   520 TAT Scenarios + 90 PPDT Scenarios with 4-Step Action Logic & 15 OLQs\n" \
                f"   ========================================================================== */\n\n" \
                f"window.SSB_MODEL_STORIES = {json.dumps(all_stories, indent=2)};\n"

    with open('js/model-stories-data.js', 'w', encoding='utf-8') as f:
        f.write(output_js)

    print(f"Generated {len(all_stories['tat'])} TAT model stories.")
    print(f"Generated {len(all_stories['ppdt'])} PPDT model stories.")
    print("Successfully written to js/model-stories-data.js")

if __name__ == '__main__':
    generate_all()
