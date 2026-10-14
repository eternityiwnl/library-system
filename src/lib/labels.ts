// Клиент болон серверийн аль алинд хэрэглэх монгол шошгууд
export const COPY_STATUS_LABELS = {
  active: "Хэвийн",
  damaged: "Гэмтсэн",
  lost: "Алдагдсан",
  withdrawn: "Хасагдсан",
} as const;

export type CopyStatus = keyof typeof COPY_STATUS_LABELS;
