"use client"

import type React from "react"

import { useRef, useEffect, useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const PRESETS = [
  {
    id: "minimal",
    name: "Whisper",
    config: {
      grain: 8,
      vignette: 0.15,
      base: "#FAFAFA",
      tint: "#F5F5F5",
      tintStrength: 0.1,
      grainSize: 1,
      blur: 0,
      brightness: 0,
      contrast: 0,
      saturation: 0,
    },
  },
  {
    id: "classic",
    name: "Paper",
    config: {
      grain: 15,
      vignette: 0.3,
      base: "#FAFAFA",
      tint: "#F0F0F0",
      tintStrength: 0.2,
      grainSize: 1,
      blur: 0,
      brightness: 0,
      contrast: 0,
      saturation: 0,
    },
  },
  {
    id: "textured",
    name: "Canvas",
    config: {
      grain: 25,
      vignette: 0.35,
      base: "#F8F8F8",
      tint: "#E8E8E8",
      tintStrength: 0.25,
      grainSize: 1,
      blur: 0.3,
      brightness: 5,
      contrast: 5,
      saturation: 0,
    },
  },
  {
    id: "warm",
    name: "Linen",
    config: {
      grain: 15,
      vignette: 0.25,
      base: "#F5F0EB",
      tint: "#E8DDD3",
      tintStrength: 0.2,
      grainSize: 1,
      blur: 0,
      brightness: 5,
      contrast: 0,
      saturation: 10,
    },
  },
  {
    id: "cool",
    name: "Frost",
    config: {
      grain: 15,
      vignette: 0.25,
      base: "#F8F9FB",
      tint: "#E8EAED",
      tintStrength: 0.2,
      grainSize: 1,
      blur: 0,
      brightness: 0,
      contrast: 0,
      saturation: -5,
    },
  },
]

interface OverlayImage {
  id: string
  image: HTMLImageElement
  opacity: number
  scale: number
  x: number
  y: number
}

interface UIComponent {
  id: string
  type: "button" | "card" | "input" | "navbar" | "badge" | "avatar"
  x: number
  y: number
  scale: number
  text?: string
  variant?: string
}

const COMPONENT_PRESETS = [
  { type: "button" as const, label: "Button", defaultText: "Click me" },
  { type: "card" as const, label: "Card", defaultText: "Card Title" },
  { type: "input" as const, label: "Input", defaultText: "Enter text..." },
  { type: "navbar" as const, label: "Navbar", defaultText: "Brand" },
  { type: "badge" as const, label: "Badge", defaultText: "New" },
  { type: "avatar" as const, label: "Avatar", defaultText: "JD" },
]

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedPreset, setSelectedPreset] = useState("classic")
  const [grainIntensity, setGrainIntensity] = useState(15)
  const [vignetteStrength, setVignetteStrength] = useState(0.3)
  const [baseColor, setBaseColor] = useState("#FAFAFA")
  const [tintColor, setTintColor] = useState("#F0F0F0")
  const [tintStrength, setTintStrength] = useState(0.2)
  const [grainSize, setGrainSize] = useState(1)
  const [canvasSize, setCanvasSize] = useState(2048)
  const [blur, setBlur] = useState(0)
  const [brightness, setBrightness] = useState(0)
  const [contrast, setContrast] = useState(0)
  const [saturation, setSaturation] = useState(0)
  const [noiseType, setNoiseType] = useState<"uniform" | "gaussian">("uniform")
  const [exportFormat, setExportFormat] = useState<"png" | "jpg" | "webp">("png")
  const [isGenerating, setIsGenerating] = useState(false)
  const [overlayImages, setOverlayImages] = useState<OverlayImage[]>([])
  const [expandedImageId, setExpandedImageId] = useState<string | null>(null)
  const [uiComponents, setUiComponents] = useState<UIComponent[]>([])
  const [expandedComponentId, setExpandedComponentId] = useState<string | null>(null)

  const parsedBaseColor = useMemo(() => {
    const hex = baseColor.replace("#", "")
    return {
      r: Number.parseInt(hex.substring(0, 2), 16),
      g: Number.parseInt(hex.substring(2, 4), 16),
      b: Number.parseInt(hex.substring(4, 6), 16),
    }
  }, [baseColor])

  const parsedTintColor = useMemo(() => {
    const hex = tintColor.replace("#", "")
    return {
      r: Number.parseInt(hex.substring(0, 2), 16),
      g: Number.parseInt(hex.substring(2, 4), 16),
      b: Number.parseInt(hex.substring(4, 6), 16),
    }
  }, [tintColor])

  const generateBackground = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    requestAnimationFrame(() => {
      setIsGenerating(true)
      const ctx = canvas.getContext("2d", { willReadFrequently: false })
      if (!ctx) {
        setIsGenerating(false)
        return
      }

      canvas.width = canvasSize
      canvas.height = canvasSize

      const width = canvas.width
      const height = canvas.height

      ctx.fillStyle = baseColor
      ctx.fillRect(0, 0, width, height)

      ctx.fillStyle = tintColor
      ctx.globalAlpha = tintStrength
      ctx.fillRect(0, 0, width, height)
      ctx.globalAlpha = 1

      const imageData = ctx.getImageData(0, 0, width, height)
      const data = imageData.data

      for (let i = 0; i < data.length; i += 4 * grainSize) {
        let noise: number
        if (noiseType === "gaussian") {
          const u1 = Math.random()
          const u2 = Math.random()
          noise = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * (grainIntensity / 3)
        } else {
          noise = (Math.random() - 0.5) * grainIntensity
        }

        for (let j = 0; j < grainSize && i + j * 4 < data.length; j++) {
          data[i + j * 4] += noise
          data[i + j * 4 + 1] += noise
          data[i + j * 4 + 2] += noise
        }
      }

      if (brightness !== 0 || contrast !== 0 || saturation !== 0) {
        const brightnessFactor = brightness * 2.55
        const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast))

        for (let i = 0; i < data.length; i += 4) {
          let r = data[i]
          let g = data[i + 1]
          let b = data[i + 2]

          if (brightness !== 0) {
            r += brightnessFactor
            g += brightnessFactor
            b += brightnessFactor
          }

          if (contrast !== 0) {
            r = contrastFactor * (r - 128) + 128
            g = contrastFactor * (g - 128) + 128
            b = contrastFactor * (b - 128) + 128
          }

          if (saturation !== 0) {
            const gray = 0.2989 * r + 0.587 * g + 0.114 * b
            const satFactor = 1 + saturation / 100
            r = gray + (r - gray) * satFactor
            g = gray + (g - gray) * satFactor
            b = gray + (b - gray) * satFactor
          }

          data[i] = Math.max(0, Math.min(255, r))
          data[i + 1] = Math.max(0, Math.min(255, g))
          data[i + 2] = Math.max(0, Math.min(255, b))
        }
      }

      ctx.putImageData(imageData, 0, 0)

      if (blur > 0) {
        ctx.filter = `blur(${blur}px)`
        ctx.drawImage(canvas, 0, 0)
        ctx.filter = "none"
      }

      if (vignetteStrength > 0) {
        const centerX = width / 2
        const centerY = height / 2
        const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY)

        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius)
        gradient.addColorStop(0, `rgba(0, 0, 0, 0)`)
        gradient.addColorStop(1, `rgba(0, 0, 0, ${vignetteStrength})`)

        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, width, height)
      }

      overlayImages.forEach((overlayImg) => {
        const scale = overlayImg.scale / 100
        const imgWidth = overlayImg.image.width * scale
        const imgHeight = overlayImg.image.height * scale
        const x = (width * overlayImg.x) / 100 - imgWidth / 2
        const y = (height * overlayImg.y) / 100 - imgHeight / 2

        ctx.globalAlpha = overlayImg.opacity / 100
        ctx.drawImage(overlayImg.image, x, y, imgWidth, imgHeight)
        ctx.globalAlpha = 1
      })

      setIsGenerating(false)
    })
  }, [
    grainIntensity,
    vignetteStrength,
    baseColor,
    tintColor,
    tintStrength,
    grainSize,
    canvasSize,
    blur,
    brightness,
    contrast,
    saturation,
    noiseType,
    overlayImages,
  ])

  const debouncedGenerate = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(() => {
      generateBackground()
    }, 50)
  }, [generateBackground])

  useEffect(() => {
    debouncedGenerate()
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [debouncedGenerate])

  const drawComponentsOnCanvas = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      uiComponents.forEach((comp) => {
        const scale = comp.scale / 100
        const x = (width * comp.x) / 100
        const y = (height * comp.y) / 100

        ctx.save()
        ctx.translate(x, y)
        ctx.scale(scale, scale)

        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.font = "16px system-ui, -apple-system, sans-serif"

        switch (comp.type) {
          case "button": {
            const padding = 24
            const buttonHeight = 40
            const textWidth = ctx.measureText(comp.text || "Button").width
            const buttonWidth = textWidth + padding * 2

            if (comp.variant === "outline") {
              ctx.strokeStyle = "#e4e4e7"
              ctx.lineWidth = 1
              ctx.strokeRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight)
              ctx.fillStyle = "#18181b"
            } else if (comp.variant === "ghost") {
              ctx.fillStyle = "#18181b"
            } else if (comp.variant === "destructive") {
              ctx.fillStyle = "#ef4444"
              ctx.fillRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight)
              ctx.fillStyle = "#ffffff"
            } else {
              ctx.fillStyle = "#18181b"
              ctx.fillRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight)
              ctx.fillStyle = "#ffffff"
            }

            ctx.fillText(comp.text || "Button", 0, 0)
            break
          }

          case "card": {
            const cardWidth = 300
            const cardHeight = 150

            ctx.fillStyle = "#ffffff"
            ctx.fillRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight)

            ctx.strokeStyle = "#e4e4e7"
            ctx.lineWidth = 1
            ctx.strokeRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight)

            ctx.font = "bold 20px system-ui, -apple-system, sans-serif"
            ctx.fillStyle = "#18181b"
            ctx.textAlign = "left"
            ctx.fillText(comp.text || "Card Title", -cardWidth / 2 + 20, -cardHeight / 2 + 30)

            ctx.font = "14px system-ui, -apple-system, sans-serif"
            ctx.fillStyle = "#71717a"
            ctx.fillText("Card description goes here", -cardWidth / 2 + 20, -cardHeight / 2 + 55)

            ctx.font = "13px system-ui, -apple-system, sans-serif"
            ctx.fillText("This is a sample card component.", -cardWidth / 2 + 20, -cardHeight / 2 + 90)
            break
          }

          case "input": {
            const inputWidth = 250
            const inputHeight = 40

            ctx.fillStyle = "#ffffff"
            ctx.fillRect(-inputWidth / 2, -inputHeight / 2, inputWidth, inputHeight)

            ctx.strokeStyle = "#e4e4e7"
            ctx.lineWidth = 1
            ctx.strokeRect(-inputWidth / 2, -inputHeight / 2, inputWidth, inputHeight)

            ctx.font = "14px system-ui, -apple-system, sans-serif"
            ctx.fillStyle = "#a1a1aa"
            ctx.textAlign = "left"
            ctx.fillText(comp.text || "Enter text...", -inputWidth / 2 + 12, 0)
            break
          }

          case "navbar": {
            const navWidth = 600
            const navHeight = 60

            ctx.fillStyle = "#ffffff"
            ctx.fillRect(-navWidth / 2, -navHeight / 2, navWidth, navHeight)

            ctx.strokeStyle = "#e4e4e7"
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(-navWidth / 2, navHeight / 2)
            ctx.lineTo(navWidth / 2, navHeight / 2)
            ctx.stroke()

            ctx.font = "bold 18px system-ui, -apple-system, sans-serif"
            ctx.fillStyle = "#18181b"
            ctx.textAlign = "left"
            ctx.fillText(comp.text || "Brand", -navWidth / 2 + 24, 0)

            ctx.font = "14px system-ui, -apple-system, sans-serif"
            const navItems = ["Home", "About", "Contact"]
            navItems.forEach((item, i) => {
              ctx.fillText(item, navWidth / 2 - 200 + i * 80, 0)
            })
            break
          }

          case "badge": {
            const padding = 16
            const badgeHeight = 24
            const textWidth = ctx.measureText(comp.text || "Badge").width
            const badgeWidth = textWidth + padding * 2

            if (comp.variant === "outline") {
              ctx.strokeStyle = "#e4e4e7"
              ctx.lineWidth = 1
              ctx.strokeRect(-badgeWidth / 2, -badgeHeight / 2, badgeWidth, badgeHeight)
              ctx.fillStyle = "#18181b"
            } else if (comp.variant === "secondary") {
              ctx.fillStyle = "#f4f4f5"
              ctx.fillRect(-badgeWidth / 2, -badgeHeight / 2, badgeWidth, badgeHeight)
              ctx.fillStyle = "#18181b"
            } else if (comp.variant === "destructive") {
              ctx.fillStyle = "#ef4444"
              ctx.fillRect(-badgeWidth / 2, -badgeHeight / 2, badgeWidth, badgeHeight)
              ctx.fillStyle = "#ffffff"
            } else {
              ctx.fillStyle = "#18181b"
              ctx.fillRect(-badgeWidth / 2, -badgeHeight / 2, badgeWidth, badgeHeight)
              ctx.fillStyle = "#ffffff"
            }

            ctx.font = "12px system-ui, -apple-system, sans-serif"
            ctx.textAlign = "center"
            ctx.fillText(comp.text || "Badge", 0, 0)
            break
          }

          case "avatar": {
            const avatarSize = 40

            ctx.fillStyle = "#f4f4f5"
            ctx.beginPath()
            ctx.arc(0, 0, avatarSize / 2, 0, Math.PI * 2)
            ctx.fill()

            ctx.font = "14px system-ui, -apple-system, sans-serif"
            ctx.fillStyle = "#18181b"
            ctx.textAlign = "center"
            ctx.fillText(comp.text || "JD", 0, 0)
            break
          }
        }

        ctx.restore()
      })
    },
    [uiComponents],
  )

  const downloadImage = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = canvasSize
    canvas.height = canvasSize

    const width = canvas.width
    const height = canvas.height

    ctx.fillStyle = baseColor
    ctx.fillRect(0, 0, width, height)

    ctx.fillStyle = tintColor
    ctx.globalAlpha = tintStrength
    ctx.fillRect(0, 0, width, height)
    ctx.globalAlpha = 1

    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4 * grainSize) {
      let noise: number
      if (noiseType === "gaussian") {
        const u1 = Math.random()
        const u2 = Math.random()
        noise = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * (grainIntensity / 3)
      } else {
        noise = (Math.random() - 0.5) * grainIntensity
      }

      for (let j = 0; j < grainSize && i + j * 4 < data.length; j++) {
        data[i + j * 4] += noise
        data[i + j * 4 + 1] += noise
        data[i + j * 4 + 2] += noise
      }
    }

    if (brightness !== 0 || contrast !== 0 || saturation !== 0) {
      const brightnessFactor = brightness * 2.55
      const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast))

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i]
        let g = data[i + 1]
        let b = data[i + 2]

        if (brightness !== 0) {
          r += brightnessFactor
          g += brightnessFactor
          b += brightnessFactor
        }

        if (contrast !== 0) {
          r = contrastFactor * (r - 128) + 128
          g = contrastFactor * (g - 128) + 128
          b = contrastFactor * (b - 128) + 128
        }

        if (saturation !== 0) {
          const gray = 0.2989 * r + 0.587 * g + 0.114 * b
          const satFactor = 1 + saturation / 100
          r = gray + (r - gray) * satFactor
          g = gray + (g - gray) * satFactor
          b = gray + (b - gray) * satFactor
        }

        data[i] = Math.max(0, Math.min(255, r))
        data[i + 1] = Math.max(0, Math.min(255, g))
        data[i + 2] = Math.max(0, Math.min(255, b))
      }
    }

    ctx.putImageData(imageData, 0, 0)

    if (blur > 0) {
      ctx.filter = `blur(${blur}px)`
      ctx.drawImage(canvas, 0, 0)
      ctx.filter = "none"
    }

    if (vignetteStrength > 0) {
      const centerX = width / 2
      const centerY = height / 2
      const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY)

      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius)
      gradient.addColorStop(0, `rgba(0, 0, 0, 0)`)
      gradient.addColorStop(1, `rgba(0, 0, 0, ${vignetteStrength})`)

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)
    }

    overlayImages.forEach((overlayImg) => {
      const scale = overlayImg.scale / 100
      const imgWidth = overlayImg.image.width * scale
      const imgHeight = overlayImg.image.height * scale
      const x = (width * overlayImg.x) / 100 - imgWidth / 2
      const y = (height * overlayImg.y) / 100 - imgHeight / 2

      ctx.globalAlpha = overlayImg.opacity / 100
      ctx.drawImage(overlayImg.image, x, y, imgWidth, imgHeight)
      ctx.globalAlpha = 1
    })

    drawComponentsOnCanvas(ctx, canvas.width, canvas.height)

    const mimeType = exportFormat === "jpg" ? "image/jpeg" : exportFormat === "webp" ? "image/webp" : "image/png"
    const extension = exportFormat

    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `bgenerator-${canvasSize}x${canvasSize}.${extension}`
        a.click()
        URL.revokeObjectURL(url)

        generateBackground()
      },
      mimeType,
      0.95,
    )
  }, [
    canvasSize,
    exportFormat,
    baseColor,
    tintColor,
    tintStrength,
    grainIntensity,
    grainSize,
    noiseType,
    brightness,
    contrast,
    saturation,
    blur,
    vignetteStrength,
    overlayImages,
    drawComponentsOnCanvas,
    generateBackground,
  ])

  const applyPreset = useCallback((presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId)
    if (!preset) return

    setSelectedPreset(presetId)
    setGrainIntensity(preset.config.grain)
    setVignetteStrength(preset.config.vignette)
    setBaseColor(preset.config.base)
    setTintColor(preset.config.tint)
    setTintStrength(preset.config.tintStrength)
    setGrainSize(preset.config.grainSize)
    setBlur(preset.config.blur)
    setBrightness(preset.config.brightness)
    setContrast(preset.config.contrast)
    setSaturation(preset.config.saturation)
  }, [])

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      if (overlayImages.length >= 10) {
        alert("Maximum 10 images allowed")
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          const newImage: OverlayImage = {
            id: `img-${Date.now()}`,
            image: img,
            opacity: 100,
            scale: 100,
            x: 50,
            y: 50,
          }
          setOverlayImages((prev) => [...prev, newImage])
          setExpandedImageId(newImage.id)
        }
        img.src = event.target?.result as string
      }
      reader.readAsDataURL(file)

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    },
    [overlayImages.length],
  )

  const removeImage = useCallback(
    (id: string) => {
      setOverlayImages((prev) => prev.filter((img) => img.id !== id))
      if (expandedImageId === id) {
        setExpandedImageId(null)
      }
    },
    [expandedImageId],
  )

  const updateImageProperty = useCallback(
    (id: string, property: keyof Omit<OverlayImage, "id" | "image">, value: number) => {
      setOverlayImages((prev) => prev.map((img) => (img.id === id ? { ...img, [property]: value } : img)))
    },
    [],
  )

  const addComponent = useCallback((type: UIComponent["type"]) => {
    const preset = COMPONENT_PRESETS.find((p) => p.type === type)
    const newComponent: UIComponent = {
      id: `comp-${Date.now()}`,
      type,
      x: 50,
      y: 50,
      scale: 100,
      text: preset?.defaultText || "",
      variant: "default",
    }
    setUiComponents((prev) => [...prev, newComponent])
    setExpandedComponentId(newComponent.id)
  }, [])

  const removeComponent = useCallback(
    (id: string) => {
      setUiComponents((prev) => prev.filter((comp) => comp.id !== id))
      if (expandedComponentId === id) {
        setExpandedComponentId(null)
      }
    },
    [expandedComponentId],
  )

  const updateComponentProperty = useCallback(
    (id: string, property: keyof Omit<UIComponent, "id" | "type">, value: number | string) => {
      setUiComponents((prev) => prev.map((comp) => (comp.id === id ? { ...comp, [property]: value } : comp)))
    },
    [],
  )

  const renderComponent = (component: UIComponent) => {
    const scale = component.scale / 100
    const style = {
      position: "absolute" as const,
      left: `${component.x}%`,
      top: `${component.y}%`,
      transform: `translate(-50%, -50%) scale(${scale})`,
      transformOrigin: "center",
    }

    switch (component.type) {
      case "button":
        return (
          <div key={component.id} style={style}>
            <Button variant={component.variant as any}>{component.text}</Button>
          </div>
        )
      case "card":
        return (
          <div key={component.id} style={style}>
            <Card className="w-[300px]">
              <CardHeader>
                <CardTitle>{component.text}</CardTitle>
                <CardDescription>Card description goes here</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">This is a sample card component.</p>
              </CardContent>
            </Card>
          </div>
        )
      case "input":
        return (
          <div key={component.id} style={style}>
            <Input placeholder={component.text} className="w-[250px]" />
          </div>
        )
      case "navbar":
        return (
          <div key={component.id} style={style}>
            <div className="flex items-center justify-between w-[600px] px-6 py-4 bg-background border-b">
              <span className="text-lg font-semibold">{component.text}</span>
              <div className="flex gap-4">
                <Button variant="ghost" size="sm">
                  Home
                </Button>
                <Button variant="ghost" size="sm">
                  About
                </Button>
                <Button variant="ghost" size="sm">
                  Contact
                </Button>
              </div>
            </div>
          </div>
        )
      case "badge":
        return (
          <div key={component.id} style={style}>
            <Badge variant={component.variant as any}>{component.text}</Badge>
          </div>
        )
      case "avatar":
        return (
          <div key={component.id} style={style}>
            <Avatar>
              <AvatarFallback>{component.text}</AvatarFallback>
            </Avatar>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar Controls */}
      <div className="w-[320px] border-r border-zinc-200 overflow-y-auto">
        <div className="p-6 border-b border-zinc-200 bg-gradient-to-br from-zinc-50 to-white sticky top-0 z-10">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 bg-clip-text text-transparent">
            BGenarator
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Textured backgrounds that just work</p>
        </div>

        <Accordion type="multiple" defaultValue={["presets", "texture", "export"]} className="px-6">
          {/* Quick Presets */}
          <AccordionItem value="presets" className="border-b border-zinc-100">
            <AccordionTrigger className="text-xs font-medium text-zinc-500 uppercase tracking-wider hover:no-underline py-4">
              Quick Presets
            </AccordionTrigger>
            <AccordionContent className="pb-6">
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((preset) => (
                  <Button
                    key={preset.id}
                    variant={selectedPreset === preset.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => applyPreset(preset.id)}
                    className="transition-all duration-200 hover:scale-105"
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Texture Controls */}
          <AccordionItem value="texture" className="border-b border-zinc-100">
            <AccordionTrigger className="text-xs font-medium text-zinc-500 uppercase tracking-wider hover:no-underline py-4">
              Texture
            </AccordionTrigger>
            <AccordionContent className="pb-6 space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-zinc-700">Grain Intensity</span>
                  <Badge variant="secondary" className="text-xs font-mono">
                    {grainIntensity}
                  </Badge>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={grainIntensity}
                  onChange={(e) => setGrainIntensity(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900 transition-all duration-200"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-zinc-700">Grain Size</span>
                  <Badge variant="secondary" className="text-xs font-mono">
                    {grainSize}
                  </Badge>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={grainSize}
                  onChange={(e) => setGrainSize(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900 transition-all duration-200"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-zinc-700">Noise Type</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={noiseType === "uniform" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNoiseType("uniform")}
                    className="flex-1 transition-all duration-200 hover:scale-105"
                  >
                    Uniform
                  </Button>
                  <Button
                    variant={noiseType === "gaussian" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNoiseType("gaussian")}
                    className="flex-1 transition-all duration-200 hover:scale-105"
                  >
                    Gaussian
                  </Button>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-zinc-700">Vignette Strength</span>
                  <Badge variant="secondary" className="text-xs font-mono">
                    {vignetteStrength.toFixed(2)}
                  </Badge>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={vignetteStrength}
                  onChange={(e) => setVignetteStrength(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900 transition-all duration-200"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-zinc-700">Blur</span>
                  <Badge variant="secondary" className="text-xs font-mono">
                    {blur.toFixed(1)}
                  </Badge>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={blur}
                  onChange={(e) => setBlur(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900 transition-all duration-200"
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Colors */}
          <AccordionItem value="colors" className="border-b border-zinc-100">
            <AccordionTrigger className="text-xs font-medium text-zinc-500 uppercase tracking-wider hover:no-underline py-4">
              Colors
            </AccordionTrigger>
            <AccordionContent className="pb-6 space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-zinc-700">Base Color</span>
                  <Badge variant="secondary" className="text-xs font-mono">
                    {baseColor}
                  </Badge>
                </div>
                <input
                  type="color"
                  value={baseColor}
                  onChange={(e) => setBaseColor(e.target.value)}
                  className="w-full h-12 rounded-lg border-2 border-zinc-200 cursor-pointer transition-all duration-200 hover:border-zinc-300"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-zinc-700">Tint Color</span>
                  <Badge variant="secondary" className="text-xs font-mono">
                    {tintColor}
                  </Badge>
                </div>
                <input
                  type="color"
                  value={tintColor}
                  onChange={(e) => setTintColor(e.target.value)}
                  className="w-full h-12 rounded-lg border-2 border-zinc-200 cursor-pointer transition-all duration-200 hover:border-zinc-300"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-zinc-700">Tint Strength</span>
                  <Badge variant="secondary" className="text-xs font-mono">
                    {tintStrength.toFixed(2)}
                  </Badge>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={tintStrength}
                  onChange={(e) => setTintStrength(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900 transition-all duration-200"
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Adjustments */}
          <AccordionItem value="adjustments" className="border-b border-zinc-100">
            <AccordionTrigger className="text-xs font-medium text-zinc-500 uppercase tracking-wider hover:no-underline py-4">
              Adjustments
            </AccordionTrigger>
            <AccordionContent className="pb-6 space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-zinc-700">Brightness</span>
                  <Badge variant="secondary" className="text-xs font-mono">
                    {brightness}
                  </Badge>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900 transition-all duration-200"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-zinc-700">Contrast</span>
                  <Badge variant="secondary" className="text-xs font-mono">
                    {contrast}
                  </Badge>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900 transition-all duration-200"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-zinc-700">Saturation</span>
                  <Badge variant="secondary" className="text-xs font-mono">
                    {saturation}
                  </Badge>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={saturation}
                  onChange={(e) => setSaturation(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900 transition-all duration-200"
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Image Overlays */}
          <AccordionItem value="images" className="border-b border-zinc-100">
            <AccordionTrigger className="text-xs font-medium text-zinc-500 uppercase tracking-wider hover:no-underline py-4">
              Image Overlays ({overlayImages.length}/10)
            </AccordionTrigger>
            <AccordionContent className="pb-6 space-y-4">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={overlayImages.length >= 10}
                className="w-full transition-all duration-200 hover:scale-105"
              >
                Upload Image
              </Button>

              {overlayImages.map((img) => (
                <div key={img.id} className="border border-zinc-200 rounded-lg overflow-hidden shadow-sm">
                  <button
                    onClick={() => setExpandedImageId(expandedImageId === img.id ? null : img.id)}
                    className="w-full p-3 flex items-center gap-3 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded border border-zinc-200 overflow-hidden flex-shrink-0">
                      <img src={img.image.src || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-sm text-zinc-700 flex-1 text-left">Image {img.id.slice(-4)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeImage(img.id)
                      }}
                      className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                    >
                      ×
                    </Button>
                  </button>

                  {expandedImageId === img.id && (
                    <div className="p-3 pt-0 space-y-3 border-t border-zinc-100 bg-zinc-50/50">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-zinc-600">Opacity</span>
                          <span className="text-xs font-mono text-zinc-500">{img.opacity}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={img.opacity}
                          onChange={(e) => updateImageProperty(img.id, "opacity", Number(e.target.value))}
                          className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-zinc-600">Scale</span>
                          <span className="text-xs font-mono text-zinc-500">{img.scale}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="200"
                          value={img.scale}
                          onChange={(e) => updateImageProperty(img.id, "scale", Number(e.target.value))}
                          className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-zinc-600">Position X</span>
                          <span className="text-xs font-mono text-zinc-500">{img.x}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={img.x}
                          onChange={(e) => updateImageProperty(img.id, "x", Number(e.target.value))}
                          className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-zinc-600">Position Y</span>
                          <span className="text-xs font-mono text-zinc-500">{img.y}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={img.y}
                          onChange={(e) => updateImageProperty(img.id, "y", Number(e.target.value))}
                          className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>

          {/* UI Components */}
          <AccordionItem value="components" className="border-b border-zinc-100">
            <AccordionTrigger className="text-xs font-medium text-zinc-500 uppercase tracking-wider hover:no-underline py-4">
              UI Components
            </AccordionTrigger>
            <AccordionContent className="pb-6 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {COMPONENT_PRESETS.map((preset) => (
                  <Button
                    key={preset.type}
                    variant="outline"
                    size="sm"
                    onClick={() => addComponent(preset.type)}
                    className="transition-all duration-200 hover:scale-105"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              {uiComponents.map((comp) => (
                <div key={comp.id} className="border border-zinc-200 rounded-lg overflow-hidden shadow-sm">
                  <button
                    onClick={() => setExpandedComponentId(expandedComponentId === comp.id ? null : comp.id)}
                    className="w-full p-3 flex items-center gap-3 hover:bg-zinc-50 transition-colors"
                  >
                    <span className="text-sm text-zinc-700 flex-1 text-left capitalize">
                      {comp.type} - {comp.text}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeComponent(comp.id)
                      }}
                      className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                    >
                      ×
                    </Button>
                  </button>

                  {expandedComponentId === comp.id && (
                    <div className="p-3 pt-0 space-y-3 border-t border-zinc-100 bg-zinc-50/50">
                      <div>
                        <label className="text-xs text-zinc-600 mb-2 block">Text</label>
                        <Input
                          value={comp.text}
                          onChange={(e) => updateComponentProperty(comp.id, "text", e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>

                      {(comp.type === "button" || comp.type === "badge") && (
                        <div>
                          <label className="text-xs text-zinc-600 mb-2 block">Style</label>
                          <div className="grid grid-cols-2 gap-2">
                            {comp.type === "button" &&
                              ["default", "outline", "ghost", "destructive"].map((variant) => (
                                <Button
                                  key={variant}
                                  variant={comp.variant === variant ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => updateComponentProperty(comp.id, "variant", variant)}
                                  className="text-xs capitalize"
                                >
                                  {variant}
                                </Button>
                              ))}
                            {comp.type === "badge" &&
                              ["default", "secondary", "outline", "destructive"].map((variant) => (
                                <Button
                                  key={variant}
                                  variant={comp.variant === variant ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => updateComponentProperty(comp.id, "variant", variant)}
                                  className="text-xs capitalize"
                                >
                                  {variant}
                                </Button>
                              ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-zinc-600">Scale</span>
                          <span className="text-xs font-mono text-zinc-500">{comp.scale}%</span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="150"
                          value={comp.scale}
                          onChange={(e) => updateComponentProperty(comp.id, "scale", Number(e.target.value))}
                          className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-zinc-600">Position X</span>
                          <span className="text-xs font-mono text-zinc-500">{comp.x}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={comp.x}
                          onChange={(e) => updateComponentProperty(comp.id, "x", Number(e.target.value))}
                          className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-zinc-600">Position Y</span>
                          <span className="text-xs font-mono text-zinc-500">{comp.y}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={comp.y}
                          onChange={(e) => updateComponentProperty(comp.id, "y", Number(e.target.value))}
                          className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>

          {/* Export */}
          <AccordionItem value="export" className="border-b-0">
            <AccordionTrigger className="text-xs font-medium text-zinc-500 uppercase tracking-wider hover:no-underline py-4">
              Export
            </AccordionTrigger>
            <AccordionContent className="pb-6 space-y-4">
              <div>
                <label className="text-sm text-zinc-700 mb-2 block">Canvas Size</label>
                <div className="grid grid-cols-3 gap-2">
                  {[1024, 2048, 4096].map((size) => (
                    <Button
                      key={size}
                      variant={canvasSize === size ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCanvasSize(size)}
                      className="transition-all duration-200 hover:scale-105"
                    >
                      {size}px
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-zinc-700 mb-2 block">Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["png", "jpg", "webp"] as const).map((format) => (
                    <Button
                      key={format}
                      variant={exportFormat === format ? "default" : "outline"}
                      size="sm"
                      onClick={() => setExportFormat(format)}
                      className="transition-all duration-200 uppercase hover:scale-105"
                    >
                      {format}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                onClick={downloadImage}
                className="w-full transition-all duration-200 hover:scale-105 shadow-md"
                size="lg"
              >
                Download
              </Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center p-6 bg-zinc-50">
        <div className="w-full max-w-6xl h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-zinc-700">Live Preview</h2>
            <span className="text-xs text-zinc-500 font-mono">
              {canvasSize}×{canvasSize}px
            </span>
          </div>

          <div
            ref={previewRef}
            className="relative bg-white rounded-lg shadow-lg overflow-hidden flex-1"
            style={{ aspectRatio: "1/1", maxHeight: "calc(100vh - 120px)" }}
          >
            <canvas ref={canvasRef} className="w-full h-full" />
            {uiComponents.map((comp) => renderComponent(comp))}
            {isGenerating && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                <div className="text-sm text-zinc-500">Generating...</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
