import { PropsWithChildren } from 'react'
import { UICard } from './ui/card'

export default function Card({ children }: PropsWithChildren) {
  return <UICard>{children}</UICard>
}
