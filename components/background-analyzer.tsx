"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Loader2, Download } from "lucide-react"
import html2canvas from "html2canvas"

interface ColorInfo {
  hex: string
  rgb: string
  percentage: number
}

export function BackgroundAnalyzer() {
  const [image, setImage] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [colors, setColors] = useState<ColorInfo[]>([])
  const [dominantColor, setDominantColor] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImage(event.target?.result as string)
        setColors([])
        setDominantColor(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const rgbToHex = (r: number, g: number, b: number): string => {
    return (
      "#" +
      [r, g, b]
        .map((x) => {
          const hex = x.toString(16)
          return hex.length === 1 ? "0" + hex : hex
        })
        .join("")
    )
  }

  const analyzeBackground = async () => {
    if (!image || !canvasRef.current) return

    setAnalyzing(true)

    try {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = image

      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })

      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d", { willReadFrequently: true })
      if (!ctx) return

      // Set canvas size to match image
      canvas.width = img.width
      canvas.height = img.height

      // Draw image
      ctx.drawImage(img, 0, 0)

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      // Sample pixels (every 10th pixel for performance)
      const colorMap = new Map<string, number>()
      const step = 10

      for (let i = 0; i < data.length; i += 4 * step) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const a = data[i + 3]

        // Skip transparent pixels
        if (a < 128) continue

        // Round colors to reduce variations
        const roundedR = Math.round(r / 10) * 10
        const roundedG = Math.round(g / 10) * 10
        const roundedB = Math.round(b / 10) * 10

        const key = `${roundedR},${roundedG},${roundedB}`
        colorMap.set(key, (colorMap.get(key) || 0) + 1)
      }

      // Sort colors by frequency
      const sortedColors = Array.from(colorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)

      const totalPixels = sortedColors.reduce((sum, [, count]) => sum + count, 0)

      // Convert to color info
      const colorInfo: ColorInfo[] = sortedColors.map(([rgb, count]) => {
        const [r, g, b] = rgb.split(",").map(Number)
        return {
          hex: rgbToHex(r, g, b),
          rgb: `rgb(${r}, ${g}, ${b})`,
          percentage: Math.round((count / totalPixels) * 100),
        }
      })

      setColors(colorInfo)
      setDominantColor(colorInfo[0]?.hex || null)
    } catch (error) {
      console.error("[v0] Error analyzing image:", error)
    } finally {
      setAnalyzing(false)
    }
  }

  const downloadPalette = async () => {
    if (!previewRef.current) return

    try {
      const canvas = await html2canvas(previewRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
      })

      const link = document.createElement("a")
      link.download = "color-palette.png"
      link.href = canvas.toDataURL()
      link.click()
    } catch (error) {
      console.error("[v0] Error downloading palette:", error)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-balance">Background Image Analyzer</h1>
        <p className="text-muted-foreground text-lg">
          Upload an image to extract and analyze its dominant background colors
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Image</CardTitle>
            <CardDescription>Select an image to analyze its color palette</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />

            <Button onClick={() => fileInputRef.current?.click()} className="w-full" variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Choose Image
            </Button>

            {image && (
              <div className="space-y-4">
                <div className="relative aspect-video rounded-lg overflow-hidden border">
                  <img
                    src={image || "/placeholder.svg"}
                    alt="Uploaded preview"
                    className="w-full h-full object-contain"
                  />
                </div>

                <Button onClick={analyzeBackground} disabled={analyzing} className="w-full">
                  {analyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Analyze Colors"
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle>Color Analysis</CardTitle>
            <CardDescription>Extracted color palette from your image</CardDescription>
          </CardHeader>
          <CardContent>
            {colors.length > 0 ? (
              <div ref={previewRef} className="space-y-6 p-4">
                {/* Dominant Color */}
                {dominantColor && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Dominant Color</h3>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-16 h-16 rounded-lg border-2 border-border shadow-sm"
                        style={{ backgroundColor: dominantColor }}
                      />
                      <div className="space-y-1">
                        <p className="font-mono text-sm font-medium">{dominantColor}</p>
                        <p className="text-xs text-muted-foreground">{colors[0].percentage}% of image</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Color Palette */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Color Palette</h3>
                    <Button onClick={downloadPalette} size="sm" variant="outline">
                      <Download className="mr-2 h-3 w-3" />
                      Download
                    </Button>
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    {colors.map((color, index) => (
                      <div
                        key={index}
                        className="aspect-square rounded-md border-2 border-border shadow-sm"
                        style={{ backgroundColor: color.hex }}
                        title={`${color.hex} (${color.percentage}%)`}
                      />
                    ))}
                  </div>

                  <div className="space-y-2">
                    {colors.map((color, index) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border" style={{ backgroundColor: color.hex }} />
                          <span className="font-mono">{color.hex}</span>
                        </div>
                        <span className="text-muted-foreground">{color.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>Upload and analyze an image to see the color palette</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
