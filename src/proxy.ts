import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Todo excepto assets estáticos, íconos, el manifest de la PWA y /api/ingest
  // (se autentica con su propio token, no con la sesión).
  matcher: [
    "/((?!api/ingest|_next/static|_next/image|favicon.ico|icon|apple-icon|manifest.webmanifest|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
