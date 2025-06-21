"use client"

import { BadgeCheck, ArrowRight } from "lucide-react"
import NumberFlow from "@number-flow/react"
import { useNavigate } from "react-router-dom"

import { cn } from "../lib/utils"
import { Badge } from "./Badge"
import { Button } from "./Button"
import { Card } from "./Card"

export interface PricingTier {
  name: string
  price: Record<string, number | string>
  description: string
  features: string[]
  cta: string
  highlighted?: boolean
  popular?: boolean
}

interface PricingCardProps {
  tier: PricingTier
  paymentFrequency: string
}

export function PricingCard({ tier, paymentFrequency }: PricingCardProps) {
  const navigate = useNavigate()
  const price = tier.price[paymentFrequency]
  const isHighlighted = tier.highlighted
  const isPopular = tier.popular

  const handleClick = () => {
    navigate('/comingsoon')
  }

  return (
    <Card
      className={cn(
        "relative flex flex-col gap-8 overflow-hidden p-6",
        isHighlighted
          ? "bg-green-800 text-white"
          : "bg-white text-gray-900",
        isPopular && "ring-2 ring-green-500 shadow-lg shadow-green-500/20"
      )}
    >
      {isHighlighted && <HighlightedBackground />}
      {isPopular && <PopularBackground />}

      <h2 className="flex items-center gap-3 text-xl font-medium capitalize">
        {tier.name}
        {isPopular && (
          <Badge variant="secondary" className="z-10 bg-green-100 text-green-800 border-green-200">
            🔥🔥🔥
          </Badge>
        )}
      </h2>

      <div className="relative h-12">
        {typeof price === "number" ? (
          <>
            <NumberFlow
              format={{
                style: "currency",
                currency: "USD",
              }}
              value={price}
              className="text-4xl font-medium"
            />
            <p className={cn(
              "-mt-2 text-xs",
              isHighlighted ? "text-green-200" : "text-gray-500"
            )}>
              Per month/user
            </p>
          </>
        ) : (
          <h1 className="text-4xl font-medium">{price}</h1>
        )}
      </div>

      <div className="flex-1 space-y-2">
        <h3 className="text-sm font-medium">{tier.description}</h3>
        <ul className="space-y-2">
          {tier.features.map((feature, index) => (
            <li
              key={index}
              className={cn(
                "flex items-center gap-2 text-sm font-medium",
                isHighlighted ? "text-green-100" : "text-gray-600"
              )}
            >
              <BadgeCheck className={cn(
                "h-4 w-4",
                isHighlighted ? "text-green-300" : "text-green-500"
              )} />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <Button
        variant={isHighlighted ? "secondary" : "default"}
        className={cn(
          "w-full",
          isHighlighted 
            ? "bg-white text-green-800 hover:bg-gray-100" 
            : "bg-green-700 text-white hover:bg-green-800"
        )}
        onClick={handleClick}
      >
        {tier.cta}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </Card>
  )
}

const HighlightedBackground = () => (
  <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff1a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff1a_1px,transparent_1px)] bg-[size:45px_45px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
)

const PopularBackground = () => (
  <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(34,197,94,0.1),rgba(255,255,255,0))]" />
) 