import { json, type ActionFunctionArgs } from "@remix-run/node";
import { getDb } from "~/lib/database.server";
import {
  checkGroupAxioms,
  computeDistanceMatrix,
  computeNonlinearDistance,
  deltaE,
  type LABColor
} from "~/lib/colorMath";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "check-axioms") {
    const colors = JSON.parse(formData.get("colors") as string) as LABColor[];
    const operation = formData.get("operation") as "add" | "multiply";

    const startTime = performance.now();
    const result = checkGroupAxioms(colors, operation);
    const executionTime = performance.now() - startTime;

    const db = getDb();
    db.prepare(
      "INSERT INTO group_axiom_results (closure, associativity, identity, inverse, details_json) VALUES (?, ?, ?, ?, ?)"
    ).run(
      result.closure.passed ? 1 : 0,
      result.associativity.passed ? 1 : 0,
      result.identity.passed ? 1 : 0,
      result.inverse.passed ? 1 : 0,
      JSON.stringify(result)
    );

    return json({ ...result, executionTime });
  }

  if (intent === "distance-matrix") {
    const colors = JSON.parse(formData.get("colors") as string) as LABColor[];
    const startTime = performance.now();
    const result = computeDistanceMatrix(colors);
    const executionTime = performance.now() - startTime;
    return json({ ...result, executionTime });
  }

  if (intent === "nonlinear-distance") {
    const c1 = JSON.parse(formData.get("color1") as string) as LABColor;
    const c2 = JSON.parse(formData.get("color2") as string) as LABColor;
    const gamma = parseFloat(formData.get("gamma") as string) || 2.2;

    const result = computeNonlinearDistance(c1, c2, gamma);
    return json(result);
  }

  if (intent === "delta-e") {
    const c1 = JSON.parse(formData.get("color1") as string) as LABColor;
    const c2 = JSON.parse(formData.get("color2") as string) as LABColor;
    const distance = deltaE(c1, c2);
    return json({ distance });
  }

  if (intent === "save-rule") {
    const db = getDb();
    const result = db.prepare(
      `INSERT INTO algebra_rules 
      (name, rule_type, source_l, source_a, source_b, target_l, target_a, target_b, operator_l, operator_a, operator_b, is_closed) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      formData.get("name") as string,
      formData.get("rule_type") as string,
      parseFloat(formData.get("source_l") as string),
      parseFloat(formData.get("source_a") as string),
      parseFloat(formData.get("source_b") as string),
      parseFloat(formData.get("target_l") as string),
      parseFloat(formData.get("target_a") as string),
      parseFloat(formData.get("target_b") as string),
      parseFloat(formData.get("operator_l") as string) || 0,
      parseFloat(formData.get("operator_a") as string) || 0,
      parseFloat(formData.get("operator_b") as string) || 0,
      formData.get("is_closed") === "true" ? 1 : 0
    );

    return json({ id: result.lastInsertRowid });
  }

  if (intent === "get-rules") {
    const db = getDb();
    const rules = db.prepare("SELECT * FROM algebra_rules ORDER BY created_at DESC").all();
    return json({ rules });
  }

  return json({ error: "Invalid intent" }, { status: 400 });
}
