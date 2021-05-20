export const currentLocalDate = function () {
  return new Date().toISOString().substring(0, 10);
};
export const currentLocalTime = function () {
  return new Date().toISOString().substring(11, 19);
};
