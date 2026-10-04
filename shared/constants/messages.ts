// The four validation messages from the FRD. Use these, never retype them.
// (CONSUMPTION_MISSING said "Name + Size" until Name was replaced by Design + Component.)
export const MESSAGES = {
  CONSUMPTION_MISSING: "Consumption master not available for this Design + Component + Size.",
  INVALID_QUANTITY: "Please enter a valid Order Quantity.",
  CONVERSION_RULE_MISSING: "Material conversion rule is not configured.",
  CORD_DENIER_MISSING: "Please configure Cord Denier before calculating Cord KG.",
} as const;
