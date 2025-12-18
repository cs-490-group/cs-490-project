export const safeId = (item, fallback) =>
  item?.id ?? item?._id ?? fallback ?? "";
