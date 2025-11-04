// src/lib/images.js
export function prioritizeImages(images = [], preferredColor = "") {
    const color = (preferredColor || "").toLowerCase();
  
    const score = (url = "") => {
      const u = url.toLowerCase();
  
      let s = 0;
      if (u.endsWith(".png")) s += 100;          // make PNGs king
      if (color && u.includes(color)) s += 10;   // keep matching color near top
      if (/-1(?:\.|$)/.test(u) || u.includes("hero")) s += 1; // common "first" hints
      return s;
    };
  
    // stable sort: higher score first, original order if tie
    return [...images].sort((a, b) => score(b) - score(a));
  }
  