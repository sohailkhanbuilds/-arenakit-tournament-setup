/* Edit this file to configure demo events. Use unique IDs made of lowercase letters, numbers and hyphens. */
window.ARENAKIT_CONFIG = {
  brand: "ArenaKit",
  contactEmail: "hello@arenakit.in",
  events: [
    {
      id: "drop-zone-showdown",
      name: "Drop Zone Showdown",
      game: "BGMI",
      format: "Squad · 4 players",
      date: "Sample event · configure date",
      status: "Demo event",
      location: "Online",
      slots: 25,
      prize: "Prize details to be confirmed",
      description: "A sample community battle royale tournament page. Replace this copy with the real event details before sharing.",
      rules: ["Register using the organiser's official form.", "Team captain should verify all player IDs.", "Join the event lobby at the time shared by the organiser."],
      registrationUrl: "",
      leaderboardUrl: "leaderboard.html?event=drop-zone-showdown",
      scores: [
        { team: "Night Raiders", matches: 4, placement: 42, kills: 28 },
        { team: "Pixel Phantoms", matches: 4, placement: 35, kills: 31 },
        { team: "Zone Breakers", matches: 4, placement: 30, kills: 22 },
        { team: "Clutch Collective", matches: 4, placement: 24, kills: 19 },
        { team: "Last Circle", matches: 4, placement: 18, kills: 16 }
      ]
    },
    {
      id: "campus-clash",
      name: "Campus Clash",
      game: "Valorant",
      format: "5v5 · Knockout",
      date: "Sample event · configure date",
      status: "Demo event",
      location: "College esports",
      slots: 16,
      prize: "Prize details to be confirmed",
      description: "A sample college esports event page for a 5v5 Valorant bracket. Add the college, match schedule and approved rules.",
      rules: ["Only registered players may participate.", "Captains should check in before their scheduled match.", "Organiser decisions and match rules must be shared before play."],
      registrationUrl: "",
      leaderboardUrl: "leaderboard.html?event=campus-clash",
      scores: [
        { team: "Aim Theory", matches: 2, placement: 6, kills: 35 },
        { team: "Mid Control", matches: 2, placement: 4, kills: 29 },
        { team: "Eco Kings", matches: 2, placement: 3, kills: 22 }
      ]
    },
    {
      id: "firestorm-cup",
      name: "Firestorm Cup",
      game: "Free Fire MAX",
      format: "Squad · 4 players",
      date: "Sample event · configure date",
      status: "Demo event",
      location: "Online",
      slots: 20,
      prize: "Prize details to be confirmed",
      description: "A sample Free Fire MAX tournament. Replace all demo information and link the real registration form before publishing.",
      rules: ["Use the same team roster submitted during registration.", "Do not share private room details publicly.", "Follow the organiser's check-in instructions."],
      registrationUrl: "",
      leaderboardUrl: "leaderboard.html?event=firestorm-cup",
      scores: [
        { team: "Redline Squad", matches: 3, placement: 31, kills: 24 },
        { team: "Nova Force", matches: 3, placement: 28, kills: 27 },
        { team: "Storm Unit", matches: 3, placement: 22, kills: 21 }
      ]
    }
  ]
};