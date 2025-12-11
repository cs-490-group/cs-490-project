import { useState, useEffect } from "react";
import { renderTemplate } from "./renderTemplate";

const styles = ["formal", "creative", "technical", "modern", "casual"];
const industries = [
  "Software_Development",
  "Cybersecurity",
  "Healthcare",
  "Education",
  "Marketing",
  "Non-specific"
];

export function useSampleLetters() {
  const [sampleLetters, setSampleLetters] = useState([]);

  useEffect(() => {
    const prepareSamples = async () => {
      const loadedSamples = [];
      for (let style of styles) {
        const group = { style, letters: [] };
        for (let industry of industries.slice(0, 3)) { // slice for first 3 industries
          const id = `${style}_${industry.replace(/\s/g, "_")}.html`;
          try {
            const content = await renderTemplate(`/templates/${id}`);
            group.letters.push({ id, title: `${style} - ${industry}`, content });
          } catch (err) {
            console.error("Failed to load template", id, err);
          }
        }
        loadedSamples.push(group);
      }
      setSampleLetters(loadedSamples);
    };
    prepareSamples();
  }, []);

  return { sampleLetters };
}
