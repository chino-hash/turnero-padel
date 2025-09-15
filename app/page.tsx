import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const session = await auth()
  
  console.log(`🏠 HomePage: Session exists: ${!!session}`)
  
  if (session) {
    console.log(`🔄 HomePage: Redirigiendo usuario logueado a /dashboard`)
    redirect("/dashboard")
  } else {
    console.log(`🔄 HomePage: Redirigiendo usuario no logueado a /login`)
    // Evitar bucle: no pasar callbackUrl si ya estamos en la página principal
    redirect("/login")
  }
}
