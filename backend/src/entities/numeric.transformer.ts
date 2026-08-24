/**
 * Postgres ka `numeric` type JS mein *string* ban kar aata hai (precision bachane
 * ke liye). Ye transformer usay wapas number bana deta hai taake `price * qty`
 * ka matlab "string concat" na ho jaye — ye ek classic bug hai.
 */
export const numericTransformer = {
  to: (value: number | null): number | null => value,
  from: (value: string | null): number | null =>
    value === null || value === undefined ? null : parseFloat(value),
};
