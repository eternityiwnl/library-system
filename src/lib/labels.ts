// Клиент болон серверийн аль алинд хэрэглэх монгол шошгууд
export const COPY_STATUS_LABELS = {
  active: "Хэвийн",
  damaged: "Гэмтсэн",
  lost: "Алдагдсан",
  withdrawn: "Хасагдсан",
} as const;

export type CopyStatus = keyof typeof COPY_STATUS_LABELS;

// Үйлдлийн бүртгэлийн төрлүүд (шүүлтүүрт бүлгээр харуулна)
export const AUDIT_ACTIONS = {
  "loan.issue": "Ном олгосон",
  "loan.return": "Ном буцаасан",
  "loan.renew": "Сунгасан",
  "fine.paid": "Торгууль төлсөн",
  "fine.waived": "Торгуулиас чөлөөлсөн",
  "book.create": "Ном нэмсэн",
  "book.update": "Ном зассан",
  "book.delete": "Ном устгасан",
  "copy.add": "Хувь нэмсэн",
  "copy.update": "Хувь зассан",
  "copy.delete": "Хувь устгасан",
  "category.create": "Ангилал нэмсэн",
  "category.update": "Ангилал зассан",
  "category.delete": "Ангилал устгасан",
  "user.create": "Хэрэглэгч бүртгэсэн",
  "user.update": "Хэрэглэгч зассан",
  "user.password": "Нууц үг шинэчилсэн",
  "user.activate": "Идэвхжүүлсэн",
  "user.deactivate": "Идэвхгүй болгосон",
  "settings.update": "Тохиргоо өөрчилсөн",
  "reminders.send": "Сануулга илгээсэн",
} as const;

export type AuditAction = keyof typeof AUDIT_ACTIONS;
