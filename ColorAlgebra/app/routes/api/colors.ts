import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { getDb } from "~/lib/database.server";
import { addColors, multiplyColors, labToHex, hexToLab } from "~/lib/colorMath";

export async function loader(_: LoaderFunctionArgs) {
  const db = getDb();
  const colors = db.prepare("SELECT * FROM color_samples ORDER BY created_at DESC LIMIT 100").all();
  return json({ colors });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "add") {
    const l = parseFloat(formData.get("l") as string);
    const a = parseFloat(formData.get("a") as string);
    const b = parseFloat(formData.get("b") as string);
    const label = formData.get("label") as string | null;

    const db = getDb();
    const result = db.prepare(
      "INSERT INTO color_samples (l, a, b, label) VALUES (?, ?, ?, ?)"
    ).run(l, a, b, label);

    return json({ id: result.lastInsertRowid, l, a, b, label });
  }

  if (intent === "delete") {
    const id = parseInt(formData.get("id") as string);
    const db = getDb();
    db.prepare("DELETE FROM color_samples WHERE id = ?").run(id);
    return json({ success: true });
  }

  if (intent === "operate") {
    const op = formData.get("operation") as "add" | "multiply";
    const c1 = JSON.parse(formData.get("color1") as string);
    const c2 = JSON.parse(formData.get("color2") as string);

    const startTime = performance.now();
    const result = op === "add" ? addColors(c1, c2) : multiplyColors(c1, c2);
    const executionTime = performance.now() - startTime;

    const db = getDb();
    db.prepare(
      "INSERT INTO operation_logs (operation_type, input_json, output_json, is_valid, execution_time) VALUES (?, ?, ?, ?, ?)"
    ).run(
      op,
      JSON.stringify({ c1, c2 }),
      JSON.stringify(result),
      result.overflow ? 0 : 1,
      executionTime
    );

    return json({
      ...result,
      hex: labToHex(result.result),
      executionTime
    });
  }

  if (intent === "convert") {
    const hex = formData.get("hex") as string;
    const lab = hexToLab(hex);
    return json({ lab });
  }

  return json({ error: "Invalid intent" }, { status: 400 });
}
