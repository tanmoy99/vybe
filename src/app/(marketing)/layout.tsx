import { SiteFooter, SiteHeader } from "@/components/vybe/site-chrome";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
