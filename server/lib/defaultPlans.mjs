export function getDefaultPlanRows() {
  return [
    {
      id: 1,
      name: "Free",
      price_cents: 0,
      discount_percent: null,
      discount_end_date: null,
      description: "Default free plan",
    },
    {
      id: 2,
      name: "Starter (Teacher)",
      price_cents: 699,
      discount_percent: 30,
      discount_end_date: "2025-01-04",
      description: "Everything a single teacher needs",
    },
    {
      id: 3,
      name: "School",
      price_cents: 2900,
      discount_percent: 30,
      discount_end_date: "2025-01-04",
      description: "For schools that want shared access",
    },
    {
      id: 4,
      name: "Enterprise",
      price_cents: 0,
      discount_percent: null,
      discount_end_date: null,
      description: "Contact us for large deployments",
    },
  ];
}
