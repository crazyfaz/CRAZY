module.exports = [
  {
    title: "🩸 The Warehouse Trap",
    description: `You wake up tied to a chair in a blood-soaked warehouse. A masked man whispers:\n\n*“One of these buttons saves you. Two will end you.”*`,
    options: [
      { id: 'pull_trigger', label: '🔫 Pull the trigger on the table' },
      { id: 'escape_door', label: '🚪 Run toward the steel door' },
      { id: 'make_deal', label: '🤝 Shout: I’ll make you rich!' }
    ],
    outcomes: {
      pull_trigger: {
        title: "BOOM.",
        description: "Wrong choice. It was rigged. Your brains paint the walls 💥",
        success: false
      },
      escape_door: {
        title: "Freedom?",
        description: "The door creaks... it's open. But a shadow moves fast behind you.",
        success: true
      },
      make_deal: {
        title: "Silence.",
        description: "He walks away. No answer. You're left in the dark. Forever.",
        success: false
      }
    }
  },
  {
    title: "🔒 Russian Prison Cell",
    description: `You're locked in a Russian cell. The guard smirks: *“One move and I shoot.”*`,
    options: [
      { id: 'bribe_guard', label: '💸 Offer cash' },
      { id: 'scream_help', label: '🗣️ Scream for help' },
      { id: 'fake_seizure', label: '💀 Fake a seizure' }
    ],
    outcomes: {
      bribe_guard: {
        title: "He Laughs.",
        description: "He takes your money... and walks off. You're still locked up.",
        success: false
      },
      scream_help: {
        title: "Bang.",
        description: "Wrong move. He said not to. You're done.",
        success: false
      },
      fake_seizure: {
        title: "Nice acting.",
        description: "He panics and calls the medic. You escape in the chaos.",
        success: true
      }
    }
  },
  {
    title: "🎲 Mafia Coin Flip",
    description: `A mafia boss flips a coin. *"Heads, you're free. Tails, you're mine."*`,
    options: [
      { id: 'call_heads', label: '🪙 Call Heads' },
      { id: 'call_tails', label: '🪙 Call Tails' },
      { id: 'slap_coin', label: '✋ Slap the coin mid-air' }
    ],
    outcomes: {
      call_heads: {
        title: "Tails.",
        description: "Bad luck. You're working for Don Corleone now.",
        success: false
      },
      call_tails: {
        title: "Heads.",
        description: "Oof. Should’ve called better. You lose.",
        success: false
      },
      slap_coin: {
        title: "Chaos.",
        description: "You flip the table, grab the gun, and run. Bold move.",
        success: true
      }
    }
  }
];
