// Curated example briefs surfaced as click-to-fill chips on the landing state.
// Pulled from assignment/data/example_advertisers.txt.

export interface ExampleBrief {
  label: string;
  text: string;
}

export const EXAMPLE_BRIEFS: ExampleBrief[] = [
  {
    label: "Premium dog food",
    text: "We sell premium dog food for senior dogs, targeting owners who care about joint health and longevity. Grain-free, vet-formulated, subscription-based.",
  },
  {
    label: "Sustainable activewear",
    text: "A sustainable activewear brand for women. Made from recycled ocean plastic. Price point sits between Lululemon and Girlfriend Collective.",
  },
  {
    label: "Italian luxury handbags",
    text: "Custom-fit leather handbags, Italian-made, handcrafted in Florence. Minimum order ships in 6 weeks. Average price point $1,200.",
  },
  {
    label: "Vague — feel better",
    text: "We help people feel better.",
  },
];
