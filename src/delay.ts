export const delay = (msec: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, msec);
  });
};
