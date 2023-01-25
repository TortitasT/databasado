import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { exists } from "https://deno.land/std/fs/mod.ts";

const APPDATA_PATH = Deno.env.get("APPDATA") + "\\.databasado" ||
  Deno.env.get("HOME") + "\\.databasado";

const DEFAULT_CONFIG = {
  database: {
    hostname: "localhost",
    database: "databasado",
    port: 5432,
    user: "postgres",
    password: "password",
  },
};

type Config = {
  database: {
    hostname: string;
    database: string;
    port: number;
    user: string;
    password: string;
  };
};

if (import.meta.main) {
  const config = await readConfig();

  console.info("Configuración en:", APPDATA_PATH + "\\config.json");
  console.log("...");

  const client = new Client(config.database);
  await client.connect();

  try {
    const filename = Deno.args[0];

    if (!filename) {
      console.error("No se especificó un archivo");
      Deno.exit(1);
    }

    console.info("Intentando leer: ", filename);

    const query = Deno.readTextFileSync(
      filename,
    );

    console.info("Ejecutando query: ", query);

    const result = await client.queryObject(query);

    console.info("Query ejecutado con éxito");
  } catch (e) {
    console.error("Algo ha salido mal...");
    Deno.exit(1);
  }

  await client.end();
}

async function readConfig(): Promise<Config> {
  await ensureAppdata();

  await ensureConfig();

  return JSON.parse(
    Deno.readTextFileSync(APPDATA_PATH + "\\config.json"),
  ) as Config;
}

async function ensureAppdata() {
  if (await exists(APPDATA_PATH)) {
    return;
  }

  Deno.mkdirSync(APPDATA_PATH);
}

async function ensureConfig() {
  if (await exists(APPDATA_PATH + "\\config.json")) {
    return;
  }

  Deno.writeTextFileSync(
    APPDATA_PATH + "\\config.json",
    JSON.stringify(DEFAULT_CONFIG),
  );
}
