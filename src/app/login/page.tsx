import { redirect } from "next/navigation";

// O login agora é a raiz do site; este endereço antigo só encaminha para lá (favoritos e links já distribuídos).
export default function Page() {
  redirect("/");
}
