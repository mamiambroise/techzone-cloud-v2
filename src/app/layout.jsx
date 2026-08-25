import "./globals.css";
export const metadata = {
  title: "Business Manager — P0.1 Application / Pack Manager",
  description: "Socle centralisé pour créer, configurer, versionner, valider, publier, restaurer et cloner des applications métier."
};
export default function RootLayout({
  children
}) {
  return <html lang="fr">
      <body className="bg-[#F8FAFC] text-slate-800 antialiased font-sans selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>;
}