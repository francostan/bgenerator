import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"

import "./globals.css"
import { Oxanium, Source_Code_Pro, Source_Serif_4, Oxanium as V0_Font_Oxanium, Source_Code_Pro as V0_Font_Source_Code_Pro, Source_Serif_4 as V0_Font_Source_Serif_4 } from 'next/font/google'

// Initialize fonts
const _oxanium = V0_Font_Oxanium({ subsets: ['latin'], weight: ["200","300","400","500","600","700","800"] })
const _sourceCodePro = V0_Font_Source_Code_Pro({ subsets: ['latin'], weight: ["200","300","400","500","600","700","800","900"] })
const _sourceSerif_4 = V0_Font_Source_Serif_4({ subsets: ['latin'], weight: ["200","300","400","500","600","700","800","900"] })

const oxanium = Oxanium({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-oxanium",
})

const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-source-code-pro",
})

const sourceSerif4 = Source_Serif_4({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-source-serif-4",
})

export const metadata: Metadata = {
  title: "BGenarator",
  description: "Create beautiful textured backgrounds with customizable overlays and UI components",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${oxanium.variable} ${sourceCodePro.variable} ${sourceSerif4.variable}`}>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div>Loading...</div>
            </div>
          }
        >
          {children}
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
