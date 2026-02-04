import { Box } from 'lucide-react'
import { cn } from '../../../lib/utils'

interface LogoProps {
    className?: string
}

export function Logo({ className }: LogoProps) {
    return (
        <Box className={cn("text-primary-600", className)} />
    )
}
