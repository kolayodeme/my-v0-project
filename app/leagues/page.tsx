import { LeaguesSection } from "@/components/leagues-section"

export const metadata = {
  title: "Ligler | Football App",
  description: "Tüm futbol liglerini keşfedin, favori ligilerinizi seçin ve maçları takip edin.",
}

export default function LeaguesPage() {
  return (
    <div className="container mx-auto px-1 py-1 safe-area-top">
      <LeaguesSection />
    </div>
  )
}
