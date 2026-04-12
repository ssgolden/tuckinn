export const storefrontContent = {
  hero: {
    eyebrow: "Build it your way",
    title: "Build your proper sandwich",
    body:
      "Choose bread, fillings, salad, and sauce in a guided builder, then check out without losing the quick lunch pace.",
    chips: ["Bread", "Fillings", "Salad", "Sauce"],
    brandTitle: "Your sandwich, built properly.",
    brandBody:
      "The builder is the Tuckinn difference: more control than a standard menu, without making lunch feel slow.",
    notes: [
      {
        title: "Start with the builder.",
        body: "Pick your base, layer the flavour, then review before adding to basket."
      },
      {
        title: "Quick picks stay close."
      }
    ]
  },
  trust: [
    "Build your own sandwich",
    "Fresh Tuckinn favourites",
    "Fast collection and delivery"
  ],
  socialProof: [
    {
      eyebrow: "Signature builder",
      title: "Make it your way",
      body: "Choose the bread, fillings, salad, and sauce before it reaches the basket."
    },
    {
      eyebrow: "Proper favourites",
      title: "Ready when you are",
      body: "Popular Tuckinn picks stay easy to find for fast lunch decisions."
    },
    {
      eyebrow: "Direct ordering",
      title: "Order fast",
      body: "Clear sections and strong actions keep lunch moving from craving to basket."
    }
  ],
  orderSteps: [
    {
      number: "1",
      title: "Pick your base",
      body: "Start with the sandwich style that suits your lunch."
    },
    {
      number: "2",
      title: "Layer the flavour",
      body: "Choose fillings, salad, sauce, and extras clearly."
    },
    {
      number: "3",
      title: "Review and order",
      body: "Check the build, add it to basket, then check out."
    }
  ],
  routes: [
    {
      action: "builder",
      tag: "Signature route",
      title: "Build A Sandwich",
      body: "Choose bread, fillings, salad, and sauce in the guided Tuckinn builder.",
      className: "route-card route-card-primary route-card-large"
    },
    {
      action: "menu",
      tag: "Ready-made favourites",
      title: "Browse The Menu",
      body: "See popular deli picks and add ready-made items quickly.",
      className: "route-card route-card-large"
    },
    {
      action: "mealDeals",
      tag: "Fastest bundle",
      title: "Open Meal Deals",
      body: "Go straight to simple lunch bundles when speed matters most.",
      className: "route-card route-card-large"
    }
  ],
  builder: {
    progressIntro: "Choose the essentials first. You can review everything before adding it.",
    progressSingle: "Choose your option and review everything before adding it.",
    readyLabel: "Ready to add",
    requiredLabel: "Required choices stay marked clearly"
  },
  basket: {
    intro: "We only need a few details to finish the order. You review everything before payment.",
    reassurance: [
      "Choose collection or delivery before payment.",
      "Kitchen notes can include allergies or timing.",
      "Add one more Tuckinn favourite before payment."
    ],
    upsellTitle: "Add something extra",
    upsellBody: "You can still add a quick side or drink before payment."
  }
} as const;

export type StorefrontRouteAction = (typeof storefrontContent.routes)[number]["action"];
