import { Game } from '../types';

export const GAMES_DATA: Game[] = [
  {
    id: "lemon-race",
    name: "Lemon Race",
    category: "Balance & Speed",
    participationType: "Individual",
    shortDescription: "Balance a lemon on a spoon and reach the finish line.",
    description: "Balance a lemon on a spoon and reach the finish line.",
    objective: "Complete the course while maintaining the approved lemon-and-spoon setup.",
    approvalStatus: "Awaiting Organizer Approval (penalties & mechanics pending)",
    registrationFee: "₹5 per selected game",
    suggestedTeamSize: "Individual (1 player per track lane)",
    suggestedDuration: "Provisional: 3 to 5 minutes per heat",
    procedure: [
      "Begin behind the designated starting line in your assigned lane.",
      "Carry the lemon and spoon according to the organizer's instructions.",
      "Navigate the sprint course towards the finish line without holding or steadying the lemon by hand.",
      "Complete the course while maintaining the approved lemon-and-spoon setup."
    ],
    proposedRules: [
      "Begin behind the designated starting line.",
      "Carry the lemon and spoon according to the organizer's instructions.",
      "Avoid pushing, blocking or interfering with other participants.",
      "The organizer must specify what happens if the lemon falls (awaiting organizer approval)."
    ],
    materials: "Spoons, lemons, start/finish line markers, and official stopwatches.",
    winningCriteria: "Completion of the course according to the approved rules.",
    safetyNotes: [
      "Sprint course must be clear, flat, and free of slick surfaces or debris.",
      "Participants must wear appropriate closed-toe footwear.",
      "Maintain safe separation distance between lanes to prevent accidental collisions."
    ],
    iconName: "Timer"
  },
  {
    id: "target-shooting",
    name: "Target Shooting",
    category: "Focus & Precision",
    participationType: "Individual / Supervised Challenge",
    shortDescription: "Take part in a supervised target-based accuracy challenge.",
    description: "Take part in a supervised target-based accuracy challenge.",
    objective: "Hit the designated target using organizer-approved equipment.",
    approvalStatus: "Pending Organizer Confirmation",
    registrationFee: "₹5 per selected game",
    suggestedTeamSize: "Individual / Supervised (pending organizer confirmation)",
    suggestedDuration: "Further details will be confirmed by the event organizers.",
    procedure: [
      "Report to the designated supervised target station under direct official guidance.",
      "Receive approved attempt limits and target rotation instructions from the range supervisor.",
      "Execute your challenge attempt strictly within the supervised area.",
      "Step back behind the safety perimeter immediately once your turn concludes."
    ],
    proposedRules: [
      "Follow the event organizer's instructions at all times.",
      "Participate only in the designated supervised area.",
      "Use only the equipment and procedures approved for the event.",
      "Follow all safety boundaries and stop instructions immediately.",
      "Do not aim at people or use equipment outside the activity area.",
      "Further details will be confirmed by the event organizers."
    ],
    materials: "Organizer-approved target apparatus and safety perimeter barriers (exact equipment pending organizer confirmation).",
    winningCriteria: "The organizer must confirm the official scoring method.",
    safetyNotes: [
      "Safety Requirement: Participate only in the designated supervised area.",
      "Follow all safety boundaries and emergency stop instructions immediately.",
      "Do not aim at people or use equipment outside the activity area.",
      "No weapon-handling instructions are provided; all activities operate strictly under direct event supervisor control."
    ],
    iconName: "Target"
  },
  {
    id: "musical-chairs",
    name: "Musical Chairs",
    category: "Agility & Rhythm",
    participationType: "Individual",
    shortDescription: "Move around the chairs while music plays and find a seat when it stops.",
    description: "Move around the chairs while music plays and find a seat when it stops.",
    objective: "Remain in the game until one winner remains.",
    approvalStatus: "Provisional - Awaiting Organizer Approval",
    registrationFee: "₹5 per selected game",
    suggestedTeamSize: "Individual (Provisional heats of 10 to 16 players)",
    suggestedDuration: "Provisional: 15 to 20 minutes per elimination round",
    procedure: [
      "Chairs are placed in a circle facing outward, with one chair fewer than the active number of participants.",
      "Move around the arranged chairs while music plays.",
      "Take an available seat immediately when the music stops.",
      "The participant unable to secure a seat is eliminated; one chair is removed for the next round.",
      "Repeat rounds until the final two players compete for the last seat."
    ],
    proposedRules: [
      "Move around the arranged chairs while music plays.",
      "Take an available seat when the music stops.",
      "Follow the host's instructions for each round.",
      "Avoid pushing, pulling or deliberately blocking other participants.",
      "Provisional: The organizer must confirm the resolution rule for simultaneous seat claims."
    ],
    materials: "Sturdy non-slip chairs, festive sound system, and host audio playback controller.",
    winningCriteria: "The last eligible participant remaining under the approved elimination rules.",
    safetyNotes: [
      "Chairs must be structurally sound and placed on a non-slip, even floor.",
      "Maintain a safe circular buffer zone around chairs to avoid crowding spectators.",
      "No shoving, pulling, or tripping is tolerated."
    ],
    iconName: "Music"
  },
  {
    id: "human-knot",
    name: "Human Knot",
    category: "Teamwork & Coordination",
    participationType: "Team / Group",
    shortDescription: "Work together to untangle a connected group formation.",
    description: "Work together to untangle a connected group formation.",
    objective: "Solve the group arrangement using cooperation and communication.",
    approvalStatus: "Subject to Organizer Approval (group size & completion criteria pending)",
    registrationFee: "₹5 per selected game",
    suggestedTeamSize: "Team / Group (Provisional: 6 to 10 participants per circle)",
    suggestedDuration: "Provisional: 10 to 15 minutes per round",
    procedure: [
      "Form a compact circle facing inward with fellow team participants.",
      "Reach across and grasp hands with two different participants (not immediate neighbors), following the host's setup.",
      "Work together to untangle the arrangement without breaking hand contact.",
      "Communicate clearly and step over, duck under, and navigate through arms safely.",
      "Conclude when the formation untangles into an open unbroken circle or when the time limit expires."
    ],
    proposedRules: [
      "Follow the organizer's instructions for forming the group.",
      "Work together to untangle the arrangement.",
      "Do not pull, twist arms or force participants into uncomfortable positions.",
      "Any participant may stop if uncomfortable.",
      "Notice: The exact group size and completion criteria remain subject to organizer approval."
    ],
    materials: "Stopwatch/timer and an unobstructed indoor hall or lawn surface.",
    winningCriteria: "Completion of the organizer-approved final formation within the specified rules.",
    safetyNotes: [
      "Deliberate, gentle movements only. Rough pulling is cause for immediate activity stoppage.",
      "Any participant may call for a pause or release their grip at any moment.",
      "Ensure ample floor space free of tables, sharp corners, or obstacles."
    ],
    iconName: "Users"
  },
  {
    id: "cup-balloon-pyramid",
    name: "Cup and Balloon Pyramid Challenge",
    category: "Skill & Precision",
    participationType: "Individual or Team (Provisional)",
    shortDescription: "Take part in a creative cup-and-balloon construction challenge.",
    description: "Take part in a creative cup-and-balloon construction challenge.",
    objective: "Build a stable pyramid using the organizer-approved challenge method.",
    approvalStatus: "Pending Organizer Confirmation",
    registrationFee: "₹5 per selected game",
    suggestedTeamSize: "Individual or Team (1 to 2 participants per station — provisional)",
    suggestedDuration: "Further details will be confirmed by the event organizers.",
    procedure: [
      "Participants report to their designated activity table with provided cups and balloons.",
      "The host explains the organizer-approved challenge method and safety protocol.",
      "Participants execute the construction challenge within the announced time window.",
      "Pyramids are assessed for stability under official organizer criteria."
    ],
    proposedRules: [
      "Use the materials provided for the activity.",
      "Follow the host's instructions for how cups and balloons may be used.",
      "Complete the challenge within the announced conditions.",
      "Keep the playing area clear and safe.",
      "Notice: The exact construction method is not confirmed. Further details will be confirmed by the event organizers."
    ],
    materials: "Plastic cups, balloons, and an official stopwatch (exact materials pending organizer confirmation).",
    winningCriteria: "Pending organizer confirmation.",
    safetyNotes: [
      "Exercise caution when handling balloons; avoid over-inflation.",
      "Promptly collect and dispose of any popped balloon pieces to avoid slip hazards.",
      "Use lightweight, shatter-proof cups only."
    ],
    iconName: "Layers"
  },
  {
    id: "balloon-dual-race",
    name: "Balloon Dual Race",
    category: "Duo Synergy",
    participationType: "Pairs / Duo (2 Players)",
    shortDescription: "A two-player balloon-balancing challenge that tests coordination.",
    description: "A two-player balloon-balancing challenge that tests coordination.",
    objective: "Complete the challenge course with a partner while maintaining balloon balance.",
    approvalStatus: "Pending Organizer Confirmation (exact mechanics pending)",
    registrationFee: "₹5 per selected game",
    suggestedTeamSize: "Pairs / Duo (2 players per team)",
    suggestedDuration: "Further details will be confirmed by the event organizers.",
    procedure: [
      "Two players position themselves at the starting line with an inflated balloon between them.",
      "Adopt the organizer-approved balloon-balancing position announced before the heat.",
      "Navigate the marked course in unison towards the finish line.",
      "Cross the finish line under approved completion and penalty guidelines."
    ],
    proposedRules: [
      "Follow the approved starting position and balloon-balancing method.",
      "Remain within the designated course or activity area.",
      "Avoid pushing, collisions and unsafe movement.",
      "Follow the host's instructions if the balloon falls.",
      "Notice: The challenge involves two players and balloon balancing. The exact mechanics, body position, course distance, and penalties are pending organizer confirmation."
    ],
    materials: "Inflated balloons, course boundary markers/cones, and official timing equipment.",
    winningCriteria: "Pending organizer confirmation.",
    safetyNotes: [
      "No pushing, reckless running, or deliberate collisions in the racing lane.",
      "Avoid any actions that restrict normal breathing or cause physical strain.",
      "All mechanics and course boundaries must be approved by the safety marshals."
    ],
    iconName: "Zap"
  }
];

export const EVENT_DETAILS = {
  name: "Vijayadashami Carnival",
  institution: "Shri Ramswaroop Memorial University (SRMU)",
  venue: "SRMU B5-408",
  eventDate: "Thursday, 29 October 2026",
  eventTime: "11:00 AM",
  deadlineDate: "Monday, 26 October 2026",
  deadlineTime: "11:59 PM",
  registrationFeePerGame: 5,
  currencySymbol: "₹",
  eventTimestamp: new Date("2026-10-29T11:00:00+05:30").getTime(),
  deadlineTimestamp: new Date("2026-10-26T23:59:59+05:30").getTime(),
};
