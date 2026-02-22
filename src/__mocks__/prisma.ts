export const prisma = new Proxy(
  {},
  {
    get: () => () => {
      throw new Error("prisma should not be called in unit tests");
    },
  }
);
