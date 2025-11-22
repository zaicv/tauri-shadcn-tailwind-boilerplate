import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-black group-[.toaster]:text-white group-[.toaster]:backdrop-blur-xl group-[.toaster]:shadow-2xl group-[.toaster]:rounded-xl group-[.toaster]:border group-[.toaster]:border-white/20 group-[.toaster]:transition-all group-[.toaster]:duration-300",
          description: "group-[.toast]:text-white/80 group-[.toast]:opacity-90",
          actionButton:
            "group-[.toast]:bg-white group-[.toast]:text-black group-[.toast]:rounded-lg group-[.toast]:transition-all group-[.toast]:hover:scale-105",
          cancelButton:
            "group-[.toast]:bg-white/20 group-[.toast]:text-white group-[.toast]:rounded-lg group-[.toast]:backdrop-blur-sm",
          success:
            "group-[.toaster]:bg-black group-[.toaster]:text-white",
          error:
            "group-[.toaster]:bg-black group-[.toaster]:text-white",
          info:
            "group-[.toaster]:bg-black group-[.toaster]:text-white",
          warning:
            "group-[.toaster]:bg-black group-[.toaster]:text-white",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
