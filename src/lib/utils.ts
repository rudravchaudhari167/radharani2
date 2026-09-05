export function cn(...inputs: (string | undefined | null | false | Record<string, boolean>)[]) {
  return inputs
    .flatMap((input) => {
      if (typeof input === "string") return input;
      if (input && typeof input === "object") {
        return Object.entries(input)
          .filter(([, v]) => v)
          .map(([k]) => k);
      }
      return [];
    })
    .join(" ");
}