# The New King SIM Web App â€” Product Requirements Document (PRD)

**Version:** v0.1  
**Author:** Marat Atnashev  
**Date:** 21 October 2025  
**Product Name:** The New King SIM Web App  
**Scenario:** â€œThe New King of Kourionâ€  
**Purpose:** Define the functional, design, and AI requirements for an AI-augmented, facilitator-led simulation game supporting both offline and online delivery modes.

**KING 5 Core Design Documents**
- [Product Requirements (PRD)](KING_PRD.md)
- [Technical & Architecture Guide](KING_TECH_GUIDE.md)
- [UX / Style Guide](KING_UX_GUIDE.md)
- [Coding approach and Project Management](CLAUDE.md)
- [AI participant architecture and prompts] (KING_AI_DESIGN.md)

**Base SIM Design** 5 documnets in folder KING_SIM_BASE\ 
- KING_Context.md 
- KING_Decisions.md 
- KING_Process.csv
- KING_ALL_ROLES.csv 
- KING_ALL_CLANs.csv


---

## 1. Product Overview


**The New King** is an immersive, role-based simulation game (SIM) that explores leadership, governance, and collective decision-making under conditions of uncertainty, power dynamics, and ethical trade-offs.  
The web application provides a unified web application to customize, conduct, and analyze the simulation â€” enabling a single facilitator to orchestrate a complex, multi-actor experience that blends human participants and AI-driven characters.

### Purpose
To create a seamless environment where the entire simulation lifecycle â€” from customisation and configuration to debrief â€” can be managed through a single intelligent interface.  
The system reduces operational complexity, integrates seamlessly AI Participants (at par with human participants), enhances engagement, and allows deep post-game reflection through structured data capture and AI-assisted feedback.

### Core Idea
Participants represent different clans of the ancient city-state, each with competing interests and philosophies of rule.  
Through speeches, consultations, and two rounds of voting, they elect a new King who must issue a set of royal decrees shaping the cityâ€™s future.  
AI agents act as fully autonomous characters â€” setting own goals, strategising and planning, negotiating, speaking, voting, and reflecting alongside humans.

### Delivery Modes
- **Offline (in-room):** Participants connect via personal devices (QR login) while facilitator controls pacing and displays results on shared screens. Human participants can keep live free interactions between each other, as if they are playing a traditional paper based role-play. AI participants can freely interact with each other via API. Humans and AI can seamlessly meet and communicate at own will of each character. Public and voting should happen as natural as possible, without breaking the natural flow. 

- **Online and Hybrid:** will be considered for later stages (Integrated with Zoom or WebRTC rooms, allowing remote play with identical flow and timing logic; ideal architectural solution for this product shall not block the possibility to convert it later to on-line or hybrid format).

### Users & Roles
- **Facilitator:** Customises, configures and runs the simulation, manages time and transitions, and leads debrief.  
- **Human Players:** Participate as characters with personal and clan objectives, negotiate, speak, vote, and reflect.  
- **AI Characters:** Fully autonomous participants with defined profiles, goals, and behavioural logic. Participate in group reflections.  

### Key Outcomes
- Deep experiential learning about leadership, politics, alliances, and adaptive decision-making. 
- Experience of seamless AI-Human interaction as equal peers 
- Automated collection of behavioral and interaction data for individual and group analysis.  
- Generation of AI-assisted debrief reports linking experience to leadership and collaboration competencies.

### Product Positioning
KING Web App is the **first MetaGames SIM app** that combines:
1. A high-engagement, high fidelity immersive role-play engine (social, political, strategic), generating reach and intense experience.  
2. Full AI integration â€” from in-game agents to automated debriefs.  
3. Enhanced reflection capability - (methodology, AI, data availability) 
4. Facilitator-centric design enabling solo delivery of complex multiplayer simulations (must prove efficiency and scalability of the product).  
5. A modular architecture extendable to future MetaGames scenarios (re-usable modules - like registration and AUTH, and experience/technologies).

---



## 2. Vision & Goals

### Vision

To create and validate the first SIM based on MetaGames Concept: the three interconnected pillars of **Games, AI, and Reflection** â€” can create a new standard of adaptive learning for the AI era.  
KING SIM will demonstrate how one immersive simulation can become a living developmental loop where experience, reflection, and conceptual insight continuously reinforce each other.

The app is not just a game platform â€” it is a prototype of a new learning architecture, where AI acts as a true partner in experience, reflection, and sense-making. Our goal is to show that technology can deepen, not replace, the human side of learning and leadership.

### The Three Foundational Pillars
1. **Games â€“ The Engine of Experience**  
   Immersive simulations generate emotionally and strategically intense experiences. They expose participants to real-world dilemmas of power, collaboration, and uncertainty in a safe, designed environment.
2. **AI as a Learning Partner**  
   AI is not a tool but an intelligent peer: co-actor, peer-participant, challenger, and reflective mirror. It helps sustain complexity, simulate adaptive systems, and provide personalized reflection and insight.
3. **Reflection â€“ The Center of Transformation**  
   Reflection connects experience to insight and insight to action. It anchors learning emotionally and conceptually, ensuring that what happens in the game transforms how people act in reality.

Together these three pillars create **Adaptive Development Loops** â€” iterative cycles of Experience â†’ Reflection â†’ Conceptualisation â†’ New Experiment.  
Each loop develops awareness, adaptability, and leadership agility. 
---

### Strategic Intent

1. **Prove the Integrated Concept**  
   Use *The New King SIM* as a live, functioning prototype to test whether our three-pillar approach can work â€” through one integrated web app that combines immersion, AI, and reflection.

2. **Demonstrate AIâ€“Human Co-Play**  
   Validate that AI and Human participants can engage as credible equals: negotiating, voting, making decisions, and reflecting â€” generating both challenge and learning value for human players and a sandbox for AI social life exploration experience.

3. **Test Solo Facilitation Feasibility**  
   Show that a single facilitator, supported by the app and embedded AI tools, can deliver a complex, 25-person simulation with high engagement and smooth flow.

4. **Generate Measurable Learning Outcomes**  
   Capture and analyze behavioral data to show tangible development in collaboration, adaptability, and strategic decision-making â€” mapped to our adaptive development model.

5. **Establish a Reusable Platform Architecture**  
   Build modular components (auth, roles distribution, reflection analytics, data... others) that could serve as the backbone for future MetaGames simulations and client programs.

6. **Integrate fast feedback and improvement cycle for the SIM and SIM Web APP**
   Collect feedback from participants, integrate it to improve the SIM design, Web APP, AI characters and all other main components. Keep APP architecture light and easy to update and/or re-create in a better format within days. 
---

### Guiding Principles
- **Humanâ€“AI Co-Evolution:** every run is a shared experiment in collaboration between humans and intelligent systems.  
- **Learning Through Experience:** the game is not a metaphor â€” it is the developmental process itself. Embed learning to improve product itself.  
- **Reflection as Integration:** each stage must create space for sense-making, not just action.  
- **Co-Creation Over Instruction:** the facilitator curates conditions; participants create meaning.  
- **Reuse and Scalability:** each module built here will serve future MetaGames products.  
- **Offline First, Future-Proof for Hybrid:** the system must perform equally well in a physical setting, yet be designed for online extension.

---


## 3. Scope & Out-of-Scope

### Scope (This PRD covers)
- The complete design, development, and testing of *The New King SIM Web App* as a **proof-of-concept** for the MetaGames methodology and its three pillars â€” Games, AI, and Reflection.  
- Offline-first delivery for up to 30 participants, including mixed humanâ€“AI gameplay and integrated reflection.  
- Core modules to be built and validated:
  - Scenario customization & configuration, and automated role distribution  
  - Stage engine (phases, voting, decision flow)  
  - AI character system (autonomous agents with live interaction)  
  - Live **voice-based** humanâ€“AI interactions â€” both one-on-one and in small groups  
  - Facilitator console and analytics dashboard  
  - Individual and group reflection interfaces  
- Full data capture of gameplay interactions and **auto-generation of a structured debrief report**.  
- Implementation of a **continuous feedback and improvement loop**, allowing the simulation, web app, and AI components to evolve rapidly after each run.

### Out-of-Scope (Future development phases)
- Online and hybrid multiplayer deployment (Zoom/WebRTC or equivalent integration)  
- Multi-language interface and localization  
- Marketplace or repository for multiple scenarios  
- Advanced adaptive AI reflection coaches beyond this simulation  
- Dedicated mobile app or standalone player mode  
- Integration with external LMS, HR, or enterprise data systems  


## 4. Core Game Flow

The core gameplay structure of *The New King SIM* follows the validated simulation architecture of **The New King of Kourion**.  
The web application must reproduce this flow faithfully while enabling limited configuration of durations, participation ratios, and vote modes.

### 4.1 Overview

The simulation represents a full political-leadership cycle in which clans of an ancient city-state deliberate, negotiate, and elect a new King through two voting rounds and a final decree stage.  
Each phase corresponds to a concrete stage in the learning process and maps directly to the **Stage Engine** within the application.

### 4.2 Phase Sequence (Fixed Logic, game flow exactly as in KING_Process.csv)

1. Set up and customisation (by admin)
2. Registration (by users) - email/password, before simulation
3. Roles distribution & Induction - at simulation start with animation

-- start of role-play 
4. Clan Councils 1
5. Free Consultations 1
6. Clans nominate candidates (decision)
7. Candidate Speeches 1 
8. Vote 1
9. Clan Councils 2
10. Free Consultations 2
11. Candidate Speeches 2
12. Vote 2
13. King's Decisions and Final Speech (if elected)
14. Clan Councils 3
15. Clans' Final Decisions 
-- end of role-play

16. Individual Reflections (with AI optional)
17. Group Reflections
18. Plenary Debriefing

### 4.3. Main SIM design documents (Seed SIM Design Data):

- KING_Context.md - few text paragraphs describing the general context, and the need to elect the King, and general interests
- KING_Process.csv - detailed stage process and base timeline for each stage (stage#, name of stage, description, time) - THIS SET OF STAGES IS FROZEN FOR APP DESIGN PURPOSES  
- KING_Decisions.md - set of decisions that the new King is to make and announce after election
- Roles.csv - 30 roles description (name, clan, age, position, background, character traits, Interests)
- Clans.csv - 6 clans description (name, about the clan, key priorities, attitude to other clans, if things go wrong)
The SIM designer can adjust these seed documents to make changes into the SIM app. 

### 4.4. Customizable SIM design Parameters (Pre-Run)

SIM Design:
- Eng or Ru language [optional, start with ENG]
- Number of clans (4-5-6)
- Number of roles and selection of roles by clans (5(for testing) - 32, could use pre-set cases, when chose number - automatically set up the players/clans)
- Set the required majority threshold for election (default: two-thirds in the first round, simple majority in the second)- Assignment of AI characters to roles (as many as needed). By default, this threshold is presented in-game as the sacred rule of election and can be adjusted by the admin within predefined bounds.
- Adjustment of timing for each stage (an be auto-adjusted proportionally when setting total duration)
- Setting up to 3 main learning objectives (just writing down as text)
- Admin shall be able to review and adjust any element in DB (e.g. interest of a clan or of a role). Any such adjustment triggers a configuration checksum and is logged in the SIM instance metadata.


Other customisation:
- Further customisation of AI characters (e.g. traits, voices, LLM models etc)
- Reflection prompts
- Create additional role
- Crate new clan


Once customisation and set up is completed and approved by the admin - the SIM becomes fully converted to DB SIM instance (e.g. SIM 1.0, with date and time, ready to launch)

### 4.5. Timing & Transitions
- Each phase has a **default duration** defined in the simulation design files but is **parameterized** in the app.  
- The **Facilitator Console** provides controls to *start, pause, extend, skip,* or *end* a phase.  
- The **Stage Engine** enforces phase order and data consistency between stages, but new stage can only be triggered by the Facilitator.  
- Automatic notifications and countdown timers guide all participants & Facilitator.

### 4.6 Voting Logic & Decision Flow
- The precise voting and decision flow, including thresholds and fallback logic, is defined in KING_Process.csv.


## 5. Simulation Design Integrity & Version Control

### 5.1 Purpose
This section defines how the *New King SIM Web App* maintains a reliable connection between the
**simulation design layer** (seed documents describing context, process, roles, clans, and decisions)
and the **application layer** (modules that run the simulation).

Its purpose is to guarantee that every run of the simulation is based on a
validated, consistent design; that any changes are traceable; and that no data
drift occurs between content and system logic.

---

### 5.2 Reference to Simulation Design
The canonical simulation design is defined by the seed files listed in **Section 4.3**.
These files serve as the single source of truth for:
- world context and narrative framing,  
- fixed process and stage sequence,  
- decision schemas,  
- clan and role definitions.

During setup, the application reads these design data files (or their database
representation) and generates a validated configuration ready for customization
and launch.

---

### 5.3 Versioning and Change Management
Each published simulation design has a **version identifier** (e.g., `KOURION v1.0`).
Updates to the seed dataâ€”such as changes in roles, rules, or timingâ€”follow a
simple controlled process:

1. **Edit / Proposal** â€“ Design or content update prepared in the simulation
repository.  
2. **Validation** â€“ Play-test or internal review confirms internal consistency.  
3. **Version Bump** â€“ New version number and date assigned.  
4. **Sync to App** â€“ Application configured to reference that version as its
active simulation design.  
5. **Lock at Runtime** â€“ Once a run begins, its configuration becomes immutable
and stored with the version tag for traceability.

This keeps all participants aligned on a single authoritative design and enables
future comparisons across runs.

---

### 5.4 Integrity Checks
Before each launch the system performs an **integrity validation** that:
- verifies all required design files or database tables are present,  
- checks the phase sequence matches the Stage Engine schema,  
- ensures clans and roles are correctly linked,  
- validates adjustable parameters (e.g., vote threshold, phase durations) are
within allowed ranges.

If validation fails, the facilitator is alerted and the simulation cannot start
until corrected.

---

### 5.5 Data Immutability and Audit Trail
When a simulation run is launched:
- all active configuration and design data are stored as a **snapshot**;  
- any facilitator-level edits (e.g., timing extensions) are logged;  
- analytics reference that exact configuration version.

This ensures full reproducibility and provides a reliable audit trail for later
reflection or research.

---

### 5.6 Continuous Improvement Loop
Post-run feedback, analytics, and AI-generated insights are reviewed after each
delivery cycle.  
Validated learning or design adjustments are introduced into the next simulation
version through the same controlled update processâ€”never by modifying a live
instance.

---

### 5.7 Summary Principles
| Principle | Description |
|------------|--------------|
| **Single Source of Truth** | One validated simulation design defines the rules and structure for all runs. |
| **Version Control** | Every modification or improvement increments the version number. |
| **Integrity Validation** | The system verifies internal consistency before launch. |
| **Runtime Immutability** | Once launched, a simulationâ€™s configuration cannot change. |
| **Traceability & Learning Cycle** | Each runâ€™s data informs controlled design evolution. |

*Purpose:* to maintain coherence between simulation content and the web
application, ensuring reliability, traceability, and iterative improvement
without constraining future technical implementation.




## 6. Functional Requirements (by Module)

*Purpose:* Section 6 defines the operational modules and their required functions.  
Each module must be independently testable, use consistent data interfaces, and support scalable deployment within the broader MetaGames simulation ecosystem.

### 6.1 Overview
The *New King SIM Web App* consists of interlinked functional modules that together enable a complete simulation lifecycle â€” from setup to reflection.  
Each module corresponds to a concrete stage of facilitation and is designed for modular reuse across future MetaGames simulations.

---

### 6.2 Module Summary

| Module | Main Purpose | Primary User(s) |
|---------|---------------|----------------|
| **Simulation Configurator** | Customisation and preparation of each run (seed â†’ DB instance). | Facilitator / Admin |
| **Role Distribution & Induction** | Deliver roles, clans, context, and induction guide to participants. | All Players |
| **Stage Engine** | Execute and control the sequential phases of gameplay. | Facilitator |
| **Plenary Broadcast** | Capture, attribute, and share public speeches or announcements. | Facilitator / All Players / AI |
| **Meetings & Direct Messaging** | Arrange free and natural communication between all participants (Human and AI). | All Players (humans and AI) / Facilitator |
| **Voting & Decision Module** | Manage nominations, elections, decrees, and final clan votes. | All Players / AI |
| **AI Character System** | Operate autonomous AI participants with memory and decision-making. | AI Agents |
| **Facilitator Console** | Provide full situational awareness and total control over the game. | Facilitator |
| **Reflection & Feedback Engine** | Collect structured reflections and generate AI-assisted insights. | Players / Facilitator |
| **Data & Analytics Layer** | Capture all interactions, store structured data, support analysis. | System |
| **Debrief & Reporting Module** | Produce individual and group-level learning summaries. | Facilitator / Learners |

---

### 6.3 Simulation Configurator

**Purpose**
Allow the facilitator to create simulation instances from templates with instance-specific configuration.

**Architecture**
- **Template Management** happens separately in "Edit Scenario" interface (read-only in configurator)
- **Instance Creation** configures simulation-specific parameters without modifying templates

**Key Functions**
- Select simulation template (from `simulation_templates` table)
- View template details (clans, roles, process stages) in read-only mode
- Configure instance-specific parameters:
  - Simulation run name
  - Language (ENG/RU)
  - Select which clans to include (subset of template clans)
  - Select which roles to include (subset of template roles)
  - Assignment of AI vs Human for each role
  - Stage durations and total time (customize from template defaults)
  - Sacred voting threshold (default two-thirds / adjustable)
  - Learning objectives (text fields for this specific run)
- Validate configuration integrity (Section 5 checks)
- Approve and lock instance for launch

**7-Step Wizard Flow**
1. Template Selection - Choose base simulation template
2. Basic Configuration - Run name, learning objectives
3. Clans & Roles - Select which clans/roles to include, assign AI/Human
4. Phase Timing - Customize duration of each stage
5. Review - Preview complete configuration
6. Create - Generate simulation instance
7. Success - Confirmation and next steps

**Outputs**
- Database instance record (`sim_runs` table) with unique `run_id`, timestamp, and configuration snapshot
- Frozen copy of selected template configuration (cannot be changed after creation)

**Note on Template Editing**
- Template editing (add/edit/delete clans and roles) happens in separate "Edit Scenario" interface
- Templates can be duplicated and versioned (e.g., v1.0 → v1.1)
- Simulation instances reference template snapshot at creation time
- Changes to templates do NOT affect existing simulation instances

---

### 6.3a Template Editor ("Edit Scenario")

**Purpose**
Allow facilitators to create, edit, and manage simulation templates that serve as the foundation for simulation instances.

**Architecture**
- **Separate from instance creation** - Templates are master designs, instances are concrete runs
- **Version control** - Templates can be duplicated and versioned without affecting existing simulations
- **Persistent storage** - Templates stored in `simulation_templates` table with JSONB fields for flexibility

**Key Functions**
- **Template Selection**
  - View all available simulation templates
  - Select template to edit or duplicate
  - Create new template from scratch (future)

- **Template Duplication**
  - Create copy of existing template
  - Auto-increment version number (e.g., v1.0 → v1.1)
  - Preserves all clans, roles, and process stages

- **Clan Management** (CRUD operations)
  - View all clans in template with complete details
  - Edit clan properties:
    - Name, sequence order
    - About (description)
    - Key priorities
    - Attitude to others
    - If things go wrong (contingency plans)
    - Color hex (for UI display)
  - Add new clans
  - Delete existing clans
  - Reorder clan sequence

- **Role Management** (CRUD operations)
  - View all roles organized by clan
  - Edit role properties:
    - Name, age, position
    - Clan assignment
    - Background (detailed backstory)
    - Character traits (personality)
    - Interests (motivations and aspirations)
  - Add new roles to any clan
  - Delete existing roles
  - Reorder role sequence

- **Save & Validation**
  - Save changes to template
  - Validate template integrity:
    - All roles belong to existing clans
    - No duplicate role/clan names
    - Required fields populated
  - Update timestamp on save

**User Interface**
- Template selection dropdown
- Duplicate template button
- Save changes button
- Tabbed interface:
  - **Manage Clans** tab - List of all clans with expand/collapse detail view
  - **Manage Roles** tab - List of all roles organized by clan with full editing

**Data Model**
`simulation_templates(template_id, name, version, canonical_clans JSONB, canonical_roles JSONB, process_stages JSONB, updated_at)`

**Outputs**
- Updated template in database
- Modified template available for future simulation instances
- Audit trail of template changes (via `updated_at` timestamp)

**Design Principles**
- **Non-destructive** - Editing template doesn't affect existing simulations using that template
- **Versioned** - Significant changes should create new version rather than overwrite
- **Flexible** - JSONB storage allows for evolution of data structure
- **Validated** - All changes checked for integrity before saving

---

### 6.4 Role Distribution & Induction Module

**Purpose**  
Prepare participants for entry into the simulation.

**Key Functions**
- Authenticate each participant (QR or link).  
- Display personal role brief (from roles + clans tables).  
- Show induction narrative (from `KING_Context.md`).  
- Offer optional AI-based induction assistant (text/voice).  
- Track â€œreadyâ€ status for all participants â†’ notify facilitator.

**Outputs**
- Player readiness list.  
- Activity log (who viewed/confirmed induction).

---


### 6.4a Authentication & Registration

**Purpose**  
Secure participant registration and role assignment with memorable onboarding experience.

**Key Functions**
- **Pre-Simulation Registration:** Email + password sign-up with event code; participants wait for role assignment.
- **Role Assignment:** Facilitator triggers at simulation start; roles distributed with animated reveal (spinning wheel, scroll, etc).
- **Device Access:** QR code generation for quick device switching without re-entering password.
- **Password Management:** Facilitator can reset participant passwords; temporary password generation.
- **Multi-Event Support:** Same credentials reusable across multiple simulations.

**Data Model**
`users(id, email, display_name, status, current_event_code)`, `access_tokens(token_id, user_id, token, expires_at)`

---

### 6.5 Stage Engine

**Purpose**  
Execute and synchronise all simulation phases defined in `KING_Process.csv`.

**Key Functions**
- Read and enforce fixed phase order.  
- Display active phase, countdown, and instructions to players.  
- Facilitator controls: start / pause / extend / skip / end phase.  
- Trigger linked modules (e.g., Voting, Reflection).  
- Log all transitions and timing changes.

**Outputs**
- Phase transition log and duration analytics.  
- Synchronisation state for AI characters.

---

### 6.6 Public Speeches

**Purpose**  
Record and distribute public addresses (candidate speeches, King's decree, facilitator announcements) to all participants and AI agents.

**Recording Methods**
- **Human Speeches:** Via dedicated Secretary workstation (computer + microphone + ElevenLabs auto-transcription)
- **AI Speeches:** Live avatar delivery using ElevenLabs Conversational AI (receives speech brief, generates naturally, can do Q&A)
- **Facilitator:** Via Secretary workstation or manual entry

**Key Functions**
- **Secretary Workstation:** Simple on/off recording; automatic transcription via ElevenLabs API (~30 sec)
- **AI Live Speeches:** AI receives context + talking points (not script); avatar speaks naturally; optional Q&A
- **Transcript Distribution:** Automatic to all AI participants for context updates

**Data Model**
`public_speeches(id, run_id, phase_id, speaker_role_id, is_ai, is_facilitator, transcript, audio_url, delivery_method)`

### 6.7 Meetings 

**Purpose**  
Enable free and natural, low-friction coordination between participants (human and AI) during Clan Councils and Free Consultations: 1-to-1 chats, ad-hoc small meetings, and lightweight group invites â€” all visible to the facilitator. 

---

**Interaction Model**

- **Clan Consultation and Free Meetings (ad-hoc, during Open consultations stages)**
  - **Modality:**  
    - *Human - to Human: Offline:* physical table/spot; no tracking, no recording.  
    - *Human and AI:* Life Voice and Text Chat in APP; up to 6 participants, simple in-app voice/chat room when humans meet AI or remote players (no screen share needed). Transcripts saved, stamped.
    - *AI - to - AI (if no humans):* API text chat between AI characters, transcripts saved. Could use same functionality, but no voice needed.
  - **Organizer** creates a meeting with a title (optional) and invites 1â€“4 others.  
  - **Join/Leave:** participants can join/leave at will; **Add Participant** mid-meeting is allowed.  
  - **Privacy:** meeting content is private to attendees and facilitator sees status/participants, can see transcripts.

---

**Invitations & States**

- **Invite flow:** Organizer â†’ *Invite* â†’ recipient gets **toast + badge** and a **Pending** tile.
- **Responses:** *Accept / Decline*.  
- **Auto-expire:** pending invites expire after **10 min** (configurable).
- **States:** `pending â†’ accepted â†’ active â†’ ended` (or `declined/expired/cancelled`).
- **Facilitator view:** â€œPending >5 minâ€ list with **Nudge** and **Resolve** (accept/decline) actions.

---

**AI Autonomy & Guardrails**

- **AI can initiate invites** (1:1 or small group) within **phase-appropriate windows** (Free Consultations; NOT during speeches/votes).  
- **Rate limits:** default **max 3 invites / 5 min / AI**; back-off on repeated declines.  
- **Single personality in time** AI Character can only participate in 1 meeting at a time. It is 'busy' during this meeting and cannot accept or take part in other meetings.  
- **Initiation of Meetings (during allowed stages)**  
- **Initiation of meetings by AI Characters** AI character is 'asked' once every [5] minutes, if it wants to initiate a meeting. It doesn't have to, and can pass.  
 
---

**Facilitator Controls**

- View **Active Meetings**, **Pending Invites**, **Recently Ended**.  
- **Dissolve** any meeting; **Move** a participant; **Broadcast Nudge** to respond.  
- Global **Mute AI invites** temporarily (e.g., during speeches).

---

**Notifications**

- Participants see non-intrusive toasts + red badges; no modal blockers.  
- Pending invite reminders at **+2 min** and **+7 min**.  
- Meeting â€œabout to endâ€ reminder at **1 min left** (if timed).


---

**Integration**

- **Stage Engine:** enables invites/meetings in the appropriate phases; shows timers.  
- **AI System:** subscribes to DM + meeting events; respects rate limits and auto-accept policy.  
- **Facilitator Console:** surfaces pending invites and active meetings; provides overrides.  
- **Analytics:** logs network of interactions (who met whom, when, for how long); feeds coalition maps.

---

**Non-Goals (MVP)**

- No complex scheduling (calendar/time-slots).  
- No breakout management beyond a single voice &text room per meeting.  
- No screen-sharing; voice only where needed.  
- No queueing/hand-raise for meetings â€” ad-hoc and lightweight by design.


---

### 6.8 Voting & Decision Module

**Purpose**  
Execute all formal decision-making procedures: nominations, two-round election, Kingâ€™s Decree, and final clan votes.

**Key Functions**
- **Clan Nominations:** one candidate per clan with unanimous support (validation UI; facilitator override).  
- **Two Election Rounds:**  
  - Round 1 = default two-thirds majority (adjustable).  
  - Round 2 = default simple majority (adjustable).  
  - Optional fallback if no winner after Round 2.  
- **Ballots:** secure anonymous capture; abstain option; vote change allowed until closure.  
- **Results & Publication:** calculate tallies; show only when facilitator publishes; handle ties.  
- **Kingâ€™s Decision Stage:** winner completes structured decision form (select options + free text).  
- **Final Clan Decisions:** capture closing clan votes (secret votes).  
- **Logging & Audit:** record all nominations, ballots, tallies, overrides.

- **Vote Transparency:** Configurable per vote (open/anonymous/secret); controls who sees individual votes vs just tallies.
- **Results Animation:** Dramatic ballot-by-ballot reveal with configurable speed; optional skip.
- **Reveal Timing:** Immediate, after all votes cast (default), or manual by facilitator.
**Outputs**
- **Clan Nominations:** one candidate per clan with unanimous support (validation UI; facilitator override).  
- **Two Election Rounds:**  
  - Round 1 = default two-thirds majority (adjustable).  
  - Round 2 = default simple majority (adjustable).  
  - Optional fallback if no winner after Round 2.  
- **Ballots:** secure anonymous capture; abstain option; vote change allowed until closure.  
- **Results & Publication:** calculate tallies; show only when facilitator publishes; handle ties.  
- **Kingâ€™s Decision Stage:** winner completes structured decision form (select options + free text).  
- **Final Clan Decisions:** capture closing clan votes (secret votes).  
- **Logging & Audit:** record all nominations, ballots, tallies, overrides.

**Outputs**
- Nominees of the clans (or none).
- Election results table.  
- Published Kingâ€™s Decree.  
- Clan final-decision records.  
- Immutable audit trail of all votes.

**Integration**
- **Stage Engine:** opens and closes voting stages.  
- **Plenary Broadcast:** links candidate speeches to each round.  
- **AI System:** AI agents vote and nominate via same API.  
- **Analytics/Debrief:** produces swing and coalition analysis.

---

### 6.9 AI Character System

**Purpose**  
Provide autonomous, credible AI participants functioning on par with humans.

**Key Functions**
- Load AI role profiles (traits, clan, interests).  
- Maintain context and memory across simulation.  
- Engage in live voice/text interactions (1-on-1 and! group). AI-Human, AI-AI, any other configuration (e.g. AI, AI, human), up to 6 participants per meeting.  Humans can just join physically - e.g. two human participants can decide to talk to one AI - they may do this jointly, just always stating their names and clan in the inception. 
- Initiate, accept, decline meeting invitations during Free Consultations; leave at will.  
- Participate in nominations, speeches, votes, and decisions.  
- Generate Kingâ€™s Decisions if elected.  
- Produce reflections and insights during debrief.  
- Obey facilitator override (mute / focus / prompt).

**Outputs**
- AI interaction logs (meetings, votes, speeches, reflections).  
- AI reflection texts.  
- AI votes and decisions.  
- Performance metrics (participation, sentiment).

**Integration**
- Stage Engine activates/suspends AI logic per phase.  
- Plenary Broadcast for speeches.  
- Voting Module for nominations/votes.  
- Analytics for behavioural patterns.

---

### 6.10 Facilitator Console

**Purpose**  
Serve as the central control hub, giving the facilitator complete visibility and absolute authority over the simulation.

**Guiding Principle**  
The Facilitator is the **Sacred Master** of the game â€” able to override any rule, participant, or outcome, while the system maintains a transparent audit trail.

**Key Functions**
- Start, pause, extend, skip, or end any phase manually.  
- Adjust timing or reopen previous stages.  
- View live status of participants (human + AI), current phase, meetings, votes, and messages.  
- Override anything in real time â€” nominees, votes, results, sequences, rules.  
- Remove or replace participants temporarily (if needed).  
- Make announcements via the Plenary Broadcast channel.  
- Trigger reflections and final debrief modules.  
- Generate snapshots (coalition maps, vote trends, activity graphs).  
- Export reports and logs post-run.

**Outputs**
- Operational dashboard data.  
- Comprehensive event log of all facilitator actions.  
- Quick-export summary package for debrief and record.

**Non-Goals**
- No automatic moderation; human facilitator retains manual control.  
- No permanent locks; facilitator can always alter results (the system only records changes).

**Integration**
Central command interface connected to all modules â€” Configurator, Stage Engine, Broadcast, Voting, AI System, Reflection, Analytics.

---

### 6.11 Reflection & Feedback Engine

**Purpose**  
Enable structured, AI-supported sense-making and personal learning reflection.

**Key Functions**
- Collect individual self-reflections (post-game forms or voice/text dialogues).  
- Offer optional AI co-reflection agent for guided dialogue.  
- Aggregate and summarise themes (emotions, insights, conflicts).  
- Provide facilitator overview of group patterns.  
- Export all reflections for analytics and debrief.

**Outputs**
- Reflection database entries.  
- AI-generated summary themes.  
- Participant reflection profiles.

**Integration**
- Triggered by Stage Engine (end phases).  
- Feeds Debrief Module and Analytics Layer.

---

### 6.12 Data & Analytics Layer

**Purpose**  
Capture and store all simulation data for insight generation and continuous improvement.

**Key Functions**
- Store raw event logs (phase changes, votes, speeches, AI actions).  
- Link all data to simulation version and configuration (Section 5).  
- Support filtering by role, clan, phase, and interaction type.  
- Aggregate metrics (participation, coalitions, sentiment, decision trends).  
- Feed real-time dashboards and post-run analysis.

**Outputs**
- Structured simulation data repository.  
- Analytics API or export tool.  
- Dataset for debrief and research.

---

### 6.13 Debrief & Reporting Module

**Purpose**  
Transform simulation data and reflections into structured learning outputs.

**Key Functions**
- Facilitator dashboard view of key dynamics (coalitions, votes, alliances).  
- Generate AI-assisted narrative debrief (â€œwhat happened / whyâ€).  
- Produce individual player reports (actions, decisions, reflections).  
- Export summary reports (PDF/HTML) and archive results by run ID.

**Outputs**
- Facilitator debrief dashboard.  
- Individual reflection reports.  
- Archived run package for record and analytics.

---

### 6.14 Dependencies and Interfaces

| Module | Depends On | Provides Data To |
|---------|-------------|------------------|
| **Configurator** | Seed data | Stage Engine, Console |
| **Stage Engine** | Configurator | Broadcast, Meetings, Voting, Reflection |
| **Plenary Broadcast** | Stage Engine | AI System, Analytics |
| **Meetings & Direct Messaging** | Stage Engine + AI System | Analytics, Voting, Debrief |
| **Voting & Decision Module** | Stage Engine + Broadcast + Meetings | Analytics, Debrief |
| **AI Character System** | Configurator + Stage Engine + Broadcast + Meetings | Reflection, Analytics |
| **Facilitator Console** | All modules | System Control + Audit Log |
| **Reflection & Feedback Engine** | Stage Engine | Debrief |
| **Analytics Layer** | All modules | Debrief, Continuous Improvement |
| **Debrief & Reporting Module** | Analytics + Reflection | Learning Reports |

---



## 7. Key Interfaces / UX Overview


### 7.1 Purpose and Design Principles
Define the core user interfaces and interaction flows of *The New King SIM Web App* â€” focusing on the Facilitator, Human Participants, and AI Characters.  
Interfaces must stay minimal, intuitive, and consistent with the offline-first, facilitator-led gameplay design.
Design Principles:
- **Facilitator-first:** one operator controls everything.  
- **Simplicity:** one-screen logic per phase; minimal navigation.  
- **Shared context:** all players (human + AI) see the same public information.  
- **Consistency:** same visual grammar (cards, color-coded phases, clean typography).

---

### 7.2 Simulation Customisation Interface

**Purpose**  
Provide a single, intuitive screen for the facilitator to configure and preview each simulation run before launch â€” connecting directly to the **Simulation Configurator Module (Section 6.3)**.

**Main Layout**
- **Header:** Simulation name, version, and status (Draft / Validated / Locked).  
- **Left panel:**  
  - Load / Select Simulation Design (e.g., KING SIM v1.0).  
  - Language selector (ENG / RU).  
  - Global duration and timing setting.  
  - CuValidation report (âœ” passed / âš  warnings).  
  - *Preview Snapshot* button â†’ shows simulation summary (roles, clans, phases).  
  - *Lock & Launch* button â†’ converts seed data into immutable DB instance.


- **Central workspace:** Tabbed configuration cards:  
  - **Clans:** add / remove / edit description, add/generate emblem, priorities.  
  - **Roles:** view / edit role briefs, assign to clans, add/generate avatars, toggle AI / Human, if AI - assign elevenlabs agents (from list fetched by API key, option to assign automatically - need to account for gender)
  - **Voting Rules:** set voting thresholds.  
  - **Learning Objectives:** up to three text fields.  
  - **Review and update individual roles and clan descriptions**
  - **Add/delete additional roles, clans
  - **Review and print:** all distribution materials as printable html or pdf with proper layout (context, main rules & timeline, clan description, role description). 

- **Right panel: customization of AI Promts and models**  
  - **AI Characters Context Update Promts:** block 1 (identity), block 2 (memory), block 3(plans) - review, change, save
  - **AI Models choice:** choose LLM models from list for: AI MAIN PERSONA CHARACTERS, for personal feedback generation,  
  - **AI Induction Character:** the character that could help the human layer familiarise with the interface, understand the rules, set it own targets (as a participant of the simulation - e.g. for personal development and as a character in the SIM 
  - **All other AI prompts settings (could be adjusted later):** personal feedback prompt, debriefing analysis prompt, induction Character setting, prompt  


**Outputs**
- New `SIM_RUN_xx` record with configuration checksum and timestamp.  
- Printable version of all distribution materials 

---


### 7.3 Facilitator Console
Single-screen dashboard for full control and observation.

**Key elements**
- Header: phase name + timer + status (Active / Paused).  
- Main area: dynamic panel (Meetings, Voting, Reflection, etc.).  
- Sidebar: quick controls â€” *Start / Pause / Extend / Skip / End*.  
- Tabs:  
  - **Dashboard:** participants, timing, votes.  
  - **Control:** transitions and overrides.  
  - **Broadcast:** record/stop, fix speaker.  
  - **Meetings:** active, pending, ended; dissolve / nudge / move.  
  - **Reports:** snapshots, exports, debrief.  

---

### 7.4 Participant Main Interface (Human)
Simple, phase-driven screen that changes context automatically.

| Phase | Display & Actions |
|--------|------------------|
| **Induction** | Role brief, context, "Talk to Zenon (AI personal advisor)" button, â€œReadyâ€ button. |
| **Clan Council / Consultation** | Meeting & DM panel; join/create invites; chat or talk with AIs. |
| **Broadcast / Speeches** | â€œNow Speakingâ€ banner; transcript viewer. |
| **Voting** | Ballot form + Submit confirmation. |
| **Reflection** | Reflection form; reflection dialogue with Zenon, AI personal advisor. |
| **Debrief** | Read summary results and analysis. Generate and read personal feedback (AI generated). |

**Persistent elements:**  
- Header (phase + timer, name of participant, role of participant (once defined)), clan (once role is defined); Footer (announcements), Side menu (Role Info, Clans, Transcripts).
- DM Button: opens small chat window (1-to-1, text only).  


---

### 7.5 Meetings & Invitation Interface
Lightweight, non-intrusive communication layer integrated into player and facilitator views.

**For Players**
- **Invte Button:** allows to send invitation to a meeting to one or more (up to 5) participants, stating the Theme/Purprose and duration (default is 5 min).  Send.
- **Invitations:** pop up on the recipients dashboard as a badges + toast â†’ *Accept / Decline* +short message (optional)* 
- **Meeting View:** voice + chat panel; â€œAdd Participantâ€ / â€œLeaveâ€.  
- **Indicators:** active, pending, busy.  

**For Facilitator**
- **Meetings Tab:** lists all Active / Pending / Ended.  
- Controls: *Dissolve / Move / Nudge*; toggle AI invites on/off.  
- Metadata view (participants, start/end, duration).

**For AIs**
- Use same API: *invite / accept / decline / leave*; no visual UI.  
- Automatically respect rate limits and busy states.
- If AI talks only to other AI(s) - they should use text only interface, no speech. 

---

### 7.6 AI Agent Interface (System Layer)
- **Input feeds:** phase updates, broadcasts, meetings, DMs.  
- **Outputs:** nominations, votes, speeches, reflections.  
- **Memory context:** updated after each interaction or broadcast.  
- **Facilitator hooks:** prompt, mute, or override AI anytime.

---

### 7.7 Visibility & Information Access
| Type | Visible To | Description |
|------|-------------|-------------|
| **Public** | All participants | Broadcasts, elections, decrees, facilitator messages |
| **Clan-private** | Clan members + facilitator | Councils, internal votes |
| **Private** | Meeting / DM participants + facilitator | Text & voice sessions |
| **Individual** | Single role + facilitator | Role briefs, reflections |

---

### 7.8 Voice & Audio Integration
- **Plenary mic:** one physical microphone; captured via facilitator laptop.  
- **Meetings:** in-app lightweight voice room (AI + human).  
- **Transcripts:** all audio converted to text; text is canonical record.

---

### 7.9 Interface Consistency & Future Scalability
- Unified color and typography scheme defined in UX / Style Guide.  
- Responsive layout (desktop + tablet).  
- Future-ready for online play (replace local mic with WebRTC, meetings with cloud voice rooms).

---

### 7.6 Screen States (Summary Matrix)

| Phase | Human View | Facilitator View | AI Behaviour |
|-------|-------------|------------------|---------------|
| **Setup / Induction** | Role info, induction text | Config + start control | Load profiles |
| **Clan Council** | Meeting summary / note area | Timer + status board | Generate or join meetings |
| **Free Consultations** | Meeting controls | Overview of meetings | Schedule / attend / leave |
| **Candidate Speeches** | â€œNow speakingâ€ screen | Broadcast controls | Deliver / listen / log transcript |
| **Voting Rounds** | Ballot screen | Vote status + results | Cast vote / adjust reasoning |
| **Kingâ€™s Decision** | Wait / observe | Decision form for elected King | Submit decree |
| **Final Clans / Reflection** | Reflection prompts | Trigger reflection + overview | Submit reflections |
| **Plenary Debrief** | Read summaries. Generate and Read personal feedback (AI generated) | Present debrief report | Passive |

---

### 7.7 Information Visibility Rules
- **Public:** broadcasts, election results, decrees, facilitator announcements.  
- **Clan-private:** intra-clan discussions and votes.  
- **Individual:** role briefs, personal reflections.  
- **AI scope:** same visibility as human equivalent (e.g., AI in a clan sees clan-private info).

---

### 7.8 Voice & Audio Integration (Offline Mode)
- Single microphone for plenary speeches (captured by facilitator laptop).  
- Optional local playback for reflection or AI speech synthesis.  
- All transcripts treated as canonical; audio stored when available.

---

### 7.9 UX Consistency & Future Online Extension
- All interfaces follow a consistent **card-based layout** and **phase colour-coding** (defined in UX / Style Guide).  
- Future online or hybrid versions can reuse the same structure:  
  - replace physical mic with WebRTC capture,  
  - meetings â†’ voice rooms,  
  - voting â†’ secure web ballot.  
- Design must stay responsive (desktop + tablet).

---




##8. AI Characters Design Summary  

Core Concept

The AI Partisipant is an **agentic system** capable of acting fully at par with human Participants in the KING SIM world; has same capabilities and rights;  manages its own identyty, memory, strategy and actions through explicit reflection after each new piece of context or request for action. 

### 8.1 MAIN PERSONA LLM MODEL: 
It is will b the core intellectual 'engine' for al main cognitive and processing tasks.
LLM model can be chosen when setting the AI Character.

### 8.2 CONTEXT STRUCTURE:
	-all actual context blocks of each character are stored in DB, including the history of previous versions with time stamps (for analysis and review)
	- each block (apart from Block 1, that is fixed for the SIM, and can only by adjusted by the admin before the SIM) is updated by the MAIN PERSONA LLM MODEL after each new context element is receieved.

#### Block 1. FIXED CONTEXT (no change during SIM)
   - Context and Rules of the SIM World, stages
   - Structure (your clan mates, other participants, their names and clans);
   - What YOU CAN (all possible actions, and how and when they could be realised):
      - Nominations vote in clan
      - Vote in election (select candidate or abstain)
      - Request a meeting (1 on 1 or team, or clan council)
      - Accept, postpone or decline other's invitations for meetings
      - Make decisions as King (if elected)
      - Vote in clan for final clan decisions: (1) take oath of allegiance to the new King(yes/no); (2) take clan actions against the new King (yes/no/abstaimed)
      - Set your 'conversational' avatar for a conversation or to make a public speech. 
   - YOUR ARCHITECTURE: explaining this architecture + 3 PROMPTS FOR 'REFLECTION' - REVIEWING AND UPDATING EACH of the 3 bocks after new events or information, so that AI understands how it is built. 
      - Standard block on 'NOT BEING A HELPFUL ASSISTANT' but being as close s possible to a real character, with its life speech, emotions, mistakes, ambitions, values, dilemmas.
      - also each persona needs an avatar (not for LLMs but for external representation)

#### Block 2. IDENTITY.
   - Everything from role description (age, clan, interests, personal story)
   - Must be almost steady, but dramatic, emotionally important events could lead to identity changes 
   - Changes need to have explicit robust justification memorised in identity ('after X happened I changed my beliefs to ...')

#### Block 3. MEMORY
   - Blank initially, but will be gradually filled
   - Limited in size say - around 5 pages max
   - Updated and compacted by the MIAN PERSONA LLM after each new context input (conversation, speech transcript any other element)
   - shall contain everything that MAIN PERSONA deems necessary (pst meetings, own and others' obligations, relations dynamic, main events, conflicts etc.)

#### Block 4. GOALS AND PLANS
   - Filled initially by the MAIN PERSONA LLM - after analizing the initial context (at the inception of the SIM)
   - Concise, should contain ideas, ambitions, hypotheses and plans & strategies to achieve or test them 
   - Updated by MAIN PERSONA LLM after each new context element is received 

### 8.3. PROCESS OF AI PERSONA 'REFLECTION' AND COGNITIVE CONTEXT UPDATES:
This is the process by which the AI MAIN PERSONA digests each new piece of context information and updates its core 3 blocks of cognitive content (the firs block remains fixed throughout the SIM). 
1. New piece of context received: 
   - any public speech (who was speaking, when, full transcript)
   - conversation transcripts (where AI Character took part)
   - any official decisions (e.g.results of any vote) - usually as public speech of the Facilitator 
2. Review triggered: MAIN PERSONA LLM is sent the new context + all existing blocks and asked to update blocks 2-4
3. Output: Updated blocks 2-4 are saved as current state of the Persona context, and previous versions stored in DB fr further analysis. No transcripts will be available to the MAIN PERSONA after the update is over - he/she will have access only to the four main blocks of context, so it is essential not to loose any essential parts.


### ACTIONS PROCESS
1. Action request comes from SIM engine
2. MAin Actions: 
   - Whom you nominate from the Clan to be your candidate for the new KING (one name out of [all clan members])? - [name or abstained]
   - For whom do you vote in first round (out of [all candidates list, names, clans]) - [name or abstained]
   - Whom do you want to invite for a meeting - [name1, name 2...]
   - Do you accept the invitation for a meting [yes, no, with possible short text response] + [intent note (guiding text to elevenlabs agent who will conduct the free speech as an 'avatar' of the MAIN PERSONA)]
   - For whom do you vote in second round? - [name or abstained]
   - What decisions do you make (if elected King - array of decisions - choice of options and free text)
   - Final vote in clans (1) Take oath to the King (yes / no) (2)  Start actions against the new King (each clan has one main possibility in can descriptions) (yes, no, description text).

### TALKS
1. Clan meetings start automatically.
2. To set a meeting during free consultations: one side initiate the meeting. Send invite. (the question will be repeatedly asked to MAIN PERSONA LLM every [5?] minutes during free consultations)
3. The invited side(s) get immediately the invitation and can accept or reject with short text response. 
4. If meeting accepted full context (all 4 blocks) is sent to the elevenlabs persona with the information about the meeting (who is supposed to be at the meting) and the intent_note from the  MAIN PERSONA (e.g. 'This is just to explore, what are their interests, try not to disclose more about us', 'main task is to get this information: ...'; 'YOUR TASK IS TO PERSUADE HIM TO VOTE FOR ..., YOU CAN GIVE THE PROMIS TO..". 'please, beware of time, try to end this meting in 5 minutes, whatever happens'). 
5. Upon termination of the conversation the transcript is fetched is sent to the MAIN PERSONA (standard reflection is triggered)


### **Data Structure**

### **Reflection/Review/Update Prompts**

will be set as standard, and could be fine-tuned by ADMIN. Saved in DB. Here just rough idea. Need to optimise and test - what would work better. 

1. Identity: {'this is your identity. only change or amend if dramatic important event happened, that could impact your identity, values and view of the world'} - #I would ask the MAIN PERSONA LLM to update the identity at the inception - to make it - as it understands context and role description, and may want to ad some details

2. Memory: {'this is your memory; you need to remember what a normal person would aim to remember - key events, promises, meetings; but memory is not perfect, and not unlimited; need to compact}

3. Plans: {'you manage and update your own goals, as you understand them. they might evolve, if things go different from what you expected and you might need to review and adjust - but credibly to remain fathful to your identity'}


## Success Criteria

âœ… AI Participants are realistic and autonomously manage their own memory, ambitions and even adjust identity in some cases
âœ… Memory stays bounded but realistic
âœ… Goals and plans evolve based on what happens, but without 'forgetting' the initial context
âœ… Minimal involvement of the Facilitator (most actions and updates happen automatically)
âœ… Realistic free speech communication process (both one on one and in teams)



## 9. Data & Events Model

### 9.1 Purpose
Define the **conceptual data structure and event flow** that support all simulation modules.  
This section establishes the logical relationships between simulation entities (participants, clans, roles, stages, actions, and reflections) and describes how events are created, processed, and stored across the system.  
Detailed schema and data pipelines will be developed in the **KING_TECH_GUIDE.md**.

---

### 9.2 Core Data Entities

| Entity | Description | Key Attributes |
|--------|--------------|----------------|
| **Simulation Run (`SIM_RUN`)** | Single execution instance of the simulation; immutable once launched. | run_id, version, start/end timestamps, configuration snapshot, facilitator_id |
| **Stage (`PHASE`)** | Represents one discrete phase (e.g., Clan Council, Vote 1). | phase_id, name, description, default_duration, start_ts, end_ts |
| **Participant (`ROLE`)** | Human or AI character taking part in the simulation. | role_id, name, clan_id, is_ai, traits, status, device_session_id |
| **Clan (`CLAN`)** | Group identity linking roles and shared objectives. | clan_id, name, description, alignment, priorities |
| **Meeting (`MEETING`)** | Multi-party conversation event (voice/text). | meeting_id, organizer_role_id, participants[], start_ts, end_ts, transcript_ref |
| **Direct Message (`DM`)** | One-to-one message exchange. | dm_id, sender_role_id, receiver_role_id, text, ts |
| **Broadcast (`BROADCAST`)** | Public speech or announcement. | broadcast_id, speaker_role_id, phase_id, transcript_ref, audio_url |
| **Vote (`VOTE`)** | Individual or clan-level decision record. | vote_id, voter_role_id, phase_id, candidate_id, choice, timestamp |
| **Reflection (`REFLECTION`)** | Individual or group reflection input. | reflection_id, role_id, phase_id, text, ai_summary |
| **AI Persona (`AI_CONTEXT`)** | Cognitive state of each AI character. | role_id, block1_fixed, block2_identity, block3_memory, block4_goals, version_ts |
| **Facilitator Action (`ADMIN_EVENT`)** | Manual override or control event. | action_id, type, target, result, ts |
| **Analytics Event (`EVENT_LOG`)** | Canonical record of all system actions. | event_id, run_id, actor_id, module, event_type, payload, timestamp |

All entities are linked to `run_id` and versioned for full traceability.

---

### 9.3 Event Flow Logic

The entire simulation is event-driven.  
Each participant (human or AI) interacts through a sequence of **atomic events**, which trigger updates in both **user interfaces** and **backend state**.

| Event Type | Trigger Source | System Reaction | Logged Outputs |
|-------------|----------------|-----------------|----------------|
| **PhaseChange** | Facilitator / Stage Engine | Update UI; enable relevant modules | New `phase` record + transition log |
| **BroadcastPublicSpeechStart / End** | Facilitator / Player / AI | Capture transcript; distribute to all AIs | `broadcast` record |
| **InviteSent / Accepted / Declined** | Player / AI | Update meeting state; notify facilitator | `meeting` + `event_log` entry |
| **MeetingStarted / Ended** | System | Save transcript, update analytics | `meeting` record |
| **VoteCast** | Player / AI | Count or queue vote; validate phase | `vote` record |
| **ReflectionSubmitted** | Player / AI | Store in DB; trigger AI summary | `reflection` record |
| **FacilitatorOverride** | Facilitator | Apply change, notify all clients | `admin_event` + audit entry |

All events are time-stamped and persisted in `EVENT_LOG`, ensuring auditability and reproducibility for debriefing and analytics.

---

### 9.4 Data Relationships (Conceptual Overview)

SIM_RUN
â”œâ”€â”€ PHASE [1..N]
â”‚ â”œâ”€â”€ BROADCAST [0..N]
â”‚ â”œâ”€â”€ MEETING [0..N]
â”‚ â”œâ”€â”€ VOTE [0..N]
â”‚ â”œâ”€â”€ REFLECTION [0..N]
â”‚ â””â”€â”€ EVENT_LOG [0..N]
â”œâ”€â”€ CLAN [4â€“6]
â”‚ â””â”€â”€ ROLE [3â€“6 per clan]
â”‚ 	â”œâ”€â”€ AI_CONTEXT (if played by AI) AND AI_CONTEXT_LOG (for all past states of the context)
â”‚ 	â”œâ”€â”€ MEETING_PARTICIPATION
â”‚ 	â”œâ”€â”€ VOTES
â”‚ 	â””â”€â”€ REFLECTIONS / PERSONAL FEEDBACK
â””â”€â”€ ANALYTICS / SNAPSHOTS / REPORTS


---

### 9.5 Data Flow Summary

1. **Pre-Run** â€” Seed data (context, roles, clans, decisions) â†’ validated configuration â†’ saved as `SIM_RUN_xx`.  
2. **Runtime** â€” Event-driven engine emits all state changes into `EVENT_LOG`.  
3. **AI Interaction** â€” AI personas read/write to `AI_CONTEXT` when triggered by new information () or system-level events.  
4. **Post-Run** â€” Analytics aggregates events into summary tables â†’ debrief report generated.

---

### 9.6 Data Principles
- **Traceability:** Every action, vote, or message maps to a versioned run and phase.  
- **Integrity:** All write operations validated against configuration schema.  
- **Minimal Duplication:** Store canonical transcripts and references only once.  
- **Privacy:** Access levels mirror gameplay visibility rules.  
- **Extensibility:** Entity model accommodates new simulation types with minimal redesign.  
- **Offline-first:** All data locally cached, synced when network is available.

---

### 9.7 Event Bus (Conceptual)
- All modules communicate through a shared event dispatcher (internal event bus).  
- Each event type follows `{event_type, actor_id, payload, timestamp}` convention.  
- Facilitator console and AI system subscribe to relevant events.  
- Simplified architecture ensures decoupled and testable components.

---

### 9.8 Integration with Analytics and Debrief
- `EVENT_LOG` is the single data feed for the **Analytics Layer**.  
- Aggregated event data populate:
  - participation metrics (activity rate, meeting density)  
  - coalition maps (meeting and voting overlaps)  
  - behavioural insights (emotion / sentiment trends)  
  - learning outcomes (reflection patterns).  
- The **Debrief Module** consumes these aggregates to produce narrative summaries.

---

### 9.9 Future Technical Expansion
The conceptual model anticipates extension toward:
- **API-first structure** for data exchange with external systems.  
- **Real-time visualisation** of in-game dynamics.  
- **Cross-simulation analytics**, allowing longitudinal tracking of behavioural patterns.  
- **AI fine-tuning datasets**, derived from cumulative `AI_CONTEXT` and `EVENT_LOG` archives.

---

*Note:*  
Detailed database schema, table structures, and API specifications will be documented separately in **KING_TECH_GUIDE.md**.


## 10. Analytics & Feedback

### 10.1 Purpose
Provide continuous insight into simulation dynamics, participant engagement, and learning outcomes â€” both during and after each run.

### 10.2 Analytics Sources
- **Event Logs:** all user, AI, and facilitator actions (votes, meetings, broadcasts).  
- **AI Context States:** decision traces and rationales + log of all full context changes (four blocks).  
- **Reflection Entries:** participant and AI reflections (text or voice).  
- **Voting & Meeting Data:** coalition patterns, activity density.  
- **Facilitator Overrides:** control interventions and timing adjustments.

### 10.3 Core Metrics
| Category | Example Metrics |
|-----------|-----------------|
| **Participation** | attendance, messages sent, meetings joined |
| **Network Dynamics** | meeting graph density, cross-clan interaction rate |
| **Coalition Dynamics** | dynamics of all coalitions, based on votes and all available conversations |
| **Major Turning Points** | main turning points in scenario development, cascading effects, patterns |
| **Decision Patterns** | voting volatility, coalition shifts |
| **Reflection & Emotion** | sentiment, key insight frequency |
| **Facilitation Efficiency** | phase timing accuracy, overrides per run |

### 10.4 Feedback Loops
- **Post-Run Summary:** auto-generated facilitator dashboard + downloadable PDF.  
- **AI Debrief:** interprets patterns using the Reflection & Analytics layers.  
- **Continuous Improvement:** facilitator ratings and notes feed back into scenario refinement.

---

## 11. Technical Overview

### 11.1 Architecture Concept
- **Frontend:** browser-based SPA (React / Vue), offline-first PWA; communicates via REST / WebSocket event API.  
- **Backend:** modular Python / Flask service layer handling Stage Engine, AI orchestration, and Data API.  
- **Data Storage:** SuperBase; SQLite / PostgreSQL for persistent records; local cache for offline sessions - from inception all data in DB.  
- **AI Integration:** Anthropic/Gemini/OpenAI / compatible LLM endpoints; ElevenLabs or TTS for optional voice.  
- **Event Bus:** lightweight internal dispatcher; all modules subscribe/publish JSON events.

### 11.2 Key Components
| Layer | Description |
|--------|-------------|
| **UI Layer** | Facilitator and Player web interfaces. |
| **Logic Layer** | Stage Engine, Meeting Manager, Voting Logic, Reflection Engine. |
| **AI Layer** | Agents + prompt templates + memory context. |
| **Data Layer** | DB models + analytics pipelines. |
| **Integration Layer** | APIs for voice, transcription, export. |

### 11.3 Deployment Concept
- Single-server Vercel deployment (offline demo possible).  
- All data on Suparbase - single source of truth; local storage only for speed (if needed), avoid hybrids, exportable for analytics.  
- Modular code structure for re-use across other MetaGames simulations.

---

## 12. Non-Functional Requirements

| Area | Requirement |
|-------|--------------|
| **Performance** | Handle 30 participants + 10 AIs smoothly on a single server. |
| **Reliability** | Auto-save every 30 s; local cache recovery. |
| **Scalability** | Modular design for additional scenarios. |
| **Usability** | Facilitator can operate entire game solo; 10 min setup max. |
| **Security** | Local-only data by default; optional encryption for cloud runs. |
| **Auditability** | Immutable event logs for all actions. |
| **Maintainability** | All modules independently deployable and testable. |
| **Accessibility** | Works on standard laptop browsers; minimal bandwidth dependency. |

---

## 13. MVP Definition

### 13.1 Core Scope
The MVP must enable a **single facilitator** to run a **full 20+ participant simulation (mix AI + humans)** playing offline (humans) + using the web app:

1. Simulation configurator (with customisation).  
2. Player registration / role induction.  
3. Stage Engine with automatic transitions.  
4. Plenary broadcast capture (disributing automatically to all AIs).  
5. Meetings & Direct Messaging.  
6. Voting & Decision module (for all vote types defined in the sim - clan nominations, fist vote etc, second vote, final decision).  
7. Facilitator console with overrides.  
8. Reflection & Debrief summary generation.  
9. Event logging + basic analytics dashboard.

### 13.2 Deferred (Post-MVP)
- Online integration.  
- Multi-language interface.  
- Cross-run analytics.
- AI assisted SIM Design (using the feedback from the actual runs).  

---

## 14. User Stories & Acceptance Criteria

| Role | User Story | Acceptance Criteria |
|------|-------------|--------------------|
| **Facilitator** | As a facilitator, I can configure and run a simulation and launch it in under 60 minutes. | Configurator validates all data; â€œReady to Launchâ€ state visible. |
| **Player** | As a player, I can join via a link or QR code, quickly register (if needed) and immediately see my role and clan info. | Successful login â†’ role brief displayed. |
| **AI Character** | As an AI character, I can participate autonomously within set limits. | AI performs valid actions per phase; logs explain reasoning. |
| **Facilitator** | I can monitor and override any vote, meeting, or phase. | Console actions work in real time; all overrides logged. |
| **Participant** | Playing is fun and easy - both interacting with other humans and with AI characters. | AI characters act naturally and the experience is engaging. |
| **Learner** | I receive personalised feedback and the possibility to have a reflection conversation with AI advisor at the end. | I took part in a great round of reflections - with human participants and AI|
---

## 15. Risks & Mitigation

| Risk | Impact | Mitigation |
|------|---------|------------|
| **AI behaviour inconsistency** | Loss of realism or overload of facilitator. | Limit autonomy; curated prompts; logging for quick reset. |
| **AI character's ability to talk in public/groups** | Loss of realism or overload, noise. | need testing group talks with 2-3 AI participants + human participants in smaller settings or experimental app. |
| **Technical instability** | Game interruption. | Local auto-save + restart from last phase. |
| **Excessive complexity for facilitator** | Reduced usability. | UI minimalism; contextual tooltips; default presets. |
| **Data loss or privacy breach** | Loss of trust or replay data. | Local-only storage; encrypted exports. |
| **Voice / TTS integration issues** | Broken immersion. | Fallback to text transcripts. |
| **Human-AI imbalance** | Learning distortion. | AI participation quotas; facilitator control over AI speech. |

---

## 16. Open Questions / Next Steps

| Topic | Next Step |
|--------|------------|
| **Technical Guide** | Elaborate database schema, event bus protocol, API contracts. |
| **UX Guide** | Create UX style guide. |
| **Project Governance model** | Define CLAUDE.md - setting high execution standards & staged disciplined approach. |
| **AI prompt repository** | Define structure / versioning for all AI templates. |

---

*End of Document â€” KING SIM Web App PRD v0.1*
