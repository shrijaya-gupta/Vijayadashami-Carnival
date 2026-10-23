/**
 * Vijayadashami Carnival — Games Catalogue Data
 * 
 * Reusable, editable JavaScript data structure for all six campus games.
 * All proposed rules, team sizes, and procedures are marked with "Pending Organizer Approval"
 * and can be adjusted without modifying the core HTML layout.
 */

const GAMES_DATA = [
  {
    id: "lemon-race",
    name: "Lemon Race",
    category: "Balance & Speed",
    participationType: "Individual",
    description: "A precision balance sprint where participants traverse designated course lanes while balancing a lemon on a spoon without manual contact.",
    objective: "Reach the finish line while balancing a lemon on a spoon under the approved rules.",
    approvalStatus: "Pending Organizer Approval",
    suggestedTeamSize: "Individual (1 player per track lane — provisional, pending organizer confirmation)",
    suggestedDuration: "Provisional: 3 to 5 minutes per heat (pending organizer approval)",
    procedure: [
      "Players assemble behind the marked starting line in their assigned lanes.",
      "Each player balances a fresh lemon on an approved spoon.",
      "At the host's start signal, players move towards the finish line without holding, securing, or touching the lemon with their fingers or mouth.",
      "The winner is the eligible player who successfully completes the course first under the approved rules."
    ],
    proposedRules: [
      "Suggested: The organizer must define whether the spoon must be held in the hand or carried in another approved way (e.g. mouth).",
      "Suggested: If the lemon falls, the organizer must define whether the player must stop and replace it at the spot, or return to a starting checkpoint.",
      "No pushing, blocking, body contact, or interfering with adjacent competitors.",
      "The sprint course must be clear, level, and safe."
    ],
    materials: "Spoons, fresh lemons, start/finish line markers, and a timer/stopwatch.",
    winningCriteria: "Provisional: The first eligible player to cross the finish line with the lemon legally balanced on the spoon.",
    safetyNotes: [
      "Course must have clear, unobstructed lanes free of debris or slick surfaces.",
      "Competitors must wear appropriate closed-toe footwear.",
      "Maintain safe separation distance between lanes to prevent accidental collisions."
    ]
  },
  {
    id: "target-shooting",
    name: "Target Shooting",
    category: "Focus & Precision",
    participationType: "Individual / Team (Provisional)",
    description: "A campus target challenge testing focus, aim, and precision. The activity will follow organizer-approved safety procedures and supervised equipment use in a controlled arena.",
    objective: "Aim at designated targets following organizer-approved safety procedures and supervised equipment use.",
    approvalStatus: "Pending Organizer Approval",
    suggestedTeamSize: "Pending organizer confirmation",
    suggestedDuration: "Pending organizer confirmation",
    procedure: [
      "Participants assemble at the marked shooting station under direct supervisor guidance.",
      "The host outlines the approved attempt limits, rotation order, and target distances before the round starts.",
      "Each attempt is scored under direct official supervision.",
      "Participants clear the shooting line promptly once their turn concludes."
    ],
    proposedRules: [
      "Provisional details: Exact rules, equipment, scoring system, and participant limits are pending organizer confirmation.",
      "Participants must strictly follow the range supervisor's whistle or signal before and after every turn.",
      "Only organizer-approved equipment and procedures may be used at the designated station.",
      "No weapon-handling instructions are provided; all activities operate under direct event supervisor control."
    ],
    materials: "Organizer-approved target apparatus, safety perimeter markings, and score recording sheet (exact equipment pending organizer confirmation).",
    winningCriteria: "Provisional: Scoring metrics, attempt counts, and target point values are pending organizer confirmation.",
    safetyNotes: [
      "Safety Notice: Only organizer-approved, supervised equipment and procedures may be used.",
      "All participants and spectators must remain behind designated safety lines at all times.",
      "No weapon-handling instructions are provided. The station operates strictly under direct event supervisor control."
    ]
  },
  {
    id: "musical-chairs",
    name: "Musical Chairs",
    category: "Agility & Rhythm",
    participationType: "Individual",
    description: "A test of auditory attentiveness and reflexes where participants circulate around a seating arrangement and claim an available seat when the music ceases.",
    objective: "Remain in the game by securing an available seat each time the music pauses.",
    approvalStatus: "Pending Organizer Approval",
    suggestedTeamSize: "Individual (Provisional: 10 to 16 players per preliminary heat — pending organizer confirmation)",
    suggestedDuration: "Provisional: 15 to 20 minutes per round (pending organizer approval)",
    procedure: [
      "Arrange sturdy chairs in a circle facing outward, with exactly one fewer chair than the active number of players.",
      "Players move clockwise around the chairs while high-energy music plays.",
      "When the music stops unexpectedly, each player must immediately sit on an open chair.",
      "The player left without a seat is eliminated from the round.",
      "One chair is removed, and the process repeats until only one champion claims the final chair."
    ],
    proposedRules: [
      "Strictly no pushing, pulling, dragging chairs, or deliberately blocking others.",
      "Players must keep circulating and may not hover over or touch chairs while music is active.",
      "The organizer must define the official ruling if two players reach a chair simultaneously.",
      "Use a clear, safe, non-slippery playing circle."
    ],
    materials: "Stable chairs with rubber foot grips, a sound system/speaker, and a host-operated audio playback controller.",
    winningCriteria: "Provisional: The last remaining player who successfully claims the final chair.",
    safetyNotes: [
      "Ensure chairs are tested for structural stability to prevent tipping over.",
      "Adequate clearance must be maintained around the chair ring to avoid collisions with spectators.",
      "Players must wear flat, supportive footwear."
    ]
  },
  {
    id: "human-knot",
    name: "Human Knot",
    category: "Teamwork & Coordination",
    participationType: "Team / Group",
    description: "A cooperative group-dynamics activity requiring participants to untangle an interconnected circle of handholds through strategic spatial coordination without disengaging contact.",
    objective: "Work together to untangle a group knot while maintaining agreed handholds.",
    approvalStatus: "Pending Organizer Approval",
    suggestedTeamSize: "Team / Group (Provisional: 6 to 10 participants per circle — pending organizer confirmation)",
    suggestedDuration: "Provisional: 10 to 15 minutes per round (pending organizer approval)",
    procedure: [
      "Participants stand in a compact circle facing inward.",
      "Each person takes hands with two different people across the circle, following the host's safe setup (no holding hands with immediate neighbors).",
      "Without letting go of hands, the group collaborates through verbal communication to step over, duck under, and twist through arms.",
      "The round ends when the group untangles into an unbroken open circle or when the time limit expires."
    ],
    proposedRules: [
      "Strictly no pulling, twisting arms forcefully, or forcing anyone into an uncomfortable position.",
      "Participants can pause or stop immediately if anyone feels uncomfortable or strained.",
      "Do not climb over people or attempt unsafe acrobatic moves.",
      "Any participant has the right to opt out or release grip at any moment.",
      "The organizer should approve the formation, group size, and completion criteria before the event."
    ],
    materials: "A timer/stopwatch and a clear, spacious indoor or lawn surface.",
    winningCriteria: "Provisional: Fastest squad to successfully untangle into a clear circle without breaking grips, or squad with the fewest remaining tangles upon time expiry.",
    safetyNotes: [
      "Gentle, deliberate movements only. Forceful pulling is cause for immediate stoppage.",
      "Participants with existing wrist, shoulder, or back conditions should exercise caution or opt for cheering.",
      "Ensure a spacious floor perimeter free of tables, chairs, or sharp edges."
    ]
  },
  {
    id: "cup-balloon-pyramid",
    name: "Cup and Balloon Pyramid Challenge",
    category: "Skill & Precision",
    participationType: "Individual or Duo / Team (Provisional)",
    description: "A dexterous assembly challenge where participants construct a multi-tier cup pyramid using balloon contact techniques within an allocated time window.",
    objective: "Build a stable pyramid using cups and balloons under an approved challenge format.",
    approvalStatus: "Pending Organizer Approval",
    suggestedTeamSize: "Individual or Team (Provisional: 1 to 2 participants per station — pending organizer confirmation)",
    suggestedDuration: "Provisional: 3 to 5 minutes per round (pending organizer approval)",
    procedure: [
      "Give each competing station an equal set of cups and balloons.",
      "The host announces the permitted construction method before the round begins.",
      "Teams or individuals build their pyramids within the approved time window.",
      "The winner is decided by approved criteria, such as pyramid stability, completion height, and elapsed time."
    ],
    proposedRules: [
      "Important: The exact mechanism of the challenge has not yet been finalized by the organizing committee.",
      "Editable draft: Do not assume that balloons must be inflated, used as tools, or placed inside cups. The permitted method will be announced upon official confirmation.",
      "The assembled pyramid must stand unassisted for a specified duration (e.g. 5 seconds) without collapsing.",
      "Competitors must keep all materials within their assigned table workspace."
    ],
    materials: "Plastic cups, standard balloons, a timer/stopwatch, and a flat table or safe playing surface.",
    winningCriteria: "Provisional: Fastest participant or team to erect a fully compliant, stable pyramid that satisfies the hold-time requirement.",
    safetyNotes: [
      "Exercise standard safety precautions with balloons; do not over-inflate to avoid loud pops.",
      "Do not encourage balloon fragments or small pieces to be left on the floor; clean up popped remnants immediately to prevent slipping hazards.",
      "Use lightweight, shatter-proof cups only."
    ]
  },
  {
    id: "balloon-dual-race",
    name: "Balloon Dual Race",
    category: "Duo Synergy",
    participationType: "Pairs / Duo (2 Players)",
    description: "A synchronized partner race in which two participants navigate a marked course while maintaining a shared balloon between them without manual contact.",
    objective: "Work with a partner to navigate a sprint course while keeping a shared balloon balanced between you.",
    approvalStatus: "Pending Organizer Approval",
    suggestedTeamSize: "Pairs / Duo (2 players per team — provisional, pending organizer confirmation)",
    suggestedDuration: "Provisional: 2 to 4 minutes per race heat (pending organizer approval)",
    procedure: [
      "Two players position themselves at the starting line with an inflated balloon balanced between them.",
      "The host specifies how the balloon must be balanced (e.g. back-to-back, side-to-side, or chest-to-chest) before the round begins.",
      "Pairs move together along a clearly marked, safe course towards the finish line.",
      "The winner is determined using the organizer-approved completion and penalty rules."
    ],
    proposedRules: [
      "Confirmed concept: A two-player balloon-balancing challenge. Exact mechanics are pending organizer confirmation.",
      "Editable proposed format: Do not invent the exact body position, balloon placement, distance, or required movement as if confirmed.",
      "Hands-free rule: Neither player may touch, hold, or tape the balloon with hands or arms during the race.",
      "If the balloon drops or bursts, pairs must follow the organizer-specified penalty (e.g. restart from drop spot with a fresh balloon).",
      "No pushing, deliberate collisions, or veering into neighboring lanes."
    ],
    materials: "Inflated balloons, course start/finish markers/cones, and a timer/stopwatch.",
    winningCriteria: "Provisional: First pair to legally cross the finish line with their balloon intact and properly positioned.",
    safetyNotes: [
      "No pushing, collisions, or running recklessly in crowded spaces.",
      "Avoid activities that require unsafe breath-holding or restricting breathing.",
      "The organizer must approve the exact mechanics before publishing final instructions."
    ]
  }
];

// Legacy games catalogue preserved for historical registration lookup
const LEGACY_GAMES_DATA = [
  {
    id: "treasure-hunt",
    name: "Treasure Hunt",
    category: "Mystery & Strategy",
    participationType: "Team",
    description: "Legacy campus clue-solving adventure across Building B5 landmarks testing team wit, coordination, and rapid deduction.",
    approvalStatus: "Archived / Legacy"
  }
];

// Helper to look up game by ID (supports active and legacy)
function getGameById(id) {
  return GAMES_DATA.find(game => game.id === id) || LEGACY_GAMES_DATA.find(game => game.id === id) || null;
}
