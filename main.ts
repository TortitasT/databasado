import {
  Client,
  PostgresError,
} from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { exists } from "https://deno.land/std/fs/mod.ts";

const APPDATA_PATH = Deno.env.get("APPDATA") + "\\.databasado" ||
  Deno.env.get("HOME") + "\\.databasado";

const CONFIG_PATH = APPDATA_PATH + "\\config.json";

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

  console.info("Configuración en:");
  console.info("%c" + CONFIG_PATH, "color: blue");

  const client = new Client(config.database);
  await client.connect();

  try {
    const filename = Deno.args[0];

    if (!filename) {
      console.error("No se especificó un archivo");

      client.end();
      Deno.exit(1);
    }

    console.info("Intentando leer: ");
    console.info("%c" + filename, "color: blue");

    const query = Deno.readTextFileSync(
      filename,
    );

    if (query.length < 200) {
      console.info("Ejecutando query: ");
      console.info("%c" + query, "color: blue");
    }

    const result = await client.queryObject(query);

    if (result.rows.length > 0) {
      console.table(result.rows);
    }

    console.info("%cQuery ejecutada con éxito", "color:green");
  } catch (e) {
    console.error("Algo ha salido mal...");

    if (e instanceof PostgresError) {
      console.error("%c" + e, "color:red");
    }
  }

  await client.end();
}

async function readConfig(): Promise<Config> {
  await ensureAppdata();

  await ensureConfig();

  return JSON.parse(
    Deno.readTextFileSync(CONFIG_PATH),
  ) as Config;
}

async function ensureAppdata() {
  if (await exists(APPDATA_PATH)) {
    return;
  }

  Deno.mkdirSync(APPDATA_PATH);
}

async function ensureConfig() {
  if (await exists(CONFIG_PATH)) {
    return;
  }

  Deno.writeTextFileSync(
    CONFIG_PATH,
    JSON.stringify(DEFAULT_CONFIG),
  );
}
