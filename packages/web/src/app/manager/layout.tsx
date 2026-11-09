"use client"

import Loader from "@rahoot/web/components/Loader"
import { useSocket } from "@rahoot/web/contexts/socketProvider"
import { PropsWithChildren, useEffect } from "react"

const Backdrop = () => (
  <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
    <div className="bg-primary/10 absolute -top-[20vmin] -left-[20vmin] h-[70vmin] w-[70vmin] rounded-full blur-3xl" />
    <div className="bg-primary/10 absolute -right-[15vmin] -bottom-[25vmin] h-[60vmin] w-[60vmin] rotate-45 blur-3xl" />
  </div>
)

const ManagerLayout = ({ children }: PropsWithChildren) => {
  const { isConnected, connect } = useSocket()

  useEffect(() => {
    if (!isConnected) {
      connect()
    }
  }, [connect, isConnected])

  return (
    <section className="relative isolate min-h-dvh">
      <Backdrop />
      {isConnected ? (
        children
      ) : (
        <div className="flex min-h-dvh flex-col items-center justify-center">
          <Loader className="h-23" />
          <h2 className="mt-2 text-2xl font-bold text-white">Connecting…</h2>
        </div>
      )}
    </section>
  )
}

export default ManagerLayout
