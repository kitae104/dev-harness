import { site } from '@/config/site.ts'

const YEAR = new Date().getFullYear()

export default function SiteFooter() {
  return (
    <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
      © {YEAR} {site.name}
    </footer>
  )
}
