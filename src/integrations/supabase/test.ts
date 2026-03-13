import { supabase } from "@/integrations/supabase/client";

async function testConnection() {

  const { data, error } = await supabase
    .from("projects")
    .select("*");

  if (error) {
    console.log("Error de conexión:", error);
  } else {
    console.log("Conectado correctamente:", data);
  }

}

testConnection();