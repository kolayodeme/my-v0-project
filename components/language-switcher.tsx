"use client"

import { Button } from "@/components/ui/button"
import { useTranslation } from "./language-provider"
import { Languages } from "lucide-react"

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useTranslation()

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "tr" : "en")
  }

  return (
    <Button variant="outline" size="icon" onClick={toggleLanguage} aria-label={t("language")} title={t("language")}>
      <Languages className="w-4 h-4" />
      <span className="ml-2 text-xs font-bold">{language.toUpperCase()}</span>
    </Button>
  )
}
