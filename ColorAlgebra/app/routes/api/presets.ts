import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { getDb } from "~/lib/database.server";
import { addColors, multiplyColors, type LABColor } from "~/lib/colorMath";

export async function loader(_: LoaderFunctionArgs) {
  const db = getDb();
  const presets = db.prepare("SELECT * FROM presets").all();
  return json({ presets });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const presetName = formData.get("preset") as string;

  const db = getDb();
  const preset = db.prepare("SELECT * FROM presets WHERE name = ?").get(presetName) as {
    id: number;
    name: string;
    description: string;
    config_json: string;
  } | undefined;

  if (!preset) {
    return json({ error: "Preset not found" }, { status: 404 });
  }

  const config = JSON.parse(preset.config_json);
  let result: Record<string, unknown> = { config, description: preset.description };

  switch (config.type) {
    case "non_associative": {
      const colors = config.colors as { l: number; a: number; b: number; label: string }[];
      const labColors = colors.map((c) => ({ l: c.l, a: c.a, b: c.b }));

      const leftAssoc = addColors(addColors(labColors[0], labColors[1]).result, labColors[2]).result;
      const rightAssoc = addColors(labColors[0], addColors(labColors[1], labColors[2]).result).result;
      const diff = {
        l: Math.abs(leftAssoc.l - rightAssoc.l),
        a: Math.abs(leftAssoc.a - rightAssoc.a),
        b: Math.abs(leftAssoc.b - rightAssoc.b)
      };

      result = {
        ...result,
        colors: labColors,
        leftAssoc,
        rightAssoc,
        difference: diff,
        floatError: diff.l + diff.a + diff.b,
        labels: colors.map((c) => c.label)
      };
      break;
    }

    case "zero_absorb": {
      const zero = config.zeroElement as LABColor;
      const colors = config.colors as { l: number; a: number; b: number; label: string }[];
      const labColors = colors.map((c) => ({ l: c.l, a: c.a, b: c.b }));

      const results = labColors.map((c) => ({
        input: c,
        zero,
        result: multiplyColors(c, zero).result,
        isAbsorbed: true
      }));

      result = { ...result, zeroElement: zero, colors: labColors, results, labels: colors.map((c) => c.label) };
      break;
    }

    case "inverse_cancel": {
      const identity = config.identity as LABColor;
      const pairs = config.pairs as { color: LABColor; inverse: LABColor }[];

      const results = pairs.map(({ color, inverse }) => {
        const sum = addColors(color, inverse).result;
        const distance = Math.sqrt(
          Math.pow(sum.l - identity.l, 2) +
          Math.pow(sum.a - identity.a, 2) +
          Math.pow(sum.b - identity.b, 2)
        );
        return { color, inverse, result: sum, identity, distance, cancelled: distance < 1 };
      });

      result = { ...result, identity, pairs: results };
      break;
    }

    case "singular_mapping": {
      const baseColors = config.baseColors as LABColor[];
      const gamma = config.gamma as number;

      const warpedColors = baseColors.map((c) => ({
        original: c,
        warped: {
          l: Math.pow(c.l / 100, gamma) * 100,
          a: Math.pow(Math.abs(c.a) / 128, gamma) * 128 * Math.sign(c.a),
          b: Math.pow(Math.abs(c.b) / 128, gamma) * 128 * Math.sign(c.b)
        }
      }));

      const originalDistances: number[][] = [];
      const warpedDistances: number[][] = [];

      for (let i = 0; i < baseColors.length; i++) {
        originalDistances[i] = [];
        warpedDistances[i] = [];
        for (let j = 0; j < baseColors.length; j++) {
          const od = Math.sqrt(
            Math.pow(baseColors[i].l - baseColors[j].l, 2) +
            Math.pow(baseColors[i].a - baseColors[j].a, 2) +
            Math.pow(baseColors[i].b - baseColors[j].b, 2)
          );
          const wd = Math.sqrt(
            Math.pow(warpedColors[i].warped.l - warpedColors[j].warped.l, 2) +
            Math.pow(warpedColors[i].warped.a - warpedColors[j].warped.a, 2) +
            Math.pow(warpedColors[i].warped.b - warpedColors[j].warped.b, 2)
          );
          originalDistances[i][j] = od;
          warpedDistances[i][j] = wd;
        }
      }

      result = { ...result, warpedColors, originalDistances, warpedDistances, gamma };
      break;
    }
  }

  return json(result);
}
