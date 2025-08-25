// tiny helpers used by hero/graph
export const qs  = (s, p=document) => p.querySelector(s);
export const qsa = (s, p=document) => [...p.querySelectorAll(s)];
export const prefersReducedMotion = () =>
  matchMedia('(prefers-reduced-motion: reduce)').matches;
